/* global Phaser, COIN_DASH */
// Modern UI helpers: HUD chips + glass cards, drawn with Phaser graphics. Decoration only.
(function () {
  const FONT = 'system-ui, "Segoe UI Variable", "Segoe UI", Inter, Roboto, sans-serif';
  const css = (n, d) => {
    try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d; } catch (e) { return d; }
  };
  const hex = (s, d) => { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? parseInt(m[1], 16) : d; };
  const accent = () => hex(css('--accent', '#39ffe0'), 0x39ffe0);
  const str = (n) => '#' + n.toString(16).padStart(6, '0');
  const AMBER = 0xffb02e, RED = 0xff4d5e, PANEL = 0x0b1222;

  function txt(scene, x, y, s, size, color, bold) {
    return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: bold ? '700' : '500' });
  }

  function chip(g, x, y, w, h) {
    g.fillStyle(PANEL, 0.72).fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(1, 0xffffff, 0.16).strokeRoundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 12);
  }

  function setupHud(scene) {
    const W = COIN_DASH.width, Y = 6, H = 32;
    const g = scene.add.graphics().setDepth(4);
    const bar = scene.add.graphics().setDepth(5);
    const defs = [{ k: 'Coins', x: 12, w: 104 }, { k: 'Best', x: 124, w: 96 }, { k: 'Time', x: 228, w: 120 }];
    const vals = {};
    defs.forEach((d) => {
      chip(g, d.x, Y, d.w, H);
      txt(scene, d.x + 14, Y + 11, d.k.toUpperCase(), 10, '#8fa3bd', true).setDepth(5);
      vals[d.k] = txt(scene, d.x + d.w - 14, Y + 5, '0', 18, '#ffffff', true).setOrigin(1, 0).setDepth(5);
    });
    // Level chip (existing levelText, restyled and centred in its chip).
    chip(g, W - 112, Y, 100, H);
    scene.levelText.setOrigin(0.5).setPosition(W - 62, Y + H / 2).setFontFamily(FONT).setFontSize(15)
      .setFontStyle('700').setDepth(5);
    // Secondary texts sit just under the bar.
    scene.hudFx.setPosition(14, 50).setFontFamily(FONT).setFontSize(14).setFontStyle('600').setDepth(5);
    scene.comboText.setPosition(14, 70).setFontFamily(FONT).setFontSize(16).setFontStyle('700').setDepth(5);
    scene.hudDiff.setFontFamily(FONT).setFontSize(12).setAlpha(0.8);
    scene.hud.setVisible(false); // game.js still updates it; the chips display the values

    const onUpdate = () => {
      vals.Coins.setText(String(scene.score));
      vals.Best.setText(String(scene.best));
      if (scene.finished || scene.paused) return; // freeze the clock chip on pause and at round end
      const left = Math.max(0, (scene.deadline - scene.time.now) / 1000);
      vals.Time.setText(Math.ceil(left) + 's');
      const col = left <= 5 ? RED : left <= 10 ? AMBER : accent();
      vals.Time.setColor(left <= 10 ? str(col) : '#ffffff');
      const total = COIN_DASH.roundSeconds + (scene.level - 1) * COIN_DASH.levels.bonusSeconds;
      const k = Phaser.Math.Clamp(left / Math.max(total, left, 1), 0, 1);
      const bx = 228 + 14, bw = 120 - 28;
      bar.clear();
      bar.fillStyle(0xffffff, 0.12).fillRoundedRect(bx, Y + H - 6, bw, 3, 1.5);
      if (k > 0) bar.fillStyle(col, 1).fillRoundedRect(bx, Y + H - 6, Math.max(3, bw * k), 3, 1.5);
    };
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  }

  function keyChip(scene, label) {
    const t = txt(scene, 0, -1, label, 15, '#ffffff', true).setOrigin(0.5);
    const w = Math.max(30, t.width + 18), h = 28;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.1).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-w / 2 + 1, h / 2 - 4, w - 2, 4, { tl: 0, tr: 0, bl: 7, br: 7 });
    g.lineStyle(1, 0xffffff, 0.3).strokeRoundedRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 8);
    return { obj: scene.add.container(0, 0, [g, t]), w };
  }

  // Glass card with fade/scale-in. o: {title, big, sub, badge, hint:[pre, key, post]}
  function card(scene, o) {
    const W = COIN_DASH.width, Hh = COIN_DASH.height, acc = accent();
    const hasBig = o.big !== undefined;
    const cw = 400, ch = hasBig ? 300 : 124;
    const items = [];
    const add = (t) => { items.push(t); return t; };
    add(scene.add.rectangle(0, 0, W, Hh, 0x03060d, 0.55));
    const g = add(scene.add.graphics());
    g.fillStyle(0x000000, 0.35).fillRoundedRect(-cw / 2 + 4, -ch / 2 + 10, cw, ch, 22);
    g.fillStyle(PANEL, 0.94).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    g.lineStyle(1.5, acc, 0.6).strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    g.lineStyle(1, 0xffffff, 0.1).strokeRoundedRect(-cw / 2 + 4, -ch / 2 + 4, cw - 8, ch - 8, 18);
    let y = -ch / 2 + 24;
    add(txt(scene, 0, y, o.title.toUpperCase(), 13, '#8fa3bd', true).setOrigin(0.5, 0)).setLetterSpacing(2);
    if (hasBig) {
      y += 24;
      add(txt(scene, 0, y, String(o.big), 76, '#ffffff', true).setOrigin(0.5, 0))
        .setShadow(0, 0, str(acc), 18, true, true);
      y += 90;
      add(txt(scene, 0, y, o.sub, 15, '#b6c4d8').setOrigin(0.5, 0));
      y += 30;
      if (o.badge) {
        const b = txt(scene, 0, y + 5, o.badge, 14, '#1a1203', true).setOrigin(0.5, 0);
        const bw = b.width + 28;
        add(scene.add.graphics()).fillStyle(AMBER, 1).fillRoundedRect(-bw / 2, y, bw, 28, 14);
        add(b);
      }
    }
    const hy = ch / 2 - 32;
    const pre = add(txt(scene, 0, hy, o.hint[0], 15, '#b6c4d8').setOrigin(0, 0.5));
    const key = keyChip(scene, o.hint[1]); add(key.obj);
    const post = o.hint[2] ? add(txt(scene, 0, hy, o.hint[2], 15, '#b6c4d8').setOrigin(0, 0.5)) : null;
    const total = pre.width + 10 + key.w + (post ? 10 + post.width : 0);
    let x = -total / 2;
    pre.setX(x); x += pre.width + 10;
    key.obj.setPosition(x + key.w / 2, hy); x += key.w + 10;
    if (post) post.setX(x);
    const cont = scene.add.container(W / 2, Hh / 2, items).setDepth(10).setAlpha(0).setScale(0.92);
    scene.tweens.add({ targets: cont, alpha: 1, scale: 1, duration: 220, ease: 'Back.easeOut' });
    return cont;
  }

  window.UI = {
    setup(scene) { try { setupHud(scene); } catch (e) { console.warn('UI setup failed', e); } },
    pauseCard(scene) { return card(scene, { title: 'Paused', hint: ['Press', 'P', 'to resume'] }); },
    endCard(scene, reason, score, best, isNewBest) {
      return card(scene, { title: reason, big: score, sub: `coins collected  ·  Best ${best}`,
        badge: isNewBest ? 'New high score!' : '', hint: ['Press', 'R', 'to try again'] });
    }
  };
})();
