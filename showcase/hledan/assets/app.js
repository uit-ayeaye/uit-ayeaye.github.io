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
import { MapColliders, InteriorMask } from './collision.js';
import { StreetProps, loadVehicleGeometry } from './props.js';
import { Soundscape } from './audio.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  CHARACTERS, NavMap, Character, CharacterController, ChaseCamera,
  YAW_SENS, PITCH_SENS, WORLD_SCALE,
  BODY_RADIUS, BODY_HEIGHT, STEP_UP,
} from './character.js';
import { Weather, PRESETS } from './weather.js';
import { LedBoard } from './ledboard.js';
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
  /* ?tier=lo / ?tier=hi pins the choice. The probe is a guess about a device it
     cannot see, and there was no way to look at what a phone actually gets
     without holding a phone: the low tier picks different materials, different
     textures, a coarser sky and a coarser collision grid, and none of that was
     reachable from a desktop. It is also the honest answer when the probe is
     wrong about a particular machine in either direction. */
  const forced = new URLSearchParams(location.search).get('tier');
  const tier = forced === 'lo' || forced === 'hi' ? forced : (score >= need ? 'hi' : 'lo');
  return { tier, cores, mem, gpu, score, need, forced: !!forced && forced === tier };
}

document.body.classList.toggle('touch', IS_TOUCH);

const DEVICE = probeDevice();
/* 60 on both tiers. The low tier used to aim at 45, which is a self-fulfilling
   budget: the scaler stops giving pixels back the moment the frame fits, so a
   phone that could have held 55 sat at 45 by construction and looked softer
   than it needed to for the privilege. */
