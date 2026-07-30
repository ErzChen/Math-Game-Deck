let customSiege = [];
let siegePool = [];
let siegeIndex = 0;
let siegeArmy = {};
let siegeShielded = {};
let siegeMoves = {};
let siegeResults = {};
let siegeResolved = false;
let siegeConversionRate = 2;
let siegeAttackAmount = 3;
let siegeReinforcePct = 50;

const siegeTimer = createCountdownTimer({
	seconds: 90,
	displayId: 'siegeTimerDisplay',
	toggleBtnId: 'siegeTimerToggle',
});
const defaultSiegeSeconds = 90;

const siegeImageFields = createQAImageState({
	qWrap: 'newSiegeQImgWrap',
	qFile: 'newSiegeQImgFile',
	aWrap: 'newSiegeAImgWrap',
	aFile: 'newSiegeAImgFile',
});

const siegeTierInfo = [
	{ label: 'Rubble Camp', wall: '#9c9186', towerH: 20, wallH: 12, crenels: 2 },
	{ label: 'Wooden Fort', wall: '#a9793f', towerH: 34, wallH: 18, crenels: 3 },
	{ label: 'Stone Keep', wall: '#9aa1ab', towerH: 46, wallH: 24, crenels: 4 },
	{ label: 'Grand Castle', wall: '#c6cdd6', towerH: 58, wallH: 28, crenels: 5 },
];

function initSiege() {
	resetSiege();
}

function resetSiege() {
	siegePool = customSiege;
	siegeIndex = 0;
	ensureSiegeTeams();
	resetSiegeRound();
	renderSiegeProblem();
}

function ensureSiegeTeams() {
	teams.forEach((team) => {
		if (siegeArmy[team.id] === undefined) siegeArmy[team.id] = 0;
		if (siegeShielded[team.id] === undefined) siegeShielded[team.id] = false;
	});
}

function resetSiegeRound() {
	siegeMoves = {};
	siegeResults = {};
	siegeResolved = false;
}

function nextSiegeProblem() {
	siegeIndex++;
	resetSiegeRound();
	renderSiegeProblem();
	autosave();
}

function resetSiegeArmies() {
	teams.forEach((team) => {
		siegeArmy[team.id] = 0;
		siegeShielded[team.id] = false;
	});
	renderSiegeRoster();
	autosave();
}

function toggleSiegeTimer() {
	siegeTimer.toggle();
}

function resetSiegeTimer() {
	siegeTimer.reset();
}

function setSiegeSetting(kind, val) {
	if (kind === 'conversion')
		siegeConversionRate = Math.max(1, parseInt(val, 10) || 2);
	if (kind === 'attack') siegeAttackAmount = Math.max(1, parseInt(val, 10) || 3);
	if (kind === 'reinforce')
		siegeReinforcePct = Math.max(0, Math.min(100, parseInt(val, 10) || 50));
	renderSiegeRoster();
	autosave();
}

function renderSiegeSettingsInputs() {
	const c = document.getElementById('siegeConversionInput');
	const a = document.getElementById('siegeAttackInput');
	const r = document.getElementById('siegeReinforceInput');
	if (c && document.activeElement !== c) c.value = siegeConversionRate;
	if (a && document.activeElement !== a) a.value = siegeAttackAmount;
	if (r && document.activeElement !== r) r.value = siegeReinforcePct;
}

function renderSiegeProblem() {
	siegePool = customSiege;
	ensureSiegeTeams();
	const box = document.getElementById('siegeAnswerBox');
	if (box) box.classList.remove('show');

	if (siegePool.length === 0) {
		document.getElementById('siegeProgress').textContent = 'No questions yet';
		document.getElementById('siegeQuestionText').textContent =
			'No questions yet, use "Manage Questions" above to add some.';
		setPromptImage('siegeQuestionImg', null);
		siegeTimer.stop();
		renderSiegeRoster();
		return;
	}

	const problem = siegePool[siegeIndex % siegePool.length];
	document.getElementById('siegeProgress').textContent =
		`Round ${(siegeIndex % siegePool.length) + 1} of ${siegePool.length} · payout worth ${siegeConversionRate} pt${siegeConversionRate === 1 ? '' : 's'}`;
	document.getElementById('siegeQuestionText').textContent = problem.q;
	setPromptImage('siegeQuestionImg', problem.qImg);
	typeset(document.getElementById('siegeQuestionText'));
	siegeTimer.setDuration(problem.time || defaultSiegeSeconds);
	renderSiegeRoster();
}

