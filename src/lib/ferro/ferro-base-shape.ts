/**
 * Base shapes for the Blob. The blob is a radial surface: every unit
 * direction `u` gets a radius, and noise, lobes and spikes are added on top.
 * A base shape only changes that starting radius, so any shape that every
 * point can be reached from the centre in a straight line works (cube,
 * pyramid, diamond, pill, star; not a torus).
 *
 * The same maths exists twice: `getFerroBaseShapeFactor` (CPU, for the exact
 * export crop and camera fit) and `ferroBaseShapeGlsl` (GPU vertex stage).
 * Keep them in step.
 */

export type FerroBaseShape = "sphere" | "cube" | "pyramid" | "diamond" | "pill" | "star";

export const FERRO_BASE_SHAPES: readonly { label: string; value: FerroBaseShape }[] = [
  { label: "Sphere", value: "sphere" },
  { label: "Cube", value: "cube" },
  { label: "Pyramid", value: "pyramid" },
  { label: "Diamond", value: "diamond" },
  { label: "Pill", value: "pill" },
  { label: "Star", value: "star" },
];

/** Uniform index per shape (sphere = 0 skips all shape work on the GPU). */
export const FERRO_BASE_SHAPE_INDEX: Readonly<Record<FerroBaseShape, number>> = {
  cube: 1,
  diamond: 3,
  pill: 4,
  pyramid: 2,
  sphere: 0,
  star: 5,
};

type Vec3 = readonly [number, number, number];

/* Face planes as (normal / plane distance) so radius = 1 / smax(dot(n, u)).
   Sizes are tuned so each shape reads about as large as the sphere. */
const CUBE_H = 0.84;
const DIAMOND_H = 0.74;
const DIAMOND_STRETCH = 1.25; // taller gem
const PYRAMID_H = 0.55; // centroid-centred tetrahedron, flat base down
const PILL_RADIUS = 0.62;
const PILL_HALF = 0.6;
const STAR_OUTER = 1.3;
const STAR_INNER = 0.62;
const STAR_DEPTH = 0.5;

const INV_SQRT3 = 1 / Math.sqrt(3);
const TETRA_SIDE = Math.sqrt(8) / 3;

function planes(normals: readonly Vec3[], h: number, stretchY = 1): Vec3[] {
  return normals.map(([x, y, z]) => [x / h, y / stretchY / h, z / h] as Vec3);
}

const CUBE_PLANES = planes(
  [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
  CUBE_H,
);
const DIAMOND_PLANES = planes(
  [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x * INV_SQRT3, y * INV_SQRT3, z * INV_SQRT3] as Vec3))),
  DIAMOND_H,
  DIAMOND_STRETCH,
);
const PYRAMID_PLANES = planes(
  [
    [0, -1, 0],
    ...[90, 210, 330].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return [TETRA_SIDE * Math.cos(a), 1 / 3, TETRA_SIDE * Math.sin(a)] as Vec3;
    }),
  ],
  PYRAMID_H,
);

export const FERRO_SHAPE_PLANES = { cube: CUBE_PLANES, diamond: DIAMOND_PLANES, pyramid: PYRAMID_PLANES } as const;

/** Corner rounding width for the smooth max over faces. */
function roundK(roundness: number): number {
  return 0.012 + 0.24 * roundness;
}

function polyRadius(u: Vec3, list: readonly Vec3[], roundness: number): number {
  const k = roundK(roundness);
  let max = -Infinity;
  const d = list.map((n) => n[0] * u[0] + n[1] * u[1] + n[2] * u[2]);
  for (const value of d) max = Math.max(max, value);
  let sum = 0;
  for (const value of d) sum += Math.exp((value - max) / k);
  return 1 / (max + k * Math.log(sum));
}

function pillRadius(u: Vec3): number {
  const horizontal = Math.hypot(u[0], u[2]);
  if (horizontal > 1e-6) {
    const t = PILL_RADIUS / horizontal;
    if (Math.abs(t * u[1]) <= PILL_HALF) return t;
  }
  const along = PILL_HALF * Math.abs(u[1]);
  return along + Math.sqrt(Math.max(0, along * along - PILL_HALF * PILL_HALF + PILL_RADIUS * PILL_RADIUS));
}

function starRadius(u: Vec3, roundness: number): number {
  const rho = Math.hypot(u[0], u[1]);
  const phi = Math.atan2(u[1], u[0]);
  const sharp = 3.2 - 2.2 * roundness;
  const wave = Math.pow(0.5 + 0.5 * Math.cos(5 * (phi - Math.PI / 2)), sharp);
  const outline = STAR_INNER + (STAR_OUTER - STAR_INNER) * wave;
  const q = 7 - 4.5 * roundness;
  const a = Math.pow(rho / outline, q);
  const b = Math.pow(Math.abs(u[2]) / STAR_DEPTH, q);
  return 1 / Math.pow(a + b, 1 / q);
}

/** Radius multiplier for unit direction `u` (1 for the sphere). */
export function getFerroBaseShapeFactor(
  u: Vec3,
  shape: FerroBaseShape,
  blend: number,
  roundness: number,
): number {
  if (shape === "sphere" || blend <= 0) return 1;
  let r = 1;
  if (shape === "cube") r = polyRadius(u, CUBE_PLANES, roundness);
  else if (shape === "diamond") r = polyRadius(u, DIAMOND_PLANES, roundness);
  else if (shape === "pyramid") r = polyRadius(u, PYRAMID_PLANES, roundness);
  else if (shape === "pill") r = pillRadius(u);
  else r = starRadius(u, roundness);
  return 1 + (r - 1) * blend;
}