const TARGET_MS = 1000 / 60;

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
  /* The dome is shaded entirely in the fragment stage — the vertices carry
     nothing but a direction — so its tessellation buys precisely nothing and
     the low tier takes a quarter of it. */
  new THREE.SphereGeometry(6000, DEVICE.tier === 'hi' ? 32 : 16, DEVICE.tier === 'hi' ? 16 : 8),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    /* fbm's amplitude series sums to 1 - 2^-n, so two octaves land at 0.75 of
       four octaves' range; NORM puts them back on the same scale so cloudSharp
       and the 0.52 threshold mean the same thing on both tiers. */
    defines: DEVICE.tier === 'hi'
      ? { OCTAVES: 4, NORM: '1.067' }
      : { OCTAVES: 2, NORM: '1.333' },
    uniforms: {
      zenith: { value: SKY_ZENITH },
      horizon: { value: SKY_HORIZON },
      nadir: { value: SKY_NADIR },
      cloud: { value: new THREE.Color(0xffffff) },
      cloudAmt: { value: 0 },
      cloudSharp: { value: 0.16 },
      glow: { value: new THREE.Color(0xff9a4a) },
      glowAmt: { value: 0 },
      t: { value: 0 },
    },
    vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 nadir;
      uniform vec3 cloud; uniform float cloudAmt; uniform float cloudSharp; uniform float t;
      uniform vec3 glow; uniform float glowAmt;
      varying vec3 vW;

      /* Value noise + fbm. Clouds cost nothing but arithmetic: they live in the
         sky sphere that was already being drawn, so there is no extra geometry,
         no extra draw call and no texture to download.

         Arithmetic is not free on a phone, though. The hash is deliberately
         sin-free: fract(sin(dot(...))) is the textbook one-liner and it was
         costing FOUR transcendentals per noise lookup — at four octaves, twice
         over, that is 32 sin() calls for every sky pixel on screen, and sin
         runs at quarter rate on mobile. This version is pure multiply-fract,
         and OCTAVES drops to two on the low tier, where the second fbm layer
         is skipped as well. */
      float hash(vec2 p){
        vec3 q = fract(vec3(p.xyx) * 0.1031);
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int k = 0; k < OCTAVES; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
        return v * NORM;
      }

      void main(){
        vec3 d = normalize(vW);
        float h = d.y;
        vec3 c = h > 0.0
          ? mix(horizon, zenith, pow(h, 0.42))     // haze hugs the horizon, blue climbs fast
          : mix(horizon, nadir,  pow(-h, 0.30));   // and falls away to slate below

        /* Light pollution. A city throws a warm dome up off its own streets,
           strongest just over the rooftops and gone by halfway up the sky —
           which is why a real night horizon is orange-brown rather than the
           deep blue directly overhead. Added, not mixed: it is light. */
        if (glowAmt > 0.001) {
          c += glow * glowAmt * pow(max(0.0, 1.0 - abs(h) * 2.6), 2.4);
        }

        if (cloudAmt > 0.001 && h > 0.02) {
          /* Project onto a flat deck at a fixed height so the cloud sheet
             stretches toward the horizon the way a real overcast does, instead
             of wrapping evenly round the dome like a texture on a ball. */
          vec2 uv = d.xz / max(h, 0.02) * 0.55;
          float n = fbm(uv + vec2(t * 0.013, t * 0.007));
          #if OCTAVES > 2
            n = mix(n, fbm(uv * 1.9 - vec2(t * 0.021, 0.0)), 0.45);
          #endif
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
/**
 * `selfLit` is how much of its own albedo a surface gives back after dark.
 *
 * A city at night is not a dark city with bright lamps in it — every wall is
 * throwing back some fraction of the light falling on it from a hundred
 * sources too small to model. Binding each material's own colour map as its
 * emissive map and letting the weather drive the intensity buys exactly that
 * for one multiply in the shader: at night the buildings carry a warm wash of
 * their own texture, and the whole map reads as lit rather than as geometry
 * standing in the dark. The terrain backdrop barely participates — it is
 * fields, and fields do not glow.
 */
const RECIPES = {
  'Building':      { map: tierDir + 'building_basecolor.webp',    rough: 'textures/building_roughness.webp', cutout: true, selfLit: 1.0 },
  'Environment':   { map: tierDir + 'environment_basecolor.webp', roughness: 0.96,                           cutout: true, selfLit: 0.16 },
  'Hledan_Center': { map: tierDir + 'hledan_basecolor.webp',      rough: 'textures/hledan_roughness.webp',   cutout: true, selfLit: 1.0 },
  'Road texture':  { map: 'textures/road_basecolor.webp',         roughness: 0.85,                           cutout: false, selfLit: 0.6 },
};

function buildMaterial(name) {
  const r = RECIPES[name];
  if (!r) return new THREE.MeshLambertMaterial({ color: 0x9aa6b8 });

  const map = colorMap(r.map);
  const common = {
    map,
    side: THREE.DoubleSide,
    alphaTest: r.cutout ? 0.5 : 0,   // test, not blend: no sorting, no blend overdraw
    transparent: false,
    name,
    /* Bound at construction, not on the first night, so the preset switch is a
       uniform write rather than a shader recompile mid-fade. */
    emissiveMap: map,
    emissive: new THREE.Color(0xffd9b0),
    emissiveIntensity: 0,
  };
  const mat = DEVICE.tier === 'hi'
    ? new THREE.MeshStandardMaterial({
        ...common,
        metalness: 0.0,
        roughness: r.roughness ?? 1.0,
        roughnessMap: r.rough ? dataMap(r.rough) : null,
      })
    : new THREE.MeshLambertMaterial(common);
  mat.userData.selfLit = r.selfLit ?? 0;
  return mat;
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
const buildings = [];               // walls, for the lit-window pass
const colliderMeshes = [];          // the map's solid meshes, for MapColliders
let props = null;                   // instanced street furniture
let ledBoard = null;                // the Jolly Roger, on Hledan Centre's screen

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

      /* Anything with walls the window pass can hang lights on. The two
         building materials cover the shophouses and the towers; the trees and
         the terrain backdrop are excluded for the obvious reason. */
      if ((name === 'Building' || name === 'Hledan_Center') && !/^Tree\(/.test(o.name)) {
        buildings.push(o);
      }

      /* Collision AND chase-camera occlusion, from one set: everything the map
         is built from EXCEPT the trees. The author's own name for that mesh is
         the specification — the baked navmap included the canopies and left
         invisible walls all over the pavements under them, and pulling the
         camera in every time a branch crossed the sightline would be the same
         mistake with a different symptom.

         The terrain backdrop stays IN, which the old occluder set got wrong:
         `Environment` is not just ground. It carries the embankments, the kerb
         faces — and the flyover's piers, so excluding it put the eye inside a
         pier every time you walked under the bridge, with nothing to push it
         back out and the screen full of grey slab.

         Match the tree mesh on a pattern, not the authored string: GLTF import
         rewrites names, so "Tree(No collider)" arrives as "Tree(No_collider)"
         and an equality test against the .blend name silently lets it through. */
      if (!/^Tree\(/.test(o.name)) colliderMeshes.push(o);
    });

    scene.add(mapRoot);
    props = new StreetProps({ scene, tier: DEVICE.tier });

    /* The real car model lands after the map is already interactive. If it
       fails — offline, blocked, moved — the procedurally built one it would
       have replaced simply stays, so the street is never short of traffic. */
    for (const v of [
      { file: 'car-quaternius.glb', kind: 'taxi', bodyMat: 'LightBlue', size: [1.78, 1.52, 4.40] },
      { file: 'bus-poly.glb',       kind: 'bus',  bodyMat: 'Mat',       size: [2.50, 3.20, 11.5],
        /* YBS runs flat single colours, and the fleet is genuinely mixed: the
           blues and the pale green are the ones you see most at Hledan. */
        liveries: [0x1f5fa8, 0x2f8f4e, 0xd8482c, 0xe0a52a] },
    ]) {
      loadVehicleGeometry(`models/vehicles/${v.file}`, { bodyMat: v.bodyMat, size: v.size, tier: DEVICE.tier })
        .then((loaded) => { if (props) props.replaceVehicle(v.kind, loaded, v.liveries); })
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

    /* Light the city's windows. Needs streetY, so it runs here rather than in
       the StreetProps constructor; one pass over the building geometry. */
    mapRoot.updateMatrixWorld(true);
    const t0 = performance.now();
    const lit = props.buildWindows(buildings, streetY, DEVICE.tier);
    const signs = props.buildNeon(buildings, streetY, DEVICE.tier);
    console.info(`hledan: ${lit} lit windows + ${signs} signs in ${(performance.now() - t0).toFixed(0)} ms`);

    /* The billboard on Hledan Centre. Its position is measured off the facade
       and baked, so it needs nothing from the map but the scene to sit in. */
    ledBoard = new LedBoard({ scene, THREE, tier: DEVICE.tier });
    /* The map's own materials, compiled while the loading screen is still up
       rather than on the first frame the visitor sees. */
    requestAnimationFrame(() => precompile());
    /* The scene is up, so the hint now has something to be read against. */
    showHintFor();

    weather = new Weather({
      scene, renderer, sky, hemi, ambient, sun, skirt, props, led: ledBoard,
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
/* Zoom where the pointer is, not where the pivot happens to be. On a map this
   wide the difference is the whole feel of it: without this, closing in on the
   billboard means zoom, re-orbit, zoom, re-orbit. */
controls.zoomToCursor = true;
/* Spelled out rather than left on the defaults, because the defaults are what
   they are and this is a contract with the visitor: one finger turns the model,
   two pinch and slide it. Same on a trackpad — drag orbits, two-finger scroll
   zooms, right-drag or shift-drag slides. */
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN,
};
controls.enablePan = true;
/* Panning in screen space is what a visitor expects from a drag — the world
   should follow the finger. The ground-plane version slides faster the higher
   the camera is, which over a map this tall reads as the model running away. */
controls.screenSpacePanning = true;
/* A full upper hemisphere: straight down to dead level, and all the way round.
   Below level is not a view of this map, it is a view of the back of the plate
   it is printed on — the earlier attempt at 0.56 put exactly that in frame. */
controls.maxPolarAngle = Math.PI * 0.499;
controls.minPolarAngle = 0.02;
/* 40 was far enough away that nothing on the map could be looked AT — the
   board is 16 units across and the mall doorway smaller. */
controls.minDistance = 14;

/**
 * The views worth being taken to.
 *
 * A showcase is not only a model to be spun; most visitors will never find the
 * billboard or the underside of the flyover by dragging. Each entry is a camera
 * position and the point it looks at, measured off the map, and the flight
 * between them is eased rather than cut so the eye keeps its bearings.
 *
 * Two of these used to be aimed at nothing.
 *
 * `tower` looked at (-96, 470), ninety units off the tower, which actually
 * stands at (-64, 546) and rises to 197 — so the eye at (30, 560) was pressed
 * against its glass and the left half of the screen was a curtain wall. And
 * `street` stood in the underpass, which is how a visitor's first look at this
 * map came to be a dark tunnel with buses parked in it.
 *
 * Both were re-measured against the geometry rather than guessed: the tower's
 * position from the roof triangles above y=95, the street stance from a road
 * anchor with a 230-unit clear sightline and nothing overhead for the first
 * hundred units of the shot.
 *
 * `deck` is new, and it is the one the map had been missing: seven hundred units
 * of elevated carriageway that until now carried no traffic at all.
 */
const VIEWPOINTS = {
  junction: { eye: [188, 214, 486], at: [-24, 58, 300] },
  board:    { eye: [-47, 95, 392],  at: [-81, 92, 418] },
  deck:     { eye: [46, 86, 58],    at: [-6, 64, 262] },
  flyover:  { eye: [96, 92, 232],   at: [-6, 62, 214] },
  tower:    { eye: [112, 132, 398], at: [-52, 108, 528] },
  street:   { eye: [-46, 52, 262],  at: [-50, 58, 360] },
};
/* One flight at a time; a second click retargets the one in the air. */
let flight = null;
/* Which viewpoint the row is showing as chosen, so a second tap on the same
   chip can mean "just put me there" rather than fly the same arc again. */
let atView = null;
const _flyFrom = new THREE.Vector3(), _flyTo = new THREE.Vector3();
const _flyFromT = new THREE.Vector3(), _flyToT = new THREE.Vector3();

/**
 * Take the visitor to one of the views worth seeing.
 *
 * Three things this now does that it did not:
 *
 * It works from walk and play. The row is only DRAWN in orbit, but a viewpoint
 * is a place on the map, not a mode — and asking for one while running around
 * on the ground obviously means "show me that", so it returns to orbit and
 * flies. Before, the only route was Orbit, then the chip: two taps, and the
 * first one dumped you wherever the orbit camera happened to be pointing.
 *
 * It answers the tap immediately. The chip lights the moment it is pressed
 * rather than when the camera arrives, and the flight is 0.8s rather than 1.5 —
 * long enough to keep your bearings, short enough that the button feels
 * connected to the picture.
 *
 * And tapping the chip you are already on is a cut, not a flight. A second tap
 * on the same viewpoint means you have drifted off it and want it back, and
 * re-flying the arc you just watched is the slow answer to that.
 */
function flyTo(name) {
  const v = VIEWPOINTS[name];
  if (!v) return;
  /* A viewpoint is a place, not a mode: asking for one from the ground means
     come back up and go there. */
  if (walk.on || play.on) setMode('orbit');
  controls.autoRotate = false;
  document.getElementById('spin')?.classList.remove('on');
  const again = atView === name && !flight;
  _flyFrom.copy(camera.position);
  _flyFromT.copy(controls.target);
  _flyTo.set(v.eye[0], v.eye[1], v.eye[2]);
  _flyToT.set(v.at[0], v.at[1], v.at[2]);
  if (again) {
    camera.position.copy(_flyTo);
    controls.target.copy(_flyToT);
    controls.update();
    flight = null;
  } else {
    flight = { t: 0, dur: 0.8 };
  }
  markView(name);
}

/** The row's selected state, kept in one place so nothing can half-set it. */
function markView(name) {
  atView = name;
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.classList.toggle('on', b.dataset.view === name));
}

/**
 * Keyboard orbit, for a laptop without a mouse.
 *
 * A trackpad can orbit and zoom but it is a poor instrument for either, and
 * arrow keys are dead in this mode anyway — walk and play own them, and neither
 * is running. Applied through the controls' own spherical maths rather than by
 * moving the camera, so damping, the distance limits and the polar clamps all
 * still hold.
 */
const _orbSph = new THREE.Spherical(), _orbOff = new THREE.Vector3();
function updateOrbitKeys(dt) {
  const k = walk.keys;
  const yaw = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
  const pit = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0);
  const zoom = (k.Minus || k.NumpadSubtract ? 1 : 0) - (k.Equal || k.NumpadAdd ? 1 : 0);
  if (!yaw && !pit && !zoom) return false;
  controls.autoRotate = false;
  document.getElementById('spin')?.classList.remove('on');
  markView(null);
  _orbOff.copy(camera.position).sub(controls.target);
  _orbSph.setFromVector3(_orbOff);
  _orbSph.theta -= yaw * dt * 0.9;
  _orbSph.phi = THREE.MathUtils.clamp(_orbSph.phi + pit * dt * 0.7,
                                      controls.minPolarAngle, controls.maxPolarAngle);
  _orbSph.radius = THREE.MathUtils.clamp(_orbSph.radius * (1 + zoom * dt * 1.4),
                                         controls.minDistance, controls.maxDistance);
  camera.position.copy(controls.target).add(_orbOff.setFromSpherical(_orbSph));
  camera.lookAt(controls.target);
  return true;
}

/**
 * Double-click or double-tap the model to pivot on what was clicked.
 *
 * The single most useful freedom an orbit view can give: the whole control
 * scheme turns around one point, and until now that point was the middle of the
 * map for the entire visit. Distance is kept, so it reframes rather than zooms.
 */
const _pickRay = new THREE.Raycaster();
const _pickNdc = new THREE.Vector2();
function focusAt(clientX, clientY) {
  if (!mapRoot) return;
  _pickNdc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  _pickRay.setFromCamera(_pickNdc, camera);
  const hit = _pickRay.intersectObject(mapRoot, true);
  if (!hit.length) return;
  const p = hit[0].point;
  const keep = camera.position.distanceTo(controls.target);
  const dir = _orbOff.copy(camera.position).sub(controls.target).normalize();
  controls.autoRotate = false;
  document.getElementById('spin')?.classList.remove('on');
  _flyFrom.copy(camera.position);
  _flyFromT.copy(controls.target);
  _flyToT.copy(p);
  _flyTo.copy(p).addScaledVector(dir, keep);
  flight = { t: 0, dur: 0.55 };
  markView(null);
}

/**
 * Keep the orbit eye above the street.
 *
 * The polar limit stops the eye level with the TARGET, which is only the same
 * thing as level with the ground while the target is on it. Double-tap a
 * rooftop to pivot there and the target is sixty units up — a level orbit
 * around that is thirty units underground, and what fills the screen is the
 * back of the map plate. The limit cannot know that; a floor can.
 *
 * Measured off the streets rather than off `streetY`, which is the lowest point
 * of the whole plate including the terrain skirt at 31 — six above that is
 * still under the junction's road at 43.
 *
 * Only the height is touched. Pushing the eye back out along its own boom would
 * fight the damping and read as the model shoving the camera around.
 */
function clampOrbitEye() {
  const floor = (coreBox.isEmpty() ? streetY : coreBox.min.y) + 3;
  if (camera.position.y < floor) camera.position.y = floor;
}

function updateFlight(dt) {
  if (!flight) return;
  flight.t = Math.min(1, flight.t + dt / flight.dur);
  /* Ease both ends. A linear fly reads as a machine move; easing out of the
     old view and into the new one is what makes it read as a camera. */
  const e = flight.t < 0.5
    ? 4 * flight.t * flight.t * flight.t
    : 1 - Math.pow(-2 * flight.t + 2, 3) / 2;
  camera.position.lerpVectors(_flyFrom, _flyTo, e);
  controls.target.lerpVectors(_flyFromT, _flyToT, e);
  controls.update();
  if (flight.t >= 1) flight = null;
}

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
/* How fast the camera catches the look you have asked for, and how fast it
   settles onto a floor it has drifted below. Both are exponential, so they are
   the same at any frame rate. 18 is quick enough that a drag still feels
   direct and slow enough to take the stair-step out of a finger. */
const WALK_LOOK_DAMP = 18;
const WALK_MOVE_DAMP = 7;
const WALK_FLOOR_DAMP = 8;
const _wFwd = new THREE.Vector3();
const _wRight = new THREE.Vector3();
const _wWant = new THREE.Vector3();
const _WORLD_UP = new THREE.Vector3(0, 1, 0);

const walk = {
  on: false,
  vel: new THREE.Vector3(),
  /* Two of each: the angle the input has asked for, and the angle the camera
     has got to. Applying a drag straight to the camera is what made this feel
     like a mouse pointer rather than a camera — every pixel of finger jitter
     went into the picture. */
  yaw: 0, pitch: 0,
  yawT: 0, pitchT: 0,
  /* Eye height in MAP units. 1.75 of those is 1.17 m, which is a child's
     sightline — every kerb read as a step up and the buses looked enormous.
     2.6 is 1.73 m, which is a person. */
  eye: 2.6,
  /* Vertical input, which is now just another axis of the fly basis: the
     flyover deck, the rooftops and the skyline over the mall are all things
     you can only see from above, and without these the mode could not get
     there. Ground is still sampled underneath and acts as a floor. */
  liftStick: 0,          // -1 / 0 / +1 from the touch buttons
  liftGesture: 0,        // -1..1 from a two-finger drag
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
  walk.yaw = walk.yawT = spot.yaw;
  walk.pitch = walk.pitchT = 0;
  walk.vel.set(0, 0, 0);
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
  nav: null, solids: null, chr: null, ctrl: null, cam: new ChaseCamera(),
  index: 0, jump: false, sprintHeld: false,
  held: new Set(), queued: new Set(), rollQueued: false,
  combat: null, swapGate: 0,
  aimDir: new THREE.Vector3(),
};
play.cam.touch = IS_TOUCH;

let hintTimer = 0;
function syncModeButtons(active) {
  document.querySelectorAll('[data-mode]').forEach((b) =>
    b.classList.toggle('on', b.dataset.mode === active));
  /* The viewpoint row belongs to orbit and nothing else, and CSS is a better
     place to decide that than five call sites. */
  document.body.classList.toggle('orbiting', active === 'orbit');
  showHintFor(active);
}

/**
 * Show the current mode's hint, then let it go.
 *
 * Seven seconds is about twice as long as it takes to read one, and the
 * alternative is a line of grey text lying over the model for the length of
 * whatever anybody records here.
 *
 * Deliberately NOT started by the initial `syncModeButtons` at module end: the
 * map takes several seconds to arrive and the timer would spend all of them
 * counting down behind the loading screen, so the hint was already gone by the
 * time there was anything to read it against. The load calls this itself when
 * the scene is up.
 */
function showHintFor() {
  clearTimeout(hintTimer);
  document.querySelectorAll('.hint').forEach((el) => el.classList.remove('faded'));
  hintTimer = setTimeout(() => {
    document.querySelectorAll('.hint').forEach((el) => el.classList.add('faded'));
  }, 7000);
}

async function ensurePlayAssets(defIndex) {
  const def = CHARACTERS[defIndex];
  if (!play.nav) {
    setPlayStatus('Reading the street map…');
    play.nav = await NavMap.load('models/navmesh.png', 'models/navmesh.json');
  }
  if (!play.solids && colliderMeshes.length) {
    setPlayStatus('Fitting the colliders…');
    /* Real mesh colliders, built from the map's own triangles — see
       collision.js for why the navmap's walkable bit could not be trusted.
       Deferred to here on purpose: it is ~4 MB and a few tens of milliseconds,
       and a visitor who only spins the model should never pay for it.

       The band is the whole reachable world, and it used to stop at 96 — which
       was true when the only ways up were a jump and a short step, and false
       the moment Flash Step could take a roof. Every roof on this map above 96
       simply had no collision on it, so the tallest tower was not hard to
       climb, it was NOT THERE: the perch search found the highest surface in
       its column at 95.96 and nothing over it.

       175 did not clear the tallest building. It was picked as the number that
       did, and the Buildings mesh reaches 197: the tower on Pyay Road wears a
       shallow hexagonal basin of a roof with a raised rim and a plant room in
       the middle, and every part of that above 175 was cut out of the index.
       What was left was the basin floor at 174.5 and a scatter of rim panels
       that happened to have one vertex low enough to survive — which is why
       the roof of the tallest building on the map read as a 68-degree slope
       with nowhere on it to stand. You could get up there and not take a step.

       205 clears the real roofline with room over it, and it is nearly free:
       measured, the extra thirty units of city are 52 triangles and 4 KB — 0.1%
       — because there is very little of Yangon above the ninth floor. In
       exchange the tower's roof goes from nothing standable at all to 347 flat
       cells, 334 of them walkable. The low tier widens the buckets, trading a
       slightly longer scan per query for a third off the index. */
    const t = performance.now();
    play.solids = new MapColliders(colliderMeshes, THREE, {
      yLo: 24, yHi: 205, cell: DEVICE.tier === 'hi' ? 4 : 6,
    });
    console.info(`hledan: colliders ${play.solids.wallCount} walls + `
      + `${play.solids.floorCount} floors, `
      + `${(play.solids.bytes / 1048576).toFixed(1)} MB, `
      + `${(performance.now() - t).toFixed(0)} ms`);
  }
  if (!play.interiors && play.solids && play.nav) {
    setPlayStatus('Sealing the buildings…');
    /* The shells have nothing inside them, so being in one is a bug rather
       than a discovery. Work out which ground is sealed in, once. */
    /* Measured against the body that actually exists. The mask asks "is there
       a ceiling over this cell", and how high to look is a question about how
       tall the thing standing there is — leaving it on the defaults meant the
       crew grew and the mask kept describing the body they used to have. */
    play.interiors = new InteriorMask(play.nav, play.solids, {
      bodyR: BODY_RADIUS, stepUp: STEP_UP, bodyH: BODY_HEIGHT,
    });
    console.info(`hledan: interiors ${play.interiors.sealedCells} sealed `
      + `(${play.interiors.roofedCells} roofed, ${play.interiors.canopyCells} canopies left open) `
      + `of ${play.interiors.groundCells} cells, ${play.interiors.ms.toFixed(0)} ms`);
  }

  /* The flyover's parapets exist in the map but not in the baked navmap, which
     is one layer of heights with no walls in it, so rails are derived from the
     deck's own footprint. AFTER the colliders, not before: given the real
     geometry the derivation can drop every rail that would have stood inside a
     parapet the map already has. */
  if (props && play.nav) {
    const rails = props.addDeckRails(play.nav, play.solids);
    if (rails) {
      console.info(`hledan: ${rails} flyover guard rails`
        + (props._railsSkipped ? ` (${props._railsSkipped} already walled by the map)` : ''));
    }
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

  if (!play.ctrl) play.ctrl = new CharacterController(play.nav, props ? props.obstacles : null, play.solids, play.interiors);
  if (!play.combat) {
    play.combat = new Combat(scene, DEVICE.tier);
    play.combat.bindGround((x, z) => play.nav.heightAt(x, z));
    /* Every ring the move machine spawns gets its noise burst here, at the
       listener's distance from it. The soundscape stays off until the visitor
       asks for it, so this is a no-op for anyone who never presses ♪. */
    play.combat.onImpact = (pos, power, kind) => {
      if (sound.enabled) sound.impact(pos.x, pos.y, pos.z, power, kind, camera.position);
    };
  }
  play.combat.setStyle(play.chr.def.style);
  const c = coreBox.getCenter(new THREE.Vector3());
  play.ctrl.placeAt(c.x, c.z);
  play.cam.yaw = Math.PI * 0.15;
  play.cam.pitch = -0.18;
  camera.position.set(play.ctrl.pos.x, play.ctrl.pos.y + 6, play.ctrl.pos.z + 8);

  play.chr.root.visible = true;
  document.body.classList.add('playing');
  /* Compile the whole kit before the visitor can fire any of it.
     Measured on the low tier: entering play sits at 25 programs and running
     once through strike / heavy / ult / dash / sustain takes it to 36. Those
     eleven compile the first time each move is used, and a shader compile on a
     phone is tens of milliseconds — so the first Oni Giri, the first Flash
     Step and the first Tatsumaki each drop a frame, which is precisely the
     stutter that survives into a screen recording. Doing it here spends the
     same time behind the status line nobody is filming.
     `compile` traverses the whole graph rather than the visible part of it, so
     the effect pool counts even though every mesh in it starts hidden. */
  precompile();
  refreshCharChips();
  syncModeButtons('play');
}

function exitPlay() {
  play.on = false;
  play.held.clear();
  play.queued.clear();
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
      /* Elbaf's swap flourish: a dark ring, a shake, a beat of slow-mo and a
         lens punch, so the change of body lands as an event. */
      if (play.combat && play.ctrl) {
        play.combat.setStyle(play.chr.def.style);
        play.combat.swapFlourish(play.ctrl);
      }
    }
  } finally {
    play.loading = false;
    refreshCharChips();
  }
}

const CHIP_SLOTS = ['strike', 'sustain', 'heavy', 'dash', 'ult', 'gear', 'guard'];

/* Cached [data-move] nodes for the per-frame cooldown painter, invalidated
   by refreshMoveChips(). Declared here so it is initialised before any of
   the mode handlers above can reach the refresher. */
let moveChips = null;

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
  /* The per-frame painter caches these nodes and the last value it wrote to
     each; a kit swap changes what the cooldowns mean, so drop the cache. */
  moveChips = null;
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

/**
 * One player frame, in Elbaf's order: hit-stop scales time, aim runs first,
 * the combat machine consumes the queued inputs and computes its velocity
 * drive, the controller integrates under that drive, and the character visual
 * reads the result. Combat and movement are one machine split across two
 * files, exactly as they are one function in the Elbaf source.
 */
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
  const cb = play.combat;

  /* Hit stop, Elbaf's: not a freeze but a bite of slow motion — the world
     runs at 12% for a few hundredths of a second, which reads as impact
     instead of a hitch. Only the player frame slows; weather and sound keep
     the real clock. */
  let pdt = dt;
  if (cb.hitStop > 0) {
    cb.hitStop = Math.max(0, cb.hitStop - dt);
    pdt = dt * 0.12;
  }

  // aim: one ray down the camera's look, walls from the mesh colliders, ground from
  // the baked height field — every frame, for the reticle and the targeting
  camera.getWorldDirection(play.aimDir);
  cb.updateAim(c0, play.aimDir, play.solids, play.nav);

  // the move machine
  cb.step(pdt, c0, def, { queued: play.queued, held: play.held, rollQueued: play.rollQueued });
  play.queued.clear();
  play.rollQueued = false;

  const scaled = {
    speed: def.speed * cb.speedMul(),
    jump: def.jump * cb.jumpMul(),
  };
  c0.update(pdt, { moveX: mx, moveZ: mz, sprint, jump: play.jump, yaw: play.cam.yaw }, scaled, cb.drive);
  play.jump = false;
  cb.landed(c0);

  // the character reads everything back
  play.chr.root.position.set(c0.pos.x, c0.pos.y, c0.pos.z);
  play.chr.update(dt, {
    speed: c0.speedXZ, maxSpeed: def.speed, grounded: c0.grounded,
    vy: c0.vel.y, landing: c0.landing, roll: cb.rollK,
    facing: c0.facing, lookYaw: Math.atan2(play.aimDir.x, play.aimDir.z),
    turn: c0.turn,
  }, {
    style: def.style, move: cb.move.kind, moveK: cb.moveK,
    gatling: cb.gatling, balloon: cb.balloon, haki: cb.haki, gear2: cb.gear2,
  });

  /* Footfalls and the thud of a landing. Speeds go back to metres here — the
     controller works in map units, the clips were authored in metres, and the
     stride is a property of the clip. `landed()` above has already put this
     frame's fall speed in `c0.landing`, and it is non-zero for exactly the one
     frame the feet touch. */
  if (sound.enabled) {
    sound.player(dt, {
      speed: c0.speedXZ / WORLD_SCALE,
      grounded: c0.grounded,
      landing: c0.landing / WORLD_SCALE,
      stride: play.chr.strideM,
    });
  }

  // camera: Elbaf's 60° lens, kicked in by the heavy hits
  play.cam.punch(cb.fovPunch);
  cb.fovPunch = 0;
  play.cam.update(pdt, camera, c0, play.nav, play.solids);

  /* Screen shake, Elbaf's: amplitude falls with the square of a decaying
     scalar, three out-of-phase sines so it never reads as a regular wobble. */
  const sh = cb.shake;
  if (sh > 0.001) {
    const A = sh * sh * 0.35 * WORLD_SCALE;
    const t = performance.now() * 0.001;
    camera.position.x += Math.sin(t * 41) * A;
    camera.position.y += Math.sin(t * 53 + 1.7) * A * 0.7;
    camera.position.z += Math.sin(t * 47 + 3.1) * A;
  }

  // every pooled effect, on the real clock
  cb.render(dt, camera, c0, performance.now() * 0.001);

  // Thunder Tempo lights the sky the way the monsoon bolts do
  if (weather && cb.skyFlash > 0) weather.flash = Math.max(weather.flash, cb.skyFlash);
}

function setMode(m) {
  if (m === 'walk') { if (play.on) exitPlay(); if (!walk.on) enterWalk(); }
  else if (m === 'play') {
    // async: mark the button now, and enterPlay re-syncs (or falls back to orbit)
    if (!play.on) { syncModeButtons('play'); enterPlay(); return; }
  } else { if (walk.on) exitWalk(); if (play.on) exitPlay(); }
  syncModeButtons(play.on ? 'play' : walk.on ? 'walk' : 'orbit');
}

const _rayFrom = new THREE.Vector3();
const _walkEuler = new THREE.Euler(0, 0, 0, 'YXZ');

function sampleGround(force) {
  if (!force && (walk.tick++ % 3)) return;
  /* Reused: this runs every third frame for as long as anyone is in walk mode,
     and a Vector3 a frame is a Vector3 a frame. */
  walk.ray.set(_rayFrom.set(camera.position.x, groundBox.max.y + 60, camera.position.z), walk.down);
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
      else if (!e.repeat) play.queued.add(slot);
    }
    if ((e.code === 'KeyC' || e.code === 'ControlLeft') && !e.repeat) play.rollQueued = true; // Elbaf: C / Ctrl rolls
    if (e.code === 'Space' && !e.repeat) play.jump = true;          // Elbaf: Space jumps
    if (e.code === 'Tab' || e.code === 'KeyZ') {                    // Elbaf: Tab/Z swaps
      if (!e.repeat) swapCharacter(1);
      e.preventDefault();
    }
  }
  /* Orbit is included now that the arrows drive it. Left out, the page scrolls
     under the canvas while the camera turns, which on a short window walks the
     whole UI off the bottom of the screen. */
  if (e.code.startsWith('Arrow') || ((walk.on || play.on) && e.code === 'Space')) e.preventDefault();
});
addEventListener('keyup', (e) => {
  walk.keys[e.code] = false;
  const kit = (play.chr && MOVES[play.chr.def.style]) || {};
  for (const slot of SLOTS) if (kit[slot] && kit[slot].key === e.code) play.held.delete(slot);
});

