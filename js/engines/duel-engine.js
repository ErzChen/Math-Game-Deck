let customDuel = [];
let duelPool = [];
let duelIndex = 0;

const duelImageFields = createQAImageState({
	qWrap: 'newDuelQImgWrap',
	qFile: 'newDuelQImgFile',
	aWrap: 'newDuelAImgWrap',
	aFile: 'newDuelAImgFile',
});

function initDuel() {
	populateDuelTeamSelectors();
	renderDuelProblem();
	renderDuelAwardButtons();
}

function populateDuelTeamSelectors() {
	const selectA = document.getElementById('duelTeamA');
	const selectB = document.getElementById('duelTeamB');
	if (!selectA || !selectB) return;
	const prevA = selectA.value;
	const prevB = selectB.value;
	const opts = teams
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');
	selectA.innerHTML = opts;
	selectB.innerHTML = opts;
	if (teams.find((team) => team.id === prevA)) selectA.value = prevA;
	if (teams.length > 1) {
		const secondId = teams.find((team) => team.id !== selectA.value);
		if (teams.find((team) => team.id === prevB) && prevB !== selectA.value) {
			selectB.value = prevB;
		} else if (secondId) {
			selectB.value = secondId.id;
		}
	}
}

function nextDuelProblem() {
	duelIndex++;
	renderDuelProblem();
}

function renderDuelProblem() {
	duelPool = customDuel;
	const box = document.getElementById('duelAnswerBox');
	box.classList.remove('show');
	if (duelPool.length === 0) {
		document.getElementById('duelProgress').textContent = 'No questions yet';
		document.getElementById('duelQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		return;
	}
	const problem = duelPool[duelIndex % duelPool.length];
	document.getElementById('duelProgress').textContent =
		`Problem ${(duelIndex % duelPool.length) + 1} of ${duelPool.length}`;
	document.getElementById('duelQuestionText').textContent = problem.q;
	setPromptImage('duelQuestionImg', problem.qImg);
	typeset(document.getElementById('duelQuestionText'));
}

function revealDuelAnswer() {
	if (duelPool.length === 0) return;
	const problem = duelPool[duelIndex % duelPool.length];
	document.getElementById('duelAnswerFigure').textContent = problem.a;
	setPromptImage('duelAnswerImg', problem.aImg);
	document.getElementById('duelAnswerReasoning').textContent = problem.e;
	const box = document.getElementById('duelAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderDuelAwardButtons() {
	const element = document.getElementById('awardDuel');
	if (!element) return;
	const selectA = document.getElementById('duelTeamA');
	const selectB = document.getElementById('duelTeamB');
	if (!selectA || !selectB || !selectA.value || !selectB.value) {
		element.innerHTML = '';
		return;
	}
	const teamA = teams.find((team) => team.id === selectA.value);
	const teamB = teams.find((team) => team.id === selectB.value);
	if (!teamA || !teamB) {
		element.innerHTML = '';
		return;
	}
	renderTeamAwardButtons('awardDuel', [teamA, teamB], () => [{ label: '+1', points: 1 }]);
}

function openDuelModal() {
	openQuestionManagerModal('Manage Countdown Duel Questions', {
		fieldPrefix: 'newDuel',
		listId: 'customDuelList',
		addFnName: 'addCustomDuel',
	});
	duelImageFields.reset();
	renderCustomDuelList();
}

function addCustomDuel() {
	const question = document.getElementById('newDuelQ').value.trim();
	const answer = document.getElementById('newDuelA').value.trim();
	const explanation = document.getElementById('newDuelE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customDuel.push({
		q: question,
		qImg: duelImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: duelImageFields.state.a || undefined,
	});
	document.getElementById('newDuelQ').value = '';
	document.getElementById('newDuelA').value = '';
	document.getElementById('newDuelE').value = '';
	duelImageFields.reset();
	renderCustomDuelList();
	autosave();
}

function deleteCustomDuel(i) {
	deleteCustomItem(customDuel, i, renderCustomDuelList);
}

function renderCustomDuelList() {
	renderCustomList('customDuelList', customDuel, (problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">
				<b>${escapeHtml(problem.q)}</b>
				<br>
				${escapeHtml(problem.a)}
			</div>
			<button class="btn small ghost" onclick="deleteCustomDuel(${i})">Delete</button>
		</div>
	`);
}
