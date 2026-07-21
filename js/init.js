// Must load last — calls functions defined in core.js, the engines, and
// the game data files.
tryAutoload();
renderTeamsList();
renderAwardButtons();
renderSession();
resetLadder();
duelPool = getDuelPool();
populateDuelTeamSelectors();
renderDuelProblem();
renderDuelAwardButtons();
shuffleChainPool();
newChain();
renderChainAwardButtons();
renderRelayGrid();