/**
 * Drop every held key when the window stops receiving them.
 *
 * A keyup that happens while another window has focus is delivered to that
 * window, not this one, so alt-tabbing (or cmd-tabbing, or hitting a system
 * shortcut) mid-stride left `walk.keys` with the key still down: the character
 * sprinted off on his own and kept going until you pressed and released the
 * same key again. Sustained moves held the same way.
 */
function releaseAllKeys() {
  for (const code of Object.keys(walk.keys)) walk.keys[code] = false;
  play.held.clear();
  play.sprintHeld = false;
}
addEventListener('blur', releaseAllKeys);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllKeys(); });

/* ---------------------------------------------------------- input layer */

/**
 * Ported from Elbaf so both builds control identically. Its shape:
 *
 *   - ONE pointer layer over the canvas using pointer events (not touch
 *     events), so mouse, pen and finger all take the same path
 *   - anything inside a [data-ui-button] is a button, not input
 *   - on touch, a press in the LEFT HALF is the thumbstick; everything else
 *     looks. A press within the action pad's own rectangle never becomes
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
/* How far outside the pad a press still counts as "aimed at the pad". */
const PAD_MARGIN = 18;

const stickEl = document.getElementById('stick');
const knobEl = document.getElementById('knob');
const inputLayer = document.getElementById('input-layer');
const padEl = document.getElementById('pad');

