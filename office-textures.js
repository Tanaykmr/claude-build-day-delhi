/**
 * Photo-informed office surface pack for Three.js r169.
 * Rendering only: no ROOM edits, new geometry, colliders, simulation or frame callbacks.
 * Inject THREE so a host can keep its existing import map and renderer singleton.
 * installOfficeTextures({ THREE, renderer, bindings: [{ material, tag }], palette })
 * returns { stats, setEnabled(boolean), dispose() }. All GPU assets are shared.
 */
const ASSETS = new URL('./assets/office-textures/', import.meta.url);
const VARYINGS = `
varying vec3 vOfficeWorld;
varying vec3 vOfficeLocal;
varying vec3 vOfficeSize;
varying vec3 vOfficeNormal;
varying vec2 vOfficeUv;
varying float vOfficeScreen;
`;

function canvas(w, h = w) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return c;
}

async function loadImage(name) {
  const img = new Image();
  img.src = new URL(name, ASSETS).href;
  await img.decode();
  return img;
}

// Small code-generated neutral detail supplements the AI albedos. Nothing updates per frame.
function grainCanvas() {
  const c = canvas(128), ctx = c.getContext('2d'), d = ctx.createImageData(128, 128);
  let seed = 821;
  for (let i = 0; i < d.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const n = 229 + (seed >>> 27);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.min(255, n); d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0); return c;
}

function heightCanvas(img, size = 256) {
  const c = canvas(size), ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const d = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < d.data.length; i += 4) {
    const y = Math.round(.2126 * d.data[i] + .7152 * d.data[i + 1] + .0722 * d.data[i + 2]);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = y;
  }
  ctx.putImageData(d, 0, 0); return c;
}

// One 1024x512 GPU atlas for every display. Each cell has its own safe edge padding.
// Brand lettering is official path artwork, so it requires neither a guessed font nor a font file.
function screenCanvas(images) {
  const c = canvas(1024, 512), g = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 512, y = Math.floor(i / 2) * 256;
    g.save(); g.translate(x, y);
    g.fillStyle = i === 1 ? '#202724' : '#f5f1e8'; g.fillRect(0, 0, 512, 256);
    if (i >= 2 && images.wallpaper) {
      g.drawImage(images.wallpaper, 0, 0, 512, 256);
      g.fillStyle = 'rgba(249,246,239,.93)'; g.fillRect(156, 33, 200, 190);
    }
    if (i === 1) {
      g.fillStyle = '#f5f1e8'; g.fillRect(156, 33, 200, 190);
      // Small editor-like columns, kept peripheral to the legible brand lockup.
      for (let row = 0; row < 12; row++) {
        g.fillStyle = row % 3 ? '#687f77' : '#bd866f';
        g.fillRect(28 + (row % 3) * 7, 48 + row * 13, 42 + (row * 17) % 56, 3);
      }
    }
    if (images.anthropic) g.drawImage(images.anthropic, 200, 48, 112, 12.45);
    if (images.symbol) g.drawImage(images.symbol, 227, 78, 58, 58);
    if (images.wordmark) g.drawImage(images.wordmark, 181, 146, 150, 43.8);
    else { g.fillStyle = '#262624'; g.font = '40px Georgia, serif'; g.textAlign = 'center'; g.fillText('Claude', 256, 183); }
    g.fillStyle = i === 1 ? '#b7c6bf' : '#787b74'; g.font = '9px system-ui, sans-serif';
    g.textAlign = 'left'; g.fillText('SNAP THE ROOM', 18, 239);
    g.textAlign = 'right'; g.fillText('WORKSPACE ' + String(i + 1).padStart(2, '0'), 494, 239);
    g.restore();
  }
  return c;
}

