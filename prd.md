# Snap the Room v3 — validated build spec

**The demo:** a mouse-sized RC car drives around a recognizable version of our office, threads the carpet aisle, climbs onto a desk, and knocks over lightweight clutter.

**Deadline:** 2–3 hours elapsed, two people working in parallel, live two-minute projector demo. Build a complete two-hour version first; use the third hour only after that version passes rehearsal. Reliable Wi-Fi is available.

**Status:** replaces the pasted five-hour v3 plan and its contradictory snippets. This document specifies the standalone demo, not an integration into the Tri-POD app.

## 1. Validation verdict and scope

The concept is viable as a small procedural driving demo. The original scope is not a reliable two-hour commitment. Vehicle handling is the critical path; office detail can proceed independently. **The desk climb is a target, not a validated capability:** a headless ascent check with the replacement starting values tipped the car. Prove it early or use the explicitly reduced carpet/under-desk demo.

| Finding checked against the actual spec                                                                                                                                                         | Required now?                                                                  | Decision                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| The “12 cm” car has a 30 cm long, 13 cm wide collider and wheel mounts spanning 19 cm longitudinally.                                                                                           | Yes: breaks scale and ground clearance.                                        | Use the consistent car dimensions in section 5.                                                                              |
| In the pinned Rapier package, the controller defaults to forward axis X; the specified car faces Z.                                                                                             | Yes: axis-dependent behavior and speed readings can be wrong.                  | Explicitly set Y-up and Z-forward using the verified accessors.                                                              |
| The original chassis bottom is 60 mm below its body origin, while the wheels reach only 62 mm below it at rest. There is almost no suspension compression available before the chassis grounds. | Yes: a headless flat-floor check reproduced grounding and negligible movement. | Smaller chassis, revised mounts and suspension. Treat the replacement values as a tested starting point, not final handling. |
| Floor box centered at y=0 has its top at 0.05; desktop centered at 0.75 has its top at 0.77. Spawn and ramps assume tops at 0 and 0.75.                                                         | Yes: spawn penetration and raised lips are reachable immediately.              | Define all course elevations as surface heights; offset solid centers downward.                                              |
| The original 2.31 m ramp at 18° rises only 0.714 m. Its projection is about 2.197 m, wider than the 1.8 m aisle implied by the bench centers.                                                   | Yes: the mandatory desk route is not connected by construction.                | One endpoint-defined ramp at a bench end, with room for its full approach.                                                   |
| A 0.37 m divider climb at 20° needs about 1.02 m of horizontal approach on each side; each desktop lane is only 0.60 m deep.                                                                    | No: building extra platforms costs time.                                       | Cross a divider gap in the core demo. An over-divider bridge requires extended supports and becomes optional.                |
| A 0.15 kg car is expected to scatter 6 kg chairs; the draft also says both “60+ chairs” and fewer than 60 dynamic bodies.                                                                       | No: chair destruction is not necessary to prove driving.                       | Static chairs, 8–12 light dynamic props. Optional arcade-weight chairs only after rehearsal.                                 |
| B owns lighting, materials and HUD styling, but cannot edit the only file that implements them. B also waits for A's stub.                                                                      | Yes: prevents effective parallel work.                                         | B creates room data immediately; A owns all engine/render/HUD code. Agree the contract at minute zero.                       |
| Camera height is fixed above the floor even when the car climbs 0.75 m. Near clip distance is unspecified.                                                                                      | Yes: the elevated route can disappear or the car can clip.                     | Car-relative height, short near plane, camera check on the whole route.                                                      |
| Recovery ignores spawn heading and Z validity; held R repeats reset. Focus loss can leave throttle pressed.                                                                                     | Yes: likely live-demo failures, small fixes.                                   | Heading-aware, edge-triggered reset; clear input on blur/hidden tab.                                                         |
| `lengthUnit = 0.12` is supported, but does not fix bad geometry or guarantee stability. The alleged side-friction spelling uncertainty does not apply to this pin.                              | Keep valid setup; remove speculation.                                          | Keep length unit and fixed timestep. Use the exact verified spelling below.                                                  |
| “Under 60 bodies guarantees 60 fps,” “trimeshes always crawl,” and “1:76 is a one-line toggle” are unsupported absolutes.                                                                       | No new system required.                                                        | Use measured performance and simple cuboids; defer all scale toggles.                                                        |

