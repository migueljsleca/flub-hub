"use client";

import { createContext, useContext } from "react";
import type { FluxThemeId } from "@/lib/flux";
import type { FerroPresetId } from "@/lib/ferro-presets";
import type { AppId } from "./apps";

export type OsContextValue = {
  theme: FluxThemeId;
  setTheme: (theme: FluxThemeId) => void;
  /** 3D ferrofluid preset in the middle of the desktop, or null for none. */
  ferro: FerroPresetId | null;
  setFerro: (id: FerroPresetId | null) => void;
  openApp: (id: AppId) => void;
};

export const OsContext = createContext<OsContextValue | null>(null);

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used inside <Desktop>");
  return ctx;
}
