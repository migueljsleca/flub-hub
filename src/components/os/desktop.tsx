"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FLUX_THEME_IDS, readStored, writeStored, type FluxThemeId } from "@/lib/flux";
import { isFerroPresetId, type FerroPresetId } from "@/lib/ferro-presets";
import { APPS, DESKTOP_ITEMS, linkFor, type AppId } from "./apps";
import { DesktopIcon, ICON_H, ICON_W, type Point } from "./desktop-icon";
import { CLOCK_RESERVE, Clock } from "./clock";
import { OsContext, type OsContextValue } from "./os-context";
import { FerroStage } from "./ferro-stage";
import { FluxHubLogo } from "./flux-hub-logo";
import { AppWindow as AppWindowIcon, ExternalLink } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { OsWindow, openInNewTab, type Rect, type WindowState } from "./window";

// Storage keys keep the old "flux-os" prefix so saved settings survive the rename.
const THEME_KEY = "flux-os:theme";
const FERRO_KEY = "flux-os:ferro";
const ICONS_KEY = "flux-os:icon-positions";

const isThemeId = (v: unknown): v is FluxThemeId => FLUX_THEME_IDS.includes(v as FluxThemeId);
const isFerroChoice = (v: unknown): v is FerroPresetId | null => v === null || isFerroPresetId(v);

type AppWindow = WindowState & { id: AppId };
type IconPositions = Partial<Record<AppId, Point>>;

const isPoint = (v: unknown): v is Point =>
  typeof v === "object" && v !== null && Number.isFinite((v as Point).x) && Number.isFinite((v as Point).y);
const isIconPositions = (v: unknown): v is IconPositions =>
  typeof v === "object" && v !== null && Object.values(v).every(isPoint);


export function Desktop() {
  const [theme, setThemeState] = useState<FluxThemeId>(() => readStored(THEME_KEY, "blue", isThemeId));
  const [ferro, setFerroState] = useState<FerroPresetId | null>(() =>
    // "liquid" was the sphere's old name
    readStored(FERRO_KEY, "spikes", isFerroChoice, { liquid: "sphere" }),
  );
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

  /** Saved spot, or the default layout (top-to-bottom columns from the left); kept on screen. */
  const perColumn = Math.max(1, Math.floor((bounds.h - 16) / ICON_H));
  const iconPoint = (app: AppId, i: number): Point => {
    const p = iconPos[app] ?? { x: 16 + Math.floor(i / perColumn) * ICON_W, y: 16 + (i % perColumn) * ICON_H };
    return { x: Math.min(p.x, Math.max(0, bounds.w - ICON_W)), y: Math.min(p.y, Math.max(0, bounds.h - ICON_H)) };
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
        maximized: APPS[id].startMaximized ?? false,
      },
    ]);
  };

  const ctx: OsContextValue = {
    theme,
    setTheme: (t) => {
      setThemeState(t);
      writeStored(THEME_KEY, t);
    },
    ferro,
    setFerro: (id) => {
      setFerroState(id);
      writeStored(FERRO_KEY, id);
    },
    openApp,
  };

  return (
    <OsContext.Provider value={ctx}>
      <main
        data-flux-theme={theme}
        className="relative isolate h-dvh w-full overflow-hidden bg-background select-none"
        onPointerDown={(e) => (e.target === e.currentTarget || e.target instanceof HTMLCanvasElement) && setSelectedIcon(null)}
      >
        <Wallpaper />

        {/* Live 3D ferrofluid, drag to orbit; the look is picked in Settings */}
        {ferro && (
          <FerroStage
            preset={ferro}
            className="absolute top-1/2 left-1/2 z-0 size-[min(108vmin,1100px)] -translate-1/2"
          />
        )}

        {/* Logo lockup + tagline, top-right; click the logo for About */}
        <div className="absolute top-6 right-6 z-[1] flex w-[clamp(220px,28vw,380px)] flex-col items-end gap-3">
          <button
            type="button"
            aria-label="About Flux Hub"
            onClick={() => openApp("about")}
            className="w-full outline-none transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flux-soft"
          >
            <FluxHubLogo className="w-full" />
          </button>
          {/* Tagline in stacked highlighter boxes, like the poster headlines */}
          <p className="flex flex-col items-end font-heading text-[clamp(14px,1.25vw,18px)] leading-none font-bold tracking-tight text-flux-ink">
            <span className="bg-flux-soft px-2 pt-1.5 pb-1">Home base for</span>
            <span className="bg-flux-soft px-2 pt-1 pb-1.5">all things FLUX.</span>
          </p>
        </div>

        {/* Desktop icons — drag to move, positions are remembered */}
        {DESKTOP_ITEMS.map((app, i) => {
          const icon = (
            <DesktopIcon
              key={app}
              label={APPS[app].title}
              icon={APPS[app].icon}
              pos={iconPoint(app, i)}
              selected={selectedIcon === app}
              bounds={bounds}
              onSelect={() => setSelectedIcon(app)}
              onOpen={() => {
                const href = linkFor(app);
                if (href) openInNewTab(href);
                else openApp(app);
              }}
              onDrop={(p) => {
                const next = { ...iconPos, [app]: p };
                setIconPos(next);
                writeStored(ICONS_KEY, next);
              }}
            />
          );
          const url = APPS[app].url;
          if (!url) return icon;
          // Sites: right-click to choose where to open
          return (
            <ContextMenu key={app}>
              <ContextMenuTrigger>{icon}</ContextMenuTrigger>
              <ContextMenuContent className="min-w-48 border bg-popover p-0 shadow-none ring-0">
                <ContextMenuItem
                  onClick={() => openApp(app)}
                  className="gap-2 px-3 py-2 font-medium focus:bg-flux-soft focus:text-flux-ink focus:*:[svg]:text-flux-ink"
                >
                  <AppWindowIcon /> Open in Flux Hub
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => openInNewTab(url)}
                  className="gap-2 border-t px-3 py-2 font-medium focus:bg-flux-soft focus:text-flux-ink focus:*:[svg]:text-flux-ink"
                >
                  <ExternalLink /> Open in new tab
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {windows.map((win) => {
          const app = APPS[win.id];
          return (
            <OsWindow
              key={win.id}
              win={win}
              title={app.title}
              icon={app.icon}
              focused={focusedId === win.id}
              embed={app.embed}
              url={app.url}
              maximizable={app.maximizable}
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

function Wallpaper() {
  // Same workspace as flux-pass ("Dots"): near-black field with 3px dots on a
  // 24px grid, anchored to the screen centre.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgb(250_250_250/0.1)_1.5px,transparent_1.5px)] bg-size-[24px_24px] bg-center" />
    </div>
  );
}
