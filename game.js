/* global Phaser, COIN_DASH */
// localStorage can throw (blocked/private mode), so never let it break the game.
function loadHighScore() {
  try { return parseInt(localStorage.getItem(highScoreKey()), 10) || 0; } catch (e) { return 0; }
}
function saveHighScore(value) {
  try { localStorage.setItem(highScoreKey(), String(value)); } catch (e) { /* ignore */ }
}

class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.endTimer?.remove(); this.endTimer = null; this.vignette = null;
    this.tweens.timeScale = 1; this.physics.world.timeScale = 1;
    this.cameras.main.setZoom(1).centerOn(c.width / 2, c.height / 2);
    this.events.once('shutdown', () => { this.endTimer?.remove(); this.endTimer = null; });
    this.best = loadHighScore();
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.hudFx = this.add.text(18, 36, '', { font: '14px monospace', color: '#cffcff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.onCoin();
      window.SFX?.coin();
      if (window.FX) FX.burst(this, this.coin.x, this.coin.y);
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.onDroneHit());
    this.initPowerUps();
    this.initComboLevels();
    // The hunter exists from the start but stays hidden and inactive until its spawn time.
    this.hunterAt = this.time.now + c.hunterDelay * 1000;
    this.hunter = this.add.rectangle(0, 0, c.hunterSize, c.hunterSize, c.colors.hunter).setAngle(45);
    this.physics.add.existing(this.hunter);
    this.hunter.setVisible(false);
    this.hunter.body.enable = false;
    this.physics.add.overlap(this.player, this.hunter, () => this.finish('A hunter got you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.paused = false; window.SFX?.start();
    this.hudDiff = this.add.text(c.width - 12, c.height - 8, `${window.coinDashDifficulty} [1/2/3]`,
      { font: '14px monospace', color: '#9fb3c8' }).setOrigin(1, 1).setDepth(50);
    DIFFICULTY_NAMES.forEach((n, i) => this.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE'][i], () => {
      setDifficulty(n); this.scene.restart();
    }));
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    if (window.FX) FX.setup(this);
    UI.setup(this);
    window.THEMES?.apply(this, 1, true);
  }

  togglePause() {
    if (this.finished) return;
    const c = COIN_DASH;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now; window.SFX?.pause();
      this.physics.pause();
      this.pauseOverlay = UI.pauseCard(this);
    } else {
      // Shift every timer by the paused time so nothing expires or spawns during a pause.
      const dt = this.time.now - this.pausedAt;
      this.deadline += dt;
      this.hunterAt += dt;
      this.comboUntil += dt;
      this.nextPickupAt += dt;
      this.graceUntil += dt;
      if (this.slowUntil) this.slowUntil += dt;
      if (this.pickup) this.pickup.expiresAt += dt;
      this.physics.resume(); window.SFX?.resume();
      this.pauseOverlay.destroy();
    }
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  // ---- Combo + levels block ----
  initComboLevels() {
    this.streak = 0;
    this.comboUntil = 0;
    this.level = 1;
    this.comboText = this.add.text(18, 56, '', { font: '16px monospace', color: '#ffd166' });
    this.levelText = this.add.text(COIN_DASH.width - 18, 12, 'Level 1', { font: '18px monospace', color: '#b084ff' }).setOrigin(1, 0);
  }

  onCoin() {
    const cb = COIN_DASH.combo, now = this.time.now;
    this.streak = (this.streak > 0 && now <= this.comboUntil) ? this.streak + 1 : 1;
    this.comboUntil = now + cb.windowSeconds * 1000;
    const mult = Math.min(cb.maxMultiplier, 1 + Math.floor(this.streak / cb.streakPerStep));
    this.score += mult;
    if (this.streak >= 2) {
      this.comboText.setText(`Combo x${mult}`);
      this.tweens.add({ targets: this.comboText, scale: { from: 1.5, to: 1 }, duration: 150 });
    }
    while (this.score >= this.level * COIN_DASH.levels.coinsPerLevel) this.levelUp();
  }

  updateCombo() {
    if (this.streak && this.time.now > this.comboUntil) {
      this.streak = 0;
      this.comboText.setText('');
    }
  }

  levelUp() {
    const c = COIN_DASH, lv = c.levels;
    this.level++;
    this.levelText.setText(`Level ${this.level}`);
    this.deadline += lv.bonusSeconds * 1000;
    // Scaling is multiplicative, so it stays compatible with the slow-mo power-up (which also scales).
    this.drones.getChildren().forEach((d) => d.body.velocity.scale(lv.speedBoost));
    if (this.level % lv.extraDroneEvery === 0) {
      const speed = c.droneSpeed * Math.pow(lv.speedBoost, this.level - 1)
        * (this.slowUntil ? c.powerups.slowFactor : 1);
      let x, y;
      do {
        x = Phaser.Math.Between(40, c.width - 40);
        y = Phaser.Math.Between(80, c.height - 40);
      } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 150);
      const drone = this.add.rectangle(x, y, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const a = Math.random() * Math.PI * 2;
      drone.body.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    }
    const boss = window.THEMES?.isBoss(this.level);
    if (boss) this.bossTwist();
    if (window.FX) FX.shake(this, c.fx.shakeSmall);
    const banner = this.add.text(c.width / 2, c.height / 2, (boss ? `BOSS LEVEL ${this.level}` : `LEVEL ${this.level}`) + (window.THEMES ? ' · ' + THEMES.get(this.level).name : ''),
      { font: 'bold 38px monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: banner, alpha: 0, duration: lv.bannerMs, onComplete: () => banner.destroy() });
    window.THEMES?.apply(this, this.level);
  }
  // Boss twist: drones +25% speed once (multiplicative, so setDroneSlow stays consistent); hunter arrives now.
  bossTwist() {
    this.drones.getChildren().forEach((d) => d.body.velocity.scale(COIN_DASH.boss.droneSpeedBoost));
    this.hunterAt = Math.min(this.hunterAt, this.time.now);
    window.SFX?.hit();
  }
  // ---- end combo + levels block ----

  initPowerUps() {
    // Reset all power-up state (called from create(), so R restart works).
    this.pickup = null;
    this.shield = false;
    this.slowUntil = 0;
    this.graceUntil = 0;
    this.nextPickupAt = this.time.now + this.pickupDelay();
  }

  pickupDelay() {
    const p = COIN_DASH.powerups;
    return Phaser.Math.Between(p.spawnMinSeconds * 1000, p.spawnMaxSeconds * 1000);
  }

  spawnPickup() {
    const c = COIN_DASH;
    const kind = Math.random() < 0.5 ? 'shield' : 'slow';
    // Same idea as placeCoin: stay away from the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    const shape = kind === 'shield'
      ? this.add.circle(x, y, 11).setStrokeStyle(4, c.powerups.shieldColor)
      : this.add.rectangle(x, y, 16, 16, c.powerups.slowColor).setAngle(45);
    this.pickup = { kind, shape, expiresAt: this.time.now + c.powerups.lifetimeSeconds * 1000 };
  }

  removePickup() {
    if (this.pickup) this.pickup.shape.destroy();
    this.pickup = null;
    this.nextPickupAt = this.time.now + this.pickupDelay();
  }

  setDroneSlow(on) {
    // Drones bounce elastically, so scaling velocity once keeps the speed until reverted.
    const f = on ? COIN_DASH.powerups.slowFactor : 1 / COIN_DASH.powerups.slowFactor;
    this.drones.getChildren().forEach((d) => d.body.velocity.scale(f));
  }

  onDroneHit() {
    if (this.finished) return;
    if (this.time.now < this.graceUntil) return;
    if (!this.shield) { window.SFX?.hit(); return this.finish('A drone caught you!'); }
    // Shield absorbs the hit; flash the player and ignore the same drone briefly.
    this.shield = false; window.SFX?.shield();
    this.graceUntil = this.time.now + 600;
    if (window.FX) FX.shake(this, COIN_DASH.fx.shakeSmall);
    this.tweens.add({ targets: this.player, alpha: 0.2, duration: 80, yoyo: true, repeat: 4 });
  }

  updateHunter() {
    const c = COIN_DASH;
    if (!this.hunter.visible) {
      if (this.time.now < this.hunterAt) return;
      // Appear in the corner farthest from the player.
      const x = this.player.x < c.width / 2 ? c.width - 30 : 30;
      const y = this.player.y < c.height / 2 ? c.height - 30 : 74;
      this.hunter.setVisible(true).setPosition(x, y); window.SFX?.hunter();
      this.hunter.body.enable = true;
      this.hunter.body.reset(x, y);
    }
    // Steer straight at the player each frame; slower than the player so it can be outrun.
    this.physics.moveToObject(this.hunter, this.player, c.hunterSpeed);
  }

  updatePowerUps() {
    const now = this.time.now;
    if (this.slowUntil && now >= this.slowUntil) {
      this.slowUntil = 0;
      this.setDroneSlow(false);
    }
    if (this.pickup) {
      const p = this.pickup;
      if (now >= p.expiresAt) {
        this.removePickup();
      } else if (Phaser.Math.Distance.Between(p.shape.x, p.shape.y, this.player.x, this.player.y) < 22) {
        window.SFX?.powerup();
        if (p.kind === 'shield') {
          this.shield = true;
        } else {
          if (!this.slowUntil) this.setDroneSlow(true);
          this.slowUntil = now + COIN_DASH.powerups.slowSeconds * 1000;
        }
        this.removePickup();
      }
    } else if (now >= this.nextPickupAt) {
      this.spawnPickup();
    }
    const fx = [];
    if (this.shield) fx.push('Shield');
    if (this.slowUntil) fx.push(`Slow ${Math.ceil((this.slowUntil - now) / 1000)}s`);
    this.hudFx.setText(fx.join('  '));
  }

  update() {
    if (this.finished || this.paused) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    let direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    if (!dx && !dy) direction = pointerVelocity(this, this.player) || direction;
    this.player.body.setVelocity(direction.x, direction.y);
    this.updateHunter();
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}   Best: ${this.best}   Time: ${seconds}s`);
    this.updatePowerUps();
    this.updateCombo();
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true; window.SFX?.stop(); window.SFX?.gameOver();
    const isNewBest = this.score > this.best;
    if (isNewBest) { this.best = this.score; saveHighScore(this.best); }
    const show = () => { this.endTimer = null; this.physics.pause(); UI.endCard(this, reason, this.score, this.best, isNewBest); };
    if (reason === 'Time is up!') { if (window.FX) FX.shake(this); return show(); }
    this.slowMoDeath(show);
  }

  // Slow-motion beat: slower world, zoom toward the player, red vignette; then restore and show the end card.
  slowMoDeath(show) {
    const d = COIN_DASH.drama, c = COIN_DASH, cam = this.cameras.main;
    this.player.body.setVelocity(0, 0);
    this.physics.world.timeScale = d.slowMoFactor; // arcade: >1 slows the simulation
    this.tweens.timeScale = 1 / d.slowMoFactor;
    if (window.FX) FX.shake(this);
    cam.zoomTo(d.zoom, d.zoomInMs, 'Sine.easeOut', true);
    cam.pan(this.player.x, this.player.y, d.zoomInMs, 'Sine.easeOut', true);
    cam.flash(250, 255, 0, 0);
    const v = this.vignette = this.add.graphics().setScrollFactor(0).setDepth(20).setAlpha(0);
    for (let k = 0; k < 9; k++) v.lineStyle(10, 0xff0000, 0.5 * (1 - k / 9)).strokeRect(5 + k * 10, 5 + k * 10, c.width - 10 - k * 20, c.height - 10 - k * 20);
    // Counter the camera zoom so the vignette stays glued to the screen edges.
    const fit = () => { if (!v.active) return; const z = cam.zoom; v.setScale(1 / z).setPosition(c.width / 2 * (1 - 1 / z), c.height / 2 * (1 - 1 / z)); };
    this.events.on('update', fit); v.once('destroy', () => this.events.off('update', fit));
    this.tweens.add({ targets: v, alpha: 1, duration: 300 });
    // this.time is not slowed, so the beat lasts slowMoMs of real time.
    this.endTimer = this.time.delayedCall(d.slowMoMs, () => {
      this.tweens.timeScale = 1; this.physics.world.timeScale = 1;
      cam.zoomTo(1, d.zoomOutMs, 'Sine.easeInOut', true);
      cam.pan(c.width / 2, c.height / 2, d.zoomOutMs, 'Sine.easeInOut', true);
      this.tweens.add({ targets: v, alpha: 0, duration: d.zoomOutMs, onComplete: () => v.destroy() });
      this.endTimer = this.time.delayedCall(d.zoomOutMs, show);
    });
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