**Must ship:** boot over HTTP, recognizable room, drivable car, keyboard controls, light clutter, readable controls, recovery and two successful rehearsals. **Target route:** floor→desk→floor. If it fails the early driving gate, the deadline fallback is a continuous carpet/under-desk route, with the desk-climb claim removed.

**Only if the core passes:** three collectibles plus a counter, more office detail, a procedural carpet texture, or one simple divider crossing. Choose one addition at a time.

**Cut for this deadline:** eight-objective timer game, chair destruction system, over-divider ramps, skidmarks, dust, engine audio, speed-based FOV, alternate cameras, scale toggle, jumps, air control, slow motion, Gaussian splats, alternate physics engine, kinematic-car fallback. No new backend, model imports, or production deployment work.

## 2. Stack and startup

| Layer    | Choice                                                               |
| -------- | -------------------------------------------------------------------- |
| Renderer | Three.js `0.169.0`, vanilla ES modules and import map                |
| Physics  | `@dimforge/rapier3d-compat@0.14.0`                                   |
| Vehicle  | Rapier `DynamicRayCastVehicleController`                             |
| Units    | Meters, kilograms, seconds; office remains life-size                 |
| Scale    | Approximately 1:36 car; 0.12 m body length                           |
| Files    | `index.html`, `room.js`, `props.js`, `room.fallback.js`              |
| Runtime  | Current desktop browser on the actual demo laptop; local HTTP server |

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
    }
  }
</script>
<script type="module">
  import * as THREE from "three";
  import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/+esm";
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.lengthUnit = 0.12;
  world.timestep = 1 / 60;
</script>
```

Keep the versions pinned. `lengthUnit` adjusts internal length-based tolerances; it does not scale geometry, gravity or forces. It is a reasonable starting choice for the small car, not a cure for grounding or malformed ramps. [Rapier World documentation](https://rapier.rs/javascript3d/classes/World.html#lengthUnit)

Serve the demo directory with an available static server, for example `python3 -m http.server 8000`, and open `http://localhost:8000`. Do not double-click `index.html` through `file://`; this is a multi-file module app, not a self-contained HTML artifact. Check both pinned CDN imports during the first ten minutes. [Three.js installation guide](https://threejs.org/manual/pages/installation.html)

Show a plain HTML “Loading…” message before startup, remove it when ready, and surface initialization errors visibly. Warm the browser cache on the demo laptop, but do not promise offline support. Keep the tested server and tab running for the demo.

## 3. Two-person ownership and frozen contract

| Owner        | Files / responsibility                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| A — Tanay    | `index.html`: imports, loaders, vehicle, input, physics loop, recovery, camera, all render/material/light implementation, minimal HUD |
| B — teammate | `room.js`, `props.js`, `room.fallback.js`: room dimensions, layout, ramps, palette values, static furniture, dynamic-prop placement   |

At minute zero agree this contract. **B creates all three data files within ten minutes**, initially with floor, walls, one desk, one ramp and `PROPS = []`. A can boot renderer/physics and build the vehicle in parallel. Neither person waits fifteen minutes to start their track.

```js
// room.js and room.fallback.js export the SAME names.
export const SPAWN = {
  pos: [-7.0, 0.07, 0], // body origin; above floor and clear of furniture
  heading: Math.PI / 2, // radians about +Y; local +Z faces world +X
};

// One static mesh/cuboid per entry. No behavior inferred from tag.
export const ROOM = [
  {
    pos: [0, -0.05, 0], // center, world meters
    size: [16, 0.1, 13], // full X/Y/Z extents, all positive
    rot: [0, 0, 0], // optional Euler XYZ, radians
    color: "#4a4d52",
    tag: "carpet", // rendering/material grouping only
  },
];

// props.js: one dynamic body + cuboid per entry, same transform convention.
export const PROPS = [
  {
    pos: [-3.0, 0.03, 0.3],
    size: [0.035, 0.06, 0.035],
    mass: 0.02, // kg; explicit gameplay mass
    color: "#ffffff",
    tag: "cup",
  },
];
```

Allowed ROOM tags: `carpet`, `desktop`, `divider`, `leg`, `ramp`, `wall`, `cabin`, `pillar`, `ceiling`, `chair`, `cpu`. PROPS tags: `cup`, `bottle`, `files`, `bin`. New tags alone must not create triggers or new behavior. Defer labels, multi-part dynamic chairs and collectibles until the core is integrated.

