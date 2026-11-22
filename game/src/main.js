// main.js — the heist itself: state machine, movement, loot, the vault,
// the getaway, and the alarm that ties it all together.
// States: title → playing → caught | clear → (next room) → win.
// The alarm decays while nobody sees you and climbs while they do; at 100
// every guard knows where you are and runs you down.

import { LEVELS } from './levels.js';
import { makeGuard, updateGuard, guardCaught } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeTools, useSmoke, useEmp, updateTools, updateLockpick } from './tools.js';
import { bindInput, makeInput, wasPressed, endFrame, moveVector } from './input.js';
import { drawWorld, W, H } from './render.js';
import { circleVsRect, pointInRect, dist } from './util.js';
import * as sfx from './audio.js';
import { applyDemo } from './demo.js';

const THIEF_SPEED = 175;
const SNEAK_SPEED = 95;
const THIEF_R = 14;
const VAULT_SCORE = 1000;
const CLEAR_BONUS = 250;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const input = makeInput();
bindInput(input, canvas, () => sfx.initAudio());

const params = new URLSearchParams(location.search);
const SELFTEST = params.has('selftest');

const g = {
  state: 'title',
  levelIndex: 0,
  level: LEVELS[0],
  guards: [],
  cameras: [],
  loot: [],
  tools: null,
  thief: { x: 640, y: 640, dir: -Math.PI / 2, r: THIEF_R, sneaking: false, moving: false, lockpicking: false, lockpick: 0 },
  alarm: { level: 0 },
  score: 0,
  time: 0,
  peakAlarm: 0,
  vaultOpen: false,
  hint: '',
  caughtBy: '',
  errors: [],
};

window.addEventListener('error', (e) => g.errors.push(String(e.message || e.error)));

function loadLevel(i) {
  const def = LEVELS[i];
  g.levelIndex = i;
  g.level = def;
  g.guards = def.guards.map(makeGuard);
  g.cameras = def.cameras.map(makeCamera);
  g.loot = def.loot.map((l) => ({ ...l, taken: false }));
  g.tools = makeTools(def.tools);
  g.thief.x = def.start.x;
  g.thief.y = def.start.y;
  g.thief.dir = -Math.PI / 2;
  g.thief.lockpick = 0;
  g.thief.lockpicking = false;
  g.alarm.level = 0;
  g.vaultOpen = false;
  g.time = 0;
  g.hint = '';
  g.caughtBy = '';
}

function solidRects() {
  return [...g.level.walls, ...g.level.cover];
}

function thiefInShadow() {
  return g.level.shadows.some((s) => pointInRect(g.thief.x, g.thief.y, s));
}

function moveThief(dt) {
  const t = g.thief;
  const mv = moveVector(input);
  let vx = 0;
  let vy = 0;
  if (mv.click) {
    const d = dist(t.x, t.y, mv.mx, mv.my);
    if (d > 8) {
      const sp = input.keys.has('sneak') ? SNEAK_SPEED : THIEF_SPEED;
      vx = ((mv.mx - t.x) / d) * sp;
      vy = ((mv.my - t.y) / d) * sp;
    }
  } else {
    const sp = input.keys.has('sneak') ? SNEAK_SPEED : THIEF_SPEED;
    vx = mv.mx * sp;
    vy = mv.my * sp;
  }
  t.sneaking = input.keys.has('sneak');
  t.moving = vx !== 0 || vy !== 0;
  if (t.moving) t.dir = Math.atan2(vy, vx);

  // Move axis by axis so the thief slides along walls instead of sticking.
  let nx = t.x + vx * dt;
  let ny = t.y;
  for (const r of solidRects()) {
    const res = circleVsRect(nx, ny, t.r, r);
    nx = res.x; ny = res.y;
  }
  t.x = nx;
  ny = t.y + vy * dt;
  nx = t.x;
  for (const r of solidRects()) {
    const res = circleVsRect(nx, ny, t.r, r);
    nx = res.x; ny = res.y;
  }
  t.y = ny;
  t.x = Math.max(24 + t.r, Math.min(W - 24 - t.r, t.x));
  t.y = Math.max(24 + t.r, Math.min(H - 24 - t.r, t.y));
}

