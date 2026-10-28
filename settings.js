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
