// menu.js — Snap the Room front-end menu (B track).
// Self-contained: injects its own stylesheet, fonts, DOM, music and UI sounds. index.html mounts it with
// one call and stays otherwise untouched.
//
//   import { mountMenu } from './menu.js';
//   const menu = mountMenu({ statusEl, onChange(open) });  // shows at once, before the engine boots
//   menu.setReady({ name, boxes, props, size });          // flips DRIVE from "Loading" to ready
//   menu.isOpen();        // engine: keep physics paused and run the cinematic camera while true
//   menu.open(); menu.close({ force });
//
// Pages: Start · Create (photos + API key → map) · Phases · Briefing.
// Keys while open: ← → pages · Enter primary action · Esc back / resume · M music.
// In game: Esc reopens the menu (pause). M still toggles music.
// URL: ?menu=create|phases|briefing opens on that page · ?map=<id> drives a saved map · ?go=1 skips the menu once ready.

import { generateMap, saveMap, listMaps, deleteMap, MODELS, KEY_STORE } from './maps.js';
import { drawOverview } from './minimap.js';

const SLIDES = ['home', 'create', 'phases', 'briefing'];
const MUSIC_KEY = 'stm.music';
const MENU_VOL = 0.5, GAME_VOL = 0.16;
const here = new URL('.', import.meta.url);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const I = {
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  arrL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  arrR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h9l-1.5 3L14 10H5"/><path d="M5 10h9"/></svg>',
  reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
};