Loader rules:

- Divide full extents by two for Rapier cuboid half-extents.
- Convert the optional XYZ Euler rotation to one quaternion and use the same transform for mesh and collider. Do not rotate only the visible ramp.
- ROOM is fixed geometry. PROPS creates one dynamic body with collider mass set once, then synchronizes its mesh from that body.
- World data stays in B's files. A may create car/wheel geometry and lights in `index.html`; the old “no geometry in HTML” ban was incompatible with A owning the car.
- A implements flat colors first. B provides palette/texture direction without editing A's file.

**Fallback is selected before imports**, so a broken live data module cannot prevent loading the fallback:

```js
const fallback = new URLSearchParams(location.search).has("fallback");
const { ROOM, SPAWN } = await import(
  fallback ? "./room.fallback.js" : "./room.js"
);
const { PROPS } = fallback ? { PROPS: [] } : await import("./props.js");
```

Open `/?fallback=1` to select it. B copies a tested simple room into `room.fallback.js` at minute 30 and then leaves it alone. A room fallback cannot repair an engine regression: preserve a complete tested copy of all demo files at the minute-90 milestone, outside the working demo directory.

## 4. Office dimensions and scale cues

These values are carried from the supplied PRD. The referenced photos (`IMG_6182`–`IMG_6198`) were **not attached to this review**, so their dimensions and colors have not been independently verified. Treat them as provisional visual targets. Do not spend the deadline remeasuring the whole office.

| Element                              | Build value                                |
| ------------------------------------ | ------------------------------------------ |
| Room X × Z                           | 16 × 13 m, provisional                     |
| Ceiling / soffit                     | 2.90 / 2.60 m; soffit optional             |
| Ceiling grid                         | 0.60 m; texture/detail optional            |
| Carpet tile                          | 0.50 m; about 4.2 car lengths              |
| Desktop **top surface**              | y=0.75 m                                   |
| Desktop thickness                    | 0.04 m; center y=0.73 m                    |
| Desktop depth per side / whole bench | 0.60 / 1.20 m                              |
| Bench length                         | 9.60 m; eight 1.20 m seat pitches          |
| Divider height / thickness           | 0.37 / 0.05 m; top y=1.12 m                |
| Bench Z centers                      | -4.8, -1.6, 1.6, 4.8 m                     |
| Clear aisle between desktop edges    | 3.20 − 1.20 = 2.00 m, before chairs        |
| Under-desktop surface                | y=0.71 m; keep a clear driving route below |
| Chair seat / back top / base radius  | Approximately 0.45 / 0.95 / 0.32 m         |

The 0.75 m desk is **6.25 car lengths high**, not six car heights. A 0.60 m desktop is about eleven chassis widths with the corrected 55 mm chassis. Do not mix model scale ratios with office scaling.

```text
carpet        #4a4d52    grey, optional 500 mm procedural stripes
carpet accent #8a8f5a    yellow-olive
desktop       #f2f0ec    white laminate
desk frame    #c8c8c4    light grey
divider top   #2b3a5c    dark blue
divider low   #5a2430    maroon, optional detail
divider frame #d8d6d0    aluminium, optional detail
wall          #f0a860    peach/orange hero wall
other walls   #f0f0ee
ceiling       #f4f4f2
pillar        #6b4a2f    dark wood
cabin glass   #7d8b99    opaque grey-blue for the core demo
chair         #1c1c1e    dark, optional #b8bcc0 base
```

Recognition priorities: carpet grid, long white desk runs, blue dividers, orange cabin wall, dark chairs. Add the five cabin panels and two wood pillars if the driving corridor stays clear. Full ceiling detail, labels and exact chair counts are optional.

## 5. Car: consistent dimensions and verified API

Office geometry stays in meters. Use named constants for all car dimensions, wheel offsets, forces and camera offsets. Changing scale later still requires retuning these values.

