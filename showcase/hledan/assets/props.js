/**
 * Street furniture for the junction.
 *
 * The map is a photogrammetry capture merged into eight meshes — every building,
 * vehicle and kerb is welded into one of them, so nothing in it can be moved or
 * rescaled individually. What it lacks is the layer of small stuff that actually
 * makes a Yangon street read as Yangon: the plastic-stool tea shops on the
 * pavement, the vendor umbrellas, the roadside water-pot stands, the YBS buses
 * nosed into the traffic. That layer is added here instead, procedurally.
 *
 * Everything is authored in **metres** and multiplied into map units by
 * WORLD_SCALE at build time, so these are the only objects on the map whose
 * real-world proportions are correct by construction rather than by measurement.
 *
 * Placement is baked, not random. The anchors below were derived offline from
 * the map itself: the road surface (`Road_final`) and the building footprints
 * were rasterised into occupancy grids, then vehicles were placed on road cells
 * with a long enough straight run to hold them, and pavement props on cells that
 * are next to a building but not on the carriageway. Baking keeps load cost at
 * zero and — more importantly — keeps the layout identical every visit, so it
 * can be art-directed and tested rather than re-rolled on each load.
 *
 * Cost: one InstancedMesh per prop type, no textures, no shadows. Nine draw
 * calls for ~290 objects.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WORLD_SCALE as S } from './character.js';

/* ---------------------------------------------------------------- anchors */
/* [x, y, z] for pavement props; [x, y, z, yaw] for vehicles, where yaw is the
   road's own direction at that point so traffic lines up with the tarmac. */

const BUS = [[158,43.6,-278,0],[118,43.5,-230,1.571],[138,43.3,-178,1.571],[90,43.2,-142,1.571],[122,43.2,-98,1.571],[70,43.2,-74,1.571],[102,43.2,-30,1.571],[-146,43.4,2,1.571],[50,43.2,2,1.571],[82,43.2,46,1.571],[-142,43.5,58,1.571],[38,43.2,86,1.571],[-94,43.1,106,1.571],[6,43.2,130,1.571],[50,43.2,162,1.571],[-82,43.2,170,0.785],[-18,43.2,198,0],[-98,43.4,226,1.571],[46,43.2,230,1.571],[-30,43.2,262,0],[38,43.2,286,1.571],[-86,43.4,294,1.571],[-10,43.2,314,0],[66,43.2,342,0.785],[-150,40,350,0],[-78,43.5,354,0],[138,43.2,354,0],[214,43.2,358,0],[6,43.2,366,0],[-50,43.2,402,0.785]];

