// audio.js — tiny synthesized sound effects, no audio files.
// Everything is a short WebAudio oscillator burst, created lazily on the
// first user gesture so headless and silent environments never crash.

let ctx = null;
let muted = false;

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function blip(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {
    // Sound is garnish: never let it break the game.
  }
}

export function sfxPickup() {
  blip(880, 0.12, 'sine', 0.12, 1320);
}

export function sfxVault() {
  blip(523, 0.16, 'triangle', 0.14);
  setTimeout(() => blip(784, 0.2, 'triangle', 0.14), 110);
  setTimeout(() => blip(1046, 0.28, 'triangle', 0.14), 220);
}

export function sfxClick() {
  blip(1200, 0.05, 'square', 0.05);
}

export function sfxSmoke() {
  blip(300, 0.35, 'sawtooth', 0.06, 90);
}

export function sfxEmp() {
  blip(1400, 0.25, 'sawtooth', 0.08, 220);
}

export function sfxAlarm() {
  blip(660, 0.18, 'square', 0.07, 440);
}

export function sfxCaught() {
  blip(220, 0.5, 'sawtooth', 0.14, 55);
}

export function sfxEscape() {
  blip(659, 0.14, 'triangle', 0.13);
  setTimeout(() => blip(880, 0.14, 'triangle', 0.13), 130);
  setTimeout(() => blip(1318, 0.3, 'triangle', 0.13), 260);
}
