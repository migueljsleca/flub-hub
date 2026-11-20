/**
 * Exact-state object bounds for the product scene rect ("Crop to object").
 *
 * A CPU twin of the blob/pool vertex displacement in `ferro-shader.ts` plus the
 * camera placement in `ferro-scene.js`, so the product rect can hug the real
 * silhouette for the current state, time and camera instead of the
 * conservative extent sphere. Spike tips, lobes and droplets are sampled where
 * the silhouette extremes are; the few terms that depend on GPU-side hashing
 * (spike jitter, per-spike motion phase) use their upper bound so the rect never
 * clips.
 */
import type { FerroAudioLevels } from "./ferro-audio";
import { getFerroBaseShapeFactor, getFerroBaseShapeMaxFactor } from "./ferro-base-shape";
import type { FerroParams, FerroPose } from "./ferro-params";

type Vec3 = [number, number, number];

export type FerroRect = Readonly<{ height: number; width: number; x: number; y: number }>;

/** Lobe amplitude before audio (also used for the extent estimate). */
export const FERRO_LOBE_AMPLITUDE = 0.72;
/** Share of the shorter frame side the object's full extent fills at Distance 1. */
export const FERRO_FRAME_FILL = 0.66;
export const FERRO_MAX_LOBES = 8;
export const FERRO_POOL_SCALE = 1.75;
/** Even margin around the cropped object, as a share of its larger side. */
export const FERRO_CROP_MARGIN = 0.04;

export function ferroHash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/* ---------------------------------------------------------------- noise -- */
/* Port of the Ashima/stegu 3D simplex noise used by the shader (MIT).       */

const mod289 = (x: number): number => x - Math.floor(x * (1 / 289)) * 289;
const permute = (x: number): number => mod289((x * 34 + 10) * x);
const taylorInvSqrt = (r: number): number => 1.79284291400159 - 0.85373472095314 * r;

export function ferroSnoise(vx: number, vy: number, vz: number): number {
  const C1 = 1 / 6;
  const C2 = 1 / 3;
  const s = (vx + vy + vz) * C2;
  let ix = Math.floor(vx + s);
  let iy = Math.floor(vy + s);
  let iz = Math.floor(vz + s);
  const t = (ix + iy + iz) * C1;
  const x0 = [vx - ix + t, vy - iy + t, vz - iz + t];
  const g = [x0[0] >= x0[1] ? 1 : 0, x0[1] >= x0[2] ? 1 : 0, x0[2] >= x0[0] ? 1 : 0];
  const l = [1 - g[0], 1 - g[1], 1 - g[2]];
  const i1 = [Math.min(g[0], l[2]), Math.min(g[1], l[0]), Math.min(g[2], l[1])];
  const i2 = [Math.max(g[0], l[2]), Math.max(g[1], l[0]), Math.max(g[2], l[1])];
  const x1 = [x0[0] - i1[0] + C1, x0[1] - i1[1] + C1, x0[2] - i1[2] + C1];
  const x2 = [x0[0] - i2[0] + C2, x0[1] - i2[1] + C2, x0[2] - i2[2] + C2];
  const x3 = [x0[0] - 0.5, x0[1] - 0.5, x0[2] - 0.5];
  ix = mod289(ix);
  iy = mod289(iy);
  iz = mod289(iz);
  const zs = [0, i1[2], i2[2], 1];
  const ys = [0, i1[1], i2[1], 1];
  const xs = [0, i1[0], i2[0], 1];
  const p = [0, 1, 2, 3].map((k) => permute(permute(permute(iz + zs[k]) + iy + ys[k]) + ix + xs[k]));
  const n = 0.142857142857;
  const ns = [2 * n, 0.5 * n - 1, n];
  const corners = [x0, x1, x2, x3];
  let sum = 0;
  for (let k = 0; k < 4; k += 1) {
    const j = p[k] - 49 * Math.floor(p[k] * ns[2] * ns[2]);
    const xi = Math.floor(j * ns[2]);
    const yi = Math.floor(j - 7 * xi);
    const gx0 = xi * ns[0] + ns[1];
    const gy0 = yi * ns[0] + ns[1];
    const h = 1 - Math.abs(gx0) - Math.abs(gy0);
    const sh = h <= 0 ? -1 : 0;
    const gx = gx0 + (Math.floor(gx0) * 2 + 1) * sh;
    const gy = gy0 + (Math.floor(gy0) * 2 + 1) * sh;
    const norm = taylorInvSqrt(gx * gx + gy * gy + h * h);
    const c = corners[k];
    const m0 = Math.max(0.5 - (c[0] * c[0] + c[1] * c[1] + c[2] * c[2]), 0);
    const m = m0 * m0;
    sum += m * m * (gx * norm * c[0] + gy * norm * c[1] + h * norm * c[2]);
  }
  return 105 * sum;
}

