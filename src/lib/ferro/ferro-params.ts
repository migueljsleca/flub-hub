/**
 * Canonical product parameters for Ferrofluid Lab.
 *
 * Every renderer input is read from the evaluated Toolcraft value record through
 * these pure readers so preview, export and tests share one value model.
 */

import type { FerroBaseShape } from "./ferro-base-shape";

export type FerroMode = "blob" | "pool" | "melt" | "thorns" | "wrap";
export type FerroWrapLayer = "all" | "front" | "back";
export type FerroFinish = "ferrofluid" | "chrome" | "iridescent";
export type FerroAudioSource = "file" | "mic" | "beat";
export type FerroQuality = "draft" | "balanced" | "high";

/** Preview quality: backing pixels per CSS pixel (x DPR) and mesh density. */
export const FERRO_QUALITY = {
  balanced: { blobSegments: 176, pixelScale: 0.75, poolSegments: 320 },
  draft: { blobSegments: 112, pixelScale: 0.5, poolSegments: 200 },
  high: { blobSegments: 240, pixelScale: 1, poolSegments: 440 },
} as const;

export type FerroPose = Readonly<{
  position: readonly [number, number, number];
  up: readonly [number, number, number];
}>;

export type FerroParams = Readonly<{
  mode: FerroMode;
  baseShape: FerroBaseShape;
  shapeBlend: number;
  shapeRoundness: number;
  size: number;
  wobble: number;
  frequency: number;
  detail: number;
  morph: number;
  lobes: number;
  dropletCount: number;
  dropletSize: number;
  dropletSpread: number;
  spikeAmount: number;
  spikeCount: number;
  spikeHeight: number;
  spikeSharpness: number;
  spikeSoftness: number;
  spikeCoverage: number;
  magnetAngle: number;
  spikeJitter: number;
  spikeMotion: number;
  audioEnabled: boolean;
  audioSource: FerroAudioSource;
  bpm: number;
  sensitivity: number;
  smoothing: number;
  pose: FerroPose;
  distance: number;
  fov: number;
  quality: FerroQuality;
  autoRotate: boolean;
  cropToObject: boolean;
  spin: number;
  fluidColor: string;
  gloss: number;
  keyLight: number;
  rimColor: string;
  rimLight: number;
  grain: number;
  includeBackground: boolean;
  finish: FerroFinish;
  meltArms: number;
  meltArmLength: number;
  meltBulbs: number;
  meltDrips: number;
  meltHoles: number;
  meltHoleSize: number;
  meltThickness: number;
  meltIrregularity: number;
  meltPieces: number;
  meltSeed: number;
  thornStrokes: number;
  thornLength: number;
  thornCurl: number;
  thornThickness: number;
  thornSharpness: number;
  thornSideThorns: number;
  thornDroplets: number;
  thornWrap: number;
  thornScribble: number;
  thornSeed: number;
  wrapHeight: number;
  wrapRadius: number;
  wrapTiers: number;
  wrapTurns: number;
  wrapBarbs: number;
  wrapDrips: number;
  wrapDroplets: number;
  wrapThickness: number;
  wrapGap: number;
  wrapSeed: number;
  wrapSubjectSize: number;
  wrapLayer: FerroWrapLayer;
}>;

