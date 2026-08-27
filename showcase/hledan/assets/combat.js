/**
 * Combat — Elbaf's move machine and its effects, ported whole.
 *
 * The shape that matters, and that the old version did not have:
 *
 *   - moves are EXCLUSIVE. One move owns the body at a time; pressing another
 *     during it buffers the press for 0.2 s and fires it the moment the body
 *     is free. Only the heavy hitters carry cooldowns (bazooka 1.1, gigant 6,
 *     haki 12, gear 5); the strikes are gated by exclusivity alone.
 *   - moves DRIVE the body. Pistol lunges you 19 m/s down the aim, Oni Giri
 *     dashes 22, Sanzen 26, Bazooka recoils, Rocket flies you to the aim point
 *     and does not stop until you arrive. The punch is a movement.
 *   - the hit lands at 55% through the move, not on the keypress: ring, shake,
 *     hit stop (a slow-mo bite, ×0.12, not a freeze) and a lens punch arrive
 *     together, which is most of why the heavies feel heavy.
 *   - while any move, gatling or haki is live, the character faces the CAMERA
 *     aim, not the travel direction; Tatsumaki spins the body at 16 rad/s.
 *
 * Effects are Elbaf's renderers rebuilt without React: the impact-ring pool
 * with its rock debris, the rubber arm and fist that actually stretch from the
 * shoulder to the hit, the seven flickering Gatling ghost-arms, the aim
 * reticle, Zoro's speed-lines / spin-planes / flying crescent, and the Gear
 * Second steam with its red point light. Everything is pooled at construction;
 * nothing allocates during play.
 *
 * Nami has no Elbaf kit (she is an NPC there), so her staff moves are mapped
 * onto the same slots and the same machine — identical timings, gates and
 * buffering — with thunder for visuals.
 *
 * Flash Step is the one move that is more than a port. It keeps Elbaf's window
 * and its reach to the metre, but the speed inside that window is shaped
 * rather than flat, the afterimages are laid along the path the body actually
 * took, the arrival ring is a cut rather than a plate, and the pose it drives
 * is two shapes with the handover on the frame the hit lands. See
 * `flashSpeedShape` and `_trail` below, and `flashCut` in character.js.
 */
import * as THREE from 'three';
import { WORLD_SCALE, CENTER_Y } from './character.js';

const S = WORLD_SCALE;
const damp = (x, y, l, dt) => THREE.MathUtils.damp(x, y, l, dt);

/* ---- Elbaf's constants, verbatim (metres / seconds) ---- */
const AIM_RANGE   = 70 * S;
const BUFFER_T    = 0.2;
const PISTOL_DUR  = .22, PISTOL_LUNGE = 19 * S;
const ONIGIRI_DUR = .3,  ONIGIRI_DASH = 22 * S;
const BAZOOKA_DUR = .34, BAZOOKA_RANGE = 9 * S, BAZOOKA_CD = 1.1;
const GIGANT_DUR  = .55, GIGANT_RANGE = 12 * S, GIGANT_CD = 6;
const SANZEN_DUR  = .5,  SANZEN_DASH = 26 * S, SANZEN_CD = 6;
const ROCKET_DUR  = .55, ROCKET_SPEED = 26 * S;
/* How long a flight may keep steering before it gives up. At 26 m/s this is
   about 60 m of travel, which covers the whole aim range; the cap only ever
   bites when something solid is in the way. */
const FLY_MAX = 2.4;
const GATLING_INT = .09, GATLING_RANGE = 13 * S, GATLING_SLOW = .35;
const TATSU_INT   = .13, TATSU_RADIUS = 3.4 * S, TATSU_SPIN = 16;
const WAVE_TRAVEL = 32 * S, WAVE_DUR = .65, WAVE_CD = 1.1;
const HAKI_WINDUP = .8, HAKI_CD = 12, ASURA_RADIUS = 6 * S;
const GEAR2_DUR   = 8, GEAR2_CD = 5;
export const GEAR2_SPEED = 1.4, GEAR2_JUMP = 1.12;
const BALLOON_SLOW = .55;
export const ROLL_DUR = 0.5, ROLL_SPEED = 13;

/**
 * HUD metadata per kit. The keys are Elbaf's exact desktop bindings; `cd`
 * marks the slots that actually have one. Mechanics live in step(), keyed by
 * slot, so all three kits run the identical machine.
 */
export const MOVES = {
  rubber: {
    strike:  { id: 'pistol',  name: 'Gum-Gum Pistol',  short: 'Pistol',  key: 'KeyQ' },
    sustain: { id: 'gatling', name: 'Gum-Gum Gatling', short: 'Gatling', key: 'KeyF', hold: true },
    heavy:   { id: 'bazooka', name: 'Gum-Gum Bazooka', short: 'Bazooka', key: 'KeyR', cd: BAZOOKA_CD },
    dash:    { id: 'rocket',  name: 'Gum-Gum Rocket',  short: 'Rocket',  key: 'KeyE' },
    ult:     { id: 'gigant',  name: 'Gum-Gum Gigant',  short: 'Gigant',  key: 'KeyT', cd: GIGANT_CD },
    gear:    { id: 'gear2',   name: 'Gear Second',     short: 'Gear 2',  key: 'KeyG', cd: GEAR2_CD },
    guard:   { id: 'haki',    name: 'Armament Haki',   short: 'Haki',    key: 'KeyH', cd: HAKI_CD },
    float:   { id: 'balloon', name: 'Gum-Gum Balloon', short: 'Balloon', key: 'KeyV', hold: true },
  },
  sword: {
    strike:  { id: 'onigiri',   name: 'Oni Giri',     short: 'Oni Giri',   key: 'KeyQ' },
    sustain: { id: 'tatsumaki', name: 'Tatsumaki',    short: 'Tatsumaki',  key: 'KeyF', hold: true },
    heavy:   { id: 'wavecast',  name: 'Yakkodori',    short: 'Yakkodori',  key: 'KeyR', cd: WAVE_CD },
    dash:    { id: 'flash',     name: 'Flash Step',   short: 'Flash Step', key: 'KeyE' },
    ult:     { id: 'sanzen',    name: 'Sanzen Sekai', short: 'Sanzen',     key: 'KeyT', cd: SANZEN_CD },
    guard:   { id: 'asura',     name: 'Asura',        short: 'Asura',      key: 'KeyH', cd: HAKI_CD },
  },
  staff: {
    strike:  { id: 'zap',    name: 'Thunder Ball',      short: 'Ball',    key: 'KeyQ' },
    sustain: { id: 'sizzle', name: 'Thunder Lance',     short: 'Lance',   key: 'KeyF', hold: true },
    heavy:   { id: 'tempo',  name: 'Thunderbolt Tempo', short: 'Bolt',    key: 'KeyR', cd: BAZOOKA_CD },
    dash:    { id: 'gust',   name: 'Cyclone Tempo',     short: 'Cyclone', key: 'KeyE' },
    ult:     { id: 'storm',  name: 'Thunder Tempo',     short: 'Storm',   key: 'KeyT', cd: GIGANT_CD },
    guard:   { id: 'mirage', name: 'Mirage Tempo',      short: 'Mirage',  key: 'KeyH', cd: HAKI_CD },
  },
};

