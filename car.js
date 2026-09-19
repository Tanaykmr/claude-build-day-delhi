// car.js — shared vehicle constants and physics logic (Track A). Imported by index.html AND
// check-drive.mjs so the browser car and the headless test car cannot drift apart.
// Pure Rapier; no THREE or DOM. RAPIER is passed in because the browser loads it from the CDN
// and Node loads it from node_modules.
//
// Attribution: the 'joyride' handling (planar forward/lateral model, speed-scaled steering authority,
// throttle taper, brake-before-reverse, reverse cap, rolling + quadratic drag, grip/drift lateral decay,
// bicycle-model yaw target with sliding yaw inertia, visual squat/lean) and the chase-camera equations
// ported in index.html are adapted from Joyride by nitzangames — https://github.com/nitzangames/joyride,
// revision ea4285dd07215002f0422c2e518320e83969704c, src/logic/vehicle.js and src/logic/camera.js,
// ISC license. Constants are rescaled for a 12 cm RC car (see JOYRIDE below); Joyride itself is a flat city,
// so suspension, ramps, landings and collisions here stay with Rapier.

// Geometry notes: the wheel contact point sits (wheelR + compressed suspension - wheelY) below the body
// origin. Keep that small relative to wheelX (roll-over) and wheelZ (wheelie) — a 0.15 kg car with
// ~1 N of drive tips easily when its center of mass rides high. Tuned with check-drive.mjs.
const DEFAULTS = {
  len: .12, wid: .055, hgt: .025, mass: .15, colliderY: -.004,
  wheelX: .036, wheelY: 0, wheelZ: .042, wheelR: .014, wheelWidth: .01,
  suspRest: .02, suspTravel: .015, stiffness: 180, compression: 12,
  relaxation: 16, frictionSlip: 2.2, sideFriction: .6,
  engineFwd: .4, engineRev: -.2, taper: .3, // taper = fraction of maxSpeed over which motor force fades to zero
  brake: .002, governor: 1.25, // brake = max impulse per wheel per step; governor = overspeed factor that engages engine braking downhill
  maxSteer: .45, steerLerp: .25, maxSpeed: 1.2, maxReverseSpeed: .5,
  linearDamping: .08, angularDamping: 1, chassisFriction: .4,
  // Angular inertia multipliers (pitch about X, yaw about Y, roll about Z) applied to the collider
  // cuboid's own inertia. The bare 55×25 mm box has so little roll inertia that tire side impulses
  // applied below the center of mass make the roll axis oscillate and lift wheels.
  inertia: [2, 2, 4],
};
// check-drive.mjs sets globalThis.CAR_OVERRIDE before importing this module to sweep tunings.
export const CAR = Object.freeze({ ...DEFAULTS, ...(globalThis.CAR_OVERRIDE || {}) });
export const STEP = 1 / 60;
export const ROOM_FRICTION = .7;
export const WHEELS = [
  [-CAR.wheelX, CAR.wheelY, CAR.wheelZ], [CAR.wheelX, CAR.wheelY, CAR.wheelZ],
  [-CAR.wheelX, CAR.wheelY, -CAR.wheelZ], [CAR.wheelX, CAR.wheelY, -CAR.wheelZ],
];
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Handling selector. 'joyride' (default since milestone A1) = the Rapier DynamicRayCastVehicleController does
// suspension and wheel contact ONLY; propulsion, braking, lateral grip and yaw are Joyride's planar model
// written onto the chassis velocity. 'classic' = the previous controller, where Rapier's wheels drive, brake
// and grip (engine force / brake impulse / tire friction); kept selectable for comparison and as the fallback
// (?handling=classic in the browser, --handling=classic in check-drive.mjs). Chosen per car in
// createCar({ handling }); never a global. Promotion evidence: check-drive 32/32 on both rooms and --ramp=15,
// jitter metrics at or below the classic BASELINE in check-drive.mjs, filmstrips in .shots/a4-joy-strip-*.
export const HANDLINGS = Object.freeze(['classic', 'joyride']);
export const DEFAULT_HANDLING = 'joyride';