const TAXI = [[134,43.7,-278,1.571],[182,43.3,-278,1.571],[154,43.6,-258,1.571],[126,43.6,-250,1.571],[138,43.5,-226,1.571],[110,43.4,-210,1.571],[134,43.4,-198,1.571],[98,43.3,-186,1.571],[118,43.2,-166,1.571],[86,43.2,-162,1.571],[142,43.2,-154,1.571],[110,43.2,-138,1.571],[134,43.2,-126,1.571],[74,43.2,-122,1.571],[98,43.2,-110,1.571],[66,43.2,-94,1.571],[90,43.2,-82,1.571],[118,43.2,-78,1.571],[58,43.2,-54,1.571],[86,43.2,-54,1.571],[114,43.2,-50,1.571],[70,43.2,-30,1.571],[-158,43.5,-18,0],[46,43.2,-18,1.571],[-126,43.2,-14,1.571],[90,43.2,-10,1.571],[70,43.2,10,1.571],[-158,43.6,22,1.571],[34,43.2,22,1.571],[94,43.2,22,1.571],[-110,43.1,26,1.571],[58,43.2,34,1.571],[-134,43.4,38,1.571],[26,43.2,50,1.571],[-110,43.2,62,1.571],[50,43.2,62,1.571],[78,43.2,66,1.571],[-138,43.5,78,1.571],[18,43.2,78,1.571],[-98,43.1,86,1.571],[58,43.2,90,1.571],[-126,43.5,102,1.571],[10,43.2,106,1.571],[38,43.2,110,1.571],[70,43.2,114,1.571],[-90,43.2,126,1.571],[-126,43.5,130,1.571],[26,43.2,134,1.571],[54,43.2,138,1.571],[-78,43.1,150,0.785],[-2,43.2,150,1.571],[22,43.2,162,1.571],[-62,43.1,174,0.785],[-106,43.4,178,1.571],[-6,43.2,178,0],[42,43.2,182,1.571],[-38,43.2,190,0],[18,43.2,194,0],[-78,43.2,198,0.785],[-106,43.5,206,1.571],[42,43.2,210,1.571],[-2,43.2,214,0],[-46,43.1,218,0],[-70,43.2,230,0.785],[22,43.2,230,1.571],[-22,43.2,234,0],[2,43.2,250,0],[42,43.2,250,1.571],[-58,43.2,254,0],[22,43.2,270,1.571],[-78,43.5,274,1.571],[-10,43.2,274,0],[-46,43.2,278,0],[10,43.2,294,0.785],[-26,43.2,298,0],[-54,43.3,306,0.785],[34,43.2,306,1.571],[-82,43.6,314,1.571],[10,43.2,322,0.785],[-34,43.2,326,0],[46,43.2,330,0.785],[-62,43.5,334,1.571],[-94,43.6,338,2.356],[-2,43.2,346,0],[-126,41.2,350,0],[26,43.2,350,0],[86,43.2,350,0],[-42,43.3,354,0],[114,43.2,354,0],[162,43.2,354,0],[190,43.2,358,0],[50,43.2,362,0],[234,43.2,362,0],[-98,43.2,366,0],[-146,40,370,0],[-18,43.2,370,0],[74,43.2,374,0],[134,43.2,374,0],[-74,43.3,378,0],[26,43.2,378,0],[102,43.2,378,0],[210,43.2,378,0],[-46,43.2,382,0],[162,43.2,382,0],[246,43.2,386,0],[50,43.2,390,2.356],[-22,43.2,398,0],[14,43.2,402,1.571]];

const TEA = [[122,43.3,-278],[198,43.6,-278],[70,43.3,-202],[50,43.3,-142],[146,43.6,-142],[42,43.3,-70],[-138,43.1,-50],[-194,42.9,-30],[10,43.4,-2],[-102,43.4,2],[102,43.6,18],[-186,43.2,30],[-74,43.4,54],[6,43.4,58],[86,43.6,74],[-146,43.6,98],[70,43.6,134],[66,43.6,206],[-110,44,218],[70,43.6,266],[-90,43.5,298],[50,43.6,322],[118,43.6,330],[194,43.6,334],[250,43.6,358],[82,43.6,390],[158,43.6,394],[218,43.6,414],[26,43.6,418]];

const STALL = [[222,43.6,-278],[186,43.6,-246],[106,43.4,-234],[94,43.3,-202],[162,43.6,-126],[54,43.3,-122],[46,43.3,-90],[-102,43.4,-50],[38,43.4,-50],[-162,43.4,-46],[-134,43.2,-30],[-98,43.4,-18],[30,43.4,-18],[-178,43.6,-14],[-166,44,14],[26,43.4,14],[-86,43.4,18],[122,43.6,22],[2,43.4,38],[94,43.6,42],[-158,44,46],[-98,43.4,46],[106,43.6,70],[-158,43.5,78],[-86,43.1,78],[10,43.4,78],[82,43.6,94],[-14,43.4,98],[-66,43.4,102],[94,43.6,122],[82,43.6,154],[70,43.6,186],[-106,44,238],[54,43.6,250],[-106,44,274],[50,43.6,282],[70,43.6,306],[-90,44,322],[98,43.6,322],[138,43.6,334],[170,43.6,334],[70,43.6,338],[214,43.6,338],[246,43.6,338],[106,43.6,390],[138,43.6,390],[182,43.6,394],[214,43.6,394],[54,43.6,398],[246,43.6,398],[82,43.6,414]];

const POT = [[214,43.6,-278],[86,43.3,-202],[54,43.3,-130],[142,43.6,-130],[38,43.4,-58],[-182,43.7,-42],[-98,43.4,-38],[118,43.6,18],[-166,43.9,30],[26,43.4,30],[-86,43.4,34],[82,43.6,86],[-14,43.4,90],[66,43.6,158],[-106,44,234],[50,43.6,262],[-90,44,314],[90,43.6,322],[162,43.6,334],[234,43.6,338],[66,43.6,394],[138,43.6,406],[210,43.6,410]];

