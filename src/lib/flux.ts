/**
 * FLUX V2 palette + theme modes, mirrored from flux-pass (badge-theme.ts).
 * `flux` is the saturated colour (glows), `soft` the light one (highlights).
 */
export const FLUX_INK = "#01161E";

export const FLUX_THEMES = {
  blue: { label: "Blue", pair: "Crayola Blue / Lime Yellow", flux: "#3772FF", soft: "#D7FB41" },
  rose: { label: "Rose", pair: "Brilliant Rose / Icy Aqua", flux: "#F037A4", soft: "#C5FFFD" },
  carrot: { label: "Carrot", pair: "Crimson Carrot / Periwinkle", flux: "#FF4401", soft: "#ADBDFF" },
} as const;

export type FluxThemeId = keyof typeof FLUX_THEMES;
export const FLUX_THEME_IDS = Object.keys(FLUX_THEMES) as FluxThemeId[];

export function readStored<T>(
  key: string,
  fallback: T,
  isValid: (v: unknown) => v is T,
  /** Old stored values mapped to their new names. */
  renamed: Record<string, unknown> = {},
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    let parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && parsed in renamed) parsed = renamed[parsed];
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — settings just won't persist
  }
}