// Joyride CRUISER → 12 cm RC car. Scaling decisions (Joyride values in brackets):
// • Speed. maxSpeed stays the office's 1.2 m/s = 10 car lengths/s [32 m/s = 7 lengths/s]; the room, ramp and
//   lane widths were validated at this speed, and lengths/s are already the same order, so seconds are
//   comparable between the two cars and per-second rates (grip, easing) are copied unscaled.
// • Accel 4.5 m/s² [8]. NOT scaled by the accel:maxSpeed ratio (0.25 s⁻¹ → 0.3 m/s²): the 17° ramp adds
//   g·sin17° = 2.87 m/s² of downhill pull, so with the (1-(v/max)²) taper the motor needs ≥ ~4 m/s² to hold
//   0.7 m/s on the slope. Time to 95% of top speed ≈ 1.83·max/accel = 0.5 s [7.3 s]; that snappiness is what
//   a 150 g RC car does, and what the classic controller already did.
// • Brake 3 m/s² [14]. Joyride's brake:accel ratio (1.75) would give 8 m/s² and a 0.15 s stop; Joyride's
//   stopping distance (8 lengths) would give 0.75 m/s² and a 1.6 s stop that overruns the 0.575 m desk lane.
//   3 m/s² stops from top speed in 0.4 s over 0.24 m (2 lengths), inside check (d)'s 1.05 s gate.
// • Grip 7 /s, driftGrip 2.2 /s, steer/yaw easing 8 /s and 3 /s, visual easing 6 /s: per-second rates, copied.
// • slipThreshold 0.28 m/s [6 m/s]. The maxSpeed ratio alone gives 0.225 (18.75% of top speed), but the
//   lateral speed a corner builds is vF·yawRate/grip and our yawRate per unit of speed fraction is 1.25× the
//   CRUISER's (10 lengths/s over a 0.70-length wheelbase vs 7 over 0.61). Multiplying by that 1.25 keeps the
//   same grip envelope: full lock holds up to ~60% of top speed and breaks away above it, as in Joyride.
// • steerMax 0.5 rad [0.5], authority 1-0.6·|vF|/max [same]; wheelbase = 2·wheelZ = 0.084 m [2.8 m].
//   Low-speed turning radius wheelbase/tan(steerMax) = 0.154 m = 1.3 lengths [5.1 m = 1.1 lengths].
// • Drag: rolling 0.12 /s, quadratic 0.08 /m chosen so each costs the same FRACTION of accel at top speed
//   as Joyride's do (3.2% and 2.5%) [0.008 /s, 0.0002 /m]. Drag alone would still let gravity take the car
//   to ~6 m/s down the ramp, so the classic downhill governor is kept: engine braking above governor·maxSpeed.
// • reverseCap 35% [35%]; brake-before-reverse and "nearly stopped" thresholds 0.02 m/s [0.5 m/s], handbrake
//   creep kill 0.011 m/s [0.3 m/s], both scaled by the maxSpeed ratio.
// • Handbrake drag 0.1·brake = 0.3 m/s² [0.6·brake = 8.4 m/s²]. Joyride's ratio would be 1.8 m/s² here and stop
//   the car in 0.6 s, because our service brake is deliberately strong relative to speed (see Brake). The
//   handbrake is a slide initiator, so it is scaled to Joyride's handbrake-only stop time from top speed
//   instead: ~4 s [3.8 s]. The slide itself comes from driftGrip and the yaw-rate easing, not from the drag.
// • Airborne = fewer than 2 wheels in contact: no traction, no yaw authority, Rapier integrates gravity.
// • Visual squat/lean: pitch = -0.012·aF (nose up under power), roll = +0.02·yawRate·vF, clamped ±0.12 rad
//   [same magnitudes]. The roll sign is flipped relative to Joyride's mesh: with +X = left, a positive rotation
//   about the forward axis drops the RIGHT side, so the body leans OUT of a left turn as a sprung body does.
const JOYRIDE_DEFAULTS = {
  maxSpeed: 1.2, accel: 4.5, brake: 3, grip: 7, driftGrip: 2.2, steerMax: .5, wheelbase: 2 * CAR.wheelZ,
  slipThreshold: .28, rollingDrag: .12, quadDrag: .08, reverseCap: .35, stopThreshold: .02,
  handbrakeCreep: .011, handbrakeBrake: .1, governor: 1.25, steerEase: 8, yawEase: 3, minContacts: 2,
  visEase: 6, visPitchPerAccel: -.012, visRollPerAccel: .02, visClamp: .12,
};
export const JOYRIDE = Object.freeze({ ...JOYRIDE_DEFAULTS, ...(globalThis.CAR_OVERRIDE?.joyride || {}) });

