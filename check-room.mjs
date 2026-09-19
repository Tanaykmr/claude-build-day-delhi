// check-room.mjs — B's headless sanity check for room.js / props.js / room.fallback.js.
// Run: node check-room.mjs            (live room + props)
//      node check-room.mjs --fallback (fallback room only)
// Exits non-zero on hard failures. Pure geometry; no physics engine involved.

const fallback = process.argv.includes("--fallback");
const room = await import(fallback ? "./room.fallback.js" : "./room.js");
const { ROOM, SPAWN } = room;
const { PROPS } = fallback ? { PROPS: [] } : await import("./props.js");

const ROOM_TAGS = new Set(["carpet", "desktop", "divider", "leg", "ramp", "wall", "cabin", "pillar", "ceiling", "chair", "cpu", "monitor"]);
const PROP_TAGS = new Set(["cup", "bottle", "files", "bin"]);
const W = 16, D = 13, MARGIN = 0.25;

let fails = 0, warns = 0;
const fail = (m) => { fails++; console.log("FAIL  " + m); };
const warn = (m) => { warns++; console.log("warn  " + m); };
const ok = (m) => console.log("ok    " + m);
const fin = (a) => a.every((n) => Number.isFinite(n));

// ---------- per-entry validity ----------
const aabb = (e) => {
  const [x, y, z] = e.pos, [sx, sy, sz] = e.size;
  if (e.rot && e.rot.some((r) => r !== 0)) {
    // rotated: conservative bounding box (rotation about Z only is what the ramp uses)
    const [rx, ry, rz] = e.rot;
    const c = Math.abs(Math.cos(rz)), s = Math.abs(Math.sin(rz));
    const ex = (sx * c + sy * s) / 2, ey = (sx * s + sy * c) / 2;
    if (rx || ry) return { min: [x - Math.hypot(sx, sy, sz) / 2, y - Math.hypot(sx, sy, sz) / 2, z - Math.hypot(sx, sy, sz) / 2], max: [x + Math.hypot(sx, sy, sz) / 2, y + Math.hypot(sx, sy, sz) / 2, z + Math.hypot(sx, sy, sz) / 2], rotated: true };
    return { min: [x - ex, y - ey, z - sz / 2], max: [x + ex, y + ey, z + sz / 2], rotated: true };
  }
  return { min: [x - sx / 2, y - sy / 2, z - sz / 2], max: [x + sx / 2, y + sy / 2, z + sz / 2], rotated: false };
};
const overlaps = (a, b, eps = 1e-6) => a.min.every((_, i) => a.min[i] < b.max[i] - eps && a.max[i] > b.min[i] + eps);

