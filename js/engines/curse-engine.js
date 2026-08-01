let customCurse = [];
let customCurses = [
	'Silence — no talking to teammates while solving',
	'One-Handed — only one player may hold the marker',
	"Blindfold — can't look at the screen, the problem must be read aloud",
	'Non-Dominant Hand — must write with your non-dominant hand',
	"25% Off — this round's time limit is cut by a quarter",
];
let cursePool = [];
let curseIndex = 0;
let curseSolvedBy = null;
let curseStage = 'question';
let curseDrawnCard = null;
let curseSkipped = false;
let activeCurse = null;
let pendingCurse = null;

const defaultCurseSeconds = 90;
const curseTimer = createCountdownTimer({
	seconds: defaultCurseSeconds,
	displayId: 'curseTimerDisplay',
	toggleBtnId: 'curseTimerToggle',
});
const curseNormalTimer = createCountdownTimer({
	seconds: defaultCurseSeconds,
	displayId: 'curseNormalTimerDisplay',
});

const curseImageFields = createQAImageState({
	qWrap: 'newCurseQImgWrap',
	qFile: 'newCurseQImgFile',
	aWrap: 'newCurseAImgWrap',
	aFile: 'newCurseAImgFile',
});

function initCurse() {
	resetCurse();
}

function resetCurse() {
	cursePool = customCurse;
	curseIndex = 0;
	curseSolvedBy = null;
	curseStage = 'question';
	curseDrawnCard = null;
	curseSkipped = false;
	activeCurse = null;
	pendingCurse = null;
	renderCurseScreen();
}

function nextCurseProblem() {
	activeCurse = pendingCurse;
	pendingCurse = null;
	curseSolvedBy = null;
	curseStage = 'question';
	curseDrawnCard = null;
	curseSkipped = false;
	curseIndex++;
	renderCurseScreen();
}

function toggleCurseTimer() {
	curseTimer.toggle();
	if (isTimeCutCurse(activeCurse && activeCurse.curse)) {
		curseNormalTimer.toggle();
	}
}

function resetCurseTimer() {
	curseTimer.reset();
	curseNormalTimer.reset();
}

function isTimeCutCurse(curse) {
	return !!curse && /25%/.test(curse);
}

