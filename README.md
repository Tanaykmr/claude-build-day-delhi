# Snap the Room

A mouse-sized RC car drives through a recognizable version of our office: down the carpet aisle, up a ramp onto a desk, along the desktop, back down, and into a cluster of cups. Three.js 0.169 + Rapier 0.14 (compat), vanilla ES modules, no build step.

## Run

```sh
python3 -m http.server 8000
open http://localhost:8000
```

Serve over HTTP. `file://` does not work (multi-file module app, import map, WASM). The first load pulls Three.js and Rapier from jsDelivr; warm the cache on the demo laptop before going on stage and keep that tab open.

In-game controls (the menu has its own, below): **WASD / arrows** drive, **Space** brake, **Shift** handbrake, **R** recover (in a race: back onto the racing line, progress kept), **Enter** start a race / race again, **Esc** (or **F**) back to free drive, **M** sound on/off. Shift only acts under the `joyride` handling, which is the default. Sound is synthesized in code and only starts after the first key press or click (browser autoplay rule); it pauses with the game. Losing window focus clears input. Reload the page to restore every prop.

The page opens on the **menu** (`menu.js` + `menu.css`): four pages (Start, Create, Phases, Briefing) over a live cinematic of the parked car while the engine boots behind it. **Enter** or **Drive** starts, **Esc** pauses back into the menu, **M** toggles the music, **F** fullscreen, **← →** switch pages. Music is "Pamgaea" by Kevin MacLeod (CC BY 4.0, see `audio/CREDITS.txt`); it starts on the first click or key press because browsers block autoplay, and it ducks to a low level in the game. Phase 4 is shown locked; the start page and the Phase 2 card link to the race. `?nomenu=1` boots straight into the game, and so do `?demo`, `?script`, `?cam`, `?spawn`, `?preroll`, `?strip`, `?mode`, `?map=…&go=1` and `?debug`.

**Create a map** (`maps.js`): drop 5 to 10 photos of a room, paste an Anthropic API key, pick Claude Opus 5 or Sonnet 5, generate. The browser downsizes the photos and calls the Claude API directly with the official SDK (pinned on jsDelivr); Claude answers through a strict-schema tool so the layout is valid JSON, `validateMap()` repairs what it can (missing floor or walls, a spawn inside furniture) and the map is saved in `localStorage`. **Drive this map** opens `?map=<id>&go=1`. The key is sent only to `api.anthropic.com`; "remember" keeps it in this browser's `localStorage`, so treat it like any other credential on a shared machine.

## Race

Press Enter (or open `/?mode=race`) for a 3-lap race against three rivals (coral, blue, lime) on the floor loop exported as `RACE` by room.js and room.fallback.js: 2×2 grid start (you start at the back), 3-2-1-GO countdown, ordered checkpoints (cutting the course does not count), live lap / position / time, north-up minimap top-right, results panel with Enter to retry. The rivals use the same car.js handling as you and follow `RACE.line`. A generated map has no `RACE` export, so the race keys stay idle there.

## URLs

