(function exposeCandyMathEngine(root, factory) {
  const engine = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  if (root) root.CANDY_MATH_ENGINE = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCandyMathEngine() {
  "use strict";

  function numberOr(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function pickWeighted(items, random = Math.random, weightKey = "weight") {
    if (!Array.isArray(items) || !items.length) return null;
    const total = items.reduce((sum, item) => sum + Math.max(0, numberOr(item?.[weightKey], 0)), 0);
    if (!(total > 0)) return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
    let roll = random() * total;
    for (const item of items) {
      roll -= Math.max(0, numberOr(item?.[weightKey], 0));
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  function integerBetween(minValue, maxValue, random = Math.random) {
    const min = Math.round(numberOr(minValue, 0));
    const max = Math.max(min, Math.round(numberOr(maxValue, min)));
    return min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
  }

  function integerRange(ticket, fallback = 1, random = Math.random) {
    const min = Math.max(0, Math.round(numberOr(ticket?.min, fallback)));
    const max = Math.max(min, Math.round(numberOr(ticket?.max, min)));
    return integerBetween(min, max, random);
  }

  function floatBetween(minValue, maxValue, random = Math.random) {
    const min = numberOr(minValue, 0);
    const max = Math.max(min, numberOr(maxValue, min));
    return min + random() * (max - min);
  }

  function scaledMultiplier(multiplier, scale) {
    return Math.max(1, Math.round(numberOr(multiplier, 1) * numberOr(scale, 1)));
  }

  function payoutTicketRange(ticket, options = {}) {
    if (!ticket) return null;
    const scale = numberOr(options.scale, 1);
    const median = Math.max(1, numberOr(options.median, 1));
    const minBase = ticket.minFactor === undefined
      ? numberOr(ticket.min, 1) * scale
      : median * numberOr(ticket.minFactor, 1);
    const maxBase = ticket.maxFactor === undefined
      ? numberOr(ticket.max ?? ticket.min, 1) * scale
      : median * numberOr(ticket.maxFactor ?? ticket.minFactor, 1);
    const min = Math.max(1, Math.round(minBase));
    const max = Math.max(min, Math.round(maxBase));
    return { min, median: Math.round((min + max) / 2), max };
  }

  function orderChainMultiplier(table, completedCount) {
    if (!Array.isArray(table) || !table.length) return 1;
    const index = Math.min(table.length - 1, Math.max(0, Math.max(1, completedCount) - 1));
    return Math.max(1, numberOr(table[index], 1));
  }

  function roundMultiplier(value) {
    return Number(Math.max(0, numberOr(value, 0)).toFixed(2));
  }

  function assertMathConfig(config) {
    const requiredPositive = ["startingWallet", "defaultBet", "mainPayoutScale", "freePayoutScale"];
    const errors = requiredPositive.filter((key) => !(Number(config?.[key]) > 0)).map((key) => `${key} must be positive`);
    if (!Array.isArray(config?.mainOrderPools) || config.mainOrderPools.length !== 3) errors.push("mainOrderPools must contain three tiers");
    if (!Array.isArray(config?.freeOrderPools) || config.freeOrderPools.length !== 3) errors.push("freeOrderPools must contain three tiers");
    if (errors.length) throw new Error(`Invalid candy math config:\n- ${errors.join("\n- ")}`);
    return config;
  }

  return Object.freeze({
    assertMathConfig,
    floatBetween,
    integerBetween,
    integerRange,
    orderChainMultiplier,
    payoutTicketRange,
    pickWeighted,
    roundMultiplier,
    scaledMultiplier
  });
});
