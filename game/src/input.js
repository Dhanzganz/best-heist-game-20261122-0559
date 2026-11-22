// input.js — keyboard and mouse, kept in one place.
// WASD or arrows move, Shift sneaks, 1 drops smoke, 2 fires the EMP,
// E works the lockpick, M mutes, R restarts after being caught, Enter
// starts. The mouse clicks menu buttons and can also steer: holding the
// mouse button walks the thief toward the cursor.

export function makeInput() {
  return {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    pressed: new Set(), // keys pressed since last consume (edge-triggered)
  };
}

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  Digit1: 'smoke',
  Digit2: 'emp',
  KeyE: 'pick',
  KeyM: 'mute',
  KeyR: 'retry',
  Enter: 'start',
  Space: 'start',
};

export function bindInput(input, canvas, onFirstGesture) {
  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'start'].includes(action)) e.preventDefault();
    if (!e.repeat) input.pressed.add(action);
    input.keys.add(action);
    if (onFirstGesture) onFirstGesture();
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) input.keys.delete(action);
  });
  window.addEventListener('blur', () => input.keys.clear());
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
    input.mouse.down = true;
    if (onFirstGesture) onFirstGesture();
  });
  window.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// True once for the frame the action key went down.
export function wasPressed(input, action) {
  return input.pressed.has(action);
}

export function endFrame(input) {
  input.pressed.clear();
}

// Movement vector from keys, or toward the mouse while it is held.
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('left')) x -= 1;
  if (input.keys.has('right')) x += 1;
  if (input.keys.has('up')) y -= 1;
  if (input.keys.has('down')) y += 1;
  if (x === 0 && y === 0 && input.mouse.down) {
    return { mx: input.mouse.x, my: input.mouse.y, click: true };
  }
  const len = Math.hypot(x, y) || 1;
  return { mx: x / len, my: y / len, click: false };
}
