let customSwapPairs = [];
let swapPool = [];
let swapIndex = 0;
let swapTokens = {};
let swapBids = {};
let swapLocked = false;
let swapWinnerId = null;
let swapWinningBid = 0;

const swapStartTokens = 10;
const defaultSwapSeconds = 90;

const swapTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'swapTimerDisplay',
});

const swapHardImageFields = createQAImageState({
	qWrap: 'newSwapHardQImgWrap',
	qFile: 'newSwapHardQImgFile',
	aWrap: 'newSwapHardAImgWrap',
	aFile: 'newSwapHardAImgFile',
});

const swapBackupImageFields = createQAImageState({
	qWrap: 'newSwapBackQImgWrap',
	qFile: 'newSwapBackQImgFile',
	aWrap: 'newSwapBackAImgWrap',
	aFile: 'newSwapBackAImgFile',
});

function initSwap() {
	resetSwapMarket();
}

function resetSwapMarket() {
	swapPool = customSwapPairs;
	swapIndex = 0;
	swapLocked = false;
	swapWinnerId = null;
	swapWinningBid = 0;
	ensureSwapTeams(true);
	renderSwapScreen();
}

function ensureSwapTeams(resetBids) {
	teams.forEach((team) => {
		if (swapTokens[team.id] === undefined) swapTokens[team.id] = swapStartTokens;
		if (resetBids || swapBids[team.id] === undefined) swapBids[team.id] = 0;
	});
}

function nextSwapProblem() {
	swapPool = customSwapPairs;
	swapIndex++;
	swapLocked = false;
	swapWinnerId = null;
	swapWinningBid = 0;
	ensureSwapTeams(true);
	renderSwapScreen();
}

function resetSwapTokens() {
	teams.forEach((team) => {
		swapTokens[team.id] = swapStartTokens;
	});
	renderSwapRoster();
	autosave();
}

function setSwapBid(teamId, val) {
	if (swapLocked) return;
	const tokens = swapTokens[teamId] !== undefined ? swapTokens[teamId] : swapStartTokens;
	let n = parseInt(val, 10);
	if (isNaN(n) || n < 0) n = 0;
	if (n > tokens) n = tokens;
	swapBids[teamId] = n;
	renderSwapRoster();
}

function lockSwapsAndStart() {
	swapPool = customSwapPairs;
	if (swapPool.length === 0) {
		alert('Add a problem pair first via "Manage Problem Pairs".');
		return;
	}

	let highest = 0;
	teams.forEach((team) => {
		const bid = swapBids[team.id] || 0;
		if (bid > highest) highest = bid;
	});

	let winnerId = null;
	if (highest > 0) {
		const contenders = teams.filter((team) => (swapBids[team.id] || 0) === highest);
		winnerId = contenders[Math.floor(Math.random() * contenders.length)].id;
		swapTokens[winnerId] = Math.max(
			0,
			(swapTokens[winnerId] !== undefined ? swapTokens[winnerId] : swapStartTokens) -
				highest,
		);
	}

	swapWinnerId = winnerId;
	swapWinningBid = winnerId ? highest : 0;
	swapLocked = true;
	swapTimer.toggle();
	renderSwapScreen();
	autosave();
}

function revealSwapAnswer() {
	swapPool = customSwapPairs;
	if (swapPool.length === 0) return;
	const pair = swapPool[swapIndex % swapPool.length];
	swapTimer.stop();

	document.getElementById('swapHardAnswerFigure').textContent = pair.hardA;
	setPromptImage('swapHardAnswerImg', pair.hardAImg);
	document.getElementById('swapHardAnswerReasoning').textContent =
		pair.hardE || '';
	const hardBox = document.getElementById('swapHardAnswerBox');
	hardBox.classList.add('show');
	typeset(hardBox);

	document.getElementById('swapBackAnswerFigure').textContent = pair.backA;
	setPromptImage('swapBackAnswerImg', pair.backAImg);
	document.getElementById('swapBackAnswerReasoning').textContent =
		pair.backE || '';
	const backBox = document.getElementById('swapBackAnswerBox');
	backBox.classList.add('show');
	typeset(backBox);
}