| URL | What it does |
| --- | --- |
| `/` | Full office (room.js + props.js) |
| `/?fallback=1` | Simple tested room (room.fallback.js), no props. Selected before the live modules import, so a broken room.js cannot block it |
| `/?debug=1` | fps, draw calls, triangle/body counts, car position, wheel contacts, rAF Hz, steps-per-frame histogram, physics ms/step, race phase and per-car lap/checkpoint |
| `/?ramp=15` | Gentler ramp (default 17°). Benches shift east automatically so the approach stays 1.25 m. Any value 12–18.5 |
| `/?detail=low` | Drops monitors, divider trim and most chairs (about 450 fewer boxes) for slow machines |
| `/?shadows=1` | Directional shadows (off by default per the PRD) |
| `/?handling=classic` | The previous Rapier-wheel controller, kept for comparison. Default is `joyride` (Joyride-style planar handling on top of Rapier suspension: speed-scaled steering, throttle taper, brake-before-reverse, grip/drift lateral decay, handbrake). Independent of `?fallback=1` |
| `/?strip=N,dt` | Filmstrip: renders N frames spaced dt simulation-seconds apart into one grid, so one screenshot shows the motion of car and camera. Composes with `?script`, `?demo`, `?spawn`, `?preroll`, `?cam`. Example: `/?debug=1&strip=9,0.4&script=W:1,WA:3` |
| `/?demo=1` | Replays the rehearsed route with the closed-loop driver from car.js; any driving key takes over |
| `/?mode=race` | Start on the grid at boot (composes with `?preroll`, `?strip`, `?debug`) |
| `/?ai=1` | Debug: the AI drives your car too, so you can spectate a race. Useful for results screenshots, e.g. `/?mode=race&ai=1&preroll=125` |
| `/?menu=create` · `/?menu=phases` · `/?menu=briefing` | Open the menu on that page (screenshots, deep links) |
| `/?map=<id>` | Drive a map generated on the Create page (stored in this browser). Add `&go=1` to skip the menu once loaded |
| `/?nomenu=1` | Skip the menu and boot straight into the game. `?demo`, `?script`, `?cam`, `?spawn`, `?preroll`, `?strip`, `?mode`, `?debug` and `?map=…&go=1` already do |
| `/preview.html` | Room preview harness (B track): orbit camera, view presets, live reload, lighting sliders with "copy JSON" for lighting.js |
| `/preview.html?view=<name>` | Preset camera with all panels hidden, for screenshots. Names: `overview`, `west`, `ramp`, `crest`, `aisle`, `aisle-high`, `hero-wall`, `desk-lane`, `divider-gap`, `cabins`, `cups`, `under-desk`, `top`, `race`. Add `&noroute` to hide route markers, `&ceiling` to show the ceiling, `&race` to show the race markers in any view, `&panels=1` to keep the UI |

Debug automation on the live page (A track): `?cam=x,y,z`, `?spawn=x,y,z,heading`, `?preroll=<s>`, `?script=<timed key holds>` such as `W:3,WA:2` where each token is a set of keys held for that many seconds (`W A S D` drive, `_` = Space brake, `H` = Shift handbrake, `R` = recover). See the comments in index.html.

## Headless checks

```sh
node check-room.mjs              # live room + props: contract, bounds, ramp math, corridors, prop rest
node check-room.mjs --fallback   # same for room.fallback.js
node check-room.mjs --ramp=15 --detail=low
node check-drive.mjs             # Rapier drive test, both rooms, joyride handling (default): 38 checks per pass
node check-drive.mjs --handling=classic   # the previous controller: 32 checks
node check-drive.mjs --live --ramp=15 --verbose
node check-drive.mjs --trace     # per-step CSV traces to .traces/ plus jitter metrics next to the recorded classic baseline
node check-drive.mjs --trace=straight,slide   # subset; scenarios: straight, uturn, ramp, lane, descent, reverse, slide
```

Both check-room modes must exit 0 before a commit to room data. check-drive prints pass/fail per scenario. Its r1–r3 race scenarios verify that the four-car grid settles without contact, that four AI cars lap `RACE.line` in both rooms (34–39 s, no recovery), and that checkpoint ordering holds.

check-room runs the corridor and race checks on **both** rooms (room.fallback.js exports `BENCH_X`, `BENCH_Z`, `GAP_PITCH`, `RAMP_LANE_Z` for that). It also validates the enrichment and race data: every bench's gap pitch stays crossable under the desk, the race legs (north aisle, east-end turn, west-end turn) are clear, under-desk clutter stays inside the desktop footprints, the `RACE` export has 4 clear grid slots at least 0.25 m apart, checkpoints over carpet (or the driven desktop lane) with clear air above them and at least 1 m between consecutive ones, and a minimap outline inside the room bounds. It prints per-tag box counts so the instancing budget is visible.