export function headingQuaternion(heading) {
  return { x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) };
}
// Euler XYZ (radians) → quaternion, same order THREE.Euler 'XYZ' uses.
export function eulerToQuaternion([x, y, z] = [0, 0, 0]) {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 + s1 * s2 * c3,
    w: c1 * c2 * c3 - s1 * s2 * s3,
  };
}
// Fixed cuboid for one ROOM entry (contract: full extents halved, optional Euler XYZ).
export function roomColliderDesc(RAPIER, entry) {
  return RAPIER.ColliderDesc.cuboid(...entry.size.map(n => n / 2))
    .setTranslation(...entry.pos).setRotation(eulerToQuaternion(entry.rot))
    .setFriction(ROOM_FRICTION).setRestitution(0);
}

export function createWorld(RAPIER) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.lengthUnit = .12;
  world.timestep = STEP;
  return world;
}

export function createCar(RAPIER, world, spawn, { handling = DEFAULT_HANDLING } = {}) {
  if (!HANDLINGS.includes(handling)) throw new Error(`Unknown handling "${handling}"; choose one of ${HANDLINGS.join(', ')}.`);
  const joyride = handling === 'joyride';
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(...spawn.pos)
    .setRotation(headingQuaternion(spawn.heading))
    .setLinearDamping(CAR.linearDamping).setAngularDamping(CAR.angularDamping).setCcdEnabled(true));
  const cuboidInertia = [[CAR.hgt, CAR.len], [CAR.wid, CAR.len], [CAR.wid, CAR.hgt]]
    .map(([a, b], i) => CAR.mass / 12 * (a * a + b * b) * CAR.inertia[i]);
  world.createCollider(RAPIER.ColliderDesc.cuboid(CAR.wid / 2, CAR.hgt / 2, CAR.len / 2)
    .setTranslation(0, CAR.colliderY, 0)
    .setMassProperties(CAR.mass, { x: 0, y: CAR.colliderY, z: 0 }, { x: cuboidInertia[0], y: cuboidInertia[1], z: cuboidInertia[2] }, { x: 0, y: 0, z: 0, w: 1 })
    .setFriction(CAR.chassisFriction).setRestitution(0), body);
  const controller = world.createVehicleController(body);
  controller.indexUpAxis = 1;
  controller.setIndexForwardAxis = 2; // Rapier 0.14.0 setter property.
  WHEELS.forEach(([x, y, z], i) => {
    controller.addWheel({ x, y, z }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, CAR.suspRest, CAR.wheelR);
    controller.setWheelSuspensionStiffness(i, CAR.stiffness);
    controller.setWheelSuspensionCompression(i, CAR.compression);
    controller.setWheelSuspensionRelaxation(i, CAR.relaxation);
    controller.setWheelMaxSuspensionTravel(i, CAR.suspTravel);
    // Joyride path: the controller must apply NO tire forces. frictionSlip 0 caps the wheel friction
    // impulse circle at zero and sideFrictionStiffness 0 zeroes the lateral impulse; engine force and brake
    // stay 0 every step (stepJoyride). Only the suspension impulses remain — one authority per behavior.
    controller.setWheelFrictionSlip(i, joyride ? 0 : CAR.frictionSlip);
    controller.setWheelSideFrictionStiffness(i, joyride ? 0 : CAR.sideFriction);
  });
  return {
    body, controller, handling, steering: 0, upsideDown: 0,
    // Handling state shared with the HUD, mesh and tests. vF/vL are vehicle-relative forward/lateral speed;
    // brakeLight 0 off, 1 braking, 2 reversing; visPitch/visRoll are visual-only body squat/lean (radians).
    vF: 0, vL: 0, aF: 0, yawRate: 0, contacts: 0, airborne: false, slipping: false, brakeLight: 0, visPitch: 0, visRoll: 0,
  };
}

