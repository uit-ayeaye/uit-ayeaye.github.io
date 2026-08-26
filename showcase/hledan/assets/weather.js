/**
 * Weather / time-of-day for the Hledan map.
 *
 * Everything here is deliberately cheap, because it has to run on the same
 * phone that is already drawing the city:
 *
 *   - sky, fog and lights are uniform and property writes, not new materials,
 *     so switching a preset compiles no shaders and allocates nothing
 *   - rain is ONE THREE.Points draw call over a block of space that rides the
 *     camera, so the particle count is independent of how big the map is
 *   - the wet-street look is a colour multiply on the existing materials
 *     rather than a second pass or a reflection probe
 *   - lightning is an exposure pulse plus a hemisphere tint — no extra light
 *
 * Presets cross-fade rather than snapping: a hard cut between noon and a storm
 * reads as a bug, and the fade is free (it is just lerping the same numbers).
 */
import * as THREE from 'three';

export const PRESETS = {
  noon: {
    label: 'Midday',
    zenith: 0x4d86c4, horizon: 0xbccddc, nadir: 0x1b2434,
    fog: 0xbccddc, fogNear: 1250, fogFar: 4200,
    hemiSky: 0xdcebff, hemiGround: 0x9a8b74, hemi: 2.7,
    ambient: 0xffffff, ambientI: 0.45,
    sun: 0xfff2d8, sunI: 1.05, sunDir: [-420, 560, 300],
    exposure: 1.0, tint: 0xffffff, skirt: 0xa9b4a2,
    cloud: 0xfdfdfb, cloudAmt: 0.42, cloudSharp: 0.13,
    rain: 0, wind: 0, lamps: 0,
  },
  evening: {
    label: 'Golden hour',
    // Yangon sunsets go orange at the horizon while the zenith stays a deep
    // teal-blue; a single warm gradient top to bottom just looks like dust.
    zenith: 0x2b4a7d, horizon: 0xf2a45c, nadir: 0x241c22,
    fog: 0xe8a068, fogNear: 900, fogFar: 3600,
    hemiSky: 0xffd9a8, hemiGround: 0x6b4f38, hemi: 2.1,
    ambient: 0xffd9b0, ambientI: 0.38,
    sun: 0xffb163, sunI: 1.9, sunDir: [-780, 190, 240],   // low and raking
    exposure: 1.06, tint: 0xffe2c4, skirt: 0xb09878,
    // sunset light comes from underneath, so the deck lights up warm
    cloud: 0xffcf9a, cloudAmt: 0.60, cloudSharp: 0.17,
    // the lamps are already on before the sun is gone — they always are here
    rain: 0, wind: 0, lamps: 0.85,
  },
  rain: {
    label: 'Monsoon',
    zenith: 0x51596a, horizon: 0x8b93a0, nadir: 0x181c24,
    fog: 0x8b93a0, fogNear: 380, fogFar: 2100,            // rain eats the distance
    hemiSky: 0xa8b6c8, hemiGround: 0x4a4f58, hemi: 2.2,
    ambient: 0xc8d4e4, ambientI: 0.5,
    sun: 0x9fb0c8, sunI: 0.35, sunDir: [-300, 700, 200],  // no real sun, just sky
    exposure: 0.94, tint: 0x93a3b8, skirt: 0x6e7885,
    // monsoon overcast: near-total cover with soft edges, no blue left
    cloud: 0x6f7885, cloudAmt: 0.96, cloudSharp: 0.30,
    rain: 1, wind: 0.32, lamps: 0.7,
  },
};

const KEYS = ['zenith', 'horizon', 'nadir', 'fog', 'ambient', 'sun', 'tint', 'skirt', 'hemiSky', 'hemiGround', 'cloud'];
const NUMS = ['fogNear', 'fogFar', 'hemi', 'ambientI', 'sunI', 'exposure', 'rain', 'wind', 'cloudAmt', 'cloudSharp', 'lamps'];

export class Weather {
  /**
   * @param refs  the scene objects to drive: {scene, renderer, sky, hemi,
   *              ambient, sun, skirt, mapMaterials[]}
   * @param tier  'hi' | 'lo' — sets the rain particle budget
   */
  constructor(refs, tier = 'hi') {
    this.refs = refs;
    this.tier = tier;
    this.name = 'noon';
    this.cur = { ...PRESETS.noon };
    this.from = { ...PRESETS.noon };
    this.to = { ...PRESETS.noon };
    this.t = 1;
    this.fade = 1.6;
    this.flash = 0;
    this.nextBolt = 6 + Math.random() * 10;
    this._c = new THREE.Color();
    this._baseTint = new Map();
    for (const m of refs.mapMaterials) this._baseTint.set(m, m.color.clone());
    this.rain = this._buildRain(tier === 'hi' ? 3200 : 1400);
    refs.scene.add(this.rain.points);
    this.apply(this.cur, 1);
  }

