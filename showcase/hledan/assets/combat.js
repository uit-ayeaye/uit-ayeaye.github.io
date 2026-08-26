/**
 * Moves and effects, following Elbaf's structure.
 *
 * Elbaf keys its kit off `style`: "rubber" for Luffy, "sword" for Zoro, and it
 * gates each move behind its own cooldown (bazookaCd, gigantCd, hakiCd...).
 * Same shape here, with three moves each and Nami given a staff kit of her own
 * — Elbaf only has her as an NPC, so there was nothing to port.
 *
 * Effects are pooled. Every move draws from the same four primitives (beam,
 * ring, arc, bolt), each of which is a single pre-allocated mesh reused on a
 * timer. Nothing is constructed while playing, so a phone never pays a GC
 * pause mid-combo. All of them are additive with depthWrite off, which is what
 * lets them overlap without sorting.
 */
import * as THREE from 'three';
import { WORLD_SCALE } from './character.js';

const S = WORLD_SCALE;

/**
 * Elbaf's full kit, with its own key bindings and its own tuning constants:
 *
 *   Gear Second   8 s duration, 5 s cooldown, x1.4 speed, x1.12 jump
 *   Gatling       held; holds you to 35% move speed while firing
 *   Balloon       held; 55% move speed
 *   Roll          13 u burst over 0.5 s
 *
 * Luffy   click/Q Pistol · hold F Gatling · R Bazooka · E Rocket · T Gigant
 *         · G Gear Second · hold V Balloon · H Haki · C roll
 * Zoro    click/Q Oni Giri · hold F Tatsumaki · R Yakkodori · E Flash Step
 *         · T Sanzen Sekai · H Asura · C roll
 * Nami    has no Elbaf moveset (she is an NPC there), so her staff kit is new
 *         work mapped onto the same slots.
 */
export const GEAR2_DUR = 8, GEAR2_CD = 5, GEAR2_SPEED = 1.4, GEAR2_JUMP = 1.12;
export const GATLING_SLOW = 0.35, BALLOON_SLOW = 0.55;
export const ROLL_DUR = 0.5, ROLL_SPEED = 13;

