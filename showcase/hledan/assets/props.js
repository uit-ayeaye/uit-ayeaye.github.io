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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WORLD_SCALE as S } from './character.js';
import { ObstacleField } from './obstacles.js';

/* ---------------------------------------------------------------- anchors */
/* [x, y, z] for pavement props; [x, y, z, yaw] for vehicles, where yaw is the
   road's own direction at that point so traffic lines up with the tarmac. */

const BUS = [[158,43.6,-278,0],[118,43.5,-230,1.571],[138,43.3,-178,1.571],[90,43.2,-142,1.571],[122,43.2,-98,1.571],[70,43.2,-74,1.571],[102,43.2,-30,1.571],[-146,43.4,2,1.571],[50,43.2,2,1.571],[82,43.2,46,1.571],[-142,43.5,58,1.571],[38,43.2,86,1.571],[-94,43.1,106,1.571],[6,43.2,130,1.571],[50,43.2,162,1.571],[-82,43.2,170,0.785],[-18,43.2,198,0],[-98,43.4,226,1.571],[46,43.2,230,1.571],[-30,43.2,262,0],[38,43.2,286,1.571],[-86,43.4,294,1.571],[-10,43.2,314,0],[66,43.2,342,0.785],[-150,40,350,0],[-78,43.5,354,0],[138,43.2,354,0],[214,43.2,358,0],[6,43.2,366,0],[-50,43.2,402,0.785]];

const TAXI = [[134,43.7,-278,1.571],[182,43.3,-278,1.571],[154,43.6,-258,1.571],[126,43.6,-250,1.571],[138,43.5,-226,1.571],[110,43.4,-210,1.571],[134,43.4,-198,1.571],[98,43.3,-186,1.571],[118,43.2,-166,1.571],[86,43.2,-162,1.571],[142,43.2,-154,1.571],[110,43.2,-138,1.571],[134,43.2,-126,1.571],[74,43.2,-122,1.571],[98,43.2,-110,1.571],[66,43.2,-94,1.571],[90,43.2,-82,1.571],[118,43.2,-78,1.571],[58,43.2,-54,1.571],[86,43.2,-54,1.571],[114,43.2,-50,1.571],[70,43.2,-30,1.571],[-158,43.5,-18,0],[46,43.2,-18,1.571],[-126,43.2,-14,1.571],[90,43.2,-10,1.571],[70,43.2,10,1.571],[-158,43.6,22,1.571],[34,43.2,22,1.571],[94,43.2,22,1.571],[-110,43.1,26,1.571],[58,43.2,34,1.571],[-134,43.4,38,1.571],[26,43.2,50,1.571],[-110,43.2,62,1.571],[50,43.2,62,1.571],[78,43.2,66,1.571],[-138,43.5,78,1.571],[18,43.2,78,1.571],[-98,43.1,86,1.571],[58,43.2,90,1.571],[-126,43.5,102,1.571],[10,43.2,106,1.571],[38,43.2,110,1.571],[70,43.2,114,1.571],[-90,43.2,126,1.571],[-126,43.5,130,1.571],[26,43.2,134,1.571],[54,43.2,138,1.571],[-78,43.1,150,0.785],[-2,43.2,150,1.571],[22,43.2,162,1.571],[-62,43.1,174,0.785],[-106,43.4,178,1.571],[-6,43.2,178,0],[42,43.2,182,1.571],[-38,43.2,190,0],[18,43.2,194,0],[-78,43.2,198,0.785],[-106,43.5,206,1.571],[42,43.2,210,1.571],[-2,43.2,214,0],[-46,43.1,218,0],[-70,43.2,230,0.785],[22,43.2,230,1.571],[-22,43.2,234,0],[2,43.2,250,0],[42,43.2,250,1.571],[-58,43.2,254,0],[22,43.2,270,1.571],[-78,43.5,274,1.571],[-10,43.2,274,0],[-46,43.2,278,0],[10,43.2,294,0.785],[-26,43.2,298,0],[-54,43.3,306,0.785],[34,43.2,306,1.571],[-82,43.6,314,1.571],[10,43.2,322,0.785],[-34,43.2,326,0],[46,43.2,330,0.785],[-62,43.5,334,1.571],[-94,43.6,338,2.356],[-2,43.2,346,0],[-126,41.2,350,0],[26,43.2,350,0],[86,43.2,350,0],[-42,43.3,354,0],[114,43.2,354,0],[162,43.2,354,0],[190,43.2,358,0],[50,43.2,362,0],[234,43.2,362,0],[-98,43.2,366,0],[-146,40,370,0],[-18,43.2,370,0],[74,43.2,374,0],[134,43.2,374,0],[-74,43.3,378,0],[26,43.2,378,0],[102,43.2,378,0],[210,43.2,378,0],[-46,43.2,382,0],[162,43.2,382,0],[246,43.2,386,0],[50,43.2,390,2.356],[-22,43.2,398,0],[14,43.2,402,1.571]];

const TEA = [[122,43.3,-278],[198,43.6,-278],[70,43.3,-202],[50,43.3,-142],[146,43.6,-142],[42,43.3,-70],[-138,43.1,-50],[-194,42.9,-30],[10,43.4,-2],[-102,43.4,2],[102,43.6,18],[-186,43.2,30],[-74,43.4,54],[6,43.4,58],[86,43.6,74],[-146,43.6,98],[70,43.6,134],[66,43.6,206],[-110,44,218],[70,43.6,266],[-90,43.5,298],[50,43.6,322],[118,43.6,330],[194,43.6,334],[250,43.6,358],[82,43.6,390],[158,43.6,394],[218,43.6,414],[26,43.6,418]];

