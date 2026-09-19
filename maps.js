// maps.js — user-made maps (B track): local storage, photo → layout generation with Claude, and validation
// against the room contract that index.html enforces. Pure data in, { SPAWN, ROOM, PROPS } out.
//
//   import { generateMap, saveMap, listMaps, loadMap, deleteMap, MODELS } from './maps.js';
//
// Generation runs in the browser with the user's own key through the official Anthropic SDK (pinned on
// jsDelivr like Three.js and Rapier). Photos are downscaled client-side before upload. The model answers by
// calling a strict-schema tool, so the layout arrives as valid JSON; validateMap() then normalizes it,
// repairs what it can (missing floor or walls, blocked spawn) and reports warnings.

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.127.0/+esm';
const STORE = 'stm.maps.v1';
export const KEY_STORE = 'stm.apiKey';

export const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 · best layouts' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 · faster' },
];

export const TAGS = ['carpet', 'floor', 'rug', 'wall', 'desktop', 'table', 'divider', 'leg', 'ramp', 'cabin', 'pillar', 'ceiling',
  'chair', 'sofa', 'bed', 'shelf', 'cabinet', 'cpu', 'monitor', 'door', 'window', 'plant', 'box', 'step', 'other'];
const PROP_TAGS = ['cup', 'bottle', 'files', 'bin', 'book', 'ball', 'box', 'other'];

// ---------- storage ----------
function read() { try { const v = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
function write(all) {
  try { localStorage.setItem(STORE, JSON.stringify(all)); }
  catch { throw new Error('This browser is out of local storage. Delete an older map and try again.'); }
}
export function listMaps() { return read().map(({ data, ...meta }) => meta).sort((a, b) => b.createdAt - a.createdAt); }
export function loadMap(id) { const m = read().find(m => m.id === id); return m ? { ...m.data, name: m.name, id: m.id, size: m.size } : null; }
export function saveMap(map, meta = {}) {
  const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const all = read();
  all.push({ id, name: map.name, createdAt: Date.now(), size: map.size, model: meta.model || null,
    counts: { boxes: map.ROOM.length, props: map.PROPS.length }, data: { SPAWN: map.SPAWN, ROOM: map.ROOM, PROPS: map.PROPS } });
  write(all);
  return id;
}
export function deleteMap(id) { write(read().filter(m => m.id !== id)); }

// ---------- photos ----------
export async function compressImage(file, maxEdge = 1568, quality = 0.82) {
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error(`${file.name}: the browser cannot decode this image (HEIC?). Export it as JPEG or PNG.`); }
  const s = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * s)); canvas.height = Math.max(1, Math.round(bitmap.height * s));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { media_type: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1), width: canvas.width, height: canvas.height, url: dataUrl };
}

