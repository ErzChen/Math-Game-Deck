let customSprint = [];
let sprintPool = [];
let sprintOrder = [];
let sprintIndex = 0;
let sprintCorrectCount = 0;
let sprintClearedPool = false;
let sprintTimerSeconds = 420;
let sprintTimerInterval = null;
let sprintState = 'idle';
let sprintTeamId = null;

const sprintImageFields = createQAImageState(
	{ qWrap: 'newSprintQImgWrap', qFile: 'newSprintQImgFile' },
	{ hasAnswerImage: false },
);

function initSprint() {
	newSprint();
}

function newSprint() {
	clearInterval(sprintTimerInterval);
	sprintTimerInterval = null;
	sprintState = 'idle';
	sprintIndex = 0;
	sprintCorrectCount = 0;
	sprintClearedPool = false;
	sprintTimerSeconds = 180;
	sprintTeamId = null;
	sprintOrder = [];
	renderSprintScreen();
}

function populateSprintTeamSelector() {
	const select = document.getElementById('sprintTeamSelect');
	if (!select) return;
	const prev = select.value;
	select.innerHTML = teams
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');
	if (teams.find((team) => team.id === prev)) select.value = prev;
	select.disabled = sprintState === 'running';
}

function shuffleSprintOrder() {
	sprintOrder = sprintPool.map((_, i) => i);
	for (let i = sprintOrder.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[sprintOrder[i], sprintOrder[j]] = [sprintOrder[j], sprintOrder[i]];
	}
}

function startSprint() {
	sprintPool = customSprint;
	if (sprintPool.length === 0) {
		alert('Add some questions first via "Manage Questions".');
		return;
	}
	const select = document.getElementById('sprintTeamSelect');
	if (!select || !select.value) {
		alert('Pick a team first.');
		return;
	}
	sprintTeamId = select.value;
	sprintIndex = 0;
	sprintCorrectCount = 0;
	sprintClearedPool = false;
	sprintTimerSeconds = 180;
	shuffleSprintOrder();
	sprintState = 'running';
	sprintTimerInterval = setInterval(tickSprintTimer, 1000);
	renderSprintScreen();
}

function tickSprintTimer() {
	if (sprintTimerSeconds > 0) {
		sprintTimerSeconds--;
		renderSprintTimer();
	} else {
		endSprint();
	}
}

function toggleSprintPause() {
	if (sprintState !== 'running') return;
	const btn = document.getElementById('sprintPauseToggle');
	if (sprintTimerInterval) {
		clearInterval(sprintTimerInterval);
		sprintTimerInterval = null;
		if (btn) btn.textContent = 'Resume';
	} else {
		if (btn) btn.textContent = 'Pause';
		sprintTimerInterval = setInterval(tickSprintTimer, 1000);
	}
}

function endSprint() {
	clearInterval(sprintTimerInterval);
	sprintTimerInterval = null;
	sprintState = 'finished';
	renderSprintScreen();
}

function markSprintCorrect() {
	advanceSprint(true);
}

function markSprintSkip() {
	advanceSprint(false);
}

function advanceSprint(wasCorrect) {
	if (sprintState !== 'running') return;
	if (wasCorrect) sprintCorrectCount++;
	sprintIndex++;
	if (
		sprintPool.length > 0 &&
		sprintIndex > 0 &&
		sprintIndex % sprintPool.length === 0
	) {
		sprintClearedPool = true;
		shuffleSprintOrder();
	}
	renderSprintProblem();
}

function renderSprintTimer() {
	const element = document.getElementById('sprintTimerDisplay');
	if (!element) return;
	element.textContent = formatSeconds(sprintTimerSeconds);
	element.classList.toggle('low', sprintTimerSeconds <= 20);
}

function renderSprintProblem() {
	sprintPool = customSprint;
	const questionEl = document.getElementById('sprintQuestionText');
	const keyEl = document.getElementById('sprintAnswerKey');
	if (!questionEl) return;
	if (sprintPool.length === 0) {
		document.getElementById('sprintProgress').textContent = 'No questions yet';
		questionEl.textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		if (keyEl) keyEl.textContent = '';
		setPromptImage('sprintQuestionImg', null);
		return;
	}
	if (sprintOrder.length !== sprintPool.length) {
		shuffleSprintOrder();
	}
	const lap = sprintIndex % sprintPool.length;
	const problem = sprintPool[sprintOrder[lap]];
	document.getElementById('sprintProgress').textContent =
		`Question ${lap + 1} of ${sprintPool.length} · ${sprintCorrectCount} correct so far`;
	questionEl.textContent = problem.q;
	setPromptImage('sprintQuestionImg', problem.qImg);
	if (keyEl) keyEl.textContent = 'Answer key: ' + problem.a;
	typeset(questionEl);
}

