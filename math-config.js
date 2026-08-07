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
    mainSpecialDropPerMoveRate: 0.00,
    refillMatchSuppressionMinRate: 0.05,
    refillMatchSuppressionMaxRate: 0.95,
    freeRefillMatchSuppressionMaxRate: 1.00,
    refillMatchAssistMaxRate: 1.00,
    freeRefillMatchAssistMaxRate: 1.00,
    refillEfficiencyFloor: 5.20,
    refillEfficiencyCeiling: 6.05,
    freeScatterPerMoveRate: 0.04,
    bonusStartMoves: 15,
    bonusRetriggerMoves: 15,
    bonusBuyCostMult: 100,
    mainPayoutScale: 1.0,
    freePayoutScale: 1.00,
    orderMultiplierSpread: 0.50,
    mainOrderMultiplierSpread: 0.75,
    freeOrderMultiplierSpread: 0.50,
    maxBonusRetriggers: 4,
    maxBonusWinMult: 1000,
    mainOrderNeedBands: [
      { weight: 0.20, min: 0.35, max: 0.65 },
      { weight: 0.65, min: 0.80, max: 1.20 },
      { weight: 0.15, min: 1.50, max: 2.40 }
    ],
    bonusGoldMultiplierBands: [
      { weight: 0.9110, min: 1.02, max: 1.15 },
      { weight: 0.0725, min: 2.00, max: 4.00 },
      { weight: 0.0150, min: 8.00, max: 20.00 },
      { weight: 0.0015, min: 180.00, max: 500.00 }
    ],
    mainRewardWeights: [
      { coins: 0.70, scatter: 0.29 },
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
        { kind: "color", typeIndex: 0, need: 120, mult: 30 },
        { kind: "color", typeIndex: 1, need: 120, mult: 30 },
        { kind: "color", typeIndex: 2, need: 120, mult: 30 },
        { kind: "color", typeIndex: 3, need: 120, mult: 30 },
        { kind: "color", typeIndex: 4, need: 120, mult: 30 },
        { kind: "any", need: 550, mult: 30 },
        { kind: "cascade", need: 40, mult: 30 }
      ]
    ],
    freeOrderPools: [
      [
        { kind: "any", need: 110, mult: 5 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 60, mult: 12 },
        { kind: "color", typeIndex: 1, need: 60, mult: 12 },
        { kind: "color", typeIndex: 2, need: 60, mult: 12 },
        { kind: "color", typeIndex: 3, need: 60, mult: 12 },
        { kind: "color", typeIndex: 4, need: 60, mult: 12 },
        { kind: "any", need: 250, mult: 12 },
        { kind: "cascade", need: 15, mult: 12 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 108, mult: 25 },
        { kind: "color", typeIndex: 1, need: 108, mult: 25 },
        { kind: "color", typeIndex: 2, need: 108, mult: 25 },
        { kind: "color", typeIndex: 3, need: 108, mult: 25 },
        { kind: "color", typeIndex: 4, need: 108, mult: 25 },
        { kind: "any", need: 450, mult: 25 },
        { kind: "cascade", need: 30, mult: 25 }
      ]
    ]
  });
});
