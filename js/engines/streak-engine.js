let customStreak = [];
let streakPool = [];
let streakState = 'idle';
let streakTeamId = null;
let streakIndex = 0;
let streakVault = 0;
let streakOutcome = null; 

const streakTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'streakTimerDisplay',
});
const defaultStreakSeconds = 90;

const streakImageFields = createQAImageState({
	qWrap: 'newStreakQImgWrap',
	qFile: 'newStreakQImgFile',
	aWrap: 'newStreakAImgWrap',
	aFile: 'newStreakAImgFile',
});

function initStreak() {
	newStreakTurn();
}

function pointsForStreakLevel(i) {
	return Math.pow(2, i);
}

function newStreakTurn() {
	streakState = 'idle';
	streakTeamId = null;
	streakIndex = 0;
	streakVault = 0;
	streakOutcome = null;
	streakTimer.stop();
	renderStreakScreen();
}

function populateStreakTeamSelector() {
	const select = document.getElementById('streakTeamSelect');
	if (!select) return;
	const prev = select.value;
	select.innerHTML = teams
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');
	if (teams.find((team) => team.id === prev)) select.value = prev;
	select.disabled = streakState !== 'idle';
}

function startStreakTurn() {
	streakPool = customStreak;
	if (streakPool.length === 0) {
		alert('Add some questions first via "Manage Streak Set".');
		return;
	}
	const select = document.getElementById('streakTeamSelect');
	if (!select || !select.value) {
		alert('Pick a team first.');
		return;
	}
	streakTeamId = select.value;
	streakIndex = 0;
	streakVault = 0;
	streakOutcome = null;
	streakState = 'question';
	renderStreakScreen();
}