const POLE = [[210,43.6,-278],[198,43.6,-246],[82,43.3,-202],[58,43.3,-134],[146,43.6,-130],[46,43.3,-102],[50,43.3,-62],[-150,43.3,-46],[-182,43.6,-34],[-98,43.4,-34],[34,43.4,-30],[-170,43.8,-2],[-86,43.4,-2],[22,43.4,2],[114,43.6,18],[-86,43.4,38],[14,43.4,38],[-162,43.9,42],[94,43.6,54],[-150,43.6,74],[-90,43.4,74],[6,43.4,74],[106,43.6,86],[-70,43.4,102],[78,43.6,106],[2,43.4,110],[90,43.6,138],[78,43.6,170],[78,43.6,206],[62,43.6,258],[-94,43.5,286],[54,43.6,294],[82,43.6,318],[-106,41.4,326],[114,43.6,330],[150,43.6,334],[186,43.6,334],[226,43.6,338],[94,43.6,390],[130,43.6,390],[170,43.6,394],[206,43.6,394],[242,43.6,398],[42,43.6,402]];

/* ------------------------------------------------------------- palettes */
/* YBS repainted its fleet into flat single colours, which is why a Yangon bus
   reads as a slab of one strong hue rather than the striped liveries elsewhere
   in the region. Taxis are mostly white or silver hatchbacks with a scatter of
   older blue and maroon saloons. The stools are the giveaway detail: moulded
   plastic in primary colours, on every pavement in the city. */
const BUS_COLOURS   = [0x1f5fa8, 0x2f8f4e, 0xd8482c, 0xe0a52a, 0x2b6fb5];
const TAXI_COLOURS  = [0xdcdcdc, 0xe8e8e8, 0x9aa3ad, 0x2f4c7a, 0x6d2b2b, 0xf0f0f0];
const STOOL_COLOURS = [0xd23b2e, 0x1f6fc4, 0x2f9c4a, 0xe0a92a];
const TARP_COLOURS  = [0x2f7fbf, 0x3f9a5c, 0xc85a3c, 0xd8b23e];

/* --------------------------------------------------------------- helpers */

const m = (x) => x * S;                       // metres -> map units

function box(w, h, d, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(m(w), m(h), m(d));
  g.translate(m(x), m(y), m(z));
  return g;
}
function cyl(rt, rb, h, seg, x = 0, y = 0, z = 0, rotX = 0) {
  const g = new THREE.CylinderGeometry(m(rt), m(rb), m(h), seg);
  if (rotX) g.rotateX(rotX);
  g.translate(m(x), m(y), m(z));
  return g;
}

/* Paint a sub-geometry by baking vertex colours, so one prop can carry several
   colours inside a single instanced draw. The per-instance colour multiplies
   this, which is what lets 30 buses share one mesh and still differ. */
