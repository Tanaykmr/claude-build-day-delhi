// hud.js — in-game HUD (B track). A GTA-style radial speedometer bottom-right and a rotating minimap
// bottom-left, nothing else. index.html mounts it once the world exists and calls update() every frame.
//
//   import { mountHud } from './hud.js';
//   const hud = mountHud({ ROOM, SPAWN, mapName, markers, propPositions: () => [...] });
//   hud.update({ x, y, z, heading, speed, throttle, brake, dt });
//   hud.showHint();   // controls hint for a few seconds (called when the menu closes)
//
// Speed is shown as scale speed: the 1:36 car at 1.2 m/s is doing 155 km/h in its own world.

import { createMapImage, drawMinimap } from './minimap.js';

const SCALE = 36, MAX_KMH = 200;
const here = new URL('.', import.meta.url);

export function mountHud({ ROOM, SPAWN, mapName = 'The Office', markers = [], propPositions = () => [] } = {}) {
  if (!document.querySelector('link[data-stm-fonts]')) {
    for (const [rel, href, extra] of [
      ['preconnect', 'https://fonts.googleapis.com'], ['preconnect', 'https://fonts.gstatic.com', 'anonymous'],
      ['stylesheet', 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,700;1,800;1,900&family=Barlow:wght@500;600;700;800&display=swap'],
    ]) { const l = document.createElement('link'); l.rel = rel; l.href = href; if (extra) l.crossOrigin = extra; l.dataset.stmFonts = ''; document.head.append(l); }
  }
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./hud.css', here).href;
  document.head.append(css);
  document.body.classList.add('has-hud');

  const root = document.createElement('div');
  root.className = 'hud'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="hud-map"><canvas></canvas><span class="tag" data-tag><i></i><span>Desk level</span></span><span class="name">${escapeHtml(mapName)}</span></div>
    <div class="hud-speedo">
      <canvas></canvas>
      <div class="hud-digits"><b data-kmh>0</b><small>km/h · 1:36 scale</small></div>
      <div class="hud-gear" data-gear>N</div>
      <div class="hud-real" data-ms>0.00 m/s</div>
    </div>
    <div class="hud-hint" data-hint><span><kbd>WASD</kbd>drive</span><span><kbd>Space</kbd>brake</span><span><kbd>R</kbd>recover</span><span><kbd>Esc</kbd>menu</span></div>`;
  document.body.append(root);

  const mapCanvas = root.querySelector('.hud-map canvas'), mapCtx = mapCanvas.getContext('2d');
  const speedCanvas = root.querySelector('.hud-speedo canvas'), speedCtx = speedCanvas.getContext('2d');
  const kmhEl = root.querySelector('[data-kmh]'), msEl = root.querySelector('[data-ms]'), gearEl = root.querySelector('[data-gear]');
  const tagEl = root.querySelector('[data-tag]'), hintEl = root.querySelector('[data-hint]');

  const image = createMapImage(ROOM, { scale: 48 });
  const mapMarkers = markers.map(m => ({ x: m.pos[0], z: m.pos[2], label: m.label, color: m.color || '#ffb347' }));

  let dpr = 1, mapW = 0, mapH = 0, speedSize = 0, fontsReady = false;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    mapW = mapCanvas.clientWidth || 300; mapH = mapCanvas.clientHeight || 190;
    mapCanvas.width = Math.round(mapW * dpr); mapCanvas.height = Math.round(mapH * dpr);
    speedSize = speedCanvas.clientWidth || 236;
    speedCanvas.width = speedCanvas.height = Math.round(speedSize * dpr);
    lastMap = 0;
  }
  addEventListener('resize', resize);
  document.fonts?.load('800 11px "Barlow"').then(() => { fontsReady = true; lastMap = 0; }).catch(() => {});

  let shownKmh = 0, lastMap = 0, hintTimer = 0, gear = 'N';

  function drawSpeedo(frac, brake) {
    const s = speedSize, c = s / 2, r = c - 16;
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, span = a1 - a0;
    const ctx = speedCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);
    // glass disc
    const disc = ctx.createRadialGradient(c, c * .8, r * .2, c, c, r + 14);
    disc.addColorStop(0, 'rgba(24,32,54,.86)'); disc.addColorStop(1, 'rgba(7,11,22,.86)');
    ctx.beginPath(); ctx.arc(c, c, r + 14, 0, Math.PI * 2); ctx.fillStyle = disc; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
    // track
    ctx.lineCap = 'round'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.arc(c, c, r, a0, a1); ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.stroke();
    // redline hint
    ctx.beginPath(); ctx.arc(c, c, r, a0 + span * .82, a1); ctx.strokeStyle = 'rgba(255,45,120,.22)'; ctx.stroke();
    // live arc
    if (frac > 0.002) {
      const end = a0 + span * frac;
      const g = ctx.createConicGradient ? ctx.createConicGradient(a0, c, c) : null;
      if (g) { g.addColorStop(0, '#ffb347'); g.addColorStop(0.5, '#ff6a1a'); g.addColorStop(0.75, '#ff2d78'); g.addColorStop(1, '#ff2d78'); }
      ctx.shadowColor = frac > .82 ? 'rgba(255,45,120,.9)' : 'rgba(255,120,40,.9)'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(c, c, r, a0, end); ctx.strokeStyle = g || '#ff6a1a'; ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // ticks
    ctx.lineCap = 'butt';
    for (let k = 0; k <= 20; k++) {
      const a = a0 + span * (k / 20), major = k % 2 === 0;
      const r1 = r - 14, r2 = r1 - (major ? 11 : 6);
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      ctx.lineWidth = major ? 2.5 : 1.2; ctx.strokeStyle = k / 20 <= frac ? '#fff' : 'rgba(255,255,255,.35)'; ctx.stroke();
      if (major && k % 4 === 0) {
        ctx.font = `700 ${Math.round(s * .05)}px "Barlow", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillText(String(k * 10), c + Math.cos(a) * (r2 - 14), c + Math.sin(a) * (r2 - 14));
      }
    }
    // needle
    const na = a0 + span * frac, nl = r - 30;
    ctx.save(); ctx.translate(c, c); ctx.rotate(na);
    ctx.shadowColor = 'rgba(255,138,31,.9)'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(nl, -1.2); ctx.lineTo(nl, 1.2); ctx.lineTo(-10, 3); ctx.closePath();
    ctx.fillStyle = brake ? '#ff2d78' : '#fff'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(c, c, 7, 0, Math.PI * 2); ctx.fillStyle = '#0a0e19'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
  }

  function setHint(on) { hintEl.classList.toggle('show', on); }

  return {
    update({ x, y, z, heading, speed, throttle = 0, brake = false, dt = 1 / 60 }) {
      if (!mapW) resize();
      const kmh = Math.abs(speed) * SCALE * 3.6;
      shownKmh += (kmh - shownKmh) * (1 - Math.exp(-9 * dt));
      kmhEl.textContent = String(Math.round(shownKmh));
      msEl.textContent = `${Math.abs(speed).toFixed(2)} m/s`;
      const next = brake && Math.abs(speed) > .03 ? 'B' : speed < -.04 || (throttle < 0 && Math.abs(speed) < .04) ? 'R' : Math.abs(speed) > .04 || throttle > 0 ? 'D' : 'N';
      if (next !== gear) { gear = next; gearEl.textContent = next === 'B' ? 'B' : next; gearEl.classList.toggle('reverse', next === 'R'); gearEl.classList.toggle('brake', next === 'B'); }
      drawSpeedo(Math.min(1, shownKmh / MAX_KMH), brake);
      const now = performance.now();
      if (now - lastMap > 33) {
        lastMap = now;
        mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMinimap(mapCtx, image, {
          x, z, heading, w: mapW, h: mapH, zoom: 1.35, rotate: true, radius: 20, elevated: y > .4,
          props: propPositions(), markers: mapMarkers,
        });
        tagEl.classList.toggle('show', y > .4);
      }
    },
    showHint(ms = 6000) { setHint(true); clearTimeout(hintTimer); hintTimer = setTimeout(() => setHint(false), ms); },
    hideHint() { clearTimeout(hintTimer); setHint(false); },
    destroy() { root.remove(); document.body.classList.remove('has-hud'); },
  };
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