function revealStreakAnswer() {
	streakPool = customStreak;
	if (streakPool.length === 0) return;
	const problem = streakPool[streakIndex];
	document.getElementById('streakAnswerFigure').textContent = problem.a;
	setPromptImage('streakAnswerImg', problem.aImg);
	document.getElementById('streakAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('streakAnswerBox');
	box.classList.add('show');
	typeset(box);
	streakTimer.stop();
	const controls = document.getElementById('streakJudgeControls');
	if (controls) controls.style.display = '';
}

function markStreakCorrect() {
	if (streakState !== 'question') return;
	streakTimer.stop();
	streakVault += pointsForStreakLevel(streakIndex);
	if (streakIndex + 1 >= streakPool.length) {
		streakOutcome = 'cleared';
		streakState = 'summary';
	} else {
		streakState = 'decision';
	}
	renderStreakScreen();
}

function markStreakWrong() {
	if (streakState !== 'question') return;
	streakTimer.stop();
	streakVault = 0;
	streakOutcome = 'bust';
	streakState = 'summary';
	renderStreakScreen();
}

function bankStreak() {
	if (streakState !== 'decision') return;
	streakOutcome = 'banked';
	streakState = 'summary';
	renderStreakScreen();
}

function pushStreak() {
	if (streakState !== 'decision') return;
	streakIndex++;
	streakState = 'question';
	renderStreakScreen();
}

function ensureStreakTimerUI() {
	const wrap = document.getElementById('streakQuestionWrap');
	if (!wrap || document.getElementById('streakTimerDisplay')) return;
	wrap.insertAdjacentHTML('afterbegin', `<div class="timer mono" id="streakTimerDisplay"></div>`);
}

function renderStreakQuestion() {
	streakPool = customStreak;
	const badge = document.getElementById('streakLevelBadge');
	const box = document.getElementById('streakAnswerBox');
	const controls = document.getElementById('streakJudgeControls');
	if (box) box.classList.remove('show');
	if (controls) controls.style.display = 'none';

	if (streakPool.length === 0 || streakIndex >= streakPool.length) return;

	ensureStreakTimerUI();

	const problem = streakPool[streakIndex];
	const levelPts = pointsForStreakLevel(streakIndex);
	if (badge) {
		badge.textContent = `Level ${streakIndex + 1} of ${streakPool.length} · worth ${levelPts} pt${levelPts === 1 ? '' : 's'}`;
	}
	const vaultEl = document.getElementById('streakVaultTotal');
	if (vaultEl) {
		vaultEl.textContent = `Vault if correct: ${streakVault + levelPts} pt${streakVault + levelPts === 1 ? '' : 's'}`;
	}
	const questionEl = document.getElementById('streakQuestionText');
	questionEl.textContent = problem.q;
	setPromptImage('streakQuestionImg', problem.qImg);
	typeset(questionEl);
	streakTimer.setDuration(problem.time || defaultStreakSeconds);
	streakTimer.toggle();
}

function renderStreakScreen() {
	populateStreakTeamSelector();
	const picker = document.getElementById('streakTeamPicker');
	const progress = document.getElementById('streakProgress');
	const questionWrap = document.getElementById('streakQuestionWrap');
	const decisionWrap = document.getElementById('streakDecisionWrap');
	const summary = document.getElementById('streakSummary');
	const startBtn = document.getElementById('streakStartBtn');

	if (picker) picker.style.display = streakState === 'idle' ? '' : 'none';
	if (startBtn) startBtn.disabled = false;

	if (streakState === 'idle') {
		if (progress) progress.textContent = 'Pick a team and hit Start Turn';
		if (questionWrap) questionWrap.style.display = 'none';
		if (decisionWrap) decisionWrap.style.display = 'none';
		if (summary) summary.style.display = 'none';
		return;
	}

	const team = teams.find((team) => team.id === streakTeamId);
	const teamLabel = team ? `<b style="color: ${team.color};">${escapeHtml(team.name)}</b>` : '';

	if (streakState === 'question') {
		if (progress) progress.innerHTML = `${teamLabel}'s turn in the spotlight`;
		if (questionWrap) questionWrap.style.display = '';
		if (decisionWrap) decisionWrap.style.display = 'none';
		if (summary) summary.style.display = 'none';
		renderStreakQuestion();
		return;
	}

	if (streakState === 'decision') {
		if (progress) progress.innerHTML = `${teamLabel}'s turn in the spotlight`;
		if (questionWrap) questionWrap.style.display = 'none';
		if (decisionWrap) decisionWrap.style.display = '';
		if (summary) summary.style.display = 'none';
		const vaultEl = document.getElementById('streakDecisionVault');
		const noteEl = document.getElementById('streakDecisionNote');
		const nextPts = pointsForStreakLevel(streakIndex + 1);
		if (vaultEl) vaultEl.textContent = `Vault: ${streakVault} pt${streakVault === 1 ? '' : 's'}`;
		if (noteEl) {
			noteEl.textContent = `Push for level ${streakIndex + 2} of ${streakPool.length}, worth ${nextPts} more — but a miss wipes the vault.`;
		}
		return;
	}

	if (questionWrap) questionWrap.style.display = 'none';
	if (decisionWrap) decisionWrap.style.display = 'none';
	if (progress) progress.textContent = '';
	if (summary) {
		summary.style.display = '';
		summary.innerHTML = renderStreakSummaryHtml();
	}
}

function renderStreakSummaryHtml() {
	const team = teams.find((team) => team.id === streakTeamId);
	if (!team) return `<button class="btn ghost" onclick="newStreakTurn()">Next Team</button>`;

	if (streakOutcome === 'bust') {
		return `
			<div class="summary-line">
				Busted! <b style="color: ${team.color};">${escapeHtml(team.name)}</b> loses the unbanked vault.
			</div>
			<div class="row-actions" style="justify-content: center;">
				<button class="btn ghost" onclick="newStreakTurn()">Next Team</button>
			</div>
		`;
	}

	const clearedLine =
		streakOutcome === 'cleared'
			? `Cleared the whole vault set! `
			: `Banked it. `;
	return `
		<div class="summary-line">
			${clearedLine}<b style="color: ${team.color};">${escapeHtml(team.name)}</b> locks in <b>${streakVault}</b> pt${streakVault === 1 ? '' : 's'}.
		</div>
		<div class="row-actions" style="justify-content: center;">
			<button
				class="btn primary"
				onclick="addScore('${team.id}', ${streakVault}, event); autosave(); this.disabled=true;"
			>
				Award ${streakVault} pt${streakVault === 1 ? '' : 's'}
			</button>
			<button class="btn ghost" onclick="newStreakTurn()">Next Team</button>
		</div>
	`;
}

function openStreakModal() {
	openQuestionManagerModal('Manage Streak Set', {
		fieldPrefix: 'newStreak',
		listId: 'customStreakList',
		addFnName: 'addCustomStreak',
		helpText:
			'Add problems in the order the streak should climb — the first one you add is level 1 (worth 1 pt), and each level after doubles in value. Longer sequences raise the ceiling, but also the risk of pushing too far.',
		hasTier: false,
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	streakImageFields.reset();
	renderCustomStreakList();
}

function addCustomStreak() {
	const timeInput = document.getElementById('newStreakTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time = timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newStreakQ').value.trim();
	const answer = document.getElementById('newStreakA').value.trim();
	const explanation = document.getElementById('newStreakE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customStreak.push({
		time: time,
		q: question,
		qImg: streakImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: streakImageFields.state.a || undefined,
	});
	document.getElementById('newStreakTime').value = '';
	document.getElementById('newStreakQ').value = '';
	document.getElementById('newStreakA').value = '';
	document.getElementById('newStreakE').value = '';
	streakImageFields.reset();
	renderCustomStreakList();
	autosave();
}

function deleteCustomStreak(i) {
	deleteCustomItem(customStreak, i, renderCustomStreakList);
}

function renderCustomStreakList() {
	renderCustomList('customStreakList', customStreak, (problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">
				<b>Level ${i + 1} · worth ${pointsForStreakLevel(i)} pt${pointsForStreakLevel(i) === 1 ? '' : 's'}</b>${problem.time ? ` · ${problem.time}s` : ''} — ${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomStreak(${i})">Delete</button>
		</div>
	`);
}