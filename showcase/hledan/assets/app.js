/**
 * Hledan Junction — real-time WebGL viewer
 *
 * Vanilla three.js, no framework. The map ships as one 59.5k-triangle GLB with
 * four materials; textures are bound here at runtime so the resolution tier can
 * follow the device instead of being baked into the asset.
 *
 * Performance shape:
 *   - two texture tiers (1024 / 2048) picked from a device probe
 *   - MeshLambertMaterial on the low tier, MeshStandardMaterial on the high tier
 *   - no realtime shadows: the source textures are already baked-lit
 *   - alpha *test*, never alpha blend, so nothing needs depth sorting
 *   - render scale drifts between 0.55x and 1x to hold the frame budget
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TriGrid } from './occlusion.js';
import { StreetProps, loadVehicleGeometry } from './props.js';
import { Soundscape } from './audio.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  CHARACTERS, NavMap, Character, CharacterController, ChaseCamera,
  YAW_SENS, PITCH_SENS, WORLD_SCALE,
} from './character.js';
import { Weather, PRESETS } from './weather.js';
import { Combat, MOVES, SLOTS } from './combat.js';

/* ------------------------------------------------------------------ device */

const UA = navigator.userAgent;
/* Elbaf's own probe, including the ?touch escape hatch it ships so the mobile
   UI can be exercised on a desktop. matchMedia('hover:none') misses hybrids
   and anything with both a trackpad and a touchscreen. */
/* ?touch=1 forces the mobile UI on a desktop, ?touch=0 forces the desktop UI on
   a touch device — and on anything that merely *reports* touch. Chrome's
   headless/embedded views claim maxTouchPoints 5, so without the off switch the
   desktop layout cannot be exercised in automation at all. */
const TOUCH_PARAM = new URLSearchParams(location.search).get('touch');
const IS_TOUCH = TOUCH_PARAM === null
  ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  : TOUCH_PARAM !== '0' && TOUCH_PARAM !== 'false';
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

function probeDevice() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || (IS_TOUCH ? 4 : 8);
  const px = window.screen.width * window.screen.height * (window.devicePixelRatio || 1);

  // Ask the driver what it actually is — the UA lies, the renderer string rarely does.
  let gpu = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) gpu = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
  } catch (e) { /* privacy mode blocks this; fall through to the heuristics */ }

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 6 ? 1 : 0;
  score += IS_TOUCH ? 0 : 2;
  if (/Apple (A1[7-9]|M[1-9])/i.test(gpu)) score += 2;
  if (/Adreno \(TM\) (7[0-9]{2}|8[0-9]{2})/i.test(gpu)) score += 1;
  if (/Mali-G[0-9]{2}\b/i.test(gpu)) score -= 1;
  if (px > 4000000 && IS_TOUCH) score -= 1;

  /* Touch devices have to clear a much higher bar. The probe over-reads on
     phones — Safari does not expose deviceMemory at all, and a desktop running
     device emulation still reports its real cores and GPU — so anything short
     of overwhelming evidence gets the 1024/Lambert path. It looks near
     identical at phone pixel density and costs a third of the GPU memory. */
  const need = IS_TOUCH ? 7 : 4;
  return { tier: score >= need ? 'hi' : 'lo', cores, mem, gpu, score, need };
}

document.body.classList.toggle('touch', IS_TOUCH);

const DEVICE = probeDevice();
const TARGET_MS = DEVICE.tier === 'hi' ? 1000 / 60 : 1000 / 45;

/* ------------------------------------------------------------------- scene */

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: DEVICE.tier === 'hi',
  powerPreference: 'high-performance',
  stencil: false,
  depth: true,
});
renderer.setClearColor(0x0a0e1a, 1);
/* Khronos PBR Neutral, not ACES. These are photogrammetry textures with light
   already in them; ACES treats them as scene-referred HDR and crushes the
   shadows while desaturating the mid-tones. Neutral leaves them alone. */
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();

/* Three stops, not two. A two-stop sky puts the warm colour across the entire
   lower hemisphere, and since the camera looks *down* at a map that reads as
   brown mud filling half the frame. Horizon haze has to be its own band. */
const SKY_ZENITH = new THREE.Color(0x4d86c4);
const SKY_HORIZON = new THREE.Color(0xbccddc);
const SKY_NADIR = new THREE.Color(0x1b2434);
const HAZE = 0xbccddc;                       // fog matches the horizon band exactly
scene.fog = new THREE.Fog(HAZE, 1250, 4200);

const camera = new THREE.PerspectiveCamera(55, 1, 0.6, 9000);
camera.position.set(430, 300, 520);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(6000, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: SKY_ZENITH },
      horizon: { value: SKY_HORIZON },
      nadir: { value: SKY_NADIR },
      cloud: { value: new THREE.Color(0xffffff) },
      cloudAmt: { value: 0 },
      cloudSharp: { value: 0.16 },
      t: { value: 0 },
    },
    vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 nadir;
      uniform vec3 cloud; uniform float cloudAmt; uniform float cloudSharp; uniform float t;
      varying vec3 vW;

      /* Value noise + 4 octaves of fbm. Clouds cost nothing but arithmetic:
         they live in the sky sphere that was already being drawn, so there is
         no extra geometry, no extra draw call and no texture to download. */
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int k = 0; k < 4; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
        return v;
      }

      void main(){
        vec3 d = normalize(vW);
        float h = d.y;
        vec3 c = h > 0.0
          ? mix(horizon, zenith, pow(h, 0.42))     // haze hugs the horizon, blue climbs fast
          : mix(horizon, nadir,  pow(-h, 0.30));   // and falls away to slate below

        if (cloudAmt > 0.001 && h > 0.02) {
          /* Project onto a flat deck at a fixed height so the cloud sheet
             stretches toward the horizon the way a real overcast does, instead
             of wrapping evenly round the dome like a texture on a ball. */
          vec2 uv = d.xz / max(h, 0.02) * 0.55;
          float n = fbm(uv + vec2(t * 0.013, t * 0.007));
          n = mix(n, fbm(uv * 1.9 - vec2(t * 0.021, 0.0)), 0.45);
          float cover = smoothstep(0.52 - cloudSharp, 0.52 + cloudSharp, n);
          // thin them out toward the horizon, where you would be seeing edge-on
          cover *= smoothstep(0.02, 0.34, h) * cloudAmt;
          c = mix(c, cloud, clamp(cover, 0.0, 1.0));
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  })
);
sky.frustumCulled = false;
scene.add(sky);