export function forwardVector(q) {
  return { x: 2 * (q.x * q.z + q.w * q.y), y: 2 * (q.y * q.z - q.w * q.x), z: 1 - 2 * (q.x * q.x + q.y * q.y) };
}
export function upVector(q) {
  return { x: 2 * (q.x * q.y - q.w * q.z), y: 1 - 2 * (q.x * q.x + q.z * q.z), z: 2 * (q.y * q.z + q.w * q.x) };
}
// Yaw in radians about +Y, matching SPAWN.heading (0 = local +Z faces world +Z; π/2 faces +X).
export function heading(q) {
  const f = forwardVector(q);
  return Math.atan2(f.x, f.z);
}
// Body-local +X, which is the car's LEFT (heading 0 faces +Z; up × forward = +X).
export function leftVector(q) {
  return { x: 1 - 2 * (q.y * q.y + q.z * q.z), y: 2 * (q.x * q.y + q.w * q.z), z: 2 * (q.x * q.z - q.w * q.y) };
}
export function forwardSpeed(car) {
  const f = forwardVector(car.body.rotation()), v = car.body.linvel();
  return f.x * v.x + f.y * v.y + f.z * v.z;
}
// Signed lateral speed along the body's left axis (+ = sliding toward the car's left).
export function lateralSpeed(car) {
  const l = leftVector(car.body.rotation()), v = car.body.linvel();
  return l.x * v.x + l.y * v.y + l.z * v.z;
}
// Pitch (nose up +) and roll (left side up +) of a body quaternion, radians. Used by the motion trace.
export function pitchRoll(q) {
  const f = forwardVector(q), l = leftVector(q);
  return { pitch: Math.asin(clamp(f.y, -1, 1)), roll: Math.asin(clamp(l.y, -1, 1)) };
}

// input: { throttle: -1..1, steer: -1..1 (+ = left), brake: boolean (Space), handbrake: boolean (Shift) }
// handbrake is only honored by the joyride handling; classic ignores it.
export function stepVehicle(car, input) {
  input = {
    throttle: Number.isFinite(input.throttle) ? clamp(input.throttle, -1, 1) : 0,
    steer: Number.isFinite(input.steer) ? clamp(input.steer, -1, 1) : 0,
    brake: !!input.brake, handbrake: !!input.handbrake,
  };
  if (input.throttle || input.steer || input.brake || input.handbrake) car.body.wakeUp();
  if (car.handling === 'joyride') stepJoyride(car, input); else stepClassic(car, input);
}

function stepClassic(car, input) {
  const { body, controller } = car;
  car.steering += (input.steer * CAR.maxSteer - car.steering) * CAR.steerLerp;
  const speed = forwardSpeed(car);
  const opposing = input.throttle && speed * input.throttle < -.05;
  const overspeed = Math.abs(speed) > CAR.maxSpeed * CAR.governor; // gravity on the ramp, not the motor
  const braking = input.brake || opposing || overspeed;
  let force = 0;
  // Full force until the last `taper` fraction of the speed limit, then fade to zero at the limit.
  const fade = (s, limit) => clamp((limit - Math.max(0, s)) / (limit * CAR.taper), 0, 1);
  if (!braking && input.throttle > 0) force = CAR.engineFwd * fade(speed, CAR.maxSpeed);
  if (!braking && input.throttle < 0) force = CAR.engineRev * fade(-speed, CAR.maxReverseSpeed);
  for (let i = 0; i < 4; i++) {
    controller.setWheelSteering(i, i < 2 ? car.steering : 0);
    controller.setWheelEngineForce(i, i >= 2 ? force : 0);
    controller.setWheelBrake(i, braking ? CAR.brake : 0);
  }
  // Explicitly exclude the chassis from suspension rays.
  controller.updateVehicle(STEP, undefined, undefined, collider => collider.parent()?.handle !== body.handle);
  car.vF = forwardSpeed(car); car.vL = lateralSpeed(car);
  car.contacts = wheelContacts(car).reduce((n, c) => n + c, 0);
  car.brakeLight = braking ? 1 : car.vF < -.05 ? 2 : 0;
}

