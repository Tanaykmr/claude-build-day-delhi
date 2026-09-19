#!/usr/bin/env node
// check-drive.mjs — headless driving acceptance test (Track A).
// Loads ROOM/SPAWN exactly like index.html, builds the car from car.js (shared with the browser),
// and drives scripted scenarios. Prints PASS/FAIL per scenario; exits nonzero on any failure.
//   node check-drive.mjs            # live room.js, then room.fallback.js
//   node check-drive.mjs --live     # only room.js       --fallback  only room.fallback.js
//   node check-drive.mjs --verbose  # per-0.25 s telemetry
//   node check-drive.mjs --car '{"stiffness":300}'   # override CAR fields for tuning sweeps
//   node check-drive.mjs --live --ramp=15            # gentler ramp angle (room.js ?ramp= knob)
//   node check-drive.mjs --handling=joyride          # select the car.js controller (default: DEFAULT_HANDLING)
//   node check-drive.mjs --trace                     # motion traces only: per-step CSVs in .traces/ + jitter metrics
//   node check-drive.mjs --trace=straight,slide      # subset of the trace scenarios (see TRACES below)
import RAPIER from '@dimforge/rapier3d-compat';
import { mkdirSync, writeFileSync } from 'node:fs';

// BASELINE jitter metrics, recorded with `--trace --live` at tag baseline-mvp (classic controller, room.js,
// commit bc407e5 + trace tooling). Units: pos2 = RMS second difference of position per step (mm);
// yaw2/roll2 = RMS second difference of yaw/roll per step (mrad); dYawRate = max |Δ yaw rate| in one step
// (rad/s); flicker = number of steps where the wheel-contact pattern changed. Trace runs print the
// candidate next to these so comparisons stay honest. Filled in by the first trace run; do not hand-edit.
const BASELINE = {
  classic: {
    straight: { pos2: 0.349, tail: 0, yaw2: 0, roll2: 0, dYawRate: 0, flicker: 0 },
    uturn: { pos2: 0.612, tail: 0.513, yaw2: 1.34, roll2: 0.63, dYawRate: 0.455, flicker: 0 },
    ramp: { pos2: 0.955, tail: 1.683, yaw2: 0, roll2: 0, dYawRate: 0, flicker: 2 },
    lane: { pos2: 0.382, tail: 0, yaw2: 0, roll2: 0, dYawRate: 0, flicker: 0 },
    descent: { pos2: 0.653, tail: 0.79, yaw2: 0.03, roll2: 0.11, dYawRate: 0.01, flicker: 2 },
    reverse: { pos2: 0.897, tail: 1.228, yaw2: 1.04, roll2: 1.38, dYawRate: 0.401, flicker: 0 },
    slide: { pos2: 0.466, tail: 0.038, yaw2: 1.46, roll2: 0.68, dYawRate: 0.455, flicker: 0 },
  },
};

const argv = process.argv.slice(2);
const rampArg = argv.find(a => a.startsWith('--ramp='));
if (rampArg) globalThis.location = { search: `?ramp=${rampArg.slice(7)}` }; // room.js reads ?ramp= from location.search
const carArg = argv.indexOf('--car');
if (carArg >= 0) globalThis.CAR_OVERRIDE = JSON.parse(argv[carArg + 1]);
const {
  CAR, STEP, createWorld, createCar, roomColliderDesc, stepVehicle, resetCar, forwardSpeed, lateralSpeed, pitchRoll,
  heading, upVector, wheelContacts, validBody, needsRecovery, headingQuaternion,
  rampGeometry, demoPhases, createDriver, carState,
} = await import('./car.js');

const args = new Set(argv);
const verbose = args.has('--verbose');
const handling = argv.find(a => a.startsWith('--handling='))?.slice(11) || 'classic';
const traceArg = argv.find(a => a === '--trace' || a.startsWith('--trace='));
const traceNames = traceArg ? (traceArg.includes('=') ? traceArg.slice(8).split(',').filter(Boolean) : null) : undefined;
const rooms = args.has('--live') ? ['./room.js'] : args.has('--fallback') ? ['./room.fallback.js'] : ['./room.js', './room.fallback.js'];
const wrap0 = a => Math.atan2(Math.sin(a), Math.cos(a));
const f3 = n => (Math.round(n * 1000) / 1000).toFixed(3);
const results = [];

