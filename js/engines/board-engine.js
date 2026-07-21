// Board engine — Jeopardy-style board, categories × point values.
// Expects `defaultRelayData()` returning { categories, cells } where
// cells is keyed "colIdx-value" -> { question, answer, explanation }.
const relayValues = [100, 200, 300, 400];
let relayData = defaultRelayData();
let relayUsed = {};
let currentRelayKey = null;

function renderRelayGrid() {
	const grid = document.getElementById('relayGrid');
	grid.style.gridTemplateColumns = `repeat(${relayData.categories.length}, 1fr)`;
	let html = '';
	relayData.categories.forEach((cat) => {
		html += `<div class="relay-header">${escapeHtml(cat)}</div>`;
	});
	relayValues.forEach((val) => {
		relayData.categories.forEach((cat, ci) => {
			const key = `${ci}-${val}`;
			const used = !!relayUsed[key];
			const checkIcon =
				'<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
			html += `<div class="relay-cell${used ? ' used' : ''}" onclick="${used ? '' : `openRelayCell(${ci},${val})`}">${used ? checkIcon : '$' + val}</div>`;
		});
	});
	grid.innerHTML = html;
}
function openRelayCell(catIdx, value) {
	const key = `${catIdx}-${value}`;
	const cell = relayData.cells[key];
	if (!cell || relayUsed[key]) return;
	currentRelayKey = key;
	document.getElementById('relayGrid').style.display = 'none';
	document.getElementById('relayQuestion').style.display = 'block';
	document.getElementById('relayCatBadge').textContent =
		`${relayData.categories[catIdx]} · ${value} pts`;
	document.getElementById('relayQuestionText').textContent = cell.question;
	document.getElementById('relayAnswerBox').classList.remove('show');
	typeset(document.getElementById('relayQuestionText'));
	renderRelayAwardButtons();
}
function revealRelayAnswer() {
	const cell = relayData.cells[currentRelayKey];
	if (!cell) return;
	document.getElementById('relayAnswerFigure').textContent = cell.answer;
	document.getElementById('relayAnswerReasoning').textContent =
		cell.explanation || '';
	const box = document.getElementById('relayAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function renderRelayAwardButtons() {
	const el = document.getElementById('award-relay');
	if (!el || !currentRelayKey) return;
	const value = parseInt(currentRelayKey.split('-')[1], 10);
	const pts = value / 100;
	el.innerHTML = teams
		.map(
			(t) => `
    <button class="btn award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',${pts},event); closeRelayQuestion();">+${pts} <span>${escapeHtml(t.name)}</span></button>
  `,
		)
		.join('');
}
function closeRelayQuestion() {
	if (currentRelayKey) {
		relayUsed[currentRelayKey] = true;
	}
	currentRelayKey = null;
	document.getElementById('relayQuestion').style.display = 'none';
	document.getElementById('relayGrid').style.display = 'grid';
	renderRelayGrid();
}
function resetRelayBoard() {
	relayUsed = {};
	renderRelayGrid();
}
function openRelayModal() {
	let catInputs = relayData.categories
		.map(
			(c, i) => `
    <div class="relay-edit-cat">
      <span class="mono" style="color:var(--chalk-muted);font-size:12px;">Cat ${i + 1}</span>
      <input type="text" value="${escapeAttr(c)}" oninput="relayData.categories[${i}] = this.value" />
    </div>
  `,
		)
		.join('');
	let rows = '';
	relayData.categories.forEach((cat, ci) => {
		relayValues.forEach((val) => {
			const key = `${ci}-${val}`;
			const cell = relayData.cells[key] || {
				question: '',
				answer: '',
				explanation: '',
			};
			rows += `
        <div class="relay-edit-row">
          <div class="pts-label">${escapeHtml(cat)} · ${val} pts</div>
          <div class="field-label">Question</div>
          <textarea oninput="updateRelayCell('${key}','question',this.value)">${escapeHtml(cell.question)}</textarea>
          <div class="field-label">Answer</div>
          <input type="text" value="${escapeAttr(cell.answer)}" oninput="updateRelayCell('${key}','answer',this.value)" />
          <div class="field-label">Explanation</div>
          <textarea oninput="updateRelayCell('${key}','explanation',this.value)">${escapeHtml(cell.explanation)}</textarea>
        </div>
      `;
		});
	});
	openModal(
		'Edit Relay Board',
		`
    <div class="field-label" style="margin-top:0;">Category names</div>
    ${catInputs}
    <div class="field-label" style="margin-top:22px;">Questions</div>
    ${rows}
    <button class="btn primary" onclick="closeModal(); renderRelayGrid(); autosave();">Done</button>
  `,
	);
}
function updateRelayCell(key, field, value) {
	if (!relayData.cells[key])
		relayData.cells[key] = { question: '', answer: '', explanation: '' };
	relayData.cells[key][field] = value;
}
