// check-maps.mjs — validateMap() is the only thing standing between a language model's JSON and the physics
// world, so it gets adversarial input rather than a happy path. Everything here is a shape a model can
// plausibly emit: a dropped floor, a coordinate with an extra zero, a spawn inside a cabinet, negative sizes.
//
// The budget matters as much as the output. This runs in the browser on the user's own tab: an unbounded
// loop is not a slow function, it is a frozen tab with no way out and a lost generation. The 50 ms ceiling
// caught exactly that — a stray box at 50 km turned the spawn search into a 100 km grid.
//
//   node check-maps.mjs
import assert from 'node:assert/strict';
import { validateMap } from './maps.js';

const box = (pos, size, tag = 'other') => ({ pos, size, rot: [0, 0, 0], color: '#ffffff', tag });
const floor = () => box([0, -0.05, 0], [8, 0.1, 6], 'carpet');
const BUDGET_MS = 50;

const rejects = {
  'null': null,
  'not an object': 'nope',
  'empty': {},
  'ROOM is a string': { ROOM: 'nope' },
  'too few boxes': { ROOM: [floor(), box([0, 1, 0], [1, 1, 1])] },
};
for (const [label, input] of Object.entries(rejects)) {
  assert.throws(() => validateMap(input, {}), undefined, `${label}: should have been rejected`);
}

const accepts = {
  'no floor': { ROOM: Array.from({ length: 6 }, (_, i) => box([i, 0.5, 0], [1, 1, 1])) },
  'no walls': { ROOM: [floor(), ...Array.from({ length: 4 }, (_, i) => box([i, 0.5, 0], [1, 1, 1]))] },
  'floor 5 m up': { ROOM: [box([0, 5, 0], [8, .1, 6], 'carpet'), ...Array.from({ length: 4 }, (_, i) => box([i, 6, 0], [1, 1, 1]))] },
  'negative and zero sizes': { ROOM: [floor(), box([0, 1, 0], [-5, -5, -5]), box([1, 1, 0], [0, 0, 0]), box([2, 1, 0], [1, 1, 1]), box([3, 1, 0], [1, 1, 1])] },
  'giant sizes': { ROOM: [floor(), box([0, 1, 0], [1e9, 1e9, 1e9]), ...Array.from({ length: 3 }, (_, i) => box([i, 1, 0], [1, 1, 1]))] },
  'NaN and Infinity mixed in': { ROOM: [floor(), box([NaN, 0, 0], [1, 1, 1]), box([Infinity, 0, 0], [1, 1, 1]), ...Array.from({ length: 4 }, (_, i) => box([i, 1, 0], [1, 1, 1]))] },
  'spawn buried in furniture': { SPAWN: { pos: [0, .07, 0], heading: 0 }, ROOM: [floor(), ...Array.from({ length: 20 }, (_, i) => box([-3 + i * .3, .5, 0], [.3, 1, 6], 'cabinet'))] },
  '2000 boxes': { ROOM: [floor(), ...Array.from({ length: 2000 }, (_, i) => box([(i % 40) * .2 - 4, .5, Math.floor(i / 40) * .12 - 3], [.1, 1, .1], 'cpu'))] },
  'hostile tag and colour types': { ROOM: [floor(), box([0, 1, 0], [1, 1, 1], '<script>'), { pos: [1, 1, 0], size: [1, 1, 1], color: 'javascript:x', tag: {} }, box([2, 1, 0], [1, 1, 1]), box([3, 1, 0], [1, 1, 1])] },
  'junk props': {
    ROOM: [floor(), ...Array.from({ length: 4 }, (_, i) => box([i, 1, 0], [1, 1, 1]))],
    PROPS: [{ pos: [0, 1, 0], size: [1e6, 1e6, 1e6], mass: 1e9, color: 'x', tag: 1 }, null, { pos: [NaN, 0, 0], size: [1, 1, 1] },
      ...Array.from({ length: 60 }, () => ({ pos: [0, 1, 0], size: [.05, .05, .05], mass: .02, color: '#fff', tag: 'cup' }))],
  },
  // The regression: no floor, one coordinate with an extra zero, and a spawn that forces the search to run.
  'stray box 50 km out, no floor, blocked spawn': {
    SPAWN: { pos: [0, .07, 0], heading: 0 },
    ROOM: [box([50000, .5, 50000], [1, 1, 1]), box([0, .5, 0], [2, 1, 2], 'cabinet'),
      box([1, .5, 0], [1, 1, 1]), box([2, .5, 0], [1, 1, 1]), box([3, .5, 0], [1, 1, 1])],
  },
};

for (const [label, input] of Object.entries(accepts)) {
  const t0 = Date.now();
  const { map } = validateMap(input, { name: 'T' });
  const ms = Date.now() - t0;
  const where = m => `${label}: ${m}`;
  assert.ok(ms < BUDGET_MS, where(`took ${ms} ms, over the ${BUDGET_MS} ms budget — an unbounded loop here freezes the tab`));
  assert.ok(map.ROOM.length >= 4, where('lost the room'));
  assert.ok(map.ROOM.length <= 704, where(`kept ${map.ROOM.length} boxes`));
  assert.ok(map.PROPS.length <= 24, where(`kept ${map.PROPS.length} props`));
  for (const e of map.ROOM) {
    assert.ok(e.pos.every(Number.isFinite), where('non-finite pos reached the world'));
    assert.ok(e.size.every(v => Number.isFinite(v) && v > 0), where('non-positive or non-finite size reached the world'));
    assert.ok(/^#[0-9a-f]{6}$/.test(e.color), where(`bad colour ${e.color}`));
    assert.equal(typeof e.tag, 'string', where('non-string tag'));
  }
  for (const p of map.PROPS) {
    assert.ok(p.pos.every(Number.isFinite) && p.size.every(v => v > 0), where('bad prop geometry'));
    assert.ok(p.mass > 0 && p.mass <= 0.5, where(`prop mass ${p.mass}`));
  }
  assert.ok(map.SPAWN.pos.every(Number.isFinite) && Number.isFinite(map.SPAWN.heading), where('bad spawn'));
  // The spawn must land on the floor slab, not in the void beside it.
  const slab = map.ROOM.reduce((a, b) => (a.size[0] * a.size[2] >= b.size[0] * b.size[2] ? a : b));
  const onSlab = Math.abs(map.SPAWN.pos[0] - slab.pos[0]) <= slab.size[0] / 2 && Math.abs(map.SPAWN.pos[2] - slab.pos[2]) <= slab.size[2] / 2;
  assert.ok(onSlab, where(`spawn ${map.SPAWN.pos.map(n => n.toFixed(1))} is off the floor slab`));
}

console.log(`maps ok — ${Object.keys(rejects).length} inputs rejected, ${Object.keys(accepts).length} repaired, all under ${BUDGET_MS} ms`);
