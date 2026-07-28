let customPointHeist = [];
let pointHeistPool = [];
let pointHeistIndex = 0;
let pointHeistResults = {};
let pointHeistActioned = {};
let vaultStart = 20;
let vaultTotal = 20;
let pullAmount = 2;
let raidAmount = 2;

const pointHeistTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'pointHeistTimerDisplay',
	toggleBtnId: 'pointHeistTimerToggle',
});
const defaultPointHeistSeconds = 90;

const pointHeistImageFields = createQAImageState({
	qWrap: 'newPointHeistQImgWrap',
	qFile: 'newPointHeistQImgFile',
	aWrap: 'newPointHeistAImgWrap',
	aFile: 'newPointHeistAImgFile',
});

function initPointHeist() {
	pointHeistPool = customPointHeist;
	renderPointHeistProblem();
}

function newHeist() {
	vaultTotal = vaultStart;
	pointHeistIndex = 0;
	pointHeistResults = {};
	pointHeistActioned = {};
	pointHeistTimer.reset();
	renderPointHeistProblem();
	autosave();
}

function nextPointHeistProblem() {
	pointHeistIndex++;
	pointHeistResults = {};
	pointHeistActioned = {};
	renderPointHeistProblem();
}

function togglePointHeistTimer() {
	pointHeistTimer.toggle();
}

function resetPointHeistTimer() {
	pointHeistTimer.reset();
}

