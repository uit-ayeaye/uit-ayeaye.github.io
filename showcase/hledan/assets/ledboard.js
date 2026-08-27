/**
 * The LED billboard on Hledan Centre, and what plays on it.
 *
 * The board is really there. The photogrammetry carries it as a dead black
 * rectangle under the building's own lettering — the one thing on the facade
 * that should be the brightest object in the frame after dark and instead was
 * the darkest. This lights it, and puts the Jolly Roger on it.
 *
 * ---- the panel ----
 *
 * Measured off the map rather than guessed: rays fired at the facade along the
 * board's own centreline come back with two distinct normals, (0.882, 0,
 * -0.471) over the left of the board and (0.773, 0, -0.634) over the right.
 * The wall is not curved there, it is two flat facets meeting at a crease, and
 * the board spans the corner. So the panel is two quads folded along that
 * crease, which is where the two facet planes intersect:
 *
 *     0.882x - 0.471z + 267.55 = 0        (left facet)
 *     0.773x - 0.634z + 326.86 = 0        (right facet)
 *                       ->  (-80.33, 417.63)
 *
 * A single flat quad across the whole board would have to stand about half a
 * metre proud at the fold to clear the wall, and would then float a metre off
 * it at the edges. Folded, it sits 8 cm off the facade everywhere, which is
 * where a real panel sits on its frame.
 *
 * ---- what plays ----
 *
 * Drawn to a canvas rather than shipped as video: it is a few hundred bytes of
 * code against a megabyte of frames, it never has to buffer, and an LED wall's
 * look — dot matrix, scanlines, a hard black between the pixels — is easier to
 * draw than to compress. One 27 KB sprite of the mark does the rest.
 *
 * Four scenes on a loop, each holding for SCENE_HOLD:
 *   MARK    the Jolly Roger over a radar sweep, breathing
 *   CREW    Firebrick field, the studio's name, CLOSE / CONNECTED / BOLD
 *   BANNER  the mark small and left, a scrolling ticker beside it
 *   COLOURS a hoisted flag over a dark skyline — the blackout beat
 *
 * The last one is the point of the other three. This map already carries a
 * Blackout preset because load-shedding is a fact of the street it is a model
 * of, and the author's note on it is that anyone who grew up here knows Hledan
 * better dark than lit. A pirate flag is what a crew flies when it has decided
 * not to be governed by that, which is the whole of One Piece and most of why
 * the mark is a Jolly Roger rather than a logo. So the board plays the flag
 * over a skyline whose lights are going out, and stays up when they do — the
 * one screen on the block still running when the grid is not.
 *
 * The canvas is repainted at 20 fps, not 60. A ticker at this scale moves about
 * a pixel a frame at 60, so two thirds of those repaints were uploading a
 * texture identical to the last one; at 20 the motion is the same and the
 * upload happens a third as often. On the low tier the canvas is half-size as
 * well, which is the difference between a 768x404 upload and a 384x202 one.
 */

const SCENE_HOLD = 5.5;          // seconds per scene
const SCENES = 4;
const SCENE_FADE = 0.55;         // crossfade between them
const REPAINT_HZ = 20;

/* The board, in world units, measured off the facade. Left edge, the crease,
   and the right edge; the two normals are the facets they sit on. */
const BOARD = {
  left:   { x: -76.65, z: 424.47, nx: 0.882, nz: -0.471 },
  crease: { x: -80.33, z: 417.63 },
  right:  { x: -85.44, z: 411.38, nx: 0.773, nz: -0.634 },
  yTop: 95.90,
  yBot: 87.60,
  /* Clear of the wall, and of the wall's own z-fighting. 8 cm at map scale. */
  standoff: 0.12,
};

const hypot = Math.hypot;

/**
 * Two quads, folded along the crease, each lying on its own facet.
 *
 * Built as one non-indexed BufferGeometry so the whole board is a single draw,
 * with U running continuously across the fold in proportion to real width —
 * splitting it evenly instead would stretch the narrower half.
 */