```js
const CAR = {
  len: 0.12,
  wid: 0.055,
  hgt: 0.025, // full chassis collider extents; wheels extend outside the body
  mass: 0.15,
  colliderY: -0.004,
  wheelX: 0.032,
  wheelY: -0.008,
  wheelZ: 0.042,
  wheelR: 0.014,
  suspRest: 0.025,
  suspTravel: 0.012,
  stiffness: 250,
  compression: 15,
  relaxation: 18,
  frictionSlip: 2.2,
  sideFriction: 0.6,
  engineFwd: 0.35, // peak Newtons per rear wheel; tune on the ramp
  engineRev: -0.15,
  brake: 0.02, // maximum impulse per wheel; not a force in Newtons
  maxSteer: 0.45,
  steerLerp: 0.25, // per fixed physics step, not per rendered frame
  maxSpeed: 1.2, // m/s; motor target, not a guarantee on downhill speed
  maxReverseSpeed: 0.5,
};

const spawnRotation = {
  x: 0,
  y: Math.sin(SPAWN.heading / 2),
  z: 0,
  w: Math.cos(SPAWN.heading / 2),
};
const chassis = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(...SPAWN.pos)
    .setRotation(spawnRotation)
    .setLinearDamping(0.08)
    .setAngularDamping(1.0)
    .setCcdEnabled(true)
);
world.createCollider(
  RAPIER.ColliderDesc.cuboid(CAR.wid / 2, CAR.hgt / 2, CAR.len / 2)
    .setTranslation(0, CAR.colliderY, 0)
    .setMass(CAR.mass),
  chassis
);

const vehicle = world.createVehicleController(chassis);
vehicle.indexUpAxis = 1;
vehicle.setIndexForwardAxis = 2; // 0.14.0 setter PROPERTY, not a function call

const WHEELS = [
  [-CAR.wheelX, CAR.wheelY, CAR.wheelZ],
  [CAR.wheelX, CAR.wheelY, CAR.wheelZ],
  [-CAR.wheelX, CAR.wheelY, -CAR.wheelZ],
  [CAR.wheelX, CAR.wheelY, -CAR.wheelZ],
];
WHEELS.forEach(([x, y, z], i) => {
  vehicle.addWheel(
    { x, y, z },
    { x: 0, y: -1, z: 0 },
    { x: -1, y: 0, z: 0 },
    CAR.suspRest,
    CAR.wheelR
  );
  vehicle.setWheelSuspensionStiffness(i, CAR.stiffness);
  vehicle.setWheelSuspensionCompression(i, CAR.compression);
  vehicle.setWheelSuspensionRelaxation(i, CAR.relaxation);
  vehicle.setWheelMaxSuspensionTravel(i, CAR.suspTravel);
  vehicle.setWheelFrictionSlip(i, CAR.frictionSlip);
  vehicle.setWheelSideFrictionStiffness(i, CAR.sideFriction);
});
```

Steer wheels 0 and 1; drive wheels 2 and 3. Verify forward and left/right directions visually before adding the office. Wake the chassis on driving input so an idle car responds after sleeping. Reduce motor force toward zero as signed forward speed approaches the configured forward/reverse limit; do not apply unlimited constant acceleration across a 16 m room. Space overrides throttle with braking.

