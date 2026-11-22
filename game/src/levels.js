// levels.js — the three rooms of the heist, as plain data.
// Each level: name, walls (block movement + sight), cover (crates and
// pedestals: block movement + sight, hide the thief), shadows (dark floor
// where guards spot you slower), guards (patrol waypoints), cameras
// (wall-mounted sweepers), loot (optional pickups), vault (the main prize),
// exit (the getaway door) and the thief's start.
// Coordinates are pixels on the 1280x720 canvas.

export const TILE = 40;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: 'The Marble Gallery',
    sub: 'Room 1 of 3 — learn the cones, lift the Fox',
    par: 150,
    start: { x: 640, y: 640 },
    exit: { x: 84, y: 668, w: 96, h: 28, label: 'SERVICE EXIT' },
    vault: { x: 640, y: 108, r: 30, label: 'THE GILDED FOX' },
    walls: [
      ...borderWalls(),
      // central display block splits the room into left / right routes
      { x: 560, y: 300, w: 160, h: 90 },
      // two pillars
      { x: 300, y: 220, w: 48, h: 48 },
      { x: 932, y: 220, w: 48, h: 48 },
    ],
    cover: [
      { x: 180, y: 420, w: 110, h: 60, kind: 'pedestal' },
      { x: 990, y: 420, w: 110, h: 60, kind: 'pedestal' },
      { x: 420, y: 520, w: 90, h: 56, kind: 'crate' },
      { x: 770, y: 520, w: 90, h: 56, kind: 'crate' },
      { x: 180, y: 150, w: 90, h: 56, kind: 'planter' },
      { x: 1010, y: 150, w: 90, h: 56, kind: 'planter' },
    ],
    shadows: [
      { x: 160, y: 480, w: 150, h: 110 },
      { x: 970, y: 480, w: 150, h: 110 },
      { x: 400, y: 576, w: 130, h: 96 },
      { x: 750, y: 576, w: 130, h: 96 },
    ],
    guards: [
      { waypoints: [{ x: 340, y: 460 }, { x: 940, y: 460 }], speed: 62, pause: 1.4 },
      { waypoints: [{ x: 480, y: 200 }, { x: 480, y: 470 }], speed: 52, pause: 2.0 },
    ],
    cameras: [
      { x: 640, y: 58, base: Math.PI / 2, sweep: 0.9, speed: 0.55 },
    ],
    loot: [
      { x: 120, y: 120, kind: 'painting', value: 150, label: 'Portrait' },
      { x: 1160, y: 120, kind: 'painting', value: 150, label: 'Landscape' },
      { x: 1160, y: 620, kind: 'safe', value: 250, label: 'Wall safe' },
    ],
    tools: { smoke: 2, emp: 1 },
  },
  {
    name: 'The Vault Hall',
    sub: 'Room 2 of 3 — three guards, two cameras, a vent over the top',
    par: 180,
    start: { x: 640, y: 640 },
    exit: { x: 84, y: 668, w: 96, h: 28, label: 'SERVICE EXIT' },
    vault: { x: 640, y: 96, r: 30, label: 'THE GILDED FOX' },
    walls: [
      ...borderWalls(),
      { x: 240, y: 300, w: 200, h: 80 },
      { x: 840, y: 300, w: 200, h: 80 },
      { x: 560, y: 180, w: 160, h: 60 },
      { x: 300, y: 120, w: 48, h: 48 },
      { x: 932, y: 120, w: 48, h: 48 },
    ],
    cover: [
      { x: 120, y: 420, w: 110, h: 60, kind: 'pedestal' },
      { x: 1050, y: 420, w: 110, h: 60, kind: 'pedestal' },
      { x: 420, y: 520, w: 90, h: 56, kind: 'crate' },
      { x: 770, y: 520, w: 90, h: 56, kind: 'crate' },
      { x: 560, y: 420, w: 160, h: 56, kind: 'crate' },
      { x: 120, y: 150, w: 90, h: 56, kind: 'planter' },
      { x: 1070, y: 150, w: 90, h: 56, kind: 'planter' },
    ],
    shadows: [
      { x: 100, y: 480, w: 150, h: 110 },
      { x: 1030, y: 480, w: 150, h: 110 },
      { x: 540, y: 476, w: 200, h: 90 },
      { x: 400, y: 576, w: 130, h: 96 },
      { x: 750, y: 576, w: 130, h: 96 },
    ],
    guards: [
      { waypoints: [{ x: 260, y: 250 }, { x: 1020, y: 250 }], speed: 66, pause: 1.2 },
      { waypoints: [{ x: 480, y: 500 }, { x: 800, y: 500 }], speed: 60, pause: 1.6 },
      { waypoints: [{ x: 1195, y: 180 }, { x: 1195, y: 560 }], speed: 56, pause: 1.8 },
    ],
    cameras: [
      { x: 340, y: 58, base: Math.PI / 2, sweep: 0.8, speed: 0.7 },
      { x: 940, y: 58, base: Math.PI / 2, sweep: 0.8, speed: 0.7 },
    ],
    loot: [
      { x: 90, y: 120, kind: 'painting', value: 150, label: 'Portrait' },
      { x: 1190, y: 120, kind: 'painting', value: 150, label: 'Landscape' },
      { x: 90, y: 620, kind: 'safe', value: 250, label: 'Wall safe' },
      { x: 1190, y: 620, kind: 'safe', value: 250, label: 'Wall safe' },
    ],
    tools: { smoke: 2, emp: 2 },
  },
  {
    name: 'The Rooftop Vault',
    sub: 'Room 3 of 3 — the tightest patrols. Lift it and run.',
    par: 210,
    start: { x: 640, y: 640 },
    exit: { x: 84, y: 668, w: 96, h: 28, label: 'ROOFTOP DOOR' },
    vault: { x: 640, y: 96, r: 30, label: 'THE GILDED FOX' },
    walls: [
      ...borderWalls(),
      { x: 200, y: 260, w: 180, h: 70 },
      { x: 900, y: 260, w: 180, h: 70 },
      { x: 560, y: 170, w: 160, h: 60 },
      { x: 200, y: 480, w: 140, h: 60 },
      { x: 940, y: 480, w: 140, h: 60 },
    ],
    cover: [
      { x: 420, y: 330, w: 100, h: 56, kind: 'crate' },
      { x: 760, y: 330, w: 100, h: 56, kind: 'crate' },
      { x: 560, y: 440, w: 160, h: 56, kind: 'crate' },
      { x: 120, y: 420, w: 100, h: 56, kind: 'pedestal' },
      { x: 1060, y: 420, w: 100, h: 56, kind: 'pedestal' },
      { x: 120, y: 140, w: 90, h: 56, kind: 'planter' },
      { x: 1070, y: 140, w: 90, h: 56, kind: 'planter' },
    ],
    shadows: [
      { x: 100, y: 476, w: 140, h: 100 },
      { x: 1040, y: 476, w: 140, h: 100 },
      { x: 540, y: 496, w: 200, h: 80 },
      { x: 400, y: 576, w: 130, h: 96 },
      { x: 750, y: 576, w: 130, h: 96 },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 250 }, { x: 980, y: 250 }], speed: 72, pause: 1.0 },
      { waypoints: [{ x: 400, y: 430 }, { x: 880, y: 430 }], speed: 66, pause: 1.2 },
      { waypoints: [{ x: 90, y: 200 }, { x: 90, y: 560 }], speed: 60, pause: 1.5 },
      { waypoints: [{ x: 1190, y: 200 }, { x: 1190, y: 560 }], speed: 60, pause: 1.5 },
    ],
    cameras: [
      { x: 320, y: 58, base: Math.PI / 2, sweep: 0.9, speed: 0.8 },
      { x: 640, y: 58, base: Math.PI / 2, sweep: 0.9, speed: 0.8 },
      { x: 960, y: 58, base: Math.PI / 2, sweep: 0.9, speed: 0.8 },
    ],
    loot: [
      { x: 90, y: 120, kind: 'painting', value: 150, label: 'Portrait' },
      { x: 1190, y: 120, kind: 'painting', value: 150, label: 'Landscape' },
      { x: 90, y: 620, kind: 'safe', value: 250, label: 'Wall safe' },
      { x: 1190, y: 620, kind: 'safe', value: 250, label: 'Wall safe' },
      { x: 640, y: 620, kind: 'safe', value: 400, label: 'Floor safe' },
    ],
    tools: { smoke: 3, emp: 2 },
  },
];
