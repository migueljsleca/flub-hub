/**
 * GLSL for the ferrofluid surface. Injected into MeshPhysicalMaterial so the
 * product keeps Three's physically based clearcoat + environment reflections
 * while the vertex stage displaces a dense sphere (Blob) or disc (Pool) and
 * recomputes normals by finite differences for crisp highlights.
 *
 * All motion is a function of the loop phase `uPhase` (0..2π over one timeline
 * loop) with integer cycle counts, so every animation is a seamless forward loop.
 */

import { ferroBaseShapeGlsl } from "./ferro-base-shape";

export const FERRO_MAX_LOBES = 8;

export const ferroUniformDeclarations = /* glsl */ `
uniform float uPhase;
uniform float uMode;
uniform float uSize;
uniform float uPulse;
uniform float uWobble;
uniform float uFreq;
uniform float uOctaves;
uniform float uMorph;
uniform float uLobeCount;
uniform vec4 uLobes[${FERRO_MAX_LOBES}];
uniform float uSpikeGrowth;
uniform float uSpikeCount;
uniform float uSpikeHeight;
uniform float uSpikeSharp;
uniform float uSpikeSoft;
uniform float uSpikeCoverage;
uniform vec3 uMagnet;
uniform float uSpikeJitter;
uniform float uSpikeMotion;
uniform float uShapeKind;
uniform float uShapeBlend;
uniform float uShapeRound;
`;

/* Ashima/stegu 3D simplex noise (MIT). */
const simplexNoise = /* glsl */ `
vec3 ferroMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 ferroMod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 ferroPermute(vec4 x) { return ferroMod289(((x * 34.0) + 10.0) * x); }
vec4 ferroTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float ferroSnoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = ferroMod289(i);
  vec4 p = ferroPermute(ferroPermute(ferroPermute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = ferroTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const displacement = /* glsl */ `
float ferroSpikeOut = 0.0;
const float FERRO_PI = 3.14159265359;
const float FERRO_PHI = 1.61803398875;

float ferroHash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453123); }

// Loop-periodic fractal noise: every octave travels a closed circle in noise
// space with an integer number of cycles per timeline loop.
float ferroFbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uOctaves) break;
    float fi = float(i);
    float a = uPhase * uMorph + fi * 1.7;
    vec3 drift = 0.55 * vec3(cos(a), sin(a), 0.5 * sin(a + fi));
    sum += amp * ferroSnoise(p * freq + drift + fi * 13.1);
    norm += amp;
    amp *= 0.3;
    freq *= 2.03;
  }
  return norm > 0.0 ? sum / norm : 0.0;
}

// Inverse spherical Fibonacci mapping (Keinert et al. 2015, as popularised by
// Inigo Quilez): nearest lattice point index and chord distance for direction p.
vec2 ferroInverseSF(vec3 p, float n) {
  float m = 1.0 - 1.0 / n;
  float phi = min(atan(p.y, p.x), FERRO_PI);
  float cosTheta = p.z;
  float k = max(2.0, floor(log(n * FERRO_PI * sqrt(5.0) * (1.0 - cosTheta * cosTheta)) / log(FERRO_PHI + 1.0)));
  float Fk = pow(FERRO_PHI, k) / sqrt(5.0);
  vec2 F = vec2(floor(Fk + 0.5), floor(Fk * FERRO_PHI + 0.5));
  vec2 ka = 2.0 * F / n;
  vec2 kb = 2.0 * FERRO_PI * (fract((F + 1.0) * FERRO_PHI) - (FERRO_PHI - 1.0));
  mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
  vec2 c = floor(iB * vec2(phi, cosTheta - m));
  float d = 8.0;
  float j = 0.0;
  for (int s = 0; s < 4; s++) {
    vec2 uv = vec2(float(s - 2 * (s / 2)), float(s / 2));
    float i = floor(dot(F, uv + c) + 0.5);
    float sphi = 2.0 * FERRO_PI * fract(i * FERRO_PHI);
    float sCos = m - 2.0 * i / n;
    float sSin = sqrt(max(0.0, 1.0 - sCos * sCos));
    vec3 q = vec3(cos(sphi) * sSin, sin(sphi) * sSin, sCos);
    float dd = dot(q - p, q - p);
    if (dd < d) { d = dd; j = i; }
  }
  return vec2(j, sqrt(d));
}