The downward collider offset also moves collision geometry; it is not a free center-of-mass adjustment. Keep adequate underside clearance after suspension compression. Rapier does expose mass-property APIs with an explicit center of mass, so the original claim that moving the collider is the only option is incorrect. Custom inertia work is unnecessary for this deadline. [Rapier mass properties](https://rapier.rs/docs/user_guides/javascript/rigid_body_mass_properties/)

**Validation performed:** inspected the published 0.14.0 package declarations and initialized its WASM locally. Confirmed `lengthUnit`, both axis accessors and all six wheel setters. With a flat floor at y=0, the original geometry settled onto its chassis; the revised dimensions/suspension supported the car at approximately y=0.041 and moved forward under rear-wheel force. The replacement ramp's top-face endpoints also match the intended surfaces mathematically. **A subsequent straight-line ascent test with the replacement values tipped the car; the ramp-driving acceptance check has not passed.** Do not present these constants as finished handling. Browser controls, braking, steering, camera and projector performance remain untested.

Version-specific primary references: [0.14.0 vehicle declarations](https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/control/ray_cast_vehicle_controller.d.ts), [0.14.0 world declarations](https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/pipeline/world.d.ts), [0.14.0 collider declarations](https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/geometry/collider.d.ts). In this pin, the spelling is exactly `setWheelSideFrictionStiffness`; do not add speculative alternate method names.

## 6. Course: build one connected route

**Core route:** spawn on carpet → aisle between desk runs → approach the end ramp → drive along one desktop lane → turn through a divider gap if convenient → return down the same ramp → knock over cups on the carpet. No jump is required.

Start with one complete bench at z=-1.6. Add the other runs after the route works. Leave the west end of the room clear for the ramp and turning approach.

### Corrected surface-based starter

This is a starter for B's `room.js`, not the finished office. The floor, desktop and ramp use the same surface convention.

```js
export const SPAWN = { pos: [-7.0, 0.07, 0], heading: Math.PI / 2 };
const W = 16,
  D = 13,
  CEIL = 2.9;
const DESK_TOP = 0.75,
  TOP_T = 0.04,
  RUN_LEN = 9.6;
const BENCH_Z = -1.6,
  DIV_H = 0.37;
const R = [];
const add = (pos, size, color, tag, rot) =>
  R.push({ pos, size, color, tag, rot });

add([0, -0.05, 0], [W, 0.1, D], "#4a4d52", "carpet");
add([0, CEIL / 2, -D / 2], [W, CEIL, 0.2], "#f0a860", "wall");
add([0, CEIL / 2, D / 2], [W, CEIL, 0.2], "#f0f0ee", "wall");
add([-W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f0f0ee", "wall");
add([W / 2, CEIL / 2, 0], [0.2, CEIL, D], "#f0f0ee", "wall");

for (const side of [-1, 1]) {
  const z = BENCH_Z + side * 0.3;
  add(
    [0, DESK_TOP - TOP_T / 2, z],
    [RUN_LEN, TOP_T, 0.6],
    "#f2f0ec",
    "desktop"
  );
  for (let s = 0; s <= 8; s++) {
    const x = -RUN_LEN / 2 + s * 1.2;
    // Slightly inset end supports to keep the ramp junction clear.
    const legX = Math.max(-4.65, Math.min(4.65, x));
    add([legX, 0.355, z], [0.05, 0.71, 0.05], "#c8c8c4", "leg");
  }
}
for (let s = 0; s < 8; s++) {
  if (s === 3) continue; // one clear cross-lane passage; no elevated bridge
  add(
    [-4.8 + 0.6 + s * 1.2, DESK_TOP + DIV_H / 2, BENCH_Z],
    [1.14, DIV_H, 0.05],
    "#2b3a5c",
    "divider"
  );
}

// Top-face endpoints: floor → west edge of the south desktop lane.
// Length lies along local X; rotate around Z to climb toward world +X.
const p0 = [-7.25, 0, -1.9];
const p1 = [-4.8, DESK_TOP, -1.9];
const dx = p1[0] - p0[0],
  dy = p1[1] - p0[1];
const theta = Math.atan2(dy, dx);
const length = Math.hypot(dx, dy);
const thickness = 0.01;
// Subtract half-thickness along the rotated top normal (-sinθ, cosθ, 0).
add(
  [
    (p0[0] + p1[0]) / 2 + (Math.sin(theta) * thickness) / 2,
    (p0[1] + p1[1]) / 2 - (Math.cos(theta) * thickness) / 2,
    p0[2],
  ],
  [length, thickness, 0.4],
  "#b8b0a4",
  "ramp",
  [0, 0, theta]
);
export const ROOM = R;
```

This ramp has 2.45 m horizontal run, 0.75 m rise, approximately 2.56 m slope length and 17° incline. Its top edge meets the desktop at x=-4.8, y=0.75, with its width inside that lane. Unlike the original aisle ramps, it fits in the clear space at the bench end.

**Drive-test the junction as soon as flat-floor driving works:** approach slowly, climb without tipping or the nose catching, cross onto the desktop, then descend. The endpoint math establishes alignment but does not prove vehicle handling or clearance at the crest. Spend at most fifteen minutes tuning the approach speed, suspension and clearance against the actual failure. Never fix it by rotating only the mesh. If the route still fails by minute 60, freeze the two-hour scope around carpet and under-desk driving and remove the desk-climb claim from the live pitch. Revisit the climb only if the third hour exists and the reduced demo is already safe.

**Divider bridge, optional:** a 0.37 m rise at 20° needs roughly 1.08 m slope length and 1.02 m horizontal run per side, plus a connecting crest. That exceeds each 0.60 m lane. It requires extended approach platforms, a continuous crest and a separate driving test. Do not paste the original two disconnected 1.02 m ramps back in.

## 7. Physics loop, input, recovery and camera

Use an accumulator at 60 physics steps/second. Cap the incoming elapsed time at 0.1 seconds and limit catch-up to six steps per rendered frame; drop excess backlog after severe stalls. Each fixed step:

1. Consume edge-triggered reset if requested; update steering and speed-limited throttle.
2. Set steering, rear-wheel force and all four brake values.
3. Call `vehicle.updateVehicle(world.timestep)`.
4. Call `world.step()`.
5. Check bounds and upside-down duration using simulation time.

After stepping, synchronize chassis, wheel visuals and dynamic props; update camera and render. Wheel visuals follow suspension/steering rather than remaining fixed at the connection points. Render interpolation is optional unless visible jitter appears. Keep physics timestep constant on every machine. [Rapier timestep guidance](https://rapier.rs/docs/user_guides/javascript/integration_parameters/)

Controls: WASD and arrows, Space brake, R recover. Prevent default scrolling for game keys. On window blur or hidden tab, clear held keys and pause; on return, reset frame timestamp/accumulator so the car does not jump ahead. A held R produces one reset per press.

Recovery:

- Manual R, y below -2, position outside room bounds plus a 1 m margin, or continuously upside down for 1.5 seconds → safe spawn.
- Restore both `SPAWN.pos` and its heading quaternion. Zero linear/angular velocity, steering and pending drive/brake input; reset the upside-down timer and snap the camera to the recovered car.
- Check finiteness of X/Y/Z, rotation and velocities. If the physics state becomes non-finite, use a visible restart/reload path; teleporting one invalid body is not guaranteed to repair the simulation.
- Browser reload is the full demo reset, restoring moved props and optional objectives. Avoid a second custom world-reset system.

Camera: start 0.35 m behind the car and 0.08–0.12 m above the **car's position**, using heading for the trailing offset. Follow vertical movement onto the desk. Fixed 60° FOV, near plane around 0.005 m and far plane around 50 m. Use elapsed-time-based smoothing or equivalent consistent behavior across refresh rates.

If furniture blocks the camera, shorten its trailing distance using one obstruction check or adjust the demonstrated route. A full camera rig is optional; keeping the car visible during the practiced route is required. Reset the camera immediately after recovery.

## 8. Clutter, visuals and performance

Start with 8–12 small dynamic cups/files on the carpet or desktop, approximately 0.01–0.05 kg each. Spawn them resting on surfaces without overlap and leave the ramp clear. CPU boxes, bins and chairs are static in the core build. Use coarse cuboid furniture; articulated casters and compound moving chairs are unnecessary.

If chair scattering remains important after the core passes, add only 2–4 deliberately light arcade chairs, approximately 0.15–0.30 kg each, and test the collisions. Do not describe those masses as realistic. Do not make every visible chair dynamic.

- Aim for 60 fps on the actual laptop/projector; sustained 30 fps is the minimum demo acceptance target, not a guarantee from a body-count threshold.
- Start without shadows, with one directional and one ambient light. Add directional shadows only if performance and lighting remain acceptable. A ceiling must not unintentionally block all useful direct light.
- Cap pixel ratio at 1.5; drop to 1 if needed. No post-processing.
- Reuse box geometry/materials. With several full bench runs, instance static boxes by compatible material/color, using per-instance transforms. Tag alone does not guarantee shared material. Do not spend the first hour on dynamic instancing for twelve props.
- Targets: fewer than 150 draw calls and 200k triangles. Measure the actual scene; these are budgets, not proof of a frame rate.
- Keep environment collision shapes as simple fixed cuboids. No trimesh pipeline is needed for this box-based room.
- If performance fails: disable shadows → pixel ratio 1 → reduce dynamic props → remove optional details. Preserve the car and tested route.

Minimal HUD: title, “WASD / arrows · Space brake · R recover,” and a loading/error message. Make it readable on the projector. No audio/autoplay work in the core.

Optional objectives: only after the complete route works, B exports three reachable collectible positions and A adds visual markers with distance checks and a counter. Agree that small contract extension together. No physics bodies, leaderboard, persistence or timer system required. Never place an objective on an untested tier.

## 9. Parallel schedule and stop rules

| Elapsed                 | A — engine and driving                                                      | B — office and route                                          | Gate                                                                              |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 0:00–0:10               | Verify imports on demo laptop; boot scene/world; build car constants        | Create the three data modules, floor, desk and ramp stub      | Frozen contract; both can run the page                                            |
| 0:10–0:30               | Loader, vehicle, fixed loop, keyboard controls, basic follow camera         | One bench, surface-aligned ramp, palette, hero wall           | Flat-floor driving; save simple fallback room                                     |
| 0:30–0:45               | Tune grounding, forward/steering, braking; first ramp attempt; add R        | Add recognizable runs/furniture around the clear route        | First integrated build; quick projector check                                     |
| 0:45–1:10               | At most 15 minutes on ramp failures; finish focus handling and chosen route | Adjust ramp/obstacles; place 8–12 light props                 | Decide desk vs carpet route by 1:00; if vehicle remains unstable, stop all extras |
| 1:10–1:30               | Fix reset/camera/resize issues; minimal HUD                                 | Remove obstructing geometry; finish highest-value visual cues | Scope freeze and complete tested backup at 1:30                                   |
| 1:30–1:45               | Together: actual two-minute demo, twice, on projector                       | Together: record failures and simplify route                  | All core acceptance checks pass                                                   |
| 1:45–2:00               | Only fixes; verify launch and fallback                                      | Only fixes; preserve final data files                         | Two-hour deliverable ready                                                        |
| 2:00–2:30, if available | One optional feature, e.g. three-item counter                               | Matching placements or carpet detail                          | Keep the two-hour build intact                                                    |
| 2:30–3:00, if available | Rehearse again; revert optional addition by using saved build if needed     | Same                                                          | Final freeze; no new features                                                     |

Use short integration checks at minutes 10, 30, 45 and 90; do not wait until hour two for the first combined run. Fix seam problems immediately. A owns handling; B keeps improving the recognizable room while A tunes. Both drive-test the ramp because code and layout have to agree.

If there are only two hours, optional third-hour work does not start. If time slips, cut in this order: optional objectives/effects → detailed chairs/labels/ceiling → extra desk runs → elevated route if it cannot be made reliable. Retain truthful claims about the resulting demo.

## 10. Acceptance and two-minute demo

The build is ready only when both people can run this checklist on the demo setup:

- Fresh HTTP page load resolves pinned modules, initializes WASM and shows a playable scene without uncaught errors.
- Car settles above the floor, drives forward/reverse, steers correctly, brakes and resumes after sitting idle.
- Complete the chosen route twice, including the desk ramp in both directions if it is advertised. No snagged crest, invisible collider wall or blocked camera.
- Strike several lightweight props without destabilizing the car or frame rate.
- R restores position, heading and camera in one action. Losing focus stops input. Reload restores the whole demo.
- Projector resize/aspect change preserves a visible car and readable HUD; performance meets the agreed minimum during the route.
- `/?fallback=1` loads without the live room/props modules, and the separate complete backup is launchable.

Suggested live sequence: 0:00–0:15 establish the recognizable office and scale; 0:15–0:45 drive the aisle and under a desk; 0:45–1:20 climb and drive the desktop; 1:20–1:45 descend and scatter cups; 1:45–2:00 show recovery and hand over controls. If the ramp was cut, use a rehearsed carpet route instead and say so.

## 11. Implementation handoff prompts

**A — engine:** Build only `index.html` against sections 2, 3, 5 and 7. Use the exact pinned versions and verified Rapier API. Start from the corrected car constants; explicit Y-up/Z-forward, fixed timestep, matching collider/mesh transforms, speed-limited rear drive, keyboard input, focus handling and heading-aware recovery. Load room fallback before importing live data. Use simple colors and lights, a car-relative chase camera and controls HUD. Tune driving before optional rendering work. Do not regenerate B's modules.

**B — room:** Build only `room.js`, `props.js` and `room.fallback.js` against the shared contract. Use section 4's provisional office dimensions and palette, and section 6's surface-aligned bench-end ramp. Ship the stub immediately, then preserve the fallback at minute 30. Keep the car route, ramp approach and camera corridor clear. Add 8–12 lightweight props; chairs remain static. Coordinate transform/ramp failures with A. Do not add triggers, renderer code or extra data fields without agreeing the extension.

The deadline calls for one repeatable driving demo. Do not restart architecture or regenerate both tracks to add polish.