const keycap = (label, cls = '') => `<span class="stm-key ${cls}">${label}</span>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function template({ fallback, raceHref, demoHref, fallbackHref, mapName }) {
  return `
  <div class="stm-ink"></div>
  <canvas class="stm-bg" aria-hidden="true"></canvas>
  <div class="stm-glow a"></div><div class="stm-glow b"></div><div class="stm-glow c"></div>
  <div class="stm-scrim"></div><div class="stm-vignette"></div>

  <div class="stm-chrome">
    <div class="stm-brand"><i class="stm-flag"></i><b>Snap the Room</b><span class="stm-chip" data-chip><i></i><span data-chip-text>Map · ${esc(mapName)}</span></span></div>
    <div class="stm-tools">
      <button class="stm-icon" data-music aria-pressed="true" title="Music (M)"><span class="stm-eq"><i></i><i></i><i></i><i></i></span><span>Music</span></button>
    </div>
  </div>

  <div class="stm-viewport">
    <div class="stm-track">

      <section class="stm-slide stm-home" data-slide="home" aria-label="Start">
        <div class="stm-hero">
          <div class="stm-stripes rv" style="--i:0"><i></i><i></i><i></i></div>
          <p class="stm-kicker rv" style="--i:1">Photos in · a drivable world out</p>
          <h1 class="stm-title">
            <span class="w1 rv" style="--i:2">Snap</span>
            <span class="w2 rv" style="--i:3" data-text="the Room">the Room</span>
          </h1>
          <p class="stm-tag rv" style="--i:4">Drop in <b>5 to 10 photos</b> of any room. Claude reads the space, lays out every desk, chair and wall in real meters, and puts a <b>mouse-sized RC car</b> on the floor. This office is the first map, with a <b>three-lap race</b> already in it. Yours is one page away.</p>
          <div class="stm-actions">
            <button class="stm-btn primary is-loading rv" style="--i:5" data-primary>${I.go}<span data-primary-label>Loading</span><span class="k">Enter</span></button>
            <div class="stm-status rv" style="--i:6" data-status><i></i><span data-status-text>Starting the room and car</span></div>
            <div class="row rv" style="--i:7">
              <button class="stm-btn" data-go="create">${I.camera}<span>Create map</span><span class="k">→</span></button>
              <button class="stm-btn" data-go="phases">${I.grid}<span>Phases</span></button>
              <button class="stm-btn" data-go="briefing">${I.book}<span>Briefing</span></button>
            </div>
            <div class="row rv" style="--i:8">
              <a class="stm-btn ghost" href="${raceHref}" data-race>${I.flag}<span>Race</span></a>
              <a class="stm-btn ghost" href="${demoHref}" data-demo>${I.go}<span>Demo lap</span></a>
              <a class="stm-btn ghost" href="${fallbackHref}">${I.grid}<span>${fallback ? 'Full office' : 'Simple room'}</span></a>
              <button class="stm-btn ghost" data-restart hidden>${I.reload}<span>Restart</span></button>
            </div>
          </div>
        </div>
        <aside class="stm-side">
          <div class="stm-card stm-spec rv" style="--i:4">
            <h3>The map</h3>
            <dl>
              <dt>Name</dt><dd data-m-name>${esc(mapName)}</dd>
              <dt>Boxes</dt><dd data-m-boxes>—</dd>
              <dt>Props to scatter</dt><dd data-m-props>—</dd>
              <dt>Footprint</dt><dd data-m-size>—</dd>
              <dt>Car</dt><dd>1:36<small>120 mm · 150 g</small></dd>
            </dl>
          </div>
        </aside>
      </section>

      <section class="stm-slide stm-create" data-slide="create" aria-label="Create a map">
        <div class="stm-head">
          <h2 class="stm-h2 rv" style="--i:0">Create <em>your map</em></h2>
          <p class="stm-sub rv" style="--i:1">Walk the room, take 5 to 10 photos from different corners, drop them here. Claude measures the space and lays out every surface for the car. Your key goes straight from this browser to api.anthropic.com and nowhere else.</p>
        </div>
        <div class="stm-cols">
          <div class="stm-card rv" style="--i:2">
            <h3 class="t">Photos</h3>
            <label class="stm-drop" data-drop tabindex="0">
              <input type="file" accept="image/*" multiple data-files>
              <span class="stm-chip count" data-count>0 / 10</span>
              <div>${I.camera}<h3>Drop photos here</h3><p>JPEG or PNG, wide shots beat close-ups. iPhone HEIC needs exporting first. Click or drag and drop.</p></div>
            </label>
            <div class="stm-thumbs" data-thumbs></div>
          </div>
          <div class="stm-card rv" style="--i:3">
            <h3 class="t">Generate</h3>
            <form class="stm-form" data-form novalidate>
              <div class="two">
                <div class="stm-field"><label for="stm-name">Map name</label><input class="stm-input" id="stm-name" data-name placeholder="Studio, kitchen, our office…" maxlength="40" autocomplete="off"></div>
                <div class="stm-field"><label for="stm-model">Model</label><select class="stm-input" id="stm-model" data-model>${MODELS.map(m => `<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></div>
              </div>
              <div class="two">
                <div class="stm-field"><label for="stm-w">Width · m <span>optional</span></label><input class="stm-input" id="stm-w" data-w type="number" min="1" max="60" step="0.1" placeholder="estimate"></div>
                <div class="stm-field"><label for="stm-d">Depth · m <span>optional</span></label><input class="stm-input" id="stm-d" data-d type="number" min="1" max="60" step="0.1" placeholder="estimate"></div>
              </div>
              <div class="stm-field">
                <label for="stm-key">Anthropic API key <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">get a key ↗</a></label>
                <div class="stm-keywrap"><input class="stm-input" id="stm-key" data-key type="password" placeholder="sk-ant-…" autocomplete="off" spellcheck="false"><button type="button" class="stm-eye" data-eye title="Show key">${I.eye}</button></div>
                <label class="stm-check"><input type="checkbox" data-remember> Remember the key on this device</label>
              </div>
              <div class="row">
                <button type="submit" class="stm-btn primary" data-generate>${I.spark}<span data-generate-label>Generate map</span></button>
                <button type="button" class="stm-btn ghost" data-cancel hidden>${I.x}<span>Cancel</span></button>
              </div>
              <div class="stm-log" data-log hidden></div>
            </form>
            <div class="stm-result" data-result hidden>
              <canvas width="420" height="316"></canvas>
              <div>
                <h4 data-r-name>Map</h4>
                <div class="stats"><div><b data-r-boxes>0</b><span>boxes</span></div><div><b data-r-props>0</b><span>props</span></div><div><b data-r-size>—</b><span>footprint</span></div><div><b data-r-tokens>—</b><span>tokens</span></div></div>
                <div class="row"><a class="stm-btn primary" data-r-drive>${I.go}<span>Drive this map</span></a><button type="button" class="stm-btn ghost" data-r-again>${I.reload}<span>Again</span></button></div>
                <p class="stm-note" data-r-warn></p>
              </div>
            </div>
          </div>
        </div>
        <div class="stm-card rv" style="--i:4"><h3 class="t">Your maps</h3><div class="stm-maps" data-maps></div></div>
      </section>

      <section class="stm-slide stm-phases" data-slide="phases" aria-label="Phases">
        <div class="stm-head">
          <h2 class="stm-h2 rv" style="--i:0">From photos to <em>a world</em></h2>
          <p class="stm-sub rv" style="--i:1">Three layers. Drive a generated room, generate your own from photos, then let the simulation improve the map by itself.</p>
        </div>
        <div class="stm-grid">
          <article class="stm-card stm-phase ready rv" style="--i:2">
            <span class="num">01</span>
            <div class="head"><span class="label">Phase 1</span><span class="stm-badge ready" data-p1-badge>${I.check} Ready</span></div>
            <div>
              <h3>Drive</h3>
              <p>A generated room you can drive right now: life-size boxes, a 1:36 RC car, a ramp you can climb and clutter you can scatter.</p>
              <ul><li>Rapier vehicle physics at 60 Hz</li><li>Minimap and speedometer HUD</li><li>Recovery, pause menu, demo lap</li></ul>
            </div>
            <div class="foot"><span class="eta">Live</span><button class="stm-btn" data-drive>${I.go}<span>Drive</span></button></div>
          </article>
          <article class="stm-card stm-phase ready rv" style="--i:3">
            <span class="num">02</span>
            <div class="head"><span class="label">Phase 2</span><span class="stm-badge ready">${I.check} Ready</span></div>
            <div>
              <h3>Time Attack</h3>
              <p>Three laps of the office circuit against three rivals, from a standing grid start with a countdown.</p>
              <ul><li>Three laps, ordered checkpoints</li><li>Three AI rivals on the racing line</li><li>Live lap, position and clock</li><li>Enter starts or retries, F frees the car</li></ul>
            </div>
            <div class="foot"><span class="eta">Grid start</span><a class="stm-btn" href="${raceHref}" data-race>${I.flag}<span>Race</span></a></div>
          </article>
          <article class="stm-card stm-phase ready rv" style="--i:4">
            <span class="num">03</span>
            <div class="head"><span class="label">Phase 3</span><span class="stm-badge beta">${I.camera} Beta</span></div>
            <div>
              <h3>Create</h3>
              <p>Your photos, your key, your map. Claude reads 5 to 10 shots and lays the room out for the car, right here in the browser.</p>
              <ul><li>Strict layout schema, validated and repaired</li><li>Saved in this browser, drive any time</li><li>Claude Opus 5 or Sonnet 5</li></ul>
            </div>
            <div class="foot"><span class="eta">Live now</span><button class="stm-btn" data-go="create">${I.camera}<span>Create</span></button></div>
          </article>
          <article class="stm-card stm-phase locked rv" style="--i:5">
            <span class="num">04</span>
            <div class="head"><span class="label">Phase 4</span><span class="stm-badge locked">${I.lock} Locked</span></div>
            <div>
              <h3>Iterate</h3>
              <p>The simulation drives itself. It runs the route, finds snags and blocked corridors, and asks Claude to fix the map until the lap is clean.</p>
              <ul><li>Autonomous test laps</li><li>Layout fixes from failures</li><li>A map that improves every run</li></ul>
            </div>
            <div class="foot"><span class="eta">Next</span><span class="stm-badge locked">Soon</span></div>
          </article>
        </div>
      </section>

      <section class="stm-slide stm-brief" data-slide="briefing" aria-label="Briefing">
        <div class="stm-head">
          <h2 class="stm-h2 rv" style="--i:0">Driver <em>briefing</em></h2>
          <p class="stm-sub rv" style="--i:1">Keyboard only. Steady throttle on a slope, no steering on the ramp, and the desk is yours.</p>
        </div>
        <div class="stm-cols">
          <div class="stm-card rv" style="--i:2">
            <h3 class="t">Controls</h3>
            <div class="stm-keys">
              <div class="stm-keyrow"><span class="what">Drive &amp; steer</span>
                <span class="stm-cluster">${keycap('W', 'key')}${keycap('A', 'key')}${keycap('S', 'key')}${keycap('D', 'key')}</span>
                <span class="stm-or">OR</span>
                <span class="stm-cluster">${keycap(I.up, 'key')}${keycap(I.arrL, 'key')}${keycap(I.down, 'key')}${keycap(I.arrR, 'key')}</span>
              </div>
              <div class="stm-keyrow"><span class="what">Brake</span>${keycap('Space', 'wide')}</div>
              <div class="stm-keyrow"><span class="what">Recover to spawn</span>${keycap('R', 'accent')}</div>
              <div class="stm-keyrow"><span class="what">Menu &amp; music</span>${keycap('Esc')}${keycap('M')}</div>
            </div>
          </div>
          <div class="stm-card rv" style="--i:3">
            <h3 class="t">The HUD</h3>
            <div class="stm-route">
              <div class="stm-step"><i>1</i><div><b>Minimap</b><span>Top right. North is up and the room stays put; in a race it also draws the loop and rings your next checkpoint.</span></div></div>
              <div class="stm-step hot"><i>2</i><div><b>Speedometer</b><span>Bottom right. Scale speed in km/h: the 1:36 car at 1.2 m/s is doing 155. D, R, N and a red B when braking.</span></div></div>
              <div class="stm-step"><i>3</i><div><b>Race panel</b><span>Top left. Lap, position and the running clock, once a race is under way.</span></div></div>
              <div class="stm-step"><i>4</i><div><b>Recovery</b><span>R puts the car back at spawn, heading and camera included. Reload restores every prop.</span></div></div>
            </div>
          </div>
        </div>
        <div class="stm-credits rv" style="--i:4">
          <span>Music: <a href="https://incompetech.com" target="_blank" rel="noopener">“Pamgaea” by Kevin MacLeod</a> (CC BY 4.0)</span><i class="dot"></i>
          <span>Three.js 0.169 · Rapier 0.14 · Claude API</span><i class="dot"></i>
          <span>Tanay &amp; Chirag</span>
        </div>
      </section>

    </div>
  </div>

  <nav class="stm-nav" aria-label="Menu pages">
    <span class="stm-build">Photos in · drivable world out</span>
    <div class="stm-pager">
      <button class="stm-arrow" data-prev aria-label="Previous">${I.left}</button>
      <div class="stm-dots" role="tablist">${SLIDES.map((s, i) => `<button class="stm-dot" role="tab" data-dot="${i}" aria-label="${s}" aria-current="${i === 0}"></button>`).join('')}</div>
      <button class="stm-arrow" data-next aria-label="Next">${I.right}</button>
    </div>
    <div class="stm-hints"><span><kbd>←</kbd><kbd>→</kbd>pages</span><span><kbd>Enter</kbd>drive</span><span><kbd>Esc</kbd>back</span></div>
  </nav>
  <div class="stm-toast" data-toast><i></i><span data-toast-text>Click or press a key for sound</span></div>`;
}

// ---------- UI sounds: tiny synthesized cues, no samples ----------
function createSfx() {
  let ctx = null;
  const ensure = () => {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };
  function blip(freq, dur, gain, type = 'sine', slide = 1) {
    const c = ensure(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  let noise = null;
  function whoosh(dir = 1) {
    const c = ensure(); if (!c) return;
    if (!noise) { noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(dir > 0 ? 500 : 2200, t); f.frequency.exponentialRampToValueAtTime(dir > 0 ? 2400 : 450, t + 0.22);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    s.connect(f).connect(g).connect(c.destination); s.start(t); s.stop(t + 0.3);
  }
  return {
    ensure,
    tick: () => blip(1500, 0.035, 0.035, 'sine', 0.85),
    confirm: () => { blip(620, 0.09, 0.09, 'triangle'); setTimeout(() => blip(930, 0.14, 0.09, 'triangle'), 70); },
    success: () => { blip(520, 0.1, 0.08, 'triangle'); setTimeout(() => blip(780, 0.1, 0.08, 'triangle'), 90); setTimeout(() => blip(1040, 0.18, 0.08, 'triangle'), 180); },
    back: () => blip(520, 0.1, 0.07, 'triangle', 0.7),
    error: () => blip(220, 0.25, 0.08, 'sawtooth', 0.6),
    whoosh,
  };
}

// ---------- procedural fallback loop, only if the MP3 cannot play ----------
function createSynthLoop(ctx) {
  const out = ctx.createGain(); out.gain.value = 0.35; out.connect(ctx.destination);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
  const lead = ctx.createBiquadFilter(); lead.type = 'lowpass'; lead.frequency.value = 2600; lead.connect(out);
  const noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const bpm = 128, eighth = 30 / bpm;
  const roots = [0, 0, 7, 7, 5, 5, 3, 3], arp = [0, 3, 7, 10, 12, 10, 7, 3];
  let next = ctx.currentTime + 0.05, i = 0;
  const tone = (f, t, dur, type, gain, dest) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.02); };
  const kick = t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.connect(g).connect(out); o.start(t); o.stop(t + 0.3); };
  const hat = (t, v) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + 0.06); };
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.4) {
      const bar = Math.floor(i / 8) % 8, s = i % 8, root = 110 * 2 ** (roots[bar] / 12);
      if (s % 4 === 0) kick(next);
      hat(next, s % 2 ? 0.22 : 0.1);
      if (s % 2 === 0) tone(root, next, eighth * 0.9, 'sawtooth', 0.16, lp);
      tone(root * 2 * 2 ** (arp[(i + bar) % 8] / 12), next, eighth * 0.8, 'square', 0.05, lead);
      next += eighth; i++;
    }
  }, 100);
  return { gain: out.gain, stop: () => { clearInterval(timer); out.disconnect(); } };
}

