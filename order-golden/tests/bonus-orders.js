/* Separate fixture page only. Controlled completions are not RTP evidence. */
(() => {
  const results = document.getElementById("test-results");
  const buttons = [...document.querySelectorAll("button")];
  let scene;
  async function run() {
    buttons.forEach((button) => { button.disabled = true; });
    results.textContent = "TEST FIXTURE ONLY - real Phaser, controlled completions";
    let count = 0;
    try {
      await window.runBonusOrderChecks(scene, window.CANDY_MATH_CONFIG, (message) => {
        count++;
        results.textContent += `\nPASS ${message}`;
      });
      document.documentElement.dataset.testResult = "passed";
      results.textContent += `\n${count}/${count} checks passed. No scripted outcomes are used in normal play.`;
    } catch (error) {
      document.documentElement.dataset.testResult = "failed";
      results.textContent += `\nFAIL ${error.message}`;
      console.error(error);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }
  async function preview() {
    buttons.forEach((button) => { button.disabled = true; });
    try {
      scene.setAutoPlayEnabled(false, false);
      scene.startSession();
      await scene.startFreeGame();
      scene.inputOpen = false;
      const before = scene.orders[0];
      before.need = 1;
      scene.freeRemoved += 1;
      scene.fulfillCompletedOrders();
      await scene.wait(1000);
      scene.updateOrders();
      const after = scene.orders[0];
      if (before === after || scene.orderProgress(after) !== 0) throw new Error("Preview did not refresh");
      results.textContent = `TEST FIXTURE ONLY\nEasy order paid and replaced: ${scene.orderProgress(after)}/${after.need}\nMedium and Hard are unchanged. Refresh cost no bet or move.`;
    } catch (error) {
      results.textContent += `\nFAIL ${error.message}`;
      console.error(error);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }
  document.getElementById("test-run").addEventListener("click", run);
  document.getElementById("test-preview").addEventListener("click", preview);
  window.addEventListener("load", () => {
    const deadline = performance.now() + 30000;
    const ready = setInterval(() => {
      scene = window.candyGame?.scene.getScene("CandyOrdersScene");
      if (scene?.sys.isActive() && scene.orderRows) {
        clearInterval(ready);
        run();
      } else if (performance.now() > deadline) {
        clearInterval(ready);
        results.textContent = "FAIL: game scene did not load";
      }
    }, 50);
  });
})();
