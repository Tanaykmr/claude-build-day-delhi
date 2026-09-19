# Snap the Room

A mouse-sized RC car drives through a recognizable version of our office: down the carpet aisle, up a ramp onto a desk, along the desktop, back down, and into a cluster of cups. Three.js 0.169 + Rapier 0.14 (compat), vanilla ES modules, no build step.

## Run

```sh
python3 -m http.server 8000
open http://localhost:8000
```

Serve over HTTP. `file://` does not work (multi-file module app, import map, WASM). The first load pulls Three.js and Rapier from jsDelivr; warm the cache on the demo laptop before going on stage and keep that tab open.

Controls: **WASD / arrows** drive, **Space** brake, **R** recover to spawn. Losing window focus clears input. Reload the page to restore every prop.

The page opens on the **menu** (`menu.js` + `menu.css`): four pages (Start, Create, Phases, Briefing) over a live cinematic of the parked car while the engine boots behind it. **Enter** or **Drive** starts, **Esc** pauses back into the menu, **M** toggles the music, **F** fullscreen, **← →** switch pages. Music is "Pamgaea" by Kevin MacLeod (CC BY 4.0, see `audio/CREDITS.txt`); it starts on the first click or key press because browsers block autoplay, and it ducks to a low level in the game. `?nomenu=1` boots straight into the game; every debug URL below already does.

**Create a map** (`maps.js`): drop 5 to 10 photos of a room, paste an Anthropic API key, pick Claude Opus 5 or Sonnet 5, generate. The browser downsizes the photos and calls the Claude API directly with the official SDK (pinned on jsDelivr); Claude answers through a strict-schema tool so the layout is valid JSON, `validateMap()` repairs what it can (missing floor or walls, a spawn inside furniture) and the map is saved in `localStorage`. **Drive this map** opens `?map=<id>&go=1`. The key is sent only to `api.anthropic.com`; "remember" keeps it in this browser's `localStorage`.

**In game** (`hud.js` + `hud.css`) the screen shows only a rotating minimap bottom-left (`minimap.js` rasterizes the room top-down once) and a radial speedometer bottom-right in scale km/h (the 1:36 car at 1.2 m/s reads 155). The old title, meter and controls panels are hidden; a controls hint fades in for six seconds after the menu closes.

## URLs

| URL | What it does |
| --- | --- |
| `/` | Full office (room.js + props.js) |
| `/?fallback=1` | Simple tested room (room.fallback.js), no props. Selected before the live modules import, so a broken room.js cannot block it |
| `/?debug=1` | fps, draw calls, triangle/body counts, car position, wheel contacts |
| `/?ramp=15` | Gentler ramp (default 17°). Benches shift east automatically so the approach stays 1.25 m. Any value 12–18.5 |
| `/?detail=low` | Drops monitors, divider trim and most chairs (about 450 fewer boxes) for slow machines |
| `/?shadows=1` | Directional shadows (off by default per the PRD) |
| `/?menu=create` · `/?menu=phases` · `/?menu=briefing` | Open the menu on that page (screenshots, deep links) |
| `/?map=<id>` | Drive a map generated on the Create page (stored in this browser). Add `&go=1` to skip the menu once loaded |
| `/?nomenu=1` | Skip the menu and boot straight into the game |
| `/preview.html` | Room preview harness (B track): orbit camera, view presets, live reload, lighting sliders with "copy JSON" for lighting.js |
| `/preview.html?view=<name>` | Preset camera with all panels hidden, for screenshots. Names: `overview`, `west`, `ramp`, `crest`, `aisle`, `aisle-high`, `hero-wall`, `desk-lane`, `divider-gap`, `cabins`, `cups`, `under-desk`, `top`. Add `&noroute` to hide route markers, `&ceiling` to show the ceiling, `&panels=1` to keep the UI |

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

```sh
node cdp-flow.mjs http://localhost:8000/ .shots   # headless Chrome over DevTools: menu ready → Enter drives → Esc pauses → Esc resumes, screenshots each state, fails on page errors
```

```sh
./shot.sh out.png "http://localhost:8000/preview.html?view=overview"   # headless Chrome screenshot
```

