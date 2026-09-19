// race.js — race logic shared by index.html and check-drive.mjs (Track A). Pure: no THREE, DOM or Rapier.
// Consumes a room module's RACE export ({ laps, grid, checkpoints, line, minimap }) and never hard-codes the
// loop. Progress is checkpoint-ordered: only the NEXT checkpoint counts, so cutting the course skips nothing.
// The AI driver follows RACE.line (dense points with per-point target speed 0..1) with a pure-pursuit look-ahead,
// uses the same car.js handling as the player through the ordinary input contract, and asks the host to
// recover it (teleport to the line) only after repeated stuck episodes.
import { STEP, clamp, wrap, steerTo } from './car.js';

// ---------------------------------------------------------------------------------------------- progress
export function createRace(RACE, count) {
  return {
    laps: RACE.laps, checkpoints: RACE.checkpoints, n: RACE.checkpoints.length,
    phase: 'idle', // idle → countdown → racing → finished (player done; AI keep lapping)
    countdown: 0, clock: 0,
    cars: Array.from({ length: count }, () => ({ next: 0, passed: 0, lap: 0, started: false, finished: false, time: 0, dist: Infinity, lapStart: 0, lapTimes: [] })),
  };
}
export function startCountdown(race, seconds = 3) { race.phase = 'countdown'; race.countdown = seconds; race.clock = 0; }
// Advance the race clock by dt. Returns 'go' on the countdown → racing transition, else null.
export function tickRace(race, dt) {
  if (race.phase === 'countdown') {
    race.countdown -= dt;
    if (race.countdown <= 0) { race.phase = 'racing'; race.countdown = 0; return 'go'; }
    return null;
  }
  if (race.phase === 'racing' || race.phase === 'finished') race.clock += dt;
  return null;
}
// Feed a car's position; returns 'start' | 'checkpoint' | 'lap' | 'finish' when it reaches its NEXT checkpoint.
export function updateProgress(race, i, s) {
  const c = race.cars[i];
  if (c.finished) return null;
  const cp = race.checkpoints[c.next];
  c.dist = Math.hypot(s.x - cp.pos[0], s.z - cp.pos[2]);
  if (c.dist > cp.radius) return null;
  let event = 'checkpoint';
  if (c.next === 0) {
    if (c.started) { c.lap++; c.lapTimes.push(race.clock - c.lapStart); event = 'lap'; } else event = 'start';
    c.started = true; c.lapStart = race.clock;
  }
  c.passed++;
  c.next = (c.next + 1) % race.n;
  if (c.lap >= race.laps) { c.finished = true; c.time = race.clock; event = 'finish'; }
  return event;
}
// Car indices ordered by standing: finishers by time, then most checkpoints passed, then closest to the next one.
export function standings(race) {
  return race.cars.map((c, i) => i).sort((a, b) => {
    const A = race.cars[a], B = race.cars[b];
    if (A.finished !== B.finished) return A.finished ? -1 : 1;
    if (A.finished) return A.time - B.time;
    if (A.passed !== B.passed) return B.passed - A.passed;
    return A.dist - B.dist;
  });
}
export const rankOf = (race, i) => standings(race).indexOf(i) + 1;