export function ferroFbm(p: Vec3, octaves: number, phase: number, morph: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < 5; i += 1) {
    if (i >= octaves) break;
    const a = phase * morph + i * 1.7;
    const dx = 0.55 * Math.cos(a);
    const dy = 0.55 * Math.sin(a);
    const dz = 0.55 * 0.5 * Math.sin(a + i);
    sum += amp * ferroSnoise(p[0] * freq + dx + i * 13.1, p[1] * freq + dy + i * 13.1, p[2] * freq + dz + i * 13.1);
    norm += amp;
    amp *= 0.3;
    freq *= 2.03;
  }
  return norm > 0 ? sum / norm : 0;
}

/* ------------------------------------------------------- shader uniforms -- */

export type FerroSurfaceState = Readonly<{
  growth: number;
  lobeCount: number;
  /** [x, y, z, amplitude] per lobe, already normalised. */
  lobes: readonly (readonly [number, number, number, number])[];
  magnet: Vec3;
  phase: number;
  pulse: number;
  spikeHeight: number;
  wobble: number;
}>;

/** The per-frame values `FerroScene.update` uploads (shared so they cannot drift). */
export function getFerroSurfaceState(params: FerroParams, progress: number, audio: FerroAudioLevels): FerroSurfaceState {
  const wrapped = ((progress % 1) + 1) % 1;
  const phase = wrapped * Math.PI * 2;
  const lobeCount = params.mode === "blob" ? params.lobes : 0;
  const lobes: (readonly [number, number, number, number])[] = [];
  for (let i = 0; i < FERRO_MAX_LOBES; i += 1) {
    // Arms spread around the view plane (plus some depth) so the default
    // camera sees a lobed, star-like silhouette; they wander on closed loops.
    const ringAngle = (i / Math.max(lobeCount, 1)) * Math.PI * 2 + 0.35;
    const angle = phase * params.morph + ferroHash(i + 3) * Math.PI * 2;
    const base = normalize([
      Math.cos(ringAngle) + 0.22 * Math.cos(angle),
      Math.sin(ringAngle) + 0.18 * Math.sin(angle + ferroHash(i) * 3),
      0.55 * Math.sin(ringAngle * 1.7 + i) + 0.22 * Math.sin(angle),
    ]);
    // Every third lobe is a pinched dent, like the folds in refs 5 and 9.
    const dent = i % 3 === 2 ? -0.55 : 1;
    const amplitude = dent * FERRO_LOBE_AMPLITUDE * (0.6 + 0.4 * ferroHash(i + 11)) * (1 + audio.mids * 0.4);
    lobes.push([base[0], base[1], base[2], amplitude]);
  }
  const magnetRadians = (params.magnetAngle * Math.PI) / 180;
  return {
    growth: Math.min(1.6, params.spikeAmount + audio.bass),
    lobeCount,
    lobes,
    magnet: [Math.cos(magnetRadians), Math.sin(magnetRadians), 0],
    phase,
    pulse: 1 + audio.level * 0.07,
    spikeHeight: params.spikeHeight * (1 + audio.bass * 0.55),
    wobble: params.wobble * (1 + audio.mids * 1.6) + audio.mids * 0.08,
  };
}