const maxCache = new Map<string, number>();

/** Largest factor over all directions (cached), for the camera fit. */
export function getFerroBaseShapeMaxFactor(shape: FerroBaseShape, blend: number, roundness: number): number {
  if (shape === "sphere" || blend <= 0) return 1;
  const key = `${shape}:${blend.toFixed(3)}:${roundness.toFixed(3)}`;
  const cached = maxCache.get(key);
  if (cached !== undefined) return cached;
  let max = 1;
  const count = 4096;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    const a = golden * i;
    max = Math.max(max, getFerroBaseShapeFactor([ring * Math.cos(a), y, ring * Math.sin(a)], shape, blend, roundness));
  }
  // Exact axis/vertex directions the lattice may miss.
  for (const u of [[0, 1, 0], [0, -1, 0], [0, 0, 1], [INV_SQRT3, INV_SQRT3, INV_SQRT3]] as Vec3[]) {
    max = Math.max(max, getFerroBaseShapeFactor(u, shape, blend, roundness));
  }
  max *= 1.01;
  if (maxCache.size > 64) maxCache.clear();
  maxCache.set(key, max);
  return max;
}

const glslVec = (list: readonly Vec3[]) =>
  list.map((n) => `vec3(${n.map((value) => value.toFixed(6)).join(", ")})`).join(",\n  ");

export const ferroBaseShapeGlsl = /* glsl */ `
const vec3 FERRO_CUBE_PLANES[6] = vec3[6](
  ${glslVec(CUBE_PLANES)}
);
const vec3 FERRO_DIAMOND_PLANES[8] = vec3[8](
  ${glslVec(DIAMOND_PLANES)}
);
const vec3 FERRO_PYRAMID_PLANES[4] = vec3[4](
  ${glslVec(PYRAMID_PLANES)}
);

float ferroPolyRadius6(vec3 u, float k) {
  float d[6];
  float m = -1e9;
  for (int i = 0; i < 6; i++) { d[i] = dot(FERRO_CUBE_PLANES[i], u); m = max(m, d[i]); }
  float s = 0.0;
  for (int i = 0; i < 6; i++) s += exp((d[i] - m) / k);
  return 1.0 / (m + k * log(s));
}
float ferroPolyRadius8(vec3 u, float k) {
  float d[8];
  float m = -1e9;
  for (int i = 0; i < 8; i++) { d[i] = dot(FERRO_DIAMOND_PLANES[i], u); m = max(m, d[i]); }
  float s = 0.0;
  for (int i = 0; i < 8; i++) s += exp((d[i] - m) / k);
  return 1.0 / (m + k * log(s));
}
float ferroPolyRadius4(vec3 u, float k) {
  float d[4];
  float m = -1e9;
  for (int i = 0; i < 4; i++) { d[i] = dot(FERRO_PYRAMID_PLANES[i], u); m = max(m, d[i]); }
  float s = 0.0;
  for (int i = 0; i < 4; i++) s += exp((d[i] - m) / k);
  return 1.0 / (m + k * log(s));
}

float ferroPillRadius(vec3 u) {
  float horizontal = length(u.xz);
  if (horizontal > 1e-6) {
    float t = ${PILL_RADIUS.toFixed(4)} / horizontal;
    if (abs(t * u.y) <= ${PILL_HALF.toFixed(4)}) return t;
  }
  float along = ${PILL_HALF.toFixed(4)} * abs(u.y);
  return along + sqrt(max(0.0, along * along - ${(PILL_HALF * PILL_HALF - PILL_RADIUS * PILL_RADIUS).toFixed(6)}));
}

float ferroStarRadius(vec3 u, float roundness) {
  float rho = length(u.xy);
  float phi = atan(u.y, u.x);
  float sharp = 3.2 - 2.2 * roundness;
  float wave = pow(max(0.5 + 0.5 * cos(5.0 * (phi - 1.5707963)), 0.0), sharp);
  float outline = ${STAR_INNER.toFixed(4)} + ${(STAR_OUTER - STAR_INNER).toFixed(4)} * wave;
  float q = 7.0 - 4.5 * roundness;
  float a = pow(rho / outline, q);
  float b = pow(abs(u.z) / ${STAR_DEPTH.toFixed(4)}, q);
  return 1.0 / pow(max(a + b, 1e-12), 1.0 / q);
}

float ferroBaseShapeFactor(vec3 u) {
  if (uShapeKind < 0.5 || uShapeBlend <= 0.0) return 1.0;
  float k = 0.012 + 0.24 * uShapeRound;
  float r = 1.0;
  if (uShapeKind < 1.5) r = ferroPolyRadius6(u, k);
  else if (uShapeKind < 2.5) r = ferroPolyRadius4(u, k);
  else if (uShapeKind < 3.5) r = ferroPolyRadius8(u, k);
  else if (uShapeKind < 4.5) r = ferroPillRadius(u);
  else r = ferroStarRadius(u, uShapeRound);
  return 1.0 + (r - 1.0) * uShapeBlend;
}
`;