/* The textures are photogrammetry with lighting already baked in, so this is
   deliberately flat: a strong hemisphere for fill and a weak sun for shape.
   Crank the directional up instead and street canyons go black, because there
   is no bounce and no shadow term to sell the contrast. */
const hemi = new THREE.HemisphereLight(0xdcebff, 0x9a8b74, 2.7);
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
const sun = new THREE.DirectionalLight(0xfff2d8, 1.05);
sun.position.set(-420, 560, 300);
scene.add(hemi, ambient, sun);

/* A haze-coloured disc under the map so it stops reading as a slab floating in
   the void. It rides the camera in XZ (see the loop) so its rim is always well
   past fog-far and therefore always exactly the horizon colour — pin it in
   place instead and the rim cuts a visible arc across the sky. */
const skirt = new THREE.Mesh(
  new THREE.CircleGeometry(5200, 48).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xa9b4a2, fog: true, depthWrite: true })
);
skirt.frustumCulled = false;
scene.add(skirt);

/* --------------------------------------------------------------- materials */

const TEX = new THREE.TextureLoader();
const anisoMax = renderer.capabilities.getMaxAnisotropy();
/* Anisotropy is what keeps the road readable when you look down it at a
   glancing angle, which is most of the time at street level. 16 on desktop is
   nearly free on any GPU that reports it; 4 is the mobile compromise. */
const ANISO = Math.min(DEVICE.tier === 'hi' ? 16 : 4, anisoMax);
const tierDir = `textures/${DEVICE.tier}/`;

function colorMap(url) {
  const t = TEX.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  t.flipY = false;                 // GLB UVs are already flipped at export time
  return t;
}
function dataMap(url) {
  const t = TEX.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  t.flipY = false;
  return t;
}

/**
 * Material recipes keyed by the material names baked into the GLB.
 * `rough` is only honoured on the high tier — Lambert has no roughness input,
 * and on a mid-range mobile GPU the PBR BRDF costs more than it shows.
 */
const RECIPES = {
  'Building':      { map: tierDir + 'building_basecolor.webp',    rough: 'textures/building_roughness.webp', cutout: true },
  'Environment':   { map: tierDir + 'environment_basecolor.webp', roughness: 0.96,                           cutout: true },
  'Hledan_Center': { map: tierDir + 'hledan_basecolor.webp',      rough: 'textures/hledan_roughness.webp',   cutout: true },
  'Road texture':  { map: 'textures/road_basecolor.webp',         roughness: 0.85,                           cutout: false },
};

function buildMaterial(name) {
  const r = RECIPES[name];
  if (!r) return new THREE.MeshLambertMaterial({ color: 0x9aa6b8 });

  const common = {
    map: colorMap(r.map),
    side: THREE.DoubleSide,
    alphaTest: r.cutout ? 0.5 : 0,   // test, not blend: no sorting, no blend overdraw
    transparent: false,
    name,
  };
  if (DEVICE.tier === 'hi') {
    return new THREE.MeshStandardMaterial({
      ...common,
      metalness: 0.0,
      roughness: r.roughness ?? 1.0,
      roughnessMap: r.rough ? dataMap(r.rough) : null,
    });
  }
  return new THREE.MeshLambertMaterial(common);
}

/* -------------------------------------------------------------------- load */

const bar = document.getElementById('bar');
const loadMsg = document.getElementById('loadMsg');
const loadScreen = document.getElementById('load');

let mapRoot = null;
let weather = null;
/* Raycast targets are split by cost. The road plane and the map plate together
   are 8.4k triangles and cover the junction; the terrain backdrop is another
   10.8k and is only consulted when the cheap pair misses. */
const groundFast = [];
const groundWide = [];
const occluders = [];               // what the chase camera is not allowed to see through
let occlusionGrid = null;           // built from `occluders` once the map is in
let props = null;                   // instanced street furniture

/* Built now, silent now. The AudioContext inside is not constructed until the
   sound button is pressed, so there is nothing here that could autoplay. */
const sound = new Soundscape(DEVICE.tier);
let mapBox = new THREE.Box3();
let groundBox = new THREE.Box3();   // walkable surface only — NOT the map bounds
let coreBox = new THREE.Box3();     // the streets, without the terrain backdrop
let streetY = 0;

