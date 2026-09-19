// props.js — Snap the Room v3, owner B (Chirag).
// One dynamic body + cuboid per entry, same transform convention as room.js.
// { pos, size, mass, color, tag }  — mass is explicit gameplay mass in kg (0.01–0.05).
// Allowed tags: cup, bottle, files, bin. Tags are visual grouping only.
//
// Placement rules (prd.md §8): rest on a surface, no overlaps, ramp and approach stay clear.
// Bottoms sit 3 mm above the surface so nothing spawns interpenetrating.
// Carpet top y=0 (accent stripes y=0.001), desktop top y=0.75.

const CUP = [0.035, 0.06, 0.035];
const BOTTLE = [0.035, 0.12, 0.035];
const FILES = [0.09, 0.03, 0.12];
const BIN = [0.08, 0.1, 0.08];

const on = (surfaceY, size) => surfaceY + 0.003 + size[1] / 2;

const P = [];
const add = (x, z, surfaceY, size, mass, color, tag) =>
  P.push({ pos: [x, on(surfaceY, size), z], size, mass, color, tag });

// --- finale cluster on the carpet, north-west of spawn (spawn is (-7, 0) facing +X) ---
// Off the spawn line and off the ramp approach (z = -1.9), reachable in one arc after descending.
add(-6.3, 1.15, 0, CUP, 0.02, "#ffffff", "cup");
add(-6.1, 1.35, 0, CUP, 0.02, "#f3e2c7", "cup");
add(-6.35, 1.5, 0, CUP, 0.02, "#ffffff", "cup");
add(-5.95, 1.1, 0, CUP, 0.02, "#e8c0a0", "cup");
add(-6.15, 1.7, 0, CUP, 0.02, "#ffffff", "cup");
add(-5.75, 1.45, 0, BOTTLE, 0.03, "#8ec6e6", "bottle");
add(-6.6, 1.95, 0, FILES, 0.04, "#e5c36a", "files");
add(-5.6, 1.85, 0, BIN, 0.04, "#3a3d42", "bin");

// --- on the driven desktop lane (z = -1.9, bench z=-1.6 north side): knock them off the edge ---
// Lane spans z -2.2..-1.6; monitors occupy z > -1.80; ramp lands at x < -3.6. Cups sit at the outer edge.
add(-2.4, -2.1, 0.75, CUP, 0.02, "#ffffff", "cup");
add(-0.9, -2.12, 0.75, CUP, 0.02, "#f3e2c7", "cup");
add(1.3, -2.1, 0.75, CUP, 0.02, "#ffffff", "cup");
add(3.0, -2.08, 0.75, FILES, 0.04, "#c9d8f0", "files");

export const PROPS = P;