const STALL = [[222,43.6,-278],[186,43.6,-246],[106,43.4,-234],[94,43.3,-202],[162,43.6,-126],[54,43.3,-122],[46,43.3,-90],[-102,43.4,-50],[38,43.4,-50],[-162,43.4,-46],[-134,43.2,-30],[-98,43.4,-18],[30,43.4,-18],[-178,43.6,-14],[-166,44,14],[26,43.4,14],[-86,43.4,18],[122,43.6,22],[2,43.4,38],[94,43.6,42],[-158,44,46],[-98,43.4,46],[106,43.6,70],[-158,43.5,78],[-86,43.1,78],[10,43.4,78],[82,43.6,94],[-14,43.4,98],[-66,43.4,102],[94,43.6,122],[82,43.6,154],[70,43.6,186],[-106,44,238],[54,43.6,250],[-106,44,274],[50,43.6,282],[70,43.6,306],[-90,44,322],[98,43.6,322],[138,43.6,334],[170,43.6,334],[70,43.6,338],[214,43.6,338],[246,43.6,338],[106,43.6,390],[138,43.6,390],[182,43.6,394],[214,43.6,394],[54,43.6,398],[246,43.6,398],[82,43.6,414]];

const POT = [[214,43.6,-278],[86,43.3,-202],[54,43.3,-130],[142,43.6,-130],[38,43.4,-58],[-182,43.7,-42],[-98,43.4,-38],[118,43.6,18],[-166,43.9,30],[26,43.4,30],[-86,43.4,34],[82,43.6,86],[-14,43.4,90],[66,43.6,158],[-106,44,234],[50,43.6,262],[-90,44,314],[90,43.6,322],[162,43.6,334],[234,43.6,338],[66,43.6,394],[138,43.6,406],[210,43.6,410]];

const POLE = [[210,43.6,-278],[198,43.6,-246],[82,43.3,-202],[58,43.3,-134],[146,43.6,-130],[46,43.3,-102],[50,43.3,-62],[-150,43.3,-46],[-182,43.6,-34],[-98,43.4,-34],[34,43.4,-30],[-170,43.8,-2],[-86,43.4,-2],[22,43.4,2],[114,43.6,18],[-86,43.4,38],[14,43.4,38],[-162,43.9,42],[94,43.6,54],[-150,43.6,74],[-90,43.4,74],[6,43.4,74],[106,43.6,86],[-70,43.4,102],[78,43.6,106],[2,43.4,110],[90,43.6,138],[78,43.6,170],[78,43.6,206],[62,43.6,258],[-94,43.5,286],[54,43.6,294],[82,43.6,318],[-106,41.4,326],[114,43.6,330],[150,43.6,334],[186,43.6,334],[226,43.6,338],[94,43.6,390],[130,43.6,390],[170,43.6,394],[206,43.6,394],[242,43.6,398],[42,43.6,402]];

/**
 * The lamp posts the MAP already carries. The photogrammetry mesh has real
 * posts baked into it — the tall highway lamps down the flyover deck and the
 * street lamps along the western avenue — and they never lit, because the
 * merged mesh has no per-object anything. Erecting new procedural stands next
 * to them doubled every pole, so instead the existing posts were found by
 * scanning the baked height field for thin spikes 4–8 m above their local
 * ground (the same trick that found the parked buses), and only the LIGHT is
 * added: a glowing head where each post tops out, a pool on the surface
 * beneath it, and a halo. Rows are [x, headY, z, groundY].
 */
const BAKED_LAMPS = [[110.6,55.1,-233.1,43.5],[-108.9,53.8,-10.1,43.4],[-167.4,52.5,55.4,43.6],[-166.4,52.1,60.4,43.6],[-88.9,53.8,69.2,43.4],[-164.6,53.3,69.4,43.5],[-197.2,54.4,70.4,41.3],[-80.4,51.3,71.9,43.4],[-196.4,54.4,74.9,41.4],[30.6,72.9,75.9,61.7],[-234.7,52.1,80.9,39.7],[52.6,72.9,81.9,61.7],[-236.4,52.1,86.9,39.6],[-80.4,63.2,99.9,56.5],[-148.4,51.6,105.9,43.5],[-138.4,51.6,105.9,43.6],[-198.1,53.5,113.1,40.5],[-132.4,63.2,124.9,57.2],[-145.9,53.0,127.9,42.9],[-142.9,52.3,138.7,43.0],[14.6,72.9,138.9,61.7],[35.6,72.9,144.9,61.7],[-201.7,51.0,153.6,40.1],[-209.2,51.0,155.5,39.9],[-123.4,51.6,162.9,43.7],[-123.9,52.4,192.4,43.4],[-8.4,73.3,205.9,61.7],[-55.8,53.8,221.2,43.1],[-106.4,52.2,256.4,43.7],[-104.9,52.3,260.9,44.0],[-39.0,49.4,261.3,43.2],[-119.4,49.5,264.9,42.8],[-95.4,53.3,300.4,43.5],[-94.4,53.6,305.9,43.5],[-150.4,47.9,317.9,40.4],[-98.4,49.5,319.9,41.9],[-179.4,49.3,326.9,39.6],[-103.4,49.5,327.9,42.6],[-114.4,49.5,332.9,42.1],[-173.4,51.4,334.9,39.7],[-109.4,52.7,334.9,42.8],[-121.9,52.3,336.9,41.7],[-75.4,49.9,340.4,43.6],[-37.4,72.9,340.9,61.7],[-15.4,72.9,342.9,61.7],[29.1,49.5,343.9,43.2],[-11.4,72.9,406.9,61.7],[-33.4,72.8,411.9,61.7],[29.6,51.2,420.9,43.6],[-19.4,72.9,478.9,61.7]];