vec3 ferroSFPoint(float i, float n) {
  float m = 1.0 - 1.0 / n;
  float sphi = 2.0 * FERRO_PI * fract(i * FERRO_PHI);
  float sCos = m - 2.0 * i / n;
  float sSin = sqrt(max(0.0, 1.0 - sCos * sCos));
  return vec3(cos(sphi) * sSin, sin(sphi) * sSin, sCos);
}

// Polynomial smooth maximum: merges neighbouring spikes with a liquid fillet.
float ferroSmax(float a, float b, float k) {
  // The fillet scales with the taller spike, so flat (masked) surface stays exact.
  k *= clamp(max(a, b) / max(k * 2.0, 1e-4), 0.0, 1.0);
  if (k <= 1e-5) return max(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}

// Liquid spike: rounded tip (no cusp), concave flowing flank and a broad skirt
// that fades smoothly to the surface. d is the distance to the spike centre.
float ferroSpikeShape(float d, float spacing) {
  float tip = spacing * (0.025 + 0.15 * uSpikeSoft);
  float ds = sqrt(d * d + tip * tip) - tip;
  float lambda = spacing * mix(0.30, 0.12, uSpikeSharp) * (1.0 + 0.45 * uSpikeSoft);
  float reach = spacing * (0.62 + 0.3 * uSpikeSoft);
  float floorValue = exp(-reach / lambda);
  float shape = max(exp(-ds / lambda) - floorValue, 0.0) / (1.0 - floorValue);
  return shape * smoothstep(reach, reach * 0.45, d);
}

float ferroSpikeMotion(float h1) {
  return 1.0 + uSpikeMotion * 0.28 * sin(uPhase * 2.0 + h1 * 6.2831853);
}

// Spikes sit on a spherical Fibonacci lattice. The 3x3 lattice neighbourhood
// around the point is combined with a smooth max, so neighbouring spikes share
// smooth concave bases instead of meeting in creases.
// Lattice cell lookup for the spherical Fibonacci inverse mapping (after
// Keinert et al.): the base cell c and the basis F for band k at angle phi.
void ferroSFCell(float n, float k, float phi, float cosTheta, out vec2 F, out vec2 c) {
  float m = 1.0 - 1.0 / n;
  float Fk = pow(FERRO_PHI, k) / sqrt(5.0);
  F = vec2(floor(Fk + 0.5), floor(Fk * FERRO_PHI + 0.5));
  vec2 ka = 2.0 * F / n;
  vec2 kb = 2.0 * FERRO_PI * (fract((F + 1.0) * FERRO_PHI) - (FERRO_PHI - 1.0));
  mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
  c = floor(iB * vec2(phi, cosTheta - m));
}

float ferroBlobSpikes(vec3 u) {
  if (uSpikeGrowth <= 0.0001) return 0.0;
  float n = uSpikeCount;
  vec3 p = u.xzy;
  float phi = min(atan(p.y, p.x), FERRO_PI);
  float cosTheta = p.z;
  float sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 0.0));
  float kf = log(n * FERRO_PI * sqrt(5.0) * max(1.0 - cosTheta * cosTheta, 1e-6)) / log(FERRO_PHI + 1.0);
  float k = max(2.0, floor(kf));
  float spacing = sqrt(4.0 * FERRO_PI / n);
  // A single lattice neighbourhood misses spikes across the atan seam and
  // across Fibonacci band edges, which showed up as thin seams and specks.
  // Near those places also search the wrapped angle and the adjacent band,
  // and de-duplicate so each spike is blended exactly once.
  float bandFrac = fract(kf);
  bool nearBand = kf > 2.0 && min(bandFrac, 1.0 - bandFrac) < 0.3;
  float kAlt = bandFrac < 0.5 ? max(2.0, k - 1.0) : k + 1.0;
  float seamMargin = 2.5 * spacing / max(sinTheta, 0.08);
  bool nearSeam = FERRO_PI - abs(phi) < seamMargin;
  float phiAlt = phi < 0.0 ? phi + 2.0 * FERRO_PI : phi - 2.0 * FERRO_PI;
  float t = mix(1.35, -1.35, uSpikeCoverage);
  float blend = uSpikeHeight * uSpikeGrowth * (0.08 + 0.32 * uSpikeSoft);
  float field = 0.0;
  // Low spike counts: visit every spike exactly (cheap, no lattice lookup).
  if (n <= 160.0) {
    for (int ii = 0; ii < 160; ii++) {
      float i = float(ii);
      if (i >= n) break;
      vec3 center = ferroSFPoint(i, n);
      if (dot(center, p) < 0.0) continue;
      float h1 = ferroHash(i);
      float h2 = ferroHash(i + 71.3);
      float mask = smoothstep(t - 0.38, t + 0.38, dot(center.xzy, uMagnet));
      float height = uSpikeHeight * uSpikeGrowth * mask * (1.0 - uSpikeJitter * 0.55 * h1);
      float width = spacing * (1.0 - uSpikeJitter * 0.25 * h2) * mix(0.75, 1.0, mask);
      float spike = height * ferroSpikeShape(length(center - p), width) * ferroSpikeMotion(h1);
      field = ferroSmax(field, spike, blend);
    }
    return field;
  }
  float seen[100];
  int seenCount = 0;
  for (int run = 0; run < 4; run++) {
    bool useBand = run == 1 || run == 3;
    bool useSeam = run >= 2;
    if (useBand && !nearBand) continue;
    if (useSeam && !nearSeam) continue;
    vec2 F;
    vec2 c;
    ferroSFCell(n, useBand ? kAlt : k, useSeam ? phiAlt : phi, cosTheta, F, c);
    // Symmetric 5x5 neighbourhood: the old -1..+2 window missed neighbours
    // on the -2 side, which showed as a thin seam along one meridian.
    for (int s = 0; s < 25; s++) {
      vec2 uv = vec2(float(s - 5 * (s / 5)) - 2.0, float(s / 5) - 2.0);
      float i = floor(dot(F, uv + c) + 0.5);
      if (i < 0.0 || i >= n) continue;
      bool duplicate = false;
      for (int j = 0; j < 100; j++) {
        if (j >= seenCount) break;
        if (seen[j] == i) { duplicate = true; break; }
      }
      if (duplicate || seenCount >= 100) continue;
      seen[seenCount] = i;
      seenCount += 1;
      vec3 center = ferroSFPoint(i, n);
      float h1 = ferroHash(i);
      float h2 = ferroHash(i + 71.3);
      // Coverage edge: spikes shrink smoothly to nothing toward the boundary.
      float mask = smoothstep(t - 0.38, t + 0.38, dot(center.xzy, uMagnet));
      float height = uSpikeHeight * uSpikeGrowth * mask * (1.0 - uSpikeJitter * 0.55 * h1);
      float width = spacing * (1.0 - uSpikeJitter * 0.25 * h2) * mix(0.75, 1.0, mask);
      float spike = height * ferroSpikeShape(length(center - p), width) * ferroSpikeMotion(h1);
      field = ferroSmax(field, spike, blend);
    }
  }
  return field;
}

