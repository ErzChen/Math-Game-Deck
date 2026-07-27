# Math Club Game Deck

A single-page, chalkboard-themed app for running math club/contest-prep game
sessions with a projector. Pick a game, keep score for however many teams
you've got, and go. No build step, no backend, just static files.

## Games

- **Contest Ladder**: solo climb through contest-style problems across four
  escalating tiers (Warm-up, Building, Push, Frontier). Each tier is worth
  more points.
- **Countdown Duel**: two teams face off on the same problem, first correct
  answer wins the round.
- **Chain Relay**: Contest-style relay. Every team solves the same 3-link chain
  at once, and each answer becomes `T`, plugged into the next, harder link.
- **Speed Relay Board**: Jeopardy-style 4x4 board of categories and point
  values, fully editable.
- **Elimination Gauntlet**: every team answers the same problem at once on
  whiteboards; miss it and you're out. Last team standing wins a bonus.
- **Estimation Auction**: no exact solving, just a best guess on the
  whiteboard. Closest team scores, an exact answer earns a bonus on top.
- **Hands-Up Steal**: one question, whole room. First hand up gets called
  on; miss it and it's open for anyone else to steal.
- **Speed Sprint**: one team, one 7-minute clock. Blast through as many
  problems as you can, self-paced, before time runs out.
- **Pyramid Race**: every team gets the same easy-to-hard pyramid and races
  through it at their own pace, all at once. First to clear it wins a bonus;
  everyone else still scores for how far up they got.
- **Streak Vault**: one team in the spotlight faces progressively harder
  problems, banking points after each correct answer or pushing their luck
  for a bigger prize, one miss while pushing wipes the unbanked total.
- **Swap Market**: every team holds a stash of swap tokens and secretly
  bids them on the one shared easier backup problem (worth the same
  points as the hard one) before the timer starts, highest bid wins it,
  everyone else is stuck with the hard problem.
- **All-In Wager**: teams secretly wager points on their own confidence
  against a running bank total, a correct wager adds to the bank, a wrong
  one subtracts.
- **Curse Card**: after answering correctly, a team draws a random curse
  and secretly saddles another team with it for their next round.
- **Scapegoat**: every team secretly nominates another team as their
  scapegoat each round; if the scapegoat gets the problem wrong, the
  nominating team steals half their current points.
- **Point Heist**: A shared vault sits center stage, correct answers 
  let you draw from it or raid whoever's winning outright.
- **Hot Potato**: a single potato holding a growing point value gets
  passed between teams. Answer right and pass it on to anyone else,
  but a hidden random (or host-triggered) cutoff can end the round any
  time, whoever's holding it then forfeits everything it's worth.
- **Bounty**: the current point leader is automatically marked each round.
  Answer first and choose to bank your own points or collect a cut
  straight from the Bounty team instead.
- **Sequence Detective**: a numeric sequence appears with the last term(s)
  hidden as "?". Teams have to work out the underlying pattern (geometric,
  Fibonacci-style, alternating, etc.) and guess what's missing, earning
  separate points for naming the rule and for guessing the hidden term(s).
- **Siege**: every correct answer forks between a permanent Fortress (score)
  and a spendable Army. Fortify to bank points, Reinforce to shield against
  the next attack, or Attack to raid another team's Fortress outright.
- **The Pool**: every team seals a prediction for the final standings before
  play starts, then answers ordinary math problems like any other quickfire
  game. Periodic checkpoints compare the live leaderboard against each
  sealed prediction and pay out for matches.

Each game has a "How to Play" button (rules) and a "Manage Questions" /
"Edit Board" button (content), plus a shared scoreboard bar and session
timer that persist across games.

## Running it

No build step, just serve the folder and open `index.html`:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` directly via
`file://` mostly works too, but a local server avoids script-loading
quirks in some browsers.

## Project structure

```
index.html                 markup for every screen (home + 20 games)
styles.css                 all styling (chalkboard theme, layout, components)
js/
  core.js                  app shell: nav, teams/scoreboard, session timer,
                            modal, save/export/import
  game-info.js              "how to play" text + the rules modal
  init.js                  boots the app, must load last

  engines/                 game logic (rendering, state, scoring per game)
    ladder-engine.js
    duel-engine.js
    chain-engine.js
    board-engine.js
    elimination-engine.js
    estimation-engine.js
    hands-up-engine.js
    sprint-engine.js
    pyramid-engine.js
    streak-engine.js
    swap-engine.js
    wager-engine.js
    curse-engine.js
    scapegoat-engine.js
    point-heist-engine.js
    hotpotato-engine.js
    bounty-engine.js
    sequence-engine.js
    siege-engine.js
    pool-engine.js
```

Each game is a data file plus an engine. The data file just exports a pool
of questions (or a blank board), and the engine reads that pool and wires
up the actual screen. Data files need to load before their engine, and
`init.js` needs to load last since it calls functions the other files
define.

## Data

- **Export/Import**: the "Manage" panel (bottom right, or press `S`) can
  export everything to a JSON file, or import one back in. Useful for
  moving a session between machines or keeping a backup.

## Notes

- Math in questions/answers/explanations can use `$...$` (inline) or
  `$$...$$` (display) LaTeX. [KaTeX](https://katex.org/) typesets it
  automatically wherever it's inserted.
- Everything is client-side. There's no server component and no analytics.
