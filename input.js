/* global COIN_DASH, COIN_DASH_PRESETS, Phaser */
// Difficulty + pointer helpers (kept out of game.js to limit merge conflicts).
const DIFFICULTY_KEY = 'coinDash.difficulty';
const DIFFICULTY_NAMES = ['Easy', 'Normal', 'Hard'];
window.coinDashDifficulty = 'Normal';
function applyDifficulty(name) {
  if (!COIN_DASH_PRESETS[name]) name = 'Normal';
  Object.assign(COIN_DASH, COIN_DASH_PRESETS[name]);
  window.coinDashDifficulty = name;
  return name;
}
function setDifficulty(name) {
  applyDifficulty(name);
  try { localStorage.setItem(DIFFICULTY_KEY, window.coinDashDifficulty); } catch (e) { /* ignore */ }
}
(function loadDifficulty() {
  let n = 'Normal';
  try { n = localStorage.getItem(DIFFICULTY_KEY) || 'Normal'; } catch (e) { /* ignore */ }
  applyDifficulty(n);
})();
// Normal keeps the legacy key so existing scores survive.
function highScoreKey() {
  return window.coinDashDifficulty === 'Normal' ? 'coinDash.highScore' : 'coinDash.highScore.' + window.coinDashDifficulty;
}
// Pointer steering: velocity toward the active pointer (touch or mouse button held), or null.
function pointerVelocity(scene, player) {
  const p = scene.input.activePointer;
  if (!p || !p.isDown) return null;
  const dx = p.worldX - player.x, dy = p.worldY - player.y;
  if (Math.hypot(dx, dy) < 10) return new Phaser.Math.Vector2(0, 0);
  return new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
}
