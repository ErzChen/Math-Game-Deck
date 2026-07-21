// "How to play" text shown in the rules modal for each game.
// To add a new game, add an entry here keyed by its screen id, then wire
// up a "How to Play" button in index.html calling openGameInfoModal(id).
const gameInfo = {
	ladder: {
		title: 'Contest Ladder: How to Play',
		mechanic: 'Ladder',
		format: 'Solo climb',
		howToPlay:
			'Teams work through a single ladder of contest-style problems in four escalating tiers (Warm-up → Building → Push → Frontier), five problems per tier, always straight through with no branching. Each problem gets its own 90-second countdown timer, started manually by the host, followed by a "Reveal Answer" step showing the answer and worked explanation.',
		scoring:
			'Points equal the tier number (1–4 pts). Whoever answers first gets the award tap. "Next Problem" advances; "Restart Ladder" resets to problem 1.',
		customization:
			'"Manage Questions" lets the host add unlimited custom questions at any tier (1–4); they\'re appended to the built-in pool and persist across sessions (autosaved + exportable).',
	},
	duel: {
		title: 'Countdown Duel: How to Play',
		mechanic: 'Duel',
		format: 'Head-to-head',
		howToPlay:
			'Host picks two teams from dropdowns to face off. One mixed-difficulty problem is shown to both at once; "Reveal Answer" shows the solution, "Next Problem" cycles the pool (15 built-in problems, repeating once exhausted). The matchup can be swapped anytime, mid-round or between.',
		scoring:
			'Flat 1 pt per round, no tiering. Award buttons only show for the two currently-selected teams, so scoring stays scoped to the active duel.',
		customization:
			'"Manage Questions" adds custom problems (question/answer/explanation) to the shared duel pool.',
	},
	chainrelay: {
		title: 'Chain Relay: How to Play',
		mechanic: 'Chain',
		format: 'Whole-group relay',
		howToPlay:
			'Contest-style relay: every team solves the same link at the same time. Each chain has exactly 3 links of increasing difficulty. The numeric answer to one link becomes a variable T, plugged directly into the next link\'s question, so an early mistake propagates forward. Progress dots show which link is active; "New Chain" jumps to a fresh chain (from a shuffled pool of 4 built-ins) once all 3 links are done.',
		scoring:
			"Flat 1 pt per link, awarded to whichever team solves it first (host's judgment call).",
		customization:
			'"Manage Chains" adds custom chains, but each must have exactly 3 links (question/answer/explanation) since links 2–3 reference the prior T.',
	},
	relay: {
		title: 'Speed Relay Board: How to Play',
		mechanic: 'Board',
		format: 'Free-pick',
		howToPlay:
			'A Jeopardy-style 4×4 grid: 4 categories × 4 point values ($100–$400). Any team/host clicks an unused cell to reveal its question; once answered and scored, the cell is marked used (✓) and can\'t reopen. "Reset Board" clears all used marks.',
		scoring:
			"Points scale with the cell's dollar value ($100 = 1pt … $400 = 4pt), tied to difficulty.",
		customization:
			'"Edit Board" is fully open-ended, the host can rename all 4 categories and rewrite every question/answer/explanation in the grid, making this the fastest of the four to re-theme for a themed session.',
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