new GLTFLoader().load(
  'models/hledan.glb',
  (gltf) => {
    mapRoot = gltf.scene;
    const cache = new Map();

    mapRoot.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material ? o.material.name : '';
      if (!cache.has(name)) cache.set(name, buildMaterial(name));
      o.material = cache.get(name);
      o.castShadow = o.receiveShadow = false;
      o.geometry.computeBoundingSphere();
      o.geometry.computeBoundingBox();
      if (name === 'Hledan_Center' || name === 'Road texture') groundFast.push(o);
      else if (o.name === 'Environment') groundWide.push(o);

      /* Chase-camera occluders. Trees are excluded on purpose — the mesh is
         named "no collider" and its canopies hang over most of the route, so
         including them would yank the camera in every time a branch crossed
         the sightline. The terrain backdrop is excluded too: it is ground, and
         the chase cam already has a height clamp for that. What is left is the
         geometry that actually swallows the camera — the flyover deck and the
         building walls. ~19k triangles for one ray a frame.

         Match the tree mesh on a pattern, not the authored string: GLTF import
         rewrites names, so "Tree(No collider)" arrives as "Tree(No_collider)"
         and an equality test against the .blend name silently lets it through. */
      if (!/^Tree\(/.test(o.name) && o.name !== 'Environment') occluders.push(o);
    });

    scene.add(mapRoot);
    occlusionGrid = new TriGrid(occluders, THREE);
    props = new StreetProps({ scene, tier: DEVICE.tier });

    /* The real car model lands after the map is already interactive. If it
       fails — offline, blocked, moved — the procedurally built one it would
       have replaced simply stays, so the street is never short of traffic. */
    for (const v of [
      { file: 'car-quaternius.glb', kind: 'taxi', bodyMat: 'LightBlue', size: [1.78, 1.52, 4.40] },
      { file: 'bus-poly.glb',       kind: 'bus',  bodyMat: 'Mat',       size: [2.50, 3.20, 11.5] },
    ]) {
      loadVehicleGeometry(`models/vehicles/${v.file}`, { bodyMat: v.bodyMat, size: v.size })
        .then((loaded) => { if (props) props.replaceVehicle(v.kind, loaded); })
        .catch((e) => console.warn(`${v.file} unavailable, keeping the built-in one:`, e.message));
    }
    mapBox.setFromObject(mapRoot);

    /* The walkable surface is NOT mapBox. The tree mesh hangs 38 m below street
       level, so mapBox.min.y sits under the world — anchoring the skirt or the
       walk spawn to it buries the camera beneath the map. Measure the surfaces
       that are actually ground instead. */
    groundBox.makeEmpty();
    for (const m of groundFast.concat(groundWide)) groundBox.expandByObject(m);
    coreBox.makeEmpty();
    for (const m of groundFast) coreBox.expandByObject(m);   // streets, not backdrop
    streetY = groundBox.min.y;
    skirt.position.y = streetY - 2;

    weather = new Weather({
      scene, renderer, sky, hemi, ambient, sun, skirt, props,
      mapMaterials: [...cache.values()],
    }, DEVICE.tier);
    const savedSky = (() => { try { return localStorage.getItem('hledan-sky'); } catch (e) { return null; } })();
    if (savedSky && PRESETS[savedSky] && savedSky !== 'noon') weather.set(savedSky);
    syncSkyButtons();

    frameMap();

    loadScreen.classList.add('gone');
    setTimeout(() => loadScreen.remove(), 700);
    document.getElementById('ui').classList.add('ready');
  },
  (e) => {
    if (e.lengthComputable) {
      const p = Math.round((e.loaded / e.total) * 100);
      bar.style.width = p + '%';
      loadMsg.textContent = `Loading geometry — ${p}%`;
    } else {
      loadMsg.textContent = `Loading geometry — ${(e.loaded / 1048576).toFixed(1)} MB`;
    }
  },
  (err) => {
    loadMsg.textContent = 'Could not load the map.';
    loadMsg.classList.add('err');
    console.error(err);
  }
);

/* ---------------------------------------------------------------- controls */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.42;   // drag-to-look; the old rate overshot on a trackpad
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.7;
controls.screenSpacePanning = false;
controls.minDistance = 40;
controls.maxDistance = 2400;
controls.maxPolarAngle = Math.PI * 0.495;   // never dip under the ground plane
/* A full turn of the junction now takes about three and a half minutes rather
   than a little over two. The point of the spin is to let the eye wander over
   the map, and at the old rate the far side had moved before you had finished
   looking at the near one. */
controls.autoRotateSpeed = 0.17;

function frameMap() {
  const c = mapBox.getCenter(new THREE.Vector3());
  const s = mapBox.getSize(new THREE.Vector3());
  // Frame on the built-up core, not the raw bounds: the terrain backdrop runs
  // 1.8 km deep and framing to that leaves the city as a speck in the middle.
  const reach = Math.max(s.x, s.z * 0.55) * 1.0;
  // Pivot on street level, not mapBox.min.y — the tree mesh drags that 38 m
  // under the road and the whole orbit tilts around a point below the world.
  controls.target.set(c.x, streetY + 24, c.z);
  camera.position.set(c.x + reach * 0.45, streetY + reach * 0.50, c.z + reach * 0.85);
  controls.update();
}

/* Walk mode — hovering first person. No physics: the camera rides a raycast
   against the two ground meshes, throttled because an un-accelerated raycast
   against 8.4k triangles every frame is not free on a phone. */
const walk = {
  on: false,
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  eye: 1.75,
  ground: 0,
  tick: 0,
  ray: new THREE.Raycaster(),
  down: new THREE.Vector3(0, -1, 0),
  keys: Object.create(null),
  stick: { active: false, id: -1, x: 0, y: 0, ox: 0, oy: 0 },
  look: { id: -1, x: 0, y: 0 },
};

function enterWalk() {
  walk.on = true;
  controls.enabled = false;
  controls.autoRotate = false;

  // Spawn on open ground. The centre of the plate is as likely to be inside a
  // building as on a street, so probe a widening spiral and take the first spot
  // with real ground under it and clear air above.
  const c = coreBox.getCenter(new THREE.Vector3());
  const spot = findOpenSpot(c.x, c.z);
  camera.position.set(spot.x, spot.y + walk.eye, spot.z);
  walk.ground = spot.y;
  walk.yaw = spot.yaw;
  walk.pitch = 0;
  camera.quaternion.setFromEuler(new THREE.Euler(0, walk.yaw, 0, 'YXZ'));

  document.body.classList.add('walking');
  // Pointer lock is unavailable in some embeds and sandboxed frames; the promise
  // rejects rather than throwing, and drag-to-look below covers the fallback.
  if (!IS_TOUCH) {
    try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); }
    catch (e) { /* older signature returns undefined */ }
  }
}

/**
 * Golden-angle spiral out from (x0,z0) looking for a standable spot: ground
 * below, and at least 12 m of clear air above so we don't spawn inside a slab.
 * Also picks a yaw that faces whichever direction has the most open space.
 */
