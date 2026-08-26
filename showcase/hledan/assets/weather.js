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
    rain: 0, wind: 0, lamps: 0, traffic: 1, headlights: 0.14, selfLit: 0,
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
    // the lamps are already on before the sun is gone — they always are here,
    // and so are the shop windows, competing with what is left of the daylight
    rain: 0, wind: 0, lamps: 0.85, traffic: 0.95, headlights: 0.72, windows: 0.7, selfLit: 0.035,
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
    rain: 1, wind: 0.32, lamps: 0.7, traffic: 0.85, headlights: 0.92, selfLit: 0.025,
  },

  /* ---- the three that are here for memory rather than for weather ---- */

  night: {
    label: 'Night',
    /* Hledan does not go quiet at night, it goes orange — and the sky over it
       stays blue. The split is the whole look: a cool moonlit sky and a big
       moon overhead, sodium lamps and neon doing all the warm work at street
       level. Hemisphere ground bounces amber (that is the lamps coming back
       off the tarmac), the ambient leans cool so shadows read as night, and
       the moonlight itself is strong enough to rim the rooflines without
       flattening the pools of lamp light. Exposure sits above 1 on purpose —
       what the eye remembers of this street at night is the glow. */
    zenith: 0x080f22, horizon: 0x1e2a46, nadir: 0x05080f,
    fog: 0x22293c, fogNear: 620, fogFar: 3000,
    hemiSky: 0x31456b, hemiGround: 0x3d2a1a, hemi: 1.15,
    ambient: 0xa8adc0, ambientI: 0.26,
    sun: 0xaecbf5, sunI: 0.85, sunDir: [-260, 780, 180],   // the moon, properly
    exposure: 1.24, tint: 0xa39a90, skirt: 0x171a22,
    cloud: 0x2f3a52, cloudAmt: 0.34, cloudSharp: 0.22,
    /* the sodium dome the city throws up off its own streets */
    glow: 0xff8c3c, glowAmt: 0.20,
    rain: 0, wind: 0, lamps: 1.0, traffic: 0.45, headlights: 1.0, moon: 1, windows: 1, selfLit: 0.035,
  },

  blackout: {
    label: 'Blackout',
    /* Load-shedding. The grid drops, the street lamps go with it, and the only
       light left on the block is whatever runs off a generator — which is why
       lamps is not zero but 0.06: a few shops keep going, and those few points
       of warm light are the whole image. Anyone who grew up here knows this
       street better in this state than in any other. */
    zenith: 0x070c16, horizon: 0x121a2a, nadir: 0x03050a,
    fog: 0x121a2a, fogNear: 400, fogFar: 2100,
    hemiSky: 0x1f2c44, hemiGround: 0x0f1116, hemi: 0.62,
    ambient: 0x8496b8, ambientI: 0.17,
    sun: 0x6b7ea8, sunI: 0.14, sunDir: [-260, 780, 180],
    exposure: 1.24, tint: 0x7c869a, skirt: 0x10141c,
    cloud: 0x1b2231, cloudAmt: 0.30, cloudSharp: 0.24,
    /* with the grid down the moon owns the street, and the only windows still
       lit are the ones on a generator */
    glow: 0xff8c3c, glowAmt: 0.04,
    rain: 0, wind: 0, lamps: 0.06, traffic: 0.30, headlights: 1.0, moon: 0.9, windows: 0.16, selfLit: 0.03,
  },

  dawn: {
    label: 'Dawn',
    /* Before six. River mist still on the street, the light coming in flat and
       pink, the lamps not yet switched off. This is the quietest Hledan ever
       gets and the one that is hardest to see from far away, so the fog is
       pulled in tight — the far side of the junction should be a suggestion. */
    zenith: 0x40608c, horizon: 0xe9bb90, nadir: 0x241f28,
    fog: 0xd6bda6, fogNear: 300, fogFar: 2300,
    hemiSky: 0xffdcc4, hemiGround: 0x7d6c5a, hemi: 2.05,
    ambient: 0xffe6d4, ambientI: 0.42,
    sun: 0xffcb93, sunI: 1.00, sunDir: [640, 150, -280],   // low, and from the east
    exposure: 1.02, tint: 0xffeade, skirt: 0xa89a82,
    cloud: 0xf7dcc4, cloudAmt: 0.52, cloudSharp: 0.20,
    rain: 0, wind: 0, lamps: 0.38, traffic: 0.35, headlights: 0.55, selfLit: 0.03,
  },
};

