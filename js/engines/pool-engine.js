let customPool = [];
let poolQuestionPool = [];
let poolQuestionIndex = 0;

let gamblePredictions = {};
let poolMatchBonus = 1;
let poolFinalBonus = 3;
let poolCheckpointCount = 0;
let poolLastResults = null;

const poolTimer = createCountdownTimer({
	seconds: 60,
	displayId: 'poolTimerDisplay',
	toggleBtnId: 'poolTimerToggle',
});
const defaultPoolSeconds = 60;

const poolImageFields = createQAImageState({
	qWrap: 'newPoolQImgWrap',
	qFile: 'newPoolQImgFile',
	aWrap: 'newPoolAImgWrap',
	aFile: 'newPoolAImgFile',
});

function initPool() {
	poolQuestionPool = customPool;
	poolQuestionIndex = 0;
	ensurePoolPredictions();
	renderPoolScreen();
}

function ensurePoolPredictions() {
	Object.keys(gamblePredictions).forEach((predictorId) => {
		if (!teams.some((team) => team.id === predictorId)) {
			delete gamblePredictions[predictorId];
		}
	});
	teams.forEach((team) => {
		let arr = Array.isArray(gamblePredictions[team.id])
			? gamblePredictions[team.id].filter((id) => teams.some((t) => t.id === id))
			: [];
		teams.forEach((t) => {
			if (!arr.includes(t.id)) arr.push(t.id);
		});
		gamblePredictions[team.id] = arr;
	});
}

function poolStandingsOrder() {
	return teams
		.map((team, i) => ({ team, i }))
		.sort((a, b) => b.team.score - a.team.score || a.i - b.i)
		.map((team) => team.team.id);
}

function setPoolPrediction(predictorId, posIndex, newTeamId) {
	ensurePoolPredictions();
	const arr = gamblePredictions[predictorId];
	if (!arr) return;
	const oldIndex = arr.indexOf(newTeamId);
	if (oldIndex === posIndex) return;
	const displaced = arr[posIndex];
	arr[posIndex] = newTeamId;
	if (oldIndex !== -1) arr[oldIndex] = displaced;
	renderPoolPredictionPanel();
	autosave();
}

function setPoolSetting(kind, val) {
	if (kind === 'match') poolMatchBonus = Math.max(0, parseInt(val, 10) || 0);
	if (kind === 'final') poolFinalBonus = Math.max(0, parseInt(val, 10) || 0);
	renderPoolSettingsInputs();
	autosave();
}

function renderPoolSettingsInputs() {
	const matchInput = document.getElementById('poolMatchBonusInput');
	const finalInput = document.getElementById('poolFinalBonusInput');
	if (matchInput && document.activeElement !== matchInput)
		matchInput.value = poolMatchBonus;
	if (finalInput && document.activeElement !== finalInput)
		finalInput.value = poolFinalBonus;
}

function runPoolCheckpoint(isFinal) {
	ensurePoolPredictions();
	if (teams.length < 2) {
		alert('Add at least two teams before running a checkpoint.');
		return;
	}
	const standingsOrder = poolStandingsOrder();
	const results = teams.map((predictor) => {
		const prediction = gamblePredictions[predictor.id] || [];
		let matches = 0;
		prediction.forEach((id, i) => {
			if (standingsOrder[i] === id) matches++;
		});
		const fullMatch = !!isFinal && matches === teams.length;
		let awarded = matches * poolMatchBonus;
		if (fullMatch) awarded += poolFinalBonus;
		if (awarded > 0) addScore(predictor.id, awarded);
		return { teamId: predictor.id, matches, fullMatch, awarded };
	});
	poolCheckpointCount++;
	poolLastResults = {
		results,
		isFinal: !!isFinal,
		standingsOrder,
		count: poolCheckpointCount,
	};
	autosave();
	renderPoolScreen();
}

function nextPoolProblem() {
	poolQuestionIndex++;
	renderPoolProblem();
	autosave();
}

function togglePoolTimer() {
	poolTimer.toggle();
}

function resetPoolTimer() {
	poolTimer.reset();
}

function renderPoolProblem() {
	poolQuestionPool = customPool;
	const box = document.getElementById('poolAnswerBox');
	if (box) box.classList.remove('show');

	if (poolQuestionPool.length === 0) {
		const progress = document.getElementById('poolProgress');
		if (progress)
			progress.textContent =
				'No questions yet, use "Manage Questions" above to add some.';
		const qEl = document.getElementById('poolQuestionText');
		if (qEl) qEl.textContent = '';
		setPromptImage('poolQuestionImg', null);
		poolTimer.stop();
		renderPoolAwardButtons();
		return;
	}

	const problem = poolQuestionPool[poolQuestionIndex % poolQuestionPool.length];
	const progress = document.getElementById('poolProgress');
	if (progress) {
		progress.textContent = `Problem ${(poolQuestionIndex % poolQuestionPool.length) + 1} of ${poolQuestionPool.length}`;
	}
	const qEl = document.getElementById('poolQuestionText');
	if (qEl) {
		qEl.textContent = problem.q;
		typeset(qEl);
	}
	setPromptImage('poolQuestionImg', problem.qImg);
	poolTimer.setDuration(problem.time || defaultPoolSeconds);
	renderPoolAwardButtons();
}