/* The soundscape needs to know what you are standing next to — a tea shop
   sounds different from four lanes of traffic — so the same anchors drive it. */
export const ANCHORS = { BUS, TAXI, TEA, STALL, POT, POLE };

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

/**
 * Merge sub-parts into one geometry.
 *
 * mergeGeometries returns **null**, not an error, when the inputs disagree on
 * whether they are indexed — and BoxGeometry and CylinderGeometry are indexed
 * while ExtrudeGeometry is not. A null geometry then reaches the renderer and
 * throws once per frame, from a stack that says nothing about geometry. So:
 * flatten everything to non-indexed first, and refuse loudly if it still fails.
 */
function merge(parts, what) {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(flat, false);
  if (!out) throw new Error(`props: could not merge geometry for ${what}`);
  return out;
}

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
/* A rounded slab, extruded along its length. This is what stops the vehicles
   reading as boxes: a real bus is a rounded-corner extrusion with a strong
   horizontal glass band, and the bevel doing the corner work is what the eye
   reads first — long before it counts polygons. Bevelled extrusion buys that
   silhouette for a couple of hundred triangles. */
function shellGeo(w, h, len, radius, bevel = 0.06) {
  const hw = w / 2, r = Math.min(radius, hw - 0.001, h / 2 - 0.001);
  const sh = new THREE.Shape();
  sh.moveTo(-hw + r, -h / 2);
  sh.lineTo(hw - r, -h / 2);
  sh.quadraticCurveTo(hw, -h / 2, hw, -h / 2 + r);
  sh.lineTo(hw, h / 2 - r);
  sh.quadraticCurveTo(hw, h / 2, hw - r, h / 2);
  sh.lineTo(-hw + r, h / 2);
  sh.quadraticCurveTo(-hw, h / 2, -hw, h / 2 - r);
  sh.lineTo(-hw, -h / 2 + r);
  sh.quadraticCurveTo(-hw, -h / 2, -hw + r, -h / 2);
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: len - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel,
    bevelThickness: bevel, bevelSegments: 1, curveSegments: 3, steps: 1,
  });
  g.translate(0, 0, -(len - bevel * 2) / 2);
  g.scale(S, S, S);
  return g;
}

/**
 * A road wheel: tyre plus a paler hub.
 *
 * Rotated about **Z**, not X. A cylinder's axis starts along Y, so rotateX
 * swings it to Z — pointing the axle down the length of the vehicle, which
 * mounts every wheel like a barrel facing forward and throws its diameter out
 * sideways. That alone made the bus measure 3.35 m across instead of 2.50.
 * The axle has to run along X, which is a Z rotation.
 */
function wheelGeo(x, y, z, r = 0.32, width = 0.20) {
  const tyre = new THREE.CylinderGeometry(m(r), m(r), m(width), 10);
  tyre.rotateZ(Math.PI / 2); tyre.translate(m(x), m(y), m(z));
  const hub = new THREE.CylinderGeometry(m(r * 0.46), m(r * 0.46), m(width * 1.10), 8);
  hub.rotateZ(Math.PI / 2); hub.translate(m(x), m(y), m(z));
  return [paint(tyre, 0x141416), paint(hub, 0x6a6f77)];
}

/**
 * YBS bus: 11.5 x 2.5 x 3.2 m.
 *
 * The body is left white so the per-instance colour supplies the livery — YBS
 * runs flat single colours, which is why a Yangon bus reads as one strong slab
 * of hue. Everything that must stay dark whatever colour the bus is (glass,
 * tyres, grille) is painted here and comes through tinted only slightly, which
 * is what happens to real glass on a coloured bus anyway.
 */
function busGeo() {
  /* bevelSize offsets the shape outline *outward*, so a 2.50 m body drawn with
     a 0.10 bevel is really 2.70 m across. Any band meant to sit proud of it has
     to clear that, or it is swallowed and the bus goes back to being a slab.
     These widths are all derived from BODY_W rather than guessed. */
  const BODY_W = 2.30, BODY_BEVEL = 0.10;
  const OUTER = BODY_W + BODY_BEVEL * 2;              // 2.50, the real width
  const body = paint(shellGeo(BODY_W, 2.55, 11.5, 0.34, BODY_BEVEL), 0xffffff);
  body.translate(0, m(1.62), 0);

  const roof = paint(shellGeo(BODY_W - 0.24, 0.34, 11.1, 0.14, 0.04), 0xf4f4f2);
  roof.translate(0, m(2.86), 0);

  // glass band: proud of OUTER, and up where a bus's windows actually are
  const glass = paint(shellGeo(OUTER + 0.02, 1.05, 9.70, 0.18, 0.02), 0x222833);
  glass.translate(0, m(1.98), m(-0.30));

  const parts = [body, roof, glass,
    paint(box(OUTER + 0.06, 0.10, 9.72, 0, 1.98, -0.30), 0x2f3742),   // window divider
    paint(box(2.10, 0.94, 0.14, 0, 1.98, 5.76), 0x1d222c),            // windscreen
    paint(box(2.16, 0.30, 0.12, 0, 2.62, 5.75), 0xf0efe8),            // destination board
    paint(box(2.46, 0.26, 0.14, 0, 0.66, 5.76), 0x3a3f47),            // bumpers
    paint(box(2.46, 0.26, 0.14, 0, 0.66, -5.76), 0x3a3f47),
    paint(box(0.36, 0.20, 0.10, -0.80, 0.98, 5.80), 0xfff3d0),        // head lamps
    paint(box(0.36, 0.20, 0.10,  0.80, 0.98, 5.80), 0xfff3d0),
    paint(box(0.30, 0.18, 0.10, -0.80, 1.02, -5.80), 0x8e2b22),       // tail lamps
    paint(box(0.30, 0.18, 0.10,  0.80, 1.02, -5.80), 0x8e2b22),
    ...wheelGeo(-1.06, 0.52, 3.65, 0.52, 0.26), ...wheelGeo(1.06, 0.52, 3.65, 0.52, 0.26),
    ...wheelGeo(-1.06, 0.52, -3.60, 0.52, 0.26), ...wheelGeo(1.06, 0.52, -3.60, 0.52, 0.26),
  ];
  return merge(parts, 'bus');
}