/**
 * The rectangle in which a press is a fumbled button rather than a thumbstick.
 *
 * This used to be a fixed 250 x 265 box in the bottom-right corner, which is
 * Elbaf's figure for Elbaf's pad. Here the pad is 234 x 111 and the viewport
 * can be 375 wide, so that box reached from x=125 to the right edge and 265 px
 * up — and the stick only exists in the left half, x < 187. The overlap made a
 * 62 px column of the LEFT thumb's own territory swing the camera instead of
 * walking, across the whole bottom of the screen. Measuring the pad answers
 * the question the constant was standing in for.
 */
let padRect = null;
function measurePad() {
  if (!padEl) { padRect = null; return; }
  const r = padEl.getBoundingClientRect();
  padRect = r.width
    ? { x0: r.left - PAD_MARGIN, y0: r.top - PAD_MARGIN, x1: r.right + PAD_MARGIN, y1: r.bottom + PAD_MARGIN }
    : null;
}
addEventListener('resize', measurePad);
addEventListener('orientationchange', () => setTimeout(measurePad, 250));

const pointers = new Map();
let stickId = null;
const stickOrigin = { x: 0, y: 0 };

function inputActive() { return play.on || walk.on; }

function applyLook(dx, dy) {
  if (play.on) { play.cam.look(dx, dy); return; }
  walk.yawT -= dx * YAW_SENS;
  walk.pitchT = THREE.MathUtils.clamp(walk.pitchT - dy * PITCH_SENS, -1.45, 1.45);
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

  /* The pad only moves when the layout does, but it does not exist until the
     play HUD is shown, so measure lazily and keep it. */
  if (!padRect) measurePad();
  const inPad = !!padRect && e.clientX > padRect.x0 && e.clientX < padRect.x1
                          && e.clientY > padRect.y0 && e.clientY < padRect.y1;
  const isStick = IS_TOUCH && e.clientX < innerWidth * 0.5 && !inPad;

  pointers.set(e.pointerId, {
    mode: isStick ? 'stick' : 'look',
    lastX: e.clientX, lastY: e.clientY,
    startX: e.clientX, startY: e.clientY,
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

/**
 * Two fingers, pinching.
 *
 * Play had no zoom at all: the chase camera sat at Elbaf's follow distance for
 * the whole visit, which is a compromise between seeing the character and
 * seeing the city and is the wrong answer to both. Orbit has always pinched —
 * that is OrbitControls — but only because the input layer stays out of its
 * way; in play the layer swallows everything, so the gesture had to be read
 * here.
 *
 * The span between the two pointers is the whole signal. Tracked as a ratio
 * against the previous frame rather than against the start, so a pinch can be
 * reversed mid-gesture without the camera jumping back through everything it
 * has already done.
 */
let pinchSpan = 0;
function pinchDist() {
  const p = [...pointers.values()];
  if (p.length < 2) return 0;
  return Math.hypot(p[0].lastX - p[1].lastX, p[0].lastY - p[1].lastY);
}
function playPinch() {
  const d = pinchDist();
  if (!d) { pinchSpan = 0; return false; }
  if (!pinchSpan) { pinchSpan = d; return true; }
  const k = d / pinchSpan;
  pinchSpan = d;
  /* A dead band, or the camera creeps whenever two fingers rest on the glass. */
  if (Math.abs(k - 1) > 0.004) play.cam.zoomBy(1 / k);
  return true;
}

/**
 * Two fingers in walk mode: drag up to rise, down to descend.
 *
 * The buttons cover it, but a gesture is what a hand reaches for first, and on
 * a phone the whole upper half of this model was unreachable without finding a
 * control. Two fingers because one is already look and the left half is already
 * the stick — there is no unclaimed single-finger territory left. Pitch is
 * suppressed while it runs, or the camera tips over as the fingers travel.
 */
function walkPinch() {
  if (!walk.on || pointers.size < 2) return false;
  let sum = 0, n = 0, prev = 0;
  for (const p of pointers.values()) { sum += p.lastY; prev += p.startY; n++; }
  if (n < 2) return false;
  const drift = (sum / n) - (prev / n);
  /* Dead zone, so a two-finger look does not become a lift. */
  walk.liftGesture = Math.abs(drift) > 14 ? THREE.MathUtils.clamp(-drift / 140, -1, 1) : 0;
  return true;
}

inputLayer.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;

  if (p.mode === 'look') {
    const dx = e.clientX - p.lastX, dy = e.clientY - p.lastY;
    p.lastX = e.clientX; p.lastY = e.clientY;
    p.drift += Math.abs(dx) + Math.abs(dy);
    /* A second finger down turns the pair into a gesture, not two looks:
       a lift in walk, a zoom in play. */
    if (walk.on && pointers.size >= 2) { walkPinch(); return; }
    if (play.on && pointers.size >= 2) { playPinch(); return; }
    walk.liftGesture = 0;
    applyLook(dx, dy);
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
    /* Push far = run, no extra button — with hysteresis. A thumb holding the
       rim wobbles around any single threshold, and without the gap the sprint
       flag flapped on and off, so the speed target surged: the mobile "sprint
       glitch". Engage past 0.8, release only under 0.68. */
    play.sprintHeld = mag > (play.sprintHeld ? STICK_SPRINT - 0.12 : STICK_SPRINT);
  }
  knobEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
});

/**
 * Mouse look under pointer lock.
 *
 * Walk mode has asked for pointer lock since it was written and nothing ever
 * read the result: the only look path was `pointermove`, which measures
 * `clientX` deltas, and under lock the cursor does not move so those deltas are
 * zero. Every desktop visitor who was granted the lock got a camera that could
 * not turn at all, and the fallback — drag to look — was equally dead, because
 * dragging a locked pointer moves it no more than not dragging one does.
 * `movementX/Y` is the only thing that carries the motion.
 */
addEventListener('mousemove', (e) => {
  if (!document.pointerLockElement || !inputActive()) return;
  applyLook(e.movementX || 0, e.movementY || 0);
});

/* Click the world to take the lock back after Escape, so walk mode does not
   need re-entering to get its mouse look. Play keeps the pointer free: a click
   there is a strike, and a mode that swallows the cursor to attack with it is
   two controls fighting over one button. */
addEventListener('pointerdown', (e) => {
  if (!walk.on || IS_TOUCH || document.pointerLockElement) return;
  if (e.target.closest && e.target.closest('[data-ui-button]')) return;
  try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); }
  catch (err) { /* older signature returns undefined */ }
});

