let customSwapPairs = [];
let swapPool = [];
let swapIndex = 0;
let swapTokens = {};
let swapChoice = {};
let swapLocked = false;

const swapStartTokens = 3;
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
	ensureSwapTeams(true);
	renderSwapScreen();
}

function ensureSwapTeams(resetChoices) {
	teams.forEach((team) => {
		if (swapTokens[team.id] === undefined) swapTokens[team.id] = swapStartTokens;
		if (resetChoices || swapChoice[team.id] === undefined) swapChoice[team.id] = 'hard';
	});
}

function nextSwapProblem() {
	swapPool = customSwapPairs;
	swapIndex++;
	swapLocked = false;
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

function toggleSwapChoice(teamId) {
	if (swapLocked) return;
	const current = swapChoice[teamId] || 'hard';
	if (current === 'hard') {
		if ((swapTokens[teamId] || 0) <= 0) {
			alert('This team is out of swap tokens.');
			return;
		}
		swapChoice[teamId] = 'backup';
	} else {
		swapChoice[teamId] = 'hard';
	}
	renderSwapRoster();
}

function lockSwapsAndStart() {
	swapPool = customSwapPairs;
	if (swapPool.length === 0) {
		alert('Add a problem pair first via "Manage Problem Pairs".');
		return;
	}
	teams.forEach((team) => {
		if (swapChoice[team.id] === 'backup') {
			swapTokens[team.id] = Math.max(0, (swapTokens[team.id] || 0) - 1);
		}
	});
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
	document.getElementById('swapHardAnswerReasoning').textContent = pair.hardE || '';
	const hardBox = document.getElementById('swapHardAnswerBox');
	hardBox.classList.add('show');
	typeset(hardBox);

	document.getElementById('swapBackAnswerFigure').textContent = pair.backA;
	setPromptImage('swapBackAnswerImg', pair.backAImg);
	document.getElementById('swapBackAnswerReasoning').textContent = pair.backE || '';
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

	wrap.innerHTML = teams
		.map((team) => {
			const choice = swapChoice[team.id] || 'hard';
			const tokens = swapTokens[team.id] !== undefined ? swapTokens[team.id] : swapStartTokens;
			const pts = choice === 'backup' ? 1 : 3;

			const actionHtml = swapLocked
				? `
					<button 
						class="btn small ${choice === 'backup' ? 'ghost' : ''} award-btn" 
						style="border-color: ${team.color};"
					>
						${choice === 'backup' ? 'Backup locked in' : 'Hard problem locked in'}
					</button>
				` : `
					<button 
						class="btn small ${choice === 'backup' ? 'ghost' : ''} award-btn" 
						style="border-color: ${team.color};"
						onclick="toggleSwapChoice('${team.id}')"
					>
						${choice === 'backup' ? 'Use Hard Problem' : `Swap for Backup (${tokens} left)`}
					</button>
				`;

			return `
				<div class="team-group" style="border-left-color: ${team.color};">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<div class="team-btns">
						${actionHtml}
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
		})
		.join('');
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
				Each pair has a harder problem (worth 3 pts) and an easier backup (worth 1 pt) that
				a team can trade into using one swap token, before the timer starts.
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
				Easier Backup (1 pt)
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
	const time = timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const hardQ = document.getElementById('newSwapHardQ').value.trim();
	const hardA = document.getElementById('newSwapHardA').value.trim();
	const hardE = document.getElementById('newSwapHardE').value.trim();
	const backQ = document.getElementById('newSwapBackQ').value.trim();
	const backA = document.getElementById('newSwapBackA').value.trim();
	const backE = document.getElementById('newSwapBackE').value.trim();

	if (!hardQ || !hardA || !backQ || !backA) {
		alert('Enter a question and answer for both the hard problem and the backup.');
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

	['newSwapTime', 'newSwapHardQ', 'newSwapHardA', 'newSwapHardE', 'newSwapBackQ', 'newSwapBackA', 'newSwapBackE'].forEach(
		(id) => {
			document.getElementById(id).value = '';
		},
	);
	swapHardImageFields.reset();
	swapBackupImageFields.reset();
	renderCustomSwapList();
	autosave();
}

function deleteCustomSwapPair(i) {
	deleteCustomItem(customSwapPairs, i, renderCustomSwapList);
}

function renderCustomSwapList() {
	renderCustomList('customSwapList', customSwapPairs, (pair, i) => `
		<div class="custom-list-item">
			${pair.hardQImg || pair.backQImg ? `<img class="thumb" src="${pair.hardQImg || pair.backQImg}" alt="" />` : ''}
			<div class="txt">
				${pair.time ? `<b>${pair.time}s</b><br>` : ''}
				<b>Hard:</b> ${escapeHtml(pair.hardQ)} → ${escapeHtml(pair.hardA)}<br>
				<b>Backup:</b> ${escapeHtml(pair.backQ)} → ${escapeHtml(pair.backA)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomSwapPair(${i})">Delete</button>
		</div>
	`);
}