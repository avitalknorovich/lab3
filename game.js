/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
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
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.onDroneHit());
    this.initPowerUps();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
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
    if (!this.shield) return this.finish('A drone caught you!');
    // Shield absorbs the hit; flash the player and ignore the same drone briefly.
    this.shield = false;
    this.graceUntil = this.time.now + 600;
    this.tweens.add({ targets: this.player, alpha: 0.2, duration: 80, yoyo: true, repeat: 4 });
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
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    this.updatePowerUps();
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
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