```sh
./shot.sh out.png "http://localhost:8000/preview.html?view=overview" [budget_ms] [WxH]   # headless Chrome screenshot (default 1600,900)
./capture.sh b3            # nine repeatable live views into .shots/b3-*.png: spawn, straight, under-desk, ramp foot, crest, desk lane, descent, cups, fallback
./capture.sh b3-proj 1024,768
./capture.sh joy 1024,768 "handling=joyride"   # optional third argument is appended to every URL (any query, e.g. shadows=1)
node cdp-flow.mjs http://localhost:8000/ .shots   # headless Chrome over DevTools: menu ready → Enter drives → Esc pauses → Esc resumes, screenshots each state, fails on page errors
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

Smash Karts direction: vivid blue, coral, orange, lime and yellow on off-white and deep navy, with the office still recognisable. Carpet is deep navy-grey (`#343c52`, tile rows `#3a4359`, seams `#283046`) with lime accent runs (`#93cc3c`); desks white (`#f7f5f0`); divider panels vivid blue (`#2f6fe4`) over a navy base band; hero wall orange (`#ff8a3d`); cabin glass sky-blue (`#5f9ad6`); chairs, towers, monitor bezels and cable trays share one deep navy (`#232b47`); about one chair in five is coral (`#f26a55`); screens are a unique emissive blue (`#2c66dd`). Accent hexes for clutter: coral, yellow `#f7c948`, leaf `#5fbe47`, pot `#e0d6c4`, aqua `#7fd1e8`. Total 23 colours in the live room (instancing is per colour + tag, about 60 static draw groups). Under the photo texture pack the carpet, accent runs, chairs and screens take the pack's colours, so the divider blue, cabin glass and hero orange were pulled a notch off neon (`#3470d8`, `#7aa8d4`, `#f78a42`) to sit on the grey carpet without looking pasted on; `?textures=off` shows the flat palette on the navy carpet. Lighting is a near-white key, a light neutral-cool hemisphere ground (the photo carpet is dark and needs bounce) and modest ambient, exposure 1.08, metalness capped at 0.2, so saturated paint keeps its hue instead of washing to beige and whites stay white in both texture modes. The emissive map in lighting.js is keyed by colour, so anything that must not glow may not reuse the screen or troffer hex.

### Enrichment (all fixed cuboids, purely visual, zero extra physics bodies)

Every workstation except the driven lane and the driven bench's gap pitch gets seeded clutter: keyboard and mouse at the front edge, one of notebook / paper stack / desk phone on the left, a mug and one of pen cup / small plant on the right. Under the desks: a bin beside occupied chairs on the tower-free side, a storage pedestal where nobody sits, one cable tray per lane just inside the frame rail (y ≈ 0.63, above the under-desk crossing) and a few cable drops beside legs (never legs 3, 4 or 7). Around the room: floor plants west of both pillars, in front of the cabins and along the hero wall; two recycling bins on the north pillar; a printer cabinet by the south pillar; a water cooler beside the hero-wall door; a wall clock. New tags, listed in check-room.mjs and lighting.js `MATERIALS`: `desk-item`, `plant`, `storage`, `cable`. Nothing is inferred from a tag. `?detail=low` drops the desk items and cable drops along with monitors and trim.

### Silhouettes (B3: reads at car height, textures on or off)

The most-seen furniture is built from small multi-box assemblies instead of single boxes, all still fixed cuboids in `ROOM`, so colliders and instancing keep working. Rotated parts use yaw-only `rot`; a `yawed(px, pz, yaw)` helper in room.js rotates a whole assembly about its pivot. Chairs (12 boxes): three rotated spokes stand in for a five-star base, a column, a two-step seat (cushion plus a narrower pad), a slotted backrest with a top rail and two armrests; every chair is yawed up to ±7° and jittered along the bench so no two read identical. Monitors (6 boxes): flat foot, hub, neck, thin bezel with the screen 4 mm proud and a chunkier rear housing, yawed up to ±6°. Keyboards are yawed up to ±4.5°. Desk legs get foot plates, pillars get base and cap trim, cabin doors get navy jambs and heads, bins get light rims, pedestals get two drawer handles that end exactly at the desk edge. `?detail=low` keeps the four-box chair and drops monitors, feet and desk clutter as before. Footprints stay inside the old plates so every corridor check is unchanged.

With the photo texture pack on (default since f5e28db), the pack keys its surfaces off tags and `PALETTE` values, so the data side must keep: the race strip and chevrons in `PALETTE.desktop` / `PALETTE.chair` (the pack excludes exactly those from the carpet texture), screens in `PALETTE.screen`, and chair bases in `PALETTE.chairBase` (metal, not upholstery).

### Race data contract (`RACE`, exported by room.js and room.fallback.js)