/** Golden-angle direction used for droplet orbit axes. */
export function ferroFibonacciDirection(index: number, count: number): Vec3 {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - ((index + 0.5) / count) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = golden * index + 0.7;
  return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
}

export type FerroDropletPlacement = Readonly<{ position: Vec3; scale: Vec3 }>;

/** Satellite droplet centres and scales on their tilted closed orbits (Blob). */
export function getFerroDroplets(params: FerroParams, phase: number, pulse: number): FerroDropletPlacement[] {
  const count = params.mode === "blob" ? params.dropletCount : 0;
  const out: FerroDropletPlacement[] = [];
  for (let i = 0; i < count; i += 1) {
    const h1 = ferroHash(i * 3.1 + 1);
    const h2 = ferroHash(i * 5.7 + 2);
    const h3 = ferroHash(i * 7.3 + 3);
    const axis = ferroFibonacciDirection(i, Math.max(count, 2));
    const helper: Vec3 = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const a = normalize(cross(helper, axis));
    const b = cross(axis, a);
    const direction = i % 2 === 0 ? 1 : -1;
    const cycles = params.morph === 0 ? 0 : direction;
    const theta = phase * cycles + h1 * Math.PI * 2;
    const radius = params.dropletSpread * params.size * (0.85 + 0.3 * h2);
    const wobble = 0.18 * params.size * Math.sin(theta * 2 + h3 * 6);
    const c = Math.cos(theta) * radius;
    const s = Math.sin(theta) * radius;
    const scale = params.dropletSize * params.size * (0.65 + 0.7 * h3) * pulse;
    out.push({
      position: [a[0] * c + b[0] * s + axis[0] * wobble, a[1] * c + b[1] * s + axis[1] * wobble, a[2] * c + b[2] * s + axis[2] * wobble],
      scale: [scale, scale * (0.94 + 0.06 * Math.cos(theta * 2)), scale],
    });
  }
  return out;
}

/* ------------------------------------------------------- extent / camera -- */

/**
 * Full drawn radius of the blob (surface noise, lobes, spikes, droplet orbits).
 * Audio headroom is reserved only while Audio is on, so the camera does not
 * "breathe" with the music and the calm object fills the frame.
 */
export function getFerroExtentRadius(params: FerroParams): number {
  const audio = params.audioEnabled ? params.sensitivity : 0;
  const growth = Math.min(1.6, params.spikeAmount + audio);
  const spikeHeight = params.spikeHeight * (1 + 0.55 * audio) * (1 + params.spikeMotion * 0.28);
  const pulse = 1 + 0.07 * audio;
  if (params.mode === "pool") {
    return 1.75 * params.size * 0.95;
  }
  const wobble = params.wobble * (1 + 1.6 * audio) * 0.32 * 0.85 + 0.08 * audio;
  const lobes = params.lobes > 0 ? FERRO_LOBE_AMPLITUDE * (1 + 0.4 * audio) * 1.05 : 0;
  // The base shape scales the 0.8 core radius; its largest direction sets the fit.
  const shape = 0.8 * (getFerroBaseShapeMaxFactor(params.baseShape, params.shapeBlend, params.shapeRoundness) - 1);
  const body = (1 + shape + wobble + lobes + spikeHeight * growth * 1.08) * params.size * pulse;
  const droplets = params.dropletCount > 0
    ? (params.dropletSpread * 1.15 + params.dropletSize * 1.35 + 0.18) * params.size * pulse
    : 0;
  return Math.max(body, droplets);
}