function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (p && p.mode === 'look' && p.mouse && p.drift < 7 && performance.now() - p.startT < 240) {
    if (play.on) play.queued.add('strike');    // Elbaf: a mouse tap is a pistol
  }
  pointers.delete(e.pointerId);
  if (pointers.size < 2) { walk.liftGesture = 0; pinchSpan = 0; }
  if (e.pointerId === stickId) clearStick();
}
inputLayer.addEventListener('pointerup', endPointer);
inputLayer.addEventListener('pointercancel', endPointer);

/**
 * Walk: a free-floating camera, not a person on a pavement.
 *
 * It used to move on the XZ plane whatever the pitch was, and ride the ground
 * height with a separate lift stacked on top. Two things came out of that and
 * both of them read as stiffness. Looking up and pressing forward went
 * horizontally, so the camera could never travel the way it was pointing — the
 * one thing a fly-through is for. And because the ground was a RAIL rather than
 * a floor, crossing a building shoved the camera up over it and dropped it
 * again on the far side, which is a lift you did not ask for in the middle of
 * a shot.
 *
 * So the basis comes off the camera itself, pitch included, and the ground is
 * a floor the camera settles onto rather than a rail it is pinned to. Standing
 * on the street it behaves exactly as before, because there the floor IS the
 * ground and forward IS horizontal.
 */
