/**
 * Playable character for the Hledan map — Elbaf's systems, ported whole.
 *
 * Earlier passes lifted Elbaf's *numbers* (speeds, jump, gravity) but not its
 * *machinery*, and the difference is exactly what made Hledan read as glitched
 * next to it. This file now carries the machinery itself, decompiled from the
 * Elbaf build and reproduced verbatim:
 *
 *   - the pose engine: bones are slerped toward compiled world-space targets
 *     (aim vectors / axis-angle deltas), parent-first, on top of whatever the
 *     walk/run mixer wrote. Same compiler, same applicator, same tables.
 *   - the locomotion mixer: idle weight damped 14/7, run blend over
 *     (speed - max*0.55)/(max*0.5), timeScale clamp(speed/2.6, .3, 2.2), and
 *     the run clip re-timed by runDur/walkDur so both gaits share one stride
 *     clock. (The old port had that ratio inverted — the foot stutter.)
 *   - procedural idle: breathing, sway and camera-following head look. Elbaf
 *     never plays the idle GLB clip and neither does this.
 *   - jump / fall / land poses, the landing squash, the airborne stretch, and
 *     the roll as a full 360° somersault about the hips.
 *   - the move pose layer with Elbaf's damp rates (26 up, 10 down) and the
 *     anticipation lunge: lean back for the first 20% of a move, drive forward
 *     through the rest.
 *   - Zoro's three swords — wado-ichimonji, sandai-kitetsu, enma — sheathed on
 *     the hip at all times and drawn into both hands and the mouth for the
 *     duration of any sword move, hip set hiding while they are out.
 *
 * Movement numbers (Elbaf's, in metres, × WORLD_SCALE at the point of use):
 *   base speed 5.6 / 5.2 / 5.9 · sprint ×1.75 · jump 7.8 / 6.8 / 7.0
 *   gravity −18 · ground accel 1−exp(−14·dt) · air ×0.35 · coyote 0.12
 *   one air jump at ×0.92 · look yaw .0045 pitch .0035, clamp [−.85, +.35]
 *
 * Elbaf gets collision from Rapier; here the ground height and blocked cells
 * are baked into navmesh.png and sampled from two flat arrays. See navmap.py.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

/**
 * The map is not in metres — it is about 1.5x life size (two dimensions of the
 * baked buses agree on the factor independently; see git history for the
 * derivation). The character and every motion constant are scaled into the
 * map's units instead of rescaling the map, which would invalidate the baked
 * navmap. Lengths and speeds scale by k; rates and durations must not.
 */
export const WORLD_SCALE = 1.5;
const S = WORLD_SCALE;

const GRAVITY      = -18 * S;
export const SPRINT_MULT = 1.75;
const ACCEL        = 14;                       // 1/s
const AIR_ACCEL_K  = 0.35;                     // Elbaf: air accel is 35% of ground
const BODY_HEIGHT  = 1.7 * S;
const BODY_RADIUS  = 0.25 * S;
const COYOTE_TIME  = 0.12;
const AIR_JUMPS    = 1;
const AIR_JUMP_MULT = 0.92;
const STEP_UP      = 0.62 * S;
const SNAP_DOWN    = 0.40 * S;
export const YAW_SENS   = 0.0045;
export const PITCH_SENS = 0.0035;
export const PITCH_MIN  = -0.85;
export const PITCH_MAX  = 0.35;
/** Feet → capsule centre. Every Elbaf height offset is authored against the
    capsule centre (feet + 0.85 m), so effects and the camera key off this. */
export const CENTER_Y = 0.85 * S;

/* Elbaf's crew stats, verbatim, in metres per second. */
const RAW_CHARACTERS = [
  { id: 'luffy', modelId: 'luffy',      name: 'Luffy', role: 'Captain',   speed: 5.6, jump: 7.8, style: 'rubber', blurb: 'Straw hat, and no plan whatsoever.' },
  { id: 'zoro',  modelId: 'zoro-elbaf', name: 'Zoro',  role: 'Swordsman', speed: 5.2, jump: 6.8, style: 'sword',  blurb: 'Lost. Insists he is not lost.' },
  { id: 'nami',  modelId: 'nami',       name: 'Nami',  role: 'Navigator', speed: 5.9, jump: 7.0, style: 'staff',  blurb: 'Already knows the way to the market.' },
];

export const CHARACTERS = RAW_CHARACTERS.map((c) => ({
  ...c,
  speed: c.speed * S,
  jump: c.jump * S,
}));

/* Elbaf's own frame-rate-independent damp — THREE.MathUtils.damp. */
const damp = (x, y, lambda, dt) => THREE.MathUtils.damp(x, y, lambda, dt);
const clamp = THREE.MathUtils.clamp;

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

    /* Repack and drop the RGBA: height-as-uint16 plus a flag byte, no per-call
       object allocation. Movement samples this ~22 times a frame. */
    const n = W * H;
    this.h = new Uint16Array(n);
    this.f = new Uint8Array(n);            // bit0 ground exists, bit1 walkable
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      if (rgba[k + 3] === 0) continue;
      this.h[i] = (rgba[k] << 8) | rgba[k + 1];
      this.f[i] = 1 | (rgba[k + 2] > 127 ? 2 : 0);
    }
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
  findOpen(x, z, maxR = 160) {
    if (!this.bodyBlocked(x, z) && this.heightAt(x, z) !== null) return { x, z };
    for (let i = 1; i < 400; i++) {
      const r = Math.min(maxR, 2.2 * Math.sqrt(i));
      const a = i * 2.39996;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (!this.bodyBlocked(px, pz) && this.heightAt(px, pz) !== null) return { x: px, z: pz };
    }
    return { x, z };
  }

  /**
   * Elbaf's aim ray, on the height field: march 16 coarse steps along the look
   * direction, then bisect 6 times when a step lands under the ground. Returns
   * the distance to the surface, or null in open air. This is the ground half
   * of spell targeting; walls come from the occlusion TriGrid in the caller.
   */
  raymarch(ox, oy, oz, dx, dy, dz, maxDist) {
    let prev = 0;
    for (let i = 1; i <= 16; i++) {
      const t = (i / 16) * maxDist;
      const gy = this.heightAt(ox + dx * t, oz + dz * t);
      if (gy !== null && oy + dy * t <= gy) {
        let lo = prev, hi = t;
        for (let j = 0; j < 6; j++) {
          const mid = (lo + hi) / 2;
          const g = this.heightAt(ox + dx * mid, oz + dz * mid);
          if (g !== null && oy + dy * mid <= g) hi = mid; else lo = mid;
        }
        return hi;
      }
      prev = t;
    }
    return null;
  }
}

/* ------------------------------------------------------------- pose engine */

/**
 * Elbaf's rig binding: bone names normalised and matched against patterns,
 * longest-specific first, with a guard so a left pattern never claims a right
 * bone. Same table, same order.
 */
const normBone = (n) => n.toLowerCase()
  .replace(/^mixamorig:?/, '').replace(/^bip\d*_?/, '').replace(/[\s_.\-:]/g, '');
const RE_L = /left|\bl$/;
const RE_R = /right|\br$/;

