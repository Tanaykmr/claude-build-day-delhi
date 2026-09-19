// minimap.js — top-down rendering of a ROOM / PROPS box world.
// Shared by the in-game HUD (rotating minimap) and the menu's map preview (whole map, north-up).
// World axes: +X east (screen right), +Z south (screen down), Y up. Heading 0 faces +Z, π/2 faces +X.

const SKIP = new Set(['ceiling', 'monitor', 'leg']);

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return [154, 163, 191];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Map colors are the entry colors, pushed toward a readable palette: floors darker, walls lighter, furniture as-is.
function shade(entry, top) {
  const c = hexToRgb(entry.color);
  if (entry.tag === 'carpet' || entry.tag === 'floor') return rgba(mix(c, [20, 25, 40], 0.35));
  if (entry.tag === 'wall') return rgba(mix(c, [120, 130, 150], 0.6));
  if (top > 1.8) return rgba(mix(c, [120, 130, 150], 0.4), 0.9); // tall things like cabins and pillars
  return rgba(c);
}

export function mapBounds(ROOM) {
  const isFloor = e => e.tag === 'carpet' || e.tag === 'floor' || (e.pos[1] + e.size[1] / 2 <= 0.02 && e.size[0] * e.size[2] > 4);
  let list = ROOM.filter(isFloor);
  if (!list.length) list = ROOM.filter(e => e.tag !== 'ceiling');
  const b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const e of list) {
    b.minX = Math.min(b.minX, e.pos[0] - e.size[0] / 2); b.maxX = Math.max(b.maxX, e.pos[0] + e.size[0] / 2);
    b.minZ = Math.min(b.minZ, e.pos[2] - e.size[2] / 2); b.maxZ = Math.max(b.maxZ, e.pos[2] + e.size[2] / 2);
  }
  if (!Number.isFinite(b.minX)) Object.assign(b, { minX: -8, maxX: 8, minZ: -6.5, maxZ: 6.5 });
  return b;
}

// Rasterize the static room once. `scale` is pixels per meter.
export function createMapImage(ROOM, { scale = 48, pad = 0.4 } = {}) {
  const bounds = mapBounds(ROOM);
  const minX = bounds.minX - pad, minZ = bounds.minZ - pad;
  const w = Math.max(8, Math.ceil((bounds.maxX - bounds.minX + 2 * pad) * scale));
  const h = Math.max(8, Math.ceil((bounds.maxZ - bounds.minZ + 2 * pad) * scale));
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0e19'; ctx.fillRect(0, 0, w, h);
  const entries = ROOM.filter(e => !SKIP.has(e.tag)).map(e => ({ e, top: e.pos[1] + e.size[1] / 2 })).sort((a, b) => a.top - b.top);
  for (const { e, top } of entries) {
    const rz = e.rot?.[2] ?? 0, rx = e.rot?.[0] ?? 0, ry = e.rot?.[1] ?? 0;
    // Footprint of a box tilted about Z (ramps) or X: project the tilted extents onto the floor.
    const lenX = e.size[0] * Math.abs(Math.cos(rz)) + e.size[1] * Math.abs(Math.sin(rz));
    const lenZ = e.size[2] * Math.abs(Math.cos(rx)) + e.size[1] * Math.abs(Math.sin(rx));
    ctx.save();
    ctx.translate((e.pos[0] - minX) * scale, (e.pos[2] - minZ) * scale);
    ctx.rotate(-ry); // yaw about +Y turns +X toward -Z, which is counter-clockwise on screen
    ctx.fillStyle = shade(e, top);
    const px = lenX * scale, pz = lenZ * scale;
    ctx.fillRect(-px / 2, -pz / 2, px, pz);
    if (top > 0.3 && px > 3 && pz > 3) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(-px / 2 + .5, -pz / 2 + .5, px - 1, pz - 1); }
    ctx.restore();
  }
  return { canvas, scale, minX, minZ, w, h, bounds };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function carArrow(ctx, size, angle) {
  ctx.save(); ctx.rotate(angle);
  ctx.shadowColor = 'rgba(255,138,31,.9)'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * .72, size * .8); ctx.lineTo(0, size * .42); ctx.lineTo(-size * .72, size * .8); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = '#ff6a1a'; ctx.stroke();
  ctx.restore();
}

