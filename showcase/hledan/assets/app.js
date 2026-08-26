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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ------------------------------------------------------------------ device */

const UA = navigator.userAgent;
const IS_TOUCH = matchMedia('(hover: none) and (pointer: coarse)').matches;
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
    },
    vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 nadir; varying vec3 vW;
      void main(){
        float h = normalize(vW).y;
        vec3 c = h > 0.0
          ? mix(horizon, zenith, pow(h, 0.42))     // haze hugs the horizon, blue climbs fast
          : mix(horizon, nadir,  pow(-h, 0.30));   // and falls away to slate below
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
scene.add(new THREE.HemisphereLight(0xdcebff, 0x9a8b74, 2.7));
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.05);
sun.position.set(-420, 560, 300);
scene.add(sun);

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
const ANISO = Math.min(DEVICE.tier === 'hi' ? 8 : 4, anisoMax);
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
/* Raycast targets are split by cost. The road plane and the map plate together
   are 8.4k triangles and cover the junction; the terrain backdrop is another
   10.8k and is only consulted when the cheap pair misses. */
const groundFast = [];
const groundWide = [];
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
    });

    scene.add(mapRoot);
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
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.7;
controls.screenSpacePanning = false;
controls.minDistance = 40;
controls.maxDistance = 2400;
controls.maxPolarAngle = Math.PI * 0.495;   // never dip under the ground plane
controls.autoRotateSpeed = 0.28;

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
function setMode(m) {
  if (m === 'walk' && !walk.on) enterWalk();
  else if (m === 'orbit' && walk.on) exitWalk();
  document.querySelectorAll('[data-mode]').forEach((b) =>
    b.classList.toggle('on', b.dataset.mode === (walk.on ? 'walk' : 'orbit')));
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
  if (e.code === 'KeyG') setMode(walk.on ? 'orbit' : 'walk');
  if (e.code === 'Escape' && walk.on) setMode('orbit');
  if (walk.on && (e.code.startsWith('Arrow') || e.code === 'Space')) e.preventDefault();
});
addEventListener('keyup', (e) => { walk.keys[e.code] = false; });

/* Mouse look. Uses pointer lock where it is granted, and falls back to
   press-and-drag where it is not (sandboxed frames, some embedded browsers). */
let dragging = false;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (walk.on && e.button === 0 && !document.pointerLockElement) dragging = true;
});
addEventListener('mouseup', () => { dragging = false; });

addEventListener('mousemove', (e) => {
  if (!walk.on) return;
  const locked = !!document.pointerLockElement;
  if (!locked && !dragging) return;
  const dx = locked ? e.movementX : e.movementX;
  const dy = locked ? e.movementY : e.movementY;
  walk.yaw -= dx * 0.0022;
  walk.pitch = THREE.MathUtils.clamp(walk.pitch - dy * 0.0022, -1.35, 1.35);
});

/* Touch: left third of the screen is a thumbstick, everywhere else looks. */
const stickEl = document.getElementById('stick');
const knobEl = document.getElementById('knob');

renderer.domElement.addEventListener('touchstart', (e) => {
  if (!walk.on) return;
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.42 && walk.stick.id === -1) {
      walk.stick.id = t.identifier; walk.stick.active = true;
      walk.stick.ox = t.clientX; walk.stick.oy = t.clientY;
      stickEl.style.left = t.clientX + 'px';
      stickEl.style.top = t.clientY + 'px';
      stickEl.classList.add('on');
    } else if (walk.look.id === -1) {
      walk.look.id = t.identifier; walk.look.x = t.clientX; walk.look.y = t.clientY;
    }
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (!walk.on) return;
  for (const t of e.changedTouches) {
    if (t.identifier === walk.stick.id) {
      const dx = t.clientX - walk.stick.ox, dy = t.clientY - walk.stick.oy;
      const d = Math.min(Math.hypot(dx, dy), 52) || 0;
      const a = Math.atan2(dy, dx);
      walk.stick.x = (Math.cos(a) * d) / 52;
      walk.stick.y = (Math.sin(a) * d) / 52;
      knobEl.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`;
    } else if (t.identifier === walk.look.id) {
      walk.yaw -= (t.clientX - walk.look.x) * 0.005;
      walk.pitch = THREE.MathUtils.clamp(walk.pitch - (t.clientY - walk.look.y) * 0.005, -1.35, 1.35);
      walk.look.x = t.clientX; walk.look.y = t.clientY;
    }
  }
}, { passive: true });

function endTouch(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === walk.stick.id) {
      walk.stick.id = -1; walk.stick.active = false; walk.stick.x = walk.stick.y = 0;
      stickEl.classList.remove('on'); knobEl.style.transform = '';
    }
    if (t.identifier === walk.look.id) walk.look.id = -1;
  }
}
renderer.domElement.addEventListener('touchend', endTouch, { passive: true });
renderer.domElement.addEventListener('touchcancel', endTouch, { passive: true });

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

let renderScale = DEVICE.tier === 'hi' ? 1.0 : 0.85;
const MIN_SCALE = 0.55, MAX_SCALE = IS_TOUCH ? 1.0 : 1.0;
const basePR = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 2 : 2);
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

  if (fpsEl) fpsEl.textContent = `${Math.round(1000 / avg)} fps · ${Math.round(renderScale * 100)}%`;

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

document.getElementById('reset').addEventListener('click', () => {
  if (walk.on) setMode('orbit');
  frameMap();
});
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

/* Small inspection surface — handy from the console when tuning the scene. */
window.__hledan = { THREE, scene, camera, renderer, controls, walk,
                    get box() { return mapBox; }, get ground() { return groundBox; },
                    get streetY() { return streetY; }, device: DEVICE,
                    get scale() { return renderScale; } };

let last = performance.now();
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  const frameMs = now - last;
  const dt = Math.min(frameMs / 1000, 0.1);
  last = now;

  if (walk.on) updateWalk(dt);
  else controls.update();

  sky.position.copy(camera.position);
  skirt.position.x = camera.position.x;
  skirt.position.z = camera.position.z;
  renderer.render(scene, camera);
  adapt(frameMs);
}
requestAnimationFrame(loop);

if (REDUCED_MOTION) controls.autoRotate = false;
else { controls.autoRotate = true; spinBtn.classList.add('on'); }