// ---------- the contract, as Claude sees it ----------
const SYSTEM_PROMPT = `You turn photographs of a real room into a small drivable world for a physics toy: a 1:36 scale RC car (body 0.12 m long, 0.055 m wide, 0.025 m tall, wheel radius 0.014 m, ground clearance about 0.015 m, top speed 1.2 m/s, climbs slopes up to 17 degrees). The room stays life-size in meters. Everything is an axis-aligned box unless it carries a rotation.

Coordinate system: meters, Y up, +X east, +Z south. Every entry is one box: pos is the world center, size is the full X/Y/Z extents (all positive), rot is Euler XYZ in radians ([0,0,0] when unrotated). Elevations are surface heights: the floor's top is y = 0, so the floor slab is pos [cx, -0.05, cz], size [W, 0.1, D]. A tabletop whose top is 0.75 m with 0.04 m thickness has center y = 0.73. Furniture legs, seats, backs, shelves are separate boxes. Colors are #rrggbb hex read from the photos. The tag is a material grouping only; it never changes behavior.

What the world needs to be drivable and to look like the photos:
- Exactly one floor slab covering the whole room (tag "carpet" or "floor"), plus thin accent rugs or tiles as 0.002 m slabs whose top is 0.001 m above the floor. Four walls (tag "wall", 0.2 m thick, 2.6 to 3.0 m tall) on the room edges so the car cannot leave. A ceiling is optional; if present its underside must be at least 2.4 m up.
- Large furniture as few boxes each: a desk is a top slab plus 4 legs (0.05 m) and maybe a modesty panel; a chair is a base disc, a post, a seat and a back; a sofa or bed is one or two blocks; shelves are slabs and sides. Skip anything smaller than 0.1 m except monitors (a stand and a 0.02 m thin screen) and the props below.
- Keep at least 0.6 m of clear driving corridor along the main paths you see, and keep the underside of desks clear (nothing between the legs below 0.7 m unless the photos show it).
- Aim for 60 to 250 boxes total. Never exceed 300.
- One ramp at most, and only if a raised surface (desk, bed, sofa, step) is clearly meant to be driven onto. The ramp is a 0.01 m slab of length L along its local X, width 0.4 m, rotated about Z by theta, climbing toward +X. Build it from two top-face endpoints p0 (on the floor, y 0) and p1 (the surface edge, y = surface height): dx = p1.x - p0.x, dy = p1.y - p0.y, theta = atan2(dy, dx), L = hypot(dx, dy), center = [(p0.x+p1.x)/2 + sin(theta)*0.005, (p0.y+p1.y)/2 - cos(theta)*0.005, p0.z], size [L, 0.01, 0.4], rot [0, 0, theta], tag "ramp". Keep theta at or below 0.30 rad (17 degrees) and leave 1.2 m of flat floor before p0. p1 must sit exactly at the surface edge inside its footprint.
- PROPS are 6 to 12 light knock-over items (cups 0.035x0.06x0.035 m, bottles 0.035x0.12x0.035 m, files 0.09x0.03x0.12 m, a bin 0.08x0.1x0.08 m), mass 0.01 to 0.05 kg, resting on the floor or on a tabletop with their bottom 0.003 m above the surface, never overlapping each other or furniture, never on the ramp or its approach.
- SPAWN is the car body origin: pos on open floor at y 0.07, at least 0.5 m from any furniture or wall, heading in radians about +Y (0 faces +Z, 1.5708 faces +X) pointing down the longest open run.

Work from the photos: estimate the room's footprint from doors, tiles, desks and people-scale cues (a desk top is 0.72 to 0.76 m, a door 2.0 to 2.1 m, an office chair seat 0.45 m, a carpet tile 0.5 m). Place the furniture where it actually is, in the colors it actually has, so someone who knows the room recognizes it from a top-down view. When unsure, prefer fewer, larger, correct boxes over many speculative ones.

Answer by calling the submit_map tool exactly once with the complete world. Do not write prose.`;

const numArray = (n) => ({ type: 'array', items: { type: 'number' }, description: `${n} numbers` });
const SUBMIT_MAP_TOOL = {
  name: 'submit_map',
  description: 'Submit the finished drivable world. Call exactly once with every box of the room, the props and the spawn.',
  strict: true,
  input_schema: {
    type: 'object', additionalProperties: false,
    required: ['name', 'size', 'SPAWN', 'ROOM', 'PROPS'],
    properties: {
      name: { type: 'string', description: 'Short name for the room' },
      size: { ...numArray(2), description: 'Room footprint [width along X, depth along Z] in meters' },
      SPAWN: {
        type: 'object', additionalProperties: false, required: ['pos', 'heading'],
        properties: { pos: numArray(3), heading: { type: 'number', description: 'radians about +Y; 0 faces +Z, 1.5708 faces +X' } },
      },
      ROOM: {
        type: 'array', description: 'Fixed boxes: floor, walls, furniture, ramp',
        items: {
          type: 'object', additionalProperties: false, required: ['pos', 'size', 'rot', 'color', 'tag'],
          properties: { pos: numArray(3), size: numArray(3), rot: numArray(3), color: { type: 'string', description: '#rrggbb' }, tag: { type: 'string', enum: TAGS } },
        },
      },
      PROPS: {
        type: 'array', description: 'Light dynamic items resting on surfaces',
        items: {
          type: 'object', additionalProperties: false, required: ['pos', 'size', 'mass', 'color', 'tag'],
          properties: { pos: numArray(3), size: numArray(3), mass: { type: 'number', description: 'kg, 0.01 to 0.05' }, color: { type: 'string' }, tag: { type: 'string', enum: PROP_TAGS } },
        },
      },
    },
  },
};