/** Pool puddle peak height above the floor (audio headroom only while Audio is on). */
export function getFerroPoolHeight(params: FerroParams): number {
  const audio = params.audioEnabled ? params.sensitivity : 0;
  const growth = Math.min(1.6, params.spikeAmount + audio);
  const spikeHeight = params.spikeHeight * (1 + 0.55 * audio) * (1 + params.spikeMotion * 0.28);
  return (0.13 + spikeHeight * 0.72 * growth * 1.1) * 1.75 * params.size;
}

/**
 * Camera distance at which a sphere of `radius` fills `fill` of the frame
 * half-extent, never closer than the distance where its silhouette would touch
 * the frame edge (the no-crop guarantee at Distance 1).
 */
export function getFerroFitDistance(radius: number, halfFovRadians: number, fill = FERRO_FRAME_FILL): number {
  const half = Math.max(0.05, halfFovRadians);
  const target = radius / (fill * Math.tan(half));
  const noCrop = (radius * 1.04) / Math.sin(half);
  return Math.max(target, noCrop);
}

export type FerroCameraPlacement = Readonly<{
  fov: number;
  position: Vec3;
  target: Vec3;
  up: Vec3;
}>;

/** Blob/Pool camera for a full frame of `aspect` (same maths as FerroScene.placeCamera). */
export function getFerroBlobCamera(
  params: Pick<FerroParams, "distance" | "fov" | "mode" | "pose"> & FerroParams,
  aspect: number,
): FerroCameraPlacement {
  const pose: FerroPose = params.pose;
  const radius = getFerroExtentRadius(params);
  const poolHeight = params.mode === "pool" ? getFerroPoolHeight(params) : 0;
  const targetY = params.mode === "pool" ? poolHeight * 0.4 : 0;
  const halfVertical = (params.fov * Math.PI) / 360;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const view = normalize([pose.position[0], pose.position[1], pose.position[2]]);
  let fitDistance: number;
  if (poolHeight > 0) {
    // A wide, low puddle: fit its width horizontally and its projected
    // depth + spike height vertically, plus part of the radius for perspective.
    const elevation = Math.abs(view[1]);
    const vertical = radius * elevation + poolHeight * Math.sqrt(1 - elevation * elevation) * 0.55;
    fitDistance =
      Math.max(getFerroFitDistance(radius, halfHorizontal, 0.86), getFerroFitDistance(Math.max(vertical, 0.2), halfVertical)) +
      radius * 0.3;
  } else {
    fitDistance = getFerroFitDistance(radius, Math.min(halfVertical, halfHorizontal));
  }
  const distance = fitDistance * params.distance;
  return {
    fov: params.fov,
    position: [view[0] * distance, view[1] * distance + targetY, view[2] * distance],
    target: [0, targetY, 0],
    up: normalize([pose.up[0], pose.up[1], pose.up[2]]),
  };
}

/* --------------------------------------------------------- silhouette -- */

function blobRadius(u: Vec3, params: FerroParams, surface: FerroSurfaceState, extra: number): number {
  let r = 0.8 * getFerroBaseShapeFactor(u, params.baseShape, params.shapeBlend, params.shapeRoundness);
  r += surface.wobble * 0.32 * ferroFbm([u[0] * params.frequency, u[1] * params.frequency, u[2] * params.frequency], params.detail, surface.phase, params.morph);
  for (let i = 0; i < surface.lobeCount; i += 1) {
    const lobe = surface.lobes[i];
    r += lobe[3] * Math.exp((u[0] * lobe[0] + u[1] * lobe[1] + u[2] * lobe[2] - 1) / 0.16);
  }
  return (r + extra) * params.size * surface.pulse;
}

