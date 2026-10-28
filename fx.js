/* global Phaser, COIN_DASH */
// Neon visual effects. Pure decoration: never touches gameplay state.
(function () {
  const fxc = () => COIN_DASH.fx;

  function setup(scene) {
    try { build(scene); } catch (e) { console.warn('FX setup failed', e); }
  }

  function build(scene) {
    const f = fxc();
    const c = COIN_DASH;
    const state = { trail: [], hist: [], t: 0 };

    // Background: twinkling stars + drifting grid lines, above the base grid.
    const bg = scene.add.graphics().setDepth(-5);
    const stars = [];
    for (let i = 0; i < f.starCount; i++) {
      stars.push({ x: Math.random() * c.width, y: 44 + Math.random() * (c.height - 44),
        p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.5 });
    }
    state.bg = bg; state.stars = stars; scene.fxState = state;

    // Coin glow (soft outer circles) + pulse.
    state.coinGlow = scene.add.circle(0, 0, 22, f.coinGlow, 0.25).setDepth(0);
    state.coinGlow2 = scene.add.circle(0, 0, 15, f.coinGlow, 0.35).setDepth(0);
    scene.tweens.add({ targets: [scene.coin, state.coinGlow2], scale: { from: 0.85, to: 1.2 },
      duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: state.coinGlow, scale: { from: 0.8, to: 1.35 }, alpha: { from: 0.3, to: 0.1 },
      duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Drone pulsing glows.
    state.droneGlows = scene.drones.getChildren().map((d) => {
      const g = scene.add.rectangle(d.x, d.y, 40, 40, f.droneGlow, 0.3).setDepth(0);
      scene.tweens.add({ targets: g, alpha: { from: 0.12, to: 0.4 }, scale: { from: 0.9, to: 1.25 },
        duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return g;
    });

    // Player trail: pool of fading squares.
    for (let i = 0; i < f.trailLength; i++) {
      state.trail.push(scene.add.rectangle(0, 0, 24, 24, f.trailColor, 0).setDepth(0));
    }
    scene.player.setDepth(1);
    scene.add.rectangle(0, 0, 1, 1, 0, 0).destroy();
    state.playerGlow = scene.add.rectangle(0, 0, 36, 36, f.trailColor, 0.18).setDepth(0);

    // HUD styling.
    scene.hud.setFontSize(22).setColor(f.hudColor).setStroke('#000000', 3)
      .setShadow(0, 0, f.hudGlow, 10, true, true).setDepth(5);
    scene.hudFx.setY(42).setFontSize(15).setColor(f.hudFxColor)
      .setShadow(0, 0, f.hudGlow, 8, true, true).setDepth(5);

    const onUpdate = (time, delta) => {
      state.t += delta / 1000;
      const t = state.t;
      bg.clear();
      // drifting vertical + horizontal lines
      bg.lineStyle(1, f.gridColor, f.gridAlpha);
      const dir = f.gridDir || [1, 1];
      const offx = (((t * f.gridDrift * dir[0]) % 40) + 40) % 40, offy = (((t * f.gridDrift * dir[1]) % 40) + 40) % 40;
      for (let x = -40 + offx; x < c.width + 40; x += 40) bg.lineBetween(x, 44, x, c.height);
      for (let y = 44 + offy; y < c.height; y += 40) bg.lineBetween(0, y, c.width, y);
      stars.forEach((s) => {
        bg.fillStyle(f.starColor, (f.starAlpha === undefined ? 1 : f.starAlpha) * (0.2 + 0.6 * Math.abs(Math.sin(t * s.s + s.p))));
        bg.fillCircle(s.x, s.y, 1.5);
      });
      if (scene.coin) {
        state.coinGlow.setPosition(scene.coin.x, scene.coin.y);
        state.coinGlow2.setPosition(scene.coin.x, scene.coin.y);
      }
      scene.drones.getChildren().forEach((d, i) => {
        const g = state.droneGlows[i];
        if (g) g.setPosition(d.x, d.y);
      });
      const p = scene.player;
      state.playerGlow.setPosition(p.x, p.y);
      if (!scene.paused && !scene.finished) {
        state.hist.unshift({ x: p.x, y: p.y });
        if (state.hist.length > f.trailLength * 2) state.hist.length = f.trailLength * 2;
      }
      state.trail.forEach((r, i) => {
        const h = state.hist[(i + 1) * 2 - 1];
        if (!h) { r.setAlpha(0); return; }
        const k = 1 - i / state.trail.length;
        r.setPosition(h.x, h.y).setAlpha(f.trailAlpha * k).setScale(0.4 + 0.6 * k);
      });
    };
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  }

  function burst(scene, x, y) {
    try {
      const f = fxc();
      for (let i = 0; i < f.burstCount; i++) {
        const a = (i / f.burstCount) * Math.PI * 2 + Math.random() * 0.4;
        const d = 30 + Math.random() * 40;
        const s = scene.add.circle(x, y, 2 + Math.random() * 2.5, i % 2 ? f.burstColor : f.burstColor2, 1).setDepth(3);
        scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.2,
          duration: 350 + Math.random() * 200, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
      }
      const ring = scene.add.circle(x, y, 8).setStrokeStyle(2, f.burstColor, 1).setDepth(3);
      scene.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
    } catch (e) { /* decoration only */ }
  }

  function shake(scene) {
    try { scene.cameras.main.shake(fxc().shakeMs, fxc().shakeIntensity); } catch (e) { /* ignore */ }
  }

  window.FX = { setup, burst, shake };
})();
