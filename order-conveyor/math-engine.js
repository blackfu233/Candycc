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
    const total = items.reduce(
      (sum, item) => sum + Math.max(0, numberOr(item?.[weightKey], 0)),
      0
    );
    if (!(total > 0)) {
      const index = Math.min(items.length - 1, Math.floor(random() * items.length));
      return items[index];
    }

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

  function validateRange(errors, value, path, minKey = "min", maxKey = "max") {
    if (!value || typeof value !== "object") {
      errors.push(`${path} must be an object`);
      return;
    }
    const min = Number(value[minKey]);
    const max = Number(value[maxKey] ?? value[minKey]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      errors.push(`${path} must contain numeric ${minKey}/${maxKey}`);
    } else if (max < min) {
      errors.push(`${path}.${maxKey} must be greater than or equal to ${minKey}`);
    }
  }

  function validateWeightedBands(errors, bands, path, rangeKeys) {
    if (!Array.isArray(bands) || !bands.length) {
      errors.push(`${path} must be a non-empty array`);
      return;
    }
    let total = 0;
    bands.forEach((band, index) => {
      const weight = Number(band?.weight);
      if (!Number.isFinite(weight) || weight < 0) {
        errors.push(`${path}[${index}].weight must be a non-negative number`);
      } else {
        total += weight;
      }
      if (rangeKeys) validateRange(errors, band, `${path}[${index}]`, rangeKeys[0], rangeKeys[1]);
    });
    if (!(total > 0)) errors.push(`${path} must have a positive total weight`);
  }

  function validateMathConfig(config) {
    const errors = [];
    if (!config || typeof config !== "object") return { valid: false, errors: ["config must be an object"] };

    ["startingWallet", "defaultBet", "betStep", "minBet", "maxBet", "mainPayoutScale", "freePayoutScale"].forEach((key) => {
      if (!Number.isFinite(Number(config[key])) || Number(config[key]) <= 0) {
        errors.push(`${key} must be a positive number`);
      }
    });
    if (Number(config.minBet) > Number(config.defaultBet) || Number(config.defaultBet) > Number(config.maxBet)) {
      errors.push("defaultBet must be between minBet and maxBet");
    }

    ["mainOrderChainMultipliers", "bonusOrderChainMultipliers"].forEach((key) => {
      const table = config[key];
      if (!Array.isArray(table) || !table.length || table.some((value) => !(Number(value) >= 1))) {
        errors.push(`${key} must contain multipliers greater than or equal to 1`);
      }
    });

    ["mainScatterIntervalBands", "freeScatterIntervalBands", "mainOrderNeedBands", "bonusSpecialCountBands", "bonusDiscountBands", "bonusGoldMultiplierBands"].forEach((key) => {
      validateWeightedBands(errors, config[key], key, ["min", "max"]);
    });
    validateWeightedBands(errors, config.conveyorTierTickets, "conveyorTierTickets");
    validateWeightedBands(errors, config.mainEasyOrderPayoutBands, "mainEasyOrderPayoutBands", ["min", "max"]);
    validateWeightedBands(errors, config.freeOrderPayoutBands, "freeOrderPayoutBands", ["minPosition", "maxPosition"]);

    ["conveyorMainPayoutTickets", "bonusConveyorPayoutTickets", "freeOrderPayoutTickets"].forEach((key) => {
      const groups = config[key];
      if (!Array.isArray(groups) || groups.length !== 3) {
        errors.push(`${key} must contain Easy, Medium, and Hard groups`);
        return;
      }
      groups.forEach((bands, tier) => {
        const factorRange = bands?.some((band) => band?.minFactor !== undefined || band?.maxFactor !== undefined);
        validateWeightedBands(errors, bands, `${key}[${tier}]`, factorRange ? ["minFactor", "maxFactor"] : ["min", "max"]);
      });
    });

    return { valid: errors.length === 0, errors };
  }

  function assertMathConfig(config) {
    const result = validateMathConfig(config);
    if (!result.valid) throw new Error(`Invalid candy math config:\n- ${result.errors.join("\n- ")}`);
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
    scaledMultiplier,
    validateMathConfig
  });
});
