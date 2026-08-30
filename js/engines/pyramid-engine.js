let customPyramid = [];
let pyramidPool = [];
let pyramidProgress = {};
let pyramidRevealed = {};
let pyramidWinnerId = null;
let pyramidState = 'idle';

const pyramidTierSizes = [4, 3, 2, 1];
const pyramidTotalSlots = pyramidTierSizes.reduce((sum, n) => sum + n, 0);

const pyramidTierNames = {
	1: 'Tier 1 · Base',
	2: 'Tier 2 · Rise',
	3: 'Tier 3 · Push',
	4: 'Tier 4 · Peak',
};

const pyramidImageFields = createQAImageState({
	qWrap: 'newPyrQImgWrap',
	qFile: 'newPyrQImgFile',
	aWrap: 'newPyrAImgWrap',
	aFile: 'newPyrAImgFile',
});

function initPyramid() {
	customPyramid = customPyramid.map((problem) =>
		problem && !problem.tier ? { ...problem, tier: 1 } : problem,
	);
	newPyramidRound();
}

function newPyramidRound() {
	pyramidState = 'idle';
	pyramidPool = buildPyramidPool();
	pyramidProgress = {};
	pyramidRevealed = {};
	pyramidWinnerId = null;
	renderPyramidScreen();
}

function ensurePyramidTeams() {
	teams.forEach((team) => {
		if (pyramidProgress[team.id] === undefined) pyramidProgress[team.id] = 0;
		if (pyramidRevealed[team.id] === undefined) pyramidRevealed[team.id] = false;
	});
}

function pyramidTierSize(tier) {
	return pyramidTierSizes[tier - 1] || 0;
}

function pyramidTierOffset(tier) {
	let offset = 0;
	for (let t = 1; t < tier; t++) offset += pyramidTierSize(t);
	return offset;
}

function pyramidTierCounts() {
	const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
	customPyramid.forEach((problem) => {
		if (counts[problem.tier] !== undefined) counts[problem.tier]++;
	});
	return counts;
}