// ---------- music: the menu theme, handed over to the game's own loop on Drive ----------
// `game` is the audio.js handle index.html passes in (see the API block at the top of audio.js). It owns the
// GAMEPLAY music and the single mute state; this function owns the MENU theme. The two never play together:
// setLevel(GAME_VOL) fades this out and the game loop in, setLevel(MENU_VOL) does the reverse. Everything here
// still works when `game` is absent (the module failed to load, or a page mounts the menu on its own).
function createMusic(sfx, button, showToast, game = null) {
  const audio = new Audio(new URL('./audio/menu-theme.mp3', here).href);
  audio.loop = true; audio.preload = 'auto'; audio.volume = 0;
  let enabled = localStorage.getItem(MUSIC_KEY) !== '0';
  let inGame = false;
  game?.setMuted(!enabled);          // the stored preference is the shared state's starting value
  game?.setMusicPlaying(false, 0);   // the menu is open: the gameplay loop stays down until Drive
  let wanted = MENU_VOL, target = 0, current = 0, raf = 0, unlocked = false, broken = false, synth = null;
  audio.addEventListener('error', () => { broken = true; if (unlocked && enabled) startSynth(); });
  function startSynth() {
    const c = sfx.ensure(); if (!c || synth) return;
    synth = createSynthLoop(c); synth.gain.value = wanted * 0.9;
  }
  function tick() {
    current += (target - current) * 0.07;
    if (Math.abs(target - current) < 0.004) current = target;
    audio.volume = Math.max(0, Math.min(1, current));
    if (synth) synth.gain.value = current * 0.9;
    if (current === 0 && target === 0 && !audio.paused) audio.pause();
    if (current !== target) raf = requestAnimationFrame(tick);
  }
  function fadeTo(v) {
    target = v; cancelAnimationFrame(raf);
    if (v > 0 && unlocked) {
      if (broken) startSynth();
      else if (audio.paused) audio.play().catch(() => { broken = true; startSynth(); });
    }
    raf = requestAnimationFrame(tick);
  }
  function render() { button.setAttribute('aria-pressed', String(enabled)); button.title = enabled ? 'Music on (M)' : 'Music off (M)'; }
  // If anything else changes the shared mute state (the page's own M handler when no menu is mounted, a future
  // settings screen), the button follows it rather than drifting out of sync.
  game?.subscribe(({ muted }) => {
    if (muted === !enabled) return;
    enabled = !muted;
    localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0');
    render();
    fadeTo(enabled && !inGame ? wanted : 0);
  });
  function unlock() { if (unlocked) return; unlocked = true; if (enabled) fadeTo(wanted); }
  audio.play().then(() => { unlocked = true; if (enabled) fadeTo(wanted); else audio.pause(); })
    .catch(() => { if (enabled) showToast('Click or press a key for sound'); });
  render();
  return {
    unlock,
    // level is MENU_VOL while the menu is up and GAME_VOL once the game has control. With a game handle the
    // theme steps aside completely for the gameplay loop instead of ducking under it.
    setLevel(level) {
      wanted = level;
      inGame = game ? level !== MENU_VOL : false;
      if (game) { game.unlock(); game.setMusicPlaying(inGame && enabled); }
      if (enabled && unlocked) fadeTo(inGame ? 0 : wanted);
    },
    toggle() {
      enabled = !enabled;
      localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0');
      render();
      game?.setMuted(!enabled);          // one state for the menu theme, the engine, the effects and the loop
      if (enabled) { unlock(); game?.setMusicPlaying(inGame); fadeTo(inGame ? 0 : wanted); showToast('Sound on'); }
      else { fadeTo(0); showToast('Sound off'); }
    },
    get enabled() { return enabled; },
  };
}

