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
    freeRefillMatchAssistMaxRate: 0.65,
    refillMatchAssistMaxPerMove: 2,
    freeRefillMatchAssistMaxPerMove: 3,
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
    freeOrdersRefreshOnComplete: true,
    freeOrdersRefreshOnRetrigger: true,
    bonusBuyCostMult: 100,
    mainPayoutScale: 0.65,
    freePayoutScale: 1.00,
    orderMultiplierSpread: 0.50,
    mainOrderMultiplierSpread: 0.75,
    freeOrderMultiplierSpread: 0.50,
    maxBonusRetriggers: 4,
    maxBonusWinMult: 1000,
    mainEasyOrderMaxMult: 12,
    autoMoveDelayMs: 260,
    autoStrategyWeights: {
      random: 0.70,
      special: 0.17,
      order: 0.13
    },
    mainOrderNeedBands: [
      { weight: 0.45, min: 0.20, max: 0.50 },
      { weight: 0.50, min: 0.90, max: 1.25 },
      { weight: 0.05, min: 1.40, max: 1.70 }
    ],
    mainEasyOrderPayoutBands: [
      { weight: 0.75, min: 0.50, max: 1.00 },
      { weight: 0.18, min: 1.50, max: 2.00 },
      { weight: 0.06, min: 2.50, max: 3.00 },
      { weight: 0.01, min: 4.00, max: 5.00 }
    ],
    mainOrderUpgradeTickets: [
      { kind: "none", label: "", weight: 90, multipliers: [1] },
      { kind: "upgrade", label: "ORDER UPGRADE", weight: 8, multipliers: [1.5] },
      { kind: "super", label: "SUPER UPGRADE", weight: 2, multipliers: [3, 5] }
    ],
    mainOrderRewardFloorByTier: { Easy: 2, Medium: 3, Hard: 6 },
    mainOrderPayoutTickets: {
      Easy: [
        { label: "Standard", weight: 93, minFactor: 0.50, maxFactor: 0.67 },
        { label: "Sweet", weight: 1.9, minFactor: 1.00, maxFactor: 1.67 },
        { label: "Big", weight: 5, minFactor: 3.33, maxFactor: 6.67, minAward: 10 },
        { label: "Mega", weight: 0.1, minFactor: 10, maxFactor: 12 }
      ],
      Medium: [
        { label: "Standard", weight: 93, minFactor: 0.50, maxFactor: 0.75 },
        { label: "Sweet", weight: 1.9, minFactor: 1.75, maxFactor: 3.00 },
        { label: "Big", weight: 5, minFactor: 4, maxFactor: 8, minAward: 15 },
        { label: "Mega", weight: 0.1, minFactor: 12, maxFactor: 22 }
      ],
      Hard: [
        { label: "Standard", weight: 93, minFactor: 0.45, maxFactor: 0.65 },
        { label: "Sweet", weight: 1.9, minFactor: 1.50, maxFactor: 3.00 },
        { label: "Big", weight: 5, minFactor: 4, maxFactor: 8, minAward: 30 },
        { label: "Mega", weight: 0.1, minFactor: 12, maxFactor: 35 }
      ]
    },
    mainOrderUpgradeTicketsByTier: {
      Easy: [
        { kind: "none", label: "", weight: 95, multipliers: [1] },
        { kind: "upgrade", label: "ORDER UPGRADE", weight: 4, multipliers: [2] },
        { kind: "super", label: "SUPER UPGRADE", weight: 1, multipliers: [5, 10] }
      ],
      Medium: [
        { kind: "none", label: "", weight: 80, multipliers: [1] },
        { kind: "upgrade", label: "ORDER UPGRADE", weight: 18, multipliers: [2] },
        { kind: "super", label: "SUPER UPGRADE", weight: 2, multipliers: [3, 5] }
      ],
      Hard: [
        { kind: "none", label: "", weight: 65, multipliers: [1] },
        { kind: "upgrade", label: "ORDER UPGRADE", weight: 30, multipliers: [2] },
        { kind: "super", label: "SUPER UPGRADE", weight: 5, multipliers: [3, 5] }
      ]
    },
    goldenCandy: {
      mainMoveTriggerRate: 0.12,
      freeMoveTriggerRate: 0.16,
      maxOnBoard: 12,
      moveCountTickets: [
        { label: "Single", weight: 45, min: 1, max: 1 },
        { label: "Pair", weight: 30, min: 2, max: 2 },
        { label: "Cluster", weight: 17, min: 3, max: 4 },
        { label: "Shower", weight: 7, min: 5, max: 7 },
        { label: "Rush", weight: 1, min: 8, max: 10 }
      ],
      bonusCountTickets: [
        { label: "Pair", weight: 34, min: 2, max: 2 },
        { label: "Cluster", weight: 36, min: 3, max: 4 },
        { label: "Shower", weight: 23, min: 5, max: 7 },
        { label: "Rush", weight: 7, min: 8, max: 10 }
      ],
      revealTickets: [
        { kind: "stripe", label: "STRIPED", weight: 50 },
        { kind: "bomb", label: "BOMB", weight: 27 },
        { kind: "chocolate", label: "COLOR BOMB", weight: 14 },
        { kind: "double", label: "DOUBLE SPECIAL", weight: 7 },
        { kind: "spread", label: "GOLD SPREAD", weight: 2 }
      ],
      checkpointChanceByTier: {
        Easy: 0.18,
        Medium: 0.26,
        Hard: 0.34
      },
      checkpointCountByTier: {
        Easy: { min: 1, max: 2 },
        Medium: { min: 2, max: 4 },
        Hard: { min: 3, max: 6 }
      }
    },
    mainOrderMilestones: {
      Easy: [
        { at: 0.55, kind: "shift", count: 3, title: "CANDY SHIFT", detail: "3 candies change toward this order" }
      ],
      Medium: [
        { at: 0.38, kind: "shift", count: 3, title: "CANDY SHIFT", detail: "3 candies change toward this order" },
        { at: 0.72, kind: "stripe", count: 1, title: "STRIPE READY", detail: "A striped candy joins the board" }
      ],
      Hard: [
        { at: 0.28, kind: "shift", count: 4, title: "CANDY SHIFT", detail: "4 candies change toward this order" },
        { at: 0.55, kind: "stripe", count: 1, title: "STRIPE READY", detail: "A striped candy joins the board" },
        { at: 0.80, kind: "bomb", count: 1, title: "BOMB READY", detail: "A bomb candy joins the board" }
      ]
    },
    freeOrderPayoutBands: [
      { weight: 0.88, minPosition: 0.00, maxPosition: 0.18 },
      { weight: 0.10, minPosition: 0.18, maxPosition: 0.45 },
      { weight: 0.02, minPosition: 0.45, maxPosition: 1.00 }
    ],
    freeOrderPayoutTickets: [
      [
        { label: "Standard", weight: 97.50, min: 10, max: 13 },
        { label: "Sweet", weight: 1.80, min: 20, max: 30 },
        { label: "Big", weight: 0.55, min: 60, max: 100 },
        { label: "Mega", weight: 0.13, min: 250, max: 400 },
        { label: "Max", weight: 0.02, min: 900, max: 1000 }
      ],
      [
        { label: "Standard", weight: 96.80, min: 15, max: 20 },
        { label: "Sweet", weight: 2.20, min: 30, max: 45 },
        { label: "Big", weight: 0.75, min: 80, max: 130 },
        { label: "Mega", weight: 0.22, min: 300, max: 500 },
        { label: "Max", weight: 0.03, min: 900, max: 1000 }
      ],
      [
        { label: "Standard", weight: 96.00, min: 25, max: 35 },
        { label: "Sweet", weight: 2.70, min: 45, max: 70 },
        { label: "Big", weight: 0.95, min: 100, max: 180 },
        { label: "Mega", weight: 0.30, min: 350, max: 650 },
        { label: "Max", weight: 0.05, min: 900, max: 1000 }
      ]
    ],
    bonusGoldMultiplierBands: [
      { weight: 0.9600, min: 1.02, max: 1.10 },
      { weight: 0.0350, min: 1.50, max: 2.50 },
      { weight: 0.0045, min: 4.00, max: 8.00 },
      { weight: 0.0005, min: 10.00, max: 25.00 }
    ],
    bonusEventTickets: [
      { kind: "special", weight: 28, repeatWeight: 28, maxPerBonus: 999 },
      { kind: "discount", weight: 25, repeatWeight: 20, maxPerBonus: 4 },
      { kind: "gold", weight: 8, repeatWeight: 4, maxPerBonus: 2 },
      { kind: "clear", weight: 19, repeatWeight: 12, maxPerBonus: 3 },
      { kind: "boardGold", weight: 20, repeatWeight: 20, maxPerBonus: 999 }
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
      { coins: 0.75, scatter: 0.00 },
      { coins: 0.98, scatter: 0.01 },
      { coins: 0.99, scatter: 0.00 }
    ],
    mainOrderPools: [
      [
        { kind: "any", need: 75, mult: 4 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 46, mult: 6 },
        { kind: "color", typeIndex: 1, need: 46, mult: 6 },
        { kind: "color", typeIndex: 2, need: 46, mult: 6 },
        { kind: "color", typeIndex: 3, need: 46, mult: 6 },
        { kind: "color", typeIndex: 4, need: 46, mult: 6 },
        { kind: "any", need: 204, mult: 6 },
        { kind: "cascade", need: 15, mult: 6 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 104, mult: 14 },
        { kind: "color", typeIndex: 1, need: 104, mult: 14 },
        { kind: "color", typeIndex: 2, need: 104, mult: 14 },
        { kind: "color", typeIndex: 3, need: 104, mult: 14 },
        { kind: "color", typeIndex: 4, need: 104, mult: 14 },
        { kind: "any", need: 470, mult: 14 },
        { kind: "cascade", need: 35, mult: 14 }
      ]
    ],
    freeOrderPools: [
      [
        { kind: "any", need: 60, mult: 5 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 45, mult: 12, weight: 0.7 },
        { kind: "color", typeIndex: 1, need: 45, mult: 12, weight: 0.7 },
        { kind: "color", typeIndex: 2, need: 45, mult: 12, weight: 0.7 },
        { kind: "color", typeIndex: 3, need: 45, mult: 12, weight: 0.7 },
        { kind: "color", typeIndex: 4, need: 45, mult: 12, weight: 0.7 },
        { kind: "any", need: 200, mult: 12, weight: 1.5 },
        { kind: "cascade", need: 14, mult: 12, weight: 5.0 }
      ],
      [
        { kind: "color", typeIndex: 0, need: 120, mult: 25, weight: 0.5 },
        { kind: "color", typeIndex: 1, need: 120, mult: 25, weight: 0.5 },
        { kind: "color", typeIndex: 2, need: 120, mult: 25, weight: 0.5 },
        { kind: "color", typeIndex: 3, need: 120, mult: 25, weight: 0.5 },
        { kind: "color", typeIndex: 4, need: 120, mult: 25, weight: 0.5 },
        { kind: "any", need: 530, mult: 25, weight: 3.5 },
        { kind: "cascade", need: 38, mult: 25, weight: 4.0 }
      ]
    ]
  });
});
