// Speed Sprint engine — one team races a single countdown block, blasting
// through as many short problems as they can. Host judges each answer
// against the on-screen key and taps Correct/Skip to advance; no per-
// problem timers or reveal step, it's all about pace.
// Expects a global `builtinSprint` array of { q, a } objects.
let customSprint = [];
function getSprintPool() {
	return builtinSprint.concat(customSprint);
}
let sprintPool = [];
let sprintIdx = 0,
	sprintCorrectCount = 0,
	sprintClearedPool = false;
let sprintTimerSeconds = 180,
	sprintTimerInterval = null;
let sprintState = 'idle'; // idle | running | finished
let sprintTeamId = null;

function populateSprintTeamSelector() {
	const sel = document.getElementById('sprintTeamSelect');
	if (!sel) return;
	const prev = sel.value;
	sel.innerHTML = teams
		.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
		.join('');
	if (teams.find((t) => t.id === prev)) sel.value = prev;
	sel.disabled = sprintState === 'running';
}
function renderSprintProblem() {
	sprintPool = getSprintPool();
	const qEl = document.getElementById('sprintQuestionText');
	const keyEl = document.getElementById('sprintAnswerKey');
	if (!qEl) return;
	if (sprintPool.length === 0) {
		document.getElementById('sprintProgress').textContent =
			'No questions yet';
		qEl.textContent = 'No questions yet, use "Manage Questions" above to add some.';
		if (keyEl) keyEl.textContent = '';
		return;
	}
	const p = sprintPool[sprintIdx % sprintPool.length];
	document.getElementById('sprintProgress').textContent =
		`Question ${(sprintIdx % sprintPool.length) + 1} of ${sprintPool.length} · ${sprintCorrectCount} correct so far`;
	qEl.textContent = p.q;
	if (keyEl) keyEl.textContent = 'Answer key: ' + p.a;
	typeset(qEl);
}
function startSprint() {
	sprintPool = getSprintPool();
	if (sprintPool.length === 0) {
		alert('Add some questions first via "Manage Questions".');
		return;
	}
	const sel = document.getElementById('sprintTeamSelect');
	if (!sel || !sel.value) {
		alert('Pick a team first.');
		return;
	}
	sprintTeamId = sel.value;
	sprintIdx = 0;
	sprintCorrectCount = 0;
	sprintClearedPool = false;
	sprintTimerSeconds = 180;
	sprintState = 'running';
	sprintTimerInterval = setInterval(() => {
		if (sprintTimerSeconds > 0) {
			sprintTimerSeconds--;
			renderSprintTimer();
		} else {
			endSprint();
		}
	}, 1000);
	renderSprintScreen();
}
function toggleSprintPause() {
	if (sprintState !== 'running') return;
	const btn = document.getElementById('sprintPauseToggle');
	if (sprintTimerInterval) {
		clearInterval(sprintTimerInterval);
		sprintTimerInterval = null;
		if (btn) btn.textContent = 'Resume';
	} else {
		if (btn) btn.textContent = 'Pause';
		sprintTimerInterval = setInterval(() => {
			if (sprintTimerSeconds > 0) {
				sprintTimerSeconds--;
				renderSprintTimer();
			} else {
				endSprint();
			}
		}, 1000);
	}
}
function endSprint() {
	clearInterval(sprintTimerInterval);
	sprintTimerInterval = null;
	sprintState = 'finished';
	renderSprintScreen();
}
function markSprintCorrect() {
	advanceSprint(true);
}
function markSprintSkip() {
	advanceSprint(false);
}
function advanceSprint(wasCorrect) {
	if (sprintState !== 'running') return;
	if (wasCorrect) sprintCorrectCount++;
	sprintIdx++;
	if (
		sprintPool.length > 0 &&
		sprintIdx > 0 &&
		sprintIdx % sprintPool.length === 0
	) {
		sprintClearedPool = true;
	}
	renderSprintProblem();
}
function newSprint() {
	clearInterval(sprintTimerInterval);
	sprintTimerInterval = null;
	sprintState = 'idle';
	sprintIdx = 0;
	sprintCorrectCount = 0;
	sprintClearedPool = false;
	sprintTimerSeconds = 180;
	sprintTeamId = null;
	renderSprintScreen();
}
function renderSprintTimer() {
	const el = document.getElementById('sprintTimerDisplay');
	if (!el) return;
	const m = String(Math.floor(sprintTimerSeconds / 60)).padStart(2, '0');
	const s = String(sprintTimerSeconds % 60).padStart(2, '0');
	el.textContent = `${m}:${s}`;
	el.classList.toggle('low', sprintTimerSeconds <= 20);
}
function renderSprintScreen() {
	populateSprintTeamSelector();
	renderSprintTimer();
	const startBtn = document.getElementById('sprintStartBtn');
	const pauseBtn = document.getElementById('sprintPauseToggle');
	const controls = document.getElementById('sprintActiveControls');
	const summary = document.getElementById('sprintSummary');
	const qWrap = document.getElementById('sprintQuestionWrap');
	const progress = document.getElementById('sprintProgress');
	if (sprintState === 'idle') {
		if (startBtn) startBtn.style.display = '';
		if (pauseBtn) pauseBtn.style.display = 'none';
		if (controls) controls.style.display = 'none';
		if (summary) summary.style.display = 'none';
		if (qWrap) qWrap.style.display = 'none';
		if (progress) progress.textContent = 'Pick a team and hit Start Sprint';
	} else if (sprintState === 'running') {
		if (startBtn) startBtn.style.display = 'none';
		if (pauseBtn) {
			pauseBtn.style.display = '';
			pauseBtn.textContent = sprintTimerInterval ? 'Pause' : 'Resume';
		}
		if (controls) controls.style.display = '';
		if (summary) summary.style.display = 'none';
		if (qWrap) qWrap.style.display = '';
		renderSprintProblem();
	} else if (sprintState === 'finished') {
		if (startBtn) startBtn.style.display = 'none';
		if (pauseBtn) pauseBtn.style.display = 'none';
		if (controls) controls.style.display = 'none';
		if (qWrap) qWrap.style.display = 'none';
		if (summary) {
			summary.style.display = '';
			const t = teams.find((tm) => tm.id === sprintTeamId);
			summary.innerHTML = t
				? `
        <div class="sprint-summary-line">Time's up! <b style="color:${t.color}">${escapeHtml(t.name)}</b> answered <b>${sprintCorrectCount}</b> correctly.</div>
        <div class="row-actions">
          <button class="btn primary" onclick="addScore('${t.id}',${sprintCorrectCount},event); autosave(); this.disabled=true;">Award ${sprintCorrectCount} pt${sprintCorrectCount === 1 ? '' : 's'}</button>
          ${sprintClearedPool ? `<button class="btn ghost" onclick="addScore('${t.id}',1,event); autosave(); this.disabled=true;">+1 Bonus (cleared the pool)</button>` : ''}
          <button class="btn ghost" onclick="newSprint()">New Sprint</button>
        </div>
      `
				: `<button class="btn ghost" onclick="newSprint()">New Sprint</button>`;
		}
	}
}
function openSprintModal() {
	openModal(
		'Manage Speed Sprint Questions',
		`
    <div style="font-size:13px;color:var(--chalk-muted);line-height:1.6;">Keep these short — teams are racing the clock. No explanation needed, just question and answer.</div>
    <div class="field-label">Question (use $...$ for math)</div>
    <textarea id="newSprintQ" placeholder="e.g. $7 \\times 8$"></textarea>
    <div class="field-label">Answer</div>
    <input type="text" id="newSprintA" placeholder="e.g. 56" />
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomSprint()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customSprintList"></div>
  `,
	);
	renderCustomSprintList();
}
function addCustomSprint() {
	const q = document.getElementById('newSprintQ').value.trim();
	const a = document.getElementById('newSprintA').value.trim();
	if (!q || !a) {
		alert('Enter both a question and an answer.');
		return;
	}
	customSprint.push({ q, a });
	document.getElementById('newSprintQ').value = '';
	document.getElementById('newSprintA').value = '';
	renderCustomSprintList();
	autosave();
}
function deleteCustomSprint(i) {
	customSprint.splice(i, 1);
	renderCustomSprintList();
	autosave();
}
function renderCustomSprintList() {
	const el = document.getElementById('customSprintList');
	if (!el) return;
	if (customSprint.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customSprint
		.map(
			(p, i) => `
    <div class="custom-list-item">
      <div class="txt"><b>${escapeHtml(p.q)}</b><br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomSprint(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