function updatePlaying(dt) {
  g.time += dt;
  const t = g.thief;

  // Tools first: smoke and EMP are instant decisions.
  if (wasPressed(input, 'smoke')) {
    if (useSmoke(g.tools, t.x, t.y)) sfx.sfxSmoke();
  }
  if (wasPressed(input, 'emp')) {
    const hit = useEmp(g.tools, g.cameras, t.x, t.y);
    if (hit >= 0) sfx.sfxEmp();
  }
  if (wasPressed(input, 'mute')) sfx.toggleMute();

  moveThief(dt);
  updateTools(g.tools, dt);

  // The alarm cools while nobody can see you.
  g.alarm.level = Math.max(0, g.alarm.level - 8 * dt);
  const seen = {
    x: t.x, y: t.y,
    sneaking: t.sneaking,
    inShadow: thiefInShadow(),
  };
  const blockers = solidRects();
  for (const gd of g.guards) {
    updateGuard(gd, dt, seen, blockers, g.tools.clouds, g.alarm);
  }
  for (const c of g.cameras) {
    updateCamera(c, dt, g.time, seen, blockers, g.tools.clouds, g.alarm);
  }
  g.peakAlarm = Math.max(g.peakAlarm, g.alarm.level);

  // Full alarm: every guard knows exactly where you are.
  if (g.alarm.level >= 100) {
    for (const gd of g.guards) {
      gd.chasing = true;
      gd.suspicion = 100;
    }
  }

  // Pick up side loot by walking over it.
  for (const l of g.loot) {
    if (!l.taken && dist(t.x, t.y, l.x, l.y) < 32) {
      l.taken = true;
      g.score += l.value;
      sfx.sfxPickup();
    }
  }

  // The vault: hold E, stand still, wait for the click.
  const nearVault = dist(t.x, t.y, g.level.vault.x, g.level.vault.y) < 78;
  const still = !t.moving;
  if (!g.vaultOpen) {
    const opened = updateLockpick(g.tools, dt, nearVault && input.keys.has('pick'), still);
    t.lockpicking = g.tools.lockpicking;
    t.lockpick = g.tools.lockpick;
    if (opened) {
      g.vaultOpen = true;
      g.score += VAULT_SCORE;
      sfx.sfxVault();
    }
  } else {
    t.lockpicking = false;
  }

  // The getaway: the exit only opens once the Fox is lifted.
  if (g.vaultOpen && pointInRect(t.x, t.y, g.level.exit)) {
    const timeBonus = Math.max(0, Math.round((g.level.par - g.time) * 5));
    g.score += CLEAR_BONUS + timeBonus;
    sfx.sfxEscape();
    if (g.levelIndex >= LEVELS.length - 1) {
      g.state = 'win';
    } else {
      g.state = 'clear';
    }
    return;
  }

  // Caught: a chasing guard reached the thief.
  for (const gd of g.guards) {
    if (guardCaught(gd, t)) {
      g.state = 'caught';
      g.caughtBy = 'A guard ran you down in the open.';
      sfx.sfxCaught();
      return;
    }
  }
  for (const c of g.cameras) {
    if (c.spotting && g.alarm.level >= 100) {
      // Cameras alone never grab you — guards do — but a maxed alarm with
      // a camera on you means the room is fully alert.
    }
  }

  // Contextual hint line.
  if (g.alarm.level > 70) {
    g.hint = 'SPOTTED — break line of sight! Shadow, smoke, or run.';
    if (Math.random() < dt * 0.5) sfx.sfxAlarm();
  } else if (nearVault && !g.vaultOpen) {
    g.hint = 'Hold E to pick the lock — and stand still.';
  } else if (!g.vaultOpen) {
    g.hint = 'Reach the golden vault at the top — then run for the green exit.';
  } else {
    g.hint = 'The Fox is yours — get to the green exit, fast!';
  }
}

