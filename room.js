// room.js — Snap the Room v3, owner B (Chirag).
// Contract (frozen, see prd.md §3): exports SPAWN and ROOM. room.fallback.js exports the SAME names.
// Every ROOM entry is ONE fixed cuboid: { pos, size, rot?, color, tag }.
//   pos  = world-space center in meters
//   size = full X/Y/Z extents (loader halves them for Rapier)
//   rot  = optional Euler XYZ radians, applied identically to mesh and collider
//   tag  = rendering / material grouping ONLY. No behavior is inferred from a tag.
//
// Convention: every course elevation is a SURFACE height (carpet top y=0, desktop top y=0.75).
// Solid centers are offset downward by half their thickness.
//
// Optional URL flag for slow machines / projector triage: ?detail=low drops monitors, divider
// trim and most chairs (about 300 fewer boxes). Default is the full office.

// URL params (browser) or globalThis.ROOM_PARAMS (node, set by check-room.mjs) tune the data module:
//   ?detail=low   drop monitors, divider trim and most chairs
//   ?ramp=15      gentler ramp angle in degrees (default RAMP_DEG_DEFAULT), see ramp section
const param = (k) =>
  (typeof location !== "undefined" && new URLSearchParams(location.search).get(k)) ||
  (globalThis.ROOM_PARAMS && globalThis.ROOM_PARAMS[k]) ||
  null;
const DETAIL = param("detail") || "high";
const HIGH = DETAIL !== "low";

// ---------- office dimensions (prd.md §4, provisional) ----------
export const W = 16; // room X extent
export const D = 13; // room Z extent
export const CEIL = 2.9;
export const DESK_TOP = 0.75; // desktop top surface
const TOP_T = 0.04; // desktop thickness → center y = 0.73
const LANE = 0.6; // desktop depth per side
const RUN_LEN = 9.6; // eight 1.20 m seat pitches
const PITCH = 1.2;
export const BENCH_Z = [-4.8, -1.6, 1.6, 4.8];

// ---------- ramp parameters (prd.md §6) ----------
// RAMP_DEG is the ONE knob if A reports tipping: 17 → 15 lengthens the run 2.45 → 2.80 m and the
// bench run shifts east automatically so the flat approach west of the foot stays FLAT_APPROACH.
// Try it live without editing: /?ramp=15 (and node check-room.mjs --ramp=15). Change the default here.
//   deg   run    BENCH_X  bench east end (cabin glass is at x=6.37)
//   17    2.45   0.72     5.52
//   16    2.62   0.89     5.69
//   15    2.80   1.07     5.87
const RAMP_DEG_DEFAULT = 17;
export const RAMP_DEG = Math.min(18.5, Math.max(12, Number(param("ramp")) || RAMP_DEG_DEFAULT));
export const RAMP_RUN = +(DESK_TOP / Math.tan((RAMP_DEG * Math.PI) / 180)).toFixed(3); // horizontal run
export const FLAT_APPROACH = 1.25; // flat carpet between the west wall and the foot fillet
export const FOOT_FILLET = 0.12; // half-angle entry plate ahead of the foot (part of the ramp, tag "ramp")
export const CREST_FILLET = 0.1; // half-angle bridge plate under the crest, each side of x=X0
const WALL_T = 0.2;
// benches shifted east so the west ramp gets its full approach; everything else keys off BENCH_X
export const BENCH_X = +(-W / 2 + WALL_T / 2 + FLAT_APPROACH + FOOT_FILLET + RAMP_RUN + RUN_LEN / 2).toFixed(3);
export const DIV_H = 0.37; // divider top y = 1.12
const DIV_T = 0.05;