/** Schema targets, kept in one place so schema, renderer and tests agree. */
export const FERRO_TARGETS = {
  mode: "fluid.mode",
  presets: "fluid.presets",
  randomize: "fluid.randomize",
  shapePresets: "fluid.shapePresets",
  meltArms: "melt.arms",
  meltArmLength: "melt.armLength",
  meltBulbs: "melt.bulbs",
  meltDrips: "melt.drips",
  meltHoles: "melt.holes",
  meltHoleSize: "melt.holeSize",
  meltThickness: "melt.thickness",
  meltIrregularity: "melt.irregularity",
  meltPieces: "melt.pieces",
  meltSeed: "melt.seed",
  thornStrokes: "thorns.strokes",
  thornLength: "thorns.length",
  thornCurl: "thorns.curl",
  thornThickness: "thorns.thickness",
  thornSharpness: "thorns.sharpness",
  thornSideThorns: "thorns.sideThorns",
  thornDroplets: "thorns.droplets",
  thornWrap: "thorns.wrap",
  thornScribble: "thorns.scribble",
  thornSeed: "thorns.seed",
  wrapHeight: "wrap.height",
  wrapRadius: "wrap.radius",
  wrapTiers: "wrap.tiers",
  wrapTurns: "wrap.turns",
  wrapBarbs: "wrap.barbs",
  wrapDrips: "wrap.drips",
  wrapDroplets: "wrap.droplets",
  wrapThickness: "wrap.thickness",
  wrapGap: "wrap.gap",
  wrapSeed: "wrap.seed",
  wrapSubject: "wrap.subject",
  wrapSubjectSize: "wrap.subjectSize",
  wrapLayer: "wrap.layer",
  baseShape: "shape.base",
  shapeBlend: "shape.blend",
  shapeRoundness: "shape.roundness",
  size: "shape.size",
  wobble: "shape.wobble",
  frequency: "shape.frequency",
  detail: "shape.detail",
  morph: "shape.morph",
  lobes: "shape.lobes",
  dropletCount: "droplets.count",
  dropletSize: "droplets.size",
  dropletSpread: "droplets.spread",
  spikeAmount: "spikes.amount",
  spikeCount: "spikes.count",
  spikeHeight: "spikes.height",
  spikeSharpness: "spikes.sharpness",
  spikeSoftness: "spikes.softness",
  spikeCoverage: "spikes.coverage",
  magnetAngle: "spikes.magnetAngle",
  spikeJitter: "spikes.jitter",
  spikeMotion: "spikes.motion",
  audioEnabled: "audio.enabled",
  audioSource: "audio.source",
  audioFile: "audio.file",
  bpm: "audio.bpm",
  sensitivity: "audio.sensitivity",
  smoothing: "audio.smoothing",
  pose: "view.orbit",
  distance: "view.distance",
  fov: "view.fov",
  quality: "view.quality",
  autoRotate: "view.autoRotate",
  cropToObject: "view.cropToObject",
  spin: "view.spin",
  finish: "look.finish",
  fluidColor: "look.color",
  gloss: "look.gloss",
  keyLight: "look.key",
  rimColor: "look.rimColor",
  rimLight: "look.rim",
  grain: "look.grain",
  backdrop: "look.backdrop",
  loopExports: "look.loopExports",
  includeBackground: "export.includeBackground",
  background: "appearance.background",
} as const;

export const FERRO_DEFAULT_POSE: FerroPose = Object.freeze({
  position: [0, 0, 5] as const,
  up: [0, 1, 0] as const,
});

/** Defaults: a calm, smooth, slowly morphing glossy black blob. */
export const FERRO_DEFAULTS = {
  mode: "blob" as FerroMode,
  finish: "ferrofluid" as FerroFinish,
  meltArms: 2,
  meltArmLength: 0.7,
  meltBulbs: 0.6,
  meltDrips: 1,
  meltHoles: 0,
  meltHoleSize: 0.5,
  meltThickness: 0.8,
  meltIrregularity: 0.5,
  meltPieces: 1,
  meltSeed: 7,
  thornStrokes: 4,
  thornLength: 1,
  thornCurl: 0.6,
  thornThickness: 0.2,
  thornSharpness: 0.6,
  thornSideThorns: 0.5,
  thornDroplets: 4,
  thornWrap: 0,
  thornScribble: 0,
  thornSeed: 3,
  wrapHeight: 5.4,
  wrapRadius: 1.25,
  wrapTiers: 5,
  wrapTurns: 1.05,
  wrapBarbs: 0.75,
  wrapDrips: 3,
  wrapDroplets: 6,
  wrapThickness: 0.3,
  wrapGap: 0.75,
  wrapSeed: 7,
  wrapSubjectSize: 0.85,
  wrapLayer: "all" as FerroWrapLayer,
  baseShape: "sphere" as FerroBaseShape,
  shapeBlend: 1,
  shapeRoundness: 0.35,
  size: 1,
  wobble: 0.55,
  frequency: 0.55,
  detail: 1,
  morph: 1,
  lobes: 5,
  dropletCount: 0,
  dropletSize: 0.14,
  dropletSpread: 1.9,
  spikeAmount: 0,
  spikeCount: 240,
  spikeHeight: 0.38,
  spikeSharpness: 0.5,
  spikeSoftness: 0.55,
  spikeCoverage: 100,
  magnetAngle: 0,
  spikeJitter: 0.15,
  spikeMotion: 0.25,
  audioEnabled: false,
  audioSource: "beat" as FerroAudioSource,
  bpm: 120,
  sensitivity: 1,
  smoothing: 0.6,
  distance: 1,
  fov: 30,
  quality: "balanced" as FerroQuality,
  autoRotate: false,
  cropToObject: true,
  spin: 1,
  fluidColor: "#0A0A0C",
  gloss: 0.35,
  keyLight: 0.44,
  rimColor: "#FFFFFF",
  rimLight: 0.35,
  grain: 0,
  includeBackground: false,
  background: "#F2EEEA",
} as const;

