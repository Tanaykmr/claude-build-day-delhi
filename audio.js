// audio.js — synthesized game audio (Track A). Everything is generated in code with Web Audio:
// no files, no decoding, nothing to load. Adapted from Joyride's src/board/audio.js (nitzangames/joyride,
// revision ea4285dd, ISC) — see the attribution block in car.js — with an added procedural music loop.
//
// Autoplay policy: no AudioContext exists until unlock() runs on the first key press or click, so a page that
// never gets a gesture (a headless screenshot, a background tab) never trips the policy and never warns.
// Everything after that is guarded: if the platform has no Web Audio, or the context refuses to start, the
// module disables itself silently and the game plays on.
//
// Graph: one master gain → three buses (music, engine, fx) so the mix is set by constants rather than by
// scattering magic numbers over the one-shots. Continuous voices (engine, tire scrub) are built once and
// driven with setTargetAtTime (allocation-free per frame); one-shots and music notes are created per event
// and disconnect themselves when they end.

// Mix. Music sits ~12 dB under the engine so it never competes with the thing the player is steering.
export const MIX = Object.freeze({ master: .45, music: .22, engine: .62, fx: .85 });
const TAU = .05;            // setTargetAtTime constant: ~95% of the way there in 0.15 s
const NOISE_SECONDS = 2;

// Engine voice, scaled to a 1.2 m/s RC car: two detuned saws through a throttle-driven low-pass, the pitch
// wrapped into three "gears" so the tone climbs, drops on the shift and climbs again (Joyride's trick).
// An idle burble keeps a stationary car alive: the gain never reaches zero and the filter sits low.
const ENGINE = Object.freeze({
  maxSpeed: 1.2, idleFreq: 96, freqSpan: 250, gears: 3,
  cutoffIdle: 520, cutoffSpan: 2300, gainIdle: .07, gainSpan: .17,
  burbleFreq: 5.5, burbleDepth: .022, // slow amplitude wobble at rest, faded out as the car moves off
});
// Tire scrub / brake squeal: looped noise through a narrow band-pass. Level comes from lateral speed while
// sliding and from the service brake while stopping, so Space squeals and a handbrake slide scrubs.
const SCRUB = Object.freeze({ freq: 1250, q: 5, slipFrom: .12, slipSpan: .35, slipGain: .3, brakeGain: .16, brakeFrom: .35 });

// ---------------------------------------------------------------------------------------------- music
// A short chiptune loop: 4 bars of 16ths at 128 BPM (7.5 s), bass + lead + hats, scheduled against
// AudioContext.currentTime with a lookahead window so it loops seamlessly regardless of frame timing.
// Notes are MIDI numbers; null is a rest. A minor: the bass walks A → F → C → G under a pentatonic lead.
const MUSIC = Object.freeze({
  bpm: 128, stepsPerBeat: 4, lookahead: .3,
  bass: [45, 45, 53, 40],   // one root per bar (A2, A2, F2, E2)
  // 64 sixteenths of lead. Pentatonic A minor (A C D E G) with rests; bar 4 answers bars 1–3.
  lead: [
    69, null, 72, null, 74, null, 72, null, 69, null, null, 67, 69, null, null, null,
    69, null, 72, null, 76, null, 74, null, 72, null, null, 69, 67, null, null, null,
    65, null, 69, null, 72, null, 69, null, 65, null, null, 64, 65, null, null, null,
    67, null, 71, null, 74, null, 71, null, 69, null, 67, null, 64, null, null, null,
  ],
  noteLen: .16, leadPeak: .1, bassPeak: .16, hatPeak: .05, openHatPeak: .035,
});
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

