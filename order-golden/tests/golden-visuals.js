/* Separate fixture page only; never loaded by the playable game. */
(() => {
  const results = document.getElementById("test-results");
  const buttons = [...document.querySelectorAll("button")];
  const types = ["red", "blue", "green", "yellow", "purple"];
  let scene;
  let passed;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function pass(message) {
    passed += 1;
    results.textContent += `\nPASS ${message}`;
  }

  function checkOwnership() {
    const owned = new Set([...scene.allCandySprites].flatMap((sprite) => sprite.getChildren()));
    const displayed = scene.children.list.filter((child) => child.isBoardSymbol);
    assert(displayed.length === owned.size, `${displayed.length - owned.size} orphan board layers`);
    assert(displayed.every((child) => owned.has(child)), "Unowned board layer remains visible");
  }

  function checkAlignment() {
    for (let r = 0; r < scene.rows; r += 1) {
      for (let c = 0; c < 6; c += 1) {
        const tile = scene.board[r][c];
        const children = scene.sprites[r][c].getChildren();
        const goldLayers = children.filter((child) => child.isGoldenLayer);
        assert(goldLayers.length === (tile.golden ? 3 : 0), "Gold layers do not match tile state");
        for (const child of children) {
          const isStar = child.type === "Star";
          const x = scene.cellX(c) + (isStar ? scene.cell * 0.28 : 0);
          const y = scene.cellY(r) - (isStar ? scene.cell * 0.27 : 0);
          assert(Math.abs(child.x - x) < 0.01 && Math.abs(child.y - y) < 0.01, `Misaligned ${child.type} at ${r},${c}`);
          if (child.type === "Image") {
            assert(child.texture.key === scene.symbolKey(tile), "Gold contour uses a different candy shape");
          }
        }
      }
    }
    checkOwnership();
  }

  function fixture(rows = 6) {
    scene.clearSprites();
    scene.configureBoard(rows);
    scene.createBoardFrame();
    scene.board = Array.from({ length: rows }, (_, r) => Array.from({ length: 6 }, (_, c) => ({
      type: types[(r * 2 + c) % types.length], special: null, golden: r === 0 && c < 5
    })));
    scene.renderBoard(true);
    scene.inputOpen = false;
    checkAlignment();
  }

  async function run() {
    buttons.forEach((button) => { button.disabled = true; });
    results.textContent = "TEST FIXTURE ONLY - running real Phaser checks";
    passed = 0;
    try {
      fixture();
      for (let cycle = 0; cycle < 50; cycle += 1) {
        for (const type of types) {
          for (const golden of [false, true]) {
            const sprite = scene.createCandySprite({ type, golden }, 0, 0, true);
            const children = [...sprite.getChildren()];
            scene.destroyCandySprite(sprite);
            assert(children.every((child) => !child.scene), "A destroyed candy still owns live layers");
            assert(children.every((child) => scene.tweens.getTweensOf(child).length === 0), "Destroyed layer keeps a tween");
            checkOwnership();
          }
        }
      }
      pass("500 normal/golden removals: zero orphan layers or tweens");

      for (const rows of [6, 9]) {
        fixture(rows);
        for (let c = 0; c < 5; c += 1) {
          [scene.board[0][c], scene.board[1][c]] = [scene.board[1][c], scene.board[0][c]];
          [scene.sprites[0][c], scene.sprites[1][c]] = [scene.sprites[1][c], scene.sprites[0][c]];
          scene.moveSpriteTo(scene.sprites[0][c], 0, c, 80);
          scene.moveSpriteTo(scene.sprites[1][c], 1, c, 80);
        }
        await scene.wait(120);
        checkAlignment();
        for (let c = 0; c < 6; c += 1) {
          scene.destroyCandySprite(scene.sprites[rows - 1][c]);
          scene.sprites[rows - 1][c] = null;
          scene.board[rows - 1][c] = null;
        }
        await scene.collapseAndFill();
        checkAlignment();
        pass(`${rows}-row swaps and drops: all five contours stay aligned`);

        const oldLayers = scene.sprites[2].slice(0, 5).flatMap((sprite) => sprite.getChildren());
        const originalRoll = scene.rollGoldenReveal;
        scene.rollGoldenReveal = () => ({ special: "bomb", label: "TEST BOMB" });
        try {
          await scene.removePositions(new Set(["2,0", "2,1", "2,2", "2,3", "2,4"]), []);
        } finally {
          scene.rollGoldenReveal = originalRoll;
        }
        assert(oldLayers.every((child) => !child.scene), "Shell reveal leaves old contour or glow behind");
        checkAlignment();
        pass(`${rows}-row simultaneous shell reveals: old layers fully removed`);
      }

      fixture();
      await scene.spawnGoldenCandies(7);
      await scene.wait(300);
      checkAlignment();
      const glows = [...scene.allCandySprites].flatMap((sprite) => sprite.getChildren()).filter((child) => child.goldenPulseTween);
      assert(glows.every((glow) => glow.alpha >= 0.15 && glow.alpha <= 0.39), "Glow fade overrides resting opacity");
      assert(glows.every((glow) => !glow.goldenPulseTween.isPaused()), "Glow pulse did not resume");
      pass("Spawn fade and glow pulse: opacity stays in the intended range");

      fixture();
      const pendingSpawn = scene.spawnGoldenCandies(7);
      const pulseLayers = [...scene.allCandySprites].flatMap((sprite) => sprite.getChildren());
      scene.clearSprites();
      await pendingSpawn;
      await scene.wait(900);
      assert(pulseLayers.every((child) => !child.scene), "Cleared glow was revived by a delayed tween");
      checkOwnership();
      pass("Reset during spawn: no delayed ghost layers");
      fixture();
      results.textContent += `\n${passed}/${passed} checks passed. Fixed outcomes are fixture-only.`;
      document.documentElement.dataset.testResult = "passed";
    } catch (error) {
      results.textContent += `\nFAIL: ${error.message}`;
      document.documentElement.dataset.testResult = "failed";
      console.error(error);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  document.getElementById("test-run").addEventListener("click", run);
  document.getElementById("test-main").addEventListener("click", () => fixture(6));
  document.getElementById("test-bonus").addEventListener("click", () => fixture(9));
  window.addEventListener("load", () => {
    const deadline = performance.now() + 30000;
    const ready = setInterval(() => {
      scene = window.candyGame?.scene.getScene("CandyOrdersScene");
      if (scene?.sys.isActive() && scene.orderRows) {
        clearInterval(ready);
        scene.startSession();
        run();
      } else if (performance.now() > deadline) {
        clearInterval(ready);
        results.textContent = "FAIL: game scene did not load";
      }
    }, 50);
  });
})();
