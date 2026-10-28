/* global Phaser, COIN_DASH */
// Per-level visual themes. Pure decoration: recolors existing objects, never touches gameplay state.
(function () {
  // Colors are 0xRRGGBB ints (lerped on level-up); numbers are lerped too; `style`/`dir` switch instantly.
  const THEMES = [
    { name: 'Neon Grid', style: 'stars', bgTop: 0x101c31, bgBot: 0x101c31, line: 0x24334b, lineA: 0.45,
      grid: 0xff2bd6, gridA: 0.18, drift: 10, dir: [1, 1], p1: 0x9ad8ff, p2: 0xffffff, starA: 1,
      player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, hunter: 0xff9f1c,
      trail: 0x39ffe0, coinGlow: 0xffd166, droneGlow: 0xff2e63, burst: 0xffe27a, burst2: 0xff2bd6,
      hud: 0x7dfcff, hudFx: 0xff9cf0, hudGlow: 0x00e5ff, level: 0xb084ff, frame: 0x39ffe0, frame2: 0xff2bd6 },
    { name: 'Sunset Vapor', style: 'orbs', bgTop: 0x2b0f4a, bgBot: 0x7a2457, line: 0xff9a5c, lineA: 0.12,
      grid: 0xffb36b, gridA: 0.3, drift: 22, dir: [0, 1], p1: 0xff8fcf, p2: 0xffd27a, starA: 0,
      player: 0x7ff3ff, coin: 0xfff08a, drone: 0xff4f9a, hunter: 0xff8a3d,
      trail: 0x7ff3ff, coinGlow: 0xffc86b, droneGlow: 0xff2e8a, burst: 0xffd27a, burst2: 0xff5fb0,
      hud: 0xffd6a5, hudFx: 0xff8fcf, hudGlow: 0xff5fb0, level: 0xffb36b, frame: 0xff6fb5, frame2: 0xffa24c },
    { name: 'Deep Ocean', style: 'bubbles', bgTop: 0x041b3a, bgBot: 0x02393f, line: 0x2a6f9a, lineA: 0.25,
      grid: 0x35c7ff, gridA: 0.12, drift: 14, dir: [-1, 0], p1: 0x8fe6ff, p2: 0xd8fbff, starA: 0,
      player: 0xb9ffe9, coin: 0xffe07a, drone: 0xff6f7d, hunter: 0xffa24c,
      trail: 0x5ff0ff, coinGlow: 0xffe07a, droneGlow: 0xff4f6a, burst: 0x8fe6ff, burst2: 0x35c7ff,
      hud: 0x9fefff, hudFx: 0x7dffd6, hudGlow: 0x1aa7ff, level: 0x7dffd6, frame: 0x2fb8ff, frame2: 0x14e0b0 },
    { name: 'Toxic Matrix', style: 'digits', bgTop: 0x010a04, bgBot: 0x03180a, line: 0x0f5a2a, lineA: 0.35,
      grid: 0x00ff66, gridA: 0.1, drift: 6, dir: [0, 1], p1: 0x19ff6a, p2: 0xd6ffe4, starA: 0,
      player: 0xaaffc8, coin: 0xf4ff5c, drone: 0xff4d4d, hunter: 0xffb02e,
      trail: 0x39ff88, coinGlow: 0xf4ff5c, droneGlow: 0xff3030, burst: 0x39ff88, burst2: 0xf4ff5c,
      hud: 0x6dff9f, hudFx: 0xc6ff6b, hudGlow: 0x00ff66, level: 0xc6ff6b, frame: 0x19ff6a, frame2: 0xb6ff00 },
    { name: 'Solar Flare', style: 'embers', bgTop: 0x1a0603, bgBot: 0x5a1405, line: 0x7a2a0a, lineA: 0.4,
      grid: 0xff6a00, gridA: 0.2, drift: 18, dir: [1, -1], p1: 0xff9a2e, p2: 0xffe27a, starA: 0,
      player: 0xffe9a8, coin: 0xfff27a, drone: 0xff2e4a, hunter: 0xffffff,
      trail: 0xffb347, coinGlow: 0xfff27a, droneGlow: 0xff2a00, burst: 0xffd24a, burst2: 0xff4a1a,
      hud: 0xffd88a, hudFx: 0xff8a4a, hudGlow: 0xff5a00, level: 0xffc24a, frame: 0xff6a1a, frame2: 0xffc700 },
    { name: 'Ice Crystal', style: 'snow', bgTop: 0x0c2748, bgBot: 0x1c5a8a, line: 0x8fd8ff, lineA: 0.2,
      grid: 0xbfeaff, gridA: 0.16, drift: 8, dir: [-1, 1], p1: 0xe8f8ff, p2: 0xa8e4ff, starA: 0,
      player: 0xffffff, coin: 0xffe27a, drone: 0xff5c8a, hunter: 0xff9f5c,
      trail: 0xbff3ff, coinGlow: 0xffe27a, droneGlow: 0xff4a80, burst: 0xe8f8ff, burst2: 0x7fd4ff,
      hud: 0xe0f7ff, hudFx: 0x9fe4ff, hudGlow: 0x8fe0ff, level: 0xc9b8ff, frame: 0x9fe4ff, frame2: 0xc9b8ff }
  ];
  const COLOR_KEYS = ['bgTop', 'bgBot', 'line', 'grid', 'p1', 'p2', 'player', 'coin', 'drone', 'hunter', 'trail',
    'coinGlow', 'droneGlow', 'burst', 'burst2', 'hud', 'hudFx', 'hudGlow', 'level', 'frame', 'frame2'];
  const NUM_KEYS = ['lineA', 'gridA', 'drift', 'starA'];
  const hex = (n) => '#' + (n & 0xffffff).toString(16).padStart(6, '0');
  const css = (n) => `#${hex(n).slice(1)}`;
  const mix = (a, b, k) => {
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  };
  const get = (level) => THEMES[(((level || 1) - 1) % THEMES.length + THEMES.length) % THEMES.length];

  // Page glow: one injected rule reads CSS custom properties set on <html>.
  function ensureCss() {
    if (document.getElementById('themes-css')) return;
    const st = document.createElement('style');
    st.id = 'themes-css';
    st.textContent = '#game{transition:border-color .7s,box-shadow .7s}' +
      'html[style*="--frame"] #game{border-color:var(--frame) !important;' +
      'box-shadow:0 0 12px var(--frame),0 0 40px var(--frame2),inset 0 0 20px var(--frame-in) !important}';
    document.head.appendChild(st);
  }
  function setFrame(cur) {
    const r = document.documentElement.style;
    r.setProperty('--frame', css(cur.frame));
    r.setProperty('--frame2', css(mix(cur.frame2, 0, 0.35)));
    r.setProperty('--frame-in', css(mix(cur.frame, 0, 0.6)));
  }

  function newParticle(st, W, H, first) {
    const p = { x: Math.random() * W, y: first ? 44 + Math.random() * (H - 44) : H + 10, ph: Math.random() * 6.28,
      s: 0.5 + Math.random(), len: 5 + Math.floor(Math.random() * 6) };
    if (st === 'bubbles') { p.r = 2 + Math.random() * 5; p.vy = -(18 + Math.random() * 30); }
    else if (st === 'embers') { p.r = 1 + Math.random() * 2.2; p.vy = -(35 + Math.random() * 70); }
    else if (st === 'snow') { p.r = 2 + Math.random() * 3; p.vy = 14 + Math.random() * 26; p.y = first ? p.y : 40; }
    else if (st === 'orbs') { p.r = 14 + Math.random() * 26; p.vy = -(4 + Math.random() * 8); }
    else if (st === 'digits') { p.x = Math.floor(Math.random() * 50) * 16 + 4; p.vy = 70 + Math.random() * 110; p.y = first ? p.y : 30 - Math.random() * 100; }
    return p;
  }

  function initParticles(S, st) {
    S.style = st; S.parts = [];
    const n = { bubbles: 26, embers: 38, snow: 34, orbs: 9, digits: 26 }[st] || 0;
    for (let i = 0; i < n; i++) S.parts.push(newParticle(st, COIN_DASH.width, COIN_DASH.height, true));
  }

  function drawParticles(S, dt) {
    const g = S.pg, W = COIN_DASH.width, H = COIN_DASH.height, cur = S.cur, t = S.t;
    g.clear();
    S.parts.forEach((p, i) => {
      const st = S.style;
      p.y += p.vy * dt;
      if (st === 'bubbles') {
        p.x += Math.sin(t * p.s + p.ph) * 12 * dt;
        g.lineStyle(1.2, cur.p1, 0.55).strokeCircle(p.x, p.y, p.r);
        g.fillStyle(cur.p2, 0.5).fillCircle(p.x - p.r * 0.35, p.y - p.r * 0.35, Math.max(0.8, p.r * 0.22));
      } else if (st === 'embers') {
        p.x += Math.sin(t * 2 * p.s + p.ph) * 26 * dt + 10 * dt;
        const a = Math.min(1, (p.y - 44) / 200);
        g.fillStyle(i % 3 ? cur.p1 : cur.p2, 0.9 * Math.max(0, a)).fillCircle(p.x, p.y, p.r);
      } else if (st === 'snow') {
        p.x += Math.sin(t * p.s + p.ph) * 14 * dt;
        const r = p.r, a = 0.75;
        g.fillStyle(i % 2 ? cur.p1 : cur.p2, a);
        g.fillTriangle(p.x, p.y - r * 1.5, p.x + r, p.y, p.x, p.y + r * 1.5);
        g.fillTriangle(p.x, p.y - r * 1.5, p.x - r, p.y, p.x, p.y + r * 1.5);
      } else if (st === 'orbs') {
        p.x += (6 + p.s * 6) * dt;
        if (p.x > W + 40) p.x = -40;
        g.fillStyle(i % 2 ? cur.p1 : cur.p2, 0.1).fillCircle(p.x, p.y, p.r);
        g.fillStyle(i % 2 ? cur.p1 : cur.p2, 0.08).fillCircle(p.x, p.y, p.r * 0.6);
      } else if (st === 'digits') {
        for (let k = 0; k < p.len; k++) {
          const y = p.y - k * 10;
          if (y < 44 || y > H) continue;
          const hh = 4 + ((Math.floor(t * 9) * 7 + i * 13 + k * 5) % 5);
          g.fillStyle(k ? cur.p1 : cur.p2, k ? 0.75 * (1 - k / p.len) : 0.95).fillRect(p.x, y, 6, hh);
        }
      }
      const off = st === 'digits' ? p.y - p.len * 10 > H : st === 'snow' || st === 'orbs' ? false : p.y < 30;
      if (st === 'snow' && p.y > H + 10) Object.assign(p, newParticle(st, W, H, false));
      else if (st === 'orbs' && p.y < 20) p.y = H + 20;
      else if (off) Object.assign(p, newParticle(st, W, H, false));
    });
  }

  function paint(scene, S) {
    const c = COIN_DASH, f = c.fx, cur = S.cur, fs = scene.fxState;
    // gradient background
    S.bg.clear().fillGradientStyle(cur.bgTop, cur.bgTop, cur.bgBot, cur.bgBot, 1).fillRect(0, 0, c.width, c.height);
    if (S.grid) S.grid.setStrokeStyle(1, cur.line, cur.lineA);
    f.gridColor = cur.grid; f.gridAlpha = cur.gridA; f.gridDrift = cur.drift; f.starColor = cur.p1; f.starAlpha = cur.starA;
    f.burstColor = cur.burst; f.burstColor2 = cur.burst2;
    const tint = (o, col) => { if (o && o.active) o.setFillStyle(col, o.fillAlpha); };
    tint(scene.player, cur.player); tint(scene.coin, cur.coin); tint(scene.hunter, cur.hunter);
    scene.drones.getChildren().forEach((d) => tint(d, cur.drone));
    c.colors.player = cur.player; c.colors.coin = cur.coin; c.colors.drone = cur.drone; c.colors.hunter = cur.hunter;
    if (fs) {
      tint(fs.coinGlow, cur.coinGlow); tint(fs.coinGlow2, cur.coinGlow); tint(fs.playerGlow, cur.trail);
      fs.droneGlows.forEach((g) => tint(g, cur.droneGlow));
      fs.trail.forEach((r) => tint(r, cur.trail));
    }
    scene.hud.setColor(hex(cur.hud)).setShadow(0, 0, hex(cur.hudGlow), 10, true, true);
    scene.hudFx.setColor(hex(cur.hudFx)).setShadow(0, 0, hex(cur.hudGlow), 8, true, true);
    if (scene.levelText) scene.levelText.setColor(hex(cur.level));
    setFrame(cur);
  }

  function apply(scene, level, instant) {
    try {
      ensureCss();
      const th = get(level);
      let S = scene.themeState;
      if (!S || S.scene !== scene || S.bg.scene !== scene) {
        S = scene.themeState = { scene, t: 0, parts: [], style: '', cur: {} };
        S.bg = scene.add.graphics().setDepth(-9);
        S.pg = scene.add.graphics().setDepth(-4);
        S.grid = scene.children.list.find((o) => o.type === 'Grid');
        if (S.grid) S.grid.setFillStyle(COIN_DASH.colors.background, 0);
        const onUpdate = (time, delta) => {
          const dt = Math.min(delta, 50) / 1000;
          S.t += dt; drawParticles(S, dt);
        };
        scene.events.on('update', onUpdate);
        scene.events.once('shutdown', () => { scene.events.off('update', onUpdate); scene.themeState = null; });
        // first-time current values = theme 1 (the base neon look)
        COLOR_KEYS.concat(NUM_KEYS).forEach((k) => { S.cur[k] = THEMES[0][k]; });
      }
      if (S.tween) { S.tween.stop(); S.tween = null; }
      S.themeIdx = th.name;
      document.documentElement.dataset.theme = th.name;
      COIN_DASH.fx.gridDir = th.dir;
      if (S.style !== th.style) initParticles(S, th.style);
      if (instant) {
        COLOR_KEYS.concat(NUM_KEYS).forEach((k) => { S.cur[k] = th[k]; });
        paint(scene, S);
        return;
      }
      const from = Object.assign({}, S.cur);
      const W = COIN_DASH.width, H = COIN_DASH.height;
      scene.cameras.main.flash(260, (th.frame >> 16) & 255, (th.frame >> 8) & 255, th.frame & 255);
      const ring = scene.add.circle(W / 2, H / 2, 20).setStrokeStyle(4, th.frame, 1).setDepth(8);
      scene.tweens.add({ targets: ring, scale: 22, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onUpdate: () => ring.setStrokeStyle(3 / ring.scale, th.frame, 1), onComplete: () => ring.destroy() });
      const ring2 = scene.add.circle(W / 2, H / 2, 20).setStrokeStyle(2, th.frame2, 1).setDepth(8);
      scene.tweens.add({ targets: ring2, scale: 16, alpha: 0, duration: 650, delay: 120, ease: 'Cubic.easeOut', onUpdate: () => ring2.setStrokeStyle(2 / ring2.scale, th.frame2, 1), onComplete: () => ring2.destroy() });
      S.tween = scene.tweens.addCounter({
        from: 0, to: 1, duration: 800, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const k = tw.getValue();
          COLOR_KEYS.forEach((key) => { S.cur[key] = mix(from[key], th[key], k); });
          NUM_KEYS.forEach((key) => { S.cur[key] = from[key] + (th[key] - from[key]) * k; });
          paint(scene, S);
        },
        onComplete: () => { S.tween = null; }
      });
    } catch (e) { console.warn('Theme apply failed', e); }
  }

  window.THEMES = Object.assign(THEMES, { apply, get });
})();