// ---------- animated backdrop: perspective carpet grid + speed streaks ----------
function createBackdrop(canvas) {
  const ctx = canvas.getContext('2d');
  let running = false, raf = 0, w = 0, h = 0, last = 0, scene = false, resizeQueued = true;
  const streaks = Array.from({ length: 28 }, () => ({ x: Math.random() * 1.4, y: Math.random(), len: 90 + Math.random() * 240, sp: 0.35 + Math.random() * 0.6, a: 0.05 + Math.random() * 0.12 }));
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth || innerWidth; h = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); resizeQueued = false;
  }
  addEventListener('resize', () => { resizeQueued = true; });
  function draw(now) {
    if (resizeQueued) resize();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    const t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    const horizon = h * 0.56, vpx = w * 0.66, dim = scene ? 0.6 : 1;
    const band = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 90);
    band.addColorStop(0, 'rgba(255,120,40,0)'); band.addColorStop(0.5, `rgba(255,130,50,${0.16 * dim})`); band.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = band; ctx.fillRect(0, horizon - 60, w, 150);
    const rows = 20, scroll = (t * 0.32) % 1;
    ctx.lineWidth = 1;
    for (let k = 0; k < rows; k++) {
      const d = ((k / rows) + scroll) % 1;
      const y = horizon + (h - horizon) * d ** 2.5;
      ctx.strokeStyle = `rgba(255,140,60,${(0.04 + d ** 1.3 * 0.3) * dim})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let i = -16; i <= 16; i++) {
      const g = ctx.createLinearGradient(0, horizon, 0, h);
      g.addColorStop(0, 'rgba(255,140,60,0)'); g.addColorStop(1, `rgba(255,140,60,${0.26 * dim})`);
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(vpx, horizon); ctx.lineTo(vpx + i * w * 0.115, h); ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    for (const s of streaks) {
      s.x -= s.sp * dt * 1.6;
      if (s.x < -0.35) { s.x = 1.1 + Math.random() * 0.3; s.y = Math.random(); s.len = 90 + Math.random() * 240; }
      const x = s.x * w, y = h * 0.08 + s.y * h * 0.62;
      const g = ctx.createLinearGradient(x, y, x + s.len, y);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${s.a * dim})`);
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.len, y); ctx.stroke();
    }
    if (running && !reducedMotion) raf = requestAnimationFrame(draw);
  }
  return {
    start() { if (running) return; running = true; last = 0; resizeQueued = true; raf = requestAnimationFrame(draw); },
    stop() { running = false; cancelAnimationFrame(raf); },
    setScene(v) { scene = v; },
  };
}

