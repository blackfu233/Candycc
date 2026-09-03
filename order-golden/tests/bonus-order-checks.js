/* Controlled regression fixtures only; not loaded by the playable entry. */
(function exposeChecks(root, factory) {
  const run = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = run;
  else root.runBonusOrderChecks = run;
})(typeof globalThis !== "undefined" ? globalThis : this, function createChecks() {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const snapshot = (value) => JSON.stringify(value);
  function advance(scene, order, amount) {
    if (order.kind === "any") scene.freeRemoved += amount;
    else if (order.kind === "color") scene.freeRemovedByColor[order.type] += amount;
    else if (order.kind === "cascade") scene.freeCascadeCount += amount;
    else if (order.kind === "chocolate") scene.freeChocolatesCreated += amount;
    else if (order.kind === "combo") scene.freeComboCounts[order.comboType] += amount;
    else throw new Error(`Unknown order kind ${order.kind}`);
  }
  function readyOrders(scene, needs = [1, 2, 1000000]) {
    return scene.orders.map((order, index) => ({ ...order, kind: "any", start: scene.freeRemoved,
      need: needs[index], completed: false, gold: false, discounted: false,
      payoutTicket: { min: (index + 1) * 10, max: (index + 1) * 10 } }));
  }
  function newOrder(scene, order, previous) {
    assert(order !== previous, `${previous.tier} was not replaced`);
    assert(order.tier === previous.tier && order.scope === "free", "Replacement tier/scope changed");
    assert(!order.completed && !order.gold && !order.discounted, "Replacement inherited completed/gold/discount state");
    assert(order.start === scene.rawOrderProgress(order) && scene.orderProgress(order) === 0, "Replacement inherited old progress");
    assert(order.payoutTicket !== previous.payoutTicket, "Replacement reused the old payout ticket object");
  }
  return async function runBonusOrderChecks(scene, config, pass = () => {}) {
    assert(config.freeOrdersRefreshOnComplete === true, "Published Bonus completion refresh is disabled");
    pass("Published Bonus completion refresh is enabled");
    scene.setAutoPlayEnabled(false, false);
    scene.startSession();
    const mainOrders = snapshot(scene.orders);
    const paidBefore = scene.paidBetTotal;
    await scene.startFreeGame();
    scene.inputOpen = false;
    scene.orders = readyOrders(scene);
    scene.orders[0].gold = true;
    scene.orders[0].goldMult = 1.5;
    scene.orders[0].discounted = true;
    const previous = [...scene.orders];
    const walletBefore = scene.wallet, sessionBefore = scene.sessionReward;
    const movesBefore = scene.freeMovesLeft;
    scene.freeRemoved += 5;
    const award = scene.fulfillCompletedOrders();
    assert(award === 35 * scene.betAmount, "Simultaneous orders did not receive separate awards");
    assert(scene.moveCompletions.length === 2 && scene.freeOrdersCompleted === 2, "Wrong completion count");
    assert(scene.moveCompletions[0].order === previous[0] && scene.moveCompletions[1].order === previous[1], "Reward presentation lost completed-order ownership");
    newOrder(scene, scene.orders[0], previous[0]);
    newOrder(scene, scene.orders[1], previous[1]);
    assert(scene.orders[2] === previous[2] && scene.orderProgress(scene.orders[2]) === 5, "Unfinished order was reset");
    assert(scene.freeMovesLeft === movesBefore && scene.paidBetTotal === paidBefore, "Refreshing consumed a move or bet");
    assert(scene.wallet === walletBefore + award && scene.sessionReward === sessionBefore + award && scene.freeReward === award, "Award ledger mismatch");
    scene.updateOrders();
    for (const index of [0, 1]) if (typeof scene.orderRows[index].reward.text === "string") {
      assert(scene.orderRows[index].reward.text !== "DONE", "Refreshed order still displays DONE");
      assert(scene.orderRows[index].progress.text.startsWith("0/"), "Refreshed order progress is not visibly zero");
    }
    pass("Two completions refresh independently; fresh progress/tickets, untouched unfinished order and correct UI");
    assert(scene.fulfillCompletedOrders() === 0 && scene.wallet === walletBefore + award, "Repeated settlement paid twice");
    pass("Repeated settlement without new progress cannot pay again");

    scene.moveReward = 0;
    scene.moveCompletions = [];
    const second = scene.orders[0], secondWallet = scene.wallet;
    advance(scene, second, second.need);
    const secondAward = scene.fulfillCompletedOrders();
    assert(secondAward > 0 && scene.wallet === secondWallet + secondAward, "Replacement cannot complete on new progress");
    newOrder(scene, scene.orders[0], second);
    assert(scene.fulfillCompletedOrders() === 0, "Replacement re-paid without new progress");
    pass("Replacement order can complete and refresh again");

    const activeOrders = [...scene.orders], activeProgress = scene.orders.map((order) => scene.orderProgress(order));
    const movesAtRetrigger = scene.freeMovesLeft, walletAtRetrigger = scene.wallet;
    scene.clearSprites();
    for (let c = 0; c < scene.scatterGoal; c++) scene.board[0][c] = { type: "scatter", scatter: true, special: null };
    scene.renderBoard(true);
    assert(await scene.collectBonusScatterRetrigger(), "Retrigger did not collect the scatters");
    assert(scene.freeMovesLeft === movesAtRetrigger + config.bonusRetriggerMoves, "Retrigger move count mismatch");
    assert(scene.orders.every((order, i) => order === activeOrders[i] && scene.orderProgress(order) === activeProgress[i]), "Retrigger wiped active orders");
    assert(scene.wallet === walletAtRetrigger && scene.paidBetTotal === paidBefore, "Retrigger unexpectedly moved money");
    pass("Retrigger adds free moves without resetting active orders or their progress");

    scene.orders = readyOrders(scene, [1, 1, 1]);
    scene.freeRemoved += 1;
    scene.moveReward = 0;
    scene.moveCompletions = [];
    scene.freeMoveHadEvent = true;
    scene.freeMovesLeft = 0;
    const lastWallet = scene.wallet;
    await scene.finishFreeMove();
    assert(scene.gameMode === "main" && snapshot(scene.orders) === mainOrders, "Final free move did not restore main orders");
    assert(scene.wallet === lastWallet + 60 * scene.betAmount, "Final free move payout missing or credited twice");
    assert(scene.paidBetTotal === paidBefore, "Final free move charged a bet");
    pass("Last free move pays all completed orders once, then returns to the preserved main orders");

    await scene.startFreeGame();
    scene.inputOpen = false;
    const cap = config.maxBonusWinMult * scene.betAmount, capStartWallet = scene.wallet;
    scene.freeReward = cap - 2 * scene.betAmount;
    scene.wallet += scene.freeReward;
    scene.sessionReward += scene.freeReward;
    scene.orders = readyOrders(scene, [1, 1, 1]);
    scene.freeRemoved += 1;
    scene.moveReward = 0;
    scene.moveCompletions = [];
    scene.freeMoveHadEvent = true;
    await scene.finishFreeMove();
    assert(scene.freeReward === cap && scene.wallet === capStartWallet + cap, "Bonus cap or final wallet settlement failed");
    assert(scene.gameMode === "main" && snapshot(scene.orders) === mainOrders, "Capped Bonus did not finish cleanly");
    assert(scene.paidBetTotal === paidBefore, "Capped Bonus charged a bet");
    assert(scene.wallet === config.startingWallet - scene.paidBetTotal + scene.sessionReward, "Final bankroll does not reconcile");
    pass("Multiple completions respect the shared Bonus cap and end without duplicate credit");
  };
});