function renderSwapProblem() {
	swapPool = customSwapPairs;
	document.getElementById('swapHardAnswerBox').classList.remove('show');
	document.getElementById('swapBackAnswerBox').classList.remove('show');

	if (swapPool.length === 0) {
		document.getElementById('swapProgress').textContent = 'No problem pairs yet';
		document.getElementById('swapHardQuestionText').textContent =
			'No problem pairs yet, use "Manage Problem Pairs" above to add some.';
		setPromptImage('swapHardQuestionImg', null);
		document.getElementById('swapBackQuestionText').textContent = '';
		setPromptImage('swapBackQuestionImg', null);
		return;
	}

	const pair = swapPool[swapIndex % swapPool.length];
	document.getElementById('swapProgress').textContent =
		`Round ${(swapIndex % swapPool.length) + 1} of ${swapPool.length}`;

	const hardEl = document.getElementById('swapHardQuestionText');
	hardEl.textContent = pair.hardQ;
	setPromptImage('swapHardQuestionImg', pair.hardQImg);
	typeset(hardEl);

	const backEl = document.getElementById('swapBackQuestionText');
	backEl.textContent = pair.backQ;
	setPromptImage('swapBackQuestionImg', pair.backQImg);
	typeset(backEl);
	swapTimer.setDuration(pair.time || defaultSwapSeconds);
}

function renderSwapRoster() {
	ensureSwapTeams(false);
	const wrap = document.getElementById('swapRoster');
	if (!wrap) return;

	let banner = '';
	if (swapLocked) {
		if (swapWinnerId) {
			const winner = teams.find((team) => team.id === swapWinnerId);
			banner = winner
				? `
					<div class="swap-token-count" style="margin-bottom: 10px; font-size: 13px;">
						<b style="color: ${winner.color};">${escapeHtml(winner.name)}</b> won the auction with a bid of
						${swapWinningBid} token${swapWinningBid === 1 ? '' : 's'}, they swap to the easier backup problem, still worth 3 pts.
						Everyone else is stuck with the hard problem (also 3 pts).
					</div>
				`
				: '';
		} else {
			banner = `
				<div class="swap-token-count" style="margin-bottom: 10px; font-size: 13px;">
					No one bid, every team answers the hard problem (3 pts).
				</div>
			`;
		}
	}

	wrap.innerHTML = banner + teams.map((team) => renderSwapTeamRow(team)).join('');
}

