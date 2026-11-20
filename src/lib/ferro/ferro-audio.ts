/** Audio levels the ferro surface reacts to. Flux OS keeps the fluid silent. */
export type FerroAudioLevels = Readonly<{
  bass: number;
  level: number;
  mids: number;
}>;

export const FERRO_SILENT: FerroAudioLevels = Object.freeze({ bass: 0, level: 0, mids: 0 });
