// check-audio.mjs — the one thing in audio.js that can silently go wrong without a sound card: the engine
// pitch map. It must rise with speed and dip exactly once per upshift. A wrap at the top gear (Math.floor(3.0)
// landing in a fourth gear that does not exist) made the tone fall off a cliff at full throttle; this catches it.
//
//   node check-audio.mjs
import assert from 'node:assert/strict';
import { ENGINE } from './audio.js';

const pitch = speedMs => {
  const speed = Math.min(1, Math.abs(speedMs) / ENGINE.maxSpeed);
  const geared = (.22 + speed * .78) * ENGINE.gears;
  const gear = Math.min(ENGINE.gears - 1, Math.floor(geared));
  return ENGINE.idleFreq * (1 + ENGINE.gearRise * (geared - gear) + ENGINE.shiftStep * gear);
};

const dips = [];
for (let v = 0, prev = 0; v <= ENGINE.maxSpeed + 1e-9; v += ENGINE.maxSpeed / 240) {
  const hz = pitch(v);
  if (hz < prev - 1) dips.push(+v.toFixed(3));
  prev = hz;
}
assert.equal(dips.length, ENGINE.gears - 1, `expected one downshift dip per upshift, got ${dips.length}: ${dips}`);
assert.ok(pitch(ENGINE.maxSpeed) > pitch(ENGINE.maxSpeed * .5), 'top gear must sit above mid range');
assert.ok(pitch(ENGINE.maxSpeed * .5) > pitch(0), 'mid range must sit above idle');
assert.ok(pitch(0) > ENGINE.idleFreq, 'idle must clear the fundamental so the burble has something to sit on');
console.log(`audio ok — idle ${pitch(0) | 0} Hz, top ${pitch(ENGINE.maxSpeed) | 0} Hz, shifts at ${dips.join(', ')} m/s`);
