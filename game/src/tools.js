// tools.js — the thief's kit: smoke bombs, EMP bursts and the lockpick.
// Every tool costs something, so each use is a decision: a smoke bomb buys
// six seconds of blindness, an EMP silences the cameras, and the lockpick
// is the only way into the vault — but it asks you to stand still, in the
// open, for two and a half seconds.

import { dist } from './util.js';

export const SMOKE_SECS = 6;
export const SMOKE_RADIUS = 95;
export const EMP_RADIUS = 340;
export const LOCKPICK_SECS = 2.5;

export function makeTools(counts) {
  return {
    smoke: counts.smoke ?? 2,
    emp: counts.emp ?? 1,
    clouds: [], // {x, y, r, left}
    lockpick: 0, // 0..1 progress on the vault
    lockpicking: false,
  };
}

// Drop a smoke bomb at the thief's feet. Returns true when one was spent.
export function useSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke--;
  tools.clouds.push({ x, y, r: SMOKE_RADIUS, left: SMOKE_SECS });
  return true;
}

// Fire an EMP burst. Returns how many cameras it knocked out.
export function useEmp(tools, cameras, x, y) {
  if (tools.emp <= 0) return -1;
  tools.emp--;
  let hit = 0;
  for (const c of cameras) {
    if (dist(c.x, c.y, x, y) <= EMP_RADIUS) {
      c.disabled = 8;
      hit++;
    }
  }
  return hit;
}

// Age the smoke clouds; expired ones vanish.
export function updateTools(tools, dt) {
  for (const c of tools.clouds) c.left -= dt;
  tools.clouds = tools.clouds.filter((c) => c.left > 0);
}

// Work the lockpick while the thief stands by the vault and holds still.
// `nearVault` and `still` come from the game; returns true on the frame
// the vault clicks open.
export function updateLockpick(tools, dt, nearVault, still) {
  if (nearVault && still) {
    tools.lockpicking = true;
    tools.lockpick += dt / LOCKPICK_SECS;
    if (tools.lockpick >= 1) {
      tools.lockpick = 1;
      tools.lockpicking = false;
      return true;
    }
    return false;
  }
  tools.lockpicking = false;
  if (!nearVault) tools.lockpick = 0;
  return false;
}
