// Chain engine — each answer becomes T, feeding into the next, harder link.
// Expects a global `defaultChains()` returning { name, links: [{q,a,e}] }[].
let customChains = [];
function getChainPool() {
	return defaultChains().concat(customChains);
}
let chainPool = [],
	chainOrder = [],
	chainIdx = -1,
	linkIdx = 0;

function shuffleChainPool() {
	chainPool = getChainPool();
	chainOrder = chainPool.map((_, i) => i);
	for (let i = chainOrder.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[chainOrder[i], chainOrder[j]] = [chainOrder[j], chainOrder[i]];
	}
	chainIdx = -1;
}
function newChain() {
	if (chainOrder.length === 0 || chainIdx >= chainOrder.length - 1) {
		shuffleChainPool();
	}
	if (chainPool.length === 0) {
		renderChainScreen();
		return;
	}
	chainIdx++;
	linkIdx = 0;
	renderChainScreen();
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
	const chain = chainPool[chainOrder[chainIdx]];
	document.getElementById('chainNameLine').textContent =
		`${chain.name} — Link ${linkIdx + 1} of ${chain.links.length}`;
	dots.innerHTML = chain.links
		.map((_, i) => {
			let cls = '';
			if (i < linkIdx) cls = 'done';
			else if (i === linkIdx) cls = 'current';
			return `<span class="${cls}"></span>`;
		})
		.join('');
	document.getElementById('chainTBadgeWrap').innerHTML =
		linkIdx > 0
			? `<div class="t-badge">T = ${escapeHtml(chain.links[linkIdx - 1].a)}</div>`
			: '';
	const qEl = document.getElementById('chainQuestionText');
	qEl.textContent = chain.links[linkIdx].q;
	typeset(qEl);
	typeset(document.getElementById('chainTBadgeWrap'));
	document.getElementById('chainAnswerBox').classList.remove('show');
}
function revealChainAnswer() {
	if (chainPool.length === 0) return;
	const chain = chainPool[chainOrder[chainIdx]];
	const link = chain.links[linkIdx];
	document.getElementById('chainAnswerFigure').textContent = `T = ${link.a}`;
	document.getElementById('chainAnswerReasoning').textContent = link.e;
	const box = document.getElementById('chainAnswerBox');
	box.classList.add('show');
	typeset(box);
}
function nextChainLink() {
	if (chainPool.length === 0) {
		newChain();
		return;
	}
	const chain = chainPool[chainOrder[chainIdx]];
	if (linkIdx < chain.links.length - 1) {
		linkIdx++;
		renderChainScreen();
	} else {
		newChain();
	}
}
function renderChainAwardButtons() {
	const el = document.getElementById('award-chainrelay');
	if (!el) return;
	el.innerHTML = teams
		.map(
			(t) => `
    <button class="btn award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',1,event)">+1 <span>${escapeHtml(t.name)}</span></button>
  `,
		)
		.join('');
}
function openChainModal() {
	let list = customChains
		.map(
			(c, i) => `
    <div class="custom-list-item">
      <div class="txt"><b>${escapeHtml(c.name)}</b><br>${c.links.length} links</div>
      <button class="btn sm ghost" onclick="deleteCustomChain(${i})">Delete</button>
    </div>
  `,
		)
		.join('');
	openModal(
		'Manage Chain Relay Chains',
		`
    <div style="font-size:13px;color:var(--chalk-muted);line-height:1.6;">Custom chains need exactly 3 links, each with a question, answer, and explanation. Reference the previous answer as <b>T</b> in your question text.</div>
    <div class="field-label">Chain name</div>
    <input type="text" id="newChainName" placeholder="e.g. Prime Path" />
    <div class="field-label">Link 1 — question / answer / explanation</div>
    <textarea id="newChainQ1" placeholder="Question"></textarea>
    <input type="text" id="newChainA1" placeholder="Answer (becomes T)" style="margin-top:6px;" />
    <textarea id="newChainE1" placeholder="Explanation" style="margin-top:6px;"></textarea>
    <div class="field-label">Link 2 — question / answer / explanation</div>
    <textarea id="newChainQ2" placeholder="Question (reference T)"></textarea>
    <input type="text" id="newChainA2" placeholder="Answer (becomes new T)" style="margin-top:6px;" />
    <textarea id="newChainE2" placeholder="Explanation" style="margin-top:6px;"></textarea>
    <div class="field-label">Link 3 — question / answer / explanation</div>
    <textarea id="newChainQ3" placeholder="Question (reference T)"></textarea>
    <input type="text" id="newChainA3" placeholder="Final answer" style="margin-top:6px;" />
    <textarea id="newChainE3" placeholder="Explanation" style="margin-top:6px;"></textarea>
    <button class="btn primary" style="margin-top:12px;" onclick="addCustomChain()">Add Chain</button>
    <div class="field-label" style="margin-top:22px;">Your custom chains</div>
    <div id="customChainList">${list || '<div style="color:var(--chalk-muted);font-size:13px;">No custom chains yet.</div>'}</div>
  `,
	);
}
function addCustomChain() {
	const name = document.getElementById('newChainName').value.trim();
	const links = [1, 2, 3].map((n) => ({
		q: document.getElementById('newChainQ' + n).value.trim(),
		a: document.getElementById('newChainA' + n).value.trim(),
		e: document.getElementById('newChainE' + n).value.trim(),
	}));
	if (!name || links.some((l) => !l.q || !l.a)) {
		alert(
			'Enter a chain name and at least a question + answer for all three links.',
		);
		return;
	}
	customChains.push({ name, links });
	closeModal();
	autosave();
}
function deleteCustomChain(i) {
	customChains.splice(i, 1);
	closeModal();
	openChainModal();
	autosave();
}