/** Spike tip heights at every lattice centre (upper bound for jitter/motion). */
function spikeTips(params: FerroParams, surface: FerroSurfaceState): { extra: number; u: Vec3 }[] {
  if (surface.growth <= 0.0001 || params.spikeCount < 1) return [];
  const n = params.spikeCount;
  const t = 1.35 - 2.7 * params.spikeCoverage;
  const blend = surface.spikeHeight * surface.growth * (0.08 + 0.32 * params.spikeSoftness);
  const motion = 1 + params.spikeMotion * 0.28;
  const tips: { extra: number; u: Vec3 }[] = [];
  const m = 1 - 1 / n;
  const phi = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i += 1) {
    const f = i * phi;
    const sphi = 2 * Math.PI * (f - Math.floor(f));
    const sCos = m - (2 * i) / n;
    const sSin = Math.sqrt(Math.max(0, 1 - sCos * sCos));
    // Shader works in p = u.xzy; the centre's object-space direction is q.xzy.
    const q: Vec3 = [Math.cos(sphi) * sSin, Math.sin(sphi) * sSin, sCos];
    const u: Vec3 = [q[0], q[2], q[1]];
    const x = (dot(u, surface.magnet) - (t - 0.38)) / 0.76;
    const k = Math.min(1, Math.max(0, x));
    const mask = k * k * (3 - 2 * k);
    if (mask <= 0) continue;
    tips.push({ extra: surface.spikeHeight * surface.growth * mask * motion + blend * 0.25, u });
  }
  return tips;
}

const SAMPLE_DIRECTIONS = (() => {
  const count = 900;
  const out: Vec3[] = [];
  for (let i = 0; i < count; i += 1) out.push(ferroFibonacciDirection(i, count));
  return out;
})();

/** Object-space sample points (and sphere radii) bounding the drawn object. */
export function getFerroSilhouetteSamples(
  params: FerroParams,
  surface: FerroSurfaceState,
  directions: readonly Vec3[] = SAMPLE_DIRECTIONS,
): { points: Vec3[]; spheres: { center: Vec3; radius: number }[] } {
  const points: Vec3[] = [];
  const spheres: { center: Vec3; radius: number }[] = [];
  if (params.mode === "pool") {
    const spikeMax = surface.growth > 0.0001
      ? surface.spikeHeight * 0.72 * surface.growth * (1 + params.spikeMotion * 0.28) * 1.06
      : 0;
    const spikeRadius = params.spikeCoverage * 0.92 + 0.08;
    const ripple = surface.wobble * 0.05;
    const scale = params.size * FERRO_POOL_SCALE;
    for (let a = 0; a < 72; a += 1) {
      const angle = (a / 72) * Math.PI * 2;
      const q: Vec3 = [Math.cos(angle) * 1.3 * params.frequency, Math.sin(angle) * 1.3 * params.frequency, 0];
      const edge = 0.9 + surface.wobble * 0.09 * ferroFbm(q, params.detail, surface.phase, params.morph);
      for (let ri = 0; ri <= 12; ri += 1) {
        const r = (ri / 12) * edge;
        const rr = r / edge;
        const k = Math.min(1, Math.max(0, (1 - rr) / 0.3));
        const body = 0.12 * k * k * (3 - 2 * k);
        const h = (body + ripple * k + (r <= spikeRadius ? spikeMax : 0)) * surface.pulse;
        points.push([Math.cos(angle) * r * scale, h * scale, Math.sin(angle) * r * scale]);
        points.push([Math.cos(angle) * r * scale, 0, Math.sin(angle) * r * scale]);
      }
    }
    return { points, spheres };
  }
  for (const u of directions) {
    const r = blobRadius(u, params, surface, 0);
    points.push([u[0] * r, u[1] * r, u[2] * r]);
  }
  for (let i = 0; i < surface.lobeCount; i += 1) {
    const lobe = surface.lobes[i];
    const u = normalize([lobe[0], lobe[1], lobe[2]]);
    const r = blobRadius(u, params, surface, 0);
    points.push([u[0] * r, u[1] * r, u[2] * r]);
  }
  for (const tip of spikeTips(params, surface)) {
    const r = blobRadius(tip.u, params, surface, tip.extra);
    points.push([tip.u[0] * r, tip.u[1] * r, tip.u[2] * r]);
  }
  for (const droplet of getFerroDroplets(params, surface.phase, surface.pulse)) {
    spheres.push({ center: droplet.position, radius: Math.max(droplet.scale[0], droplet.scale[1]) });
  }
  return { points, spheres };
}

