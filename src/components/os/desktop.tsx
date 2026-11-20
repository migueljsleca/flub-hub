"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Folder, Images, Settings2, type LucideIcon } from "lucide-react";
import {
  FERROFLUIDS,
  FLUX_THEME_IDS,
  ferroSrc,
  readStored,
  writeStored,
  type FluxThemeId,
} from "@/lib/flux";
import { APPS, type AppId } from "./apps";
import { DesktopIcon, ICON_H, type Point } from "./desktop-icon";
import { CLOCK_RESERVE, Clock } from "./clock";
import { OsContext, type OsContextValue } from "./os-context";
import { FluxOsLogo } from "./flux-os-logo";
import { OsWindow, type Rect, type WindowState } from "./window";

const THEME_KEY = "flux-os:theme";
const WALLPAPER_KEY = "flux-os:wallpaper";
const ICONS_KEY = "flux-os:icon-positions";

const isThemeId = (v: unknown): v is FluxThemeId => FLUX_THEME_IDS.includes(v as FluxThemeId);
const isWallpaper = (v: unknown): v is string | null => v === null || FERROFLUIDS.includes(v as string);

type AppWindow = WindowState & { id: AppId };
type IconPositions = Partial<Record<AppId, Point>>;

const isPoint = (v: unknown): v is Point =>
  typeof v === "object" && v !== null && Number.isFinite((v as Point).x) && Number.isFinite((v as Point).y);
const isIconPositions = (v: unknown): v is IconPositions =>
  typeof v === "object" && v !== null && Object.values(v).every(isPoint);

const DESKTOP_ICONS: { app: AppId; label: string; icon: LucideIcon }[] = [
  { app: "files", label: "Projects", icon: Folder },
  { app: "gallery", label: "Ferrofluids", icon: Images },
  { app: "notes", label: "Notes.txt", icon: FileText },
  { app: "settings", label: "Settings", icon: Settings2 },
];

export function Desktop() {
  const [theme, setThemeState] = useState<FluxThemeId>(() => readStored(THEME_KEY, "blue", isThemeId));
  const [wallpaper, setWallpaperState] = useState<string | null>(() => readStored(WALLPAPER_KEY, "01", isWallpaper));
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null);
  const [iconPos, setIconPos] = useState<IconPositions>(() => readStored(ICONS_KEY, {}, isIconPositions));
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const zTop = useRef(10);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const bounds = { w: viewport.w, h: viewport.h - CLOCK_RESERVE };

  /** Saved spot, or the default left-hand column; kept on screen if the window shrank. */
  const iconPoint = (app: AppId, i: number): Point => {
    const p = iconPos[app] ?? { x: 16, y: 16 + i * ICON_H };
    return { x: Math.min(p.x, Math.max(0, bounds.w - 96)), y: Math.min(p.y, Math.max(0, bounds.h - ICON_H)) };
  };

  const focusedId = useMemo(() => {
    if (windows.length === 0) return null;
    return windows.reduce((a, b) => (b.z > a.z ? b : a)).id;
  }, [windows]);

  const update = (id: AppId, patch: Partial<AppWindow>) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const focus = (id: AppId) => {
    if (id === focusedId) return;
    update(id, { z: ++zTop.current });
  };

  const openApp = (id: AppId) => {
    if (windows.some((w) => w.id === id)) return focus(id);
    const { size } = APPS[id];
    const w = Math.min(size.w, bounds.w - 16);
    const h = Math.min(size.h, bounds.h - 16);
    const offset = (windows.length % 6) * 28;
    const z = ++zTop.current;
    setWindows((ws) => [
      ...ws,
      {
        id,
        w,
        h,
        x: Math.max(8, Math.round((bounds.w - w) / 2) + offset - 56),
        y: Math.max(8, Math.round((bounds.h - h) / 2) + offset - 56),
        z,
        maximized: false,
      },
    ]);
  };

  const ctx: OsContextValue = {
    theme,
    setTheme: (t) => {
      setThemeState(t);
      writeStored(THEME_KEY, t);
    },
    wallpaper,
    setWallpaper: (id) => {
      setWallpaperState(id);
      writeStored(WALLPAPER_KEY, id);
    },
    openApp,
  };

  return (
    <OsContext.Provider value={ctx}>
      <main
        data-flux-theme={theme}
        className="relative isolate h-dvh w-full overflow-hidden bg-background select-none"
        onPointerDown={(e) => e.target === e.currentTarget && setSelectedIcon(null)}
      >
        <Wallpaper ferro={wallpaper} />

        {/* Logo lockup, top-right; click for About */}
        <button
          type="button"
          aria-label="About Flux OS"
          onClick={() => openApp("about")}
          className="absolute top-6 right-6 z-[1] w-[clamp(220px,28vw,380px)] outline-none transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flux-soft"
        >
          <FluxOsLogo className="w-full" />
        </button>

        {/* Desktop icons — drag to move, positions are remembered */}
        {DESKTOP_ICONS.map(({ app, label, icon }, i) => (
          <DesktopIcon
            key={app}
            label={label}
            icon={icon}
            pos={iconPoint(app, i)}
            selected={selectedIcon === app}
            bounds={bounds}
            onSelect={() => setSelectedIcon(app)}
            onOpen={() => openApp(app)}
            onDrop={(p) => {
              const next = { ...iconPos, [app]: p };
              setIconPos(next);
              writeStored(ICONS_KEY, next);
            }}
          />
        ))}

        {windows.map((win) => {
          const app = APPS[win.id];
          return (
            <OsWindow
              key={win.id}
              win={win}
              title={app.title}
              icon={app.icon}
              focused={focusedId === win.id}
              bounds={bounds}
              onFocus={() => focus(win.id)}
              onClose={() => setWindows((ws) => ws.filter((w) => w.id !== win.id))}
              onToggleMaximize={() => update(win.id, { maximized: !win.maximized })}
              onRect={(rect: Rect) => update(win.id, rect)}
            >
              <app.Component />
            </OsWindow>
          );
        })}

        <Clock />
      </main>
    </OsContext.Provider>
  );
}

function Wallpaper({ ferro }: { ferro: string | null }) {
  // Same workspace as flux-pass ("Dots"): near-black field with 3px dots on a
  // 24px grid, anchored to the screen centre; the ferrofluid floats on top.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgb(250_250_250/0.1)_1.5px,transparent_1.5px)] bg-size-[24px_24px] bg-center" />
      {ferro && (
        <div className="absolute top-[calc(50%-36px)] left-1/2 size-[56vmin] -translate-1/2 animate-[flux-float_14s_ease-in-out_infinite]">
          <Image
            key={ferro}
            src={ferroSrc(ferro)}
            alt=""
            fill
            priority
            sizes="56vmin"
            className="animate-in object-contain duration-500 fade-in-0 zoom-in-95"
          />
        </div>
      )}
    </div>
  );
}
