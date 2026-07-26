let customLadder = [];
let ladderPool = [];
let ladderIndex = 0;

const tierNames = {
	1: 'Tier 1 · Warm-up · 1 pt',
	2: 'Tier 2 · Building · 2 pt',
	3: 'Tier 3 · Push · 3 pt',
	4: 'Tier 4 · Frontier · 4 pt',
};

const ladderTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'ladderTimerDisplay',
	toggleBtnId: 'ladderTimerToggle',
});
const defaultLadderSeconds = 90;

const ladderImageFields = createQAImageState({
	qWrap: 'newLadQImgWrap',
	qFile: 'newLadQImgFile',
	aWrap: 'newLadAImgWrap',
	aFile: 'newLadAImgFile',
});

function initLadder() {
	resetLadder();
}

function resetLadder() {
	ladderPool = customLadder;
	ladderIndex = 0;
	renderLadderProblem();
}

function nextLadderProblem() {
	ladderIndex++;
	renderLadderProblem();
}

function toggleLadderTimer() {
	ladderTimer.toggle();
}

function setLadderTimerDuration(seconds) {
	ladderTimer.setDuration(seconds);
}

function updateLadderTimerDuration() {
	const input = document.getElementById('ladderTimerDuration');
	if (!input) return;
	setLadderTimerDuration(input.value);
	input.value = ladderTimer.getDuration();
}

function renderLadderTimer() {
	ladderTimer.render();
	const input = document.getElementById('ladderTimerDuration');
	if (input && document.activeElement !== input) {
		input.value = ladderTimer.getDuration();
	}
}

function resetLadderTimer() {
	ladderTimer.reset();
}

function renderLadderProblem() {
	ladderPool = customLadder;
	const badge = document.getElementById('ladderTierBadge');
	const box = document.getElementById('ladderAnswerBox');
	box.classList.remove('show');

	if (ladderPool.length === 0) {
		document.getElementById('ladderProgress').textContent = 'No questions yet';
		badge.textContent = '';
		badge.className = 'tier-badge';
		document.getElementById('ladderQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('ladderQuestionImg', null);
		document.getElementById('ladderAwardLabel').textContent = 'Award the point';
		ladderTimer.stop();
		renderLadderAwardButtons();
		return;
	}

	const problem = ladderPool[ladderIndex % ladderPool.length];
	document.getElementById('ladderProgress').textContent =
		`Problem ${(ladderIndex % ladderPool.length) + 1} of ${ladderPool.length}`;
	badge.textContent = tierNames[problem.tier] || `Tier ${problem.tier}`;
	badge.className = 'tier-badge t' + problem.tier;
	document.getElementById('ladderQuestionText').textContent = problem.q;
	setPromptImage('ladderQuestionImg', problem.qImg);
	document.getElementById('ladderAwardLabel').textContent =
		`Award the point (worth ${problem.tier})`;
	typeset(document.getElementById('ladderQuestionText'));
	renderLadderAwardButtons();
	ladderTimer.setDuration(problem.time || defaultLadderSeconds);
}

function revealLadderAnswer() {
	if (ladderPool.length === 0) return;
	const problem = ladderPool[ladderIndex % ladderPool.length];
	document.getElementById('ladderAnswerFigure').textContent = problem.a;
	setPromptImage('ladderAnswerImg', problem.aImg);
	document.getElementById('ladderAnswerReasoning').textContent = problem.e;
	const box = document.getElementById('ladderAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderLadderAwardButtons() {
	const problem = ladderPool[ladderIndex % ladderPool.length];
	const pts = problem ? problem.tier : 1;
	renderTeamAwardButtons('awardLadder', teams, () => [
		{ label: `+${pts}`, points: pts },
	]);
}

function openLadderModal() {
	openQuestionManagerModal('Manage Contest Ladder Questions', {
		fieldPrefix: 'newLad',
		listId: 'customLadderList',
		addFnName: 'addCustomLadder',
		hasTier: true,
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	ladderImageFields.reset();
	renderCustomLadderList();
}

function addCustomLadder() {
	const tier = Math.max(
		1,
		Math.min(4, parseInt(document.getElementById('newLadTier').value, 10) || 1),
	);
	const timeInput = document.getElementById('newLadTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newLadQ').value.trim();
	const answer = document.getElementById('newLadA').value.trim();
	const explanation = document.getElementById('newLadE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customLadder.push({
		tier: tier,
		time: time,
		q: question,
		qImg: ladderImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: ladderImageFields.state.a || undefined,
	});
	document.getElementById('newLadTier').value = '';
	document.getElementById('newLadTime').value = '';
	document.getElementById('newLadQ').value = '';
	document.getElementById('newLadA').value = '';
	document.getElementById('newLadE').value = '';
	ladderImageFields.reset();
	renderCustomLadderList();
	autosave();
}

function deleteCustomLadder(i) {
	deleteCustomItem(customLadder, i, renderCustomLadderList);
}

function renderCustomLadderList() {
	renderCustomList(
		'customLadderList',
		customLadder,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt"><b>Tier ${problem.tier}</b>${problem.time ? ` · ${problem.time}s` : ''} — ${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomLadder(${i})">Delete</button>
		</div>
	`,
	);
}
