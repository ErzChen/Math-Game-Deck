let customBounty = [];
let bountyPool = [];
let bountyIndex = 0;
let bountyMarkedIds = [];
let bountySolvedBy = null;
let bountyCollected = null;
let bountyPercent = 25;
let bountyAllTiedLeaders = false;

const bountyTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'bountyTimerDisplay',
	toggleBtnId: 'bountyTimerToggle',
});
const defaultBountySeconds = 90;

const bountyImageFields = createQAImageState({
	qWrap: 'newBountyQImgWrap',
	qFile: 'newBountyQImgFile',
	aWrap: 'newBountyAImgWrap',
	aFile: 'newBountyAImgFile',
});

function initBounty() {
	bountyPool = customBounty;
	resetBounty();
}

function resetBounty() {
	bountyIndex = 0;
	bountySolvedBy = null;
	bountyCollected = null;
	bountyTimer.reset();
	recomputeBountyTargets();
	renderBountyProblem();
}

function recomputeBountyTargets() {
	if (teams.length === 0) {
		bountyMarkedIds = [];
		return;
	}
	const maxScore = Math.max(...teams.map((team) => team.score));
	const leaders = teams
		.filter((team) => team.score === maxScore)
		.map((team) => team.id);
	if (bountyAllTiedLeaders || leaders.length <= 1) {
		bountyMarkedIds = leaders;
	} else {
		bountyMarkedIds = [leaders[Math.floor(Math.random() * leaders.length)]];
	}
}

function nextBountyProblem() {
	bountyIndex++;
	bountySolvedBy = null;
	bountyCollected = null;
	recomputeBountyTargets();
	renderBountyProblem();
	autosave();
}

function toggleBountyTimer() {
	bountyTimer.toggle();
}

function resetBountyTimer() {
	bountyTimer.reset();
}

function setBountySetting(kind, val) {
	if (kind === 'percent') {
		bountyPercent = Math.max(1, Math.min(100, parseInt(val, 10) || 25));
	}
	if (kind === 'tieMode') {
		bountyAllTiedLeaders = val === 'all';
		recomputeBountyTargets();
	}
	renderBountyRoster();
	autosave();
}

function renderBountySettingsInputs() {
	const percentInput = document.getElementById('bountyPercentInput');
	const tieSelect = document.getElementById('bountyTieSelect');
	if (percentInput && document.activeElement !== percentInput) {
		percentInput.value = bountyPercent;
	}
	if (tieSelect) tieSelect.value = bountyAllTiedLeaders ? 'all' : 'random';
}

