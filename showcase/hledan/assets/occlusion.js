/**
 * A grid-accelerated segment caster for the chase camera.
 *
 * three.js's Raycaster tests a mesh by walking every one of its triangles once
 * the ray enters its bounding box. The occluder set here is ~19k triangles and
 * the `Buildings` box spans the entire map, so nothing is ever rejected: one
 * ray a frame measured 4.19 ms on an M2, which is a quarter of a 60 fps budget
 * spent on a single query, and several times worse on a phone.
 *
 * The camera ray is always short — the eye never sits more than ~10 u from the
 * head — so almost all of that work is spent on triangles nowhere near it.
 * Bucketing the triangles by XZ cell at load time and testing only the cells
 * the segment actually crosses turns it into a handful of triangle tests.
 *
 * XZ rather than a full 3D structure because this is a city: the geometry is
 * spread over 825 x 1765 u of ground but only ~170 u tall, so the vertical
 * axis buys almost no separation and costs memory to index.
 */

const CELL = 8;                 // map units — the segment spans ~1-2 cells

export class TriGrid {
  /** @param meshes THREE.Mesh[] — read once; later transform changes are ignored */
  constructor(meshes, THREE) {
    const tris = [];
    const v = new THREE.Vector3();

    for (const mesh of meshes) {
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      if (!pos) continue;
      const idx = geo.index;
      mesh.updateWorldMatrix(true, false);
      const m = mesh.matrixWorld;
      const count = idx ? idx.count : pos.count;
      for (let i = 0; i < count; i += 3) {
        for (let k = 0; k < 3; k++) {
          const j = idx ? idx.getX(i + k) : i + k;
          v.fromBufferAttribute(pos, j).applyMatrix4(m);
          tris.push(v.x, v.y, v.z);
        }
      }
    }

    this.tris = new Float32Array(tris);
    this.count = this.tris.length / 9;

    // bucket by XZ cell, storing each triangle in every cell its box covers
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (let t = 0; t < this.count; t++) {
      const o = t * 9;
      for (let k = 0; k < 3; k++) {
        const x = this.tris[o + k * 3], z = this.tris[o + k * 3 + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
    }
    this.minX = minX; this.minZ = minZ;
    this.nx = Math.max(1, Math.ceil((maxX - minX) / CELL) + 1);
    this.nz = Math.max(1, Math.ceil((maxZ - minZ) / CELL) + 1);

    const cells = new Array(this.nx * this.nz);
    for (let t = 0; t < this.count; t++) {
      const o = t * 9;
      let tminX = Infinity, tminZ = Infinity, tmaxX = -Infinity, tmaxZ = -Infinity;
      for (let k = 0; k < 3; k++) {
        const x = this.tris[o + k * 3], z = this.tris[o + k * 3 + 2];
        if (x < tminX) tminX = x; if (x > tmaxX) tmaxX = x;
        if (z < tminZ) tminZ = z; if (z > tmaxZ) tmaxZ = z;
      }
      const x0 = this._cx(tminX), x1 = this._cx(tmaxX);
      const z0 = this._cz(tminZ), z1 = this._cz(tmaxZ);
      for (let cz = z0; cz <= z1; cz++) {
        for (let cx = x0; cx <= x1; cx++) {
          const c = cz * this.nx + cx;
          (cells[c] || (cells[c] = [])).push(t);
        }
      }
    }
    this.cells = cells;

    // per-query visit stamps, so a triangle spanning several cells is tested once
    this._stamp = new Int32Array(this.count);
    this._tick = 0;
  }

  _cx(x) { return Math.min(this.nx - 1, Math.max(0, (x - this.minX) / CELL | 0)); }
  _cz(z) { return Math.min(this.nz - 1, Math.max(0, (z - this.minZ) / CELL | 0)); }

  /**
   * Nearest hit along `dir` from `origin`, or -1 for a clear line.
   * `dir` must be unit length; `maxLen` bounds the search.
   */
  raycast(origin, dir, maxLen) {
    const ex = origin.x + dir.x * maxLen, ez = origin.z + dir.z * maxLen;
    const x0 = this._cx(Math.min(origin.x, ex)), x1 = this._cx(Math.max(origin.x, ex));
    const z0 = this._cz(Math.min(origin.z, ez)), z1 = this._cz(Math.max(origin.z, ez));

    const tick = ++this._tick;
    const T = this.tris;
    let best = maxLen;
    let found = false;

    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.cells[cz * this.nx + cx];
        if (!bucket) continue;
        for (let b = 0; b < bucket.length; b++) {
          const t = bucket[b];
          if (this._stamp[t] === tick) continue;
          this._stamp[t] = tick;

          // Moller-Trumbore, inlined on the flat triangle array
          const o = t * 9;
          const ax = T[o],     ay = T[o + 1], az = T[o + 2];
          const e1x = T[o + 3] - ax, e1y = T[o + 4] - ay, e1z = T[o + 5] - az;
          const e2x = T[o + 6] - ax, e2y = T[o + 7] - ay, e2z = T[o + 8] - az;

          const px = dir.y * e2z - dir.z * e2y;
          const py = dir.z * e2x - dir.x * e2z;
          const pz = dir.x * e2y - dir.y * e2x;
          const det = e1x * px + e1y * py + e1z * pz;
          if (det > -1e-8 && det < 1e-8) continue;     // ray parallel to the triangle
          const inv = 1 / det;

          const tx = origin.x - ax, ty = origin.y - ay, tz = origin.z - az;
          const u = (tx * px + ty * py + tz * pz) * inv;
          if (u < 0 || u > 1) continue;

          const qx = ty * e1z - tz * e1y;
          const qy = tz * e1x - tx * e1z;
          const qz = tx * e1y - ty * e1x;
          const vv = (dir.x * qx + dir.y * qy + dir.z * qz) * inv;
          if (vv < 0 || u + vv > 1) continue;

          const d = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (d > 1e-4 && d < best) { best = d; found = true; }
        }
      }
    }
    return found ? best : -1;
  }
}
