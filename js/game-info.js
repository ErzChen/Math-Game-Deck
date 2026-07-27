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
			'A Jeopardy-style 4×4 grid: 4 categories × 4 point values ($100–$400). Any team/host clicks an unused cell to reveal its question; once answered and scored, the cell is marked used and can\'t reopen. "Reset Board" clears all used marks.',
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
			'Every team works the same problem at once on whiteboards. After "Reveal Answer", the host marks each team Survived or Out. A round where every remaining team would be marked wrong doesn\'t eliminate anyone, at least one team always survives to keep the gauntlet moving. Play continues, round after round, until one team is left.',
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
			'One question is shown to the whole room. Teams work it on whiteboards and raise a hand when ready; the host calls on whoever raised first and marks them Correct or Wrong. A wrong answer keeps the question live, any other team can raise a hand and steal it. Once someone answers correctly (or everyone has had a turn), "Next Problem" moves on.',
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
		mechanic: 'Auction',
		format: 'All teams, simultaneous',
		howToPlay:
			"Every team starts with a stash of 10 swap tokens. When a hard problem is revealed, there's only one easier backup problem up for grabs, worth exactly the same points, teams secretly bid however many tokens they're willing to spend on it before the timer starts. The highest bidder wins the backup and answers that instead; every other team is stuck with the harder problem, whether they wanted to swap or not. Ties for the high bid are broken at random. Unlike All-In Wager, which bets points on confidence in the same problem, this is a real market: only one team can buy their way to an easier problem for free, so it pays to guess what the rest of the room is willing to spend.",
		scoring:
			"Both the hard problem and the backup are worth 3 pts, winning the auction only makes the problem easier, it doesn't cost points. The winning bid is spent whether or not the backup is answered correctly, everyone else keeps their tokens for the next round.",
		customization:
			'"Manage Problem Pairs" adds a hard problem paired with its easier backup, so every round has a backup up for auction.',
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
	curse: {
		title: 'Curse Card: How to Play',
		mechanic: 'Prank Assignment',
		format: 'Whole-group, first-to-answer',
		howToPlay:
			"After answering correctly, a team draws a random curse card and secretly assigns it to any other team (never themselves) to take effect on that team's very next round: Silence (no talking to teammates while solving), One-Handed (only one player may write), Blindfold (can't look at the screen, must be read the problem aloud), Non-Dominant Hand (team must use their non-dominant hand to write), or 25% off (time limit is decreased by 25%). The curse is revealed to the room only once it's activated.",
		scoring:
			'1 pt for a correct answer as normal. Successfully surviving a round while cursed (still answering correctly) earns the cursed team a 1 pt bonus for pulling it off.',
		customization:
			'"Manage Questions" adds problems to the shared pool; "Manage Curses" lets the host edit the list of curse effects and add new ones.',
	},
	scapegoat: {
		title: 'Scapegoat: How to Play',
		mechanic: 'Secret Nomination',
		format: 'All teams, simultaneous',
		howToPlay:
			'Before each round, every team secretly nominates one other team as their "scapegoat" for that round, hidden from everyone including the scapegoat itself. The problem is then revealed and answered as normal. If a team\'s scapegoat gets the problem wrong, they steal half of that team\'s current points; if the scapegoat gets it right, nothing happens.',
		scoring:
			"A correct answer earns the base value normally. A team whose scapegoat missed the problem gains half of the scapegoat's current point total, taken directly from them.",
		customization:
			'"Manage Questions" adds problems to the shared first-to-answer pool; nomination happens live in-app and doesn\'t require question-specific setup.',
	},
	pointheist: {
		title: 'Point Heist: How to Play',
		mechanic: 'Vault Or Raid',
		format: 'All teams, simultaneous',
		howToPlay:
			"A shared point vault sits on screen instead of points coming from problems directly. On a correct answer, a team chooses to either pull a chunk from the shared vault or raid another team's existing score outright, host toggles which options are available each round. Teams have to weigh building up the communal pot versus directly robbing whoever's currently winning.",
		scoring:
			"Vault pulls are a fixed amount (e.g. 2 pts) drawn down from the shared total. Raids transfer a fixed amount (e.g. 2 pts) directly from the target team's score to the raider's.",
		customization:
			'"Manage Questions" adds problems to the shared pool; vault starting amount and raid/pull values are set per session.',
	},
	hotpotato: {
		title: 'Hot Potato: How to Play',
		mechanic: 'Shared Danger',
		format: 'Whole-group, first-to-answer',
		howToPlay:
			'A single "potato" holding a growing point value is passed between teams on top of normal scoring. Correctly answering a problem earns the team a point and lets them pass the potato to any other team of their choice, it never stays with the solver. A hidden random cutoff always ends the round at some point within a host-set window; whichever team is holding the potato when it stops loses everything banked on it.',
		scoring:
			"A correct answer is worth 1 pt outright, whether or not the round has ended. On top of that, the potato's value increases by 1 pt each time it's successfully passed, and whoever is holding it when the round cuts off forfeits that entire accumulated value.",
		customization:
			'"Manage Questions" adds problems to the shared pool; the auto-cutoff\'s minimum and maximum seconds are set live in-app so the host controls how tense the window gets.',
	},
	bounty: {
		title: 'Bounty: How to Play',
		mechanic: 'Marked Target',
		format: 'Whole-group, first-to-answer',
		howToPlay:
			'At the start of each round, the team with the highest current point total is automatically marked as the "Bounty" — visible to everyone on screen (if multiple teams are tied for the lead, one is chosen at random). Any other team that answers a problem correctly can choose to either bank the points themselves or collect the bounty, pulling a cut directly from the marked team. The Bounty team can still answer normally to defend its own points, but cannot collect on itself. The Bounty target re-evaluates and re-marks at the start of every round based on the current leaderboard.',
		scoring:
			"A normal correct answer earns the base point value as usual. Collecting the bounty transfers 25% of the marked team's current points (rounded down) to the collector's score, deducted immediately from the Bounty team.",
		customization:
			'"Manage Questions" adds problems to the shared pool; "Manage Bounty" lets the host adjust the percentage taken and toggle whether ties for the lead are broken randomly or all tied leaders are marked simultaneously.',
	},
	sequencedetective: {
		title: 'Sequence Detective: How to Play',
		mechanic: 'Pattern ID',
		format: 'All teams, simultaneous',
		howToPlay:
			'Teams see a sequence of numbers with the last one or two terms hidden as "?" (e.g. 2, 6, 18, 54, ?). On their whiteboards, they have to work out both the underlying rule — geometric, Fibonacci-style, alternating, etc. — and what the hidden term(s) should be, within the timer. "Reveal Answer" shows the named pattern and the correct missing term(s).',
		scoring:
			'Two independent 1 pt awards per team: one for correctly naming/describing the pattern, one for correctly guessing the hidden term(s). A team can earn either, both, or neither.',
		customization:
			'"Manage Sequences" adds a full sequence (comma-separated, including the terms to hide), a name for the pattern, and how many trailing terms to hide.',
	},
	siege: {
		title: 'Siege: How to Play',
		mechanic: 'Attack/Defend',
		format: 'All teams, simultaneous',
		howToPlay:
			"Every team tracks two numbers: a Fortress (their real score, shown on the leaderboard) and an Army (a spendable resource earned from correct answers, kept separate). After each correct answer, a team privately chooses one of three moves for that round's payout: Fortify converts it straight into permanent Fortress points; Reinforce holds it as Army but reduces damage taken from the next incoming attack; Attack spends banked Army to assault another team's Fortress, succeeding on a correct answer to that round's problem and failing (losing the spent Army for nothing) on a miss. The host reveals everyone's choice and resolves attacks after each round, so early turtling is safe but exposes a team to bigger raids later, and early aggression scores fast but leaves a thin Fortress to defend.",
		scoring:
			"Fortify adds the round's full point value straight to a team's score. A successful Attack transfers a chunk of points from the target's Fortress to the attacker's; Reinforce scores nothing that round but blunts the next attack against that team. A team's displayed score is always just their Fortress total.",
		customization:
			'"Manage Questions" adds problems to the shared pool; "Manage Siege Rules" sets the Army-to-points conversion rate, attack transfer amount, and how much Reinforce reduces incoming damage.',
	},
	pool: {
		title: 'The Pool: How to Play',
		mechanic: 'Forecasting',
		format: 'All teams, simultaneous',
		howToPlay:
			"At the very start of the session, every team privately writes down their prediction for the final standings, ranking all teams from 1st to last (sealed however the room can manage — turn away, cover the screen, etc.). From there Pool plays like any other quickfire game: the host reveals a math problem, the whole room answers on whiteboards, and correct teams earn the usual point. Every so often, the host pauses for a Checkpoint: current standings are compared against each team's sealed prediction, and any team whose call matches a team's current position (partially or fully) earns a bonus, even for teams whose prediction isn't about themselves.",
		scoring:
			'A correct answer on a Pool problem earns 1 pt as usual. At each Checkpoint, a team earns points for every position in the current standings that exactly matches their sealed prediction, plus a one-time bonus at the final Checkpoint if their entire predicted order matches exactly.',
		customization:
			'"Manage Questions" adds math problems to Pool\'s own shared pool. "Pool Settings" sets the points-per-match and final-match bonus; each team\'s sealed prediction is set directly at the bottom of the Pool screen instead of a separate modal.',
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