// ---------- palette (prd.md §4, pushed toward Smash Karts: vivid blue, coral, orange, lime, yellow on off-white + deep navy) ----------
// Colours are shared on purpose: instancing is per (color, tag), and the emissive map in lighting.js is
// keyed by colour, so anything that must NOT glow may not reuse PALETTE.screen or PALETTE.fixture.
export const PALETTE = {
  carpet: "#343c52", // deep navy-grey (was mid grey): the floor reads as carpet, the car pops against it
  carpetAlt: "#3a4359", // every other 500 mm tile row, slightly lighter
  carpetSeam: "#283046", // tile seams
  carpetAccent: "#93cc3c", // lime accent runs (was yellow-olive)
  desktop: "#f7f5f0", // white laminate
  deskFrame: "#d3d7dc",
  dividerTop: "#2f6fe4", // vivid blue
  dividerLow: "#1f2a48", // deep navy base band (was maroon)
  dividerFrame: "#e6e4de",
  heroWall: "#ff8a3d", // orange
  wall: "#f5f4f0",
  ceiling: "#f4f4f2",
  pillar: "#7a4e2d",
  cabinGlass: "#5f9ad6", // sky-blue glass, lighter than the dividers so the far wall does not become one blue slab
  chair: "#232b47", // deep navy, shared by cpu towers, monitor bezels, sign band
  chairBase: "#c3c8ce",
  cpu: "#232b47",
  monitor: "#232b47",
  screen: "#2c66dd", // emissive in lighting.js; unique colour so nothing else glows
  ramp: "#f26a55", // coral: the fun part of the route is visible from spawn
  fixture: "#fbfbf6", // ceiling light troffers (emissive in lighting.js)
  // enrichment accents (desk items, plants, bins, chairs)
  coral: "#f26a55",
  yellow: "#f7c948",
  leaf: "#5fbe47",
  pot: "#e0d6c4",
  aqua: "#7fd1e8",
};

// ---------- the route ----------
// Spawn on carpet at the west end, in the aisle between the z=-1.6 and z=1.6 benches, facing +X.
export const SPAWN = {
  pos: [-7.0, 0.07, 0], // body origin; ~3 cm above resting height, clear of furniture
  heading: Math.PI / 2, // radians about +Y; local +Z faces world +X
};

// Driven desktop lane: bench z=-1.6, north side (lane center z=-1.9). Ramp climbs onto its west end.
export const RAMP_LANE_Z = BENCH_Z[1] - 0.3; // -1.9
export const DRIVEN_BENCH = 1; // index into BENCH_Z
export const GAP_PITCH = 3; // divider segment left open for the cross-lane turn

const R = [];
const add = (pos, size, color, tag, rot) => {
  const e = { pos, size, color, tag };
  if (rot) e.rot = rot;
  R.push(e);
  return e;
};

