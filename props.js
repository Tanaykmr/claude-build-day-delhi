// props.js — Snap the Room v3, owner B (Chirag).
// One dynamic body + cuboid per entry, same transform convention as room.js.
// { pos, size, mass, color, tag }  — mass is explicit gameplay mass in kg (0.01–0.05).
// Allowed tags: cup, bottle, files, bin. Tags are visual grouping only.
//
// Placement rules (prd.md §8): rest on a surface, no overlaps, ramp and approach stay clear.
// Bottoms sit 3 mm above the surface so nothing spawns interpenetrating.
// Carpet top y=0 (tile rows 0.001, seams 0.002, accent tiles 0.003), desktop top y=0.75.

const CUP = [0.035, 0.06, 0.035];
const BOTTLE = [0.035, 0.12, 0.035];
const FILES = [0.09, 0.03, 0.12];
const BIN = [0.08, 0.1, 0.08];

const on = (surfaceY, size) => surfaceY + 0.003 + size[1] / 2;

const P = [];
const add = (x, z, surfaceY, size, mass, color, tag) =>
  P.push({ pos: [x, on(surfaceY, size), z], size, mass, color, tag });

// --- finale cluster on the carpet, north-west of spawn (spawn is (-7, 0) facing +X) ---
// Sits on the 1 m yellow-olive accent square centred at room.js CUP_SQUARE (-6.1, 1.5), top y=0.003,
// off the spawn line and off the ramp approach (z = -1.9), reachable in one arc after descending.
// Cups are all white so they pop against the olive square; the bottle/files/bin add colour at the edge.
const SQ = 0.003; // accent square top (room.js ACCENT_TOP)
add(-6.32, 1.28, SQ, CUP, 0.02, "#ffffff", "cup");
add(-6.1, 1.3, SQ, CUP, 0.02, "#ffffff", "cup");
add(-5.88, 1.32, SQ, CUP, 0.02, "#ffffff", "cup");
add(-6.21, 1.5, SQ, CUP, 0.02, "#ffffff", "cup");
add(-5.99, 1.52, SQ, CUP, 0.02, "#ffffff", "cup");
add(-6.1, 1.72, SQ, BOTTLE, 0.03, "#8ec6e6", "bottle");
add(-6.42, 1.8, SQ, FILES, 0.04, "#e5c36a", "files");
add(-5.75, 1.82, SQ, BIN, 0.04, "#3a3d42", "bin");

// --- on the driven desktop lane (z = -1.9, bench z=-1.6 north side): knock them off the edge ---
// Lane spans z -2.2..-1.6; monitors occupy z > -1.80; the ramp lands at x=-4.08 and the first 0.5 m of
// desk east of the crest (x < -3.58) stays empty (check-room.mjs "landing zone"). Cups sit at the outer edge.
add(-2.4, -2.1, 0.75, CUP, 0.02, "#ffffff", "cup");
add(-0.9, -2.12, 0.75, CUP, 0.02, "#f3e2c7", "cup");
add(1.3, -2.1, 0.75, CUP, 0.02, "#ffffff", "cup");
add(3.0, -2.08, 0.75, FILES, 0.04, "#c9d8f0", "files");

export const PROPS = P;
