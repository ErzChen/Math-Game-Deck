const gameInfo = {
	ladder: {
		title: 'Contest Ladder: How to Play',
		mechanic: 'Ladder',
		format: 'Whole-group, first-to-answer',
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
		format: 'Two-team head-to-head',
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
		format: 'Whole-group, first-to-answer',
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
		format: 'Open board, free-pick',
		howToPlay:
			'A Jeopardy-style 4×4 grid: 4 categories × 4 point values ($100–$400). Any team/host clicks an unused cell to reveal its question; once answered and scored, the cell is marked used (✓) and can\'t reopen. "Reset Board" clears all used marks.',
		scoring:
			"Points scale with the cell's dollar value ($100 = 1pt … $400 = 4pt), tied to difficulty.",
		customization:
			'"Edit Board" is fully open-ended, the host can rename all 4 categories and rewrite every question/answer/explanation in the grid, making this the fastest of the four to re-theme for a themed session.',
	},
	elimination: {
		title: 'Elimination Gauntlet: How to Play',
		mechanic: 'Elimination',
		format: 'Whole-group, last team standing',
		howToPlay:
			'Every team works the same problem at once on whiteboards. After "Reveal Answer", the host marks each team ✓ Survived or ✗ Out. A round where every remaining team would be marked wrong doesn\'t eliminate anyone, at least one team always survives to keep the gauntlet moving. Play continues, round after round, until one team is left.',
		scoring:
			'Surviving a round is worth 1 pt. The last team standing gets a 5-point Champion Bonus. "New Gauntlet" brings all teams back in and restarts.',
		customization:
			'"Manage Questions" adds problems with an optional 1-4 difficulty badge (cosmetic only — scoring stays flat).',
	},
	estimation: {
		title: 'Estimation Auction: How to Play',
		mechanic: 'Estimation',
		format: 'All teams, simultaneous',
		howToPlay:
			'Host reveals a question with a single numeric answer (e.g. "how many diagonals does a pentadecagon have?"). Teams write down their best guess on whiteboards within the countdown, no full derivation needed. "Reveal Answer" shows the real number and reasoning; the host judges whose guess was closest.',
		scoring:
			'Closest guess earns the team 2 pts; an exact match earns an additional 2-point bonus on top (4 total). Both buttons are available for every team so the host can award either or both.',
		customization:
			'"Manage Questions" adds question / exact answer / explanation triples to the shared pool.',
	},
	handsup: {
		title: 'Hands-Up Steal: How to Play',
		mechanic: 'Steal',
		format: 'Whole-group, steal-eligible',
		howToPlay:
			'One question is shown to the whole room. Teams work it on whiteboards and raise a hand when ready; the host calls on whoever raised first and marks them ✓ Correct or ✗ Wrong. A wrong answer keeps the question live, any other team can raise a hand and steal it. Once someone answers correctly (or everyone has had a turn), "Next Problem" moves on.',
		scoring:
			'The first team to answer correctly earns 2 pts; a steal after someone else missed is worth 1 pt.',
		customization:
			'"Manage Questions" adds problems (question/answer/explanation) to its own pool.',
	},
	sprint: {
		title: 'Speed Sprint: How to Play',
		mechanic: 'Volume',
		format: 'Solo team, rotating turns',
		howToPlay:
			'Pick one team and hit "Start Sprint" to begin a single 7-minute countdown. The team races through as many short problems as they can, calling out answers as they go, the host just checks each one against the on-screen answer key and taps "Correct" or "Skip" to advance. No per-problem timer or reveal step; it\'s all about pace. Rotate teams through their own timed turn.',
		scoring:
			"1 pt per correct answer in the block, awarded in one lump sum when time's up, plus a +1 bonus if the team cleared the whole question pool before the clock ran out.",
		customization:
			'"Manage Questions" adds quick question/answer pairs, keep them short since teams are racing the clock.',
	},
	pyramid: {
		title: 'Pyramid Race: How to Play',
		mechanic: 'Race',
		format: 'All teams, simultaneous race',
		howToPlay:
			'Every team gets the same pyramid of problems (easy at the base, hardest at the top), and races through it on their own pace, all at once, unlike the shared single-file climb of Contest Ladder. Host starts one countdown for the whole pyramid. The first team to correctly finish every problem calls it out and wins the round outright; when time runs out, other teams still earn credit for how far up the pyramid they got.',
		scoring:
			'The first team to finish the whole pyramid correctly earns a 3-point bonus. Every team also earns 1 pt per problem they solved correctly before time ran out, so partial progress still counts.',
		customization:
			'"Manage Questions" adds a set of problems arranged from easiest to hardest.',
	},
	streak: {
		title: 'Streak Vault: How to Play',
		mechanic: 'Push Your Luck',
		format: 'Solo team, rotating turns',
		howToPlay:
			'One team takes the spotlight while the rest of the room watches. They face a sequence of problems that get progressively harder. After each correct answer, the team makes a live call: "Bank" to lock in their points so far and end their turn safely, or "Push" to attempt the next, harder problem for a bigger prize. A single wrong answer while pushing wipes out everything unbanked that turn. The turn then passes to the next team either way, so everyone gets a spotlight run before the session ends.',
		scoring:
			'Points escalate with each problem in the sequence (e.g. 1 pt → 2 pts → 4 pts), all forfeited if the team pushes and misses. Whatever a team has banked before stopping (or busting) is locked in for good.',
		customization:
			'"Manage Streak Set" adds an ordered sequence of problems from easy to hard; longer sequences raise the ceiling but also the risk of pushing too far.',
	},
	swapmarket: {
		title: 'Swap Market: How to Play',
		mechanic: 'Trade',
		format: 'All teams, simultaneous',
		howToPlay:
			'Every team starts with a small stash of swap tokens. When a hard problem is revealed, any team may spend one token before the timer starts to trade it for an easier backup problem worth fewer points, a real risk/reward call between guaranteed partial credit and a bigger payoff. Unlike All-In Wager, which bets points on confidence in the same problem, this is about opting out of a problem entirely at a resource cost. Once the timer starts, no more swaps are allowed for that round.',
		scoring:
			'The original hard problem is worth 3 pts; a swapped-in backup problem is worth 1 pt. Tokens are spent whether or not the backup is answered correctly.',
		customization:
			'"Manage Problem Pairs" adds a hard problem paired with its easier backup, so every problem in the pool has a swap option ready to go.',
	},
	wager: {
		title: 'All-In Wager: How to Play',
		mechanic: 'Wager',
		format: 'All teams, simultaneous',
		howToPlay:
			'Every team starts with a fixed bank of points. Host reveals a problem along with a difficulty rating; teams secretly write down both their answer and a wager (1–5 points) on their whiteboard based on how confident they are. "Reveal Answer" shows the solution, and the host checks each team\'s answer against their hidden wager before adjusting banks. Plan for roughly 8–10 rounds per session.',
		scoring:
			"A correct wager adds that many points to the team's bank; a wrong wager subtracts it. Running bank totals double as the leaderboard, so a bold wrong guess can drop a team below zero.",
		customization:
			'"Manage Questions" adds problems with a difficulty tag (1–5) that suggests, but doesn\'t force, how much a team should wager.',
	},
};

function openGameInfoModal(id) {
	const game = gameInfo[id];
	if (!game) return;
	openModal(
		game.title,
		`
			<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
				<span class="tag">${escapeHtml(game.mechanic)} mechanic</span>
				<span class="tag time">${escapeHtml(game.format)}</span>
			</div>
			<div class="sb-title" style="margin-top: 0;">How it plays</div>
			<div style="font-size: 13.5px; color: var(--chalk-muted); line-height: 1.6;">${escapeHtml(game.howToPlay)}</div>
			<div class="sb-title">Scoring</div>
			<div style="font-size: 13.5px; color: var(--chalk-muted); line-height: 1.6;">${escapeHtml(game.scoring)}</div>
			<div class="sb-title">Customization</div>
			<div style="font-size: 13.5px; color: var(--chalk-muted); line-height: 1.6;">${escapeHtml(game.customization)}</div>
  		`,
	);
}