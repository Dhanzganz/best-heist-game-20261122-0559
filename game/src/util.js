// util.js — small geometry helpers for line of sight, cones and collisions.
// No game state lives here: pure functions the AI modules call.

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Angle from (ax,ay) to (bx,by), in radians.
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest signed difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Is point (px,py) inside rectangle r {x,y,w,h}?
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does segment (x1,y1)-(x2,y2) intersect rectangle r? Used for vision LOS.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = orient(x3, y3, x4, y4, x1, y1);
  const d2 = orient(x3, y3, x4, y4, x2, y2);
  const d3 = orient(x1, y1, x2, y2, x3, y3);
  const d4 = orient(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function orient(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

// Circle (cx,cy,r) vs rect: push the circle out and report the corrected
// position. Returns {x, y, hit} so movers slide along walls.
export function circleVsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x: cx, y: cy, hit: false };
  if (d2 === 0) return { x: cx, y: cy - r, hit: true };
  const d = Math.sqrt(d2);
  const push = (r - d) / d;
  return { x: cx + dx * push, y: cy + dy * push, hit: true };
}

// Is (px,py) inside a vision cone from (ox,oy) facing `dir`, half-angle
// `half`, range `range`, with `blockers` (rects) breaking line of sight?
export function inVisionCone(px, py, ox, oy, dir, half, range, blockers) {
  const d = dist(ox, oy, px, py);
  if (d > range) return false;
  if (Math.abs(angleDiff(dir, angleTo(ox, oy, px, py))) > half) return false;
  for (const b of blockers) {
    if (segmentHitsRect(ox, oy, px, py, b)) return false;
  }
  return true;
}

// Is (px,py) inside any smoke cloud? Smoke blocks sight completely.
export function inSmoke(px, py, clouds) {
  for (const c of clouds) {
    if (dist(px, py, c.x, c.y) < c.r) return true;
  }
  return false;
}
