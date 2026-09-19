#!/usr/bin/env node
// check-drive.mjs — headless driving acceptance test (Track A).
// Loads ROOM/SPAWN exactly like index.html, builds the car from car.js (shared with the browser),
// and drives scripted scenarios. Prints PASS/FAIL per scenario; exits nonzero on any failure.
//   node check-drive.mjs            # live room.js, then room.fallback.js
//   node check-drive.mjs --live     # only room.js       --fallback  only room.fallback.js
//   node check-drive.mjs --verbose  # per-0.25 s telemetry
//   node check-drive.mjs --car '{"stiffness":300}'   # override CAR fields for tuning sweeps
//   node check-drive.mjs --live --ramp=15            # gentler ramp angle (room.js ?ramp= knob)
import RAPIER from '@dimforge/rapier3d-compat';

const argv = process.argv.slice(2);
const rampArg = argv.find(a => a.startsWith('--ramp='));
if (rampArg) globalThis.location = { search: `?ramp=${rampArg.slice(7)}` }; // room.js reads ?ramp= from location.search
const carArg = argv.indexOf('--car');
if (carArg >= 0) globalThis.CAR_OVERRIDE = JSON.parse(argv[carArg + 1]);
const {
  CAR, STEP, createWorld, createCar, roomColliderDesc, stepVehicle, resetCar, forwardSpeed,
  heading, upVector, wheelContacts, validBody, needsRecovery,
} = await import('./car.js');

const args = new Set(argv);
const verbose = args.has('--verbose');
const rooms = args.has('--live') ? ['./room.js'] : args.has('--fallback') ? ['./room.fallback.js'] : ['./room.js', './room.fallback.js'];
const f3 = n => (Math.round(n * 1000) / 1000).toFixed(3);
const results = [];

function buildWorld(ROOM) {
  const world = createWorld(RAPIER);
  const bounds = { min: { x: Infinity, z: Infinity }, max: { x: -Infinity, z: -Infinity } };
  for (const entry of ROOM) {
    world.createCollider(roomColliderDesc(RAPIER, entry));
    if (entry.tag !== 'carpet') continue;
    bounds.min.x = Math.min(bounds.min.x, entry.pos[0] - entry.size[0] / 2);
    bounds.max.x = Math.max(bounds.max.x, entry.pos[0] + entry.size[0] / 2);
    bounds.min.z = Math.min(bounds.min.z, entry.pos[2] - entry.size[2] / 2);
    bounds.max.z = Math.max(bounds.max.z, entry.pos[2] + entry.size[2] / 2);
  }
  return { world, bounds };
}

function snapshot(car) {
  const p = car.body.translation(), q = car.body.rotation(), v = car.body.linvel();
  return { x: p.x, y: p.y, z: p.z, speed: Math.hypot(v.x, v.z), vy: v.y, fwd: forwardSpeed(car),
    heading: heading(q), up: upVector(q).y, contacts: wheelContacts(car) };
}
const fmt = s => `t=${f3(s.t)} pos=(${f3(s.x)}, ${f3(s.y)}, ${f3(s.z)}) fwd=${f3(s.fwd)} vy=${f3(s.vy)} m/s up=${f3(s.up)} hdg=${f3(s.heading)} contacts=${s.contacts.join('')}`;

// Drive for `seconds` with input(snapshot, t) → {throttle, steer, brake}. Optional `until(snapshot)` stops
// early and returns true. `watch(snapshot)` may return a failure string on any step.
function drive(ctx, seconds, input, { until, watch } = {}) {
  const { world, car, bounds } = ctx;
  const steps = Math.round(seconds / STEP);
  let minUp = 1, reached = false, failure = null, last = null;
  for (let i = 0; i < steps; i++) {
    const s = snapshot(car); s.t = ctx.time;
    stepVehicle(car, input(s, ctx.time));
    world.step();
    ctx.time += STEP;
    if (!validBody(car.body)) { failure = 'physics became non-finite'; break; }
    if (needsRecovery(car, bounds)) { failure = `recovery would trigger at ${fmt({ ...snapshot(car), t: ctx.time })}`; break; }
    last = { ...snapshot(car), t: ctx.time };
    minUp = Math.min(minUp, last.up);
    if (verbose && i % 15 === 0) console.log('   ', fmt(last));
    if (watch) { failure = watch(last); if (failure) break; }
    if (until && until(last)) { reached = true; break; }
  }
  return { last: last ?? { ...snapshot(car), t: ctx.time }, minUp, reached, failure };
}