const BONE_PATTERNS = [
  ['head',      [/^head$/, /^head[^fe]/]],
  ['neck',      [/^neck/, /neck/]],
  ['chest',     [/upperchest/, /^chest/, /spine0?2/, /spine0?3/]],
  ['spine',     [/spine0?1/, /^spine$/]],
  ['hips',      [/^hips?$/, /pelvis/, /^root$/]],
  ['shoulderL', [/leftshoulder/, /shoulderl$/, /lclavicle/]],
  ['shoulderR', [/rightshoulder/, /shoulderr$/, /rclavicle/]],
  ['armL',      [/leftarm$/, /leftupperarm/, /upperarml$/]],
  ['armR',      [/rightarm$/, /rightupperarm/, /upperarmr$/]],
  ['foreArmL',  [/leftforearm/, /leftlowerarm/, /forearml$/]],
  ['foreArmR',  [/rightforearm/, /rightlowerarm/, /forearmr$/]],
  ['handL',     [/lefthand$/, /handl$/]],
  ['handR',     [/righthand$/, /handr$/]],
  ['upLegL',    [/leftupleg/, /leftthigh/, /upperlegl$/]],
  ['upLegR',    [/rightupleg/, /rightthigh/, /upperlegr$/]],
  ['legL',      [/leftleg$/, /leftcalf/, /leftshin/]],
  ['legR',      [/rightleg$/, /rightcalf/, /rightshin/]],
  ['footL',     [/leftfoot/, /footl$/]],
  ['footR',     [/rightfoot/, /footr$/]],
];

function bindBones(root) {
  const all = [];
  root.traverse((o) => { if (o.isBone) all.push(o); });
  const found = {};
  const taken = new Set();
  for (const [key, patterns] of BONE_PATTERNS) {
    for (const re of patterns) {
      if (found[key]) break;
      for (const bone of all) {
        if (taken.has(bone)) continue;
        const n = normBone(bone.name);
        if (!re.test(n)) continue;
        if (key.endsWith('L') && RE_R.test(n)) continue;
        if (key.endsWith('R') && RE_L.test(n)) continue;
        found[key] = bone; taken.add(bone); break;
      }
    }
  }
  return found;
}

/**
 * Which way the rig itself faces, from the feet: average the foot→toe
 * direction in world space. The pose tables are authored against a +Z rig, so
 * every spec vector is pre-rotated by −this before compiling.
 */
function rigYaw(root) {
  root.updateWorldMatrix(true, true);
  const feet = {};
  root.traverse((o) => {
    if (!o.isBone) return;
    const n = normBone(o.name);
    if (!feet.footL && /leftfoot|footl$/.test(n)) feet.footL = o;
    if (!feet.toeL && /lefttoe/.test(n)) feet.toeL = o;
    if (!feet.footR && /rightfoot|footr$/.test(n)) feet.footR = o;
    if (!feet.toeR && /righttoe/.test(n)) feet.toeR = o;
  });
  const a = new THREE.Vector3(), b = new THREE.Vector3(), sum = new THREE.Vector3();
  for (const [f, t] of [[feet.footL, feet.toeL], [feet.footR, feet.toeR]]) {
    if (!f || !t) continue;
    f.getWorldPosition(a); t.getWorldPosition(b);
    b.sub(a); b.y = 0;
    if (b.lengthSq() > 1e-8) sum.add(b.normalize());
  }
  return sum.lengthSq() < 1e-8 ? 0 : -Math.atan2(sum.x, sum.z);
}

/* ---- Elbaf's pose tables, verbatim.
   [x,y,z,angle] is an axis-angle delta; {aim} points the bone down a world
   direction (in the character's facing frame). ---- */

const P_IDLE_LUFFY = {
  armL: { aim: [.3, -.94, .16] }, armR: { aim: [-.3, -.94, .16] },
  foreArmL: { aim: [.19, -.9, .39] }, foreArmR: { aim: [-.19, -.9, .39] },
  spine: [1, 0, 0, .03], chest: [1, 0, 0, -.07], neck: [1, 0, 0, -.04], head: [1, 0, 0, -.05],
  upLegL: { aim: [.09, -.99, .04] }, upLegR: { aim: [-.14, -.978, .09] },
  legL: { aim: [.04, -.998, .05] }, legR: { aim: [-.06, -.987, .14] },
  footL: { aim: [.07, -.16, .98] }, footR: { aim: [-.16, -.18, .97] },
};
/* Zoro stands with his forearms folded across the sash. */
const P_IDLE_ZORO = {
  armL: { aim: [.4, -.89, .22] }, armR: { aim: [-.4, -.89, .22] },
  foreArmL: { aim: [-.93, .18, .31] }, foreArmR: { aim: [.94, .1, .32] },
  chest: [1, 0, 0, -.05], spine: [1, 0, 0, .04], neck: [1, 0, 0, .05], head: [1, 0, 0, .04],
  upLegL: { aim: [.13, -.985, .05] }, upLegR: { aim: [-.13, -.985, .05] },
  legL: { aim: [.06, -.99, .07] }, legR: { aim: [-.06, -.99, .07] },
  footL: { aim: [.1, -.17, .97] }, footR: { aim: [-.1, -.17, .97] },
};
const P_JUMP = {
  armL: { aim: [.55, .78, -.28] }, armR: { aim: [-.55, .78, -.28] },
  foreArmL: { aim: [.34, .92, -.2] }, foreArmR: { aim: [-.34, .92, -.2] },
  upLegL: { aim: [.16, -.78, .6] }, upLegR: { aim: [-.12, -.95, -.28] },
  legL: { aim: [.1, -.95, .28] }, legR: { aim: [-.08, -.5, -.86] },
  spine: [1, 0, 0, -.12], chest: [1, 0, 0, -.16],
};
const P_FALL = {
  armL: { aim: [.84, .16, -.2] }, armR: { aim: [-.84, .16, -.2] },
  foreArmL: { aim: [.66, .46, .3] }, foreArmR: { aim: [-.66, .46, .3] },
  upLegL: { aim: [.22, -.9, .36] }, upLegR: { aim: [-.2, -.94, .18] },
  legL: { aim: [.12, -.98, .1] }, legR: { aim: [-.1, -.99, .04] },
  spine: [1, 0, 0, .05], chest: [1, 0, 0, .08], head: [1, 0, 0, -.12],
};
const P_LAND = {
  upLegL: { aim: [.26, -.82, .51] }, upLegR: { aim: [-.26, -.82, .51] },
  legL: { aim: [.12, -.9, -.42] }, legR: { aim: [-.12, -.9, -.42] },
  footL: { aim: [.08, -.1, .99] }, footR: { aim: [-.08, -.1, .99] },
  chest: [1, 0, 0, .3], spine: [1, 0, 0, .2], head: [1, 0, 0, -.12],
  armL: { aim: [.66, -.66, -.35] }, armR: { aim: [-.66, -.66, -.35] },
  foreArmL: { aim: [.5, -.78, .38] }, foreArmR: { aim: [-.5, -.78, .38] },
};

