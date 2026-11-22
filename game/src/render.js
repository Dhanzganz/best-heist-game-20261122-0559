// render.js — every pixel of the game, drawn on one canvas.
// The look is deliberate: safe cover reads dark and calm, danger reads
// red, cameras read cold blue, loot reads gold. The whole room, the cones,
// the cameras, the vault and the alarm meter are all in the same frame so
// the state of the heist is obvious at a glance.

import { GUARD_FOV, GUARD_RANGE } from './guards.js';
import { CAM_FOV, CAM_RANGE } from './cameras.js';

export const W = 1280;
export const H = 720;

const GOLD = '#f5c542';
const DANGER = 'rgba(255, 64, 64, 0.30)';
const DANGER_EDGE = 'rgba(255, 90, 90, 0.55)';
const CAMBLUE = 'rgba(80, 160, 255, 0.28)';
const CAMBLUE_EDGE = 'rgba(120, 190, 255, 0.5)';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cone(ctx, x, y, dir, half, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.font = `${weight || 600} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export function drawWorld(ctx, g) {
  const lvl = g.level;
  drawFloor(ctx);
  drawShadows(ctx, lvl.shadows);
  drawCover(ctx, lvl.cover);
  drawWalls(ctx, lvl.walls);
  drawLoot(ctx, g.loot);
  drawVault(ctx, lvl.vault, g.vaultOpen, g.time);
  drawExit(ctx, lvl.exit, g.vaultOpen);
  for (const c of g.cameras) drawCameraCone(ctx, c);
  for (const gd of g.guards) drawGuardCone(ctx, gd);
  drawSmoke(ctx, g.tools.clouds, g.time);
  drawThief(ctx, g.thief, g.time);
  for (const gd of g.guards) drawGuard(ctx, gd);
  for (const c of g.cameras) drawCameraBody(ctx, c);
  drawHud(ctx, g);
  if (g.state === 'caught') drawCaught(ctx, g);
  if (g.state === 'clear') drawLevelClear(ctx, g);
  if (g.state === 'win') drawWin(ctx, g);
  if (g.state === 'title') drawTitle(ctx, g);
}

function drawFloor(ctx) {
  ctx.fillStyle = '#1b2233';
  ctx.fillRect(0, 0, W, H);
  // marble tile grid
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 40; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // crimson carpet runner from the door to the vault
  ctx.fillStyle = 'rgba(122, 28, 48, 0.5)';
  ctx.fillRect(600, 24, 80, 672);
  ctx.strokeStyle = 'rgba(245, 197, 66, 0.35)';
  ctx.strokeRect(600, 24, 80, 672);
}

function drawShadows(ctx, shadows) {
  for (const s of shadows) {
    ctx.fillStyle = 'rgba(6, 10, 22, 0.55)';
    rr(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 170, 255, 0.18)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#39415a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4d5878';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawCover(ctx, cover) {
  for (const c of cover) {
    if (c.kind === 'pedestal') {
      ctx.fillStyle = '#8d8578';
      rr(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.fillStyle = '#b8ae9c';
      rr(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, 4);
      ctx.fill();
      text(ctx, '◆', c.x + c.w / 2, c.y + c.h / 2 + 1, 22, '#f5c542', 'center');
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#6b4a2b';
      rr(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.fill();
      ctx.strokeStyle = '#8a6238';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else {
      // planter: a green bush you can hide behind
      ctx.fillStyle = '#2e5d33';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7d46';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 10, c.y + c.h / 2 - 8, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLoot(ctx, loot) {
  for (const l of loot) {
    if (l.taken) continue;
    const pulse = 0.55 + Math.sin(Date.now() / 280 + l.x) * 0.15;
    if (l.kind === 'painting') {
      ctx.fillStyle = '#c9a227';
      rr(ctx, l.x - 26, l.y - 18, 52, 36, 3);
      ctx.fill();
      ctx.fillStyle = '#7a5a8f';
      ctx.fillRect(l.x - 20, l.y - 12, 40, 24);
      ctx.strokeStyle = `rgba(245, 197, 66, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(l.x - 26, l.y - 18, 52, 36);
      text(ctx, `$${l.value}`, l.x, l.y + 30, 12, GOLD, 'center');
    } else {
      ctx.fillStyle = '#5a6274';
      rr(ctx, l.x - 20, l.y - 16, 40, 32, 4);
      ctx.fill();
      ctx.fillStyle = '#2c3242';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(245, 197, 66, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(l.x - 20, l.y - 16, 40, 32);
      text(ctx, `$${l.value}`, l.x, l.y + 30, 12, GOLD, 'center');
    }
  }
}

