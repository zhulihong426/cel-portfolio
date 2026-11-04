// 生成首屏漂浮岛的低多边形 GLB 模型（程序化建模，可重复运行微调）
// 用法: node tools/build-island-glb.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outFile = new URL('../assets/models/hero-island.glb', import.meta.url);

/* ---------- 确定性随机 ---------- */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261104);
const between = (min, max) => min + rng() * (max - min);
const jitter = (amount) => (rng() - 0.5) * 2 * amount;

/* ---------- 向量 ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/* ---------- 三角面收集（平面着色） ---------- */
const positions = [];
const normals = [];
const colors = [];

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
function mixColor(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function shade(c, k) { return [clamp01(c[0] * k), clamp01(c[1] * k), clamp01(c[2] * k)]; }
function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function linearColor(c) { return [srgbToLinear(clamp01(c[0])), srgbToLinear(clamp01(c[1])), srgbToLinear(clamp01(c[2]))]; }

function tri(a, b, c, ca, cb, cc, hint) {
  let n = cross(sub(b, a), sub(c, a));
  if (dot(n, hint) < 0) {
    const tb = b, tc = c, tcb = cb, tcc = cc;
    b = tc; c = tb; cb = tcc; cc = tcb;
    n = [-n[0], -n[1], -n[2]];
  }
  n = norm(n);
  const la = linearColor(ca), lb = linearColor(cb), lc = linearColor(cc);
  positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  normals.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
  colors.push(la[0], la[1], la[2], lb[0], lb[1], lb[2], lc[0], lc[1], lc[2]);
}

/* ---------- 调色 ---------- */
const rockColor = (y, rad) => {
  const base = [0.40 + jitter(0.045), 0.39 + jitter(0.045), 0.37 + jitter(0.04)];
  const depth = 0.72 + 0.28 * clamp01((y + 1.05) / 1.6); // 底部更暗
  let c = shade(base, depth);
  const moss = clamp01((y - 0.35) / 0.3) * 0.55; // 靠近顶部染上苔藓
  return mixColor(c, [0.34, 0.44, 0.22], moss * (0.7 + 0.3 * Math.sin(rad * 9)));
};
const mossColor = (r) => {
  const base = [0.30 + jitter(0.05), 0.44 + jitter(0.06), 0.17 + jitter(0.04)];
  const dry = clamp01((r - 0.5) / 0.35);
  return mixColor(base, [0.36, 0.42, 0.24], dry * 0.6);
};
const grassColor = () => [0.20 + jitter(0.05), 0.36 + jitter(0.06), 0.13 + jitter(0.04)];
const stemColor = () => [0.30 + jitter(0.03), 0.46 + jitter(0.04), 0.20 + jitter(0.03)];
const petalColor = () => [0.80 + jitter(0.06), 0.13 + jitter(0.05), 0.15 + jitter(0.04)];

/* ---------- 岩石主体（倒锥） ---------- */
const SEG = 26;
const rings = [
  { y: -1.14, r: 0.03, rough: 0.015 },
  { y: -0.98, r: 0.18, rough: 0.05 },
  { y: -0.82, r: 0.33, rough: 0.07 },
  { y: -0.64, r: 0.47, rough: 0.09 },
  { y: -0.44, r: 0.60, rough: 0.11 },
  { y: -0.22, r: 0.72, rough: 0.12 },
  { y: 0.02, r: 0.82, rough: 0.12 },
  { y: 0.24, r: 0.90, rough: 0.11 },
  { y: 0.42, r: 0.94, rough: 0.10 },
  { y: 0.56, r: 0.88, rough: 0.09 },
  { y: 0.64, r: 0.80, rough: 0.07 },
];
const ringPts = rings.map((ring) => {
  const pts = [];
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    const wob = Math.sin(a * 2 + ring.y * 2.4) * 0.55 + Math.sin(a * 3 + ring.y * 5) * 0.38 + Math.sin(a * 5 - ring.y * 7) * 0.3 + Math.sin(a * 9 + ring.y * 3) * 0.16;
    const rr = Math.max(0.01, ring.r * (1 + 0.17 * wob) + jitter(ring.rough));
    pts.push([Math.cos(a) * rr, ring.y + jitter(ring.rough * 1.2), Math.sin(a) * rr]);
  }
  return pts;
});