/** Every slot the HUD and the key handler know about, in pad order. */
export const SLOTS = ['strike', 'sustain', 'heavy', 'dash', 'ult', 'gear', 'guard', 'float'];

/* ---- the impact-ring dictionary, Elbaf's colours and lives ---- */
const IMPACT_KINDS = {
  punch:   { color: 0xffe9c4, size: 1,   flat: false, life: .4 },
  bazooka: { color: 0xffd36b, size: 2,   flat: false, life: .5 },
  gigant:  { color: 0xcdd3f0, size: 3.2, flat: false, life: .6 },
  haki:    { color: 0xe0526e, size: 16,  flat: true,  life: .8 },
  land:    { color: 0xe8f0fa, size: 1.3, flat: true,  life: .45 },
  slash:   { color: 0xd8f2ff, size: 2.4, flat: false, life: .35 },
  zap:     { color: 0xcfe8ff, size: 1.1, flat: false, life: .38 },
  /* Flash Step's own cut. The generic `slash` ring is 2.4 m and lives for a
     third of a second, which at this power grows to about thirteen metres
     across — nearly five times Zoro's height — of pale, alpha-blended disc
     laid flat on the camera. On a step that ENDS with the camera right behind
     him it is a grey plate over the whole frame at the one moment the move is
     supposed to be legible. Half the size, two thirds the life and a third of
     the opacity: a cut, not a plate. */
  flash:   { color: 0xe4f6ff, size: 1.2, flat: false, life: .2, alpha: .55 },
};
const IMPACT_POOL = 16, DEBRIS_PER = 6, DEBRIS_LIFE = .7;
/* Flash Step — a jump with a cut in it, driven through the controller rather
   than teleported, so a wall stops it exactly as it stops a walk. Modest on
   purpose: it is a traversal beat you can spam, not a way across the junction. */
const FLASH_DUR   = .30;        // the drive window
const FLASH_SPEED = 17 * S;     // forward, m/s, AVERAGED over the window
const FLASH_RISE  = 7.6 * S;    // upward impulse, a shade over Zoro's 6.8 jump

/**
 * The step's speed across its own window.
 *
 * A flat 17 m/s for 0.30 s is a shove: it starts at full speed, ends at full
 * speed, and the only thing that changes in between is where the body is. A
 * step is the opposite shape — a beat of coil, a burst that is over almost
 * before it starts, and a plant to stand the cut on. This is that shape, and
 * because the reach of the move is a tuned number the curve is normalised to
 * mean 1 below, so the body still covers exactly 17 * 0.30 map units. Only the
 * distribution changes.
 */
function flashSpeedShape(k) {
  if (k < .10) return .34 + (k / .10) * 1.9;             // coil, then go
  if (k < .52) return 2.24 - ((k - .10) / .42) * .54;    // the burst, easing
  return 1.70 * Math.pow(1 - (k - .52) / .48, 1.4);      // plant for the cut
}
/* Numerically, once, rather than by hand: the shape can then be edited without
   the reach of the move silently moving with it. */
const FLASH_SHAPE_MEAN = (() => {
  let a = 0; const N = 512;
  for (let i = 0; i < N; i++) a += flashSpeedShape((i + .5) / N);
  return a / N;
})();
const flashEnvelope = (k) => flashSpeedShape(k) / FLASH_SHAPE_MEAN;

/* Afterimage spacing along the real path, in map units. The trail used to be
   laid down once, at the start, along a straight line predicted from the look
   vector — so it pointed at where the step was AIMED rather than at where the
   body went, and any wall, kerb or roof edge that turned the step left the
   ghosts hanging in the air off to one side. */
const GHOST_STEP  = 1.05 * S;
const GHOST_POOL  = 7;
const GHOST_LIFE  = .34;
const GATLING_ARMS = 7;
const SKIN = new THREE.Color('#f0c191');
const HAKI_BLACK = new THREE.Color('#23242e');

function addMat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0, depthWrite: false, fog: false,
    side: THREE.DoubleSide, ...opts,
  });
}

export class Combat {
  constructor(scene, tier = 'hi') {
    this.scene = scene;
    this.tier = tier;

    /* ---------------- state, Elbaf's exactly ---------------- */
    this.style = 'rubber';
    this.move = { kind: null, slot: null, t: 0, dur: 0, hit: false, hitCount: 0, target: new THREE.Vector3() };
    this.buffer = { slot: null, t: 0 };
    this.cd = { heavy: 0, ult: 0, guard: 0, gear: 0, };
    this.gear2 = false;
    this.gear2T = 0;
    this.balloon = 0;
    this.gatling = 0;
    this.gatT = 0;
    this.tatsu = 0;
    this.hakiT = 0;
    this.hakiFired = false;
    this.haki = 0;
    this.roll = null;                     // {t, dir}
    this.fly = null;                      // {to, t} — a dash in flight
    this.rollK = 0;
    this.shake = 0;
    this.hitStop = 0;
    this.fovPunch = 0;
    this.skyFlash = 0;
    this.banner = '';
    this.bannerT = 0;
    this.stretch = { active: false, kind: null, from: new THREE.Vector3(), to: new THREE.Vector3(), extend: 0 };
    this.gatlingAim = new THREE.Vector3(0, 0, 1);
    this.aim = { valid: false, point: new THREE.Vector3(), distance: 0 };
    this.waves = Array.from({ length: 4 }, () => ({ active: false, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), k: 0 }));
    this.drive = {};                      // handed to the controller each frame
    this.holdSlow = 1;

    // scratch
    this._v = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._look = new THREE.Vector3(0, 0, 1);
    this._center = new THREE.Vector3();

    /* ---------------- pooled visuals ---------------- */
    const g = new THREE.Group();
    g.name = 'combat-fx';
    g.frustumCulled = false;
    scene.add(g);
    this.group = g;

