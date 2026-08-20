const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("./math-engine.js");
const config = require("./math-config.js");

test("current math config is internally valid", () => {
  assert.deepEqual(engine.validateMathConfig(config), { valid: true, errors: [] });
});

test("weighted picks respect deterministic ticket boundaries", () => {
  const bands = [
    { label: "low", weight: 75 },
    { label: "high", weight: 25 }
  ];
  assert.equal(engine.pickWeighted(bands, () => 0.10).label, "low");
  assert.equal(engine.pickWeighted(bands, () => 0.90).label, "high");
});

test("integer ranges include both endpoints", () => {
  assert.equal(engine.integerRange({ min: 4, max: 8 }, 1, () => 0), 4);
  assert.equal(engine.integerRange({ min: 4, max: 8 }, 1, () => 0.999999), 8);
});

test("factor tickets scale from the effective median", () => {
  assert.deepEqual(
    engine.payoutTicketRange({ minFactor: 0.8, maxFactor: 1.2 }, { scale: 0.52, median: 10 }),
    { min: 8, median: 10, max: 12 }
  );
});

test("absolute bonus tickets use the global payout scale", () => {
  assert.deepEqual(
    engine.payoutTicketRange({ min: 300, max: 500 }, { scale: 0.54, median: 1 }),
    { min: 162, median: 216, max: 270 }
  );
});

test("chain multipliers clamp to the configured final tier", () => {
  const table = [1, 1.25, 1.5, 2];
  assert.equal(engine.orderChainMultiplier(table, 1), 1);
  assert.equal(engine.orderChainMultiplier(table, 3), 1.5);
  assert.equal(engine.orderChainMultiplier(table, 10), 2);
});

test("invalid payout ranges fail validation with a useful path", () => {
  const broken = {
    ...config,
    bonusConveyorPayoutTickets: config.bonusConveyorPayoutTickets.map((group, tier) => (
      tier === 0 ? [{ label: "Broken", weight: 100, min: 10, max: 2 }] : group
    ))
  };
  const result = engine.validateMathConfig(broken);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /bonusConveyorPayoutTickets\[0\]\[0\]\.max/);
});