for (let j = 0; j < ringPts.length - 1; j++) {
  const low = ringPts[j], up = ringPts[j + 1];
  for (let i = 0; i < SEG; i++) {
    const i1 = (i + 1) % SEG;
    const mid = ((i + 0.5) / SEG) * Math.PI * 2;
    const hint = [Math.cos(mid), 0.25, Math.sin(mid)];
    const p1 = low[i], p2 = low[i1], p3 = up[i1], p4 = up[i];
    const yAvg = (p1[1] + p2[1] + p3[1] + p4[1]) / 4;
    const radAvg = Math.hypot((p1[0] + p3[0]) / 2, (p1[2] + p3[2]) / 2);
    const c1 = rockColor(p1[1], radAvg), c2 = rockColor(p2[1], radAvg), c3 = rockColor(p3[1], radAvg), c4 = rockColor(p4[1], radAvg);
    tri(p1, p2, p3, c1, c2, c3, hint);
    tri(p1, p3, p4, c1, c3, c4, hint);
  }
}

/* 底部尖端封口 */
{
  const tip = [0, -1.10, 0];
  const low = ringPts[0];
  for (let i = 0; i < SEG; i++) {
    const i1 = (i + 1) % SEG;
    tri(low[i], low[i1], tip, rockColor(low[i][1], 0.05), rockColor(low[i1][1], 0.05), rockColor(tip[1], 0.05), [0, -1, 0]);
  }
}

/* ---------- 苔藓顶盖 ---------- */
const capRings = [
  { y: 0.50, r: 0.99 }, // 苔藓从岩缘向外垂落
  { y: 0.60, r: 0.92 },
  { y: 0.68, r: 0.68 },
  { y: 0.75, r: 0.38 },
  { y: 0.78, r: 0.0 },
];
const capPts = capRings.map((ring, idx) => {
  if (ring.r === 0) return [[0, ring.y, 0]];
  const pts = [];
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    const rr = Math.max(0.01, ring.r * (1 + 0.08 * Math.sin(a * 4 + idx)) + jitter(0.04));
    pts.push([Math.cos(a) * rr, ring.y + jitter(0.035), Math.sin(a) * rr]);
  }
  return pts;
});
for (let j = 0; j < capPts.length - 2; j++) {
  const low = capPts[j], up = capPts[j + 1];
  for (let i = 0; i < SEG; i++) {
    const i1 = (i + 1) % SEG;
    const radAvg = Math.hypot(low[i][0], low[i][2]);
    const cm = mossColor(radAvg);
    tri(low[i], low[i1], up[i1], cm, mossColor(Math.hypot(low[i1][0], low[i1][2])), mossColor(Math.hypot(up[i1][0], up[i1][2])), [0, 1, 0]);
    tri(low[i], up[i1], up[i], cm, mossColor(Math.hypot(up[i1][0], up[i1][2])), mossColor(Math.hypot(up[i][0], up[i][2])), [0, 1, 0]);
  }
}
{
  const low = capPts[capPts.length - 2];
  const apex = capPts[capPts.length - 1][0];
  for (let i = 0; i < SEG; i++) {
    const i1 = (i + 1) % SEG;
    tri(low[i], apex, low[i1], mossColor(Math.hypot(low[i][0], low[i][2])), mossColor(0.05), mossColor(Math.hypot(low[i1][0], low[i1][2])), [0, 1, 0]);
  }
}

/* ---------- 顶部表面高度采样 ---------- */
function domeY(x, z) {
  const r = Math.hypot(x, z);
  const stops = capRings.slice(0, -1);
  if (r >= stops[0].r) return stops[0].y;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (r <= a.r && r >= b.r) {
      const t = (a.r - r) / (a.r - b.r || 1);
      return a.y + (b.y - a.y) * t + jitter(0.012);
    }
  }
  return stops[stops.length - 1].y;
}