export const MOVES = {
  rubber: {
    strike:  { id: 'pistol',  name: 'Gum-Gum Pistol', short: 'Pistol',   key: 'KeyQ', cd: 0.42, range: 34 * S, kind: 'beam',   color: 0xffd9a0, shake: 0.16 },
    sustain: { id: 'gatling', name: 'Gum-Gum Gatling', short: 'Gatling',  key: 'KeyF', cd: 0.10, range: 22 * S, kind: 'beam',   color: 0xffe0b0, shake: 0.06, hold: true, slow: GATLING_SLOW },
    heavy:   { id: 'bazooka', name: 'Gum-Gum Bazooka', short: 'Bazooka',  key: 'KeyR', cd: 2.10, range: 40 * S, kind: 'blast',  color: 0xffb56b, shake: 0.55 },
    dash:    { id: 'rocket',  name: 'Gum-Gum Rocket', short: 'Rocket',   key: 'KeyE', cd: 1.30, range: 60 * S, kind: 'pull',   color: 0xfff0c0, shake: 0.22 },
    ult:     { id: 'gigant',  name: 'Gum-Gum Gigant', short: 'Gigant',   key: 'KeyT', cd: 6.00, range: 46 * S, kind: 'giant',  color: 0xffc27a, shake: 0.85 },
    gear:    { id: 'gear2',   name: 'Gear Second', short: 'Gear 2',      key: 'KeyG', cd: GEAR2_CD, range: 0,   kind: 'gear2',  color: 0xff6a4a, shake: 0.30, dur: GEAR2_DUR },
    guard:   { id: 'haki',    name: 'Armament Haki', short: 'Haki',    key: 'KeyH', cd: 9.00, range: 0,       kind: 'haki',   color: 0x2b2f3a, shake: 0.25, dur: 6 },
    float:   { id: 'balloon', name: 'Gum-Gum Balloon', short: 'Balloon',  key: 'KeyV', cd: 0.10, range: 0,       kind: 'balloon',color: 0xffd9a0, shake: 0,    hold: true, slow: BALLOON_SLOW },
  },
  sword: {
    strike:  { id: 'onigiri',   name: 'Oni Giri', short: 'Oni Giri',       key: 'KeyQ', cd: 0.46, range: 12 * S, kind: 'arc',    color: 0x9fe8ff, shake: 0.18 },
    sustain: { id: 'tatsumaki', name: 'Tatsumaki', short: 'Tatsumaki',      key: 'KeyF', cd: 0.12, range: 14 * S, kind: 'spin',   color: 0xbdf0ff, shake: 0.08, hold: true, slow: GATLING_SLOW },
    heavy:   { id: 'yakkodori', name: 'Yakkodori', short: 'Yakkodori',      key: 'KeyR', cd: 1.60, range: 52 * S, kind: 'wave',   color: 0xd6f6ff, shake: 0.34 },
    dash:    { id: 'flashstep', name: 'Flash Step', short: 'Flash Step',     key: 'KeyE', cd: 1.15, range: 30 * S, kind: 'blink',  color: 0xe8fbff, shake: 0.18 },
    ult:     { id: 'sanzen',    name: 'Sanzen Sekai', short: 'Sanzen',   key: 'KeyT', cd: 2.30, range: 16 * S, kind: 'triarc', color: 0xc9f4ff, shake: 0.60 },
    guard:   { id: 'asura',     name: 'Asura', short: 'Asura',          key: 'KeyH', cd: 9.00, range: 0,      kind: 'haki',   color: 0x1d2430, shake: 0.35, dur: 6 },
  },
  staff: {
    strike:  { id: 'zap',    name: 'Thunder Ball', short: 'Ball',      key: 'KeyQ', cd: 0.50, range: 40 * S, kind: 'bolt',   color: 0xbfe4ff, shake: 0.12 },
    sustain: { id: 'sizzle', name: 'Thunder Lance', short: 'Lance',     key: 'KeyF', cd: 0.14, range: 30 * S, kind: 'bolt',   color: 0xd8f0ff, shake: 0.05, hold: true, slow: GATLING_SLOW },
    heavy:   { id: 'tempo',  name: 'Thunderbolt Tempo', short: 'Bolt', key: 'KeyR', cd: 2.60, range: 55 * S, kind: 'strike', color: 0xdff2ff, shake: 0.70 },
    dash:    { id: 'gust',   name: 'Cyclone Tempo', short: 'Cyclone',     key: 'KeyE', cd: 1.20, range: 26 * S, kind: 'gust',   color: 0xd8f0e8, shake: 0.18 },
    ult:     { id: 'storm',  name: 'Thunder Tempo', short: 'Storm',     key: 'KeyT', cd: 6.00, range: 55 * S, kind: 'storm',  color: 0xeaf6ff, shake: 0.80 },
    guard:   { id: 'mirage', name: 'Mirage Tempo', short: 'Mirage',      key: 'KeyH', cd: 9.00, range: 0,      kind: 'haki',   color: 0x4a5a70, shake: 0.20, dur: 6 },
  },
};

/** Every slot the HUD and the key handler know about, in pad order. */
export const SLOTS = ['strike', 'sustain', 'heavy', 'dash', 'ult', 'gear', 'guard', 'float'];

/* ------------------------------------------------------------------- pools */

function addMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
}