${ferroBaseShapeGlsl}
float ferroBlobRadius(vec3 u) {
  float r = 0.8 * ferroBaseShapeFactor(u);
  r += uWobble * 0.32 * ferroFbm(u * uFreq);
  for (int i = 0; i < ${FERRO_MAX_LOBES}; i++) {
    if (float(i) >= uLobeCount) break;
    vec4 lobe = uLobes[i];
    r += lobe.w * exp((dot(u, lobe.xyz) - 1.0) / 0.16);
  }
  float ferroSpikeHere = ferroBlobSpikes(u);
  ferroSpikeOut = ferroSpikeHere / max(uSpikeHeight * max(uSpikeGrowth, 0.001), 0.001);
  r += ferroSpikeHere;
  return r * uSize * uPulse;
}

vec3 ferroBlobPoint(vec3 u) {
  return u * ferroBlobRadius(u);
}

// ---- Pool: a puddle on an invisible floor, spikes on a hexagonal lattice ----
const float FERRO_POOL_SCALE = 1.75;

float ferroPoolEdge(vec2 p) {
  float a = atan(p.y, p.x);
  vec3 q = vec3(cos(a), sin(a), 0.0) * 1.3;
  return 0.9 + uWobble * 0.09 * ferroFbm(q * uFreq);
}

