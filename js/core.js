// Shared app shell — nav, teams, session timer, modal, save/load.
// Nothing game-specific should go here; see the engines for that.

/* -- navigation -- */
function goTo(name) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.getElementById("stage").scrollTop = 0;
}

document.addEventListener("keydown", (e) => {
  if (
    document.activeElement &&
    ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  )
    return;
  const k = e.key.toLowerCase();
  if (k === "h") goTo("home");;
  if (k === "1") goTo("ladder");
  if (k === "2") goTo("duel");
  if (k === "3") goTo("chainrelay");
  if (k === "4") goTo("relay");
  if (k === "5") goTo("elimination");
  if (k === "6") goTo("estimation");
  if (k === "7") goTo("handsup");
  if (k === "8") goTo("sprint");
  if (k === "s") openManageModal();
});

/* -- teams / scoreboard -- */
const colorPalette = [
  "#ffd23f",
  "#52d9c4",
  "#ff7597",
  "#b39ddb",
  "#ffb15e",
  "#7ec8ff",
  "#c9e26b",
  "#ff8a80",
];
let teams = [
  { id: "t1", name: "Team Yellow", color: colorPalette[0], score: 0 },
  { id: "t2", name: "Team Teal", color: colorPalette[1], score: 0 },
];
let teamCounter = 2;

function openManageModal() {
  openModal("Manage Session", buildManageModalBody());
  renderManageTeamsList();
}
function buildManageModalBody() {
  return `
    <div class="sb-title" style="margin-top:0;">Save &amp; Load</div>
    <div style="display:flex;gap:8px;margin-bottom:6px;">
      <button class="btn sm" onclick="exportData()"><svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>Export Data</button>
      <button class="btn sm ghost" onclick="document.getElementById('importFileInput').click()"><svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/></svg>Import Data</button>
    </div>
    <div style="font-size:11.5px;color:var(--chalk-muted);line-height:1.5;margin-bottom:4px;">
      Export saves your teams, custom questions, and board to a file you can reload anytime. This browser also autosaves in the background as a backup.
    </div>
    <input type="file" id="importFileInput" accept="application/json" style="display:none" onchange="handleImportFile(event)" />

    <div class="sb-title">Teams</div>
    <div id="manageTeamsList"></div>
    <button class="btn add-team-btn" onclick="addTeam()">+ Add Team</button>
    <button class="btn ghost sb-reset" onclick="resetScores()">Reset Scores</button>
  `;
}

function renderTeamsList() {
  renderShowbarTeams();
  renderManageTeamsList();
}
function renderShowbarTeams() {
  const wrap = document.getElementById("showbarTeams");
  if (!wrap) return;
  wrap.innerHTML = teams
    .map(
      (t) => `
    <div class="sb-team" style="--tc:${t.color}">
      <div class="sb-name">${escapeHtml(t.name)}</div>
      <div class="sb-score mono" data-team-score="${t.id}">${t.score}</div>
    </div>
  `,
    )
    .join("");
}
function renderManageTeamsList() {
  const list = document.getElementById("manageTeamsList");
  if (!list) return;
  list.innerHTML = teams
    .map(
      (t) => `
    <div class="team" style="border-left-color:${t.color}">
      <input class="tname" value="${escapeAttr(t.name)}" onchange="renameTeam('${t.id}', this.value)" />
      <div class="score-row">
        <div class="score-val mono" data-team-score="${t.id}" style="color:${t.color}">${t.score}</div>
        <div class="score-btns">
          <button class="btn sm" onclick="addScore('${t.id}',1,event)">+1</button>
          <button class="btn sm" onclick="addScore('${t.id}',-1,event)">−1</button>
        </div>
      </div>
      ${teams.length > 1 ? `<button class="btn sm ghost team-remove" onclick="removeTeam('${t.id}')">Remove team</button>` : ""}
    </div>
  `,
    )
    .join("");
}

// Shared by every engine's "Manage Questions" modal: takes a File from an
// <input type="file">, downscales it so nothing absurd ends up in
// localStorage/export, and hands back a compressed data URL via callback.
// maxDim caps the longer side in pixels; quality is JPEG 0-1.
function fileToCompressedDataURL(file, callback, maxDim = 900, quality = 0.82) {
  if (!file || !file.type.startsWith("image/")) {
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
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // flatten transparency onto white first so PNGs with alpha don't
      // turn black when re-encoded as JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => callback(null);
    img.src = reader.result;
  };
  reader.onerror = () => callback(null);
  reader.readAsDataURL(file);
}

