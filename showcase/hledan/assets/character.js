/**
 * Playable character for the Hledan map.
 *
 * The movement model is lifted from the Elbaf showcase so the two pages feel
 * like the same game — same numbers, same curves:
 *
 *   base speed        5.6 Luffy / 5.2 Zoro / 5.9 Nami  (m/s)
 *   sprint            x1.75
 *   jump impulse      7.8 / 6.8 / 7.0                  (m/s)
 *   gravity           -18                              (m/s^2, not -9.81)
 *   ground accel      1 - exp(-14 * dt)
 *   air accel         1 - exp(-14 * 0.35 * dt)
 *   look sensitivity  yaw 0.0045, pitch 0.0035  rad/px
 *   pitch clamp       [-0.85, +0.35] rad
 *   body              1.7 m tall, 0.25 m radius
 *
 * Elbaf gets its collision from Rapier. That is ~1 MB of WASM plus a per-frame
 * broadphase over static city geometry whose answer never changes, so here the
 * ground height and the blocked cells are baked into navmesh.png at build time
 * and sampled from an ImageData instead. See navmap.py.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

/**
 * The map is not in metres — it is about 1.5x life size.
 *
 * Vehicles settle this. Scanning the baked height field for elongated bumps
 * sitting on the road finds 29 of them, median 17.0 u long by 4.7 u tall. That
 * length/height ratio is 3.6, which is a bus (a real one is ~11.5 m by ~3.2 m,
 * ratio 3.6). Two dimensions of the same object agree independently:
 *
 *   bus length   17.0 u / 11.5 m = 1.48
 *   bus height    4.7 u /  3.2 m = 1.47
 *
 * and the shophouse blocks corroborate it: Buildings.001 is 9.3 u, which at
 * 1.47 is 6.3 m — two storeys, which is what they look like.
 *
 * An earlier pass here read 3.0 from a "parapet" and a "kerb". Both were
 * mismeasured: the 3.4 u feature is the tall anti-throw fence on the flyover
 * (really ~2.3 m), not a jersey barrier, and the 0.55 u one was road camber
 * rather than a kerb face. Ambiguous features on a photogrammetry mesh are not
 * worth trusting; an object whose two dimensions agree is.
 *
 * Rescaling the map itself would invalidate the baked navmap, the fog range and
 * every camera framing, so the character is scaled into the map's units instead.
 * Multiplying every length by the same k leaves the motion *feeling* identical:
 * apex = v^2/2g scales as k, hang time 2v/g is unchanged, and crossing a k-times
 * larger world takes exactly as long as before. Rates (1/time) must NOT scale.
 */
export const WORLD_SCALE = 1.5;

const GRAVITY      = -18 * WORLD_SCALE;
const SPRINT_MULT  = 1.75;                    // ratio — unscaled
const ACCEL_GROUND = 14;                      // 1/s — unscaled
const ACCEL_AIR    = 14 * 0.35;
const BODY_HEIGHT  = 1.7 * WORLD_SCALE;
const BODY_RADIUS  = 0.25 * WORLD_SCALE;
const COYOTE_TIME  = 0.12;                    // seconds — unscaled
const AIR_JUMPS    = 1;
const AIR_JUMP_MULT = 0.92;
const STEP_UP      = 0.62 * WORLD_SCALE;      // anything taller is a wall, not a kerb
const SNAP_DOWN    = 0.40 * WORLD_SCALE;      // stay glued to ground this far below
export const YAW_SENS   = 0.0045;
export const PITCH_SENS = 0.0035;
export const PITCH_MIN  = -0.85;
export const PITCH_MAX  = 0.35;

/* Elbaf's stats, verbatim, in metres per second. They are lifted into map units
   by WORLD_SCALE at the point of use — see makeStats(). Zoro uses the Elbaf
   winter model, the same modelId that build ships. */
const RAW_CHARACTERS = [
  { id: 'luffy', modelId: 'luffy',      name: 'Luffy', role: 'Captain',   speed: 5.6, jump: 7.8, style: 'rubber', blurb: 'Straw hat, and no plan whatsoever.' },
  { id: 'zoro',  modelId: 'zoro-elbaf', name: 'Zoro',  role: 'Swordsman', speed: 5.2, jump: 6.8, style: 'sword',  blurb: 'Lost. Insists he is not lost.' },
  { id: 'nami',  modelId: 'nami',       name: 'Nami',  role: 'Navigator', speed: 5.9, jump: 7.0, style: 'staff',  blurb: 'Already knows the way to the market.' },
];