/**
 * Taxi: the 4.4 m Probox/Fielder wagon most of Yangon's fleet actually is. Two
 * stacked shells — a lower body, and a narrower greenhouse set back over the
 * rear axle — which is the whole reason it reads as a car and not a brick.
 */
function taxiGeo() {
  const LOWER_W = 1.58, LOWER_BEVEL = 0.07;            // outer 1.72, the real width
  const CABIN_W = 1.42, CABIN_BEVEL = 0.07;
  const CABIN_OUTER = CABIN_W + CABIN_BEVEL * 2;      // 1.56 — narrower than the body

  const lower = paint(shellGeo(LOWER_W, 0.86, 4.40, 0.26, LOWER_BEVEL), 0xffffff);
  lower.translate(0, m(0.70), 0);
  const cabin = paint(shellGeo(CABIN_W, 0.78, 2.60, 0.30, CABIN_BEVEL), 0xffffff);
  cabin.translate(0, m(1.48), m(-0.22));
  const glass = paint(shellGeo(CABIN_OUTER + 0.02, 0.44, 2.42, 0.16, 0.02), 0x232a35);
  glass.translate(0, m(1.54), m(-0.22));

  const parts = [lower, cabin, glass,
    paint(box(1.70, 0.16, 0.10, 0, 0.44, 2.24), 0x3c414a),           // bumpers
    paint(box(1.70, 0.16, 0.10, 0, 0.44, -2.24), 0x3c414a),
    paint(box(0.30, 0.14, 0.08, -0.62, 0.76, 2.26), 0xfff3d0),       // head lamps
    paint(box(0.30, 0.14, 0.08,  0.62, 0.76, 2.26), 0xfff3d0),
    paint(box(0.24, 0.18, 0.08, -0.64, 0.88, -2.26), 0x8e2b22),      // tail lamps
    paint(box(0.24, 0.18, 0.08,  0.64, 0.88, -2.26), 0x8e2b22),
    paint(box(0.16, 0.10, 0.14, -0.86, 1.38, 1.02), 0x2b2f36),       // mirrors
    paint(box(0.16, 0.10, 0.14,  0.86, 1.38, 1.02), 0x2b2f36),
    ...wheelGeo(-0.76, 0.33, 1.42, 0.33, 0.20), ...wheelGeo(0.76, 0.33, 1.42, 0.33, 0.20),
    ...wheelGeo(-0.76, 0.33, -1.44, 0.33, 0.20), ...wheelGeo(0.76, 0.33, -1.44, 0.33, 0.20),
  ];
  return merge(parts, 'taxi');
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
  return merge(parts, 'prop');
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
  return merge(parts, 'stall frame');
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
  return merge(parts, 'pot stand');
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
  return merge(parts, 'pole');
}

/**
 * The lamps a vehicle carries, as their own geometry so they can be driven to
 * full brightness at night without the bodywork coming with them. Built on the
 * same transform list as the vehicle, from an identically seeded PRNG.
 *
 * This is most of what makes the road read as alive after dark: 84 vehicles is
 * 84 pairs of headlights and 84 pairs of tail lights, and at a junction this
 * size that is the whole picture.
 */
function busLightsGeo() {
  return merge([
    paint(box(0.40, 0.24, 0.06, -0.80, 0.98, 5.86), 0xfff0c8),
    paint(box(0.40, 0.24, 0.06,  0.80, 0.98, 5.86), 0xfff0c8),
    paint(box(0.34, 0.22, 0.06, -0.80, 1.02, -5.86), 0xff5a3c),
    paint(box(0.34, 0.22, 0.06,  0.80, 1.02, -5.86), 0xff5a3c),
  ], 'bus lights');
}

function taxiLightsGeo() {
  return merge([
    paint(box(0.34, 0.18, 0.05, -0.62, 0.76, 2.31), 0xfff0c8),
    paint(box(0.34, 0.18, 0.05,  0.62, 0.76, 2.31), 0xfff0c8),
    paint(box(0.28, 0.22, 0.05, -0.64, 0.88, -2.31), 0xff5a3c),
    paint(box(0.28, 0.22, 0.05,  0.64, 0.88, -2.31), 0xff5a3c),
  ], 'taxi lights');
}

/**
 * The bare bulb a tea shop runs off a length of flex, and the patch of
 * pavement it lights. Same trick as the street lamp's pool — the falloff is
 * baked into the vertex colours, because black adds nothing under additive
 * blending and a flat disc would read as paint on the ground.
 */