// Joyride's planar model on top of Rapier's suspension. Order per step: (1) controller suspension update
// with zero engine/brake/friction, (2) read the FRESH chassis velocity (collision impulses, suspension and
// gravity are all in it — nothing is restored from a stored value), (3) decompose into forward/lateral/normal
// on the averaged wheel-contact plane, (4) Joyride's engine, brake, drag, grip and yaw, (5) write back the
// planar components; the normal component and Rapier's pitch/roll angular velocity survive untouched.
function stepJoyride(car, input) {
  const { body, controller } = car, J = JOYRIDE, dt = STEP;
  for (let i = 0; i < 4; i++) {
    controller.setWheelSteering(i, i < 2 ? car.steering : 0); // visual + ray bookkeeping only (friction is zero)
    controller.setWheelEngineForce(i, 0);
    controller.setWheelBrake(i, 0);
  }
  controller.updateVehicle(dt, undefined, undefined, collider => collider.parent()?.handle !== body.handle);

  // Steering: less lock the faster you go, eased so the wheels have weight.
  const sf = clamp(Math.abs(car.vF) / J.maxSpeed, 0, 1);
  car.steering += (input.steer * J.steerMax * (1 - .6 * sf) - car.steering) * Math.min(J.steerEase * dt, 1);

  // Contact plane = average normal of the wheels that touch something.
  let nx = 0, ny = 0, nz = 0, contacts = 0;
  for (let i = 0; i < 4; i++) {
    if (!controller.wheelIsInContact(i)) continue;
    const n = controller.wheelContactNormal(i);
    if (n) { nx += n.x; ny += n.y; nz += n.z; contacts++; }
  }
  car.contacts = contacts;
  const q = body.rotation(), f0 = forwardVector(q);
  let nl = Math.hypot(nx, ny, nz);
  if (nl > 1e-6) { nx /= nl; ny /= nl; nz /= nl; }
  // Forward projected onto the contact plane; right = forward × normal (Joyride: right = (-fz, fx) for Y up).
  const fd = f0.x * nx + f0.y * ny + f0.z * nz;
  let fx = f0.x - fd * nx, fy = f0.y - fd * ny, fz = f0.z - fd * nz;
  const fl = Math.hypot(fx, fy, fz);
  const kv = Math.min(J.visEase * dt, 1);
  if (contacts < J.minContacts || nl <= 1e-6 || fl < .3) {
    // Airborne (or standing on its nose): no traction, no yaw authority. Rapier keeps integrating gravity,
    // the existing angular velocity and any contact impulses.
    car.airborne = true; car.slipping = false; car.aF = 0;
    car.vF = forwardSpeed(car); car.vL = lateralSpeed(car);
    car.brakeLight = input.brake || input.handbrake ? 1 : car.vF < -J.handbrakeCreep ? 2 : 0;
    car.visPitch -= car.visPitch * kv; car.visRoll -= car.visRoll * kv;
    return;
  }
  car.airborne = false;
  fx /= fl; fy /= fl; fz /= fl;
  const rx = fy * nz - fz * ny, ry = fz * nx - fx * nz, rz = fx * ny - fy * nx;
  const v = body.linvel(); // fresh: this is where collisions push the car around
  let vF = v.x * fx + v.y * fy + v.z * fz;
  let vL = v.x * rx + v.y * ry + v.z * rz;
  const vN = v.x * nx + v.y * ny + v.z * nz;

  // Engine and brakes along the car's forward axis.
  const { throttle } = input;
  let aF = 0;
  if (input.brake) {
    // Space: service brake, overrides throttle (PRD). Holds the car once it is nearly stopped.
    if (vF > J.stopThreshold) aF = -J.brake; else if (vF < -J.stopThreshold) aF = J.brake; else vF = 0;
  } else if (throttle > 0 && vF >= -J.stopThreshold) {
    const f = Math.max(0, vF) / J.maxSpeed;                  // power fades to nothing at top speed
    aF = throttle * J.accel * (1 - f * f);
  } else if (throttle < 0 && vF > J.stopThreshold) {
    aF = throttle * J.brake;                                 // braking while rolling forward
  } else if (throttle < 0) {
    const f = Math.abs(vF) / (J.reverseCap * J.maxSpeed);
    aF = throttle * J.accel * .5 * Math.max(0, 1 - f * f);   // reverse tops out at reverseCap of max speed
  } else if (throttle > 0) {
    aF = throttle * J.brake;                                 // braking while rolling backward
  }
  // Handbrake (Shift): drags the rears and kills the last creep outright.
  if (input.handbrake) {
    if (vF > J.handbrakeCreep) aF -= J.brake * J.handbrakeBrake;
    else if (vF < -J.handbrakeCreep) aF += J.brake * J.handbrakeBrake;
    else vF = 0;
  }
  // Downhill governor (kept from classic): gravity on the ramp, not the motor, is what exceeds the limit.
  if (Math.abs(vF) > J.maxSpeed * J.governor) aF -= Math.sign(vF) * J.brake;
  // Drag, always.
  aF -= vF * J.rollingDrag + Math.sign(vF) * vF * vF * J.quadDrag;
  vF += aF * dt;

  // Lateral grip: the tires scrub sideways velocity away, unless they let go.
  const slipping = input.handbrake || Math.abs(vL) > J.slipThreshold;
  vL *= Math.max(0, 1 - (slipping ? J.driftGrip : J.grip) * dt);

  // Yaw: bicycle model, with rotational inertia once the back steps out. Only the component about the
  // contact normal is written; pitch and roll rates stay Rapier's (suspension, ramp transitions, landings).
  const yawTarget = vF / J.wheelbase * Math.tan(car.steering);
  const w = body.angvel();
  const wN = w.x * nx + w.y * ny + w.z * nz;
  const yawRate = slipping ? wN + (yawTarget - wN) * Math.min(J.yawEase * dt, 1) : yawTarget;
  body.setAngvel({ x: w.x + (yawRate - wN) * nx, y: w.y + (yawRate - wN) * ny, z: w.z + (yawRate - wN) * nz }, true);
  body.setLinvel({ x: vF * fx + vL * rx + vN * nx, y: vF * fy + vL * ry + vN * ny, z: vF * fz + vL * rz + vN * nz }, true);

  car.vF = vF; car.vL = vL; car.aF = aF; car.yawRate = yawRate; car.slipping = slipping;
  car.brakeLight = ((throttle < 0 && vF > J.stopThreshold) || input.brake || input.handbrake) ? 1 : (vF < -J.handbrakeCreep ? 2 : 0);
  // Visual only: the body squats under power and leans out of a corner.
  car.visPitch = clamp(car.visPitch + (aF * J.visPitchPerAccel - car.visPitch) * kv, -J.visClamp, J.visClamp);
  car.visRoll = clamp(car.visRoll + (yawRate * vF * J.visRollPerAccel - car.visRoll) * kv, -J.visClamp, J.visClamp);
}