export const CHARACTERS = RAW_CHARACTERS.map((c) => ({
  ...c,
  speed: c.speed * WORLD_SCALE,
  jump: c.jump * WORLD_SCALE,
}));

/* ------------------------------------------------------------------ navmap */

/**
 * Ground height + walkability, sampled from the baked RGBA map.
 *   R,G  height, 16-bit over [yMin, yMin+ySpan]
 *   B    255 walkable / 0 blocked
 *   A    255 ground exists / 0 void
 */
export class NavMap {
  constructor(img, meta) {
    this.meta = meta;
    const { width: W, height: H } = meta;

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, W, H).data;

    /* Repack and drop the RGBA. Keeping the ImageData costs 5.9 MB on a
       828x1788 grid; height-as-uint16 plus a flag byte is 4.4 MB, and more
       importantly the sampling below then touches two flat arrays instead of
       doing (i*4) indexing with a per-call object allocation. Movement samples
       this ~22 times a frame, so that allocation was pure GC churn. */
    const n = W * H;
    this.h = new Uint16Array(n);
    this.f = new Uint8Array(n);            // bit0 ground exists, bit1 walkable
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      if (rgba[k + 3] === 0) continue;
      this.h[i] = (rgba[k] << 8) | rgba[k + 1];
      this.f[i] = 1 | (rgba[k + 2] > 127 ? 2 : 0);
    }
    // let the canvas and its backing store go
    c.width = c.height = 0;

    this._y0 = meta.yMin;
    this._ys = meta.ySpan / 65535;
    this._inv = 1 / meta.cell;
    this._W = W; this._H = H;
    this._ox = meta.originX; this._oz = meta.originZ;
  }

  static async load(pngUrl, jsonUrl) {
    const [img, meta] = await Promise.all([
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('navmesh image failed'));
        i.src = pngUrl;
      }),
      fetch(jsonUrl).then((r) => r.json()),
    ]);
    return new NavMap(img, meta);
  }

  /** Bilinear ground height, or null off the map. Allocation-free. */
  heightAt(x, z) {
    const fx = (x - this._ox) * this._inv - 0.5;
    const fz = (z - this._oz) * this._inv - 0.5;
    const gx = Math.floor(fx), gz = Math.floor(fz);
    const tx = fx - gx, tz = fz - gz;
    const W = this._W, H = this._H, h = this.h, f = this.f;
    let acc = 0, wsum = 0;
    for (let j = 0; j <= 1; j++) {
      const cz = gz + j;
      if (cz < 0 || cz >= H) continue;
      const wz = j ? tz : 1 - tz;
      const row = cz * W;
      for (let i = 0; i <= 1; i++) {
        const cx = gx + i;
        if (cx < 0 || cx >= W) continue;
        const k = row + cx;
        if ((f[k] & 1) === 0) continue;
        const w = (i ? tx : 1 - tx) * wz;
        acc += (this._y0 + h[k] * this._ys) * w;
        wsum += w;
      }
    }
    return wsum > 0.001 ? acc / wsum : null;
  }

  blockedAt(x, z) {
    const gx = Math.floor((x - this._ox) * this._inv);
    const gz = Math.floor((z - this._oz) * this._inv);
    if (gx < 0 || gz < 0 || gx >= this._W || gz >= this._H) return true;
    return (this.f[gz * this._W + gx] & 2) === 0;
  }

  /** Blocked if the body circle overlaps anything — centre plus 8 rim samples. */
  bodyBlocked(x, z, r = BODY_RADIUS) {
    if (this.blockedAt(x, z)) return true;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (this.blockedAt(x + Math.cos(a) * r, z + Math.sin(a) * r)) return true;
    }
    return false;
  }

  /** Nearest open spot to (x,z), searched on a golden-angle spiral. */
  findOpen(x, z, maxR = 160) {   // already in map units
    if (!this.bodyBlocked(x, z) && this.heightAt(x, z) !== null) return { x, z };
    for (let i = 1; i < 400; i++) {
      const r = Math.min(maxR, 2.2 * Math.sqrt(i));
      const a = i * 2.39996;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (!this.bodyBlocked(px, pz) && this.heightAt(px, pz) !== null) return { x: px, z: pz };
    }
    return { x, z };
  }
}

