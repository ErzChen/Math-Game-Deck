let customWager = [];
let wagerPool = [];
let wagerIndex = 0;

const wagerTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'wagerTimerDisplay',
});
const defaultWagerSeconds = 90;

const wagerImageFields = createQAImageState({
	qWrap: 'newWagerQImgWrap',
	qFile: 'newWagerQImgFile',
	aWrap: 'newWagerAImgWrap',
	aFile: 'newWagerAImgFile',
});

function initWager() {
	resetWager();
}

function resetWager() {
	wagerPool = customWager;
	wagerIndex = 0;
	renderWagerProblem();
}

function nextWagerProblem() {
	wagerIndex++;
	renderWagerProblem();
}

function ensureWagerTimerUI() {
	const questionEl = document.getElementById('wagerQuestionText');
	const wrap = questionEl ? questionEl.parentElement : null;
	if (!wrap || document.getElementById('wagerTimerDisplay')) return;
	wrap.insertAdjacentHTML('afterbegin', `<div class="timer mono" id="wagerTimerDisplay"></div>`);
}

function renderWagerProblem() {
	wagerPool = customWager;
	const badge = document.getElementById('wagerDifficultyBadge');
	const box = document.getElementById('wagerAnswerBox');
	box.classList.remove('show');

	if (wagerPool.length === 0) {
		document.getElementById('wagerProgress').textContent = 'No questions yet';
		badge.textContent = '';
		badge.className = 'tier-badge';
		document.getElementById('wagerQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('wagerQuestionImg', null);
		renderWagerRoster();
		wagerTimer.stop();
		return;
	}

	ensureWagerTimerUI();

	const problem = wagerPool[wagerIndex % wagerPool.length];
	document.getElementById('wagerProgress').textContent =
		`Round ${(wagerIndex % wagerPool.length) + 1} of ${wagerPool.length}`;
	badge.textContent = `Difficulty ${problem.tier} of 5`;
	badge.className = 'tier-badge t' + problem.tier;
	document.getElementById('wagerQuestionText').textContent = problem.q;
	setPromptImage('wagerQuestionImg', problem.qImg);
	typeset(document.getElementById('wagerQuestionText'));
	renderWagerRoster();
	wagerTimer.setDuration(problem.time || defaultWagerSeconds);
	wagerTimer.toggle();
}

function revealWagerAnswer() {
	if (wagerPool.length === 0) return;
	wagerTimer.stop();
	const problem = wagerPool[wagerIndex % wagerPool.length];
	document.getElementById('wagerAnswerFigure').textContent = problem.a;
	setPromptImage('wagerAnswerImg', problem.aImg);
	document.getElementById('wagerAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('wagerAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderWagerRoster() {
	const wrap = document.getElementById('wagerRoster');
	if (!wrap) return;

	wrap.innerHTML = teams
		.map(
			(team) => `
				<div class="team-group" style="border-left-color: ${team.color};">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<div class="team-btns">
						<input
							type="number"
							class="wager-input mono"
							id="wagerInput-${team.id}"
							min="1"
							max="5"
							value="3"
							style="border-color: ${team.color};"
						/>
						<button
							class="btn small award-btn"
							style="border-color: ${team.color};"
							onclick="applyWagerResult('${team.id}', true, event)"
						>
							${iconCheck()}Correct
						</button>
						<button
							class="btn small award-btn"
							style="border-color: ${team.color};"
							onclick="applyWagerResult('${team.id}', false, event)"
						>
							${iconCross()}Wrong
						</button>
					</div>
				</div>
			`,
		)
		.join('');
}

function applyWagerResult(teamId, wasCorrect, event) {
	const input = document.getElementById('wagerInput-' + teamId);
	let amount = parseInt(input ? input.value : '', 10);
	if (!amount || amount < 1) amount = 1;
	if (amount > 5) amount = 5;
	addScore(teamId, wasCorrect ? amount : -amount, event);
	autosave();
}

function openWagerModal() {
	openQuestionManagerModal('Manage All-In Wager Questions', {
		fieldPrefix: 'newWager',
		listId: 'customWagerList',
		addFnName: 'addCustomWager',
		helpText:
			'The difficulty tag suggests how much a team might want to wager (1–5), but doesn\'t force it — teams write their own wager on their whiteboard.',
		hasTier: true,
		tierLabel: 'Suggested difficulty (1 = easiest, 5 = hardest)',
		tierPlaceholder: 'e.g. 3',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	wagerImageFields.reset();
	renderCustomWagerList();
}

function addCustomWager() {
	const tier = Math.max(
		1,
		Math.min(5, parseInt(document.getElementById('newWagerTier').value, 10) || 1),
	);
	const timeInput = document.getElementById('newWagerTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time = timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newWagerQ').value.trim();
	const answer = document.getElementById('newWagerA').value.trim();
	const explanation = document.getElementById('newWagerE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customWager.push({
		tier: tier,
		time: time,
		q: question,
		qImg: wagerImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: wagerImageFields.state.a || undefined,
	});
	document.getElementById('newWagerTier').value = '';
	document.getElementById('newWagerTime').value = '';
	document.getElementById('newWagerQ').value = '';
	document.getElementById('newWagerA').value = '';
	document.getElementById('newWagerE').value = '';
	wagerImageFields.reset();
	renderCustomWagerList();
	autosave();
}

function deleteCustomWager(i) {
	deleteCustomItem(customWager, i, renderCustomWagerList);
}

function renderCustomWagerList() {
	renderCustomList('customWagerList', customWager, (problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt"><b>Difficulty ${problem.tier}</b>${problem.time ? ` · ${problem.time}s` : ''} — ${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomWager(${i})">Delete</button>
		</div>
	`);
}