const MOVE_POSE_SPECS = {
  punch: {
    armR: { aim: [-.06, .08, .99] }, foreArmR: { aim: [-.02, .03, 1] },
    armL: { aim: [.62, -.42, -.35] }, foreArmL: { aim: [.35, .3, .55] },
    chest: [0, 1, 0, .5], spine: [0, 1, 0, .22],
  },
  gatling: {
    armR: { aim: [-.14, .06, .98] }, armL: { aim: [.14, .06, .98] },
    foreArmR: { aim: [-.04, .02, 1] }, foreArmL: { aim: [.04, .02, 1] },
    chest: [1, 0, 0, .14], spine: [1, 0, 0, .08],
  },
  bazooka: {
    armR: { aim: [-.1, .04, .99] }, armL: { aim: [.1, .04, .99] },
    foreArmR: { aim: [-.03, 0, 1] }, foreArmL: { aim: [.03, 0, 1] },
    spine: [1, 0, 0, .12],
  },
  rocket: {
    armR: { aim: [-.16, .3, .94] }, armL: { aim: [.16, .3, .94] },
    foreArmR: { aim: [-.06, .2, .98] }, foreArmL: { aim: [.06, .2, .98] },
    chest: [1, 0, 0, .2],
  },
  balloon: {
    armL: { aim: [.92, .3, .12] }, armR: { aim: [-.92, .3, .12] },
    foreArmL: { aim: [.95, .05, .2] }, foreArmR: { aim: [-.95, .05, .2] },
    upLegL: { aim: [.4, -.9, .08] }, upLegR: { aim: [-.4, -.9, .08] },
  },
  haki: {
    armL: { aim: [.78, -.55, -.15] }, armR: { aim: [-.78, -.55, -.15] },
    foreArmL: { aim: [.85, -.5, -.1] }, foreArmR: { aim: [-.85, -.5, -.1] },
    chest: [1, 0, 0, -.28], neck: [1, 0, 0, -.18], head: [1, 0, 0, -.15],
  },
  gigant: {
    armR: { aim: [-.02, .16, .99] }, foreArmR: { aim: [0, .06, 1] },
    armL: { aim: [.76, -.52, -.4] }, foreArmL: { aim: [.52, .06, .42] },
    chest: [0, 1, 0, .7], spine: [0, 1, 0, .34],
    upLegL: { aim: [.5, -.85, .18] }, upLegR: { aim: [-.5, -.85, .18] },
  },
  gear2: {
    armL: { aim: [.44, -.84, .32] }, armR: { aim: [-.44, -.84, .32] },
    foreArmL: { aim: [.24, -.46, .86] }, foreArmR: { aim: [-.24, -.46, .86] },
    upLegL: { aim: [.34, -.9, .28] }, upLegR: { aim: [-.34, -.9, .28] },
    chest: [1, 0, 0, .18], spine: [1, 0, 0, .1],
  },
  onigiri: {
    armR: { aim: [-.74, -.5, .45] }, foreArmR: { aim: [-.88, -.34, .34] },
    armL: { aim: [.74, -.5, .45] }, foreArmL: { aim: [.88, -.34, .34] },
    chest: [1, 0, 0, .34], spine: [1, 0, 0, .18], head: [1, 0, 0, .24],
    upLegL: { aim: [.32, -.8, .5] }, upLegR: { aim: [-.4, -.88, -.26] },
  },
  tatsumaki: {
    armR: { aim: [-1, .08, 0] }, armL: { aim: [1, .08, 0] },
    foreArmR: { aim: [-1, .02, 0] }, foreArmL: { aim: [1, .02, 0] },
    chest: [1, 0, 0, -.16], spine: [1, 0, 0, -.08],
  },
  wavecast: {
    armR: { aim: [.44, .8, .4] }, foreArmR: { aim: [.32, .91, .26] },
    armL: { aim: [-.5, -.56, .66] }, foreArmL: { aim: [-.3, -.28, .91] },
    chest: [0, 1, 0, -.34], spine: [0, 1, 0, -.16], head: [1, 0, 0, -.26],
  },
  flash: {
    armR: { aim: [-.56, -.22, -.8] }, foreArmR: { aim: [-.42, -.12, -.9] },
    armL: { aim: [.3, -.26, .92] }, foreArmL: { aim: [.14, -.1, .98] },
    chest: [1, 0, 0, .36], spine: [1, 0, 0, .2],
    upLegL: { aim: [.2, -.56, .8] }, upLegR: { aim: [-.16, -.86, -.48] },
  },
  sanzen: {
    armR: { aim: [-.96, .1, .26] }, foreArmR: { aim: [-.99, .04, .12] },
    armL: { aim: [.84, -.12, .53] }, foreArmL: { aim: [.95, -.06, .3] },
    chest: [0, 1, 0, .64], spine: [0, 1, 0, .3], head: [0, 1, 0, .34],
  },
  asura: {
    armL: { aim: [.82, -.44, .36] }, armR: { aim: [-.82, -.44, .36] },
    foreArmL: { aim: [.64, -.18, .75] }, foreArmR: { aim: [-.64, -.18, .75] },
    upLegL: { aim: [.44, -.87, .22] }, upLegR: { aim: [-.44, -.87, .22] },
    chest: [1, 0, 0, .22], neck: [1, 0, 0, .2], head: [1, 0, 0, .24],
  },
};

/* Nami has no Elbaf pose data (she is an NPC there), so her staff kit borrows
   the shapes that read right for a caster: a jab, a raised call, a summon. */
const STAFF_POSE_FOR = {
  zap: 'punch', sizzle: 'gatling', tempo: 'wavecast',
  gust: 'rocket', storm: 'haki', mirage: 'flash',
};
/** Which pose key animates a given move id, for every kit. */
export const POSE_FOR_MOVE = {
  pistol: 'punch', gatling: 'gatling', bazooka: 'bazooka', rocket: 'rocket',
  gigant: 'gigant', gear2: 'gear2', haki: 'haki', balloon: 'balloon',
  onigiri: 'onigiri', tatsumaki: 'tatsumaki', wavecast: 'wavecast',
  flash: 'flash', sanzen: 'sanzen', asura: 'asura',
  ...STAFF_POSE_FOR,
};

/* The anticipation lunge: back for the first 20%, forward through the rest,
   scaled per move. Elbaf's envelope and per-move amplitudes, verbatim. */
const LUNGE_AMP = {
  punch: .5, gigant: 1, bazooka: .7, rocket: .3,
  onigiri: .85, sanzen: 1, wavecast: .6, flash: .45,
};
function lungeEnvelope(k) {
  if (k <= 0 || k >= 1) return 0;
  return k < .2 ? -Math.sin(k / .2 * Math.PI) * .55 : Math.sin((k - .2) / .8 * Math.PI);
}

/**
 * Compile a pose spec against THIS rig: per bone, a world-space delta
 * quaternion, plus the machinery to re-derive rest world orientations live so
 * the pose can be blended on top of the animated skeleton parent-first.
 * Ported from Elbaf; run once per (rig, spec) at load.
 */
