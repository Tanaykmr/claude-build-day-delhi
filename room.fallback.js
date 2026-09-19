// room.fallback.js — Snap the Room v3, owner B (Chirag).
// Tested simple room. Exports the SAME names as room.js. Selected with /?fallback=1 BEFORE imports.
// Kept as a tested rehearsal room: only the ramp math is mirrored from room.js. No props are loaded in fallback mode.

export const SPAWN = { pos: [-7.0, 0.07, 0], heading: Math.PI / 2 };

const W = 16,
  D = 13,
  CEIL = 2.9;
const DESK_TOP = 0.75,
  TOP_T = 0.04,
  RUN_LEN = 9.6;
const BENCH_Z = -1.6,
  DIV_H = 0.37;
// Ramp parameters mirrored from room.js (same math): 17°, 1.25 m flat approach, 0.12 m foot fillet.
const RAMP_DEG = 17;
const RAMP_RUN = +(DESK_TOP / Math.tan((RAMP_DEG * Math.PI) / 180)).toFixed(3); // 2.453
const FLAT_APPROACH = 1.25,
  FOOT_FILLET = 0.12,
  CREST_FILLET = 0.1;
const BENCH_X = +(-W / 2 + 0.1 + FLAT_APPROACH + FOOT_FILLET + RAMP_RUN + RUN_LEN / 2).toFixed(3); // 0.723
const X0 = BENCH_X - RUN_LEN / 2;

const R = [];
const add = (pos, size, color, tag, rot) => {
  const e = { pos, size, color, tag };
  if (rot) e.rot = rot;
  R.push(e);
};

add([0, -0.05, 0], [W, 0.1, D], "#343c52", "carpet");
// 500 mm tile grid (alternate rows + seams, layered 1/2 mm) and the spawn-aisle accent run, as in room.js
for (let r = 0; r < D / 0.5; r += 2) add([0, -0.0495, -D / 2 + 0.25 + r * 0.5], [W, 0.101, 0.5], "#3a4359", "carpet");
for (let c = 1; c < W / 0.5; c++) add([-W / 2 + c * 0.5, -0.0485, 0], [0.02, 0.101, D], "#283046", "carpet");
add([0, -0.0475, 0], [W, 0.101, 0.5], "#93cc3c", "carpet");
add([0, CEIL / 2, -D / 2], [W, CEIL, 0.2], "#ff8a3d", "wall");
add([0, CEIL / 2, D / 2], [W, CEIL, 0.2], "#f5f4f0", "wall");
add([-W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f5f4f0", "wall");
add([W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f5f4f0", "wall");
add([0, CEIL + 0.05, 0], [W, 0.1, D], "#f4f4f2", "ceiling");
// hero-wall cues: dark sign band and a whiteboard
add([-0.5, 2.05, -D / 2 + 0.12], [4.4, 0.55, 0.04], "#232b47", "wall");
add([-4.6, 1.55, -D / 2 + 0.12], [2.4, 1.2, 0.04], "#f7f5f0", "wall");

for (const side of [-1, 1]) {
  const z = BENCH_Z + side * 0.3;
  add([BENCH_X, DESK_TOP - TOP_T / 2, z], [RUN_LEN, TOP_T, 0.6], "#f7f5f0", "desktop");
  for (let s = 0; s <= 8; s++) {
    const x = X0 + s * 1.2;
    const legX = Math.max(X0 + 0.15, Math.min(X0 + RUN_LEN - 0.15, x));
    add([legX, 0.355, z], [0.05, 0.71, 0.05], "#d3d7dc", "leg");
  }
}
for (let s = 0; s < 8; s++) {
  if (s === 3) continue; // one clear cross-lane passage
  add([X0 + 0.6 + s * 1.2, DESK_TOP + DIV_H / 2, BENCH_Z], [1.14, DIV_H, 0.05], "#2f6fe4", "divider");
}

// Ramp: floor → west edge of the north desktop lane (z = -1.9). Same math as room.js: every plate is
// placed by its top-face endpoints; subtract half-thickness along the rotated top normal (-sinθ, cosθ, 0).
const plate = (a, b, width, thickness, color, tag) => {
  const ddx = b[0] - a[0];
  const ddy = b[1] - a[1];
  const th = Math.atan2(ddy, ddx);
  const len = Math.hypot(ddx, ddy);
  add(
    [(a[0] + b[0]) / 2 + (Math.sin(th) * thickness) / 2, (a[1] + b[1]) / 2 - (Math.cos(th) * thickness) / 2, a[2]],
    [len, thickness, width],
    color,
    tag,
    [0, 0, th]
  );
};
const LZ = BENCH_Z - 0.3;
const p0 = [+(X0 - RAMP_RUN).toFixed(3), 0, LZ];
const p1 = [X0, DESK_TOP, LZ];
const theta = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
plate(p0, p1, 0.4, 0.01, "#f26a55", "ramp");
// foot fillet: half-angle entry plate, starts flush on the carpet, meets the ramp face (no lip)
{
  const t1 = Math.tan(theta),
    t2 = Math.tan(theta / 2);
  const meetDx = (FOOT_FILLET * t2) / (t1 - t2);
  plate([p0[0] - FOOT_FILLET, 0, LZ], [p0[0] + meetDx, meetDx * t1, LZ], 0.4, 0.01, "#f26a55", "ramp");
}
// crest fillet: chord under the concave crest corner, bridges the ramp/desk seam, never above 0.75
plate([X0 - CREST_FILLET, DESK_TOP - CREST_FILLET * Math.tan(theta), LZ], [X0 + CREST_FILLET, DESK_TOP, LZ], 0.4, 0.01, "#f26a55", "ramp");

// Race data: same shape and the same floor loop around the bench as room.js (see the RACE comment there).
// No cabins here, so the east-end turn uses the same x as the live room (midway bench end → cabin sill).
const BENCH_EAST = +(BENCH_X + RUN_LEN / 2).toFixed(3);
const cp = (x, z, radius) => ({ pos: [x, 0, z], radius });
const rect = (x0, z0, x1, z1) => [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]];
export const RACE = {
  laps: 3,
  grid: [
    { pos: [-6.7, 0.07, -0.16], heading: Math.PI / 2 },
    { pos: [-6.7, 0.07, 0.16], heading: Math.PI / 2 },
    { pos: [-7.05, 0.07, -0.16], heading: Math.PI / 2 },
    { pos: [-7.05, 0.07, 0.16], heading: Math.PI / 2 },
  ],
  checkpoints: [
    cp(-5.6, 0, 0.6),
    cp(-2.5, 0, 0.6),
    cp(1.0, 0, 0.6),
    cp(4.4, 0, 0.55),
    cp(+((BENCH_EAST + 6.36) / 2).toFixed(3), BENCH_Z, 0.35),
    cp(4.4, -3.2, 0.55),
    cp(1.0, -3.2, 0.6),
    cp(-2.5, -3.2, 0.6),
    cp(-5.8, -3.0, 0.4),
    cp(-7.3, -2.2, 0.35),
    cp(-7.3, -0.5, 0.4),
  ],
  minimap: {
    bounds: [-W / 2, -D / 2, W / 2, D / 2],
    walls: [...rect(-W / 2, -D / 2, W / 2, D / 2), ...rect(X0, BENCH_Z - 0.6, BENCH_EAST, BENCH_Z + 0.6)],
  },
};

export const ROOM = R;
