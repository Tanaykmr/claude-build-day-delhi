# Snap the Room

A mouse-sized RC car drives through a recognizable version of our office: down the carpet aisle, up a ramp onto a desk, along the desktop, back down, and into a cluster of cups. Three.js 0.169 + Rapier 0.14 (compat), vanilla ES modules, no build step.

## Run

```sh
python3 -m http.server 8000
open http://localhost:8000
```

Serve over HTTP. `file://` does not work (multi-file module app, import map, WASM). The first load pulls Three.js and Rapier from jsDelivr; warm the cache on the demo laptop before going on stage and keep that tab open.

Controls: **WASD / arrows** drive, **Space** brake, **Shift** handbrake (slides; honoured by the `joyride` handling, ignored by `classic`), **R** recover to spawn. Losing window focus clears input. Reload the page to restore every prop.

## URLs

| URL | What it does |
| --- | --- |
| `/` | Full office (room.js + props.js) |
| `/?fallback=1` | Simple tested room (room.fallback.js), no props. Selected before the live modules import, so a broken room.js cannot block it |
| `/?debug=1` | fps, draw calls, triangle/body counts, car position, wheel contacts |
| `/?ramp=15` | Gentler ramp (default 17°). Benches shift east automatically so the approach stays 1.25 m. Any value 12–18.5 |
| `/?detail=low` | Drops monitors, divider trim and most chairs (about 450 fewer boxes) for slow machines |
| `/?shadows=1` | Directional shadows (off by default per the PRD) |
| `/?handling=joyride` | Vehicle model selector in car.js: `classic` (default, the validated controller) or `joyride` (the Joyride-derived candidate: speed-scaled steering, throttle taper, brake-before-reverse, grip/drift lateral decay, handbrake). Independent of `?fallback=1` |
| `/?demo=1` | Replays the rehearsed route with the closed-loop driver from car.js; any driving key takes over |
| `/preview.html` | Room preview harness (B track): orbit camera, view presets, live reload, lighting sliders with "copy JSON" for lighting.js |
| `/preview.html?view=<name>` | Preset camera with all panels hidden, for screenshots. Names: `overview`, `west`, `ramp`, `crest`, `aisle`, `aisle-high`, `hero-wall`, `desk-lane`, `divider-gap`, `cabins`, `cups`, `under-desk`, `top`, `race`. Add `&noroute` to hide route markers, `&ceiling` to show the ceiling, `&race` to show the race markers in any view, `&panels=1` to keep the UI |

Debug automation on the live page (A track): `?cam=x,y,z`, `?spawn=x,y,z`, `?preroll=<s>`, `?script=<timed key holds>`. See the comments in index.html.

## Headless checks

```sh
node check-room.mjs              # live room + props: contract, bounds, ramp math, corridors, prop rest
node check-room.mjs --fallback   # same for room.fallback.js
node check-room.mjs --ramp=15 --detail=low
node check-drive.mjs             # Rapier drive test: flat floor, ramp climb, spawn-to-desk route, both rooms
node check-drive.mjs --live --ramp=15 --verbose
```

Both check-room modes must exit 0 before a commit to room data. check-drive prints pass/fail per scenario.

check-room also validates the enrichment and race data: every bench's gap pitch stays crossable under the desk, the race legs (north aisle, east-end turn, west-end turn) are clear, under-desk clutter stays inside the desktop footprints, the `RACE` export has 4 clear grid slots at least 0.25 m apart, checkpoints over carpet (or the driven desktop lane) with clear air above them and at least 1 m between consecutive ones, and a minimap outline inside the room bounds. It prints per-tag box counts so the instancing budget is visible.

```sh
./shot.sh out.png "http://localhost:8000/preview.html?view=overview" [budget_ms] [WxH]   # headless Chrome screenshot (default 1600,900)
./capture.sh b3            # nine repeatable live views into .shots/b3-*.png: spawn, straight, under-desk, ramp foot, crest, desk lane, descent, cups, fallback
./capture.sh b3-proj 1024,768
```

Compare a capture set against the tagged baseline (`git tag baseline-mvp`, shots `.shots/base-*.png`) before and after any visual change.

## Layout (world meters, +X east, +Z south, Y up)