function shopBulbGeo() {
  const bulb = new THREE.SphereGeometry(m(0.10), 7, 5);
  bulb.translate(0, m(2.05), 0);
  paint(bulb, 0xffffff);

  const pool = new THREE.CircleGeometry(m(1.35), 12);
  pool.rotateX(-Math.PI / 2);
  const pos = pool.attributes.position;
  const col = new Float32Array(pos.count * 3);
  let rMax = 0;
  for (let i = 0; i < pos.count; i++) rMax = Math.max(rMax, Math.hypot(pos.getX(i), pos.getZ(i)));
  for (let i = 0; i < pos.count; i++) {
    const v = Math.pow(1 - Math.hypot(pos.getX(i), pos.getZ(i)) / (rMax || 1), 1.6);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  pool.setAttribute('color', new THREE.BufferAttribute(col, 3));
  pool.translate(0, m(0.05), 0);
  return merge([bulb, pool], 'shop bulb');
}

/** The lit parts, kept apart so they can be driven to full brightness without
    the pole going with them. Sodium-orange: Yangon's street lighting is still
    mostly warm, and it is half of why the city reads the way it does at dusk. */
function lampLensGeo() {
  return paint(box(0.40, 0.05, 0.18, 1.20, 5.96, 0), 0xffffff);
}

/** A standalone pool for the baked posts — same vertex-colour falloff as the
    street-lamp pool, centred on the origin so it can sit under any post. */
function bakedPoolGeo() {
  const disc = new THREE.CircleGeometry(m(3.8), 16);
  disc.rotateX(-Math.PI / 2);
  const pos = disc.attributes.position;
  const col = new Float32Array(pos.count * 3);
  let rMax = 0;
  for (let i = 0; i < pos.count; i++) rMax = Math.max(rMax, Math.hypot(pos.getX(i), pos.getZ(i)));
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i)) / (rMax || 1);
    const v = Math.pow(1 - r, 1.7);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  disc.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return disc;
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
  const disc = new THREE.CircleGeometry(m(3.4), 14);
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

  return merge([disc, bulb], 'lamp glow');
}

/* ------------------------------------------------------- downloaded models */

/**
 * Flatten a downloaded GLB into one instanceable geometry.
 *
 * InstancedMesh needs a single geometry and a single material, and these models
 * arrive as several meshes with a material each. Since they are untextured flat
 * colours, every primitive's base colour is baked into vertex colours and the
 * lot merged — which also lets the body keep taking a per-instance tint, the
 * same trick the procedural props use.
 *
 * @param bodyMat name of the material that is the paintwork. It is baked white
 *                so `instanceColor` supplies the colour; everything else keeps
 *                its own, so glass and tyres do not go blue with the bodywork.
 * @param length  real length in metres, scaled uniformly.
 * @param size    [width, height, length] in metres — corrects all three axes
 *                independently, for a model whose proportions are wrong.
 */
export async function loadVehicleGeometry(url, { bodyMat, length, size }) {
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.updateWorldMatrix(true, true);

  const parts = [];
  let textured = null;          // a model that carries its own map keeps it
  gltf.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (mat && mat.map) {
      /* Baking vertex colours would throw the texture away, and a textured
         vehicle cannot be recoloured per instance anyway — which is fine for a
         fleet that runs one livery. Keep the material and skip the paint. */
      textured = mat;
    } else {
      const isBody = mat && mat.name === bodyMat;
      const hex = isBody || !mat || !mat.color ? 0xffffff : mat.color.getHex();
      paint(g, hex);
    }
    parts.push(g.index ? g.toNonIndexed() : g);
  });
  if (!parts.length) throw new Error(`no meshes in ${url}`);

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error(`could not merge ${url}`);

  /* Normalise. The model arrives at whatever scale and proportion its author
     chose, and stock low-poly vehicles are drawn stubby: this bus is natively
     3.66 m across where a real one is 2.50, which would make it the widest
     thing on a map whose entire scale was derived from bus dimensions.

     So `size` corrects all three axes independently rather than scaling
     uniformly. The distortion that costs is small and lands where it does not
     show: the wheels' axles run along X, so narrowing X only makes the tyres
     thinner, and the 0.9 on height is too slight to read. */
  merged.computeBoundingBox();
  const bb = merged.boundingBox;
  const nat = new THREE.Vector3(); bb.getSize(nat);
  merged.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);

  const longAxis = nat.x > nat.z ? 'x' : 'z';
  if (size) {
    const [w, hgt, len] = size;
    const sx = ((longAxis === 'x' ? len : w) * S) / nat.x;
    const sy = (hgt * S) / nat.y;
    const sz = ((longAxis === 'x' ? w : len) * S) / nat.z;
    merged.scale(sx, sy, sz);
  } else {
    const k = (length * S) / Math.max(nat.x, nat.z);
    merged.scale(k, k, k);
  }
  // length must run along Z, the axis the road yaw is applied about
  if (longAxis === 'x') merged.rotateY(Math.PI / 2);
  merged.computeVertexNormals();
  return { geometry: merged, material: textured };
}

/**
 * Repaint a palette-atlas model into a YBS livery.
 *
 * The downloaded bus does not carry a livery — its 256x256 map is a five-colour
 * palette (window blue, body, indicator orange, tyre grey, tail red) that each
 * UV island samples as a flat patch. The body patch is `#e0e0e0`, which is why
 * a fleet of them reads as white blocks.
 *
 * So the body patch is found by value rather than by position — it is the one
 * bright, near-neutral colour in the palette — and repainted. Everything
 * saturated is left alone, so the glass stays glass and the indicators stay
 * orange instead of being dragged along by a per-instance tint.
 */
function makeLivery(srcTex, bodyHex) {
  const img = srcTex.image;
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  /* Unpack the hex by hand. THREE.Color applies colour management and stores
     linear values, so `col.r * 255` writes a linear number into an sRGB canvas
     and the livery comes out far darker than asked for — 0x1f5fa8 landed near
     #001060. The canvas wants the sRGB bytes, which is what the literal is. */
  const R = (bodyHex >> 16) & 255, G = (bodyHex >> 8) & 255, B = bodyHex & 255;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx > 190 && mx - mn < 26) { px[i] = R; px[i + 1] = G; px[i + 2] = B; }
  }
  ctx.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c);
  /* Match the source exactly. A GLTF texture is flipY:false; CanvasTexture
     defaults to true, and getting that wrong turns the bus inside out. */
  t.colorSpace = srcTex.colorSpace;
  t.flipY = srcTex.flipY;
  t.wrapS = srcTex.wrapS; t.wrapT = srcTex.wrapT;
  t.needsUpdate = true;
  return t;
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

