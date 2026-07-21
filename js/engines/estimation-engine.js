// Estimation Auction engine — one numeric-answer question, teams guess on
// whiteboards within a short window, host judges closest guess (+2) and
// an exact-answer bonus (+2 more) rather than the app tracking bids itself.
// Expects a global `builtinEstimation` array of { q, a, e } objects.
let customEstimation = [];
function getEstimationPool() {
	return builtinEstimation.concat(customEstimation);
}
let estimationPool = [],
	estimationIdx = 0;
let estimationTimerSeconds = 45,
	estimationTimerInterval = null;

function resetEstimation() {
	estimationIdx = 0;
	renderEstimationProblem();
}
function renderEstimationProblem() {
	estimationPool = getEstimationPool();
	const box = document.getElementById('estimationAnswerBox');
	if (box) box.classList.remove('show');
	if (estimationPool.length === 0) {
		document.getElementById('estimationProgress').textContent =
			'No questions yet';
		document.getElementById('estimationQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		clearInterval(estimationTimerInterval);
		estimationTimerInterval = null;
		renderEstimationTimer();
		renderEstimationAwardButtons();
		return;
	}
	const p = estimationPool[estimationIdx % estimationPool.length];
	document.getElementById('estimationProgress').textContent =
		`Problem ${(estimationIdx % estimationPool.length) + 1} of ${estimationPool.length}`;
	document.getElementById('estimationQuestionText').textContent = p.q;
	typeset(document.getElementById('estimationQuestionText'));
	renderEstimationAwardButtons();
	resetEstimationTimer();
}
function revealEstimationAnswer() {
	if (estimationPool.length === 0) return;
	const p = estimationPool[estimationIdx % estimationPool.length];
	document.getElementById('estimationAnswerFigure').textContent = p.a;
	document.getElementById('estimationAnswerReasoning').textContent = p.e;
	const box = document.getElementById('estimationAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function nextEstimationProblem() {
	estimationIdx++;
	renderEstimationProblem();
}
function renderEstimationAwardButtons() {
	const el = document.getElementById('award-estimation');
	if (!el) return;
	el.innerHTML = teams
		.map(
			(t) => `
    <div class="estimation-team-group" style="border-left-color:${t.color}">
      <span class="estimation-team-name">${escapeHtml(t.name)}</span>
      <div class="estimation-team-btns">
        <button class="btn sm award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',2,event)">+2 Closest</button>
        <button class="btn sm award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',2,event)">+2 Exact bonus</button>
      </div>
    </div>
  `,
		)
		.join('');
}
function toggleEstimationTimer() {
	const btn = document.getElementById('estimationTimerToggle');
	if (estimationTimerInterval) {
		clearInterval(estimationTimerInterval);
		estimationTimerInterval = null;
		btn.textContent = 'Start';
	} else {
		btn.textContent = 'Pause';
		estimationTimerInterval = setInterval(() => {
			if (estimationTimerSeconds > 0) {
				estimationTimerSeconds--;
				renderEstimationTimer();
			} else {
				clearInterval(estimationTimerInterval);
				estimationTimerInterval = null;
				btn.textContent = 'Start';
			}
		}, 1000);
	}
}
function renderEstimationTimer() {
	const el = document.getElementById('estimationTimerDisplay');
	if (!el) return;
	const m = String(Math.floor(estimationTimerSeconds / 60)).padStart(2, '0');
	const s = String(estimationTimerSeconds % 60).padStart(2, '0');
	el.textContent = `${m}:${s}`;
	el.classList.toggle('low', estimationTimerSeconds <= 10);
}
function resetEstimationTimer() {
	clearInterval(estimationTimerInterval);
	estimationTimerInterval = null;
	estimationTimerSeconds = 45;
	renderEstimationTimer();
	const btn = document.getElementById('estimationTimerToggle');
	if (btn) btn.textContent = 'Start';
}
function openEstimationModal() {
	openModal(
		'Manage Estimation Auction Questions',
		`
    <div class="field-label">Question (use $...$ for math)</div>
    <textarea id="newEstQ" placeholder="e.g. How many diagonals does a 15-gon have?"></textarea>
    <div class="field-label">Exact numeric answer</div>
    <input type="text" id="newEstA" placeholder="e.g. 90" />
    <div class="field-label">Explanation</div>
    <textarea id="newEstE" placeholder="Show the reasoning."></textarea>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomEstimation()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customEstimationList"></div>
  `,
	);
	renderCustomEstimationList();
}
function addCustomEstimation() {
	const q = document.getElementById('newEstQ').value.trim();
	const a = document.getElementById('newEstA').value.trim();
	const e = document.getElementById('newEstE').value.trim();
	if (!q || !a) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customEstimation.push({ q, a, e });
	document.getElementById('newEstQ').value = '';
	document.getElementById('newEstA').value = '';
	document.getElementById('newEstE').value = '';
	renderCustomEstimationList();
	autosave();
}
function deleteCustomEstimation(i) {
	customEstimation.splice(i, 1);
	renderCustomEstimationList();
	autosave();
}
function renderCustomEstimationList() {
	const el = document.getElementById('customEstimationList');
	if (!el) return;
	if (customEstimation.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customEstimation
		.map(
			(p, i) => `
    <div class="custom-list-item">
      <div class="txt"><b>${escapeHtml(p.q)}</b><br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomEstimation(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