/* -------------------------------------------------------- projection -- */

export type FerroObjectBounds = Readonly<{ maxX: number; maxY: number; minX: number; minY: number }>;

/** Tangent offsets (degrees) the edge refinement climbs with, coarse to fine. */
const REFINE_STEPS = [4, 2, 1, 0.5, 0.25].map((deg) => (deg * Math.PI) / 180);

function rotateToward(u: Vec3, angle: number, theta: number): Vec3 {
  const helper: Vec3 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const t = normalize(cross(helper, u));
  const b = cross(u, t);
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return normalize([
    u[0] * c + (t[0] * ct + b[0] * st) * sn,
    u[1] * c + (t[1] * ct + b[1] * st) * sn,
    u[2] * c + (t[2] * ct + b[2] * st) * sn,
  ]);
}

/**
 * Raw projected extent of the object in full-frame pixels (no margin, no
 * grid). `directions` overrides the body sample lattice and `refine` turns
 * the per-edge hill climb on or off (tests compare against a dense lattice).
 */
export function measureFerroObject(
  params: FerroParams,
  progress: number,
  audio: FerroAudioLevels,
  fullFrame: FerroRect,
  options: Readonly<{ directions?: readonly Vec3[]; refine?: boolean }> = {},
): FerroObjectBounds | null {
  const surface = getFerroSurfaceState(params, progress, audio);
  const aspect = fullFrame.width / fullFrame.height;
  const camera = getFerroBlobCamera(params, aspect);
  const zAxis = normalize([
    camera.position[0] - camera.target[0],
    camera.position[1] - camera.target[1],
    camera.position[2] - camera.target[2],
  ]);
  const xAxis = normalize(cross(camera.up, zAxis));
  const yAxis = cross(zAxis, xAxis);
  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  const spin = params.autoRotate ? surface.phase * params.spin : 0;
  const cosS = Math.cos(spin);
  const sinS = Math.sin(spin);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const project = (p: Vec3, radius: number): [number, number, number, number] | null => {
    // Object.rotation.y (auto-rotate) about the vertical axis.
    const x = p[0] * cosS + p[2] * sinS;
    const z = -p[0] * sinS + p[2] * cosS;
    const v: Vec3 = [x - camera.position[0], p[1] - camera.position[1], z - camera.position[2]];
    const depth = -dot(v, zAxis);
    if (depth <= 1e-4) return null;
    const scale = 1 / (depth * tanHalf);
    const ndcX = (dot(v, xAxis) * scale) / aspect;
    const ndcY = dot(v, yAxis) * scale;
    const rx = (radius * scale) / aspect;
    const ry = radius * scale;
    return [
      ((ndcX + 1) / 2) * fullFrame.width,
      ((1 - ndcY) / 2) * fullFrame.height,
      (rx / 2) * fullFrame.width,
      (ry / 2) * fullFrame.height,
    ];
  };
  const include = (p: Vec3, radius: number): void => {
    const q = project(p, radius);
    if (!q) return;
    minX = Math.min(minX, q[0] - q[2]);
    maxX = Math.max(maxX, q[0] + q[2]);
    minY = Math.min(minY, q[1] - q[3]);
    maxY = Math.max(maxY, q[1] + q[3]);
  };
  const { points, spheres } = getFerroSilhouetteSamples(params, surface, options.directions);
  for (const p of points) include(p, 0);
  for (const s of spheres) include(s.center, s.radius);

  // The lattice is ~7 degrees apart, which misses sharp corners, edges and
  // star tips of the base shapes. Climb from the best sample toward each
  // frame edge so the crop always reaches the true outline.
  if (params.mode !== "pool" && options.refine !== false) {
    const directions = options.directions ?? SAMPLE_DIRECTIONS;
    const body = (u: Vec3): Vec3 => {
      const r = blobRadius(u, params, surface, 0);
      return [u[0] * r, u[1] * r, u[2] * r];
    };
    const edges: ((q: [number, number, number, number]) => number)[] = [
      (q) => -q[0],
      (q) => q[0],
      (q) => -q[1],
      (q) => q[1],
    ];
    for (const score of edges) {
      let best: Vec3 | null = null;
      let bestScore = -Infinity;
      for (const u of directions) {
        const q = project(body(u), 0);
        if (q && score(q) > bestScore) {
          bestScore = score(q);
          best = u;
        }
      }
      if (!best) continue;
      for (const step of REFINE_STEPS) {
        for (let pass = 0; pass < 3; pass += 1) {
          let moved = false;
          for (let k = 0; k < 8; k += 1) {
            const candidate = rotateToward(best, step, (k / 8) * Math.PI * 2);
            const q = project(body(candidate), 0);
            if (q && score(q) > bestScore) {
              bestScore = score(q);
              best = candidate;
              moved = true;
            }
          }
          if (!moved) break;
        }
      }
      include(body(best), 0);
    }
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;
  return { maxX, maxY, minX, minY };
}

/**
 * Projects the object for the full product frame and returns the tight crop
 * rect (world units, same space as `fullFrame`), with an even margin and
 * outward rounding to a coarse grid so playback does not resize every frame.
 */
export function getFerroObjectRect(
  params: FerroParams,
  progress: number,
  audio: FerroAudioLevels,
  fullFrame: FerroRect,
): FerroRect {
  return getFerroRectFromBounds(measureFerroObject(params, progress, audio, fullFrame), fullFrame);
}

/** Union of measured extents (null entries are skipped). */
export function unionFerroBounds(list: readonly (FerroObjectBounds | null)[]): FerroObjectBounds | null {
  let out: FerroObjectBounds | null = null;
  for (const b of list) {
    if (!b) continue;
    out = out
      ? {
          maxX: Math.max(out.maxX, b.maxX),
          maxY: Math.max(out.maxY, b.maxY),
          minX: Math.min(out.minX, b.minX),
          minY: Math.min(out.minY, b.minY),
        }
      : b;
  }
  return out;
}

/** Crop rect for a raw extent: even margin, outward rounding to a coarse grid. */
export function getFerroRectFromBounds(bounds: FerroObjectBounds | null, fullFrame: FerroRect): FerroRect {
  if (!bounds) return fullFrame;
  const { maxX, maxY, minX, minY } = bounds;
  const margin = FERRO_CROP_MARGIN * Math.max(maxX - minX, maxY - minY);
  const grid = Math.max(2, Math.round(Math.max(fullFrame.width, fullFrame.height) / 160));
  const x0 = Math.floor((fullFrame.x + minX - margin) / grid) * grid;
  const y0 = Math.floor((fullFrame.y + minY - margin) / grid) * grid;
  const x1 = Math.ceil((fullFrame.x + maxX + margin) / grid) * grid;
  const y1 = Math.ceil((fullFrame.y + maxY + margin) / grid) * grid;
  return { height: Math.max(grid, y1 - y0), width: Math.max(grid, x1 - x0), x: x0, y: y0 };
}

/** View window of `rect` inside `fullFrame` (for PerspectiveCamera.setViewOffset). */
export type FerroViewWindow = Readonly<{
  fullHeight: number;
  fullWidth: number;
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export function getFerroViewWindow(fullFrame: FerroRect, rect: FerroRect): FerroViewWindow {
  return {
    fullHeight: fullFrame.height,
    fullWidth: fullFrame.width,
    height: rect.height,
    width: rect.width,
    x: rect.x - fullFrame.x,
    y: rect.y - fullFrame.y,
  };
}