// Renders the small "picker + thumbnail" widget used in every Manage
// Questions modal for an optional image field.
//   wrapId   - container element id to render into
//   inputId  - id to give the <input type="file">
//   dataUrl  - current value (or null) — pass the pending state var
//   onChange - called with the new compressed data URL, or null if removed
function renderImgUploadField(wrapId, inputId, dataUrl, onChange) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  if (dataUrl) {
    wrap.innerHTML = `
      <div class="img-upload-row">
        <div class="img-preview-wrap">
          <img src="${dataUrl}" alt="" />
          <button type="button" class="img-remove" title="Remove image">×</button>
        </div>
        <span style="font-size:12px;color:var(--chalk-muted)">Image attached</span>
      </div>`;
    wrap.querySelector(".img-remove").onclick = () => onChange(null);
  } else {
    wrap.innerHTML = `
      <div class="img-upload-row">
        <input type="file" id="${inputId}" accept="image/*" />
      </div>`;
    wrap.querySelector("input[type=file]").onchange = (evt) => {
      const file = evt.target.files[0];
      if (!file) return;
      fileToCompressedDataURL(file, (result) => {
        if (result) onChange(result);
        else alert("Could not read that image file.");
      });
    };
  }
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Shared by every engine: point an <img id="elId"> at `url`, or hide it
// (display:none, not just empty) when url is falsy. Used for the optional
// qImg/aImg fields on question objects.
function setPromptImage(elId, url) {
  const img = document.getElementById(elId);
  if (!img) return;
  if (url) {
    img.src = url;
    img.classList.remove("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
  }
}

function addTeam() {
  teamCounter++;
  const color = colorPalette[(teamCounter - 1) % colorPalette.length];
  teams.push({
    id: "t" + teamCounter,
    name: "Team " + teamCounter,
    color,
    score: 0,
  });
  renderTeamsList();
  renderAwardButtons();
  autosave();
}
function removeTeam(id) {
  if (teams.length <= 1) return;
  teams = teams.filter((t) => t.id !== id);
  renderTeamsList();
  renderAwardButtons();
  autosave();
}
function renameTeam(id, val) {
  const t = teams.find((t) => t.id === id);
  if (t) {
    t.name = val;
    renderAwardButtons();
	renderShowbarTeams()
    autosave();
  }
}
function addScore(id, delta, evt) {
  const t = teams.find((t) => t.id === id);
  if (!t) return;
  t.score += delta;
  document
    .querySelectorAll(`[data-team-score="${id}"]`)
    .forEach((el) => (el.textContent = t.score));
  if (evt) spawnDust(evt.clientX, evt.clientY, t.color);
}
function resetScores() {
  teams.forEach((t) => (t.score = 0));
  renderTeamsList();
}
function spawnDust(x, y, color) {
  const layer = document.getElementById("chalkLayer");
  for (let i = 0; i < 10; i++) {
    const d = document.createElement("div");
    d.className = "dust";
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    d.style.setProperty(
      "--fly",
      `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
    );
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.background = color;
    layer.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }
}

// Simple "+1 per team" award rows register their container id here.
// Duel/chain/relay have their own award logic below since they depend on
// extra state (which teams are dueling, which cell is open, etc).
const awardContainers = ["award-ladder"];
function renderAwardButtons() {
  awardContainers.forEach((cid) => {
    const el = document.getElementById(cid);
    if (!el) return;
    el.innerHTML = teams
      .map(
        (t) => `
      <button class="btn award-btn" style="border-color:${t.color}" onclick="addScore('${t.id}',1,event)">+1 <span>${escapeHtml(t.name)}</span></button>
    `,
      )
      .join("");
  });
  // relay's point value varies per cell, so only rebuild while a question is open
  if (typeof currentRelayKey !== "undefined" && currentRelayKey) {
    renderRelayAwardButtons();
  }
  if (document.getElementById("duelTeamA")) {
    populateDuelTeamSelectors();
    renderDuelAwardButtons();
  }
  if (document.getElementById("award-chainrelay")) {
    renderChainAwardButtons();
  }
  if (document.getElementById("eliminationRoster")) {
    renderEliminationRoster();
  }
  if (document.getElementById("award-estimation")) {
    renderEstimationAwardButtons();
  }
  if (document.getElementById("handsupTeamButtons")) {
    renderHandsupTeamButtons();
  }
  if (document.getElementById("sprintTeamSelect")) {
    populateSprintTeamSelector();
  }
}

/* -- session timer -- */
let sessionSeconds = 35 * 60,
  sessionInterval = null,
  sessionTotalMinutes = 35;
function formatSeconds(total) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}
function renderSession() {
  const txt = formatSeconds(sessionSeconds);
  const low = sessionSeconds <= 120;
  const mini = document.getElementById("sessionMini");
  if (mini) {
    mini.textContent = txt;
    mini.classList.toggle("low", low);
  }
  const full = document.getElementById("sessionDisplay");
  if (full) {
    full.textContent = txt;
    full.classList.toggle("low", low);
  }
}
function toggleSession() {
  const btn = document.getElementById("sessionToggleBtn");
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
    if (btn) btn.textContent = "Start";
  } else {
    if (btn) btn.textContent = "Pause";
    sessionInterval = setInterval(() => {
      if (sessionSeconds > 0) {
        sessionSeconds--;
        renderSession();
      } else {
        clearInterval(sessionInterval);
        sessionInterval = null;
        const b = document.getElementById("sessionToggleBtn");
        if (b) b.textContent = "Start";
      }
    }, 1000);
  }
}
function resetSession() {
  clearInterval(sessionInterval);
  sessionInterval = null;
  const btn = document.getElementById("sessionToggleBtn");
  if (btn) btn.textContent = "Start";
  sessionSeconds = sessionTotalMinutes * 60;
  renderSession();
}
function setSessionMinutes(val) {
  const mins = Math.max(1, Math.min(120, parseInt(val, 10) || 35));
  sessionTotalMinutes = mins;
  const input = document.getElementById("sessionMinInput");
  if (input) input.value = mins;
  if (!sessionInterval) {
    sessionSeconds = mins * 60;
    renderSession();
  }
  autosave();
}

/* -- modal -- */
function openModal(title, bodyHtml) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

/* -- math typesetting -- */
function typeset(el) {
  if (window.renderMathInElement && el) {
    renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
}

/* -- save / load --
   gatherState/restoreState pull together each engine's state (custom
   questions, board data, etc). Extend both when a new engine needs saving. */
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
    customHandsup: customHandsup,
    customSprint: customSprint,
    sessionMinutes: sessionTotalMinutes,
  };
}
function exportData() {
  const blob = new Blob([JSON.stringify(gatherState(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "math-club-deck-data.json";
  a.click();
  URL.revokeObjectURL(url);
}
function handleImportFile(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      restoreState(data);
      alert("Data loaded successfully.");
    } catch (e) {
      alert(
        "Could not read that file, make sure it's a Math Club Deck export.",
      );
    }
  };
  reader.readAsText(file);
  evt.target.value = "";
}
function restoreState(data) {
  if (Array.isArray(data.teams) && data.teams.length) {
    teams = data.teams;
  }
  if (typeof data.teamCounter === "number") {
    teamCounter = data.teamCounter;
  }
  if (Array.isArray(data.customLadder)) {
    customLadder = data.customLadder;
  }
  if (Array.isArray(data.customDuel)) {
    customDuel = data.customDuel;
  }
  if (Array.isArray(data.customChains)) {
    customChains = data.customChains;
  }
  if (data.relayData && data.relayData.categories && data.relayData.cells) {
    relayData = data.relayData;
  }
  if (Array.isArray(data.customElimination)) {
    customElimination = data.customElimination;
  }
  if (Array.isArray(data.customEstimation)) {
    customEstimation = data.customEstimation;
  }
  if (Array.isArray(data.customHandsup)) {
    customHandsup = data.customHandsup;
  }
  if (Array.isArray(data.customSprint)) {
    customSprint = data.customSprint;
  }
  if (data.sessionMinutes) {
    sessionTotalMinutes = data.sessionMinutes;
    const input = document.getElementById("sessionMinInput");
    if (input) input.value = data.sessionMinutes;
    if (!sessionInterval) {
      sessionSeconds = data.sessionMinutes * 60;
      renderSession();
    }
  }
  renderTeamsList();
  renderAwardButtons();
  renderRelayGrid();
  resetLadder();
  duelPool = getDuelPool();
  duelIdx = 0;
  renderDuelProblem();
  populateDuelTeamSelectors();
  renderDuelAwardButtons();
  shuffleChainPool();
  newChain();
  resetElimination();
  resetEstimation();
  resetHandsup();
  newSprint();
  const cll = document.getElementById("customLadderList");
  if (cll) renderCustomLadderList();
  const cdl = document.getElementById("customDuelList");
  if (cdl) renderCustomDuelList();
}
function autosave() {
  try {
    localStorage.setItem("mathClubDeckData", JSON.stringify(gatherState()));
  } catch (e) {
    /* storage unavailable (e.g. inside a preview sandbox) — export/import still works */
  }
}
function tryAutoload() {
  try {
    const saved = localStorage.getItem("mathClubDeckData");
    if (saved) restoreState(JSON.parse(saved));
  } catch (e) {
    /* ignore */
  }
}
