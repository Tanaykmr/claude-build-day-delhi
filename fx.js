// fx.js — contact effects (Track A): drift smoke, impact dust and sparks, landing puffs, and skid marks.
// Adapted from Joyride's src/logic/particles.js and src/board/particlesMesh.js (nitzangames/joyride, revision
// ea4285dd, ISC) — see the attribution block in car.js — and reduced to the two pools this game needs.
//
// THREE is passed in because the host owns the import map. Nothing here reads the DOM or Rapier: the caller
// feeds it world-space contact points and normals (from wheelContactPoint / solverContactPoint), so marks and
// puffs land on whatever surface the car is actually touching, desktops included.
//
// Two draw calls total:
//   • particles — ONE InstancedMesh of unit boxes with per-instance colour. Unlit on purpose: a dust puff that
//     the room's key light can shade reads as a grey brick. Array + count with swap-remove, so the live set is
//     always [0, count) with no holes; a full pool recycles its oldest slots rather than dropping the effect.
//   • skids — ONE pre-allocated BufferGeometry ring of thin quads with a 4-component colour attribute, so each
//     mark fades on its own as it ages. Each quad bridges the previous contact point of a wheel to the current
//     one, laid on the contact normal, which is what lets a mark follow the ramp and the desktop.
// No damage effects of any kind.

export const FX = Object.freeze({
  maxParticles: 600, maxSkids: 256,
  dustColor: 0xc9c2b2, sparkColor: 0xffb340, sparkCool: 0xff3b2e, hazeColor: 0x9aa0a8, skidColor: 0x141619,
  skidWidth: .015,      // wider than the 10 mm tire so the mark still reads from the chase camera
  skidStep: .008,       // minimum travel between segments (metres)
  skidGap: .09,         // a jump further than this starts a new mark instead of bridging it
  // The carpet is a mid-grey photo texture, so a 0.5-alpha dark-grey mark disappeared into it: near-black at
  // 0.78 is what actually reads as rubber on this floor (checked against .shots/a9-skid-*).
  skidLife: 9, skidFade: 3, skidAlpha: .78, skidLift: .0016,
  dustLife: .38, dustGravity: .6, dustDrag: 3, dustGrow: 1,
  sparkLife: .22, sparkGravity: 9.81, sparkDrag: 1.5,
});

