// demo.js — jump-start states for screenshots and testing, via URL params.
// ?auto=1 starts the game at once (no title screen); ?demo=NAME poses a
// moment of the heist: cover (the opening frame), smoke (mid-heist tools),
// spotted (a guard on your tail) or escape (loot lifted, run for the door).
// These are real game states — the same ones a player reaches by playing.

import { useSmoke } from './tools.js';

export function applyDemo(g, params) {
  const demo = params.get('demo') || 'cover';
  if (demo === 'cover') {
    // Opening frame: thief at the door, guards mid-patrol, camera sweeping.
    g.guards[0].x = 500;
    g.guards[0].y = 460;
    g.guards[0].dir = 0;
    g.guards[1].x = 480;
    g.guards[1].y = 300;
    g.guards[1].dir = Math.PI / 2;
    return;
  }
  if (demo === 'smoke') {
    g.thief.x = 640;
    g.thief.y = 470;
    g.thief.dir = -Math.PI / 2;
    useSmoke(g.tools, 640, 470);
    g.tools.emp = 0;
    for (const c of g.cameras) c.disabled = 6;
    g.alarm.level = 55;
    g.guards[0].suspicion = 60;
    g.guards[0].x = 500;
    g.guards[0].y = 460;
    g.guards[1].x = 480;
    g.guards[1].y = 330;
    return;
  }
  if (demo === 'spotted') {
    g.thief.x = 640;
    g.thief.y = 210;
    g.thief.dir = -Math.PI / 2;
    g.alarm.level = 92;
    g.guards[1].x = 480;
    g.guards[1].y = 320;
    g.guards[1].suspicion = 100;
    g.guards[1].chasing = true;
    g.guards[1].dir = Math.PI / 2;
    g.guards[0].x = 420;
    g.guards[0].y = 460;
    g.guards[0].suspicion = 80;
    return;
  }
  if (demo === 'escape') {
    g.vaultOpen = true;
    g.score = 1450;
    g.thief.x = 260;
    g.thief.y = 620;
    g.thief.dir = Math.PI;
    g.alarm.level = 78;
    g.guards[0].x = 520;
    g.guards[0].y = 520;
    g.guards[0].suspicion = 100;
    g.guards[0].chasing = true;
    g.guards[0].dir = Math.PI;
    g.guards[1].x = 480;
    g.guards[1].y = 380;
    g.guards[1].suspicion = 90;
    g.guards[1].chasing = true;
  }
}
