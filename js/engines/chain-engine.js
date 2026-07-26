let customChains = [];
let chainPool = [];
let chainOrder = [];
let chainIndex = -1;
let linkIndex = 0;

const chainImageFields = [1, 2, 3].map((n) =>
	createQAImageState({
		qWrap: 'newChainQImgWrap' + n,
		qFile: 'newChainQImgFile' + n,
		aWrap: 'newChainAImgWrap' + n,
		aFile: 'newChainAImgFile' + n,
	}),
);

function initChainRelay() {
	shuffleChainPool();
	newChain();
	renderChainAwardButtons();
}

function shuffleChainPool() {
	chainPool = customChains;
	chainOrder = chainPool.map((chain, i) => i);
	for (let i = chainOrder.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[chainOrder[i], chainOrder[j]] = [chainOrder[j], chainOrder[i]];
	}
	chainIndex = -1;
}

function newChain() {
	if (chainOrder.length === 0 || chainIndex >= chainOrder.length - 1) {
		shuffleChainPool();
	}
	if (chainPool.length === 0) {
		renderChainScreen();
		return;
	}
	chainIndex++;
	linkIndex = 0;
	renderChainScreen();
}

function nextChainLink() {
	if (chainPool.length === 0) {
		newChain();
		return;
	}
	const chain = chainPool[chainOrder[chainIndex]];
	if (linkIndex < chain.links.length - 1) {
		linkIndex++;
		renderChainScreen();
	} else {
		newChain();
	}
}

function renderChainScreen() {
	const dots = document.getElementById('chainLinkDots');
	if (chainPool.length === 0) {
		document.getElementById('chainNameLine').textContent = 'No chains yet';
		dots.innerHTML = '';
		document.getElementById('chainTBadgeWrap').innerHTML = '';
		document.getElementById('chainQuestionText').textContent =
			'No chains yet, use "Manage Chains" above to add one.';
		document.getElementById('chainAnswerBox').classList.remove('show');
		return;
	}
	const chain = chainPool[chainOrder[chainIndex]];
	document.getElementById('chainNameLine').textContent =
		`${chain.name} — Link ${linkIndex + 1} of ${chain.links.length}`;
	dots.innerHTML = chain.links
		.map((_, i) => {
			let chainClass = '';
			if (i < linkIndex) chainClass = 'done';
			else if (i === linkIndex) chainClass = 'current';
			return `<span class="${chainClass}"></span>`;
		})
		.join('');
	document.getElementById('chainTBadgeWrap').innerHTML =
		linkIndex > 0
			? `<div class="t-badge">T = ${escapeHtml(chain.links[linkIndex - 1].a)}</div>`
			: '';
	const qElement = document.getElementById('chainQuestionText');
	qElement.textContent = chain.links[linkIndex].q;
	setPromptImage('chainQuestionImg', chain.links[linkIndex].qImg);
	typeset(qElement);
	typeset(document.getElementById('chainTBadgeWrap'));
	document.getElementById('chainAnswerBox').classList.remove('show');
}

function revealChainAnswer() {
	if (chainPool.length === 0) return;
	const chain = chainPool[chainOrder[chainIndex]];
	const link = chain.links[linkIndex];
	document.getElementById('chainAnswerFigure').textContent = `T = ${link.a}`;
	setPromptImage('chainAnswerImg', link.aImg);
	document.getElementById('chainAnswerReasoning').textContent = link.e;
	const box = document.getElementById('chainAnswerBox');
	box.classList.add('show');
	typeset(box);
}

function renderChainAwardButtons() {
	renderTeamAwardButtons('awardChainRelay', teams, () => [{ label: '+1', points: 1 }]);
}

function openChainModal() {
	let list = customChains
		.map(
			(chain, i) => `
				<div class="custom-list-item">
				<div class="txt"><b>${escapeHtml(chain.name)}</b><br>${chain.links.length} links</div>
				<button class="btn small ghost" onclick="deleteCustomChain(${i})">Delete</button>
				</div>
			`,
		)
		.join('');
	openModal(
		'Manage Chain Relay Chains',
		`
			<div style="font-size: 13px; color: var(--chalk-muted); line-height: 1.6;">
				Custom chains need exactly 3 links, each with a question, answer, and explanation. Reference the previous answer as <b>T</b> in your question text.
			</div>
			<div class="field-label">Chain name</div>
			<input type="text" id="newChainName" placeholder="e.g. Prime Path" />
			<div class="field-label">Link 1 — question / answer / explanation</div>
			<textarea id="newChainQ1" placeholder="Question"></textarea>
			<div class="field-label">Link 1 question image (optional)</div>
			<div id="newChainQImgWrap1"></div>
			<input type="text" id="newChainA1" placeholder="Answer (becomes T)" style="margin-top: 6px;" />
			<textarea id="newChainE1" placeholder="Explanation" style="margin-top: 6px;"></textarea>
			<div class="field-label">Link 1 answer image (optional)</div>
			<div id="newChainAImgWrap1"></div>
			<div class="field-label">Link 2 — question / answer / explanation</div>
			<textarea id="newChainQ2" placeholder="Question (reference T)"></textarea>
			<div class="field-label">Link 2 question image (optional)</div>
			<div id="newChainQImgWrap2"></div>
			<input type="text" id="newChainA2" placeholder="Answer (becomes new T)" style="margin-top: 6px;" />
			<textarea id="newChainE2" placeholder="Explanation" style="margin-top:6px;"></textarea>
			<div class="field-label">Link 2 answer image (optional)</div>
			<div id="newChainAImgWrap2"></div>
			<div class="field-label">Link 3 — question / answer / explanation</div>
			<textarea id="newChainQ3" placeholder="Question (reference T)"></textarea>
			<div class="field-label">Link 3 question image (optional)</div>
			<div id="newChainQImgWrap3"></div>
			<input type="text" id="newChainA3" placeholder="Final answer" style="margin-top: 6px;" />
			<textarea id="newChainE3" placeholder="Explanation" style="margin-top: 6px;"></textarea>
			<div class="field-label">Link 3 answer image (optional)</div>
			<div id="newChainAImgWrap3"></div>
			<button class="btn primary" style="margin-top: 12px;" onclick="addCustomChain()">Add Chain</button>
			<div class="field-label" style="margin-top: 22px;">Your custom chains</div>
			<div id="customChainList">
				${list || '<div style="color: var(--chalk-muted); font-size: 13px;">No custom chains yet.</div>'}
			</div>
		`,
	);
	chainImageFields.forEach((f) => f.reset());
}

function addCustomChain() {
	const name = document.getElementById('newChainName').value.trim();
	const links = [1, 2, 3].map((n) => ({
		q: document.getElementById('newChainQ' + n).value.trim(),
		qImg: chainImageFields[n - 1].state.q || undefined,
		a: document.getElementById('newChainA' + n).value.trim(),
		e: document.getElementById('newChainE' + n).value.trim(),
		aImg: chainImageFields[n - 1].state.a || undefined,
	}));
	if (!name || links.some((link) => !link.q || !link.a)) {
		alert('Enter a chain name and at least a question + answer for all three links.');
		return;
	}
	customChains.push({ name, links });
	chainImageFields.forEach((f) => f.reset());
	closeModal();
	autosave();
}

function deleteCustomChain(i) {
	customChains.splice(i, 1);
	closeModal();
	openChainModal();
	autosave();
}