function panelGeometry(THREE) {
  const { left: L, crease: C, right: R, yTop, yBot, standoff: S } = BOARD;
  const wL = hypot(C.x - L.x, C.z - L.z);
  const wR = hypot(R.x - C.x, R.z - C.z);
  const uMid = wL / (wL + wR);

  /* Each facet's own normal pushes its own quad off the wall — but the crease
     vertices are SHARED, offset along the average of the two. Offsetting each
     side along its own normal instead parts them by |nL - nR| * standoff, and
     at this standoff that is 2.4 cm of daylight straight down the middle of the
     screen: a black seam, exactly where the eye is. */
  const mx = (L.nx + R.nx) / 2, mz = (L.nz + R.nz) / 2;
  const ml = Math.hypot(mx, mz);
  const p = (x, z, y, nx, nz) => [x + nx * S, y, z + nz * S];
  const lt = p(L.x, L.z, yTop, L.nx, L.nz);
  const lb = p(L.x, L.z, yBot, L.nx, L.nz);
  const ct = p(C.x, C.z, yTop, mx / ml, mz / ml);
  const cb = p(C.x, C.z, yBot, mx / ml, mz / ml);
  const clt = ct, clb = cb, crt = ct, crb = cb;
  const rt = p(R.x, R.z, yTop, R.nx, R.nz);
  const rb = p(R.x, R.z, yBot, R.nx, R.nz);

  const pos = [], uv = [], nor = [];
  const quad = (a, b, c, d, u0, u1, nx, nz) => {
    // a=topLeft b=botLeft c=botRight d=topRight, wound so the face looks out
    for (const [v, u, w] of [[a, u0, 0], [b, u0, 1], [c, u1, 1],
                             [a, u0, 0], [c, u1, 1], [d, u1, 0]]) {
      pos.push(v[0], v[1], v[2]);
      uv.push(u, 1 - w);
      nor.push(nx, 0, nz);
    }
  };
  quad(lt, lb, clb, clt, 0, uMid, L.nx, L.nz);
  quad(crt, crb, rb, rt, uMid, 1, R.nx, R.nz);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return { geometry: g, aspect: (wL + wR) / (yTop - yBot) };
}

/* ------------------------------------------------------------------ paint */

/**
 * Backbenchers Studio's own palette, off the brand sheet — Electric Blue,
 * Midnight Blue and Firebrick Light. The Jolly Roger is the studio's mark
 * rewritten as a pirate flag: the quadcopter fans become the rotor rings, the
 * console buttons become the target eyes, and the `< / >` of the coding symbol
 * sits on the skull's forehead where a crew's mark goes.
 */
const PALETTE = {
  bg: '#07080c',
  red: '#ff3030',            // Firebrick Light
  blue: '#0066ff',           // Electric Blue
  midnight: '#003066',       // Midnight Blue
  pale: '#f2f4f8',
};

/** Squared-off LED font stack — whatever of these the device actually has. */
const FONT = '"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif';

function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }

/**
 * The dot-matrix mask.
 *
 * Drawn once into its own small canvas and then tiled, because filling a
 * quarter of a million little rectangles a frame is not a thing to do sixty —
 * or even twenty — times a second. The pattern is a black grid with holes: laid
 * over the finished frame at `destination-out` it eats the gaps between the
 * pixels, which is what an LED wall looks like up close and what a plain
 * scanline overlay never quite sells.
 */
function makeDotMask(pitch) {
  const c = document.createElement('canvas');
  c.width = c.height = pitch;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, pitch, pitch);
  x.globalCompositeOperation = 'destination-out';
  x.beginPath();
  x.arc(pitch / 2, pitch / 2, pitch * 0.42, 0, Math.PI * 2);
  x.fill();
  return c;
}