function buildWorld(ROOM, PROPS = []) {
  const world = createWorld(RAPIER);
  const props = PROPS.map(entry => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(...entry.pos)
      .setCcdEnabled(true).setLinearDamping(.15).setAngularDamping(.4));
    world.createCollider(RAPIER.ColliderDesc.cuboid(...entry.size.map(n => n / 2)).setFriction(.7).setRestitution(0).setMass(entry.mass), body);
    return body;
  });
  const bounds = { min: { x: Infinity, z: Infinity }, max: { x: -Infinity, z: -Infinity } };
  for (const entry of ROOM) {
    world.createCollider(roomColliderDesc(RAPIER, entry));
    if (entry.tag !== 'carpet') continue;
    bounds.min.x = Math.min(bounds.min.x, entry.pos[0] - entry.size[0] / 2);
    bounds.max.x = Math.max(bounds.max.x, entry.pos[0] + entry.size[0] / 2);
    bounds.min.z = Math.min(bounds.min.z, entry.pos[2] - entry.size[2] / 2);
    bounds.max.z = Math.max(bounds.max.z, entry.pos[2] + entry.size[2] / 2);
  }
  return { world, bounds, props };
}

function snapshot(car) {
  const p = car.body.translation(), q = car.body.rotation(), v = car.body.linvel(), w = car.body.angvel();
  const { pitch, roll } = pitchRoll(q);
  return { x: p.x, y: p.y, z: p.z, speed: Math.hypot(v.x, v.z), vy: v.y, fwd: forwardSpeed(car), vL: lateralSpeed(car),
    heading: heading(q), yawRate: w.y, pitch, roll, up: upVector(q).y, steer: car.steering, contacts: wheelContacts(car) };
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
    if (ctx.trace) ctx.trace.push(last);
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
  const live = path === './room.js';
  const { PROPS } = live ? await import('./props.js') : { PROPS: [] };
  const { world, bounds, props } = buildWorld(ROOM, PROPS);
  const car = createCar(RAPIER, world, SPAWN, { handling });
  const ctx = { world, car, bounds, time: 0 };
  console.log(`    ${ROOM.length} fixed boxes, ${PROPS.length} dynamic props`);
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

  // (c) steering: hold left from rest, heading must increase (left as seen from behind the car). The turn is
  // accumulated step by step (unwrapped) so a car that swings past 180° in 2 s is still measured correctly.
  let cPrev = snapshot(car).heading, turn = 0;
  r = drive(ctx, 2, () => ({ throttle: 1, steer: 1, brake: false }), { watch: s => { turn += wrap0(s.heading - cPrev); cPrev = s.heading; return null; } });
  const c = r.last;
  report('c. steer left → heading positive', !r.failure && turn > .4 && r.minUp > .9, r.failure || `Δheading=${f3(turn)} rad in 2 s, ${fmt(c)}`);
  drive(ctx, 1, BRAKE);

  // (e) reverse
  resetCar(car, SPAWN); drive(ctx, 1, IDLE);
  let minFwd = 0;
  r = drive(ctx, 1.2, REV, { watch: s => { minFwd = Math.min(minFwd, s.fwd); return null; } });
  const e = r.last;
  report('e. reverse', !r.failure && minFwd <= -.3 && e.x < SPAWN.pos[0] - .2 && r.minUp > .95, r.failure || `${fmt(e)} peak reverse ${f3(-minFwd)} m/s`);
  drive(ctx, 1, BRAKE);

  // (e2) recovery: reset from a moving, rotated state must restore pos + heading and zero velocity
  drive(ctx, 1, () => ({ throttle: 1, steer: -1, brake: false }));
  resetCar(car, SPAWN);
  const rq = car.body.rotation(), rp = car.body.translation(), rv = car.body.linvel(), rw = car.body.angvel(), want = headingQuaternion(SPAWN.heading);
  const posOk = Math.hypot(rp.x - SPAWN.pos[0], rp.y - SPAWN.pos[1], rp.z - SPAWN.pos[2]) < 1e-6;
  const rotOk = Math.abs(rq.x - want.x) + Math.abs(rq.y - want.y) + Math.abs(rq.z - want.z) + Math.abs(rq.w - want.w) < 1e-6;
  const stillOk = Math.hypot(rv.x, rv.y, rv.z) === 0 && Math.hypot(rw.x, rw.y, rw.z) === 0 && car.steering === 0;
  r = drive(ctx, 1, IDLE);
  report('e2. resetCar restores spawn pose and zero velocity', posOk && rotOk && stillOk && !r.failure && r.last.contacts.every(Boolean) && Math.abs(wrap0(r.last.heading - SPAWN.heading)) < 1e-3,
    `pos ${posOk} rot ${rotOk} still ${stillOk}; settled at ${fmt(r.last)}`);

  // (l) collision impulses survive the handling: shove the moving car sideways (as a wall or prop would) and
  // expect the lateral speed to show the hit, then be scrubbed away by the tires. For joyride the decay over
  // the first 6 steps must match its grip constant alone, (1-grip/60)^6 ≈ 0.48: proof that the zeroed vehicle
  // controller is not adding a second lateral-grip authority on top of the planar model.
  resetCar(car, SPAWN); drive(ctx, 1, IDLE);
  r = drive(ctx, 1.2, FWD);
  const before = r.last;
  {
    const l = (q => ({ x: 1 - 2 * (q.y * q.y + q.z * q.z), z: 2 * (q.x * q.z - q.w * q.y) }))(car.body.rotation()); // body left axis (flat)
    const kick = .25; // m/s of lateral speed, below the joyride slip threshold so plain grip applies
    car.body.applyImpulse({ x: -l.x * CAR.mass * kick, y: 0, z: -l.z * CAR.mass * kick }, true); // toward the car's right
  }
  let peakVL = 0, vl6 = null, slipSeen = 0, k = 0;
  r = drive(ctx, .5, FWD, { watch: s => { k++; peakVL = Math.max(peakVL, Math.abs(s.vL)); if (k === 6) vl6 = Math.abs(s.vL); slipSeen = Math.max(slipSeen, Math.abs(Math.atan2(s.vL, Math.abs(s.fwd)))); return null; } });
  const decayRatio = vl6 / .25;
  const decayOk = car.handling === 'joyride' ? decayRatio > .35 && decayRatio < .62 : true;
  report('l. sideways impulse shows in vL then decays', !r.failure && peakVL > .15 && Math.abs(r.last.vL) < .05 && slipSeen > .1 && decayOk && r.minUp > .9,
    r.failure || `peak |vL| ${f3(peakVL)} m/s (slip angle ${f3(slipSeen)} rad), |vL| after 6 steps ${f3(vl6)} (${f3(decayRatio)} of the kick), after 0.5 s ${f3(Math.abs(r.last.vL))}; heading ${f3(before.heading)} → ${f3(r.last.heading)}`);
  drive(ctx, 1, BRAKE);

  if (car.handling === 'joyride') {
    const J = (await import('./car.js')).JOYRIDE;
    // (m) reverse tops out near 35% of top speed
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    let peakRev = 0;
    r = drive(ctx, 4, REV, { watch: s => { peakRev = Math.max(peakRev, -s.fwd); return null; } });
    const cap = J.reverseCap * J.maxSpeed;
    report('m. reverse capped at 35% of top speed', !r.failure && peakRev > cap * .6 && peakRev < cap + .02 && r.minUp > .95,
      r.failure || `peak reverse ${f3(peakRev)} m/s vs cap ${f3(cap)} m/s`);
    drive(ctx, 1, BRAKE);

    // (n) steering authority drops with speed: the same full-left input yields less lock at top speed
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    drive(ctx, 3, s => ({ throttle: s.fwd > .3 ? 0 : 1, steer: 0, brake: false }));
    r = drive(ctx, .4, s => ({ throttle: s.fwd > .3 ? 0 : 1, steer: 1, brake: false }));
    const slowSteer = r.last.steer, slowSpeed = r.last.fwd;
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    drive(ctx, 3, FWD);
    r = drive(ctx, .4, () => ({ throttle: 1, steer: 1, brake: false }));
    const fastSteer = r.last.steer, fastSpeed = r.last.fwd;
    report('n. steering authority drops at speed', !r.failure && fastSteer > 0 && slowSteer > fastSteer * 1.5 && slowSteer <= J.steerMax + 1e-6,
      r.failure || `steer ${f3(slowSteer)} rad at ${f3(slowSpeed)} m/s vs ${f3(fastSteer)} rad at ${f3(fastSpeed)} m/s`);
    drive(ctx, 1, BRAKE);

    // (o) slide and recover: handbrake + full left at speed breaks traction (heading leaves the velocity direction),
    // the car keeps rotating briefly after release (yaw inertia), then the slide decays progressively.
    resetCar(car, { pos: [SPAWN.pos[0] + 1.2, SPAWN.pos[1], SPAWN.pos[2] + .3], heading: SPAWN.heading }); drive(ctx, 1, IDLE);
    drive(ctx, 2, FWD);
    let slideVL = 0, slideAngle = 0;
    r = drive(ctx, .8, () => ({ throttle: 0, steer: 1, brake: false, handbrake: true }), { watch: s => { slideVL = Math.max(slideVL, Math.abs(s.vL)); slideAngle = Math.max(slideAngle, Math.abs(Math.atan2(s.vL, s.fwd))); return s.up < .9 ? `tipped at ${fmt(s)}` : null; } });
    const releaseHeading = r.last.heading;
    const r2 = drive(ctx, .25, IDLE);
    const inertia = wrap0(r2.last.heading - releaseHeading);
    const r3 = drive(ctx, 1.25, IDLE);
    report('o. handbrake slide then progressive recovery', !r.failure && !r2.failure && !r3.failure && slideVL > J.slipThreshold && slideAngle > .3 && inertia > .05 && Math.abs(r3.last.vL) < .05 && r3.minUp > .9,
      r.failure || r2.failure || r3.failure || `peak |vL| ${f3(slideVL)} m/s, peak slip angle ${f3(slideAngle)} rad, kept turning ${f3(inertia)} rad in 0.25 s after release, |vL| after 1.5 s ${f3(Math.abs(r3.last.vL))}, at ${fmt(r3.last)}`);
  }

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

    // (k) the rehearsed two-minute demo route, driven by the same closed-loop driver index.html uses for ?demo=1
    resetCar(car, SPAWN); drive(ctx, 1, IDLE);
    const geo = rampGeometry(ROOM, mod);
    const driver = createDriver(demoPhases(geo, SPAWN));
    let demoFailure = null, maxY = 0, label = driver.label, log = [];
    r = drive(ctx, 150, s => { const input = driver.input(carState(car)); if (driver.label !== label) { log.push(`${label} ✓ t=${f3(s.t)} (${f3(s.x)}, ${f3(s.z)})`); label = driver.label; } return input; }, {
      until: () => driver.done,
      watch: s => {
        maxY = Math.max(maxY, s.y);
        if (s.up < .7) return `tipped during "${driver.label}" at ${fmt(s)}`;
        if (driver.timedOut) return `stuck in "${driver.label}" at ${fmt(s)}`;
        if (props.some(b => !validBody(b))) return 'a prop became non-finite';
      },
    });
    demoFailure = r.failure || (!r.reached ? `route incomplete, in "${driver.label}" at ${fmt(r.last)}` : null);
    const moved = props.filter((b, i) => Math.hypot(b.translation().x - PROPS[i].pos[0], b.translation().z - PROPS[i].pos[2]) > .05).length;
    report('k. full demo route (aisle, ramp, desk, descent, cups)', !demoFailure, demoFailure || `${f3(r.last.t)} s total, ${moved}/${PROPS.length} props knocked, ended at ${fmt(r.last)}`);
    if (verbose || demoFailure) log.forEach(l => console.log('    ', l));
  } else {
    for (const name of ['g. descend ramp to floor (reverse)', 'h. turning circle fits the desk lane', 'i. descend ramp nose-first', 'j. route from SPAWN to the desktop', 'k. full demo route (aisle, ramp, desk, descent, cups)']) report(name, false, 'skipped: ascent failed');
  }
}

