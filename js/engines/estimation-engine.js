let customEstimation = [];
let estimationPool = [];
let estimationIndex = 0;

const estimationTimer = createCountdownTimer({
	seconds: 45,
	displayId: 'estimationTimerDisplay',
	toggleBtnId: 'estimationTimerToggle',
});

const estimationImageFields = createQAImageState({
	qWrap: 'newEstQImgWrap',
	qFile: 'newEstQImgFile',
	aWrap: 'newEstAImgWrap',
	aFile: 'newEstAImgFile',
});

function initEstimation() {
	resetEstimation();
}

function resetEstimation() {
	estimationIndex = 0;
	renderEstimationProblem();
}

function nextEstimationProblem() {
	estimationIndex++;
	renderEstimationProblem();
}

function toggleEstimationTimer() {
	estimationTimer.toggle();
}

function renderEstimationTimer() {
	estimationTimer.render();
}

function resetEstimationTimer() {
	estimationTimer.reset();
}

function renderEstimationProblem() {
	estimationPool = customEstimation;
	hideAnswerBox('estimation');

	if (estimationPool.length === 0) {
		renderEmptyPoolState(
			'estimation',
			'No questions yet, use "Manage Questions" above to add some.',
			estimationTimer,
		);
		renderEstimationAwardButtons();
		return;
	}

	const problem = estimationPool[estimationIndex % estimationPool.length];
	renderQuestionText(
		'estimation',
		problem,
		`Problem ${(estimationIndex % estimationPool.length) + 1} of ${estimationPool.length}`,
	);
	renderEstimationAwardButtons();
	estimationTimer.reset();
}

function revealEstimationAnswer() {
	if (estimationPool.length === 0) return;
	const problem = estimationPool[estimationIndex % estimationPool.length];
	revealAnswer('estimation', problem);
}

function renderEstimationAwardButtons() {
	renderTeamAwardButtons('awardEstimation', teams, () => [
		{ label: '+2 Closest', points: 2 },
		{ label: '+2 Exact bonus', points: 2 },
	]);
}

function openEstimationModal() {
	openQuestionManagerModal('Manage Estimation Auction Questions', {
		fieldPrefix: 'newEst',
		listId: 'customEstimationList',
		addFnName: 'addCustomEstimation',
		questionPlaceholder: 'e.g. How many diagonals does a 15-gon have?',
		answerLabel: 'Exact numeric answer',
		answerPlaceholder: 'e.g. 90',
	});
	estimationImageFields.reset();
	renderCustomEstimationList();
}

function addCustomEstimation() {
	const question = document.getElementById('newEstQ').value.trim();
	const answer = document.getElementById('newEstA').value.trim();
	const explanation = document.getElementById('newEstE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customEstimation.push({
		q: question,
		qImg: estimationImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: estimationImageFields.state.a || undefined,
	});
	document.getElementById('newEstQ').value = '';
	document.getElementById('newEstA').value = '';
	document.getElementById('newEstE').value = '';
	estimationImageFields.reset();
	renderCustomEstimationList();
	autosave();
}

function deleteCustomEstimation(i) {
	deleteCustomItem(customEstimation, i, renderCustomEstimationList);
}

function renderCustomEstimationList() {
	renderCustomList(
		'customEstimationList',
		customEstimation,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
			<div class="txt"><b>${escapeHtml(problem.q)}</b><br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomEstimation(${i})">Delete</button>
		</div>
	`,
	);
}