function renderBountyProblem() {
	bountyPool = customBounty;
	const box = document.getElementById('bountyAnswerBox');
	if (box) box.classList.remove('show');

	if (bountyPool.length === 0) {
		document.getElementById('bountyProgress').textContent = 'No questions yet';
		document.getElementById('bountyQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('bountyQuestionImg', null);
		bountyTimer.stop();
		renderBountyRoster();
		return;
	}

	const problem = bountyPool[bountyIndex % bountyPool.length];
	document.getElementById('bountyProgress').textContent =
		`Problem ${(bountyIndex % bountyPool.length) + 1} of ${bountyPool.length}`;
	document.getElementById('bountyQuestionText').textContent = problem.q;
	setPromptImage('bountyQuestionImg', problem.qImg);
	typeset(document.getElementById('bountyQuestionText'));
	bountyTimer.setDuration(problem.time || defaultBountySeconds);
	renderBountyRoster();
}

function revealBountyAnswer() {
	if (bountyPool.length === 0) return;
	bountyTimer.stop();
	const problem = bountyPool[bountyIndex % bountyPool.length];
	document.getElementById('bountyAnswerFigure').textContent = problem.a;
	setPromptImage('bountyAnswerImg', problem.aImg);
	document.getElementById('bountyAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('bountyAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function bountyAmountFor(targetId) {
	const target = teams.find((team) => team.id === targetId);
	if (!target) return 0;
	return Math.floor((target.score * bountyPercent) / 100);
}

function markBountyResult(teamId, mode, targetId, event) {
	if (bountySolvedBy) return;
	if (mode === 'collect') {
		if (bountyMarkedIds.includes(teamId)) return;
		if (!targetId || !bountyMarkedIds.includes(targetId)) return;
		const amount = bountyAmountFor(targetId);
		addScore(teamId, amount, event);
		addScore(targetId, -amount);
		bountyCollected = { targetId, amount };
	} else {
		addScore(teamId, 1, event);
		bountyCollected = { amount: 1 };
	}
	bountySolvedBy = teamId;
	bountyTimer.stop();
	autosave();
	renderBountyRoster();
}

function renderBountyRoster() {
	renderBountySettingsInputs();
	bountyMarkedIds = bountyMarkedIds.filter((id) =>
		teams.some((team) => team.id === id),
	);
	const wrap = document.getElementById('bountyRoster');
	if (!wrap) return;
	if (teams.length === 0) {
		wrap.innerHTML = '';
		return;
	}
	if (bountySolvedBy) {
		wrap.innerHTML = renderBountySolvedHtml();
		return;
	}
	wrap.innerHTML = teams.map((team) => renderBountyTeamRow(team)).join('');
}

function renderBountySolvedHtml() {
	const solver = teams.find((team) => team.id === bountySolvedBy);
	if (!solver) return '';
	const label = `<b style="color: ${solver.color};">${escapeHtml(solver.name)}</b>`;
	let line = `${label} answered first and banked <b>1</b> pt.`;
	if (bountyCollected && bountyCollected.targetId) {
		const target = teams.find((team) => team.id === bountyCollected.targetId);
		line = `${label} collected the bounty, pulling <b>${bountyCollected.amount}</b> pt${bountyCollected.amount === 1 ? '' : 's'} from ${target ? escapeHtml(target.name) : 'the marked team'}.`;
	}
	return `<div class="hands-up-solved">${iconCheck()}${line} Hit "Next Problem" to continue.</div>`;
}

function renderBountyTeamRow(team) {
	const isMarked = bountyMarkedIds.includes(team.id);
	const tag = isMarked ? '<span class="elimination-chip-tag">Bounty</span>' : '';

	if (isMarked) {
		return `
			<div class="team-group" style="border-left-color: ${team.color};">
				<span class="team-name">${escapeHtml(team.name)} ${tag}</span>
				<div class="team-btns">
					<button
						class="btn small award-btn"
						style="border-color: ${team.color};"
						onclick="markBountyResult('${team.id}', 'bank', null, event)"
					>
						${iconCheck()}Correct +1
					</button>
				</div>
			</div>
		`;
	}

	const otherMarked = bountyMarkedIds.filter((id) => id !== team.id);
	let collectControl = '';
	if (otherMarked.length === 1) {
		const amount = bountyAmountFor(otherMarked[0]);
		collectControl = `
			<button
				class="btn small award-btn"
				style="border-color: ${team.color};"
				onclick="markBountyResult('${team.id}', 'collect', '${otherMarked[0]}', event)"
			>
				Collect Bounty (${amount})
			</button>
		`;
	} else if (otherMarked.length > 1) {
		const options = otherMarked
			.map((id) => {
				const target = teams.find((t) => t.id === id);
				return target
					? `<option value="${id}">${escapeHtml(target.name)} (${bountyAmountFor(id)})</option>`
					: '';
			})
			.join('');
		collectControl = `
			<select class="pointheist-raid-select mono" id="bountyTargetSelect-${team.id}">
				${options}
			</select>
			<button
				class="btn small award-btn"
				style="border-color: ${team.color};"
				onclick="markBountyResult('${team.id}', 'collect', document.getElementById('bountyTargetSelect-${team.id}').value, event)"
			>
				Collect Bounty
			</button>
		`;
	}

	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)}</span>
			<div class="team-btns">
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markBountyResult('${team.id}', 'bank', null, event)"
				>
					${iconCheck()}Correct +1
				</button>
				${collectControl}
			</div>
		</div>
	`;
}

function openBountyModal() {
	openQuestionManagerModal('Manage Bounty Questions', {
		fieldPrefix: 'newBounty',
		listId: 'customBountyList',
		addFnName: 'addCustomBounty',
		helpText:
			'These feed the shared pool the whole room answers, first correct answer wins the round. The current point leader is automatically marked as the Bounty each round.',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	bountyImageFields.reset();
	renderCustomBountyList();
}

function addCustomBounty() {
	const timeInput = document.getElementById('newBountyTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newBountyQ').value.trim();
	const answer = document.getElementById('newBountyA').value.trim();
	const explanation = document.getElementById('newBountyE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customBounty.push({
		time: time,
		q: question,
		qImg: bountyImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: bountyImageFields.state.a || undefined,
	});
	document.getElementById('newBountyTime').value = '';
	document.getElementById('newBountyQ').value = '';
	document.getElementById('newBountyA').value = '';
	document.getElementById('newBountyE').value = '';
	bountyImageFields.reset();
	renderCustomBountyList();
	autosave();
}

function deleteCustomBounty(i) {
	deleteCustomItem(customBounty, i, renderCustomBountyList);
}

function renderCustomBountyList() {
	renderCustomList(
		'customBountyList',
		customBounty,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${problem.qImg || problem.aImg}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomBounty(${i})">Delete</button>
		</div>
	`,
	);
}