// ---------------------------------------------------------------------------------------------
// Motion traces. Screenshots cannot establish smooth handling, so these record every fixed step of a
// few short, repeatable manoeuvres to CSV and boil each down to jitter metrics (see BASELINE above).
const TRACES = {
  straight: { label: 'flat forward 3 s', spawn: (S) => S, run: ctx => drive(ctx, 3, FWD) },
  uturn: { label: 'forward 1 s then full left at creep 3 s', spawn: (S) => S,
    run: ctx => { drive(ctx, 1, FWD); return drive(ctx, 3, s => ({ throttle: s.fwd > .5 ? 0 : 1, steer: 1, brake: false })); } },
  ramp: { label: 'climb the ramp onto the desk', spawn: (S, g) => ({ pos: [g.footX - .75, S.pos[1], g.rampZ], heading: Math.PI / 2 }),
    run: (ctx, g) => drive(ctx, 7, FWD, { until: s => s.x > g.crestX + .5 }) },
  lane: { label: 'desk lane forward 2.5 s', spawn: (S, g) => ({ pos: [g.crestX + .7, g.deskTop + S.pos[1] - .04, g.rampZ], heading: Math.PI / 2 }),
    run: ctx => drive(ctx, 2.5, FWD) },
  descent: { label: 'nose-first down the ramp 3 s', spawn: (S, g) => ({ pos: [g.crestX + .9, g.deskTop + S.pos[1] - .04, g.rampZ], heading: -Math.PI / 2 }),
    run: ctx => drive(ctx, 3, FWD) },
  reverse: { label: 'reverse 2 s', spawn: (S) => S, run: ctx => drive(ctx, 2, REV) },
  slide: { label: 'forward 2 s, handbrake + full left 0.8 s, release 1.5 s', spawn: (S) => S,
    run: ctx => { drive(ctx, 2, FWD); drive(ctx, .8, () => ({ throttle: 0, steer: 1, brake: false, handbrake: true })); return drive(ctx, 1.5, IDLE); } },
};
const unwrapAngles = a => { const out = [a[0] ?? 0]; for (let i = 1; i < a.length; i++) out.push(out[i - 1] + wrap0(a[i] - a[i - 1])); return out; };
function jitterMetrics(rows) {
  const yaw = unwrapAngles(rows.map(r => r.heading));
  let pos2 = 0, yaw2 = 0, roll2 = 0, n = 0, dYawRate = 0, flicker = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].contacts.join('') !== rows[i - 1].contacts.join('')) flicker++;
    dYawRate = Math.max(dYawRate, Math.abs(rows[i].yawRate - rows[i - 1].yawRate));
    if (i < 2) continue;
    const a = rows[i - 2], b = rows[i - 1], c = rows[i];
    pos2 += (c.x - 2 * b.x + a.x) ** 2 + (c.y - 2 * b.y + a.y) ** 2 + (c.z - 2 * b.z + a.z) ** 2;
    yaw2 += (yaw[i] - 2 * yaw[i - 1] + yaw[i - 2]) ** 2;
    roll2 += (c.roll - 2 * b.roll + a.roll) ** 2;
    n++;
  }
  const rms = v => (n ? Math.sqrt(v / n) : 0);
  // tail = position jitter over the final second only, where the manoeuvre has settled and intended
  // acceleration no longer dominates the second differences.
  let tail = 0, nt = 0;
  for (let i = Math.max(2, rows.length - 60); i < rows.length; i++) {
    const a = rows[i - 2], b = rows[i - 1], c = rows[i];
    tail += (c.x - 2 * b.x + a.x) ** 2 + (c.y - 2 * b.y + a.y) ** 2 + (c.z - 2 * b.z + a.z) ** 2; nt++;
  }
  return { pos2: rms(pos2) * 1000, tail: (nt ? Math.sqrt(tail / nt) : 0) * 1000, yaw2: rms(yaw2) * 1000, roll2: rms(roll2) * 1000, dYawRate, flicker, steps: rows.length };
}
const fmtMetrics = m => `pos2 ${m.pos2.toFixed(3)} mm (tail ${m.tail.toFixed(3)}) · yaw2 ${m.yaw2.toFixed(2)} mrad · roll2 ${m.roll2.toFixed(2)} mrad · dYawRate ${m.dYawRate.toFixed(3)} rad/s · flicker ${m.flicker} · ${m.steps} steps`;
const CSV_COLUMNS = ['t', 'x', 'y', 'z', 'heading', 'yawRate', 'pitch', 'roll', 'fwd', 'vL', 'steer', 'contacts'];
function writeTrace(file, rows) {
  mkdirSync('.traces', { recursive: true });
  const lines = rows.map(r => CSV_COLUMNS.map(c => (c === 'contacts' ? r.contacts.join('') : (Math.round(r[c] * 1e5) / 1e5))).join(','));
  writeFileSync(file, [CSV_COLUMNS.join(','), ...lines].join('\n') + '\n');
}