// Spikes on a hexagonal lattice (two offset rectangular grids). The 3x3
// neighbourhood of both grids is smooth-maxed into one liquid field.
float ferroPoolSpikes(vec2 p, float edge) {
  float a = sqrt(2.0 * FERRO_PI / (1.7320508 * uSpikeCount));
  vec2 r = vec2(1.0, 1.7320508) * a;
  vec2 h = r * 0.5;
  float blend = uSpikeHeight * 0.72 * uSpikeGrowth * (0.08 + 0.32 * uSpikeSoft);
  float field = 0.0;
  for (int g = 0; g < 2; g++) {
    vec2 offset = g == 0 ? vec2(0.0) : h;
    vec2 base = floor((p - offset) / r);
    for (int s = 0; s < 9; s++) {
      vec2 cellIndex = base + vec2(float(s - 3 * (s / 3)) - 1.0, float(s / 3) - 1.0);
      vec2 cell = cellIndex * r + h + offset;
      float id = dot(cellIndex, vec2(1.0, 157.0)) + float(g) * 7919.0;
      float h1 = ferroHash(id);
      float h2 = ferroHash(id + 71.3);
      vec2 center = cell + (vec2(h1, h2) - 0.5) * a * 0.35 * uSpikeJitter;
      float cr = length(center);
      float mask = 1.0 - smoothstep(uSpikeCoverage * 0.92 - 0.14, uSpikeCoverage * 0.92 + 0.08, cr);
      mask *= smoothstep(edge - a * 0.6, edge - a * 2.4, cr);
      float height = uSpikeHeight * 0.72 * uSpikeGrowth * mask * (1.0 - uSpikeJitter * 0.5 * h1);
      float width = a * 1.25 * (1.0 - uSpikeJitter * 0.25 * h2) * mix(0.75, 1.0, mask);
      float spike = height * ferroSpikeShape(length(p - center), width) * ferroSpikeMotion(h1);
      field = ferroSmax(field, spike, blend);
    }
  }
  return field;
}

float ferroPoolHeight(vec2 p, out float inside) {
  float edge = ferroPoolEdge(p);
  float rr = length(p) / edge;
  inside = rr;
  float body = 0.12 * smoothstep(1.0, 0.7, rr);
  float ripple = uWobble * 0.05 * ferroFbm(vec3(p * uFreq * 1.6, 0.0));
  float h = body + ripple * smoothstep(1.0, 0.7, rr);
  ferroSpikeOut = 0.0;
  if (uSpikeGrowth > 0.0001) {
    float ferroPoolSpike = ferroPoolSpikes(p, edge);
    ferroSpikeOut = ferroPoolSpike / max(uSpikeHeight * 0.72 * max(uSpikeGrowth, 0.001), 0.001);
    h += ferroPoolSpike;
  }
  return h * uPulse;
}

vec3 ferroPoolPoint(vec2 p, out float inside) {
  float h = ferroPoolHeight(p, inside);
  return vec3(p.x, h, p.y) * uSize * FERRO_POOL_SCALE;
}

