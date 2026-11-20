import type { FerroAudioLevels } from "./ferro-audio";
import type { FerroViewWindow } from "./ferro-bounds";
import type { FerroParams } from "./ferro-params";

export declare const FERRO_BLOB_SEGMENTS: number;
export declare const FERRO_POOL_SEGMENTS: number;
export declare const FERRO_MAX_DROPLETS: number;

export type FerroFrameInput = Readonly<{
  audio: FerroAudioLevels;
  /** Normalised loop progress in [0, 1). */
  progress: number;
}>;

export type FerroSceneOptions = Readonly<{
  antialias: boolean;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Keeps the last preview frame readable for pixel sampling (picking/QA). */
  preserveDrawingBuffer?: boolean;
}>;

/** Worst-case drawn radius (incl. audio growth, spikes, droplets) for auto-fit. */
export declare function getFerroExtentRadius(params: FerroParams): number;
/** Pool puddle peak height above the floor (worst case incl. audio growth). */
export declare function getFerroPoolHeight(params: FerroParams): number;
/** Camera distance at which `radius` fills the frame share `fill`, never cropped. */
export declare function getFerroFitDistance(radius: number, halfFovRadians: number, fill?: number): number;
export declare const FERRO_LOBE_AMPLITUDE: number;
export declare const FERRO_FRAME_FILL: number;

/** Subject image for the Wrap form, already rotated/flipped by its media transform. */
export type FerroSubjectImage = Readonly<{
  aspect: number;
  canvas: OffscreenCanvas;
  /** Changes whenever the source or its transform changes. */
  key: string;
}>;

/** Three.js ferrofluid scene: displaced clearcoat surface, droplets, studio environment. */
export declare class FerroScene {
  constructor(options: FerroSceneOptions);
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly maxTextureSize: number;
  update(params: FerroParams, frame: FerroFrameInput): void;
  setSubject(source: FerroSubjectImage | null): void;
  setMeshDetail(blobSegments: number, poolSegments: number): void;
  /** `view` crops a window of the full product frame (same scale and position). */
  render(width: number, height: number, view?: FerroViewWindow | null): void;
  hitTest(normalizedX: number, normalizedY: number, params: FerroParams): boolean;
  dispose(): void;
}