function compilePose(found, spec, yawQuat) {
  const entries = [];
  const first = Object.values(found)[0];
  if (first) {
    let r = first;
    while (r.parent) r = r.parent;
    r.updateWorldMatrix(true, true);
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const pw = new THREE.Quaternion(), rw = new THREE.Quaternion(), tw = new THREE.Quaternion();

  for (const [role, bone] of Object.entries(found)) {
    let depth = 0;
    for (let p = bone.parent; p; p = p.parent) depth++;
    entries.push({
      role, bone, depth, spec: spec[role],
      restLocal: bone.quaternion.clone(),
      delta: new THREE.Quaternion(),
      parentWorld: new THREE.Quaternion(),
      restWorld: new THREE.Quaternion(),
      targetLocal: new THREE.Quaternion(),
      out: new THREE.Quaternion(),
      parentEntry: -1,
      world: new THREE.Quaternion(),
    });
  }
  entries.sort((x, y) => x.depth - y.depth);
  const index = new Map();
  entries.forEach((e, i) => index.set(e.bone, i));
  for (const e of entries) {
    const p = index.get(e.bone.parent);
    e.parentEntry = p === undefined ? -1 : p;
  }
  for (const e of entries) {
    const { bone, spec: sp } = e;
    if (Array.isArray(sp)) {
      const axis = new THREE.Vector3(sp[0], sp[1], sp[2]).normalize();
      if (yawQuat) axis.applyQuaternion(yawQuat);
      e.delta.setFromAxisAngle(axis, sp[3]);
    } else if (sp && sp.aim) {
      const child = bone.children.find((c) => c.isBone);
      if (child) {
        bone.getWorldPosition(a); child.getWorldPosition(b);
        const dir = b.sub(a);
        if (dir.lengthSq() > 1e-10) {
          const aim = new THREE.Vector3(sp.aim[0], sp.aim[1], sp.aim[2]).normalize();
          if (yawQuat) aim.applyQuaternion(yawQuat);
          e.delta.setFromUnitVectors(dir.normalize(), aim);
        }
      }
    }
    /* pose the bone momentarily so children compile against the posed parent,
       exactly as Elbaf does, then restore below */
    const parent = bone.parent;
    parent ? parent.getWorldQuaternion(pw) : pw.identity();
    rw.copy(pw).multiply(e.restLocal);
    tw.copy(e.delta).multiply(rw);
    bone.quaternion.copy(pw.invert()).multiply(tw);
    bone.updateWorldMatrix(false, false);
  }
  for (const e of entries) e.bone.quaternion.copy(e.restLocal);
  if (first) {
    let r = first;
    while (r.parent) r = r.parent;
    r.updateWorldMatrix(true, true);
  }
  return entries;
}

const _slerpQ = new THREE.Quaternion();
const _invQ = new THREE.Quaternion();
const _worldDelta = new THREE.Quaternion();
const _rootInv = new THREE.Quaternion();

/**
 * Apply a compiled pose at `weight`, on top of whatever the mixer wrote.
 * `rootQuat` is the model's live world orientation, so a pose authored facing
 * +Z lands wherever the character is actually facing. `layer(role)` may
 * return an extra quaternion — the idle driver's breathing — premultiplied in.
 */
function applyPose(entries, weight, rootQuat, layer) {
  _rootInv.copy(rootQuat).invert();
  for (const e of entries) {
    const parent = e.bone.parent;
    if (e.parentEntry >= 0) e.parentWorld.copy(entries[e.parentEntry].world);
    else if (parent) parent.getWorldQuaternion(e.parentWorld);
    else e.parentWorld.identity();
    e.restWorld.copy(e.parentWorld).multiply(e.restLocal);
    _worldDelta.copy(rootQuat).multiply(e.delta).multiply(_rootInv);
    e.out.copy(_worldDelta);
    const extra = layer ? layer(e.role) : null;
    if (extra) e.out.premultiply(extra);
    _slerpQ.identity().slerp(e.out, weight);
    e.targetLocal.copy(_slerpQ).multiply(e.restWorld);
    e.world.copy(e.targetLocal);
    _invQ.copy(e.parentWorld).invert();
    e.bone.quaternion.copy(_invQ).multiply(e.targetLocal);
    e.bone.updateWorldMatrix(false, false);
  }
}

/** Elbaf's procedural idle: breath, sway, and a head that follows the camera. */
function makeIdleDriver(params = {}) {
  const p = {
    breathRate: 1.15, breathAmp: .03, swayRate: .37, swayAmp: .024,
    armAmp: .035, headAmp: .045, lookAmp: .5, restless: 1, ...params,
  };
  const q = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  let t = 0, look = 0;
  return {
    set(time, lookDelta = 0) {
      t = time;
      const target = clamp(lookDelta, -p.lookAmp, p.lookAmp);
      look += (target - look) * .06;
    },
    layer: (role) => {
      const r = p.restless;
      switch (role) {
        case 'spine':
          return q.setFromAxisAngle(X, (Math.sin(t * p.breathRate) * p.breathAmp + Math.sin(t * p.breathRate * 2.31) * p.breathAmp * .28) * r);
        case 'chest':
          return q.setFromAxisAngle(X, -Math.sin(t * p.breathRate + .5) * p.breathAmp * .55 * r);
        case 'hips':
          return q.setFromAxisAngle(Z, Math.sin(t * p.swayRate) * p.swayAmp * r);
        case 'armL':
          return q.setFromAxisAngle(X, Math.sin(t * p.breathRate + .4) * p.armAmp * r);
        case 'armR':
          return q.setFromAxisAngle(X, Math.sin(t * p.breathRate + .75) * p.armAmp * r);
        case 'foreArmL':
          return q.setFromAxisAngle(X, Math.sin(t * p.breathRate + .95) * p.armAmp * .6 * r);
        case 'foreArmR':
          return q.setFromAxisAngle(X, Math.sin(t * p.breathRate + 1.3) * p.armAmp * .6 * r);
        case 'neck':
          axis.set(Math.sin(t * .23) * .3, 1, 0).normalize();
          return q.setFromAxisAngle(axis, look * .45 + Math.sin(t * .23) * p.headAmp * r);
        case 'head':
          axis.set(0, 1, 0);
          return q.setFromAxisAngle(axis, look * .55 + Math.sin(t * .31 + 1.1) * p.headAmp * .7 * r);
        default:
          return null;
      }
    },
  };
}

/* -------------------------------------------------------------- the swords */

/* Wado Ichimonji, Sandai Kitetsu, Enma — Elbaf's specs. */
const SWORD_SPECS = [
  { name: 'wado-ichimonji', saya: '#f2efe6', fitting: '#c9a13d', wrap: '#f2efe6', cross: '#26262e', steel: '#eef4fb' },
  { name: 'sandai-kitetsu', saya: '#9c2328', fitting: '#d4af37', wrap: '#a83232', cross: '#d4af37', steel: '#e8eef6' },
  { name: 'enma',           saya: '#6d3aa0', fitting: '#d4af37', wrap: '#7d2f35', cross: '#d4af37', steel: '#8f8fa8' },
];
const SHEATH_LEN = 1.09;      // authored katana length, metres
const BLADE_LEN = 0.76;
const DRAWN_SET = new Set(['onigiri', 'sanzen', 'wavecast', 'flash']);

let sheathGeoCache = null;
function sheathGeos() {
  if (sheathGeoCache) return sheathGeoCache;
  const along = (g) => { g.rotateX(Math.PI / 2); return g; };
  const cyl = (a, b, c, d) => new THREE.CylinderGeometry(a, b, c, d);
  return (sheathGeoCache = {
    saya: along(cyl(.024, .028, .78, 8)),
    kojiri: along(cyl(.031, .031, .035, 8)),
    band: along(cyl(.03, .03, .02, 8)),
    koiguchi: along(cyl(.031, .031, .026, 8)),
    tsuba: along(cyl(.056, .056, .016, 12)),
    tsuka: along(cyl(.023, .02, .28, 8)),
    cross: along(cyl(.0245, .0245, .014, 8)),
    kashira: along(cyl(.024, .024, .03, 8)),
  });
}

function sheathedKatana(spec) {
  const g = sheathGeos();
  const group = new THREE.Group();
  group.name = spec.name;
  const mSaya = new THREE.MeshStandardMaterial({ color: spec.saya, roughness: .35, metalness: .08, flatShading: true });
  const mFit = new THREE.MeshStandardMaterial({ color: spec.fitting, roughness: .35, metalness: .65, flatShading: true });
  const mWrap = new THREE.MeshStandardMaterial({ color: spec.wrap, roughness: .85, flatShading: true });
  const mCross = new THREE.MeshStandardMaterial({ color: spec.cross, roughness: .6, metalness: .3, flatShading: true });
  const add = (geo, mat, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z; mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  add(g.koiguchi, mFit, -.02); add(g.saya, mSaya, -.41); add(g.band, mFit, -.3);
  add(g.band, mFit, -.54); add(g.kojiri, mFit, -.79); add(g.tsuba, mFit, .005);
  add(g.tsuka, mWrap, .155);
  for (const z of [.065, .12, .175, .23]) add(g.cross, mCross, z);
  add(g.kashira, mFit, .3);
  return group;
}

function drawnKatana(spec, mouth = false) {
  const group = new THREE.Group();
  group.name = `drawn-${spec.name}`;
  const steel = new THREE.MeshStandardMaterial({
    color: spec.steel, roughness: .16, metalness: .9,
    emissive: new THREE.Color(spec.steel).multiplyScalar(.4), emissiveIntensity: 1,
    flatShading: true,
  });
  const mFit = new THREE.MeshStandardMaterial({ color: spec.fitting, roughness: .35, metalness: .65, flatShading: true });
  const mWrap = new THREE.MeshStandardMaterial({ color: spec.wrap, roughness: .85, flatShading: true });
  const add = (geo, mat, z, rot = true) => {
    if (rot) geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z; mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(.023, .02, .26, 8), mWrap, -.14);
  add(new THREE.CylinderGeometry(.024, .024, .03, 8), mFit, -.27);
  add(new THREE.CylinderGeometry(.052, .052, .014, 12), mFit, .005);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.017, .055, BLADE_LEN - .17), steel);
  blade.position.z = (BLADE_LEN - .17) * .5 + .01; blade.frustumCulled = false;
  group.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.0275, .2, 4), steel);
  tip.rotation.x = Math.PI / 2; tip.rotation.z = Math.PI / 4;
  tip.scale.set(.31, 1, 1); tip.position.z = BLADE_LEN - .1; tip.frustumCulled = false;
  group.add(tip);
  if (mouth) group.children.forEach((c) => { c.position.z += .1; });
  return group;
}