function surfaceProfile(tag, color, palette, maps) {
  const matches = key => palette[key] && color === palette[key].toLowerCase();
  // Race arrows/start-line squares also use the carpet tag: preserve those graphic colors.
  if (tag === 'carpet' && (matches('desktop') || matches('chair') || ['#f7f5f0', '#232b47'].includes(color))) return null;
  if (tag === 'carpet') return { kind: 'carpet', map: maps.carpet, scale: .5, roughness: 1, bump: .00065, color: matches('carpetAccent') ? '#eef3d8' : '#ffffff' };
  if (tag === 'monitor' && (matches('screen') || color === '#2c66dd'))
    return { kind: 'screen', map: maps.screen, scale: 1, roughness: .48, bump: 0, color: '#ffffff' };
  if (tag === 'pillar' || (tag === 'wall' && matches('pillar')))
    return { kind: 'wood', map: maps.wood, scale: .6, roughness: .68, bump: .00013, color: '#ffffff' };
  if (tag === 'desktop') return { kind: 'laminate', map: maps.laminate, scale: .3, roughness: .46, bump: .00005 };
  if (tag === 'chair' && !matches('chairBase')) return {
    kind: 'chair', map: maps.upholstery, scale: .16, roughness: .89, bump: .00035,
    color: matches('coral') ? '#ffc8b9' : '#e4e4e4',
  };
  if (tag === 'cabin' && matches('cabinGlass')) return { kind: 'glass', map: maps.grain, scale: .2, roughness: .36, bump: 0 };
  if (tag === 'divider' && !matches('dividerFrame')) return { kind: 'fabric', map: maps.grain, scale: .065, roughness: .91, bump: .0002 };
  if (['ceiling', 'wall'].includes(tag)) return { kind: 'paint', map: maps.laminate, scale: .5, roughness: .9, bump: .00012 };
  if (['leg', 'chair'].includes(tag)) return { kind: 'metal', map: maps.grain, scale: .075, roughness: .32, metalness: .2, bump: .00002 };
  if (tag === 'desk-item') return { kind: 'accessory', map: maps.grain, scale: .08, roughness: .57, bump: .00004 };
  if (tag === 'cpu' && maps.cpu) return { kind: 'cpu-rgb', map: maps.cpu, scale: 1, roughness: .26, metalness: .18, bump: 0, color: '#ffffff' };
  if (['cpu', 'monitor', 'storage', 'bin', 'cable', 'ramp'].includes(tag))
    return { kind: tag === 'cpu' ? 'cpu' : 'plastic', map: maps.grain, scale: .08, roughness: .61, bump: .00007 };
  if (['cup', 'bottle', 'files', 'plant'].includes(tag))
    return { kind: 'detail', map: maps.laminate, scale: .08, roughness: tag === 'files' ? .93 : .5, bump: .00003 };
  return null;
}

