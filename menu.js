// menu.js — Snap the Room front-end menu (B track).
// Self-contained: injects its own stylesheet, fonts, DOM, music and UI sounds. index.html mounts it with
// one call and stays otherwise untouched.
//
//   import { mountMenu } from './menu.js';
//   const menu = mountMenu({ statusEl, onChange(open) });  // shows at once, before the engine boots
//   menu.setReady();      // flips DRIVE from "Loading" to ready once the world exists
//   menu.isOpen();        // engine: keep physics paused and run the cinematic camera while true
//   menu.open(); menu.close({ force });
//
// Keys while open: ← → slides · Enter primary action · Esc back / resume · M music · F fullscreen.
// In game: Esc reopens the menu (pause). M still toggles music.

const SLIDES = ['home', 'phases', 'briefing'];
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
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
  flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h11l-1.5 3L16 10H5"/></svg>',
};

const keycap = (label, cls = '') => `<span class="stm-key ${cls}">${label}</span>`;

function template({ fallback, raceHref, demoHref, fallbackHref }) {
  return `
  <div class="stm-ink"></div>
  <canvas class="stm-bg" aria-hidden="true"></canvas>
  <div class="stm-glow a"></div><div class="stm-glow b"></div><div class="stm-glow c"></div>
  <div class="stm-scrim"></div><div class="stm-vignette"></div>

  <div class="stm-chrome">
    <div class="stm-brand"><i class="stm-flag"></i><b>Snap the Room</b><span class="stm-chip" data-chip><i></i><span data-chip-text>Phase 1 · Build Day Delhi</span></span></div>
    <div class="stm-tools">
      <button class="stm-icon" data-music aria-pressed="true" title="Music (M)"><span class="stm-eq"><i></i><i></i><i></i><i></i></span><span>Music</span></button>
      <button class="stm-icon" data-full title="Fullscreen (F)">${I.full}<span>Fullscreen</span></button>
    </div>
  </div>

  <div class="stm-viewport">
    <div class="stm-track">

      <section class="stm-slide stm-home" data-slide="home" aria-label="Start">
        <div class="stm-hero">
          <div class="stm-stripes rv" style="--i:0"><i></i><i></i><i></i></div>
          <p class="stm-kicker rv" style="--i:1">A mouse-sized RC car · an office-sized playground</p>
          <h1 class="stm-title">
            <span class="w1 rv" style="--i:2">Snap</span>
            <span class="w2 rv" style="--i:3" data-text="the Room">the Room</span>
          </h1>
          <p class="stm-tag rv" style="--i:4">Thread the carpet aisle, climb the <b>17° ramp</b> onto a real desk, turn through the divider gap and come back down to <b>scatter the cups</b>. Phases 1 and 2 are live. Phase 3 is on the grid.</p>
          <div class="stm-actions">
            <button class="stm-btn primary is-loading rv" style="--i:5" data-primary>${I.go}<span data-primary-label>Loading</span><span class="k">Enter</span></button>
            <div class="stm-status rv" style="--i:6" data-status><i></i><span data-status-text>Starting the room and car</span></div>
            <div class="row rv" style="--i:7">
              <button class="stm-btn" data-go="phases">${I.grid}<span>Phases</span><span class="k">→</span></button>
              <button class="stm-btn" data-go="briefing">${I.book}<span>Briefing</span><span class="k">→</span></button>
            </div>
            <div class="row rv" style="--i:8">
              <a class="stm-btn ghost" href="${raceHref}">${I.flag}<span>Race</span></a>
              <a class="stm-btn ghost" href="${demoHref}">${I.go}<span>Demo lap</span></a>
              <a class="stm-btn ghost" href="${fallbackHref}">${I.grid}<span>${fallback ? 'Full office' : 'Simple room'}</span></a>
              <button class="stm-btn ghost" data-restart hidden>${I.reload}<span>Restart</span></button>
            </div>
          </div>
        </div>
        <aside class="stm-side">
          <div class="stm-card stm-spec rv" style="--i:4">
            <h3>The car</h3>
            <dl>
              <dt>Scale</dt><dd>1:36</dd>
              <dt>Body length</dt><dd>120<small>mm</small></dd>
              <dt>Mass</dt><dd>150<small>g</small></dd>
              <dt>Drive</dt><dd>Rear<small>wheel</small></dd>
              <dt>Top speed</dt><dd>1.2<small>m/s</small></dd>
              <dt>Desk height</dt><dd>6.25<small>car lengths</small></dd>
            </dl>
          </div>
        </aside>
      </section>

      <section class="stm-slide stm-phases" data-slide="phases" aria-label="Phases">
        <div class="stm-head">
          <h2 class="stm-h2 rv" style="--i:0">Pick your <em>phase</em></h2>
          <p class="stm-sub rv" style="--i:1">One route, built in layers. Phase 1 is the rehearsed floor-to-desk run. The next two unlock as the car earns them.</p>
        </div>
        <div class="stm-grid">
          <article class="stm-card stm-phase ready rv" style="--i:2">
            <span class="num">01</span>
            <div class="head"><span class="label">Phase 1</span><span class="stm-badge ready" data-p1-badge>${I.check} Ready</span></div>
            <div>
              <h3>The Climb</h3>
              <p>Spawn on the carpet, drive the aisle, climb onto the desktop, turn through the divider gap and drop back down onto the cups.</p>
              <ul><li>Life-size office, 1:36 car</li><li>17° bench-end ramp, both directions</li><li>Twelve lightweight props to scatter</li><li>R recovers, Esc pauses</li></ul>
            </div>
            <div class="foot"><span class="eta">Rehearsed route</span><button class="stm-btn" data-drive>${I.go}<span>Drive</span></button></div>
          </article>
          <article class="stm-card stm-phase ready rv" style="--i:3">
            <span class="num">02</span>
            <div class="head"><span class="label">Phase 2</span><span class="stm-badge ready">${I.check} Ready</span></div>
            <div>
              <h3>Time Attack</h3>
              <p>Three laps of the office circuit against three rivals, from a standing grid start with a countdown.</p>
              <ul><li>Three laps, ordered checkpoints</li><li>Three AI rivals on the racing line</li><li>Live lap, position and clock</li><li>Enter starts or retries, F frees the car</li></ul>
            </div>
            <div class="foot"><span class="eta">Grid start</span><a class="stm-btn" href="${raceHref}">${I.flag}<span>Race</span></a></div>
          </article>
          <article class="stm-card stm-phase locked rv" style="--i:4">
            <span class="num">03</span>
            <div class="head"><span class="label">Phase 3</span><span class="stm-badge locked">${I.lock} Locked</span></div>
            <div>
              <h3>Office Chaos</h3>
              <p>Everything gets a mass. Arcade-weight chairs scatter, skid marks stay on the carpet, and the replay camera catches it all.</p>
              <ul><li>Dynamic chairs and more clutter</li><li>Skid marks, dust and engine audio</li><li>Alternate cameras and slow motion</li></ul>
            </div>
            <div class="foot"><span class="eta">Hour three</span><span class="stm-badge locked">Stretch</span></div>
          </article>
        </div>
      </section>

      <section class="stm-slide stm-brief" data-slide="briefing" aria-label="Briefing">
        <div class="stm-head">
          <h2 class="stm-h2 rv" style="--i:0">Driver <em>briefing</em></h2>
          <p class="stm-sub rv" style="--i:1">Keyboard only. Steady throttle on the slope, no steering on the ramp, and the desk is yours.</p>
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
              <div class="stm-keyrow"><span class="what">Menu · music · fullscreen</span>${keycap('Esc')}${keycap('M')}${keycap('F')}</div>
            </div>
          </div>
          <div class="stm-card rv" style="--i:3">
            <h3 class="t">The route</h3>
            <div class="stm-route">
              <div class="stm-step"><i>1</i><div><b>Spawn</b><span>West end, on the olive accent run, facing east down the aisle.</span></div></div>
              <div class="stm-step"><i>2</i><div><b>Aisle</b><span>Drive between the white desk runs. The divider gap pitch is chair-free if you want to pass under.</span></div></div>
              <div class="stm-step hot"><i>3</i><div><b>Ramp</b><span>Back at spawn turn left, line up on the beige plate and climb with steady throttle. No steering on the slope.</span></div></div>
              <div class="stm-step"><i>4</i><div><b>Desktop</b><span>Follow the lane east to the olive mat, turn through the gap or U-turn on the mat.</span></div></div>
              <div class="stm-step"><i>5</i><div><b>Cups</b><span>Straight back down the ramp, left to the olive square, and scatter everything.</span></div></div>
            </div>
          </div>
        </div>
        <div class="stm-credits rv" style="--i:4">
          <span>Music: <a href="https://incompetech.com" target="_blank" rel="noopener">“Pamgaea” by Kevin MacLeod</a> (CC BY 4.0)</span><i class="dot"></i>
          <span>Three.js 0.169 · Rapier 0.14</span><i class="dot"></i>
          <span>Claude Build Day Delhi · Tanay &amp; Chirag</span>
        </div>
      </section>

    </div>
  </div>

  <nav class="stm-nav" aria-label="Menu pages">
    <span class="stm-build">Snap the Room · v0.9 · Phase 1</span>
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
    back: () => blip(520, 0.1, 0.07, 'triangle', 0.7),
    whoosh,
    context: () => ctx,
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

// ---------- music: one looping track, faded between menu and game levels ----------
function createMusic(sfx, button, showToast) {
  const audio = new Audio(new URL('./audio/menu-theme.mp3', here).href);
  audio.loop = true; audio.preload = 'auto'; audio.volume = 0;
  let enabled = localStorage.getItem(MUSIC_KEY) !== '0';
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
  function unlock() {
    if (unlocked) return; unlocked = true;
    if (enabled) fadeTo(wanted);
  }
  // Autoplay may already be allowed (engaged origin). Try quietly; otherwise wait for the first gesture.
  audio.play().then(() => { unlocked = true; if (enabled) fadeTo(wanted); else audio.pause(); })
    .catch(() => { if (enabled) showToast('Click or press a key for sound'); });
  render();
  return {
    unlock,
    setLevel(level) { wanted = level; if (enabled && unlocked) fadeTo(level); },
    toggle() {
      enabled = !enabled; localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0'); render();
      if (enabled) { unlock(); fadeTo(wanted); showToast('Music on'); } else { fadeTo(0); showToast('Music off'); }
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
    // horizon glow band
    const band = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 90);
    band.addColorStop(0, 'rgba(255,120,40,0)'); band.addColorStop(0.5, `rgba(255,130,50,${0.16 * dim})`); band.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = band; ctx.fillRect(0, horizon - 60, w, 150);
    // rows sliding toward the viewer
    const rows = 20, scroll = (t * 0.32) % 1;
    ctx.lineWidth = 1;
    for (let k = 0; k < rows; k++) {
      const d = ((k / rows) + scroll) % 1;
      const y = horizon + (h - horizon) * d ** 2.5;
      ctx.strokeStyle = `rgba(255,140,60,${(0.04 + d ** 1.3 * 0.3) * dim})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // converging columns
    for (let i = -16; i <= 16; i++) {
      const g = ctx.createLinearGradient(0, horizon, 0, h);
      g.addColorStop(0, 'rgba(255,140,60,0)'); g.addColorStop(1, `rgba(255,140,60,${0.26 * dim})`);
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(vpx, horizon); ctx.lineTo(vpx + i * w * 0.115, h); ctx.stroke();
    }
    // speed streaks, right to left
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

export function mountMenu({ statusEl = null, onChange = () => {} } = {}) {
  const params = new URLSearchParams(location.search);
  const fallback = params.has('fallback');
  const withParam = (key, value) => { const p = new URLSearchParams(location.search); if (value === null) p.delete(key); else p.set(key, value); const q = p.toString(); return location.pathname + (q ? `?${q}` : ''); };

  // Styles and fonts. The root stays hidden until the stylesheet is in, so there is no unstyled flash.
  if (!document.querySelector('link[data-stm-fonts]')) {
    for (const [rel, href, extra] of [
      ['preconnect', 'https://fonts.googleapis.com'], ['preconnect', 'https://fonts.gstatic.com', 'anonymous'],
      ['stylesheet', 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,700;1,800;1,900&family=Barlow:wght@500;600;700&display=swap'],
    ]) { const l = document.createElement('link'); l.rel = rel; l.href = href; if (extra) l.crossOrigin = extra; l.dataset.stmFonts = ''; document.head.append(l); }
  }
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./menu.css', here).href;
  document.head.append(css);
  if (!document.querySelector('link[rel~="icon"]')) {
    // Tab icon: a skewed orange tile with a checkered corner, matching the brand flag.
    const icon = document.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml';
    icon.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff2d78"/></linearGradient></defs><path d="M14 4h46l-10 56H4z" fill="url(#g)"/><path d="M26 16h8v8h-8zM34 24h8v8h-8zM26 32h8v8h-8zM34 40h8v8h-8zM18 24h8v8h-8zM18 40h8v8h-8z" fill="#fff" fill-opacity=".92"/></svg>');
    document.head.append(icon);
  }

  const root = document.createElement('div');
  root.className = 'stm'; root.hidden = true; root.dataset.slide = 'home';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Snap the Room menu');
  root.innerHTML = template({ fallback, raceHref: withParam('mode', 'race'), demoHref: withParam('demo', '1'), fallbackHref: fallback ? withParam('fallback', null) : withParam('fallback', '1') });
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
  const restart = $('[data-restart]'), p1badge = $('[data-p1-badge]'), driveCard = $('[data-drive]');

  const sfx = createSfx();
  let toastTimer = 0;
  const showToast = (text, ms = 2600) => { toastText.textContent = text; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), ms); };
  const music = createMusic(sfx, $('[data-music]'), showToast);
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
    if (dir > 0) sfx.whoosh(1); else sfx.whoosh(-1);
    const focus = slides[i].querySelector(i === 0 ? '[data-primary]' : 'button, a');
    focus?.focus({ preventScroll: true });
  }
  function setStatus(text) { statusText.textContent = text; }

  function doOpen() {
    if (open) return;
    open = true; clearTimeout(closing);
    root.hidden = false; root.classList.remove('is-closing');
    document.body.classList.add('stm-open');
    chip.classList.toggle('paused', started); chipText.textContent = started ? 'Paused' : 'Phase 1 · Build Day Delhi';
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
  restart.addEventListener('click', () => location.reload());
  $('[data-music]').addEventListener('click', () => music.toggle());
  $('[data-full]').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {}); });
  $$('button, a, .stm-phase').forEach(el => el.addEventListener('pointerenter', () => sfx.tick()));
  root.addEventListener('click', e => { if (e.target.closest?.('button, a') && !e.target.closest('[data-primary], [data-drive]')) sfx.tick(); });

  // First gesture anywhere unlocks audio (autoplay policy).
  const unlock = () => { sfx.ensure(); music.unlock(); toast.classList.remove('show'); };
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);

  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea')) return;
    if (e.code === 'KeyM' && !e.repeat) { music.toggle(); return; }
    if (!open) {
      if (e.code === 'Escape' && started) { e.preventDefault(); doOpen(); }
      return;
    }
    switch (e.code) {
      case 'ArrowRight': e.preventDefault(); go(index + 1); break;
      case 'ArrowLeft': e.preventDefault(); go(index - 1); break;
      case 'Enter': case 'NumpadEnter':
        if (e.target.closest?.('button, a')) return; // native activation
        e.preventDefault(); if (index === 0) primaryAction(); else go(0); break;
      case 'Escape':
        e.preventDefault();
        if (index !== 0) { sfx.back(); go(0, -1); } else if (started && ready) doClose();
        break;
      case 'KeyF': if (!e.repeat) $('[data-full]').click(); break;
    }
  }, true);

  // Mirror the engine's loading text under the DRIVE button without touching the engine.
  if (statusEl) {
    const sync = () => { if (!ready) setStatus(statusEl.textContent.replace(/[.…]+$/, '')); };
    new MutationObserver(sync).observe(statusEl, { childList: true, characterData: true, subtree: true });
    sync();
  }

  slides[0].classList.add('is-active'); slides.slice(1).forEach(s => s.setAttribute('inert', ''));
  $('[data-prev]').disabled = true;
  backdrop.start();
  // ?menu=phases|briefing opens on that page (screenshots, deep links).
  const initial = SLIDES.indexOf(params.get('menu'));
  if (initial > 0) { slides[0].classList.remove('is-active'); go(initial); }
  else requestAnimationFrame(() => primary.focus({ preventScroll: true }));

  return {
    open: doOpen,
    close: doClose,
    isOpen: () => open,
    setReady() {
      if (ready) return; ready = true;
      primary.classList.remove('is-loading'); primary.classList.add('is-ready');
      primaryLabel.textContent = started ? 'Resume' : 'Drive';
      status.classList.add('ready'); setStatus('Ready · press Enter to drive');
      root.classList.add('has-scene'); backdrop.setScene(true);
      p1badge.innerHTML = `${I.check} Ready`;
    },
    setStatus,
    music,
  };
}
