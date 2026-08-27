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
      { label: "Quick", weight: 25, min: 12, max: 45 },
      { label: "Normal", weight: 40, min: 46, max: 115 },
      { label: "Slow", weight: 25, min: 116, max: 255 },
      { label: "Long tail", weight: 10, min: 256, max: 550 }
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
    mainPayoutScale: 0.52,
    freePayoutScale: 0.235,
    orderMultiplierSpread: 0.50,
    mainOrderMultiplierSpread: 0.75,
    freeOrderMultiplierSpread: 0.50,
    maxBonusRetriggers: 4,
    maxBonusWinMult: 10000,
    mainEasyOrderMaxMult: 80,
    autoMoveDelayMs: 260,
    autoStrategyWeights: {
      random: 0.74,
      special: 0.15,
      order: 0.11
    },
    conveyorShiftPerBet: 18,
    conveyorSpawnPerBetChance: 0.70,
    conveyorMinimumGap: 52,
    conveyorMaxActiveOrders: 21,
    conveyorRushChance: 0.08,
    conveyorGoldenChance: 0.045,
    conveyorScatterRewardChance: 0.055,
    mainOrderChainMultipliers: [1.00, 1.20, 1.40, 1.80],
    bonusOrderChainMultipliers: [1.00, 1.50, 2.00, 3.00],
    conveyorMainPayoutTickets: [
      [
        { label: "Small", weight: 93.9, minFactor: 1.00, maxFactor: 1.00 },
        { label: "Standard", weight: 1.0, minFactor: 2.00, maxFactor: 2.00 },
        { label: "Sweet", weight: 1.0, minFactor: 4.00, maxFactor: 6.00 },
        { label: "Big", weight: 4.0, minFactor: 10.00, maxFactor: 10.00 },
        { label: "Mega", weight: 0.1, minFactor: 40.00, maxFactor: 60.00 }
      ],
      [
        { label: "Small", weight: 91.0, minFactor: 0.40, maxFactor: 0.80 },
        { label: "Standard", weight: 5.0, minFactor: 3.00, maxFactor: 5.00 },
        { label: "Sweet", weight: 2.0, minFactor: 6.00, maxFactor: 9.00 },
        { label: "Big", weight: 1.8, minFactor: 12.00, maxFactor: 20.00 },
        { label: "Mega", weight: 0.2, minFactor: 40.00, maxFactor: 60.00 }
      ],
      [
        { label: "Small", weight: 75.0, minFactor: 0.40, maxFactor: 0.80 },
        { label: "Standard", weight: 14.0, minFactor: 2.00, maxFactor: 3.50 },
        { label: "Sweet", weight: 7.0, minFactor: 4.00, maxFactor: 6.00 },
        { label: "Big", weight: 3.5, minFactor: 10.00, maxFactor: 18.00 },
        { label: "Mega", weight: 0.5, minFactor: 35.00, maxFactor: 60.00 }
      ]
    ],
    bonusConveyorShiftPerMove: 14,
    bonusConveyorOrdersPerLane: [5, 4, 3],
    conveyorTierTickets: [
      { label: "Easy", weight: 48 },
      { label: "Medium", weight: 32 },
      { label: "Hard", weight: 20 }
    ],
    conveyorOrderPools: [
      [
        { kind: "color", needMin: 14, needMax: 24, multMin: 1, multMax: 2 },
        { kind: "any", needMin: 48, needMax: 72, multMin: 1, multMax: 2 }
      ],
      [
        { kind: "color", needMin: 22, needMax: 38, multMin: 4, multMax: 6 },
        { kind: "any", needMin: 72, needMax: 110, multMin: 4, multMax: 6 },
        { kind: "cascade", needMin: 6, needMax: 10, multMin: 5, multMax: 7 }
      ],
      [
        { kind: "color", needMin: 22, needMax: 40, multMin: 8, multMax: 12 },
        { kind: "any", needMin: 76, needMax: 128, multMin: 8, multMax: 12 },
        { kind: "cascade", needMin: 7, needMax: 12, multMin: 10, multMax: 14 },
        { kind: "chocolate", needMin: 1, needMax: 2, multMin: 12, multMax: 18 }
      ]
    ],
    bonusConveyorOrderPools: [
      [
        { kind: "color", needMin: 18, needMax: 30 },
        { kind: "any", needMin: 75, needMax: 110 }
      ],
      [
        { kind: "color", needMin: 35, needMax: 55 },
        { kind: "any", needMin: 140, needMax: 220 },
        { kind: "cascade", needMin: 8, needMax: 13 }
      ],
      [
        { kind: "color", needMin: 60, needMax: 95 },
        { kind: "any", needMin: 260, needMax: 420 },
        { kind: "cascade", needMin: 18, needMax: 28 },
        { kind: "chocolate", needMin: 2, needMax: 4 }
      ]
    ],
    bonusConveyorPayoutTickets: [
      [
        { label: "Standard", weight: 96.5891, min: 8, max: 10 },
        { label: "Sweet", weight: 2.0, min: 20, max: 30 },
        { label: "Big", weight: 0.6, min: 80, max: 140 },
        { label: "Mega", weight: 0.4, min: 300, max: 500 },
        { label: "Max", weight: 0.39, min: 900, max: 1000 },
        { label: "Ultra", weight: 0.0209, min: 4400, max: 5600 }
      ],
      [
        { label: "Standard", weight: 95.1782, min: 14, max: 18 },
        { label: "Sweet", weight: 2.5, min: 30, max: 50 },
        { label: "Big", weight: 1.0, min: 100, max: 180 },
        { label: "Mega", weight: 0.5, min: 350, max: 600 },
        { label: "Max", weight: 0.78, min: 900, max: 1000 },
        { label: "Ultra", weight: 0.0418, min: 4400, max: 5600 }
      ],
      [
        { label: "Standard", weight: 92.4673, min: 22, max: 30 },
        { label: "Sweet", weight: 4.0, min: 45, max: 75 },
        { label: "Big", weight: 1.5, min: 120, max: 220 },
        { label: "Mega", weight: 0.8, min: 400, max: 700 },
        { label: "Max", weight: 1.17, min: 900, max: 1000 },
        { label: "Ultra", weight: 0.0627, min: 4400, max: 5600 }
      ]
    ],
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