/* ------------------------------------------------------------------ halos */

/**
 * The warm bloom around every light source after dark. Real bloom is a
 * post-pass this page cannot afford; a camera-facing radial-gradient sprite at
 * each bulb reads the same at a thousandth of the cost, and THREE.Points keeps
 * the whole layer to ONE draw call per group. This—not the lens geometry—is
 * what makes the night look lit rather than merely marked.
 */
function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function haloPoints(entries, map) {
  const n = entries.length;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const c = new THREE.Color();
  entries.forEach((e, i) => {
    pos[i * 3] = e.x; pos[i * 3 + 1] = e.y; pos[i * 3 + 2] = e.z;
    c.setHex(e.color);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = e.size;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uMap: { value: map } },
    vertexShader: `
      attribute float aSize; attribute vec3 aColor;
      varying vec3 vC;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        /* world-sized sprite, clamped so a halo the camera drives through
           cannot flood the frame */
        gl_PointSize = clamp(aSize * 430.0 / max(-mv.z, 2.0), 2.0, 128.0);
        vC = aColor;
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform float uOpacity;
      varying vec3 vC;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        gl_FragColor = vec4(vC, 1.0) * a * uOpacity;
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  points.renderOrder = 4;
  return { points, mat };
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

    /* Vehicles are now ~760 triangles each rather than ~170, which is what buys
       the rounded body and the glass band. At that price the full 108-strong
       taxi list is 82k triangles on its own — more than the entire map — so the
       fleet is thinned by taking every Nth anchor. Every Nth rather than the
       first N: slicing the head of the list would empty one end of the junction
       and leave the other bumper to bumper, because the anchors were generated
       in scan order. */
    /* The downloaded models are ~4x the triangles of the procedural ones they
       replace (2.2k and 3.1k against 768 and 756), so the low tier thins the
       fleet much harder than it used to. Fewer real vehicles beats more toy
       ones — a phone still gets a bus that looks like a bus. */
    const cut = tier === 'hi' ? 1 : 0.35;
    const BUS_SEED = 0x425553, TAXI_SEED = 0x545849;   // "BUS", "TXI"
    const every = (arr, n) => arr.filter((_, i) => i % n === 0);
    const take = (arr, n = 1) => {
      const thinned = every(arr, n);
      return thinned.slice(0, Math.max(1, Math.round(thinned.length * cut)));
    };

    /* A prop whose tint must not spread over its whole body is built as two
       meshes sharing one transform list. Both are laid out from a PRNG seeded
       identically, so the tarp lands on its own poles. */
    const pair = (a, b, rows, colours, seed, jitter) => [
      instanced(a, mk(), rows, colours, mulberry32(seed), jitter),
      instanced(b, mk(), rows, null,    mulberry32(seed), jitter),
    ];

    const busRows = take(BUS);
    const taxiRows = take(TAXI, 2);
    this._busRows = busRows;
    this._busSeed = BUS_SEED;
    this._mk = mk;

    this.meshes = [
      instanced(busGeo(),      mk(), busRows,  BUS_COLOURS,  mulberry32(BUS_SEED),  0.05),
      instanced(taxiGeo(),     mk(), taxiRows, TAXI_COLOURS, mulberry32(TAXI_SEED), 0.07),
      ...pair(teaTarpGeo(),    teaFrameGeo(),   TEA,   TARP_COLOURS, 0x54454, 0),
      ...pair(stallCanopyGeo(), stallFrameGeo(), STALL, TARP_COLOURS, 0x5741, 0),
      instanced(potStandGeo(), mk(), POT,         null,          rng, 0),
      instanced(poleGeo(),     mk(), POLE,   null,          mulberry32(0x504C45), 0),
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
    this.meshes.push(lamp);
    /* The pools are big additive discs, and additive discs are fill rate — the
       one thing a phone GPU has least of. The lens and the vehicle lamps are a
       few pixels each and stay; the pools are a high-tier luxury. */
    let glow = null;
    if (tier === 'hi') {
      glow = instanced(lampGlowGeo(), glowMat, POLE, null, mulberry32(0x504C45), 0);
      glow.renderOrder = 3;
      this.meshes.push(glow);
    }

    /* Vehicle lamps and tea-shop bulbs, on the same transforms as the things
       they belong to. Additive and unlit, like the street lamps, and driven by
       the same preset value — after dark the road is mostly these. */
    const vehMat = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const bulbMat = new THREE.MeshBasicMaterial({
      vertexColors: true, color: 0xffcf8a, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.vehMat = vehMat;
    this.bulbMat = bulbMat;
    const busLights = instanced(busLightsGeo(), vehMat, busRows, null, mulberry32(BUS_SEED), 0.05);
    const taxiLights = instanced(taxiLightsGeo(), vehMat, taxiRows, null, mulberry32(TAXI_SEED), 0.07);
    const bulbs = instanced(shopBulbGeo(), bulbMat, TEA.concat(STALL), null, mulberry32(0x42554C), 0);
    busLights.renderOrder = 3; taxiLights.renderOrder = 3; bulbs.renderOrder = 3;
    this.meshes.push(busLights, taxiLights, bulbs);

    /* ---- the warm layer: halo sprites on every source, in two draw calls.
       Positions replay the exact PRNG sequences the instanced meshes used, so
       each halo sits on its own bulb whatever yaw the pole rolled. ---- */
    const tex = haloTexture();
    const gridHalos = [];
    {
      const r = mulberry32(0x504C45);
      for (const row of POLE) {
        const yaw = r() * Math.PI * 2;
        const sc = 0.94 + r() * 0.12;
        gridHalos.push({
          x: row[0] + Math.cos(yaw) * m(1.20) * sc,
          y: row[1] + m(5.96) * sc,
          z: row[2] - Math.sin(yaw) * m(1.20) * sc,
          size: m(2.6), color: 0xffb45e,
        });
      }
      const rb = mulberry32(0x42554C);
      for (const row of TEA.concat(STALL)) {
        rb();                                   // yaw — the bulb is on the axis
        const sc = 0.94 + rb() * 0.12;
        gridHalos.push({ x: row[0], y: row[1] + m(2.05) * sc, z: row[2], size: m(1.6), color: 0xffcf8a });
      }
    }

    /* Neon. Yangon shopfronts run LED sign strips in saturated colour, and
       they are what separates "a lit street" from "a city at night". One
       instanced bar over every tea shop and half the stalls, each in its own
       hue, each with a matching halo — driven by the same photocell as the
       lamps so the strip wakes with the street. */
    const NEON = [0x39d8ff, 0xff4fa3, 0x51ff8a, 0xffc23e, 0xff5a4a, 0x6a8dff];
    const neonRows = TEA.concat(STALL.filter((_, i) => i % 2 === 0));
    const neonGeo = paint(box(1.7, 0.3, 0.09, 0, 2.95, 0), 0xffffff);
    this.neonMat = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const neon = instanced(neonGeo, this.neonMat, neonRows, NEON, mulberry32(0x4E454F), 0);
    neon.renderOrder = 3;
    this.meshes.push(neon);
    neonRows.forEach((row, i) => {
      gridHalos.push({ x: row[0], y: row[1] + m(2.95), z: row[2], size: m(1.5), color: NEON[(i * 7 + 3) % NEON.length] });
    });
    this._neon = neon;

    /* The map's own posts, lit in place: a glowing head at each detected top,
       a pool on the surface below it, a halo. No new geometry stands anywhere
       — the post itself is already in the photogrammetry. */
    this.bakedMat = new THREE.MeshBasicMaterial({
      vertexColors: true, color: 0xffd9a0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const headRows = BAKED_LAMPS.map((r) => [r[0], r[1] - m(0.12), r[2]]);
    const heads = instanced(paint(new THREE.SphereGeometry(m(0.34), 8, 6), 0xffffff),
      this.bakedMat, headRows, null, mulberry32(0x4C414D), 0);
    heads.renderOrder = 3;
    this.meshes.push(heads);
    let bakedPools = null;
    if (tier === 'hi') {
      const poolRows = BAKED_LAMPS.map((r) => [r[0], r[3] + m(0.06), r[2]]);
      bakedPools = instanced(bakedPoolGeo(), this.glowMat, poolRows, null, mulberry32(0x4C414D), 0);
      bakedPools.renderOrder = 3;
      this.meshes.push(bakedPools);
    }
    for (const r of BAKED_LAMPS) {
      gridHalos.push({ x: r[0], y: r[1], z: r[2], size: r[3] > 50 ? m(3.4) : m(3.0), color: 0xffb45e });
    }
    this._bakedHeads = heads;
    this._bakedPools = bakedPools;
    const vehHalos = [];
    const vehLampPoints = (rows, seed, jitter, lampsLocal) => {
      const r = mulberry32(seed);
      for (const row of rows) {
        let yaw = (row.length > 3 ? row[3] : 0) + (r() < 0.5 ? 0 : Math.PI);
        yaw += (r() - 0.5) * jitter;
        const sc = 0.94 + r() * 0.12;
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        for (const [lx, ly, lz, size, color] of lampsLocal) {
          const x = lx * sc, z = lz * sc;
          vehHalos.push({
            x: row[0] + x * cos + z * sin,
            y: row[1] + ly * sc,
            z: row[2] - x * sin + z * cos,
            size, color,
          });
        }
      }
    };
    vehLampPoints(busRows, BUS_SEED, 0.05, [
      [m(-0.80), m(0.98), m(5.90), m(1.05), 0xfff0c8], [m(0.80), m(0.98), m(5.90), m(1.05), 0xfff0c8],
      [m(-0.80), m(1.02), m(-5.90), m(0.75), 0xff5a3c], [m(0.80), m(1.02), m(-5.90), m(0.75), 0xff5a3c],
    ]);
    vehLampPoints(taxiRows, TAXI_SEED, 0.07, [
      [m(-0.62), m(0.76), m(2.34), m(0.85), 0xfff0c8], [m(0.62), m(0.76), m(2.34), m(0.85), 0xfff0c8],
      [m(-0.64), m(0.88), m(-2.34), m(0.62), 0xff5a3c], [m(0.64), m(0.88), m(-2.34), m(0.62), 0xff5a3c],
    ]);
    this._haloGrid = haloPoints(gridHalos, tex);
    this._haloVeh = haloPoints(vehHalos, tex);
    this.group.add(this._haloGrid.points, this._haloVeh.points);

    /* Six real point lights over the heart of the junction, high tier only —
       the sodium pools that actually light the road and anyone standing on
       it. Everything further out lives on halos and the baked pool discs. */
    this._lampLights = [];
    if (tier === 'hi') {
      const LIT_POLES = [[34, 43.4, -30], [-98, 43.4, -34], [114, 43.6, 18],
                         [14, 43.4, 38], [-90, 43.4, 74], [6, 43.4, 74],
                         /* two of the flyover's real posts light the deck */
                         [30.6, 61.7, 75.9], [14.6, 61.7, 138.9]];
      for (const [x, y, z] of LIT_POLES) {
        const l = new THREE.PointLight(0xffa14f, 0, m(34), 2);
        l.position.set(x, y + m(5.9), z);
        l.visible = false;
        this.group.add(l);
        this._lampLights.push(l);
      }
    }

    /* Everything that can be switched off, so setGlow can stop drawing it when
       the preset has it dark. */
    this._lit = [lamp, glow, busLights, taxiLights, bulbs, neon, heads, bakedPools].filter(Boolean);
    for (const mesh of this.meshes) this.group.add(mesh);

    if (tier === 'hi') this.group.add(this._cables(rng));

    /* Solid footprints, so none of this can be walked through. Vehicles use
       their real dimensions rotated to the road; pavement props get a square
       roughly the size of the thing you would actually bump into — the tea
       shop's tarp is 3.2 m across but its poles and stools are what stop you,
       so it is deliberately smaller than the canopy. */
    this.obstacles = new ObstacleField();
    this.obstacles.add(busRows,  m(2.50), m(11.5), m(3.2));
    this.obstacles.add(taxiRows, m(1.78), m(4.40), m(1.6));
    this.obstacles.add(TEA,   m(2.6), m(2.6), m(2.3));
    this.obstacles.add(STALL, m(1.5), m(1.1), m(2.2));
    this.obstacles.add(POT,   m(1.1), m(0.5), m(1.5));
    this.obstacles.add(POLE, m(0.4), m(0.4), m(8.0), 1);
    this.obstacles.build();

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
  /**
   * Swap a procedurally built vehicle for a downloaded model, keeping the
   * transforms, the colours and the lamp layer exactly as they were. Called
   * after load, so the map is interactive before the extra download lands and
   * a failed fetch simply leaves the procedural one in place.
   */
  replaceVehicle(kind, loaded, liveries) {
    const idx = kind === 'bus' ? 0 : 1;
    const mesh = this.meshes[idx];
    if (!mesh || !loaded || !loaded.geometry) return false;
    mesh.geometry.dispose();
    mesh.geometry = loaded.geometry;
    if (loaded.material) {
      /* A textured model brings its own material, and with it its own colour —
         so drop the per-instance tint, which would multiply the livery. */
      mesh.material = loaded.material;
      mesh.instanceColor = null;
    }
    mesh.computeBoundingSphere();

    /* One texture per livery, one InstancedMesh per texture. A per-instance
       tint cannot do this job: it multiplies the whole map, so painting a bus
       green would take its windows and indicators with it. Splitting the fleet
       costs a draw call each and keeps every other colour on the bus intact. */
    if (liveries && liveries.length > 1 && loaded.material && loaded.material.map) {
      const rows = this._busRows || [];
      const per = Math.ceil(rows.length / liveries.length);
      liveries.forEach((hex, i) => {
        const slice = rows.slice(i * per, (i + 1) * per);
        if (!slice.length) return;
        const mat = loaded.material.clone();
        mat.map = makeLivery(loaded.material.map, hex);
        if (i === 0) { mesh.material = mat; this._reseat(mesh, slice); return; }
        const extra = new THREE.InstancedMesh(loaded.geometry, mat, slice.length);
        this._reseat(extra, slice);
        extra.castShadow = extra.receiveShadow = false;
        extra.matrixAutoUpdate = false;
        this.group.add(extra);
        this.meshes.push(extra);
      });
    }
    return true;
  }

  /** Rewrite an InstancedMesh's transforms from a slice of anchor rows. */
  _reseat(mesh, rows) {
    const dummy = new THREE.Object3D();
    const rng = mulberry32(this._busSeed || 1);
    mesh.count = rows.length;
    rows.forEach((r, i) => {
      dummy.position.set(r[0], r[1], r[2]);
      dummy.rotation.y = (r.length > 3 ? r[3] : 0) + (rng() < 0.5 ? 0 : Math.PI) + (rng() - 0.5) * 0.05;
      const sc = 0.94 + rng() * 0.12;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }

  /**
   * @param lamps      street lamps and shop bulbs, 0..1 — these are on the grid
   * @param headlights vehicle lamps, 0..1 — these are not. In a blackout the
   *                   street is dark and the traffic is still lit, which is
   *                   exactly what the junction looks like when the power goes.
   */
  setGlow(lamps, headlights = lamps) {
    const a = Math.max(0, Math.min(1, lamps));
    const h = Math.max(0, Math.min(1, headlights));
    this.lampMat.opacity = a;
    this.glowMat.opacity = a * 0.6;
    this.bulbMat.opacity = a * 0.9;
    this.vehMat.opacity = h * 0.95;
    if (this.neonMat) this.neonMat.opacity = a * 0.85;
    if (this.bakedMat) this.bakedMat.opacity = a * 0.95;

    // the halo layer and the sodium pools ride the same photocell
    if (this._haloGrid) {
      this._haloGrid.mat.uniforms.uOpacity.value = a;
      this._haloGrid.points.visible = a > 0.012;
      this._haloVeh.mat.uniforms.uOpacity.value = h * 0.85;
      this._haloVeh.points.visible = h > 0.012;
    }
    if (this._lampLights) {
      for (const l of this._lampLights) {
        l.intensity = a * 340;
        l.visible = a > 0.02;
      }
    }

    /* A transparent mesh at zero opacity still costs a draw call and, worse,
       still rasterises every pixel it covers before blending nothing. At midday
       that is the entire lighting rig drawn for no reason, so switch it off. */
    for (const mesh of this._lit) {
      mesh.visible = mesh.material.opacity > 0.012;
    }
  }

  get count() { return this.meshes.reduce((n, mesh) => n + mesh.count, 0); }
}