/* --------------------------------------------------------------- character */

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltfCache = new Map();
function loadGLB(url) {
  if (!gltfCache.has(url)) {
    gltfCache.set(url, new Promise((res, rej) => loader.load(url, res, undefined, rej)));
  }
  return gltfCache.get(url);
}

/**
 * The rig, the three clips, and the state machine that blends them.
 * Elbaf ships each animation as its own GLB against an identical 24-joint
 * skeleton, so the clips can be lifted straight onto one cloned rig.
 */
export class Character {
  constructor(def, root, mixer, actions, height) {
    this.def = def;
    this.root = root;
    this.mixer = mixer;
    this.actions = actions;
    this.modelHeight = height;
    this.current = 'idle';
    actions.idle.play();
  }

  static async load(def, base = 'models/chars/', tier = 'hi') {
    const m = def.modelId || def.id;
    const [rigged, walk, run] = await Promise.all([
      loadGLB(`${base}${m}-rigged.opt.glb`),
      loadGLB(`${base}${m}-walk.opt.glb`),
      loadGLB(`${base}${m}-run.opt.glb`),
    ]);

    const root = skeletonClone(rigged.scene);
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;            // skinned bounds go stale while animating
      o.castShadow = o.receiveShadow = false;
      if (!o.material) return;

      /* These GLBs carry KHR_materials_ior + _specular, so GLTFLoader builds a
         MeshPhysicalMaterial — the heaviest shader three has, for two extras
         nothing here uses. Rebuild as Standard, keeping only the albedo.
         The emissive term is the map at low intensity: with no shadows and no
         bounce light, a character standing under the flyover otherwise sinks
         into the asphalt. This lifts them by a third of their own colour, so
         they stay readable without going flat or washing out in sunlight. */
      const src = o.material;
      const common = {
        map: src.map || null,
        color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
        side: THREE.FrontSide,
        transparent: src.transparent,
        alphaTest: src.alphaTest,
        name: src.name,
      };
      let mat;
      if (tier === 'hi') {
        mat = new THREE.MeshStandardMaterial({ ...common, roughness: 0.85, metalness: 0.0 });
        if (mat.map) {                       // lift by a third of their own colour
          mat.emissiveMap = mat.map;
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 0.32;
        }
      } else {
        /* Lambert on the low tier. The map already uses it there, so this keeps
           the whole scene on one lighting model instead of compiling a second
           program, and a flat emissive avoids binding the albedo twice. */
        mat = new THREE.MeshLambertMaterial({ ...common, emissive: new THREE.Color(0x2a2f38) });
      }
      o.material = mat;
      src.dispose();
    });

    /* Measure the SKINNED height, and only after the world matrices exist.
       A fresh clone has stale matrices and no computed skinned bounds, so
       Box3.setFromObject falls back to the bind-pose geometry through an
       identity matrix — which reads 0.02 units for these rigs and produces a
       ~97x scale factor. The skeleton already poses them at roughly 1.75 m;
       the correction here is a few percent, not two orders of magnitude. */
    const measure = () => {
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (o.isSkinnedMesh) { o.computeBoundingBox(); o.computeBoundingSphere(); }
      });
      return new THREE.Box3().setFromObject(root);
    };

    const box = measure();
    const raw = Math.max(box.max.y - box.min.y, 1e-6);
    root.scale.setScalar(BODY_HEIGHT / raw);

    const posed = measure();
    root.position.y = -posed.min.y;      // feet on y = 0 of the holder

    const holder = new THREE.Group();
    holder.add(root);

    const mixer = new THREE.AnimationMixer(root);
    const pick = (g) => g.animations[0];
    const actions = {
      idle: mixer.clipAction(pick(rigged)),
      walk: mixer.clipAction(pick(walk)),
      run:  mixer.clipAction(pick(run)),
    };
    for (const a of Object.values(actions)) { a.setLoop(THREE.LoopRepeat); a.enabled = true; }
    return new Character(def, holder, mixer, actions, BODY_HEIGHT);
  }

  /** Crossfade on state change; scale run/walk playback to the actual speed. */
  setGait(name, speed) {
    if (name !== this.current) {
      const from = this.actions[this.current], to = this.actions[name];
      to.reset().setEffectiveWeight(1).play();
      from.crossFadeTo(to, 0.18, false);
      this.current = name;
    }
    // keep feet roughly in sync with ground travel instead of skating
    const s = speed / WORLD_SCALE;   // compare in metres, the units the clips were authored in
    if (name === 'walk') this.actions.walk.timeScale = THREE.MathUtils.clamp(s / 2.2, 0.55, 1.9);
    else if (name === 'run') this.actions.run.timeScale = THREE.MathUtils.clamp(s / 5.6, 0.6, 1.7);
  }

  update(dt) { this.mixer.update(dt); }

  dispose() {
    this.mixer.stopAllAction();
    this.root.traverse((o) => { if (o.isMesh && o.material) o.material.dispose(); });
  }
}

