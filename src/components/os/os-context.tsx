"use client";

import { createContext, useContext } from "react";
import type { FluxThemeId } from "@/lib/flux";
import type { AppId } from "./apps";

export type OsContextValue = {
  theme: FluxThemeId;
  setTheme: (theme: FluxThemeId) => void;
  /** Ferrofluid id ("01"…"16") or null for no centrepiece. */
  wallpaper: string | null;
  setWallpaper: (id: string | null) => void;
  openApp: (id: AppId) => void;
};

export const OsContext = createContext<OsContextValue | null>(null);

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used inside <Desktop>");
  return ctx;
}