export const FERRO_RANGES = {
  shapeBlend: { min: 0, max: 1 },
  shapeRoundness: { min: 0, max: 1 },
  size: { min: 0.5, max: 1.6 },
  wobble: { min: 0, max: 1 },
  frequency: { min: 0.3, max: 3 },
  detail: { min: 1, max: 5 },
  morph: { min: 0, max: 6 },
  lobes: { min: 0, max: 8 },
  dropletCount: { min: 0, max: 12 },
  dropletSize: { min: 0.04, max: 0.4 },
  dropletSpread: { min: 1.3, max: 3 },
  spikeAmount: { min: 0, max: 1 },
  spikeCount: { min: 40, max: 900 },
  spikeHeight: { min: 0.05, max: 0.9 },
  spikeSharpness: { min: 0, max: 1 },
  spikeSoftness: { min: 0, max: 1 },
  meltArms: { min: 0, max: 6 },
  meltArmLength: { min: 0.2, max: 1.2 },
  meltBulbs: { min: 0, max: 1 },
  meltDrips: { min: 0, max: 4 },
  meltHoles: { min: 0, max: 2 },
  meltHoleSize: { min: 0, max: 1 },
  meltThickness: { min: 0.15, max: 1 },
  meltIrregularity: { min: 0, max: 1 },
  meltPieces: { min: 1, max: 12 },
  meltSeed: { min: 1, max: 99 },
  thornStrokes: { min: 1, max: 8 },
  thornLength: { min: 0.5, max: 2 },
  thornCurl: { min: 0, max: 1 },
  thornThickness: { min: 0.04, max: 0.4 },
  thornSharpness: { min: 0, max: 1 },
  thornSideThorns: { min: 0, max: 1 },
  thornDroplets: { min: 0, max: 12 },
  thornWrap: { min: 0, max: 1 },
  thornScribble: { min: 0, max: 1 },
  thornSeed: { min: 1, max: 99 },
  wrapHeight: { min: 2, max: 6 },
  wrapRadius: { min: 0.5, max: 2 },
  wrapTiers: { min: 2, max: 9 },
  wrapTurns: { min: 0.4, max: 1.6 },
  wrapBarbs: { min: 0, max: 1 },
  wrapDrips: { min: 0, max: 8 },
  wrapDroplets: { min: 0, max: 12 },
  wrapThickness: { min: 0.08, max: 0.55 },
  wrapGap: { min: 0, max: 1 },
  wrapSeed: { min: 1, max: 99 },
  wrapSubjectSize: { min: 0.2, max: 1.4 },
  spikeCoverage: { min: 0, max: 100 },
  magnetAngle: { min: 0, max: 360 },
  spikeJitter: { min: 0, max: 1 },
  spikeMotion: { min: 0, max: 1 },
  bpm: { min: 60, max: 180 },
  sensitivity: { min: 0, max: 3 },
  smoothing: { min: 0, max: 0.95 },
  distance: { min: 0.5, max: 2.5 },
  fov: { min: 15, max: 60 },
  spin: { min: -3, max: 3 },
  gloss: { min: 0, max: 1 },
  keyLight: { min: 0, max: 2 },
  rimLight: { min: 0, max: 2 },
  grain: { min: 0, max: 1 },
} as const;

const FERRO_BASE_SHAPE_VALUES: readonly FerroBaseShape[] = ["sphere", "cube", "pyramid", "diamond", "pill", "star"];