/* ---------- 苔藓丘与露出岩块 ---------- */
function addMound(x, z, r, colorFn, height = 0.45) {
  const baseY = domeY(x, z) - 0.015;
  const rim = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = r * (0.82 + 0.18 * Math.sin(a * 3 + 1.2));
    rim.push([x + Math.cos(a) * rr, baseY + jitter(0.012), z + Math.sin(a) * rr]);
  }
  const top = [x + jitter(0.015), baseY + r * height, z + jitter(0.015)];
  for (let i = 0; i < 8; i++) {
    const i1 = (i + 1) % 8;
    tri(rim[i], rim[i1], top, colorFn(), colorFn(), shade(colorFn(), 1.12), [0, 1, 0]);
  }
}
addMound(-0.42, -0.18, 0.13, () => mossColor(0.35), 0.5);
addMound(0.34, 0.28, 0.1, () => mossColor(0.3), 0.55);
addMound(0.5, -0.3, 0.09, () => mossColor(0.55), 0.45);
addMound(-0.12, 0.48, 0.075, () => mossColor(0.25), 0.6);
addMound(0.16, -0.02, 0.08, () => rockColor(0.74, 0.3), 0.5);
addMound(-0.3, 0.3, 0.065, () => rockColor(0.72, 0.35), 0.55);

/* ---------- 岩石碎块点缀 ---------- */
function addChunk(cx, cy, cz, size) {
  const dirs = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + between(0, 0.6);
    dirs.push([Math.cos(a) * size, between(-0.25, 0.35) * size, Math.sin(a) * size]);
  }
  const top = [cx, cy + size * 0.9, cz];
  const bottom = [cx, cy - size * 0.35, cz];
  for (let i = 0; i < 4; i++) {
    const p1 = [cx + dirs[i][0], cy + dirs[i][1], cz + dirs[i][2]];
    const p2 = [cx + dirs[(i + 1) % 4][0], cy + dirs[(i + 1) % 4][1], cz + dirs[(i + 1) % 4][2]];
    const c = rockColor(cy, Math.hypot(cx, cz));
    tri(p1, p2, top, c, shade(c, 1.06), shade(c, 1.12), [0, 1, 0]);
    tri(p1, bottom, p2, c, shade(c, 0.9), c, [dirs[i][0] + dirs[(i + 1) % 4][0], -1, dirs[i][2] + dirs[(i + 1) % 4][2]]);
  }
}
addChunk(-0.52, 0.06, 0.34, 0.10);
addChunk(0.58, -0.18, -0.28, 0.09);
addChunk(0.16, 0.28, -0.72, 0.075);
addChunk(-0.30, -0.55, 0.55, 0.08);

/* ---------- 草叶 ---------- */
function addBlade(base, dirXZ, len, width, color) {
  const perp = [-dirXZ[2], 0, dirXZ[0]];
  const left = [base[0] + perp[0] * width, base[1], base[2] + perp[2] * width];
  const right = [base[0] - perp[0] * width, base[1], base[2] - perp[2] * width];
  const tip = [base[0] + dirXZ[0] * len * 0.55, base[1] + len, base[2] + dirXZ[2] * len * 0.55];
  tri(left, right, tip, color, shade(color, 0.9), shade(color, 1.1), [0, 1, 0]);
}
for (let i = 0; i < 48; i++) {
  const a = between(0, Math.PI * 2);
  const r = between(0.06, 0.7);
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  const base = [x, domeY(x, z) - 0.01, z];
  const dir = [Math.cos(a + between(-0.6, 0.6)), 0, Math.sin(a + between(-0.6, 0.6))];
  addBlade(base, dir, between(0.11, 0.26), between(0.012, 0.022), grassColor());
  addBlade(base, [-dir[0], 0, -dir[2]], between(0.08, 0.19), between(0.01, 0.017), grassColor());
  if (i % 3 === 0) addBlade(base, [dir[2], 0, -dir[0]], between(0.07, 0.16), 0.012, grassColor());
}

