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
- **Speed Sprint**: one team, one 3-minute clock. Blast through as many
  problems as you can, self-paced, before time runs out.

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
index.html                 markup for every screen (home + 8 games)
styles.css                 all styling (chalkboard theme, layout, components)
js/
  core.js                  app shell: nav, teams/scoreboard, session timer,
                            modal, save/export/import
  game-info.js              "how to play" text + the rules modal
  init.js                  boots the app, must load last

  games/                   game data (built-in question pools)
    ladder-contest.js
    duel-mixed.js
    chain-classics.js
    board-contest-categories.js
    elimination-classics.js
    estimation-mixed.js
    handsup-mixed.js
    sprint-quickfire.js

  engines/                 game logic (rendering, state, scoring per game)
    ladder-engine.js
    duel-engine.js
    chain-engine.js
    board-engine.js
    elimination-engine.js
    estimation-engine.js
    handsup-engine.js
    sprint-engine.js
```

Each game is a data file plus an engine. The data file just exports a pool
of questions (or a blank board), and the engine reads that pool and wires
up the actual screen. Data files need to load before their engine, and
`init.js` needs to load last since it calls functions the other files
define.

## Adding a new game

If your game fits an existing engine's shape (another ladder with a
different question set, say):

1. Copy one of the `games/*.js` files, rename the export, fill in your
   questions.
2. Point a new home-screen tile and `<section class="screen">` in
   `index.html` at the existing engine's functions.

For a genuinely new game mechanic, add a new engine under `js/engines/`
plus a matching data file, then:

1. Add a tile to the home screen's `arcade-grid` in `index.html`.
2. Add a `<section class="screen" id="screen-yourgame">` with your markup.
3. Add an entry to `gameInfo` in `game-info.js` (title, mechanic, format,
   how to play, scoring, customization) and a "How to Play" button calling
   `openGameInfoModal('yourgame')`.
4. Load your data file before your engine, and your engine before `init.js`.

## Data & persistence

- **Autosave**: teams, every game's custom questions/chains, the board,
  and session length are saved to `localStorage` after most edits and
  reloaded on startup (`tryAutoload()` in `core.js`).
- **Export/Import**: the "Manage" panel (bottom right, or press `S`) can
  export everything to a JSON file, or import one back in. Useful for
  moving a session between machines or keeping a backup.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `H` | Go home |
| `1` | Contest Ladder |
| `2` | Countdown Duel |
| `3` | Chain Relay |
| `4` | Speed Relay Board |
| `5` | Elimination Gauntlet |
| `6` | Estimation Auction |
| `7` | Hands-Up Steal |
| `8` | Speed Sprint |
| `S` | Open Manage (teams/session) |

Shortcuts are ignored while typing in an input or textarea.

## Notes

- Math in questions/answers/explanations can use `$...$` (inline) or
  `$$...$$` (display) LaTeX. [KaTeX](https://katex.org/) typesets it
  automatically wherever it's inserted.
- Everything is client-side. There's no server component and no analytics.