export function mountMenu({ statusEl = null, onChange = () => {}, audio: game = null, actions = {} } = {}) {
  const params = new URLSearchParams(location.search);
  const fallback = params.has('fallback');
  const currentMapId = params.get('map') || '';
  const currentMap = currentMapId ? listMaps().find(m => m.id === currentMapId) : null;
  const mapName = currentMap?.name || (fallback ? 'Simple room' : 'The Office');
  // MODES are the params that pick what the page does on load. Every link clears all of them before setting
  // its own, so they can never stack up (?mode=race&demo=1 was reachable by clicking Race then Demo lap).
  const MODES = ['mode', 'demo', 'menu', 'go', 'nomenu'];
  const withParams = (changes) => {
    const p = new URLSearchParams(location.search);
    for (const k of MODES) p.delete(k);
    for (const [k, v] of Object.entries(changes)) { if (v === null) p.delete(k); else p.set(k, v); }
    const q = p.toString();
    return location.pathname + (q ? `?${q}` : '');
  };
  const homeHref = () => { const p = new URLSearchParams(location.search); for (const k of MODES) p.delete(k); const q = p.toString(); return location.pathname + (q ? `?${q}` : ''); };

  if (!document.querySelector('link[data-stm-fonts]')) {
    for (const [rel, href, extra] of [
      ['preconnect', 'https://fonts.googleapis.com'], ['preconnect', 'https://fonts.gstatic.com', 'anonymous'],
      ['stylesheet', 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,700;1,800;1,900&family=Barlow:wght@500;600;700;800&display=swap'],
    ]) { const l = document.createElement('link'); l.rel = rel; l.href = href; if (extra) l.crossOrigin = extra; l.dataset.stmFonts = ''; document.head.append(l); }
  }
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./menu.css', here).href;
  document.head.append(css);
  if (!document.querySelector('link[rel~="icon"]')) {
    const icon = document.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml';
    icon.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff2d78"/></linearGradient></defs><path d="M14 4h46l-10 56H4z" fill="url(#g)"/><path d="M26 16h8v8h-8zM34 24h8v8h-8zM26 32h8v8h-8zM34 40h8v8h-8zM18 24h8v8h-8zM18 40h8v8h-8z" fill="#fff" fill-opacity=".92"/></svg>');
    document.head.append(icon);
  }

  const root = document.createElement('div');
  root.className = 'stm'; root.hidden = true; root.dataset.slide = 'home';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Snap the Room menu');
  root.innerHTML = template({
    fallback, mapName,
    raceHref: withParams({ mode: 'race' }),
    demoHref: withParams({ demo: '1' }),
    fallbackHref: fallback ? withParams({ fallback: null, map: null }) : withParams({ fallback: '1', map: null }),
  });
  document.body.append(root);
  document.body.classList.add('stm-open');
  const reveal = () => { root.hidden = false; };
  css.addEventListener('load', reveal); css.addEventListener('error', reveal); setTimeout(reveal, 1500);

  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const track = $('.stm-track'), slides = $$('.stm-slide'), dots = $$('[data-dot]');
  const primary = $('[data-primary]'), primaryLabel = $('[data-primary-label]');
  const status = $('[data-status]'), statusText = $('[data-status-text]');
  const chip = $('[data-chip]'), chipText = $('[data-chip-text]');
  const toast = $('[data-toast]'), toastText = $('[data-toast-text]');
  const restart = $('[data-restart]'), driveCard = $('[data-drive]');

  const sfx = createSfx();
  let toastTimer = 0;
  const showToast = (text, ms = 2600) => { toastText.textContent = text; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), ms); };
  const music = createMusic(sfx, $('[data-music]'), showToast, game);
  const backdrop = createBackdrop($('.stm-bg'));

  let open = true, ready = false, started = false, index = 0, closing = 0;

  function go(i, dir = Math.sign(i - index) || 1) {
    i = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (i === index && slides[i].classList.contains('is-active')) return;
    index = i; root.dataset.slide = SLIDES[i];
    track.style.transform = `translateX(${-100 * i}%)`;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); if (k === i) s.removeAttribute('inert'); else s.setAttribute('inert', ''); });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    $('[data-prev]').disabled = i === 0; $('[data-next]').disabled = i === SLIDES.length - 1;
    sfx.whoosh(dir > 0 ? 1 : -1);
    const focus = slides[i].querySelector(i === 0 ? '[data-primary]' : i === 1 ? '[data-drop]' : 'button, a');
    focus?.focus({ preventScroll: true });
    slides[i].scrollTop = 0;
  }
  function setStatus(text) { statusText.textContent = text; }

  function doOpen() {
    if (open) return;
    open = true; clearTimeout(closing);
    root.hidden = false; root.classList.remove('is-closing');
    document.body.classList.add('stm-open');
    chip.classList.toggle('paused', started); chipText.textContent = started ? 'Paused' : `Map · ${mapName}`;
    primaryLabel.textContent = started ? 'Resume' : 'Drive';
    if (started) setStatus('Paused · Enter resumes · Esc closes');
    restart.hidden = !started;
    backdrop.start(); music.setLevel(MENU_VOL);
    slides[index].classList.remove('is-active'); go(0);
    onChange(true);
  }
  function doClose({ force = false } = {}) {
    if (!open) return;
    if (!ready && !force) return;
    open = false;
    if (!force) { started = true; sfx.confirm(); }
    onChange(false);
    root.classList.add('is-closing');
    music.setLevel(GAME_VOL);
    closing = setTimeout(() => { root.hidden = true; document.body.classList.remove('stm-open'); backdrop.stop(); }, force ? 0 : 430);
  }
  function primaryAction() { if (ready) doClose(); else showToast('Still loading the room'); }

  // ---------- wiring ----------
  primary.addEventListener('click', primaryAction);
  driveCard.addEventListener('click', primaryAction);
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(SLIDES.indexOf(b.dataset.go))));
  $('[data-prev]').addEventListener('click', () => go(index - 1));
  $('[data-next]').addEventListener('click', () => go(index + 1));
  dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.dot))));
  restart.addEventListener('click', () => { location.href = homeHref(); }); // home, not location.reload(): reloading ?mode=race just restarted the race
  $('[data-music]').addEventListener('click', () => music.toggle());
  // In place, so the page never navigates into a URL whose params suppress this menu.
  for (const [sel, run] of [['[data-race]', () => actions.race], ['[data-demo]', () => actions.demo]]) {
    $$(sel).forEach(el => el.addEventListener('click', e => {
      const fn = run();
      if (!fn || e.metaKey || e.ctrlKey || e.shiftKey) return; // no handler, or the user asked for a new tab
      e.preventDefault();
      if (!ready) { showToast('Still loading the room'); return; }
      doClose();
      fn();
    }));
  }
  $$('button, a, .stm-phase').forEach(el => el.addEventListener('pointerenter', () => sfx.tick()));
  root.addEventListener('click', e => { if (e.target.closest?.('button, a') && !e.target.closest('[data-primary], [data-drive], [data-generate]')) sfx.tick(); });

  const unlock = () => { sfx.ensure(); music.unlock(); game?.unlock(); toast.classList.remove('show'); };
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);

  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select')) {
      if (e.code !== 'Escape' || !open) return; // typing: leave arrows and Enter to the field
      e.target.blur(); // Escape leaves the field and falls through to the normal back behaviour
    }
    if (e.code === 'KeyM' && !e.repeat) { music.toggle(); return; }
    if (!open) {
      if (e.code === 'Escape' && started) { e.preventDefault(); doOpen(); }
      return;
    }
    switch (e.code) {
      case 'ArrowRight': e.preventDefault(); go(index + 1); break;
      case 'ArrowLeft': e.preventDefault(); go(index - 1); break;
      case 'Enter': case 'NumpadEnter':
        if (e.target.closest?.('button, a, label')) return;
        e.preventDefault(); if (index === 0) primaryAction(); else go(0); break;
      case 'Escape':
        e.preventDefault();
        if (index !== 0) { sfx.back(); go(0, -1); } else if (started && ready) doClose();
        break;
    }
  }, true);

  if (statusEl) {
    const sync = () => { if (!ready) setStatus(statusEl.textContent.replace(/[.…]+$/, '')); };
    new MutationObserver(sync).observe(statusEl, { childList: true, characterData: true, subtree: true });
    sync();
  }

  // ---------- create page ----------
  const photos = []; // { file, url }
  const drop = $('[data-drop]'), files = $('[data-files]'), thumbs = $('[data-thumbs]'), count = $('[data-count]');
  const form = $('[data-form]'), nameIn = $('[data-name]'), modelIn = $('[data-model]'), wIn = $('[data-w]'), dIn = $('[data-d]');
  const keyIn = $('[data-key]'), remember = $('[data-remember]'), generate = $('[data-generate]'), generateLabel = $('[data-generate-label]'), cancel = $('[data-cancel]');
  const log = $('[data-log]'), result = $('[data-result]'), mapsEl = $('[data-maps]');
  const savedKey = localStorage.getItem(KEY_STORE);
  if (savedKey) { keyIn.value = savedKey; remember.checked = true; }
  nameIn.value = `Room ${listMaps().length + 1}`;
  let controller = null;

  function renderPhotos() {
    thumbs.innerHTML = photos.map((p, i) => `<div class="stm-thumb"><img src="${p.url}" alt=""><span class="n">${i + 1}</span><button type="button" class="stm-x rm" data-rm="${i}" title="Remove">${I.x}</button></div>`).join('');
    count.textContent = `${photos.length} / 10`;
    thumbs.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); const i = Number(b.dataset.rm); URL.revokeObjectURL(photos[i].url); photos.splice(i, 1); renderPhotos(); }));
  }
  function addFiles(list) {
    let added = 0;
    for (const f of list) {
      if (!f.type.startsWith('image/') && !/\.(heic|heif)$/i.test(f.name)) continue;
      if (photos.length >= 10) { showToast('Ten photos is plenty'); break; }
      photos.push({ file: f, url: URL.createObjectURL(f) }); added++;
    }
    if (added) renderPhotos(); else showToast('Drop image files');
  }
  files.addEventListener('change', () => { addFiles(files.files); files.value = ''; });
  for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); });
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  drop.addEventListener('keydown', e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); files.click(); } });
  $('[data-eye]').addEventListener('click', () => { keyIn.type = keyIn.type === 'password' ? 'text' : 'password'; });

  function logReset() { log.innerHTML = ''; log.hidden = false; }
  let lastStep = null;
  function logStep(text) {
    if (lastStep) lastStep.classList.add('done');
    lastStep = document.createElement('div'); lastStep.className = 'step'; lastStep.innerHTML = `<i></i><span>${esc(text)}</span>`; log.append(lastStep);
    thought.hidden = true; log.append(thought);
  }
  const thought = document.createElement('div'); thought.className = 'thought'; thought.hidden = true;
  function logThought(text) { thought.textContent = text; thought.hidden = false; }
  function logError(text) { if (lastStep) lastStep.classList.add('err'); const d = document.createElement('div'); d.className = 'step err'; d.innerHTML = `<i></i><span>${esc(text)}</span>`; log.append(d); thought.hidden = true; }

  function renderMaps() {
    const saved = listMaps();
    const builtin = [
      { id: '', name: 'The Office', note: 'Built in · 646 boxes · 12 props', href: withParams({ map: null, fallback: null, menu: null, go: null }), current: !currentMapId && !fallback },
      { id: 'fallback', name: 'Simple room', note: 'Built in · tested fallback', href: withParams({ map: null, fallback: '1', menu: null, go: null }), current: !currentMapId && fallback },
    ];
    mapsEl.innerHTML = [
      ...builtin.map(m => `<div class="stm-maprow${m.current ? ' current' : ''}"><div><b>${esc(m.name)}</b><small>${esc(m.note)}</small></div><a class="stm-btn ghost" href="${m.href}">${I.go}<span>${m.current ? 'Loaded' : 'Load'}</span></a><span></span></div>`),
      ...saved.map(m => `<div class="stm-maprow${m.id === currentMapId ? ' current' : ''}"><div><b>${esc(m.name)}</b><small>${m.counts?.boxes ?? '?'} boxes · ${m.counts?.props ?? 0} props · ${new Date(m.createdAt).toLocaleDateString()}${m.model ? ' · ' + esc(m.model.replace('claude-', '')) : ''}</small></div><a class="stm-btn ghost" href="${withParams({ map: m.id, fallback: null, menu: null, go: null })}">${I.go}<span>${m.id === currentMapId ? 'Loaded' : 'Load'}</span></a><button type="button" class="stm-x" data-del="${m.id}" title="Delete">${I.trash}</button></div>`),
    ].join('');
    mapsEl.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { deleteMap(b.dataset.del); renderMaps(); showToast('Map deleted'); }));
    if (!saved.length) mapsEl.insertAdjacentHTML('beforeend', '<p class="stm-note">Maps you generate are saved in this browser and listed here.</p>');
  }
  renderMaps();

  function setBusy(busy) {
    generate.disabled = busy; generate.classList.toggle('is-loading', busy);
    generateLabel.textContent = busy ? 'Generating' : 'Generate map';
    cancel.hidden = !busy;
    [nameIn, modelIn, wIn, dIn, keyIn, remember, files].forEach(el => { el.disabled = busy; });
  }
  cancel.addEventListener('click', () => controller?.abort());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const apiKey = keyIn.value.trim();
    result.hidden = true; logReset(); lastStep = null;
    if (!photos.length) { logError('Add at least one photo of the room. Five to ten from different corners works best.'); sfx.error(); return; }
    if (!apiKey) { logError('Paste your Anthropic API key. It is sent only to api.anthropic.com from this browser.'); sfx.error(); keyIn.focus(); return; }
    if (remember.checked) localStorage.setItem(KEY_STORE, apiKey); else localStorage.removeItem(KEY_STORE);
    if (photos.length < 5) showToast(`${photos.length} photo${photos.length === 1 ? '' : 's'} · five or more gives a better layout`, 3200);
    const w = Number(wIn.value), d = Number(dIn.value);
    const size = w > 0 && d > 0 ? [w, d] : null;
    controller = new AbortController();
    setBusy(true);
    const t0 = performance.now();
    const meta = document.createElement('div'); meta.className = 'meta';
    const tickTimer = setInterval(() => { meta.textContent = `${Math.round((performance.now() - t0) / 1000)} s`; }, 1000);
    log.append(meta);
    try {
      const { map, warnings, usage, model } = await generateMap({
        files: photos.map(p => p.file), apiKey, model: modelIn.value, name: nameIn.value.trim() || 'My room', size, signal: controller.signal,
        onStatus: s => { logStep(s); log.append(meta); }, onThought: logThought,
      });
      const id = saveMap(map, { model });
      logStep(`Saved “${map.name}” in ${Math.round((performance.now() - t0) / 1000)} s`); lastStep.classList.add('done');
      thought.hidden = true;
      drawOverview(result.querySelector('canvas'), map.ROOM, map.PROPS, map.SPAWN);
      $('[data-r-name]').textContent = map.name;
      $('[data-r-boxes]').textContent = String(map.ROOM.length);
      $('[data-r-props]').textContent = String(map.PROPS.length);
      $('[data-r-size]').textContent = `${map.size[0].toFixed(1)} × ${map.size[1].toFixed(1)} m`;
      $('[data-r-tokens]').textContent = usage ? `${Math.round(((usage.input_tokens || 0) + (usage.output_tokens || 0)) / 1000)}k` : '—';
      $('[data-r-drive]').href = withParams({ map: id, fallback: null, menu: null, go: '1' });
      $('[data-r-warn]').textContent = warnings.length ? `Fixed on the way in: ${warnings.join('; ')}.` : 'Clean layout, nothing had to be repaired.';
      result.hidden = false;
      renderMaps(); nameIn.value = `Room ${listMaps().length + 1}`;
      sfx.success();
      result.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch (error) {
      logError(error.message || String(error)); sfx.error();
    } finally {
      clearInterval(tickTimer); setBusy(false); controller = null;
    }
  });
  $('[data-r-again]').addEventListener('click', () => { result.hidden = true; form.requestSubmit(); });

  slides[0].classList.add('is-active'); slides.slice(1).forEach(s => s.setAttribute('inert', ''));
  $('[data-prev]').disabled = true;
  backdrop.start();
  const initial = SLIDES.indexOf(params.get('menu'));
  if (initial > 0) { slides[0].classList.remove('is-active'); go(initial); }
  else requestAnimationFrame(() => primary.focus({ preventScroll: true }));

  return {
    open: doOpen,
    close: doClose,
    isOpen: () => open,
    setReady(info = {}) {
      if (ready) return; ready = true;
      primary.classList.remove('is-loading'); primary.classList.add('is-ready');
      primaryLabel.textContent = started ? 'Resume' : 'Drive';
      status.classList.add('ready'); setStatus('Ready · press Enter to drive');
      root.classList.add('has-scene'); backdrop.setScene(true);
      if (info.name) { $('[data-m-name]').textContent = info.name; if (!started) chipText.textContent = `Map · ${info.name}`; }
      if (info.boxes != null) $('[data-m-boxes]').textContent = String(info.boxes);
      if (info.props != null) $('[data-m-props]').textContent = String(info.props);
      if (info.size) $('[data-m-size]').innerHTML = `${(+info.size[0]).toFixed(1)} × ${(+info.size[1]).toFixed(1)}<small>m</small>`;
      if (params.has('go') && open) setTimeout(() => doClose(), 350);
    },
    setStatus,
    music,
  };
}