/* ---------- 红花植物 ---------- */
const flowerBase = [-0.14, domeY(-0.14, 0.2), 0.2];
const stemPath = [];
{
  let p = [flowerBase[0], flowerBase[1], flowerBase[2]];
  let lean = [0.10, 1, 0.05];
  for (let i = 0; i < 4; i++) {
    stemPath.push([p[0], p[1], p[2]]);
    p = [p[0] + lean[0] * 0.14 + jitter(0.01), p[1] + 0.16, p[2] + lean[2] * 0.14];
    lean = [lean[0] * 0.85, 1, lean[2] * 0.85];
  }
  stemPath.push([p[0], p[1], p[2]]);
}
function addTube(path, r0, r1, sides, colorFn) {
  const ringsLocal = path.map((pt, idx) => {
    const r = r0 + (r1 - r0) * (idx / (path.length - 1));
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      pts.push([pt[0] + Math.cos(a) * r, pt[1], pt[2] + Math.sin(a) * r]);
    }
    return pts;
  });
  for (let j = 0; j < ringsLocal.length - 1; j++) {
    const low = ringsLocal[j], up = ringsLocal[j + 1];
    for (let i = 0; i < sides; i++) {
      const i1 = (i + 1) % sides;
      const mid = ((i + 0.5) / sides) * Math.PI * 2;
      tri(low[i], low[i1], up[i1], colorFn(), colorFn(), colorFn(), [Math.cos(mid), 0, Math.sin(mid)]);
      tri(low[i], up[i1], up[i], colorFn(), colorFn(), colorFn(), [Math.cos(mid), 0, Math.sin(mid)]);
    }
  }
}
addTube(stemPath, 0.022, 0.01, 5, stemColor);

/* 长叶 */
addBlade([flowerBase[0] + 0.02, flowerBase[1] + 0.05, flowerBase[2]], [0.9, 0, 0.44], 0.34, 0.028, stemColor());
addBlade([flowerBase[0] - 0.01, flowerBase[1] + 0.08, flowerBase[2] + 0.01], [-0.78, 0, -0.62], 0.29, 0.024, stemColor());
addBlade([flowerBase[0] + 0.01, flowerBase[1] + 0.12, flowerBase[2] - 0.02], [0.2, 0, -0.98], 0.22, 0.02, stemColor());

/* 花头：展开的红花瓣，从俯视角度也清晰可见 */
const head = stemPath[stemPath.length - 1];
function rot2(x, z, a) { return [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)]; }
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2 + 0.3;
  const dir = [Math.cos(a), 0, Math.sin(a)];
  const side = rot2(dir[0], dir[2], 0.46);
  const inner = [head[0] + dir[0] * 0.022, head[1] + 0.005, head[2] + dir[2] * 0.022];
  const left = [head[0] + side[0] * 0.115, head[1] + 0.035, head[2] + side[1] * 0.115];
  const right = [head[0] - side[0] * 0.085, head[1] + 0.028, head[2] - side[1] * 0.085];
  const tip = [head[0] + dir[0] * 0.19, head[1] + 0.05, head[2] + dir[2] * 0.19];
  const c = petalColor();
  tri(inner, left, tip, shade(c, 0.88), c, shade(c, 1.08), [dir[0], 1, dir[2]]);
  tri(inner, tip, right, shade(c, 0.9), shade(c, 1.08), shade(c, 0.94), [dir[0], 1, dir[2]]);
}
/* 花苞与花萼 */
{
  const budBase = [head[0] + 0.04, head[1] - 0.02, head[2] + 0.03];
  const budTip = [budBase[0] + 0.02, budBase[1] + 0.09, budBase[2] + 0.01];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const p1 = [budBase[0] + Math.cos(a) * 0.035, budBase[1], budBase[2] + Math.sin(a) * 0.035];
    const p2 = [budBase[0] + Math.cos(a + 2.1) * 0.035, budBase[1] + 0.015, budBase[2] + Math.sin(a + 2.1) * 0.035];
    const c = petalColor();
    tri(p1, p2, budTip, shade(c, 0.8), shade(c, 0.9), c, [Math.cos(a), 1, Math.sin(a)]);
  }
}
{
  // 花芯（小八面体）
  const r = 0.032;
  const top = [head[0], head[1] + r * 0.9, head[2]];
  const bottom = [head[0], head[1] - r * 0.9, head[2]];
  const eq = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    eq.push([head[0] + Math.cos(a) * r, head[1], head[2] + Math.sin(a) * r]);
  }
  const core = [0.95, 0.72, 0.16];
  for (let i = 0; i < 4; i++) {
    const i1 = (i + 1) % 4;
    tri(eq[i], eq[i1], top, core, core, core, [0, 1, 0]);
    tri(eq[i], bottom, eq[i1], core, core, core, [0, -1, 0]);
  }
}

