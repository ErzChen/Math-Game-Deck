let customStreak = [];
let streakPool = [];
let streakState = 'idle';
let streakTeamId = null;
let streakIndex = 0;
let streakVault = 0;
let streakOutcome = null;

const streakLevelCount = 5;

const streakTierNames = {
	1: 'Tier 1 · Warm-up',
	2: 'Tier 2 · Building',
	3: 'Tier 3 · Push',
	4: 'Tier 4 · Frontier',
	5: 'Tier 5 · Peak',
};

const streakTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'streakTimerDisplay',
	toggleBtnId: 'streakTimerToggle',
});
const defaultStreakSeconds = 90;

const streakImageFields = createQAImageState({
	qWrap: 'newStreakQImgWrap',
	qFile: 'newStreakQImgFile',
	aWrap: 'newStreakAImgWrap',
	aFile: 'newStreakAImgFile',
});

function initStreak() {
	// migrate any pre-existing questions (no tier) into Tier 1 so nothing is lost
	customStreak = customStreak.map((problem) =>
		problem && !problem.tier ? { ...problem, tier: 1 } : problem,
	);
	newStreakTurn();
}

function pointsForStreakLevel(i) {
	return Math.pow(2, i);
}

// Builds one 5-question streak: a single random question from each tier 1-5.
// Returns null if any tier has zero questions stocked.
function buildStreakPool() {
	const byTier = { 1: [], 2: [], 3: [], 4: [], 5: [] };
	customStreak.forEach((problem) => {
		if (byTier[problem.tier]) byTier[problem.tier].push(problem);
	});
	const pool = [];
	for (let tier = 1; tier <= streakLevelCount; tier++) {
		const available = byTier[tier];
		if (!available || available.length === 0) return null;
		const pick = available[Math.floor(Math.random() * available.length)];
		pool.push({ ...pick, tier });
	}
	return pool;
}

function newStreakTurn() {
	streakState = 'idle';
	streakTeamId = null;
	streakIndex = 0;
	streakVault = 0;
	streakOutcome = null;
	streakPool = [];
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
	const pool = buildStreakPool();
	if (!pool) {
		alert(
			`Every one of the ${streakLevelCount} tiers needs at least one question first, via "Manage Streak Set".`,
		);
		return;
	}
	const select = document.getElementById('streakTeamSelect');
	if (!select || !select.value) {
		alert('Pick a team first.');
		return;
	}
	streakPool = pool;
	streakTeamId = select.value;
	streakIndex = 0;
	streakVault = 0;
	streakOutcome = null;
	streakState = 'question';
	renderStreakScreen();
}

function revealStreakAnswer() {
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

function toggleStreakTimer() {
	streakTimer.toggle();
}

function resetStreakTimer() {
	streakTimer.reset();
}

function renderStreakQuestion() {
	const badge = document.getElementById('streakLevelBadge');
	const box = document.getElementById('streakAnswerBox');
	const controls = document.getElementById('streakJudgeControls');
	if (box) box.classList.remove('show');
	if (controls) controls.style.display = 'none';

	if (streakPool.length === 0 || streakIndex >= streakPool.length) return;

	const problem = streakPool[streakIndex];
	const levelPts = pointsForStreakLevel(streakIndex);
	if (badge) {
		badge.textContent = `${streakTierNames[problem.tier] || 'Level ' + (streakIndex + 1)} · Level ${streakIndex + 1} of ${streakPool.length} · worth ${levelPts} pt${levelPts === 1 ? '' : 's'}`;
		badge.className = 'tier-badge t' + problem.tier;
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
		if (progress) {
			progress.textContent = `Pick a team and hit Start Turn — each turn draws a fresh streak of ${streakLevelCount} problems, one per tier`;
		}
		if (questionWrap) questionWrap.style.display = 'none';
		if (decisionWrap) decisionWrap.style.display = 'none';
		if (summary) summary.style.display = 'none';
		return;
	}

	const team = teams.find((team) => team.id === streakTeamId);
	const teamLabel = team
		? `<b style="color: ${team.color};">${escapeHtml(team.name)}</b>`
		: '';

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
		const nextProblem = streakPool[streakIndex + 1];
		const nextTierLabel = nextProblem
			? streakTierNames[nextProblem.tier] || `Tier ${nextProblem.tier}`
			: '';
		if (vaultEl)
			vaultEl.textContent = `Vault: ${streakVault} pt${streakVault === 1 ? '' : 's'}`;
		if (noteEl) {
			noteEl.textContent = `Push for level ${streakIndex + 2} of ${streakPool.length} (${nextTierLabel}), worth ${nextPts} more, but a miss wipes the vault.`;
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
	if (!team)
		return `<button class="btn ghost" onclick="newStreakTurn()">Next Team</button>`;

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
		streakOutcome === 'cleared' ? `Cleared the whole streak! ` : `Banked it. `;
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
		helpText: `Each team's turn draws a fresh streak of ${streakLevelCount} problems, one randomly picked from each tier, so difficulty always rises tier by tier as they push their luck. Stock at least one question per tier (extras per tier just add variety between turns) — tier 1 is worth 1 pt, doubling each tier after.`,
		hasTier: true,
		tierLabel: 'Tier (1 = easiest, 5 = hardest)',
		tierPlaceholder: 'e.g. 3',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	streakImageFields.reset();
	const list = document.getElementById('customStreakList');
	if (list && !document.getElementById('streakTierSummary')) {
		list.insertAdjacentHTML(
			'beforebegin',
			'<div id="streakTierSummary" class="pyramid-tier-summary"></div>',
		);
	}
	renderCustomStreakList();
}

function addCustomStreak() {
	const tier = Math.max(
		1,
		Math.min(
			streakLevelCount,
			parseInt(document.getElementById('newStreakTier').value, 10) || 1,
		),
	);
	const timeInput = document.getElementById('newStreakTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newStreakQ').value.trim();
	const answer = document.getElementById('newStreakA').value.trim();
	const explanation = document.getElementById('newStreakE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customStreak.push({
		tier: tier,
		time: time,
		q: question,
		qImg: streakImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: streakImageFields.state.a || undefined,
	});
	document.getElementById('newStreakTier').value = '';
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

function streakTierCounts() {
	const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	customStreak.forEach((problem) => {
		if (counts[problem.tier] !== undefined) counts[problem.tier]++;
	});
	return counts;
}

function renderStreakTierSummary() {
	const summary = document.getElementById('streakTierSummary');
	if (!summary) return;
	const counts = streakTierCounts();
	summary.innerHTML = [1, 2, 3, 4, 5]
		.map((tier) => {
			const have = counts[tier];
			const ok = have >= 1;
			return `<span class="pyramid-tier-chip t${tier} ${ok ? 'ok' : 'short'}">${streakTierNames[tier]}: ${have}</span>`;
		})
		.join('');
}

function renderCustomStreakList() {
	renderStreakTierSummary();
	const sorted = customStreak
		.map((problem, i) => ({ ...problem, _i: i }))
		.sort((a, b) => a.tier - b.tier);
	renderCustomList(
		'customStreakList',
		sorted,
		(problem) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">
				<b>Tier ${problem.tier} · worth ${pointsForStreakLevel(problem.tier - 1)} pt${pointsForStreakLevel(problem.tier - 1) === 1 ? '' : 's'}</b>${problem.time ? ` · ${problem.time}s` : ''} — ${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomStreak(${problem._i})">Delete</button>
		</div>
	`,
	);
}