/** Where the drawn blades go: right hand, left hand, and the mouth. */
const DRAW_SLOTS = [
  { spec: 0, role: 'handR', along: 'foreArmR', reach: .02 },
  { spec: 2, role: 'handL', along: 'foreArmL', reach: .02 },
  { spec: 1, role: 'head', mouth: true, reach: .06 },
];

/**
 * Rough body metrics for prop placement — a light version of Elbaf's vertex
 * scanner: bone heights for the levels, a hip-band scan of the bind-pose
 * geometry for how far out the hip actually is.
 */
function measureBody(root, found) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const v = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(root);
  const min = box.min.clone().applyMatrix4(inv);
  const max = box.max.clone().applyMatrix4(inv);
  const boneY = (role) => {
    const b = found[role];
    if (!b) return null;
    b.getWorldPosition(v).applyMatrix4(inv);
    return v.y;
  };
  const height = max.y - min.y;
  const hipY = boneY('hips') ?? min.y + height * .52;
  // widest |x| within the hip band, sampled from the meshes
  let side = height * .09;
  const band = height * .07;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const pos = o.geometry.attributes.position;
    const m = new THREE.Matrix4().copy(inv).multiply(o.matrixWorld);
    const step = Math.max(1, Math.floor(pos.count / 1200));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      if (Math.abs(v.y - hipY) < band && Math.abs(v.x) > side && Math.abs(v.x) < height * .3) {
        side = Math.abs(v.x);
      }
    }
  });
  return { height, minY: min.y, hipY, sideAt: side };
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

const GEAR2_EMISSIVE = new THREE.Color('#ff4433');
const _rootQuat = new THREE.Quaternion();

/** Every layer the move system can drive, Elbaf's list minus the quest ones. */
const MOVE_LAYERS = ['gear2', 'balloon', 'gatling', 'tatsumaki', 'haki', 'asura',
  'punch', 'bazooka', 'rocket', 'flash', 'onigiri', 'wavecast', 'sanzen', 'gigant'];

export class Character {
  constructor(def, parts) {
    this.def = def;
    Object.assign(this, parts);   // root(holder), model, mixer, walk, run, …
    this.modelHeight = BODY_HEIGHT;

    // damped animation state
    this._air = 0;        // 0 grounded → 1 airborne
    this._fall = 0;       // 0 rising → 1 falling
    this._land = 0;       // landing squash impulse
    this._idle = 1;       // 1 still → 0 moving
    this._lean = { f: 0, s: 0, prevSpeed: 0 };
    this._moveW = Object.fromEntries(MOVE_LAYERS.map((k) => [k, 0]));
    this._gearGlow = 0;
    this._glowDirty = false;
    this._sword = 0;      // drawn-blades blend
    this._t = 0;
  }

