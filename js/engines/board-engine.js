const relayValues = [100, 200, 300, 400];

function buildEmptyRelayCells() {
	const cells = {};
	[0, 1, 2, 3].forEach((catIndex) => {
		relayValues.forEach((val) => {
			cells[`${catIndex}-${val}`] = { q: '', a: '', e: '' };
		});
	});
	return cells;
}

let relayData = {
	categories: ['', '', '', ''],
	cells: buildEmptyRelayCells(),
};

let relayUsed = {};
let currentRelayKey = null;

function initRelay() {
	renderRelayGrid();
}

function resetRelayBoard() {
	relayUsed = {};
	renderRelayGrid();
}

function renderRelayGrid() {
	const grid = document.getElementById('relayGrid');
	grid.style.gridTemplateColumns = `repeat(${relayData.categories.length}, 1fr)`;

	let html = relayData.categories
		.map((category) => `<div class="relay-header">${escapeHtml(category)}</div>`)
		.join('');

	relayValues.forEach((val) => {
		relayData.categories.forEach((category, i) => {
			html += renderRelayCellHtml(i, val);
		});
	});

	grid.innerHTML = html;
}

function renderRelayCellHtml(i, val) {
	const key = `${i}-${val}`;
	const used = !!relayUsed[key];
	const checkIcon = `
		<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
			stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 6 9 17l-5-5"/>
		</svg>
	`;
	return `
		<div
			class="relay-cell${used ? ' used' : ''}"
			onclick="${used ? '' : `openRelayCell(${i},${val})`}"
		>
			${used ? checkIcon : '$' + val}
		</div>
	`;
}

function openRelayCell(i, val) {
	const key = `${i}-${val}`;
	const cell = relayData.cells[key];
	if (!cell || relayUsed[key]) return;
	currentRelayKey = key;
	document.getElementById('relayGrid').style.display = 'none';
	document.getElementById('relayQuestion').style.display = 'flex';
	document.getElementById('relayCatBadge').textContent =
		`${relayData.categories[i]} · ${val} pts`;
	document.getElementById('relayQuestionText').textContent = cell.q;
	setPromptImage('relayQuestionImg', cell.qImg);
	document.getElementById('relayAnswerBox').classList.remove('show');
	typeset(document.getElementById('relayQuestionText'));
	renderRelayAwardButtons();
}

function revealRelayAnswer() {
	const cell = relayData.cells[currentRelayKey];
	if (!cell) return;
	document.getElementById('relayAnswerFigure').textContent = cell.a;
	setPromptImage('relayAnswerImg', cell.aImg);
	document.getElementById('relayAnswerReasoning').textContent = cell.e || '';
	const box = document.getElementById('relayAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderRelayAwardButtons() {
	if (!currentRelayKey) return;
	const value = parseInt(currentRelayKey.split('-')[1], 10);
	const pts = value / 100;
	renderTeamAwardButtons('awardRelay', teams, () => [
		{ label: `+${pts}`, points: pts },
	]);
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

function openRelayModal() {
	const catInputs = relayData.categories
		.map(
			(category, i) => `
				<div class="relay-edit-cat">
					<span class="mono" style="color: var(--chalk-muted); font-size: 12px;">Cat ${i + 1}</span>
					<input
						type="text"
						value="${escapeAttr(category)}"
						oninput="relayData.categories[${i}] = this.value"
						placeholder="e.g. Algebra"
					/>
				</div>
			`,
		)
		.join('');

	let rows = '';
	relayData.categories.forEach((category, i) => {
		relayValues.forEach((val) => {
			rows += renderRelayEditRowHtml(`${i}-${val}`, category, val);
		});
	});

	openModal(
		'Edit Relay Board',
		`
			<div class="field-label" style="margin-top: 0;">Category names</div>
			${catInputs}
			<div class="field-label" style="margin-top: 22px;">Questions</div>
			${rows}
			<button class="btn primary" onclick="closeModal(); renderRelayGrid(); autosave();">
				Done
			</button>
		`,
	);
	renderRelayImgFields();
}

function renderRelayEditRowHtml(key, category, val) {
	const cell = relayData.cells[key] || { q: '', a: '', e: '' };
	return `
		<div class="relay-edit-row">
		<div class="pts-label">${escapeHtml(category)} · ${val} pts</div>
		<div class="field-label">Question</div>
		<textarea
			oninput="updateRelayCell('${key}', 'q', this.value)"
			placeholder="e.g. What is $\\binom{6}{2}$?"
		>${escapeHtml(cell.q)}</textarea>
		<div class="field-label">Question image (optional)</div>
		<div id="relayQImgWrap-${key}"></div>
		<div class="field-label">Answer</div>
		<input
			type="text"
			value="${escapeAttr(cell.a)}"
			oninput="updateRelayCell('${key}', 'a', this.value)"
			placeholder="e.g. 15"
		/>
		<div class="field-label">Explanation</div>
		<textarea
			oninput="updateRelayCell('${key}', 'e', this.value)"
			placeholder="Show the reasoning."
		>${escapeHtml(cell.e)}</textarea>
		<div class="field-label">Answer image (optional)</div>
		<div id="relayAImgWrap-${key}"></div>
		</div>
	`;
}

function updateRelayCell(key, field, val) {
	if (!relayData.cells[key]) relayData.cells[key] = { q: '', a: '', e: '' };
	relayData.cells[key][field] = val;
}

function renderRelayImgFields() {
	relayData.categories.forEach((category, i) => {
		relayValues.forEach((val) => {
			const key = `${i}-${val}`;
			if (!relayData.cells[key]) relayData.cells[key] = { q: '', a: '', e: '' };
			const cell = relayData.cells[key];
			renderImgUploadField(
				'relayQImgWrap-' + key,
				'relayQImgFile-' + key,
				cell.qImg,
				(val2) => {
					cell.qImg = val2;
					renderRelayImgFields();
				},
			);
			renderImgUploadField(
				'relayAImgWrap-' + key,
				'relayAImgFile-' + key,
				cell.aImg,
				(val2) => {
					cell.aImg = val2;
					renderRelayImgFields();
				},
			);
		});
	});
}
