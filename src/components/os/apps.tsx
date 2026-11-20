"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import { Clapperboard, Info, Link2, Settings2, Video } from "lucide-react";
import { FLUX_PALETTE, FLUX_THEMES, FLUX_THEME_IDS } from "@/lib/flux";
import { FERRO_PRESET_IDS, FERRO_PRESET_LABELS } from "@/lib/ferro-presets";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "./badge-icon";
import { FerrofluidIcon } from "./ferrofluid-icon";
import { FloraMark } from "./flora-mark";
import { FluxOsLogo } from "./flux-os-logo";
import { useOs } from "./os-context";

/* ------------------------------------------------------------ Links & sites */

/**
 * Desktop links. Paste a URL here and double-clicking the icon opens it in a
 * new tab; while it's null the icon opens a small "no link yet" window.
 */
export const LINKS = {
  "flora-file": "https://app.flora.ai/join-project/46bf0eff-2591-4b2f-b48f-0f72754c67ef" as string | null,
  "internal-video": null as string | null,
  "external-video": null as string | null,
};
type LinkId = keyof typeof LINKS;

/** Live sites that open inside an OS window. */
const SITES = {
  "flux-pass": "https://flux-pass.miguel-leca.com/",
  "ferrofluid-lab": "https://ferrofluid-lab.miguel-leca.com/",
};
type SiteId = keyof typeof SITES;

export type AppId = "settings" | "about" | SiteId | LinkId;

export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

export type AppDef = {
  title: string;
  icon: IconComponent;
  size: { w: number; h: number };
  Component: ComponentType;
  /** Content is an iframe: the window shields it while unfocused / dragging. */
  embed?: boolean;
  /** Live site shown in the window; also offered as "Open in new tab". */
  url?: string;
  /** Set false for small panels that shouldn't go full screen. */
  maximizable?: boolean;
};

/* ----------------------------------------------------------- Embedded site */

function siteApp(url: string, title: string): ComponentType {
  function SiteApp() {
    return (
      <iframe
        src={url}
        title={title}
        className="absolute inset-0 size-full border-0 bg-background"
        allow="clipboard-write; fullscreen"
      />
    );
  }
  return SiteApp;
}

/* ------------------------------------------------------------ Pending link */

function pendingLinkApp(title: string, Icon: IconComponent): ComponentType {
  function PendingLink() {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex size-14 items-center justify-center border text-flux-soft">
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
        <span className="bg-flux-soft px-1.5 py-0.5 font-heading text-xs font-bold tracking-tight text-flux-ink uppercase">
          {title}
        </span>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" /> No link added yet
        </p>
      </div>
    );
  }
  return PendingLink;
}

/* --------------------------------------------------------------- Settings */

function SettingsApp() {
  const { theme, setTheme, ferro, setFerro } = useOs();

  return (
    <div className="h-full space-y-6 overflow-auto p-4">
      <section className="space-y-2">
        <h3 className="inline-block bg-flux-soft px-1.5 py-0.5 text-xs font-bold tracking-tight text-flux-ink">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {FLUX_THEME_IDS.map((id) => {
            const t = FLUX_THEMES[id];
            const active = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "group overflow-hidden border text-left transition-colors",
                  active ? "border-flux-soft outline-2 outline-flux-soft" : "hover:border-muted-foreground",
                )}
              >
                <div className="flex h-14">
                  <div className="flex-[2]" style={{ background: t.flux }} />
                  <div className="flex-1" style={{ background: t.soft }} />
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-sm font-bold tracking-tight">{t.label}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{t.pair}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="inline-block bg-flux-soft px-1.5 py-0.5 text-xs font-bold tracking-tight text-flux-ink">Ferrofluid</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setFerro(null)}
            className={cn(
              "flex aspect-square items-center justify-center border bg-background text-[11px] font-medium text-muted-foreground",
              ferro === null ? "border-flux-soft bg-flux-soft text-flux-ink" : "hover:bg-secondary",
            )}
          >
            None
          </button>
          {FERRO_PRESET_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setFerro(id)}
              className={cn(
                "group relative aspect-square overflow-hidden border",
                ferro === id ? "border-flux-soft outline-2 outline-flux-soft" : "hover:border-muted-foreground",
              )}
            >
              <Image src={`/ferro-presets/${id}.png`} alt="" fill sizes="120px" className="object-cover" />
              <span
                className={cn(
                  "absolute bottom-1.5 left-1.5 px-1.5 pt-1 pb-0.5 font-heading text-[10px] leading-none font-bold tracking-tight uppercase",
                  ferro === id ? "bg-flux-soft text-flux-ink" : "bg-card text-foreground",
                )}
              >
                {FERRO_PRESET_LABELS[id]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Drag the ferrofluid on the desktop to turn it.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ About */

function AboutApp() {
  return (
    <div className="flex h-full flex-col justify-between gap-6 p-5">
      <div className="space-y-4">
        <FluxOsLogo className="w-56" />
        <div className="text-xs text-muted-foreground">Version 0.1 · a tiny desktop for the FLUX project</div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {FLUX_PALETTE.map((c) => (
          <div key={c.hex} className="space-y-1">
            <div className="aspect-square border" style={{ background: c.hex }} />
            <div className="truncate text-[10px] leading-tight text-muted-foreground" title={c.name}>
              {c.hex}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Registry */

const SITE_SIZE = { w: 1180, h: 760 };
const LINK_SIZE = { w: 360, h: 240 };

export const APPS: Record<AppId, AppDef> = {
  settings: { title: "Settings", icon: Settings2, size: { w: 520, h: 520 }, Component: SettingsApp, maximizable: false },
  about: { title: "About", icon: Info, size: { w: 420, h: 300 }, Component: AboutApp },
  "flux-pass": {
    title: "Flux Pass",
    icon: BadgeIcon,
    size: SITE_SIZE,
    Component: siteApp(SITES["flux-pass"], "Flux Pass"),
    embed: true,
    url: SITES["flux-pass"],
  },
  "ferrofluid-lab": {
    title: "Ferrofluid Lab",
    icon: FerrofluidIcon,
    size: SITE_SIZE,
    Component: siteApp(SITES["ferrofluid-lab"], "Ferrofluid Lab"),
    embed: true,
    url: SITES["ferrofluid-lab"],
  },
  "flora-file": { title: "Flora File", icon: FloraMark, size: LINK_SIZE, Component: pendingLinkApp("Flora File", FloraMark) },
  "internal-video": { title: "Internal Video", icon: Video, size: LINK_SIZE, Component: pendingLinkApp("Internal Video", Video) },
  "external-video": {
    title: "External Video",
    icon: Clapperboard,
    size: LINK_SIZE,
    Component: pendingLinkApp("External Video", Clapperboard),
  },
};

/** What sits on the desktop, in default top-to-bottom order. */
export const DESKTOP_ITEMS: AppId[] = [
  "settings",
  "flux-pass",
  "ferrofluid-lab",
  "flora-file",
  "internal-video",
  "external-video",
];

/** A desktop link with a URL opens in a new tab instead of a window. */
export function linkFor(id: AppId): string | null {
  return id in LINKS ? LINKS[id as LinkId] : null;
}
