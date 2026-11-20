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

export const FLUX_PALETTE = [
  { name: "Ink Black", hex: "#01161E" },
  { name: "Crayola Blue", hex: "#3772FF" },
  { name: "Lime Yellow", hex: "#D7FB41" },
  { name: "Brilliant Rose", hex: "#F037A4" },
  { name: "Icy Aqua", hex: "#C5FFFD" },
  { name: "Crimson Carrot", hex: "#FF4401" },
  { name: "Periwinkle", hex: "#ADBDFF" },
] as const;

/** Ferrofluid renders copied from flux-pass: "01" … "16". */
export const FERROFLUIDS = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, "0"));

export const ferroSrc = (id: string) => `/ferrofluid/${id}.png`;
export const ferroThumb = (id: string) => `/ferrofluid/thumbs/${id}.png`;

export function readStored<T>(key: string, fallback: T, isValid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
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