function shaderPatch(material, profile, THREE) {
  const kind = profile.kind;
  const scale = profile.scale.toFixed(5);
  material.onBeforeCompile = shader => {
    shader.vertexShader = VARYINGS + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec4 officeP = vec4(position, 1.0);
      vec4 officeOrigin = vec4(0.0, 0.0, 0.0, 1.0);
      vec3 officeSize = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
      #ifdef USE_INSTANCING
        officeSize *= vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        officeP = instanceMatrix * officeP;
        officeOrigin = instanceMatrix * officeOrigin;
      #endif
      vOfficeSize = officeSize;
      vOfficeLocal = position * officeSize;
      vOfficeNormal = normal;
      vOfficeWorld = (modelMatrix * officeP).xyz;
      vOfficeUv = uv;
      vec3 officeCentre = (modelMatrix * officeOrigin).xyz;
      vOfficeScreen = floor(fract(sin(dot(officeCentre.xz, vec2(12.9898, 78.233))) * 43758.5453) * 4.0);
    `);
    const uvFunction = kind === 'screen' ? `
      vec2 officeUV() {
        // Perspective interpolation may yield 1.999999 for an instance's constant 2.
        // Round before floor/mod to avoid visible salt-and-pepper atlas-cell switching.
        float screenIndex = floor(vOfficeScreen + .5);
        vec2 cell = vec2(mod(screenIndex, 2.0), floor(screenIndex / 2.0));
        return (cell + mix(vec2(.008), vec2(.992), vOfficeUv)) * .5;
      }
    ` : kind === 'cpu-rgb' ? `
      vec2 officeUV() {
        // Atlas rows in the image: glass/front, top/rear. Texture upload flips Y.
        vec3 n = abs(vOfficeNormal);
        vec2 cell = n.x > .5 ? vec2(0., 1.) : (n.y > .5 ? vec2(0., 0.) : (vOfficeNormal.z > 0. ? vec2(1., 1.) : vec2(1., 0.)));
        return (cell + mix(vec2(.012), vec2(.988), vOfficeUv)) * .5;
      }
    ` : kind === 'carpet' ? `
      vec2 officeUV() {
        vec2 p = (vOfficeWorld.xz + vec2(8.0, 6.5)) / .5;
        vec2 tile = floor(p), f = fract(p);
        if (mod(tile.x + tile.y, 2.0) > .5) f = vec2(f.y, 1.0 - f.x);
        return f;
      }
    ` : `
      vec2 officeUV() {
        vec3 n = abs(vOfficeNormal);
        vec2 p = n.y > .5 ? vOfficeLocal.xz : (n.x > .5 ? vOfficeLocal.zy : vOfficeLocal.xy);
        return p / ${scale};
      }
    `;
    shader.fragmentShader = VARYINGS + uvFunction + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D(map, officeUV());
        diffuseColor *= sampledDiffuseColor;
      #endif
      ${kind === 'carpet' ? `
        vec2 carpetF = fract((vOfficeWorld.xz + vec2(8.0, 6.5)) / .5);
        float edge = min(min(carpetF.x, 1.0-carpetF.x), min(carpetF.y, 1.0-carpetF.y));
        diffuseColor.rgb *= mix(.84, 1.0, smoothstep(0.0, .007, edge));
      ` : ''}
      ${kind === 'glass' ? `
        float frost = smoothstep(.002, .006, abs(fract(vOfficeLocal.y / .035)-.5) * .035);
        diffuseColor.rgb *= mix(.73, 1.0, frost);
      ` : ''}
      ${kind === 'chair' ? `
        // Slotted plastic chair backs over dark textile; geometry/colliders stay intact.
        if (vOfficeSize.y > .25 && vOfficeSize.z < .09 && abs(vOfficeNormal.z) > .5) {
          vec2 f = fract((vOfficeLocal.xy + vOfficeSize.xy * .5) / vec2(.039, .061));
          float slot = smoothstep(.20,.27,f.x) * (1.0-smoothstep(.47,.54,f.x)) * smoothstep(.16,.22,f.y) * (1.0-smoothstep(.72,.78,f.y));
          diffuseColor.rgb = mix(vec3(.032), diffuseColor.rgb * .52, slot);
        }
      ` : ''}
      ${kind === 'accessory' ? `
        // Existing keyboard cuboids gain a key grid without hundreds of new meshes.
        if (vOfficeSize.x > .32 && vOfficeSize.y < .035 && vOfficeSize.z > .10 && vOfficeSize.z < .20 && vOfficeNormal.y > .5) {
          vec2 f = fract((vOfficeLocal.xz + vOfficeSize.xz * .5) / vec2(.025, .026));
          float keycap = smoothstep(.08,.17,min(min(f.x,1.0-f.x),min(f.y,1.0-f.y)));
          diffuseColor.rgb = mix(vec3(.009), vec3(.045), keycap);
        }
      ` : ''}
      ${kind === 'cpu' ? `
        if (abs(vOfficeNormal.z) > .5) {
          float vent = smoothstep(.18,.28,fract(vOfficeLocal.y / .013));
          diffuseColor.rgb *= .55 + .45 * vent;
        }
      ` : ''}
    `);
    if (kind === 'screen' || kind === 'cpu-rgb') {
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
        #ifdef USE_EMISSIVEMAP
          totalEmissiveRadiance *= texture2D(emissiveMap, officeUV()).rgb;
          ${kind === 'cpu-rgb' ? `
            vec3 led = texture2D(emissiveMap, officeUV()).rgb;
            float chroma = max(max(led.r, led.g), led.b) - min(min(led.r, led.g), led.b);
            totalEmissiveRadiance *= smoothstep(.06, .28, chroma);
          ` : ''}
        #endif
      `);
    }
    if (material.bumpMap) {
      // r169's standard bump implementation, using meter-scaled projection instead of box UVs.
      shader.fragmentShader = shader.fragmentShader.replace('#include <bumpmap_pars_fragment>',
        THREE.ShaderChunk.bumpmap_pars_fragment.replaceAll('vBumpMapUv', 'officeUV()'));
    }
  };
  material.customProgramCacheKey = () => `office-textures-v1:${kind}:${scale}:${!!material.bumpMap}`;
  material.needsUpdate = true;
}

/** Asynchronous one-time installation. No per-frame work or scene geometry is added. */
export async function installOfficeTextures({ THREE, renderer, bindings, palette = {}, quality = 'high' }) {
  const stats = { materials: 0, loaded: [], failed: [], gpuBytesEstimate: 0, extraDrawCalls: 0, quality, enabled: true };
  const images = {}, textures = new Set(), snapshots = new Map(), applied = new Map();
  const files = { cpu: 'cpu-rgb.webp', carpet: 'carpet.webp', upholstery: 'upholstery.webp', wood: 'wood.webp', laminate: 'laminate.webp', wallpaper: 'wallpaper.webp',
    wordmark: 'claude-wordmark.svg', symbol: 'claude-symbol.svg', anthropic: 'anthropic-wordmark.svg' };
  await Promise.all(Object.entries(files).map(async ([key, file]) => {
    try { images[key] = await loadImage(file); stats.loaded.push(file); }
    catch { stats.failed.push(file); console.warn(`[office-textures] ${file} unavailable; retaining a simpler surface.`); }
  }));
  const anisotropy = Math.min(quality === 'low' ? 2 : 8, renderer.capabilities.getMaxAnisotropy());
  function texture(source, color = true, repeat = true) {
    if (!source) return null;
    let image = source;
    const cap = quality === 'low' ? 256 : 1024;
    if (Math.max(source.width, source.height) > cap) {
      const ratio = cap / Math.max(source.width, source.height);
      image = canvas(Math.round(source.width * ratio), Math.round(source.height * ratio));
      image.getContext('2d').drawImage(source, 0, 0, image.width, image.height);
    }
    const t = new THREE.Texture(image);
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = anisotropy; t.needsUpdate = true;
    textures.add(t); stats.gpuBytesEstimate += Math.ceil(image.width * image.height * 4 * 4 / 3);
    return t;
  }
  const grain = grainCanvas();
  const maps = Object.fromEntries(['carpet', 'upholstery', 'wood', 'laminate'].map(k => [k, texture(images[k])]));
  maps.grain = texture(grain); maps.screen = texture(screenCanvas(images), true, false);
  maps.cpu = texture(images.cpu, true, false);
  const heights = new Map();
  if (quality !== 'low') {
    for (const [key, map] of Object.entries(maps)) {
      if (map && key !== 'screen' && key !== 'cpu') heights.set(map, texture(heightCanvas(key === 'grain' ? grain : images[key]), false));
    }
  }
  const seen = new Set();
  for (const { material, tag } of bindings) {
    if (!material?.isMeshStandardMaterial || seen.has(material)) continue;
    seen.add(material);
    const color = '#' + material.color.getHexString();
    const p = surfaceProfile(tag, color, palette, maps);
    if (!p?.map) continue;
    const old = { copy: material.clone(), onBeforeCompile: material.onBeforeCompile, cacheKey: material.customProgramCacheKey };
    snapshots.set(material, old);
    material.map = p.map;
    material.roughness = p.roughness; material.metalness = p.metalness ?? 0;
    if (p.color) material.color.set(p.color);
    if (p.bump && quality !== 'low') { material.bumpMap = heights.get(p.map); material.bumpScale = p.bump; }
    if (p.kind === 'screen') { material.emissive.set('#ffffff'); material.emissiveMap = maps.screen; material.emissiveIntensity = .68; }
    if (p.kind === 'cpu-rgb') { material.emissive.set('#ffffff'); material.emissiveMap = maps.cpu; material.emissiveIntensity = 1.25; }
    shaderPatch(material, p, THREE);
    applied.set(material, { copy: material.clone(), onBeforeCompile: material.onBeforeCompile, cacheKey: material.customProgramCacheKey });
    stats.materials++;
  }
  let disposed = false;
  function setEnabled(enabled) {
    if (disposed) return;
    for (const [material, state] of enabled ? applied : snapshots) {
      material.copy(state.copy); material.onBeforeCompile = state.onBeforeCompile; material.customProgramCacheKey = state.cacheKey;
      material.needsUpdate = true;
    }
    stats.enabled = !!enabled;
  }
  return {
    stats, setEnabled,
    getDiagnostics() {
      return { ...stats, render: { ...renderer.info.render }, memory: { ...renderer.info.memory }, programs: renderer.info.programs?.length };
    },
    dispose() {
      if (disposed) return;
      setEnabled(false); disposed = true;
      for (const t of textures) t.dispose();
      for (const state of [...snapshots.values(), ...applied.values()]) state.copy.dispose();
      textures.clear(); snapshots.clear(); applied.clear();
    },
  };
}