function drawVault(ctx, vault, open, t) {
  const glow = 0.35 + Math.sin(t * 3) * 0.12;
  const grad = ctx.createRadialGradient(vault.x, vault.y, 4, vault.x, vault.y, 90);
  grad.addColorStop(0, `rgba(245, 197, 66, ${glow})`);
  grad.addColorStop(1, 'rgba(245, 197, 66, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, 90, 0, Math.PI * 2);
  ctx.fill();
  // glass case
  ctx.fillStyle = 'rgba(160, 210, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, vault.r + 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!open) {
    // the diamond
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(vault.x, vault.y - 16);
    ctx.lineTo(vault.x + 14, vault.y);
    ctx.lineTo(vault.x, vault.y + 16);
    ctx.lineTo(vault.x - 14, vault.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(vault.x, vault.y - 16);
    ctx.lineTo(vault.x + 14, vault.y);
    ctx.lineTo(vault.x, vault.y);
    ctx.closePath();
    ctx.fill();
  }
  // Label sits above the case, unless the vault is too close to the HUD —
  // then it goes below, with the lockpick hint under it.
  const labelAbove = vault.y - vault.r - 24 >= 58;
  text(ctx, vault.label, vault.x, labelAbove ? vault.y - vault.r - 24 : vault.y + vault.r + 26, 13, GOLD, 'center', 700);
  if (!open) text(ctx, 'HOLD E TO PICK THE LOCK', vault.x, labelAbove ? vault.y + vault.r + 24 : vault.y + vault.r + 46, 11, '#cdd7ee', 'center');
}

function drawExit(ctx, exit, vaultOpen) {
  ctx.fillStyle = vaultOpen ? '#1f7a44' : '#3a4a3a';
  rr(ctx, exit.x, exit.y, exit.w, exit.h, 4);
  ctx.fill();
  ctx.strokeStyle = vaultOpen ? '#5ee08a' : '#7a8a7a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, vaultOpen ? '◈ ' + exit.label : exit.label + ' — LOCKED', exit.x + exit.w / 2, exit.y - 12, 12, vaultOpen ? '#8ff0ae' : '#9aa5b1', 'center', 700);
}

function drawGuardCone(ctx, g) {
  cone(ctx, g.x, g.y, g.dir, GUARD_FOV, GUARD_RANGE,
    g.chasing ? 'rgba(255, 40, 40, 0.42)' : DANGER,
    g.chasing ? 'rgba(255, 60, 60, 0.8)' : DANGER_EDGE);
}

function drawCameraCone(ctx, c) {
  if (c.disabled > 0) return;
  cone(ctx, c.x, c.y, c.dir, CAM_FOV, CAM_RANGE,
    c.spotting ? 'rgba(255, 80, 80, 0.4)' : CAMBLUE,
    c.spotting ? 'rgba(255, 100, 100, 0.7)' : CAMBLUE_EDGE);
}

function drawSmoke(ctx, clouds, t) {
  for (const c of clouds) {
    const wob = Math.sin(t * 2 + c.x) * 4;
    const grad = ctx.createRadialGradient(c.x, c.y, 6, c.x, c.y, c.r);
    grad.addColorStop(0, 'rgba(200, 200, 210, 0.5)');
    grad.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x + wob, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, thief, t) {
  const bob = Math.sin(t * 6) * (thief.moving ? 1.5 : 0);
  ctx.save();
  ctx.translate(thief.x, thief.y + bob * 0.3);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // hooded figure
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // face / direction
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(Math.cos(thief.dir) * 4, Math.sin(thief.dir) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(Math.cos(thief.dir) * 7, Math.sin(thief.dir) * 7, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(160, 190, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  // Tag the player so the eye finds them instantly in a busy room.
  ctx.font = '700 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU', thief.x, thief.y - 26);
  if (thief.lockpicking) {
    const p = thief.lockpick;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 24, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, g) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = g.chasing ? '#7a1d1d' : '#2c3550';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.chasing ? '#ff5a5a' : '#8fa3d9';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // cap brim shows facing
  ctx.fillStyle = '#d9dee9';
  ctx.beginPath();
  ctx.arc(Math.cos(g.dir) * 8, Math.sin(g.dir) * 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // suspicion ring: fills as the guard grows sure of you
  if (g.suspicion > 2) {
    const col = g.suspicion > 70 ? '#ff4d4d' : g.suspicion > 35 ? '#ffb84d' : '#ffe98a';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(g.x, g.y - 26, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(g.x, g.y - 26, 9, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
    if (g.suspicion > 70) text(ctx, '!', g.x, g.y - 42, 16, '#ff4d4d', 'center', 800);
  }
}

function drawCameraBody(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = c.disabled > 0 ? '#3a3f4a' : '#22304a';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.disabled > 0 ? '#777' : '#7fb2ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = c.disabled > 0 ? '#888' : c.spotting ? '#ff4d4d' : '#ff5a5a';
  ctx.beginPath();
  ctx.arc(Math.cos(c.dir) * 4, Math.sin(c.dir) * 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (c.disabled > 0) text(ctx, `OFF ${Math.ceil(c.disabled)}s`, c.x, c.y + 20, 10, '#9aa5b1', 'center', 700);
}

function drawHud(ctx, g) {
  // top bar
  ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
  ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 52, W, 2);
  // alarm meter
  const ax = 24, ay = 16, aw = 300, ah = 20;
  const a = g.alarm.level / 100;
  const col = a < 0.4 ? '#58c96b' : a < 0.7 ? '#ffb84d' : '#ff4d4d';
  text(ctx, 'ALARM', ax, ay - 2 + 10, 13, '#cdd7ee', 'left', 700);
  ctx.fillStyle = '#10151f';
  rr(ctx, ax + 70, ay, aw, ah, 5);
  ctx.fill();
  ctx.fillStyle = col;
  if (a > 0.01) {
    rr(ctx, ax + 70, ay, Math.max(8, aw * a), ah, 5);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  rr(ctx, ax + 70, ay, aw, ah, 5);
  ctx.stroke();
  text(ctx, `${Math.round(g.alarm.level)}%`, ax + 70 + aw + 12, ay + 10, 14, col, 'left', 700);
  if (a > 0.7) text(ctx, 'SPOTTED!', ax + 70 + aw + 62, ay + 10, 13, '#ff4d4d', 'left', 800);
  // loot + tools + level
  text(ctx, `LOOT  $${g.score.toLocaleString('en-US')}`, 560, 26, 16, GOLD, 'left', 700);
  text(ctx, `[1] SMOKE ×${g.tools.smoke}   [2] EMP ×${g.tools.emp}`, 760, 26, 13, '#cdd7ee', 'left');
  text(ctx, `${g.level.name}  ·  ${fmtTime(g.time)}`, 1080, 26, 13, '#9aa5b1', 'left');
  // bottom hints
  const hint = g.hint || 'WASD / arrows to move · SHIFT to sneak · grab the Fox, reach the exit';
  text(ctx, hint, W / 2, H - 16, 13, 'rgba(205, 215, 238, 0.85)', 'center');
  // alarm vignette when hot
  if (a > 0.55) {
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.75);
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, `rgba(255, 30, 30, ${(a - 0.55) * 0.5})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 9, 18, 0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#141a2c';
  rr(ctx, W / 2 - 330, H / 2 - 170, 660, 340, 14);
  ctx.fill();
  ctx.strokeStyle = accent || GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, title, W / 2, H / 2 - 118, 34, accent || GOLD, 'center', 800);
  let y = H / 2 - 58;
  for (const l of lines) {
    text(ctx, l, W / 2, y, 16, '#dbe3f2', 'center');
    y += 30;
  }
}

function drawTitle(ctx, g) {
  panel(ctx, 'THE GILDED VAULT', [
    'A midnight heist in three rooms. Cross the floor, lift the Fox, get out.',
    '',
    'WASD / arrows — move      SHIFT — sneak (harder to spot)',
    '1 — smoke bomb (blinds sight)      2 — EMP (kills cameras)',
    'E — hold to pick the vault lock      M — mute      R — retry',
    '',
    'Red cones are guards. Blue cones are cameras. Dark floor is shadow —',
    'hide there and suspicion rises half as fast.',
    '',
    'Click or press ENTER to start the heist.',
  ], GOLD);
}

function drawCaught(ctx, g) {
  panel(ctx, 'CAUGHT!', [
    g.caughtBy || 'A guard got you.',
    `You carried $${g.score.toLocaleString('en-US')} of loot.`,
    '',
    'Press R or click to try the room again.',
  ], '#ff4d4d');
}

function drawLevelClear(ctx, g) {
  panel(ctx, 'CLEAN GETAWAY', [
    `${g.level.name} cleared — the Fox is yours.`,
    `Loot so far: $${g.score.toLocaleString('en-US')}    Time: ${fmtTime(g.time)}`,
    '',
    'Press ENTER for the next room.',
  ], '#58c96b');
}

function drawWin(ctx, g) {
  const rating = g.peakAlarm < 40 ? 'GHOST — never seen' : g.peakAlarm < 75 ? 'CLEAN — barely a whisper' : 'LOUD — but rich';
  panel(ctx, 'THE HEIST IS DONE', [
    'Three rooms. Three Foxes. One very quiet thief.',
    `Final loot: $${g.score.toLocaleString('en-US')}    Total time: ${fmtTime(g.time)}`,
    `Rating: ${rating}`,
    '',
    'Press R to run it again.',
  ], GOLD);
}