// deterministic pseudo-random for "some people are away" chair gaps
const hash = (a, b, c) => {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

// ---------- shell ----------
add([0, -0.05, 0], [W, 0.1, D], PALETTE.carpet, "carpet");
// 500 mm carpet tile grid as flat cuboids (A renders flat colors, so the grid must be geometry):
// every other tile ROW is a lighter strip, and thin seam lines cross them along X. Overlapping carpet
// pieces are LAYERED (rows 1 mm, seams 2 mm, accents 3 mm above the slab) so coplanar faces never
// z-fight; a 3 mm step is nothing to a 14 mm wheel on a raycast suspension, and the spawn/props
// checks measure from the real local top.
const TILE = 0.5;
const carpetPiece = (x, z, sx, sz, color, top) => add([x, top - 0.0505, z], [sx, 0.101, sz], color, "carpet");
for (let r = 0; r < D / TILE; r += 2) carpetPiece(0, -D / 2 + TILE / 2 + r * TILE, W, TILE, PALETTE.carpetAlt, 0.001); // 13 rows
for (let c = 1; c < W / TILE; c++) carpetPiece(-W / 2 + c * TILE, 0, 0.02, D, PALETTE.carpetSeam, 0.002); // 31 seams
// yellow-olive accent tiles: a run down the spawn aisle, cross runs on the outer aisles, an end run
// along the cabins, and one 1 m square under the finale cup cluster so the target reads from spawn.
export const ACCENT_TOP = 0.003;
for (const z of [-3.2, 0, 3.2]) carpetPiece(0, z, W, TILE, PALETTE.carpetAccent, ACCENT_TOP);
carpetPiece(7.25, 0, TILE, D, PALETTE.carpetAccent, ACCENT_TOP);
export const CUP_SQUARE = [-6.1, 1.5]; // center of the 1 m accent square (props.js puts the cups on it)
carpetPiece(CUP_SQUARE[0], CUP_SQUARE[1], 1.0, 1.0, PALETTE.carpetAccent, ACCENT_TOP);

add([0, CEIL / 2, -D / 2], [W, CEIL, WALL_T], PALETTE.heroWall, "wall"); // orange hero wall (north)
add([0, CEIL / 2, D / 2], [W, CEIL, WALL_T], PALETTE.wall, "wall");
add([-W / 2, CEIL / 2, 0], [WALL_T, CEIL, D], PALETTE.wall, "wall");
add([W / 2, CEIL / 2, 0], [WALL_T, CEIL, D], PALETTE.wall, "wall");
add([0, CEIL + 0.05, 0], [W, 0.1, D], PALETTE.ceiling, "ceiling");
// soffit band along the hero wall (2.60 m) for depth
add([0, 2.75, -D / 2 + 0.6], [W, 0.3, 1.2], PALETTE.ceiling, "ceiling");

// ---------- wall cues (fixed cuboids, existing colours) so the big planes read as walls ----------
const NZ = -D / 2 + WALL_T / 2; // hero wall inner face z=-6.4
// hero wall: long dark sign band, a whiteboard and a wooden door with an aluminium frame
add([-0.5, 2.05, NZ + 0.02], [4.4, 0.55, 0.04], PALETTE.chair, "wall");
add([-4.6, 1.55, NZ + 0.02], [2.4, 1.2, 0.04], PALETTE.desktop, "wall");
add([-4.6, 1.55, NZ + 0.015], [2.5, 1.3, 0.03], PALETTE.dividerFrame, "wall");
add([4.6, 1.08, NZ + 0.03], [1.0, 2.16, 0.06], PALETTE.dividerFrame, "wall");
add([4.6, 1.05, NZ + 0.04], [0.9, 2.1, 0.08], PALETTE.pillar, "wall");
// south wall: three framed blue panels
const SZ = D / 2 - WALL_T / 2;
for (const x of [-4, 0, 4]) {
  add([x, 1.75, SZ - 0.015], [1.4, 1.0, 0.03], PALETTE.dividerFrame, "wall");
  add([x, 1.75, SZ - 0.02], [1.3, 0.9, 0.04], PALETTE.dividerTop, "wall");
}

// ---------- ceiling light fixtures: 0.6 m grid hint, one troffer per seat pitch over each aisle ----------
// 4 rows x 9 = 36 boxes, one colour, all above y=2.4. Skipped over the soffit band (z<-5.3).
const FIX_Y = CEIL - 0.015;
for (const z of [-3.2, 0, 3.2, 5.6]) {
  for (let s = -1; s < 8; s++) add([BENCH_X - RUN_LEN / 2 + 0.6 + s * PITCH, FIX_Y, z], [1.2, 0.03, 0.3], PALETTE.fixture, "ceiling");
}

// two dark wood pillars at the west end, outside the ramp approach and spawn line
for (const z of [-3.6, 3.6]) add([-6.2, CEIL / 2, z], [0.4, CEIL, 0.4], PALETTE.pillar, "pillar");

// ---------- benches ----------
const X0 = BENCH_X - RUN_LEN / 2; // west end of every bench run

for (let b = 0; b < BENCH_Z.length; b++) {
  const bz = BENCH_Z[b];
  const driven = b === DRIVEN_BENCH;

  for (const side of [-1, 1]) {
    const lz = bz + side * 0.3; // lane center
    add([BENCH_X, DESK_TOP - TOP_T / 2, lz], [RUN_LEN, TOP_T, LANE], PALETTE.desktop, "desktop");
    // desk frame rail under the outer edge
    add([BENCH_X, DESK_TOP - TOP_T - 0.03, bz + side * 0.55], [RUN_LEN - 0.3, 0.05, 0.04], PALETTE.deskFrame, "leg");
    // cable run: one thin dark tray just inside the rail, well above the under-desk crossing (y < 0.3)
    add([BENCH_X, DESK_TOP - TOP_T - 0.075, bz + side * 0.5], [RUN_LEN - 0.5, 0.025, 0.025], PALETTE.chair, "cable");

    for (let s = 0; s <= 8; s++) {
      const x = X0 + s * PITCH;
      // Slightly inset end supports to keep the ramp junction clear.
      const legX = Math.max(X0 + 0.15, Math.min(X0 + RUN_LEN - 0.15, x));
      add([legX, (DESK_TOP - TOP_T) / 2, lz], [0.05, DESK_TOP - TOP_T, 0.05], PALETTE.deskFrame, "leg");
      // a cable drop from the tray to the floor beside some legs; legs 3 and 4 flank the under-desk crossing
      // (leg 7 is where the last pitch's tower sits; the drop hugs the rail line, outside the bins at depth 0.31..0.53)
      if (HIGH && s !== GAP_PITCH && s !== GAP_PITCH + 1 && s !== 7 && hash(b + 83, side + 89, s + 97) < 0.35)
        add([legX + 0.06, 0.32, bz + side * 0.56], [0.02, 0.6, 0.02], PALETTE.chair, "cable");
    }

    for (let s = 0; s < 8; s++) {
      const cx = X0 + 0.6 + s * PITCH;
      const drivenLane = driven && side === -1;

      // monitors: never on the driven lane's first pitch (ramp landing) or on the gap pitch.
      if (HIGH && !(driven && s === GAP_PITCH) && !(drivenLane && s === 0)) {
        const mz = bz + side * 0.13;
        add([cx, DESK_TOP + 0.01, mz], [0.2, 0.02, 0.14], PALETTE.deskFrame, "monitor");
        add([cx, DESK_TOP + 0.06, mz], [0.04, 0.08, 0.04], PALETTE.deskFrame, "monitor");
        add([cx, DESK_TOP + 0.1 + 0.16, mz], [0.55, 0.32, 0.02], PALETTE.monitor, "monitor");
        add([cx, DESK_TOP + 0.1 + 0.16, mz + side * 0.011], [0.51, 0.28, 0.004], PALETTE.screen, "monitor");
      }

      // chairs: static, coarse cuboids, pushed in under the desktop with the back at the desk edge
      // (seat center 0.5 m off the bench centerline, back at 0.68 m) so the aisles read as corridors
      // instead of a forest of chair backs. Gap pitch stays chair-free so the under-desk crossing is open.
      const away = hash(b + 1, side + 2, s + 1) < (HIGH ? 0.25 : 0.7);
      if (s !== GAP_PITCH && !away) {
        const jitter = (hash(s + 7, b + 3, side + 5) - 0.5) * 0.08;
        const cz = bz + side * 0.5;
        const chx = cx + jitter;
        const seat = hash(b + 71, side + 73, s + 79) < 0.22 ? PALETTE.coral : PALETTE.chair; // a few coral chairs break up the navy
        add([chx, 0.015, cz], [0.56, 0.03, 0.56], PALETTE.chairBase, "chair");
        add([chx, 0.22, cz], [0.05, 0.38, 0.05], PALETTE.chairBase, "chair");
        add([chx, 0.425, cz], [0.45, 0.05, 0.45], seat, "chair");
        add([chx, 0.7, cz + side * 0.18], [0.45, 0.5, 0.04], seat, "chair");
      }

      // CPU towers on the floor beside some legs, never on the gap pitch
      const cpuHere = s !== GAP_PITCH && hash(b + 11, side + 13, s + 17) < 0.35;
      const cpuSide = s === 7 ? -1 : 1; // last pitch: the end leg is inset, so the tower goes west of the chair
      if (cpuHere) add([cx + cpuSide * 0.45, 0.2, bz + side * 0.38], [0.18, 0.4, 0.42], PALETTE.cpu, "cpu");

      // ---------- under-desk storage (visual only, fixed cuboids; never on the gap pitch) ----------
      // Occupied seat: a bin beside the chair on the side without a tower (pitch 0 has its end leg inset
      // at cx-0.45, pitch 7 at cx+0.45, so the free side flips there). Empty seat: a storage pedestal.
      if (s !== GAP_PITCH) {
        if (!away) {
          const binSide = s === 0 ? 1 : -1;
          const blocked = (cpuHere && cpuSide === binSide) || (s === 7 && binSide === 1);
          if (!blocked && hash(b + 31, side + 37, s + 41) < 0.55)
            add([cx + binSide * 0.44, 0.14, bz + side * 0.42], [0.22, 0.28, 0.22], hash(b + 43, side + 47, s + 53) < 0.5 ? PALETTE.chair : PALETTE.dividerTop, "storage");
        } else if (hash(b + 59, side + 61, s + 67) < 0.6) {
          add([cx + 0.05, 0.28, bz + side * 0.35], [0.4, 0.56, 0.5], PALETTE.desktop, "storage");
        }
      }

      // ---------- workstation clutter (visual only; every piece is a fixed cuboid resting on the desktop) ----------
      // Seeded per (bench, side, pitch) so neighbouring desks differ. Nothing goes on the driven lane
      // (check-room "driven desk lane" corridor) or on the driven bench's gap pitch (cross-lane turn), and
      // nothing on ?detail=low. Slots: keyboard + mouse at the front edge, one item left of the monitor,
      // a mug and one item right of it. Every slot is disjoint from the monitor foot (cx±0.1, depth 0.06..0.20).
      if (HIGH && !drivenLane && !(driven && s === GAP_PITCH)) {
        const r = (k) => hash(b * 8 + s + 1, side + 3, k); // k = slot id
        const dz = (o) => bz + side * o; // desk depth offset (0 = divider, 0.6 = outer edge) → world z
        const onDesk = (x, o, size, color) => add([x, DESK_TOP + size[1] / 2, dz(o)], size, color, "desk-item");
        const kx = cx + (r(1) - 0.5) * 0.08;
        onDesk(kx, 0.4, [0.44, 0.02, 0.15], r(2) < 0.7 ? PALETTE.chair : PALETTE.deskFrame); // keyboard
        onDesk(cx + (r(3) < 0.15 ? -0.31 : 0.31), 0.4, [0.06, 0.03, 0.1], PALETTE.chair); // mouse
        const left = r(4);
        if (left < 0.4) onDesk(cx - 0.36, 0.36, [0.16, 0.015, 0.22], [PALETTE.coral, PALETTE.yellow, PALETTE.dividerTop][Math.floor(r(5) * 3)]); // notebook
        else if (left < 0.6) onDesk(cx - 0.45, 0.22, [0.21, 0.025, 0.3], PALETTE.desktop); // paper stack
        else if (left < 0.85) onDesk(cx - 0.45, 0.16, [0.17, 0.045, 0.15], PALETTE.chair); // desk phone
        if (r(6) < 0.6) onDesk(cx + 0.45, 0.28, [0.075, 0.09, 0.075], [PALETTE.coral, PALETTE.yellow, PALETTE.desktop, PALETTE.dividerTop][Math.floor(r(7) * 4)]); // mug
        const right = r(8);
        if (right < 0.45) onDesk(cx + 0.4, 0.14, [0.07, 0.1, 0.07], PALETTE.chair); // pen cup
        else if (right < 0.7) {
          add([cx + 0.5, DESK_TOP + 0.045, dz(0.14)], [0.09, 0.09, 0.09], PALETTE.pot, "plant"); // small plant: pot + foliage
          add([cx + 0.5, DESK_TOP + 0.09 + 0.055, dz(0.14)], [0.15, 0.13, 0.15], PALETTE.leaf, "plant");
        }
      }
    }
  }

  // dividers along the bench centerline; one open segment per bench for the cross-lane turn
  for (let s = 0; s < 8; s++) {
    if (s === GAP_PITCH) continue;
    const cx = X0 + 0.6 + s * PITCH;
    if (HIGH) {
      add([cx, DESK_TOP + 0.06, bz], [1.14, 0.12, DIV_T], PALETTE.dividerLow, "divider");
      add([cx, DESK_TOP + 0.12 + 0.125, bz], [1.14, 0.25, DIV_T], PALETTE.dividerTop, "divider");
      add([cx, DESK_TOP + DIV_H + 0.01, bz], [1.16, 0.02, DIV_T + 0.02], PALETTE.dividerFrame, "divider");
    } else {
      add([cx, DESK_TOP + DIV_H / 2, bz], [1.14, DIV_H, DIV_T], PALETTE.dividerTop, "divider");
    }
  }
}

// ---------- turn marker: a 2 mm accent mat across both lanes at the divider gap on the driven bench ----------
add([X0 + 0.6 + GAP_PITCH * PITCH, DESK_TOP + 0.001, BENCH_Z[DRIVEN_BENCH]], [0.5, 0.002, 1.16], PALETTE.carpetAccent, "desktop");

// ---------- cabins along the east wall (five opaque grey-blue glass fronts) ----------
const CABIN_X = 6.4;
const SOFFIT = 2.6;
for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) {
  add([CABIN_X, SOFFIT / 2, z], [0.06, SOFFIT, 2.2], PALETTE.cabinGlass, "cabin");
}
for (const z of [-3.9, -1.3, 1.3, 3.9]) {
  add([(CABIN_X + W / 2) / 2, SOFFIT / 2, z], [W / 2 - CABIN_X, SOFFIT, 0.06], PALETTE.wall, "cabin");
}
// cabin header band, low sill and one white door per cabin so the glass fronts read as rooms
add([CABIN_X, SOFFIT + (CEIL - SOFFIT) / 2, 0], [0.06, CEIL - SOFFIT, D], PALETTE.wall, "cabin");
add([CABIN_X - 0.005, 0.15, 0], [0.07, 0.3, D], PALETTE.wall, "cabin");
for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) add([CABIN_X - 0.01, 0.3 + 1.05, z + 0.55], [0.08, 2.1, 0.9], PALETTE.wall, "cabin");