function updateWalk(dt) {
  const k = walk.keys;

  /* Catch up to the look that has been asked for. Everything downstream reads
     the smoothed angles, so the movement basis is smoothed with it and the
     whole camera moves as one thing. */
  const kLook = 1 - Math.exp(-WALK_LOOK_DAMP * dt);
  walk.yaw += (walk.yawT - walk.yaw) * kLook;
  walk.pitch += (walk.pitchT - walk.pitch) * kLook;
  camera.quaternion.setFromEuler(_walkEuler.set(walk.pitch, walk.yaw, 0, 'YXZ'));

  let fx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  let fz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  if (walk.stick.active) { fx += walk.stick.x; fz += walk.stick.y; }
  let up = (k.Space || k.KeyE ? 1 : 0) - (k.KeyC || k.KeyQ ? 1 : 0)
           + (walk.liftStick || 0) + (walk.liftGesture || 0);

  /* Three gears, not two. The map is 825 x 1765 units and a single walking
     pace crosses it in about a minute; Alt is for looking at a shopfront and
     Shift is for getting to the far end of the flyover. */
  const fast = k.ShiftLeft || k.ShiftRight;
  const slow = k.AltLeft || k.AltRight;
  const speed = 34 * (fast ? 4.2 : slow ? 0.3 : 1);

  /* Forward is where the camera is pointing — read off its own matrix rather
     than rebuilt from the angles, so it cannot drift out of step with what is
     on screen. Up stays world up: a fly-through that rolls its vertical with
     the pitch is a flight simulator, and nobody is flying a plane here. */
  camera.getWorldDirection(_wFwd);
  _wRight.crossVectors(_wFwd, _WORLD_UP).normalize();
  _wWant.set(0, 0, 0)
    .addScaledVector(_wFwd, -fz)
    .addScaledVector(_wRight, fx)
    .addScaledVector(_WORLD_UP, up);
  const mag = _wWant.length();
  if (mag > 1) _wWant.multiplyScalar(1 / mag);      // diagonals are not faster
  else if (mag < 0.03) _wWant.set(0, 0, 0);

  const kMove = 1 - Math.exp(-WALK_MOVE_DAMP * dt);
  walk.vel.x += (_wWant.x * speed - walk.vel.x) * kMove;
  walk.vel.y += (_wWant.y * speed - walk.vel.y) * kMove;
  walk.vel.z += (_wWant.z * speed - walk.vel.z) * kMove;
  camera.position.addScaledVector(walk.vel, dt);

  // stay over ground that exists, rather than sailing off the edge of the world
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, groundBox.min.x + 4, groundBox.max.x - 4);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, groundBox.min.z + 4, groundBox.max.z - 4);

  /* The ground is a floor. Eased when the camera is only just under it — that
     is a kerb, and snapping over kerbs is what makes a walk read as a stumble —
     and taken outright when it is a long way under, which only happens when the
     ground has jumped up under a camera that was already moving. */
  sampleGround(false);
  const floor = walk.ground + walk.eye;
  if (camera.position.y < floor) {
    const under = floor - camera.position.y;
    camera.position.y += under < 6
      ? under * (1 - Math.exp(-WALK_FLOOR_DAMP * dt))
      : under;
    if (walk.vel.y < 0) walk.vel.y = 0;
  }
  /* And a ceiling, so a held finger cannot leave the map behind. */
  const roof = walk.ground + walk.eye + 460;
  if (camera.position.y > roof) { camera.position.y = roof; if (walk.vel.y > 0) walk.vel.y = 0; }
}

/* ------------------------------------------------------- adaptive resolution */

let renderScale = DEVICE.tier === 'hi' ? 1.0 : 0.9;
/**
 * The floor used to be 0.45 on the low tier, and the phone lived on it.
 *
 * That floor was set on the assumption that this scene is fill-bound, and it
 * is not. Measured on the live scene at street level, sweeping the buffer from
 * 2560x1440 down to 864x486 — 8.8x fewer fragments — moved the GPU frame from
 * 0.218 ms to 0.140 ms. Eight ninths of the pixels bought 36% of the time,
 * because the cost is vertex, draw and state, none of which care how big the
 * buffer is. So the old floor gave up two thirds of the resolution for a sliver
 * of a frame, and the sliver was never enough to reach the target anyway: the
 * phone in the bug report was blurred to porridge AND sitting at 35 fps.
 *
 * 0.7 is the new floor on both tiers. Anything the scaler cannot buy above it
 * has to be found in the frame itself, which is where the rest of this pass
 * went.
 */
const MIN_SCALE = 0.7, MAX_SCALE = 1.0;
/* Half a second of frames at 60. Both arrays live for the page: the scaler runs
   its statistic twice a second and must not be a source of garbage itself. */
const FRAME_MS = new Float64Array(30);
const FRAME_SORTED = new Float64Array(30);
function medianOf(a) {
  FRAME_SORTED.set(a);
  FRAME_SORTED.sort();
  const n = FRAME_SORTED.length;
  return n % 2 ? FRAME_SORTED[(n - 1) / 2]
               : (FRAME_SORTED[n / 2 - 1] + FRAME_SORTED[n / 2]) / 2;
}
/* A phone at devicePixelRatio 3 asks for nine times the fragments of a 1x
   buffer for a screen you hold at arm's length. Cap the low tier at 1.5 —
   combined with the floor above that is 1.05x native, comfortably sharper
   than the 0.68x this used to bottom out at. */