// ---------- generation ----------
export async function generateMap({ files, apiKey, model = 'claude-opus-5', name = 'My room', size = null, onStatus = () => {}, onThought = () => {}, signal } = {}) {
  if (!apiKey) throw new Error('Add your Anthropic API key first.');
  if (!files?.length) throw new Error('Add at least one photo of the room.');
  onStatus('Compressing photos');
  const images = [];
  for (const file of files) images.push(await compressImage(file));

  onStatus('Loading the Anthropic SDK');
  let Anthropic;
  try { ({ default: Anthropic } = await import(SDK_URL)); }
  catch { throw new Error('Could not load the Anthropic SDK from jsDelivr. Check the connection and try again.'); }
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });

  const label = MODELS.find(m => m.id === model)?.label.split(' · ')[0] || model;
  onStatus(`${label} is measuring the room`);
  const sizeHint = size && size.every(n => Number.isFinite(n) && n > 0) ? `The room is about ${size[0]} m wide (X) by ${size[1]} m deep (Z).` : 'Estimate the room size from the photos.';
  const userText = `Map name: ${name}\n${images.length} photo${images.length === 1 ? '' : 's'} of the room are attached, taken from different spots. ${sizeHint}\nBuild the drivable world now and call submit_map exactly once.`;

  let message;
  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 64000,
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: 'high' },
      system: SYSTEM_PROMPT,
      tools: [SUBMIT_MAP_TOOL],
      tool_choice: { type: 'auto', disable_parallel_tool_use: true },
      messages: [{
        role: 'user',
        content: [
          ...images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } })),
          { type: 'text', text: userText },
        ],
      }],
    }, { signal });
    let thought = '', writing = false;
    for await (const event of stream) {
      if (event.type !== 'content_block_delta') continue;
      if (event.delta.type === 'thinking_delta') {
        thought += event.delta.thinking;
        const line = thought.split('\n').map(s => s.trim()).filter(Boolean).pop();
        if (line) onThought(line);
      } else if (event.delta.type === 'input_json_delta' && !writing) { writing = true; onStatus('Writing the layout'); }
    }
    message = await stream.finalMessage();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Cancelled.');
    if (error instanceof Anthropic.AuthenticationError) throw new Error('That API key was rejected (401). Check it in console.anthropic.com.');
    if (error instanceof Anthropic.PermissionDeniedError) throw new Error('This key is not allowed to use that model (403).');
    if (error instanceof Anthropic.RateLimitError) throw new Error('Rate limited (429). Wait a moment and try again.');
    if (error instanceof Anthropic.BadRequestError) throw new Error(`The API rejected the request: ${error.message}`);
    if (error instanceof Anthropic.APIConnectionError) throw new Error('Could not reach api.anthropic.com. Check the connection, a VPN or an ad blocker.');
    if (error instanceof Anthropic.APIError) throw new Error(`API error ${error.status}: ${error.message}`);
    throw error;
  }

  if (message.stop_reason === 'refusal') throw new Error('Claude declined this request. Try photos of a room without people in them.');
  if (message.stop_reason === 'max_tokens') throw new Error('The layout was cut off before it finished. Try again with fewer photos or a simpler room.');
  const call = message.content.find(b => b.type === 'tool_use' && b.name === 'submit_map');
  if (!call) {
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join(' ').trim().slice(0, 240);
    throw new Error('Claude answered without a map.' + (text ? ` It said: "${text}"` : ' Try again.'));
  }
  onStatus('Checking the layout');
  const { map, warnings } = validateMap(call.input, { name, size });
  return { map, warnings, usage: message.usage, model };
}