function findOpenSpot(x0, z0) {
  const solid = mapRoot ? [mapRoot] : [];
  const down = new THREE.Raycaster();
  const up = new THREE.Raycaster();
  const probe = new THREE.Raycaster();
  let fallback = null;

  for (let i = 0; i < 90; i++) {
    const r = i === 0 ? 0 : 12 * Math.sqrt(i);
    const a = i * 2.39996;                       // golden angle — even coverage, no lattice
    const x = THREE.MathUtils.clamp(x0 + Math.cos(a) * r, groundBox.min.x + 10, groundBox.max.x - 10);
    const z = THREE.MathUtils.clamp(z0 + Math.sin(a) * r, groundBox.min.z + 10, groundBox.max.z - 10);

    down.set(new THREE.Vector3(x, groundBox.max.y + 60, z), new THREE.Vector3(0, -1, 0));
    // Insist on the road/map plate. The terrain backdrop is walkable too, but
    // it is flat dark ground — standing there shows none of the junction.
    let hit = down.intersectObjects(groundFast, false);
    if (!hit.length) {
      if (!fallback) {
        const w = down.intersectObjects(groundWide, false);
        if (w.length) fallback = { x, y: w[0].point.y, z, yaw: 0 };
      }
      continue;
    }
    const y = hit[0].point.y;
    if (!fallback) fallback = { x, y, z, yaw: 0 };

    up.set(new THREE.Vector3(x, y + 2.2, z), new THREE.Vector3(0, 1, 0));
    up.far = 12;
    if (up.intersectObjects(solid, true).length) continue;   // roof or slab overhead

    // face the emptiest direction from here
    let bestYaw = 0, bestDist = -1;
    for (let k = 0; k < 8; k++) {
      const yaw = (k / 8) * Math.PI * 2;
      probe.set(new THREE.Vector3(x, y + walk.eye, z), new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)));
      probe.far = 70;
      const b = probe.intersectObjects(solid, true);
      const d = b.length ? b[0].distance : 70;
      if (d > bestDist) { bestDist = d; bestYaw = yaw; }
    }
    return { x, y, z, yaw: bestYaw };
  }
  return fallback || { x: x0, y: streetY, z: z0, yaw: 0 };  // last resort: wherever we started
}
function exitWalk() {
  walk.on = false;
  controls.enabled = true;
  document.body.classList.remove('walking');
  if (document.pointerLockElement) document.exitPointerLock();
  controls.target.set(camera.position.x, walk.ground, camera.position.z - 60);
  controls.update();
}
/* ------------------------------------------------------------------- play */

/**
 * Third-person mode: a One Piece character on the street, with Elbaf's
 * movement numbers. Everything here is loaded lazily — the character rig and
 * the baked navmap are ~1.2 MB that a visitor who only wants to look at the
 * map from above should never pay for.
 */
const play = {
  on: false, loading: false,
  nav: null, chr: null, ctrl: null, cam: new ChaseCamera(),
  index: 0, jump: false, sprintHeld: false,
  held: new Set(), rollQueued: false,
  combat: null, queued: null,
  aimRay: new THREE.Raycaster(), aimDir: new THREE.Vector3(), chest: new THREE.Vector3(),
};

function syncModeButtons(active) {
  document.querySelectorAll('[data-mode]').forEach((b) =>
    b.classList.toggle('on', b.dataset.mode === active));
}

async function ensurePlayAssets(defIndex) {
  const def = CHARACTERS[defIndex];
  if (!play.nav) {
    setPlayStatus('Reading the street map…');
    play.nav = await NavMap.load('models/navmesh.png', 'models/navmesh.json');
  }
  if (!play.chr || play.chr.def.id !== def.id) {
    setPlayStatus(`Waking ${def.name}…`);
    const next = await Character.load(def, 'models/chars/', DEVICE.tier);
    if (play.chr) { scene.remove(play.chr.root); play.chr.dispose(); }
    play.chr = next;
    scene.add(next.root);
  }
  setPlayStatus('');
}

function setPlayStatus(text) {
  const el = document.getElementById('playStatus');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('on', !!text);
}

async function enterPlay() {
  if (play.loading) return;
  play.loading = true;
  try {
    await ensurePlayAssets(play.index);
  } catch (err) {
    setPlayStatus('Could not load the character.');
    console.error(err);
    play.loading = false;
    setMode('orbit');
    return;
  }
  play.loading = false;

  if (walk.on) exitWalk();
  play.on = true;
  controls.enabled = false;
  controls.autoRotate = false;

  if (!play.ctrl) play.ctrl = new CharacterController(play.nav);
  if (!play.combat) play.combat = new Combat(scene, DEVICE.tier);
  const c = coreBox.getCenter(new THREE.Vector3());
  play.ctrl.placeAt(c.x, c.z);
  play.cam.yaw = Math.PI * 0.15;
  play.cam.pitch = -0.18;
  camera.position.set(play.ctrl.pos.x, play.ctrl.pos.y + 6, play.ctrl.pos.z + 8);

  play.chr.root.visible = true;
  document.body.classList.add('playing');
  refreshCharChips();
  syncModeButtons('play');
}

function exitPlay() {
  play.on = false;
  play.held.clear();
  if (play.combat) play.combat.holdSlow = 1;
  document.body.classList.remove('playing');
  if (play.chr) play.chr.root.visible = false;
  controls.enabled = true;
  if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }
  if (play.ctrl) {
    controls.target.set(play.ctrl.pos.x, play.ctrl.pos.y + 1.2, play.ctrl.pos.z);
    controls.update();
  }
}

/**
 * Swap character without losing position or momentum.
 *
 * Requests that land while a previous swap is still fetching are remembered
 * rather than dropped — tapping Luffy -> Zoro -> Nami quickly used to leave you
 * on Zoro, because the second tap hit the `loading` guard and vanished with no
 * feedback at all.
 */
async function swapCharacter(delta) {
  if (!play.on) return;
  play.index = (play.index + delta + CHARACTERS.length) % CHARACTERS.length;
  refreshCharChips();
  if (play.loading) return;          // the in-flight loop below will catch up

  play.loading = true;
  try {
    // Keep loading until what is on screen is what was last asked for. Taps
    // that arrive mid-download just move the target; they are never dropped.
    while (!play.chr || play.chr.def.id !== CHARACTERS[play.index].id) {
      await ensurePlayAssets(play.index);
      play.chr.root.visible = true;
      refreshCharChips();
    }
  } finally {
    play.loading = false;
    refreshCharChips();
  }
}

const CHIP_SLOTS = ['strike', 'sustain', 'heavy', 'dash', 'ult', 'gear', 'guard'];

