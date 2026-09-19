# Office texture pack

Integrated into the existing vanilla HTML + Three.js game and room preview. This is a rendering-only module: it does not change the room layout, geometry, colliders, driving controller, or simulation loop.

## What it adds

- **Carpet:** one AI-generated gray ribbed carpet tile, inferred from the supplied office photos, repeated at 50 cm with neighboring tiles rotated 90°. Sparse olive threads, shallow fiber relief, and narrow tile seams. Race markings retain their original colors.
- **Furniture:** black woven chair upholstery, slotted plastic back detail, subtle off-white melamine tabletops, and walnut veneer on the pillars and matching trim.
- **Other surfaces:** fine grain on plastic/paint, keyboard key grids, CPU vents, fabric partitions, frosted glass stripes, and differentiated roughness for metal and accessories. These supplementary details are shader/canvas generated.
- **Displays:** one shared atlas with four static screen variants. Every variant includes the Anthropic wordmark, orange Claude symbol, and official Claude wordmark underneath. Some variants include an AI-generated mountain-lake wallpaper. The official lettering is vector artwork, so no replacement font or font download is required.

These are photo-informed generated materials, not calibrated PBR scans. The existing simple object silhouettes remain; the change supplies surface detail rather than rebuilding furniture.

## Run and compare

Serve the project normally, then open:

| URL | Behavior |
| --- | --- |
| `/` | Textures enabled by default |
| `/?textures=low` | Lower GPU memory, no bump maps, lower anisotropy |
| `/?textures=off` | Original game materials; texture pack is not loaded |
| `/preview.html?view=aisle&noroute` | Carpet and office inspection |
| `/preview.html?view=desk-lane&noroute` | Furniture and screen inspection |

`?detail=low` also selects low texture quality. The preview's **surface textures** button toggles the pack. Failed image loads retain simpler materials and report the failed file in diagnostics.

## Reuse as a module

Keep `office-textures.js` and `assets/office-textures/` together. Asset URLs resolve relative to the module, so deployment under a subdirectory works. There are no added packages or build steps.

```js
import { installOfficeTextures } from './office-textures.js';

const pack = await installOfficeTextures({
  THREE,                         // the host's existing Three.js r169 instance
  renderer,
  palette: PALETTE,               // the room's existing semantic color palette
  bindings: [
    { material: floorMaterial, tag: 'carpet' },
    { material: deskMaterial, tag: 'desktop' },
    { material: chairMaterial, tag: 'chair' },
    { material: screenMaterial, tag: 'monitor' },
  ],
  quality: 'high',                // 'low' is the smaller GPU option
});

pack.setEnabled(false);          // restore original material properties/hooks
pack.setEnabled(true);           // reapply the shared textures
console.table(pack.getDiagnostics());
pack.dispose();                  // restore originals and release owned GPU textures
```

Call once after office materials are created, before starting rendering. The current hosts already do this. Use a distinct material for each semantic color/tag pair, as the game already does. Do not share an office material with an unrelated object. Dispose before reinstalling on the same materials.

The adapter targets the project's unit box geometry, scaled meshes/instances, meter units, and semantic tags. Surface projection preserves instancing. Carpet coordinates use the current room origin offset `(8, 6.5)` and a 0.5 m tile. For a different room, adjust that origin/tile size in `shaderPatch`. Screen identification uses `palette.screen`; other semantic palette keys select trim, chair bases, glass, and race marking exclusions. A different model topology or Three.js shader revision needs adapter review.

## Size and performance

Runtime image assets total **464,188 bytes (453 KiB)**: carpet 1024²; upholstery, wood and laminate 512²; wallpaper 768 pixels wide; three small SVG brand assets. Original photos and full-resolution generated PNGs are not shipped. The five image prompts are in `assets/office-textures/generation-prompts.json`; all five images were generated with the built-in image generation tool, then resized/compressed to WebP.

GPU estimates include RGBA mip chains: **13.75 MiB high**, **1.58 MiB low**. These exclude the renderer's existing targets and unrelated textures. Low mode uses the same compressed downloads but downsamples textures before GPU upload. Bump maps are derived once at load time, screens are drawn once into an atlas, and no texture is repainted per frame. The module adds no geometry, draw calls, physics bodies, lights, or frame callbacks. Mipmaps and capped anisotropy reduce distant carpet shimmer.

Live inspection: `window.__officeTextures.getDiagnostics()` returns loaded/failed assets, estimated texture allocation, and actual renderer counters. `?debug=1` retains the game's existing diagnostics.

## Asset sources

The supplied office photos informed the generated materials, especially the floor-level carpet/chair shots and close desktop/column views. No people or photographed computer contents are included in the textures. Exact generation prompts and reference filenames are recorded alongside the assets.

Claude symbol/wordmark and Anthropic wordmark path artwork were extracted from the official [Claude website](https://claude.com/) on 2026-09-19. They remain Anthropic's brand artwork; this pack does not claim authorship of those marks.

## Validation

The game and room preview were inspected in Chromium at floor and desk height. High and low texture modes loaded all eight runtime assets without browser or shader errors. Existing driving checks passed **32/32** across the normal and fallback rooms. Room validation returned **0 failures**, with its existing warning about the hypothetical uninstanced draw-call count; the game uses instancing.

The plugin's enable/disable/re-enable cycle preserved the same 61 draw calls and 14,686 triangles at the inspected scene pose. Disposal restored the original materials and reduced renderer texture allocations from 12 to the existing baseline of 1.

Browser verification used a software WebGL renderer. It verifies rendering and resource behavior, not hardware frame-rate performance. Check frame time on the target device before claiming a 60 fps target.