void ferroDisplace(vec3 source, out vec3 displaced, out vec3 normalOut, out float poolMask) {
  poolMask = 0.0;
  if (uMode < 0.5) {
    vec3 u = normalize(source);
    vec3 helper = abs(u.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 t = normalize(cross(helper, u));
    vec3 b = cross(u, t);
    float eps = 0.0016;
    vec3 p1 = ferroBlobPoint(normalize(u + t * eps));
    vec3 p2 = ferroBlobPoint(normalize(u + b * eps));
    vec3 p0 = ferroBlobPoint(u);
    vec3 n = normalize(cross(p1 - p0, p2 - p0));
    normalOut = dot(n, u) < 0.0 ? -n : n;
    displaced = p0;
  } else {
    vec2 p = source.xz;
    float eps = 0.0018;
    float inside;
    float i1;
    float i2;
    vec3 p1 = ferroPoolPoint(p + vec2(eps, 0.0), i1);
    vec3 p2 = ferroPoolPoint(p + vec2(0.0, eps), i2);
    vec3 p0 = ferroPoolPoint(p, inside);
    vec3 n = normalize(cross(p2 - p0, p1 - p0));
    normalOut = n.y < 0.0 ? -n : n;
    displaced = p0;
    poolMask = inside;
  }
}
`;

export const ferroVertexPars = `${ferroUniformDeclarations}
varying float vFerroPool;
varying float vFerroSpike;
${simplexNoise}
${displacement}`;

export const ferroBeginNormal = /* glsl */ `
vec3 ferroDisplaced;
vec3 ferroNormal;
float ferroPoolMask;
ferroDisplace(position, ferroDisplaced, ferroNormal, ferroPoolMask);
vFerroPool = ferroPoolMask;
vFerroSpike = clamp(ferroSpikeOut, 0.0, 1.0);
vec3 objectNormal = ferroNormal;
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif
`;

export const ferroBeginVertex = /* glsl */ `
vec3 transformed = ferroDisplaced;
#ifdef USE_ALPHAHASH
  vPosition = vec3( position );
#endif
`;

/** Melt/Thorns: CPU-built meshes that only wobble along their normals. */
export const ferroShapeBeginVertex = /* glsl */ `
vec3 transformed = (position + normal * uWobble * 0.07 * ferroFbm(position * uFreq * 1.4)) * uPulse;
vFerroPool = 0.0;
vFerroSpike = 0.0;
#ifdef USE_ALPHAHASH
  vPosition = vec3( position );
#endif
`;

export const ferroFragmentPars = /* glsl */ `
uniform float uGrain;
uniform float uGrainSeed;
uniform float uMode;
uniform float uSpikeSoft;
varying float vFerroPool;
varying float vFerroSpike;
float ferroGrainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/**
 * Satin spikes: real ferrofluid spikes read as soft dark liquid, not glitter.
 * On spike surfaces the clearcoat gets rougher and weaker, so their many
 * small facets stop throwing sharp softbox highlights. Guarded because the
 * Chrome and Iridescent finishes drop the clearcoat layer (no such fields).
 */
/**
 * Iridescent finish: vary the thin-film thickness across the surface with the
 * view-space normal, so curved puffy forms show blue/purple/orange bands
 * (ref 15) instead of a single uniform tint. Only compiled with iridescence.
 */
export const ferroFragmentFilm = /* glsl */ `
#ifdef USE_IRIDESCENCE
{
  float ferroFilm = dot(normal, vec3(0.8, 1.2, 0.5)) * 2.4 + normal.z * 1.3;
  material.iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, 0.5 + 0.5 * sin(ferroFilm * 2.6));
}
#endif
`;

export const ferroFragmentSatin = /* glsl */ `
#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
{
  // Spike Softness also sets the spike finish: 0 keeps spikes as glossy as
  // the body, 1 gives a soft satin sheen.
  float ferroSatin = smoothstep(0.03, 0.45, vFerroSpike) * clamp(uSpikeSoft * 1.6, 0.0, 1.0);
  material.clearcoatRoughness = clamp(material.clearcoatRoughness + 0.14 * ferroSatin, 0.0, 1.0);
  material.clearcoat *= mix(1.0, 0.4, ferroSatin);
}
#endif
${ferroFragmentFilm}`;

export const ferroFragmentClip = /* glsl */ `
if (uMode > 0.5 && vFerroPool > 1.0) discard;
#include <clipping_planes_fragment>
`;

export const ferroFragmentGrain = /* glsl */ `
#include <dithering_fragment>
if (uGrain > 0.0) {
  float g = ferroGrainHash(gl_FragCoord.xy + uGrainSeed * 97.0) - 0.5;
  gl_FragColor.rgb = max(gl_FragColor.rgb + g * uGrain * 0.22 * gl_FragColor.a, 0.0);
}
`;

/** Simple fragment-only grain for the satellite droplets. */
export const dropletFragmentGrain = ferroFragmentGrain;