const basePR = Math.min(window.devicePixelRatio || 1, DEVICE.tier === 'hi' ? 2 : 1.5);
let frames = 0, sinceAdjust = 0;

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
  FRAME_MS[frames % FRAME_MS.length] = frameMs;
  frames++; sinceAdjust++;
  if (frames < FRAME_MS.length) return;
  /* The MEDIAN frame, not the mean. A mean over half a second is hostage to
     whatever single frame was worst in it, and this page has real ones: a
     texture upload, the collision build, the first frame after a character
     swap, a GC. One 250 ms hitch drags a 16 ms average to 24 and spends a
     resolution step buying back time that was never the renderer's to begin
     with — then the scale climbs at 0.05 a step and takes several seconds to
     return. The median ignores a hitch entirely and still tracks a genuine
     slide, which is the thing worth reacting to. */
  const mid = medianOf(FRAME_MS);
  frames = 0;

  // two rAF callbacks can land in the same millisecond, which makes mid 0
  const shown = Math.min(999, Math.round(1000 / Math.max(mid, 1)));
  /* The render-scale figure is in its own element so a narrow phone can drop it
     without losing the frame rate: at 360 px the two together push the readout
     off the right edge of the top bar. */
  if (fpsEl) fpsEl.innerHTML = `${shown} fps<span class="fps-scale"> · ${Math.round(renderScale * 100)}%</span>`;

  if (sinceAdjust < 2) return;
  const prev = renderScale;
  /* The drop threshold used to be 1.35x the target, which on the 45 fps mobile
     budget meant anything above 33 fps was "fine" — so a phone sitting at 37
     stayed there for the whole visit, never spending the resolution it could
     not afford. 1.12x closes that: below ~40 fps it gives pixels back until
     the frame fits. The gap between the two thresholds still has to be wider
     than one step, or the scale oscillates between two values forever. */
  if (mid > TARGET_MS * 1.12 && renderScale > MIN_SCALE) renderScale = Math.max(MIN_SCALE, renderScale - 0.1);
  else if (mid < TARGET_MS * 0.80 && renderScale < MAX_SCALE) renderScale = Math.min(MAX_SCALE, renderScale + 0.05);
  if (prev !== renderScale) { applySize(); sinceAdjust = 0; }
}

/**
 * Warm the shader cache for whatever is currently in the scene.
 *
 * `compileAsync` where the driver offers KHR_parallel_shader_compile, so the
 * work lands off the main thread; the synchronous path is the fallback and is
 * still better than compiling mid-move.
 */
function precompile() {
  try {
    if (renderer.compileAsync) renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
  } catch (e) { /* a warm cache is an optimisation, never a requirement */ }
}

/* --------------------------------------------------------------------- HUD */

const ui = document.getElementById('ui');

/**
 * One tap, on every pointer this page can be driven with.
 *
 * `click` on a touchscreen is a synthesised event: the browser waits for the
 * pointer sequence to finish, decides the gesture was not a scroll, a pan, a
 * double-tap-to-zoom or a long-press, and only then fires. Every one of those
 * decisions is a way for a tap on a HUD button over a 3D viewport to be spent
 * on something else, and when it is spent there is no feedback at all — the
 * button does not even acknowledge having been touched. That is what "I have to
 * tap it twice" is: the first tap was ruled a gesture.
 *
 * So the press is handled directly. `pointerdown` lights the button at once —
 * which is the whole of the "instant" feeling, because the camera flight that
 * follows is always going to take a moment — and `pointerup` on the same
 * pointer runs the action, subject to the two tests a tap has to pass: the
 * finger did not travel (a drag on this page means orbit, or scroll the row),
 * and it was not held (a hold means something else on the action pad).
 *
 * Pointer capture is what makes the release land here even when the finger has
 * slid off the button, so a thumb that rolls a few pixels still counts.
 *
 * `click` is kept as the second route, not the first. Keyboards, screen readers
 * and any browser that fails to deliver the pointer pair still arrive that way,
 * and the timestamp guard is what stops a tap firing the action twice.
 */
function onTap(el, fn) {
  if (!el) return;
  let id = null, x0 = 0, y0 = 0, t0 = 0, done = -1e9;
  const release = () => { id = null; el.classList.remove('press'); };
  el.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0) return;
    id = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = e.timeStamp;
    el.classList.add('press');
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* mouse, mid-drag */ }
  });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    const slid = Math.hypot(e.clientX - x0, e.clientY - y0);
    release();
    if (slid > 16 || e.timeStamp - t0 > 800) return;
    done = e.timeStamp;
    fn(e);
  });
  /* iOS fires this whenever the system takes the gesture — an edge swipe, the
     notification shade, a scroll starting under the finger. The press state has
     to come off, and the action must NOT run: if the browser still decides it
     was a click, the listener below will catch it. */
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', () => { if (id !== null) release(); });
  el.addEventListener('click', (e) => {
    if (e.timeStamp - done < 800) return;
    fn(e);
  });
}

document.querySelectorAll('[data-mode]').forEach((b) =>
  onTap(b, () => setMode(b.dataset.mode)));

/* Crew chips pick a character directly rather than cycling. */
document.querySelectorAll('[data-char]').forEach((b) =>
  onTap(b, () => {
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
/* Elbaf's mobile rule for the strike button, exactly: press starts a 260 ms
   timer; if it fires, the button becomes the sustained move (Gatling /
   Tatsumaki / Lance) until release — and if it does NOT fire, the release is
   the tap, so a strike never double-fires alongside its own hold version.
   The gear button behaves the same way so a tap toggles and a hold sustains
   nothing. Buttons without data-hold queue on press, the way Elbaf's do. */
const HOLD_MS = 260;
document.querySelectorAll('.pad-btn[data-move]').forEach((b) => {
  let timer = null, heldFired = false;
  const down = (e) => {
    e.preventDefault();
    b.classList.add('held');
    const holdSlot = b.dataset.hold;
    if (holdSlot) {
      heldFired = false;
      timer = setTimeout(() => { timer = null; heldFired = true; play.held.add(holdSlot); }, HOLD_MS);
      return;                                  // the tap decision waits for release
    }
    play.queued.add(b.dataset.move);
  };
  const up = () => {
    b.classList.remove('held');
    if (timer) { clearTimeout(timer); timer = null; }
    if (b.dataset.hold) {
      if (heldFired) play.held.delete(b.dataset.hold);
      else play.queued.add(b.dataset.move);
      heldFired = false;
    }
  };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
});
/* The desktop kit chips fire on click — they are labels first, buttons second. */
document.querySelectorAll('.movechip[data-move]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const kit = (play.chr && MOVES[play.chr.def.style]) || {};
    const mv = kit[b.dataset.move];
    if (!mv) return;
    if (mv.hold) {
      play.held.add(b.dataset.move);
      const off = () => { play.held.delete(b.dataset.move); b.removeEventListener('pointerup', off); b.removeEventListener('pointerleave', off); };
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
    } else play.queued.add(b.dataset.move);
  });
});

const rollBtn = document.querySelector('[data-roll]');
if (rollBtn) rollBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault(); play.rollQueued = true;
  rollBtn.classList.add('held');
  setTimeout(() => rollBtn.classList.remove('held'), 160);
});