// ---------- validation and repair against the room contract ----------
const fin = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite);
const clampSize = v => Math.min(40, Math.max(0.005, v));
const HEX = /^#[0-9a-f]{6}$/i;
const FALLBACK_COLOR = { carpet: '#4a4d52', floor: '#4a4d52', rug: '#8a8f5a', wall: '#f0f0ee', desktop: '#f2f0ec', table: '#d8cdb8', divider: '#2b3a5c', leg: '#c8c8c4', ramp: '#b8b0a4', cabin: '#7d8b99', pillar: '#6b4a2f', ceiling: '#f4f4f2', chair: '#1c1c1e', cpu: '#2a2a2c', monitor: '#1a1a1c' };

export function validateMap(raw, { name = 'My room', size = null } = {}) {
  const warnings = [];
  if (!raw || typeof raw !== 'object') throw new Error('The map is not an object.');
  const ROOM = [], PROPS = [];
  for (const [i, e] of (Array.isArray(raw.ROOM) ? raw.ROOM : []).entries()) {
    if (!e || !fin(e.pos, 3) || !fin(e.size, 3)) { warnings.push(`Dropped ROOM[${i}]: bad numbers`); continue; }
    const out = { pos: e.pos.map(Number), size: e.size.map(clampSize), color: HEX.test(e.color) ? e.color.toLowerCase() : (FALLBACK_COLOR[e.tag] || '#9aa3b8'), tag: typeof e.tag === 'string' ? e.tag : 'other' };
    if (fin(e.rot, 3) && e.rot.some(r => r !== 0)) out.rot = e.rot.map(Number);
    ROOM.push(out);
  }
  if (ROOM.length < 4) throw new Error(`Only ${ROOM.length} boxes came back; that is not a room. Try again.`);
  if (ROOM.length > 700) { warnings.push(`Trimmed ${ROOM.length - 700} boxes to keep the frame rate`); ROOM.length = 700; }

  // Floor: exactly one big slab with its top at y = 0. Shift everything if the model put the floor elsewhere.
  const top = e => e.pos[1] + e.size[1] / 2, bottom = e => e.pos[1] - e.size[1] / 2;
  let floors = ROOM.filter(e => (e.tag === 'carpet' || e.tag === 'floor') && e.size[0] * e.size[2] > 2);
  if (!floors.length) floors = ROOM.filter(e => Math.abs(top(e)) < 0.1 && e.size[0] * e.size[2] > 4 && e.size[1] < 0.3);
  let bounds;
  if (!floors.length) {
    const b = boundsOf(ROOM.filter(e => e.tag !== 'ceiling'));
    const W = size?.[0] > 1 ? size[0] : (b.maxX - b.minX + 1), D = size?.[1] > 1 ? size[1] : (b.maxZ - b.minZ + 1);
    const slab = { pos: [(b.minX + b.maxX) / 2, -0.05, (b.minZ + b.maxZ) / 2], size: [W, 0.1, D], color: '#4a4d52', tag: 'carpet' };
    ROOM.unshift(slab); floors = [slab]; warnings.push('No floor came back; added a grey floor under everything');
  }
  const main = floors.reduce((a, b) => (a.size[0] * a.size[2] >= b.size[0] * b.size[2] ? a : b));
  const shift = top(main);
  if (Math.abs(shift) > 0.002) {
    for (const e of ROOM) e.pos[1] -= shift;
    warnings.push(`Floor top was at y=${shift.toFixed(2)}; shifted the world so it sits at 0`);
  }
  bounds = { minX: main.pos[0] - main.size[0] / 2, maxX: main.pos[0] + main.size[0] / 2, minZ: main.pos[2] - main.size[2] / 2, maxZ: main.pos[2] + main.size[2] / 2 };

  // Walls so the car cannot leave the floor.
  if (!ROOM.some(e => e.tag === 'wall')) {
    const h = 2.8, t = 0.2, cx = (bounds.minX + bounds.maxX) / 2, cz = (bounds.minZ + bounds.maxZ) / 2, W = bounds.maxX - bounds.minX, D = bounds.maxZ - bounds.minZ;
    ROOM.push({ pos: [cx, h / 2, bounds.minZ], size: [W, h, t], color: '#f0a860', tag: 'wall' }, { pos: [cx, h / 2, bounds.maxZ], size: [W, h, t], color: '#f0f0ee', tag: 'wall' },
      { pos: [bounds.minX, h / 2, cz], size: [t, h, D], color: '#f0f0ee', tag: 'wall' }, { pos: [bounds.maxX, h / 2, cz], size: [t, h, D], color: '#f0f0ee', tag: 'wall' });
    warnings.push('No walls came back; added four around the floor');
  }
  // A low ceiling would swallow the camera.
  for (let i = ROOM.length - 1; i >= 0; i--) if (ROOM[i].tag === 'ceiling' && bottom(ROOM[i]) < 1.6) { ROOM.splice(i, 1); warnings.push('Dropped a ceiling lower than 1.6 m'); }

  // Spawn: on the floor, clear of furniture, or moved to the nearest clear spot.
  const S = raw.SPAWN || {};
  let spawn = fin(S.pos, 3) ? S.pos.map(Number) : [(bounds.minX + bounds.maxX) / 2, 0.07, (bounds.minZ + bounds.maxZ) / 2];
  spawn[1] = 0.07;
  const heading = Number.isFinite(S.heading) ? Number(S.heading) : 0;
  const obstacles = ROOM.filter(e => e !== main && !floors.includes(e) && e.tag !== 'ceiling' && top(e) > 0.01);
  const clearAt = (x, z, r) => x - r > bounds.minX && x + r < bounds.maxX && z - r > bounds.minZ && z + r < bounds.maxZ &&
    !obstacles.some(e => Math.abs(e.pos[0] - x) < e.size[0] / 2 + r && Math.abs(e.pos[2] - z) < e.size[2] / 2 + r);
  if (!clearAt(spawn[0], spawn[2], 0.3)) {
    let best = null, bestD = Infinity;
    for (let z = bounds.minZ + 0.4; z < bounds.maxZ - 0.4; z += 0.25) for (let x = bounds.minX + 0.4; x < bounds.maxX - 0.4; x += 0.25) {
      if (!clearAt(x, z, 0.35)) continue;
      const d = Math.hypot(x - spawn[0], z - spawn[2]);
      if (d < bestD) { bestD = d; best = [x, 0.07, z]; }
    }
    if (best) { spawn = best; warnings.push(`Spawn was inside furniture; moved it ${bestD.toFixed(1)} m to open floor`); }
    else warnings.push('Could not find open floor for the spawn; the car may start inside something');
  }

  for (const [i, p] of (Array.isArray(raw.PROPS) ? raw.PROPS : []).entries()) {
    if (PROPS.length >= 24) { warnings.push('Kept the first 24 props'); break; }
    if (!p || !fin(p.pos, 3) || !fin(p.size, 3)) { warnings.push(`Dropped PROPS[${i}]: bad numbers`); continue; }
    const sizeV = p.size.map(v => Math.min(0.6, Math.max(0.01, v)));
    const pos = p.pos.map(Number); pos[1] -= shift;
    pos[1] = Math.max(pos[1], sizeV[1] / 2 + 0.003);
    PROPS.push({ pos, size: sizeV, mass: Math.min(0.5, Math.max(0.005, Number(p.mass) || 0.02)), color: HEX.test(p.color) ? p.color.toLowerCase() : '#ffffff', tag: typeof p.tag === 'string' ? p.tag : 'cup' });
  }

  const mapName = (typeof raw.name === 'string' && raw.name.trim()) || name || 'My room';
  const mapSize = fin(raw.size, 2) && raw.size.every(n => n > 0) ? raw.size.map(Number) : [bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ];
  return { map: { name: mapName.slice(0, 40), size: mapSize, SPAWN: { pos: spawn, heading }, ROOM, PROPS }, warnings };
}

function boundsOf(list) {
  const b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const e of list) {
    b.minX = Math.min(b.minX, e.pos[0] - e.size[0] / 2); b.maxX = Math.max(b.maxX, e.pos[0] + e.size[0] / 2);
    b.minZ = Math.min(b.minZ, e.pos[2] - e.size[2] / 2); b.maxZ = Math.max(b.maxZ, e.pos[2] + e.size[2] / 2);
  }
  if (!Number.isFinite(b.minX)) Object.assign(b, { minX: -4, maxX: 4, minZ: -3, maxZ: 3 });
  return b;
}
