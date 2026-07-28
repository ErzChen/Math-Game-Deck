function goTo(name) {
	document
		.querySelectorAll('.screen')
		.forEach((screen) => screen.classList.remove('active'));
	document.getElementById('screen' + name).classList.add('active');
	document.getElementById('stage').scrollTop = 0;
}

function openModal(title, bodyHtml) {
	document.getElementById('modalTitle').textContent = title;
	document.getElementById('modalBody').innerHTML = bodyHtml;
	document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
	document.getElementById('modalOverlay').classList.remove('open');
}

function iconCheck() {
	return `
		<svg 
			class="icon" 
			viewBox="0 0 24 24" 
			width="14" height="14" 
			fill="none" 
			stroke="currentColor" 
			stroke-width="2.5" 
			stroke-linecap="round" 
			stroke-linejoin="round" 
			style="vertical-align: -2px; margin-right: 4px;"
		>
			<path d="M20 6 9 17l-5-5"/>
		</svg>
	`;
}

function iconCross() {
	return `
		<svg 
			class="icon" 
			viewBox="0 0 24 24" 
			width="14" 
			height="14" 
			fill="none" 
			stroke="currentColor" 
			stroke-width="2.5" 
			stroke-linecap="round" 
			stroke-linejoin="round" 
			style="vertical-align: -2px; margin-right: 4px;"
		>
			<line x1="18" y1="6" x2="6" y2="18"/>
			<line x1="6" y1="6" x2="18" y2="18"/>
		</svg>
	`;
}