function renderPointHeistProblem() {
	pointHeistPool = customPointHeist;
	const box = document.getElementById('pointHeistAnswerBox');
	if (box) box.classList.remove('show');

	if (pointHeistPool.length === 0) {
		document.getElementById('pointHeistProgress').textContent =
			'No questions yet';
		document.getElementById('pointHeistQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('pointHeistQuestionImg', null);
		pointHeistTimer.stop();
		renderPointHeistRoster();
		renderVaultDisplay();
		return;
	}

	const problem = pointHeistPool[pointHeistIndex % pointHeistPool.length];
	document.getElementById('pointHeistProgress').textContent =
		`Round ${(pointHeistIndex % pointHeistPool.length) + 1} of ${pointHeistPool.length}`;
	document.getElementById('pointHeistQuestionText').textContent = problem.q;
	setPromptImage('pointHeistQuestionImg', problem.qImg);
	typeset(document.getElementById('pointHeistQuestionText'));
	pointHeistTimer.setDuration(problem.time || defaultPointHeistSeconds);
	renderPointHeistRoster();
	renderVaultDisplay();
}

function revealPointHeistAnswer() {
	if (pointHeistPool.length === 0) return;
	pointHeistTimer.stop();
	const problem = pointHeistPool[pointHeistIndex % pointHeistPool.length];
	document.getElementById('pointHeistAnswerFigure').textContent = problem.a;
	setPromptImage('pointHeistAnswerImg', problem.aImg);
	document.getElementById('pointHeistAnswerReasoning').textContent =
		problem.e || '';
	const box = document.getElementById('pointHeistAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderVaultDisplay() {
	const el = document.getElementById('vaultAmountDisplay');
	if (el) el.textContent = vaultTotal;
}

function setPointHeistNumber(kind, val) {
	const floor = kind === 'vaultStart' ? 0 : 1;
	const n = Math.max(floor, parseInt(val, 10) || floor);
	if (kind === 'vaultStart') vaultStart = n;
	if (kind === 'pull') pullAmount = n;
	if (kind === 'raid') raidAmount = n;
	renderPointHeistRoster();
	autosave();
}

function restockVault() {
	vaultTotal = vaultStart;
	renderVaultDisplay();
	autosave();
}

function markPointHeistResult(teamId, result) {
	if (pointHeistActioned[teamId]) return;
	if (result === null) {
		delete pointHeistResults[teamId];
	} else {
		pointHeistResults[teamId] = result;
	}
	renderPointHeistRoster();
}

function pointHeistTakeVault(teamId, event) {
	if (pointHeistResults[teamId] !== 'correct' || pointHeistActioned[teamId])
		return;
	if (vaultTotal < pullAmount) {
		alert('Not enough left in the vault for that.');
		return;
	}
	vaultTotal -= pullAmount;
	addScore(teamId, pullAmount, event);
	pointHeistActioned[teamId] = { type: 'vault', amount: pullAmount };
	renderVaultDisplay();
	renderPointHeistRoster();
	autosave();
}

function pointHeistRaid(teamId, targetId, event) {
	if (pointHeistResults[teamId] !== 'correct' || pointHeistActioned[teamId])
		return;
	if (!targetId || targetId === teamId) return;
	addScore(teamId, raidAmount, event);
	addScore(targetId, -raidAmount);
	pointHeistActioned[teamId] = { type: 'raid', targetId, amount: raidAmount };
	renderPointHeistRoster();
	autosave();
}

function renderPointHeistRoster() {
	const wrap = document.getElementById('pointHeistRoster');
	if (!wrap) return;

	wrap.innerHTML = teams.map((team) => renderPointHeistTeamRow(team)).join('');
}

function renderPointHeistTeamRow(team) {
	const result = pointHeistResults[team.id];
	const action = pointHeistActioned[team.id];

	if (action) {
		const label =
			action.type === 'vault'
				? `Pulled ${action.amount} from the vault`
				: `Raided ${action.amount} from ${escapeHtml((teams.find((t) => t.id === action.targetId) || {}).name || 'a team')}`;
		return `
			<div class="team-group" style="border-left-color: ${team.color};">
				<span class="team-name">${escapeHtml(team.name)}</span>
				<span style="font-size: 12.5px; color: var(--chalk-muted);">${label}</span>
			</div>
		`;
	}

	if (result === 'correct') {
		const otherTeams = teams.filter((t) => t.id !== team.id);
		const raidOptions = otherTeams
			.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
			.join('');
		return `
			<div class="team-group" style="border-left-color: ${team.color};">
				<span class="team-name">${escapeHtml(team.name)}</span>
				<div class="team-btns">
					<button
						class="btn small award-btn"
						style="border-color: ${team.color};"
						onclick="pointHeistTakeVault('${team.id}', event)"
					>
						Pull ${pullAmount} from Vault
					</button>
					${
						otherTeams.length
							? `
								<select class="target-select mono" id="pointHeistRaidSelect-${team.id}">
									${raidOptions}
								</select>
								<button
									class="btn small award-btn"
									style="border-color: ${team.color};"
									onclick="pointHeistRaid('${team.id}', document.getElementById('pointHeistRaidSelect-${team.id}').value, event)"
								>
									Raid ${raidAmount}
								</button>
							`
							: ''
					}
					<button class="btn small ghost" onclick="markPointHeistResult('${team.id}', null)">Undo</button>
				</div>
			</div>
		`;
	}

	if (result === 'wrong') {
		return `
			<div class="team-group" style="border-left-color: ${team.color}; opacity: 0.6;">
				<span class="team-name">${escapeHtml(team.name)} — missed it</span>
				<button class="btn small ghost" onclick="markPointHeistResult('${team.id}', null)">Undo</button>
			</div>
		`;
	}

	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markPointHeistResult('${team.id}', 'wrong')"
				>
					${iconCross()}Wrong
				</button>
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markPointHeistResult('${team.id}', 'correct')"
				>
					${iconCheck()}Correct
				</button>
			</div>
		</div>
	`;
}

function openPointHeistModal() {
	openQuestionManagerModal('Manage Point Heist Questions', {
		fieldPrefix: 'newPointHeist',
		listId: 'customPointHeistList',
		addFnName: 'addCustomPointHeist',
		helpText:
			'These feed the shared pool every team answers at once on whiteboards. A correct answer lets a team choose to pull from the shared vault or raid another team, live in-app.',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	pointHeistImageFields.reset();
	renderCustomPointHeistList();
}

function addCustomPointHeist() {
	const timeInput = document.getElementById('newPointHeistTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newPointHeistQ').value.trim();
	const answer = document.getElementById('newPointHeistA').value.trim();
	const explanation = document.getElementById('newPointHeistE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customPointHeist.push({
		time: time,
		q: question,
		qImg: pointHeistImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: pointHeistImageFields.state.a || undefined,
	});
	document.getElementById('newPointHeistTime').value = '';
	document.getElementById('newPointHeistQ').value = '';
	document.getElementById('newPointHeistA').value = '';
	document.getElementById('newPointHeistE').value = '';
	pointHeistImageFields.reset();
	renderCustomPointHeistList();
	autosave();
}

function deleteCustomPointHeist(i) {
	deleteCustomItem(customPointHeist, i, renderCustomPointHeistList);
}

function renderCustomPointHeistList() {
	renderCustomList(
		'customPointHeistList',
		customPointHeist,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomPointHeist(${i})">Delete</button>
		</div>
	`,
	);
}
