// guards.js — patrol movement, vision cones, suspicion and the chase.
// A guard walks its waypoints, pauses and looks around, and watches for the
// thief inside its cone. Suspicion rises while the thief is seen and falls
// while hidden; at full suspicion the guard gives chase, and touching the
// thief ends the run. Sneaking halves how fast suspicion rises, and standing
// in shadow slows it further. Smoke clouds break sight entirely.

import { angleDiff, angleTo, clamp, dist, inSmoke, inVisionCone } from './util.js';

export const GUARD_FOV = 1.15; // radians, half-angle of the vision cone
export const GUARD_RANGE = 270;
export const CHASE_RANGE = 34; // touching distance that ends the run

export function makeGuard(def) {
  const first = def.waypoints[0];
  return {
    x: first.x,
    y: first.y,
    dir: Math.PI / 2,
    speed: def.speed,
    pause: def.pause,
    waypoints: def.waypoints,
    wp: 1,
    wait: 0,
    suspicion: 0,
    chasing: false,
    lookT: 0,
    lookFrom: 0,
    lookTo: 0,
  };
}

// Move the guard one step. `thief` is {x, y, sneaking, inShadow},
// `blockers` are the rects that stop sight, `clouds` are smoke clouds,
// `alarm` is the shared alarm object {level} the guard feeds.
export function updateGuard(g, dt, thief, blockers, clouds, alarm) {
  const seen = canGuardSee(g, thief, blockers, clouds);
  if (seen) {
    let rate = 62;
    if (thief.sneaking) rate *= 0.5;
    if (thief.inShadow) rate *= 0.55;
    g.suspicion = clamp(g.suspicion + rate * dt, 0, 100);
  } else {
    g.suspicion = clamp(g.suspicion - 16 * dt, 0, 100);
  }
  if (g.suspicion >= 100) g.chasing = true;
  if (g.chasing && g.suspicion < 35) g.chasing = false;
  alarm.level = Math.max(alarm.level, g.suspicion);

  if (g.chasing) {
    chaseThief(g, dt, thief);
    return;
  }
  patrolStep(g, dt);
}

function chaseThief(g, dt, thief) {
  const a = angleTo(g.x, g.y, thief.x, thief.y);
  g.dir = turnToward(g.dir, a, dt * 6);
  const spd = g.speed * 1.9;
  g.x += Math.cos(g.dir) * spd * dt;
  g.y += Math.sin(g.dir) * spd * dt;
}

function patrolStep(g, dt) {
  if (g.wait > 0) {
    g.wait -= dt;
    // Look around while waiting: sweep the view left and right.
    g.lookT += dt;
    const k = g.pause > 0 ? Math.sin((g.lookT / g.pause) * Math.PI) : 0;
    g.dir = g.lookFrom + (g.lookTo - g.lookFrom) * k;
    if (g.wait <= 0) g.wp = (g.wp + 1) % g.waypoints.length;
    return;
  }
  const target = g.waypoints[g.wp];
  const d = dist(g.x, g.y, target.x, target.y);
  const step = g.speed * dt;
  if (d <= Math.max(step, 4)) {
    g.x = target.x;
    g.y = target.y;
    g.wait = g.pause;
    g.lookT = 0;
    g.lookFrom = g.dir;
    const next = g.waypoints[(g.wp + 1) % g.waypoints.length];
    g.lookTo = angleTo(g.x, g.y, next.x, next.y);
    return;
  }
  const a = angleTo(g.x, g.y, target.x, target.y);
  g.dir = turnToward(g.dir, a, dt * 8);
  g.x += Math.cos(a) * step;
  g.y += Math.sin(a) * step;
}

function turnToward(from, to, maxStep) {
  const d = angleDiff(from, to);
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}

// Can this guard see the thief right now?
export function canGuardSee(g, thief, blockers, clouds) {
  if (inSmoke(thief.x, thief.y, clouds) || inSmoke(g.x, g.y, clouds)) return false;
  return inVisionCone(thief.x, thief.y, g.x, g.y, g.dir, GUARD_FOV, GUARD_RANGE, blockers);
}

// Has any chasing guard caught the thief?
export function guardCaught(g, thief) {
  return g.chasing && dist(g.x, g.y, thief.x, thief.y) < CHASE_RANGE;
}
