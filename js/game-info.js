// "How to play" text shown in the rules modal for each game.
// To add a new game, add an entry here keyed by its screen id, then wire
// up a "How to Play" button in index.html calling openGameInfoModal(id).
const gameInfo = {
  ladder: {
    title: "Contest Ladder: How to Play",
    mechanic: "Ladder",
    format: "Solo climb",
    howToPlay:
      'Teams work through a single ladder of contest-style problems in four escalating tiers (Warm-up → Building → Push → Frontier), five problems per tier, always straight through with no branching. Each problem gets its own 90-second countdown timer, started manually by the host, followed by a "Reveal Answer" step showing the answer and worked explanation.',
    scoring:
      'Points equal the tier number (1–4 pts). Whoever answers first gets the award tap. "Next Problem" advances; "Restart Ladder" resets to problem 1.',
    customization:
      '"Manage Questions" lets the host add unlimited custom questions at any tier (1–4); they\'re appended to the built-in pool and persist across sessions (autosaved + exportable).',
  },
  duel: {
    title: "Countdown Duel: How to Play",
    mechanic: "Duel",
    format: "Head-to-head",
    howToPlay:
      'Host picks two teams from dropdowns to face off. One mixed-difficulty problem is shown to both at once; "Reveal Answer" shows the solution, "Next Problem" cycles the pool (15 built-in problems, repeating once exhausted). The matchup can be swapped anytime, mid-round or between.',
    scoring:
      "Flat 1 pt per round, no tiering. Award buttons only show for the two currently-selected teams, so scoring stays scoped to the active duel.",
    customization:
      '"Manage Questions" adds custom problems (question/answer/explanation) to the shared duel pool.',
  },
  chainrelay: {
    title: "Chain Relay: How to Play",
    mechanic: "Chain",
    format: "Whole-group relay",
    howToPlay:
      'Contest-style relay: every team solves the same link at the same time. Each chain has exactly 3 links of increasing difficulty. The numeric answer to one link becomes a variable T, plugged directly into the next link\'s question, so an early mistake propagates forward. Progress dots show which link is active; "New Chain" jumps to a fresh chain (from a shuffled pool of 4 built-ins) once all 3 links are done.',
    scoring:
      "Flat 1 pt per link, awarded to whichever team solves it first (host's judgment call).",
    customization:
      '"Manage Chains" adds custom chains, but each must have exactly 3 links (question/answer/explanation) since links 2–3 reference the prior T.',
  },
  relay: {
    title: "Speed Relay Board: How to Play",
    mechanic: "Board",
    format: "Free-pick",
    howToPlay:
      'A Jeopardy-style 4×4 grid: 4 categories × 4 point values ($100–$400). Any team/host clicks an unused cell to reveal its question; once answered and scored, the cell is marked used (✓) and can\'t reopen. "Reset Board" clears all used marks.',
    scoring:
      "Points scale with the cell's dollar value ($100 = 1pt … $400 = 4pt), tied to difficulty.",
    customization:
      '"Edit Board" is fully open-ended, the host can rename all 4 categories and rewrite every question/answer/explanation in the grid, making this the fastest of the four to re-theme for a themed session.',
  },
  elimination: {
    title: "Elimination Gauntlet: How to Play",
    mechanic: "Elimination",
    format: "Whole-group, last team standing",
    howToPlay:
      'Every team works the same problem at once on whiteboards. After "Reveal Answer", the host marks each team ✓ Survived or ✗ Out. A round where every remaining team would be marked wrong doesn\'t eliminate anyone, at least one team always survives to keep the gauntlet moving. Play continues, round after round, until one team is left.',
    scoring:
      'Surviving a round is worth 1 pt. The last team standing gets a 5-point Champion Bonus. "New Gauntlet" brings all teams back in and restarts.',
    customization:
      '"Manage Questions" adds problems with an optional 1-4 difficulty badge (cosmetic only — scoring stays flat).',
  },
  estimation: {
    title: "Estimation Auction: How to Play",
    mechanic: "Estimation",
    format: "Simultaneous, all teams",
    howToPlay:
      'Host reveals a question with a single numeric answer (e.g. "how many diagonals does a pentadecagon have?"). Teams write down their best guess on whiteboards within the countdown, no full derivation needed. "Reveal Answer" shows the real number and reasoning; the host judges whose guess was closest.',
    scoring:
      "Closest guess earns the team 2 pts; an exact match earns an additional 2-point bonus on top (4 total). Both buttons are available for every team so the host can award either or both.",
    customization:
      '"Manage Questions" adds question / exact answer / explanation triples to the shared pool.',
  },
  handsup: {
    title: "Hands-Up Steal: How to Play",
    mechanic: "Steal",
    format: "Open to all teams",
    howToPlay:
      'One question is shown to the whole room. Teams work it on whiteboards and raise a hand when ready; the host calls on whoever raised first and marks them ✓ Correct or ✗ Wrong. A wrong answer keeps the question live, any other team can raise a hand and steal it. Once someone answers correctly (or everyone has had a turn), "Next Problem" moves on.',
    scoring:
      "The first team to answer correctly earns 2 pts; a steal after someone else missed is worth 1 pt.",
    customization:
      '"Manage Questions" adds problems (question/answer/explanation) to its own pool.',
  },
  sprint: {
    title: "Speed Sprint: How to Play",
    mechanic: "Volume",
    format: "Solo, timed block",
    howToPlay:
      'Pick one team and hit "Start Sprint" to begin a single 3-minute countdown. The team races through as many short problems as they can, calling out answers as they go, the host just checks each one against the on-screen answer key and taps "Correct" or "Skip" to advance. No per-problem timer or reveal step; it\'s all about pace. Rotate teams through their own timed turn.',
    scoring:
      "1 pt per correct answer in the block, awarded in one lump sum when time's up, plus a +1 bonus if the team cleared the whole question pool before the clock ran out.",
    customization:
      '"Manage Questions" adds quick question/answer pairs, keep them short since teams are racing the clock.',
  },
};

function openGameInfoModal(id) {
  const g = gameInfo[id];
  if (!g) return;
  openModal(
    g.title,
    `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      <span class="tag">${escapeHtml(g.mechanic)} mechanic</span>
      <span class="tag time">${escapeHtml(g.format)}</span>
    </div>
    <div class="sb-title" style="margin-top:0;">How it plays</div>
    <div style="font-size:13.5px;color:var(--chalk-muted);line-height:1.6;">${escapeHtml(g.howToPlay)}</div>
    <div class="sb-title">Scoring</div>
    <div style="font-size:13.5px;color:var(--chalk-muted);line-height:1.6;">${escapeHtml(g.scoring)}</div>
    <div class="sb-title">Customization</div>
    <div style="font-size:13.5px;color:var(--chalk-muted);line-height:1.6;">${escapeHtml(g.customization)}</div>
  `,
  );
}