// GTA-style rotating minimap: the car sits below center pointing up, the world turns around it.
export function drawMinimap(ctx, image, { x, z, heading, w, h, zoom = 1.25, rotate = true, props = [], markers = [], radius = 18, elevated = false }) {
  const phi = Math.atan2(Math.sin(heading), -Math.cos(heading)); // forward direction, clockwise from screen-up
  const cx = w / 2, cy = h / 2 + h * 0.14;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  roundRect(ctx, 0, 0, w, h, radius); ctx.clip();
  ctx.fillStyle = '#0a0e19'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cx, cy);
  if (rotate) ctx.rotate(-phi);
  ctx.scale(zoom, zoom);
  ctx.translate(-(x - image.minX) * image.scale, -(z - image.minZ) * image.scale);
  ctx.drawImage(image.canvas, 0, 0);
  // Dynamic props: small bright dots so cups read on the desk and carpet.
  for (const p of props) {
    ctx.beginPath(); ctx.arc((p.x - image.minX) * image.scale, (p.z - image.minZ) * image.scale, 2.2 / zoom + .6, 0, Math.PI * 2);
    ctx.fillStyle = p.y > 0.5 ? '#fff6dc' : '#ffffff'; ctx.fill();
  }
  // Route markers with upright labels.
  for (const m of markers) {
    const mx = (m.x - image.minX) * image.scale, mz = (m.z - image.minZ) * image.scale;
    ctx.save(); ctx.translate(mx, mz); if (rotate) ctx.rotate(phi); ctx.scale(1 / zoom, 1 / zoom);
    ctx.shadowColor = m.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0); ctx.closePath();
    ctx.fillStyle = m.color; ctx.fill(); ctx.shadowBlur = 0;
    ctx.font = '800 11px "Barlow", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(m.label, 0, 9); ctx.fillStyle = '#fff'; ctx.fillText(m.label, 0, 9);
    ctx.restore();
  }
  ctx.restore();
  // Soft edge fade so the map feels inset.
  const fade = ctx.createRadialGradient(cx, h / 2, Math.min(w, h) * .35, cx, h / 2, Math.max(w, h) * .72);
  fade.addColorStop(0, 'rgba(10,14,25,0)'); fade.addColorStop(1, 'rgba(10,14,25,.85)');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
  // Car
  ctx.save(); ctx.translate(cx, cy); carArrow(ctx, elevated ? 9 : 8, rotate ? 0 : phi); ctx.restore();
  // North tick on the rim
  ctx.save(); ctx.translate(cx, h / 2); if (rotate) ctx.rotate(-phi);
  const R = Math.min(w, h) / 2 - 12; ctx.translate(0, -R); if (rotate) ctx.rotate(phi);
  ctx.font = '800 11px "Barlow", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('N', 0, 0);
  ctx.restore();
  ctx.restore();
}

// Whole map, north-up, fitted into a canvas. Used for the menu's map preview.
export function drawOverview(canvas, ROOM, PROPS = [], SPAWN = null, { pad = 0.3 } = {}) {
  const b = mapBounds(ROOM);
  const cw = canvas.width, ch = canvas.height;
  const scale = Math.min(cw / (b.maxX - b.minX + 2 * pad), ch / (b.maxZ - b.minZ + 2 * pad));
  const image = createMapImage(ROOM, { scale, pad });
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#0a0e19'; ctx.fillRect(0, 0, cw, ch);
  const ox = (cw - image.w) / 2, oy = (ch - image.h) / 2;
  ctx.drawImage(image.canvas, ox, oy);
  ctx.fillStyle = '#fff';
  for (const p of PROPS) { ctx.beginPath(); ctx.arc(ox + (p.pos[0] - image.minX) * scale, oy + (p.pos[2] - image.minZ) * scale, 2, 0, Math.PI * 2); ctx.fill(); }
  if (SPAWN) {
    ctx.save(); ctx.translate(ox + (SPAWN.pos[0] - image.minX) * scale, oy + (SPAWN.pos[2] - image.minZ) * scale);
    carArrow(ctx, 6, Math.atan2(Math.sin(SPAWN.heading), -Math.cos(SPAWN.heading)));
    ctx.restore();
  }
  return image;
}