function update(dt) {
  if (g.state === 'title') {
    if (wasPressed(input, 'start') || input.mouse.down) {
      g.state = 'playing';
      sfx.sfxClick();
    }
    return;
  }
  if (g.state === 'playing') {
    updatePlaying(dt);
    return;
  }
  if (g.state === 'caught') {
    if (wasPressed(input, 'retry') || input.mouse.down) {
      loadLevel(g.levelIndex);
      g.state = 'playing';
    }
    return;
  }
  if (g.state === 'clear') {
    if (wasPressed(input, 'start')) {
      loadLevel(g.levelIndex + 1);
      g.state = 'playing';
    }
    return;
  }
  if (g.state === 'win') {
    if (wasPressed(input, 'retry')) {
      g.score = 0;
      g.peakAlarm = 0;
      loadLevel(0);
      g.state = 'playing';
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawWorld(ctx, g);
  endFrame(input);
  if (!SELFTEST) requestAnimationFrame(frame);
}

// ---- boot ----
loadLevel(0);
if (params.has('auto')) {
  g.state = 'playing';
  applyDemo(g, params);
}
if (SELFTEST) {
  runSelfTest();
} else {
  requestAnimationFrame(frame);
}

// Headless play-test: drive the real update loop with scripted inputs and
// report what happened into the DOM, so a headless browser can read it.
function runSelfTest() {
  const report = { errors: g.errors, steps: {} };
  const step = (dt) => {
    update(dt);
    drawWorld(ctx, g);
    endFrame(input);
  };
  // Fresh room, playing, thief at the door — each phase starts clean so a
  // catch in one phase cannot poison the next.
  const reset = () => {
    loadLevel(0);
    g.state = 'playing';
    g.alarm.level = 0;
  };
  try {
    // Phase A: the thief walks left along the bottom, away from every cone.
    reset();
    input.keys.add('left');
    for (let i = 0; i < 120; i++) step(1 / 60);
    input.keys.delete('left');
    report.steps.thiefMoved = g.thief.x < 640 - 20;
    report.steps.thiefPos = [Math.round(g.thief.x), Math.round(g.thief.y)];

    // Phase B: guards patrol and cameras sweep while the thief waits.
    reset();
    const gp = g.guards.map((gd) => [Math.round(gd.x), Math.round(gd.y)]);
    const camDir0 = g.cameras[0].dir;
    for (let i = 0; i < 240; i++) step(1 / 60);
    report.steps.guardsPatrol = g.guards.some(
      (gd, i) => Math.abs(gd.x - gp[i][0]) > 5 || Math.abs(gd.y - gp[i][1]) > 5,
    );
    report.steps.cameraSweeps = Math.abs(g.cameras[0].dir - camDir0) > 0.05;
    report.steps.stateStillPlaying = g.state === 'playing';

    // Phase C: put the thief on the guard's patrol path, ahead of it, so
    // the guard walks straight into sight of the thief.
    reset();
    const gd0 = g.guards[0];
    gd0.dir = 0; // facing east, down its patrol lane
    g.thief.x = gd0.x + 150;
    g.thief.y = gd0.y;
    const alarmBefore = g.alarm.level;
    for (let i = 0; i < 60; i++) step(1 / 60);
    report.steps.alarmRisesWhenSeen = g.alarm.level > alarmBefore + 5;
    report.steps.alarmLevel = Math.round(g.alarm.level);

    // Phase D: smoke blocks sight: same spot, alarm must stop climbing.
    useSmoke(g.tools, g.thief.x, g.thief.y);
    const alarmAtSmoke = g.alarm.level;
    for (let i = 0; i < 60; i++) step(1 / 60);
    report.steps.smokeBlocksSight = g.alarm.level <= alarmAtSmoke + 12;

    // Phase E: lockpick opens the vault. Park the guards far away first:
    // this step tests the lockpick, not the stealth loop (detection is
    // tested above).
    reset();
    g.guards.forEach((gd) => {
      gd.suspicion = 0;
      gd.chasing = false;
      gd.x = 200;
      gd.y = 600;
    });
    g.cameras.forEach((c) => { c.disabled = 5; });
    g.thief.x = g.level.vault.x;
    g.thief.y = g.level.vault.y + 60;
    input.keys.add('pick');
    for (let i = 0; i < 200; i++) step(1 / 60);
    input.keys.delete('pick');
    report.steps.vaultOpens = g.vaultOpen === true;
    report.steps.scoreAfterVault = g.score;

    // Phase F: exit ends the level.
    g.thief.x = g.level.exit.x + g.level.exit.w / 2;
    g.thief.y = g.level.exit.y + 10;
    step(1 / 60);
    report.steps.exitClearsLevel = g.state === 'clear';
  } catch (e) {
    report.errors.push('selftest: ' + (e && e.message));
  }
  report.errors = report.errors.concat(g.errors);
  const el = document.createElement('pre');
  el.id = 'selftest-report';
  el.textContent = JSON.stringify(report);
  document.body.appendChild(el);
  document.title = 'SELFTEST DONE';
}