type NumericKey = keyof typeof FERRO_RANGES;

function readNumber(value: unknown, key: NumericKey): number {
  const { max, min } = FERRO_RANGES[key];
  const fallback = FERRO_DEFAULTS[key as keyof typeof FERRO_DEFAULTS];
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return Number(fallback);
  return Math.min(max, Math.max(min, numeric));
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readFerroColor(value: unknown, fallback: string): string {
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "object" &&
          value !== null &&
          "hex" in value &&
          typeof (value as { hex: unknown }).hex === "string"
        ? (value as { hex: string }).hex
        : fallback;
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : fallback;
}

function readVector3(
  value: unknown,
  fallback: readonly [number, number, number],
): readonly [number, number, number] {
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((part) => typeof part === "number" && Number.isFinite(part))
  ) {
    return [value[0], value[1], value[2]] as const;
  }
  return fallback;
}

export function readFerroPose(value: unknown): FerroPose {
  if (typeof value !== "object" || value === null) return FERRO_DEFAULT_POSE;
  const record = value as { position?: unknown; up?: unknown };
  const position = readVector3(record.position, FERRO_DEFAULT_POSE.position);
  const up = readVector3(record.up, FERRO_DEFAULT_POSE.up);
  const length = Math.hypot(...position);
  if (length < 1e-6) return FERRO_DEFAULT_POSE;
  return { position, up };
}