function refreshMoveChips() {
  const def = (play.chr && play.chr.def) || CHARACTERS[play.index];
  const kit = MOVES[def.style] || {};
  /* Short name plus the key, the way Elbaf labels them. "Gum-Gum Pistol" and
     six siblings are wider than a laptop window, so the row wrapped four deep
     and buried the view; the full name still arrives in the banner on cast and
     in the tooltip. */
  document.querySelectorAll('.movechip[data-move]').forEach((b) => {
    const mv = kit[b.dataset.move];
    b.classList.toggle('absent', !mv);
    if (!mv) { b.textContent = '—'; b.removeAttribute('title'); return; }
    b.innerHTML = `<kbd>${mv.key.replace(/^Key/, '')}</kbd>${mv.short || mv.name}`;
    b.title = mv.name;
    b.setAttribute('aria-label', mv.name);
  });
  // pad buttons keep their glyph but get the move name for screen readers
  document.querySelectorAll('.pad-btn[data-move]').forEach((b) => {
    const mv = kit[b.dataset.move];
    b.classList.toggle('absent', !mv);
    if (mv) b.setAttribute('aria-label', mv.name);
  });
}

function refreshCharChips() {
  document.querySelectorAll('[data-char]').forEach((b) =>
    b.classList.toggle('on', b.dataset.char === CHARACTERS[play.index].id));
  refreshMoveChips();
  const who = document.getElementById('who');
  if (who) {
    const d = CHARACTERS[play.index];
    who.innerHTML = `<b>${d.name}</b> · ${d.role}<span>${d.blurb}</span>`;
  }
}

function updatePlay(dt) {
  const k = walk.keys;
  let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  let mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
  if (walk.stick.active) { mx += walk.stick.x; mz -= walk.stick.y; }

  const sprint = !!(k.ShiftLeft || k.ShiftRight || play.sprintHeld);
  /* The LOADED character, not CHARACTERS[play.index]. The index flips the
     instant a chip is tapped but the rig takes a second to arrive, and using
     the index here meant firing Zoro's sword kit out of Luffy's body. */
  const def = play.chr.def;
  const c0 = play.ctrl;

  /* Gear Second multiplies speed and jump; a held Gatling divides speed. Both
     are folded in here rather than inside the controller, which stays a pure
     function of the stats it is handed. */
  const scaled = {
    speed: def.speed * play.combat.speedMul(),
    jump: def.jump * play.combat.jumpMul(),
  };
  play.ctrl.update(dt, { moveX: mx, moveZ: mz, sprint, jump: play.jump, yaw: play.cam.yaw }, scaled);
  play.jump = false;

  /* Aim exactly the way Elbaf does: a ray straight down the camera's forward
     axis, and the move lands at the first thing it meets (or at max range in
     open air). Only the map is tested — 8 meshes, once per cast, never per
     frame — so this costs nothing while simply running around. */
  // A held move (Gatling / Tatsumaki / Balloon) re-fires whenever its short
  // cooldown clears, and drags move speed down while it does.
  const kit = MOVES[def.style] || {};
  let slow = 1;
  for (const slot of play.held) {
    const mv = kit[slot];
    if (!mv) continue;
    if (mv.slow) slow = Math.min(slow, mv.slow);
    if (!play.queued && play.combat.ready(def, slot)) play.queued = slot;
  }
  play.combat.holdSlow = slow;

  if (play.rollQueued) {
    play.rollQueued = false;
    const d = new THREE.Vector3(c0.vel.x, 0, c0.vel.z);
    if (d.lengthSq() < 1e-4) d.set(Math.sin(c0.facing), 0, Math.cos(c0.facing));
    play.combat.startRoll(d);
  }

  if (play.queued) {
    const slot = play.queued; play.queued = null;
    camera.getWorldDirection(play.aimDir);
    play.chest.set(c0.pos.x, c0.pos.y + 1.05 * WORLD_SCALE, c0.pos.z);
    play.aimRay.set(play.chest, play.aimDir);
    play.aimRay.far = Math.max(1, (MOVES[def.style][slot] || {}).range || 1);
    const hits = mapRoot ? play.aimRay.intersectObject(mapRoot, true) : [];
    play.combat.cast(def, slot, play.chest, play.aimDir, hits[0] || null, c0);
    refreshMoveChips();
  }
  play.combat.update(dt, c0);

  play.chr.root.position.set(c0.pos.x, c0.pos.y, c0.pos.z);
  play.chr.root.rotation.y = c0.facing;
  play.chr.setGait(c0.gait(), c0.speedXZ);
  play.chr.setMove(play.combat.pose);
  play.chr.update(dt);

  play.cam.update(dt, camera, c0, play.nav, sprint && c0.speedXZ > 3 * WORLD_SCALE, occlusionGrid);

  /* Screen shake, same shape as Elbaf's: amplitude falls with the square of a
     decaying scalar, driven by three out-of-phase sines so it never reads as a
     regular wobble. Applied after the camera has been placed. */
  const sh = play.combat.shake;
  if (sh > 0.001) {
    const A = sh * sh * 0.9 * WORLD_SCALE;
    const t = performance.now() * 0.001;
    camera.position.x += Math.sin(t * 41) * A;
    camera.position.y += Math.sin(t * 53 + 1.7) * A * 0.7;
    camera.position.z += Math.sin(t * 47 + 3.1) * A;
  }
}

function setMode(m) {
  if (m === 'walk') { if (play.on) exitPlay(); if (!walk.on) enterWalk(); }
  else if (m === 'play') {
    // async: mark the button now, and enterPlay re-syncs (or falls back to orbit)
    if (!play.on) { syncModeButtons('play'); enterPlay(); return; }
  } else { if (walk.on) exitWalk(); if (play.on) exitPlay(); }
  syncModeButtons(play.on ? 'play' : walk.on ? 'walk' : 'orbit');
}

