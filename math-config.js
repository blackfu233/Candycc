(function exposeCandyMathConfig(root, factory) {
  const config = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = config;
  if (root) root.CANDY_MATH_CONFIG = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCandyMathConfig() {
  return Object.freeze({
    startingWallet: 1000,
    defaultBet: 10,
    betStep: 10,
    minBet: 10,
    maxBet: 500,
    targetWallet: 2000,
    scatterGoal: 3,
    mainScatterPerMoveRate: 0.003,
    mainScatterIntervalBands: [
      { label: "Quick", weight: 15, min: 20, max: 80 },
      { label: "Normal", weight: 35, min: 81, max: 220 },
      { label: "Slow", weight: 35, min: 221, max: 480 },
      { label: "Long tail", weight: 15, min: 481, max: 900 }
    ],
    mainSpecialDropPerMoveRate: 0.00,
    refillMatchSuppressionMinRate: 0.05,
    refillMatchSuppressionMaxRate: 0.95,
    freeRefillMatchSuppressionMaxRate: 1.00,
    refillMatchAssistMaxRate: 1.00,
    freeRefillMatchAssistMaxRate: 0.35,
    refillMatchAssistMaxPerMove: 1,
    freeRefillMatchAssistMaxPerMove: 2,
    refillEfficiencyFloor: 5.20,
    refillEfficiencyCeiling: 6.05,
    freeScatterPerMoveRate: 0.04,
    freeScatterIntervalBands: [
      { label: "Quick", weight: 25, min: 4, max: 12 },
      { label: "Normal", weight: 50, min: 13, max: 30 },
      { label: "Slow", weight: 20, min: 31, max: 55 },
      { label: "Long tail", weight: 5, min: 56, max: 90 }
    ],
    bonusStartMoves: 15,
    bonusRetriggerMoves: 15,
    bonusBuyCostMult: 100,
    mainPayoutScale: 0.73,
    freePayoutScale: 1.12,
    orderMultiplierSpread: 0.50,
    mainOrderMultiplierSpread: 0.75,
    freeOrderMultiplierSpread: 0.50,
    maxBonusRetriggers: 4,
    maxBonusWinMult: 1000,
    mainEasyOrderMaxMult: 11,
    autoMoveDelayMs: 520,
    autoStrategyWeights: {
      random: 0.70,
      special: 0.17,
      order: 0.13
    },
    mainOrderNeedBands: [
      { weight: 0.20, min: 0.35, max: 0.65 },
      { weight: 0.65, min: 0.80, max: 1.20 },
      { weight: 0.15, min: 1.50, max: 2.40 }
    ],
    mainEasyOrderPayoutBands: [
      { weight: 0.72, min: 0.50, max: 1.30 },
      { weight: 0.20, min: 1.50, max: 2.80 },
      { weight: 0.07, min: 3.00, max: 4.00 },
      { weight: 0.01, min: 4.00, max: 4.00 }
    ],
    freeOrderPayoutBands: [
      { weight: 0.88, minPosition: 0.00, maxPosition: 0.18 },
      { weight: 0.10, minPosition: 0.18, maxPosition: 0.45 },
      { weight: 0.02, minPosition: 0.45, maxPosition: 1.00 }
    ],
    freeOrderPayoutTickets: [
      [
        { label: "Standard", weight: 90.2, min: 15, max: 20 },
        { label: "Sweet", weight: 4.5, min: 30, max: 50 },
        { label: "Big", weight: 4.4, min: 100, max: 150 },
        { label: "Mega", weight: 0.75, min: 300, max: 500 },
        { label: "Max", weight: 0.15, min: 900, max: 1000 }
      ],
      [
        { label: "Standard", weight: 90.2, min: 22, max: 32 },
        { label: "Sweet", weight: 4.5, min: 45, max: 70 },
        { label: "Big", weight: 4.4, min: 110, max: 180 },
        { label: "Mega", weight: 0.75, min: 350, max: 600 },
        { label: "Max", weight: 0.15, min: 900, max: 1000 }
      ],
      [
        { label: "Standard", weight: 90.2, min: 40, max: 60 },
        { label: "Sweet", weight: 4.5, min: 75, max: 120 },
        { label: "Big", weight: 4.4, min: 150, max: 250 },
        { label: "Mega", weight: 0.75, min: 400, max: 700 },
        { label: "Max", weight: 0.15, min: 900, max: 1000 }
      ]
    ],
    bonusGoldMultiplierBands: [
      { weight: 0.9600, min: 1.02, max: 1.10 },
      { weight: 0.0350, min: 1.50, max: 2.50 },
      { weight: 0.0045, min: 4.00, max: 8.00 },
      { weight: 0.0005, min: 10.00, max: 25.00 }
    ],
    bonusEventTickets: [
      { kind: "special", weight: 48, repeatWeight: 48, maxPerBonus: 999 },
      { kind: "discount", weight: 30, repeatWeight: 30, maxPerBonus: 3 },
      { kind: "gold", weight: 20, repeatWeight: 8, maxPerBonus: 3 },
      { kind: "clear", weight: 8, repeatWeight: 0, maxPerBonus: 1 }
    ],
    bonusSpecialCountBands: [
      { label: "One", weight: 68, min: 1, max: 1 },
      { label: "Two", weight: 24, min: 2, max: 2 },
      { label: "Three", weight: 8, min: 3, max: 3 }
    ],
    bonusDiscountBands: [
      { label: "Small", weight: 55, min: 0.18, max: 0.27 },
      { label: "Medium", weight: 35, min: 0.28, max: 0.38 },
      { label: "Large", weight: 10, min: 0.39, max: 0.52 }
    ],
    mainRewardWeights: [
      { coins: 0.83, scatter: 0.16 },
      { coins: 1.00, scatter: 0.00 },
      { coins: 1.00, scatter: 0.00 }
    ],
    mainOrderPools: [
      [
        { kind: "any", need: 45, mult: 3 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 50, mult: 9 },
        { kind: "color", typeIndex: 1, need: 50, mult: 9 },
        { kind: "color", typeIndex: 2, need: 50, mult: 9 },
        { kind: "color", typeIndex: 3, need: 50, mult: 9 },
        { kind: "color", typeIndex: 4, need: 50, mult: 9 },
        { kind: "any", need: 220, mult: 9 },
        { kind: "cascade", need: 16, mult: 9 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 120, mult: 31 },
        { kind: "color", typeIndex: 1, need: 120, mult: 31 },
        { kind: "color", typeIndex: 2, need: 120, mult: 31 },
        { kind: "color", typeIndex: 3, need: 120, mult: 31 },
        { kind: "color", typeIndex: 4, need: 120, mult: 31 },
        { kind: "any", need: 550, mult: 31 },
        { kind: "cascade", need: 40, mult: 31 }
      ]
    ],
    freeOrderPools: [
      [
        { kind: "any", need: 127, mult: 5 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 78, mult: 12 },
        { kind: "color", typeIndex: 1, need: 78, mult: 12 },
        { kind: "color", typeIndex: 2, need: 78, mult: 12 },
        { kind: "color", typeIndex: 3, need: 78, mult: 12 },
        { kind: "color", typeIndex: 4, need: 78, mult: 12 },
        { kind: "any", need: 329, mult: 12 },
        { kind: "cascade", need: 20, mult: 12 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 141, mult: 25 },
        { kind: "color", typeIndex: 1, need: 141, mult: 25 },
        { kind: "color", typeIndex: 2, need: 141, mult: 25 },
        { kind: "color", typeIndex: 3, need: 141, mult: 25 },
        { kind: "color", typeIndex: 4, need: 141, mult: 25 },
        { kind: "any", need: 592, mult: 25 },
        { kind: "cascade", need: 39, mult: 25 }
      ]
    ]
  });
});
