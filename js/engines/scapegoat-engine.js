let customScapegoat = [];
let scapegoatPool = [];
let scapegoatIndex = 0;
let scapegoatNominations = {};
let scapegoatResults = {};
let scapegoatResolved = false;
const defaultScapegoatSeconds = 90;

const scapegoatTimer = createCountdownTimer({
	seconds: defaultScapegoatSeconds,
	displayId: 'scapegoatTimerDisplay',
	toggleBtnId: 'scapegoatTimerToggle',
});

const scapegoatImageFields = createQAImageState({
	qWrap: 'newScapegoatQImgWrap',
	qFile: 'newScapegoatQImgFile',
	aWrap: 'newScapegoatAImgWrap',
	aFile: 'newScapegoatAImgFile',
});

function initScapegoat() {
	resetScapegoat();
}

function resetScapegoat() {
	scapegoatPool = customScapegoat;
	scapegoatIndex = 0;
	scapegoatNominations = {};
	scapegoatResults = {};
	scapegoatResolved = false;
	renderScapegoatProblem();
}

function nextScapegoatProblem() {
	scapegoatIndex++;
	scapegoatNominations = {};
	scapegoatResults = {};
	scapegoatResolved = false;
	renderScapegoatProblem();
}

function toggleScapegoatTimer() {
	scapegoatTimer.toggle();
}

function resetScapegoatTimer() {
	scapegoatTimer.reset();
}

function renderScapegoatProblem() {
	scapegoatPool = customScapegoat;
	const box = document.getElementById('scapegoatAnswerBox');
	if (box) box.classList.remove('show');

	if (scapegoatPool.length === 0) {
		document.getElementById('scapegoatProgress').textContent = 'No questions yet';
		document.getElementById('scapegoatQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('scapegoatQuestionImg', null);
		scapegoatTimer.stop();
		renderScapegoatRoster();
		return;
	}

	const problem = scapegoatPool[scapegoatIndex % scapegoatPool.length];
	document.getElementById('scapegoatProgress').textContent =
		`Round ${(scapegoatIndex % scapegoatPool.length) + 1} of ${scapegoatPool.length}`;
	document.getElementById('scapegoatQuestionText').textContent = problem.q;
	setPromptImage('scapegoatQuestionImg', problem.qImg);
	typeset(document.getElementById('scapegoatQuestionText'));
	scapegoatTimer.setDuration(problem.time || defaultScapegoatSeconds);
	renderScapegoatRoster();
}

function revealScapegoatAnswer() {
	if (scapegoatPool.length === 0) return;
	scapegoatTimer.stop();
	const problem = scapegoatPool[scapegoatIndex % scapegoatPool.length];
	document.getElementById('scapegoatAnswerFigure').textContent = problem.a;
	setPromptImage('scapegoatAnswerImg', problem.aImg);
	document.getElementById('scapegoatAnswerReasoning').textContent =
		problem.e || '';
	const box = document.getElementById('scapegoatAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function setScapegoatNomination(teamId, targetId) {
	if (scapegoatResolved) return;
	if (!targetId) {
		delete scapegoatNominations[teamId];
	} else {
		scapegoatNominations[teamId] = targetId;
	}
	autosave();
}

function markScapegoatResult(teamId, result) {
	if (scapegoatResolved) return;
	scapegoatResults[teamId] =
		scapegoatResults[teamId] === result ? undefined : result;
	if (scapegoatResults[teamId] === undefined) delete scapegoatResults[teamId];
	renderScapegoatRoster();
}

function resolveScapegoatRound() {
	if (scapegoatPool.length === 0 || scapegoatResolved) return;
	if (teams.some((team) => !scapegoatResults[team.id])) {
		alert('Mark every team Correct or Wrong before resolving the round.');
		return;
	}

	const snapshotScores = {};
	teams.forEach((team) => (snapshotScores[team.id] = team.score));

	teams.forEach((team) => {
		if (scapegoatResults[team.id] === 'correct') addScore(team.id, 1);
	});

	teams.forEach((team) => {
		const targetId = scapegoatNominations[team.id];
		if (!targetId || targetId === team.id) return;
		if (scapegoatResults[targetId] !== 'wrong') return;
		const stolen = Math.floor((snapshotScores[targetId] || 0) / 2);
		if (stolen <= 0) return;
		addScore(team.id, stolen);
		addScore(targetId, -stolen);
	});

	scapegoatResolved = true;
	autosave();
	renderScapegoatRoster();
}

function renderScapegoatRoster() {
	const wrap = document.getElementById('scapegoatRoster');
	if (!wrap) return;

	if (scapegoatPool.length === 0) {
		wrap.innerHTML = '';
		return;
	}

	wrap.innerHTML = teams.map((team) => renderScapegoatTeamRow(team)).join('');
}

function renderScapegoatTeamRow(team) {
	const nominationOptions = teams
		.filter((t) => t.id !== team.id)
		.map(
			(t) =>
				`<option value="${t.id}" ${scapegoatNominations[team.id] === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`,
		)
		.join('');

	const result = scapegoatResults[team.id];

	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				<select
					class="inline-select mono"
					onchange="setScapegoatNomination('${team.id}', this.value)"
					${scapegoatResolved ? 'disabled' : ''}
				>
					<option value="">Scapegoat: none</option>
					${nominationOptions}
				</select>
				<button
					class="btn small award-btn ${result === 'wrong' ? 'wrong-active' : ''}"
					style="border-color: ${team.color};"
					onclick="markScapegoatResult('${team.id}', 'wrong')"
					${scapegoatResolved ? 'disabled' : ''}
				>
					${iconCross()}Wrong
				</button>
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markScapegoatResult('${team.id}', 'correct')"
					${scapegoatResolved ? 'disabled' : ''}
				>
					${iconCheck()}Correct
				</button>
			</div>
		</div>
	`;
}

function openScapegoatModal() {
	openQuestionManagerModal('Manage Scapegoat Questions', {
		fieldPrefix: 'newScapegoat',
		listId: 'customScapegoatList',
		addFnName: 'addCustomScapegoat',
		helpText:
			'These feed the shared pool every team answers at once on whiteboards. Scapegoat nominations and correct/wrong marks happen live in-app, right below the question, each round.',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	scapegoatImageFields.reset();
	renderCustomScapegoatList();
}

function addCustomScapegoat() {
	const timeInput = document.getElementById('newScapegoatTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newScapegoatQ').value.trim();
	const answer = document.getElementById('newScapegoatA').value.trim();
	const explanation = document.getElementById('newScapegoatE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customScapegoat.push({
		time: time,
		q: question,
		qImg: scapegoatImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: scapegoatImageFields.state.a || undefined,
	});
	document.getElementById('newScapegoatTime').value = '';
	document.getElementById('newScapegoatQ').value = '';
	document.getElementById('newScapegoatA').value = '';
	document.getElementById('newScapegoatE').value = '';
	scapegoatImageFields.reset();
	renderCustomScapegoatList();
	autosave();
}

function deleteCustomScapegoat(i) {
	deleteCustomItem(customScapegoat, i, renderCustomScapegoatList);
}

function renderCustomScapegoatList() {
	renderCustomList(
		'customScapegoatList',
		customScapegoat,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomScapegoat(${i})">Delete</button>
		</div>
	`,
	);
}