function sampleGround(force) {
  if (!force && (walk.tick++ % 3)) return;
  walk.ray.set(
    new THREE.Vector3(camera.position.x, groundBox.max.y + 60, camera.position.z),
    walk.down
  );
  let hit = walk.ray.intersectObjects(groundFast, false);
  if (!hit.length) hit = walk.ray.intersectObjects(groundWide, false);  // 10.8k tris, only on a miss
  // On a genuine miss, hold the last known height. Falling back to a constant
  // would drop the camera through the world at the edges of the plate.
  if (hit.length) walk.ground = hit[0].point.y;
}

addEventListener('keydown', (e) => {
  walk.keys[e.code] = true;
  if (e.code === 'KeyG' && !play.on) setMode(walk.on ? 'orbit' : 'walk');
  if (e.code === 'KeyP' && !e.repeat) setMode(play.on ? 'orbit' : 'play');
  if (e.code === 'Escape') { if (play.on) setMode('orbit'); else if (walk.on) setMode('orbit'); }
  if (play.on) {
    /* Bindings come from the move table itself rather than a second list, so
       a character whose kit lacks a slot simply has no key for it. */
    const kit = (play.chr && MOVES[play.chr.def.style]) || {};
    for (const slot of SLOTS) {
      const mv = kit[slot];
      if (!mv || mv.key !== e.code) continue;
      if (mv.hold) play.held.add(slot);
      else if (!e.repeat) play.queued = slot;
    }
    if (e.code === 'KeyC' && !e.repeat) play.rollQueued = true;     // Elbaf: C roll
    if (e.code === 'Space' && !e.repeat) play.jump = true;          // Elbaf: Space jumps
    if (e.code === 'Tab' || e.code === 'KeyZ') {                    // Elbaf: Tab/Z swaps
      if (!e.repeat) swapCharacter(1);
      e.preventDefault();
    }
  }
  if ((walk.on || play.on) && (e.code.startsWith('Arrow') || e.code === 'Space')) e.preventDefault();
});
addEventListener('keyup', (e) => {
  walk.keys[e.code] = false;
  const kit = (play.chr && MOVES[play.chr.def.style]) || {};
  for (const slot of SLOTS) if (kit[slot] && kit[slot].key === e.code) play.held.delete(slot);
});

/* ---------------------------------------------------------- input layer */

/**
 * Ported from Elbaf so both builds control identically. Its shape:
 *
 *   - ONE pointer layer over the canvas using pointer events (not touch
 *     events), so mouse, pen and finger all take the same path
 *   - anything inside a [data-ui-button] is a button, not input
 *   - on touch, a press in the LEFT HALF is the thumbstick; everything else
 *     looks. A press in the bottom-right PAD_W x PAD_H corner never becomes
 *     the stick, so a thumb that misses an action button cannot drag the
 *     joystick out from under the pad (it still looks — that is Elbaf's
 *     behaviour too)
 *   - stick radius 58 px, deadzone 0.12, and SPRINT engages past 0.8
 *     deflection rather than needing its own button
 *   - a MOUSE press that drifts under 7 px and lasts under 240 ms is an attack
 *
 * The constants are Elbaf's verbatim — they are what make it feel the same.
 */
const STICK_R = 58, STICK_DEAD = 0.12, STICK_SPRINT = 0.8;
const PAD_W = 250, PAD_H = 265;

const stickEl = document.getElementById('stick');
const knobEl = document.getElementById('knob');
const inputLayer = document.getElementById('input-layer');

const pointers = new Map();
let stickId = null;
const stickOrigin = { x: 0, y: 0 };

function inputActive() { return play.on || walk.on; }

function applyLook(dx, dy) {
  if (play.on) { play.cam.look(dx, dy); return; }
  walk.yaw -= dx * YAW_SENS;
  walk.pitch = THREE.MathUtils.clamp(walk.pitch - dy * PITCH_SENS, -1.35, 1.35);
}

function clearStick() {
  stickId = null;
  walk.stick.active = false;
  walk.stick.x = walk.stick.y = 0;
  play.sprintHeld = false;
  stickEl.classList.remove('on');
  knobEl.style.transform = '';
}

inputLayer.addEventListener('pointerdown', (e) => {
  if (!inputActive()) return;
  if (e.target.closest && e.target.closest('[data-ui-button]')) return;
  // Capture keeps a drag alive when the finger leaves the layer. It throws
  // NotFoundError for a pointer that is already gone, and that must not take
  // the rest of this handler down with it or the press registers as nothing.
  try { inputLayer.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }

  const inPad = e.clientX > innerWidth - PAD_W && e.clientY > innerHeight - PAD_H;
  const isStick = IS_TOUCH && e.clientX < innerWidth * 0.5 && !inPad;

  pointers.set(e.pointerId, {
    mode: isStick ? 'stick' : 'look',
    lastX: e.clientX, lastY: e.clientY,
    startT: performance.now(), drift: 0,
    mouse: e.pointerType === 'mouse',
  });

  if (isStick && stickId === null) {
    stickId = e.pointerId;
    stickOrigin.x = e.clientX; stickOrigin.y = e.clientY;
    walk.stick.active = true;
    stickEl.style.left = e.clientX + 'px';
    stickEl.style.top = e.clientY + 'px';
    stickEl.classList.add('on');
  }
});

inputLayer.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;

  if (p.mode === 'look') {
    applyLook(e.clientX - p.lastX, e.clientY - p.lastY);
    p.drift += Math.abs(e.clientX - p.lastX) + Math.abs(e.clientY - p.lastY);
    p.lastX = e.clientX; p.lastY = e.clientY;
    return;
  }
  if (e.pointerId !== stickId) return;

  let dx = e.clientX - stickOrigin.x, dy = e.clientY - stickOrigin.y;
  const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx = dx / d * STICK_R; dy = dy / d * STICK_R; }
  const nx = dx / STICK_R, ny = dy / STICK_R;
  const mag = Math.hypot(nx, ny);
  if (mag < STICK_DEAD) {
    walk.stick.x = 0; walk.stick.y = 0; play.sprintHeld = false;
  } else {
    walk.stick.x = nx; walk.stick.y = ny;
    play.sprintHeld = mag > STICK_SPRINT;      // push far = run, no extra button
  }
  knobEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
});

