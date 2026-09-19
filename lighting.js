// lighting.js — B's palette / lighting / material DIRECTION for A (prd.md §3: "B provides palette
// and texture direction without editing A's file"). Pure data. A may import it or copy values.
// preview.html renders exactly these values so what you see in the preview is what A can ship.
//
// Core-demo rule set (prd.md §8): no post-processing, shadows optional, pixel ratio ≤ 1.5.

export const LIGHTING = {
  // renderer
  toneMapping: "ACESFilmic", // THREE.ACESFilmicToneMapping
  exposure: 1.1,
  pixelRatioCap: 1.5,
  background: "#e9e4dc", // warm off-white; only visible through gaps, matches the wall tone

  // sky/ground hemisphere = the "office fluorescent + carpet bounce" base fill
  hemi: { sky: "#e6ecf5", ground: "#5b5348", intensity: 1.15 },

  // ambient floor so nothing under the desks goes black
  ambient: { color: "#ffffff", intensity: 0.25 },

  // key "sun": warm, from the south-east high up so the orange hero wall (north) is lit,
  // the ramp face reads as a bright plane and the white desks separate from the carpet.
  sun: {
    color: "#fff1dc",
    intensity: 2.2,
    position: [6, 7, 5], // world meters; target is the room center
    castShadow: true, // preview only unless A confirms fps; PRD says start without shadows
    shadowMapSize: 2048,
    shadowBias: -0.0005,
    shadowNormalBias: 0.02,
    // orthographic shadow frustum covering the whole 16 x 13 room
    shadowBounds: 11,
  },

  // cool fill from the north-west so the shaded sides of dividers/chairs stay blue-grey, not muddy
  fill: { color: "#cfe0ff", intensity: 0.55, position: [-8, 4, -6] },

  // gentle desk-height rim from below the ceiling toward the driven lane so the car pops on white
  rim: { color: "#ffd9b0", intensity: 0.35, position: [-3, 2.6, -1.9] },
};

// Per-tag PBR params for MeshStandardMaterial. Flat colors come from each ROOM/PROPS entry.
export const MATERIALS = {
  carpet: { roughness: 1.0, metalness: 0.0 },
  desktop: { roughness: 0.45, metalness: 0.0 },
  divider: { roughness: 0.85, metalness: 0.0 },
  leg: { roughness: 0.35, metalness: 0.6 },
  ramp: { roughness: 0.6, metalness: 0.05 },
  wall: { roughness: 0.95, metalness: 0.0 },
  cabin: { roughness: 0.15, metalness: 0.2 },
  pillar: { roughness: 0.7, metalness: 0.0 },
  ceiling: { roughness: 1.0, metalness: 0.0 },
  chair: { roughness: 0.6, metalness: 0.15 },
  cpu: { roughness: 0.5, metalness: 0.3 },
  monitor: { roughness: 0.3, metalness: 0.4 },
  cup: { roughness: 0.4, metalness: 0.0 },
  bottle: { roughness: 0.2, metalness: 0.1 },
  files: { roughness: 0.9, metalness: 0.0 },
  bin: { roughness: 0.6, metalness: 0.2 },
  default: { roughness: 0.7, metalness: 0.0 },
};

// Optional procedural carpet-tile texture (prd.md §1 "only if the core passes"). Canvas-based,
// no downloads. tile = 0.50 m grid; the preview draws it, A can copy the function below.
export const CARPET = {
  tile: 0.5, // meters
  base: "#4a4d52",
  seam: "#3d4045", // slightly darker grout line between tiles
  fleck: "#585c62", // noise flecks
  seamPx: 3,
  texturePx: 256, // per tile
};

// Screen faces (tag "monitor", color = PALETTE.screen) can be emissive so monitors read as "on".
export const EMISSIVE = {
  "#2f3b52": { color: "#3d5a8a", intensity: 0.9 },
};