function renderSprintScreen() {
	populateSprintTeamSelector();
	renderSprintTimer();
	const startBtn = document.getElementById('sprintStartBtn');
	const pauseBtn = document.getElementById('sprintPauseToggle');
	const controls = document.getElementById('sprintActiveControls');
	const summary = document.getElementById('sprintSummary');
	const questionWrap = document.getElementById('sprintQuestionWrap');
	const progress = document.getElementById('sprintProgress');

	if (sprintState === 'idle') {
		if (startBtn) startBtn.style.display = '';
		if (pauseBtn) pauseBtn.style.display = 'none';
		if (controls) controls.style.display = 'none';
		if (summary) summary.style.display = 'none';
		if (questionWrap) questionWrap.style.display = 'none';
		if (progress) progress.textContent = 'Pick a team and hit Start Sprint';
		return;
	}

	if (sprintState === 'running') {
		if (startBtn) startBtn.style.display = 'none';
		if (pauseBtn) {
			pauseBtn.style.display = '';
			pauseBtn.textContent = sprintTimerInterval ? 'Pause' : 'Resume';
		}
		if (controls) controls.style.display = '';
		if (summary) summary.style.display = 'none';
		if (questionWrap) questionWrap.style.display = '';
		renderSprintProblem();
		return;
	}

	if (startBtn) startBtn.style.display = 'none';
	if (pauseBtn) pauseBtn.style.display = 'none';
	if (controls) controls.style.display = 'none';
	if (questionWrap) questionWrap.style.display = 'none';
	if (summary) {
		summary.style.display = '';
		summary.innerHTML = renderSprintSummaryHtml();
	}
}

function renderSprintSummaryHtml() {
	const team = teams.find((team) => team.id === sprintTeamId);
	if (!team) return `<button class="btn ghost" onclick="newSprint()">New Sprint</button>`;
	const bonusBtn = sprintClearedPool
		? `<button class="btn ghost" onclick="addScore('${team.id}', 1, event); autosave(); this.disabled=true;">
				+1 Bonus (cleared the pool)
			</button>`
		: '';
	return `
		<div class="summary-line">
			Time's up! <b style="color: ${team.color};">${escapeHtml(team.name)}</b> answered <b>${sprintCorrectCount}</b> correctly.
		</div>
		<div class="row-actions">
			<button
				class="btn primary"
				onclick="addScore('${team.id}', ${sprintCorrectCount}, event); autosave(); this.disabled=true;"
			>
				Award ${sprintCorrectCount} pt${sprintCorrectCount === 1 ? '' : 's'}
			</button>
			${bonusBtn}
			<button class="btn ghost" onclick="newSprint()">New Sprint</button>
		</div>
	`;
}

function openSprintModal() {
	openQuestionManagerModal('Manage Speed Sprint Questions', {
		fieldPrefix: 'newSprint',
		listId: 'customSprintList',
		addFnName: 'addCustomSprint',
		helpText:
			'Keep these short — teams are racing the clock. No explanation needed, just question and answer.',
		hasExplanation: false,
		hasAnswerImage: false,
	});
	sprintImageFields.reset();
	renderCustomSprintList();
}

function addCustomSprint() {
	const question = document.getElementById('newSprintQ').value.trim();
	const answer = document.getElementById('newSprintA').value.trim();
	if (!question || !answer) {
		alert('Enter both a question and an answer.');
		return;
	}
	customSprint.push({
		q: question,
		a: answer,
		qImg: sprintImageFields.state.q || undefined,
	});
	document.getElementById('newSprintQ').value = '';
	document.getElementById('newSprintA').value = '';
	sprintImageFields.reset();
	renderCustomSprintList();
	autosave();
}

function deleteCustomSprint(i) {
	deleteCustomItem(customSprint, i, renderCustomSprintList);
}

function renderCustomSprintList() {
	renderCustomList('customSprintList', customSprint, (problem, i) => `
		<div class="custom-list-item">
			${problem.qImg ? `<img class="thumb" src="${problem.qImg}" alt="" />` : ''}
			<div class="txt"><b>${escapeHtml(problem.q)}</b><br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomSprint(${i})">Delete</button>
		</div>
	`);
}
