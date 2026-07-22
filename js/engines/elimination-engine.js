// Elimination Gauntlet engine — every team answers the same problem on
// whiteboards at once. Host marks each team correct/eliminated per round.
// Last team(s) standing win the gauntlet; a full wipeout round doesn't
// eliminate everyone (at least one team always survives to keep playing).
// Expects a global `builtinElimination` array of { tier, q, a, e } objects.
let customElimination = [];
function getEliminationPool() {
	return builtinElimination.concat(customElimination);
}
let eliminationPool = [],
	eliminationIdx = 0;
let pendingElimQImg = null;
let pendingElimAImg = null;
let eliminationAliveIds = [];
let eliminationRoundMarks = {}; // teamId -> 'correct' | 'wrong', this round only
let eliminationTimerSeconds = 60,
	eliminationTimerInterval = null;

function resetElimination() {
	eliminationPool = getEliminationPool();
	eliminationIdx = 0;
	eliminationAliveIds = teams.map((t) => t.id);
	eliminationRoundMarks = {};
	renderEliminationProblem();
}
function pruneEliminationAlive() {
	// keep alive-list in sync if teams were added/removed elsewhere
	const validIds = teams.map((t) => t.id);
	eliminationAliveIds = eliminationAliveIds.filter((id) =>
		validIds.includes(id),
	);
	if (eliminationIdx === 0) {
		// still on round 1 — any newly-added team should count as alive too
		validIds.forEach((id) => {
			if (!eliminationAliveIds.includes(id)) eliminationAliveIds.push(id);
		});
	}
	if (eliminationAliveIds.length === 0) {
		eliminationAliveIds = teams.map((t) => t.id);
	}
}
function renderEliminationProblem() {
	eliminationPool = getEliminationPool();
	pruneEliminationAlive();
	const box = document.getElementById('eliminationAnswerBox');
	if (box) box.classList.remove('show');
	const badge = document.getElementById('eliminationTierBadge');
	if (eliminationPool.length === 0) {
		document.getElementById('eliminationProgress').textContent =
			'No questions yet';
		if (badge) {
			badge.textContent = '';
			badge.className = 'tier-badge';
		}
		document.getElementById('eliminationQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('eliminationQuestionImg', null);
		clearInterval(eliminationTimerInterval);
		eliminationTimerInterval = null;
		renderEliminationTimer();
		renderEliminationRoster();
		return;
	}
	const p = eliminationPool[eliminationIdx % eliminationPool.length];
	document.getElementById('eliminationProgress').textContent =
		`Round ${eliminationIdx + 1} · ${eliminationAliveIds.length} team${eliminationAliveIds.length === 1 ? '' : 's'} still in it`;
	if (badge) {
		badge.textContent = p.tier ? tierNames[p.tier] || `Tier ${p.tier}` : '';
		badge.className = 'tier-badge' + (p.tier ? ' t' + p.tier : '');
	}
	document.getElementById('eliminationQuestionText').textContent = p.q;
	setPromptImage('eliminationQuestionImg', p.qImg);
	typeset(document.getElementById('eliminationQuestionText'));
	eliminationRoundMarks = {};
	renderEliminationRoster();
	resetEliminationTimer();
}
function revealEliminationAnswer() {
	if (eliminationPool.length === 0) return;
	const p = eliminationPool[eliminationIdx % eliminationPool.length];
	document.getElementById('eliminationAnswerFigure').textContent = p.a;
	setPromptImage('eliminationAnswerImg', p.aImg);
	document.getElementById('eliminationAnswerReasoning').textContent = p.e;
	const box = document.getElementById('eliminationAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function renderEliminationRoster() {
	const el = document.getElementById('eliminationRoster');
	if (!el) return;
	if (eliminationAliveIds.length <= 1 && eliminationPool.length > 0) {
		const champ = teams.find((t) => t.id === eliminationAliveIds[0]);
		el.innerHTML = champ
			? `
      <div class="elim-champion">
        <div class="elim-champion-label">🏆 Gauntlet winner</div>
        <div class="elim-champion-name" style="color:${champ.color}">${escapeHtml(champ.name)}</div>
        <button class="btn primary" onclick="addScore('${champ.id}',5,event); autosave();">+5 Champion Bonus</button>
        <button class="btn ghost" onclick="resetElimination()">New Gauntlet</button>
      </div>
    `
			: `<div style="color:var(--chalk-muted);font-size:13px;">Add teams to start a gauntlet.</div>`;
		return;
	}
	el.innerHTML = teams
		.map((t) => {
			const alive = eliminationAliveIds.includes(t.id);
			const mark = eliminationRoundMarks[t.id];
			if (!alive) {
				return `<div class="elim-chip out" style="border-left-color:${t.color}">
          <span class="elim-chip-name">${escapeHtml(t.name)}</span>
          <span class="elim-chip-tag">OUT</span>
        </div>`;
			}
			return `<div class="elim-chip${mark ? ' marked' : ''}" style="border-left-color:${t.color}">
        <span class="elim-chip-name">${escapeHtml(t.name)}</span>
        <div class="elim-chip-btns">
          <button class="btn sm${mark === 'correct' ? ' primary' : ''}" onclick="markElimination('${t.id}','correct')">✓ Survived +1</button>
          <button class="btn sm ghost${mark === 'wrong' ? ' elim-wrong-active' : ''}" onclick="markElimination('${t.id}','wrong')">✗ Out</button>
        </div>
      </div>`;
		})
		.join('');
}
function markElimination(teamId, result) {
	if (!eliminationAliveIds.includes(teamId)) return;
	if (eliminationRoundMarks[teamId] === result) return; // no-op re-click
	if (result === 'wrong') {
		// don't allow the very last remaining team to be marked out —
		// at least one team always survives to keep the gauntlet going
		const otherStillIn = eliminationAliveIds.filter(
			(id) => id !== teamId && eliminationRoundMarks[id] !== 'wrong',
		);
		if (otherStillIn.length === 0) {
			alert(
				"Can't eliminate every remaining team, at least one has to survive this round.",
			);
			return;
		}
		eliminationRoundMarks[teamId] = 'wrong';
		eliminationAliveIds = eliminationAliveIds.filter((id) => id !== teamId);
	} else {
		eliminationRoundMarks[teamId] = 'correct';
		addScore(teamId, 1);
	}
	autosave();
	renderEliminationRoster();
}
function nextEliminationRound() {
	if (eliminationAliveIds.length <= 1) return;
	eliminationIdx++;
	renderEliminationProblem();
}
function toggleEliminationTimer() {
	const btn = document.getElementById('eliminationTimerToggle');
	if (eliminationTimerInterval) {
		clearInterval(eliminationTimerInterval);
		eliminationTimerInterval = null;
		btn.textContent = 'Start';
	} else {
		btn.textContent = 'Pause';
		eliminationTimerInterval = setInterval(() => {
			if (eliminationTimerSeconds > 0) {
				eliminationTimerSeconds--;
				renderEliminationTimer();
			} else {
				clearInterval(eliminationTimerInterval);
				eliminationTimerInterval = null;
				btn.textContent = 'Start';
			}
		}, 1000);
	}
}
function renderEliminationTimer() {
	const el = document.getElementById('eliminationTimerDisplay');
	if (!el) return;
	const m = String(Math.floor(eliminationTimerSeconds / 60)).padStart(2, '0');
	const s = String(eliminationTimerSeconds % 60).padStart(2, '0');
	el.textContent = `${m}:${s}`;
	el.classList.toggle('low', eliminationTimerSeconds <= 10);
}
function resetEliminationTimer() {
	clearInterval(eliminationTimerInterval);
	eliminationTimerInterval = null;
	eliminationTimerSeconds = 60;
	renderEliminationTimer();
	const btn = document.getElementById('eliminationTimerToggle');
	if (btn) btn.textContent = 'Start';
}
function openEliminationModal() {
	openModal(
		'Manage Elimination Gauntlet Questions',
		`
    <div class="field-label">Tier (1-4, optional — just a difficulty badge)</div>
    <input type="text" id="newElimTier" placeholder="e.g. 2" />
    <div class="field-label">Question (use $...$ for math)</div>
    <textarea id="newElimQ" placeholder="e.g. Solve for $x$: $2x+5=17$."></textarea>
    <div class="field-label">Question image (optional)</div>
    <div id="newElimQImgWrap"></div>
    <div class="field-label">Answer</div>
    <input type="text" id="newElimA" placeholder="e.g. $x=6$" />
    <div class="field-label">Explanation</div>
    <textarea id="newElimE" placeholder="Show the reasoning."></textarea>
    <div class="field-label">Answer image (optional)</div>
    <div id="newElimAImgWrap"></div>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomElimination()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customEliminationList"></div>
  `,
	);
	pendingElimQImg = null;
	pendingElimAImg = null;
	renderElimImgFields();
	renderCustomEliminationList();
}
function renderElimImgFields() {
	renderImgUploadField('newElimQImgWrap', 'newElimQImgFile', pendingElimQImg, (val) => {
		pendingElimQImg = val;
		renderElimImgFields();
	});
	renderImgUploadField('newElimAImgWrap', 'newElimAImgFile', pendingElimAImg, (val) => {
		pendingElimAImg = val;
		renderElimImgFields();
	});
}
function addCustomElimination() {
	const tierRaw = document.getElementById('newElimTier').value.trim();
	const tier = tierRaw
		? Math.max(1, Math.min(4, parseInt(tierRaw, 10) || 0))
		: null;
	const q = document.getElementById('newElimQ').value.trim();
	const a = document.getElementById('newElimA').value.trim();
	const e = document.getElementById('newElimE').value.trim();
	if (!q || !a) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customElimination.push({
		tier,
		q,
		qImg: pendingElimQImg || undefined,
		a,
		e,
		aImg: pendingElimAImg || undefined,
	});
	document.getElementById('newElimTier').value = '';
	document.getElementById('newElimQ').value = '';
	document.getElementById('newElimA').value = '';
	document.getElementById('newElimE').value = '';
	pendingElimQImg = null;
	pendingElimAImg = null;
	renderElimImgFields();
	renderCustomEliminationList();
	autosave();
}
function deleteCustomElimination(i) {
	customElimination.splice(i, 1);
	renderCustomEliminationList();
	autosave();
}
function renderCustomEliminationList() {
	const el = document.getElementById('customEliminationList');
	if (!el) return;
	if (customElimination.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customElimination
		.map(
			(p, i) => `
    <div class="custom-list-item">
      ${p.qImg || p.aImg ? `<img class="thumb" src="${p.qImg || p.aImg}" alt="" />` : ''}
      <div class="txt"><b>${p.tier ? 'Tier ' + p.tier : 'No tier'}</b> — ${escapeHtml(p.q)}<br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomElimination(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