async function traceRoom(path) {
  console.log(`\n=== ${path} (traces, handling=${handling}) ===`);
  const mod = await import(path);
  const { ROOM, SPAWN } = mod;
  const live = path === './room.js';
  const { PROPS } = live ? await import('./props.js') : { PROPS: [] };
  const { world, bounds } = buildWorld(ROOM, PROPS);
  const car = createCar(RAPIER, world, SPAWN, { handling });
  const ctx = { world, car, bounds, time: 0 };
  world.step();
  const g = rampGeometry(ROOM, mod);
  const names = traceNames ?? Object.keys(TRACES);
  const summary = {};
  for (const name of names) {
    const scenario = TRACES[name];
    if (!scenario) { report(`trace ${name}`, false, `unknown trace; choose from ${Object.keys(TRACES).join(', ')}`); continue; }
    ctx.trace = null;
    resetCar(car, scenario.spawn(SPAWN, g)); drive(ctx, 1, IDLE);
    ctx.trace = [];
    const r = scenario.run(ctx, g);
    const rows = ctx.trace; ctx.trace = null;
    const file = `.traces/${handling}-${live ? 'live' : 'fallback'}-${name}.csv`;
    writeTrace(file, rows);
    const m = jitterMetrics(rows);
    summary[name] = { pos2: +m.pos2.toFixed(3), tail: +m.tail.toFixed(3), yaw2: +m.yaw2.toFixed(2), roll2: +m.roll2.toFixed(2), dYawRate: +m.dYawRate.toFixed(3), flicker: m.flicker };
    const base = BASELINE.classic[name];
    const vs = base ? ` | baseline pos2 ${base.pos2} (tail ${base.tail}) · yaw2 ${base.yaw2} · roll2 ${base.roll2} · dYawRate ${base.dYawRate} · flicker ${base.flicker}` : '';
    report(`trace ${name} (${scenario.label})`, !r.failure && r.minUp > .7, r.failure || `${fmtMetrics(m)}${vs} → ${file}`);
  }
  if (live) console.log(`    metrics JSON: ${JSON.stringify(summary)}`);
}

await RAPIER.init();
console.log(`Rapier ${RAPIER.version()} · handling ${handling} · CAR ${JSON.stringify(CAR)}`);
for (const path of rooms) {
  try { await (traceNames === undefined ? testRoom(path) : traceRoom(path)); } catch (error) { report(`${path} crashed`, false, error.stack || String(error)); }
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `; FAILED: ${failed.map(r => r.name).join(', ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