export class LedBoard {
  /**
   * @param scene  THREE.Scene
   * @param THREE  the module
   * @param tier   'hi' | 'lo' — canvas resolution and dot pitch
   * @param markUrl the Jolly Roger sprite, transparent, square
   */
  constructor({ scene, THREE, tier = 'hi', markUrl = 'textures/jolly-roger.webp' }) {
    this.THREE = THREE;
    this.tier = tier;
    this.t = 0;
    this._paintAcc = 0;
    this.scene = scene;

    const { geometry, aspect } = panelGeometry(THREE);

    const W = tier === 'hi' ? 768 : 384;
    const H = Math.round(W / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.W = W; this.H = H;

    this.dot = makeDotMask(tier === 'hi' ? 6 : 4);
    this.dotPattern = this.ctx.createPattern(this.dot, 'repeat');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    this.texture = tex;

    /* Basic, not Standard: a screen emits, it is not lit. `toneMapped` off so
       the panel keeps its own contrast through the Neutral tone curve — an LED
       wall that has been tone-mapped alongside the daylight it is competing
       with reads as grey card, which is what it looked like before. */
    this.material = new THREE.MeshBasicMaterial({
      map: tex, toneMapped: false, fog: true, side: THREE.FrontSide,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'hledan-led-board';
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = true;
    scene.add(this.mesh);

    /* The bloom the panel throws onto the air in front of it. One additive
       quad on the same fold, a touch larger, driven by the night glow — at
       midday it is off, because a screen does not visibly haze in daylight. */
    const glowGeo = panelGeometry(THREE).geometry;
    glowGeo.scale(1, 1, 1);
    this.glowMat = new THREE.MeshBasicMaterial({
      map: tex, toneMapped: false, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: true,
    });
    this.glow = new THREE.Mesh(glowGeo, this.glowMat);
    this.glow.name = 'hledan-led-bloom';
    this.glow.renderOrder = 3;
    /* Nudged further off the wall than the panel so it never z-fights it. */
    this.glow.position.set(BOARD.right.nx * 0.10, 0, BOARD.right.nz * 0.10);
    scene.add(this.glow);

    this.mark = null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { this.mark = img; };
    img.onerror = () => { /* the board still plays, just without the sprite */ };
    img.src = markUrl;

    this._paint(0);
  }

  /** Night glow, 0..1, straight off the weather preset. */
  setGlow(k) {
    this.glowMat.opacity = 0.42 * k;
    this.glow.visible = k > 0.01;
  }

  update(dt) {
    this.t += dt;
    this._paintAcc += dt;
    const step = 1 / REPAINT_HZ;
    if (this._paintAcc < step) return;
    this._paintAcc %= step;
    this._paint(this.t);
    this.texture.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- scenes */

  _paint(t) {
    const g = this.ctx, W = this.W, H = this.H;
    const cycle = SCENE_HOLD * SCENES;
    const phase = t % cycle;
    const idx = Math.floor(phase / SCENE_HOLD);
    const into = phase - idx * SCENE_HOLD;

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = PALETTE.bg;
    g.fillRect(0, 0, W, H);

    const draw = (i, local, alpha) => {
      if (alpha <= 0.002) return;
      g.save();
      g.globalAlpha = alpha;
      if (i === 0) this._sceneMark(g, W, H, local, t);
      else if (i === 1) this._sceneCrew(g, W, H, local, t);
      else if (i === 2) this._sceneBanner(g, W, H, local, t);
      else this._sceneColours(g, W, H, local, t);
      g.restore();
    };

    /* Crossfade the last half-second of a scene into the next, so the board
       never blinks to black between them. */
    const out = into > SCENE_HOLD - SCENE_FADE
      ? (into - (SCENE_HOLD - SCENE_FADE)) / SCENE_FADE : 0;
    draw(idx, into, 1 - ease(out));
    if (out > 0) draw((idx + 1) % SCENES, into - SCENE_HOLD, ease(out));

    // the gaps between the pixels
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = this.dotPattern;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';

    /* A bright band rolling down the panel. Every real LED wall filmed or
       photographed has one; it is the single cheapest cue that this is a screen
       and not a poster. */
    const rollY = ((t * 0.34) % 1.6 - 0.3) * H;
    const grad = g.createLinearGradient(0, rollY, 0, rollY + H * 0.22);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(190,220,255,0.055)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  }

  /** The mark, breathing, over a radar sweep. */
  _sceneMark(g, W, H, local, t) {
    const cx = W * 0.5, cy = H * 0.5;
    const R = H * 0.46;

    // the sweep: a wedge of red rotating behind the skull
    const a = (t * 0.85) % (Math.PI * 2);
    g.save();
    g.translate(cx, cy);
    const sweep = g.createConicGradient ? g.createConicGradient(a, 0, 0) : null;
    if (sweep) {
      sweep.addColorStop(0, 'rgba(255,42,42,0.34)');
      sweep.addColorStop(0.10, 'rgba(255,42,42,0.0)');
      sweep.addColorStop(1, 'rgba(255,42,42,0.0)');
      g.fillStyle = sweep;
      g.beginPath(); g.arc(0, 0, R * 1.5, 0, Math.PI * 2); g.fill();
    }
    // range rings
    g.strokeStyle = 'rgba(255,42,42,0.20)';
    g.lineWidth = Math.max(1, H * 0.004);
    for (let i = 1; i <= 3; i++) {
      g.beginPath(); g.arc(0, 0, R * (0.42 + i * 0.28), 0, Math.PI * 2); g.stroke();
    }
    g.restore();

    // the mark itself, on a slow breath
    const s = 1 + Math.sin(t * 1.5) * 0.022;
    this._blit(g, cx, cy, R * 2.05 * s, 1);

    // whose flag this is
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = PALETTE.pale;
    g.font = `700 ${Math.round(H * 0.088)}px ${FONT}`;
    g.fillText('BACKBENCHERS STUDIO', cx, H * 0.945);

    // corner ticks, so the frame reads as an instrument
    g.strokeStyle = 'rgba(242,244,248,0.5)';
    g.lineWidth = Math.max(1, H * 0.006);
    const m = H * 0.06, L = H * 0.10;
    for (const [px, py, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1],
                                    [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      g.beginPath();
      g.moveTo(px, py + dy * L); g.lineTo(px, py); g.lineTo(px + dx * L, py);
      g.stroke();
    }
  }

  /** Firebrick field, white mark, the studio's name and what it stands for. */
  _sceneCrew(g, W, H, local, t) {
    g.fillStyle = PALETTE.red;
    g.fillRect(0, 0, W, H);
    // darker banding, so the red is not a flat plate
    g.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < H; y += Math.max(3, H * 0.045)) g.fillRect(0, y, W, 1);

    /* The glitch is a horizontal tear, not a colour wash: two slices of the
       panel shifted a few pixels apart for a frame or two. It fires on a
       deterministic beat rather than at random so it never lands twice in a
       row on a slow repaint. */
    const beat = Math.sin(t * 3.1) > 0.965 ? 1 : 0;
    const shift = beat * W * 0.035;

    this._blit(g, W * 0.20 + shift, H * 0.5, H * 0.74, 1, '#ffffff');

    /* Fitted, not assumed. The type is set to a nominal size and then squeezed
       to whatever room is left beside the mark — the fixed size that was here
       ran "JUNCTION" off the right-hand edge on this panel's aspect, and it
       would do the same again the moment the board or the wording changed. */
    const x0 = W * 0.40, room = W * 0.56;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = PALETTE.pale;
    const fit = (text, px, y, alpha) => {
      g.font = `700 ${Math.round(px)}px ${FONT}`;
      const w = g.measureText(text).width;
      const k = w > room ? room / w : 1;
      g.save();
      g.globalAlpha = alpha === undefined ? g.globalAlpha : alpha * g.globalAlpha;
      g.translate(x0 - shift, y);
      g.scale(k, 1);
      g.fillText(text, 0, 0);
      g.restore();
    };
    fit('BACKBENCHERS', H * 0.20, H * 0.34);
    fit('STUDIO', H * 0.20, H * 0.58);
    g.fillStyle = '#ffffff';
    g.font = `500 ${Math.round(H * 0.085)}px ${FONT}`;
    const sub = 'CLOSE · CONNECTED · BOLD';
    const ws = g.measureText(sub).width;
    g.save();
    g.globalAlpha *= 0.75;
    g.translate(x0, H * 0.80);
    g.scale(ws > room ? room / ws : 1, 1);
    g.fillText(sub, 0, 0);
    g.restore();
  }

  /** The mark small and left, a ticker running beside it. */
  _sceneBanner(g, W, H, local, t) {
    /* The mark has to finish INSIDE its own column: the sprite is square and
       centred, so at 0.74 of the panel height it reached a third of the way
       across a 1.9:1 board and the ticker ran straight over its jaw. */
    this._blit(g, W * 0.095, H * 0.5, H * 0.62, 1);

    g.save();
    g.beginPath();
    g.rect(W * 0.235, 0, W * 0.765, H);
    g.clip();

    const text = 'BACKBENCHERS STUDIO   ·   HLEDAN JUNCTION   ·   YANGON   ·   SET YOUR OWN COURSE   ·   ';
    g.font = `700 ${Math.round(H * 0.19)}px ${FONT}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    const wText = g.measureText(text).width;
    const x0 = W * 0.26 - ((t * H * 0.62) % wText);
    /* Two copies, so the loop has no seam. */
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * wText;
      if (x > W) break;
      g.fillStyle = PALETTE.pale;
      g.fillText(text, x, H * 0.42);
    }

    g.font = `500 ${Math.round(H * 0.10)}px ${FONT}`;
    g.fillStyle = PALETTE.red;
    const sub = '< / >   CODE · CONSOLE · DRONE      ';
    const wSub = g.measureText(sub).width;
    const xs = W * 0.26 - ((t * H * 0.26) % wSub);
    for (let i = 0; i < 3; i++) {
      const x = xs + i * wSub;
      if (x > W) break;
      g.fillText(sub, x, H * 0.76);
    }
    g.restore();
  }

  /**
   * Colours hoisted: a flag going up over a skyline whose lights are going out.
   *
   * The skyline is drawn, not sampled — a row of blocks whose windows are lit
   * on a deterministic hash and then extinguished, block by block, across the
   * scene's own window. The flag climbs its staff on the same clock, so the
   * two motions cross: by the time the last window goes, the flag is at the
   * top. It is the Blackout preset, told as a picture.
   */
  _sceneColours(g, W, H, local, t) {
    const k = Math.max(0, Math.min(1, local / (SCENE_HOLD * 0.72)));
    const alpha = g.globalAlpha;             // the crossfade's, not to be trampled

    // night behind it: a thin band of city glow on the horizon, black above
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#03050a');
    sky.addColorStop(0.62, '#050912');
    sky.addColorStop(0.90, PALETTE.midnight);
    sky.addColorStop(1, '#020409');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    /* The blocks. Deterministic from the index, so the same skyline is drawn
       every time round and the windows do not shimmer between repaints. */
    const n = 16, bw = W / n;
    const baseY = H * 0.99;
    for (let i = 0; i < n; i++) {
      const h0 = (Math.imul(i + 7, 0x9e3779b1) >>> 0) % 1000 / 1000;
      const bh = H * (0.28 + h0 * 0.46);
      const x = i * bw, top = baseY - bh;
      g.globalAlpha = alpha;
      g.fillStyle = '#010205';
      g.fillRect(x + bw * 0.05, top, bw * 0.90, bh);
      // a rim of Electric Blue along the parapet, so the silhouette reads
      g.fillStyle = 'rgba(0,102,255,0.30)';
      g.fillRect(x + bw * 0.05, top, bw * 0.90, Math.max(1, H * 0.006));

      /* Lights out from the left, one block at a time. */
      const lit = Math.max(0, Math.min(1, k * n * 1.15 - i));
      if (lit >= 1) continue;
      const cols = 3, rows = Math.max(2, Math.floor(bh / (H * 0.085)));
      g.globalAlpha = alpha * (1 - lit);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hsh = (Math.imul((i * 31 + r * 7 + c * 3) | 0, 0x27d4eb2d) >>> 0) % 100;
          if (hsh < 38) continue;
          g.fillStyle = hsh > 86 ? '#0066ff' : '#ffbe6e';
          g.fillRect(x + bw * (0.19 + c * 0.25), top + H * 0.030 + r * (H * 0.085),
                     bw * 0.15, H * 0.034);
        }
      }
    }
    g.globalAlpha = alpha;

    // the staff, and the flag going up it
    const sx = W * 0.10;
    g.strokeStyle = 'rgba(242,244,248,0.55)';
    g.lineWidth = Math.max(1.5, H * 0.014);
    g.beginPath(); g.moveTo(sx, H * 0.04); g.lineTo(sx, baseY); g.stroke();

    const rise = ease(Math.min(1, local / (SCENE_HOLD * 0.55)));
    const flagH = H * 0.52;
    const yLow = baseY - flagH * 0.55, yHigh = H * 0.04 + flagH * 0.55;
    const fy = yLow + (yHigh - yLow) * rise;
    /* A slack ripple, so it reads as cloth on a line rather than a decal. */
    const wobble = Math.sin(t * 2.2) * H * 0.014 * rise;
    this._blit(g, sx + flagH * 0.50, fy + wobble, flagH, 1);

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = PALETTE.pale;
    const x0 = W * 0.44, room = W * 0.52;
    const put = (txt, y, px, style) => {
      g.font = `700 ${Math.round(px)}px ${FONT}`;
      g.fillStyle = style;
      const w = g.measureText(txt).width;
      g.save();
      g.translate(x0, y);
      g.scale(w > room ? room / w : 1, 1);
      g.fillText(txt, 0, 0);
      g.restore();
    };
    put('THE LIGHTS GO OUT.', H * 0.36, H * 0.15, PALETTE.pale);
    put('THE FLAG STAYS UP.', H * 0.56, H * 0.15, PALETTE.red);
    g.font = `500 ${Math.round(H * 0.078)}px ${FONT}`;
    g.fillStyle = 'rgba(242,244,248,0.66)';
    g.fillText('BACKBENCHERS STUDIO', x0, H * 0.76);
  }

  /**
   * The sprite, centred on (cx, cy) at `size` across.
   *
   * `tint` recolours it by drawing the sprite as a mask — the art is a single
   * near-white silhouette with red rotors, and the alert scene wants it flat
   * white, so the tint is applied through `source-in` on a scratch of the same
   * size rather than by shipping a second image.
   */
  _blit(g, cx, cy, size, alpha = 1, tint = null) {
    if (!this.mark) return;
    const s = size, x = cx - s / 2, y = cy - s / 2;
    g.save();
    g.globalAlpha = alpha;
    if (!tint) {
      g.drawImage(this.mark, x, y, s, s);
    } else {
      if (!this._tintCv) this._tintCv = document.createElement('canvas');
      const c = this._tintCv;
      const px = Math.max(2, Math.round(s));
      if (c.width !== px) { c.width = px; c.height = px; }
      const tc = c.getContext('2d');
      tc.clearRect(0, 0, px, px);
      tc.globalCompositeOperation = 'source-over';
      tc.drawImage(this.mark, 0, 0, px, px);
      tc.globalCompositeOperation = 'source-in';
      tc.fillStyle = tint;
      tc.fillRect(0, 0, px, px);
      tc.globalCompositeOperation = 'source-over';
      g.drawImage(c, x, y, s, s);
    }
    g.restore();
  }

  dispose() {
    this.scene.remove(this.mesh, this.glow);
    this.mesh.geometry.dispose();
    this.glow.geometry.dispose();
    this.material.dispose();
    this.glowMat.dispose();
    this.texture.dispose();
  }
}