  static async load(def, base = 'models/chars/', tier = 'hi') {
    const m = def.modelId || def.id;
    const [rigged, walkG, runG] = await Promise.all([
      loadGLB(`${base}${m}-rigged.opt.glb`),
      loadGLB(`${base}${m}-walk.opt.glb`),
      loadGLB(`${base}${m}-run.opt.glb`),
    ]);

    const model = skeletonClone(rigged.scene);
    const emissivePool = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;            // skinned bounds go stale while animating
      o.castShadow = o.receiveShadow = false;
      if (!o.material) return;

      /* Rebuild the KHR-physical materials as Standard, keeping the albedo.
         The low emissive lift is what keeps a character readable under the
         flyover on a map with no bounce light. */
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
        if (mat.map) {
          mat.emissiveMap = mat.map;
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 0.32;
        }
      } else {
        mat = new THREE.MeshLambertMaterial({ ...common, emissive: new THREE.Color(0x2a2f38) });
      }
      o.material = mat;
      emissivePool.push({ mat, base: mat.emissive.clone(), baseI: mat.emissiveIntensity ?? 1 });
      src.dispose();
    });

    /* Measure the SKINNED height after world matrices exist, scale feet-to-head
       to BODY_HEIGHT, drop the feet onto y=0 of the holder. */
    const measure = () => {
      model.updateMatrixWorld(true);
      model.traverse((o) => {
        if (o.isSkinnedMesh) { o.computeBoundingBox(); o.computeBoundingSphere(); }
      });
      return new THREE.Box3().setFromObject(model);
    };
    const box = measure();
    const raw = Math.max(box.max.y - box.min.y, 1e-6);
    model.scale.setScalar(BODY_HEIGHT / raw);
    const posed = measure();

    /* Elbaf's transform stack: the roll pivots about the hips, the landing
       squash scales about the feet, the lean composes under the facing yaw.
         holder(pos+facing) > roll(@hip) > unroll > squash > lean > model     */
    const hipYWorld = BODY_HEIGHT * 0.52;
    const holder = new THREE.Group();
    const rollG = new THREE.Group(); rollG.position.y = hipYWorld;
    const unrollG = new THREE.Group(); unrollG.position.y = -hipYWorld;
    const squashG = new THREE.Group();
    const leanG = new THREE.Group();
    holder.add(rollG); rollG.add(unrollG); unrollG.add(squashG); squashG.add(leanG);
    model.position.y = -posed.min.y;
    leanG.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const walkClip = walkG.animations[0], runClip = runG.animations[0];
    const walk = walkClip ? mixer.clipAction(walkClip) : null;
    const run = runClip ? mixer.clipAction(runClip) : null;
    for (const a of [walk, run]) {
      if (!a) continue;
      a.setLoop(THREE.LoopRepeat, Infinity);
      a.enabled = true;
      a.play();
      a.weight = 0;
    }

    const found = bindBones(model);
    const yaw = rigYaw(model);
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);

    const poses = {
      idle: compilePose(found, def.id === 'zoro' ? P_IDLE_ZORO : P_IDLE_LUFFY, yawQuat),
      jump: compilePose(found, P_JUMP, yawQuat),
      fall: compilePose(found, P_FALL, yawQuat),
      land: compilePose(found, P_LAND, yawQuat),
    };
    const movePoses = {};
    for (const key of Object.keys(MOVE_POSE_SPECS)) {
      movePoses[key] = compilePose(found, MOVE_POSE_SPECS[key], yawQuat);
    }

    const idleDriver = def.id === 'zoro'
      ? makeIdleDriver({ restless: .4, breathRate: .95, swayRate: .25, lookAmp: .34 })
      : makeIdleDriver({ restless: 1, breathRate: 1.2, swayRate: .41, lookAmp: .55 });

    const chr = new Character(def, {
      root: holder, model, rollG, squashG, leanG, mixer, walk, run,
      walkDur: walkClip?.duration || 1, runDur: runClip?.duration || 1,
      bones: found, poses, movePoses, idleDriver, emissivePool,
      spineBase: found.spine ? found.spine.scale.x : 1,
      headBase: found.head ? found.head.scale.x : 1,
    });

    if (def.style === 'sword') chr._buildSwords();
    return chr;
  }

  /* Three swords: the sheathed bundle rides the chest bone (so it follows the
     torso), the drawn blades live in the hands and the mouth and appear only
     while a sword move is live. All the maths runs at bind pose, which is
     where the skeleton still is at load time. */
  _buildSwords() {
    const found = this.bones;
    const anchor = found.chest ?? found.spine ?? found.hips;
    if (!anchor) return;
    this.model.updateWorldMatrix(true, true);
    const body = measureBody(this.model, found);

    const bundle = new THREE.Group();
    bundle.name = 'zoro-swords';
    const k = clamp(body.height * .62 / SHEATH_LEN, .75, 1.3);
    SWORD_SPECS.forEach((spec, i) => {
      const sw = sheathedKatana(spec);
      sw.position.set(.015 * i, .04 - .042 * i, 0);
      sw.rotation.x = -(.34 - .085 * i);
      sw.rotation.y = .08 - .055 * i;
      bundle.add(sw);
    });
    bundle.scale.setScalar(k);
    const hipY = body.hipY + body.height * .02;
    bundle.position.set(body.sideAt + .012 * k, hipY, body.height * .01);

    // express the bundle (authored in model space) in the chest bone's frame
    const holder = new THREE.Group();
    holder.add(bundle);
    this.model.updateWorldMatrix(true, true);
    const toBone = new THREE.Matrix4().copy(anchor.matrixWorld).invert().multiply(this.model.matrixWorld);
    holder.matrix.copy(toBone);
    holder.matrix.decompose(holder.position, holder.quaternion, holder.scale);
    holder.matrixAutoUpdate = true;
    anchor.add(holder);
    this._sheathed = bundle;

    // drawn blades, one per slot, hidden until a sword move fires
    const rigForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), -rigYaw(this.model));
    const wq = new THREE.Quaternion();
    this.model.getWorldQuaternion(wq);
    rigForward.applyQuaternion(wq);
    const pa = new THREE.Vector3(), pb = new THREE.Vector3();
    const bq = new THREE.Quaternion(), rot = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    const inv = new THREE.Matrix4();
    this._drawn = [];
    for (const slot of DRAW_SLOTS) {
      const bone = found[slot.role];
      if (!bone) continue;
      const dir = new THREE.Vector3();
      const alongBone = slot.along ? found[slot.along] : null;
      if (alongBone) {
        bone.getWorldPosition(pa); alongBone.getWorldPosition(pb);
        dir.copy(pa).sub(pb);
        if (dir.lengthSq() < 1e-12) dir.copy(rigForward);
        dir.normalize();
      } else dir.copy(rigForward);
      const blade = drawnKatana(SWORD_SPECS[slot.spec], !!slot.mouth);
      bone.getWorldQuaternion(bq);
      blade.quaternion.copy(bq.invert()).multiply(rot.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir));
      /* the katana is authored in metres; S carries it into map units, and
         1/boneScale undoes whatever scale the bone chain would add on top */
      const boneScale = sc.setFromMatrixScale(bone.matrixWorld).x || 1;
      blade.scale.setScalar(S / boneScale);
      blade.userData.base = S / boneScale;
      bone.getWorldPosition(pa).addScaledVector(dir, slot.reach * S);
      blade.position.copy(pa).applyMatrix4(inv.copy(bone.matrixWorld).invert());
      blade.visible = false;
      bone.add(blade);
      this._drawn.push(blade);
    }
  }

  /**
   * One call per frame, Elbaf's whole animation pass in Elbaf's order.
   *
   * @param dt seconds
   * @param mo {speed, maxSpeed, grounded, vy, landing, roll, facing, lookYaw,
   *            turn} — speeds in map units/s (they are divided back to metres
   *            here, where the clips were authored), turn in rad/s
   * @param cb {style, move, moveK, gatling, balloon, haki, gear2} from Combat
   */
  update(dt, mo, cb) {
    dt = Math.min(dt, .05);
    this._t += dt;
    const speed = mo.speed / S;
    const max = Math.max(.001, mo.maxSpeed / S);
    const vy = mo.vy / S;
    const landing = mo.landing / S;
    const moving = speed > .25;
    const runW = clamp((speed - max * .55) / (max * .5), 0, 1);

    // airborne / falling / landing / idle blends, Elbaf's rates
    this._air = damp(this._air, mo.grounded ? 0 : 1, mo.grounded ? 9 : 16, dt);
    const fallT = mo.grounded ? 0 : clamp(.5 - vy / 11, 0, 1);
    this._fall = damp(this._fall, fallT, mo.grounded ? 14 : 9, dt);
    if (landing > 5) this._land = Math.min(1, (landing - 5) / 11);
    this._land = damp(this._land, 0, 7, dt);
    this._idle = damp(this._idle, moving ? 0 : 1, moving ? 14 : 7, dt);

    // roll: a full somersault about the hips
    this.rollG.rotation.x = mo.roll * Math.PI * 2;

    // lean + bank + the anticipation lunge
    {
      const k = clamp(speed / (max * 1.6), 0, 1);
      const accel = (speed - this._lean.prevSpeed) / Math.max(dt, 1e-4);
      this._lean.prevSpeed = speed;
      let f = mo.grounded ? k * .14 + clamp(accel * .01, -.06, .08) : -.07;
      if (mo.grounded && k > .05) f += Math.sin(this._t * (4 + speed * 1.6)) * .02 * k;
      const bank = clamp(-mo.turn * .06, -.16, .16) * Math.min(1, speed / 2.5);
      this._lean.f = damp(this._lean.f, f, 7, dt);
      this._lean.s = damp(this._lean.s, bank, 7, dt);
      const lunge = lungeEnvelope(cb.moveK) * (LUNGE_AMP[POSE_FOR_MOVE[cb.move]] ?? 0);
      this.leanG.rotation.x = this._lean.f + lunge * .3;
      this.leanG.rotation.z = this._lean.s;
    }

    // stretch in the air, squash on landing
    {
      const stretch = this._air * (1 - this._fall);
      const squash = this._land * .22;
      this.squashG.scale.set(1 + squash * .5 + stretch * .02,
                             1 - squash + stretch * .05,
                             1 + squash * .5 + stretch * .02);
    }

    // facing — the holder carries position + yaw only
    this.root.rotation.set(0, mo.facing, 0);
    this.root.updateWorldMatrix(true, false);
    this.model.getWorldQuaternion(_rootQuat);

    // locomotion mixer: idle weight damped, run blend, one stride clock
    const loco = 1 - this._idle;
    const ts = clamp(speed / 2.6, .3, 2.2) * (mo.grounded ? 1 : .25);
    if (this.walk) { this.walk.weight = loco * (1 - runW); this.walk.timeScale = ts; }
    if (this.run) { this.run.weight = loco * runW; this.run.timeScale = ts * (this.runDur / this.walkDur); }
    this.mixer.update(dt);

    // pose layers, in Elbaf's order: idle → air → land → roll tuck → moves
    if (this._idle > .002) {
      let d = mo.lookYaw - mo.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.idleDriver.set(this._t, d);
      applyPose(this.poses.idle, this._idle, _rootQuat, this.idleDriver.layer);
    }
    if (this._air > .002) {
      applyPose(this.poses.jump, this._air, _rootQuat, null);
      const fw = this._air * this._fall;
      if (fw > .002) applyPose(this.poses.fall, fw, _rootQuat, null);
    }
    if (this._land > .01) applyPose(this.poses.land, Math.min(.72, this._land), _rootQuat, null);
    if (mo.roll > 0) applyPose(this.poses.jump, Math.sin(mo.roll * Math.PI) * .7, _rootQuat, null);

    // move layer targets, damped 26 up / 10 down
    const sword = cb.style === 'sword';
    const mv = cb.move;
    const poseKey = POSE_FOR_MOVE[mv];
    const want = {
      punch: poseKey === 'punch' ? 1 : 0,
      gigant: poseKey === 'gigant' ? 1 : 0,
      bazooka: poseKey === 'bazooka' ? 1 : 0,
      rocket: poseKey === 'rocket' ? 1 : 0,
      onigiri: poseKey === 'onigiri' ? 1 : 0,
      sanzen: poseKey === 'sanzen' ? 1 : 0,
      wavecast: poseKey === 'wavecast' ? 1 : 0,
      flash: poseKey === 'flash' ? 1 : 0,
      gatling: sword ? 0 : cb.gatling,
      tatsumaki: sword && cb.gatling > .15 ? 1 : 0,
      balloon: cb.balloon,
      haki: !sword && cb.haki > 0 ? 1 : 0,
      asura: sword && cb.haki > 0 ? 1 : 0,
      gear2: !sword && cb.gear2 && !mv && cb.gatling < .15 ? 1 : 0,
    };
    for (const key of MOVE_LAYERS) {
      const target = want[key] ?? 0;
      this._moveW[key] = damp(this._moveW[key], target, target > this._moveW[key] ? 26 : 10, dt);
      if (this._moveW[key] > .004 && this.movePoses[key]) {
        applyPose(this.movePoses[key], Math.min(1, this._moveW[key]), _rootQuat, null);
      }
    }

    // the balloon inflates the spine, and the head stays head-sized
    const spineBone = this.bones.spine ?? this.bones.chest;
    if (spineBone) {
      const g = 1 + cb.balloon * .9;
      spineBone.scale.setScalar(this.spineBase * g);
      if (this.bones.head) this.bones.head.scale.setScalar(this.headBase / g);
    }

    // Gear Second: the body itself glows
    this._gearGlow = damp(this._gearGlow, cb.gear2 ? 1 : 0, 6, dt);
    if (this._gearGlow > .004) {
      for (const e of this.emissivePool) {
        e.mat.emissive.copy(e.base).lerp(GEAR2_EMISSIVE, this._gearGlow * .5);
        e.mat.emissiveIntensity = e.baseI + this._gearGlow * .55;
      }
      this._glowDirty = true;
    } else if (this._glowDirty) {
      for (const e of this.emissivePool) {
        e.mat.emissive.copy(e.base);
        e.mat.emissiveIntensity = e.baseI;
      }
      this._glowDirty = false;
    }

    // the swords come out for the sword moves, and the hip set hides
    if (this._drawn) {
      const out = sword && (DRAWN_SET.has(mv) || cb.gatling > .1 || cb.haki > 0) ? 1 : 0;
      this._sword = damp(this._sword, out, out ? 34 : 9, dt);
      const f = this._sword;
      for (const blade of this._drawn) {
        blade.visible = f > .02;
        if (!blade.visible) continue;
        const base = blade.userData.base;
        blade.scale.set(base, base, base * THREE.MathUtils.smoothstep(f, 0, .85));
      }
      if (this._sheathed) {
        for (const sw of this._sheathed.children) sw.visible = f < .5;
      }
    }
  }

  dispose() {
    this.mixer.stopAllAction();
    this.root.traverse((o) => { if (o.isMesh && o.material) o.material.dispose(); });
  }
}