ROOM.forEach((e, i) => {
  if (!Array.isArray(e.pos) || e.pos.length !== 3 || !fin(e.pos)) fail(`ROOM[${i}] bad pos`);
  if (!Array.isArray(e.size) || e.size.length !== 3 || !fin(e.size) || e.size.some((s) => s <= 0)) fail(`ROOM[${i}] bad size ${JSON.stringify(e.size)}`);
  if (e.rot !== undefined && (!Array.isArray(e.rot) || e.rot.length !== 3 || !fin(e.rot))) fail(`ROOM[${i}] bad rot`);
  if (typeof e.color !== "string" || !/^#[0-9a-f]{6}$/i.test(e.color)) fail(`ROOM[${i}] bad color ${e.color}`);
  if (!ROOM_TAGS.has(e.tag)) warn(`ROOM[${i}] unknown tag "${e.tag}"`);
  const bb = aabb(e);
  if (bb.min[0] < -W / 2 - MARGIN || bb.max[0] > W / 2 + MARGIN || bb.min[2] < -D / 2 - MARGIN || bb.max[2] > D / 2 + MARGIN || bb.min[1] < -0.2 || bb.max[1] > 3.2)
    fail(`ROOM[${i}] ${e.tag} outside room bounds`);
});
PROPS.forEach((p, i) => {
  if (!Array.isArray(p.pos) || !fin(p.pos)) fail(`PROPS[${i}] bad pos`);
  if (!Array.isArray(p.size) || !fin(p.size) || p.size.some((s) => s <= 0)) fail(`PROPS[${i}] bad size`);
  if (!(p.mass > 0.005 && p.mass <= 0.06)) warn(`PROPS[${i}] mass ${p.mass} kg outside 0.01–0.05 guidance`);
  if (!PROP_TAGS.has(p.tag)) fail(`PROPS[${i}] disallowed tag "${p.tag}"`);
});
ok(`${ROOM.length} room boxes, ${PROPS.length} props validated for shape/tag/bounds`);

// ---------- tag / draw-call budget ----------
const tags = {}, colors = new Set(), keys = new Set();
for (const e of ROOM) { tags[e.tag] = (tags[e.tag] || 0) + 1; colors.add(e.color); keys.add(e.color + "|" + e.tag); }
console.log("      tags:", Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(" "));
console.log(`      tris ≈ ${(ROOM.length + PROPS.length) * 12}  (budget 200k)   colors ${colors.size}   instanced draw calls ≈ ${keys.size + PROPS.length}  un-instanced ${ROOM.length + PROPS.length} (budget 150)`);
if (ROOM.length + PROPS.length > 150) warn("un-instanced draw calls exceed 150: A must instance static boxes by color (prd §8) or use ?detail=low");

// ---------- surface helpers ----------
const solids = ROOM.map((e) => ({ e, bb: aabb(e) }));
const topUnder = (x, z, belowY, footHalf = 0.0) => {
  // highest un-rotated top surface under a footprint, at or below belowY
  let best = -Infinity, hit = null;
  for (const { e, bb } of solids) {
    if (bb.rotated) continue;
    if (x + footHalf > bb.min[0] && x - footHalf < bb.max[0] && z + footHalf > bb.min[2] && z - footHalf < bb.max[2] && bb.max[1] <= belowY + 1e-6 && bb.max[1] > best) { best = bb.max[1]; hit = e; }
  }
  return { y: best, e: hit };
};

// ---------- spawn ----------
{
  const [sx, sy, sz] = SPAWN.pos;
  const carHalf = [0.07, 0.03, 0.07]; // generous: 0.12 body + wheels, any heading
  const carBB = { min: [sx - carHalf[0], sy - carHalf[1], sz - carHalf[2]], max: [sx + carHalf[0], sy + carHalf[1], sz + carHalf[2]] };
  const hits = solids.filter(({ bb }) => overlaps(carBB, bb));
  if (hits.length) fail(`spawn box intersects ${hits.map((h) => h.e.tag).join(",")}`);
  const floor = topUnder(sx, sz, sy, 0.07);
  if (floor.y === -Infinity) fail("spawn has no floor beneath");
  else if (sy - floor.y > 0.12 || sy - floor.y < 0.045) fail(`spawn body origin is ${(sy - floor.y).toFixed(3)} m above floor (want ~0.05–0.10)`);
  else ok(`spawn ${JSON.stringify(SPAWN.pos)} sits ${(sy - floor.y).toFixed(3)} m above ${floor.e.tag} top, heading ${(SPAWN.heading * 180 / Math.PI).toFixed(0)}°`);
  if (!Number.isFinite(SPAWN.heading)) fail("spawn heading not finite");
}

// ---------- ramp ----------
const ramps = ROOM.filter((e) => e.tag === "ramp");
if (ramps.length !== 1) fail(`expected exactly one ramp, found ${ramps.length}`);
for (const r of ramps) {
  const th = r.rot?.[2] || 0, L = r.size[0], t = r.size[1];
  const c = Math.cos(th), s = Math.sin(th);
  // top face center = center + normal*t/2 where normal = (-sinθ, cosθ)
  const cx = r.pos[0] - s * t / 2, cy = r.pos[1] + c * t / 2;
  const p0 = [cx - c * L / 2, cy - s * L / 2], p1 = [cx + c * L / 2, cy + s * L / 2];
  const deg = th * 180 / Math.PI;
  console.log(`      ramp top face: (${p0[0].toFixed(3)}, ${p0[1].toFixed(3)}) → (${p1[0].toFixed(3)}, ${p1[1].toFixed(3)})  θ=${deg.toFixed(1)}°  run ${(L * c).toFixed(2)} m  width ${r.size[2]} m  z=${r.pos[2]}`);
  if (Math.abs(p0[1]) > 0.002) fail(`ramp foot y=${p0[1].toFixed(4)}, want 0`);
  if (Math.abs(p1[1] - 0.75) > 0.002) fail(`ramp crest y=${p1[1].toFixed(4)}, want 0.75`);
  if (deg > 18.5 || deg < 12) warn(`ramp incline ${deg.toFixed(1)}° outside 12–18.5°`);
  // crest must meet a desktop edge: find desktop whose x-min ≈ p1.x and z-range contains ramp z range
  const desk = ROOM.find((e) => e.tag === "desktop" && Math.abs(e.pos[0] - e.size[0] / 2 - p1[0]) < 0.01 && r.pos[2] - r.size[2] / 2 >= e.pos[2] - e.size[2] / 2 - 1e-6 && r.pos[2] + r.size[2] / 2 <= e.pos[2] + e.size[2] / 2 + 1e-6);
  if (!desk) fail("ramp crest does not meet a desktop west edge inside its lane");
  else ok(`ramp crest meets desktop at x=${p1[0].toFixed(2)}, lane z ${(desk.pos[2] - desk.size[2] / 2).toFixed(2)}..${(desk.pos[2] + desk.size[2] / 2).toFixed(2)}`);
  // approach: nothing between the west wall and the ramp foot in the ramp's z strip, low
  const approach = { min: [-W / 2 + 0.1, 0.0005, r.pos[2] - r.size[2] / 2], max: [p0[0], 0.3, r.pos[2] + r.size[2] / 2] };
  const blockers = solids.filter(({ e, bb }) => e.tag !== "carpet" && e !== r && overlaps(approach, bb));
  if (blockers.length) fail(`ramp approach blocked by ${blockers.map((b) => b.e.tag).join(",")}`);
  else ok(`ramp approach clear: ${(p0[0] - (-W / 2 + 0.1)).toFixed(2)} m of floor before the foot`);
  // the ramp volume itself must not intersect anything except carpet & its target desktop
  const rbb = aabb(r);
  const inRamp = solids.filter(({ e, bb }) => e !== r && e.tag !== "carpet" && e !== desk && overlaps(rbb, bb));
  if (inRamp.length) fail(`ramp bounding box intersects ${inRamp.map((b) => b.e.tag + "@" + b.e.pos.map((n) => n.toFixed(2))).join(" ")}`);
  // headroom above the ramp: nothing within 0.3 m above the slope line inside the ramp's x/z span
  const above = solids.filter(({ e, bb }) => e !== r && e !== desk && e.tag !== "carpet" && e.tag !== "ceiling" && bb.min[0] < rbb.max[0] && bb.max[0] > rbb.min[0] && bb.min[2] < rbb.max[2] && bb.max[2] > rbb.min[2] && bb.min[1] < rbb.max[1] + 0.3 && bb.max[1] > rbb.min[1]);
  if (above.length) warn(`objects within 0.3 m above the ramp span: ${above.map((b) => b.e.tag).join(",")}`);
}

// ---------- route corridors (live room only) ----------
const corridor = (name, min, max, allow = new Set(["carpet"])) => {
  const bb = { min, max };
  const hits = solids.filter(({ e, bb: b }) => !allow.has(e.tag) && overlaps(bb, b));
  if (hits.length) fail(`${name} blocked by ${[...new Set(hits.map((h) => h.e.tag))].join(",")} (${hits.length})`);
  else ok(`${name} clear`);
};
if (!fallback && room.BENCH_Z) {
  const X0 = room.BENCH_X - 4.8;
  corridor("spawn aisle (z -0.7..0.7, west end → east end, y<0.3)", [-7.6, 0.0005, -0.7], [5.2, 0.3, 0.7]);
  corridor("driven desk lane (z -2.15..-1.85, y 0.75..0.95)", [X0, 0.7505, -2.15], [X0 + 9.6, 0.95, -1.85], new Set(["desktop"]));
  corridor("divider gap on desk (x gap pitch, z -2.15..-1.05)", [X0 + 0.6 + room.GAP_PITCH * 1.2 - 0.5, 0.7505, -2.15], [X0 + 0.6 + room.GAP_PITCH * 1.2 + 0.5, 0.95, -1.05], new Set(["desktop"]));
  corridor("under-desk crossing (gap pitch, z -2.6..-0.6, y<0.3)", [X0 + 0.6 + room.GAP_PITCH * 1.2 - 0.5, 0.0005, -2.6], [X0 + 0.6 + room.GAP_PITCH * 1.2 + 0.5, 0.3, -0.6]);
  corridor("west turning zone (x -7.7..-6.7, z -2.3..0.8, y<0.3)", [-7.7, 0.0005, -2.3], [-6.7, 0.3, 0.8]);
}

// ---------- props: resting, non-overlapping, off the ramp ----------
const propBBs = PROPS.map((p) => ({ p, bb: aabb(p) }));
propBBs.forEach(({ p, bb }, i) => {
  const hits = solids.filter(({ e, bb: b }) => overlaps(bb, b));
  if (hits.length) fail(`PROPS[${i}] ${p.tag} intersects ${hits.map((h) => h.e.tag).join(",")}`);
  const sup = topUnder(p.pos[0], p.pos[2], bb.min[1] + 1e-6, Math.min(p.size[0], p.size[2]) / 2);
  if (sup.y === -Infinity) fail(`PROPS[${i}] ${p.tag} has nothing beneath it`);
  else {
    const gap = bb.min[1] - sup.y;
    if (gap < 0.0005 || gap > 0.01) fail(`PROPS[${i}] ${p.tag} floats ${gap.toFixed(4)} m above ${sup.e.tag} (want 0.001–0.01)`);
    // full footprint must be supported (not hanging over an edge)
    const sbb = aabb(sup.e);
    if (bb.min[0] < sbb.min[0] || bb.max[0] > sbb.max[0] || bb.min[2] < sbb.min[2] || bb.max[2] > sbb.max[2]) warn(`PROPS[${i}] ${p.tag} overhangs the edge of ${sup.e.tag}`);
  }
  for (let j = i + 1; j < propBBs.length; j++) if (overlaps(bb, propBBs[j].bb)) fail(`PROPS[${i}] overlaps PROPS[${j}]`);
  for (const r of ramps) { const rbb = aabb(r); if (bb.min[0] < rbb.max[0] + 0.3 && bb.max[0] > rbb.min[0] - 0.9 && bb.min[2] < rbb.max[2] + 0.1 && bb.max[2] > rbb.min[2] - 0.1 && bb.min[1] < 0.75) fail(`PROPS[${i}] ${p.tag} is on/near the ramp or its approach`); }
  const ds = Math.hypot(p.pos[0] - SPAWN.pos[0], p.pos[2] - SPAWN.pos[2]);
  if (ds < 0.4) fail(`PROPS[${i}] ${p.tag} within 0.4 m of spawn`);
});
if (PROPS.length) ok(`${PROPS.length} props rest on surfaces, total mass ${PROPS.reduce((a, p) => a + p.mass, 0).toFixed(2)} kg`);
if (!fallback && (PROPS.length < 8 || PROPS.length > 12)) warn(`prop count ${PROPS.length} outside 8–12`);

// ---------- static overlaps that would look wrong (same-tag boxes interpenetrating) ----------
let interp = 0;
for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
  const a = solids[i], b = solids[j];
  if (a.bb.rotated || b.bb.rotated) continue;
  if (a.e.tag === "carpet" || b.e.tag === "carpet") continue;
  if (a.e.tag === b.e.tag) continue; // composite pieces (chair post in seat, screen in bezel) overlap by design
  if (["wall", "ceiling", "cabin", "pillar"].includes(a.e.tag) || ["wall", "ceiling", "cabin", "pillar"].includes(b.e.tag)) continue; // shell pieces butt/overlap by design
  if (overlaps(a.bb, b.bb, 1e-4)) { interp++; if (interp <= 8) warn(`interpenetration ${a.e.tag}@${a.e.pos.map((n) => n.toFixed(2))} × ${b.e.tag}@${b.e.pos.map((n) => n.toFixed(2))}`); }
}
if (interp > 8) warn(`… ${interp} interpenetrating furniture pairs total`);
else if (!interp) ok("no furniture interpenetration");

console.log(`\n${fails} failures, ${warns} warnings`);
process.exit(fails ? 1 : 0);
