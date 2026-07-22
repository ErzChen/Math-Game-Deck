// Ladder engine — climb through N problems across escalating tiers.
// Expects a global `builtinLadder` array of { tier, q, a, e } objects.
let customLadder = [];
function getLadderPool() {
	return builtinLadder.concat(customLadder);
}
let ladderPool = [],
	ladderIdx = 0;
let ladderTimerSeconds = 90,
	ladderTimerInterval = null;
const tierNames = {
	1: 'Tier 1 · Warm-up · 1 pt',
	2: 'Tier 2 · Building · 2 pt',
	3: 'Tier 3 · Push · 3 pt',
	4: 'Tier 4 · Frontier · 4 pt',
};

function resetLadder() {
	ladderPool = getLadderPool();
	ladderIdx = 0;
	renderLadderProblem();
}
function renderLadderProblem() {
	ladderPool = getLadderPool();
	const badge = document.getElementById('ladderTierBadge');
	const box = document.getElementById('ladderAnswerBox');
	box.classList.remove('show');
	if (ladderPool.length === 0) {
		document.getElementById('ladderProgress').textContent = 'No questions yet';
		badge.textContent = '';
		badge.className = 'tier-badge';
		document.getElementById('ladderQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('ladderQuestionImg', null);
		document.getElementById('ladderAwardLabel').textContent = 'Award the point';
		clearInterval(ladderTimerInterval);
		ladderTimerInterval = null;
		renderLadderTimer();
		const el = document.getElementById('award-ladder');
		if (el) el.innerHTML = '';
		return;
	}
	const p = ladderPool[ladderIdx % ladderPool.length];
	document.getElementById('ladderProgress').textContent =
		`Problem ${(ladderIdx % ladderPool.length) + 1} of ${ladderPool.length}`;
	badge.textContent = tierNames[p.tier] || `Tier ${p.tier}`;
	badge.className = 'tier-badge t' + p.tier;
	document.getElementById('ladderQuestionText').textContent = p.q;
	setPromptImage('ladderQuestionImg', p.qImg);
	document.getElementById('ladderAwardLabel').textContent =
		`Award the point (worth ${p.tier})`;
	typeset(document.getElementById('ladderQuestionText'));
	renderLadderAwardButtons();
	resetLadderTimer();
}
function revealLadderAnswer() {
	if (ladderPool.length === 0) return;
	const p = ladderPool[ladderIdx % ladderPool.length];
	document.getElementById('ladderAnswerFigure').textContent = p.a;
	setPromptImage('ladderAnswerImg', p.aImg);
	document.getElementById('ladderAnswerReasoning').textContent = p.e;
	const box = document.getElementById('ladderAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function nextLadderProblem() {
	ladderIdx++;
	renderLadderProblem();
}
function renderLadderAwardButtons() {
	const el = document.getElementById('award-ladder');
	if (!el) return;
	const p = ladderPool[ladderIdx % ladderPool.length];
	const pts = p ? p.tier : 1;
	el.innerHTML = teams
		.map(
			(t) => `
    <button class="btn award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',${pts},event)">+${pts} <span>${escapeHtml(t.name)}</span></button>
  `,
		)
		.join('');
}
function toggleLadderTimer() {
	const btn = document.getElementById('ladderTimerToggle');
	if (ladderTimerInterval) {
		clearInterval(ladderTimerInterval);
		ladderTimerInterval = null;
		btn.textContent = 'Start';
	} else {
		btn.textContent = 'Pause';
		ladderTimerInterval = setInterval(() => {
			if (ladderTimerSeconds > 0) {
				ladderTimerSeconds--;
				renderLadderTimer();
			} else {
				clearInterval(ladderTimerInterval);
				ladderTimerInterval = null;
				btn.textContent = 'Start';
			}
		}, 1000);
	}
}
function renderLadderTimer() {
	const m = String(Math.floor(ladderTimerSeconds / 60)).padStart(2, '0');
	const s = String(ladderTimerSeconds % 60).padStart(2, '0');
	const el = document.getElementById('ladderTimerDisplay');
	el.textContent = `${m}:${s}`;
	el.classList.toggle('low', ladderTimerSeconds <= 10);
}
function resetLadderTimer() {
	clearInterval(ladderTimerInterval);
	ladderTimerInterval = null;
	ladderTimerSeconds = 90;
	renderLadderTimer();
	const btn = document.getElementById('ladderTimerToggle');
	if (btn) btn.textContent = 'Start';
}
function openLadderModal() {
	openModal(
		'Manage Contest Ladder Questions',
		`
    <div class="field-label">Tier (1 = easiest, 4 = hardest)</div>
    <input type="text" id="newLadTier" placeholder="e.g. 2" />
    <div class="field-label">Question (use $...$ for math, e.g. $x^2-4$)</div>
    <textarea id="newLadQ" placeholder="e.g. Solve for $x$: $2x+5=17$."></textarea>
    <div class="field-label">Question image (optional)</div>
    <div id="newLadQImgWrap"></div>
    <div class="field-label">Answer</div>
    <input type="text" id="newLadA" placeholder="e.g. $x=6$" />
    <div class="field-label">Explanation</div>
    <textarea id="newLadE" placeholder="Show the reasoning."></textarea>
    <div class="field-label">Answer image (optional)</div>
    <div id="newLadAImgWrap"></div>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomLadder()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customLadderList"></div>
  `,
	);
	pendingLadQImg = null;
	pendingLadAImg = null;
	renderLadderImgFields();
	renderCustomLadderList();
}
// holds the compressed data URL for whichever image is currently attached
// to the "add question" form, before the question itself is saved
let pendingLadQImg = null;
let pendingLadAImg = null;
function renderLadderImgFields() {
	renderImgUploadField('newLadQImgWrap', 'newLadQImgFile', pendingLadQImg, (val) => {
		pendingLadQImg = val;
		renderLadderImgFields();
	});
	renderImgUploadField('newLadAImgWrap', 'newLadAImgFile', pendingLadAImg, (val) => {
		pendingLadAImg = val;
		renderLadderImgFields();
	});
}
function addCustomLadder() {
	const tier = Math.max(
		1,
		Math.min(4, parseInt(document.getElementById('newLadTier').value, 10) || 1),
	);
	const q = document.getElementById('newLadQ').value.trim();
	const a = document.getElementById('newLadA').value.trim();
	const e = document.getElementById('newLadE').value.trim();
	if (!q || !a) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customLadder.push({
		tier,
		q,
		qImg: pendingLadQImg || undefined,
		a,
		e,
		aImg: pendingLadAImg || undefined,
	});
	document.getElementById('newLadTier').value = '';
	document.getElementById('newLadQ').value = '';
	document.getElementById('newLadA').value = '';
	document.getElementById('newLadE').value = '';
	pendingLadQImg = null;
	pendingLadAImg = null;
	renderLadderImgFields();
	renderCustomLadderList();
	autosave();
}
function deleteCustomLadder(i) {
	customLadder.splice(i, 1);
	renderCustomLadderList();
	autosave();
}
function renderCustomLadderList() {
	const el = document.getElementById('customLadderList');
	if (!el) return;
	if (customLadder.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customLadder
		.map(
			(p, i) => `
    <div class="custom-list-item">
      ${p.qImg || p.aImg ? `<img class="thumb" src="${p.qImg || p.aImg}" alt="" />` : ''}
      <div class="txt"><b>Tier ${p.tier}</b> — ${escapeHtml(p.q)}<br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomLadder(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