/* -------------------------------------------------------------- controller */

/**
 * Elbaf's on-foot movement on the baked navmap. Combat hands in a `drive`
 * each frame — a velocity override while a move owns the body, a facing mode,
 * and the smooth speed multiplier — so the two stay one machine the way they
 * are in the Elbaf source, just split across two files.
 */
export class CharacterController {
  constructor(nav, obstacles = null) {
    this.nav = nav;
    this.obstacles = obstacles;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.grounded = false;
    this.coyote = 0;
    this.airJumps = AIR_JUMPS;
    this.groundY = 0;
    this.speedXZ = 0;
    this.airTime = 0;
    this.landing = 0;          // fall speed on the landing frame, map u/s
    this.turn = 0;             // damped facing rate, rad/s
    this._prevVy = 0;
    this._prevFacing = 0;
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._want = new THREE.Vector3();
  }

  placeAt(x, z) {
    let spot = this.nav.findOpen(x, z);
    /* findOpen only knows the baked map, and every bus, tea shop and pole was
       added on top of it — so a cell that is open on the navmap can still have
       a parked vehicle standing in it. Landing there leaves you wedged: every
       axis test fails against the obstacle you are already inside, and the
       sub-step retry lets you creep out at walking pace instead of moving.
       Search on for somewhere that is clear of BOTH. */
    if (this.obstacles) {
      const clear = (px, pz) => {
        const gy = this.nav.heightAt(px, pz);
        return gy !== null && !this.nav.bodyBlocked(px, pz)
          && !this.obstacles.blocked(px, pz, BODY_RADIUS, gy);
      };
      if (!clear(spot.x, spot.z)) {
        for (let i = 1; i < 400; i++) {
          const r = Math.min(160, 2.2 * Math.sqrt(i));
          const a = i * 2.39996;
          const px = spot.x + Math.cos(a) * r, pz = spot.z + Math.sin(a) * r;
          if (!clear(px, pz)) continue;
          spot = { x: px, z: pz };
          break;
        }
      }
    }
    const y = this.nav.heightAt(spot.x, spot.z);
    this.pos.set(spot.x, (y ?? 0) + 0.05 * S, spot.z);
    this.vel.set(0, 0, 0);
    this.groundY = y ?? 0;
    this.grounded = true;
    this.airJumps = AIR_JUMPS;
    this.landing = 0;
  }

