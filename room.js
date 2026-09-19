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

const DETAIL =
  typeof location !== "undefined"
    ? new URLSearchParams(location.search).get("detail") || "high"
    : "high";
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
export const BENCH_X = 0.6; // benches shifted east so the west ramp gets a 1.25 m approach
export const BENCH_Z = [-4.8, -1.6, 1.6, 4.8];
export const DIV_H = 0.37; // divider top y = 1.12
const DIV_T = 0.05;
const WALL_T = 0.2;

// ---------- palette (prd.md §4) ----------
export const PALETTE = {
  carpet: "#4a4d52",
  carpetAccent: "#8a8f5a",
  desktop: "#f2f0ec",
  deskFrame: "#c8c8c4",
  dividerTop: "#2b3a5c",
  dividerLow: "#5a2430",
  dividerFrame: "#d8d6d0",
  heroWall: "#f0a860",
  wall: "#f0f0ee",
  ceiling: "#f4f4f2",
  pillar: "#6b4a2f",
  cabinGlass: "#7d8b99",
  chair: "#1c1c1e",
  chairBase: "#b8bcc0",
  cpu: "#2a2a2c",
  monitor: "#1a1a1c",
  screen: "#2f3b52",
  ramp: "#b8b0a4",
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
// carpet accent runs: yellow-olive 500 mm tile stripes down the aisle centers and across the ends.
// Top sits 1 mm above the carpet to avoid z-fighting; negligible for a 14 mm wheel.
for (const z of [-3.2, 0, 3.2]) add([0, -0.0495, z], [W, 0.101, 0.5], PALETTE.carpetAccent, "carpet");
add([-7.25, -0.0495, 3.75], [0.5, 0.101, 5.5], PALETTE.carpetAccent, "carpet");
add([7.25, -0.0495, 0], [0.5, 0.101, D], PALETTE.carpetAccent, "carpet");

add([0, CEIL / 2, -D / 2], [W, CEIL, WALL_T], PALETTE.heroWall, "wall"); // orange hero wall (north)
add([0, CEIL / 2, D / 2], [W, CEIL, WALL_T], PALETTE.wall, "wall");
add([-W / 2, CEIL / 2, 0], [WALL_T, CEIL, D], PALETTE.wall, "wall");
add([W / 2, CEIL / 2, 0], [WALL_T, CEIL, D], PALETTE.wall, "wall");
add([0, CEIL + 0.05, 0], [W, 0.1, D], PALETTE.ceiling, "ceiling");
// soffit band along the hero wall (2.60 m) for depth
add([0, 2.75, -D / 2 + 0.6], [W, 0.3, 1.2], PALETTE.ceiling, "ceiling");

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

    for (let s = 0; s <= 8; s++) {
      const x = X0 + s * PITCH;
      // Slightly inset end supports to keep the ramp junction clear.
      const legX = Math.max(X0 + 0.15, Math.min(X0 + RUN_LEN - 0.15, x));
      add([legX, (DESK_TOP - TOP_T) / 2, lz], [0.05, DESK_TOP - TOP_T, 0.05], PALETTE.deskFrame, "leg");
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

      // chairs: static, coarse cuboids, tucked toward the desk, back toward the aisle.
      // Gap pitch stays chair-free on every bench so the under-desk crossing is always open.
      const away = hash(b + 1, side + 2, s + 1) < (HIGH ? 0.2 : 0.7);
      if (s !== GAP_PITCH && !away) {
        const jitter = (hash(s + 7, b + 3, side + 5) - 0.5) * 0.08;
        const cz = bz + side * 0.55;
        const chx = cx + jitter;
        add([chx, 0.015, cz], [0.6, 0.03, 0.6], PALETTE.chairBase, "chair");
        add([chx, 0.22, cz], [0.05, 0.38, 0.05], PALETTE.chairBase, "chair");
        add([chx, 0.425, cz], [0.45, 0.05, 0.45], PALETTE.chair, "chair");
        add([chx, 0.7, cz + side * 0.2], [0.45, 0.5, 0.05], PALETTE.chair, "chair");
      }

      // CPU towers on the floor beside some legs, never on the gap pitch
      if (s !== GAP_PITCH && hash(b + 11, side + 13, s + 17) < 0.35) {
        // last pitch: the end leg is inset, so put the tower on the west side of the chair
        const cpuX = s === 7 ? cx - 0.45 : cx + 0.45;
        add([cpuX, 0.2, bz + side * 0.38], [0.18, 0.4, 0.42], PALETTE.cpu, "cpu");
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

// ---------- cabins along the east wall (five opaque grey-blue glass fronts) ----------
const CABIN_X = 6.4;
const SOFFIT = 2.6;
for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) {
  add([CABIN_X, SOFFIT / 2, z], [0.06, SOFFIT, 2.2], PALETTE.cabinGlass, "cabin");
}
for (const z of [-3.9, -1.3, 1.3, 3.9]) {
  add([(CABIN_X + W / 2) / 2, SOFFIT / 2, z], [W / 2 - CABIN_X, SOFFIT, 0.06], PALETTE.wall, "cabin");
}
// cabin header band
add([CABIN_X, SOFFIT + (CEIL - SOFFIT) / 2, 0], [0.06, CEIL - SOFFIT, D], PALETTE.wall, "cabin");

// ---------- the ramp: floor → west edge of the driven desktop lane ----------
// Top-face endpoints. Length lies along local X; rotate around Z to climb toward world +X.
const p1 = [X0, DESK_TOP, RAMP_LANE_Z];
const p0 = [X0 - 2.45, 0, RAMP_LANE_Z];
const dx = p1[0] - p0[0];
const dy = p1[1] - p0[1];
const theta = Math.atan2(dy, dx); // ≈ 17°
const length = Math.hypot(dx, dy);
const thickness = 0.01;
// Subtract half-thickness along the rotated top normal (-sinθ, cosθ, 0).
add(
  [
    (p0[0] + p1[0]) / 2 + (Math.sin(theta) * thickness) / 2,
    (p0[1] + p1[1]) / 2 - (Math.cos(theta) * thickness) / 2,
    p0[2],
  ],
  [length, thickness, 0.4],
  PALETTE.ramp,
  "ramp",
  [0, 0, theta]
);

export const RAMP = { p0, p1, theta, length, width: 0.4 };

// Named points for camera checks / optional collectibles. Not part of the loader contract.
export const ROUTE = {
  spawn: SPAWN.pos,
  rampFoot: p0,
  rampCrest: p1,
  laneMid: [BENCH_X, DESK_TOP, RAMP_LANE_Z],
  dividerGap: [X0 + 0.6 + GAP_PITCH * PITCH, DESK_TOP, BENCH_Z[DRIVEN_BENCH]],
  cups: [-6.2, 0, 1.3],
};

export const ROOM = R;