function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (p && p.mode === 'look' && p.mouse && p.drift < 7 && performance.now() - p.startT < 240) {
    if (play.on) play.queued = 'light';        // Elbaf: a mouse tap is a pistol
  }
  pointers.delete(e.pointerId);
  if (e.pointerId === stickId) clearStick();
}
inputLayer.addEventListener('pointerup', endPointer);
inputLayer.addEventListener('pointercancel', endPointer);

function updateWalk(dt) {
  const k = walk.keys;
  let fx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  let fz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  if (walk.stick.active) { fx += walk.stick.x; fz += walk.stick.y; }

  const run = k.ShiftLeft || k.ShiftRight ? 4.2 : 1;
  const speed = 34 * run;
  const len = Math.hypot(fx, fz) || 1;
  if (Math.hypot(fx, fz) > 0.03) { fx /= len; fz /= len; } else { fx = fz = 0; }

  const sin = Math.sin(walk.yaw), cos = Math.cos(walk.yaw);
  const wantX = (fx * cos - fz * sin) * speed;
  const wantZ = (fx * sin + fz * cos) * speed;
  walk.vel.x += (wantX - walk.vel.x) * Math.min(1, dt * 9);
  walk.vel.z += (wantZ - walk.vel.z) * Math.min(1, dt * 9);

  camera.position.x += walk.vel.x * dt;
  camera.position.z += walk.vel.z * dt;

  // stay over ground that exists, rather than sailing off the edge of the world
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, groundBox.min.x + 4, groundBox.max.x - 4);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, groundBox.min.z + 4, groundBox.max.z - 4);

  sampleGround(false);
  const wantY = walk.ground + walk.eye;
  camera.position.y += (wantY - camera.position.y) * Math.min(1, dt * 6);

  camera.quaternion.setFromEuler(new THREE.Euler(walk.pitch, walk.yaw, 0, 'YXZ'));
}

/* ------------------------------------------------------- adaptive resolution */

let renderScale = DEVICE.tier === 'hi' ? 1.0 : 0.8;
const MIN_SCALE = DEVICE.tier === 'hi' ? 0.55 : 0.45, MAX_SCALE = 1.0;
/* A phone at devicePixelRatio 3 asks for nine times the fragments of a 1x
   buffer for a screen you hold at arm's length. Cap the low tier at 1.5 —
   combined with the adaptive scale below the floor is 0.68x native, which is
   still sharper than most native mobile games render at. */
const basePR = Math.min(window.devicePixelRatio || 1, DEVICE.tier === 'hi' ? 2 : 1.5);
let frames = 0, accum = 0, sinceAdjust = 0;

function applySize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(basePR * renderScale);
  renderer.setSize(w, h, false);
}
addEventListener('resize', applySize);
addEventListener('orientationchange', () => setTimeout(applySize, 250));
applySize();

const fpsEl = document.getElementById('fps');

/**
 * Takes the wall-clock interval between frames, NOT the time spent inside the
 * frame. Measuring our own work reports a meaningless "300 fps" on any machine
 * that is actually vsync-bound, and hides the case this exists to catch: the
 * GPU missing the refresh while the JS side looks idle.
 */
function adapt(frameMs) {
  accum += frameMs; frames++; sinceAdjust++;
  if (frames < 30) return;
  const avg = accum / frames;
  accum = 0; frames = 0;

  // two rAF callbacks can land in the same millisecond, which makes avg 0
  const shown = Math.min(999, Math.round(1000 / Math.max(avg, 1)));
  /* The render-scale figure is in its own element so a narrow phone can drop it
     without losing the frame rate: at 360 px the two together push the readout
     off the right edge of the top bar. */
  if (fpsEl) fpsEl.innerHTML = `${shown} fps<span class="fps-scale"> · ${Math.round(renderScale * 100)}%</span>`;

  if (sinceAdjust < 2) return;
  const prev = renderScale;
  if (avg > TARGET_MS * 1.35 && renderScale > MIN_SCALE) renderScale = Math.max(MIN_SCALE, renderScale - 0.1);
  else if (avg < TARGET_MS * 0.85 && renderScale < MAX_SCALE) renderScale = Math.min(MAX_SCALE, renderScale + 0.05);
  if (prev !== renderScale) { applySize(); sinceAdjust = 0; }
}

/* --------------------------------------------------------------------- HUD */

const ui = document.getElementById('ui');
document.querySelectorAll('[data-mode]').forEach((b) =>
  b.addEventListener('click', () => setMode(b.dataset.mode)));

/* Crew chips pick a character directly rather than cycling. */
document.querySelectorAll('[data-char]').forEach((b) =>
  b.addEventListener('click', () => {
    const i = CHARACTERS.findIndex((c) => c.id === b.dataset.char);
    if (i < 0 || i === play.index) return;
    if (!play.on) { play.index = i; refreshCharChips(); setMode('play'); return; }
    swapCharacter(i - play.index);
  }));

/* Touch action pad. Pointer events rather than click so JUMP fires on press
   and RUN can be held; both also cancel on pointercancel, which iOS fires
   whenever the gesture is stolen by a scroll or a system edge swipe. */
const jumpBtn = document.getElementById('jumpBtn');
if (jumpBtn) {
  jumpBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); play.jump = true; jumpBtn.classList.add('held');
  });
  const releaseJump = () => jumpBtn.classList.remove('held');
  jumpBtn.addEventListener('pointerup', releaseJump);
  jumpBtn.addEventListener('pointercancel', releaseJump);
  jumpBtn.addEventListener('pointerleave', releaseJump);
}
/* Elbaf's mobile rule for the strike button: a tap fires the strike, holding
   it past HOLD_MS switches to the sustained version (Gatling / Tatsumaki) and
   keeps firing until release. Buttons without data-hold are plain taps. */
const HOLD_MS = 260;
document.querySelectorAll('[data-move]').forEach((b) => {
  let timer = null;
  const down = (e) => {
    e.preventDefault();
    b.classList.add('held');
    const holdSlot = b.dataset.hold;
    if (holdSlot) {
      timer = setTimeout(() => { timer = null; play.held.add(holdSlot); }, HOLD_MS);
    }
    play.queued = b.dataset.move;
  };
  const up = () => {
    b.classList.remove('held');
    if (timer) { clearTimeout(timer); timer = null; }
    if (b.dataset.hold) play.held.delete(b.dataset.hold);
  };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
});