// ---------- floor clutter: plants by the pillars, cabins and hero wall; recycling bins; a printer; a water cooler; a clock ----------
// All outside every check-room corridor (spawn aisle, shoulders, ramp approach, west turning zone, under-desk
// crossings) and outside the race loop's east-end turn (x 5.5..6.36 between z -3.2 and 0).
const floorPlant = (x, z, k = 1) => {
  add([x, 0.16 * k, z], [0.3 * k, 0.32 * k, 0.3 * k], PALETTE.pot, "plant");
  add([x, (0.32 + 0.275) * k, z], [0.5 * k, 0.55 * k, 0.5 * k], PALETTE.leaf, "plant");
  add([x + 0.05 * k, (0.32 + 0.55 + 0.17) * k, z - 0.04 * k], [0.3 * k, 0.34 * k, 0.3 * k], PALETTE.leaf, "plant");
};
floorPlant(-6.75, -3.7); // west of the north pillar (clear of the race's west-end turn, z > -3.3)
floorPlant(-6.75, 3.6); // west of the south pillar
floorPlant(6.05, 3.9, 0.9); // in front of the cabins, in the z bands no bench reaches (?ramp=15 moves the bench end to 5.87)
floorPlant(6.05, 5.9, 0.9);
floorPlant(-2.6, -6.1, 0.8); // along the hero wall
// recycling bins on the north face of the north pillar
add([-6.35, 0.275, -4.05], [0.3, 0.55, 0.3], PALETTE.dividerTop, "storage");
add([-6.05, 0.275, -4.05], [0.3, 0.55, 0.3], PALETTE.chair, "storage");
// printer on a low cabinet south of the south pillar
add([-6.2, 0.35, 4.35], [0.6, 0.7, 0.6], PALETTE.desktop, "storage");
add([-6.2, 0.7 + 0.16, 4.35], [0.5, 0.32, 0.45], PALETTE.chair, "storage");
add([-6.2, 0.7 + 0.32 + 0.02, 4.3], [0.36, 0.04, 0.3], PALETTE.deskFrame, "storage");
// water cooler beside the hero-wall door
add([3.6, 0.475, -6.2], [0.32, 0.95, 0.32], PALETTE.desktop, "storage");
add([3.6, 0.95 + 0.17, -6.2], [0.22, 0.34, 0.22], PALETTE.aqua, "storage");
add([3.6, 0.82, -6.2 + 0.18], [0.1, 0.06, 0.05], PALETTE.chair, "storage");
// wall clock on the hero wall between the sign band and the door
add([2.6, 2.2, NZ + 0.02], [0.36, 0.36, 0.03], PALETTE.chair, "wall");
add([2.6, 2.2, NZ + 0.03], [0.3, 0.3, 0.035], PALETTE.desktop, "wall");
add([2.6, 2.25, NZ + 0.05], [0.02, 0.12, 0.02], PALETTE.chair, "wall");
add([2.65, 2.2, NZ + 0.05], [0.1, 0.02, 0.02], PALETTE.chair, "wall");