export function createAudio({ onState } = {}) {
  const a = {
    ctx: null, ok: false, muted: false, playing: false,
    master: null, buses: { music: null, engine: null, fx: null }, noise: null,
    osc1: null, osc2: null, engFilter: null, engGain: null, burble: null, burbleGain: null, scrubGain: null,
    music: { step: 0, nextTime: 0, on: true },
  };
  const state = () => onState?.({ available: !!a.ctx, ok: a.ok, muted: a.muted });

  function bus(ctx, gain) { const g = ctx.createGain(); g.gain.value = gain; g.connect(a.master); return g; }

  function build(ctx) {
    const master = ctx.createGain();
    master.gain.value = a.muted ? 0 : MIX.master;
    master.connect(ctx.destination);
    a.master = master;
    a.buses = { music: bus(ctx, MIX.music), engine: bus(ctx, MIX.engine), fx: bus(ctx, MIX.fx) };

    // One deterministic white-noise buffer shared by every noise voice and one-shot.
    const len = Math.max(1, Math.floor(ctx.sampleRate * NOISE_SECONDS));
    const noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 22222;
    for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    a.noise = noise;

    // Engine: two detuned saws → low-pass → gain, plus a slow amplitude burble for the idle.
    const engGain = ctx.createGain(); engGain.gain.value = 0; engGain.connect(a.buses.engine);
    const engFilter = ctx.createBiquadFilter();
    engFilter.type = 'lowpass'; engFilter.frequency.value = ENGINE.cutoffIdle; engFilter.Q.value = .9;
    engFilter.connect(engGain);
    const saw = detune => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = ENGINE.idleFreq; o.detune.value = detune;
      o.connect(engFilter); o.start(); return o;
    };
    a.osc1 = saw(-7); a.osc2 = saw(7); a.engFilter = engFilter; a.engGain = engGain;
    const burbleGain = ctx.createGain(); burbleGain.gain.value = ENGINE.burbleDepth; burbleGain.connect(engGain.gain);
    const burble = ctx.createOscillator(); burble.type = 'sine'; burble.frequency.value = ENGINE.burbleFreq;
    burble.connect(burbleGain); burble.start();
    a.burble = burble; a.burbleGain = burbleGain;

    // Tire scrub: looped noise → band-pass → gain.
    const scrubGain = ctx.createGain(); scrubGain.gain.value = 0; scrubGain.connect(a.buses.fx);
    const scrubFilter = ctx.createBiquadFilter();
    scrubFilter.type = 'bandpass'; scrubFilter.frequency.value = SCRUB.freq; scrubFilter.Q.value = SCRUB.q;
    scrubFilter.connect(scrubGain);
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; src.connect(scrubFilter); src.start();
    a.scrubGain = scrubGain;

    a.music.nextTime = ctx.currentTime + .12;
    a.music.step = 0;
  }

  // Every one-shot disconnects itself when it ends, so nothing accumulates over a long session.
  const tail = node => { node.onended = () => { try { node.disconnect(); node._chain?.disconnect(); } catch (error) { /* already torn down */ } }; };
  function dest(busName, t, pan) {
    const target = a.buses[busName] || a.master;
    if (!pan || !a.ctx.createStereoPanner) return target;
    const p = a.ctx.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t);
    p.connect(target);
    return p;
  }
  // A filtered noise burst with an attack/decay envelope; f1 sweeps the cutoff.
  function burst(t, dur, peak, type, f0, f1, q, { bus = 'fx', pan = 0 } = {}) {
    const ctx = a.ctx, src = ctx.createBufferSource();
    src.buffer = a.noise; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + Math.min(.02, dur * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(filter); filter.connect(gain); gain.connect(dest(bus, t, pan));
    src.start(t, (t * 7.3) % 1); src.stop(t + dur); src._chain = gain; tail(src);
  }
  // A decaying oscillator note. `sweep` (optional) is a second frequency the pitch slides to.
  function note(t, freq, dur, peak, { type = 'sine', bus = 'fx', pan = 0, sweep = 0, attack = .012 } = {}) {
    const ctx = a.ctx, osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, t + dur * .6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(gain); gain.connect(dest(bus, t, pan));
    osc.start(t); osc.stop(t + dur); osc._chain = gain; tail(osc);
  }

  // ---- music scheduler: keep the next `lookahead` seconds of the loop queued ----
  function scheduleMusic(now) {
    if (!a.music.on) return;
    const stepDur = 60 / MUSIC.bpm / MUSIC.stepsPerBeat;
    if (a.music.nextTime < now) a.music.nextTime = now + .05; // returning from a suspend: do not replay the backlog
    while (a.music.nextTime < now + MUSIC.lookahead) {
      const t = a.music.nextTime, step = a.music.step;
      if (step % 4 === 0) { // bass: one root per beat, an octave ping on the last beat of each bar
        const root = MUSIC.bass[(step / 16) | 0];
        const midi = step % 16 === 12 ? root + 12 : root;
        note(t, midiHz(midi), stepDur * 1.8, MUSIC.bassPeak, { type: 'triangle', bus: 'music', attack: .006 });
      }
      const lead = MUSIC.lead[step];
      if (lead !== null && lead !== undefined) {
        note(t, midiHz(lead), MUSIC.noteLen, MUSIC.leadPeak, { type: 'square', bus: 'music', attack: .004 });
        note(t, midiHz(lead + 12), MUSIC.noteLen * .6, MUSIC.leadPeak * .35, { type: 'square', bus: 'music', attack: .004 });
      }
      if (step % 2 === 0) burst(t, .03, MUSIC.hatPeak, 'highpass', 7000, 7000, .7, { bus: 'music' });
      if (step % 8 === 4) burst(t, .11, MUSIC.openHatPeak, 'highpass', 5200, 5200, .7, { bus: 'music' });
      a.music.nextTime += stepDur;
      a.music.step = (step + 1) % MUSIC.lead.length;
    }
  }

  a.unlock = () => {
    if (a.ctx) { a.resume(); return; }
    const Ctor = typeof AudioContext !== 'undefined' ? AudioContext : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);
    if (!Ctor) { state(); return; }                       // no Web Audio here: stay silent, never throw
    try { const ctx = new Ctor(); build(ctx); a.ctx = ctx; a.ok = true; }
    catch (error) { a.ctx = null; a.ok = false; state(); return; }
    a.resume();
    state();
  };
  a.resume = () => { if (a.ctx?.state === 'suspended') a.ctx.resume?.().catch?.(() => {}); };
  a.suspend = () => { if (a.ctx?.state === 'running') a.ctx.suspend?.().catch?.(() => {}); };
  a.toggleMute = () => {
    a.muted = !a.muted;
    if (a.ok) { try { a.master.gain.setTargetAtTime(a.muted ? 0 : MIX.master, a.ctx.currentTime, .02); } catch (error) { a.ok = false; } }
    state();
    return a.muted;
  };
  // Per-frame: engine tone from the car's speed and throttle, scrub from lateral slip and braking, and the
  // music lookahead. `car` is a car.js car (vF, vL, input, slipping).
  a.update = (car) => {
    if (!a.ok || a.muted) return;
    try {
      const t = a.ctx.currentTime;
      const speed = Math.min(1, Math.abs(car.vF) / ENGINE.maxSpeed);
      const throttle = Math.abs(car.input?.throttle ?? 0);
      const rev = .22 + speed * .78;                       // revs never fall to zero: there is always an idle
      const geared = rev * ENGINE.gears;
      const freq = ENGINE.idleFreq + (geared - Math.floor(geared)) * ENGINE.freqSpan * (.55 + .45 * speed);
      a.osc1.frequency.setTargetAtTime(freq, t, TAU);
      a.osc2.frequency.setTargetAtTime(freq, t, TAU);
      a.engFilter.frequency.setTargetAtTime(ENGINE.cutoffIdle + ENGINE.cutoffSpan * (.25 * speed + .75 * throttle), t, TAU);
      a.engGain.gain.setTargetAtTime(ENGINE.gainIdle + ENGINE.gainSpan * Math.max(throttle, speed * .6), t, TAU);
      a.burbleGain.gain.setTargetAtTime(ENGINE.burbleDepth * (1 - speed), t, TAU); // the burble smooths out as it pulls away
      const slip = Math.max(0, (Math.abs(car.vL) - SCRUB.slipFrom) / SCRUB.slipSpan);
      const braking = car.input?.brake && Math.abs(car.vF) > SCRUB.brakeFrom ? 1 : 0;
      a.scrubGain.gain.setTargetAtTime(Math.min(1, slip) * SCRUB.slipGain + braking * SCRUB.brakeGain, t, TAU);
      scheduleMusic(t);
      a.playing = true;
    } catch (error) { a.ok = false; }
  };
  // One-shots. detail: { strength (0..1), pan (-1..1) }.
  a.event = (name, detail = {}) => {
    if (!a.ok || a.muted) return;
    try {
      const t = a.ctx.currentTime, pan = detail.pan || 0, p = Math.min(1, Math.max(0, detail.strength ?? 1));
      if (name === 'beep') note(t, 880, .1, .22, { type: 'square' });
      else if (name === 'go') note(t, 1320, .38, .28, { type: 'square' });
      else if (name === 'checkpoint') note(t, 1568, .05, .07);
      else if (name === 'lap') { note(t, 1047, .12, .2); note(t + .13, 1319, .18, .2); }
      else if (name === 'finish') [1047, 1319, 1568, 2093].forEach((f, i) => note(t + i * .13, f, .22, .2));
      else if (name === 'impact') { burst(t, .22, .55 * p, 'lowpass', 800, 800, .8, { pan }); note(t, 96, .28, .6 * p, { sweep: 60, pan }); }
      else if (name === 'clatter') burst(t, .08, .25 * Math.min(1, p + .3), 'highpass', 2000, 2000, .8, { pan });
      else if (name === 'land') { burst(t, .12, .3 * p, 'lowpass', 500, 300, .8, { pan }); note(t, 80, .16, .35 * p, { sweep: 55, pan }); }
    } catch (error) { a.ok = false; }
  };
  a.setMusic = on => { a.music.on = !!on; };
  // Convenience for a browser host: unlock on the first gesture of either kind.
  a.attach = target => {
    if (!target?.addEventListener) return a;
    for (const type of ['keydown', 'pointerdown']) target.addEventListener(type, () => a.unlock(), { once: true, capture: true });
    return a;
  };
  state();
  return a;
}
