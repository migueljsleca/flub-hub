import { FERRO_TARGETS as T, readFerroParams, type FerroParams } from "@/lib/ferro/ferro-params";
import { FERRO_PRESETS } from "@/lib/ferro-presets";
import type { FerroLook } from "@/components/os/ferro-stage";

/*
 * The deck's live ferrofluids. Each Figma "ferrofluid/NN" render maps to one
 * of these. `distance` frames the shape inside DeckFerro's canvas (which is
 * 1.5x the Figma slot), so the shape fills the slot like the render did.
 */

type DeckLook = { look: FerroLook; view: { yaw: number; pitch: number } };

/** Spiky ball, framed to fill its slot (Figma ferrofluid/13). */
const spikes: FerroParams = { ...FERRO_PRESETS.spikes, distance: 0.7 };

/** The lab's "Spiky Pool": a wide spiky mound seen from above (ferrofluid/17). */
const pool: FerroParams = readFerroParams({
  [T.quality]: "balanced",
  [T.autoRotate]: false,
  [T.includeBackground]: false,
  [T.keyLight]: 0.7,
  [T.rimLight]: 0.6,
  [T.gloss]: 0.45,
  [T.mode]: "pool",
  [T.wobble]: 0.35,
  [T.spikeAmount]: 1,
  [T.spikeCount]: 70,
  [T.spikeHeight]: 0.58,
  [T.spikeSharpness]: 0.4,
  [T.spikeSoftness]: 0.65,
  [T.spikeCoverage]: 92,
  [T.spikeJitter]: 0.35,
  [T.fov]: 36,
  [T.distance]: 0.62,
});

/* ---------------------------------------------------------------- the morph */

/*
 * Slide 04: one shape that keeps turning into the next. Every keyframe shares
 * the same spike layout (count, jitter) and base shape, so blending the
 * numbers between two of them reads as one liquid changing, never popping.
 */
const morphBase = {
  [T.quality]: "balanced",
  [T.autoRotate]: false,
  [T.includeBackground]: false,
  [T.fov]: 30,
  [T.keyLight]: 0.7,
  [T.rimLight]: 0.6,
  [T.gloss]: 0.45,
  [T.mode]: "blob",
  [T.baseShape]: "pyramid",
  [T.shapeBlend]: 0,
  [T.shapeRoundness]: 0.38,
  [T.size]: 1,
  [T.wobble]: 0.2,
  [T.frequency]: 2,
  [T.detail]: 1,
  [T.morph]: 1,
  [T.lobes]: 0,
  [T.dropletCount]: 0,
  [T.spikeAmount]: 0,
  [T.spikeCount]: 60,
  [T.spikeHeight]: 0.5,
  [T.spikeSharpness]: 0.6,
  [T.spikeSoftness]: 0.4,
  [T.spikeCoverage]: 100,
  [T.magnetAngle]: 0,
  [T.spikeJitter]: 0.15,
  [T.spikeMotion]: 0.25,
};
const keyframe = (over: Record<string, unknown>, distance: number): FerroParams => ({
  ...readFerroParams({ ...morphBase, ...over }),
  distance,
});

/** The loop, in order: calm blob, rounded spiky pyramid, spike ball, lobed blob. */
const MORPH: FerroParams[] = [
  keyframe({ [T.wobble]: 0.22, [T.frequency]: 1.6, [T.detail]: 0.4 }, 1.05),
  keyframe(
    {
      [T.shapeBlend]: 1,
      [T.wobble]: 0.12,
      [T.frequency]: 2.07,
      [T.spikeAmount]: 1,
      [T.spikeHeight]: 0.2,
      [T.spikeSharpness]: 0.55,
      [T.spikeSoftness]: 0.5,
      [T.spikeCoverage]: 68,
    },
    0.78,
  ),
  keyframe(
    {
      [T.size]: 0.93,
      [T.wobble]: 0.51,
      [T.frequency]: 2.1,
      [T.lobes]: 4,
      [T.spikeAmount]: 1,
      [T.spikeHeight]: 0.9,
      [T.spikeSharpness]: 1,
      [T.spikeSoftness]: 0.32,
    },
    0.7,
  ),
  keyframe({ [T.wobble]: 0.5, [T.frequency]: 2.1, [T.lobes]: 7 }, 0.95),
];
const HOLD = 1.8; // seconds each shape holds
const MOVE = 1.6; // seconds to turn into the next one

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Blend every number between two looks; everything else comes from `b`. */
function blend(a: FerroParams, b: FerroParams, k: number): FerroParams {
  const out: Record<string, unknown> = { ...b };
  for (const key of Object.keys(b) as (keyof FerroParams)[]) {
    const x = a[key];
    const y = b[key];
    if (typeof x === "number" && typeof y === "number") out[key] = x + (y - x) * k;
  }
  return out as FerroParams;
}

const morph = (seconds: number) => {
  const cycle = MORPH.length * (HOLD + MOVE);
  const t = ((seconds % cycle) + cycle) % cycle;
  const i = Math.floor(t / (HOLD + MOVE));
  const into = t - i * (HOLD + MOVE);
  const k = into < HOLD ? 0 : smooth((into - HOLD) / MOVE);
  return blend(MORPH[i], MORPH[(i + 1) % MORPH.length], k);
};

/* ------------------------------------------------------------------ catalog */

export const DECK_LOOKS = {
  /** ferrofluid/13: the spiky ball on the cover, the brief, the name, thank you */
  spikes: { look: spikes, view: { yaw: Math.PI, pitch: 0.1 } },
  /** ferrofluid/01: the drop, a spiky blob turned a little */
  drop: { look: spikes, view: { yaw: 2.2, pitch: 0.35 } },
  /** ferrofluid/17: a wide spiky pool */
  pool: { look: pool, view: { yaw: 0.6, pitch: 0.45 } },
  /** Slide 04: one shape morphing blob -> pyramid -> spikes -> lobes on a loop */
  morph: { look: morph, view: { yaw: 1.3, pitch: 0.25 } },
} satisfies Record<string, DeckLook>;

export type DeckLookId = keyof typeof DECK_LOOKS;
