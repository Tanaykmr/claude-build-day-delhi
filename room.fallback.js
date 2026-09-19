// room.fallback.js — Snap the Room v3, owner B (Chirag).
// Tested simple room. Exports the SAME names as room.js. Selected with /?fallback=1 BEFORE imports.
// Frozen at the minute-30 milestone; do not edit afterwards. No props are loaded in fallback mode.

export const SPAWN = { pos: [-7.0, 0.07, 0], heading: Math.PI / 2 };

const W = 16,
  D = 13,
  CEIL = 2.9;
const DESK_TOP = 0.75,
  TOP_T = 0.04,
  RUN_LEN = 9.6;
const BENCH_X = 0.6,
  BENCH_Z = -1.6,
  DIV_H = 0.37;
const X0 = BENCH_X - RUN_LEN / 2;

const R = [];
const add = (pos, size, color, tag, rot) => {
  const e = { pos, size, color, tag };
  if (rot) e.rot = rot;
  R.push(e);
};

add([0, -0.05, 0], [W, 0.1, D], "#4a4d52", "carpet");
add([0, CEIL / 2, -D / 2], [W, CEIL, 0.2], "#f0a860", "wall");
add([0, CEIL / 2, D / 2], [W, CEIL, 0.2], "#f0f0ee", "wall");
add([-W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f0f0ee", "wall");
add([W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f0f0ee", "wall");

for (const side of [-1, 1]) {
  const z = BENCH_Z + side * 0.3;
  add([BENCH_X, DESK_TOP - TOP_T / 2, z], [RUN_LEN, TOP_T, 0.6], "#f2f0ec", "desktop");
  for (let s = 0; s <= 8; s++) {
    const x = X0 + s * 1.2;
    const legX = Math.max(X0 + 0.15, Math.min(X0 + RUN_LEN - 0.15, x));
    add([legX, 0.355, z], [0.05, 0.71, 0.05], "#c8c8c4", "leg");
  }
}
for (let s = 0; s < 8; s++) {
  if (s === 3) continue; // one clear cross-lane passage
  add([X0 + 0.6 + s * 1.2, DESK_TOP + DIV_H / 2, BENCH_Z], [1.14, DIV_H, 0.05], "#2b3a5c", "divider");
}

// Ramp: floor → west edge of the north desktop lane (z = -1.9). Same math as room.js.
const p0 = [X0 - 2.45, 0, BENCH_Z - 0.3];
const p1 = [X0, DESK_TOP, BENCH_Z - 0.3];
const dx = p1[0] - p0[0],
  dy = p1[1] - p0[1];
const theta = Math.atan2(dy, dx);
const length = Math.hypot(dx, dy);
const thickness = 0.01;
add(
  [
    (p0[0] + p1[0]) / 2 + (Math.sin(theta) * thickness) / 2,
    (p0[1] + p1[1]) / 2 - (Math.cos(theta) * thickness) / 2,
    p0[2],
  ],
  [length, thickness, 0.4],
  "#b8b0a4",
  "ramp",
  [0, 0, theta]
);

export const ROOM = R;
