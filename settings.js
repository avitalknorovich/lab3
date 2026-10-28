// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  hunterDelay: 15,
  hunterSpeed: 90,
  hunterSize: 20,
  combo: { windowSeconds: 2.0, streakPerStep: 3, maxMultiplier: 4 },
  levels: { coinsPerLevel: 8, speedBoost: 1.1, extraDroneEvery: 3, bonusSeconds: 3, bannerMs: 1200 },
  sound: { master: 0.5, sfx: 0.5, music: 0.12, tempo: 110 },
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, hunter: 0xff9f1c },
  fx: {
    coinGlow: 0xffd166, droneGlow: 0xff2e63, trailColor: 0x39ffe0, trailLength: 7, trailAlpha: 0.35,
    gridColor: 0xff2bd6, gridAlpha: 0.18, gridDrift: 10, starColor: 0x9ad8ff, starCount: 40,
    burstColor: 0xffe27a, burstColor2: 0xff2bd6, burstCount: 16,
    hudColor: '#7dfcff', hudFxColor: '#ff9cf0', hudGlow: '#00e5ff',
    shakeMs: 250, shakeIntensity: 0.012
  },
  powerups: {
    spawnMinSeconds: 8,
    spawnMaxSeconds: 12,
    lifetimeSeconds: 6,
    slowSeconds: 4,
    slowFactor: 0.5,
    shieldColor: 0xcffcff,
    slowColor: 0xb084ff
  }
};

// Difficulty presets. Normal === the base values above (copied before any preset is applied).
window.COIN_DASH_BASE = { playerSpeed: COIN_DASH.playerSpeed, droneSpeed: COIN_DASH.droneSpeed,
  droneCount: COIN_DASH.droneCount, roundSeconds: COIN_DASH.roundSeconds,
  hunterDelay: COIN_DASH.hunterDelay, hunterSpeed: COIN_DASH.hunterSpeed };
window.COIN_DASH_PRESETS = {
  Easy:   { playerSpeed: 260, droneSpeed: 80,  droneCount: 2, roundSeconds: 50, hunterDelay: 22, hunterSpeed: 70 },
  Normal: Object.assign({}, COIN_DASH_BASE),
  Hard:   { playerSpeed: 240, droneSpeed: 135, droneCount: 5, roundSeconds: 40, hunterDelay: 10, hunterSpeed: 115 }
};
