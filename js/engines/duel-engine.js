// Duel engine — two teams, one problem, first correct answer wins.
// Expects a global `builtinDuel` array of { q, a, e } objects.
let customDuel = [];
function getDuelPool() {
	return builtinDuel.concat(customDuel);
}
let duelPool = [],
	duelIdx = 0;
let pendingDuelQImg = null;
let pendingDuelAImg = null;

function populateDuelTeamSelectors() {
	const selA = document.getElementById('duelTeamA');
	const selB = document.getElementById('duelTeamB');
	if (!selA || !selB) return;
	const prevA = selA.value,
		prevB = selB.value;
	const opts = teams
		.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
		.join('');
	selA.innerHTML = opts;
	selB.innerHTML = opts;
	if (teams.find((t) => t.id === prevA)) selA.value = prevA;
	if (teams.length > 1) {
		const secondId = teams.find((t) => t.id !== selA.value);
		if (teams.find((t) => t.id === prevB) && prevB !== selA.value) {
			selB.value = prevB;
		} else if (secondId) {
			selB.value = secondId.id;
		}
	}
}
function renderDuelProblem() {
	duelPool = getDuelPool();
	const box = document.getElementById('duelAnswerBox');
	box.classList.remove('show');
	if (duelPool.length === 0) {
		document.getElementById('duelProgress').textContent = 'No questions yet';
		document.getElementById('duelQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		return;
	}
	const p = duelPool[duelIdx % duelPool.length];
	document.getElementById('duelProgress').textContent =
		`Problem ${(duelIdx % duelPool.length) + 1} of ${duelPool.length}`;
	document.getElementById('duelQuestionText').textContent = p.q;
	setPromptImage('duelQuestionImg', p.qImg);
	typeset(document.getElementById('duelQuestionText'));
}
function revealDuelAnswer() {
	if (duelPool.length === 0) return;
	const p = duelPool[duelIdx % duelPool.length];
	document.getElementById('duelAnswerFigure').textContent = p.a;
	setPromptImage('duelAnswerImg', p.aImg);
	document.getElementById('duelAnswerReasoning').textContent = p.e;
	const box = document.getElementById('duelAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function nextDuelProblem() {
	duelIdx++;
	renderDuelProblem();
}
function renderDuelAwardButtons() {
	const el = document.getElementById('award-duel');
	if (!el) return;
	const selA = document.getElementById('duelTeamA');
	const selB = document.getElementById('duelTeamB');
	if (!selA || !selB || !selA.value || !selB.value) {
		el.innerHTML = '';
		return;
	}
	const tA = teams.find((t) => t.id === selA.value);
	const tB = teams.find((t) => t.id === selB.value);
	if (!tA || !tB) {
		el.innerHTML = '';
		return;
	}
	el.innerHTML = [tA, tB]
		.map(
			(t) => `
    <button class="btn award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',1,event)">+1 <span>${escapeHtml(t.name)}</span></button>
  `,
		)
		.join('');
}
function openDuelModal() {
	openModal(
		'Manage Countdown Duel Questions',
		`
    <div class="field-label">Question (use $...$ for math)</div>
    <textarea id="newDuelQ" placeholder="e.g. What is $\\binom{6}{2}$?"></textarea>
    <div class="field-label">Question image (optional)</div>
    <div id="newDuelQImgWrap"></div>
    <div class="field-label">Answer</div>
    <input type="text" id="newDuelA" placeholder="e.g. 15" />
    <div class="field-label">Explanation</div>
    <textarea id="newDuelE" placeholder="Show the reasoning."></textarea>
    <div class="field-label">Answer image (optional)</div>
    <div id="newDuelAImgWrap"></div>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomDuel()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customDuelList"></div>
  `,
	);
	pendingDuelQImg = null;
	pendingDuelAImg = null;
	renderDuelImgFields();
	renderCustomDuelList();
}
function renderDuelImgFields() {
	renderImgUploadField('newDuelQImgWrap', 'newDuelQImgFile', pendingDuelQImg, (val) => {
		pendingDuelQImg = val;
		renderDuelImgFields();
	});
	renderImgUploadField('newDuelAImgWrap', 'newDuelAImgFile', pendingDuelAImg, (val) => {
		pendingDuelAImg = val;
		renderDuelImgFields();
	});
}
function addCustomDuel() {
	const q = document.getElementById('newDuelQ').value.trim();
	const a = document.getElementById('newDuelA').value.trim();
	const e = document.getElementById('newDuelE').value.trim();
	if (!q || !a) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customDuel.push({
		q,
		qImg: pendingDuelQImg || undefined,
		a,
		e,
		aImg: pendingDuelAImg || undefined,
	});
	document.getElementById('newDuelQ').value = '';
	document.getElementById('newDuelA').value = '';
	document.getElementById('newDuelE').value = '';
	pendingDuelQImg = null;
	pendingDuelAImg = null;
	renderDuelImgFields();
	renderCustomDuelList();
	autosave();
}
function deleteCustomDuel(i) {
	customDuel.splice(i, 1);
	renderCustomDuelList();
	autosave();
}
function renderCustomDuelList() {
	const el = document.getElementById('customDuelList');
	if (!el) return;
	if (customDuel.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customDuel
		.map(
			(p, i) => `
    <div class="custom-list-item">
      ${p.qImg || p.aImg ? `<img class="thumb" src="${p.qImg || p.aImg}" alt="" />` : ''}
      <div class="txt"><b>${escapeHtml(p.q)}</b><br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomDuel(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
