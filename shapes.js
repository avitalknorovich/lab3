/* global Phaser, COIN_DASH */
// Character art: ship over the player hitbox, drone eyes, spinning coin, spiky hunter.
// Pure decoration. The base rectangles/circles stay as physics bodies (player/coin are made
// transparent via fillAlpha 0 so themes.js can still recolor them: we read their fillColor each frame).
(function () {
  const mix = (a, b, k) => {
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  };
  const rot = (pts, a, ox, oy) => {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => ({ x: ox + x * c - y * s, y: oy + x * s + y * c }));
  };

  function setup(scene) {
    try {
      const S = scene.shapesState = { t: 0, heading: 0, mv: 0 };
      S.g = scene.add.graphics().setDepth(2);
      if (scene.player) scene.player.setFillStyle(scene.player.fillColor, 0);
      if (scene.coin) scene.coin.setFillStyle(scene.coin.fillColor, 0);
      scene.events.once('shutdown', () => { if (scene.shapesState === S) scene.shapesState = null; });
    } catch (e) { console.warn('Shapes setup failed', e); }
  }

  function ship(g, scene, S) {
    const p = scene.player, col = p.fillColor, a = p.alpha;
    const b = p.body, sp = b ? Math.hypot(b.velocity.x, b.velocity.y) : 0;
    if (sp > 20) {
      const target = Math.atan2(b.velocity.y, b.velocity.x);
      S.heading += Phaser.Math.Angle.Wrap(target - S.heading) * 0.25;
    }
    S.mv += ((sp > 20 ? 1 : 0) - S.mv) * 0.2;
    const x = p.x, y = p.y, h = S.heading;
    // engine flame (behind hull): longer and more flickery while moving
    const len = 5 + S.mv * 11 + Math.random() * (2 + S.mv * 6);
    const flame = (k, c2, al) => g.fillStyle(c2, al * a).fillPoints(
      rot([[-5, -4.5 * k], [-5 - len * k, 0], [-5, 4.5 * k]], h, x, y), true);
    flame(1, mix(col, 0xff7a1a, 0.7), 0.85);
    flame(0.6, 0xffe9a0, 0.95);
    // hull
    const hull = rot([[16, 0], [-8, -11], [-4, 0], [-8, 11]], h, x, y);
    g.fillStyle(mix(col, 0x000000, 0.55), a).fillPoints(rot([[17, 0], [-9.5, -12.5], [-5, 0], [-9.5, 12.5]], h, x, y), true);
    g.fillStyle(col, a).fillPoints(hull, true);
    g.fillStyle(mix(col, 0xffffff, 0.5), a * 0.8).fillPoints(rot([[14, 0], [-2, -4], [-2, 4]], h, x, y), true);
    // cockpit
    const cp = rot([[3, 0]], h, x, y)[0];
    const pulse = 0.5 + 0.5 * Math.sin(S.t * 5);
    g.fillStyle(0xffffff, a * (0.15 + 0.15 * pulse)).fillCircle(cp.x, cp.y, 7);
    g.fillStyle(0xbff6ff, a).fillCircle(cp.x, cp.y, 3);
    g.fillStyle(0xffffff, a).fillCircle(cp.x - Math.cos(h) * 0.5, cp.y - Math.sin(h) * 0.5, 1.4);
  }

  function eyes(g, cx, cy, tx, ty, t, seed, a, scale) {
    const blink = ((t * 0.6 + seed * 1.7) % 3.3) < 0.16;
    const dx = tx - cx, dy = ty - cy, d = Math.hypot(dx, dy) || 1;
    const ox = (dx / d) * 2.1 * scale, oy = (dy / d) * 2.1 * scale;
    [-6, 6].forEach((ex) => {
      const x = cx + ex * scale, y = cy - 2 * scale, r = 4.6 * scale;
      if (blink) { g.fillStyle(0x10131a, a).fillRect(x - r, y - 0.8, r * 2, 1.6); return; }
      g.fillStyle(0xffffff, a).fillCircle(x, y, r);
      g.fillStyle(0x10131a, a).fillCircle(x + ox, y + oy, 2.2 * scale);
      g.fillStyle(0xffffff, a).fillCircle(x + ox - 0.7, y + oy - 0.7, 0.7 * scale);
    });
  }

  function coin(g, scene, S) {
    const c = scene.coin; if (!c || !c.active) return;
    const col = c.fillColor, a = c.alpha, r = 9 * c.scale;
    const sx = Math.max(0.15, Math.abs(Math.cos(S.t * 3.2)));
    const w = r * sx;
    g.fillStyle(mix(col, 0xffffff, 0.55), a).fillEllipse(c.x, c.y, w * 2 + 3, r * 2 + 3); // lighter edge
    g.fillStyle(mix(col, 0x000000, 0.25), a).fillEllipse(c.x, c.y, w * 2, r * 2);
    g.fillStyle(col, a).fillEllipse(c.x - w * 0.12, c.y, w * 1.6, r * 1.7);
    if (sx > 0.45) {
      g.lineStyle(1.2, mix(col, 0x000000, 0.4), a).strokeEllipse(c.x, c.y, w * 1.1, r * 1.1);
      g.fillStyle(0xffffff, a * 0.55).fillRect(c.x - w * 0.5, c.y - r * 0.55, Math.max(1, w * 0.35), 2);
    }
    // sparkle
    const k = Math.max(0, Math.sin(S.t * 3.2 + 1.2));
    if (k > 0.5) {
      const s = 5 * (k - 0.5) * 2 * c.scale, sx2 = c.x + r * 0.7, sy2 = c.y - r * 0.8;
      g.fillStyle(0xffffff, a).fillPoints([{ x: sx2, y: sy2 - s }, { x: sx2 + s * 0.28, y: sy2 - s * 0.28 }, { x: sx2 + s, y: sy2 },
        { x: sx2 + s * 0.28, y: sy2 + s * 0.28 }, { x: sx2, y: sy2 + s }, { x: sx2 - s * 0.28, y: sy2 + s * 0.28 },
        { x: sx2 - s, y: sy2 }, { x: sx2 - s * 0.28, y: sy2 - s * 0.28 }], true);
    }
  }

  function hunter(g, scene, S) {
    const hn = scene.hunter; if (!hn || !hn.visible) return;
    const col = hn.fillColor, a = hn.alpha, x = hn.x, y = hn.y, p = scene.player;
    const sz = hn.width * hn.scale, R = sz * 0.71 + 2; // half diagonal of the 45-degree square
    const spin = S.t * 1.5;
    for (let i = 0; i < 8; i++) {
      const ang = spin + i * Math.PI / 4, l = i % 2 ? R + 3 : R + 7;
      const pts = rot([[l, 0], [R - 4, -3.2], [R - 4, 3.2]], ang, x, y);
      g.fillStyle(mix(col, 0x000000, 0.35), a).fillPoints(pts, true);
    }
    g.fillStyle(mix(col, 0x000000, 0.45), a).fillCircle(x, y, 7);
    const pulse = 0.6 + 0.4 * Math.sin(S.t * 6);
    g.fillStyle(0xffffff, a * 0.25 * pulse).fillCircle(x, y, 9);
    g.fillStyle(0xffffff, a).fillCircle(x, y, 5);
    const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
    g.fillStyle(0x10131a, a).fillCircle(x + dx / d * 1.8, y + dy / d * 1.8, 2.6);
  }

  function update(scene) {
    const S = scene.shapesState;
    if (!S || !S.g || !S.g.active || scene.paused || scene.finished) return;
    try {
      S.t += Math.min(scene.game.loop.delta, 50) / 1000;
      const g = S.g.clear();
      coin(g, scene, S);
      scene.drones.getChildren().forEach((d, i) => {
        if (d.active) eyes(g, d.x, d.y, scene.player.x, scene.player.y, S.t, i, d.alpha, 1);
      });
      hunter(g, scene, S);
      ship(g, scene, S);
    } catch (e) { console.warn('Shapes update failed', e); }
  }

  window.SHAPES = { setup, update };
})();
