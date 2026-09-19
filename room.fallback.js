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
const BZ = -1.6,
  DIV_H = 0.37;
// exported like room.js so check-room.mjs runs the same corridor / race checks on this room
export const BENCH_Z = [BZ];
export const DRIVEN_BENCH = 0;
export const GAP_PITCH = 3;
export const RAMP_LANE_Z = BZ - 0.3;
// Ramp parameters mirrored from room.js (same math): 17°, 1.25 m flat approach, 0.12 m foot fillet.
const RAMP_DEG = 17;
const RAMP_RUN = +(DESK_TOP / Math.tan((RAMP_DEG * Math.PI) / 180)).toFixed(3); // 2.453
const FLAT_APPROACH = 1.25,
  FOOT_FILLET = 0.12,
  CREST_FILLET = 0.1;
export const BENCH_X = +(-W / 2 + 0.1 + FLAT_APPROACH + FOOT_FILLET + RAMP_RUN + RUN_LEN / 2).toFixed(3); // 0.723
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
  const z = BZ + side * 0.3;
  add([BENCH_X, DESK_TOP - TOP_T / 2, z], [RUN_LEN, TOP_T, 0.6], "#f7f5f0", "desktop");
  for (let s = 0; s <= 8; s++) {
    const x = X0 + s * 1.2;
    const legX = Math.max(X0 + 0.15, Math.min(X0 + RUN_LEN - 0.15, x));
    add([legX, 0.355, z], [0.05, 0.71, 0.05], "#d3d7dc", "leg");
  }
}
for (let s = 0; s < 8; s++) {
  if (s === GAP_PITCH) continue; // one clear cross-lane passage
  add([X0 + 0.6 + s * 1.2, DESK_TOP + DIV_H / 2, BZ], [1.14, DIV_H, 0.05], "#2f6fe4", "divider");
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
const LZ = RAMP_LANE_Z;
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

// Racing line generator, copied verbatim from room.js (this file must not import room.js).
const LINE_STEP = 0.5;
const raceLine = (corners, start) => {
  const n = corners.length, dense = [];
  for (let i = 0; i < n; i++) {
    const [px, pz] = corners[(i + n - 1) % n], [cx, cz, r] = corners[i], [qx, qz] = corners[(i + 1) % n];
    let ax = cx - px, az = cz - pz, bx = qx - cx, bz = qz - cz;
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    ax /= la; az /= la; bx /= lb; bz /= lb;
    const turn = Math.atan2(ax * bz - az * bx, ax * bx + az * bz); // signed corner angle
    const t = r * Math.tan(Math.abs(turn) / 2); // corner → tangent point distance
    const sg = Math.sign(turn), ox = cx - ax * t - az * r * sg, oz = cz - az * t + ax * r * sg; // arc centre
    const phi0 = Math.atan2(cz - az * t - oz, cx - ax * t - ox);
    const k = Math.max(2, Math.ceil((r * Math.abs(turn)) / (LINE_STEP / 2)));
    for (let j = 0; j <= k; j++) { const phi = phi0 + (turn * j) / k; dense.push([ox + r * Math.cos(phi), oz + r * Math.sin(phi)]); }
  }
  // resample the closed dense polyline at an exactly uniform step (total length / N), then rotate so the
  // first point is the start line
  const seg = dense.map((a, i) => { const b = dense[(i + 1) % dense.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]); });
  const total = seg.reduce((a, b) => a + b, 0), count = Math.max(8, Math.round(total / LINE_STEP)), step = total / count;
  const pts = [];
  let carry = 0;
  for (let i = 0; i < dense.length && pts.length < count; i++) {
    const a = dense[i], b = dense[(i + 1) % dense.length], L = seg[i];
    let d = carry;
    while (d < L - 1e-9 && pts.length < count) { const u = d / L; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); d += step; }
    carry = d - L;
  }
  let first = 0, best = Infinity;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - start[0], p[1] - start[1]); if (d < best) { best = d; first = i; } });
  const loop = pts.slice(first).concat(pts.slice(0, first)), m = loop.length;
  const speed = loop.map((p, i) => {
    const prev = loop[(i + m - 1) % m], next = loop[(i + 1) % m];
    const h0 = Math.atan2(p[1] - prev[1], p[0] - prev[0]), h1 = Math.atan2(next[1] - p[1], next[0] - p[0]);
    const dh = Math.abs(Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0)));
    return Math.max(0.4, Math.min(1, 1 - dh * 0.7)); // 0.83 rad per step on a 0.6 m radius → 0.42
  });
  for (let pass = 0; pass < 2; pass++) { // brake before the turn, pull away gradually; two passes so the wrap settles
    for (let i = m - 1; i >= 0; i--) speed[i] = Math.min(speed[i], speed[(i + 1) % m] + 0.12);
    for (let i = 0; i < m; i++) speed[i] = Math.min(speed[i], speed[(i + m - 1) % m] + 0.2);
  }
  return loop.map((p, i) => ({ pos: [+p[0].toFixed(3), 0, +p[1].toFixed(3)], speed: +speed[i].toFixed(2) }));
};
const START_X = -5.6, NORTH_Z = -3.1, WEST_X = -7.3;

// Race dressing (carpet-tagged, within 3 mm of the surface): checkered start strip and direction chevrons, as in room.js
for (let i = 0; i < 3; i++) for (let j = 0; j < 16; j++)
  add([START_X - 0.1 + i * 0.1, 0.004 - 0.0505, -0.75 + j * 0.1], [0.1, 0.101, 0.1], (i + j) % 2 ? "#232b47" : "#f7f5f0", "carpet");
const chevron = (x, z, dir) => {
  for (const side of [-1, 1]) add([x - dir * 0.1, 0.004 - 0.0505, z + side * 0.1], [0.2 * Math.SQRT2, 0.101, 0.06], "#f7f5f0", "carpet", [0, Math.atan2(side, dir), 0]);
};
for (const x of [-4.4, -2.0, 0.4, 2.8]) chevron(x, 0, 1);
for (const x of [3.6, 1.2, -1.2, -3.6]) chevron(x, NORTH_Z, -1);

// Race data: same shape and the same floor loop around the bench as room.js (see the RACE comment there).
// No cabins here, so the east-end turn uses the same x as the live room (midway bench end → cabin sill).
const BENCH_EAST = +(BENCH_X + RUN_LEN / 2).toFixed(3);
const EAST_TURN_X = +((BENCH_EAST + 6.36) / 2).toFixed(3);
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
    cp(START_X, 0, 0.6),
    cp(-2.5, 0, 0.6),
    cp(1.0, 0, 0.6),
    cp(4.4, 0, 0.55),
    cp(EAST_TURN_X, BZ, 0.35),
    cp(4.4, -3.2, 0.55),
    cp(1.0, -3.2, 0.6),
    cp(-2.5, -3.2, 0.6),
    cp(-5.8, -3.0, 0.4),
    cp(WEST_X, -2.2, 0.35),
    cp(WEST_X, -0.5, 0.4),
  ],
  line: raceLine([[EAST_TURN_X, 0, 0.7], [EAST_TURN_X, NORTH_Z, 0.7], [WEST_X, NORTH_Z, 0.6], [WEST_X, 0, 0.6]], [START_X, 0]),
  minimap: {
    bounds: [-W / 2, -D / 2, W / 2, D / 2],
    walls: [...rect(-W / 2, -D / 2, W / 2, D / 2), ...rect(X0, BZ - 0.6, BENCH_EAST, BZ + 0.6)],
  },
};

export const ROOM = R;
