import { FERRO_TARGETS as T, readFerroParams, type FerroParams } from "@/lib/ferro/ferro-params";

/**
 * The three desktop ferrofluids.
 *
 * Values are written in ferrofluid-lab's slider units (coverage in %, etc.)
 * and go through the lab's own `readFerroParams`, the same path its sliders
 * take, so a look matches the lab exactly. Shape values come from the lab's
 * tuned presets ("Half Spikes" / "Full Spikes"); the material stays the lab's
 * glossy black on a transparent background.
 */
export type FerroPresetId = "pyramid" | "spikes" | "sphere";

export const FERRO_PRESET_IDS: FerroPresetId[] = ["pyramid", "spikes", "sphere"];

export const FERRO_PRESET_LABELS: Record<FerroPresetId, string> = {
  pyramid: "Pyramid",
  spikes: "Spikes",
  sphere: "Sphere",
};

/** Where the camera starts for each preset, as yaw / pitch in radians. */
export const FERRO_PRESET_VIEW: Record<FerroPresetId, { yaw: number; pitch: number }> = {
  pyramid: { yaw: 1.3, pitch: 0.3 }, // spikes (magnet side, +x) toward the camera
  spikes: { yaw: Math.PI, pitch: 0.1 },
  sphere: { yaw: 0.3, pitch: 0.15 },
};

/** Shared by all three: desktop framing and lighting, no background. */
const shared = {
  [T.quality]: "balanced",
  [T.autoRotate]: false,
  [T.includeBackground]: false,
  [T.fov]: 30,
  // Brighter key/rim so the black fluid reads on the dark desktop.
  // (Camera distance is set per preset by `DISTANCE` below.)
  [T.keyLight]: 0.7,
  [T.rimLight]: 0.6,
  [T.gloss]: 0.45,
};

/**
 * Pyramid, tuned against reference 1: a rounded glossy pyramid with fewer,
 * shorter, soft-based spikes over most of it and a smooth patch left bare.
 * Spike count is also the main render cost (every spike is tested for every
 * surface point each frame), so it stays well under the lab's 300.
 */
const pyramidShape = {
  [T.mode]: "blob",
  [T.baseShape]: "pyramid",
  [T.shapeBlend]: 1,
  [T.shapeRoundness]: 0.38,
  [T.size]: 1,
  [T.wobble]: 0.12,
  [T.frequency]: 2.07,
  [T.detail]: 1,
  [T.morph]: 1,
  [T.lobes]: 0,
  [T.dropletCount]: 0,
  [T.spikeAmount]: 1,
  [T.spikeCount]: 150,
  [T.spikeHeight]: 0.2,
  [T.spikeSharpness]: 0.55,
  [T.spikeSoftness]: 0.5,
  [T.spikeCoverage]: 68, // % of the surface, facing the magnet; the rest stays smooth
  [T.magnetAngle]: 0,
  [T.spikeJitter]: 0.2,
  [T.spikeMotion]: 0.2,
};

/*
 * On-screen size: camera distance per preset (smaller = bigger), tuned from
 * headless screenshots at 1440x900 so all three read about equally big:
 * Spikes ~570px tall, Pyramid ~540px, Sphere ~520px. Solid shapes fill more
 * area than the airy spike ball, so they need less height to feel as big.
 */
const DISTANCE: Record<FerroPresetId, number> = {
  pyramid: 0.73,
  spikes: 0.7,
  sphere: 1.0,
};

const withDistance = (id: FerroPresetId, params: FerroParams): FerroParams => ({ ...params, distance: DISTANCE[id] });

export const FERRO_PRESETS: Record<FerroPresetId, FerroParams> = {
  // Reference 1: rounded glossy pyramid, soft spikes over most of it
  pyramid: withDistance("pyramid", readFerroParams({ ...shared, ...pyramidShape })),
  // Reference 2: spiky ball (the lab's "Full Spikes")
  spikes: withDistance("spikes", readFerroParams({
    ...shared,
    [T.mode]: "blob",
    [T.size]: 0.93,
    [T.wobble]: 0.51,
    [T.frequency]: 2.1,
    [T.detail]: 1,
    [T.morph]: 1,
    [T.lobes]: 4,
    [T.dropletCount]: 0,
    [T.spikeAmount]: 1,
    [T.spikeCount]: 40,
    [T.spikeHeight]: 0.9,
    [T.spikeSharpness]: 1,
    [T.spikeSoftness]: 0.32,
    [T.spikeCoverage]: 100,
    [T.magnetAngle]: 0,
    [T.spikeJitter]: 0.15,
    [T.spikeMotion]: 0.25,
  })),
  // Reference 3: rippled sphere, no spikes
  sphere: withDistance("sphere", readFerroParams({
    ...shared,
    [T.mode]: "blob",
    [T.size]: 1,
    [T.wobble]: 0.32,
    [T.frequency]: 2.8,
    [T.detail]: 1,
    [T.morph]: 1,
    [T.lobes]: 0,
    [T.dropletCount]: 0,
    [T.spikeAmount]: 0,
  })),
};

export const isFerroPresetId = (v: unknown): v is FerroPresetId =>
  typeof v === "string" && (FERRO_PRESET_IDS as string[]).includes(v);