export class Combat {
  constructor(scene, tier = 'hi') {
    this.scene = scene;
    this.tier = tier;
    this.cd = Object.create(null);
    this.shake = 0;
    this.active = [];
    this.pull = null;              // set when a Rocket is yanking the player
    this.banner = '';
    this.bannerT = 0;
    /* Timed states, Elbaf's shape: a duration that ticks down, and a separate
       cooldown that only starts when the state ends. */
    this.gear2 = 0;                // seconds of Gear Second left
    this.haki = 0;                 // seconds of armament left
    this.holdSlow = 1;             // move-speed multiplier while a hold move fires
    this.roll = null;              // {t, dir}
    this.blink = null;             // Flash Step target

    const g = new THREE.Group();
    g.frustumCulled = false;
    scene.add(g);
    this.group = g;

    // beam: a unit cylinder along +Y, scaled and aimed per use
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * S, 0.24 * S, 1, 6, 1, true), addMat(0xffd9a0));
    // ring: flat expanding shockwave
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1, 28).rotateX(-Math.PI / 2), addMat(0xffb56b));
    // arc: crescent slash
    this.arc = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 1, 24, 1, Math.PI * 0.12, Math.PI * 0.76), addMat(0x9fe8ff));
    // bolt: thin tall box used as a lightning column
    this.bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10 * S, 0.34 * S, 1, 5, 1, true), addMat(0xbfe4ff));

    for (const m of [this.beam, this.ring, this.arc, this.bolt]) {
      m.visible = false; m.frustumCulled = false; g.add(m);
    }
    // a couple of extra arcs so Sanzen can show three blades at once
    this.arcs = [this.arc];
    for (let i = 0; i < 2; i++) {
      const a = this.arc.clone();
      a.material = this.arc.material.clone();
      a.visible = false; a.frustumCulled = false; g.add(a);
      this.arcs.push(a);
    }
  }

  /** C — a dodge roll along current heading, or facing if standing still. */
  startRoll(dir) {
    if (this.roll || (this.cd.roll || 0) > 0) return false;
    this.roll = { t: 0, dir: dir.clone().normalize() };
    this.cd.roll = 0.85;
    return true;
  }

  /** Speed and jump scalars the controller should apply this frame. */
  speedMul() { return (this.gear2 > 0 ? GEAR2_SPEED : 1) * this.holdSlow; }
  jumpMul()  { return this.gear2 > 0 ? GEAR2_JUMP : 1; }

  ready(def, slot) {
    const mv = MOVES[def.style] && MOVES[def.style][slot];
    if (!mv) return false;
    return (this.cd[mv.id] || 0) <= 0;
  }
  cooldown(def, slot) {
    const mv = MOVES[def.style] && MOVES[def.style][slot];
    if (!mv) return 0;
    return Math.max(0, (this.cd[mv.id] || 0) / mv.cd);
  }

  /**
   * @param origin  world position of the character's chest
   * @param aim     unit vector the camera is looking along
   * @param hit     {point, distance} from the aim raycast, or null for open air
   */
  cast(def, slot, origin, aim, hit, ctrl) {
    const mv = MOVES[def.style] && MOVES[def.style][slot];
    if (!mv || (this.cd[mv.id] || 0) > 0) return false;
    this.cd[mv.id] = mv.cd;
    this.shake = Math.min(1.2, this.shake + mv.shake);
    this.banner = mv.name;
    this.bannerT = 1.15;

    const reach = hit ? Math.min(hit.distance, mv.range) : mv.range;
    const end = origin.clone().addScaledVector(aim, reach);

    switch (mv.kind) {
      case 'beam':   this._beam(origin, end, mv.color, 0.16, 1.0); break;
      case 'blast':  this._beam(origin, end, mv.color, 0.22, 1.7);
                     this._ring(end, mv.color, 9 * S, 0.5); break;
      case 'pull':   this._beam(origin, end, mv.color, 0.20, 0.8);
                     // Elbaf's Rocket yanks the player to the aim point
                     this.pull = { to: end.clone(), t: 0, dur: 0.42 };
                     break;
      case 'arc':    this._arc(origin, aim, mv.color, 0, 3.4 * S, 0.26); break;
      case 'triarc': for (let i = 0; i < 3; i++)
                       this._arc(origin, aim, mv.color, i, 4.6 * S, 0.40, i * 0.07);
                     this._ring(origin, mv.color, 11 * S, 0.55); break;
      case 'wave':   this._wave(origin, aim, mv.color, reach); break;
      case 'bolt':   this._bolt(end, mv.color, 0.30, 1.0); break;
      case 'strike': this._bolt(end, mv.color, 0.55, 2.2);
                     this._ring(end, mv.color, 10 * S, 0.5); break;
      case 'gust':   this._ring(origin, mv.color, 8 * S, 0.42);
                     if (ctrl) {                       // short forward burst
                       ctrl.vel.x += aim.x * 26 * S;
                       ctrl.vel.z += aim.z * 26 * S;
                     }
                     break;
      case 'spin':   for (let i = 0; i < 2; i++)       // Tatsumaki: a rising twin cyclone
                       this._arc(origin, aim, mv.color, i, 3.0 * S, 0.22, i * 0.05);
                     break;
      case 'giant':  this._beam(origin, end, mv.color, 0.55, 1.5);
                     this._ring(end, mv.color, 15 * S, 0.7);
                     this._ring(origin, mv.color, 11 * S, 0.55);
                     break;
      case 'storm':  this._bolt(end, mv.color, 0.7, 2.4);
                     this._ring(end, mv.color, 14 * S, 0.7);
                     this.skyFlash = 1;                // the weather driver reads this
                     break;
      case 'blink':  this._ring(origin, mv.color, 6 * S, 0.3);
                     this.blink = { to: end.clone(), t: 0, dur: 0.16 };
                     this._ring(end, mv.color, 6 * S, 0.42);
                     break;
      case 'gear2':  this.gear2 = mv.dur;
                     this._ring(origin, mv.color, 9 * S, 0.6);
                     break;
      case 'haki':   this.haki = mv.dur;
                     this._ring(origin, mv.color, 8 * S, 0.55);
                     break;
      case 'balloon': break;                            // pure state, see holdSlow
    }
    return true;
  }

  /* --------------------------------------------------------- effect setups */

  _push(mesh, dur, fn) {
    mesh.visible = true;
    this.active.push({ mesh, t: 0, dur, fn });
  }

  _beam(a, b, color, width, dur) {
    const m = this.beam;
    m.material.color.setHex(color);
    const dir = b.clone().sub(a);
    const len = dir.length() || 0.001;
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    m.scale.set(width / 0.2, len, width / 0.2);
    const baseY = len;
    this._push(m, dur, (k) => {
      // snap out fast, whip back — rubber, not a laser
      const grow = k < 0.25 ? k / 0.25 : 1;
      const back = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1;
      m.scale.y = baseY * grow * back;
      m.position.copy(a).addScaledVector(dir, 0.5 * grow * back);
      m.material.opacity = 0.9 * (1 - k * k);
    });
  }

  _ring(at, color, radius, dur) {
    const m = this.ring;
    m.material.color.setHex(color);
    m.position.copy(at); m.position.y += 0.25 * S;
    this._push(m, dur, (k) => {
      const r = radius * (0.12 + k * 0.88);
      m.scale.set(r, r, r);
      m.material.opacity = 0.75 * (1 - k);
    });
  }

  _arc(origin, aim, color, idx, size, dur, delay = 0) {
    const m = this.arcs[idx % this.arcs.length];
    m.material.color.setHex(color);
    const yaw = Math.atan2(aim.x, aim.z);
    const roll = (idx - 1) * 0.9;
    m.position.copy(origin).addScaledVector(aim, 2.2 * S);
    m.rotation.set(0, 0, 0);
    m.rotateY(yaw);
    m.rotateX(Math.PI / 2);
    m.rotateZ(roll);
    this._push(m, dur + delay, (k) => {
      const kk = Math.max(0, (k * (dur + delay) - delay) / dur);
      const r = size * (0.35 + kk * 0.9);
      m.scale.set(r, r, r);
      m.material.opacity = kk <= 0 ? 0 : 0.85 * (1 - kk);
    });
  }

  /** Zoro's flying slash: an arc that travels away from the caster. */
  _wave(origin, aim, color, reach) {
    const m = this.arcs[0];
    m.material.color.setHex(color);
    const yaw = Math.atan2(aim.x, aim.z);
    const start = origin.clone().addScaledVector(aim, 2 * S);
    m.rotation.set(0, 0, 0); m.rotateY(yaw); m.rotateX(Math.PI / 2);
    const r = 4.2 * S;
    m.scale.set(r, r, r);
    this._push(m, 0.7, (k) => {
      m.position.copy(start).addScaledVector(aim, reach * k);
      m.material.opacity = 0.9 * (1 - k * 0.85);
    });
  }

  _bolt(at, color, width, dur) {
    const m = this.bolt;
    m.material.color.setHex(color);
    const h = 46 * S;
    m.position.set(at.x, at.y + h * 0.5, at.z);
    m.scale.set(width, h, width);
    this._push(m, dur, (k) => {
      // flicker rather than fade — reads as electricity, costs one sin()
      m.material.opacity = (1 - k) * (0.55 + 0.45 * Math.abs(Math.sin(k * 46)));
      m.scale.x = m.scale.z = width * (1 - k * 0.6);
    });
  }

  /* ---------------------------------------------------------------- update */

  update(dt, ctrl) {
    for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.shake = Math.max(0, this.shake - dt * 2.6);
    if (this.gear2 > 0) this.gear2 = Math.max(0, this.gear2 - dt);
    if (this.haki > 0) this.haki = Math.max(0, this.haki - dt);
    if (this.skyFlash > 0) this.skyFlash = Math.max(0, this.skyFlash - dt * 2);

    // Roll: a decelerating burst along a fixed heading, Elbaf's 13 u over 0.5 s
    if (this.roll && ctrl) {
      this.roll.t += dt;
      const k = Math.min(1, this.roll.t / ROLL_DUR);
      const v = ROLL_SPEED * S * (1 - k * k);
      ctrl.vel.x = this.roll.dir.x * v;
      ctrl.vel.z = this.roll.dir.z * v;
      if (k >= 1) this.roll = null;
    }
    // Flash Step: a short instant translate rather than a pull
    if (this.blink && ctrl) {
      this.blink.t += dt;
      const k = Math.min(1, this.blink.t / this.blink.dur);
      ctrl.pos.lerp(this.blink.to, 1 - Math.pow(1 - k, 3));
      if (k >= 1) { this.blink = null; ctrl.vel.set(0, ctrl.vel.y, 0); }
    }
    if (this.bannerT > 0) this.bannerT = Math.max(0, this.bannerT - dt);

    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      e.fn(k);
      if (k >= 1) { e.mesh.visible = false; this.active.splice(i, 1); }
    }

    // Rocket pull: ease the controller toward the grapple point
    if (this.pull && ctrl) {
      this.pull.t += dt;
      const k = Math.min(1, this.pull.t / this.pull.dur);
      const e = 1 - Math.pow(1 - k, 3);
      const d = this.pull.to.clone().sub(ctrl.pos);
      d.y = Math.max(d.y, 0);
      ctrl.vel.x = d.x * (1 - e) * 3.4;
      ctrl.vel.z = d.z * (1 - e) * 3.4;
      if (this.pull.t < this.pull.dur * 0.5) ctrl.vel.y = Math.max(ctrl.vel.y, 9 * S);
      ctrl.grounded = false;
      if (k >= 1) this.pull = null;
    }
  }

  dispose() {
    for (const m of [this.beam, this.ring, this.bolt, ...this.arcs]) {
      m.geometry.dispose(); m.material.dispose();
    }
    this.scene.remove(this.group);
  }
}