function renderSwapTeamRow(team) {
	const tokens = swapTokens[team.id] !== undefined ? swapTokens[team.id] : swapStartTokens;
	const isWinner = swapLocked && swapWinnerId === team.id;
	const pts = 3;

	const bidControl = swapLocked
		? `<span class="swap-token-count">${isWinner ? `Spent ${swapWinningBid}` : `${tokens} token${tokens === 1 ? '' : 's'} left`}</span>`
		: `
			<input
				type="number"
				class="wager-input mono"
				min="0"
				max="${tokens}"
				value="${swapBids[team.id] || 0}"
				style="border-color: ${team.color};"
				onchange="setSwapBid('${team.id}', this.value)"
			/>
			<span class="swap-token-count flex middle">of ${tokens}</span>
		`;

	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				${bidControl}
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="addScore('${team.id}', ${pts}, event)"
				>
					+${pts}
				</button>
			</div>
		</div>
	`;
}

function renderSwapScreen() {
	ensureSwapTeams(false);
	renderSwapProblem();
	renderSwapRoster();
	const lockBtn = document.getElementById('swapLockBtn');
	if (lockBtn) lockBtn.style.display = swapLocked ? 'none' : '';
	swapTimer.render();
}

function openSwapModal() {
	openModal(
		'Manage Problem Pairs',
		`
			<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">
				Each pair has a harder problem and an easier backup, both worth 3 pts. Teams bid
				swap tokens for the backup before the timer starts, so winning it is pure upside.
			</div>
			<div class="field-label">Time limit in seconds (optional, defaults to standard timer)</div>
			<input type="number" min="1" id="newSwapTime" placeholder="e.g. 90" />
			<div class="field-label" style="margin-top: 20px; font-size: 13px; color: var(--chalk-yellow);">
				Hard Problem (3 pts)
			</div>
			<div class="field-label">Question (use $...$ for math)</div>
			<textarea id="newSwapHardQ" placeholder="e.g. The harder version of the question"></textarea>
			<div class="field-label">Question image (optional)</div>
			<div id="newSwapHardQImgWrap"></div>
			<div class="field-label">Answer</div>
			<input type="text" id="newSwapHardA" placeholder="e.g. 42" />
			<div class="field-label">Explanation</div>
			<textarea id="newSwapHardE" placeholder="Show the reasoning."></textarea>
			<div class="field-label">Answer image (optional)</div>
			<div id="newSwapHardAImgWrap"></div>

			<div class="field-label" style="margin-top: 20px; font-size: 13px; color: var(--chalk-teal);">
				Easier Backup (3 pts)
			</div>
			<div class="field-label">Question (use $...$ for math)</div>
			<textarea id="newSwapBackQ" placeholder="e.g. A gentler version of the question"></textarea>
			<div class="field-label">Question image (optional)</div>
			<div id="newSwapBackQImgWrap"></div>
			<div class="field-label">Answer</div>
			<input type="text" id="newSwapBackA" placeholder="e.g. 7" />
			<div class="field-label">Explanation</div>
			<textarea id="newSwapBackE" placeholder="Show the reasoning."></textarea>
			<div class="field-label">Answer image (optional)</div>
			<div id="newSwapBackAImgWrap"></div>

			<button class="btn primary" style="margin-top: 16px;" onclick="addCustomSwapPair()">Add Pair</button>
			<div class="field-label" style="margin-top: 22px;">Your problem pairs</div>
			<div id="customSwapList"></div>
		`,
	);
	swapHardImageFields.reset();
	swapBackupImageFields.reset();
	renderCustomSwapList();
}

function addCustomSwapPair() {
	const timeInput = document.getElementById('newSwapTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const hardQ = document.getElementById('newSwapHardQ').value.trim();
	const hardA = document.getElementById('newSwapHardA').value.trim();
	const hardE = document.getElementById('newSwapHardE').value.trim();
	const backQ = document.getElementById('newSwapBackQ').value.trim();
	const backA = document.getElementById('newSwapBackA').value.trim();
	const backE = document.getElementById('newSwapBackE').value.trim();

	if (!hardQ || !hardA || !backQ || !backA) {
		alert(
			'Enter a question and answer for both the hard problem and the backup.',
		);
		return;
	}

	customSwapPairs.push({
		time,
		hardQ,
		hardA,
		hardE,
		hardQImg: swapHardImageFields.state.q || undefined,
		hardAImg: swapHardImageFields.state.a || undefined,
		backQ,
		backA,
		backE,
		backQImg: swapBackupImageFields.state.q || undefined,
		backAImg: swapBackupImageFields.state.a || undefined,
	});

	[
		'newSwapTime',
		'newSwapHardQ',
		'newSwapHardA',
		'newSwapHardE',
		'newSwapBackQ',
		'newSwapBackA',
		'newSwapBackE',
	].forEach((id) => {
		document.getElementById(id).value = '';
	});
	swapHardImageFields.reset();
	swapBackupImageFields.reset();
	renderCustomSwapList();
	autosave();
}

function deleteCustomSwapPair(i) {
	deleteCustomItem(customSwapPairs, i, renderCustomSwapList);
}

function renderCustomSwapList() {
	renderCustomList(
		'customSwapList',
		customSwapPairs,
		(pair, i) => `
		<div class="custom-list-item">
			${pair.hardQImg || pair.backQImg ? `<img class="thumb" src="${pair.hardQImg || pair.backQImg}" alt="" />` : ''}
			<div class="txt">
				${pair.time ? `<b>${pair.time}s</b><br>` : ''}
				<b>Hard:</b> ${escapeHtml(pair.hardQ)} → ${escapeHtml(pair.hardA)}<br>
				<b>Backup:</b> ${escapeHtml(pair.backQ)} → ${escapeHtml(pair.backA)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomSwapPair(${i})">Delete</button>
		</div>
	`,
	);
}
