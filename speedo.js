// speedo.js — the radial speedometer from Chirag's hud.js (origin/chirag), lifted onto the arcade HUD that
// index.html already owns. His module also mounted a rotating minimap, a map tag and a controls hint; none of
// that is here, because our HUD has its own minimap, lap/position readout and controls bar.
//
//   import { createSpeedo } from './speedo.js';
//   const speedo = createSpeedo({ canvas, kmhEl, msEl, gearEl });
//   speedo.update({ speed, throttle, brake, dt });   // speed in m/s, throttle -1..1, brake bool
//
// The dial reads SCALE SPEED, which is what makes a 1:36 car feel like a car: 1.2 m/s of real travel is
// 155 km/h in the car's own world. The needle is smoothed so it sweeps instead of snapping.

export const SPEEDO = Object.freeze({ scale: 36, maxKmh: 200, smoothing: 9, redline: .82 });

export function createSpeedo({ canvas, kmhEl, msEl, gearEl, scale = SPEEDO.scale, maxKmh = SPEEDO.maxKmh } = {}) {
  if (!canvas) return { update() {}, resize() {} };
  const ctx = canvas.getContext('2d');
  let dpr = 1, size = 0, shownKmh = 0, gear = 'N';

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = canvas.clientWidth || 200;
    canvas.width = canvas.height = Math.round(size * dpr);
  }
  addEventListener('resize', resize);

  // Chirag's dial, unchanged in shape: glass disc, track, redline band, conic live arc, ticks, needle, cap.
  function draw(frac, brake) {
    if (!size) resize();
    const s = size, c = s / 2, r = c - 14;
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, span = a1 - a0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    const disc = ctx.createRadialGradient(c, c * .8, r * .2, c, c, r + 12);
    disc.addColorStop(0, 'rgba(24,32,54,.86)'); disc.addColorStop(1, 'rgba(7,11,22,.86)');
    ctx.beginPath(); ctx.arc(c, c, r + 12, 0, Math.PI * 2); ctx.fillStyle = disc; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,246,230,.16)'; ctx.stroke();

    ctx.lineCap = 'round'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(c, c, r, a0, a1); ctx.strokeStyle = 'rgba(255,246,230,.09)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(c, c, r, a0 + span * SPEEDO.redline, a1); ctx.strokeStyle = 'rgba(255,90,60,.24)'; ctx.stroke();

    if (frac > .002) {
      const end = a0 + span * frac;
      // Yellow into lime into coral: the HUD palette, where his used amber into pink.
      const g = ctx.createConicGradient ? ctx.createConicGradient(a0, c, c) : null;
      if (g) { g.addColorStop(0, '#ffc72c'); g.addColorStop(.5, '#b6e34a'); g.addColorStop(.78, '#ff5a3c'); g.addColorStop(1, '#ff5a3c'); }
      ctx.shadowColor = frac > SPEEDO.redline ? 'rgba(255,90,60,.9)' : 'rgba(255,199,44,.85)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(c, c, r, a0, end); ctx.strokeStyle = g || '#ffc72c'; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.lineCap = 'butt';
    for (let k = 0; k <= 20; k++) {
      const a = a0 + span * (k / 20), major = k % 2 === 0;
      const r1 = r - 13, r2 = r1 - (major ? 10 : 5);
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      ctx.lineWidth = major ? 2.5 : 1.2; ctx.strokeStyle = k / 20 <= frac ? '#fff6e6' : 'rgba(255,246,230,.35)'; ctx.stroke();
      // Tick numbers only when the face can hold them: on a small dial they run into the centre readout.
      if (major && k % 4 === 0 && s >= 170) {
        // A canvas font string is not CSS: var() never resolves here, so the HUD stack is written out.
        ctx.font = `700 ${Math.round(s * .052)}px "Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,246,230,.55)';
        ctx.fillText(String(Math.round(k / 20 * maxKmh)), c + Math.cos(a) * (r2 - 13), c + Math.sin(a) * (r2 - 13));
      }
    }

    const na = a0 + span * frac, nl = r - 28;
    ctx.save(); ctx.translate(c, c); ctx.rotate(na);
    ctx.shadowColor = 'rgba(255,199,44,.9)'; ctx.shadowBlur = 11;
    ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(nl, -1.2); ctx.lineTo(nl, 1.2); ctx.lineTo(-9, 3); ctx.closePath();
    ctx.fillStyle = brake ? '#ff5a3c' : '#fff6e6'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(c, c, 6, 0, Math.PI * 2); ctx.fillStyle = '#0a0e19'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,246,230,.5)'; ctx.stroke();
  }

  return {
    resize,
    update({ speed = 0, throttle = 0, brake = false, dt = 1 / 60 } = {}) {
      const v = Math.abs(speed);
      const kmh = v * scale * 3.6;
      shownKmh += (kmh - shownKmh) * (1 - Math.exp(-SPEEDO.smoothing * Math.max(dt, 1e-4)));
      if (kmhEl) kmhEl.textContent = String(Math.round(shownKmh));
      if (msEl) msEl.textContent = v.toFixed(2);
      // B beats R beats D: braking is what the driver is doing right now, so it wins the pill.
      const next = brake && v > .03 ? 'B'
        : speed < -.04 || (throttle < 0 && v < .04) ? 'R'
        : v > .04 || throttle > 0 ? 'D' : 'N';
      if (gearEl && next !== gear) {
        gear = next; gearEl.textContent = next;
        gearEl.classList.toggle('reverse', next === 'R');
        gearEl.classList.toggle('brake', next === 'B');
      }
      draw(Math.min(1, shownKmh / maxKmh), brake);
    },
  };
}