export function createEffects({ THREE, scene, maxParticles = FX.maxParticles, maxSkids = FX.maxSkids } = {}) {
  const DUST = 0, SPARK = 1;

  // ---------------------------------------------------------------- particles
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const particleMesh = new THREE.InstancedMesh(
    boxGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: .62, depthWrite: false }), maxParticles);
  particleMesh.frustumCulled = false;
  particleMesh.count = 0;
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < maxParticles; i++) particleMesh.setColorAt(i, white);
  scene.add(particleMesh);

  const pos = new Float32Array(maxParticles * 3), vel = new Float32Array(maxParticles * 3);
  const life = new Float32Array(maxParticles), maxLife = new Float32Array(maxParticles);
  const size = new Float32Array(maxParticles), kind = new Uint8Array(maxParticles), spin = new Float32Array(maxParticles);
  let count = 0, cursor = 0;

  const m4 = new THREE.Matrix4(), vP = new THREE.Vector3(), vQ = new THREE.Quaternion(), vS = new THREE.Vector3();
  const euler = new THREE.Euler(), colour = new THREE.Color();
  const palette = [new THREE.Color(FX.dustColor), new THREE.Color(FX.sparkColor)];
  const haze = new THREE.Color(FX.hazeColor), sparkCool = new THREE.Color(FX.sparkCool);

  // Deterministic jitter: the same impact always throws the same puff, so captures are repeatable.
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) - .5;

  function spawn(x, y, z, k, speed, up, sz, lifeSeconds) {
    const i = count < maxParticles ? count++ : (cursor++ % maxParticles);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = rnd() * 2 * speed; vel[i * 3 + 1] = up + Math.abs(rnd()) * speed; vel[i * 3 + 2] = rnd() * 2 * speed;
    life[i] = 0; maxLife[i] = lifeSeconds * (.7 + Math.abs(rnd()) * .6);
    size[i] = sz * (.7 + Math.abs(rnd()) * .6); kind[i] = k; spin[i] = rnd() * 6;
  }

  // ---------------------------------------------------------------- skid marks
  const skidGeometry = new THREE.BufferGeometry();
  const skidPos = new Float32Array(maxSkids * 18);          // 6 vertices per quad
  const skidCol = new Float32Array(maxSkids * 24);          // rgba per vertex
  skidGeometry.setAttribute('position', new THREE.BufferAttribute(skidPos, 3));
  skidGeometry.setAttribute('color', new THREE.BufferAttribute(skidCol, 4));
  const skidMesh = new THREE.Mesh(skidGeometry, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  }));
  skidMesh.frustumCulled = false;
  skidMesh.renderOrder = 2;
  scene.add(skidMesh);
  const skidAge = new Float32Array(maxSkids).fill(Infinity);
  const skidColour = new THREE.Color(FX.skidColor);
  let skidNext = 0, skidLive = 0;
  const trails = new Map();                                  // per wheel key: the last point a mark was laid at

  function writeQuad(slot, ax, ay, az, bx, by, bz, nx, ny, nz) {
    let dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return false;
    dx /= len; dy /= len; dz /= len;
    // side = direction × normal, scaled to half the mark's width
    let sx = dy * nz - dz * ny, sy = dz * nx - dx * nz, sz = dx * ny - dy * nx;
    const sl = Math.hypot(sx, sy, sz);
    if (sl < 1e-6) return false;
    const h = FX.skidWidth / 2 / sl;
    sx *= h; sy *= h; sz *= h;
    const lx = nx * FX.skidLift, ly = ny * FX.skidLift, lz = nz * FX.skidLift; // just proud of the surface
    const v = [
      ax + sx + lx, ay + sy + ly, az + sz + lz, ax - sx + lx, ay - sy + ly, az - sz + lz, bx - sx + lx, by - sy + ly, bz - sz + lz,
      ax + sx + lx, ay + sy + ly, az + sz + lz, bx - sx + lx, by - sy + ly, bz - sz + lz, bx + sx + lx, by + sy + ly, bz + sz + lz,
    ];
    skidPos.set(v, slot * 18);
    for (let k = 0; k < 6; k++) {
      const j = slot * 24 + k * 4;
      skidCol[j] = skidColour.r; skidCol[j + 1] = skidColour.g; skidCol[j + 2] = skidColour.b; skidCol[j + 3] = FX.skidAlpha;
    }
    return true;
  }
  function fadeSkids(dt) {
    let live = 0;
    for (let i = 0; i < maxSkids; i++) {
      if (skidAge[i] === Infinity) continue;
      skidAge[i] += dt;
      if (skidAge[i] >= FX.skidLife) {                      // retire: collapse the quad so it draws nothing
        skidAge[i] = Infinity;
        skidPos.fill(0, i * 18, i * 18 + 18);
        continue;
      }
      live++;
      const remaining = FX.skidLife - skidAge[i];
      if (remaining >= FX.skidFade) continue;
      const alpha = FX.skidAlpha * (remaining / FX.skidFade);
      for (let k = 0; k < 6; k++) skidCol[i * 24 + k * 4 + 3] = alpha;
    }
    skidLive = live;
  }

  return {
    particleMesh, skidMesh,
    get particleCount() { return count; },
    get skidCount() { return skidLive; },

    // A contact at a world point: dust always, sparks when the hit was hard. strength 0..1.
    impact(x, y, z, strength) {
      const s = Math.min(1, Math.max(0, strength));
      const n = Math.min(12, Math.round(3 + 8 * s));
      for (let i = 0; i < n; i++) spawn(x, y, z, DUST, .08 + .12 * s, .06, .004 + .005 * s, FX.dustLife * 1.2);
      if (s > .45) for (let i = 0; i < Math.round(4 + 8 * s); i++) spawn(x, y, z, SPARK, .35 + .4 * s, .15, .0025, FX.sparkLife);
    },
    // Tire smoke from a sliding wheel contact point.
    dust(x, y, z, amount) {
      const a = Math.min(1, Math.max(0, amount));
      spawn(x, y, z, DUST, .05, .03 + .05 * a, .0035 + .004 * a, FX.dustLife);
    },
    // A landing: a low, wide ring of dust under the wheels rather than a spray.
    land(x, y, z, strength) {
      const s = Math.min(1, Math.max(0, strength));
      for (let i = 0; i < Math.round(3 + 6 * s); i++) spawn(x, y, z, DUST, .05 + .08 * s, .02, .004 + .004 * s, FX.dustLife);
    },
    // Lay (or extend) a skid mark for `key` at a contact point on a surface with `normal`.
    skid(key, point, normal) {
      const prev = trails.get(key);
      trails.set(key, { x: point.x, y: point.y, z: point.z });
      if (!prev) return;
      const d = Math.hypot(point.x - prev.x, point.y - prev.y, point.z - prev.z);
      if (d < FX.skidStep) { trails.set(key, prev); return; }  // too small a step: wait and bridge a longer one
      if (d > FX.skidGap) return;                               // teleport or a big jump: start a fresh mark
      const slot = skidNext;
      if (writeQuad(slot, prev.x, prev.y, prev.z, point.x, point.y, point.z, normal.x, normal.y, normal.z)) {
        skidAge[slot] = 0;
        skidNext = (skidNext + 1) % maxSkids;
      }
    },
    // The wheel stopped sliding (or the car was recovered): the next mark must not bridge the gap.
    liftSkid(key) { trails.delete(key); },
    clearSkids() {
      trails.clear(); skidPos.fill(0); skidAge.fill(Infinity); skidNext = 0; skidLive = 0;
      skidGeometry.attributes.position.needsUpdate = true;
      skidGeometry.attributes.color.needsUpdate = true;
    },

    update(dt) {
      for (let i = 0; i < count; i++) {
        life[i] += dt;
        if (life[i] >= maxLife[i]) {                          // swap-remove keeps the live set contiguous
          const j = --count;
          for (let k = 0; k < 3; k++) { pos[i * 3 + k] = pos[j * 3 + k]; vel[i * 3 + k] = vel[j * 3 + k]; }
          life[i] = life[j]; maxLife[i] = maxLife[j]; size[i] = size[j]; kind[i] = kind[j]; spin[i] = spin[j];
          i--; continue;
        }
        const isSpark = kind[i] === SPARK;
        vel[i * 3 + 1] -= (isSpark ? FX.sparkGravity : FX.dustGravity) * dt;
        const drag = Math.max(0, 1 - (isSpark ? FX.sparkDrag : FX.dustDrag) * dt);
        for (let k = 0; k < 3; k++) { vel[i * 3 + k] *= drag; pos[i * 3 + k] += vel[i * 3 + k] * dt; }
        if (isSpark && pos[i * 3 + 1] < .002) { pos[i * 3 + 1] = .002; vel[i * 3 + 1] *= -.3; }
        const age = life[i] / maxLife[i];
        const grow = isSpark ? 1 : 1 + FX.dustGrow * age;
        const fade = age < .6 ? 1 : 1 - (age - .6) / .4;
        vP.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        euler.set(spin[i] * life[i], spin[i] * .7 * life[i], 0);
        vQ.setFromEuler(euler);
        const s = size[i] * grow * Math.max(.05, fade);
        vS.set(s, s, s);
        m4.compose(vP, vQ, vS);
        particleMesh.setMatrixAt(i, m4);
        colour.copy(palette[kind[i]]);
        colour.lerp(isSpark ? sparkCool : haze, isSpark ? age : age * .5);
        particleMesh.setColorAt(i, colour);
      }
      particleMesh.count = count;
      particleMesh.instanceMatrix.needsUpdate = true;
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
      fadeSkids(dt);
      skidGeometry.attributes.position.needsUpdate = true;
      skidGeometry.attributes.color.needsUpdate = true;
    },
  };
}