/* ---------- 组装 GLB ---------- */
const positionArr = new Float32Array(positions);
const normalArr = new Float32Array(normals);
const colorArr = new Float32Array(colors);
const indexArr = new Uint32Array(positions.length / 3);
for (let i = 0; i < indexArr.length; i++) indexArr[i] = i;

let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
  minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
  minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
  minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
}

const buffers = [
  { data: positionArr, target: 34962 },
  { data: normalArr, target: 34962 },
  { data: colorArr, target: 34962 },
  { data: indexArr, target: 34963 },
];
let byteOffset = 0;
const bufferViews = buffers.map((b) => {
  const view = { buffer: 0, byteOffset, byteLength: b.data.byteLength, target: b.target };
  byteOffset += b.data.byteLength;
  return view;
});
const bin = new Uint8Array(byteOffset);
let off = 0;
for (const b of buffers) {
  bin.set(new Uint8Array(b.data.buffer, b.data.byteOffset, b.data.byteLength), off);
  off += b.data.byteLength;
}

const gltf = {
  asset: { version: '2.0', generator: 'cel-portfolio procedural island' },
  scene: 0,
  scenes: [{ nodes: [0], name: 'floating_island_scene' }],
  nodes: [{ mesh: 0, name: 'floating_island' }],
  meshes: [{
    name: 'floating_island',
    primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0, mode: 4 }],
  }],
  materials: [{
    name: 'island_vertex_color',
    doubleSided: false,
    pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0.0, roughnessFactor: 0.92 },
  }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: positionArr.length / 3, type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
    { bufferView: 1, componentType: 5126, count: normalArr.length / 3, type: 'VEC3' },
    { bufferView: 2, componentType: 5126, count: colorArr.length / 3, type: 'VEC3' },
    { bufferView: 3, componentType: 5125, count: indexArr.length, type: 'SCALAR' },
  ],
  bufferViews,
  buffers: [{ byteLength: bin.byteLength }],
};

function padTo4(len) { return (4 - (len % 4)) % 4; }
const jsonBytes = new TextEncoder().encode(JSON.stringify(gltf));
const jsonPad = padTo4(jsonBytes.length);
const jsonChunk = new Uint8Array(jsonBytes.length + jsonPad);
jsonChunk.set(jsonBytes);
if (jsonPad) jsonChunk.fill(0x20, jsonBytes.length);

const totalLength = 12 + 8 + jsonChunk.length + 8 + bin.length;
const glb = new Uint8Array(totalLength);
const view = new DataView(glb.buffer);
view.setUint32(0, 0x46546c67, true); // glTF
view.setUint32(4, 2, true);
view.setUint32(8, totalLength, true);
view.setUint32(12, jsonChunk.length, true);
view.setUint32(16, 0x4e4f534a, true); // JSON
glb.set(jsonChunk, 20);
view.setUint32(20 + jsonChunk.length, bin.length, true);
view.setUint32(24 + jsonChunk.length, 0x004e4942, true); // BIN
glb.set(bin, 28 + jsonChunk.length);

mkdirSync(dirname(outFile.pathname.replace(/^\/([A-Za-z]:)/, '$1')), { recursive: true });
writeFileSync(outFile, glb);
console.log(`island glb written: ${decodeURIComponent(outFile.pathname)} (${(glb.length / 1024).toFixed(1)} KB, ${indexArr.length} tris)`);