const KEYS = ['zenith', 'horizon', 'nadir', 'fog', 'ambient', 'sun', 'tint', 'skirt', 'hemiSky', 'hemiGround', 'cloud', 'glow'];
const NUMS = ['fogNear', 'fogFar', 'hemi', 'ambientI', 'sunI', 'exposure', 'rain', 'wind', 'cloudAmt', 'cloudSharp', 'lamps', 'traffic', 'headlights', 'moon', 'glowAmt', 'windows', 'selfLit'];

/* A preset that predates a key simply does not carry it; a fade toward such a
   preset treats it as off, which is exactly the intent. */
for (const p of Object.values(PRESETS)) {
  if (p.moon === undefined) p.moon = 0;
  if (p.glowAmt === undefined) p.glowAmt = 0;
  if (p.glow === undefined) p.glow = 0xff9a4a;
  if (p.windows === undefined) p.windows = 0;
  if (p.selfLit === undefined) p.selfLit = 0;
}

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
    this.moon = this._buildMoon();
    refs.sky.add(this.moon);          // the sky rides the camera; so must the moon
    this.apply(this.cur, 1);
  }

  /**
   * လမင်းကြီး — the big moon. A sprite, not geometry: it always faces the
   * viewer, it costs one draw, and being parented to the camera-riding sky
   * sphere it never gets closer or further. Deliberately outsized (~5° of
   * sky against the real 0.5°) — this is the cinematic moon a city night
   * runs on, not an astronomy lesson. Buildings still occlude it, because
   * it depth-tests like anything else.
   */
  _buildMoon() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    // the halo
    let g = ctx.createRadialGradient(128, 128, 60, 128, 128, 128);
    g.addColorStop(0, 'rgba(200,220,255,0.30)');
    g.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    // the disc, softly edged, with a hint of maria
    g = ctx.createRadialGradient(120, 118, 8, 128, 128, 64);
    g.addColorStop(0, 'rgba(240,247,255,1)');
    g.addColorStop(0.72, 'rgba(214,228,250,0.95)');
    g.addColorStop(0.97, 'rgba(190,208,238,0.85)');
    g.addColorStop(1, 'rgba(190,208,238,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(128, 128, 64, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(150,170,205,0.35)';
    for (const [mx, my, mr] of [[112, 112, 17], [146, 132, 12], [124, 152, 9], [148, 106, 7]]) {
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, fog: false, depthWrite: false,
    });
    const moon = new THREE.Sprite(mat);
    /* Hung lower than the light actually comes from — ~35° up, where the
       chase camera can frame it over the rooflines. The moonLIGHT direction
       stays overhead in the preset; nobody reads that discrepancy at night. */
    const dir = new THREE.Vector3(-320, 260, 200).normalize();
    moon.position.copy(dir.multiplyScalar(5200));
    moon.scale.setScalar(520);
    moon.visible = false;
    return moon;
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
    if (su.glow) {
      su.glow.value.setHex(p.glow);
      su.glowAmt.value = p.glowAmt || 0;
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
    for (const [m, base] of this._baseTint) {
      m.color.copy(base).multiply(this._c);
      /* and the surface's own faint glow after dark — each material carries
         how much of it it is entitled to, so the fields stay fields */
      m.emissiveIntensity = (p.selfLit || 0) * (m.userData.selfLit || 0);
    }

    this.rain.mat.uniforms.uOpacity.value = p.rain * 0.55;
    this.rain.points.visible = p.rain > 0.01;

    if (this.moon) {
      const mv = (p.moon || 0) * (1 - this.flash * 0.6);   // lightning washes it out
      this.moon.material.opacity = mv;
      this.moon.visible = mv > 0.01;
    }

    /* Street lamps come up on the same cross-fade as everything else, plus a
       kick from the lightning so a bolt reads on the lamps as well as the sky.
       Windows carry their own floor, because they are not on the street grid:
       in a blackout the lamps go and a scatter of generator-lit rooms stays. */
    if (r.props) {
      r.props.windowFloor = p.windows || 0;
      r.props.setGlow((p.lamps || 0) * (1 + this.flash * 0.5),
                      (p.headlights === undefined ? p.lamps : p.headlights) || 0);
    }
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