export function readFerroParams(
  values: Readonly<Record<string, unknown>>,
): FerroParams {
  const t = FERRO_TARGETS;
  const rawMode = values[t.mode];
  const mode: FerroMode =
    rawMode === "pool" || rawMode === "melt" || rawMode === "thorns" || rawMode === "wrap" ? rawMode : "blob";
  const source = values[t.audioSource];
  return {
    mode,
    baseShape: FERRO_BASE_SHAPE_VALUES.includes(values[t.baseShape] as FerroBaseShape)
      ? (values[t.baseShape] as FerroBaseShape)
      : FERRO_DEFAULTS.baseShape,
    shapeBlend: readNumber(values[t.shapeBlend], "shapeBlend"),
    shapeRoundness: readNumber(values[t.shapeRoundness], "shapeRoundness"),
    size: readNumber(values[t.size], "size"),
    wobble: readNumber(values[t.wobble], "wobble"),
    frequency: readNumber(values[t.frequency], "frequency"),
    detail: Math.round(readNumber(values[t.detail], "detail")),
    morph: Math.round(readNumber(values[t.morph], "morph")),
    lobes: Math.round(readNumber(values[t.lobes], "lobes")),
    dropletCount: Math.round(readNumber(values[t.dropletCount], "dropletCount")),
    dropletSize: readNumber(values[t.dropletSize], "dropletSize"),
    dropletSpread: readNumber(values[t.dropletSpread], "dropletSpread"),
    spikeAmount: readNumber(values[t.spikeAmount], "spikeAmount"),
    spikeCount: Math.round(readNumber(values[t.spikeCount], "spikeCount")),
    spikeHeight: readNumber(values[t.spikeHeight], "spikeHeight"),
    spikeSharpness: readNumber(values[t.spikeSharpness], "spikeSharpness"),
    spikeSoftness: readNumber(values[t.spikeSoftness], "spikeSoftness"),
    spikeCoverage: readNumber(values[t.spikeCoverage], "spikeCoverage") / 100,
    magnetAngle: readNumber(values[t.magnetAngle], "magnetAngle"),
    spikeJitter: readNumber(values[t.spikeJitter], "spikeJitter"),
    spikeMotion: readNumber(values[t.spikeMotion], "spikeMotion"),
    audioEnabled: readBoolean(values[t.audioEnabled], FERRO_DEFAULTS.audioEnabled),
    audioSource:
      source === "file" || source === "mic" || source === "beat"
        ? source
        : FERRO_DEFAULTS.audioSource,
    bpm: readNumber(values[t.bpm], "bpm"),
    sensitivity: readNumber(values[t.sensitivity], "sensitivity"),
    smoothing: readNumber(values[t.smoothing], "smoothing"),
    pose: readFerroPose(values[t.pose]),
    distance: readNumber(values[t.distance], "distance"),
    fov: readNumber(values[t.fov], "fov"),
    quality:
      values[t.quality] === "draft" || values[t.quality] === "high" || values[t.quality] === "balanced"
        ? (values[t.quality] as FerroQuality)
        : FERRO_DEFAULTS.quality,
    autoRotate: readBoolean(values[t.autoRotate], FERRO_DEFAULTS.autoRotate),
    cropToObject: readBoolean(values[t.cropToObject], FERRO_DEFAULTS.cropToObject),
    spin: Math.round(readNumber(values[t.spin], "spin")),
    fluidColor: readFerroColor(values[t.fluidColor], FERRO_DEFAULTS.fluidColor),
    gloss: readNumber(values[t.gloss], "gloss"),
    keyLight: readNumber(values[t.keyLight], "keyLight"),
    rimColor: readFerroColor(values[t.rimColor], FERRO_DEFAULTS.rimColor),
    rimLight: readNumber(values[t.rimLight], "rimLight"),
    grain: readNumber(values[t.grain], "grain"),
    includeBackground: readBoolean(values[t.includeBackground], FERRO_DEFAULTS.includeBackground),
    finish:
      values[t.finish] === "chrome" ? "chrome" : values[t.finish] === "iridescent" ? "iridescent" : "ferrofluid",
    meltArms: Math.round(readNumber(values[t.meltArms], "meltArms")),
    meltArmLength: readNumber(values[t.meltArmLength], "meltArmLength"),
    meltBulbs: readNumber(values[t.meltBulbs], "meltBulbs"),
    meltDrips: Math.round(readNumber(values[t.meltDrips], "meltDrips")),
    meltHoles: Math.round(readNumber(values[t.meltHoles], "meltHoles")),
    meltHoleSize: readNumber(values[t.meltHoleSize], "meltHoleSize"),
    meltThickness: readNumber(values[t.meltThickness], "meltThickness"),
    meltIrregularity: readNumber(values[t.meltIrregularity], "meltIrregularity"),
    meltPieces: Math.round(readNumber(values[t.meltPieces], "meltPieces")),
    meltSeed: Math.round(readNumber(values[t.meltSeed], "meltSeed")),
    thornStrokes: Math.round(readNumber(values[t.thornStrokes], "thornStrokes")),
    thornLength: readNumber(values[t.thornLength], "thornLength"),
    thornCurl: readNumber(values[t.thornCurl], "thornCurl"),
    thornThickness: readNumber(values[t.thornThickness], "thornThickness"),
    thornSharpness: readNumber(values[t.thornSharpness], "thornSharpness"),
    thornSideThorns: readNumber(values[t.thornSideThorns], "thornSideThorns"),
    thornDroplets: Math.round(readNumber(values[t.thornDroplets], "thornDroplets")),
    thornWrap: readNumber(values[t.thornWrap], "thornWrap"),
    thornScribble: readNumber(values[t.thornScribble], "thornScribble"),
    thornSeed: Math.round(readNumber(values[t.thornSeed], "thornSeed")),
    wrapHeight: readNumber(values[t.wrapHeight], "wrapHeight"),
    wrapRadius: readNumber(values[t.wrapRadius], "wrapRadius"),
    wrapTiers: Math.round(readNumber(values[t.wrapTiers], "wrapTiers")),
    wrapTurns: readNumber(values[t.wrapTurns], "wrapTurns"),
    wrapBarbs: readNumber(values[t.wrapBarbs], "wrapBarbs"),
    wrapDrips: Math.round(readNumber(values[t.wrapDrips], "wrapDrips")),
    wrapDroplets: Math.round(readNumber(values[t.wrapDroplets], "wrapDroplets")),
    wrapThickness: readNumber(values[t.wrapThickness], "wrapThickness"),
    wrapGap: readNumber(values[t.wrapGap], "wrapGap"),
    wrapSeed: Math.round(readNumber(values[t.wrapSeed], "wrapSeed")),
    wrapSubjectSize: readNumber(values[t.wrapSubjectSize], "wrapSubjectSize"),
    wrapLayer: values[t.wrapLayer] === "front" ? "front" : values[t.wrapLayer] === "back" ? "back" : "all",
  };
}
