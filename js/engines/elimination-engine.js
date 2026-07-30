let customElimination = [];
let eliminationPool = [];
let eliminationIndex = 0;
let eliminationAliveIds = [];
let eliminationRoundMarks = {};

const eliminationImageFields = createQAImageState({
	qWrap: 'newElimQImgWrap',
	qFile: 'newElimQImgFile',
	aWrap: 'newElimAImgWrap',
	aFile: 'newElimAImgFile',
});

function initElimination() {
	resetElimination();
}

function resetElimination() {
	eliminationPool = customElimination;
	eliminationIndex = 0;
	eliminationAliveIds = teams.map((team) => team.id);
	eliminationRoundMarks = {};
	renderEliminationProblem();
}

function pruneEliminationAlive() {
	const validIds = teams.map((team) => team.id);
	eliminationAliveIds = eliminationAliveIds.filter((id) =>
		validIds.includes(id),
	);
	if (eliminationIndex === 0) {
		validIds.forEach((id) => {
			if (!eliminationAliveIds.includes(id)) eliminationAliveIds.push(id);
		});
	}
	if (eliminationAliveIds.length === 0) {
		eliminationAliveIds = teams.map((team) => team.id);
	}
}

function nextEliminationRound() {
	if (eliminationAliveIds.length <= 1) return;
	eliminationIndex++;
	renderEliminationProblem();
}

function renderEliminationProblem() {
	eliminationPool = customElimination;
	pruneEliminationAlive();
	const box = document.getElementById('eliminationAnswerBox');
	if (box) box.classList.remove('show');
	const badge = document.getElementById('eliminationTierBadge');

	if (eliminationPool.length === 0) {
		document.getElementById('eliminationProgress').textContent =
			'No questions yet';
		if (badge) {
			badge.textContent = '';
			badge.className = 'tier-badge';
		}
		document.getElementById('eliminationQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('eliminationQuestionImg', null);
		renderEliminationRoster();
		return;
	}

	const problem = eliminationPool[eliminationIndex % eliminationPool.length];
	document.getElementById('eliminationProgress').textContent =
		`Round ${eliminationIndex + 1} · ${eliminationAliveIds.length} team${eliminationAliveIds.length === 1 ? '' : 's'} still in it`;
	if (badge) {
		badge.textContent = problem.tier
			? tierNames[problem.tier] || `Tier ${problem.tier}`
			: '';
		badge.className = 'tier-badge' + (problem.tier ? ' t' + problem.tier : '');
	}
	document.getElementById('eliminationQuestionText').textContent = problem.q;
	setPromptImage('eliminationQuestionImg', problem.qImg);
	typeset(document.getElementById('eliminationQuestionText'));
	eliminationRoundMarks = {};
	renderEliminationRoster();
}

function revealEliminationAnswer() {
	if (eliminationPool.length === 0) return;
	const problem = eliminationPool[eliminationIndex % eliminationPool.length];
	document.getElementById('eliminationAnswerFigure').textContent = problem.a;
	setPromptImage('eliminationAnswerImg', problem.aImg);
	document.getElementById('eliminationAnswerReasoning').textContent = problem.e;
	const box = document.getElementById('eliminationAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderEliminationRoster() {
	const element = document.getElementById('eliminationRoster');
	if (!element) return;

	if (eliminationAliveIds.length <= 1 && eliminationPool.length > 0) {
		element.innerHTML = renderEliminationChampionHtml();
		return;
	}

	element.innerHTML = teams
		.map((team) => renderEliminationTeamRow(team))
		.join('');
}

function renderEliminationChampionHtml() {
	const champ = teams.find((t) => t.id === eliminationAliveIds[0]);
	if (!champ) {
		return `<div style="color: var(--chalk-muted); font-size: 13px;">Add teams to start a gauntlet.</div>`;
	}
	return `
		<div class="elim-champion">
			<div class="elim-champion-label">Gauntlet winner</div>
			<div class="elim-champion-name" style="color: ${champ.color};">${escapeHtml(champ.name)}</div>
			<button class="btn primary" onclick="addScore('${champ.id}', 5, event); autosave();">
				+5 Champion Bonus
			</button>
			<button class="btn ghost" onclick="resetElimination()">New Gauntlet</button>
		</div>
	`;
}

function renderEliminationTeamRow(team) {
	const alive = eliminationAliveIds.includes(team.id);
	const mark = eliminationRoundMarks[team.id];
	if (!alive) {
		return `
			<div class="middle team-group ${mark ? 'marked' : ''}" style="border-left-color: ${team.color};">
				<span class="team-name flex middle">${escapeHtml(team.name)} OUT</span>
			</div>
		`;
	}
	return `
		<div class="team-group ${mark ? 'marked' : ''}" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				<button
					class="btn small award-btn ${mark === 'wrong' ? 'wrong-active' : ''}"
					style="border-color: ${team.color};"
					onclick="markElimination('${team.id}', 'wrong')"
				>
					${iconCross()}Out
				</button>
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markElimination('${team.id}', 'correct')"
				>
					${iconCheck()}Survived +1
				</button>
			</div>
		</div>
	`;
}

function markElimination(teamId, result) {
	if (!eliminationAliveIds.includes(teamId)) return;
	if (eliminationRoundMarks[teamId] === result) return;

	if (result === 'wrong') {
		const otherStillIn = eliminationAliveIds.filter(
			(id) => id !== teamId && eliminationRoundMarks[id] !== 'wrong',
		);
		if (otherStillIn.length === 0) {
			alert(
				"Can't eliminate every remaining team, at least one has to survive this round.",
			);
			return;
		}
		eliminationRoundMarks[teamId] = 'wrong';
		eliminationAliveIds = eliminationAliveIds.filter((id) => id !== teamId);
	} else {
		eliminationRoundMarks[teamId] = 'correct';
		addScore(teamId, 1);
	}
	autosave();
	renderEliminationRoster();
}

function openEliminationModal() {
	openQuestionManagerModal('Manage Elimination Gauntlet Questions', {
		fieldPrefix: 'newElim',
		listId: 'customEliminationList',
		addFnName: 'addCustomElimination',
		hasTier: true,
		tierLabel: 'Tier (1-4, optional, just a difficulty badge)',
	});
	eliminationImageFields.reset();
	renderCustomEliminationList();
}

function addCustomElimination() {
	const tierRaw = document.getElementById('newElimTier').value.trim();
	const tier = tierRaw
		? Math.max(1, Math.min(4, parseInt(tierRaw, 10) || 0))
		: null;
	const question = document.getElementById('newElimQ').value.trim();
	const answer = document.getElementById('newElimA').value.trim();
	const explanation = document.getElementById('newElimE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customElimination.push({
		tier: tier,
		q: question,
		qImg: eliminationImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: eliminationImageFields.state.a || undefined,
	});
	document.getElementById('newElimTier').value = '';
	document.getElementById('newElimQ').value = '';
	document.getElementById('newElimA').value = '';
	document.getElementById('newElimE').value = '';
	eliminationImageFields.reset();
	renderCustomEliminationList();
	autosave();
}

function deleteCustomElimination(i) {
	deleteCustomItem(customElimination, i, renderCustomEliminationList);
}

function renderCustomEliminationList() {
	renderCustomList(
		'customEliminationList',
		customElimination,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
			<div class="txt">
				<b>${problem.tier ? 'Tier ' + problem.tier : 'No tier'}</b> — ${escapeHtml(problem.q)}
				<br>
				${escapeHtml(problem.a)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomElimination(${i})">Delete</button>
		</div>
	`,
	);
}