function report(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const IDLE = () => ({ throttle: 0, steer: 0, brake: false });
const FWD = () => ({ throttle: 1, steer: 0, brake: false });
const REV = () => ({ throttle: -1, steer: 0, brake: false });
const BRAKE = () => ({ throttle: 0, steer: 0, brake: true });

async function testRoom(path) {
  console.log(`\n=== ${path} ===`);
  const mod = await import(path);
  const { ROOM, SPAWN } = mod;
  const { world, bounds } = buildWorld(ROOM);
  const car = createCar(RAPIER, world, SPAWN);
  const ctx = { world, car, bounds, time: 0 };
  world.step(); // populate the query pipeline before the first suspension ray cast (as index.html does)
  const floorY = 0;
  const restY = (a, b) => a.y > floorY + CAR.wheelR - CAR.wheelY + .002 && a.y < b; // chassis clearly above wheels' contact

  // (a) settle
  let r = drive(ctx, 1.5, IDLE);
  const a0 = r.last;
  r = drive(ctx, .5, IDLE);
  const a = r.last;
  const drift = Math.hypot(a.x - a0.x, a.y - a0.y, a.z - a0.z); // linvel carries the per-step gravity kick; use position
  report('a. settle', !r.failure && a.contacts.every(Boolean) && drift < .002 && restY(a, .08) && a.up > .99,
    r.failure || `${fmt(a)} drift=${f3(drift)} m over 0.5 s`);
  const restHeight = a.y;

  // (b) flat forward 3 s
  const h0 = a.heading;
  r = drive(ctx, 3, FWD);
  const b = r.last;
  const dHeading = Math.atan2(Math.sin(b.heading - h0), Math.cos(b.heading - h0));
  report('b. flat forward', !r.failure && b.fwd >= .6 && r.minUp > .95 && Math.abs(dHeading) < .05 && Math.abs(b.z - a.z) < .1,
    r.failure || `${fmt(b)} Δheading=${f3(dHeading)} peak/final ${f3(b.fwd)} m/s`);

  // (d) brake from speed
  r = drive(ctx, 1.2, BRAKE, { until: s => s.speed < .02 });
  report('d. brake stops within ~1 s', !r.failure && r.reached && r.last.t - b.t <= 1.05, r.failure || `stopped after ${f3(r.last.t - b.t)} s at ${fmt(r.last)}`);

  // (c) steering: hold left from rest, heading must increase (left as seen from behind the car)
  const c0 = snapshot(car).heading;
  r = drive(ctx, 2, () => ({ throttle: 1, steer: 1, brake: false }));
  const c = r.last;
  const turn = Math.atan2(Math.sin(c.heading - c0), Math.cos(c.heading - c0));
  report('c. steer left → heading positive', !r.failure && turn > .4 && r.minUp > .9, r.failure || `Δheading=${f3(turn)} rad in 2 s, ${fmt(c)}`);
  drive(ctx, 1, BRAKE);

  // (e) reverse
  resetCar(car, SPAWN); drive(ctx, 1, IDLE);
  let minFwd = 0;
  r = drive(ctx, 1.2, REV, { watch: s => { minFwd = Math.min(minFwd, s.fwd); return null; } });
  const e = r.last;
  report('e. reverse', !r.failure && minFwd <= -.3 && e.x < SPAWN.pos[0] - .2 && r.minUp > .95, r.failure || `${fmt(e)} peak reverse ${f3(-minFwd)} m/s`);
  drive(ctx, 1, BRAKE);

  // (f) ramp ascent
  const ramp = ROOM.find(en => en.tag === 'ramp');
  if (!ramp) { report('f. ramp ascent', false, 'no ramp entry in ROOM'); return; }
  const footX = mod.RAMP?.p0?.[0] ?? (ramp.pos[0] - Math.cos(ramp.rot?.[2] ?? 0) * ramp.size[0] / 2);
  const crestX = mod.RAMP?.p1?.[0] ?? (ramp.pos[0] + Math.cos(ramp.rot?.[2] ?? 0) * ramp.size[0] / 2);
  const rampZ = ramp.pos[2];
  const deskTop = mod.RAMP?.p1?.[1] ?? .75;
  const rampSpawn = { pos: [footX - .75, SPAWN.pos[1], rampZ], heading: Math.PI / 2 };
  console.log(`    ramp foot x=${f3(footX)} crest x=${f3(crestX)} z=${f3(rampZ)} desk top y=${f3(deskTop)}; spawning at x=${f3(rampSpawn.pos[0])}`);
  resetCar(car, rampSpawn); drive(ctx, 1, IDLE);
  let lastProgress = { x: -Infinity, t: 0 }, maxY = 0;
  r = drive(ctx, 12, FWD, {
    until: s => s.x > crestX + .1 && s.y > deskTop + restHeight - .01 && s.contacts.every(Boolean),
    watch: s => {
      maxY = Math.max(maxY, s.y);
      if (s.x > lastProgress.x + .01) lastProgress = { x: s.x, t: s.t };
      if (s.up < .7) return `tipped: up.y=${f3(s.up)} at ${fmt(s)}`;
      if (s.t - lastProgress.t > 1.5) return `stuck (no +X progress for 1.5 s) at ${fmt(s)}`;
      if (Math.abs(s.z - rampZ) > .15) return `drifted off the ramp line at ${fmt(s)}`;
    },
  });
  const f = r.last;
  report('f. ramp ascent to desktop', !r.failure && r.reached, r.failure || `${fmt(f)} minUp=${f3(r.minUp)} (max y ${f3(maxY)})`);
  const climbed = !r.failure && r.reached;

  // (g) descent: roll on a little, brake, then reverse straight back down the ramp to the floor
  if (climbed) {
    drive(ctx, 3, FWD, { until: s => s.x > crestX + .45 });
    drive(ctx, 1, BRAKE);
    lastProgress = { x: Infinity, t: ctx.time };
    r = drive(ctx, 12, REV, {
      until: s => s.x < footX - .3 && s.y < restHeight + .02 && s.contacts.every(Boolean),
      watch: s => {
        if (s.x < lastProgress.x - .01) lastProgress = { x: s.x, t: s.t };
        if (s.up < .7) return `tipped: up.y=${f3(s.up)} at ${fmt(s)}`;
        if (s.t - lastProgress.t > 1.5) return `stuck at ${fmt(s)}`;
      },
    });
    report('g. descend ramp to floor (reverse)', !r.failure && r.reached, r.failure || `${fmt(r.last)} minUp=${f3(r.minUp)}`);
    drive(ctx, 1, BRAKE);

    // (h) turning circle at creep speed: must fit the 0.575 m usable desk lane for a U-turn
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    r = drive(ctx, 6, s => ({ throttle: s.fwd > .4 ? 0 : 1, steer: 1, brake: false }), {
      watch: s => { minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x); minZ = Math.min(minZ, s.z); maxZ = Math.max(maxZ, s.z); return s.up < .9 ? `tipped at ${fmt(s)}` : null; },
    });
    const diameter = Math.max(maxX - minX, maxZ - minZ);
    report('h. turning circle fits the desk lane', !r.failure && diameter + CAR.wid + 2 * CAR.wheelWidth < .57,
      r.failure || `path diameter ${f3(diameter)} m + body ${f3(CAR.wid + 2 * CAR.wheelWidth)} m vs 0.57 m lane`);

    // (i) nose-first descent: start on the desk facing the ramp (-X), drive down onto the floor.
    resetCar(car, { pos: [crestX + .4, deskTop + SPAWN.pos[1], rampZ], heading: -Math.PI / 2 }); drive(ctx, 1, IDLE);
    let maxDown = 0;
    lastProgress = { x: Infinity, t: ctx.time };
    r = drive(ctx, 12, FWD, {
      until: s => s.x < footX - .4 && s.y < restHeight + .02 && s.contacts.every(Boolean),
      watch: s => {
        maxDown = Math.max(maxDown, s.fwd);
        if (s.x < lastProgress.x - .01) lastProgress = { x: s.x, t: s.t };
        if (s.up < .7) return `tipped: up.y=${f3(s.up)} at ${fmt(s)}`;
        if (s.t - lastProgress.t > 1.5) return `stuck at ${fmt(s)}`;
        if (Math.abs(s.z - rampZ) > .15) return `drifted off the ramp line at ${fmt(s)}`;
      },
    });
    report('i. descend ramp nose-first', !r.failure && r.reached, r.failure || `${fmt(r.last)} minUp=${f3(r.minUp)} peak downhill ${f3(maxDown)} m/s`);

    // (j) real route: from SPAWN, back up, loop left to the ramp line, then climb. A heading-hold
    // driver stands in for the human; proves the west-end approach has room for the turning circle.
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    const hold = (target, s, gain = 3) => Math.max(-1, Math.min(1, gain * wrap(target - s.heading)));
    const creep = s => (s.fwd > .5 ? 0 : 1);
    const phases = [
      ['reverse to the west wall', 3, () => REV(), s => s.x < SPAWN.pos[0] - .55],
      ['turn left toward -Z', 6, s => ({ throttle: creep(s), steer: 1, brake: false }), s => wrap(s.heading - Math.PI) > -.08],
      ['run along -Z to the ramp line', 8, s => ({ throttle: creep(s), steer: hold(Math.PI, s), brake: false }), s => s.z < rampZ + .22],
      ['turn right onto +X', 6, s => ({ throttle: creep(s), steer: -1, brake: false }), s => wrap(s.heading - Math.PI / 2) < .08],
      ['climb', 12, s => ({ throttle: 1, steer: hold(Math.PI / 2, s) + 4 * (s.z - rampZ), brake: false }),
        s => s.x > crestX + .1 && s.y > deskTop + restHeight - .01 && s.contacts.every(Boolean)],
    ];
    let routeFailure = null, routeNote = [];
    for (const [label, seconds, input, until] of phases) {
      r = drive(ctx, seconds, input, { until, watch: s => s.up < .7 ? `tipped during "${label}" at ${fmt(s)}` : null });
      routeNote.push(`${label}: (${f3(r.last.x)}, ${f3(r.last.z)}) hdg ${f3(r.last.heading)}`);
      if (r.failure || !r.reached) { routeFailure = r.failure || `did not finish "${label}" in ${seconds} s at ${fmt(r.last)}`; break; }
    }
    report('j. route from SPAWN to the desktop', !routeFailure, routeFailure || routeNote.join(' → '));
  } else {
    for (const name of ['g. descend ramp to floor (reverse)', 'h. turning circle fits the desk lane', 'i. descend ramp nose-first', 'j. route from SPAWN to the desktop']) report(name, false, 'skipped: ascent failed');
  }
}

await RAPIER.init();
console.log(`Rapier ${RAPIER.version()} · CAR ${JSON.stringify(CAR)}`);
for (const path of rooms) {
  try { await testRoom(path); } catch (error) { report(`${path} crashed`, false, error.stack || String(error)); }
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `; FAILED: ${failed.map(r => r.name).join(', ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