function escapeAttr(string) {
	return String(string).replace(/"/g, '&quot;');
}

function escapeHtml(string) {
	return String(string)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function typeset(element) {
	if (window.renderMathInElement && element) {
		renderMathInElement(element, {
			delimiters: [
				{ left: '$$', right: '$$', display: true },
				{ left: '$', right: '$', display: false },
			],
			throwOnError: false,
		});
	}
}

function fileToCompressedDataURL(file, callback, maxDim = 900, quality = 0.82) {
	if (!file || !file.type.startsWith('image/')) {
		callback(null);
		return;
	}

	const reader = new FileReader();
	reader.onload = () => {
		const img = new Image();
		img.onload = () => {
			let { width, height } = img;

			if (width > maxDim || height > maxDim) {
				const scale = maxDim / Math.max(width, height);
				width = Math.round(width * scale);
				height = Math.round(height * scale);
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			context.fillStyle = '#ffffff';
			context.fillRect(0, 0, width, height);
			context.drawImage(img, 0, 0, width, height);
			callback(canvas.toDataURL('image/jpeg', quality));
		};

		img.onerror = () => callback(null);
		img.src = reader.result;
	};

	reader.onerror = () => callback(null);
	reader.readAsDataURL(file);
}

function renderImgUploadField(wrapId, inputId, dataUrl, onChange) {
	const wrap = document.getElementById(wrapId);
	if (!wrap) return;

	if (dataUrl) {
		wrap.innerHTML = `
			<div class="img-upload-row">
				<div class="img-preview-wrap">
				<img src="${dataUrl}" alt="" />
				<button type="button" class="img-remove" title="Remove image">${iconCross()}</button>
				</div>
				<span style="font-size: 12px; color: var(--chalk-muted);">Image attached</span>
			</div>
		`;
		wrap.querySelector('.img-remove').onclick = () => onChange(null);
	} else {
		wrap.innerHTML = `
			<div class="img-upload-row">
				<input type="file" id="${inputId}" accept="image/*" />
			</div>
		`;
		wrap.querySelector('input[type=file]').onchange = (event) => {
			const file = event.target.files[0];
			if (!file) return;

			fileToCompressedDataURL(file, (result) => {
				if (result) onChange(result);
				else alert('Could not read that image file.');
			});
		};
	}
}

function createQAImageState(ids, { hasAnswerImage = true } = {}) {
	const state = { q: null, a: null };

	function render() {
		renderImgUploadField(ids.qWrap, ids.qFile, state.q, (val) => {
			state.q = val;
			render();
		});
		if (hasAnswerImage) {
			renderImgUploadField(ids.aWrap, ids.aFile, state.a, (val) => {
				state.a = val;
				render();
			});
		}
	}

	function reset() {
		state.q = null;
		state.a = null;
		render();
	}

	return { state, render, reset };
}

function setPromptImage(elementId, url) {
	const img = document.getElementById(elementId);
	if (!img) return;

	if (url) {
		img.src = url;
		img.classList.remove('hidden');
	} else {
		img.removeAttribute('src');
		img.classList.add('hidden');
	}
}

function createCountdownTimer({
	seconds,
	displayId,
	toggleBtnId,
	lowThreshold = 10,
}) {
	let defaultSeconds = seconds;
	const timer = {
		seconds: defaultSeconds,
		interval: null,
		render() {
			const element = document.getElementById(displayId);
			if (!element) return;
			element.textContent = formatSeconds(timer.seconds);
			element.classList.toggle('low', timer.seconds <= lowThreshold);
		},
		toggle() {
			const btn = document.getElementById(toggleBtnId);
			if (timer.interval) {
				clearInterval(timer.interval);
				timer.interval = null;
				if (btn) btn.textContent = 'Start';
				return;
			}
			if (btn) btn.textContent = 'Pause';
			timer.interval = setInterval(() => {
				if (timer.seconds > 0) {
					timer.seconds--;
					timer.render();
				} else {
					clearInterval(timer.interval);
					timer.interval = null;
					if (btn) btn.textContent = 'Start';
				}
			}, 1000);
		},
		reset() {
			clearInterval(timer.interval);
			timer.interval = null;
			timer.seconds = defaultSeconds;
			timer.render();
			const btn = document.getElementById(toggleBtnId);
			if (btn) btn.textContent = 'Start';
		},
		stop() {
			clearInterval(timer.interval);
			timer.interval = null;
			timer.render();
		},
		setDuration(newSeconds) {
			const clamped = Math.max(1, parseInt(newSeconds, 10) || defaultSeconds);
			defaultSeconds = clamped;
			clearInterval(timer.interval);
			timer.interval = null;
			timer.seconds = clamped;
			timer.render();
			const btn = document.getElementById(toggleBtnId);
			if (btn) btn.textContent = 'Start';
		},
		getDuration() {
			return defaultSeconds;
		},
	};
	return timer;
}

function renderTeamAwardButtons(containerId, teamsList, buttonsFor) {
	const element = document.getElementById(containerId);
	if (!element) return;
	element.innerHTML = teamsList
		.map((team) => {
			const buttons = buttonsFor(team)
				.map(
					(button) => `
						<button
							class="btn small award-btn"
							style="border-color: ${team.color};"
							onclick="addScore('${team.id}', ${button.points}, event)"
						>
							${button.label}
						</button>
					`,
				)
				.join('');
			return `
				<div class="team-group" style="border-left-color: ${team.color};">
				<span class="team-name">${escapeHtml(team.name)}</span>
					<div class="team-btns">${buttons}</div>
				</div>
			`;
		})
		.join('');
}

function renderCustomList(elementId, items, itemHtml) {
	const element = document.getElementById(elementId);
	if (!element) return;
	if (items.length === 0) {
		element.innerHTML =
			'<div style="color: var(--chalk-muted); font-size: 13px;">No custom questions yet.</div>';
		return;
	}
	element.innerHTML = items.map(itemHtml).join('');
}

function deleteCustomItem(array, i, rerender) {
	array.splice(i, 1);
	rerender();
	autosave();
}

function openQuestionManagerModal(
	title,
	{
		fieldPrefix,
		listId,
		addFnName,
		helpText = '',
		hasTier = false,
		tierLabel = 'Tier (1 = easiest, 4 = hardest)',
		tierPlaceholder = 'e.g. 2',
		hasTime = false,
		timeLabel = 'Time limit in seconds (optional)',
		timePlaceholder = 'e.g. 90',
		questionPlaceholder = 'e.g. What is $\\binom{6}{2}$?',
		answerLabel = 'Answer',
		answerPlaceholder = 'e.g. 15',
		hasExplanation = true,
		hasAnswerImage = true,
	},
) {
	openModal(
		title,
		`
			${helpText ? `<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">${helpText}</div>` : ''}
			${
				hasTier
					? `
						<div class="field-label">${tierLabel}</div>
						<input type="text" id="${fieldPrefix}Tier" placeholder="${tierPlaceholder}" />
					`
					: ''
			}
			${
				hasTime
					? `
						<div class="field-label">${timeLabel}</div>
						<input type="number" min="1" id="${fieldPrefix}Time" placeholder="${timePlaceholder}" />
					`
					: ''
			}
			<div class="field-label">Question (use $...$ for math)</div>
			<textarea id="${fieldPrefix}Q" placeholder="${questionPlaceholder}"></textarea>
			<div class="field-label">Question image (optional)</div>
			<div id="${fieldPrefix}QImgWrap"></div>
			<div class="field-label">${answerLabel}</div>
			<input type="text" id="${fieldPrefix}A" placeholder="${answerPlaceholder}" />
			${
				hasExplanation
					? `
						<div class="field-label">Explanation</div>
						<textarea id="${fieldPrefix}E" placeholder="Show the reasoning."></textarea>
					`
					: ''
			}
			${
				hasAnswerImage
					? `
						<div class="field-label">Answer image (optional)</div>
						<div id="${fieldPrefix}AImgWrap"></div>
					`
					: ''
			}
			<button class="btn primary" style="margin-top: 12px;" onclick="${addFnName}()">Add Question</button>
			<div class="field-label" style="margin-top: 22px;">Your custom questions</div>
			<div id="${listId}"></div>
		`,
	);
}

const colorPalette = [
	'#ffd23f',
	'#52d9c4',
	'#ff7597',
	'#b39ddb',
	'#ffb15e',
	'#7ec8ff',
	'#c9e26b',
	'#ff8a80',
];

let teams = [
	{
		id: 't1',
		name: 'Team Yellow',
		color: colorPalette[0],
		score: 0,
	},
	{
		id: 't2',
		name: 'Team Teal',
		color: colorPalette[1],
		score: 0,
	},
];

let teamCounter = 2;

function openManageModal() {
	openModal('Manage Session', buildManageModalBody());
	renderManageTeamsList();
}

function buildManageModalBody() {
	return `
		<div class="showbar-title" style="margin-top: 0;">Save &amp; Load</div>
		<div style="display: flex; gap: 8px; margin-bottom: 6px;">
		<button class="btn small" onclick="exportData()">
			<svg 
				class="icon" 
				viewBox="0 0 24 24" 
				width="14" 
				height="14" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round" 
				style="vertical-align: -2px; margin-right: 4px;"
			>
				<path d="M12 3v12"/>
				<path d="M7 10l5 5 5-5"/>
				<path d="M5 21h14"/>
			</svg>
			Export Data
		</button>
		<button 
			class="btn small ghost" 
			onclick="document.getElementById('importFileInput').click()"
		>
			<svg 
				class="icon" 
				viewBox="0 0 24 24" 
				width="14" 
				height="14" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round" 
				style="vertical-align: -2px; margin-right: 4px;"
			>
				<path d="M12 21V9"/>
				<path d="M7 14l5-5 5 5"/>
				<path d="M5 3h14"/>
			</svg>
			Import Data
		</button>
		</div>
		<div style="font-size: 11.5px; color: var(--chalk-muted); line-height: 1.5; margin-bottom: 4px;">
			Export saves your teams, custom questions, and board to a file you can reload anytime. This browser also autosaves in the background as a backup.
		</div>
		<input 
			type="file" 
			id="importFileInput" 
			accept="application/json" 
			style="display: none;" 
			onchange="handleImportFile(event)" 
		/>

		<div class="showbar-title">Teams</div>
		<div id="manageTeamsList"></div>
		<button class="btn add-team-btn" onclick="addTeam()">+ Add Team</button>
		<button class="btn ghost showbar-reset" onclick="resetScores()">Reset Scores</button>
	`;
}

function renderTeamsList() {
	renderShowbarTeams();
	renderManageTeamsList();
}

function renderShowbarTeams() {
	const wrap = document.getElementById('showbarTeams');
	if (!wrap) return;

	wrap.innerHTML = teams
		.map(
			(team) => `
				<div class="showbar-team" style="--team-color: ${team.color};">
				<div class="showbar-name">${escapeHtml(team.name)}</div>
				<div class="showbar-score mono" data-team-score="${team.id}">${team.score}</div>
				</div>
			`,
		)
		.join('');
}

function renderManageTeamsList() {
	const list = document.getElementById('manageTeamsList');
	if (!list) return;

	list.innerHTML = teams
		.map(
			(team) => `
				<div class="team" style="border-left-color: ${team.color};">
				<input class="team-name" value="${escapeAttr(team.name)}" onchange="renameTeam('${team.id}', this.value)" />
				<div class="score-row">
					<div class="score-val mono" data-team-score="${team.id}" style="color: ${team.color};">${team.score}</div>
					<div class="score-btns">
					<button class="btn small" onclick="addScore('${team.id}', 1, event)">+1</button>
					<button class="btn small" onclick="addScore('${team.id}', -1, event)">−1</button>
					</div>
				</div>
				${teams.length > 1 ? `<button class="btn small ghost team-remove" onclick="removeTeam('${team.id}')">Remove team</button>` : ''}
				</div>
			`,
		)
		.join('');
}

function addTeam() {
	teamCounter++;
	const color = colorPalette[(teamCounter - 1) % colorPalette.length];
	teams.push({
		id: 't' + teamCounter,
		name: 'Team ' + teamCounter,
		color,
		score: 0,
	});

	renderTeamsList();
	renderAwardButtons();
	autosave();
}

function removeTeam(id) {
	if (teams.length <= 1) return;
	teams = teams.filter((team) => team.id !== id);

	renderTeamsList();
	renderAwardButtons();
	autosave();
}

function renameTeam(id, val) {
	const team = teams.find((team) => team.id === id);
	if (team) {
		team.name = val;
		renderAwardButtons();
		renderShowbarTeams();
		autosave();
	}
}

function addScore(id, delta, event) {
	const team = teams.find((team) => team.id === id);
	if (!team) return;
	team.score += delta;
	document
		.querySelectorAll(`[data-team-score="${id}"]`)
		.forEach((element) => (element.textContent = team.score));
	if (event) spawnDust(event.clientX, event.clientY, team.color);
	autosave();
}

function resetScores() {
	teams.forEach((team) => (team.score = 0));
	renderTeamsList();
	autosave();
}

function spawnDust(x, y, color) {
	const layer = document.getElementById('chalkLayer');

	for (let i = 0; i < 10; i++) {
		const div = document.createElement('div');
		div.className = 'dust';
		const angle = Math.random() * Math.PI * 2;
		const dist = 30 + Math.random() * 40;
		div.style.setProperty(
			'--fly',
			`translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
		);
		div.style.left = x + 'px';
		div.style.top = y + 'px';
		div.style.background = color;
		layer.appendChild(div);
		setTimeout(() => div.remove(), 700);
	}
}

function renderAwardButtons() {
	if (document.getElementById('awardRelay')) renderRelayAwardButtons();
	if (document.getElementById('duelTeamA')) {
		populateDuelTeamSelectors();
		renderDuelAwardButtons();
	}
	if (document.getElementById('awardChainRelay')) renderChainAwardButtons();
	if (document.getElementById('eliminationRoster')) renderEliminationRoster();
	if (document.getElementById('awardEstimation')) renderEstimationAwardButtons();
	if (document.getElementById('handsUpTeamButtons')) renderHandsUpTeamButtons();
	if (document.getElementById('sprintTeamSelect')) populateSprintTeamSelector();
	if (document.getElementById('pyramidBoard')) renderPyramidBoard();
	if (document.getElementById('streakTeamSelect')) populateStreakTeamSelector();
	if (document.getElementById('swapRoster')) renderSwapRoster();
	if (document.getElementById('wagerRoster')) renderWagerRoster();
	if (document.getElementById('curseTeamButtons')) renderCurseTeamPanel();
	if (document.getElementById('scapegoatRoster')) renderScapegoatRoster();
	if (document.getElementById('pointHeistRoster')) renderPointHeistRoster();
	if (document.getElementById('hotPotatoTeamSelect'))
		populateHotPotatoTeamSelector();
	if (document.getElementById('bountyRoster')) renderBountyRoster();
	if (document.getElementById('awardSequence')) renderSequenceAwardButtons();
	if (document.getElementById('siegeRoster')) renderSiegeRoster();
	if (document.getElementById('poolStandingsList')) renderPoolScreen();
}

function formatSeconds(total) {
	const minutes = String(Math.floor(total / 60)).padStart(2, '0');
	const seconds = String(total % 60).padStart(2, '0');
	return `${minutes}:${seconds}`;
}

function gatherState() {
	return {
		teams: teams,
		teamCounter: teamCounter,
		customLadder: customLadder,
		customDuel: customDuel,
		customChains: customChains,
		relayData: relayData,
		customElimination: customElimination,
		customEstimation: customEstimation,
		customHandsUp: customHandsUp,
		customSprint: customSprint,
		customPyramid: customPyramid,
		customStreak: customStreak,
		customSwapPairs: customSwapPairs,
		swapTokens: swapTokens,
		customWager: customWager,
		sessionMinutes: sessionTotalMinutes,
		customCurse: customCurse,
		customCurses: customCurses,
		customScapegoat: customScapegoat,
		customPointHeist: customPointHeist,
		vaultTotal: vaultTotal,
		vaultStart: vaultStart,
		pullAmount: pullAmount,
		raidAmount: raidAmount,
		allowPull: allowPull,
		allowRaid: allowRaid,
		customHotPotato: customHotPotato,
		hotPotatoAutoMin: hotPotatoAutoMin,
		hotPotatoAutoMax: hotPotatoAutoMax,
		customBounty: customBounty,
		bountyPercent: bountyPercent,
		bountyAllTiedLeaders: bountyAllTiedLeaders,
		customSequence: customSequence,
		customSiege: customSiege,
		siegeArmy: siegeArmy,
		siegeShielded: siegeShielded,
		siegeConversionRate: siegeConversionRate,
		siegeAttackAmount: siegeAttackAmount,
		siegeReinforcePct: siegeReinforcePct,
		gamblePredictions: gamblePredictions,
		customPool: customPool,
		poolMatchBonus: poolMatchBonus,
		poolFinalBonus: poolFinalBonus,
		poolCheckpointCount: poolCheckpointCount,
	};
}

function exportData() {
	const blob = new Blob([JSON.stringify(gatherState(), null, 2)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = 'math-club-deck-data.json';
	anchor.click();
	URL.revokeObjectURL(url);
}

function handleImportFile(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = () => {
		try {
			const data = JSON.parse(reader.result);
			restoreState(data);
			alert('Data loaded successfully.');
		} catch (error) {
			alert("Could not read that file, make sure it's a Math Club Deck export.");
		}
	};
	reader.readAsText(file);
	event.target.value = '';
}

function migrateHandsUpItem(item) {
	if (item && item.q === undefined && item.question !== undefined) {
		return {
			q: item.question,
			qImg: item.qImg,
			a: item.answer,
			e: item.explaination !== undefined ? item.explaination : item.explanation,
			aImg: item.aImg,
		};
	}
	return item;
}

function restoreState(data) {
	if (Array.isArray(data.teams) && data.teams.length) teams = data.teams;
	if (typeof data.teamCounter === 'number') teamCounter = data.teamCounter;
	if (Array.isArray(data.customLadder)) customLadder = data.customLadder;
	if (Array.isArray(data.customDuel)) customDuel = data.customDuel;
	if (Array.isArray(data.customChains)) customChains = data.customChains;
	if (data.relayData && data.relayData.categories && data.relayData.cells)
		relayData = data.relayData;
	if (Array.isArray(data.customElimination))
		customElimination = data.customElimination;
	if (Array.isArray(data.customEstimation))
		customEstimation = data.customEstimation;
	if (Array.isArray(data.customHandsUp))
		customHandsUp = data.customHandsUp.map(migrateHandsUpItem);
	if (Array.isArray(data.customSprint)) customSprint = data.customSprint;
	if (Array.isArray(data.customPyramid)) customPyramid = data.customPyramid;
	if (Array.isArray(data.customStreak)) customStreak = data.customStreak;
	if (Array.isArray(data.customSwapPairs))
		customSwapPairs = data.customSwapPairs;
	if (data.swapTokens && typeof data.swapTokens === 'object')
		swapTokens = data.swapTokens;
	if (Array.isArray(data.customWager)) customWager = data.customWager;
	if (Array.isArray(data.customCurse)) customCurse = data.customCurse;
	if (Array.isArray(data.customScapegoat))
		customScapegoat = data.customScapegoat;
	if (Array.isArray(data.customPointHeist))
		customPointHeist = data.customPointHeist;
	if (typeof data.vaultTotal === 'number') vaultTotal = data.vaultTotal;
	if (typeof data.vaultStart === 'number') vaultStart = data.vaultStart;
	if (typeof data.pullAmount === 'number') pullAmount = data.pullAmount;
	if (typeof data.raidAmount === 'number') raidAmount = data.raidAmount;
	if (typeof data.allowPull === 'boolean') allowPull = data.allowPull;
	if (typeof data.allowRaid === 'boolean') allowRaid = data.allowRaid;
	if (Array.isArray(data.customHotPotato))
		customHotPotato = data.customHotPotato;
	if (typeof data.hotPotatoAutoMin === 'number')
		hotPotatoAutoMin = data.hotPotatoAutoMin;
	if (typeof data.hotPotatoAutoMax === 'number')
		hotPotatoAutoMax = data.hotPotatoAutoMax;
	if (Array.isArray(data.customBounty)) customBounty = data.customBounty;
	if (typeof data.bountyPercent === 'number') bountyPercent = data.bountyPercent;
	if (typeof data.bountyAllTiedLeaders === 'boolean')
		bountyAllTiedLeaders = data.bountyAllTiedLeaders;
	if (Array.isArray(data.customSequence)) customSequence = data.customSequence;
	if (Array.isArray(data.customSiege)) customSiege = data.customSiege;
	if (data.siegeArmy && typeof data.siegeArmy === 'object')
		siegeArmy = data.siegeArmy;
	if (data.siegeShielded && typeof data.siegeShielded === 'object')
		siegeShielded = data.siegeShielded;
	if (typeof data.siegeConversionRate === 'number')
		siegeConversionRate = data.siegeConversionRate;
	if (typeof data.siegeAttackAmount === 'number')
		siegeAttackAmount = data.siegeAttackAmount;
	if (typeof data.siegeReinforcePct === 'number')
		siegeReinforcePct = data.siegeReinforcePct;
	if (data.gamblePredictions && typeof data.gamblePredictions === 'object')
		gamblePredictions = data.gamblePredictions;
	if (Array.isArray(data.customPool)) customPool = data.customPool;
	if (typeof data.poolMatchBonus === 'number')
		poolMatchBonus = data.poolMatchBonus;
	if (typeof data.poolFinalBonus === 'number')
		poolFinalBonus = data.poolFinalBonus;
	if (typeof data.poolCheckpointCount === 'number')
		poolCheckpointCount = data.poolCheckpointCount;

	if (data.sessionMinutes) {
		sessionTotalMinutes = data.sessionMinutes;
		const input = document.getElementById('sessionMinInput');
		if (input) input.value = data.sessionMinutes;
		if (!sessionInterval) {
			sessionSeconds = data.sessionMinutes * 60;
			renderSession();
		}
	}
	renderTeamsList();
	renderAwardButtons();
	initRelay();
	initLadder();
	duelIndex = 0;
	initDuel();
	initChainRelay();
	initElimination();
	initEstimation();
	initHandsUp();
	initSprint();
	initPyramid();
	initStreak();
	initSwap();
	initWager();
	initCurse();
	initScapegoat();
	initPointHeist();
	initHotPotato();
	initBounty();
	initSequence();
	initSiege();
	initPool();
	const customLadderList = document.getElementById('customLadderList');
	if (customLadderList) renderCustomLadderList();
	const customDuelList = document.getElementById('customDuelList');
	if (customDuelList) renderCustomDuelList();
}

function autosave() {
	try {
		localStorage.setItem('mathClubDeckData', JSON.stringify(gatherState()));
	} catch (error) {}
}

function tryAutoload() {
	try {
		const saved = localStorage.getItem('mathClubDeckData');
		if (saved) restoreState(JSON.parse(saved));
	} catch (error) {}
}