- Room 16 × 13 m, carpet top at y = 0, desktop tops at y = 0.75, ceiling 2.9.
- Four bench runs (9.6 m, eight 1.2 m pitches) centred on z = -4.8, -1.6, 1.6, 4.8, running from x = -4.08 to 5.52.
- Orange hero wall on the north side (z = -6.5), five grey-blue cabins along the east wall, two wood pillars at the west end.
- **Spawn** (-7.0, 0) on the lime accent run, facing east (+X). The ramp lane is on the car's **left**, the cups are on its **right**.
- **Ramp**: foot fillet begins at x = -6.65, main slope x = -6.53 to -4.08, on lane z = -1.9 (north side of the z = -1.6 bench), 0.4 m wide, 17°, painted coral. Flat carpet approach 1.25 m from the west wall.
- **Divider gap**: pitch 4 of the z = -1.6 bench, x ≈ 0.12, marked by a 0.5 m lime mat across both lanes.
- **Cup cluster**: 1 m lime square at (-6.1, 1.5), five white cups plus a bottle, files and a bin. Cups are 30 × 90 mm and 15 g so the 25 mm bumper tips them instead of shoving them.

### Palette (room.js `PALETTE`, lighting.js)

Smash Karts direction: vivid blue, coral, orange, lime and yellow on off-white and deep navy, with the office still recognisable. Carpet is deep navy-grey (`#343c52`, tile rows `#3a4359`, seams `#283046`) with lime accent runs (`#93cc3c`); desks white (`#f7f5f0`); divider panels vivid blue (`#2f6fe4`) over a navy base band; hero wall orange (`#ff8a3d`); cabin glass sky-blue (`#5f9ad6`); chairs, towers, monitor bezels and cable trays share one deep navy (`#232b47`); about one chair in five is coral (`#f26a55`); screens are a unique emissive blue (`#2c66dd`). Accent hexes for clutter: coral, yellow `#f7c948`, leaf `#5fbe47`, pot `#e0d6c4`, aqua `#7fd1e8`. Total 23 colours in the live room (instancing is per colour + tag, about 56 static draw groups). Lighting is a near-white key, a cool navy-grey hemisphere ground and low ambient, exposure 1.05, metalness capped at 0.2, so saturated paint keeps its hue instead of washing to beige. The emissive map in lighting.js is keyed by colour, so anything that must not glow may not reuse the screen or troffer hex.

### Enrichment (all fixed cuboids, purely visual, zero extra physics bodies)

Every workstation except the driven lane and the driven bench's gap pitch gets seeded clutter: keyboard and mouse at the front edge, one of notebook / paper stack / desk phone on the left, a mug and one of pen cup / small plant on the right. Under the desks: a bin beside occupied chairs on the tower-free side, a storage pedestal where nobody sits, one cable tray per lane just inside the frame rail (y ≈ 0.63, above the under-desk crossing) and a few cable drops beside legs (never legs 3, 4 or 7). Around the room: floor plants west of both pillars, in front of the cabins and along the hero wall; two recycling bins on the north pillar; a printer cabinet by the south pillar; a water cooler beside the hero-wall door; a wall clock. New tags, listed in check-room.mjs and lighting.js `MATERIALS`: `desk-item`, `plant`, `storage`, `cable`. Nothing is inferred from a tag. `?detail=low` drops the desk items and cable drops along with monitors and trim.

### Race data contract (`RACE`, exported by room.js and room.fallback.js)

```js
RACE = {
  laps: 3,
  grid: [{ pos: [x, y, z], heading }, ...4],          // body origins like SPAWN, 2x2 in the spawn aisle at x -6.7 / -7.05, z ±0.16, facing +X
  checkpoints: [{ pos: [x, y, z], radius }, ...],      // ordered, closed loop; pos.y is the SURFACE height; [0] is start/finish
  minimap: { bounds: [minX, minZ, maxX, maxZ], walls: [[x0, z0, x1, z1], ...] }, // coarse outline: room, cabin front, bench runs, pillars
}
```

