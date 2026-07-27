let customSequence = [];
let sequencePool = [];
let sequenceIndex = 0;

const sequenceTimer = createCountdownTimer({
	seconds: 60,
	displayId: 'sequenceTimerDisplay',
	toggleBtnId: 'sequenceTimerToggle',
});
const defaultSequenceSeconds = 60;

function initSequence() {
	resetSequence();
}

function resetSequence() {
	sequencePool = customSequence;
	sequenceIndex = 0;
	renderSequenceProblem();
}

function nextSequenceProblem() {
	sequenceIndex++;
	renderSequenceProblem();
	autosave();
}

function toggleSequenceTimer() {
	sequenceTimer.toggle();
}

function resetSequenceTimer() {
	sequenceTimer.reset();
}

function renderSequenceProblem() {
	sequencePool = customSequence;
	const box = document.getElementById('sequenceAnswerBox');
	if (box) box.classList.remove('show');

	if (sequencePool.length === 0) {
		document.getElementById('sequenceProgress').textContent = 'No sequences yet';
		document.getElementById('sequenceQuestionText').textContent =
			'No sequences yet, use "Manage Sequences" above to add some.';
		sequenceTimer.stop();
		renderSequenceAwardButtons();
		return;
	}

	const set = sequencePool[sequenceIndex % sequencePool.length];
	document.getElementById('sequenceProgress').textContent =
		`Sequence ${(sequenceIndex % sequencePool.length) + 1} of ${sequencePool.length}`;

	const shown = set.terms.slice(0, set.terms.length - set.hiddenCount);
	const hiddenMarks = Array(set.hiddenCount).fill('?');
	const questionEl = document.getElementById('sequenceQuestionText');
	questionEl.textContent = shown.concat(hiddenMarks).join(',  ');
	typeset(questionEl);

	sequenceTimer.setDuration(set.time || defaultSequenceSeconds);
	renderSequenceAwardButtons();
}

function revealSequenceAnswer() {
	if (sequencePool.length === 0) return;
	sequenceTimer.stop();
	const set = sequencePool[sequenceIndex % sequencePool.length];
	const hidden = set.terms.slice(set.terms.length - set.hiddenCount);

	document.getElementById('sequenceAnswerFigure').textContent =
		`${set.patternName} — next: ${hidden.join(', ')}`;
	document.getElementById('sequenceAnswerReasoning').textContent = set.e || '';
	const box = document.getElementById('sequenceAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderSequenceAwardButtons() {
	renderTeamAwardButtons('awardSequence', teams, () => [
		{ label: '+1 Named the pattern', points: 1 },
		{ label: '+1 Got the next term(s)', points: 1 },
	]);
}

function openSequenceModal() {
	openModal(
		'Manage Sequence Detective Sets',
		`
			<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">
				List every term in order (comma-separated), including the ones you want
				hidden at the end. Teams see everything up to the hidden count as "?" and
				have to work out both the rule and the missing term(s).
			</div>
			<div class="field-label">Time limit in seconds (optional, defaults to standard timer)</div>
			<input type="number" min="1" id="newSeqTime" placeholder="e.g. 60" />
			<div class="field-label">Pattern name / rule (shown on reveal)</div>
			<input type="text" id="newSeqPattern" placeholder="e.g. Geometric, ×3" />
			<div class="field-label">Full sequence, comma-separated (include the hidden terms at the end)</div>
			<input type="text" id="newSeqTerms" placeholder="e.g. 2, 6, 18, 54, 162" />
			<div class="field-label">How many trailing terms to hide</div>
			<input type="number" min="1" max="4" id="newSeqHidden" placeholder="e.g. 1" value="1" />
			<div class="field-label">Explanation</div>
			<textarea id="newSeqE" placeholder="Show the reasoning."></textarea>
			<button class="btn primary" style="margin-top: 12px;" onclick="addCustomSequence()">Add Sequence</button>
			<div class="field-label" style="margin-top: 22px;">Your sequences</div>
			<div id="customSequenceList"></div>
		`,
	);
	renderCustomSequenceList();
}

function addCustomSequence() {
	const timeInput = document.getElementById('newSeqTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const patternName = document.getElementById('newSeqPattern').value.trim();
	const termsRaw = document.getElementById('newSeqTerms').value.trim();
	const hiddenCount = Math.max(
		1,
		parseInt(document.getElementById('newSeqHidden').value, 10) || 1,
	);
	const explanation = document.getElementById('newSeqE').value.trim();
	const terms = termsRaw
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);

	if (!patternName || terms.length < 3 || hiddenCount >= terms.length) {
		alert(
			'Enter a pattern name, at least 3 terms total, and a hidden count smaller than the number of terms.',
		);
		return;
	}

	customSequence.push({ time, patternName, terms, hiddenCount, e: explanation });
	document.getElementById('newSeqTime').value = '';
	document.getElementById('newSeqPattern').value = '';
	document.getElementById('newSeqTerms').value = '';
	document.getElementById('newSeqHidden').value = '';
	document.getElementById('newSeqE').value = '';
	renderCustomSequenceList();
	autosave();
}

function deleteCustomSequence(i) {
	deleteCustomItem(customSequence, i, renderCustomSequenceList);
}

function renderCustomSequenceList() {
	renderCustomList(
		'customSequenceList',
		customSequence,
		(set, i) => `
		<div class="custom-list-item">
			<div class="txt">
				${set.time ? `<b>${set.time}s</b> — ` : ''}<b>${escapeHtml(set.patternName)}</b><br>
				${escapeHtml(set.terms.join(', '))} <span style="color: var(--chalk-muted);">(last ${set.hiddenCount} hidden)</span>
			</div>
			<button class="btn small ghost" onclick="deleteCustomSequence(${i})">Delete</button>
		</div>
	`,
	);
}