// ---------- the ramp: floor → west edge of the driven desktop lane ----------
// Top-face endpoints. Length lies along local X; rotate around Z to climb toward world +X.
// Any thin plate is placed by its top-face endpoints: subtract half-thickness along the rotated
// top normal (-sinθ, cosθ, 0). Shared by room.fallback.js (same math, copied verbatim).
const plate = (a, b, width, thickness, color, tag) => {
  const ddx = b[0] - a[0];
  const ddy = b[1] - a[1];
  const th = Math.atan2(ddy, ddx);
  const len = Math.hypot(ddx, ddy);
  return add(
    [(a[0] + b[0]) / 2 + (Math.sin(th) * thickness) / 2, (a[1] + b[1]) / 2 - (Math.cos(th) * thickness) / 2, a[2]],
    [len, thickness, width],
    color,
    tag,
    [0, 0, th]
  );
};
const RAMP_W = 0.4;
const p1 = [X0, DESK_TOP, RAMP_LANE_Z];
const p0 = [+(X0 - RAMP_RUN).toFixed(3), 0, RAMP_LANE_Z];
const theta = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); // = RAMP_DEG within float noise
const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
const thickness = 0.01;
plate(p0, p1, RAMP_W, thickness, PALETTE.ramp, "ramp");

// Foot fillet: a half-angle entry plate. Its top face starts ON the carpet FOOT_FILLET metres before the
// foot and meets the ramp surface where (x-p0x)·tanθ = (x-p0x+a)·tan(θ/2); the wheels see 0° → 8.5° → 17°
// instead of a hard 17° kink. It lies above the carpet and below the ramp face, so no lip anywhere.
{
  const t1 = Math.tan(theta);
  const t2 = Math.tan(theta / 2);
  const meetDx = (FOOT_FILLET * t2) / (t1 - t2);
  const a = [p0[0] - FOOT_FILLET, 0, RAMP_LANE_Z];
  const b = [p0[0] + meetDx, meetDx * t1, RAMP_LANE_Z];
  plate(a, b, RAMP_W, thickness, PALETTE.ramp, "ramp");
}
// Crest fillet: a chord from the ramp face CREST_FILLET before the crest to the desktop CREST_FILLET after
// it. The crest is a concave corner so this chord lies strictly BELOW both surfaces (never a lip) and
// simply bridges the sub-millimetre sliver where the ramp's top corner meets the desktop's west face.
{
  const a = [X0 - CREST_FILLET, DESK_TOP - CREST_FILLET * Math.tan(theta), RAMP_LANE_Z];
  const b = [X0 + CREST_FILLET, DESK_TOP, RAMP_LANE_Z];
  plate(a, b, RAMP_W, thickness, PALETTE.ramp, "ramp");
}

