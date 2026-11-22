// cameras.js — wall-mounted security cameras.
// A camera sits on a wall and sweeps its cone back and forth. If the thief
// is inside the cone with a clear line of sight, the alarm climbs fast —
// cameras are the one watcher you cannot outrun, only disable. An EMP burst
// knocks every camera in range offline for a few seconds; smoke blocks their
// sight the same way it blocks a guard's.

import { angleTo, clamp, dist, inSmoke, inVisionCone } from './util.js';

export const CAM_FOV = 0.45;
export const CAM_RANGE = 300;
export const CAM_SPOT_RATE = 48; // alarm points per second while seen
export const EMP_DISABLE_SECS = 8;

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    phase: Math.random() * Math.PI * 2,
    dir: def.base,
    disabled: 0,
    spotting: false,
  };
}

// Sweep the cone, and feed the shared alarm while the thief is seen.
export function updateCamera(c, dt, t, thief, blockers, clouds, alarm) {
  if (c.disabled > 0) {
    c.disabled -= dt;
    c.spotting = false;
    return;
  }
  c.dir = c.base + Math.sin(t * c.speed + c.phase) * c.sweep;
  const seen =
    !inSmoke(thief.x, thief.y, clouds) &&
    inVisionCone(thief.x, thief.y, c.x, c.y, c.dir, CAM_FOV, CAM_RANGE, blockers);
  c.spotting = seen;
  if (seen) {
    alarm.level = clamp(alarm.level + CAM_SPOT_RATE * dt, 0, 100);
  }
}

// EMP burst at (x,y): disable every camera within `radius`.
export function empBurst(cameras, x, y, radius) {
  let hit = 0;
  for (const c of cameras) {
    if (dist(c.x, c.y, x, y) <= radius) {
      c.disabled = EMP_DISABLE_SECS;
      hit++;
    }
  }
  return hit;
}
