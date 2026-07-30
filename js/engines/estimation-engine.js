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
	const box = document.getElementById('estimationAnswerBox');
	if (box) box.classList.remove('show');

	if (estimationPool.length === 0) {
		document.getElementById('estimationProgress').textContent =
			'No questions yet';
		document.getElementById('estimationQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('estimationQuestionImg', null);
		estimationTimer.stop();
		renderEstimationAwardButtons();
		return;
	}

	const problem = estimationPool[estimationIndex % estimationPool.length];
	document.getElementById('estimationProgress').textContent =
		`Problem ${(estimationIndex % estimationPool.length) + 1} of ${estimationPool.length}`;
	document.getElementById('estimationQuestionText').textContent = problem.q;
	setPromptImage('estimationQuestionImg', problem.qImg);
	typeset(document.getElementById('estimationQuestionText'));
	renderEstimationAwardButtons();
	estimationTimer.reset();
}

function revealEstimationAnswer() {
	if (estimationPool.length === 0) return;
	const problem = estimationPool[estimationIndex % estimationPool.length];
	document.getElementById('estimationAnswerFigure').textContent = problem.a;
	setPromptImage('estimationAnswerImg', problem.aImg);
	document.getElementById('estimationAnswerReasoning').textContent = problem.e;
	const box = document.getElementById('estimationAnswerBox');
	box.classList.add('show');
	typeset(box);
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
