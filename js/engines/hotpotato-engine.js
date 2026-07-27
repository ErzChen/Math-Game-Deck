let customHotPotato = [];
let hotPotatoPool = [];
let hotPotatoIndex = 0;
let hotPotatoState = 'idle';
let hotPotatoHolderId = null;
let hotPotatoValue = 1;
let hotPotatoAutoMin = 30;
let hotPotatoAutoMax = 90;
let hotPotatoAutoTimeoutId = null;
let hotPotatoEndedHolderId = null;
let hotPotatoEndedValue = 0;
let hotPotatoEndedAuto = false;

const hotPotatoImageFields = createQAImageState({
	qWrap: 'newHotPotatoQImgWrap',
	qFile: 'newHotPotatoQImgFile',
	aWrap: 'newHotPotatoAImgWrap',
	aFile: 'newHotPotatoAImgFile',
});

function initHotPotato() {
	hotPotatoPool = customHotPotato;
	newHotPotato();
}

function newHotPotato() {
	clearHotPotatoAutoTimeout();
	hotPotatoState = 'idle';
	hotPotatoHolderId = null;
	hotPotatoValue = 1;
	hotPotatoIndex = 0;
	hotPotatoEndedHolderId = null;
	hotPotatoEndedValue = 0;
	hotPotatoEndedAuto = false;
	renderHotPotatoScreen();
}

function populateHotPotatoTeamSelector() {
	const select = document.getElementById('hotPotatoTeamSelect');
	if (!select) return;
	const prev = select.value;
	select.innerHTML = teams
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');
	if (teams.find((team) => team.id === prev)) select.value = prev;
	select.disabled = hotPotatoState !== 'idle';
}

function clearHotPotatoAutoTimeout() {
	if (hotPotatoAutoTimeoutId) {
		clearTimeout(hotPotatoAutoTimeoutId);
		hotPotatoAutoTimeoutId = null;
	}
}

function scheduleHotPotatoAutoCutoff() {
	clearHotPotatoAutoTimeout();
	const min = Math.max(5, hotPotatoAutoMin || 30);
	const max = Math.max(min, hotPotatoAutoMax || 90);
	const delayMs = (min + Math.random() * (max - min)) * 1000;
	hotPotatoAutoTimeoutId = setTimeout(() => {
		if (hotPotatoState === 'question' || hotPotatoState === 'pass') {
			cutOffHotPotato(true);
		}
	}, delayMs);
}

function startHotPotatoRound() {
	hotPotatoPool = customHotPotato;
	if (hotPotatoPool.length === 0) {
		alert('Add some questions first via "Manage Questions".');
		return;
	}
	const select = document.getElementById('hotPotatoTeamSelect');
	if (!select || !select.value) {
		alert('Pick a team to hand the potato to first.');
		return;
	}
	hotPotatoHolderId = select.value;
	hotPotatoValue = 1;
	hotPotatoIndex = 0;
	hotPotatoState = 'question';
	scheduleHotPotatoAutoCutoff();
	renderHotPotatoScreen();
	autosave();
}