function renderCurseScreen() {
	cursePool = customCurse;
	const badgeWrap = document.getElementById('curseBadgeWrap');
	const box = document.getElementById('curseAnswerBox');
	if (box) box.classList.remove('show');

	if (cursePool.length === 0) {
		document.getElementById('curseProgress').textContent = 'No questions yet';
		document.getElementById('curseQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('curseQuestionImg', null);
		if (badgeWrap) badgeWrap.innerHTML = '';
		curseTimer.stop();
		curseNormalTimer.stop();
		renderCurseTeamPanel();
		return;
	}

	const problem = cursePool[curseIndex % cursePool.length];
	document.getElementById('curseProgress').textContent =
		`Problem ${(curseIndex % cursePool.length) + 1} of ${cursePool.length}`;
	document.getElementById('curseQuestionText').textContent = problem.q;
	setPromptImage('curseQuestionImg', problem.qImg);
	typeset(document.getElementById('curseQuestionText'));

	if (badgeWrap) {
		if (activeCurse) {
			const team = teams.find((t) => t.id === activeCurse.teamId);
			badgeWrap.innerHTML = team
				? `<div class="t-badge" style="color: ${team.color}; border-color: ${team.color};">${escapeHtml(team.name)} is cursed: ${escapeHtml(activeCurse.curse)}</div>`
				: '';
		} else {
			badgeWrap.innerHTML = '';
		}
	}

	const base = problem.time || defaultCurseSeconds;
	const isCut = isTimeCutCurse(activeCurse && activeCurse.curse);
	const duration = isCut ? Math.max(1, Math.round(base * 0.75)) : base;
	curseTimer.setDuration(duration);

	const normalWrap = document.getElementById('curseNormalTimerWrap');
	const label = document.getElementById('curseTimerLabel');
	if (normalWrap) normalWrap.style.display = isCut ? '' : 'none';
	if (label) label.textContent = isCut ? 'Cursed time (−25%)' : 'Time';
	if (isCut) {
		curseNormalTimer.setDuration(base);
	} else {
		curseNormalTimer.reset();
	}

	renderCurseTeamPanel();
}

function revealCurseAnswer() {
	if (cursePool.length === 0) return;
	curseTimer.stop();
	const problem = cursePool[curseIndex % cursePool.length];
	document.getElementById('curseAnswerFigure').textContent = problem.a;
	setPromptImage('curseAnswerImg', problem.aImg);
	document.getElementById('curseAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('curseAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderCurseTeamPanel() {
	const wrap = document.getElementById('curseTeamButtons');
	if (!wrap) return;
	if (curseStage === 'question' && !curseSolvedBy) {
		wrap.innerHTML = teams.map((team) => renderCurseTeamRow(team)).join('');
		return;
	}
	wrap.innerHTML = renderCurseDrawPanel();
}

function renderCurseTeamRow(team) {
	const cursedTag =
		activeCurse && activeCurse.teamId === team.id
			? '<span class="status-tag">Cursed</span>'
			: '';
	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)} ${cursedTag}</span>
			<div class="team-btns">
				<button class="btn small award-btn" style="border-color: ${team.color};" onclick="markCurseCorrect('${team.id}')">
					${iconCheck()}Correct +1
				</button>
			</div>
		</div>
	`;
}

function markCurseCorrect(teamId) {
	if (curseSolvedBy) return;
	const team = teams.find((team) => team.id === teamId);
	if (!team) return;
	curseTimer.stop();
	addScore(teamId, 1);
	if (activeCurse && activeCurse.teamId === teamId) {
		addScore(teamId, 1);
	}
	curseSolvedBy = teamId;
	curseStage = 'draw';
	autosave();
	renderCurseTeamPanel();
}

function renderCurseDrawPanel() {
	const solver = teams.find((t) => t.id === curseSolvedBy);
	const solverLabel = solver
		? `<b style="color: ${solver.color};">${escapeHtml(solver.name)}</b>`
		: 'The winning team';

	if (customCurses.length === 0 || teams.length < 2) {
		return `<div class="summary-line middle">Hit "Next Problem" to continue.</div>`;
	}

	if (curseSkipped) {
		return `<div class="summary-line middle">No curse assigned this round. Hit "Next Problem" to continue.</div>`;
	}

	if (pendingCurse) {
		const target = teams.find((t) => t.id === pendingCurse.teamId);
		const targetLabel = target
			? `<b style="color: ${target.color};">${escapeHtml(target.name)}</b>`
			: 'the chosen team';
		return `
			<div class="summary-line middle">${solverLabel} got it and drew:</div>
			${renderCurseCardHtml(pendingCurse.curse)}
			<div class="summary-line middle">Curse assigned to ${targetLabel}, takes effect next round. Hit "Next Problem" to continue.</div>
		`;
	}

	if (!curseDrawnCard) {
		return `
			<div class="summary-line middle">${solverLabel} got it! They may draw a curse to place on another team.</div>
			<div class="row-actions middle">
				<button class="btn primary" onclick="drawCurseCard()">Draw Curse Card</button>
				<button class="btn ghost" onclick="skipCurseAssignment()">Skip, no curse this round</button>
			</div>
		`;
	}

	const options = teams
		.filter((team) => team.id !== curseSolvedBy)
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');

	return `
		${renderCurseCardHtml(curseDrawnCard)}
		<div class="team-picker middle">
			<select id="curseTargetSelect">${options}</select>
			<button class="btn primary" onclick="assignCurseCard()">Assign Curse</button>
		</div>
	`;
}

function renderCurseCardHtml(curseText) {
	return `
		<div class="curse-card-wrap">
			<div class="curse-card">
				<div class="curse-card-icon">☠</div>
				<div class="curse-card-title">Curse Card</div>
				<div class="curse-card-text">${escapeHtml(curseText)}</div>
			</div>
		</div>
	`;
}
function drawCurseCard() {
	if (customCurses.length === 0) return;
	curseDrawnCard = customCurses[Math.floor(Math.random() * customCurses.length)];
	renderCurseTeamPanel();
	openCurseFlipModal(curseDrawnCard);
}

function openCurseFlipModal(curseText) {
	const overlay = document.getElementById('curseFlipOverlay');
	const card = document.getElementById('curseFlipCard');
	const textEl = document.getElementById('curseFlipText');
	const continueBtn = document.getElementById('curseFlipContinueBtn');
	if (!overlay || !card || !textEl) return;

	textEl.textContent = curseText;
	card.classList.remove('flipped');
	if (continueBtn) continueBtn.classList.remove('show');
	overlay.classList.add('open');

	card.style.animation = 'none';
	void card.offsetWidth;
	card.style.animation = '';

	setTimeout(() => card.classList.add('flipped'), 450);
	setTimeout(() => {
		if (continueBtn) continueBtn.classList.add('show');
	}, 450 + 700);
}

function closeCurseFlipModal() {
	const overlay = document.getElementById('curseFlipOverlay');
	if (overlay) overlay.classList.remove('open');
}

function assignCurseCard() {
	const select = document.getElementById('curseTargetSelect');
	if (!select || !select.value || !curseDrawnCard) return;
	pendingCurse = { teamId: select.value, curse: curseDrawnCard };
	renderCurseTeamPanel();
	autosave();
}

function skipCurseAssignment() {
	pendingCurse = null;
	curseDrawnCard = null;
	curseSkipped = true;
	renderCurseTeamPanel();
}

function openCurseModal() {
	openQuestionManagerModal('Manage Curse Card Questions', {
		fieldPrefix: 'newCurse',
		listId: 'customCurseList',
		addFnName: 'addCustomCurse',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	curseImageFields.reset();
	renderCustomCurseList();
}

function addCustomCurse() {
	const timeInput = document.getElementById('newCurseTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newCurseQ').value.trim();
	const answer = document.getElementById('newCurseA').value.trim();
	const explanation = document.getElementById('newCurseE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customCurse.push({
		time: time,
		q: question,
		qImg: curseImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: curseImageFields.state.a || undefined,
	});
	document.getElementById('newCurseTime').value = '';
	document.getElementById('newCurseQ').value = '';
	document.getElementById('newCurseA').value = '';
	document.getElementById('newCurseE').value = '';
	curseImageFields.reset();
	renderCustomCurseList();
	autosave();
}

function deleteCustomCurse(i) {
	deleteCustomItem(customCurse, i, renderCustomCurseList);
}

function renderCustomCurseList() {
	renderCustomList(
		'customCurseList',
		customCurse,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomCurse(${i})">Delete</button>
		</div>
	`,
	);
}