function revealSiegeAnswer() {
	if (siegePool.length === 0) return;
	siegeTimer.stop();
	const problem = siegePool[siegeIndex % siegePool.length];
	document.getElementById('siegeAnswerFigure').textContent = problem.a;
	setPromptImage('siegeAnswerImg', problem.aImg);
	document.getElementById('siegeAnswerReasoning').textContent = problem.e || '';
	const box = document.getElementById('siegeAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function setSiegeMove(teamId, type) {
	if (siegeResolved) return;
	if (!type) {
		delete siegeMoves[teamId];
		renderSiegeRoster();
		return;
	}
	const move = { type };
	if (type === 'attack') {
		const other = teams.find((team) => team.id !== teamId);
		move.targetId = other ? other.id : null;
	}
	siegeMoves[teamId] = move;
	renderSiegeRoster();
}

function setSiegeAttackTarget(teamId, targetId) {
	if (siegeResolved || !siegeMoves[teamId]) return;
	siegeMoves[teamId].targetId = targetId;
}

function markSiegeResult(teamId, result) {
	if (siegeResolved) return;
	siegeResults[teamId] = siegeResults[teamId] === result ? undefined : result;
	if (siegeResults[teamId] === undefined) delete siegeResults[teamId];
	renderSiegeRoster();
}

function resolveSiegeRound() {
	if (siegePool.length === 0 || siegeResolved) return;
	if (teams.some((team) => !siegeMoves[team.id])) {
		alert(
			'Every team needs to pick Fortify, Reinforce, or Attack before resolving.',
		);
		return;
	}
	if (teams.some((team) => !siegeResults[team.id])) {
		alert('Mark every team Correct or Wrong before resolving the round.');
		return;
	}

	const fortifyHits = [];

	teams.forEach((team) => {
		const move = siegeMoves[team.id];
		if (!move) return;
		const correct = siegeResults[team.id] === 'correct';
		if (move.type === 'fortify' && correct) {
			addScore(team.id, siegeConversionRate);
			fortifyHits.push(team.id);
		} else if (move.type === 'reinforce' && correct) {
			siegeArmy[team.id] = (siegeArmy[team.id] || 0) + siegeConversionRate;
			siegeShielded[team.id] = true;
		}
	});

	const attackEvents = [];

	teams.forEach((team) => {
		const move = siegeMoves[team.id];
		if (!move || move.type !== 'attack') return;
		const cost = Math.min(siegeAttackAmount, siegeArmy[team.id] || 0);
		if (cost <= 0) return;
		siegeArmy[team.id] = (siegeArmy[team.id] || 0) - cost;
		const correct = siegeResults[team.id] === 'correct';
		const targetId = move.targetId;
		if (!targetId || targetId === team.id) return;

		if (!correct) {
			attackEvents.push({ attackerId: team.id, targetId, hit: false });
			return;
		}
		let transfer = siegeAttackAmount;
		if (siegeShielded[targetId]) {
			transfer = Math.max(0, Math.round(transfer * (1 - siegeReinforcePct / 100)));
			siegeShielded[targetId] = false;
		}
		if (transfer > 0) {
			addScore(team.id, transfer);
			addScore(targetId, -transfer);
		}
		attackEvents.push({ attackerId: team.id, targetId, hit: true });
	});

	siegeResolved = true;
	autosave();
	nextSiegeProblem();
	renderSiegeRoster();
	playSiegeAnimations(fortifyHits, attackEvents);
}

function siegeCastleTier(score) {
	if (score >= 50) return 3;
	if (score >= 25) return 2;
	if (score >= 10) return 1;
	return 0;
}

function siegeCrenels(x, y, w, count, color) {
	const seg = w / (count * 2 - 1);
	let rects = '';
	for (let i = 0; i < count; i++) {
		rects += `<rect x="${(x + i * seg * 2).toFixed(1)}" y="${y}" width="${seg.toFixed(1)}" height="5" fill="${color}" />`;
	}
	return rects;
}

function siegeCastleSVG(team, tier, army, shielded) {
	const info = siegeTierInfo[tier];
	const groundY = 110;
	const wallTop = groundY - info.wallH;
	const towerTop = groundY - info.towerH;
	const wallDark = `color-mix(in srgb, ${info.wall} 65%, black)`;

	const flag =
		tier > 0
			? `
				<line x1="65" y1="${towerTop - 2}" x2="65" y2="${towerTop - 20}" stroke="${wallDark}" stroke-width="2" />
				<polygon points="65,${towerTop - 20} 65,${towerTop - 12} 82,${towerTop - 16}" fill="${team.color}" />
			`
			: `<line x1="65" y1="${towerTop - 2}" x2="63" y2="${towerTop - 12}" stroke="${wallDark}" stroke-width="2" />`;

	const shieldRing = shielded
		? `<circle class="siege-shield-ring" cx="65" cy="72" r="58" fill="none" stroke="${team.color}" stroke-width="3" stroke-dasharray="6 5" />`
		: '';

	const armyTents = Array.from({ length: Math.min(army, 6) })
		.map((_, i) => {
			const tx = 8 + i * 19;
			return `<polygon points="${tx},128 ${tx + 8},112 ${tx + 16},128" fill="${team.color}" opacity="0.75" />`;
		})
		.join('');

	return `
		<svg class="siege-castle-svg" viewBox="0 0 130 140" width="110" height="118">
			<line x1="4" y1="${groundY}" x2="126" y2="${groundY}" stroke="var(--line-strong)" stroke-width="2" />
			${shieldRing}
			<rect x="20" y="${wallTop}" width="90" height="${info.wallH}" fill="${info.wall}" stroke="var(--line-strong)" stroke-width="1.5" />
			${siegeCrenels(20, wallTop - 5, 90, info.crenels, info.wall)}
			<rect x="16" y="${towerTop}" width="24" height="${info.towerH}" fill="${wallDark}" stroke="var(--line-strong)" stroke-width="1.5" />
			${siegeCrenels(16, towerTop - 5, 24, 2, wallDark)}
			<rect x="90" y="${towerTop}" width="24" height="${info.towerH}" fill="${wallDark}" stroke="var(--line-strong)" stroke-width="1.5" />
			${siegeCrenels(90, towerTop - 5, 24, 2, wallDark)}
			<rect x="52" y="${towerTop - 10}" width="26" height="${info.towerH + 10}" fill="${info.wall}" stroke="var(--line-strong)" stroke-width="1.5" />
			${siegeCrenels(52, towerTop - 15, 26, 3, info.wall)}
			<rect x="56" y="${groundY - 22}" width="18" height="22" rx="8" fill="${wallDark}" />
			${flag}
			${armyTents}
		</svg>
	`;
}

function renderSiegeCastleCard(team) {
	const tier = siegeCastleTier(team.score);
	const info = siegeTierInfo[tier];
	const army = siegeArmy[team.id] || 0;
	const shielded = !!siegeShielded[team.id];
	return `
		<div class="siege-castle-card" id="siegeCastle-${team.id}">
			${siegeCastleSVG(team, tier, army, shielded)}
			<div class="siege-castle-name" style="color: ${team.color};">${escapeHtml(team.name)}</div>
			<div class="siege-castle-tier-label">${info.label}</div>
			<div class="siege-army-count">Army: ${army}</div>
		</div>
	`;
}

function renderSiegeBattlefield() {
	const wrap = document.getElementById('siegeBattlefield');
	if (!wrap) return;
	ensureSiegeTeams();
	wrap.innerHTML = teams.map((team) => renderSiegeCastleCard(team)).join('');
}

function fireSiegeProjectile(fromId, toId, hit) {
	const fromEl = document.getElementById('siegeCastle-' + fromId);
	const toEl = document.getElementById('siegeCastle-' + toId);
	const stage = document.getElementById('stage');
	if (!fromEl || !toEl || !stage) return;
	const stageRect = stage.getBoundingClientRect();
	const fromRect = fromEl.getBoundingClientRect();
	const toRect = toEl.getBoundingClientRect();

	const proj = document.createElement('div');
	proj.className = 'siege-projectile';
	proj.style.left =
		fromRect.left -
		stageRect.left +
		stage.scrollLeft +
		fromRect.width / 2 -
		7 +
		'px';
	proj.style.top =
		fromRect.top -
		stageRect.top +
		stage.scrollTop +
		fromRect.height / 2 -
		7 +
		'px';
	stage.appendChild(proj);

	requestAnimationFrame(() => {
		const dx =
			toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
		const dy =
			toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
		proj.style.transform = `translate(${dx}px, ${dy}px) scale(${hit ? 1 : 0.6})`;
		proj.style.opacity = '0';
	});

	setTimeout(() => {
		proj.remove();
		const targetSvg = toEl.querySelector('.siege-castle-svg');
		if (targetSvg) {
			targetSvg.classList.add(hit ? 'hit-anim' : 'miss-anim');
			setTimeout(() => targetSvg.classList.remove('hit-anim', 'miss-anim'), 600);
		}
	}, 550);
}

function playSiegeAnimations(fortifyIds, attacks) {
	fortifyIds.forEach((id) => {
		const svg = document.querySelector(`#siegeCastle-${id} .siege-castle-svg`);
		if (svg) {
			svg.classList.add('fortify-anim');
			setTimeout(() => svg.classList.remove('fortify-anim'), 750);
		}
	});
	attacks.forEach((atk, i) => {
		setTimeout(
			() => fireSiegeProjectile(atk.attackerId, atk.targetId, atk.hit),
			i * 250,
		);
	});
}

function renderSiegeRoster() {
	renderSiegeSettingsInputs();
	ensureSiegeTeams();
	renderSiegeBattlefield();
	const wrap = document.getElementById('siegeRoster');
	if (!wrap) return;
	if (teams.length === 0) {
		wrap.innerHTML = '';
		return;
	}
	wrap.innerHTML = teams.map((team) => renderSiegeTeamRow(team)).join('');
}

function renderSiegeTeamRow(team) {
	const move = siegeMoves[team.id];
	const result = siegeResults[team.id];
	const army = siegeArmy[team.id] || 0;
	const shieldTag = siegeShielded[team.id]
		? '<span class="status-tag">Shielded</span>'
		: '';

	const targetOptions = teams
		.filter((t) => t.id !== team.id)
		.map(
			(t) =>
				`<option value="${t.id}" ${move && move.targetId === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`,
		)
		.join('');

	const canAttack = army >= siegeAttackAmount;

	return `
		<div class="team-group" style="border-left-color: ${team.color};">
			<span class="team-name">${escapeHtml(team.name)} <span class="stat-count">(Army: ${army})</span> ${shieldTag}</span>
			<div class="team-btns">
				<select
					class="inline-select mono"
					onchange="setSiegeMove('${team.id}', this.value)"
					${siegeResolved ? 'disabled' : ''}
				>
					<option value="">Move: none</option>
					<option value="fortify" ${move && move.type === 'fortify' ? 'selected' : ''}>Fortify</option>
					<option value="reinforce" ${move && move.type === 'reinforce' ? 'selected' : ''}>Reinforce</option>
					<option value="attack" ${move && move.type === 'attack' ? 'selected' : ''} ${canAttack ? '' : 'disabled'}>Attack (${siegeAttackAmount} army)</option>
				</select>
				${
					move && move.type === 'attack'
						? `<select class="inline-select mono" onchange="setSiegeAttackTarget('${team.id}', this.value)">${targetOptions}</select>`
						: ''
				}
				<button
					class="btn small award-btn ${result === 'wrong' ? 'wrong-active' : ''}"
					style="border-color: ${team.color};"
					onclick="markSiegeResult('${team.id}', 'wrong')"
					${siegeResolved ? 'disabled' : ''}
				>
					${iconCross()}Wrong
				</button>
				<button
					class="btn small award-btn"
					style="border-color: ${team.color};"
					onclick="markSiegeResult('${team.id}', 'correct')"
					${siegeResolved ? 'disabled' : ''}
				>
					${iconCheck()}Correct
				</button>
			</div>
		</div>
	`;
}

function openSiegeModal() {
	openQuestionManagerModal('Manage Siege Questions', {
		fieldPrefix: 'newSiege',
		listId: 'customSiegeList',
		addFnName: 'addCustomSiege',
		helpText:
			'These feed the shared pool every team answers at once on whiteboards. Each team privately picks Fortify, Reinforce, or Attack before you mark results and resolve the round.',
		hasTime: true,
		timeLabel: 'Time limit in seconds (optional, defaults to standard timer)',
	});
	siegeImageFields.reset();
	renderCustomSiegeList();
}

function addCustomSiege() {
	const timeInput = document.getElementById('newSiegeTime').value.trim();
	const parsedTime = parseInt(timeInput, 10);
	const time =
		timeInput && !isNaN(parsedTime) ? Math.max(1, parsedTime) : undefined;
	const question = document.getElementById('newSiegeQ').value.trim();
	const answer = document.getElementById('newSiegeA').value.trim();
	const explanation = document.getElementById('newSiegeE').value.trim();
	if (!question || !answer) {
		alert('Enter at least a question and an answer.');
		return;
	}
	customSiege.push({
		time,
		q: question,
		qImg: siegeImageFields.state.q || undefined,
		a: answer,
		e: explanation,
		aImg: siegeImageFields.state.a || undefined,
	});
	document.getElementById('newSiegeTime').value = '';
	document.getElementById('newSiegeQ').value = '';
	document.getElementById('newSiegeA').value = '';
	document.getElementById('newSiegeE').value = '';
	siegeImageFields.reset();
	renderCustomSiegeList();
	autosave();
}

function deleteCustomSiege(i) {
	deleteCustomItem(customSiege, i, renderCustomSiegeList);
}

function renderCustomSiegeList() {
	renderCustomList(
		'customSiegeList',
		customSiege,
		(problem, i) => `
		<div class="custom-list-item">
			${problem.qImg || problem.aImg ? `<img class="thumb" src="${imgSrc(problem.qImg || problem.aImg)}" alt="" />` : ''}
			<div class="txt">${problem.time ? `<b>${problem.time}s</b> — ` : ''}${escapeHtml(problem.q)}<br>${escapeHtml(problem.a)}</div>
			<button class="btn small ghost" onclick="deleteCustomSiege(${i})">Delete</button>
		</div>
	`,
	);
}