function revealHotPotatoAnswer() {
	if (hotPotatoState !== 'question' || hotPotatoPool.length === 0) return;
	const problem = hotPotatoPool[hotPotatoIndex % hotPotatoPool.length];
	document.getElementById('hotPotatoAnswerFigure').textContent = problem.a;
	setPromptImage('hotPotatoAnswerImg', problem.aImg);
	document.getElementById('hotPotatoAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('hotPotatoAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function markHotPotatoCorrect(event) {
	if (hotPotatoState !== 'question') return;
	addScore(hotPotatoHolderId, 1, event);
	hotPotatoState = 'pass';
	autosave();
	renderHotPotatoScreen();
}

function confirmHotPotatoPass(targetId) {
	if (hotPotatoState !== 'pass' || !targetId || targetId === hotPotatoHolderId) return;
	hotPotatoHolderId = targetId;
	hotPotatoValue += 1;
	hotPotatoIndex++;
	hotPotatoState = 'question';
	autosave();
	renderHotPotatoScreen();
}

function cutOffHotPotato(auto) {
	if (hotPotatoState !== 'question' && hotPotatoState !== 'pass') return;
	clearHotPotatoAutoTimeout();
	const holder = teams.find((team) => team.id === hotPotatoHolderId);
	if (holder) {
		addScore(holder.id, -hotPotatoValue);
	}
	hotPotatoEndedHolderId = hotPotatoHolderId;
	hotPotatoEndedValue = hotPotatoValue;
	hotPotatoEndedAuto = !!auto;
	hotPotatoState = 'ended';
	autosave();
	renderHotPotatoScreen();
}

function setHotPotatoSetting(kind, val) {
	if (kind === 'min') hotPotatoAutoMin = Math.max(5, parseInt(val, 10) || 30);
	if (kind === 'max') hotPotatoAutoMax = Math.max(hotPotatoAutoMin, parseInt(val, 10) || 90);
	renderHotPotatoSettingsInputs();
	autosave();
}

function renderHotPotatoSettingsInputs() {
	const minInput = document.getElementById('hotPotatoAutoMin');
	const maxInput = document.getElementById('hotPotatoAutoMax');
	if (minInput && document.activeElement !== minInput) minInput.value = hotPotatoAutoMin;
	if (maxInput && document.activeElement !== maxInput) maxInput.value = hotPotatoAutoMax;
}

function renderHotPotatoQuestion() {
	hotPotatoPool = customHotPotato;
	const holderBadge = document.getElementById('hotPotatoHolderBadge');
	const valueEl = document.getElementById('hotPotatoValueDisplay');
	if (valueEl) valueEl.textContent = hotPotatoValue;

	const holder = teams.find((team) => team.id === hotPotatoHolderId);
	if (holderBadge) {
		holderBadge.textContent = holder ? `${holder.name} is holding the potato` : '';
		holderBadge.style.color = holder ? holder.color : '';
		holderBadge.style.borderColor = holder ? holder.color : '';
	}

	if (hotPotatoPool.length === 0) return;
	const problem = hotPotatoPool[hotPotatoIndex % hotPotatoPool.length];
	const questionEl = document.getElementById('hotPotatoQuestionText');
	questionEl.textContent = problem.q;
	setPromptImage('hotPotatoQuestionImg', problem.qImg);
	typeset(questionEl);
	const box = document.getElementById('hotPotatoAnswerBox');
	if (box) box.classList.remove('show');
}

function renderHotPotatoPassPanel() {
	const wrap = document.getElementById('hotPotatoPassWrap');
	if (!wrap) return;
	if (hotPotatoState !== 'pass') {
		wrap.style.display = 'none';
		wrap.innerHTML = '';
		return;
	}
	const holder = teams.find((team) => team.id === hotPotatoHolderId);
	const options = teams
		.filter((team) => team.id !== hotPotatoHolderId)
		.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
		.join('');
	wrap.style.display = '';
	wrap.innerHTML = `
		<div class="summary-line middle">
			${holder ? escapeHtml(holder.name) : 'The holder'} got it right! The potato is now worth
			<b>${hotPotatoValue + 1}</b>. Pass it to:
		</div>
		<div class="duel-picker middle">
			<select id="hotPotatoPassSelect">${options}</select>
			<button class="btn primary" onclick="confirmHotPotatoPass(document.getElementById('hotPotatoPassSelect').value)">
				Pass It
			</button>
		</div>
	`;
}

function renderHotPotatoEndedPanel() {
	const wrap = document.getElementById('hotPotatoEndedWrap');
	if (!wrap) return;
	if (hotPotatoState !== 'ended') {
		wrap.style.display = 'none';
		wrap.innerHTML = '';
		return;
	}
	const holder = teams.find((team) => team.id === hotPotatoEndedHolderId);
	wrap.style.display = '';
	wrap.innerHTML = `
		<div class="summary-line middle">
			${hotPotatoEndedAuto ? 'The hidden cutoff hit!' : 'Cut off!'}
			${holder ? `<b style="color: ${holder.color};">${escapeHtml(holder.name)}</b>` : 'The last holder'}
			was left holding the potato and forfeits <b>${hotPotatoEndedValue}</b> pt${hotPotatoEndedValue === 1 ? '' : 's'}.
		</div>
		<div class="row-actions middle">
			<button class="btn ghost" onclick="newHotPotato()">New Potato</button>
		</div>
	`;
}

function renderHotPotatoScreen() {
	populateHotPotatoTeamSelector();
	renderHotPotatoSettingsInputs();

	const idleWrap = document.getElementById('hotPotatoIdleWrap');
	const activeWrap = document.getElementById('hotPotatoActiveWrap');
	const endedWrap = document.getElementById('hotPotatoEndedWrap');
	const progress = document.getElementById('hotPotatoProgress');
	const judgeControls = document.getElementById('hotPotatoJudgeControls');

	if (hotPotatoPool.length === 0 && hotPotatoState === 'idle') {
		if (progress) progress.textContent = 'No questions yet, use "Manage Questions" above to add some.';
	}

	if (hotPotatoState === 'idle') {
		if (idleWrap) idleWrap.style.display = '';
		if (activeWrap) activeWrap.style.display = 'none';
		if (endedWrap) endedWrap.style.display = 'none';
		if (progress && hotPotatoPool.length > 0) {
			progress.textContent = 'Pick a team to start holding the potato';
		}
		return;
	}

	if (idleWrap) idleWrap.style.display = 'none';
	if (endedWrap) endedWrap.style.display = 'none';

	if (hotPotatoState === 'ended') {
		if (activeWrap) activeWrap.style.display = 'none';
		renderHotPotatoEndedPanel();
		if (progress) progress.textContent = '';
		return;
	}

	if (activeWrap) activeWrap.style.display = '';
	if (progress) {
		progress.textContent = `Question ${(hotPotatoIndex % hotPotatoPool.length) + 1} of ${hotPotatoPool.length}`;
	}
	renderHotPotatoQuestion();
	renderHotPotatoPassPanel();

	if (judgeControls) {
		judgeControls.style.display = hotPotatoState === 'question' ? '' : 'none';
	}
}

function openHotPotatoModal() {
	openQuestionManagerModal('Manage Hot Potato Questions', {
		fieldPrefix: 'newHotPotato',
		listId: 'customHotPotatoList',
		addFnName: 'addCustomHotPotato',
		helpText:
			'These feed the shared pool the current potato holder answers. A correct answer always passes the potato onward, adding 1 pt to its value.',
	});
	hotPotatoImageFields.reset();
	renderCustomHotPotatoList();
}

function addCustomHotPotato() {
	const question = document.getElementById('newHotPotatoQ').value.trim();
	const answer = document.getElementById('newHotPotatoA').value.trim();
	const explanation = document.getElementById('newHotPotatoE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customHotPotato.push({
		q: question,
		qImg: hotPotatoImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: hotPotatoImageFields.state.a || undefined,
	});
	document.getElementById('newHotPotatoQ').value = '';
	document.getElementById('newHotPotatoA').value = '';
	document.getElementById('newHotPotatoE').value = '';
	hotPotatoImageFields.reset();
	renderCustomHotPotatoList();
	autosave();
}

function deleteCustomHotPotato(i) {
	deleteCustomItem(customHotPotato, i, renderCustomHotPotatoList);
}

function renderCustomHotPotatoList() {
	renderCustomList(
		'customHotPotatoList',
		customHotPotato,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomHotPotato(${i})">Delete</button>
		</div>
	`,
	);
}
