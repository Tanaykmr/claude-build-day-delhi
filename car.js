// car.js — shared vehicle constants and physics logic (Track A). Imported by index.html AND
// check-drive.mjs so the browser car and the headless test car cannot drift apart.
// Pure Rapier; no THREE or DOM. RAPIER is passed in because the browser loads it from the CDN
// and Node loads it from node_modules.

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

export function createCar(RAPIER, world, spawn) {
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
    controller.setWheelFrictionSlip(i, CAR.frictionSlip);
    controller.setWheelSideFrictionStiffness(i, CAR.sideFriction);
  });
  return { body, controller, steering: 0, upsideDown: 0 };
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
export function forwardSpeed(car) {
  const f = forwardVector(car.body.rotation()), v = car.body.linvel();
  return f.x * v.x + f.y * v.y + f.z * v.z;
}

// input: { throttle: -1..1, steer: -1..1 (+ = left), brake: boolean }
export function stepVehicle(car, input) {
  const { body, controller } = car;
  if (input.throttle || input.steer || input.brake) body.wakeUp();
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