export const RAMP = { p0, p1, theta, length, width: RAMP_W, deg: RAMP_DEG, footFillet: FOOT_FILLET, crestFillet: CREST_FILLET };

// Named points for camera checks / optional collectibles. Not part of the loader contract.
export const ROUTE = {
  spawn: SPAWN.pos,
  rampFoot: p0,
  rampCrest: p1,
  laneMid: [BENCH_X, DESK_TOP, RAMP_LANE_Z],
  dividerGap: [X0 + 0.6 + GAP_PITCH * PITCH, DESK_TOP, BENCH_Z[DRIVEN_BENCH]],
  cups: [CUP_SQUARE[0], 0, CUP_SQUARE[1]],
};

// ---------- race data (A consumes this; room.fallback.js exports the same shape) ----------
// Loop choice: a pure FLOOR loop around the driven bench, counter-clockwise on a north-up minimap: east along
// the spawn aisle (z=0), north past the bench end at the cabins, west along the z=-3.2 aisle, south along the
// west wall. The ramp is deliberately NOT part of the race loop: a 0.4 m ramp driven in both directions plus a
// U-turn on a 0.6 m desk lane is fine for one player and a pile-up for four cars. The desk stays free-drive.
// Checkpoint pos.y is the SURFACE height (carpet 0); grid pos is the body origin like SPAWN. check-room.mjs
// verifies every checkpoint rests on carpet (or the driven desktop), has clear air above it, consecutive
// checkpoints are >= 1 m apart, and grid slots are clear of furniture and >= 0.25 m from each other.
const BENCH_EAST = +(BENCH_X + RUN_LEN / 2).toFixed(3);
const EAST_TURN_X = +((BENCH_EAST + CABIN_X - 0.04) / 2).toFixed(3); // midway between the bench end and the cabin sill
const cp = (x, z, radius) => ({ pos: [x, 0, z], radius });
const rect = (x0, z0, x1, z1) => [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]];
export const RACE = {
  laps: 3,
  // 2x2 grid in the spawn aisle, about 1.1 m behind the start line, facing east like SPAWN
  grid: [
    { pos: [-6.7, 0.07, -0.16], heading: Math.PI / 2 },
    { pos: [-6.7, 0.07, 0.16], heading: Math.PI / 2 },
    { pos: [-7.05, 0.07, -0.16], heading: Math.PI / 2 },
    { pos: [-7.05, 0.07, 0.16], heading: Math.PI / 2 },
  ],
  checkpoints: [
    cp(-5.6, 0, 0.6), // start/finish
    cp(-2.5, 0, 0.6),
    cp(1.0, 0, 0.6),
    cp(4.4, 0, 0.55),
    cp(EAST_TURN_X, BENCH_Z[DRIVEN_BENCH], 0.35), // east-end turn between the bench end and the cabins
    cp(4.4, -3.2, 0.55),
    cp(1.0, -3.2, 0.6),
    cp(-2.5, -3.2, 0.6),
    cp(-5.8, -3.0, 0.4), // short of the north pillar (x -6.4..-6.0, z -3.8..-3.4)
    cp(-7.3, -2.2, 0.35), // west-end turn, on the wall side of the ramp approach
    cp(-7.3, -0.5, 0.4), // straight down the west wall, 0.65 m west of the ramp's foot fillet
  ],
  // coarse outline for a compact minimap: room, cabin front, the four bench runs, the two pillars
  minimap: {
    bounds: [-W / 2, -D / 2, W / 2, D / 2],
    walls: [
      ...rect(-W / 2, -D / 2, W / 2, D / 2),
      [CABIN_X, -D / 2, CABIN_X, D / 2],
      ...BENCH_Z.flatMap((bz) => rect(X0, bz - 0.6, BENCH_EAST, bz + 0.6)),
      ...rect(-6.4, -3.8, -6.0, -3.4),
      ...rect(-6.4, 3.4, -6.0, 3.8),
    ],
  },
};

export const ROOM = R;