function revealPoolAnswer() {
	if (poolQuestionPool.length === 0) return;
	poolTimer.stop();
	const problem = poolQuestionPool[poolQuestionIndex % poolQuestionPool.length];
	document.getElementById('poolAnswerFigure').textContent = problem.a;
	setPromptImage('poolAnswerImg', problem.aImg);
	document.getElementById('poolAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('poolAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderPoolAwardButtons() {
	renderTeamAwardButtons('awardPool', teams, () => [{ label: '+1', points: 1 }]);
}

function openPoolModal() {
	openQuestionManagerModal('Manage The Pool Questions', {
		fieldPrefix: 'newPool',
		listId: 'customPoolList',
		addFnName: 'addCustomPool',
		helpText:
			"These feed Pool's own shared pool, same quickfire setup as any other game, worth 1 pt per correct team. Predictions and checkpoints run separately, right on the Pool screen.",
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	poolImageFields.reset();
	renderCustomPoolList();
}

function addCustomPool() {
	const timeInput = document.getElementById('newPoolTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newPoolQ').value.trim();
	const answer = document.getElementById('newPoolA').value.trim();
	const explanation = document.getElementById('newPoolE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customPool.push({
		time,
		q: question,
		qImg: poolImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: poolImageFields.state.a || undefined,
	});
	document.getElementById('newPoolTime').value = '';
	document.getElementById('newPoolQ').value = '';
	document.getElementById('newPoolA').value = '';
	document.getElementById('newPoolE').value = '';
	poolImageFields.reset();
	renderCustomPoolList();
	autosave();
}

function deleteCustomPool(i) {
	deleteCustomItem(customPool, i, renderCustomPoolList);
}

function renderCustomPoolList() {
	renderCustomList(
		'customPoolList',
		customPool,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomPool(${i})">Delete</button>
		</div>
	`,
	);
}

function openPoolSettingsModal() {
	openModal(
		'Pool Settings',
		`
			<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">
				Set how many points a matched position is worth, and the bonus for a fully
				correct order at the final checkpoint. Sealed predictions themselves are set
				live on the Pool screen, right below the standings.
			</div>
			<div class="field-label">Points per matched position</div>
			<input type="number" min="0" id="poolMatchBonusInput" value="${poolMatchBonus}" onchange="setPoolSetting('match', this.value)" />
			<div class="field-label">Bonus for a full exact match at the final checkpoint</div>
			<input type="number" min="0" id="poolFinalBonusInput" value="${poolFinalBonus}" onchange="setPoolSetting('final', this.value)" />
		`,
	);
}

function renderPoolStandingsList() {
	const wrap = document.getElementById('poolStandingsList');
	if (!wrap) return;
	if (teams.length === 0) {
		wrap.innerHTML = '';
		return;
	}
	const order = poolStandingsOrder();
	wrap.innerHTML = order
		.map((id, i) => {
			const team = teams.find((team) => team.id === id);
			if (!team) return '';
			return `
				<div class="timeline-item" style="border-left: 3px solid ${team.color};">
					<span class="letter mono">${i + 1}.</span>
					<span class="team-name">${escapeHtml(team.name)}</span>
					<span class="stat-count mono" style="margin-left: auto;">${team.score} pts</span>
				</div>
			`;
		})
		.join('');
}

function renderPoolPredictionPanel() {
	const wrap = document.getElementById('poolPredictionPanel');
	if (!wrap) return;
	ensurePoolPredictions();
	if (teams.length < 2) {
		wrap.innerHTML =
			'<div style="color: var(--chalk-muted); font-size: 13px;">Add at least two teams to collect predictions.</div>';
		return;
	}

	wrap.innerHTML = teams
		.map((predictor) => {
			const prediction = gamblePredictions[predictor.id] || [];
			const slots = prediction
				.map((teamId, posIndex) => {
					const options = teams
						.map(
							(t) =>
								`<option value="${t.id}" ${teamId === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`,
						)
						.join('');
					return `
						<select
							class="inline-select mono"
							style="margin-right: 6px;"
							onchange="setPoolPrediction('${predictor.id}', ${posIndex}, this.value)"
						>
							${options}
						</select>
					`;
				})
				.join('');
			return `
				<div class="team-group" style="border-left-color: ${predictor.color}; flex-wrap: wrap;">
					<span class="team-name">${escapeHtml(predictor.name)}'s call (1st → last)</span>
					<div class="team-btns" style="flex-wrap: wrap;">${slots}</div>
				</div>
			`;
		})
		.join('');
}

function renderPoolCheckpointResults() {
	const wrap = document.getElementById('poolCheckpointResults');
	if (!wrap) return;
	if (!poolLastResults) {
		wrap.innerHTML = '';
		return;
	}
	const { results, isFinal, count } = poolLastResults;
	const rows = results
		.map((result) => {
			const team = teams.find((team) => team.id === result.teamId);
			if (!team) return '';
			return `
				<div class="team-group" style="border-left-color: ${team.color};">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<span class="stat-count mono">
						${result.matches} position${result.matches === 1 ? '' : 's'} matched
						${result.fullMatch ? ' · full match!' : ''}
						→ +${result.awarded} pt${result.awarded === 1 ? '' : 's'}
					</span>
				</div>
			`;
		})
		.join('');
	wrap.innerHTML = `
		<div class="progress-line" style="margin-bottom: 8px;">
			Checkpoint ${count}${isFinal ? ' (final)' : ''} results
		</div>
		${rows}
	`;
}

function renderPoolScreen() {
	ensurePoolPredictions();
	renderPoolSettingsInputs();
	renderPoolStandingsList();
	renderPoolPredictionPanel();
	renderPoolCheckpointResults();
	renderPoolProblem();
}