const rollBtn = document.querySelector('[data-roll]');
if (rollBtn) rollBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault(); play.rollQueued = true;
  rollBtn.classList.add('held');
  setTimeout(() => rollBtn.classList.remove('held'), 160);
});


document.getElementById('reset').addEventListener('click', () => {
  if (walk.on) setMode('orbit');
  frameMap();
});
function syncSkyButtons() {
  document.querySelectorAll('[data-sky]').forEach((b) =>
    b.classList.toggle('on', weather && b.dataset.sky === weather.name));
}
document.querySelectorAll('[data-sky]').forEach((b) =>
  b.addEventListener('click', () => {
    if (!weather) return;
    weather.set(b.dataset.sky);
    try { localStorage.setItem('hledan-sky', b.dataset.sky); } catch (e) { /* private mode */ }
    syncSkyButtons();
  }));

/* Sound. The click is the gesture that builds the AudioContext, which is both
   what the autoplay policy wants and what we want anyway: nothing is allocated
   for a visitor who never asks for it.

   The preference is deliberately NOT remembered. Every visit starts silent, so
   a page that made noise last time cannot make noise before you have asked it
   to — which is the whole point, and worth one extra click to a returning
   visitor. */
const soundBtn = document.getElementById('soundBtn');
if (soundBtn) {
  const syncSound = () => {
    soundBtn.classList.toggle('on', sound.enabled);
    soundBtn.setAttribute('aria-pressed', sound.enabled ? 'true' : 'false');
    soundBtn.textContent = sound.enabled ? '♪ Sound' : '♪ Muted';
  };
  soundBtn.addEventListener('click', () => { sound.toggle(); syncSound(); });
  syncSound();
}

const spinBtn = document.getElementById('spin');
spinBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  spinBtn.classList.toggle('on', controls.autoRotate);
});
document.getElementById('full').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
const infoPanel = document.getElementById('info');
document.getElementById('infoBtn').addEventListener('click', () => infoPanel.classList.toggle('open'));
document.getElementById('infoClose').addEventListener('click', () => infoPanel.classList.remove('open'));

document.getElementById('tier').textContent =
  `${DEVICE.tier === 'hi' ? '2048' : '1024'} textures · ${DEVICE.cores} cores`;

/* Pause the loop when the tab is hidden — no point burning a phone battery. */
let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) { last = performance.now(); requestAnimationFrame(loop); }
});
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); running = false;
  loadMsg && (loadMsg.textContent = 'Graphics context lost — reload the page.');
});

/* -------------------------------------------------------------------- loop */

const bannerEl = () => document.getElementById('moveBanner');
function paintCombatHud() {
  const def = (play.chr && play.chr.def) || CHARACTERS[play.index];
  document.querySelectorAll('[data-move]').forEach((b) => {
    const k = play.combat.cooldown(def, b.dataset.move);
    if (b.classList.contains('movechip')) b.style.setProperty('--cd', (k * 100).toFixed(0) + '%');
    b.classList.toggle('cooling', k > 0.001);
  });
  const el = bannerEl();
  if (el) {
    if (play.combat.bannerT > 0) {
      if (el.textContent !== play.combat.banner) el.textContent = play.combat.banner;
      el.style.opacity = Math.min(1, play.combat.bannerT / 0.45).toFixed(2);
    } else if (el.style.opacity !== '0') el.style.opacity = '0';
  }
}

/* Small inspection surface — handy from the console when tuning the scene. */
window.__hledan = { THREE, scene, camera, renderer, controls, walk, sound,
                    get props() { return props; }, get weather() { return weather; },
                    get box() { return mapBox; }, get ground() { return groundBox; },
                    get streetY() { return streetY; }, device: DEVICE,
                    get scale() { return renderScale; }, play, CHARACTERS, IS_TOUCH,
                    get stickOn() { return walk.stick.active; }, get stickVec() { return {x: walk.stick.x, y: walk.stick.y}; },
                    /* drive N frames by hand — the render loop is rAF-driven and
                       rAF does not fire in a hidden tab, which makes headless
                       verification of the character controller impossible. */
                    step(n = 1, ms = 16.7) {
                      for (let i = 0; i < n; i++) { last = performance.now() - ms; loop(performance.now()); }
                      return { pos: play.ctrl && play.ctrl.pos.toArray().map(v => +v.toFixed(2)) };
                    } };

let last = performance.now();
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  const frameMs = now - last;
  let dt = Math.min(frameMs / 1000, 0.1);
  const realDt = dt;                       // unfrozen, for anything hit stop must not touch
  last = now;

  /* Hit stop. A heavy move buys a few hundredths of a second in which the world
     stops moving, which is most of why it lands heavy — a big effect with no
     pause in front of it just reads as a bigger effect. Weather, sound and the
     spin keep their real dt: freezing the rain and cutting the audio would give
     the pause away as a stutter rather than an impact. */
  if (play.on && play.combat && play.combat.hitStop > 0) {
    const bite = Math.min(play.combat.hitStop, dt);
    play.combat.hitStop -= bite;
    dt = Math.max(0, dt - bite);
  }

  if (play.on && play.ctrl && play.chr) updatePlay(dt);
  else if (walk.on) updateWalk(dt);
  else controls.update();

  if (play.on && play.combat) paintCombatHud();
  if (weather) weather.update(realDt, camera);
  if (sound.enabled) sound.update(realDt, camera.position, { rain: weather ? weather.cur.rain : 0, flash: weather ? weather.flash : 0,
      traffic: weather ? weather.cur.traffic : 1 });
  sky.position.copy(camera.position);
  skirt.position.x = camera.position.x;
  skirt.position.z = camera.position.z;
  renderer.render(scene, camera);
  adapt(frameMs);
}
requestAnimationFrame(loop);

refreshCharChips();

if (REDUCED_MOTION) controls.autoRotate = false;
else { controls.autoRotate = true; spinBtn.classList.add('on'); }
