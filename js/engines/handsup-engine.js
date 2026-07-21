// Hands-Up Steal engine — one question shown to everyone. Host calls on
// whichever team raises a hand first; a wrong answer keeps the question
// live for another team to steal (worth less). No hardware needed.
// Expects a global `builtinHandsup` array of { q, a, e } objects.
let customHandsup = [];
function getHandsupPool() {
	return builtinHandsup.concat(customHandsup);
}
let handsupPool = [],
	handsupIdx = 0;
let handsupTriedIds = {}; // teamId -> true, reset each question
let handsupSolvedBy = null; // teamId once someone gets it right

function resetHandsup() {
	handsupIdx = 0;
	renderHandsupProblem();
}
function renderHandsupProblem() {
	handsupPool = getHandsupPool();
	handsupTriedIds = {};
	handsupSolvedBy = null;
	const box = document.getElementById('handsupAnswerBox');
	if (box) box.classList.remove('show');
	if (handsupPool.length === 0) {
		document.getElementById('handsupProgress').textContent =
			'No questions yet';
		document.getElementById('handsupQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		renderHandsupTeamButtons();
		return;
	}
	const p = handsupPool[handsupIdx % handsupPool.length];
	document.getElementById('handsupProgress').textContent =
		`Problem ${(handsupIdx % handsupPool.length) + 1} of ${handsupPool.length}`;
	document.getElementById('handsupQuestionText').textContent = p.q;
	typeset(document.getElementById('handsupQuestionText'));
	renderHandsupTeamButtons();
}
function revealHandsupAnswer() {
	if (handsupPool.length === 0) return;
	const p = handsupPool[handsupIdx % handsupPool.length];
	document.getElementById('handsupAnswerFigure').textContent = p.a;
	document.getElementById('handsupAnswerReasoning').textContent = p.e;
	const box = document.getElementById('handsupAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function nextHandsupProblem() {
	handsupIdx++;
	renderHandsupProblem();
}
function renderHandsupTeamButtons() {
	const el = document.getElementById('handsupTeamButtons');
	if (!el) return;
	if (handsupPool.length === 0) {
		el.innerHTML = '';
		return;
	}
	if (handsupSolvedBy) {
		const winner = teams.find((t) => t.id === handsupSolvedBy);
		el.innerHTML = winner
			? `<div class="handsup-solved" style="color:${winner.color}">✓ ${escapeHtml(winner.name)} got it! Hit "Next Problem" to continue.</div>`
			: '';
		return;
	}
	const allTried = teams.every((t) => handsupTriedIds[t.id]);
	if (allTried && teams.length > 0) {
		el.innerHTML = `<div class="handsup-solved">No one got it — reveal the answer and move on.</div>`;
		return;
	}
	el.innerHTML = teams
		.map((t) => {
			const tried = handsupTriedIds[t.id];
			const pts = Object.keys(handsupTriedIds).length === 0 ? 2 : 1;
			if (tried) {
				return `<div class="handsup-team-row tried" style="border-left-color:${t.color}">
          <span class="handsup-team-name">${escapeHtml(t.name)}</span>
          <span class="handsup-tried-tag">already tried</span>
        </div>`;
			}
			return `<div class="handsup-team-row" style="border-left-color:${t.color}">
        <span class="handsup-team-name">${escapeHtml(t.name)}</span>
        <div class="handsup-team-btns">
          <button class="btn sm primary" onclick="markHandsupResult('${t.id}',true)">✓ Correct +${pts}</button>
          <button class="btn sm ghost" onclick="markHandsupResult('${t.id}',false)">✗ Wrong</button>
        </div>
      </div>`;
		})
		.join('');
}
function markHandsupResult(teamId, correct) {
	if (handsupSolvedBy || handsupTriedIds[teamId]) return;
	if (correct) {
		const pts = Object.keys(handsupTriedIds).length === 0 ? 2 : 1;
		addScore(teamId, pts);
		handsupSolvedBy = teamId;
	} else {
		handsupTriedIds[teamId] = true;
	}
	autosave();
	renderHandsupTeamButtons();
}
function openHandsupModal() {
	openModal(
		'Manage Hands-Up Steal Questions',
		`
    <div class="field-label">Question (use $...$ for math)</div>
    <textarea id="newHandsupQ" placeholder="e.g. What is $\\binom{6}{2}$?"></textarea>
    <div class="field-label">Answer</div>
    <input type="text" id="newHandsupA" placeholder="e.g. 15" />
    <div class="field-label">Explanation</div>
    <textarea id="newHandsupE" placeholder="Show the reasoning."></textarea>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomHandsup()">Add Question</button>
    <div class="field-label" style="margin-top:22px;">Your custom questions</div>
    <div id="customHandsupList"></div>
  `,
	);
	renderCustomHandsupList();
}
function addCustomHandsup() {
	const q = document.getElementById('newHandsupQ').value.trim();
	const a = document.getElementById('newHandsupA').value.trim();
	const e = document.getElementById('newHandsupE').value.trim();
	if (!q || !a) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customHandsup.push({ q, a, e });
	document.getElementById('newHandsupQ').value = '';
	document.getElementById('newHandsupA').value = '';
	document.getElementById('newHandsupE').value = '';
	renderCustomHandsupList();
	autosave();
}
function deleteCustomHandsup(i) {
	customHandsup.splice(i, 1);
	renderCustomHandsupList();
	autosave();
}
function renderCustomHandsupList() {
	const el = document.getElementById('customHandsupList');
	if (!el) return;
	if (customHandsup.length === 0) {
		el.innerHTML =
			'<div style="color:var(--chalk-muted);font-size:13px;">No custom questions yet.</div>';
		return;
	}
	el.innerHTML = customHandsup
		.map(
			(p, i) => `
    <div class="custom-list-item">
      <div class="txt"><b>${escapeHtml(p.q)}</b><br>${escapeHtml(p.a)}</div>
      <button class="btn sm ghost" onclick="deleteCustomHandsup(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
}