    // impact rings + their flying rocks
    this.impacts = [];
    const ringGeo = new THREE.RingGeometry(.62, 1, 22);
    for (let i = 0; i < IMPACT_POOL; i++) {
      const mesh = new THREE.Mesh(ringGeo, addMat(0xffffff));
      mesh.visible = false; mesh.renderOrder = 998; mesh.frustumCulled = false;
      g.add(mesh);
      this.impacts.push({
        mesh, age: Infinity, kind: 'punch', power: 1, pos: new THREE.Vector3(),
        seeds: Array.from({ length: DEBRIS_PER }, (_, j) => {
          const a = (i * 2.39 + j * 1.7) % (Math.PI * 2);
          return { dx: Math.cos(a), dz: Math.sin(a), up: 2.5 + (i * 7 + j * 13) % 10 * .35, spd: 2.2 + (i + j * 3) % 7 * .5 };
        }),
      });
    }
    this._impactCursor = 0;
    /* Lambert on the low tier, the same rule the map and the vehicles follow.
       Nothing here has a roughness map, a normal map or any metalness, so the
       PBR BRDF is being paid for a flat-shaded pebble. */
    const Lit = (opts) => (tier === 'hi'
      ? new THREE.MeshStandardMaterial(opts)
      : new THREE.MeshLambertMaterial({
          color: opts.color, flatShading: opts.flatShading, side: opts.side,
        }));
    this.debris = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      Lit({ color: 0xdfe9f5, roughness: .9, flatShading: true }),
      IMPACT_POOL * DEBRIS_PER);
    this.debris.frustumCulled = false;
    g.add(this.debris);
    this._m4 = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s3 = new THREE.Vector3();

    // the rubber arm: cylinder + fist, twice over for Bazooka's both-hands
    const mkArm = () => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(.1, .1, 1, 8, 1, true),
        Lit({ color: SKIN, roughness: .7, flatShading: true, side: THREE.DoubleSide }));
      const fist = new THREE.Mesh(
        new THREE.SphereGeometry(.26, 10, 8),
        Lit({ color: SKIN, roughness: .7, flatShading: true }));
      arm.visible = fist.visible = false;
      arm.frustumCulled = fist.frustumCulled = false;
      g.add(arm, fist);
      return { arm, fist };
    };
    this.armA = mkArm();
    this.armB = mkArm();
    this.gatArms = Array.from({ length: GATLING_ARMS }, mkArm);

    // aim reticle: the gold diamond and its dot, drawn over everything
    this.reticle = new THREE.Group();
    this.reticle.visible = false;
    this.reticle.renderOrder = 999;
    this.retRing = new THREE.Mesh(new THREE.RingGeometry(.7, .92, 4),
      addMat(0xffd36b, { depthTest: false }));
    this.retRing.material.opacity = .85;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.16, 8),
      addMat(0xfff3d0, { depthTest: false }));
    dot.material.opacity = .9;
    this.retRing.renderOrder = dot.renderOrder = 999;
    this.reticle.add(this.retRing, dot);
    g.add(this.reticle);

    // sword dressing: speed lines, the two spin planes, the flying crescents
    const addPlane = (color, order) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        addMat(color, { blending: THREE.AdditiveBlending }));
      m.visible = false; m.renderOrder = order; m.frustumCulled = false;
      g.add(m);
      return m;
    };
    this.speedLines = [0, 1, 2].map(() => addPlane(0xdff4ff, 996));
    this.tatsuPlanes = [0, 1].map(() => addPlane(0xc8f0e8, 996));
    this.crescents = this.waves.map(() => {
      const m = new THREE.Mesh(new THREE.RingGeometry(.72, 1, 20, 1, 0, Math.PI * 1.25),
        addMat(0xbfeaff, { blending: THREE.AdditiveBlending }));
      m.visible = false; m.renderOrder = 997; m.frustumCulled = false;
      g.add(m);
      return m;
    });

    // Gear Second: steam and a red glow that lights the street around him
    this.steam = Array.from({ length: 12 }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 6),
        addMat(0xffd9cc, { blending: THREE.AdditiveBlending }));
      m.visible = false; m.renderOrder = 997; m.frustumCulled = false;
      g.add(m);
      return m;
    });
    this.gearLight = tier === 'hi' ? new THREE.PointLight(0xff5a3d, 0, 7 * S, 2) : null;
    if (this.gearLight) { this.gearLight.visible = false; g.add(this.gearLight); }
    this._gearK = 0;

    // Nami's lightning: flickering columns, one big and three outriders
    this.bolts = Array.from({ length: 4 }, () => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(.10 * S, .34 * S, 1, 5, 1, true),
        addMat(0xcfe8ff, { blending: THREE.AdditiveBlending }));
      m.visible = false; m.frustumCulled = false;
      g.add(m);
      return m;
    });
    this._boltJobs = [];

    /* Flash Step's afterimages. One body-sized slab per station along the
       blink, laid flat-on to the camera and faded out back-to-front, so what
       is left behind reads as the places Zoro just WAS rather than as a
       vapour trail. Pooled at construction like everything else here. */
    this.ghosts = Array.from({ length: GHOST_POOL }, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        addMat(0xbfe6ff, { blending: THREE.AdditiveBlending }));
      m.visible = false; m.renderOrder = 996; m.frustumCulled = false;
      g.add(m);
      return { mesh: m, t: 0, life: 0, seq: 0 };
    });
    this._ghostSeq = 0;
    this._ghostNext = 0;
    this._ghostLast = new THREE.Vector3();
    this.blink = null;                    // {t, dur} — the arrival flourish
  }

  /* ------------------------------------------------------------- helpers */

  setStyle(style) {
    if (style === this.style) return;
    this.style = style;
    this.move.kind = null; this.move.slot = null; this.move.t = 0;
    this.buffer.slot = null;
    this.gatling = 0; this.gatT = 0; this.balloon = 0;
    this.fly = null;
    this.blink = null;
    for (const g of this.ghosts) { g.life = 0; g.mesh.visible = false; }
    this.gear2 = false; this.gear2T = 0;
    this.haki = 0; this.hakiT = 0;
    this.stretch.active = false;
    for (const w of this.waves) w.active = false;
    for (const k of Object.keys(this.cd)) this.cd[k] = 0;
  }

  /** Impact ring + rocks at a point. size in metres; kind from IMPACT_KINDS. */
  impact(pos, power = 1, kind = 'punch') {
    const slot = this.impacts[this._impactCursor % IMPACT_POOL];
    this._impactCursor++;
    slot.age = 0; slot.kind = kind; slot.power = power;
    slot.pos.copy(pos);
    /* One hook, set by app.js, so the sound arrives with the ring rather than
       being discovered a frame later by something polling the pool. Elbaf
       polls a sequence counter for this; a callback is the same thing without
       the counter, and a move that lands three hits gets three sounds spaced
       exactly as the hits are. */
    if (this.onImpact) this.onImpact(pos, power, kind);
  }

  addShake(x) { this.shake = Math.min(1.3, this.shake + x); }

  _banner(name) { this.banner = name; this.bannerT = 1.15; }

  _bolt(x, y, z, big) {
    this._boltJobs.push({ x, y, z, t: 0, dur: big ? .55 : .3, w: big ? .8 : .45, delay: 0 });
  }

  /** Speed and jump scalars the controller applies this frame. */
  speedMul() {
    return (this.gear2 ? GEAR2_SPEED : 1)
      * (1 - this.gatling * (1 - GATLING_SLOW))
      * (1 - this.balloon * (1 - BALLOON_SLOW));
  }
  jumpMul() { return this.gear2 ? GEAR2_JUMP : 1; }

  ready(def, slot) {
    const mv = MOVES[def.style]?.[slot];
    if (!mv) return false;
    if (mv.cd && (this.cd[slot] || 0) > 0) return false;
    return true;
  }
  cooldown(def, slot) {
    const mv = MOVES[def.style]?.[slot];
    if (!mv || !mv.cd) return 0;
    return Math.max(0, (this.cd[slot] || 0) / mv.cd);
  }

  /**
   * Aim, Elbaf's way: one ray straight down the camera's look from the
   * character's head line — walls from the mesh colliders, ground from the baked
   * height field, whichever is nearer. Runs every frame; both queries are a
   * few microseconds.
   */
  updateAim(ctrl, lookDir, grid, nav) {
    const ox = ctrl.pos.x, oy = ctrl.pos.y + CENTER_Y + 1.5 * S, oz = ctrl.pos.z;
    this._center.set(ox, oy, oz);
    this._look.copy(lookDir);
    let d = -1;
    if (grid) d = grid.raycast(this._center, lookDir, AIM_RANGE);
    /* The navmap is one layer of heights, so under the flyover it reports the
       DECK as the ground — eighteen units above the eye that is looking along
       the lower carriageway. Marched from there the ray starts below its own
       terrain and reports a hit at once: measured under the deck, 0.1 units in
       every direction, which pinned the reticle to the character's face and
       made Rocket and Cyclone Tempo fly nowhere, because the point they aim at
       was already reached. Where the eye is below the surface the navmap
       claims, the navmap has nothing true to say — the mesh colliders know
       about both levels, so let them answer alone. */
    const navTop = nav ? nav.heightAt(ox, oz) : null;
    const underAnUpperLevel = navTop !== null && oy < navTop;
    const dg = (nav && !underAnUpperLevel)
      ? nav.raymarch(ox, oy, oz, lookDir.x, lookDir.y, lookDir.z, AIM_RANGE) : null;
    if (dg !== null && (d < 0 || dg < d)) d = dg;
    this.aim.valid = d >= 0;
    if (this.aim.valid) {
      this.aim.distance = d;
      this.aim.point.copy(this._center).addScaledVector(lookDir, d);
    }
    return this.aim;
  }

  /* -------------------------------------------------------------- the tick */

  /**
   * The whole move machine, in the Elbaf frame order. Call BEFORE
   * ctrl.update, with the hit-stop-scaled dt; then hand `this.drive` to the
   * controller.
   *
   * @param input {queued:Set<slot>, held:Set<slot>, rollQueued}
   */
  step(dt, ctrl, def, input) {
    if (this.style !== def.style) this.setStyle(def.style);
    const mv = this.move;
    const kit = MOVES[def.style] || {};
    const sword = def.style === 'sword';
    const staff = def.style === 'staff';
    const look = this._look;
    const C = this._v2.set(ctrl.pos.x, ctrl.pos.y + CENTER_Y, ctrl.pos.z);
    this.drive = {};

    // cooldowns
    for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);

    // the arrival flourish, which outlives the move's own pose window
    if (this.blink) {
      this.blink.t += dt;
      if (this.blink.t >= this.blink.dur) this.blink = null;
    }

    // the 0.2 s input buffer: one slot deep, latest press wins
    if (this.buffer.slot) {
      this.buffer.t -= dt;
      if (this.buffer.t <= 0) this.buffer.slot = null;
    }
    const take = (slot) => {
      if (input.queued.has(slot)) { this.buffer.slot = slot; this.buffer.t = BUFFER_T; }
      if (this.buffer.slot !== slot) return false;
      this.buffer.slot = null;
      return true;
    };

    // Gear Second: a toggle — press again to shut the steam off early
    if (input.queued.has('gear') && kit.gear) {
      if (this.gear2) { this.gear2 = false; this.cd.gear = GEAR2_CD; }
      else if (this.cd.gear <= 0) { this.gear2 = true; this.gear2T = GEAR2_DUR; this._banner(kit.gear.name); }
    }
    if (this.gear2) {
      this.gear2T -= dt;
      if (this.gear2T <= 0) { this.gear2 = false; this.cd.gear = GEAR2_CD; }
    }

    // balloon is a damped state, not a switch
    this.balloon = damp(this.balloon, input.held.has('float') && kit.float ? 1 : 0, 10, dt);

    // roll: grounded, one at a time, a decelerating 13 m/s burst
    if (input.rollQueued && ctrl.grounded && !this.roll) {
      const d = this._v.set(ctrl.vel.x, 0, ctrl.vel.z);
      if (d.lengthSq() < 1e-4) d.set(Math.sin(ctrl.facing), 0, Math.cos(ctrl.facing));
      this.roll = { t: ROLL_DUR, dir: d.clone().normalize() };
    }
    if (this.roll) {
      this.roll.t = Math.max(0, this.roll.t - dt);
      const k = 1 - this.roll.t / ROLL_DUR;
      this.rollK = k;
      const v = ROLL_SPEED * S * (1 - k * k);
      this.drive.vx = this.roll.dir.x * v;
      this.drive.vz = this.roll.dir.z * v;
      this.drive.faceSet = Math.atan2(this.roll.dir.x, this.roll.dir.z);
      if (this.roll.t <= 0) this.roll = null;
    } else this.rollK = 0;

    /* ---- move starts. Dash first (it can interrupt nothing but itself),
       then the buffered strikes, exactly Elbaf's order. ---- */
    const free = !mv.kind;
    /* ---- Flash Step: a jump with a cut in it ----
       This was a teleport, and a teleport is how Zoro kept ending up sealed
       inside the buildings: it placed the body at the far end of a march that
       was allowed to climb OVER a shopfront wall, and the shells on this map
       have nothing inside them but the mirrored backs of their own facades.
       Measured before this change, 13.1% of steps fired from street level
       finished inside an enclosure.

       So the body is not placed any more, it is THROWN. The move sets an
       upward impulse and drives horizontal velocity for its own window, and
       the controller integrates that the way it integrates walking — through
       `_canStand`, one axis at a time, with the wall band taken from the body.
       Nothing can enter a building that a walk could not enter, because it is
       the same movement code. It also re-fires in mid-air, which is what makes
       it spammable: each press is another beat of height and another cut. */
    const dashFree = !mv.kind || mv.slot === 'dash';
    if (input.queued.has('dash') && kit.dash && sword && dashFree) {
      this._start('dash', kit.dash, FLASH_DUR);
      mv.hit = false;
      /* Never SUBTRACT from a rise that is already going: spamming the button
         on the way up should stack into a climb, not reset you to one impulse. */
      ctrl.vel.y = Math.max(ctrl.vel.y, FLASH_RISE);
      ctrl.grounded = false;
      ctrl.coyote = 0;
      ctrl.airTime = 0;
      ctrl.facing = Math.atan2(look.x, look.z);
      mv.target.copy(C).addScaledVector(look, 5 * S);
      this.blink = { t: 0, dur: .2 };
      this._trailReset(ctrl);
      this.addShake(.05);
    } else if (input.queued.has('dash') && kit.dash && !this.fly) {
      this._start('dash', kit.dash, ROCKET_DUR);
      /* Aim at whatever the ray found, or — when it found nothing, which is
         what happens every time you point at open sky over the junction —
         at a point out along the look. Elbaf simply refuses the move on a
         miss; here that read as a dead key, because this map has far more
         sky in frame than a valley floor does. */
      if (this.aim.valid) mv.target.copy(this.aim.point);
      else mv.target.copy(C).addScaledVector(look, AIM_RANGE * 0.5);
      /* The flight is its own state, not part of the move.
         Elbaf steers for the move's 0.55 s and then lets the Rapier body
         COAST the rest of the way on its own momentum, so you arrive. This
         controller has no rigid body to coast — it eases velocity back to
         whatever the stick is asking for the moment the move ends, which
         stopped you dead a third of the way there. Flying as a separate
         state that runs until it arrives reproduces the arrival without
         pretending to simulate momentum. */
      this.fly = { to: mv.target.clone(), t: 0 };
      ctrl.airJumps = Math.max(ctrl.airJumps, 1);      // the grapple refills the air jump
    }
    if (take('strike') && !mv.kind && kit.strike) {
      this._start('strike', kit.strike, sword ? ONIGIRI_DUR : PISTOL_DUR);
      if (staff && this.aim.valid) mv.target.copy(this.aim.point);
      else mv.target.copy(C).addScaledVector(look, (sword ? 8 : 16) * S);
    }
    if (take('heavy') && !mv.kind && kit.heavy && this.cd.heavy <= 0) {
      if (sword) {
        const w = this.waves.find((x) => !x.active);
        if (w) {
          w.active = true; w.k = 0;
          // Elbaf launches the crescent from C.y + 1.05 m — mid-chest
          w.pos.set(ctrl.pos.x, ctrl.pos.y + CENTER_Y + 1.05 * S, ctrl.pos.z);
          w.dir.set(look.x, look.y * .35, look.z).normalize();
          this.cd.heavy = WAVE_CD;
          this._start('heavy', kit.heavy, .22);
          mv.hit = true;
          mv.target.copy(w.pos).addScaledVector(w.dir, 8 * S);
          this.addShake(.1);
        }
      } else {
        this._start('heavy', kit.heavy, BAZOOKA_DUR);
        const r = staff ? 18 * S : BAZOOKA_RANGE;
        mv.target.copy(C).addScaledVector(look, this.aim.valid ? Math.min(this.aim.distance, r) : r);
        this.cd.heavy = BAZOOKA_CD;
      }
    }
    if (take('ult') && !mv.kind && kit.ult && this.cd.ult <= 0) {
      this._start('ult', kit.ult, sword ? SANZEN_DUR : GIGANT_DUR);
      const r = staff ? 14 * S : GIGANT_RANGE;
      mv.target.copy(C).addScaledVector(look, this.aim.valid ? Math.min(this.aim.distance + 1.5 * S, r) : r);
      this.cd.ult = sword ? SANZEN_CD : GIGANT_CD;
    }

    /* ---- the flight. Rocket / Flash Step / Cyclone carry you to the point
       you aimed at, and keep carrying until you get there. Speed eases off
       over the move's own window so the arrival is a settle rather than a
       stop, and the whole thing is capped so a flight into a wall cannot
       leave you hovering. ---- */
    if (this.fly) {
      this.fly.t += dt;
      this._v.copy(this.fly.to).sub(C);
      const gap = this._v.length();
      const spent = this.fly.t > FLY_MAX;
      if (gap > 2.5 * S && !spent) {
        const ease = 1 - Math.min(1, this.fly.t / ROCKET_DUR) * 0.35;
        this._v.multiplyScalar((sword ? ROCKET_SPEED * 1.3 : ROCKET_SPEED) * ease / gap);
        this.drive.vx = this._v.x;
        this.drive.vz = this._v.z;
        this.drive.vy = this._v.y + 3 * S;   // Elbaf's lift, so you arc rather than skim
        this.drive.face = 'look';
        this.drive.lookYaw = Math.atan2(this._v.x, this._v.z);
      } else {
        if (!spent) {
          this.impact(this.fly.to, sword ? 1.4 : 1.1, sword ? 'slash' : (staff ? 'zap' : 'punch'));
          this.addShake(.15);
          this.fovPunch = Math.max(this.fovPunch, .3);
        }
        this.fly = null;
      }
    }

    // the flying crescents
    for (const w of this.waves) {
      if (!w.active) continue;
      const prev = w.k;
      w.k = Math.min(1, w.k + dt / WAVE_DUR);
      w.pos.addScaledVector(w.dir, (WAVE_TRAVEL / WAVE_DUR) * dt);
      for (const stop of [.35, .68, 1]) {
        if (prev < stop && w.k >= stop) this.impact(w.pos, 1.6, 'slash');
      }
      const gy = this._groundAt ? this._groundAt(w.pos.x, w.pos.z) : null;
      if (w.k >= 1 || (gy !== null && w.pos.y < gy + .4 * S)) {
        if (w.k < 1) this.impact(w.pos, 1.6, 'slash');
        w.active = false;
      }
    }

    // haki / asura / mirage: a windup that fires at 35%
    if (input.queued.has('guard') && kit.guard && this.cd.guard <= 0 && this.hakiT <= 0) {
      this.hakiT = HAKI_WINDUP;
      this.hakiFired = false;
      this.cd.guard = HAKI_CD;
      this._banner(kit.guard.name);
    }
    if (this.hakiT > 0) {
      this.hakiT = Math.max(0, this.hakiT - dt);
      const f = 1 - this.hakiT / HAKI_WINDUP;
      this.haki = f;
      if (!this.hakiFired && f > .35) {
        this.hakiFired = true;
        this._v.set(ctrl.pos.x, ctrl.pos.y, ctrl.pos.z);
        this.impact(this._v, 3, 'haki');
        this.addShake(.9);
        if (sword) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            this._v.set(ctrl.pos.x + Math.cos(a) * ASURA_RADIUS, ctrl.pos.y + CENTER_Y + .6 * S, ctrl.pos.z + Math.sin(a) * ASURA_RADIUS);
            this.impact(this._v, 1.4, 'slash');
          }
        }
        if (staff) this.skyFlash = Math.max(this.skyFlash, .6);
      }
    } else this.haki = 0;

    // gatling / tatsumaki / thunder lance: held, damped, firing on a clock
    const gatOn = input.held.has('sustain') && !!kit.sustain && !mv.kind;
    this.gatling = damp(this.gatling, gatOn ? 1 : 0, 14, dt);
    if (this.gatling > .2) this.gatlingAim.copy(look);
    if (gatOn) {
      this.gatT -= dt;
      if (this.gatT <= 0) {
        if (sword) {
          this.gatT = TATSU_INT;
          this.tatsu += 1.9;
          this._v.set(ctrl.pos.x + Math.cos(this.tatsu) * TATSU_RADIUS, ctrl.pos.y + CENTER_Y + .6 * S, ctrl.pos.z + Math.sin(this.tatsu) * TATSU_RADIUS);
          this.impact(this._v, .7, 'slash');
          this.addShake(.04);
        } else {
          this.gatT = (staff ? .12 : GATLING_INT) * (this.gear2 ? .6 : 1);
          const reach = this.aim.valid ? Math.min(this.aim.distance, GATLING_RANGE) : GATLING_RANGE * .85;
          this._v.copy(C).addScaledVector(look, reach);
          this.impact(this._v, .55, staff ? 'zap' : 'punch');
          this.addShake(.05);
        }
        if (!this._gatNamed) { this._banner(kit.sustain.name); this._gatNamed = true; }
      }
    } else { if (!input.held.has('sustain')) this.gatT = 0; this._gatNamed = false; }

    /* ---- the live move: velocity, the hit at 55%, the multi-hit strikes ---- */
    if (mv.kind) {
      mv.t += dt;
      const k = Math.min(1, mv.t / mv.dur);

      if (mv.slot === 'dash' && sword) {
        /* Flash Step drives itself. Horizontal only — the rise was an impulse
           at the start and gravity owns it from there, which is what makes the
           arc read as a jump rather than a hover — and shaped across the
           window rather than held flat, so the burst is a burst. */
        const e = FLASH_SPEED * flashEnvelope(k);
        this.drive.vx = look.x * e;
        this.drive.vz = look.z * e;
        this.drive.face = 'look';
        this.drive.lookYaw = Math.atan2(look.x, look.z);
        this._trail(ctrl);
        if (!mv.hit && k >= .45) {
          mv.hit = true;
          this._v.copy(C).addScaledVector(look, 3.2 * S);
          this.impact(this._v, 1.15, 'flash');
          this.addShake(.09);
        }
      } else if (mv.slot === 'dash') {
        /* the flight below owns the body; the move here is only the pose,
           the banner and the cooldown */
      } else if (mv.slot === 'strike') {
        if (sword) {
          // Oni Giri: a 22 m/s cut with three slashes along it
          this._v.set(look.x, 0, look.z).normalize().multiplyScalar(ONIGIRI_DASH);
          this.drive.vx = this._v.x; this.drive.vz = this._v.z;
          const stops = [.25, .55, .85];
          while (mv.hitCount < stops.length && k >= stops[mv.hitCount]) {
            this._v.copy(C).addScaledVector(look, 2.2 * S);
            this._v.y = ctrl.pos.y + CENTER_Y + .6 * S;    // Elbaf: C.y + 0.6
            this.impact(this._v, 1, 'slash');
            this.addShake(.08);
            mv.hitCount++;
          }
        } else if (!staff) {
          // Pistol: the punch carries you 19 m/s down the aim
          const spd = PISTOL_LUNGE * (this.gear2 ? 1.25 : 1);
          this.drive.vx = look.x * spd;
          this.drive.vz = look.z * spd;
        } else {
          this.drive.vx = 0; this.drive.vz = 0;      // Nami plants and casts
        }
      } else if (mv.slot === 'ult' && sword) {
        this._v.set(look.x, 0, look.z).normalize().multiplyScalar(SANZEN_DASH);
        this.drive.vx = this._v.x; this.drive.vz = this._v.z;
      } else if (mv.slot === 'heavy' && !sword && !staff) {
        this.drive.vx = -look.x * 2.5 * S;           // Bazooka recoil
        this.drive.vz = -look.z * 2.5 * S;
      } else if (mv.slot === 'ult' && !sword && !staff) {
        this.drive.vx = look.x * 3 * S;              // Gigant drifts in
        this.drive.vz = look.z * 3 * S;
      } else if (staff && (mv.slot === 'heavy' || mv.slot === 'ult' || mv.slot === 'strike')) {
        this.drive.vx = 0; this.drive.vz = 0;
      }

      // the hit itself, at 55% through — rings, shake, slow-mo, lens punch
      if (!mv.hit && mv.kind && mv.slot !== 'strike' && k > .5) {
        mv.hit = true;
        if (mv.slot === 'heavy') {
          if (staff) {
            this._bolt(mv.target.x, mv.target.y, mv.target.z, true);
            this.impact(mv.target, 2.4, 'bazooka');
            this.addShake(.35); this.fovPunch = Math.max(this.fovPunch, .45);
            this.skyFlash = Math.max(this.skyFlash, .8);
          } else {
            this.impact(mv.target, 2.4, 'bazooka');
            this.addShake(.35); this.fovPunch = Math.max(this.fovPunch, .45);
          }
        } else if (mv.slot === 'ult') {
          if (staff) {
            for (let i = 0; i < 4; i++) {
              const a = (i / 4) * Math.PI * 2 + .4;
              const r = i === 0 ? 0 : (3 + i * 1.8) * S;
              this._bolt(mv.target.x + Math.cos(a) * r, mv.target.y, mv.target.z + Math.sin(a) * r, i === 0);
            }
            this.impact(mv.target, 4, 'gigant');
            this.skyFlash = 1;
          } else {
            this.impact(mv.target, 4, 'gigant');
          }
          this.addShake(sword ? .6 : .7);
          this.hitStop = Math.max(this.hitStop, sword ? .09 : .1);
          this.fovPunch = Math.max(this.fovPunch, sword ? .9 : 1);
          if (sword) {
            this._v.copy(C).addScaledVector(look, 4.5 * S);
            this.impact(this._v, 3.5, 'gigant');
          }
        }
      }
      // the strike's own landing tap
      if (!mv.hit && mv.slot === 'strike' && !sword && k > .5) {
        mv.hit = true;
        if (staff) {
          this._bolt(mv.target.x, mv.target.y, mv.target.z, false);
          this.impact(mv.target, 1, 'zap');
          this.addShake(.12);
        } else {
          this.impact(mv.target, this.gear2 ? 1.5 : 1, 'punch');
          this.addShake(.12);
        }
      }

      if (mv.kind && mv.t >= mv.dur) { mv.kind = null; mv.slot = null; }

      // the rubber term: Elbaf stretches exactly rocket, pistol, bazooka, gigant
      const st = this.stretch;
      const stretches = !sword && !staff && mv.kind &&
        (mv.slot === 'strike' || mv.slot === 'heavy' || mv.slot === 'ult' || mv.slot === 'dash');
      if (stretches) {
        st.active = true;
        st.kind = mv.slot;
        st.from.set(ctrl.pos.x, ctrl.pos.y + 1.4 * S, ctrl.pos.z);
        st.to.copy(mv.target);
        st.extend = Math.sin(Math.min(1, mv.t / mv.dur) * Math.PI);
      } else st.active = false;
    } else {
      this.stretch.active = false;
      this.move.slot = null;
    }
    this.moveK = mv.kind ? Math.min(1, mv.t / mv.dur) : 0;

    // combat facing: spin for tatsumaki, camera for everything else live
    if (this.drive.faceSet === undefined) {
      if (sword && this.gatling > .05) {
        this.drive.face = 'spin';
        this.drive.spin = TATSU_SPIN * this.gatling;
      } else if (mv.kind || this.gatling > .2 || this.hakiT > 0) {
        this.drive.face = 'look';
        this.drive.lookYaw = Math.atan2(look.x, look.z);
      }
    }
    this.drive.balloon = this.balloon;

    // decays
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.skyFlash > 0) this.skyFlash = Math.max(0, this.skyFlash - dt * 2);
    if (this.bannerT > 0) this.bannerT = Math.max(0, this.bannerT - dt);
    this.holdSlow = this.speedMul() / (this.gear2 ? GEAR2_SPEED : 1);
  }

  /**
   * Open a trail at the body, and drop an afterimage every GHOST_STEP of ground
   * actually covered from then on.
   *
   * The pool is a ring, and the ring is never cleared — the oldest slab is the
   * one recycled, and it is the one already fading out. That matters because
   * the step is meant to be spammed: wiping the pool on every press left a
   * climb of five steps showing one or two slabs at a time, where letting the
   * ring run keeps the whole climb behind you. Age comes from the drop counter,
   * so the fade runs away from the body however many have been laid.
   */
  _trailReset(ctrl) {
    this._ghostLast.set(ctrl.pos.x, ctrl.pos.y, ctrl.pos.z);
    this._trailDrop(ctrl);
  }

  _trail(ctrl) {
    const p = ctrl.pos, L = this._ghostLast;
    const dx = p.x - L.x, dy = p.y - L.y, dz = p.z - L.z;
    if (dx * dx + dy * dy + dz * dz < GHOST_STEP * GHOST_STEP) return;
    L.set(p.x, p.y, p.z);
    this._trailDrop(ctrl);
  }

  _trailDrop(ctrl) {
    const n = this.ghosts.length;
    const g = this.ghosts[this._ghostNext % n];
    this._ghostNext++;
    g.t = 0;
    g.life = GHOST_LIFE;
    g.mesh.position.set(ctrl.pos.x, ctrl.pos.y + CENTER_Y, ctrl.pos.z);
    g.mesh.rotation.set(0, ctrl.facing, 0);
    g.seq = this._ghostNext;
    this._ghostSeq = this._ghostNext;
  }

  _start(slot, def, dur) {
    const mv = this.move;
    mv.kind = def.id;
    mv.slot = slot;
    mv.t = 0;
    mv.dur = dur;
    mv.hit = false;
    mv.hitCount = 0;
    this._banner(def.name);
  }

  /** Landing effects — call right after ctrl.update. */
  landed(ctrl) {
    const fall = ctrl.landing / S;      // m/s
    if (fall <= 0) return;
    if (this.balloon > .5 && fall > 6) {
      this._v.set(ctrl.pos.x, ctrl.pos.y + .05 * S, ctrl.pos.z);
      this.impact(this._v, .8, 'land');
      this.addShake(.15);
    } else if (fall > 13) {
      this._v.set(ctrl.pos.x, ctrl.pos.y + .05 * S, ctrl.pos.z);
      this.impact(this._v, Math.min(1.6, fall / 14), 'land');
      this.addShake(.2);
    }
  }

  /** The character-swap flourish, Elbaf's. */
  swapFlourish(ctrl) {
    this._v.set(ctrl.pos.x, ctrl.pos.y + .25 * S, ctrl.pos.z);
    this.impact(this._v, 1.5, 'haki');
    this.addShake(.3);
    this.hitStop = Math.max(this.hitStop, .08);
    this.fovPunch = Math.max(this.fovPunch, .6);
  }

  /** Give the wave ground test access to the navmap. */
  bindGround(fn) { this._groundAt = fn; }


  /* --------------------------------------------------------------- render */

  /**
   * Drive every pooled visual. Real dt (hit stop must not freeze the rings —
   * Elbaf's renderers run on the raw frame clock).
   */
  render(dt, camera, ctrl, elapsed) {
    dt = Math.min(dt, .05);
    const px = ctrl.pos.x, py = ctrl.pos.y, pz = ctrl.pos.z;
    const cy = py + CENTER_Y;
    const sword = this.style === 'sword';

    // impact rings + debris
    let di = 0;
    for (const im of this.impacts) {
      const spec = IMPACT_KINDS[im.kind] ?? IMPACT_KINDS.punch;
      im.age += dt;
      const x = im.age / spec.life;
      if (x >= 1) im.mesh.visible = false;
      else {
        im.mesh.visible = true;
        const g = 1 - (1 - x) * (1 - x);
        const s = spec.size * Math.sqrt(im.power) * (.3 + g * 1.4) * S;
        im.mesh.position.copy(im.pos);
        im.mesh.scale.setScalar(s);
        if (spec.flat) im.mesh.rotation.set(-Math.PI / 2, 0, 0);
        else im.mesh.quaternion.copy(camera.quaternion);
        im.mesh.material.color.setHex(spec.color);
        im.mesh.material.opacity = (spec.alpha ?? .85) * (1 - x);
      }
      // rocks
      const throwing = im.age < DEBRIS_LIFE && im.kind !== 'haki' && im.kind !== 'land';
      for (let j = 0; j < DEBRIS_PER; j++) {
        if (!throwing) {
          this._s3.setScalar(0);
          this._m4.compose(this._v.set(0, -999, 0), this._q.identity(), this._s3);
        } else {
          const sd = im.seeds[j];
          const t = im.age;
          const spd = sd.spd * (.6 + im.power * .5) * S;
          this._v.set(im.pos.x + sd.dx * spd * t,
                      im.pos.y + sd.up * im.power * .6 * S * t - 9 * S * t * t,
                      im.pos.z + sd.dz * spd * t);
          const sc = .09 * Math.sqrt(im.power) * (1 - t / DEBRIS_LIFE) * S;
          this._s3.setScalar(Math.max(.001, sc));
          this._m4.compose(this._v, this._q.identity(), this._s3);
        }
        this.debris.setMatrixAt(di++, this._m4);
      }
    }
    this.debris.instanceMatrix.needsUpdate = true;

    // reticle
    if (this.aim.valid) {
      this.reticle.visible = true;
      this.reticle.position.copy(this.aim.point);
      this.reticle.quaternion.copy(camera.quaternion);
      this.reticle.scale.setScalar(.02 * S + this.aim.distance * .022);
      this.retRing.rotation.z = elapsed * 1.6;
    } else this.reticle.visible = false;

    // the stretch arm(s)
    const st = this.stretch;
    const stretching = !sword && this.style !== 'staff' && st.active && st.extend > .001;
    const gat = this.style === 'rubber' || this.style === 'staff' ? this.gatling : 0;
    const showGat = this.style === 'rubber' && gat > .02;
    if (stretching) {
      this._v.lerpVectors(st.from, st.to, st.extend);
      if (st.kind === 'heavy') {
        // Bazooka: both arms, offset a palm apart
        this._s3.subVectors(this._v, st.from).normalize();
        const side = this._q; // reuse: build a perpendicular by hand
        const sx = this._s3.z, sz = -this._s3.x;
        const n = Math.hypot(sx, sz) || 1;
        const offx = sx / n * .2 * S, offz = sz / n * .2 * S;
        this._armTo(this.armA, st.from.x + offx, st.from.y, st.from.z + offz, this._v.x + offx, this._v.y, this._v.z + offz, st.extend, 1, 1.1, SKIN);
        this._armTo(this.armB, st.from.x - offx, st.from.y, st.from.z - offz, this._v.x - offx, this._v.y, this._v.z - offz, st.extend, 1, 1.1, SKIN);
      } else if (st.kind === 'ult') {
        this._armTo(this.armA, st.from.x, st.from.y, st.from.z, this._v.x, this._v.y, this._v.z, st.extend, 2.6, 3.4, HAKI_BLACK);
        this._hideArm(this.armB);
      } else {
        this._armTo(this.armA, st.from.x, st.from.y, st.from.z, this._v.x, this._v.y, this._v.z, st.extend, 1, 1, SKIN);
        this._hideArm(this.armB);
      }
    } else { this._hideArm(this.armA); this._hideArm(this.armB); }

    // the seven gatling ghost-arms
    for (let i = 0; i < GATLING_ARMS; i++) {
      const pair = this.gatArms[i];
      if (!showGat) { this._hideArm(pair); continue; }
      const w = Math.abs(Math.sin(elapsed * 11 + i * 2.39));
      const reach = (2.5 + w * 8.5) * gat * S;
      const A = this.gatlingAim;
      let sx = A.z, sz = -A.x;
      const n = Math.hypot(sx, sz) || 1;
      sx /= n; sz /= n;
      const lat = Math.sin(i * 1.7 + elapsed * 7.3) * .55;
      const vert = Math.cos(i * 2.3 + elapsed * 6.1) * .4;
      const fx = px + sx * lat * .4 * S;
      const fy = py + (CENTER_Y / S + .55) * S + vert * .3 * S;
      const fz = pz + sz * lat * .4 * S;
      const tx = fx + A.x * reach + sx * lat * S;
      const ty = fy + A.y * reach + vert * S;
      const tz = fz + A.z * reach + sz * lat * S;
      this._armTo(pair, fx, fy, fz, tx, ty, tz, w, .8, .85, SKIN);
    }

    /* Flash Step's trail: one thin vertical streak at each place Zoro was.
       These were body-WIDE slabs first, and the reason they are not is worth
       keeping. The trail is laid down behind the character, which is exactly
       where the chase camera is, so the camera flies through the whole row of
       them as it catches up — at body width that is four grey panes filling
       the screen at the one moment the move is meant to be legible. A streak
       a fifth of that width occludes almost nothing, and reads as speed
       rather than as a mistake, which a featureless silhouette always does.
       The near fade still takes out anything about to touch the lens. */
    for (const g of this.ghosts) {
      if (g.life <= 0) { if (g.mesh.visible) g.mesh.visible = false; continue; }
      g.t += dt;
      const k = g.t / g.life;
      if (k >= 1) { g.life = 0; g.mesh.visible = false; continue; }
      const near = g.mesh.position.distanceTo(camera.position) / S;
      const clear = Math.min(1, Math.max(0, (near - 3.0) / 4.0));
      if (clear <= 0.001) { g.mesh.visible = false; continue; }
      g.mesh.visible = true;
      g.mesh.quaternion.copy(camera.quaternion);
      // narrows and lengthens as it goes, the way a light trail smears
      g.mesh.scale.set(.16 * S * (1 - k * .5), 1.5 * S * (1 + k * .35), 1);
      /* Brightest at the tail (where he left) so the eye is pulled forward.
         Position in the trail is now age, counted back from the newest slab
         laid — the ring has no fixed head or tail of its own. */
      const back = Math.min(1, (this._ghostSeq - g.seq) / this.ghosts.length);
      g.mesh.material.opacity = (1 - k) * (1 - k) * .5 * (.6 + back * .4) * clear;
    }

    // Zoro's dressing
    const dashLines = sword && (this.move.kind === 'onigiri' || this.move.kind === 'sanzen' || this.move.kind === 'flash');
    for (let i = 0; i < 3; i++) {
      const m = this.speedLines[i];
      m.visible = dashLines;
      if (!dashLines) continue;
      const back = (.6 + i * .9) * S;
      m.position.set(px - Math.sin(ctrl.facing) * back, py + CENTER_Y - .2 * S + i * .28 * S, pz - Math.cos(ctrl.facing) * back);
      m.rotation.set(0, ctrl.facing + (i - 1) * .3, .5 + i * .5);
      /* The blink's own window, not the move's: on arrival the lines snap to
         full and fall away, which is what sells "he is already there". Kept
         to a fifth extra length and a brightness lift — scaling these by
         2.1x, as a first pass did, put a white bar across the whole frame. */
      const flash = this.blink ? 1 - this.blink.t / this.blink.dur : 0;
      const big = this.move.kind === 'sanzen' ? 1.8 : (1 + flash * 0.2);
      m.scale.set((2.4 + i * .8) * big * S, (.5 + i * .14) * big * S, 1);
      m.material.opacity = (.5 - i * .12) * (.6 + Math.sin(elapsed * 40 + i * 2) * .4) * (1 + flash * .5);
    }
    const spin = sword ? this.gatling : 0;
    for (let i = 0; i < 2; i++) {
      const m = this.tatsuPlanes[i];
      m.visible = spin > .05;
      if (!m.visible) continue;
      const a = elapsed * 16 + i * Math.PI;
      m.position.set(px + Math.cos(a) * 2.6 * S, py + CENTER_Y + (.2 + i * .8 + Math.sin(elapsed * 9 + i) * .3) * S, pz + Math.sin(a) * 2.6 * S);
      m.rotation.set(0, -a + Math.PI / 2, .35);
      m.scale.set(3.2 * spin * S, .6 * S, 1);
      m.material.opacity = .55 * spin;
    }
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i], m = this.crescents[i];
      m.visible = w.active;
      if (!w.active) continue;
      m.position.copy(w.pos);
      m.rotation.set(0, Math.atan2(w.dir.x, w.dir.z), elapsed * 9);
      const g = (1 + w.k * 1.6) * 2.6 * S;
      m.scale.set(g, g, 1);
      m.material.opacity = .85 * (1 - w.k * .55);
    }

    // Gear Second steam + glow
    this._gearK = damp(this._gearK, this.gear2 ? 1 : 0, 5, dt);
    const gk = this._gearK;
    if (this.gearLight) {
      this.gearLight.visible = gk > .01;
      this.gearLight.intensity = gk * 2.4 * S * S;   // physical falloff scales with the map
      this.gearLight.position.set(px, cy + .6 * S, pz);
    }
    for (let i = 0; i < this.steam.length; i++) {
      const m = this.steam[i];
      if (gk < .01) { m.visible = false; continue; }
      m.visible = true;
      const p = (elapsed * (.55 + (i % 4) * .11) + i * .37) % 1;
      const a = i * 2.4 + elapsed * .6;
      const r = (.34 + p * .5) * S;
      m.position.set(px + Math.cos(a) * r, py + CENTER_Y + (-.5 + p * 2.1) * S, pz + Math.sin(a) * r);
      m.scale.setScalar((.1 + p * .2) * gk * S);
      m.material.opacity = .5 * gk * Math.sin(p * Math.PI);
    }

    // lightning columns
    for (let i = this._boltJobs.length - 1; i >= 0; i--) {
      const job = this._boltJobs[i];
      if (job.mesh === undefined) {
        job.mesh = this.bolts.find((b) => !b.visible) ?? null;
        if (job.mesh) {
          job.mesh.visible = true;
          const h = 46 * S;
          job.mesh.position.set(job.x, job.y + h * .5, job.z);
          job.mesh.scale.set(job.w, h, job.w);
        }
      }
      job.t += dt;
      const k = Math.min(1, job.t / job.dur);
      if (job.mesh) {
        job.mesh.material.opacity = (1 - k) * (.55 + .45 * Math.abs(Math.sin(k * 46)));
        job.mesh.scale.x = job.mesh.scale.z = job.w * (1 - k * .6);
      }
      if (k >= 1) {
        if (job.mesh) job.mesh.visible = false;
        this._boltJobs.splice(i, 1);
      }
    }
  }

  _armTo(pair, ax, ay, az, bx, by, bz, extend, widthMul, fistMul, color) {
    const { arm, fist } = pair;
    this._v.set(bx - ax, by - ay, bz - az);
    const len = this._v.length();
    if (len < .01) { this._hideArm(pair); return; }
    arm.visible = fist.visible = true;
    arm.position.set(ax + (bx - ax) * .5, ay + (by - ay) * .5, az + (bz - az) * .5);
    this._v.normalize();
    this._q.setFromUnitVectors(this._s3.set(0, 1, 0), this._v);
    arm.quaternion.copy(this._q);
    const w = .13 / (1 + extend * 1.6) * widthMul * S;
    arm.scale.set(w / .1, len, w / .1);
    arm.material.color.copy(color);
    fist.position.set(bx, by, bz);
    fist.quaternion.copy(this._q);
    fist.scale.setScalar(fistMul * S);
    fist.material.color.copy(color);
  }

  _hideArm(pair) { pair.arm.visible = false; pair.fist.visible = false; }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
    });
    this.scene.remove(this.group);
  }
}
