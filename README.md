# The Gilded Vault — a midnight heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun rank](https://make.fun/badge/best-heist-game-20261122-0559/Dhanzganz/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun reward](https://make.fun/badge/best-heist-game-20261122-0559/Dhanzganz/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete original 2D canvas heist game, built for the
[make.fun bounty "Make the best heist game"](https://make.fun/bounty/best-heist-game-20261122-0559).

You are Rook, a thief crossing a marble gallery at midnight. Guards patrol
with sweeping vision cones, cameras watch the vault, and one alarm meter
decides whether you walk out rich or get caught in the open. Lift the
Gilded Fox, grab what else you can carry, and reach the green exit.

## How to play

- **WASD / arrows** — move (hold the mouse button to walk toward the cursor)
- **Shift** — sneak (suspicion rises half as fast)
- **1** — smoke bomb: blinds every watcher for 6 seconds
- **2** — EMP burst: knocks cameras offline for 8 seconds
- **E** — hold by the vault to pick the lock (stand still, 2.5 s)
- **M** — mute, **R** — retry a room, **Enter** — start / next room

Three rooms, three Foxes: the Marble Gallery, the Vault Hall, the Rooftop
Vault. Dark floor is shadow — hide there and guards spot you half as fast.
Red cones are guards, blue cones are cameras, gold is loot. The exit only
opens once the Fox is lifted.

## Run it

Serve `game/` with any static server and open `game/index.html` — no build
step, no network, no libraries. Sounds are synthesized in the browser.

## Layout

- `game/index.html` — the page and canvas
- `game/src/main.js` — state machine, movement, loot, vault, getaway, alarm
- `game/src/levels.js` — the three rooms, as data
- `game/src/guards.js` — patrols, vision cones, suspicion, the chase
- `game/src/cameras.js` — sweeping cameras and EMP shutdowns
- `game/src/tools.js` — smoke, EMP and the lockpick
- `game/src/render.js` — every pixel: floor, cones, thief, HUD, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects
- `game/src/demo.js` — posed moments for screenshots (`?auto=1&demo=…`)
- `game/src/util.js` — geometry: line of sight, cones, collisions
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes
  `dossier.json` with the vendored make.fun library)