**Loop choice: a pure floor loop around the driven bench**, counter-clockwise on a north-up minimap: east along the spawn aisle (z = 0), north past the bench end between it and the cabin sill, west along the z = -3.2 aisle, south along the west wall on the wall side of the ramp approach, back to the start line at x = -5.6. About 30 m per lap, eleven checkpoints, radii 0.35 (corners) to 0.6 (aisles). The ramp is deliberately **not** part of the loop: a 0.4 m ramp driven in both directions plus a U-turn on a 0.6 m desk lane is fine for one player and a pile-up for four cars, so the desk stays a free-drive feature. Positions that depend on the bench shift (`?ramp=15`) are derived from `BENCH_X`. check-room fails if a checkpoint is not over carpet or the driven desktop, has furniture within its inner half, or is closer than 1 m to the next; grid slots must be clear of furniture, on carpet, off the ramp and at least 0.25 m apart. `preview.html?view=race` draws the rings, the loop line, the grid slabs and the minimap walls.

## Two-minute demo sequence

| Time | Action |
| --- | --- |
| 0:00–0:15 | Let the scene sit at spawn. Point out the navy carpet tiles, the white desk runs with blue dividers and coral chairs, the orange wall on the left, the blue cabins ahead. |
| 0:15–0:45 | Drive east down the centre aisle for a few meters, pass under a desk on the way back if you like (the gap pitch at x ≈ 0.12 is chair-free on every bench), return to the west end. |
| 0:45–1:20 | From spawn: turn **left** (north), drive about 1.9 m until you are on the ramp lane (z ≈ -1.9, the beige plate is directly ahead on your right), turn **right** (east) and drive straight up. Steady throttle, no steering on the slope. Follow the desktop east to the **lime mat** (x ≈ 0.12), turn through the gap and back, or simply U-turn on the mat. |
| 1:20–1:45 | Drive west along the lane, straight down the ramp. At the bottom turn **left** (south) and drive about 3.4 m to the lime square. Scatter the cups. |
| 1:45–2:00 | Press **R** to show recovery, hand over the keyboard. |

Knocking the desk-lane cups off the edge on the way east is optional; they sit at x = -2.4 to 3.0 on the outer edge.

## Fallback plan

1. Ramp tips or snags: try `/?ramp=15` first (no code change). If it still fails, freeze the demo to the carpet and under-desk route and drop the desk-climb claim from the pitch.
2. Live room fails to load or performs badly: `/?fallback=1` is a simple, checked room with the same ramp math, tile grid, hero wall, palette and `RACE` data. Rehearse it once so it is not a surprise. `/?detail=low` is the middle option.
3. Engine regression: keep a complete copy of the tested demo directory outside the working tree at the minute-90 milestone and serve that instead.
4. Performance: `?shadows` off (default) → `?detail=low` → fewer props.

## Reference and attribution

Handling and chase-camera equations (vehicle-relative velocity, speed-scaled steering authority, throttle taper, brake-before-reverse, reduced reverse, rolling and quadratic drag, grip / drift lateral decay, bicycle-model yaw target with sliding yaw inertia, position and look-target smoothing with speed-based lookahead) are adapted from **Joyride** by nitzangames, https://github.com/nitzangames/joyride, revision `ea4285dd07215002f0422c2e518320e83969704c`, ISC license. Constants are rescaled to the 12 cm RC car in car.js; suspension, ramps, landings and collisions stay with Rapier. The Smash Karts-inspired palette and the low-poly, flat-colour, instanced-box visual style follow Joyride's approach (vertex-colour variation, batching by material) without importing its city.

## Files

| File | Owner | Role |
| --- | --- | --- |
| `index.html`, `car.js`, `check-drive.mjs` | A | Renderer, physics loop, vehicle, input, camera, HUD, drive test |
| `room.js`, `props.js`, `room.fallback.js` | B | Room data (fixed cuboids), dynamic props, tested simple room |
| `lighting.js` | B | Lighting, per-tag material and emissive direction consumed by index.html |
| `preview.html`, `check-room.mjs` | B | Preview harness (presets, lighting sliders, route and race markers), geometry / corridor / race-data checks |
| `shot.sh`, `capture.sh` | orchestrator | Headless screenshot helper and the nine-view capture set (A may extend with a note; existing arguments never change) |
| `prd.md` | both | The validated build spec |