function shufflePyramidPool(array) {
	const copy = array.slice();
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function buildPyramidPool() {
	const byTier = { 1: [], 2: [], 3: [], 4: [] };
	customPyramid.forEach((problem) => {
		if (byTier[problem.tier]) byTier[problem.tier].push(problem);
	});

	const pool = [];
	for (let tier = 1; tier <= 4; tier++) {
		const need = pyramidTierSize(tier);
		const available = byTier[tier];
		if (available.length < need) return null;
		shufflePyramidPool(available)
			.slice(0, need)
			.forEach((problem) => pool.push({ ...problem, tier }));
	}
	return pool;
}

function startPyramidRound() {
	const pool = buildPyramidPool();
	if (!pool) {
		alert(
			'Every tier needs enough questions first (4 in Tier 1, 3 in Tier 2, 2 in Tier 3, 1 in Tier 4) via "Manage Questions".',
		);
		return;
	}
	pyramidPool = pool;
	ensurePyramidTeams();
	pyramidState = 'running';
	renderPyramidScreen();
}

function endPyramidRound() {
	pyramidState = 'finished';
	renderPyramidScreen();
}

function togglePyramidReveal(teamId) {
	pyramidRevealed[teamId] = !pyramidRevealed[teamId];
	renderPyramidBoard();
}

function advancePyramidTeam(teamId) {
	if (pyramidState !== 'running') return;
	const progress = pyramidProgress[teamId] || 0;
	if (progress >= pyramidPool.length) return;
	pyramidProgress[teamId] = progress + 1;
	pyramidRevealed[teamId] = false;
	if (
		pyramidProgress[teamId] >= pyramidPool.length &&
		pyramidWinnerId === null
	) {
		pyramidWinnerId = teamId;
	}
	renderPyramidBoard();
}

function renderPyramidScreen() {
	const startBtn = document.getElementById('pyramidStartBtn');
	const endBtn = document.getElementById('pyramidEndBtn');
	const board = document.getElementById('pyramidBoard');
	const summary = document.getElementById('pyramidSummary');
	const progress = document.getElementById('pyramidProgress');

	if (pyramidState === 'idle') {
		if (startBtn) startBtn.style.display = '';
		if (endBtn) endBtn.style.display = 'none';
		if (board) board.style.display = 'none';
		if (summary) summary.style.display = 'none';
		if (progress) {
			progress.textContent =
				'Stock all 4 tiers below (4 / 3 / 2 / 1), then hit Start Round';
		}
		return;
	}

	if (pyramidState === 'running') {
		if (startBtn) startBtn.style.display = 'none';
		if (endBtn) endBtn.style.display = '';
		if (board) board.style.display = '';
		if (summary) summary.style.display = 'none';
		if (progress) {
			progress.textContent = `${pyramidTotalSlots} problems, base to peak — every team climbs at their own pace`;
		}
		renderPyramidBoard();
		return;
	}

	if (startBtn) startBtn.style.display = 'none';
	if (endBtn) endBtn.style.display = 'none';
	if (progress) progress.textContent = '';
	if (summary) {
		summary.style.display = '';
		summary.innerHTML = renderPyramidSummaryHtml();
	}
}

function renderPyramidShape(solved) {
	let rows = '';
	for (let tier = 4; tier >= 1; tier--) {
		const size = pyramidTierSize(tier);
		const offset = pyramidTierOffset(tier);
		let blocks = '';
		for (let j = 0; j < size; j++) {
			const pos = offset + j;
			let state = 'locked';
			if (pos < solved) state = 'solved';
			else if (pos === solved) state = 'current';
			blocks += `<span class="pyramid-block ${state}" title="Tier ${tier} · Q${j + 1}"></span>`;
		}
		rows += `<div class="pyramid-row">${blocks}</div>`;
	}
	return `<div class="pyramid-shape">${rows}</div>`;
}

function renderPyramidBoard() {
	ensurePyramidTeams();
	const board = document.getElementById('pyramidBoard');
	if (!board) return;

	if (!pyramidPool || pyramidPool.length === 0) {
		board.innerHTML =
			'<div style="color: var(--chalk-muted); font-size: 13px;">No questions yet, use "Manage Questions" above to add some.</div>';
		return;
	}

	const teamColumns = teams
		.map((team) => {
			const solved = Math.min(pyramidProgress[team.id] || 0, pyramidPool.length);
			const finished = solved >= pyramidPool.length;

			const shapeBlock = `
				<div class="pyramid-card-head">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<span class="pyramid-count">${solved}/${pyramidPool.length}</span>
				</div>
				${renderPyramidShape(solved)}
			`;

			if (finished) {
				const isWinner = pyramidWinnerId === team.id;
				return `
					<div class="pyramid-team-col finished">
						${shapeBlock}
						<div class="pyramid-finished-line">
							Reached the peak!${isWinner ? ' — first team to finish' : ''}
						</div>
					</div>
				`;
			}

			const problem = pyramidPool[solved];
			const revealed = !!pyramidRevealed[team.id];
			return `
				<div class="pyramid-team-col">
					${shapeBlock}
					<span class="tier-badge t${problem.tier}">${pyramidTierNames[problem.tier] || `Tier ${problem.tier}`}</span>
					<div class="question">${escapeHtml(problem.q)}</div>
					${problem.qImg ? `<img class="prompt-img thumb-img" src="${imgSrc(problem.qImg)}" alt="Question figure" style="${imgStyleAttr(problem.qImg)}" />` : ''}
					${
						revealed
							? `
								<div class="answer-box show">
									<div class="figure">${escapeHtml(problem.a)}</div>
									${problem.aImg ? `<img class="prompt-img thumb-img" src="${imgSrc(problem.aImg)}" alt="Answer figure" style="${imgStyleAttr(problem.aImg)}" />` : ''}
									${problem.e ? `<div class="reasoning">${escapeHtml(problem.e)}</div>` : ''}
								</div>
							`
							: ''
					}
					<div class="team-group" style="border-left-color: ${team.color};">
						<span class="team-name">${escapeHtml(team.name)}</span>
						<div class="team-btns">
							<button
								class="btn small award-btn"
								style="border-color: ${team.color};"
								onclick="togglePyramidReveal('${team.id}')"
							>
								${revealed ? 'Hide Answer' : 'Reveal Answer'}
							</button>
							<button
								class="btn small award-btn"
								style="border-color: ${team.color};"
								onclick="advancePyramidTeam('${team.id}')"
							>
								${iconCheck()}Solved, next level
							</button>
						</div>
					</div>
				</div>
			`;
		})
		.join('');

	board.innerHTML = `<div class="pyramid-board-row">${teamColumns}</div>`;
	typeset(board);
}

function renderPyramidSummaryHtml() {
	if (teams.length === 0) return '';
	const rows = teams
		.map((team) => {
			const solved = Math.min(pyramidProgress[team.id] || 0, pyramidPool.length);
			const isWinner = pyramidWinnerId === team.id;
			const bonusBtn = isWinner
				? `
					<button
						class="btn small award-btn"
						style="border-color: ${team.color};"
						onclick="addScore('${team.id}', 3, event); autosave(); this.disabled=true;"
					>
						+3 Bonus (first to finish)
					</button>
				`
				: '';
			return `
				<div class="team-group" style="border-left-color: ${team.color};">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<div class="team-btns">
						<button
							class="btn small award-btn"
							style="border-color: ${team.color};"
							onclick="addScore('${team.id}', ${solved}, event); autosave(); this.disabled=true;"
						>
							Award ${solved} pt${solved === 1 ? '' : 's'}
						</button>
						${bonusBtn}
					</div>
				</div>
			`;
		})
		.join('');
	return `
		<div class="summary-line">Time's up! Here's how far each team climbed.</div>
		<div style="display: flex; gap: 10px; flex-wrap: wrap"> 
			${rows}
		</div>
		<div class="row-actions">
			<button class="btn ghost" onclick="newPyramidRound()">New Pyramid Round</button>
		</div>
	`;
}

function openPyramidModal() {
	openQuestionManagerModal('Manage Pyramid Race Questions', {
		fieldPrefix: 'newPyr',
		listId: 'customPyramidList',
		addFnName: 'addCustomPyramid',
		helpText:
			'Every pyramid has 4 tiers, base to peak: Tier 1 needs 4 questions, Tier 2 needs 3, Tier 3 needs 2, Tier 4 needs 1. Stock extras in a tier and each new round shuffles in a fresh set.',
		hasTier: true,
	});
	pyramidImageFields.reset();
	const list = document.getElementById('customPyramidList');
	if (list && !document.getElementById('pyramidTierSummary')) {
		list.insertAdjacentHTML(
			'beforebegin',
			'<div id="pyramidTierSummary" class="tier-summary"></div>',
		);
	}
	renderCustomPyramidList();
}

function addCustomPyramid() {
	const tier = Math.max(
		1,
		Math.min(4, parseInt(document.getElementById('newPyrTier').value, 10) || 1),
	);
	const question = document.getElementById('newPyrQ').value.trim();
	const answer = document.getElementById('newPyrA').value.trim();
	const explanation = document.getElementById('newPyrE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customPyramid.push({
		tier: tier,
		q: question,
		qImg: pyramidImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: pyramidImageFields.state.a || undefined,
	});
	document.getElementById('newPyrTier').value = '';
	document.getElementById('newPyrQ').value = '';
	document.getElementById('newPyrA').value = '';
	document.getElementById('newPyrE').value = '';
	pyramidImageFields.reset();
	renderCustomPyramidList();
	autosave();
}

function deleteCustomPyramid(i) {
	deleteCustomItem(customPyramid, i, renderCustomPyramidList);
}

function renderPyramidTierSummary() {
	const summary = document.getElementById('pyramidTierSummary');
	if (!summary) return;
	const counts = pyramidTierCounts();
	summary.innerHTML = pyramidTierSizes
		.map((need, idx) => {
			const tier = idx + 1;
			const have = counts[tier];
			const ok = have >= need;
			return `<span class="tier-chip t${tier} ${ok ? 'ok' : 'short'}">${pyramidTierNames[tier]}: ${have}/${need}</span>`;
		})
		.join('');
}

function renderCustomPyramidList() {
	renderPyramidTierSummary();
	const sorted = customPyramid
		.map((problem, i) => ({ ...problem, _i: i }))
		.sort((a, b) => a.tier - b.tier);
	renderCustomList(
		'customPyramidList',
		sorted,
		(problem) => `
			<div class="custom-list-item">
				${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
				<div class="txt"><b>Tier ${problem.tier}</b> — ${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
				<button class="btn small ghost" onclick="deleteCustomPyramid(${problem._i})">Delete</button>
			</div>
		`,
	);
}