// ---------------------------------------------------------------------------------------------- line helpers
// Index of the line point nearest to s. With `from`, only a window around the previous answer is searched so a
// car cannot lock onto the return leg of a two-way aisle.
export function nearestLinePoint(line, s, from = null, window = 6) {
  const n = line.length;
  let best = 0, bestD = Infinity;
  const check = i => { const p = line[i].pos, d = (p[0] - s.x) ** 2 + (p[2] - s.z) ** 2; if (d < bestD) { bestD = d; best = i; } };
  if (from === null) for (let i = 0; i < n; i++) check(i);
  else for (let k = -window; k <= window; k++) check(((from + k) % n + n) % n);
  return best;
}
// A spawn pose on the line: body origin `y` above the surface, facing the following point.
export function lineSpawn(line, index, y = .07) {
  const n = line.length, a = line[((index % n) + n) % n].pos, b = line[(index + 1) % n].pos;
  return { pos: [a[0], a[1] + y, a[2]], heading: Math.atan2(b[0] - a[0], b[2] - a[2]) };
}
export function lineLength(line) {
  let total = 0;
  for (let i = 0; i < line.length; i++) { const a = line[i].pos, b = line[(i + 1) % line.length].pos; total += Math.hypot(b[0] - a[0], b[2] - a[2]); }
  return total;
}
// The nearest other car inside a corridor ahead of car i: { index, dist (forward), lateral (+ = to its left) }.
export function carAhead(states, i, maxDist = .5, maxLateral = .1) {
  const me = states[i], fx = Math.sin(me.heading), fz = Math.cos(me.heading), lx = fz, lz = -fx; // left = up × forward
  let best = null;
  states.forEach((o, j) => {
    if (j === i) return;
    const dx = o.x - me.x, dz = o.z - me.z, dist = dx * fx + dz * fz, lateral = dx * lx + dz * lz;
    if (dist > 0 && dist <= maxDist && Math.abs(lateral) <= maxLateral && (!best || dist < best.dist)) best = { index: j, dist, lateral };
  });
  return best;
}

// ---------------------------------------------------------------------------------------------- AI driver
// input(s, ahead): s = carState(car) (x, z, heading, fwd, vL); ahead = carAhead(...) or null.
// pace scales every target speed (0.9 = a slightly slower opponent). Stuck handling: after 1.2 s of throttle with
// no motion the driver backs up for 0.8 s; every third stuck episode it sets wantsRecovery so the host teleports
// it onto the line (lineSpawn) and calls recovered().
export function createAIDriver(line, { lookahead = 2, maxSpeed = 1.2, pace = 1, brakeMargin = .12 } = {}) {
  const n = line.length;
  let nearest = null, stuck = 0, reverseLeft = 0, stuckCount = 0, recoveries = 0, wantsRecovery = false;
  return {
    get nearest() { return nearest ?? 0; },
    get stuckCount() { return stuckCount; },
    get recoveries() { return recoveries; },
    get wantsRecovery() { return wantsRecovery; },
    recovered(index) { wantsRecovery = false; stuck = 0; reverseLeft = 0; recoveries++; nearest = index ?? nearest; },
    input(s, ahead = null) {
      nearest = nearestLinePoint(line, s, nearest);
      const aim = line[(nearest + lookahead) % n].pos;
      const heading = Math.atan2(aim[0] - s.x, aim[2] - s.z);
      let steer = steerTo(s, heading, null, 2.5, 4, 1.5);
      // Target speed: the slowest of the next few points, so braking starts before the corner (B ramps them too).
      const target = maxSpeed * pace * Math.min(line[nearest].speed, line[(nearest + 1) % n].speed, line[(nearest + 2) % n].speed);
      let throttle = s.fwd < target - .02 ? 1 : s.fwd > target + brakeMargin ? -1 : 0; // -1 while rolling forward = brake
      if (ahead) { // something directly ahead: do not ram it, ease out around it
        if (ahead.dist < .2) throttle = -1; else if (ahead.dist < .4) throttle = Math.min(throttle, 0);
        steer = clamp(steer + (ahead.lateral > 0 ? -.5 : .5) * (1 - ahead.dist / .5), -1, 1);
      }
      if (reverseLeft > 0) { reverseLeft -= STEP; return { throttle: -1, steer: -steer, brake: false, handbrake: false }; }
      if (Math.abs(s.fwd) < .06 && throttle > 0) stuck += STEP; else stuck = 0;
      if (stuck > 1.2) {
        stuck = 0; stuckCount++;
        if (stuckCount % 3 === 0) wantsRecovery = true; else reverseLeft = .8;
      }
      return { throttle, steer, brake: false, handbrake: false };
    },
  };
}