/* -------------------------------------------------------------- controller */

export class CharacterController {
  constructor(nav) {
    this.nav = nav;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.grounded = false;
    this.coyote = 0;
    this.airJumps = AIR_JUMPS;
    this.groundY = 0;
    this.speedXZ = 0;
    this.airTime = 0;
    this._gait = 'idle';
    this.landedHard = 0;
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._want = new THREE.Vector3();
  }

  placeAt(x, z) {
    const spot = this.nav.findOpen(x, z);
    const y = this.nav.heightAt(spot.x, spot.z);
    this.pos.set(spot.x, (y ?? 0) + 0.05 * WORLD_SCALE, spot.z);
    this.vel.set(0, 0, 0);
    this.groundY = y ?? 0;
    this.grounded = true;
    this.airJumps = AIR_JUMPS;
  }

  /**
   * @param input {moveX, moveZ, sprint, jump, yaw} — moveX/Z in [-1,1], yaw radians
   */
  update(dt, input, stats) {
    const nav = this.nav;

    // desired direction, in camera-yaw space (Elbaf's basis exactly)
    this._fwd.set(-Math.sin(input.yaw), 0, -Math.cos(input.yaw));
    this._right.set(Math.cos(input.yaw), 0, -Math.sin(input.yaw));
    this._want.copy(this._fwd).multiplyScalar(input.moveZ).addScaledVector(this._right, input.moveX);
    const mag = this._want.length();
    if (mag > 1) this._want.divideScalar(mag);

    const target = stats.speed * (input.sprint ? SPRINT_MULT : 1);
    const wantX = this._want.x * target;
    const wantZ = this._want.z * target;
    const k = 1 - Math.exp(-(this.grounded ? ACCEL_GROUND : ACCEL_AIR) * dt);
    this.vel.x += (wantX - this.vel.x) * k;
    this.vel.z += (wantZ - this.vel.z) * k;

    // jump: ground jump on coyote, then one air jump at 0.92x
    if (input.jump) {
      if (this.coyote > 0) { this.vel.y = stats.jump; this.coyote = 0; this.airJumps = AIR_JUMPS; this.grounded = false; }
      else if (this.airJumps > 0) { this.vel.y = stats.jump * AIR_JUMP_MULT; this.airJumps -= 1; }
    }

    this.vel.y += GRAVITY * dt;
    if (this.vel.y < -55 * WORLD_SCALE) this.vel.y = -55 * WORLD_SCALE;

    // --- horizontal move, resolved per axis so walls slide instead of sticking
    const stepX = this.vel.x * dt, stepZ = this.vel.z * dt;
    const from = this.groundY;
    if (stepX !== 0 && this._canStand(this.pos.x + stepX, this.pos.z, from)) this.pos.x += stepX;
    else this.vel.x *= 0.2;
    if (stepZ !== 0 && this._canStand(this.pos.x, this.pos.z + stepZ, from)) this.pos.z += stepZ;
    else this.vel.z *= 0.2;

    // --- vertical
    this.pos.y += this.vel.y * dt;
    const gy = nav.heightAt(this.pos.x, this.pos.z);
    if (gy !== null) this.groundY = gy;

    /* Ground snap. The height field is sampled from a photogrammetry surface,
       so running across it the ground drops a few centimetres under your feet
       constantly. Without a tolerance the character flips grounded->airborne
       every other frame, which switches the accel rate, re-triggers the run
       animation and reads as jitter. Anything within SNAP_DOWN while already
       grounded and not moving upward counts as still standing on it. */
    const wasAir = !this.grounded;
    const snap = (!wasAir && this.vel.y <= 0) ? SNAP_DOWN : 0;
    if (this.pos.y <= this.groundY + snap) {
      if (wasAir && this.vel.y < -9 * WORLD_SCALE) this.landedHard = Math.min(1, -this.vel.y / (16 * WORLD_SCALE));
      this.pos.y = this.groundY;
      this.vel.y = 0;
      this.grounded = true;
      this.airTime = 0;
      this.coyote = COYOTE_TIME;
      this.airJumps = AIR_JUMPS;
    } else {
      this.grounded = false;
      this.airTime += dt;
      this.coyote = Math.max(0, this.coyote - dt);
    }
    this.landedHard = Math.max(0, this.landedHard - dt * 2.5);

    // face the way we are actually travelling
    this.speedXZ = Math.hypot(this.vel.x, this.vel.z);
    if (this.speedXZ > 0.35 * WORLD_SCALE) {
      const want = Math.atan2(this.vel.x, this.vel.z);
      let d = want - this.facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.facing += d * (1 - Math.exp(-13 * dt));
    }
    return this;
  }

