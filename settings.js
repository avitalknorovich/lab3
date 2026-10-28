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
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, hunter: 0xff9f1c },
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