  /**
   * @param input {moveX, moveZ, sprint, jump, yaw}
   * @param stats {speed, jump} — already multiplied by gear/hold factors
   * @param drive {vx, vz} velocity override | null · {vy} absolute vertical |
   *              {face: 'move'|'look'|'spin', lookYaw, spin} facing control ·
   *              {balloon} 0..1 for the bounce
   */
  update(dt, input, stats, drive = {}) {
    const nav = this.nav;

    // wish direction in camera-yaw space (Elbaf's basis)
    this._fwd.set(-Math.sin(input.yaw), 0, -Math.cos(input.yaw));
    this._right.set(Math.cos(input.yaw), 0, -Math.sin(input.yaw));
    this._want.copy(this._fwd).multiplyScalar(input.moveZ).addScaledVector(this._right, input.moveX);
    const mag = this._want.length();
    if (mag > 1) this._want.divideScalar(mag);

    const target = stats.speed * (input.sprint ? SPRINT_MULT : 1);
    if (drive.vx !== undefined) {
      this.vel.x = drive.vx;
      this.vel.z = drive.vz;
    } else {
      const wantX = this._want.x * target;
      const wantZ = this._want.z * target;
      const k = 1 - Math.exp(-ACCEL * (this.grounded ? 1 : AIR_ACCEL_K) * dt);
      let vx = this.vel.x + (wantX - this.vel.x) * k;
      let vz = this.vel.z + (wantZ - this.vel.z) * k;
      // Elbaf pins the body when grounded with no input and nearly stopped
      if (this.grounded && mag < .01 && Math.hypot(vx, vz) < .6 * S) { vx = 0; vz = 0; }
      this.vel.x = vx;
      this.vel.z = vz;
    }

    // jump: ground jump on coyote, then one air jump at 0.92x
    if (input.jump) {
      if (this.coyote > 0) {
        this.vel.y = stats.jump;
        this.coyote = 0;
      } else if (this.airJumps > 0) {
        this.vel.y = stats.jump * AIR_JUMP_MULT;
        this.airJumps -= 1;
      }
    }
    if (drive.vy !== undefined) this.vel.y = drive.vy;

    this.vel.y += GRAVITY * dt;
    if (this.vel.y < -55 * S) this.vel.y = -55 * S;

    /* Horizontal, resolved per axis so walls slide instead of sticking. A
       blocked axis retries at half and quarter step before giving up: at
       sprint speed a full step is a quarter of a navmap cell, and slamming it
       to zero against every rough-height cell is what made running with Shift
       stutter — the body alternated blocked/free through the bilinear noise.
       Creeping up to the obstruction instead keeps the speed continuous. */
    const from = this.groundY;
    const stepX = this.vel.x * dt, stepZ = this.vel.z * dt;
    const tryX = (dx) => {
      if (!this._canStand(this.pos.x + dx, this.pos.z, from)) return false;
      this.pos.x += dx; return true;
    };
    const tryZ = (dz) => {
      if (!this._canStand(this.pos.x, this.pos.z + dz, from)) return false;
      this.pos.z += dz; return true;
    };
    if (stepX !== 0 && !(tryX(stepX) || tryX(stepX * 0.5) || tryX(stepX * 0.25))) this.vel.x *= 0.2;
    if (stepZ !== 0 && !(tryZ(stepZ) || tryZ(stepZ * 0.5) || tryZ(stepZ * 0.25))) this.vel.z *= 0.2;

    // vertical
    const prevVy = this.vel.y;
    this.pos.y += this.vel.y * dt;
    const gy = nav.heightAt(this.pos.x, this.pos.z);
    if (gy !== null) this.groundY = gy;

    /* Ground snap: the height field is photogrammetry, so the surface drops a
       few centimetres underfoot constantly. Anything within SNAP_DOWN while
       already grounded and not moving upward is still standing. */
    const wasAir = !this.grounded;
    const snap = (!wasAir && this.vel.y <= 0) ? SNAP_DOWN : 0;
    this.landing = 0;
    if (this.pos.y <= this.groundY + snap) {
      if (wasAir) {
        const fall = -prevVy;
        this.landing = Math.max(0, fall);
        // Gum-Gum Balloon: a hard landing becomes a bounce
        if ((drive.balloon || 0) > .5 && fall > 6 * S) {
          this.vel.y = Math.min(16 * S, fall * .72);
          this.pos.y = this.groundY + .01;
          this.grounded = false;
          this.bounced = true;
          this.airTime = 0;
          this.coyote = 0;
        }
      }
      if (this.landing === 0 || !this.bounced) {
        this.pos.y = this.groundY;
        this.vel.y = 0;
        this.grounded = true;
        this.airTime = 0;
        this.coyote = COYOTE_TIME;
        this.airJumps = AIR_JUMPS;
      }
      this.bounced = false;
    } else {
      this.grounded = false;
      this.airTime += dt;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    // facing: toward the input direction — or the camera, while fighting
    this.speedXZ = Math.hypot(this.vel.x, this.vel.z);
    if (drive.face === 'spin') {
      this.facing += dt * drive.spin;
    } else if (drive.face === 'look') {
      let d = drive.lookYaw - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * (1 - Math.exp(-20 * dt));
    } else if (mag > .01) {
      let d = Math.atan2(this._want.x, this._want.z) - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * (1 - Math.exp(-12 * dt));
    }
    if (drive.faceSet !== undefined) this.facing = drive.faceSet;

    // damped turn rate, for the bank
    let dF = this.facing - this._prevFacing;
    dF = Math.atan2(Math.sin(dF), Math.cos(dF));
    this.turn = damp(this.turn, dF / Math.max(dt, 1e-4), 8, dt);
    this._prevFacing = this.facing;
    this._prevVy = this.vel.y;
    return this;
  }

  /** Open cell, nothing solid parked in it, and not a step taller than a kerb. */
  _canStand(x, z, fromY) {
    if (this.nav.bodyBlocked(x, z)) return false;
    if (this.obstacles && this.obstacles.blocked(x, z, BODY_RADIUS, fromY)) return false;
    const y = this.nav.heightAt(x, z);
    if (y === null) return false;
    if (!this.grounded) return true;
    if ((y - fromY) > STEP_UP) return false;
    /* The kerb test alone is not enough: the height field is bilinear, so a
       2 m parapet reads as a short steep ramp one cell wide, and taken in
       sprint-sized steps every rise squeaks under STEP_UP — which is how
       running into the flyover wall CLIMBED it and beached you on top. Probe
       one body radius further along the step: a kerb has flat ground there, a
       wall has the rest of itself. Void ahead is fine — that is an edge, and
       edges are walkable. */
    const dx = x - this.pos.x, dz = z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 1e-6) {
      const ax = x + (dx / d) * BODY_RADIUS, az = z + (dz / d) * BODY_RADIUS;
      const ahead = this.nav.heightAt(ax, az);
      if (ahead !== null && (ahead - fromY) > STEP_UP) return false;
    }
    return true;
  }
}

/* ------------------------------------------------------------ chase camera */

const CAM_DIST   = 7.2 * S;               // Elbaf's follow distance
const CAM_HEAD   = (CENTER_Y / S + 1.5);  // look target, metres above the feet
const CAM_PAD      = 0.45 * S;
const MIN_CAM_DIST = 0.95 * S;
const CAM_RETREAT  = 3.2;

export class ChaseCamera {
  constructor() {
    this.yaw = 0;
    this.pitch = -0.18;               // Elbaf's initial pitch
    this.dist = CAM_DIST;
    this._dist = this.dist;
    this.fovPunch = 0;                // heavy hits kick the lens in briefly
    this.touch = false;
    this.target = new THREE.Vector3();
    this._eye = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._occl = 1;
  }

  look(dx, dy) {
    this.yaw -= dx * YAW_SENS;
    this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch - dy * PITCH_SENS));
  }

  punch(amount) { this.fovPunch = Math.max(this.fovPunch, amount); }

  update(dt, camera, ctrl, nav, occluders) {
    /* The look target tracks the body directly in XZ but is damped in Y: the
       street is photogrammetry, so at sprint speed the ground height wobbles
       a few centimetres every frame, and an undamped target turns that into
       camera judder. Jumps still read — 10/s follows an apex with ~0.1 s of
       lag — while the road noise disappears. */
    const headY = ctrl.pos.y + (CAM_HEAD - (this.touch ? .3 : 0)) * S;
    this._headY = this._headY === undefined
      ? headY
      : this._headY + (headY - this._headY) * (1 - Math.exp(-10 * dt));
    this._look.set(ctrl.pos.x, this._headY, ctrl.pos.z);

    const cp = Math.cos(this.pitch);
    const ox = -Math.sin(this.yaw) * cp;
    const oy = Math.sin(this.pitch);
    const oz = -Math.cos(this.yaw) * cp;

    this._dist += (this.dist - this._dist) * (1 - Math.exp(-8 * dt));
    this._eye.set(this._look.x - ox * this._dist,
                  this._look.y - oy * this._dist,
                  this._look.z - oz * this._dist);

    /* Keep the eye above a street on the character's own level; a surface more
       than a step above their feet is the flyover deck, not their ground. */
    const g = nav.heightAt(this._eye.x, this._eye.z);
    if (g !== null && g < ctrl.pos.y + STEP_UP && this._eye.y < g + 1.1 * S) {
      this._eye.y = g + 1.1 * S;
    }

    /* Pull in when solid geometry stands between head and eye. Instant in,
       eased back out. */
    this._dir.subVectors(this._eye, this._look);
    const full = this._dir.length();
    if (occluders && full > 1e-4) {
      this._dir.multiplyScalar(1 / full);
      const hit = occluders.raycast(this._look, this._dir, full);
      let allow = 1;
      if (hit >= 0) {
        allow = Math.max(MIN_CAM_DIST / full, (hit - CAM_PAD) / full);
        allow = Math.min(1, allow);
      }
      this._occl = allow < this._occl
        ? allow
        : this._occl + (allow - this._occl) * (1 - Math.exp(-CAM_RETREAT * dt));
      this._eye.copy(this._look).addScaledVector(this._dir, full * this._occl);
    }

    camera.position.lerp(this._eye, 1 - Math.exp(-14 * dt));
    camera.lookAt(this._look);

    // Elbaf's lens: 60°, kicked in by up to 7° on the heavy hits
    this.fovPunch = damp(this.fovPunch, 0, 7, dt);
    const wantFov = 60 - this.fovPunch * 7;
    if (Math.abs(camera.fov - wantFov) > 0.02) {
      camera.fov = wantFov;
      camera.updateProjectionMatrix();
    }
  }
}