export function resetCar(car, spawn) {
  car.body.setTranslation({ x: spawn.pos[0], y: spawn.pos[1], z: spawn.pos[2] }, true);
  car.body.setRotation(headingQuaternion(spawn.heading), true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  car.body.resetForces(true);
  car.body.resetTorques(true);
  car.steering = 0;
  car.upsideDown = 0;
  Object.assign(car, { vF: 0, vL: 0, aF: 0, yawRate: 0, contacts: 0, airborne: false, slipping: false, brakeLight: 0, visPitch: 0, visRoll: 0 });
  for (let i = 0; i < 4; i++) {
    car.controller.setWheelSteering(i, 0);
    car.controller.setWheelEngineForce(i, 0);
    car.controller.setWheelBrake(i, 0);
  }
}

export function validBody(body) {
  return [body.translation(), body.rotation(), body.linvel(), body.angvel()].every(v => Object.values(v).every(Number.isFinite));
}

// bounds: { min: {x,z}, max: {x,z} }. Advances the upside-down timer by one fixed step.
export function needsRecovery(car, bounds) {
  const p = car.body.translation(), q = car.body.rotation();
  car.upsideDown = upVector(q).y < 0 ? car.upsideDown + STEP : 0;
  return p.y < -2 || p.x < bounds.min.x - 1 || p.x > bounds.max.x + 1 ||
    p.z < bounds.min.z - 1 || p.z > bounds.max.z + 1 || car.upsideDown >= 1.5;
}

export function wheelContacts(car) {
  return WHEELS.map((_, i) => +car.controller.wheelIsInContact(i));
}

// ---------------------------------------------------------------------------------------------
// Scripted demo driver: a small closed-loop "driver" that follows the rehearsed two-minute route.
// Shared by index.html (?demo=1) and check-drive.mjs so the rehearsal is exactly what gets tested.
export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export function carState(car) {
  const p = car.body.translation(), q = car.body.rotation();
  return { x: p.x, y: p.y, z: p.z, heading: heading(q), fwd: forwardSpeed(car), vL: lateralSpeed(car), up: upVector(q).y };
}
// Ramp/desk geometry from a room module (RAMP export) or, failing that, from the ramp entry itself.
export function rampGeometry(ROOM, mod = {}) {
  const ramp = ROOM.find(e => e.tag === 'ramp');
  if (!ramp) return null;
  const half = Math.cos(ramp.rot?.[2] ?? 0) * ramp.size[0] / 2;
  return {
    footX: mod.RAMP?.p0?.[0] ?? ramp.pos[0] - half,
    crestX: mod.RAMP?.p1?.[0] ?? ramp.pos[0] + half,
    rampZ: ramp.pos[2],
    deskTop: mod.RAMP?.p1?.[1] ?? .75,
    gapX: mod.ROUTE?.dividerGap?.[0] ?? (mod.RAMP?.p1?.[0] ?? ramp.pos[0] + half) + .6 + 3 * 1.2,
    cups: mod.ROUTE?.cups ? [mod.ROUTE.cups[0], mod.ROUTE.cups[2]] : [-6.1, 1.5],
  };
}
// Steer to hold `target` heading while pulling onto the line through `line` (a point) perpendicular to travel.
// Stanley-style: aim at the target heading plus a bounded correction toward the line (max ~50°), then
// counter-steer against the measured slip angle (velocity direction vs heading) so a sliding car is steered
// toward where it is actually going instead of deeper into the slide. The slip term is ~0 for a gripping car.
export function steerTo(s, target, line, gain = 3, lateralGain = 4, slipGain = 1.5) {
  let desired = target;
  if (line) {
    const left = { x: Math.cos(target), z: -Math.sin(target) }; // up × forward of the target heading
    const offset = ((line.x ?? s.x) - s.x) * left.x + ((line.z ?? s.z) - s.z) * left.z; // + means the line is to the left
    desired += clamp(Math.atan(lateralGain * offset), -.9, .9);
  }
  const slip = Math.abs(s.fwd) > .1 ? Math.atan2(s.vL ?? 0, Math.abs(s.fwd)) : 0;
  return clamp(gain * wrap(desired - s.heading) + slipGain * slip, -1, 1);
}
export const creep = (s, vmax = .5) => (s.fwd > vmax ? 0 : 1);
const E = Math.PI / 2, W = -Math.PI / 2, N = Math.PI, S = 0; // headings: +X, -X, -Z, +Z

export function demoPhases(g, spawn) {
  const lane = { x: 0, z: g.rampZ - .17 }; // outer half of the desk lane, so the wheels clip the cups on the edge
  const rampLine = { x: 0, z: g.rampZ };
  const westX = spawn.pos[0] - .35; // turning column between the spawn and the west wall
  return [
    { label: 'east along the aisle', until: s => s.x > 2.6, input: s => ({ throttle: 1, steer: steerTo(s, E, { x: 0, z: spawn.pos[2] }) }) },
    { label: 'U-turn at the east end', until: s => Math.abs(wrap(s.heading - W)) < .12, input: s => ({ throttle: creep(s), steer: 1 }) },
    { label: 'west along the aisle', until: s => s.x < westX + .4, input: s => ({ throttle: s.x < westX + 1.2 ? creep(s, .6) : 1, steer: steerTo(s, W, { x: 0, z: spawn.pos[2] }) }) },
    { label: 'turn north toward the ramp line', until: s => Math.abs(wrap(s.heading - N)) < .1, input: s => ({ throttle: creep(s), steer: -1 }) },
    { label: 'run north to the ramp line', until: s => s.z < g.rampZ + .22, input: s => ({ throttle: creep(s), steer: steerTo(s, N, { x: westX, z: 0 }) }) },
    { label: 'turn east onto the ramp line', until: s => Math.abs(wrap(s.heading - E)) < .1, input: s => ({ throttle: creep(s), steer: -1 }) },
    { label: 'climb the ramp', until: s => s.x > g.crestX + .3 && s.y > g.deskTop, input: s => ({ throttle: 1, steer: steerTo(s, E, { x: 0, z: g.rampZ }) }) },
    { label: 'along the desk lane through the cups', until: s => s.x > g.gapX - .4, input: s => ({ throttle: s.x > g.gapX - 1.2 ? creep(s, .6) : 1, steer: steerTo(s, E, { x: 0, z: lane.z }) }) },
    { label: 'U-turn through the divider gap', until: s => Math.abs(wrap(s.heading - W)) < .12, input: s => ({ throttle: creep(s, .45), steer: -1 }) },
    { label: 'back west along the lane', until: s => s.x < g.crestX + .5, input: s => ({ throttle: s.x < g.gapX - .9 ? 1 : creep(s, .45), steer: steerTo(s, W, { x: 0, z: g.rampZ }, 3, 5) }) },
    { label: 'descend the ramp', until: s => s.x < g.footX - .35 && s.y < .06, input: s => ({ throttle: 1, steer: steerTo(s, W, rampLine) }) },
    { label: 'turn south toward the cups', until: s => Math.abs(wrap(s.heading - S)) < .12, input: s => ({ throttle: creep(s), steer: 1 }) },
    { label: 'plow through the cups', until: s => s.z > g.cups[1] + .7, input: s => ({ throttle: 1, steer: steerTo(s, S, { x: g.cups[0] - .05, z: 0 }) }) },
    { label: 'turn back north', until: s => Math.abs(wrap(s.heading - N)) < .12, input: s => ({ throttle: creep(s), steer: -1 }) },
    { label: 'second pass through the cups', until: s => s.z < g.cups[1] - .7, input: s => ({ throttle: 1, steer: steerTo(s, N, { x: g.cups[0] + .2, z: 0 }) }) },
    { label: 'turn back south', until: s => Math.abs(wrap(s.heading - S)) < .12, input: s => ({ throttle: creep(s), steer: -1 }) },
    { label: 'third pass through the cups', until: s => s.z > g.cups[1] + .5, input: s => ({ throttle: 1, steer: steerTo(s, S, { x: g.cups[0] - .25, z: 0 }) }) },
    { label: 'stop', until: s => Math.abs(s.fwd) < .02, input: () => ({ throttle: 0, steer: 0, brake: true }) },
  ];
}

export function createDriver(phases, timeout = 20) {
  let index = 0, elapsed = 0;
  return {
    get done() { return index >= phases.length; },
    get label() { return phases[index]?.label ?? 'done'; },
    get timedOut() { return elapsed > timeout; },
    input(s) {
      while (index < phases.length && phases[index].until(s)) { index++; elapsed = 0; }
      if (index >= phases.length) return { throttle: 0, steer: 0, brake: true };
      elapsed += STEP;
      const { throttle = 0, steer = 0, brake = false } = phases[index].input(s);
      return { throttle, steer, brake };
    },
  };
}