## Layout (world meters, +X east, +Z south, Y up)

- Room 16 × 13 m, carpet top at y = 0, desktop tops at y = 0.75, ceiling 2.9.
- Four bench runs (9.6 m, eight 1.2 m pitches) centred on z = -4.8, -1.6, 1.6, 4.8, running from x = -4.08 to 5.52.
- Orange hero wall on the north side (z = -6.5), five grey-blue cabins along the east wall, two wood pillars at the west end.
- **Spawn** (-7.0, 0) on the olive accent run, facing east (+X). The ramp lane is on the car's **left**, the cups are on its **right**.
- **Ramp**: foot fillet begins at x = -6.65, main slope x = -6.53 to -4.08, on lane z = -1.9 (north side of the z = -1.6 bench), 0.4 m wide, 17°. Flat carpet approach 1.25 m from the west wall.
- **Divider gap**: pitch 4 of the z = -1.6 bench, x ≈ 0.12, marked by a 0.5 m olive mat across both lanes.
- **Cup cluster**: 1 m olive square at (-6.1, 1.5), five white cups plus a bottle, files and a bin.

## Two-minute demo sequence

| Time | Action |
| --- | --- |
| 0:00–0:15 | Let the scene sit at spawn. Point out the carpet tiles, the white desk runs with blue dividers, the orange wall on the left, the cabins ahead. |
| 0:15–0:45 | Drive east down the centre aisle for a few meters, pass under a desk on the way back if you like (the gap pitch at x ≈ 0.12 is chair-free on every bench), return to the west end. |
| 0:45–1:20 | From spawn: turn **left** (north), drive about 1.9 m until you are on the ramp lane (z ≈ -1.9, the beige plate is directly ahead on your right), turn **right** (east) and drive straight up. Steady throttle, no steering on the slope. Follow the desktop east to the **olive mat** (x ≈ 0.12), turn through the gap and back, or simply U-turn on the mat. |
| 1:20–1:45 | Drive west along the lane, straight down the ramp. At the bottom turn **left** (south) and drive about 3.4 m to the olive square. Scatter the cups. |
| 1:45–2:00 | Press **R** to show recovery, hand over the keyboard. |

Knocking the desk-lane cups off the edge on the way east is optional; they sit at x = -2.4 to 3.0 on the outer edge.

## Fallback plan

1. Ramp tips or snags: try `/?ramp=15` first (no code change). If it still fails, freeze the demo to the carpet and under-desk route and drop the desk-climb claim from the pitch.
2. Live room fails to load or performs badly: `/?fallback=1` is a simple, checked room with the same ramp math, tile grid and hero wall. Rehearse it once so it is not a surprise. `/?detail=low` is the middle option.
3. Engine regression: keep a complete copy of the tested demo directory outside the working tree at the minute-90 milestone and serve that instead.
4. Performance: `?shadows` off (default) → `?detail=low` → fewer props.

## Files

| File | Owner | Role |
| --- | --- | --- |
| `index.html`, `car.js`, `check-drive.mjs` | A | Renderer, physics loop, vehicle, input, camera, HUD, drive test |
| `room.js`, `props.js`, `room.fallback.js` | B | Room data (fixed cuboids), dynamic props, tested simple room |
| `lighting.js` | B | Lighting, per-tag material and emissive direction consumed by index.html |
| `preview.html`, `check-room.mjs`, `shot.sh` | B | Preview harness, geometry checks, screenshot helper |
| `menu.js`, `menu.css`, `audio/` | B | Front-end menu (Start, Create, Phases, Briefing; music, UI sounds, cinematic hook). index.html mounts it with one call; `?nomenu=1` and all debug URLs bypass it |
| `maps.js` | B | User maps: photo → layout generation with the Claude API (strict tool schema), validation/repair, localStorage |
| `minimap.js`, `hud.js`, `hud.css` | B | Top-down room rasterizer, in-game HUD (rotating minimap, radial speedometer, fading hint) |
| `cdp-flow.mjs` | B | Headless Chrome flow check over DevTools (menu → create page → drive → pause → resume) |
| `prd.md` | both | The validated build spec |
