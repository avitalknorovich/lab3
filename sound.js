// Synthesized sound (Web Audio only, no files). Exposes window.SFX. Safe if audio is unavailable.
(function () {
  const cfg = Object.assign({ master: 0.5, sfx: 0.5, music: 0.12, tempo: 110 }, (window.COIN_DASH || {}).sound);
  let ctx = null, master = null, timer = null, wantLoop = false, step = 0, nextT = 0, muted = false;
  try { muted = localStorage.getItem('coinDash.muted') === '1'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : cfg.master;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function unlock() {
    if (!ensure()) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    if (wantLoop) startTimer();
  }
  ['keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  // One enveloped oscillator note; gain ramps avoid clicks.
  function tone(freq, dur, o) {
    o = o || {};
    if (!ctx || !master) return;
    try {
      const t = ctx.currentTime + (o.delay || 0), vol = (o.vol == null ? 1 : o.vol) * cfg.sfx;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(freq, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const seq = (notes, dur, gap, o) => notes.forEach((f, i) => tone(f, dur, Object.assign({}, o, { delay: i * gap })));

  // Ambient loop: A minor bass + arpeggio, scheduled slightly ahead.
  const BASS = [55, 55, 65.41, 49], ARP = [220, 261.63, 329.63, 261.63, 220, 261.63, 392, 329.63];
  function note(freq, t, dur, type, vol) {
    try {
      const osc = ctx.createOscillator(), g = ctx.createGain(), v = vol * cfg.music;
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function schedule() {
    if (!ctx || !wantLoop) return;
    const spb = 60 / cfg.tempo / 2; // eighth notes
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.4) {
      note(ARP[step % 8], nextT, spb * 0.9, 'triangle', 0.6);
      if (step % 4 === 0) note(BASS[(step >> 2) % 4], nextT, spb * 3.6, 'sine', 1.2);
      step++; nextT += spb;
    }
  }
  function startTimer() { if (!timer && ctx) { timer = setInterval(schedule, 120); schedule(); } }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  window.SFX = {
    cfg,
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem('coinDash.muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : cfg.master, ctx.currentTime, 0.02);
      const el = document.getElementById('sound-note');
      if (el) el.textContent = 'Sound: ' + (muted ? 'off' : 'on');
    },
    toggleMute() { this.setMuted(!muted); return muted; },
    coin() { seq([988, 1319], 0.09, 0.06, { type: 'square', vol: 0.5 }); },
    powerup() { seq([392, 523, 659, 784], 0.12, 0.07, { type: 'triangle', vol: 0.9 }); },
    shield() { tone(300, 0.25, { type: 'sawtooth', to: 900, vol: 0.5 }); tone(1200, 0.2, { type: 'sine', delay: 0.1, vol: 0.6 }); },
    hit() { tone(200, 0.25, { type: 'sawtooth', to: 60, vol: 0.8 }); },
    gameOver() { seq([392, 330, 262, 196], 0.28, 0.2, { type: 'triangle', vol: 0.9 }); },
    pause() { stopTimer(); seq([440, 330], 0.08, 0.07, { type: 'sine', vol: 0.7 }); },
    resume() { seq([330, 440], 0.08, 0.07, { type: 'sine', vol: 0.7 }); if (wantLoop) startTimer(); },
    hunter() { seq([110, 104, 110, 104], 0.18, 0.2, { type: 'sawtooth', vol: 0.6 }); },
    start() { wantLoop = true; step = 0; nextT = 0; stopTimer(); if (ctx) startTimer(); },
    stop() { wantLoop = false; stopTimer(); }
  };
  document.addEventListener('DOMContentLoaded', () => window.SFX.setMuted(muted));
  window.addEventListener('keydown', (e) => { if ((e.key === 'm' || e.key === 'M') && !e.repeat) window.SFX.toggleMute(); });
})();