  /** Open cell, and not a step taller than a kerb. */
  _canStand(x, z, fromY) {
    if (this.nav.bodyBlocked(x, z)) return false;
    const y = this.nav.heightAt(x, z);
    if (y === null) return false;
    return this.grounded ? (y - fromY) <= STEP_UP : true;
  }

  /* Hysteresis on both edges. A bare threshold makes the animation flip every
     frame when speed sits on the boundary — which is exactly where it sits when
     you hold sprint into a headwind of small collisions. */
  gait() {
    if (!this.grounded && this.airTime > 0.18) return 'run';
    const s = this.speedXZ / WORLD_SCALE;
    const g = this._gait || 'idle';
    if (g === 'idle') this._gait = s > 0.60 ? 'walk' : 'idle';
    else if (g === 'walk') this._gait = s < 0.35 ? 'idle' : (s > 6.6 ? 'run' : 'walk');
    else this._gait = s < 5.6 ? 'walk' : 'run';
    return this._gait;
  }
}

/* ------------------------------------------------------------ chase camera */

export class ChaseCamera {
  constructor() {
    this.yaw = 0;
    this.pitch = -0.18;         // Elbaf's initial pitch
    this.dist = 6.2 * WORLD_SCALE;
    this._dist = this.dist;
    this.target = new THREE.Vector3();
    this._eye = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }

  look(dx, dy) {
    this.yaw -= dx * YAW_SENS;
    this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch - dy * PITCH_SENS));
  }

  /**
   * @param nav used to keep the camera from sinking through the street; there
   *            is no geometry query here, only the baked height field, which is
   *            enough because the camera never goes far from the character.
   */
  update(dt, camera, ctrl, nav, sprinting) {
    const headY = ctrl.pos.y + BODY_HEIGHT * 0.72;
    this._look.set(ctrl.pos.x, headY, ctrl.pos.z);

    const cp = Math.cos(this.pitch);
    const ox = -Math.sin(this.yaw) * cp;
    const oy = Math.sin(this.pitch);
    const oz = -Math.cos(this.yaw) * cp;

    this._dist += (this.dist - this._dist) * (1 - Math.exp(-8 * dt));
    this._eye.set(this._look.x - ox * this._dist,
                  this._look.y - oy * this._dist + 1.15 * WORLD_SCALE,
                  this._look.z - oz * this._dist);

    // never let the chase cam drop below the street it is flying over
    const g = nav.heightAt(this._eye.x, this._eye.z);
    if (g !== null && this._eye.y < g + 0.6 * WORLD_SCALE) this._eye.y = g + 0.6 * WORLD_SCALE;

    camera.position.lerp(this._eye, 1 - Math.exp(-16 * dt));
    camera.lookAt(this._look);

    // Elbaf widens the lens while sprinting; same +7 degrees, damped
    const wantFov = 55 + (sprinting ? 7 : 0);
    if (Math.abs(camera.fov - wantFov) > 0.05) {
      camera.fov += (wantFov - camera.fov) * (1 - Math.exp(-6 * dt));
      camera.updateProjectionMatrix();
    }
  }
}