function openCursesModal() {
	openModal(
		'Manage Curses',
		`
			<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">
				This is the pool of curse cards drawn after a correct answer. Edit the wording or
				add your own. Cards mentioning "25%" automatically cut the next round's timer by
				a quarter for the whole room.
			</div>
			<div class="field-label">New curse</div>
			<input type="text" id="newCurseEffect" placeholder="e.g. Silence — no talking to teammates" />
			<button class="btn primary" style="margin-top: 12px;" onclick="addCurseEffect()">Add Curse</button>
			<div class="field-label" style="margin-top: 22px;">Current curses</div>
			<div id="customCursesList"></div>
		`,
	);
	renderCursesList();
}

function addCurseEffect() {
	const input = document.getElementById('newCurseEffect');
	const val = input.value.trim();
	if (!val) return;
	customCurses.push(val);
	input.value = '';
	renderCursesList();
	autosave();
}

function deleteCurseEffect(i) {
	customCurses.splice(i, 1);
	renderCursesList();
	autosave();
}

function renderCursesList() {
	renderCustomList(
		'customCursesList',
		customCurses,
		(curse, i) => `
		<div class="custom-list-item">
			<div class="txt">${escapeHtml(curse)}</div>
			<button class="btn small ghost" onclick="deleteCurseEffect(${i})">Delete</button>
		</div>
	`,
	);
}