onTap(document.getElementById('reset'), () => {
  if (walk.on) setMode('orbit');
  frameMap();
  markView(null);
});
function syncSkyButtons() {
  document.querySelectorAll('[data-sky]').forEach((b) =>
    b.classList.toggle('on', weather && b.dataset.sky === weather.name));
}
document.querySelectorAll('[data-sky]').forEach((b) =>
  onTap(b, () => {
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
  onTap(soundBtn, () => { sound.toggle(); syncSound(); });
  syncSound();
}

const spinBtn = document.getElementById('spin');
onTap(spinBtn, () => {
  controls.autoRotate = !controls.autoRotate;
  spinBtn.classList.toggle('on', controls.autoRotate);
});
onTap(document.getElementById('full'), () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
document.querySelectorAll('[data-view]').forEach((b) => onTap(b, () => flyTo(b.dataset.view)));

/* Keep the row honest. The chip means "the camera is at this viewpoint", and
   the moment a drag, a pinch, a wheel or an arrow key moves the camera it is
   not — leaving it lit is the row telling the visitor something false about
   where they are. OrbitControls fires `start` for exactly the user-driven
   gestures and not for our own `update()` calls during a flight. */
controls.addEventListener('start', () => { if (!flight) markView(null); });

/* Pivot on what was double-clicked. On touch the same thing, hand-rolled:
   `dblclick` is unreliable across mobile browsers and a 300 ms two-tap test is
   not. Both are gated on orbit, where the pivot is the whole control scheme. */
renderer.domElement.addEventListener('dblclick', (e) => {
  if (play.on || walk.on) return;
  focusAt(e.clientX, e.clientY);
});
let lastTap = 0, lastTapX = 0, lastTapY = 0;
renderer.domElement.addEventListener('pointerup', (e) => {
  if (play.on || walk.on || e.pointerType === 'mouse') return;
  const now = performance.now();
  if (now - lastTap < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 32) {
    focusAt(e.clientX, e.clientY);
    lastTap = 0;
    return;
  }
  lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
});

/* The wheel zooms the chase camera, the way it zooms everything else on this
   page. Orbit has its own on the canvas; this is only for play, where the input
   layer is over the top and OrbitControls is switched off. */
addEventListener('wheel', (e) => {
  if (!play.on || !play.cam) return;
  if (e.target.closest && e.target.closest('[data-ui-button]')) return;
  e.preventDefault();
  play.cam.zoomBy(1 + Math.sign(e.deltaY) * 0.12);
}, { passive: false });

/* Walk's vertical, for a thumb. Held, not tapped — the same pointer handling
   the action pad uses, including pointercancel, which iOS fires whenever a
   gesture is stolen by a scroll or a system edge swipe. */
for (const [id, dir] of [['liftUp', 1], ['liftDown', -1]]) {
  const b = document.getElementById(id);
  if (!b) continue;
  const press = (e) => { e.preventDefault(); walk.liftStick = dir; b.classList.add('held'); };
  const release = () => { walk.liftStick = 0; b.classList.remove('held'); };
  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointercancel', release);
  b.addEventListener('pointerleave', release);
}

/* The board's own switch. It is in the weather column because that is where
   everything else that turns a light on or off already lives. */
const ledBtn = document.getElementById('ledBtn');
if (ledBtn) {
  onTap(ledBtn, () => {
    if (!ledBoard) return;
    const on = ledBoard.toggle();
    ledBtn.classList.toggle('on', on);
    ledBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

const infoPanel = document.getElementById('info');
onTap(document.getElementById('infoBtn'), () => infoPanel.classList.toggle('open'));
onTap(document.getElementById('infoClose'), () => infoPanel.classList.remove('open'));

document.getElementById('tier').textContent =
  `${DEVICE.tier === 'hi' ? '2048' : '1024'} textures · ${DEVICE.cores} cores`
  + (DEVICE.forced ? ' · pinned' : '');

/* Pause the loop when the tab is hidden — no point burning a phone battery.
 *
 * `scheduled` is what stops that pause from multiplying the loop. Hiding the
 * tab sets `running` false but does NOT cancel the frame already queued; when
 * the tab comes back, that queued callback fires AND the handler below asks
 * for another, and both then reschedule themselves. Every hide/show doubled
 * the number of chains, and with N of them the loop ran N times per animation
 * frame: N renders for one frame of movement, and N-1 of those saw `now - last`
 * of zero, which dragged the median frame time to nothing and printed
 * "999 fps" over a phone that was actually working N times too hard for it.
 *
 * On a desktop that takes a deliberate tab switch. On a phone it is the lock
 * button, the app switcher, or pulling down the notification shade — so the
 * readout in a screen recording said 999 and the device was rendering four
 * times per frame to earn it.
 */
let running = true;
let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  /* A long pause must not arrive as one enormous dt. */
  if (running) { last = performance.now(); schedule(); }
});
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); running = false;
  loadMsg && (loadMsg.textContent = 'Graphics context lost — reload the page.');
});

/* -------------------------------------------------------------------- loop */

const bannerEl = () => document.getElementById('moveBanner');
/**
 * Cooldown dials and the move banner.
 *
 * Two things this deliberately does NOT do every frame: walk the DOM looking
 * for the buttons, and write to them. It ran `querySelectorAll` sixty times a
 * second for a list of thirteen elements that cannot change between character
 * swaps, then set a custom property on each — and setting a custom property
 * invalidates style for the element whether or not the value differs, which on
 * a phone is a style recalc per chip per frame for a number that is 0 the
 * entire time you are not on cooldown. The nodes are cached and the writes are
 * gated on an actual change; a swap calls `refreshMoveChips()`.
 */
function paintCombatHud() {
  const def = (play.chr && play.chr.def) || CHARACTERS[play.index];
  if (!moveChips) {
    moveChips = [...document.querySelectorAll('[data-move]')].map((b) => ({
      el: b, move: b.dataset.move, dial: b.classList.contains('movechip'), last: -1,
    }));
  }
  for (const c of moveChips) {
    const k = play.combat.cooldown(def, c.move);
    const shown = Math.round(k * 100);
    if (shown === c.last) continue;
    c.last = shown;
    if (c.dial) c.el.style.setProperty('--cd', shown + '%');
    c.el.classList.toggle('cooling', k > 0.001);
  }
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
                    get led() { return ledBoard; },
                    get box() { return mapBox; }, get ground() { return groundBox; },
                    get streetY() { return streetY; }, device: DEVICE,
                    get scale() { return renderScale; }, play, CHARACTERS, IS_TOUCH,
                    get stickOn() { return walk.stick.active; }, get stickVec() { return {x: walk.stick.x, y: walk.stick.y}; },
                    /* drive N frames by hand — the render loop is rAF-driven and
                       rAF does not fire in a hidden tab, which makes headless
                       verification of the character controller impossible. */
                    step(n = 1, ms = 16.7) {
                      for (let i = 0; i < n; i++) { last = performance.now() - ms; frame(performance.now()); }
                      return { pos: play.ctrl && play.ctrl.pos.toArray().map(v => +v.toFixed(2)) };
                    } };

let last = performance.now();

/**
 * One animation frame's worth of work, with no scheduling in it.
 *
 * Split from `loop` so that driving frames by hand — see `step` on the debug
 * hook — cannot enlist a second chain. It used to call `loop` directly, which
 * reschedules, so every measurement taken through it was measuring a loop it
 * had itself multiplied.
 */
function frame(now) {
  const frameMs = now - last;
  const dt = Math.min(frameMs / 1000, 0.1);
  const realDt = dt;                       // weather and sound keep the real clock
  last = now;

  /* Hit stop lives inside updatePlay now — Elbaf's version is a bite of slow
     motion on the player frame alone, not a freeze of the whole world. */
  if (play.on && play.ctrl && play.chr) updatePlay(dt);
  else if (walk.on) updateWalk(dt);
  else if (flight) updateFlight(dt);
  else { updateOrbitKeys(dt); controls.update(); clampOrbitEye(); }

  if (play.on && play.combat) paintCombatHud();
  if (weather) weather.update(realDt, camera);
  if (ledBoard) ledBoard.update(realDt);
  /* The handful of real point lights migrate to whichever lamps are nearest,
     so wherever you are on the map is the part that is properly lit. */
  if (props) props.update(camera);
  if (sound.enabled) sound.update(realDt, camera.position, { rain: weather ? weather.cur.rain : 0, flash: weather ? weather.flash : 0,
      traffic: weather ? weather.cur.traffic : 1 });
  sky.position.copy(camera.position);
  skirt.position.x = camera.position.x;
  skirt.position.z = camera.position.z;
  renderer.render(scene, camera);
  adapt(frameMs);
}

function loop(now) {
  scheduled = false;
  if (!running) return;
  schedule();
  frame(now);
}
schedule();

refreshCharChips();
/* Orbit is where the page starts, and the viewpoint row keys off the class.
   The hint timer this starts is replaced by the one the load kicks off. */
syncModeButtons('orbit');

if (REDUCED_MOTION) controls.autoRotate = false;
else { controls.autoRotate = true; spinBtn.classList.add('on'); }