function paint(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/* ---------------------------------------------------------------- shapes */

/** YBS bus: 11.5 x 2.5 x 3.2 m, the real thing. Body colour is left white so
    the per-instance colour supplies it; glass and wheels are baked dark. */
function busGeo() {
  const parts = [
    paint(box(2.5, 2.35, 11.5, 0, 1.55, 0), 0xffffff),        // body
    paint(box(2.54, 0.95, 10.2, 0, 2.35, -0.2), 0x2a3038),    // window band
    paint(box(2.3, 0.30, 11.0, 0, 2.90, 0), 0xf2f2f2),        // roof cap
    paint(box(2.42, 0.55, 0.30, 0, 1.05, 5.75), 0x263041),    // windscreen surround
    paint(cyl(0.50, 0.50, 0.28, 10, -1.20, 0.50, 3.6, Math.PI / 2), 0x1a1a1c),
    paint(cyl(0.50, 0.50, 0.28, 10,  1.20, 0.50, 3.6, Math.PI / 2), 0x1a1a1c),
    paint(cyl(0.50, 0.50, 0.28, 10, -1.20, 0.50, -3.9, Math.PI / 2), 0x1a1a1c),
    paint(cyl(0.50, 0.50, 0.28, 10,  1.20, 0.50, -3.9, Math.PI / 2), 0x1a1a1c),
  ];
  return mergeGeometries(parts, false);
}

/** Taxi: a 4.4 m hatchback, the Probox/Fielder shape that dominates the city. */
function taxiGeo() {
  const parts = [
    paint(box(1.70, 0.85, 4.40, 0, 0.62, 0), 0xffffff),
    paint(box(1.58, 0.70, 2.45, 0, 1.35, -0.15), 0xffffff),   // cabin
    paint(box(1.60, 0.44, 2.30, 0, 1.42, -0.15), 0x27303c),   // glass
    paint(cyl(0.31, 0.31, 0.20, 8, -0.85, 0.31, 1.45, Math.PI / 2), 0x171719),
    paint(cyl(0.31, 0.31, 0.20, 8,  0.85, 0.31, 1.45, Math.PI / 2), 0x171719),
    paint(cyl(0.31, 0.31, 0.20, 8, -0.85, 0.31, -1.45, Math.PI / 2), 0x171719),
    paint(cyl(0.31, 0.31, 0.20, 8,  0.85, 0.31, -1.45, Math.PI / 2), 0x171719),
  ];
  return mergeGeometries(parts, false);
}

/** Tea shop: a tarpaulin on four poles over a low table and four stools.
    Stool seats sit at 0.30 m — knee height, which is the whole character of
    the thing; putting them at chair height would read as a European cafe. */
function teaTarpGeo() {
  // the only tinted part: instanceColor multiplies, so it is left pure white
  return paint(box(3.2, 0.06, 3.2, 0, 2.25, 0), 0xffffff);
}

/** The frame, table and stools keep their own colours — a separate mesh so the
    tarp's per-instance tint does not bleed onto the timber and the plastic. */
function teaFrameGeo() {
  const parts = [
    paint(cyl(0.045, 0.045, 2.25, 5, -1.45, 1.12, -1.45), 0x8d8378),
    paint(cyl(0.045, 0.045, 2.25, 5,  1.45, 1.12, -1.45), 0x8d8378),
    paint(cyl(0.045, 0.045, 2.25, 5, -1.45, 1.12,  1.45), 0x8d8378),
    paint(cyl(0.045, 0.045, 2.25, 5,  1.45, 1.12,  1.45), 0x8d8378),
    paint(cyl(0.30, 0.30, 0.04, 10, 0, 0.45, 0), 0xc9b79c),   // table top
    paint(cyl(0.05, 0.05, 0.45, 6, 0, 0.22, 0), 0x9a8b74),
  ];
  const stools = [[-0.75, 0, 0.20], [0.75, 0, -0.20], [0.15, 0, 0.80], [-0.20, 0, -0.80]];
  stools.forEach(([sx, , sz], i) => {
    parts.push(paint(cyl(0.14, 0.12, 0.04, 8, sx, 0.30, sz), STOOL_COLOURS[i % STOOL_COLOURS.length]));
    parts.push(paint(cyl(0.10, 0.12, 0.28, 6, sx, 0.15, sz), STOOL_COLOURS[i % STOOL_COLOURS.length]));
  });
  return mergeGeometries(parts, false);
}

/** Vendor stall: a big umbrella over a crate table. */
function stallCanopyGeo() {
  return paint(cyl(0.02, 1.35, 0.42, 10, 0, 2.12, 0), 0xffffff);
}

function stallFrameGeo() {
  const parts = [
    paint(cyl(0.035, 0.035, 2.10, 6, 0, 1.05, 0), 0x8d8378),
    paint(box(1.10, 0.62, 0.66, 0, 0.31, 0), 0xb99c74),       // crate
    paint(box(1.16, 0.06, 0.72, 0, 0.65, 0), 0xd8c9a8),
  ];
  return mergeGeometries(parts, false);
}

/** Roadside water-pot stand — the ye-o-sin. Two glazed pots on a timber frame,
    left out for anyone walking past. Nothing says a Myanmar street faster. */
function potStandGeo() {
  const parts = [
    paint(cyl(0.05, 0.05, 1.15, 5, -0.42, 0.57, 0), 0x7d6a52),
    paint(cyl(0.05, 0.05, 1.15, 5,  0.42, 0.57, 0), 0x7d6a52),
    paint(box(1.05, 0.07, 0.34, 0, 1.12, 0), 0x8d7a5e),
    paint(box(1.05, 0.05, 0.30, 0, 0.42, 0), 0x8d7a5e),
    paint(cyl(0.13, 0.19, 0.34, 9, -0.26, 1.32, 0), 0x6b4b34), // pots
    paint(cyl(0.13, 0.19, 0.34, 9,  0.26, 1.32, 0), 0x6b4b34),
    paint(cyl(0.10, 0.10, 0.03, 9, -0.26, 1.50, 0), 0x3f2e22), // lids
    paint(cyl(0.10, 0.10, 0.03, 9,  0.26, 1.50, 0), 0x3f2e22),
  ];
  return mergeGeometries(parts, false);
}

/** Utility pole with crossarms and a lamp on an outstretched arm. The cables
    between poles are drawn separately, as line segments, because catenaries do
    not instance. */
function poleGeo() {
  const parts = [
    paint(cyl(0.09, 0.13, 8.0, 6, 0, 4.0, 0), 0x9a938a),
    paint(box(1.70, 0.09, 0.09, 0, 7.25, 0), 0x8a8178),
    paint(box(1.30, 0.08, 0.08, 0, 6.70, 0), 0x8a8178),
    paint(box(0.34, 0.44, 0.30, 0.34, 5.55, 0), 0x6f6a63),     // transformer box
    paint(box(1.25, 0.07, 0.07, 0.62, 6.15, 0), 0x8a8178),     // lamp arm
    paint(box(0.46, 0.14, 0.22, 1.20, 6.05, 0), 0x6f6a63),     // lamp housing
  ];
  return mergeGeometries(parts, false);
}

/** The lit parts, kept apart so they can be driven to full brightness without
    the pole going with them. Sodium-orange: Yangon's street lighting is still
    mostly warm, and it is half of why the city reads the way it does at dusk. */
function lampLensGeo() {
  return paint(box(0.40, 0.05, 0.18, 1.20, 5.96, 0), 0xffffff);
}

/** A cheap stand-in for a light cone: a pool on the pavement under the lamp and
    a small bloom at the bulb. Additive, unlit, depth-write off — two instanced
    draws and no shadow work at all.

    The pool's softness is baked into its vertex colours rather than painted
    into a texture or faded with alpha: under additive blending black adds
    nothing, so a disc that runs from white at the hub to black at the rim has
    no edge to give itself away. A flat-coloured disc reads as a circle of paint
    on the road, which is exactly what it looked like before. */
function lampGlowGeo() {
  const disc = new THREE.CircleGeometry(m(3.1), 20);
  disc.rotateX(-Math.PI / 2);
  {
    const pos = disc.attributes.position;
    const n = pos.count;
    const col = new Float32Array(n * 3);
    let rMax = 0;
    for (let i = 0; i < n; i++) rMax = Math.max(rMax, Math.hypot(pos.getX(i), pos.getZ(i)));
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(pos.getX(i), pos.getZ(i)) / (rMax || 1);
      const v = Math.pow(1 - r, 1.7);          // bright hub, long soft tail
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
    }
    disc.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  disc.translate(m(1.20), m(0.05), 0);

  const bulb = new THREE.SphereGeometry(m(0.34), 8, 6);
  bulb.translate(m(1.20), m(5.96), 0);
  paint(bulb, 0xffffff);

  return mergeGeometries([disc, bulb], false);
}

/* ----------------------------------------------------------------- build */

function instanced(geo, mat, rows, colours, rng, jitterYaw) {
  const mesh = new THREE.InstancedMesh(geo, mat, rows.length);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  rows.forEach((r, i) => {
    dummy.position.set(r[0], r[1], r[2]);
    dummy.rotation.y = r.length > 3 ? r[3] + (rng() < 0.5 ? 0 : Math.PI) : rng() * Math.PI * 2;
    if (jitterYaw) dummy.rotation.y += (rng() - 0.5) * jitterYaw;
    const s = 0.94 + rng() * 0.12;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (colours) mesh.setColorAt(i, col.set(colours[(i * 7 + 3) % colours.length]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = mesh.receiveShadow = false;
  mesh.matrixAutoUpdate = false;
  return mesh;
}

/* Deterministic PRNG, so the street looks the same on every visit. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class StreetProps {
  /**
   * @param tier 'hi' | 'lo' — the low tier drops the long tail of vehicles and
   *             skips the overhead cables, which are the only non-instanced draw.
   */
  constructor({ scene, tier = 'hi' }) {
    this.group = new THREE.Group();
    this.group.name = 'street-props';
    const rng = mulberry32(0x484C44);             // "HLD"

    const Mat = tier === 'hi' ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;
    const mk = (extra = {}) => new Mat(Object.assign({ vertexColors: true }, extra,
      tier === 'hi' ? { roughness: 0.85, metalness: 0.0 } : {}));

    const cut = tier === 'hi' ? 1 : 0.55;         // fraction of the fleet kept
    const take = (arr) => arr.slice(0, Math.max(1, Math.round(arr.length * cut)));

    /* A prop whose tint must not spread over its whole body is built as two
       meshes sharing one transform list. Both are laid out from a PRNG seeded
       identically, so the tarp lands on its own poles. */
    const pair = (a, b, rows, colours, seed, jitter) => [
      instanced(a, mk(), rows, colours, mulberry32(seed), jitter),
      instanced(b, mk(), rows, null,    mulberry32(seed), jitter),
    ];

    this.meshes = [
      instanced(busGeo(),      mk(), take(BUS),   BUS_COLOURS,   rng, 0.05),
      instanced(taxiGeo(),     mk(), take(TAXI),  TAXI_COLOURS,  rng, 0.07),
      ...pair(teaTarpGeo(),    teaFrameGeo(),   TEA,   TARP_COLOURS, 0x54454, 0),
      ...pair(stallCanopyGeo(), stallFrameGeo(), STALL, TARP_COLOURS, 0x5741, 0),
      instanced(potStandGeo(), mk(), POT,         null,          rng, 0),
      instanced(poleGeo(),     mk(), POLE,        null,          mulberry32(0x504C45), 0),
    ];

    /* Lamps ride the pole transforms, so they are laid out from a PRNG seeded
       exactly as the poles were. Both are unlit materials — a street lamp that
       obeys the scene's own lighting goes out at dusk, which is backwards. */
    const lampMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffc074, transparent: true, opacity: 0 });
    const glowMat = new THREE.MeshBasicMaterial({
      vertexColors: true, color: 0xffb45e, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.lampMat = lampMat;
    this.glowMat = glowMat;
    const lamp = instanced(lampLensGeo(), lampMat, POLE, null, mulberry32(0x504C45), 0);
    const glow = instanced(lampGlowGeo(), glowMat, POLE, null, mulberry32(0x504C45), 0);
    glow.renderOrder = 3;
    this.meshes.push(lamp, glow);
    for (const mesh of this.meshes) this.group.add(mesh);

    if (tier === 'hi') this.group.add(this._cables(rng));

    scene.add(this.group);
  }

  /**
   * Overhead cables. Yangon's poles carry a visible tangle of them, and the sag
   * is most of the read, so each span is a 6-segment catenary rather than a
   * straight line. One LineSegments draw for the lot.
   */
  _cables(rng) {
    const pts = [];
    const sorted = POLE.slice().sort((a, b) => (a[2] - b[2]) || (a[0] - b[0]));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      const dx = b[0] - a[0], dz = b[2] - a[2];
      const span = Math.hypot(dx, dz);
      if (span > m(30) || span < m(3)) continue;      // only plausible neighbours
      for (let line = 0; line < 3; line++) {
        const off = (line - 1) * m(0.32);
        const hy = m(7.25) - line * m(0.55);
        const sag = m(0.45 + rng() * 0.5) * (span / m(20));
        const nx = -dz / span, nz = dx / span;
        let prev = null;
        for (let s = 0; s <= 6; s++) {
          const t = s / 6;
          const x = a[0] + dx * t + nx * off;
          const z = a[2] + dz * t + nz * off;
          const y = a[1] + hy + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag;
          const cur = new THREE.Vector3(x, y, z);
          if (prev) { pts.push(prev, cur); }
          prev = cur;
        }
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x14171c, transparent: true, opacity: 0.75 }));
    mesh.name = 'overhead-cables';
    return mesh;
  }

  /**
   * How lit the street lamps are, 0..1. Driven by the weather cross-fade rather
   * than switched, so walking from midday into the storm brings them up the way
   * a real photocell would.
   */
  setGlow(amount) {
    const a = Math.max(0, Math.min(1, amount));
    this.lampMat.opacity = a;
    this.glowMat.opacity = a * 0.42;
  }

  get count() { return this.meshes.reduce((n, mesh) => n + mesh.count, 0); }
}