```js
RACE = {
  laps: 3,
  grid: [{ pos: [x, y, z], heading }, ...4],          // body origins like SPAWN, 2x2 in the spawn aisle at x -6.7 / -7.05, z ±0.16, facing +X
  checkpoints: [{ pos: [x, y, z], radius }, ...],      // ordered, closed loop; pos.y is the SURFACE height; [0] is start/finish
  line: [{ pos: [x, y, z], speed }, ...],              // dense racing line for the AI: about every 0.5 m, closed, [0] at the start line; speed 0–1 = fraction of max
  minimap: { bounds: [minX, minZ, maxX, maxZ], walls: [[x0, z0, x1, z1], ...] }, // coarse outline: room, cabin front, bench runs, pillars
}
```

`RACE.line` is generated in both rooms by the same `raceLine()` helper: the loop's four corners (east pair at the bench→cabin gap, radius 0.7; west pair at x = -7.3, radius 0.6) are rounded with tangent arcs, the closed path is resampled at an exactly uniform step of about 0.5 m, and each point gets a target speed from its local heading change (1.0 on the straights, about 0.45 at the apexes), ramped down over the 2 m before a turn and back up over about 1 m after it. The north straight runs at z = -3.1 (0.3 m clear of the north pillar), the west straight at x = -7.3 (0.65 m west of the ramp's foot fillet). check-room fails if any point is off the carpet, outside the union of floor race corridors, closer than 0.15 m to anything a car can hit (any non-carpet box that starts below y = 0.3), spaced outside 0.25–0.75 m, or if the line misses a checkpoint disc.

**Race dressing** is carpet-tagged ROOM data within 3 mm of the surface, so corridor checks treat it as floor and the car never feels it: a 0.3 × 1.6 m checkered start/finish strip (navy + white 0.1 m squares, top 4 mm, 1 mm above the lime stripe) across the aisle at x = -5.6, and white direction chevrons (two 0.28 m bars rotated ±45° about Y) every 2.4 m on both aisles, pointing east on z = 0 and west on z = -3.1. `?detail=low` keeps the strip and drops the chevrons. check-room fails if any carpet piece rises above 4 mm.

**Loop choice: a pure floor loop around the driven bench**, counter-clockwise on a north-up minimap: east along the spawn aisle (z = 0), north past the bench end between it and the cabin sill, west along the z = -3.2 aisle, south along the west wall on the wall side of the ramp approach, back to the start line at x = -5.6. About 30 m per lap, eleven checkpoints, radii 0.35 (corners) to 0.6 (aisles). The ramp is deliberately **not** part of the loop: a 0.4 m ramp driven in both directions plus a U-turn on a 0.6 m desk lane is fine for one player and a pile-up for four cars, so the desk stays a free-drive feature. Positions that depend on the bench shift (`?ramp=15`) are derived from `BENCH_X`. check-room fails if a checkpoint is not over carpet or the driven desktop, has furniture within its inner half, or is closer than 1 m to the next; grid slots must be clear of furniture, on carpet, off the ramp and at least 0.25 m apart. `preview.html?view=race` draws the rings, the loop line, the racing line (dots coloured green → red by target speed), the grid slabs and the minimap walls.

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
| `race.js` | A | Race progress (checkpoints, laps, standings), countdown clock, AI line driver; shared by index.html and check-drive.mjs |
| `room.js`, `props.js`, `room.fallback.js` | B | Room data (fixed cuboids), dynamic props, tested simple room |
| `lighting.js` | B | Lighting, per-tag material and emissive direction consumed by index.html |
| `preview.html`, `check-room.mjs` | B | Preview harness (presets, lighting sliders, route and race markers), geometry / corridor / race-data checks |
| `shot.sh`, `capture.sh`, `cdp-flow.mjs` | orchestrator | Headless screenshot helper, the nine-view capture set and the menu-to-drive flow check (A may extend with a note; existing arguments never change) |
| `menu.js`, `menu.css`, `audio/` | B | Front-end menu (Start, Create, Phases, Briefing; music, UI sounds, cinematic hook). index.html mounts it with one call; `?nomenu=1` and all debug URLs bypass it |
| `maps.js` | B | User maps: photo → layout generation with the Claude API (strict tool schema), validation/repair, localStorage |
| `prd.md` | both | The validated build spec |