  /* One Points cloud in a box around the camera. Because the box moves with the
     viewer, 3200 particles look like rain everywhere instead of rain in one
     corner of an 1800 m map. Streaks are drawn as long points rather than
     line segments so the whole thing stays a single draw call. */
  _buildRain(count) {
    const BOX = 95, TOP = 90;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX;
      pos[i * 3 + 1] = Math.random() * TOP;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX;
      spd[i] = 90 + Math.random() * 70;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      blending: THREE.NormalBlending,
      uniforms: { uOpacity: { value: 0 }, uSize: { value: this.tier === 'hi' ? 2.4 : 3.0 } },
      vertexShader: `
        attribute float aSpeed;
        uniform float uSize;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // fade the far ones out so the box edge never shows as a wall of rain
          vA = clamp(1.0 - (-mv.z) / 95.0, 0.0, 1.0);
          /* Clamp hard. Perspective point sizing turns any drop that drifts
             within a metre of the near plane into a screen-filling blob, and
             in orbit mode the camera sits inside the rain box constantly. */
          float sz = uSize * (170.0 / max(-mv.z, 2.0)) * (0.6 + aSpeed / 240.0);
          gl_PointSize = clamp(sz, 1.0, 7.0);
        }`,
      fragmentShader: `
        uniform float uOpacity;
        varying float vA;
        void main() {
          // vertical streak: squash the point sprite on x
          vec2 p = gl_PointCoord - 0.5;
          float d = length(vec2(p.x * 3.2, p.y));
          if (d > 0.5) discard;
          gl_FragColor = vec4(0.78, 0.85, 0.95, uOpacity * vA * (1.0 - d * 1.4));
        }`,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.visible = false;
    return { points, geo, mat, pos, spd, count, BOX, TOP };
  }

  set(name) {
    if (!PRESETS[name] || name === this.name) return;
    this.from = { ...this.cur };
    this.to = { ...PRESETS[name] };
    this.name = name;
    this.t = 0;
  }

  apply(p, _k) {
    const r = this.refs;
    r.sky.material.uniforms.zenith.value.setHex(p.zenith);
    r.sky.material.uniforms.horizon.value.setHex(p.horizon);
    r.sky.material.uniforms.nadir.value.setHex(p.nadir);
    const su = r.sky.material.uniforms;
    if (su.cloud) {
      su.cloud.value.setHex(p.cloud);
      // lightning lights the underside of the deck, so brighten cover briefly
      su.cloudAmt.value = p.cloudAmt;
      su.cloudSharp.value = p.cloudSharp;
    }

    r.scene.fog.color.setHex(p.fog);
    r.scene.fog.near = p.fogNear;
    r.scene.fog.far = p.fogFar;
    r.renderer.setClearColor(p.fog, 1);

    r.hemi.color.setHex(p.hemiSky);
    r.hemi.groundColor.setHex(p.hemiGround);
    r.hemi.intensity = p.hemi * (1 + this.flash * 1.4);
    r.ambient.color.setHex(p.ambient);
    r.ambient.intensity = p.ambientI;
    r.sun.color.setHex(p.sun);
    r.sun.intensity = p.sunI;
    r.sun.position.set(p.sunDir[0], p.sunDir[1], p.sunDir[2]);
    r.renderer.toneMappingExposure = p.exposure * (1 + this.flash * 0.9);
    r.skirt.material.color.setHex(p.skirt);

    // wet streets: multiply the existing albedo rather than swapping materials
    this._c.setHex(p.tint);
    for (const [m, base] of this._baseTint) m.color.copy(base).multiply(this._c);

    this.rain.mat.uniforms.uOpacity.value = p.rain * 0.55;
    this.rain.points.visible = p.rain > 0.01;

    /* Street lamps come up on the same cross-fade as everything else, plus a
       kick from the lightning so a bolt reads on the lamps as well as the sky. */
    if (r.props) r.props.setGlow((p.lamps || 0) * (1 + this.flash * 0.5));
  }

  update(dt, camera) {
    // preset cross-fade
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.fade);
      const e = this.t * this.t * (3 - 2 * this.t);          // smoothstep
      for (const k of KEYS) {
        const a = new THREE.Color(this.from[k]), b = new THREE.Color(this.to[k]);
        this.cur[k] = a.lerp(b, e).getHex();
      }
      for (const k of NUMS) this.cur[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
      this.cur.sunDir = this.to.sunDir;
      this.cur.label = this.to.label;
    }

    // lightning: an exposure + hemisphere pulse, no extra light in the scene
    if (this.cur.rain > 0.55) {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) { this.flash = 1; this.nextBolt = 5 + Math.random() * 13; }
    }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3.2);

    this.clock = (this.clock || 0) + dt;
    const su = this.refs.sky.material.uniforms;
    if (su.t) su.t.value = this.clock;
    this.apply(this.cur, 1);

    // rain: fall, drift with the wind, and wrap inside the box around the camera
    const R = this.rain;
    if (R.points.visible) {
      const { pos, spd, count, BOX, TOP } = R;
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      const wind = this.cur.wind * 42;
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        pos[j + 1] -= spd[i] * dt;
        pos[j] += wind * dt;
        if (pos[j + 1] < 0) {
          pos[j + 1] = TOP;
          pos[j] = (Math.random() - 0.5) * BOX;
          pos[j + 2] = (Math.random() - 0.5) * BOX;
        }
        if (pos[j] > BOX / 2) pos[j] -= BOX;
        else if (pos[j] < -BOX / 2) pos[j] += BOX;
      }
      R.geo.attributes.position.needsUpdate = true;
      // the cloud is authored around the origin; park it on the camera
      R.points.position.set(cx, cy - TOP * 0.45, cz);
    }
  }

  dispose() {
    this.rain.geo.dispose();
    this.rain.mat.dispose();
    this.refs.scene.remove(this.rain.points);
  }
}
