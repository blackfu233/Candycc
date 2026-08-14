const W = 450;
const H = 720;
const MAIN_ROWS = 6;
const FREE_ROWS = 9;
const COLS = 6;
const MATH_CONFIG = globalThis.CANDY_MATH_CONFIG;
if (!MATH_CONFIG) throw new Error("Candy math config failed to load");
const STARTING_WALLET = MATH_CONFIG.startingWallet;
const DEFAULT_BET = MATH_CONFIG.defaultBet;
const BET_STEP = MATH_CONFIG.betStep;
const MIN_BET = MATH_CONFIG.minBet;
const MAX_BET = MATH_CONFIG.maxBet;
const MAIN_SCATTER_PER_MOVE_RATE = MATH_CONFIG.mainScatterPerMoveRate;
const FREE_SCATTER_PER_MOVE_RATE = MATH_CONFIG.freeScatterPerMoveRate;
const BONUS_BUY_COST_MULT = MATH_CONFIG.bonusBuyCostMult;
const MAIN_PAYOUT_SCALE = MATH_CONFIG.mainPayoutScale;
const FREE_PAYOUT_SCALE = MATH_CONFIG.freePayoutScale;
const TYPES = ["red", "blue", "green", "yellow", "purple"];
const COLORS = {
  red: 0xff5372,
  blue: 0x58c8ff,
  green: 0x79df7b,
  yellow: 0xffdf57,
  purple: 0xc77bff,
  chocolate: 0x9a522c
};
const ORDER_ROW_LAYOUT = [
  { y: 119, iconX: 60, textX: 104, rewardX: W - 58, labelDy: -6, progressDy: 8 },
  { y: 166, iconX: 60, textX: 104, rewardX: W - 58, labelDy: -6, progressDy: 8 },
  { y: 213, iconX: 60, textX: 104, rewardX: W - 58, labelDy: -6, progressDy: 8 }
];
const CONVEYOR_LANE_Y = [54, 101, 148];
const CONVEYOR_LEFT_X = 47;
const CONVEYOR_RIGHT_X = W - 52;
const LABELS = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  purple: "Purple",
  any: "Any",
  cascade: "Cascades",
  chocolate: "Chocolate"
};

class CandyOrdersScene extends Phaser.Scene {
  constructor() {
    super("CandyOrdersScene");
    this.cell = 50;
    this.boardX = Math.round((W - this.cell * COLS) / 2);
    this.boardY = 292;
    this.rows = MAIN_ROWS;
  }

  preload() {
    this.load.image("bg-strawberry-dessert", "assets/backgrounds/strawberry-dessert-bg.png");
    this.load.image("sym-red", "assets/symbols/symbol-red.png");
    this.load.image("sym-blue", "assets/symbols/symbol-blue.png");
    this.load.image("sym-green", "assets/symbols/symbol-green.png");
    this.load.image("sym-yellow", "assets/generated/symbol-pudding.png?v=20260615artapply");
    this.load.image("sym-purple", "assets/generated/symbol-grape.png?v=20260615artapply");
    this.load.image("sym-stripe-row", "assets/symbols/symbol-stripe.png");
    this.load.image("sym-stripe-col", "assets/symbols/symbol-stripe.png");
    this.load.image("sym-bomb", "assets/symbols/symbol-bomb.png");
    this.load.image("sym-chocolate", "assets/symbols/symbol-chocolate.png");
    this.load.image("fx-coin", "assets/symbols/coin.png");
    this.load.image("sym-chest", "assets/symbols/chest.png");
    this.load.image("sym-key", "assets/symbols/key.png");
    this.load.image("sym-scatter", "assets/generated/scatter-chest-premium.png?v=20260615artapply");
    this.load.image("ui-start-console-v2", "assets/generated/ui-start-screen-panel.png?v=20260814originalstart");
    this.load.image("ui-logo-v2", "assets/generated/logo-candy-orders.png?v=20260814originalstart");
    this.load.image("ui-conveyor-panel-v2", "assets/ui-v2/conveyor-panel.png?v=20260814uiv2");
    this.load.image("ui-bottom-hud-v2", "assets/ui-v2/bottom-hud.png?v=20260814uiv2");
    this.load.image("ui-main-board-frame-v2", "assets/ui-v2/main-board-frame.png?v=20260814uiv2");
    this.load.image("ui-bonus-board-frame-v2", "assets/ui-v2/bonus-board-frame.png?v=20260814uiv2");
    this.load.image("ui-main-board-backdrop-v2", "assets/ui-v2/main-board-backdrop.png?v=20260814backdrop");
    this.load.image("ui-bonus-board-backdrop-v2", "assets/ui-v2/bonus-board-backdrop.png?v=20260814backdrop");
    this.load.image("ui-bonus-hud-v2", "assets/ui-v2/bonus-hud.png?v=20260814uiv2");
    this.load.image("ui-bonus-orders-v2", "assets/ui-v2/bonus-orders.png?v=20260814uiv2");
    TYPES.forEach((type) => this.load.image(`order-${type}`, `assets/ui-v2/order-${type}.png?v=20260814uiv2`));
    this.load.image("order-any", "assets/ui-v2/order-any.png?v=20260814uiv2");
    this.load.image("order-cascade", "assets/ui-v2/order-cascade.png?v=20260814uiv2");
    this.load.image("order-chocolate", "assets/ui-v2/order-chocolate.png?v=20260814uiv2");
  }

  create() {
    this.board = [];
    this.sprites = [];
    this.allCandySprites = new Set();
    this.fxSprites = new Set();
    this.selected = null;
    this.busy = false;
    this.resolvingMove = false;
    this.modalOpen = false;
    this.inputOpen = false;
    this.sessionActive = false;
    this.autoPlayEnabled = false;
    this.autoTimer = null;
    this.wallet = STARTING_WALLET;
    this.displayedWallet = STARTING_WALLET;
    this.walletCounterTween = null;
    this.musicStarted = false;
    this.musicTimer = null;
    this.betAmount = DEFAULT_BET;
    this.movesMade = 0;
    this.paidMovesMade = 0;
    this.endReason = "";
    this.totalRemoved = 0;
    this.removedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.cascadeCount = 0;
    this.chocolatesCreated = 0;
    this.comboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.ordersCompleted = 0;
    this.sessionReward = 0;
    this.paidBetTotal = 0;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.conveyorOrderSequence = 0;
    this.conveyorSpawnLane = 0;
    this.conveyorOrderViews = new Map();
    this.conveyorUiItems = [];
    this.conveyorRushActive = false;
    this.scatterGoal = 3;
    this.bonusPending = false;
    this.gameMode = "main";
    this.freeMovesLeft = 0;
    this.freeRemoved = 0;
    this.freeRemovedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.freeCascadeCount = 0;
    this.freeChocolatesCreated = 0;
    this.freeComboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.freeReward = 0;
    this.freeStartWallet = STARTING_WALLET;
    this.freeOrdersCompleted = 0;
    this.freeScatterRetriggers = 0;
    this.freeEventCount = 0;
    this.freeColorClearUsed = false;
    this.freeMoveHadEvent = false;
    this.bonusEventSessionCounts = { special: 0, discount: 0, gold: 0, clear: 0 };
    this.freeBoughtMode = false;
    this.scatterDropQueued = false;
    this.mainScatterCountdown = this.rollScatterInterval(false);
    this.freeScatterCountdown = 0;
    this.freeMusicTimer = null;
    this.configureBoard(MAIN_ROWS);
    this.displayedWin = 0;
    this.lastWinAmount = 0;
    this.winCounterTween = null;
    this.betAmount = Phaser.Math.Clamp(this.betAmount, MIN_BET, Math.max(MIN_BET, Math.min(MAX_BET, this.wallet)));

    this.createSymbolTextures();
    this.createBackground();
    this.createUi();
    this.createBoardFrame();
    this.showPreStart();
  }

  configureBoard(rows) {
    this.rows = rows;
    this.cell = rows === FREE_ROWS ? 47 : 58;
    this.boardX = Math.round((W - this.cell * COLS) / 2);
    this.boardY = rows === FREE_ROWS ? 246 : 240;
  }

  createBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x4f1220, 1);
  }

  createSymbolTextures() {
    const defs = [
      ["sym-red", "gummy", "#ff5372", "#7b1630"],
      ["sym-blue", "lollipop", "#58c8ff", "#164a7b"],
      ["sym-green", "bear", "#79df7b", "#1d6b3c"],
      ["sym-yellow", "wrapped", "#ffdf57", "#8a5e0b"],
      ["sym-purple", "planet", "#c77bff", "#5a258e"],
      ["sym-stripe-row", "stripeH", "#ffdf57", "#8a5e0b"],
      ["sym-stripe-col", "stripeV", "#58c8ff", "#164a7b"],
      ["sym-bomb", "bomb", "#ff5aa7", "#64204a"],
      ["sym-chocolate", "chocolate", "#9a522c", "#3a1d12"]
    ];
    defs.forEach(([key, kind, color, outline]) => {
      if (this.textures.exists(key)) return;
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      const r = (x, y, w, h, fill) => {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
      };
      const shine = () => {
        r(18, 12, 10, 6, "rgba(255,255,255,.82)");
        r(15, 19, 5, 4, "rgba(255,255,255,.55)");
      };
      r(14, 46, 34, 8, "rgba(36,16,48,.28)");
      if (kind === "wrapped" || kind === "stripeH" || kind === "stripeV") {
        r(4, 24, 12, 18, outline);
        r(48, 24, 12, 18, outline);
        r(8, 27, 10, 12, "#fff4cf");
        r(46, 27, 10, 12, "#fff4cf");
        r(16, 14, 32, 38, outline);
        r(20, 17, 24, 32, color);
        if (kind === "stripeH") {
          r(20, 25, 24, 5, "#ffffff");
          r(20, 36, 24, 5, "#ffffff");
        } else if (kind === "stripeV") {
          r(27, 17, 5, 32, "#ffffff");
          r(36, 17, 5, 32, "#ffffff");
        } else {
          r(29, 17, 5, 32, "#fff6b8");
        }
        shine();
      } else if (kind === "bear" || kind === "gummy") {
        r(16, 10, 12, 12, outline);
        r(36, 10, 12, 12, outline);
        r(19, 13, 8, 8, color);
        r(37, 13, 8, 8, color);
        r(13, 18, 38, 40, outline);
        r(17, 21, 30, 34, color);
        r(23, 30, 5, 5, "#1c1026");
        r(36, 30, 5, 5, "#1c1026");
        r(29, 39, 8, 4, "#1c1026");
        shine();
      } else if (kind === "lollipop") {
        r(29, 38, 6, 18, outline);
        r(30, 39, 4, 15, "#ffe0d4");
        r(11, 7, 42, 42, outline);
        r(15, 11, 34, 34, color);
        r(22, 17, 22, 5, "#cfffff");
        r(19, 28, 28, 5, "#ffffff");
        shine();
      } else if (kind === "planet") {
        r(13, 13, 38, 38, outline);
        r(17, 17, 30, 30, color);
        r(4, 31, 56, 8, outline);
        r(8, 32, 48, 5, "#ffd28f");
        r(19, 19, 8, 6, "#ffffff");
        r(38, 35, 5, 5, "#6ee8ff");
        r(27, 30, 5, 5, "#ff8bd4");
      } else if (kind === "bomb") {
        r(14, 17, 38, 38, outline);
        r(18, 21, 30, 30, color);
        r(27, 8, 14, 14, outline);
        r(30, 4, 8, 10, "#ffef70");
        r(23, 31, 18, 6, "#ffffff");
        r(18, 17, 8, 6, "#ffd0e7");
      } else if (kind === "chocolate") {
        r(12, 10, 42, 44, outline);
        r(16, 14, 34, 36, color);
        r(17, 30, 32, 4, "#4a2415");
        r(32, 15, 4, 34, "#4a2415");
        r(20, 17, 10, 7, "#d98b4a");
        r(39, 36, 7, 6, "#c47a40");
      }
      this.textures.addCanvas(key, canvas);
    });
    this.createScatterTexture();
  }

  createScatterTexture() {
    if (this.textures.exists("sym-scatter")) return;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const r = (x, y, w, h, fill) => {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    };
    r(22, 4, 20, 8, "#fff6d0");
    r(16, 8, 32, 8, "#ffdf57");
    r(10, 16, 44, 8, "#351352");
    r(8, 24, 48, 28, "#351352");
    r(12, 20, 40, 32, "#fff06a");
    r(16, 24, 32, 24, "#ff4f88");
    r(20, 28, 24, 16, "#8ee8ff");
    r(26, 18, 12, 34, "#ffffff");
    r(14, 31, 36, 8, "#ffffff");
    r(29, 25, 6, 22, "#351352");
    r(21, 34, 22, 4, "#351352");
    r(18, 14, 7, 5, "rgba(255,255,255,.9)");
    r(42, 10, 5, 5, "#ffffff");
    r(6, 32, 5, 5, "#fff06a");
    r(53, 29, 5, 5, "#fff06a");
    r(15, 52, 34, 5, "rgba(36,16,48,.32)");
    this.textures.addCanvas("sym-scatter", canvas);
  }

  playPopSound(pitch = 520) {
    try {
      const ctx = this.sound.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.7, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playBetSound(delta, changed) {
    try {
      const ctx = this.sound.context;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(changed ? 0.042 : 0.024, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      gain.connect(ctx.destination);
      const notes = changed
        ? (delta > 0 ? [659, 988] : [988, 659])
        : [196, 164];
      notes.forEach((pitch, i) => {
        const osc = ctx.createOscillator();
        osc.type = changed ? "triangle" : "square";
        osc.frequency.setValueAtTime(pitch, now + i * 0.055);
        osc.frequency.exponentialRampToValueAtTime(pitch * (changed ? 1.18 : 0.82), now + i * 0.055 + 0.09);
        osc.connect(gain);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.11);
      });
    } catch (e) {}
  }

  playOrderCompleteSound() {
    try {
      const ctx = this.sound.context;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(5200, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      filter.connect(gain);
      gain.connect(ctx.destination);
      [523, 784, 1047, 1568, 2093].forEach((pitch, i) => {
        const osc = ctx.createOscillator();
        osc.type = i < 2 ? "square" : "triangle";
        osc.frequency.setValueAtTime(pitch, now + i * 0.065);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.22, now + i * 0.065 + 0.18);
        osc.connect(filter);
        osc.start(now + i * 0.065);
        osc.stop(now + i * 0.065 + 0.22);
      });
    } catch (e) {}
  }

  playCoinDing(pitch = 1850, volume = 0.035, offset = 0) {
    try {
      const ctx = this.sound.context;
      const now = ctx.currentTime + offset;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      master.connect(ctx.destination);

      [
        { ratio: 1, gain: 0.7, end: 0.2 },
        { ratio: 1.47, gain: 0.38, end: 0.13 },
        { ratio: 2.31, gain: 0.2, end: 0.08 }
      ].forEach(({ ratio, gain, end }) => {
        const osc = ctx.createOscillator();
        const partialGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch * ratio, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * ratio * 0.97, now + end);
        partialGain.gain.setValueAtTime(gain, now);
        partialGain.gain.exponentialRampToValueAtTime(0.001, now + end);
        osc.connect(partialGain);
        partialGain.connect(master);
        osc.start(now);
        osc.stop(now + end);
      });

      const noiseLength = Math.max(1, Math.floor(ctx.sampleRate * 0.025));
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
      const noise = ctx.createBufferSource();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.buffer = noiseBuffer;
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start(now);
    } catch (e) {}
  }

  playCoinSpraySound() {
    const notes = [1568, 1760, 1976, 1760, 2093, 2349];
    notes.forEach((pitch, i) => this.playCoinDing(pitch, i === 0 || i === 4 ? 0.04 : 0.026, i * 0.16));
  }

  playUnlockSound() {
    try {
      const ctx = this.sound.context;
      const now = ctx.currentTime;
      const click = (time, freq, volume) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.065);
      };
      click(now, 820, 0.045);
      click(now + 0.09, 1180, 0.038);
      click(now + 0.18, 1640, 0.032);
      const shimmer = ctx.createOscillator();
      const gain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(1350, now + 0.24);
      shimmer.frequency.exponentialRampToValueAtTime(2600, now + 0.56);
      gain.gain.setValueAtTime(0.032, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
      shimmer.connect(gain);
      gain.connect(ctx.destination);
      shimmer.start(now + 0.24);
      shimmer.stop(now + 0.64);
    } catch (e) {}
  }

  playComboVoice() {
    try {
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        const cuteVoice = voices.find((v) => /child|kid|girl|aria|jenny|zira|samantha|female/i.test(v.name))
          || voices.find((v) => /en/i.test(v.lang))
          || null;
        window.speechSynthesis.cancel();
        const voice = new SpeechSynthesisUtterance("Combo!");
        voice.lang = cuteVoice ? cuteVoice.lang : "en-US";
        voice.voice = cuteVoice;
        voice.pitch = 2;
        voice.rate = 1.62;
        voice.volume = 0.86;
        window.speechSynthesis.speak(voice);
      }
    } catch (e) {}
    try {
      const ctx = this.sound.context;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      filter.connect(gain);
      gain.connect(ctx.destination);
      [0, 0.055, 0.12, 0.205].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? "triangle" : "square";
        osc.frequency.setValueAtTime([1568, 2093, 2637, 3520][i], ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime([2093, 2637, 3520, 4186][i], ctx.currentTime + offset + 0.08);
        osc.connect(filter);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.095);
      });
    } catch (e) {}
  }

  startCuteMusic() {
    if (this.musicStarted) return;
    this.musicStarted = true;
    const notes = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 988, 880, 784, 659, 587];
    let step = 0;
    const playNote = () => {
      try {
        const ctx = this.sound.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const freq = notes[step % notes.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.018, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        if (step % 4 === 0) this.playPopSound(196);
        step += 1;
      } catch (e) {}
    };
    playNote();
    this.musicTimer = this.time.addEvent({ delay: 260, loop: true, callback: playNote });
  }

  stopCuteMusic() {
    if (this.musicTimer) this.musicTimer.remove(false);
    this.musicTimer = null;
    this.musicStarted = false;
  }

  startFreeMusic() {
    this.stopCuteMusic();
    if (this.freeMusicTimer) return;
    const notes = [392, 523, 659, 784, 988, 880, 784, 659, 740, 988, 1175, 988];
    let step = 0;
    const playNote = () => {
      try {
        const ctx = this.sound.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = step % 3 === 0 ? "square" : "triangle";
        osc.frequency.setValueAtTime(notes[step % notes.length], ctx.currentTime);
        gain.gain.setValueAtTime(step % 4 === 0 ? 0.028 : 0.018, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
        if (step % 6 === 0) this.playCoinDing();
        step += 1;
      } catch (e) {}
    };
    playNote();
    this.freeMusicTimer = this.time.addEvent({ delay: 155, loop: true, callback: playNote });
  }

  stopFreeMusic() {
    if (this.freeMusicTimer) this.freeMusicTimer.remove(false);
    this.freeMusicTimer = null;
  }

  burstAt(x, y, color = 0xffffff) {
    const bits = [];
    for (let i = 0; i < 5; i++) {
      const bit = this.add.rectangle(x, y, 5, 5, color, 0.95).setDepth(42);
      bit.isFxSprite = true;
      this.fxSprites.add(bit);
      bits.push(bit);
      const angle = (Math.PI * 2 * i) / 5;
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        alpha: 0,
        scale: 0.2,
        duration: 260,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(bit)
      });
      this.time.delayedCall(420, () => this.destroyFx(bit));
    }
  }

  orderRowY(index) {
    return this.orderRows?.[index]?.rowCenter
      ?? ORDER_ROW_LAYOUT[index]?.y
      ?? (ORDER_ROW_LAYOUT[0].y + index * 35);
  }

  showOrderCompleteFx(index, order, reward) {
    const conveyorView = order?.conveyorId ? this.conveyorOrderViews.get(order.conveyorId) : null;
    const x = conveyorView?.container.x ?? W / 2;
    const y = order?.conveyorId ? CONVEYOR_LANE_Y[order.lane] : this.orderRowY(index);
    const row = this.orderRows[index];
    if (!order?.conveyorId) this.setOrderNearState(row, false);
    this.playOrderCompleteSound();
    this.cameras.main.shake(620, 0.016);

    const flashWidth = order?.conveyorId ? Math.max(64, Number(order.cardWidth || 64)) : W - 12;
    const flash = this.add.rectangle(x, y, flashWidth, 44, 0xfff06a, 0.86).setDepth(110);
    flash.isFxSprite = true;
    this.fxSprites.add(flash);
    this.tweens.add({
      targets: flash,
      scaleX: 1.08,
      alpha: 0,
      duration: 760,
      ease: "Cubic.Out",
      onComplete: () => this.destroyFx(flash)
    });

    if (reward <= 0) {
      const key = this.add.image(x, y, "sym-scatter").setDepth(112);
      key.setScale(28 / Math.max(key.width, key.height));
      key.isFxSprite = true;
      this.fxSprites.add(key);
      this.tweens.add({
        targets: key,
        y: y - 24,
        scale: key.scaleX * 1.28,
        alpha: 0,
        duration: 820,
        ease: "Back.Out",
        onComplete: () => this.destroyFx(key)
      });
      this.burstAt(x, y, 0xfff06a);
      if (order?.conveyorId) this.destroyConveyorOrderView(order.conveyorId, true);
      return;
    }

    for (let i = 0; i < 32; i++) {
      const coin = this.add.image(x, y, "fx-coin").setDepth(112);
      const size = i % 3 === 0 ? 24 : 17;
      coin.setScale(size / Math.max(coin.width, coin.height));
      coin.isFxSprite = true;
      this.fxSprites.add(coin);
      const angle = -Math.PI + (Math.PI * 2 * i) / 32;
      const distance = 70 + (i % 6) * 18;
      const baseScale = coin.scaleX;
      this.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + 34,
        scaleX: baseScale * 0.14,
        scaleY: baseScale * 1.08,
        angle: 360,
        alpha: 0,
        duration: 1050 + (i % 5) * 90,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(coin)
      });
    }

    this.burstAt(x, y, 0xffffff);
    if (order?.conveyorId) this.destroyConveyorOrderView(order.conveyorId, true);
  }

  grantScatterRewardFx(orderIndex = 0) {
    if (this.gameMode !== "main") return false;
    if (this.countScatters() >= this.scatterGoal) return false;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r]?.[c];
        if (tile && !tile.scatter && !tile.chest && !tile.special) candidates.push([r, c]);
      }
    }
    if (!candidates.length) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.board[r]?.[c];
          if (tile && !tile.scatter && !tile.chest) candidates.push([r, c]);
        }
      }
    }
    if (!candidates.length) return false;
    const [r, c] = Phaser.Utils.Array.GetRandom(candidates);
    const oldSprite = this.sprites[r]?.[c];
    if (oldSprite) this.destroyCandySprite(oldSprite);
    this.board[r][c] = { type: "scatter", special: null, scatter: true };
    this.sprites[r][c] = this.createCandySprite(this.board[r][c], r, c, false);
    const x = this.cellX(c);
    const y = this.cellY(r);
    const sourceOrder = this.orders[orderIndex];
    const sourceView = sourceOrder?.conveyorId ? this.conveyorOrderViews.get(sourceOrder.conveyorId) : null;
    const startX = sourceView?.container.x ?? W - 62;
    const startY = sourceOrder?.conveyorId ? CONVEYOR_LANE_Y[sourceOrder.lane] : (this.orderRows[orderIndex]?.rowCenter || (122 + orderIndex * 43));
    const icon = this.add.image(startX, startY, "sym-scatter").setDepth(34);
    icon.setScale(23 / Math.max(icon.width, icon.height));
    icon.isFxSprite = true;
    this.fxSprites.add(icon);
    this.tweens.add({
      targets: icon,
      x,
      y,
      scale: 0.72,
      duration: 520,
      ease: "Cubic.InOut",
      onComplete: () => {
        this.burstAt(x, y, 0xfff06a);
        this.destroyFx(icon);
      }
    });
    this.playUnlockSound();
    this.updateKeyUi();
    return true;
  }

  showOrderAlmostFx(index) {
    const y = this.orderRowY(index);
    this.playPopSound(1120);
    const banner = this.add.rectangle(W / 2, 238, W - 46, 48, 0x351352, 0.9)
      .setStrokeStyle(4, 0xfff06a, 0.95)
      .setDepth(120);
    banner.isFxSprite = true;
    this.fxSprites.add(banner);
    const label = this.add.text(W / 2, 238, "75%  ORDER READY SOON", {
      fontSize: 24,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#7a2d93",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(121);
    label.isFxSprite = true;
    this.fxSprites.add(label);
    banner.setScale(0.7);
    label.setScale(0.7);
    this.tweens.add({
      targets: [banner, label],
      scale: 1,
      duration: 260,
      ease: "Back.Out"
    });
    this.tweens.add({
      targets: [banner, label],
      alpha: 0,
      delay: 1450,
      duration: 450,
      ease: "Cubic.In",
      onComplete: () => {
        this.destroyFx(banner);
        this.destroyFx(label);
      }
    });
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 180, () => this.burstAt(W / 2, y, 0xfff06a));
  }

  showOrderRewardSummary(completions, totalReward) {
    if (completions.some((item) => item.order?.conveyorId)) {
      return this.showConveyorRewardSummary(completions, totalReward);
    }
    const coinCompletions = completions.filter((item) => item.reward > 0 && item.range);
    const separateDraws = coinCompletions.length > 1;
    const scatterCount = completions.filter((item) => item.scatter).length;
    const boostText = coinCompletions
      .filter((item) => item.goldMult > 1 || item.boostMult > 1)
      .map((item) => item.goldMult > 1 && item.boostMult > 1 ? `GOLD x${item.goldMult} + BOOST ${item.boostLabel}` : item.goldMult > 1 ? `GOLD x${item.goldMult}` : `BOOST ${item.boostLabel}`)
      .join("  ");
    const totalMult = coinCompletions.reduce((sum, item) => sum + item.rollMult, 0);
    const rangeMin = coinCompletions.reduce((sum, item) => sum + item.range.min, 0);
    const rangeMax = coinCompletions.reduce((sum, item) => sum + item.range.max, 0);
    const summaryDepth = 120;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x16091f, 0.56).setDepth(summaryDepth);
    const panel = this.add.rectangle(W / 2, 430, W - 44, separateDraws ? 240 : 224, 0x4a1a6b, 0.97).setStrokeStyle(6, 0xfff06a, 1).setDepth(summaryDepth + 1);
    const topLine = this.add.rectangle(W / 2, 330, W - 84, 7, 0x8ee8ff, 1).setDepth(summaryDepth + 2);
    const title = this.add.text(W / 2, 365, completions.length > 1 ? "ORDERS COMPLETE!" : "ORDER COMPLETE!", {
      fontSize: 33,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#b218c9",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(summaryDepth + 3);
    const multiplier = this.add.text(W / 2, separateDraws ? 468 : 425, separateDraws ? "TOTAL +0x" : `+${totalMult}x`, {
      fontSize: separateDraws ? 42 : 78,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#b218c9",
      strokeThickness: 12
    }).setOrigin(0.5).setDepth(summaryDepth + 4);
    const rangeText = this.add.text(W / 2, separateDraws ? 497 : 462, `${separateDraws ? `${coinCompletions.length} SEPARATE DRAWS` : (boostText || `RANGE ${rangeMin}-${rangeMax}x`)}${scatterCount ? `  +${scatterCount} SCATTER` : ""}`, {
      fontSize: separateDraws ? 14 : 17,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(summaryDepth + 3);
    const rewardText = this.add.text(W / 2, separateDraws ? 521 : 492, `COINS +${totalReward}`, {
      fontSize: separateDraws ? 25 : 31,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#7a2d93",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(summaryDepth + 3);
    const drawLabels = [];
    const drawValues = [];
    if (separateDraws) {
      const spacing = coinCompletions.length === 2 ? 136 : 108;
      const startX = W / 2 - spacing * (coinCompletions.length - 1) / 2;
      coinCompletions.forEach((item, index) => {
        const x = startX + index * spacing;
        const tier = String(item.order?.tier || `ORDER ${index + 1}`).replace(/^Bonus\s+/i, "").toUpperCase();
        drawLabels.push(this.add.text(x, 392, tier, {
          fontSize: 12,
          fontStyle: "900",
          color: "#8ee8ff",
          stroke: "#351352",
          strokeThickness: 4
        }).setOrigin(0.5).setDepth(summaryDepth + 4));
        drawValues.push(this.add.text(x, 424, "?x", {
          fontSize: coinCompletions.length === 3 ? 30 : 36,
          fontStyle: "900",
          color: "#fff06a",
          stroke: "#b218c9",
          strokeThickness: 7
        }).setOrigin(0.5).setDepth(summaryDepth + 4));
      });
    }
    const items = [veil, panel, topLine, title, multiplier, rangeText, rewardText, ...drawLabels, ...drawValues];
    items.forEach((item) => {
      item.isFxSprite = true;
      this.fxSprites.add(item);
      item.setAlpha(0);
    });
    panel.setScale(0.72);
    multiplier.setScale(0.32);
    this.tweens.add({ targets: veil, alpha: 0.56, duration: 220 });
    this.tweens.add({
      targets: [panel, topLine, title, rangeText, rewardText, ...drawLabels, ...drawValues],
      alpha: 1,
      scale: 1,
      duration: 320,
      ease: "Back.Out"
    });
    this.tweens.add({ targets: multiplier, alpha: 1, scale: 1, duration: 520, ease: "Back.Out" });
    if (separateDraws) {
      coinCompletions.forEach((item, index) => {
        for (let spin = 0; spin < 7; spin++) {
          this.time.delayedCall(180 + index * 150 + spin * 65, () => {
            drawValues[index].setText(`${Phaser.Math.Between(item.range.min, item.range.max)}x`);
            this.playPopSound(760 + spin * 45 + index * 80);
          });
        }
        this.time.delayedCall(720 + index * 230, () => {
          drawValues[index].setText(`+${item.rollMult}x`).setScale(1.22);
          this.tweens.add({ targets: drawValues[index], scale: 1, duration: 260, ease: "Back.Out" });
          this.playUnlockSound();
          this.burstAt(drawValues[index].x, drawValues[index].y, 0xfff06a);
        });
      });
    } else {
      for (let spin = 0; spin < 12; spin++) {
        this.time.delayedCall(180 + spin * 58, () => {
          const preview = Phaser.Math.Between(rangeMin, rangeMax);
          multiplier.setText(`+${preview}x`);
          this.playPopSound(780 + spin * 42);
        });
      }
    }
    this.time.delayedCall(separateDraws ? 850 + (coinCompletions.length - 1) * 230 : 930, () => {
      multiplier.setText(separateDraws ? `TOTAL +${totalMult}x` : `+${totalMult}x`);
      this.playUnlockSound();
      this.cameras.main.shake(240, 0.008);
      this.burstAt(W / 2, multiplier.y, 0xfff06a);
    });
    const fadeDelay = separateDraws ? 2350 : (this.autoPlayEnabled ? 1450 : 2100);
    this.tweens.add({
      targets: items,
      alpha: 0,
      delay: fadeDelay,
      duration: 420,
      ease: "Cubic.In",
      onComplete: () => items.forEach((item) => this.destroyFx(item))
    });
    for (let i = 0; i < 4; i++) this.time.delayedCall(250 + i * 260, () => this.burstAt(W / 2, 425, i % 2 ? 0xffffff : 0xfff06a));
    return fadeDelay + 480;
  }

  showConveyorRewardSummary(completions, totalReward) {
    const depth = 120;
    const visible = completions.slice(0, 6);
    const single = visible.length === 1;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x16091f, 0.55).setDepth(depth);
    const panel = this.add.rectangle(W / 2, 421, W - 22, single ? 306 : 366, 0x4a1a6b, 0.98)
      .setStrokeStyle(6, 0xfff06a, 1)
      .setDepth(depth + 1);
    const titleText = completions.length === 1 ? "ORDER COMPLETE!" : `${completions.length} ORDERS COMPLETE!`;
    const title = this.add.text(W / 2, single ? 304 : 278, titleText, {
      fontSize: completions.length >= 10 ? 28 : 32,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#b218c9",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(depth + 3);
    const items = [veil, panel, title];
    const resultItems = [];
    visible.forEach((completion, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = single ? W / 2 : 121 + col * 208;
      const y = single ? 382 : 337 + row * 67;
      const resultPlate = this.add.rectangle(x, y, single ? 238 : 184, single ? 116 : 54, completion.order?.golden ? 0x7b5410 : 0x65162a, 0.96)
        .setStrokeStyle(3, completion.order?.golden ? 0xfff06a : 0x8ee8ff, 0.95)
        .setDepth(depth + 2);
      const icon = this.add.image(x - (single ? 54 : 57), y, this.conveyorIconKey(completion.order)).setDepth(depth + 4);
      const iconSize = single ? 74 : 38;
      icon.setScale(iconSize / Math.max(icon.width, icon.height));
      const result = this.add.text(x + (single ? 36 : 24), y, completion.reward > 0 ? `+${completion.rollMult}x` : "SCATTER", {
        fontSize: completion.reward > 0 ? (single ? 44 : 23) : (single ? 21 : 13),
        fontStyle: "900",
        color: completion.order?.golden ? "#fff06a" : "#ffffff",
        stroke: "#7a2d93",
        strokeThickness: single ? 8 : 6
      }).setOrigin(0.5).setDepth(depth + 4);
      resultItems.push(resultPlate, icon, result);
      items.push(resultPlate, icon, result);
    });
    const extraCount = Math.max(0, completions.length - visible.length);
    const extra = this.add.text(W / 2, single ? 474 : 537, extraCount ? `+${extraCount} MORE ORDERS` : "", {
      fontSize: 15,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(depth + 4);
    const total = this.add.text(W / 2, single ? 520 : 574, `TOTAL +${totalReward}`, {
      fontSize: single ? 40 : 36,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#b218c9",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(depth + 4);
    items.push(extra, total);
    items.forEach((item) => {
      item.isFxSprite = true;
      this.fxSprites.add(item);
      item.setAlpha(0);
    });
    panel.setScale(0.78);
    total.setScale(0.5);
    this.tweens.add({ targets: veil, alpha: 0.55, duration: 180 });
    this.tweens.add({ targets: [panel, title], alpha: 1, scale: 1, duration: 280, ease: "Back.Out" });
    resultItems.forEach((item, index) => {
      this.time.delayedCall(220 + Math.floor(index / 3) * 140, () => {
        item.setAlpha(1).setScale(item.scaleX * 1.18, item.scaleY * 1.18);
        this.tweens.add({ targets: item, scaleX: item.scaleX / 1.18, scaleY: item.scaleY / 1.18, duration: 180, ease: "Back.Out" });
        if (index % 2 === 1) this.playPopSound(820 + index * 30);
      });
    });
    const totalDelay = 620 + visible.length * 100;
    this.time.delayedCall(totalDelay, () => {
      extra.setAlpha(extraCount ? 1 : 0);
      total.setAlpha(1);
      this.tweens.add({ targets: total, scale: 1, duration: 280, ease: "Back.Out" });
      this.playUnlockSound();
      this.cameras.main.shake(220, 0.008);
      this.burstAt(W / 2, total.y, 0xfff06a);
    });
    const fadeDelay = Math.max(2500, totalDelay + 1050);
    this.tweens.add({
      targets: items,
      alpha: 0,
      delay: fadeDelay,
      duration: 380,
      ease: "Cubic.In",
      onComplete: () => items.forEach((item) => this.destroyFx(item))
    });
    return fadeDelay + 430;
  }

  addFxRect(x, y, w, h, color, alpha = 1) {
    const rect = this.add.rectangle(x, y, w, h, color, alpha).setDepth(36);
    rect.isFxSprite = true;
    this.fxSprites.add(rect);
    return rect;
  }

  playStripeFx(r, c, dir) {
    const x = this.cellX(c);
    const y = this.cellY(r);
    const horizontal = dir === "stripeRow";
    const beam = this.addFxRect(
      horizontal ? W / 2 : x,
      horizontal ? y : this.boardY + (this.cell * this.rows) / 2,
      horizontal ? this.cell * COLS + 20 : 18,
      horizontal ? 18 : this.cell * this.rows + 20,
      0xff8fc7,
      0.75
    );
    const core = this.addFxRect(
      beam.x,
      beam.y,
      horizontal ? this.cell * COLS + 12 : 7,
      horizontal ? 7 : this.cell * this.rows + 12,
      0x8ee8ff,
      0.95
    );
    const sparkleA = this.addFxRect(x, y, 14, 14, 0xffe277, 1);
    const sparkleB = this.addFxRect(x, y, 8, 8, 0xffffff, 0.9);
    [beam, core].forEach((item, i) => {
      this.tweens.add({
        targets: item,
        scaleX: horizontal ? 1.08 : 0.7,
        scaleY: horizontal ? 0.7 : 1.08,
        alpha: 0,
        duration: 360 + i * 70,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(item)
      });
    });
    [sparkleA, sparkleB].forEach((item, i) => {
      this.tweens.add({
        targets: item,
        angle: 180,
        scale: 2.3 + i * 0.6,
        alpha: 0,
        duration: 420,
        ease: "Back.Out",
        onComplete: () => this.destroyFx(item)
      });
    });
    this.playPopSound(1180);
    return this.wait(300);
  }

  playBombFx(r, c) {
    const x = this.cellX(c);
    const y = this.cellY(r);
    const ring = this.add.circle(x, y, 10, 0xff8fc7, 0.28).setStrokeStyle(5, 0xffe277, 0.95).setDepth(36);
    ring.isFxSprite = true;
    this.fxSprites.add(ring);
    this.tweens.add({
      targets: ring,
      radius: 72,
      alpha: 0,
      duration: 440,
      ease: "Cubic.Out",
      onComplete: () => this.destroyFx(ring)
    });
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const bit = this.addFxRect(x, y, i % 2 ? 8 : 12, i % 2 ? 12 : 8, i % 3 === 0 ? 0x8ee8ff : i % 3 === 1 ? 0xff8fc7 : 0xffe277, 1);
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angle) * 82,
        y: y + Math.sin(angle) * 82,
        angle: 180,
        scale: 0.25,
        alpha: 0,
        duration: 470,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(bit)
      });
    }
    this.playPopSound(420);
    this.time.delayedCall(80, () => this.playPopSound(980));
    return this.wait(390);
  }

  playChocolateFx(r, c, colorType) {
    const x = this.cellX(c);
    const y = this.cellY(r);
    const colorMap = { red: 0xff4f88, blue: 0x56bfff, green: 0x57d97c, yellow: 0xffdf4d, purple: 0xb95cff };
    const tint = colorMap[colorType] || 0xffe277;
    const splash = this.add.circle(x, y, 16, 0x6b311d, 0.65).setStrokeStyle(4, tint, 0.95).setDepth(36);
    splash.isFxSprite = true;
    this.fxSprites.add(splash);
    this.tweens.add({
      targets: splash,
      radius: 58,
      alpha: 0,
      duration: 520,
      ease: "Cubic.Out",
      onComplete: () => this.destroyFx(splash)
    });
    for (let i = 0; i < 10; i++) {
      const bit = this.addFxRect(x, y, 9, 9, i % 2 ? 0x8a4728 : tint, 1);
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angle) * (42 + (i % 3) * 12),
        y: y + Math.sin(angle) * (42 + (i % 2) * 10),
        angle: 90,
        alpha: 0,
        duration: 460,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(bit)
      });
    }
    this.playPopSound(560);
    this.time.delayedCall(90, () => this.playPopSound(1440));
    return this.wait(410);
  }

  playSpecialActivationFx(tile, pos, otherTile) {
    const [r, c] = pos;
    if (tile.special === "stripeRow" || tile.special === "stripeCol") return this.playStripeFx(r, c, tile.special);
    if (tile.special === "bomb") return this.playBombFx(r, c);
    if (tile.special === "chocolate") {
      const color = TYPES.includes(otherTile.type) ? otherTile.type : tile.type;
      return this.playChocolateFx(r, c, color);
    }
    return this.wait(0);
  }

  async playSpecialComboFx(first, second, firstPos, secondPos, comboType, comboData = null) {
    const [r, c] = firstPos;
    const x = this.cellX(c);
    const y = this.cellY(r);
    const labels = {
      chocolateChocolate: "SWEET BOARD CLEAR!",
      chocolateSpecial: comboData?.transformSpecial === "bomb" ? "RANDOM BOMB POWER!" : "RANDOM STRIPE POWER!",
      stripeBomb: "MEGA STRIPE BLAST!",
      stripeStripe: "STRIPE CROSS!",
      bombBomb: "DOUBLE BOMB!"
    };
    const comboDepth = 70;
    const veil = this.add.rectangle(W / 2, this.boardY + this.cell * this.rows / 2, W, this.cell * this.rows + 32, 0x16091f, 0.34).setDepth(comboDepth);
    const label = this.add.text(W / 2, this.boardY + 142, labels[comboType] || "SPECIAL COMBO!", {
      fontSize: 31,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#b218c9",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(comboDepth + 4);
    [veil, label].forEach((item) => {
      item.isFxSprite = true;
      this.fxSprites.add(item);
    });
    label.setScale(0.48);
    this.tweens.add({ targets: label, scale: 1, duration: 260, ease: "Back.Out" });
    this.tweens.add({ targets: [veil, label], alpha: 0, delay: 620, duration: 260, onComplete: () => {
      this.destroyFx(veil);
      this.destroyFx(label);
    } });

    const pulseAt = ([rr, cc], color) => {
      const ring = this.add.circle(this.cellX(cc), this.cellY(rr), 10, color, 0.22).setStrokeStyle(5, color, 1).setDepth(comboDepth + 2);
      ring.isFxSprite = true;
      this.fxSprites.add(ring);
      this.tweens.add({
        targets: ring,
        radius: 42,
        alpha: 0,
        duration: 620,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(ring)
      });
    };
    pulseAt(firstPos, 0xff8fc7);
    pulseAt(secondPos, 0x8ee8ff);

    if (comboType === "stripeStripe" || comboType === "stripeBomb") {
      const rows = comboType === "stripeBomb" ? [r - 1, r, r + 1] : [r];
      const cols = comboType === "stripeBomb" ? [c - 1, c, c + 1] : [c];
      rows.forEach((rr, i) => {
        if (rr < 0 || rr >= this.rows) return;
        const beam = this.addFxRect(W / 2, this.cellY(rr), W + 30, comboType === "stripeBomb" ? 14 : 20, i % 2 ? 0x8ee8ff : 0xff8fc7, 0.9).setDepth(comboDepth + 1);
        this.tweens.add({ targets: beam, scaleX: 1.08, alpha: 0, delay: 180 + i * 70, duration: 520, onComplete: () => this.destroyFx(beam) });
      });
      cols.forEach((cc, i) => {
        if (cc < 0 || cc >= COLS) return;
        const beam = this.addFxRect(this.cellX(cc), this.boardY + this.cell * this.rows / 2, comboType === "stripeBomb" ? 14 : 20, this.cell * this.rows + 28, i % 2 ? 0xff8fc7 : 0x8ee8ff, 0.9).setDepth(comboDepth + 1);
        this.tweens.add({ targets: beam, scaleY: 1.08, alpha: 0, delay: 180 + i * 70, duration: 520, onComplete: () => this.destroyFx(beam) });
      });
    } else if (comboType === "bombBomb") {
      for (let i = 0; i < 3; i++) {
        const ring = this.add.circle(x, y, 12, 0xff8fc7, 0.2).setStrokeStyle(7, i % 2 ? 0x8ee8ff : 0xffe277, 1).setDepth(comboDepth + 1);
        ring.isFxSprite = true;
        this.fxSprites.add(ring);
        this.tweens.add({
          targets: ring,
          radius: 72 + i * 38,
          alpha: 0,
          delay: i * 120,
          duration: 650,
          ease: "Cubic.Out",
          onComplete: () => this.destroyFx(ring)
        });
      }
    } else {
      const chocolate = first.special === "chocolate" ? first : second;
      const other = first.special === "chocolate" ? second : first;
      const color = comboData?.color || (TYPES.includes(other.type) ? other.type : chocolate.type);
      for (let rr = 0; rr < this.rows; rr++) {
        for (let cc = 0; cc < COLS; cc++) {
          const tile = this.board[rr][cc];
          if (comboType === "chocolateChocolate" || (tile && tile.type === color)) {
            this.time.delayedCall((rr + cc) * 28, () => this.burstAt(this.cellX(cc), this.cellY(rr), 0xffe277));
          }
        }
      }
    }

    this.cameras.main.shake(comboType === "stripeBomb" || comboType === "bombBomb" ? 620 : 420, comboType === "bombBomb" ? 0.018 : 0.011);
    this.playPopSound(520);
    this.time.delayedCall(110, () => this.playPopSound(1040));
    this.time.delayedCall(220, () => this.playPopSound(1680));
    await this.wait(900);
  }

  showComboText(combo) {
    this.playComboVoice();
    const label = this.add.text(W / 2, this.boardY + 150, `COMBO x${combo}`, {
      fontSize: 54,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#b218c9",
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(74);
    label.isFxSprite = true;
    this.fxSprites.add(label);
    label.setScale(0.55);
    this.tweens.add({
      targets: label,
      y: label.y - 64,
      scale: 1.22,
      alpha: 0,
      delay: 420,
      duration: 1350,
      ease: "Back.Out",
      onComplete: () => this.destroyFx(label)
    });
  }

  destroyFx(sprite) {
    if (!sprite || sprite.destroyed) return;
    this.tweens.killTweensOf(sprite);
    this.fxSprites.delete(sprite);
    sprite.destroy();
  }

  clearEffects() {
    [...this.fxSprites].forEach((sprite) => this.destroyFx(sprite));
    this.children.list
      .filter((child) => child.isFxSprite)
      .forEach((child) => this.destroyFx(child));
  }

  symbolKey(tile) {
    if (tile.scatter) return "sym-scatter";
    if (tile.chest) return "sym-chest";
    if (tile.special === "stripeRow") return "sym-stripe-row";
    if (tile.special === "stripeCol") return "sym-stripe-col";
    if (tile.special === "bomb") return "sym-bomb";
    if (tile.special === "chocolate") return "sym-chocolate";
    return `sym-${tile.type}`;
  }

  addPixelFrame(x, y, w, h, options = {}) {
    const group = this.add.group();
    const variant = options.variant || "panel";
    const pink = options.pink || 0xff8fc7;
    const blue = options.blue || 0x8ee8ff;
    const yellow = options.yellow || 0xffe277;
    const bg = options.bg || 0x653184;
    const bgAlpha = options.bgAlpha ?? 0.58;
    const t = options.thickness || 4;
    const add = (item) => {
      group.add(item);
      return item;
    };
    add(this.add.rectangle(x, y, w, h, bg, bgAlpha));
    add(this.add.rectangle(x, y - h / 2 + t / 2, w, t, pink, 1));
    add(this.add.rectangle(x, y + h / 2 - t / 2, w, t, pink, 1));
    add(this.add.rectangle(x - w / 2 + t / 2, y, t, h, pink, 1));
    add(this.add.rectangle(x + w / 2 - t / 2, y, t, h, pink, 1));
    add(this.add.rectangle(x, y - h / 2 + t + 2, Math.max(20, w - 22), 2, 0xffffff, 0.42));
    add(this.add.rectangle(x, y + h / 2 - t - 2, Math.max(20, w - 22), 2, 0x351352, 0.32));

    if (variant === "board") {
      add(this.add.rectangle(x - w / 2 + 23, y - h / 2 + 10, 44, 4, blue, 1));
      add(this.add.rectangle(x + w / 2 - 36, y + h / 2 - 10, 64, 4, blue, 1));
      add(this.add.rectangle(x - w / 2 + 52, y + h / 2 - 10, 58, 4, yellow, 1));
      [[18, 18, blue], [w - 18, 18, yellow], [18, h - 18, pink], [w - 18, h - 18, yellow]].forEach(([cx, cy, color]) => {
        add(this.add.rectangle(x - w / 2 + cx, y - h / 2 + cy, 11, 11, color, 1));
        add(this.add.rectangle(x - w / 2 + cx, y - h / 2 + cy, 6, 6, 0xffffff, 0.5));
      });
    } else if (variant === "order") {
      add(this.add.rectangle(x - w / 2 + 44, y - h / 2 + t + 2, 34, 3, blue, 1));
      add(this.add.rectangle(x + w / 2 - 42, y + h / 2 - t - 2, 40, 3, blue, 1));
      add(this.add.rectangle(x - w / 2 + 78, y + h / 2 - t - 2, 46, 3, yellow, 1));
      add(this.add.rectangle(x - w / 2 + 18, y, 8, 18, blue, 1));
      add(this.add.rectangle(x + w / 2 - 18, y, 8, 18, yellow, 1));
      add(this.add.rectangle(x - w / 2 + 18, y - 11, 7, 7, 0xffffff, 0.55));
      add(this.add.rectangle(x + w / 2 - 18, y + 11, 7, 7, 0xffffff, 0.45));
    } else if (variant === "bottom") {
      add(this.add.rectangle(x - w / 2 + w * 0.33, y, 3, h - 22, blue, 0.55));
      add(this.add.rectangle(x - w / 2 + w * 0.66, y, 3, h - 22, yellow, 0.52));
      add(this.add.rectangle(x - w / 2 + 36, y - h / 2 + t + 3, 54, 3, blue, 1));
      add(this.add.rectangle(x + w / 2 - 72, y + h / 2 - t - 3, 76, 3, blue, 1));
      add(this.add.rectangle(x - w / 2 + 80, y + h / 2 - t - 3, 70, 3, yellow, 1));
      add(this.add.rectangle(x - w / 2 + 18, y + h / 2 - 18, 11, 11, blue, 1));
      add(this.add.rectangle(x + w / 2 - 18, y + h / 2 - 18, 8, 8, 0xffffff, 0.45));
    } else {
      add(this.add.rectangle(x - w / 2 + 22, y - h / 2 + t + 2, 42, 3, blue, 1));
      add(this.add.rectangle(x + w / 2 - 38, y + h / 2 - t - 2, 54, 3, blue, 1));
      add(this.add.rectangle(x - w / 2 + 54, y + h / 2 - t - 2, 48, 3, yellow, 1));
      add(this.add.rectangle(x + w / 2 - 16, y - h / 2 + 16, 12, 12, yellow, 1));
      add(this.add.rectangle(x - w / 2 + 16, y + h / 2 - 16, 12, 12, blue, 1));
      add(this.add.rectangle(x - w / 2 + 16, y - h / 2 + 16, 8, 8, 0xffffff, 0.65));
      add(this.add.rectangle(x + w / 2 - 16, y + h / 2 - 16, 8, 8, 0xffffff, 0.55));
    }
    return group;
  }

  createUi() {
    this.freeSceneWash = this.add.rectangle(W / 2, H / 2, W, H, 0x4f1220, 0.58);
    this.mainFrameArt = this.add.image(W / 2, H / 2 + 8, "ui-start-console-v2")
      .setDisplaySize(W - 18, H - 8)
      .setAlpha(0.96)
      .setDepth(0);
    this.logoShadow = this.add.text(W / 2 + 4, 34, "CANDY", {
      fontFamily: "Trebuchet MS",
      fontSize: 42,
      fontStyle: "900",
      color: "#9b3a00",
      stroke: "#4b125b",
      strokeThickness: 8
    }).setOrigin(0.5);
    this.titleText = this.add.text(W / 2, 29, "CANDY", {
      fontFamily: "Trebuchet MS",
      fontSize: 42,
      fontStyle: "900",
      color: "#ffdf3f",
      stroke: "#ffffff",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40);
    this.logoRibbon = this.add.rectangle(W / 2, 68, 206, 28, 0xa51ddb).setStrokeStyle(2, 0xff85ff, 0.95).setDepth(39);
    this.logoSubText = this.add.text(W / 2, 67, "ORDERS", {
      fontFamily: "Trebuchet MS",
      fontSize: 24,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#4b125b",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(41);
    this.titleLogoArt = this.add.image(W / 2, 66, "ui-logo-v2")
      .setDisplaySize(230, 90)
      .setDepth(40);
    [this.logoShadow, this.titleText, this.logoRibbon, this.logoSubText].forEach((item) => item.setVisible(false));
    this.ordersHeader = this.add.text(W / 2, 88, "", {
      fontSize: 15,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.betFrameArt = this.add.rectangle(W / 2, 368, 1, 1, 0x000000, 0);
    this.betPanel = this.add.rectangle(W / 2, 374, W - 96, 156, 0x6a1422, 0);
    this.betTopGlow = this.add.rectangle(W / 2, 289, W - 102, 8, 0x8ee8ff, 0);
    this.betBottomGlow = this.add.rectangle(W / 2, 459, W - 104, 8, 0xff8fc7, 0);
    this.betHeaderText = this.add.text(W / 2, 324, "SET YOUR BET", {
      fontSize: 21,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.betHintText = this.add.text(W / 2, 357, "Each move spends this amount", {
      fontSize: 13,
      fontStyle: "800",
      color: "#ffffff",
      stroke: "#351352",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.walletText = this.add.text(W / 2, 274, "", {
      fontSize: 18,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#2b1248",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(71);

    this.betPillShadow = this.add.rectangle(W / 2, 410, 138, 68, 0x3b0c16, 0);
    this.betPill = this.add.rectangle(W / 2, 402, 142, 68, 0x5a1020, 0).setStrokeStyle(4, 0xffe277, 0);
    const betMinusX = 114;
    const betPlusX = 332;
    this.betMinusShadow = this.add.rectangle(betMinusX, 408, 62, 58, 0x3b0c16, 0);
    this.betMinus = this.add.rectangle(betMinusX, 400, 62, 58, 0xff4f88, 0).setStrokeStyle(4, 0xffffff, 0);
    this.betMinusText = this.add.rectangle(betMinusX, 402, 24, 5, 0xffffff, 1).setOrigin(0.5);
    this.betText = this.add.text(W / 2, 402, "", {
      fontSize: 28,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#2b1248",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.betPlusShadow = this.add.rectangle(betPlusX, 408, 62, 58, 0x3b0c16, 0);
    this.betPlus = this.add.rectangle(betPlusX, 400, 62, 58, 0x45d66f, 0).setStrokeStyle(4, 0xffffff, 0);
    this.betPlusText = this.add.container(betPlusX, 402);
    this.betPlusText.add(this.add.rectangle(0, 0, 24, 5, 0xffffff, 1).setOrigin(0.5));
    this.betPlusText.add(this.add.rectangle(0, 0, 5, 24, 0xffffff, 1).setOrigin(0.5));
    this.betRangeText = this.add.text(W / 2, 456, `MIN ${MIN_BET}   STEP ${BET_STEP}   MAX ${MAX_BET}`, {
      fontSize: 13,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.betMinus.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.adjustBet(-BET_STEP));
    this.betPlus.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.adjustBet(BET_STEP));

    this.orderRows = [];
    this.ordersPanelArt = this.add.image(W / 2, 166, "ui-bonus-orders-v2")
      .setDisplaySize(W - 10, 169)
      .setDepth(8);
    for (let i = 0; i < 3; i++) {
      const rowLayout = ORDER_ROW_LAYOUT[i];
      const rowCenter = rowLayout.y;
      const glow = this.add.rectangle(W / 2, rowCenter, W - 20, 39, 0xfff06a, 0).setStrokeStyle(3, 0xffffff, 0).setDepth(10);
      const panel = this.add.rectangle(W / 2, rowCenter, W - 102, 34, 0x5e1422, 0.08).setDepth(10);
      const frameArt = this.add.rectangle(W / 2, rowCenter, W - 30, 39, 0x000000, 0).setDepth(10);
      const dotA = this.add.rectangle(82, rowCenter - 12, 5, 5, 0xfff06a, 0).setDepth(12);
      const dotB = this.add.rectangle(W - 98, rowCenter + 12, 5, 5, 0x5df2ff, 0).setDepth(12);
      const icon = this.add.text(42, rowCenter, "", { fontSize: 24 }).setOrigin(0.5).setVisible(false);
      const label = this.add.text(rowLayout.textX, rowCenter + rowLayout.labelDy, "", { fontSize: 12, fontStyle: "800", color: "#fff" }).setOrigin(0, 0.5).setDepth(13);
      const progress = this.add.text(rowLayout.textX, rowCenter + rowLayout.progressDy, "", {
        fontSize: 11,
        fontStyle: "800",
        color: "#fff4b8",
        stroke: "#351352",
        strokeThickness: 2
      }).setOrigin(0, 0.5).setDepth(13);
      const rewardPlate = this.add.rectangle(rowLayout.rewardX, rowCenter, 78, 29, 0x4f1020, 0.04)
        .setStrokeStyle(1, 0xffffff, 0).setDepth(11);
      const reward = this.add.text(rowLayout.rewardX, rowCenter, "", {
        fontSize: 12,
        fontStyle: "900",
        color: "#fff4d2",
        align: "center"
      }).setOrigin(0.5).setFixedSize(74, 18).setDepth(13);
      const keyRewardIcon = this.add.image(W - 56, rowCenter, "sym-key");
      keyRewardIcon.setScale(16 / Math.max(keyRewardIcon.width, keyRewardIcon.height));
      keyRewardIcon.setVisible(false);
      this.orderRows.push({ glow, frameArt, panel, dotA, dotB, icon, label, progress, rewardPlate, reward, keyRewardIcon, iconGroup: null, nearTweens: [], rowCenter, rowLayout });
    }
    this.createConveyorUi();

    this.statusText = this.add.text(170, 195, "Choose bet, then start", {
      fontSize: 13,
      fontStyle: "800",
      color: "#ffffff",
      stroke: "#31164c",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(41);

    this.keyHudPanel = this.add.rectangle(W - 55, 195, 94, 28, 0x5a1020, 0.9).setStrokeStyle(2, 0xffe277, 0.85);
    this.keyHudIcon = this.add.image(W - 91, 195, "sym-scatter");
    this.keyHudIcon.setScale(29 / Math.max(this.keyHudIcon.width, this.keyHudIcon.height));
    this.keyHudText = this.add.text(W - 41, 195, "0/3", {
      fontSize: 15,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.freeUiItems = [];
    const freeLeftX = 74;
    const freeCenterX = W / 2;
    const freeRightX = W - 74;
    this.freeTitleText = this.add.text(freeLeftX, 48, "", {
      fontSize: 17,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 5,
      align: "center"
    }).setOrigin(0.5).setDepth(41).setFixedSize(86, 24);
    this.freeHudPanel = this.add.image(W / 2, 47, "ui-bonus-hud-v2")
      .setDisplaySize(W - 14, 91)
      .setAlpha(1)
      .setDepth(39);
    this.freeMovesText = this.add.text(freeLeftX, 36, "MOVE:15", {
      fontSize: 13,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(41).setFixedSize(104, 22);
    this.freeScatterIcon = this.add.image(freeCenterX + 34, 48, "sym-scatter");
    this.freeScatterIcon.setScale(20 / Math.max(this.freeScatterIcon.width, this.freeScatterIcon.height)).setDepth(41).setVisible(false);
    this.freeScatterText = this.add.text(freeCenterX, 49, "SCATTER:0/3", {
      fontSize: 13,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(41).setFixedSize(146, 22);
    this.freeWinText = this.add.text(freeRightX, 49, "WIN 0", {
      fontSize: 12,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(41).setFixedSize(68, 22);
    this.freeUiItems.push(this.freeHudPanel, this.freeMovesText, this.freeScatterText, this.freeWinText);

    this.mainButton = this.add.rectangle(W / 2, 526, 250, 62, 0xffd94c, 0).setStrokeStyle(4, 0xffffff, 0);
    this.mainButton.setInteractive({ useHandCursor: true });
    this.mainLabel = this.add.text(W / 2, 526, "START", {
      fontSize: 30,
      fontStyle: "900",
      color: "#5c1d7f",
      stroke: "#ffffff",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.mainButton.on("pointerdown", () => {
      if (!this.busy && !this.sessionActive) this.startSession();
    });
    this.bonusBuyButton = this.add.rectangle(W / 2, 627, 250, 52, 0x19b7d4, 0).setStrokeStyle(4, 0xffffff, 0);
    this.bonusBuyButton.setInteractive({ useHandCursor: true });
    this.bonusBuyLabel = this.add.text(W / 2, 627, "", {
      fontSize: 18,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#07354f",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.bonusBuyButton.on("pointerdown", () => {
      if (!this.busy && !this.sessionActive) this.runFlow(this.buyBonusGame());
    });

    this.winText = this.add.text(W / 2, 620, "", {
      fontSize: 18,
      fontStyle: "900",
      color: "#fff9cb",
      align: "center",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.statusFrameArt = this.add.image(W / 2, 658, "ui-bottom-hud-v2")
      .setDisplaySize(W - 14, 78)
      .setDepth(7);
    const leftInfoX = 70;
    const rightInfoX = W - 70;
    const infoLabelY = 651;
    const infoValueY = 666;
    const centerInfoY = 650;
    this.walletMeterGlow = this.add.rectangle(leftInfoX, 659, 92, 42, 0x8ee8ff, 0).setStrokeStyle(3, 0xffffff, 0).setDepth(8);
    this.gameWalletText = this.add.text(leftInfoX, infoLabelY, "WALLET", {
      fontSize: 13,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(11);
    this.gameWalletValueText = this.add.text(leftInfoX, infoValueY, "", {
      fontSize: 12,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(11);
    this.walletGainText = this.add.text(leftInfoX, 674, "", {
      fontSize: 14,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(11);
    this.gameBetText = this.add.text(rightInfoX, infoLabelY, "BET", {
      fontSize: 13,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(11);
    this.gameBetValueText = this.add.text(rightInfoX, infoValueY, "", {
      fontSize: 12,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5).setDepth(11);
    this.gameBetButton = this.add.rectangle(rightInfoX, 659, 92, 58, 0xffffff, 0.001)
      .setDepth(12)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.showGameBetMenu());
    this.winMeterGlow = this.add.rectangle(W / 2, 658, 126, 40, 0xfff06a, 0).setStrokeStyle(3, 0xfff06a, 0).setDepth(8);
    this.winMeterPanel = this.add.rectangle(W / 2, centerInfoY, 116, 38, 0x5a1020, 0).setStrokeStyle(2, 0xfff0aa, 0).setDepth(9);
    this.stepsText = this.add.text(W / 2, centerInfoY, "", {
      fontSize: 19,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(11);
    this.winGainText = this.add.text(W / 2, 674, "", {
      fontSize: 15,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#7a2d93",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(11);
    this.autoButton = this.add.rectangle(W / 2, 670, 108, 22, 0x6f2436, 0.98)
      .setStrokeStyle(2, 0xffd2df, 0.9)
      .setDepth(12)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.toggleAutoPlay());
    this.autoStateDot = this.add.circle(W / 2 - 39, 670, 5, 0xff8bab, 1)
      .setStrokeStyle(2, 0xffffff, 0.85)
      .setDepth(13);
    this.autoButtonText = this.add.text(W / 2 + 7, 670, "AUTO OFF", {
      fontSize: 11,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(13);
  }

  createBoardFrame() {
    if (this.boardFrameItems) {
      this.boardFrameItems.forEach((item) => {
        if (!item) return;
        if (item.getChildren) [...item.getChildren()].forEach((child) => child.destroy());
        item.destroy();
      });
    }
    this.boardFrameItems = [];
    const boardH = this.cell * this.rows;
    const isFree = this.gameMode === "free";
    const frameW = isFree ? W - 14 : 418;
    const frameH = isFree ? Math.round(frameW / 0.82) : frameW;
    const frameKey = isFree ? "ui-bonus-board-frame-v2" : "ui-main-board-frame-v2";
    const frameOffsetY = isFree ? -3 : 0;
    const backdropW = isFree ? 388 : 372;
    const backdropH = isFree ? Math.round(backdropW / 0.82) : backdropW;
    const backdropKey = isFree ? "ui-bonus-board-backdrop-v2" : "ui-main-board-backdrop-v2";
    const backdrop = this.add.image(W / 2, this.boardY + boardH / 2 + frameOffsetY, backdropKey)
      .setDisplaySize(backdropW, backdropH)
      .setDepth(0.7)
      .setAlpha(1);
    this.boardFrameItems.push(backdrop);
    const boardFrame = this.add.image(W / 2, this.boardY + boardH / 2 + frameOffsetY, frameKey)
      .setDisplaySize(frameW, frameH)
      .setDepth(2)
      .setAlpha(1);
    this.boardFrameItems.push(boardFrame);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tileInset = this.gameMode === "free" ? 4 : 4;
        this.boardFrameItems.push(this.add.rectangle(this.cellX(c), this.cellY(r), this.cell - tileInset, this.cell - tileInset, 0x4f1020, 0.2).setStrokeStyle(1, 0xfff4d2, 0.17).setDepth(1));
      }
    }
  }

  setBoardVisible(visible) {
    this.boardFrameItems.forEach((item) => item.setVisible(visible));
    this.sprites.flat().forEach((sprite) => {
      if (sprite) sprite.getChildren().forEach((child) => child.setVisible(visible));
    });
  }

  showPreStart() {
    this.clearAutoTimer();
    this.autoPlayEnabled = false;
    this.autoUiSuppressed = false;
    this.closePopup();
    this.clearEffects();
    this.clearOrderIcons();
    this.busy = false;
    this.resolvingMove = false;
    this.sessionActive = false;
    this.inputOpen = false;
    this.input.setDefaultCursor("none");
    this.clearSelection();
    this.gameMode = "main";
    this.savedMainOrders = null;
    this.stopFreeMusic();
    this.freeBoughtMode = false;
    this.bonusPending = false;
    this.configureBoard(MAIN_ROWS);
    this.createBoardFrame();
    this.movesMade = 0;
    this.paidMovesMade = 0;
    this.totalRemoved = 0;
    this.removedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.cascadeCount = 0;
    this.chocolatesCreated = 0;
    this.comboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.ordersCompleted = 0;
    this.sessionReward = 0;
    this.paidBetTotal = 0;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.scatterDropQueued = false;
    this.displayedWin = 0;
    this.lastWinAmount = 0;
    this.displayedWallet = this.wallet;
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    if (this.winCounterTween) this.winCounterTween.stop();
    this.winCounterTween = null;
    this.winGainText.setText("").setAlpha(1).setY(622);
    this.walletGainText.setText("").setAlpha(1).setY(622);
    this.orders = [];
    this.clearSprites();
    this.betAmount = Phaser.Math.Clamp(this.betAmount, MIN_BET, Math.max(MIN_BET, Math.min(MAX_BET, this.wallet)));
    this.winText.setText("");
    this.statusText.setText("Choose bet, then start");
    this.updateKeyUi();
    this.orderRows.forEach((row, i) => {
      this.setOrderNearState(row, false);
      row.panel.setFillStyle(0xffffff, 0.11);
      row.icon.setText("-");
      row.label.setText(i === 0 ? "Easy order appears after start" : i === 1 ? "Medium order appears after start" : "Hard order appears after start");
      row.progress.setText("Progress locked");
      row.reward.setText("--");
    });
    this.updateBetUi();
    this.setMode("bet");
  }

  startSession() {
    if (this.wallet < this.betAmount) {
      this.statusText.setText("Not enough wallet");
      return;
    }
    this.startCuteMusic();
    this.clearAutoTimer();
    this.autoPlayEnabled = false;
    this.autoUiSuppressed = false;
    this.closePopup();
    this.clearEffects();
    this.clearOrderIcons();
    this.busy = false;
    this.resolvingMove = false;
    this.sessionActive = true;
    this.inputOpen = true;
    this.selected = null;
    this.gameMode = "main";
    this.savedMainOrders = null;
    this.freeBoughtMode = false;
    this.bonusPending = false;
    this.configureBoard(MAIN_ROWS);
    this.createBoardFrame();
    this.movesMade = 0;
    this.paidMovesMade = 0;
    this.totalRemoved = 0;
    this.removedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.cascadeCount = 0;
    this.chocolatesCreated = 0;
    this.comboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.ordersCompleted = 0;
    this.sessionReward = 0;
    this.paidBetTotal = 0;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.displayedWin = 0;
    this.lastWinAmount = 0;
    this.displayedWallet = this.wallet;
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    if (this.winCounterTween) this.winCounterTween.stop();
    this.winCounterTween = null;
    this.winGainText.setText("").setAlpha(1).setY(622);
    this.walletGainText.setText("").setAlpha(1).setY(622);
    this.winText.setText("");
    this.statusText.setText("Complete orders.");
    this.updateKeyUi();
    this.generateOrders();
    this.generateBoard();
    this.renderBoard(true);
    this.updateOrders();
    this.updateBetUi();
    this.setMode("game");
  }

  async buyBonusGame() {
    const cost = this.betAmount * BONUS_BUY_COST_MULT;
    if (this.wallet < cost) {
      this.statusText.setText("Not enough wallet for bonus");
      this.playBetSound(0, false);
      return;
    }
    this.closePopup();
    this.clearAutoTimer();
    this.autoPlayEnabled = false;
    this.autoUiSuppressed = false;
    this.clearEffects();
    this.clearOrderIcons();
    this.stopCuteMusic();
    this.bonusPending = false;
    this.wallet -= cost;
    this.paidBetTotal = cost;
    this.movesMade = 0;
    this.paidMovesMade = 0;
    this.totalRemoved = 0;
    this.removedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.cascadeCount = 0;
    this.chocolatesCreated = 0;
    this.comboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.ordersCompleted = 0;
    this.sessionReward = 0;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.scatterDropQueued = false;
    this.displayedWin = 0;
    this.lastWinAmount = 0;
    this.displayedWallet = this.wallet;
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    if (this.winCounterTween) this.winCounterTween.stop();
    this.winCounterTween = null;
    this.winGainText.setText("").setAlpha(1).setY(622);
    this.walletGainText.setText("").setAlpha(1).setY(622);
    this.winText.setText("");
    this.orders = [];
    this.updateBetUi();
    this.playUnlockSound();
    await this.startFreeGame({ bought: true });
  }

  setMode(mode) {
    this.currentUiMode = mode;
    const isBet = mode === "bet";
    const isFree = mode === "free";
    const isGame = mode === "game" || isFree;
    [
      this.logoShadow,
      this.titleText,
      this.logoRibbon,
      this.logoSubText,
      this.betFrameArt,
      this.betPanel,
      this.betTopGlow,
      this.betBottomGlow,
      this.betHeaderText,
      this.betHintText,
      this.walletText,
      this.betPillShadow,
      this.betPill,
      this.betMinusShadow,
      this.betMinus,
      this.betMinusText,
      this.betText,
      this.betPlusShadow,
      this.betPlus,
      this.betPlusText,
      this.betRangeText,
      this.mainButton,
      this.mainLabel,
      this.bonusBuyButton,
      this.bonusBuyLabel
    ]
      .forEach((item) => item.setVisible(isBet));
    if (this.mainFrameArt) this.mainFrameArt.setVisible(isBet);
    [this.logoShadow, this.titleText, this.logoRibbon, this.logoSubText].forEach((item) => item.setVisible(false));
    if (this.titleLogoArt) this.titleLogoArt.setVisible(mode === "bet");
    this.freeSceneWash.setVisible(isFree);
    this.ordersHeader.setVisible(isFree);
    this.ordersHeader.setText(isFree ? "BONUS ORDERS" : "");
    this.ordersHeader.setY(96).setDepth(15);
    if (this.ordersPanelArt) {
      this.ordersPanelArt
        .setVisible(isFree)
        .setPosition(W / 2, 166)
        .setDisplaySize(W - 10, 169)
        .setDepth(8);
    }
    const showClassicOrders = isFree;
    this.orderRows.forEach((row) => Object.entries(row).forEach(([key, item]) => {
      if (item && item.setVisible) item.setVisible(key === "keyRewardIcon" ? false : showClassicOrders);
    }));
    this.orderRows.forEach((row) => {
      if (row.iconGroup) {
        row.iconGroup.getChildren().forEach((child) => child.setVisible(showClassicOrders));
      }
    });
    this.setConveyorVisible(mode === "game" && !isFree);
    this.statusText.setVisible(mode === "game");
    this.statusText.setX(isFree ? W / 2 : 170);
    this.winText.setVisible(mode === "game");
    this.statusFrameArt.setVisible(mode === "game");
    this.walletMeterGlow.setVisible(mode === "game");
    this.gameWalletText.setVisible(mode === "game");
    this.gameWalletValueText.setVisible(mode === "game");
    this.walletGainText.setVisible(mode === "game");
    this.gameBetText.setVisible(mode === "game");
    this.gameBetValueText.setVisible(mode === "game");
    this.gameBetButton.setVisible(mode === "game");
    this.winMeterGlow.setVisible(mode === "game");
    this.winMeterPanel.setVisible(mode === "game");
    this.stepsText.setVisible(mode === "game");
    this.winGainText.setVisible(mode === "game");
    this.autoButton.setVisible(mode === "game" || isFree);
    this.autoStateDot.setVisible(mode === "game" || isFree);
    this.autoButtonText.setVisible(mode === "game" || isFree);
    [this.keyHudPanel, this.keyHudIcon, this.keyHudText].forEach((item) => item.setVisible(mode === "game"));
    this.freeUiItems.forEach((item) => item.setVisible(isFree));
    this.setBoardVisible(isGame);
    this.updateAutoUi();
  }

  adjustBet(delta) {
    if (this.sessionActive || this.busy) return;
    const cap = Math.min(MAX_BET, this.wallet);
    const nextBet = Phaser.Math.Clamp(this.betAmount + delta, MIN_BET, cap);
    const changed = nextBet !== this.betAmount;
    this.betAmount = nextBet;
    this.playBetSound(delta, changed);
    this.pulseBetControl(delta, changed);
    this.updateBetUi();
  }

  pulseBetControl(delta, changed) {
    const button = delta > 0 ? this.betPlus : this.betMinus;
    const label = delta > 0 ? this.betPlusText : this.betMinusText;
    const scale = changed ? 1.14 : 0.95;
    [label, this.betText].forEach((target) => {
      this.tweens.killTweensOf(target);
      this.tweens.add({
        targets: target,
        scale,
        duration: 70,
        yoyo: true,
        ease: changed ? "Back.Out" : "Sine.Out"
      });
    });
    this.burstAt(button.x, button.y, changed ? 0xffe277 : 0x8ee8ff);
  }

  animateWinMeter(amount) {
    if (amount <= 0) return;
    if (this.winCounterTween) this.winCounterTween.stop();
    this.autoUiSuppressed = true;
    this.updateAutoUi();
    this.lastWinAmount = amount;
    const counter = { value: this.displayedWin };
    const target = this.sessionReward;
    this.playCoinSpraySound();
    this.stepsText.setY(650).setFontSize(16).setText(`WIN ${Math.round(this.displayedWin)}`);
    this.winGainText.setText(`+${amount}`).setAlpha(1).setScale(0.7).setY(622);
    this.winMeterGlow.setFillStyle(0xfff06a, 0.34).setStrokeStyle(4, 0xffffff, 0.95).setAlpha(1).setScale(1);
    this.tweens.killTweensOf([this.winMeterGlow, this.winMeterPanel, this.stepsText, this.winGainText]);
    this.tweens.add({
      targets: [this.winMeterPanel, this.stepsText],
      scale: 1.16,
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: "Back.Out"
    });
    this.tweens.add({
      targets: this.winMeterGlow,
      scaleX: 1.22,
      scaleY: 1.3,
      alpha: 0,
      duration: 980,
      ease: "Cubic.Out"
    });
    this.tweens.add({
      targets: this.winGainText,
      y: 594,
      scale: 1.15,
      alpha: 0,
      delay: 650,
      duration: 850,
      ease: "Cubic.Out",
      onComplete: () => this.winGainText.setY(622)
    });
    this.winCounterTween = this.tweens.add({
      targets: counter,
      value: target,
      duration: 2800,
      ease: "Sine.Out",
      onUpdate: () => {
        this.displayedWin = counter.value;
        this.stepsText.setText(`WIN ${Math.round(counter.value)}`);
      },
      onComplete: () => {
        this.displayedWin = target;
        this.winCounterTween = null;
        this.autoUiSuppressed = false;
        this.updateWinMeterLabel();
        this.updateAutoUi();
      }
    });
    for (let i = 0; i < 36; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const startX = W / 2 + side * (86 + (i % 4) * 8);
      const coin = this.add.image(startX, 639, "fx-coin").setDepth(10);
      const size = i % 4 === 0 ? 30 : i % 3 === 0 ? 24 : 19;
      const baseScale = size / Math.max(coin.width, coin.height);
      coin.setScale(baseScale);
      coin.isFxSprite = true;
      this.fxSprites.add(coin);
      const spread = side * (94 + (i % 7) * 13);
      const peakY = 468 - (i % 6) * 24;
      const delay = i * 62;
      const trail = this.add.circle(startX, 639, i % 4 === 0 ? 5 : 3, 0xfff06a, 0.7).setDepth(9);
      trail.isFxSprite = true;
      this.fxSprites.add(trail);
      this.tweens.add({
        targets: trail,
        x: W / 2 + spread * 0.86,
        y: peakY + 28,
        alpha: 0,
        delay: delay + 80,
        duration: 620,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(trail)
      });
      this.tweens.add({
        targets: coin,
        x: W / 2 + spread,
        y: peakY,
        angle: 360,
        scaleX: baseScale * 0.12,
        scaleY: baseScale * 1.08,
        delay,
        duration: 680 + (i % 4) * 70,
        ease: "Cubic.Out",
        onComplete: () => {
          this.tweens.add({
            targets: coin,
            x: coin.x + side * (18 + (i % 4) * 8),
            y: 682,
            angle: 720,
            scaleX: baseScale,
            scaleY: baseScale,
            alpha: 0,
            duration: 780 + (i % 5) * 70,
            ease: "Cubic.In",
            onComplete: () => {
              if (i % 9 === 0) this.playCoinDing(1900 + (i % 3) * 180, 0.022);
              this.burstAt(W / 2 + side * 54, 667, 0xfff06a);
              this.destroyFx(coin);
            }
          });
        }
      });
    }
  }

  animateWalletMeter(amount) {
    if (amount <= 0) return;
    if (this.walletCounterTween) this.walletCounterTween.stop();
    const counter = { value: this.displayedWallet };
    const target = this.wallet;
    this.walletGainText.setText(`+${amount}`).setAlpha(1).setScale(0.7).setY(622);
    this.walletMeterGlow.setFillStyle(0x8ee8ff, 0.34).setStrokeStyle(3, 0xffffff, 0.95).setAlpha(1).setScale(1);
    this.tweens.killTweensOf([this.walletMeterGlow, this.gameWalletText, this.gameWalletValueText, this.walletGainText]);
    this.tweens.add({
      targets: [this.gameWalletText, this.gameWalletValueText],
      scale: 1.16,
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: "Back.Out"
    });
    this.tweens.add({
      targets: this.walletMeterGlow,
      scaleX: 1.18,
      scaleY: 1.22,
      alpha: 0,
      duration: 1100,
      ease: "Cubic.Out"
    });
    this.tweens.add({
      targets: this.walletGainText,
      y: 594,
      scale: 1.12,
      alpha: 0,
      delay: 900,
      duration: 900,
      ease: "Cubic.Out",
      onComplete: () => this.walletGainText.setY(622)
    });
    this.walletCounterTween = this.tweens.add({
      targets: counter,
      value: target,
      duration: 2800,
      ease: "Sine.Out",
      onUpdate: () => {
        this.displayedWallet = counter.value;
        this.gameWalletText.setText("WALLET");
        this.gameWalletValueText.setText(`${Math.round(counter.value)}`);
      },
      onComplete: () => {
        this.displayedWallet = target;
        this.gameWalletText.setText("WALLET");
        this.gameWalletValueText.setText(`${target}`);
        this.walletCounterTween = null;
      }
    });
    for (let i = 0; i < 8; i++) {
      const coin = this.add.image(W / 2 + ((i % 3) - 1) * 22, 610 + (i % 2) * 10, "fx-coin").setDepth(10);
      const baseScale = (i % 3 === 0 ? 21 : 16) / Math.max(coin.width, coin.height);
      coin.setScale(baseScale);
      coin.isFxSprite = true;
      this.fxSprites.add(coin);
      this.tweens.add({
        targets: coin,
        x: 70 + ((i % 3) - 1) * 8,
        y: 666,
        angle: 360,
        scaleX: baseScale * 0.12,
        alpha: 0,
        delay: 360 + i * 95,
        duration: 760,
        ease: "Cubic.In",
        onComplete: () => {
          if (i % 4 === 0) this.playCoinDing(1650 + (i % 3) * 160, 0.024);
          this.burstAt(70, 666, 0x8ee8ff);
          this.destroyFx(coin);
        }
      });
    }
  }

  updateWinMeterLabel() {
    if (this.winCounterTween) {
      this.stepsText.setY(650).setFontSize(16).setText(`WIN ${Math.round(this.displayedWin)}`);
      return;
    }
    this.stepsText.setY(650).setFontSize(10).setText(`LAST WIN: ${this.lastWinAmount}`);
  }

  updateAutoUi() {
    if (!this.autoButton || !this.autoButtonText || !this.autoStateDot) return;
    const isFree = this.currentUiMode === "free";
    const visible = (this.currentUiMode === "game" || isFree) && !this.autoUiSuppressed;
    const buttonX = isFree ? 74 : W / 2;
    const buttonY = isFree ? 66 : 670;
    this.autoButton.setPosition(buttonX, buttonY).setDisplaySize(isFree ? 90 : 108, isFree ? 18 : 24);
    this.autoStateDot.setPosition(buttonX - (isFree ? 32 : 39), buttonY);
    this.autoButtonText.setPosition(buttonX + (isFree ? 6 : 7), buttonY).setFontSize(isFree ? 10 : 11);
    this.autoButton.setVisible(visible);
    this.autoStateDot.setVisible(visible);
    this.autoButtonText.setVisible(visible);
    this.autoButton
      .setFillStyle(this.autoPlayEnabled ? 0x168a62 : 0x6f2436, 0.96)
      .setStrokeStyle(2, this.autoPlayEnabled ? 0x8effcf : 0xffd2df, 0.92);
    this.autoStateDot
      .setFillStyle(this.autoPlayEnabled ? 0x8effcf : 0xff8bab, 1)
      .setStrokeStyle(2, 0xffffff, this.autoPlayEnabled ? 1 : 0.82);
    this.autoButtonText.setText(this.autoPlayEnabled ? "AUTO ON" : "AUTO OFF");
  }

  updateBetUi() {
    const cap = Math.min(MAX_BET, this.wallet);
    const atMin = this.betAmount <= MIN_BET;
    const atMax = this.betAmount >= cap;
    this.walletText.setText(`WALLET ${this.wallet}`);
    this.betText.setText(`BET ${this.betAmount}`);
    this.gameWalletText.setText("WALLET");
    this.gameWalletValueText.setText(`${Math.round(this.displayedWallet)}`);
    this.gameBetText.setText(this.gameMode === "free" ? "FREE" : "BET");
    this.gameBetValueText.setText(this.gameMode === "free" ? `${this.freeMovesLeft}` : `${this.betAmount}`);
    if (this.gameMode === "free") this.stepsText.setY(660).setFontSize(14).setText(`BONUS WIN: ${this.freeReward}`);
    else this.updateWinMeterLabel();
    this.betMinus.setFillStyle(atMin ? 0x9a4666 : 0xff4f88, 0);
    this.betPlus.setFillStyle(atMax ? 0x3f8a55 : 0x45d66f, 0);
    this.betMinus.setAlpha(1);
    this.betMinusText.setAlpha(atMin ? 0.72 : 1);
    this.betPlus.setAlpha(1);
    this.betPlusText.setAlpha(atMax ? 0.72 : 1);
    this.mainLabel.setText("START");
    this.mainButton.setFillStyle(0xffd94c, 0);
    const bonusCost = this.betAmount * BONUS_BUY_COST_MULT;
    const canBuyBonus = this.wallet >= bonusCost;
    this.bonusBuyLabel.setText(`BONUS ${bonusCost}`);
    this.bonusBuyButton.setFillStyle(canBuyBonus ? 0x19b7d4 : 0x34606f, 0);
    this.bonusBuyButton.setAlpha(1);
    this.bonusBuyLabel.setAlpha(canBuyBonus ? 1 : 0.68);
  }

  payoutScale() {
    return this.gameMode === "free" ? FREE_PAYOUT_SCALE : MAIN_PAYOUT_SCALE;
  }

  effectiveMult(mult) {
    return Math.max(1, Math.round(mult * this.payoutScale()));
  }

  multRange(mult, scope = null, tier = null) {
    const median = this.effectiveMult(mult);
    const isFree = scope === "free" || (scope === null && this.gameMode === "free");
    const easyBands = !isFree && tier === "Easy" ? MATH_CONFIG.mainEasyOrderPayoutBands : null;
    if (Array.isArray(easyBands) && easyBands.length) {
      const minFactor = Math.min(...easyBands.map((band) => Number(band.min ?? 1)));
      const maxFactor = Math.max(...easyBands.map((band) => Number(band.max ?? band.min ?? 1)));
      const easyMax = Math.max(1, Number(MATH_CONFIG.mainEasyOrderMaxMult || Infinity));
      return {
        min: Math.max(1, Math.round(median * minFactor)),
        median,
        max: Math.max(1, Math.min(easyMax, Math.round(median * maxFactor)))
      };
    }
    const spreadRate = isFree
      ? Number(MATH_CONFIG.freeOrderMultiplierSpread ?? MATH_CONFIG.orderMultiplierSpread)
      : Number(MATH_CONFIG.mainOrderMultiplierSpread ?? MATH_CONFIG.orderMultiplierSpread);
    const spread = Math.max(1, Math.round(median * spreadRate));
    return { min: Math.max(1, median - spread), median, max: median + spread };
  }

  orderMultRange(order) {
    if (order?.scope === "free" && order.payoutTicket) {
      const min = Math.max(1, Math.round(Number(order.payoutTicket.min || 1) * FREE_PAYOUT_SCALE));
      const max = Math.max(min, Math.round(Number(order.payoutTicket.max ?? order.payoutTicket.min ?? 1) * FREE_PAYOUT_SCALE));
      return { min, median: Math.round((min + max) / 2), max };
    }
    return this.multRange(order.mult, order.scope === "free" ? "free" : "main", order.tier);
  }

  rollOrderMult(order) {
    const scope = order.scope === "free" ? "free" : "main";
    const range = this.orderMultRange(order);
    if (scope === "free" && order.payoutTicket) {
      return { range, mult: Phaser.Math.Between(range.min, range.max) };
    }
    const freeBands = scope === "free" ? MATH_CONFIG.freeOrderPayoutBands : null;
    if (Array.isArray(freeBands) && freeBands.length) {
      const total = freeBands.reduce((sum, band) => sum + Number(band.weight || 0), 0);
      let selector = Math.random() * Math.max(total, 0.000001);
      let selected = freeBands[freeBands.length - 1];
      for (const band of freeBands) {
        selector -= Number(band.weight || 0);
        if (selector <= 0) { selected = band; break; }
      }
      const span = range.max - range.min;
      const low = Math.round(range.min + span * Number(selected.minPosition || 0));
      const high = Math.round(range.min + span * Number(selected.maxPosition ?? selected.minPosition ?? 1));
      return { range, mult: Phaser.Math.Between(low, Math.max(low, high)) };
    }
    const bands = scope === "main" && order.tier === "Easy" ? MATH_CONFIG.mainEasyOrderPayoutBands : null;
    if (Array.isArray(bands) && bands.length) {
      const total = bands.reduce((sum, band) => sum + Number(band.weight || 0), 0);
      let selector = Math.random() * Math.max(total, 0.000001);
      let selected = bands[bands.length - 1];
      for (const band of bands) {
        selector -= Number(band.weight || 0);
        if (selector <= 0) { selected = band; break; }
      }
      const low = Math.min(range.max, Math.max(range.min, Math.round(range.median * Number(selected.min ?? 1))));
      const high = Math.min(range.max, Math.max(low, Math.round(range.median * Number(selected.max ?? selected.min ?? 1))));
      return { range, mult: Phaser.Math.Between(low, high) };
    }
    return { range, mult: Phaser.Math.Between(range.min, range.max) };
  }

  rollBandValue(bands, fallback = 1) {
    if (!Array.isArray(bands) || !bands.length) return fallback;
    const total = bands.reduce((sum, band) => sum + Number(band.weight || 0), 0);
    let roll = Math.random() * Math.max(total, 0.000001);
    let selected = bands[bands.length - 1];
    for (const band of bands) {
      roll -= Number(band.weight || 0);
      if (roll <= 0) { selected = band; break; }
    }
    const min = Number(selected.min ?? fallback);
    const max = Number(selected.max ?? min);
    return Phaser.Math.FloatBetween(min, max);
  }

  pickWeightedBand(bands) {
    if (!Array.isArray(bands) || !bands.length) return null;
    const total = bands.reduce((sum, band) => sum + Math.max(0, Number(band.weight || 0)), 0);
    if (!(total > 0)) return bands[Phaser.Math.Between(0, bands.length - 1)];
    let roll = Math.random() * total;
    for (const band of bands) {
      roll -= Math.max(0, Number(band.weight || 0));
      if (roll <= 0) return band;
    }
    return bands[bands.length - 1];
  }

  rollIntegerRange(ticket, fallback = 1) {
    const min = Math.max(0, Math.round(Number(ticket?.min ?? fallback)));
    const max = Math.max(min, Math.round(Number(ticket?.max ?? min)));
    return Phaser.Math.Between(min, max);
  }

  rollScatterInterval(free) {
    const bands = free ? MATH_CONFIG.freeScatterIntervalBands : MATH_CONFIG.mainScatterIntervalBands;
    if (Array.isArray(bands) && bands.length) return Math.max(1, this.rollIntegerRange(this.pickWeightedBand(bands), 1));
    const rate = free ? FREE_SCATTER_PER_MOVE_RATE : MAIN_SCATTER_PER_MOVE_RATE;
    if (!(rate > 0)) return Number.MAX_SAFE_INTEGER;
    return Math.max(1, Math.ceil(Math.log(Math.max(1e-12, 1 - Math.random())) / Math.log(1 - Math.min(0.999999, rate))));
  }

  advanceScatterSchedule(free, retriggerCapped = false) {
    if (this.scatterDropQueued || this.countScatters() >= this.scatterGoal || retriggerCapped) return this.scatterDropQueued;
    const bands = free ? MATH_CONFIG.freeScatterIntervalBands : MATH_CONFIG.mainScatterIntervalBands;
    if (Array.isArray(bands) && bands.length) {
      const key = free ? "freeScatterCountdown" : "mainScatterCountdown";
      this[key] -= 1;
      if (this[key] <= 0) {
        this[key] = this.rollScatterInterval(free);
        return true;
      }
      return false;
    }
    const rate = free ? FREE_SCATTER_PER_MOVE_RATE : MAIN_SCATTER_PER_MOVE_RATE;
    return Math.random() < rate;
  }

  rollMainOrderNeed(baseNeed) {
    return Math.max(1, Math.round(baseNeed * this.rollBandValue(MATH_CONFIG.mainOrderNeedBands, 1)));
  }

  rollBonusOrderBoost(order) {
    return { mult: 1, label: "" };
  }

  chooseMainRewardType(tier) {
    const roll = Math.random();
    const tierIndex = ["Easy", "Medium", "Hard"].indexOf(tier);
    const weights = MATH_CONFIG.mainRewardWeights[tierIndex];
    if (roll < weights.coins) return "coins";
    if (roll < weights.coins + weights.scatter) return "scatter";
    return "coinsScatter";
  }

  orderPaysCoins(order) {
    return order.scope === "free" || order.rewardType === "coins" || order.rewardType === "coinsScatter";
  }

  orderPaysScatter(order) {
    return order.scope !== "free" && (order.rewardType === "scatter" || order.rewardType === "coinsScatter");
  }

  conveyorOrderWidth(order) {
    const tierBase = { Easy: 62, Medium: 72, Hard: 82 }[order?.tier] || 66;
    const kindBonus = { any: 3, cascade: 5, combo: 5, chocolate: 7 }[order?.kind] || 0;
    const need = Number(order?.need || 0);
    const needBonus = need >= 150 ? 7 : need >= 90 ? 5 : need >= 48 ? 4 : need >= 28 ? 2 : 0;
    return Phaser.Math.Clamp(tierBase + kindBonus + needBonus, 62, 94);
  }

  generateOrders() {
    this.clearConveyorViews();
    this.orders = [];
    this.conveyorOrderSequence = 0;
    this.conveyorSpawnLane = 0;
    const cardGap = 6;
    for (let lane = 0; lane < 3; lane++) {
      let rightEdge = W - 21;
      for (let index = 0; index < 5; index++) {
        const order = this.createConveyorOrder(lane, 0);
        const leftEdge = rightEdge - order.cardWidth;
        if (index >= 4 && leftEdge < CONVEYOR_LEFT_X - 8) break;
        order.trackX = rightEdge - order.cardWidth / 2;
        this.orders.push(order);
        rightEdge = leftEdge - cardGap;
      }
    }
  }

  createConveyorOrder(lane, trackX = CONVEYOR_RIGHT_X) {
    const tierTicket = this.pickWeightedBand(MATH_CONFIG.conveyorTierTickets) || { label: "Easy" };
    const tier = tierTicket.label;
    const tierIndex = Math.max(0, ["Easy", "Medium", "Hard"].indexOf(tier));
    const pool = MATH_CONFIG.conveyorOrderPools?.[tierIndex] || MATH_CONFIG.conveyorOrderPools?.[0] || [];
    const template = Phaser.Utils.Array.GetRandom(pool);
    const order = {
      tier,
      kind: template?.kind || "color",
      lane,
      trackX,
      conveyorId: `conveyor-${++this.conveyorOrderSequence}`,
      rewardType: Math.random() < Number(MATH_CONFIG.conveyorScatterRewardChance || 0) ? "coinsScatter" : "coins",
      need: Phaser.Math.Between(Number(template?.needMin || 12), Number(template?.needMax || template?.needMin || 20)),
      mult: Phaser.Math.Between(Number(template?.multMin || 1), Number(template?.multMax || template?.multMin || 1)),
      golden: Math.random() < Number(MATH_CONFIG.conveyorGoldenChance || 0)
    };
    if (order.kind === "color") order.type = Phaser.Utils.Array.GetRandom(TYPES);
    if (order.golden) order.mult = Math.max(order.mult + 1, Math.round(order.mult * 1.8));
    order.cardWidth = this.conveyorOrderWidth(order);
    order.start = this.rawOrderProgress(order);
    return order;
  }

  spawnConveyorOrder(preferredLane = null, trackX = CONVEYOR_RIGHT_X, force = false) {
    const maxActive = Number(MATH_CONFIG.conveyorMaxActiveOrders || 21);
    if (!force && this.orders.length >= maxActive) return null;
    const laneOrder = preferredLane === null
      ? [0, 1, 2].map((offset) => (this.conveyorSpawnLane + offset) % 3)
      : [preferredLane];
    const cardGap = 6;
    const candidateLeft = trackX - 47;
    let lane = null;
    for (const candidate of laneOrder) {
      const rightmostEdge = this.orders
        .filter((order) => order.lane === candidate)
        .reduce((max, laneOrder) => Math.max(max, laneOrder.trackX + Number(laneOrder.cardWidth || 62) / 2), -Infinity);
      if (force || !Number.isFinite(rightmostEdge) || candidateLeft - rightmostEdge >= cardGap) {
        lane = candidate;
        break;
      }
    }
    if (lane === null) return null;
    const order = this.createConveyorOrder(lane, trackX);
    this.orders.push(order);
    this.conveyorSpawnLane = (lane + 1) % 3;
    if (this.currentUiMode === "game") this.createConveyorOrderView(order);
    return order;
  }

  async advanceConveyorOrders() {
    if (this.gameMode !== "main") return;
    const shift = Number(MATH_CONFIG.conveyorShiftPerBet || 14);
    this.orders.forEach((order) => {
      order.trackX -= shift;
      const view = this.conveyorOrderViews.get(order.conveyorId);
      if (view) this.tweens.add({ targets: view.container, x: order.trackX, duration: 230, ease: "Cubic.InOut" });
    });
    const expired = this.orders.filter((order) => order.trackX + Number(order.cardWidth || 62) / 2 < CONVEYOR_LEFT_X);
    if (expired.length) {
      expired.forEach((order) => {
        this.showConveyorExpiredFx(order);
        this.destroyConveyorOrderView(order.conveyorId, true);
      });
      const expiredIds = new Set(expired.map((order) => order.conveyorId));
      this.orders = this.orders.filter((order) => !expiredIds.has(order.conveyorId));
    }
    let spawnCount = 1;
    const rush = Math.random() < Number(MATH_CONFIG.conveyorRushChance || 0)
      && this.orders.length <= Number(MATH_CONFIG.conveyorMaxActiveOrders || 21) - 3;
    if (rush) {
      spawnCount = 3;
      this.showConveyorRushFx();
    }
    for (let i = 0; i < spawnCount; i++) this.spawnConveyorOrder();
    await this.wait(this.autoPlayEnabled ? 170 : 250);
    this.updateConveyorOrders();
  }

  showConveyorExpiredFx(order) {
    const y = CONVEYOR_LANE_Y[order.lane];
    const missed = this.add.text(Math.max(CONVEYOR_LEFT_X + 18, order.trackX), y, "MISSED", {
      fontSize: 11,
      fontStyle: "900",
      color: "#ff8bab",
      stroke: "#351352",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(72);
    missed.isFxSprite = true;
    this.fxSprites.add(missed);
    this.tweens.add({
      targets: missed,
      x: CONVEYOR_LEFT_X - 12,
      alpha: 0,
      duration: 520,
      ease: "Cubic.In",
      onComplete: () => this.destroyFx(missed)
    });
    this.playPopSound(240);
  }

  showConveyorRushFx() {
    const label = this.add.text(W / 2, 238, "ORDER RUSH!", {
      fontSize: 19,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#7a2d93",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(76);
    label.isFxSprite = true;
    this.fxSprites.add(label);
    label.setScale(0.7);
    this.tweens.add({
      targets: label,
      y: 221,
      scale: 1.14,
      alpha: 0,
      duration: 820,
      ease: "Back.Out",
      onComplete: () => this.destroyFx(label)
    });
    this.playUnlockSound();
  }

  showConveyorOrderDetails(orderId) {
    if (this.busy || this.resolvingMove) return;
    const order = this.orders.find((candidate) => candidate.conveyorId === orderId);
    if (!order) return;
    this.closePopup();
    this.modalOpen = true;
    this.popup = this.add.group();
    const depth = 132;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x170811, 0.64).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(W / 2, 356, W - 42, 278, order.golden ? 0x7b5410 : 0x5e1422, 0.99)
      .setStrokeStyle(5, order.golden ? 0xfff06a : 0x8ee8ff, 1)
      .setDepth(depth + 1);
    const title = this.add.text(W / 2, 247, order.golden ? "GOLD ORDER" : `${order.tier.toUpperCase()} ORDER`, {
      fontSize: 30,
      fontStyle: "900",
      color: order.golden ? "#fff06a" : "#ffffff",
      stroke: "#351352",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(depth + 2);
    const target = this.add.text(W / 2, 286, this.conveyorTargetLabel(order), {
      fontSize: 19,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(depth + 2);
    const icon = this.add.image(W / 2 - 89, 358, this.conveyorIconKey(order)).setDepth(depth + 2);
    icon.setScale(78 / Math.max(icon.width, icon.height));
    const progress = Math.min(this.orderProgress(order), order.need);
    const goal = this.add.text(W / 2 + 45, 337, `${progress} / ${order.need}`, {
      fontSize: 29,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(depth + 2);
    const range = this.orderMultRange(order);
    const rewardLabel = order.rewardType === "coinsScatter"
      ? `${range.min}-${range.max}x + SCATTER`
      : `${range.min}-${range.max}x`;
    const reward = this.add.text(W / 2 + 45, 389, rewardLabel, {
      fontSize: order.rewardType === "coinsScatter" ? 19 : 28,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#7a2d93",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(depth + 2);
    const timeRatio = Phaser.Math.Clamp((order.trackX - CONVEYOR_LEFT_X) / (CONVEYOR_RIGHT_X - CONVEYOR_LEFT_X), 0, 1);
    const timeBg = this.add.rectangle(W / 2 - 157, 447, 314, 11, 0x220711, 0.95).setOrigin(0, 0.5).setDepth(depth + 2);
    const timeBar = this.add.rectangle(W / 2 - 157, 447, 314, 11, timeRatio < 0.22 ? 0xff5372 : 0x49d6a6, 1)
      .setOrigin(0, 0.5)
      .setScale(Math.max(0.001, timeRatio), 1)
      .setDepth(depth + 3);
    const close = this.add.text(W / 2, 479, "CLOSE", {
      fontSize: 18,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#351352",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(depth + 3).setInteractive({ useHandCursor: true });
    veil.on("pointerdown", () => this.closePopup());
    close.on("pointerdown", () => this.closePopup());
    this.popup.addMultiple([veil, panel, title, target, icon, goal, reward, timeBg, timeBar, close]);
    [panel, title, target, goal, reward, close].forEach((item) => item.setScale(0.82));
    const iconScale = icon.scaleX;
    icon.setScale(iconScale * 0.82);
    this.tweens.add({ targets: [panel, title, target, goal, reward, close], scaleX: 1, scaleY: 1, duration: 230, ease: "Back.Out" });
    this.tweens.add({ targets: icon, scaleX: iconScale, scaleY: iconScale, duration: 230, ease: "Back.Out" });
    this.playPopSound(880);
  }

  createOrder(tier) {
    const tierIndex = ["Easy", "Medium", "Hard"].indexOf(tier);
    const template = Phaser.Utils.Array.GetRandom(MATH_CONFIG.mainOrderPools[tierIndex]);
    const spec = { ...template };
    spec.need = this.rollMainOrderNeed(spec.need);
    const effortScale = Math.max(0.8, Math.pow(spec.need / Math.max(1, template.need), 0.65));
    spec.mult = Math.max(1, Math.round(template.mult * effortScale));
    if (spec.kind === "color") spec.type = TYPES[spec.typeIndex];
    delete spec.typeIndex;
    const order = { tier, rewardType: this.chooseMainRewardType(tier), ...spec };
    order.start = this.rawOrderProgress(order);
    return order;
  }

  generateFreeOrders() {
    this.orders = [
      this.createFreeOrder("Bonus Easy"),
      this.createFreeOrder("Bonus Medium"),
      this.createFreeOrder("Bonus Hard")
    ];
  }

  createFreeOrder(tier) {
    const tierIndex = ["Bonus Easy", "Bonus Medium", "Bonus Hard"].indexOf(tier);
    const template = Phaser.Utils.Array.GetRandom(MATH_CONFIG.freeOrderPools[tierIndex]);
    const spec = { ...template };
    const payoutBands = Array.isArray(spec.payoutBands) && spec.payoutBands.length
      ? spec.payoutBands
      : MATH_CONFIG.freeOrderPayoutTickets?.[tierIndex];
    delete spec.payoutBands;
    if (spec.kind === "color") spec.type = TYPES[spec.typeIndex];
    delete spec.typeIndex;
    const order = { tier, scope: "free", ...spec };
    const payoutTicket = this.pickWeightedBand(payoutBands);
    order.payoutTicket = payoutTicket ? { ...payoutTicket } : null;
    order.start = this.rawOrderProgress(order);
    order.gold = false;
    order.discounted = false;
    return order;
  }

  generateBoard() {
    this.clearSprites();
    do {
      this.board = [];
      for (let r = 0; r < this.rows; r++) {
        this.board[r] = [];
        for (let c = 0; c < COLS; c++) {
          this.board[r][c] = this.randomTile();
        }
      }
    } while (this.findMatches().length > 0 || !this.hasLegalMove());
  }

  generateFreeBoard() {
    this.generateBoard();
    const cells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) cells.push([r, c]);
    }
    Phaser.Utils.Array.Shuffle(cells).slice(0, Phaser.Math.Between(3, 5)).forEach(([r, c]) => {
      this.board[r][c] = this.randomFreeSpecialTile();
    });
  }

  randomTile() {
    return { type: Phaser.Utils.Array.GetRandom(TYPES), special: null };
  }

  refillEfficiencyNormalized() {
    const floor = Number(MATH_CONFIG.refillEfficiencyFloor || 0);
    const ceiling = Number(MATH_CONFIG.refillEfficiencyCeiling || floor + 1);
    const efficiency = this.paidMovesMade > 0 ? this.totalRemoved / this.paidMovesMade : floor;
    return Phaser.Math.Clamp((efficiency - floor) / Math.max(0.01, ceiling - floor), 0, 1);
  }

  refillSuppressionRate() {
    const minRate = Number(MATH_CONFIG.refillMatchSuppressionMinRate || 0);
    const normalized = this.refillEfficiencyNormalized();
    const maxRate = this.gameMode === "free"
      ? Number(MATH_CONFIG.freeRefillMatchSuppressionMaxRate || minRate)
      : Number(MATH_CONFIG.refillMatchSuppressionMaxRate || minRate);
    return minRate + (maxRate - minRate) * normalized;
  }

  refillAssistanceRate() {
    const maxRate = this.gameMode === "free"
      ? Number(MATH_CONFIG.freeRefillMatchAssistMaxRate || 0)
      : Number(MATH_CONFIG.refillMatchAssistMaxRate || 0);
    return maxRate * (1 - this.refillEfficiencyNormalized());
  }

  createRefillAssistContext() {
    const configuredLimit = this.gameMode === "free"
      ? Number(MATH_CONFIG.freeRefillMatchAssistMaxPerMove || 0)
      : Number(MATH_CONFIG.refillMatchAssistMaxPerMove || 0);
    return {
      remaining: Math.max(0, Math.floor(configuredLimit)),
      types: new Set()
    };
  }

  randomRefillTile(board, r, c, assistContext = null) {
    const matchCandidates = [];
    const addMatchCandidate = (a, b) => {
      if (!a || !b || a.scatter || b.scatter || a.special || b.special || a.type !== b.type) return;
      if (!matchCandidates.includes(a.type)) matchCandidates.push(a.type);
    };
    if (r + 2 < this.rows) addMatchCandidate(board[r + 1]?.[c], board[r + 2]?.[c]);
    if (c >= 2) addMatchCandidate(board[r]?.[c - 1], board[r]?.[c - 2]);
    const assistedTypes = assistContext?.types || null;
    const eligibleAssistTypes = assistedTypes
      ? matchCandidates.filter((type) => !assistedTypes.has(type))
      : matchCandidates;
    const canAssist = !assistContext || assistContext.remaining > 0;
    if (canAssist && eligibleAssistTypes.length && Math.random() < this.refillAssistanceRate()) {
      const type = Phaser.Utils.Array.GetRandom(eligibleAssistTypes);
      if (assistContext) {
        assistContext.remaining -= 1;
        assistContext.types.add(type);
      }
      return { type, special: null };
    }
    if (Math.random() >= this.refillSuppressionRate()) return this.randomTile();
    const blocked = new Set();
    const blocksType = (a, b) => {
      if (!a || !b || a.scatter || b.scatter || a.special || b.special) return;
      if (a.type === b.type) blocked.add(a.type);
    };
    if (r + 2 < this.rows) blocksType(board[r + 1]?.[c], board[r + 2]?.[c]);
    if (c >= 2) blocksType(board[r]?.[c - 1], board[r]?.[c - 2]);
    const allowed = TYPES.filter((type) => !blocked.has(type));
    return { type: Phaser.Utils.Array.GetRandom(allowed.length ? allowed : TYPES), special: null };
  }

  randomFreeSpecialTile() {
    const special = Phaser.Utils.Array.GetRandom(["stripeRow", "stripeCol", "bomb", "chocolate"]);
    return { type: Phaser.Utils.Array.GetRandom(TYPES), special };
  }

  isLegalSwap(r1, c1, r2, c2) {
    const a = this.board[r1]?.[c1];
    const b = this.board[r2]?.[c2];
    if (!a || !b || a.chest || b.chest) return false;
    this.board[r1][c1] = b;
    this.board[r2][c2] = a;
    const legal = !!a.special || !!b.special || this.findMatches().length > 0;
    this.board[r1][c1] = a;
    this.board[r2][c2] = b;
    return legal;
  }

  hasLegalMove() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1 && this.isLegalSwap(r, c, r, c + 1)) return true;
        if (r < this.rows - 1 && this.isLegalSwap(r, c, r + 1, c)) return true;
      }
    }
    return false;
  }

  legalMoves() {
    const moves = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1 && this.isLegalSwap(r, c, r, c + 1)) moves.push([[r, c], [r, c + 1]]);
        if (r < this.rows - 1 && this.isLegalSwap(r, c, r + 1, c)) moves.push([[r, c], [r + 1, c]]);
      }
    }
    return moves;
  }

  previewAutoMove(move) {
    const [[r1, c1], [r2, c2]] = move;
    const a = this.board[r1]?.[c1];
    const b = this.board[r2]?.[c2];
    if (!a || !b) return null;
    this.board[r1][c1] = b;
    this.board[r2][c2] = a;
    const remove = new Set();
    const add = (r, c) => {
      const tile = this.board[r]?.[c];
      if (tile && !tile.chest && !tile.scatter) remove.add(`${r},${c}`);
    };
    const addRow = (r) => { for (let c = 0; c < COLS; c++) add(r, c); };
    const addCol = (c) => { for (let r = 0; r < this.rows; r++) add(r, c); };
    const addArea = (r, c, radius) => {
      for (let rr = r - radius; rr <= r + radius; rr++) {
        for (let cc = c - radius; cc <= c + radius; cc++) add(rr, cc);
      }
    };
    const addColor = (type) => {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.board[r]?.[c];
          if (tile && !tile.scatter && tile.type === type && tile.special !== "chocolate") add(r, c);
        }
      }
    };
    const matches = this.findMatches();
    const hits = new Map();
    matches.forEach((group) => group.cells.forEach(([r, c]) => {
      add(r, c);
      const key = `${r},${c}`;
      const hit = hits.get(key) || { max: 0, dirs: new Set() };
      hit.max = Math.max(hit.max, group.cells.length);
      hit.dirs.add(group.dir);
      hits.set(key, hit);
    }));
    const sa = a.special;
    const sb = b.special;
    let comboType = null;
    if (sa && sb) {
      const specials = [sa, sb];
      const striped = specials.filter((special) => special === "stripeRow" || special === "stripeCol").length;
      const bombs = specials.filter((special) => special === "bomb").length;
      const chocolates = specials.filter((special) => special === "chocolate").length;
      comboType = chocolates ? "chocolateSpecial" : striped === 2 ? "stripeStripe" : striped && bombs ? "stripeBomb" : bombs === 2 ? "bombBomb" : "any";
      add(r1, c1);
      add(r2, c2);
      if (chocolates === 2) {
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < COLS; c++) add(r, c);
      } else if (chocolates === 1) {
        addColor((sa === "chocolate" ? b : a).type);
      } else if (striped === 2) {
        addRow(r2);
        addCol(c2);
      } else if (striped && bombs) {
        for (let r = r2 - 1; r <= r2 + 1; r++) addRow(r);
        for (let c = c2 - 1; c <= c2 + 1; c++) addCol(c);
      } else if (bombs === 2) {
        addArea(r2, c2, 2);
      }
    } else if (sa || sb) {
      const special = sa || sb;
      const [r, c] = sa ? [r2, c2] : [r1, c1];
      const other = sa ? b : a;
      add(r, c);
      if (special === "stripeRow" || special === "stripeCol") {
        if (r1 === r2) addRow(r);
        else addCol(c);
      } else if (special === "bomb") {
        addArea(r, c, 1);
      } else if (special === "chocolate") {
        addColor(other.type);
      }
    }
    const colors = Object.fromEntries(TYPES.map((type) => [type, 0]));
    remove.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const tile = this.board[r]?.[c];
      if (tile && colors[tile.type] !== undefined) colors[tile.type] += 1;
    });
    const madeChocolate = [...hits.values()].some((hit) => hit.max >= 5) ? 1 : 0;
    const madeSpecial = [...hits.values()].some((hit) => hit.max >= 4 || hit.dirs.size > 1) ? 1 : 0;
    this.board[r1][c1] = a;
    this.board[r2][c2] = b;
    return {
      removed: remove.size,
      colors,
      madeChocolate,
      madeSpecial,
      comboType,
      singleSpecial: !!(sa || sb) && !(sa && sb),
      doubleSpecial: !!sa && !!sb
    };
  }

  autoMoveAnalysis(move) {
    const preview = this.previewAutoMove(move);
    if (!preview) return null;
    const specialScore = preview.doubleSpecial * 1500
      + preview.singleSpecial * (110 + preview.removed * 8)
      + preview.madeChocolate * 1200
      + preview.madeSpecial * 480
      + preview.removed * 5;
    let orderScore = 0;
    let orderCompletions = 0;
    for (const order of this.orders || []) {
      if (order.completed) continue;
      const current = this.orderProgress(order);
      const remaining = Math.max(1, order.need - current);
      let gain = 0;
      if (order.kind === "color") gain = preview.colors[order.type] || 0;
      else if (order.kind === "any") gain = preview.removed;
      else if (order.kind === "chocolate") gain = preview.madeChocolate;
      else if (order.kind === "combo") gain = order.comboType === "any"
        ? (preview.comboType ? 1 : 0)
        : (preview.comboType === order.comboType ? 1 : 0);
      const progress = Math.min(1, gain / remaining);
      const rewardPriority = order.scope === "free" && order.payoutTicket
        ? Phaser.Math.Clamp(Math.sqrt(
          ((Number(order.payoutTicket.min || 1) + Number(order.payoutTicket.max ?? order.payoutTicket.min ?? 1)) / 2)
          / Math.max(1, this.effectiveMult(order.mult) * 3)
        ), 0.75, 3)
        : 1;
      const tierWeight = order.scope === "free"
        ? 1.15 * rewardPriority
        : order.tier === "Hard" ? 1.25 : order.tier === "Medium" ? 1.12 : 1;
      const closeness = 1 + Math.min(0.75, current / Math.max(1, order.need));
      const completes = gain >= remaining && gain > 0;
      if (completes) orderCompletions += 1;
      orderScore += tierWeight * (progress * 2 * closeness + (completes ? 6 : 0));
    }
    return {
      move,
      preview,
      specialScore,
      orderScore,
      orderCompletions,
      premium: preview.doubleSpecial || preview.madeChocolate || orderCompletions > 0
    };
  }

  chooseAutoMove() {
    const moves = this.legalMoves();
    if (!moves.length) return null;
    const analyses = moves.map((move) => this.autoMoveAnalysis(move)).filter(Boolean);
    const chooseBest = (pool, scoreFor) => {
      let bestScore = -Infinity;
      let best = [];
      for (const analysis of pool) {
        const score = scoreFor(analysis);
        if (score > bestScore) {
          bestScore = score;
          best = [analysis.move];
        } else if (score === bestScore) {
          best.push(analysis.move);
        }
      }
      return Phaser.Utils.Array.GetRandom(best.length ? best : moves);
    };
    const premium = analyses.filter((analysis) => analysis.premium);
    if (premium.length) {
      return chooseBest(premium, (analysis) => analysis.orderCompletions * 4000 + analysis.specialScore + analysis.orderScore * 220);
    }
    const weights = MATH_CONFIG.autoStrategyWeights || { random: 0.4, special: 0.3, order: 0.3 };
    const total = Math.max(0.000001, Number(weights.random || 0) + Number(weights.special || 0) + Number(weights.order || 0));
    let roll = Math.random() * total;
    let mode = "order";
    roll -= Number(weights.random || 0);
    if (roll <= 0) mode = "random";
    else {
      roll -= Number(weights.special || 0);
      if (roll <= 0) mode = "special";
    }
    if (mode === "random") return Phaser.Utils.Array.GetRandom(moves);
    if (mode === "special") return chooseBest(analyses, (analysis) => analysis.specialScore + analysis.orderScore * 35);
    return chooseBest(analyses, (analysis) => analysis.orderScore * 1000 + analysis.specialScore * 0.12 + analysis.preview.removed);
  }

  shuffleBoardTilesOnly() {
    const cells = [];
    const tiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r]?.[c];
        if (!tile || tile.chest) continue;
        cells.push([r, c]);
        tiles.push(tile);
      }
    }
    if (tiles.length < 2) return;
    Phaser.Utils.Array.Shuffle(tiles);
    cells.forEach(([r, c], index) => {
      this.board[r][c] = tiles[index];
    });
  }

  rebuildShuffledBoard() {
    let guard = 0;
    do {
      this.shuffleBoardTilesOnly();
      guard += 1;
    } while ((this.findMatches().length > 0 || !this.hasLegalMove()) && guard < 50);
    return this.findMatches().length === 0 && this.hasLegalMove();
  }

  regeneratePlayableTiles() {
    for (let attempt = 0; attempt < 200; attempt++) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.board[r]?.[c]?.scatter) continue;
          this.board[r][c] = this.randomTile();
        }
      }
      if (this.findMatches().length === 0 && this.hasLegalMove()) return true;
    }

    // A special can always be swapped legally, so this final fallback cannot leave a dead board.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r]?.[c];
        if (!tile || tile.scatter) continue;
        const hasNeighbor = (c > 0 && !this.board[r][c - 1]?.scatter)
          || (c < COLS - 1 && !this.board[r][c + 1]?.scatter)
          || (r > 0 && !this.board[r - 1][c]?.scatter)
          || (r < this.rows - 1 && !this.board[r + 1][c]?.scatter);
        if (!hasNeighbor) continue;
        this.board[r][c] = { type: tile.type, special: "stripeRow" };
        return true;
      }
    }
    return false;
  }

  async showShuffleFx() {
    this.statusText.setText("No moves. Refreshing board...");
    const veil = this.add.rectangle(W / 2, this.boardY + (this.rows * this.cell) / 2, this.cell * COLS + 28, this.cell * this.rows + 28, 0x42f5ff, 0.1)
      .setStrokeStyle(4, 0xfff06a, 0.85)
      .setDepth(43);
    veil.isFxSprite = true;
    this.fxSprites.add(veil);
    const label = this.add.text(W / 2, this.boardY + (this.rows * this.cell) / 2, "RESHUFFLE", {
      fontFamily: "Arial Black",
      fontSize: "26px",
      color: "#fff6a8",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(44);
    label.isFxSprite = true;
    this.fxSprites.add(label);
    this.playUnlockSound();
    this.time.delayedCall(90, () => this.playPopSound(880));
    this.time.delayedCall(190, () => this.playPopSound(1320));
    this.cameras.main.flash(260, 90, 245, 255);
    this.cameras.main.shake(300, 0.008);
    this.tweens.add({ targets: veil, alpha: 0.55, yoyo: true, repeat: 1, duration: 160, ease: "Sine.InOut" });
    this.tweens.add({ targets: label, scale: 1.16, yoyo: true, repeat: 1, duration: 160, ease: "Back.Out" });
    await this.wait(360);
    this.tweens.add({ targets: [veil, label], alpha: 0, duration: 180, ease: "Cubic.In" });
    await this.wait(190);
    this.tweens.killTweensOf(veil);
    this.tweens.killTweensOf(label);
    this.fxSprites.delete(veil);
    this.fxSprites.delete(label);
    veil.destroy();
    label.destroy();
  }

  async ensureLegalMovesWithShuffle(showFx = true) {
    if (this.hasLegalMove()) return true;
    if (showFx) await this.showShuffleFx();
    const playable = this.rebuildShuffledBoard() || this.regeneratePlayableTiles();
    this.renderBoard(true);
    if (showFx) {
      this.cameras.main.flash(220, 255, 240, 106);
      this.playPopSound(1560);
      await this.wait(180);
    }
    if (!playable) throw new Error("Unable to create a playable board");
    return true;
  }

  clearSprites() {
    if (!this.sprites) this.sprites = [];
    this.clearEffects();
    [...this.allCandySprites].forEach((s) => this.destroyCandySprite(s));
    this.children.list
      .filter((child) => child.isBoardSymbol)
      .forEach((child) => {
        this.tweens.killTweensOf(child);
        child.destroy();
      });
    this.sprites = Array.from({ length: this.rows }, () => Array(COLS).fill(null));
  }

  destroyCandySprite(sprite) {
    if (!sprite) return;
    sprite.getChildren().forEach((child) => {
      this.tweens.killTweensOf(child);
      if (child.disableInteractive) child.disableInteractive();
      child.destroy();
    });
    this.allCandySprites.delete(sprite);
    sprite.destroy();
  }

  renderBoard(instant = false) {
    this.clearSprites();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r][c];
        if (tile) this.sprites[r][c] = this.createCandySprite(tile, r, c, instant);
      }
    }
  }

  createCandySprite(tile, r, c, instant = false, startY = null) {
    const x = this.cellX(c);
    const y = startY === null ? this.cellY(r) : startY;
    const g = this.add.group();
    const hit = this.add.circle(x, y, Math.max(20, this.cell * 0.44), 0xffffff, 0.001);
    if (!tile.chest) hit.setInteractive({ useHandCursor: true });
    hit.tileRef = tile;
    hit.row = r;
    hit.col = c;

    const img = this.add.image(x, y, this.symbolKey(tile));
    const isFreeBoard = this.rows === FREE_ROWS;
    const symbolSize = tile.scatter
      ? this.cell * (isFreeBoard ? 0.94 : 1.08)
      : this.cell * (isFreeBoard ? 0.86 : 0.94);
    img.setScale(symbolSize / Math.max(img.width, img.height));
    if (tile.scatter) img.setRotation(0);
    img.isBoardSymbol = true;
    hit.isBoardSymbol = true;
    g.addMultiple([img, hit]);

    if (!tile.chest) hit.on("pointerdown", () => this.onTileTap(hit.row, hit.col));
    g.getChildren().forEach((child) => {
      child.setDepth(4);
      child.row = r;
      child.col = c;
      if (!instant) {
        const baseScaleX = child.scaleX;
        const baseScaleY = child.scaleY;
        child.setScale(baseScaleX * 0.7, baseScaleY * 0.7);
        this.tweens.add({
          targets: child,
          scaleX: baseScaleX,
          scaleY: baseScaleY,
          duration: 170,
          ease: "Back.Out"
        });
      }
    });
    g.x = 0;
    g.y = 0;
    this.allCandySprites.add(g);
    return g;
  }

  clearAutoTimer() {
    if (!this.autoTimer) return;
    this.autoTimer.remove(false);
    this.autoTimer = null;
  }

  setAutoPlayEnabled(enabled, announce = true) {
    const next = !!enabled && this.sessionActive;
    this.clearAutoTimer();
    this.autoPlayEnabled = next;
    this.updateAutoUi();
    if (announce && this.gameMode === "main" && this.sessionActive) {
      this.statusText.setText(next ? "Auto play enabled." : "Auto play paused.");
      this.playBetSound(next ? 1 : -1, true);
    }
    if (next) this.scheduleAutoMove(180);
  }

  toggleAutoPlay() {
    if (this.autoPlayEnabled) {
      this.setAutoPlayEnabled(false);
      return;
    }
    if (!this.sessionActive || this.busy || this.resolvingMove || this.modalOpen) return;
    this.setAutoPlayEnabled(true);
  }

  scheduleAutoMove(delay = null) {
    if (!this.autoPlayEnabled || !this.sessionActive) return;
    this.clearAutoTimer();
    const configuredDelay = Math.max(140, Number(MATH_CONFIG.autoMoveDelayMs || 260));
    this.autoTimer = this.time.delayedCall(delay === null ? configuredDelay : delay, () => {
      this.autoTimer = null;
      this.runFlow(this.performAutoMove());
    });
  }

  async performAutoMove() {
    if (!this.autoPlayEnabled || !this.sessionActive) return;
    if (this.modalOpen || this.busy || this.resolvingMove || !this.inputOpen) {
      this.scheduleAutoMove(140);
      return;
    }
    if (this.gameMode === "main" && this.wallet < this.betAmount) {
      this.setAutoPlayEnabled(false, false);
      return;
    }
    await this.ensureLegalMovesWithShuffle();
    if (!this.autoPlayEnabled || !this.sessionActive) return;
    const move = this.chooseAutoMove();
    if (!move) {
      this.setAutoPlayEnabled(false, false);
      return;
    }
    const [[r1, c1], [r2, c2]] = move;
    this.clearSelection();
    await this.performMove(r1, c1, r2, c2);
    if (this.autoPlayEnabled && this.sessionActive) this.scheduleAutoMove();
  }

  onTileTap(r, c) {
    if (!this.inputOpen || this.busy || this.resolvingMove || this.modalOpen) return;
    if (this.autoPlayEnabled) return;
    const tile = this.board[r][c];
    if (!tile || tile.chest) return;
    if (!this.selected) {
      this.selectTile(r, c);
      return;
    }
    const prev = this.selected;
    if (prev.r === r && prev.c === c) {
      this.clearSelection();
      return;
    }
    if (Math.abs(prev.r - r) + Math.abs(prev.c - c) !== 1) {
      this.clearSelection();
      this.selectTile(r, c);
      return;
    }
    this.clearSelection();
    this.runFlow(this.performMove(prev.r, prev.c, r, c));
  }

  runFlow(promise) {
    Promise.resolve(promise).catch((error) => this.recoverFromFlowError(error));
  }

  recoverFromFlowError(error) {
    console.error("Candy Orders flow error", error);
    this.setAutoPlayEnabled(false, false);
    this.autoUiSuppressed = false;
    this.clearSelection();
    this.clearEffects();
    this.closePopup();
    this.busy = false;
    this.resolvingMove = false;

    if (!this.sessionActive) {
      this.showPreStart();
      return;
    }

    const isFree = this.gameMode === "free";
    this.configureBoard(isFree ? FREE_ROWS : MAIN_ROWS);
    this.createBoardFrame();
    if (!Array.isArray(this.orders) || this.orders.length !== 3) {
      if (isFree) this.generateFreeOrders();
      else this.generateOrders();
    }
    if (isFree) this.generateFreeBoard();
    else this.generateBoard();
    this.renderBoard(true);
    this.updateOrders();
    this.updateKeyUi();
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    this.displayedWallet = this.wallet;
    this.updateBetUi();
    this.setMode(isFree ? "free" : "game");
    this.statusText.setText("Board recovered. Try another move.");
    this.inputOpen = true;
  }

  selectTile(r, c) {
    this.selected = { r, c };
    this.selection = this.add.rectangle(this.cellX(c), this.cellY(r), this.cell - 4, this.cell - 4, 0xffffff, 0)
      .setStrokeStyle(4, 0xfff36a, 1)
      .setDepth(5);
  }

  clearSelection() {
    if (this.selection) this.selection.destroy();
    this.selection = null;
    this.selected = null;
  }

  moveSpriteTo(sprite, r, c, duration = 220) {
    if (!sprite) return;
    const children = sprite.getChildren();
    const hit = children[children.length - 1];
    const dx = this.cellX(c) - hit.x;
    const dy = this.cellY(r) - hit.y;
    children.forEach((child) => {
      child.row = r;
      child.col = c;
      this.tweens.add({
        targets: child,
        x: child.x + dx,
        y: child.y + dy,
        duration,
        ease: "Cubic.Out"
      });
    });
  }

  async performMove(r1, c1, r2, c2) {
    if (!this.sessionActive) return;
    if (this.resolvingMove) return;
    this.resolvingMove = true;
    const inFreeGame = this.gameMode === "free";
    if (!inFreeGame && this.wallet < this.betAmount) {
      this.resolvingMove = false;
      await this.finishSession("Wallet empty");
      return;
    }
    this.inputOpen = false;
    this.busy = true;
    this.statusText.setText("Checking move...");
    const a = this.board[r1][c1];
    const b = this.board[r2][c2];
    const spriteA = this.sprites[r1][c1];
    const spriteB = this.sprites[r2][c2];
    this.board[r1][c1] = b;
    this.board[r2][c2] = a;
    this.sprites[r1][c1] = spriteB;
    this.sprites[r2][c2] = spriteA;
    this.moveSpriteTo(spriteB, r1, c1, 190);
    this.moveSpriteTo(spriteA, r2, c2, 190);
    await this.wait(210);

    const specialSwap = a.special || b.special;
    const matchesAfterSwap = this.findMatches();
    const oneSpecialOneNormal = (a.special && !b.special) || (!a.special && b.special);
    if (!specialSwap && matchesAfterSwap.length === 0) {
      this.board[r1][c1] = a;
      this.board[r2][c2] = b;
      this.sprites[r1][c1] = spriteA;
      this.sprites[r2][c2] = spriteB;
      this.moveSpriteTo(spriteA, r1, c1, 170);
      this.moveSpriteTo(spriteB, r2, c2, 170);
      await this.wait(190);
      this.statusText.setText("No match. Pick another swap.");
      this.busy = false;
      this.resolvingMove = false;
      this.inputOpen = true;
      return;
    }

    if (inFreeGame) {
      this.freeMovesLeft = Math.max(0, this.freeMovesLeft - 1);
    } else {
      this.wallet -= this.betAmount;
      this.paidBetTotal += this.betAmount;
    }
    const retriggerCapped = inFreeGame && this.freeScatterRetriggers >= Number(MATH_CONFIG.maxBonusRetriggers || Infinity);
    this.scatterDropQueued = this.advanceScatterSchedule(inFreeGame, retriggerCapped);
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    this.displayedWallet = this.wallet;
    this.movesMade += 1;
    if (!inFreeGame) this.paidMovesMade += 1;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.refillAssistContext = this.createRefillAssistContext();
    this.updateBetUi();
    this.updateFreeUi();
    this.statusText.setText(inFreeGame ? "Free move resolving..." : "Resolving...");

    if (oneSpecialOneNormal) {
      const normalMovedPos = a.special ? [r1, c1] : [r2, c2];
      const specialMovedPos = a.special ? [r2, c2] : [r1, c1];
      const normalMatches = matchesAfterSwap.filter((group) =>
        group.cells.some(([r, c]) => r === normalMovedPos[0] && c === normalMovedPos[1])
      );
      if (normalMatches.length > 0) {
        const createdSpecials = await this.resolveMatches(normalMatches, {
          preferredCreatePositions: [normalMovedPos],
          protectedPositions: [specialMovedPos],
          allowSpecialExpansion: false
        });
        await this.showCreatedSpecialsBeforeSwapActivation(createdSpecials);
        await this.collapseAndFill([specialMovedPos, ...(createdSpecials || []).map(({ r, c }) => [r, c])]);
        await this.wait(this.autoPlayEnabled ? 60 : 120);
      }
      await this.activateMovedSpecials(a, b, [[r1, c1], [r2, c2]]);
    } else if (specialSwap) {
      await this.activateMovedSpecials(a, b, [[r1, c1], [r2, c2]]);
    }

    await this.resolveAll({ preferredCreatePositions: [[r2, c2], [r1, c1]] });
    if (this.gameMode === "free") await this.checkFreeScatterRetrigger();
    else this.checkScatterBonus();
    await this.finishMove();
  }

  async showCreatedSpecialsBeforeSwapActivation(createdSpecials = []) {
    if (!createdSpecials.length) return;
    await this.wait(50);
    this.playUnlockSound();
    for (const { r, c } of createdSpecials) {
      const sprite = this.sprites[r]?.[c];
      if (!sprite) continue;
      this.burstAt(this.cellX(c), this.cellY(r), 0xfff06a);
      sprite.getChildren()
        .filter((child) => child.type === "Image")
        .forEach((child) => {
          const baseScaleX = child.scaleX;
          const baseScaleY = child.scaleY;
          this.tweens.add({
            targets: child,
            scaleX: baseScaleX * 1.22,
            scaleY: baseScaleY * 1.22,
            duration: 120,
            yoyo: true,
            ease: "Sine.Out"
          });
        });
    }
    await this.wait(this.autoPlayEnabled ? 190 : 270);
  }

  async activateMovedSpecials(a, b, positions) {
    const remove = new Set();
    const fxWaits = [];
    const [posA, posB] = positions;
    const addCell = (r, c) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < COLS) remove.add(`${r},${c}`);
    };
    const addRow = (r) => {
      if (r < 0 || r >= this.rows) return;
      for (let c = 0; c < COLS; c++) addCell(r, c);
    };
    const addCol = (c) => {
      if (c < 0 || c >= COLS) return;
      for (let r = 0; r < this.rows; r++) addCell(r, c);
    };
    const addArea = (r, c, radius) => {
      for (let rr = r - radius; rr <= r + radius; rr++) {
        for (let cc = c - radius; cc <= c + radius; cc++) addCell(rr, cc);
      }
    };
    const addColorTargets = (color, applyTarget) => {
      if (!TYPES.includes(color)) return 0;
      let count = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.board[r][c];
          if (tile && !tile.scatter && tile.type === color && tile.special !== "chocolate") {
            applyTarget(r, c, count);
            count += 1;
          }
        }
      }
      return count;
    };
    const addBoard = () => {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) addCell(r, c);
      }
    };
    const activateCombo = (first, second, firstPos, secondPos) => {
      if (!first.special || !second.special) return false;
      const specials = [first.special, second.special];
      this.recordSpecialCombo(specials);
      const center = firstPos;
      const [r, c] = center;
      addCell(firstPos[0], firstPos[1]);
      addCell(secondPos[0], secondPos[1]);

      if (specials.every((special) => special === "chocolate")) {
        addBoard();
        return "chocolateChocolate";
      }

      if (specials.includes("chocolate")) {
        const other = first.special === "chocolate" ? second : first;
        const color = TYPES.includes(other.type) ? other.type : this.randomTransformColor();
        if (other.special === "stripeRow" || other.special === "stripeCol") {
          addColorTargets(color, (rr, cc) => addCell(rr, cc));
          return { type: "chocolateSpecial", color, transformSpecial: "stripe" };
        }
        if (other.special === "bomb") {
          addColorTargets(color, (rr, cc) => addCell(rr, cc));
          return { type: "chocolateSpecial", color, transformSpecial: "bomb" };
        }
      }

      const striped = specials.includes("stripeRow") || specials.includes("stripeCol");
      const bombs = specials.filter((special) => special === "bomb").length;
      if (striped && bombs > 0) {
        for (let rr = r - 1; rr <= r + 1; rr++) addRow(rr);
        for (let cc = c - 1; cc <= c + 1; cc++) addCol(cc);
        return "stripeBomb";
      }
      if (striped && bombs === 0) {
        addRow(r);
        addCol(c);
        return "stripeStripe";
      }
      if (bombs === 2) {
        addArea(r, c, 2);
        return "bombBomb";
      }
      return false;
    };
    const combo = activateCombo(a, b, posB, posA);
    if (combo) {
      const comboType = typeof combo === "string" ? combo : combo.type;
      if (typeof combo === "object" && combo.transformSpecial) {
        await this.transformColorToSpecial(combo.color, combo.transformSpecial);
      }
      const triggerEvents = [];
      const comboSources = [];
      if (comboType === "stripeStripe") {
        comboSources.push({ r: posB[0], c: posB[1], special: "stripeRow" });
        comboSources.push({ r: posB[0], c: posB[1], special: "stripeCol" });
      } else if (comboType === "stripeBomb") {
        for (let rr = posB[0] - 1; rr <= posB[0] + 1; rr++) {
          if (rr >= 0 && rr < this.rows) comboSources.push({ r: rr, c: posB[1], special: "stripeRow" });
        }
        for (let cc = posB[1] - 1; cc <= posB[1] + 1; cc++) {
          if (cc >= 0 && cc < COLS) comboSources.push({ r: posB[0], c: cc, special: "stripeCol" });
        }
      }
      this.expandSpecialRemoval(remove, triggerEvents, [posA, posB], comboSources);
      await this.playSpecialComboFx(a, b, posB, posA, comboType, typeof combo === "object" ? combo : null);
      await this.playRemovalSpecialFx(remove, [posA, posB], triggerEvents);
      await this.removePositions(remove, null);
      await this.collapseAndFill();
      return;
    }
    const sourcePositions = [];
    const sourceActivations = [];
    const addBySpecial = (tile, pos, otherTile) => {
      const [r, c] = pos;
      sourcePositions.push(pos);
      addCell(r, c);
      let special = tile.special;
      if (special === "stripeRow" || special === "stripeCol") {
        const horizontalSwap = posA[0] === posB[0];
        special = horizontalSwap ? "stripeRow" : "stripeCol";
      }
      sourceActivations.push({ r, c, special });
      fxWaits.push(this.playSpecialActivationFx({ ...tile, special }, pos, otherTile));
      if (special === "stripeRow") {
        addRow(r);
      } else if (special === "stripeCol") {
        addCol(c);
      } else if (special === "bomb") {
        addArea(r, c, 1);
      } else if (special === "chocolate") {
        const color = TYPES.includes(otherTile.type) ? otherTile.type : tile.type;
        addColorTargets(color, (rr, cc) => addCell(rr, cc));
      }
    };
    if (a.special) addBySpecial(a, posB, b);
    if (b.special) addBySpecial(b, posA, a);
    const triggerEvents = [];
    this.expandSpecialRemoval(remove, triggerEvents, sourcePositions, sourceActivations);
    if (fxWaits.length) await Promise.all(fxWaits);
    await this.playRemovalSpecialFx(remove, [posA, posB], triggerEvents);
    await this.removePositions(remove, null);
    await this.collapseAndFill();
  }

  async playRemovalSpecialFx(remove, skipPositions = [], triggerEvents = null) {
    const skip = new Set(skipPositions.map(([r, c]) => `${r},${c}`));
    const events = triggerEvents && triggerEvents.length
      ? triggerEvents
      : [...remove].map((key) => {
        const [r, c] = key.split(",").map(Number);
        const tile = this.board[r]?.[c];
        return tile?.special ? { r, c, special: tile.special } : null;
      }).filter(Boolean);
    const queued = [];
    const seen = new Set();
    for (const event of events) {
      const key = `${event.r},${event.c}`;
      if (skip.has(key) || seen.has(key)) continue;
      const tile = this.board[event.r]?.[event.c];
      if (!tile?.special || tile.chest) continue;
      seen.add(key);
      queued.push({ event: { ...event }, tile: { ...tile } });
    }
    for (let index = 0; index < queued.length; index += 4) {
      await Promise.all(queued.slice(index, index + 4).map(({ event, tile }) => {
        if (tile.special === "chocolate") {
          return this.playChocolateFx(event.r, event.c, event.color || this.randomTransformColor());
        }
        return this.playSpecialActivationFx({ ...tile, special: event.special || tile.special }, [event.r, event.c], tile);
      }));
    }
  }

  recordSpecialCombo(specials) {
    const striped = specials.filter((special) => special === "stripeRow" || special === "stripeCol").length;
    const bombs = specials.filter((special) => special === "bomb").length;
    const chocolates = specials.filter((special) => special === "chocolate").length;
    const counts = this.gameMode === "free" ? this.freeComboCounts : this.comboCounts;
    counts.any += 1;
    if (striped === 2) counts.stripeStripe += 1;
    else if (striped === 1 && bombs === 1) counts.stripeBomb += 1;
    else if (bombs === 2) counts.bombBomb += 1;
    else if (chocolates >= 1) counts.chocolateSpecial += 1;
    this.updateOrders();
  }

  randomTransformColor() {
    const available = TYPES.filter((type) => {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.board[r][c];
          if (tile && tile.type === type && tile.special !== "chocolate") return true;
        }
      }
      return false;
    });
    return Phaser.Utils.Array.GetRandom(available.length ? available : TYPES);
  }

  async transformColorToSpecial(color, specialKind) {
    const transformed = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r][c];
        if (!tile || tile.scatter || tile.type !== color || tile.special === "chocolate") continue;
        const special = specialKind === "stripe"
          ? (Phaser.Math.Between(0, 1) === 0 ? "stripeRow" : "stripeCol")
          : "bomb";
        const oldSprite = this.sprites[r]?.[c];
        if (oldSprite) this.destroyCandySprite(oldSprite);
        this.board[r][c] = { type: tile.type, special };
        const sprite = this.createCandySprite(this.board[r][c], r, c, true);
        this.sprites[r][c] = sprite;
        transformed.push({ r, c, sprite });
      }
    }
    transformed.forEach(({ r, c, sprite }, i) => {
      sprite.getChildren().forEach((child) => {
        child.setScale(child.scaleX * 0.35, child.scaleY * 0.35);
        this.tweens.add({
          targets: child,
          scaleX: child.scaleX / 0.35,
          scaleY: child.scaleY / 0.35,
          delay: i * 35,
          duration: 320,
          ease: "Back.Out"
        });
      });
      this.time.delayedCall(i * 35, () => this.burstAt(this.cellX(c), this.cellY(r), specialKind === "stripe" ? 0x8ee8ff : 0xff8fc7));
    });
    this.playPopSound(860);
    this.time.delayedCall(140, () => this.playPopSound(1320));
    await this.wait(480 + Math.min(transformed.length, 12) * 35);
  }

  async resolveAll(options = {}) {
    let wave = 0;
    while (true) {
      const matches = this.findMatches();
      if (matches.length === 0) break;
      if (wave > 0) {
        if (this.gameMode === "free") this.freeCascadeCount += 1;
        else this.cascadeCount += 1;
        this.showComboText(wave + 1);
        this.playPopSound(720 + wave * 70);
      }
      await this.resolveMatches(matches, wave === 0 ? options : {});
      await this.collapseAndFill([], wave);
      if (this.gameMode === "free") this.updateFreeUi();
      else this.updateOrders();
      wave += 1;
      if (wave > 20) break;
    }
  }

  findMatches() {
    const groups = [];
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < COLS) {
        const start = c;
        const type = this.matchableType(r, c);
        while (c < COLS && this.matchableType(r, c) === type && type) c++;
        if (type && c - start >= 3) {
          groups.push({ dir: "h", cells: Array.from({ length: c - start }, (_, i) => [r, start + i]) });
        }
        if (!type) c++;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < this.rows) {
        const start = r;
        const type = this.matchableType(r, c);
        while (r < this.rows && this.matchableType(r, c) === type && type) r++;
        if (type && r - start >= 3) {
          groups.push({ dir: "v", cells: Array.from({ length: r - start }, (_, i) => [start + i, c]) });
        }
        if (!type) r++;
      }
    }
    return groups;
  }

  matchableType(r, c) {
    const tile = this.board[r]?.[c];
    if (!tile || tile.chest || tile.scatter || tile.special) return null;
    return tile.type;
  }

  async resolveMatches(matches, options = {}) {
    const remove = new Set();
    const create = [];
    const cellHits = new Map();
    const preferred = (options.preferredCreatePositions || []).map(([r, c]) => `${r},${c}`);
    const protectedKeys = new Set((options.protectedPositions || []).map(([r, c]) => `${r},${c}`));

    for (const group of matches) {
      const cells = group.cells;
      cells.forEach(([r, c]) => {
        const key = `${r},${c}`;
        const hit = cellHits.get(key) || { r, c, count: 0, max: 0, dirs: new Set() };
        hit.count += 1;
        hit.max = Math.max(hit.max, cells.length);
        hit.dirs.add(group.dir);
        cellHits.set(key, hit);
      });

      cells.forEach(([r, c]) => remove.add(`${r},${c}`));
    }

    protectedKeys.forEach((key) => remove.delete(key));
    const preferHit = (hits) => {
      for (const key of preferred) {
        const found = hits.find((hit) => `${hit.r},${hit.c}` === key);
        if (found) return found;
      }
      return hits[0];
    };
    const hits = [...cellHits.values()].filter((hit) => !protectedKeys.has(`${hit.r},${hit.c}`));
    const longHit = preferHit(hits.filter((hit) => hit.max >= 5));
    if (longHit) {
      create.push({ r: longHit.r, c: longHit.c, special: "chocolate", type: this.board[longHit.r][longHit.c].type });
      if (this.gameMode === "free") this.freeChocolatesCreated += 1;
      else this.chocolatesCreated += 1;
    } else {
      const bombHit = preferHit(hits.filter((hit) => hit.dirs.size > 1));
      if (bombHit) {
        create.push({ r: bombHit.r, c: bombHit.c, special: "bomb", type: this.board[bombHit.r][bombHit.c].type });
      } else {
        const stripeHit = preferHit(hits.filter((hit) => hit.max === 4));
        if (stripeHit) {
          const dir = stripeHit.dirs.has("h") ? "stripeRow" : "stripeCol";
          create.push({ r: stripeHit.r, c: stripeHit.c, special: dir, type: this.board[stripeHit.r][stripeHit.c].type });
        }
      }
    }

    create.forEach(({ r, c }) => remove.delete(`${r},${c}`));
    if (!options.allowSpecialExpansion) {
      for (const key of [...remove]) {
        const [r, c] = key.split(",").map(Number);
        if (this.board[r]?.[c]?.special) remove.delete(key);
      }
    }
    const triggerEvents = [];
    if (options.allowSpecialExpansion) {
      this.expandSpecialRemoval(remove, triggerEvents);
      await this.playRemovalSpecialFx(remove, create.map(({ r, c }) => [r, c]), triggerEvents);
    }
    await this.removePositions(remove, create);
    for (const made of create) {
      const oldSprite = this.sprites[made.r]?.[made.c];
      if (oldSprite) this.destroyCandySprite(oldSprite);
      this.board[made.r][made.c] = { type: made.type, special: made.special };
      this.sprites[made.r][made.c] = this.createCandySprite(this.board[made.r][made.c], made.r, made.c, false);
    }
    await this.wait(140);
    return create;
  }

  expandSpecialRemoval(remove, triggerEvents = [], sourcePositions = [], sourceActivations = []) {
    let changed = true;
    const seenTriggers = new Set(triggerEvents.map((event) => `${event.r},${event.c}`));
    const sourceKeys = new Set(sourcePositions.map(([r, c]) => `${r},${c}`));
    const processedTriggers = new Set();
    const activeStripeTriggers = sourceActivations
      .filter((event) => event.special === "stripeRow" || event.special === "stripeCol")
      .map((event) => ({ ...event }));
    while (changed) {
      changed = false;
      for (const key of [...remove]) {
        if (sourceKeys.has(key) || processedTriggers.has(key)) continue;
        const [r, c] = key.split(",").map(Number);
        const tile = this.board[r]?.[c];
        if (!tile || !tile.special) continue;
        let triggerEvent = triggerEvents.find((event) => event.r === r && event.c === c);
        if (!triggerEvent && !seenTriggers.has(key)) {
          triggerEvent = { r, c, special: tile.special };
          if (tile.special === "chocolate") triggerEvent.color = this.randomTransformColor();
          triggerEvents.push(triggerEvent);
          seenTriggers.add(key);
        }
        const stripeTrigger = activeStripeTriggers.map((source) => {
          if (source.r === r && source.c === c) return null;
          if (source.special === "stripeRow" && source.r === r) return "stripeRow";
          if (source.special === "stripeCol" && source.c === c) return "stripeCol";
          return null;
        }).find(Boolean);
        const stripeSpecial = (tile.special === "stripeRow" || tile.special === "stripeCol")
          ? (stripeTrigger === "stripeRow"
            ? "stripeCol"
            : stripeTrigger === "stripeCol"
              ? "stripeRow"
              : (Phaser.Math.Between(0, 1) === 0 ? "stripeRow" : "stripeCol"))
          : tile.special;
        processedTriggers.add(key);
        if (stripeSpecial === "stripeRow" || stripeSpecial === "stripeCol") {
          activeStripeTriggers.push({ r, c, special: stripeSpecial });
        }
        if (triggerEvent) triggerEvent.special = stripeSpecial;
        if (stripeSpecial === "stripeRow") {
          for (let cc = 0; cc < COLS; cc++) {
            const next = `${r},${cc}`;
            if (!remove.has(next)) {
              remove.add(next);
              changed = true;
            }
          }
        }
        if (stripeSpecial === "stripeCol") {
          for (let rr = 0; rr < this.rows; rr++) {
            const next = `${rr},${c}`;
            if (!remove.has(next)) {
              remove.add(next);
              changed = true;
            }
          }
        }
        if (tile.special === "bomb") {
          for (let rr = Math.max(0, r - 1); rr <= Math.min(this.rows - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(COLS - 1, c + 1); cc++) {
              const next = `${rr},${cc}`;
              if (!remove.has(next)) {
                remove.add(next);
                changed = true;
              }
            }
          }
        }
        if (tile.special === "chocolate") {
          const color = triggerEvent?.color || this.randomTransformColor();
          for (let rr = 0; rr < this.rows; rr++) {
            for (let cc = 0; cc < COLS; cc++) {
              const target = this.board[rr]?.[cc];
              if (target && target.type === color && target.special !== "chocolate") {
                const next = `${rr},${cc}`;
                if (!remove.has(next)) {
                  remove.add(next);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  async removePositions(remove, create) {
    const targets = [];
    const removedSprites = [];
    for (const key of remove) {
      const [r, c] = key.split(",").map(Number);
      const tile = this.board[r][c];
      if (!tile) continue;
      if (tile.chest || tile.scatter) continue;
      if (this.gameMode === "free") {
        this.freeRemoved += 1;
        if (this.freeRemovedByColor[tile.type] !== undefined) this.freeRemovedByColor[tile.type] += 1;
      } else {
        this.totalRemoved += 1;
        if (this.removedByColor[tile.type] !== undefined) this.removedByColor[tile.type] += 1;
      }
      const sprite = this.sprites[r]?.[c];
      if (sprite) {
        sprite.getChildren().forEach((child) => targets.push(child));
        removedSprites.push(sprite);
        this.sprites[r][c] = null;
      }
      this.board[r][c] = null;
    }
    if (this.gameMode === "free") {
      this.updateFreeUi();
    } else {
      this.updateOrders();
    }
    if (targets.length) {
      this.playPopSound(480 + Math.min(this.totalRemoved, 20) * 18);
      for (const key of [...remove].slice(0, 10)) {
        const [rr, cc] = key.split(",").map(Number);
        this.burstAt(this.cellX(cc), this.cellY(rr), 0xfff06a);
      }
      this.tweens.add({ targets, scale: 1.35, alpha: 0, duration: 210, ease: "Cubic.In" });
      await this.wait(230);
    }
    removedSprites.forEach((sprite) => {
      this.destroyCandySprite(sprite);
    });
    if (create) {
      create.forEach(({ r, c, type, special }) => {
        this.board[r][c] = { type, special };
      });
    }
  }

  async collapseAndFill(lockedPositions = [], wave = 0) {
    const locked = new Set(lockedPositions.map(([r, c]) => `${r},${c}`));
    const nextBoard = Array.from({ length: this.rows }, () => Array(COLS).fill(null));
    const nextSprites = Array.from({ length: this.rows }, () => Array(COLS).fill(null));
    const refillAssistContext = this.refillAssistContext || this.createRefillAssistContext();
    let totalSpawnSlots = 0;
    for (let c = 0; c < COLS; c++) {
      let lockedCount = 0;
      let movableCount = 0;
      for (let r = 0; r < this.rows; r++) {
        if (locked.has(`${r},${c}`) && this.board[r][c]) lockedCount += 1;
        else if (this.board[r][c]) movableCount += 1;
      }
      totalSpawnSlots += this.rows - lockedCount - movableCount;
    }
    const scatterSpawnOrdinal = this.scatterDropQueued
      && this.countScatters() < this.scatterGoal
      && totalSpawnSlots > 0
      ? Phaser.Math.Between(0, totalSpawnSlots - 1)
      : -1;
    let globalSpawnIndex = 0;
    for (let c = 0; c < COLS; c++) {
      const stack = [];
      const lockedRows = new Set();
      for (let r = this.rows - 1; r >= 0; r--) {
        if (locked.has(`${r},${c}`) && this.board[r][c]) {
          lockedRows.add(r);
          nextBoard[r][c] = this.board[r][c];
          nextSprites[r][c] = this.sprites[r][c];
        } else if (this.board[r][c]) {
          stack.push({ tile: this.board[r][c], sprite: this.sprites[r][c] });
        }
      }
      let writeRow = this.rows - 1;
      for (const item of stack) {
        while (lockedRows.has(writeRow)) writeRow -= 1;
        nextBoard[writeRow][c] = item.tile;
        nextSprites[writeRow][c] = item.sprite;
        this.moveSpriteTo(item.sprite, writeRow, c, 260);
        writeRow -= 1;
      }
      let spawnIndex = 0;
      for (let r = writeRow; r >= 0; r--) {
        if (lockedRows.has(r)) continue;
        const spawnScatter = globalSpawnIndex === scatterSpawnOrdinal;
        const tile = spawnScatter
          ? { type: "scatter", special: null, scatter: true }
          : this.randomRefillTile(nextBoard, r, c, refillAssistContext);
        if (spawnScatter) this.scatterDropQueued = false;
        const startY = this.cellY(-1 - spawnIndex);
        const sprite = this.createCandySprite(tile, r, c, true, startY);
        nextBoard[r][c] = tile;
        nextSprites[r][c] = sprite;
        this.moveSpriteTo(sprite, r, c, 320 + spawnIndex * 35);
        spawnIndex += 1;
        globalSpawnIndex += 1;
      }
    }
    this.board = nextBoard;
    this.sprites = nextSprites;
    await this.wait(380);
  }

  updateFreeUi() {
    if (this.freeMovesText) this.freeMovesText.setText(`MOVE:${this.freeMovesLeft}`);
    if (this.freeScatterText) this.freeScatterText.setText(`SCATTER:${this.countScatters()}/${this.scatterGoal}`);
    if (this.freeWinText) this.freeWinText.setText(`WIN ${this.freeReward}`);
    if (this.gameMode === "free") {
      this.statusText.setText(`Complete bonus orders. Removed: ${this.freeRemoved}`);
      this.winText.setText(`BONUS WIN ${this.freeReward}`);
    }
  }

  countScatters() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r]?.[c]?.scatter) count += 1;
      }
    }
    return count;
  }

  scatterPositions(limit = Infinity) {
    const positions = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r]?.[c]?.scatter) {
          positions.push([r, c]);
          if (positions.length >= limit) return positions;
        }
      }
    }
    return positions;
  }

  checkScatterBonus() {
    if (this.gameMode !== "main") return false;
    if (this.countScatters() >= this.scatterGoal) {
      this.bonusPending = true;
      this.updateKeyUi();
      this.statusText.setText("3 SCATTERS! Bonus unlocked.");
      return true;
    }
    this.updateKeyUi();
    return false;
  }
  updateKeyUi() {
    if (this.keyHudText) this.keyHudText.setText(`${this.countScatters()}/${this.scatterGoal}`);
  }

  async showFreeRetriggerCard() {
    const group = this.add.group();
    const centerY = this.boardY + this.cell * this.rows * 0.48;
    const veil = this.add.rectangle(W / 2, centerY, W, 190, 0x2b0818, 0.76).setDepth(130);
    const plate = this.add.rectangle(W / 2, centerY, W - 54, 132, 0xa51d55, 0.98)
      .setStrokeStyle(6, 0xfff06a, 1)
      .setDepth(131)
      .setScale(0.72);
    const chest = this.add.image(W / 2, centerY - 62, "sym-scatter").setDepth(133);
    chest.setScale(72 / Math.max(chest.width, chest.height));
    const title = this.add.text(W / 2, centerY - 12, "RETRIGGER!", {
      fontSize: 38,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#4a1028",
      strokeThickness: 9
    }).setOrigin(0.5).setDepth(133);
    const moves = this.add.text(W / 2, centerY + 42, `+${MATH_CONFIG.bonusRetriggerMoves} MOVES`, {
      fontSize: 31,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#4a1028",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(133);
    group.addMultiple([veil, plate, chest, title, moves]);
    [chest, title, moves].forEach((item) => {
      const scaleX = item.scaleX;
      const scaleY = item.scaleY;
      item.setAlpha(0).setScale(scaleX * 0.65, scaleY * 0.65);
      this.tweens.add({ targets: item, alpha: 1, scaleX, scaleY, duration: 360, ease: "Back.Out" });
    });
    this.tweens.add({ targets: plate, scale: 1, duration: 240, ease: "Back.Out" });
    this.cameras.main.flash(420, 255, 232, 96);
    await this.wait(1350);
    const items = [...group.getChildren()];
    this.tweens.add({ targets: items, alpha: 0, y: "-=18", duration: 260, ease: "Cubic.In" });
    await this.wait(280);
    this.destroyTempGroup(group);
  }

  async collectBonusScatterRetrigger() {
    const positions = this.scatterPositions(this.scatterGoal);
    const maxRetriggers = Number(MATH_CONFIG.maxBonusRetriggers || Infinity);
    if (this.gameMode !== "free" || this.freeScatterRetriggers >= maxRetriggers || positions.length < this.scatterGoal) return false;
    this.freeMovesLeft += MATH_CONFIG.bonusRetriggerMoves;
    this.freeScatterRetriggers += 1;
    this.updateFreeUi();
    this.statusText.setText(`+${MATH_CONFIG.bonusRetriggerMoves} FREE MOVES! ${this.freeScatterRetriggers}/${maxRetriggers}`);
    this.playUnlockSound();
    this.time.delayedCall(120, () => this.playPopSound(1480));
    this.cameras.main.flash(420, 255, 240, 106);
    this.cameras.main.shake(420, 0.012);
    await this.showFreeRetriggerCard();
    positions.forEach(([r, c], index) => {
      const x = this.cellX(c);
      const y = this.cellY(r);
      this.time.delayedCall(index * 90, () => this.burstAt(x, y, 0xfff06a));
      const sprite = this.sprites[r]?.[c];
      if (sprite) {
        sprite.getChildren().forEach((child) => {
          this.tweens.add({
            targets: child,
            x: W / 2,
            y: 226,
            scale: child.scale * 1.25,
            alpha: 0,
            delay: index * 80,
            duration: 420,
            ease: "Cubic.In"
          });
        });
      }
    });
    await this.wait(520);
    positions.forEach(([r, c]) => {
      const sprite = this.sprites[r]?.[c];
      if (sprite) this.destroyCandySprite(sprite);
      this.board[r][c] = null;
      this.sprites[r][c] = null;
    });
    await this.collapseAndFill();
    return true;
  }

  async checkFreeScatterRetrigger() {
    if (this.gameMode !== "free") return false;
    let triggered = false;
    let guard = 0;
    while (this.countScatters() >= this.scatterGoal && guard < 3) {
      const collected = await this.collectBonusScatterRetrigger();
      if (!collected) break;
      triggered = true;
      await this.resolveAll();
      guard += 1;
    }
    return triggered;
  }

  showBonusEventBanner(text, color = 0xfff06a) {
    const boardCenterY = this.boardY + this.cell * this.rows / 2;
    const wash = this.add.rectangle(W / 2, boardCenterY, W, this.cell * this.rows + 36, 0x061b30, 0.28).setDepth(36).setAlpha(0);
    wash.isFxSprite = true;
    this.fxSprites.add(wash);
    const plate = this.add.rectangle(W / 2, this.boardY + 96, W - 72, 54, color, 0.34).setStrokeStyle(4, 0xffffff, 0.86).setDepth(37).setAlpha(0);
    plate.isFxSprite = true;
    this.fxSprites.add(plate);
    const label = this.add.text(W / 2, this.boardY + 96, text, {
      fontFamily: "Arial Black",
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#061b30",
      strokeThickness: 8
    }).setDepth(38).setOrigin(0.5).setAlpha(0);
    label.isFxSprite = true;
    this.fxSprites.add(label);
    this.tweens.add({ targets: wash, alpha: 0.28, duration: 110, yoyo: true, repeat: 1, ease: "Sine.InOut" });
    this.tweens.add({ targets: [label, plate], alpha: 1, scale: 1.08, duration: 160, yoyo: true, repeat: 1, ease: "Back.Out" });
    this.tweens.add({
      targets: [label, plate],
      y: this.boardY + 64,
      alpha: 0,
      delay: 780,
      duration: 420,
      ease: "Cubic.In",
      onComplete: () => {
        this.destroyFx(label);
        this.destroyFx(plate);
      }
    });
    this.tweens.add({ targets: wash, alpha: 0, delay: 820, duration: 360, ease: "Cubic.In", onComplete: () => this.destroyFx(wash) });
    this.playUnlockSound();
  }

  async playBonusForgeShow(r, c) {
    const x = this.cellX(c);
    const y = this.cellY(r);
    const beam = this.addFxRect(x, this.boardY - 24, 34, 60, 0x8ee8ff, 0.72).setDepth(35);
    const ring = this.add.circle(x, y, 8, 0x8ee8ff, 0.18).setStrokeStyle(5, 0xffffff, 0.95).setDepth(35);
    ring.isFxSprite = true;
    this.fxSprites.add(ring);
    this.tweens.add({ targets: beam, y, scaleY: 3.2, alpha: 0, duration: 520, ease: "Cubic.In", onComplete: () => this.destroyFx(beam) });
    this.tweens.add({ targets: ring, radius: 70, alpha: 0, delay: 160, duration: 620, ease: "Cubic.Out", onComplete: () => this.destroyFx(ring) });
    for (let i = 0; i < 10; i++) {
      const bit = this.addFxRect(x, y, i % 2 ? 8 : 12, i % 2 ? 12 : 8, i % 3 ? 0x8ee8ff : 0xffffff, 1).setDepth(36);
      const angle = (Math.PI * 2 * i) / 10;
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angle) * (48 + (i % 3) * 12),
        y: y + Math.sin(angle) * (48 + (i % 3) * 12),
        angle: 180,
        alpha: 0,
        delay: 160,
        duration: 620,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(bit)
      });
    }
    this.cameras.main.shake(220, 0.006);
    this.playPopSound(980);
    this.time.delayedCall(140, () => this.playPopSound(1560));
    await this.wait(420);
  }

  async playBonusStormShow(color, remove, type) {
    const boardCenterY = this.boardY + this.cell * this.rows / 2;
    const symbol = this.add.image(W / 2, boardCenterY, this.symbolKey({ type, special: null })).setDepth(39).setAlpha(0);
    symbol.setScale(66 / Math.max(symbol.width, symbol.height));
    symbol.isFxSprite = true;
    this.fxSprites.add(symbol);
    const halo = this.add.circle(W / 2, boardCenterY, 18, color, 0.22).setStrokeStyle(8, 0xffffff, 0.9).setDepth(38).setAlpha(0);
    halo.isFxSprite = true;
    this.fxSprites.add(halo);
    const targetText = this.add.text(W / 2, boardCenterY + 62, "TARGET SYMBOL", {
      fontFamily: "Arial Black",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#061b30",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(39).setAlpha(0);
    targetText.isFxSprite = true;
    this.fxSprites.add(targetText);
    this.tweens.add({ targets: [symbol, halo, targetText], alpha: 1, scale: 1.08, duration: 220, ease: "Back.Out" });
    this.tweens.add({ targets: halo, radius: 70, alpha: 0, delay: 180, duration: 680, ease: "Cubic.Out" });
    this.playPopSound(760);
    await this.wait(760);
    this.tweens.add({ targets: [symbol, targetText], alpha: 0, scale: 0.55, duration: 220, ease: "Cubic.In", onComplete: () => {
      this.destroyFx(symbol);
      this.destroyFx(targetText);
    }});
    const storm = this.addFxRect(-70, boardCenterY, 92, this.cell * this.rows + 34, color, 0.5).setDepth(35);
    storm.setAngle(-10);
    const white = this.addFxRect(-112, boardCenterY, 22, this.cell * this.rows + 50, 0xffffff, 0.72).setDepth(36);
    white.setAngle(-10);
    this.tweens.add({ targets: storm, x: W + 88, alpha: 0.18, duration: 620, ease: "Cubic.InOut", onComplete: () => this.destroyFx(storm) });
    this.tweens.add({ targets: white, x: W + 118, alpha: 0, duration: 560, ease: "Cubic.InOut", onComplete: () => this.destroyFx(white) });
    [...remove].slice(0, 18).forEach((key, index) => {
      const [r, c] = key.split(",").map(Number);
      this.time.delayedCall(140 + index * 18, () => this.burstAt(this.cellX(c), this.cellY(r), color));
    });
    this.cameras.main.shake(360, 0.008);
    this.playPopSound(520);
    this.time.delayedCall(160, () => this.playPopSound(1120));
    await this.wait(560);
  }

  async playBonusChefShow(orderIndex, fromNeed, toNeed) {
    const rowY = this.orderRowY(orderIndex);
    const row = this.orderRows[orderIndex];
    const focus = this.add.rectangle(W / 2, rowY, W - 42, 42, 0xff8fc7, 0.24).setStrokeStyle(4, 0xffffff, 0.9).setDepth(37).setAlpha(0);
    focus.isFxSprite = true;
    this.fxSprites.add(focus);
    const counter = { value: fromNeed };
    const number = this.add.text(206, rowY, `${fromNeed}`, {
      fontFamily: "Arial Black",
      fontSize: "27px",
      color: "#ffffff",
      stroke: "#351352",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(76);
    number.isFxSprite = true;
    this.fxSprites.add(number);
    this.tweens.add({ targets: [focus, row.progress], alpha: 1, scale: 1.18, duration: 190, yoyo: true, repeat: 1, ease: "Back.Out" });
    this.tweens.add({ targets: number, scale: 1.35, duration: 180, yoyo: true, repeat: 1, ease: "Back.Out" });
    this.playPopSound(740);
    await this.wait(360);
    this.tweens.add({
      targets: counter,
      value: toNeed,
      duration: 760,
      ease: "Cubic.Out",
      onUpdate: () => number.setText(`${Math.round(counter.value)}`)
    });
    this.tweens.add({ targets: [number, row.progress], scale: 1.24, duration: 110, yoyo: true, repeat: 5, ease: "Sine.InOut" });
    this.time.delayedCall(180, () => this.playPopSound(980));
    this.time.delayedCall(420, () => this.playPopSound(1280));
    this.time.delayedCall(710, () => this.burstAt(206, rowY, 0xff8fc7));
    await this.wait(860);
    this.tweens.add({ targets: [focus, number], alpha: 0, duration: 260, ease: "Cubic.In", onComplete: () => {
      this.destroyFx(focus);
      this.destroyFx(number);
    }});
  }

  async playBonusGoldShow(orderIndex, fromRange, toRange) {
    const rowY = this.orderRowY(orderIndex);
    const row = this.orderRows[orderIndex];
    const wash = this.add.rectangle(W / 2, rowY, W - 28, 45, 0xfff06a, 0.44).setStrokeStyle(4, 0xffffff, 0.85).setDepth(36);
    wash.isFxSprite = true;
    this.fxSprites.add(wash);
    for (let i = 0; i < 8; i++) {
      const ray = this.addFxRect(W / 2, rowY, W - 50, 5, i % 2 ? 0xffffff : 0xfff06a, 0.8).setDepth(37);
      ray.setAngle(-18 + i * 5);
      this.tweens.add({ targets: ray, scaleX: 1.12, alpha: 0, delay: i * 38, duration: 520, ease: "Cubic.Out", onComplete: () => this.destroyFx(ray) });
    }
    const beforeText = `${fromRange.min}-${fromRange.max}x`;
    const afterText = `${toRange.min}-${toRange.max}x`;
    const mult = this.add.text(W - 54, rowY, beforeText, {
      fontFamily: "Arial Black",
      fontSize: "18px",
      color: "#fff6d0",
      stroke: "#5c1d00",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(39);
    mult.isFxSprite = true;
    this.fxSprites.add(mult);
    this.tweens.add({ targets: [mult, row.reward], scale: 1.34, duration: 260, yoyo: true, repeat: 1, ease: "Back.Out" });
    this.time.delayedCall(720, () => {
      mult.setText(afterText).setColor("#ffffff");
      this.burstAt(W - 54, rowY, 0xfff06a);
      this.playUnlockSound();
    });
    this.tweens.add({ targets: [mult, row.reward], scale: 1.18, delay: 720, duration: 180, yoyo: true, repeat: 4, ease: "Sine.InOut" });
    this.tweens.add({ targets: wash, scaleX: 1.05, alpha: 0, delay: 1020, duration: 560, ease: "Cubic.In", onComplete: () => this.destroyFx(wash) });
    this.tweens.add({ targets: mult, alpha: 0, y: rowY - 30, delay: 1460, duration: 420, ease: "Cubic.In", onComplete: () => this.destroyFx(mult) });
    this.cameras.main.flash(260, 255, 240, 106);
    this.playCoinSpraySound();
    await this.wait(1580);
  }

  plainCandyPositions() {
    const positions = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r]?.[c];
        if (tile && !tile.scatter && !tile.chest && !tile.special) positions.push([r, c]);
      }
    }
    return positions;
  }

  async bonusEventMakeSpecial() {
    const positions = this.plainCandyPositions();
    if (!positions.length) return false;
    this.showBonusEventBanner("SUGAR FORGE", 0x8ee8ff);
    const countTicket = this.pickWeightedBand(MATH_CONFIG.bonusSpecialCountBands);
    const roll = Math.random();
    const count = countTicket ? this.rollIntegerRange(countTicket, 1) : (roll < 0.68 ? 1 : roll < 0.92 ? 2 : 3);
    const picked = Phaser.Utils.Array.Shuffle([...positions]).slice(0, Math.min(count, positions.length));
    for (let i = 0; i < picked.length; i++) {
      const [r, c] = picked[i];
      const tile = this.board[r][c];
      const special = Phaser.Utils.Array.GetRandom(["stripeRow", "stripeCol", "bomb"]);
      const oldSprite = this.sprites[r]?.[c];
      if (oldSprite) this.destroyCandySprite(oldSprite);
      this.board[r][c] = { type: tile.type, special };
      const sprite = this.createCandySprite(this.board[r][c], r, c, true);
      this.sprites[r][c] = sprite;
      await this.playBonusForgeShow(r, c);
      sprite.getChildren().filter((child) => child.type === "Image").forEach((child) => {
        this.tweens.killTweensOf(child);
        const baseScaleX = child.scaleX;
        const baseScaleY = child.scaleY;
        child.setScale(child.scaleX * 0.45, child.scaleY * 0.45);
        this.tweens.add({ targets: child, scaleX: baseScaleX, scaleY: baseScaleY, duration: 330, ease: "Back.Out" });
      });
      this.burstAt(this.cellX(c), this.cellY(r), 0x8ee8ff);
    }
    if (picked.length > 1) {
      const label = this.add.text(W / 2, this.boardY + 144, `x${picked.length}`, {
        fontFamily: "Arial Black",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#061b30",
        strokeThickness: 7
      }).setOrigin(0.5).setDepth(39);
      label.isFxSprite = true;
      this.fxSprites.add(label);
      this.tweens.add({
        targets: label,
        y: label.y - 34,
        scale: 1.2,
        alpha: 0,
        duration: 760,
        ease: "Cubic.Out",
        onComplete: () => this.destroyFx(label)
      });
    }
    await this.wait(360);
    return true;
  }

  async bonusEventClearColor() {
    const counts = TYPES.map((type) => ({
      type,
      count: this.board.flat().filter((tile) => tile && !tile.scatter && !tile.special && tile.type === type).length
    })).filter((item) => item.count >= 3);
    if (!counts.length) return false;
    const color = Phaser.Utils.Array.GetRandom(counts).type;
    const remove = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r]?.[c];
        if (tile && !tile.scatter && !tile.special && tile.type === color) remove.add(`${r},${c}`);
      }
    }
    if (!remove.size) return false;
    this.freeColorClearUsed = true;
    this.showBonusEventBanner("SUGAR STORM", COLORS[color]);
    await this.playBonusStormShow(COLORS[color], remove, color);
    await this.removePositions(remove, null);
    await this.collapseAndFill();
    await this.resolveAll();
    await this.checkFreeScatterRetrigger();
    return true;
  }

  async bonusEventDiscountOrder() {
    const candidates = this.orders
      .map((order, index) => ({ order, index, progress: this.orderProgress(order) }))
      .filter(({ order, progress }) => order.scope === "free" && !order.completed && !order.discounted && order.need - progress > 1);
    if (!candidates.length) return false;
    const picked = Phaser.Utils.Array.GetRandom(candidates);
    const remaining = picked.order.need - picked.progress;
    const fromNeed = picked.order.need;
    const discountTicket = this.pickWeightedBand(MATH_CONFIG.bonusDiscountBands);
    const cutRate = discountTicket
      ? Phaser.Math.FloatBetween(Number(discountTicket.min || 0.22), Number(discountTicket.max ?? discountTicket.min ?? 0.42))
      : Phaser.Math.FloatBetween(0.22, 0.42);
    const cutAmount = Math.max(1, Math.floor(remaining * cutRate));
    picked.order.need = Math.max(picked.progress + 1, picked.order.need - cutAmount);
    const toNeed = picked.order.need;
    picked.order.discounted = true;
    this.showBonusEventBanner("CHEF'S HELP", 0xff8fc7);
    await this.playBonusChefShow(picked.index, fromNeed, toNeed);
    const row = this.orderRows[picked.index];
    this.tweens.add({ targets: [row.panel, row.reward], scale: 1.12, duration: 140, yoyo: true, repeat: 1, ease: "Back.Out" });
    this.updateOrders();
    await this.wait(620);
    return true;
  }

  async bonusEventGoldOrder() {
    const candidates = this.orders
      .map((order, index) => ({ order, index }))
      .filter(({ order }) => order.scope === "free" && !order.completed && !order.gold);
    if (!candidates.length) return false;
    const picked = Phaser.Utils.Array.GetRandom(candidates);
    const fromRange = this.orderMultRange(picked.order);
    picked.order.gold = true;
    picked.order.goldMult = Number(this.rollBandValue(MATH_CONFIG.bonusGoldMultiplierBands, 1.24).toFixed(2));
    const toRange = {
      min: Math.max(1, Math.round(fromRange.min * picked.order.goldMult)),
      max: Math.max(1, Math.round(fromRange.max * picked.order.goldMult))
    };
    this.showBonusEventBanner(`GOLDEN RUSH x${picked.order.goldMult}`, 0xfff06a);
    await this.playBonusGoldShow(picked.index, fromRange, toRange);
    const row = this.orderRows[picked.index];
    this.tweens.add({ targets: [row.glow, row.frameArt, row.reward], scale: 1.14, duration: 150, yoyo: true, repeat: 2, ease: "Back.Out" });
    this.updateOrders();
    await this.wait(720);
    return true;
  }

  async maybeTriggerBonusMoveEvent() {
    if (this.gameMode !== "free" || this.freeMoveHadEvent) return false;
    const configured = Array.isArray(MATH_CONFIG.bonusEventTickets) && MATH_CONFIG.bonusEventTickets.length
      ? MATH_CONFIG.bonusEventTickets
      : [
        { kind: "special", weight: 48 },
        { kind: "discount", weight: 30 },
        { kind: "gold", weight: 20, repeatWeight: 8 },
        { kind: "clear", weight: 8, repeatWeight: 0, maxPerBonus: 1 }
      ];
    const runEvent = {
      special: () => this.bonusEventMakeSpecial(),
      clear: () => this.bonusEventClearColor(),
      discount: () => this.bonusEventDiscountOrder(),
      gold: () => this.bonusEventGoldOrder()
    };
    const events = configured.map((ticket) => {
      const count = Number(this.bonusEventSessionCounts[ticket.kind] || 0);
      const max = Number(ticket.maxPerBonus ?? Infinity);
      const weight = count > 0 ? Number(ticket.repeatWeight ?? ticket.weight ?? 0) : Number(ticket.weight || 0);
      return { kind: ticket.kind, weight: count >= max ? 0 : Math.max(0, weight), run: runEvent[ticket.kind] };
    }).filter((event) => event.weight > 0 && event.run);
    for (let attempt = 0; attempt < events.length; attempt++) {
      const total = events.reduce((sum, event) => sum + event.weight, 0);
      let roll = Math.random() * total;
      let selectedIndex = 0;
      for (let i = 0; i < events.length; i++) {
        roll -= events[i].weight;
        if (roll <= 0) {
          selectedIndex = i;
          break;
        }
      }
      const selected = events.splice(selectedIndex, 1)[0];
      if (await selected.run()) {
        this.freeMoveHadEvent = true;
        this.freeEventCount += 1;
        this.bonusEventSessionCounts[selected.kind] = Number(this.bonusEventSessionCounts[selected.kind] || 0) + 1;
        return true;
      }
    }
    return false;
  }

  updateOrders() {
    if (this.gameMode === "main") {
      this.updateConveyorOrders();
      return;
    }
    this.orders.forEach((order, i) => {
      const row = this.orderRows[i];
      const progress = this.orderProgress(order);
      const done = progress >= order.need;
      const near = !done && progress >= Math.ceil(order.need * 0.75);
      if (this.setOrderNearState(row, near)) this.showOrderAlmostFx(i);
      if (order.scope === "free" && order.gold) {
        row.panel.setFillStyle(done ? 0xfff2a8 : near ? 0xffd94c : 0x9b3a16, done ? 0.34 : near ? 0.32 : 0.28);
      } else {
        row.panel.setFillStyle(done ? 0xfff2a8 : near ? 0xffd94c : 0x5e1422, done ? 0.3 : near ? 0.28 : 0.1);
      }
      const layout = row.rowLayout || ORDER_ROW_LAYOUT[i];
      const rowCenter = layout.y;
      row.rowCenter = rowCenter;
      this.drawOrderIcon(row, order, layout.iconX, rowCenter);
      row.label.setPosition(layout.textX, rowCenter + layout.labelDy);
      row.progress.setPosition(layout.textX, rowCenter + layout.progressDy);
      row.label.setText(order.completed ? `${this.orderTierLabel(order)}  COMPLETE` : near ? `${this.orderTierLabel(order)}  READY SOON` : this.orderRowLabel(order));
      row.progress.setText(order.completed ? `${order.need}/${order.need}` : near ? `${Math.min(progress, order.need)}/${order.need}  ALMOST COMPLETE` : `${Math.min(progress, order.need)}/${order.need}`);
      row.reward.setFontSize(order.scope === "free" ? 12 : 12);
      row.reward.setPosition(layout.rewardX, rowCenter);
      if (row.rewardPlate) {
        row.rewardPlate.setPosition(layout.rewardX, rowCenter);
        row.rewardPlate.setDisplaySize(78, 29);
        row.rewardPlate.setFillStyle(order.scope === "free" && order.gold ? 0xffd94c : 0x4f1020, order.scope === "free" && order.gold ? 0.16 : 0.04);
      }
      const range = this.orderMultRange(order);
      const shownRange = order.scope === "free" && order.gold
        ? {
          min: Math.max(1, Math.round(range.min * (order.goldMult || 1.5))),
          max: Math.max(1, Math.round(range.max * (order.goldMult || 1.5)))
        }
        : range;
      if (order.completed) {
        row.reward.setFontSize(11).setPosition(layout.rewardX, rowCenter).setText("DONE");
      } else if (order.scope !== "free" && order.rewardType === "scatter") {
        row.reward.setFontSize(10).setPosition(layout.rewardX, rowCenter).setText("SCATTER");
      } else if (order.scope !== "free" && order.rewardType === "coinsScatter") {
        row.reward.setFontSize(9).setPosition(layout.rewardX, rowCenter).setText(`${shownRange.min}-${shownRange.max}x+S`);
      } else {
        row.reward.setText(`${shownRange.min}-${shownRange.max}x`);
      }
      this.fitOrderLabel(row);
      if (row.keyRewardIcon) row.keyRewardIcon.setVisible(false);
    });
  }

  fitOrderLabel(row) {
    const maxRight = row.reward.x - row.reward.width / 2 - 10;
    const maxWidth = Math.max(92, maxRight - row.label.x);
    let size = 12;
    row.label.setFontSize(size);
    while (row.label.width > maxWidth && size > 9) {
      size -= 1;
      row.label.setFontSize(size);
    }
    let progressSize = 11;
    row.progress.setFontSize(progressSize);
    while (row.progress.width > maxWidth && progressSize > 8) {
      progressSize -= 1;
      row.progress.setFontSize(progressSize);
    }
  }

  setOrderNearState(row, active) {
    if (!row || row.nearActive === active) return false;
    row.nearActive = active;
    (row.nearTweens || []).forEach((tween) => tween.stop());
    row.nearTweens = [];
    this.tweens.killTweensOf([row.glow, row.panel, row.dotA, row.dotB, row.label, row.progress, row.rewardPlate, row.reward]);
    const layout = row.rowLayout || ORDER_ROW_LAYOUT[0];
    row.panel.setX(W / 2);
    row.label.setX(layout.textX);
    row.label.setFontSize(12);
    row.label.setColor("#ffffff");
    row.progress.setX(layout.textX);
    row.progress.setColor("#fff4b8").setFontStyle("800");
    if (row.rewardPlate) row.rewardPlate.setScale(1);
    row.dotA.setScale(1);
    row.dotB.setScale(1);
    row.reward.setScale(1);
    row.glow.setAlpha(0).setScale(1).setStrokeStyle(3, 0xffffff, 0);
    if (!active) return false;

    row.glow.setFillStyle(0xfff06a, 0.32).setStrokeStyle(4, 0xffffff, 1);
    row.progress.setColor("#fff06a").setFontStyle("900");
    row.label.setColor("#fff06a");
    row.nearTweens.push(this.tweens.add({
      targets: row.glow,
      alpha: { from: 0.34, to: 0.9 },
      scaleX: { from: 0.99, to: 1.025 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    }));
    row.nearTweens.push(this.tweens.add({
      targets: [row.panel, row.label, row.progress],
      x: "+=1",
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    }));
    row.nearTweens.push(this.tweens.add({
      targets: [row.dotA, row.dotB, row.rewardPlate, row.reward],
      scale: { from: 1, to: 1.25 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Back.InOut"
    }));
    return true;
  }

  createConveyorUi() {
    this.conveyorUiItems = [];
    const frame = this.add.image(W / 2, 98, "ui-conveyor-panel-v2")
      .setDisplaySize(W - 10, 176)
      .setDepth(9);
    this.conveyorUiItems.push(frame);
    CONVEYOR_LANE_Y.forEach((y, lane) => {
      const danger = this.add.rectangle(CONVEYOR_LEFT_X + 15, y, 21, 36, 0xff3f63, 0.12)
        .setStrokeStyle(1, 0xffe277, 0.4)
        .setDepth(15);
      this.conveyorUiItems.push(danger);
    });
  }

  conveyorIconKey(order) {
    if (order.kind === "color") return `order-${order.type}`;
    if (order.kind === "chocolate") return "order-chocolate";
    if (order.kind === "cascade" || order.kind === "combo") return "order-cascade";
    return "order-any";
  }

  conveyorTargetLabel(order) {
    if (order.kind === "color") return `${LABELS[order.type]?.toUpperCase() || "COLOR"} CANDY`;
    if (order.kind === "chocolate") return "MAKE CHOCOLATE";
    if (order.kind === "cascade") return "CASCADE CHAIN";
    return "ANY CANDY";
  }

  createConveyorOrderView(order) {
    const tierColors = { Easy: 0x49d6a6, Medium: 0x5bd9ff, Hard: 0xffd94c };
    const fill = order.golden ? 0x8a5e0b : 0x65162a;
    const stroke = order.golden ? 0xfff06a : (tierColors[order.tier] || 0xffb1d2);
    const cardWidth = Number(order.cardWidth || this.conveyorOrderWidth(order));
    order.cardWidth = cardWidth;
    const halfWidth = cardWidth / 2;
    const container = this.add.container(order.trackX, CONVEYOR_LANE_Y[order.lane]).setDepth(24);
    const shadow = this.add.rectangle(1, 2, cardWidth, 40, 0x21060d, 0.8);
    const plate = this.add.rectangle(0, 0, cardWidth, 40, fill, 0.98).setStrokeStyle(2, stroke, 1);
    const iconSize = cardWidth >= 84 ? 40 : cardWidth >= 72 ? 38 : 36;
    const icon = this.add.image(-halfWidth + iconSize / 2 + 3, -3, this.conveyorIconKey(order));
    icon.setScale(iconSize / Math.max(icon.width, icon.height));
    const progress = this.add.text(halfWidth - 17, 6, "0/0", {
      fontSize: cardWidth >= 76 ? 11 : 10,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5);
    const barWidth = cardWidth - 8;
    const barBg = this.add.rectangle(-halfWidth + 4, 17, barWidth, 3, 0x220711, 0.95).setOrigin(0, 0.5);
    const bar = this.add.rectangle(-halfWidth + 4, 17, barWidth, 3, stroke, 1).setOrigin(0, 0.5);
    const tierDot = this.add.rectangle(halfWidth - 5, -15, 6, 6, stroke, 1).setStrokeStyle(1, 0xffffff, 0.85);
    container.add([shadow, plate, icon, progress, barBg, bar, tierDot]);
    plate.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.showConveyorOrderDetails(order.conveyorId));
    container.setScale(0.72);
    this.tweens.add({ targets: container, scale: 1, duration: 240, ease: "Back.Out" });
    const view = { container, shadow, plate, icon, progress, bar, barBg, tierDot, strokeColor: stroke, dangerTween: null };
    this.conveyorOrderViews.set(order.conveyorId, view);
    return view;
  }

  destroyConveyorOrderView(orderId, animate = false) {
    const view = this.conveyorOrderViews.get(orderId);
    if (!view) return;
    this.conveyorOrderViews.delete(orderId);
    if (view.dangerTween) view.dangerTween.stop();
    this.tweens.killTweensOf(view.container);
    const destroy = () => {
      if (view.container?.active) view.container.destroy(true);
    };
    if (!animate) {
      destroy();
      return;
    }
    this.tweens.add({
      targets: view.container,
      x: CONVEYOR_LEFT_X - 34,
      alpha: 0,
      angle: -12,
      duration: 260,
      ease: "Cubic.In",
      onComplete: destroy
    });
  }

  clearConveyorViews() {
    [...this.conveyorOrderViews.keys()].forEach((id) => this.destroyConveyorOrderView(id, false));
    this.conveyorOrderViews.clear();
  }

  setConveyorVisible(visible) {
    this.conveyorUiItems.forEach((item) => item.setVisible(visible));
    this.conveyorOrderViews.forEach((view) => view.container.setVisible(visible));
  }

  updateConveyorOrders() {
    const activeIds = new Set(this.orders.map((order) => order.conveyorId));
    [...this.conveyorOrderViews.keys()].forEach((id) => {
      if (!activeIds.has(id)) this.destroyConveyorOrderView(id, false);
    });
    this.orders.forEach((order) => {
      let view = this.conveyorOrderViews.get(order.conveyorId);
      if (!view) view = this.createConveyorOrderView(order);
      const progress = Math.min(this.orderProgress(order), order.need);
      const ratio = Phaser.Math.Clamp(progress / Math.max(1, order.need), 0, 1);
      view.progress.setText(`${progress}/${order.need}`);
      view.bar.setScale(Math.max(0.001, ratio), 1);
      const danger = order.trackX - Number(order.cardWidth || 62) / 2 < CONVEYOR_LEFT_X + 52;
      view.plate.setFillStyle(order.golden ? 0x8a5e0b : danger ? 0x8b1628 : 0x65162a, 0.98);
      view.plate.setStrokeStyle(danger ? 3 : 2, danger ? 0xffe277 : view.strokeColor, 1);
      if (danger && !view.dangerTween) {
        view.dangerTween = this.tweens.add({
          targets: [view.plate, view.icon, view.progress],
          alpha: { from: 0.72, to: 1 },
          duration: 260,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut"
        });
      } else if (!danger && view.dangerTween) {
        view.dangerTween.stop();
        view.dangerTween = null;
        [view.plate, view.icon, view.progress].forEach((item) => item.setAlpha(1));
      }
      view.container.setVisible(this.currentUiMode === "game");
    });
  }

  clearOrderIcons() {
    this.clearConveyorViews();
    this.orderRows.forEach((row) => {
      if (row.iconGroup) {
        [...row.iconGroup.getChildren()].forEach((child) => {
          this.tweens.killTweensOf(child);
          child.destroy();
        });
        row.iconGroup.destroy();
        row.iconGroup = null;
      }
    });
    this.children.list
      .filter((child) => child.isOrderIcon)
      .forEach((child) => {
        this.tweens.killTweensOf(child);
        child.destroy();
      });
  }

  drawOrderIcon(row, order, x, y) {
    if (row.iconGroup) {
      [...row.iconGroup.getChildren()].forEach((child) => {
        this.tweens.killTweensOf(child);
        child.destroy();
      });
      row.iconGroup.destroy();
    }
    row.iconGroup = this.add.group();
    const addIcon = (texture, ix, iy, size) => {
      const safeTexture = this.textures.exists(texture) ? texture : "sym-red";
      const iconImg = this.add.image(ix, iy, safeTexture).setDepth(18);
      iconImg.setScale(size / Math.max(iconImg.width || size, iconImg.height || size));
      iconImg.isOrderIcon = true;
      row.iconGroup.add(iconImg);
      return iconImg;
    };
    addIcon(this.conveyorIconKey(order), x, y, 36);
    row.iconGroup.getChildren().forEach((child) => {
      child.isOrderIcon = true;
      child.setVisible(this.sessionActive);
    });
  }

  orderProgress(order) {
    return Math.max(0, this.rawOrderProgress(order) - (order.start || 0));
  }

  rawOrderProgress(order) {
    const free = order.scope === "free";
    if (order.kind === "color") return free ? (this.freeRemovedByColor[order.type] || 0) : (this.removedByColor[order.type] || 0);
    if (order.kind === "any") return free ? this.freeRemoved : this.totalRemoved;
    if (order.kind === "cascade") return free ? this.freeCascadeCount : this.cascadeCount;
    if (order.kind === "chocolate") return free ? this.freeChocolatesCreated : this.chocolatesCreated;
    if (order.kind === "combo") return (free ? this.freeComboCounts : this.comboCounts)[order.comboType] || 0;
    return 0;
  }

  orderRowLabel(order) {
    if (order.kind !== "combo") return `${this.orderTierLabel(order)}  x${order.need}`;
    const names = {
      any: "ANY COMBO",
      stripeStripe: "STRIPE + STRIPE",
      stripeBomb: "STRIPE + BOMB",
      bombBomb: "BOMB + BOMB",
      chocolateSpecial: "CHOCO + SPECIAL"
    };
    return `${this.orderTierLabel(order)}  ${names[order.comboType] || "COMBO"} x${order.need}`;
  }

  orderTierLabel(order) {
    if (order.scope === "free" && order.gold) return "GOLD";
    if (order.scope !== "free") return String(order.tier).toUpperCase();
    if (order.tier.includes("Easy")) return "BONUS E";
    if (order.tier.includes("Medium")) return "BONUS M";
    return "BONUS H";
  }

  async showBonusIntroCard() {
    const group = this.add.group();
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x250712, 0.74).setDepth(80);
    const panel = this.add.rectangle(W / 2, H / 2, 330, 270, 0x7b1828, 0.98).setStrokeStyle(5, 0xffe277, 1).setDepth(81);
    const title = this.add.text(W / 2, H / 2 - 70, "BONUS GAME", {
      fontSize: 42,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(82);
    const sub = this.add.text(W / 2, H / 2 - 8, `${MATH_CONFIG.bonusStartMoves} FREE MOVES`, {
      fontSize: 26,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(82);
    const feature = this.add.text(W / 2, H / 2 + 42, "EVENT EVERY MOVE", {
      fontSize: 22,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(82);
    const hint = this.add.text(W / 2, H / 2 + 88, "BOARD EVENTS + BONUS ORDERS", {
      fontSize: 15,
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#351352",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(82);
    group.addMultiple([veil, panel, title, sub, feature, hint]);
    const children = [...group.getChildren()];
    children.forEach((child) => child.setAlpha(0));
    this.tweens.add({ targets: children, alpha: 1, duration: 260, ease: "Cubic.Out" });
    this.tweens.add({ targets: [title, sub], scale: 1.1, duration: 220, yoyo: true, repeat: 2, ease: "Back.Out" });
    this.playCoinSpraySound();
    this.cameras.main.shake(420, 0.01);
    await this.wait(1900);
    this.tweens.add({ targets: children, alpha: 0, duration: 260, ease: "Cubic.In" });
    await this.wait(280);
    this.destroyTempGroup(group);
  }

  async showBonusUnlockAnimation() {
    const group = this.add.group();
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x061b30, 0.72).setDepth(76);
    const burst = this.add.circle(W / 2, H / 2 + 8, 86, 0xffe277, 0.12).setStrokeStyle(6, 0x8ee8ff, 0.75).setDepth(77);
    const chest = this.add.image(W / 2, H / 2 + 34, "sym-chest").setDepth(80);
    chest.setScale(112 / Math.max(chest.width, chest.height));
    const key = this.add.image(W / 2 - 118, H / 2 - 40, "sym-key").setDepth(81);
    key.setScale(68 / Math.max(key.width, key.height)).setRotation(-0.45);
    const title = this.add.text(W / 2, H / 2 - 132, "KEY UNLOCK", {
      fontSize: 31,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#061b30",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(82);
    group.addMultiple([veil, burst, chest, key, title]);
    this.tweens.add({ targets: key, x: W / 2 - 22, y: H / 2 + 8, rotation: 0.18, duration: 720, ease: "Cubic.InOut" });
    this.tweens.add({ targets: chest, scale: chest.scale * 1.12, duration: 120, delay: 650, yoyo: true, repeat: 3, ease: "Back.Out" });
    this.tweens.add({ targets: burst, scale: 1.35, alpha: 0.62, duration: 820, yoyo: true, repeat: 1, ease: "Sine.InOut" });
    this.playCoinDing();
    await this.wait(860);
    this.playUnlockSound();
    this.playCoinSpraySound();
    this.cameras.main.shake(360, 0.012);
    const candyKeys = ["sym-stripe-row", "sym-stripe-col", "sym-bomb", "sym-chocolate", "sym-bomb", "sym-stripe-row"];
    candyKeys.forEach((texture, i) => {
      const angle = -Math.PI * 0.88 + i * (Math.PI * 1.76 / (candyKeys.length - 1));
      const candy = this.add.image(W / 2, H / 2 + 4, texture).setDepth(83);
      candy.setScale(38 / Math.max(candy.width, candy.height));
      candy.isFxSprite = true;
      this.fxSprites.add(candy);
      group.add(candy);
      this.tweens.add({
        targets: candy,
        x: W / 2 + Math.cos(angle) * 118,
        y: H / 2 + Math.sin(angle) * 96,
        scale: candy.scale * 1.35,
        rotation: (i - 2) * 0.35,
        duration: 760,
        ease: "Back.Out"
      });
    });
    await this.wait(1450);
    const children = [...group.getChildren()];
    this.tweens.add({ targets: children, alpha: 0, duration: 280, ease: "Cubic.In" });
    await this.wait(300);
    this.destroyTempGroup(group);
  }

  async showFreeEndCard() {
    const group = this.add.group();
    const depth = 140;
    const creditedToWallet = Math.max(0, this.wallet - this.freeStartWallet);
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x250712, 0.82).setDepth(depth);
    const panel = this.add.rectangle(W / 2, H / 2, 344, 310, 0x7b1828, 0.99).setStrokeStyle(6, 0xffe277, 1).setDepth(depth + 1);
    const title = this.add.text(W / 2, H / 2 - 72, "FREE GAME END", {
      fontSize: 33,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(depth + 2);
    const body = this.add.text(W / 2, H / 2 + 8, [
      `Bonus orders completed: ${this.freeOrdersCompleted}`,
      `Removed in bonus: ${this.freeRemoved}`,
      `Bonus win: ${this.freeReward}`,
      `Paid to wallet: +${creditedToWallet}`,
      `Wallet: ${this.wallet}`
    ].join("\n"), {
      fontSize: 18,
      fontStyle: "900",
      align: "center",
      color: "#ffffff",
      stroke: "#351352",
      strokeThickness: 5,
      lineSpacing: 9
    }).setOrigin(0.5).setDepth(depth + 2);
    const next = this.add.text(W / 2, H / 2 + 126, "BACK TO ORDERS", {
      fontSize: 18,
      fontStyle: "900",
      color: "#8ee8ff",
      stroke: "#061b30",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(depth + 2);
    group.addMultiple([veil, panel, title, body, next]);
    this.playCoinSpraySound();
    this.tweens.add({ targets: [title, body, next], scale: 1.08, duration: 200, yoyo: true, repeat: 1, ease: "Back.Out" });
    await this.wait(3200);
    const children = [...group.getChildren()];
    this.tweens.add({ targets: children, alpha: 0, duration: 280, ease: "Cubic.In" });
    await this.wait(300);
    this.destroyTempGroup(group);
  }

  destroyTempGroup(group) {
    if (!group) return;
    [...group.getChildren()].forEach((child) => {
      this.tweens.killTweensOf(child);
      this.fxSprites.delete(child);
      child.destroy();
    });
    group.destroy();
  }

  async finishMove() {
    if (this.gameMode === "free") {
      await this.finishFreeMove();
      return;
    }
    this.updateOrders();
    this.fulfillCompletedOrders();
    if (this.moveReward > 0) {
      this.winText.setText(`ORDER REWARD +${this.moveReward}`);
      this.statusText.setText("Order complete. New order ready.");
      this.playPopSound(1320);
      this.time.delayedCall(80, () => this.playPopSound(1760));
      const summaryMs = this.showOrderRewardSummary(this.moveCompletions, this.moveReward);
      await this.wait(summaryMs);
    } else if (this.moveCompletions.length > 0) {
      this.winText.setText(`EARNED ${this.sessionReward}`);
      this.statusText.setText("Order complete. Scatter added.");
      await this.wait(720);
    } else {
      this.winText.setText(`EARNED ${this.sessionReward}`);
      const scattersNeeded = Math.max(0, this.scatterGoal - this.countScatters());
      this.statusText.setText(`${scattersNeeded} scatter${scattersNeeded === 1 ? "" : "s"} to Free Game.`);
      await this.wait(180);
    }
    await this.advanceConveyorOrders();
    if (this.bonusPending) {
      this.bonusPending = false;
      await this.startFreeGame();
      return;
    }
    if (this.wallet < this.betAmount) {
      await this.finishSession("Wallet empty");
      return;
    }
    await this.ensureLegalMovesWithShuffle();
    this.busy = false;
    this.resolvingMove = false;
    this.inputOpen = true;
    this.updateBetUi();
  }

  async finishFreeMove() {
    this.updateOrders();
    await this.maybeTriggerBonusMoveEvent();
    this.updateOrders();
    this.fulfillCompletedOrders();
    const bonusCap = Number(MATH_CONFIG.maxBonusWinMult || Infinity) * this.betAmount;
    const reachedMaxWin = this.freeReward >= bonusCap;
    if (reachedMaxWin) this.freeMovesLeft = 0;
    if (this.moveReward > 0) {
      this.winText.setText(reachedMaxWin ? `MAX WIN ${MATH_CONFIG.maxBonusWinMult}x` : `BONUS ORDER +${this.moveReward}`);
      this.statusText.setText(reachedMaxWin ? "Maximum bonus win reached." : "Bonus order complete.");
      const summaryMs = this.showOrderRewardSummary(this.moveCompletions, this.moveReward);
      await this.wait(summaryMs);
    } else {
      this.updateFreeUi();
    }
    if (this.freeMovesLeft <= 0) {
      await this.endFreeGame();
      return;
    }
    this.moveReward = 0;
    this.moveCompletions = [];
    this.freeMoveHadEvent = false;
    await this.ensureLegalMovesWithShuffle();
    this.busy = false;
    this.resolvingMove = false;
    this.inputOpen = true;
    this.updateBetUi();
  }

  async startFreeGame(options = {}) {
    this.inputOpen = false;
    this.busy = true;
    this.resolvingMove = true;
    this.sessionActive = true;
    this.savedMainOrders = (this.orders || []).map((order) => ({ ...order }));
    this.freeBoughtMode = !!options.bought;
    this.gameMode = "free";
    this.freeMovesLeft = MATH_CONFIG.bonusStartMoves;
    this.freeRemoved = 0;
    this.freeRemovedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.freeCascadeCount = 0;
    this.freeChocolatesCreated = 0;
    this.freeComboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.freeReward = 0;
    this.freeStartWallet = this.wallet;
    this.freeOrdersCompleted = 0;
    this.freeScatterRetriggers = 0;
    this.freeEventCount = 0;
    this.freeColorClearUsed = false;
    this.freeMoveHadEvent = false;
    this.bonusEventSessionCounts = { special: 0, discount: 0, gold: 0, clear: 0 };
    this.freeScatterCountdown = this.rollScatterInterval(true);
    this.moveReward = 0;
    this.moveCompletions = [];
    this.scatterDropQueued = false;
    this.clearSelection();
    this.clearOrderIcons();
    this.setMode("transition");
    await this.showBonusUnlockAnimation();
    await this.showBonusIntroCard();
    this.clearEffects();
    this.startFreeMusic();
    this.configureBoard(FREE_ROWS);
    this.createBoardFrame();
    this.generateFreeOrders();
    this.generateFreeBoard();
    this.renderBoard(true);
    this.updateOrders();
    this.updateFreeUi();
    this.setMode("free");
    this.cameras.main.flash(520, 100, 245, 255);
    this.busy = false;
    this.resolvingMove = false;
    this.inputOpen = true;
  }

  async endFreeGame() {
    this.inputOpen = false;
    this.busy = true;
    this.resolvingMove = true;
    this.stopFreeMusic();
    await this.showFreeEndCard();
    this.freeBoughtMode = false;
    this.gameMode = "main";
    this.scatterDropQueued = false;
    if (this.savedMainOrders && this.savedMainOrders.length) {
      this.orders = this.savedMainOrders.map((order) => ({ ...order }));
    } else {
      this.generateOrders();
    }
    this.savedMainOrders = null;
    this.configureBoard(MAIN_ROWS);
    this.createBoardFrame();
    this.generateBoard();
    await this.ensureLegalMovesWithShuffle(false);
    this.renderBoard(true);
    this.updateOrders();
    this.updateKeyUi();
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    this.displayedWallet = this.wallet;
    this.updateBetUi();
    this.setMode("game");
    this.startCuteMusic();
    this.statusText.setText("Back to orders.");
    if (this.wallet < this.betAmount) {
      await this.finishSession("Wallet empty");
      return;
    }
    this.busy = false;
    this.resolvingMove = false;
    this.inputOpen = true;
  }

  fulfillCompletedOrders() {
    if (this.gameMode === "main") return this.fulfillConveyorOrders();
    let reward = 0;
    let scatterGranted = false;
    let refreshedOrders = 0;
    this.orders = this.orders.map((order, index) => {
      if (order.completed || this.orderProgress(order) < order.need) return order;
      const paysCoins = this.orderPaysCoins(order);
      const paysScatter = this.orderPaysScatter(order);
      const roll = paysCoins ? this.rollOrderMult(order) : { range: null, mult: 0 };
      const isFreeOrder = order.scope === "free";
      const goldMult = isFreeOrder && order.gold ? (order.goldMult || 1.5) : 1;
      const boost = paysCoins ? this.rollBonusOrderBoost(order) : { mult: 1, label: "" };
      const finalMult = paysCoins ? Math.max(1, Math.round(roll.mult * goldMult * boost.mult)) : 0;
      const adjustedRange = roll.range ? {
        min: Math.max(1, Math.round(roll.range.min * goldMult)),
        median: Math.max(1, Math.round(roll.range.median * goldMult)),
        max: Math.max(1, Math.round(roll.range.max * goldMult))
      } : null;
      let orderReward = paysCoins ? finalMult * this.betAmount : 0;
      if (isFreeOrder) {
        const bonusCap = Number(MATH_CONFIG.maxBonusWinMult || Infinity) * this.betAmount;
        orderReward = Math.min(orderReward, Math.max(0, bonusCap - this.freeReward));
      }
      reward += orderReward;
      if (isFreeOrder) {
        this.freeOrdersCompleted += 1;
        this.freeReward += orderReward;
      } else {
        this.ordersCompleted += 1;
      }
      if (paysScatter && this.grantScatterRewardFx(index)) scatterGranted = true;
      this.moveCompletions.push({
        order,
        reward: orderReward,
        rollMult: finalMult,
        range: adjustedRange,
        scatter: paysScatter,
        goldMult,
        boostMult: boost.mult,
        boostLabel: boost.label
      });
      this.showOrderCompleteFx(index, order, orderReward);
      
      refreshedOrders += 1;
      if (isFreeOrder) return this.createFreeOrder(order.tier);
      return this.createOrder(order.tier);
    });
    if (scatterGranted) this.checkScatterBonus();
    if (reward > 0) {
      this.wallet += reward;
      this.sessionReward += reward;
      this.moveReward += reward;
      this.animateWalletMeter(reward);
      if (this.gameMode === "free") this.updateFreeUi();
      else this.animateWinMeter(reward);
      this.winText.setText(`ORDER REWARD +${this.moveReward}`);
      this.statusText.setText(refreshedOrders > 1 ? "Orders complete. New orders ready." : "Order complete. New order ready.");
      this.updateOrders();
      this.updateBetUi();
    }
    if (scatterGranted && reward === 0) {
      this.statusText.setText("Order complete. Scatter added.");
      this.updateOrders();
      this.updateBetUi();
    }
    return reward;
  }

  fulfillConveyorOrders() {
    const completedEntries = this.orders
      .map((order, index) => ({ order, index }))
      .filter(({ order }) => this.orderProgress(order) >= order.need);
    if (!completedEntries.length) return 0;
    let reward = 0;
    let scatterGranted = false;
    const completedIds = new Set();
    completedEntries.forEach(({ order, index }) => {
      const paysCoins = this.orderPaysCoins(order);
      const paysScatter = this.orderPaysScatter(order);
      const roll = paysCoins ? this.rollOrderMult(order) : { range: null, mult: 0 };
      const finalMult = paysCoins ? Math.max(1, roll.mult) : 0;
      const orderReward = paysCoins ? finalMult * this.betAmount : 0;
      reward += orderReward;
      this.ordersCompleted += 1;
      if (paysScatter && this.grantScatterRewardFx(index)) scatterGranted = true;
      this.moveCompletions.push({
        order,
        reward: orderReward,
        rollMult: finalMult,
        range: roll.range,
        scatter: paysScatter,
        goldMult: 1,
        boostMult: 1,
        boostLabel: ""
      });
      this.showOrderCompleteFx(index, order, orderReward);
      completedIds.add(order.conveyorId);
    });
    this.orders = this.orders.filter((order) => !completedIds.has(order.conveyorId));
    if (scatterGranted) this.checkScatterBonus();
    if (reward > 0) {
      this.wallet += reward;
      this.sessionReward += reward;
      this.moveReward += reward;
      this.animateWalletMeter(reward);
      this.animateWinMeter(reward);
      this.winText.setText(`ORDER REWARD +${this.moveReward}`);
      this.statusText.setText(completedEntries.length > 1 ? `${completedEntries.length} orders complete!` : "Order complete!");
    } else if (scatterGranted) {
      this.statusText.setText("Order complete. Scatter added.");
    }
    this.updateOrders();
    this.updateBetUi();
    return reward;
  }

  async finishSession(reason) {
    this.setAutoPlayEnabled(false, false);
    this.autoUiSuppressed = false;
    this.endReason = reason;
    this.sessionActive = false;
    this.inputOpen = false;
    this.busy = false;
    this.resolvingMove = false;
    this.clearSelection();
    this.updateOrders();
    const payout = this.calculatePayout();
    this.statusText.setText(reason);
    this.winText.setText(`TOTAL EARNED ${payout.reward}`);
    this.updateBetUi();
    await this.wait(160);
    this.clearEffects();
    this.showPopup(payout);
  }

  calculatePayout() {
    return {
      reward: this.sessionReward,
      removed: this.totalRemoved,
      cascades: this.cascadeCount,
      completed: this.ordersCompleted,
      moves: this.movesMade,
      bet: this.betAmount,
      spent: this.paidBetTotal,
      wallet: this.wallet,
      reason: this.endReason
    };
  }

  showGameBetMenu() {
    if (this.gameMode !== "main" || !this.sessionActive || this.busy || this.resolvingMove) return;
    this.setAutoPlayEnabled(false, false);
    this.closePopup();
    this.clearSelection();
    this.modalOpen = true;
    this.popup = this.add.group();
    const originalBet = this.betAmount;
    let nextBet = this.betAmount;
    const depth = 82;
    const cap = () => Math.min(MAX_BET, this.wallet);
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x120926, 0.58)
      .setDepth(depth)
      .setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, 280, 230, 0x5a1020, 0.98)
      .setStrokeStyle(4, 0xffe277, 0.95)
      .setDepth(depth + 1);
    const title = this.add.text(W / 2, 270, "CHANGE BET", {
      fontSize: 27,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(depth + 2);
    const value = this.add.text(W / 2, 345, `BET ${nextBet}`, {
      fontSize: 34,
      fontStyle: "900",
      color: "#fff6d0",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(depth + 2);
    const minus = this.add.rectangle(W / 2 - 92, 345, 58, 54, 0xff4f88, 0.94)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(depth + 2);
    const minusMark = this.add.rectangle(W / 2 - 92, 345, 24, 5, 0xffffff, 1).setDepth(depth + 3);
    const plus = this.add.rectangle(W / 2 + 92, 345, 58, 54, 0x45d66f, 0.94)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(depth + 2);
    const plusH = this.add.rectangle(W / 2 + 92, 345, 24, 5, 0xffffff, 1).setDepth(depth + 3);
    const plusV = this.add.rectangle(W / 2 + 92, 345, 5, 24, 0xffffff, 1).setDepth(depth + 3);
    const hint = this.add.text(W / 2, 392, "Changing bet resets orders and board", {
      fontSize: 12,
      fontStyle: "800",
      color: "#8ee8ff",
      stroke: "#351352",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(depth + 2);
    const cancel = this.add.rectangle(W / 2 - 66, 437, 104, 42, 0x7a2d93, 0.95)
      .setStrokeStyle(3, 0xffffff, 0.82)
      .setDepth(depth + 2);
    const cancelText = this.add.text(W / 2 - 66, 437, "CANCEL", {
      fontSize: 16,
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(depth + 3);
    const ok = this.add.rectangle(W / 2 + 66, 437, 104, 42, 0xffd94c, 0.96)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(depth + 2);
    const okText = this.add.text(W / 2 + 66, 437, "OK", {
      fontSize: 18,
      fontStyle: "900",
      color: "#5c1d7f",
      stroke: "#ffffff",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(depth + 3);
    const refresh = () => {
      nextBet = Phaser.Math.Clamp(nextBet, MIN_BET, cap());
      value.setText(`BET ${nextBet}`);
      minus.setAlpha(nextBet <= MIN_BET ? 0.55 : 0.94);
      plus.setAlpha(nextBet >= cap() ? 0.55 : 0.94);
      ok.setAlpha(nextBet === originalBet ? 0.72 : 0.96);
      okText.setAlpha(nextBet === originalBet ? 0.72 : 1);
    };
    const change = (delta) => {
      const oldBet = nextBet;
      nextBet = Phaser.Math.Clamp(nextBet + delta, MIN_BET, cap());
      refresh();
      this.playBetSound(delta, nextBet !== oldBet);
    };
    minus.setInteractive({ useHandCursor: true }).on("pointerdown", () => change(-BET_STEP));
    plus.setInteractive({ useHandCursor: true }).on("pointerdown", () => change(BET_STEP));
    cancel.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.closePopup());
    ok.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      if (nextBet === originalBet) {
        this.closePopup();
        return;
      }
      this.betAmount = nextBet;
      this.closePopup();
      this.resetMainGameForBetChange();
    });
    this.popup.addMultiple([veil, panel, title, value, minus, minusMark, plus, plusH, plusV, hint, cancel, cancelText, ok, okText]);
    this.popup.getChildren().forEach((child) => {
      child.setAlpha(child.alpha ?? 1);
    });
    refresh();
  }

  resetMainGameForBetChange() {
    this.clearAutoTimer();
    this.autoPlayEnabled = false;
    this.autoUiSuppressed = false;
    this.clearEffects();
    this.clearOrderIcons();
    this.busy = false;
    this.resolvingMove = false;
    this.sessionActive = true;
    this.inputOpen = true;
    this.selected = null;
    this.gameMode = "main";
    this.savedMainOrders = null;
    this.freeBoughtMode = false;
    this.bonusPending = false;
    this.configureBoard(MAIN_ROWS);
    this.createBoardFrame();
    this.movesMade = 0;
    this.paidMovesMade = 0;
    this.totalRemoved = 0;
    this.removedByColor = Object.fromEntries(TYPES.map((t) => [t, 0]));
    this.cascadeCount = 0;
    this.chocolatesCreated = 0;
    this.comboCounts = { any: 0, stripeStripe: 0, stripeBomb: 0, bombBomb: 0, chocolateSpecial: 0 };
    this.ordersCompleted = 0;
    this.sessionReward = 0;
    this.paidBetTotal = 0;
    this.moveReward = 0;
    this.moveCompletions = [];
    this.scatterDropQueued = false;
    this.mainScatterCountdown = this.rollScatterInterval(false);
    this.displayedWin = 0;
    this.lastWinAmount = 0;
    this.displayedWallet = this.wallet;
    if (this.walletCounterTween) this.walletCounterTween.stop();
    this.walletCounterTween = null;
    if (this.winCounterTween) this.winCounterTween.stop();
    this.winCounterTween = null;
    this.winGainText.setText("").setAlpha(1).setY(622);
    this.walletGainText.setText("").setAlpha(1).setY(622);
    this.winText.setText("");
    this.statusText.setText("BET changed. New orders.");
    this.updateKeyUi();
    this.generateOrders();
    this.generateBoard();
    this.renderBoard(true);
    this.updateOrders();
    this.updateBetUi();
    this.setMode("game");
    this.playUnlockSound();
  }

  showPopup(p) {
    this.closePopup();
    this.modalOpen = true;
    this.popup = this.add.group();
    const summaryDepth = 82;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x120926, 0.74).setDepth(summaryDepth).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, 318, 364, 0x522474, 0.98).setDepth(summaryDepth + 1);
    const inner = this.add.rectangle(W / 2, H / 2 + 10, 282, 258, 0x2f1555, 0.96).setDepth(summaryDepth + 1);
    const topStripe = this.add.rectangle(W / 2, 264, 246, 5, 0x8ee8ff, 1).setDepth(summaryDepth + 2);
    const bottomStripe = this.add.rectangle(W / 2, 478, 246, 5, 0xffe277, 1).setDepth(summaryDepth + 2);
    const frame = this.addPixelFrame(W / 2, H / 2, 328, 374, { bg: 0x522474, bgAlpha: 0.18, thickness: 5 });
    const frameItems = frame.getChildren();
    frameItems.forEach((item) => item.setDepth(summaryDepth + 2));
    const title = this.add.text(W / 2, 220, "SESSION END", {
      fontSize: 36,
      fontStyle: "900",
      color: "#fff06a",
      stroke: "#351352",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(summaryDepth + 3);
    title.setShadow(3, 4, "#2b1248", 0, true, true);
    const lines = [
      `${p.reason}`,
      `Moves: ${p.moves}  Bet: ${p.bet}`,
      `Spent: ${p.spent}`,
      `Removed: ${p.removed} candies`,
      `Cascades: ${p.cascades}`,
      `Orders completed: ${p.completed}`,
      `Rewards earned: ${p.reward}`,
      `Wallet: ${this.wallet}`
    ];
    const body = this.add.text(W / 2, 348, lines.join("\n"), {
      fontSize: 16,
      fontStyle: "800",
      color: "#fff8d8",
      align: "center",
      lineSpacing: 8,
      stroke: "#1e0d38",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(summaryDepth + 3);
    const next = this.add.rectangle(W / 2, 532, 202, 52, 0xff4f88)
      .setStrokeStyle(3, 0xffffff)
      .setDepth(summaryDepth + 3);
    const nextText = this.add.text(W / 2, 532, "OK", {
      fontSize: 21,
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(summaryDepth + 4);
    next.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.restartAfterSettlement());
    this.popup.addMultiple([veil, panel, inner, topStripe, bottomStripe, ...frameItems, title, body, next, nextText]);
    frame.destroy(false);
    this.popup.getChildren().forEach((child) => {
      child.setAlpha(0);
      this.tweens.add({ targets: child, alpha: 1, duration: 180 });
    });
  }

  closePopup() {
    if (this.popup) {
      this.popup.getChildren().forEach((child) => {
        this.tweens.killTweensOf(child);
        child.destroy();
      });
      this.popup.destroy(true);
      this.popup = null;
    }
    this.modalOpen = false;
  }

  restartAfterSettlement() {
    this.wallet = STARTING_WALLET;
    this.displayedWallet = STARTING_WALLET;
    this.betAmount = DEFAULT_BET;
    this.showPreStart();
  }

  cellX(c) {
    return this.boardX + c * this.cell + this.cell / 2;
  }

  cellY(r) {
    return this.boardY + r * this.cell + this.cell / 2;
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#4f1220",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CandyOrdersScene
};

window.addEventListener("load", () => {
  if (window.candyGame && window.candyGame.destroy) {
    window.candyGame.destroy(true);
    const host = document.getElementById("game");
    if (host) host.innerHTML = "";
  }
  window.candyGame = new Phaser.Game(config);
});



















