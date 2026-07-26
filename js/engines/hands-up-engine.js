let customHandsUp = [];
let handsUpPool = [];
let handsUpIndex = 0;
let handsUpTriedIds = {};
let handsUpSolvedBy = null;

const handsUpImageFields = createQAImageState({
	qWrap: 'newHandsUpQImgWrap',
	qFile: 'newHandsUpQImgFile',
	aWrap: 'newHandsUpAImgWrap',
	aFile: 'newHandsUpAImgFile',
});

function initHandsUp() {
	resetHandsUp();
}

function resetHandsUp() {
	handsUpIndex = 0;
	renderHandsUpProblem();
}

function nextHandsUpProblem() {
	handsUpIndex++;
	renderHandsUpProblem();
}

function renderHandsUpProblem() {
	handsUpPool = customHandsUp;
	handsUpTriedIds = {};
	handsUpSolvedBy = null;
	const box = document.getElementById('handsUpAnswerBox');
	if (box) box.classList.remove('show');

	if (handsUpPool.length === 0) {
		document.getElementById('handsUpProgress').textContent = 'No questions yet';
		document.getElementById('handsUpQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('handsUpQuestionImg', null);
		renderHandsUpTeamButtons();
		return;
	}

	const problem = handsUpPool[handsUpIndex % handsUpPool.length];
	document.getElementById('handsUpProgress').textContent =
		`Problem ${(handsUpIndex % handsUpPool.length) + 1} of ${handsUpPool.length}`;
	document.getElementById('handsUpQuestionText').textContent = problem.q;
	setPromptImage('handsUpQuestionImg', problem.qImg);
	typeset(document.getElementById('handsUpQuestionText'));
	renderHandsUpTeamButtons();
}

function revealHandsUpAnswer() {
	if (handsUpPool.length === 0) return;
	const problem = handsUpPool[handsUpIndex % handsUpPool.length];
	document.getElementById('handsUpAnswerFigure').textContent = problem.a;
	setPromptImage('handsUpAnswerImg', problem.aImg);
	document.getElementById('handsUpAnswerReasoning').textContent = problem.e;
	const box = document.getElementById('handsUpAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderHandsUpTeamButtons() {
	const element = document.getElementById('handsUpTeamButtons');
	if (!element) return;

	if (handsUpSolvedBy) {
		const winner = teams.find((team) => team.id === handsUpSolvedBy);
		element.innerHTML = winner
			? `<div class="hands-up-solved" style="color: ${winner.color};">✓ ${escapeHtml(winner.name)} got it! Hit "Next Problem" to continue.</div>`
			: '';
		return;
	}

	const allTried = teams.every((team) => handsUpTriedIds[team.id]);
	if (allTried && teams.length > 0) {
		element.innerHTML = `<div class="hands-up-solved">No one got it — reveal the answer and move on.</div>`;
		return;
	}

	element.innerHTML = teams.map((team) => renderHandsUpTeamRow(team)).join('');
}

function renderHandsUpTeamRow(team) {
	const tried = handsUpTriedIds[team.id];
	if (tried) {
		return `
			<div class="team-group flex middle" style="border-left-color: ${team.color};">
				<span class="team-name">${escapeHtml(team.name)} already tried</span>
			</div>
		`;
	}
	const pts = Object.keys(handsUpTriedIds).length === 0 ? 2 : 1;
	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markHandsUpResult('${team.id}', false)"
				>
					✗ Wrong
				</button>
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markHandsUpResult('${team.id}', true)"
				>
					✓ Correct +${pts}
				</button>
			</div>
		</div>
	`;
}

function markHandsUpResult(teamId, correct) {
	if (handsUpSolvedBy || handsUpTriedIds[teamId]) return;
	if (correct) {
		const pts = Object.keys(handsUpTriedIds).length === 0 ? 2 : 1;
		addScore(teamId, pts);
		handsUpSolvedBy = teamId;
	} else {
		handsUpTriedIds[teamId] = true;
	}
	autosave();
	renderHandsUpTeamButtons();
}

function openHandsUpModal() {
	openQuestionManagerModal('Manage Hands-Up Steal Questions', {
		fieldPrefix: 'newHandsUp',
		listId: 'customHandsUpList',
		addFnName: 'addCustomHandsUp',
		hasTier: true,
	});
	handsUpImageFields.reset();
	renderCustomHandsUpList();
}

function addCustomHandsUp() {
	const question = document.getElementById('newHandsUpQ').value.trim();
	const answer = document.getElementById('newHandsUpA').value.trim();
	const explanation = document.getElementById('newHandsUpE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customHandsUp.push({
		q: question,
		qImg: handsUpImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: handsUpImageFields.state.a || undefined,
	});
	document.getElementById('newHandsUpQ').value = '';
	document.getElementById('newHandsUpA').value = '';
	document.getElementById('newHandsUpE').value = '';
	handsUpImageFields.reset();
	renderCustomHandsUpList();
	autosave();
}

function deleteCustomHandsUp(i) {
	deleteCustomItem(customHandsUp, i, renderCustomHandsUpList);
}

function renderCustomHandsUpList() {
	renderCustomList('customHandsUpList', customHandsUp, (problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt"><b>${escapeHtml(problem.q)}</b><br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomHandsUp(${i})">Delete</button>
		</div>
	`);
}
