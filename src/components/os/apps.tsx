"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import { Clapperboard, Folder, Info, Link2, Settings2, Video } from "lucide-react";
import { FLUX_THEMES, FLUX_THEME_IDS } from "@/lib/flux";
import { FERRO_PRESET_IDS, FERRO_PRESET_LABELS } from "@/lib/ferro-presets";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "./badge-icon";
import { CascadeFolder, type CascadeItem } from "./cascade-folder";
import { FerrofluidIcon } from "./ferrofluid-icon";
import { FloraMark } from "./flora-mark";
import { FluxHubLogo } from "./flux-hub-logo";
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

/* ------------------------------------------------------------------ Folders */

/**
 * Desktop folders, shown as a cascading grid (see cascade-folder.tsx).
 * `href` is the full file (in /public), `thumb` its preview, `ratio` its
 * width / height so tiles keep their real shape.
 */
export type FolderItem = CascadeItem;

const image = (dir: string, file: string, name: string, ratio: number): FolderItem => ({
  name,
  ratio,
  href: `/${dir}/${file}.webp`,
  thumb: `/${dir}/${file}.webp`,
});
const video = (dir: string, file: string, name: string, ratio: number): FolderItem => ({
  name,
  ratio,
  video: true,
  href: `/${dir}/video-${file}.mp4`,
  thumb: `/${dir}/video-${file}.webp`,
});

/*
 * Exported from Figma "Project 2 - bootcamp explore": Final Delivery Designs
 * (node 132:3230) and Mockups & applications (node 288:2244), in reading
 * order, web-optimised (WebP <= 1600px, H.264 MP4 <= 1600px, no audio).
 */
const DESIGNS: FolderItem[] = [
  image("designs", "miami-wall", "Miami Wall Billboard", 3.62),
  image("designs", "nashville-billboard", "Nashville Billboard", 3.62),
  image("designs", "poster-strange-attracts-blue", "Poster · Strange Attracts", 0.666),
  image("designs", "times-square-tower-blue", "Times Square Tower", 0.232),
  video("designs", "story-just-announced", "Story · Just Announced", 0.562),
  image("designs", "rollup", "Roll-up Banner", 0.425),
  video("designs", "poster-unmatched-sound", "Poster · Unmatched Sound", 0.666),
  image("designs", "times-square-tower-rose", "Times Square Tower", 0.232),
  image("designs", "poster-strange-attracts-carrot", "Poster · Strange Attracts", 0.666),
  image("designs", "poster-algorithm", "Poster · The Algorithm", 0.666),
  image("designs", "poster-spike-the-room", "Square · Spike the Room", 1),
];

const MOCKUPS: FolderItem[] = [
  video("mockups", "instagram-spike-the-room", "Instagram · Spike the Room", 0.778),
  image("mockups", "wristband", "Wristband", 0.806),
  image("mockups", "la-rooftop", "LA Rooftop", 1.792),
  image("mockups", "keyring", "Keyring", 0.806),
  video("mockups", "phone-in-the-street", "Phone in the Street", 0.746),
  image("mockups", "tee", "T-shirt Print", 0.747),
  video("mockups", "subway-lightbox-unmatched-sound", "Subway Lightbox", 0.746),
  image("mockups", "badge-name", "ID Badge · Name Side", 0.806),
  image("mockups", "badge-flux", "ID Badge · FLUX Side", 0.806),
  image("mockups", "brick-wall", "Poster Wall", 1.339),
  image("mockups", "two-friends", "Two Friends, Phone", 1.79),
  image("mockups", "hand-glass", "Hand on the Glass", 1.79),
  image("mockups", "poster-perfection", "Poster Perfection", 1.792),
  image("mockups", "times-square", "Times Square", 1.792),
  image("mockups", "vinyl", "Vinyl", 0.806),
  image("mockups", "cap", "Cap", 0.806),
  video("mockups", "street-poster-algorithm", "Street Poster · The Algorithm", 0.746),
  image("mockups", "street-kiosk", "Street Kiosk", 1.792),
  image("mockups", "rollup-venue", "Roll-up at the Venue", 0.806),
];

/** One stream, designs and mockups alternating, so the grid mixes them. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < b.length) out.push(b[i]);
    if (i < a.length) out.push(a[i]);
  }
  return out;
}

export const FOLDERS = {
  presentation: { title: "Presentation", items: [] as FolderItem[] },
  designs: { title: "Designs & Mockups", items: interleave(DESIGNS, MOCKUPS) },
};
type FolderId = keyof typeof FOLDERS;

export type AppId = "settings" | "about" | FolderId | SiteId | LinkId;

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
  /** Open already maximised (galleries). */
  startMaximized?: boolean;
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

/* ------------------------------------------------------------ Folder window */

function folderApp(id: FolderId): ComponentType {
  function FolderWindow() {
    return <CascadeFolder items={FOLDERS[id].items} />;
  }
  return FolderWindow;
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
    <div className="h-full overflow-auto p-6">
      <div className="space-y-5">
        <FluxHubLogo className="w-52" />

        <p className="inline-block bg-flux-soft px-2 pt-1.5 pb-1 font-heading text-lg leading-none font-bold tracking-tight text-flux-ink uppercase">
          Strange attracts.
        </p>

        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="font-semibold text-foreground">FLUX</strong> is Spotify&rsquo;s two-day event for people
            whose taste doesn&rsquo;t fit in. The campaign celebrates the weird: one-off liquid-metal shapes that never
            take the same form twice, fish-eye portraits of real fans pushed right up to the lens, and loud
            highlight-box type.
          </p>
          <p>
            Odd taste isn&rsquo;t something to hide. It&rsquo;s what makes you{" "}
            <strong className="font-semibold text-foreground">magnetic</strong>. No two shapes, no two fans, no two
            playlists are the same.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Flux Hub</strong> is the project&rsquo;s home base.
            Everything lives here: the presentation, designs and mockups, the Flux Pass, the Ferrofluid Lab, the
            FLORA file and the videos.
          </p>
        </div>

        <p className="border-t pt-3 text-[11px] text-muted-foreground">Spotify · See What You Hear · 2026</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Registry */

const SITE_SIZE = { w: 1180, h: 760 };
const LINK_SIZE = { w: 360, h: 240 };

const FOLDER_SIZE = { w: 780, h: 560 };

export const APPS: Record<AppId, AppDef> = {
  presentation: { title: FOLDERS.presentation.title, icon: Folder, size: FOLDER_SIZE, Component: folderApp("presentation") },
  designs: { title: FOLDERS.designs.title, icon: Folder, size: FOLDER_SIZE, Component: folderApp("designs"), startMaximized: true },
  settings: { title: "Settings", icon: Settings2, size: { w: 520, h: 520 }, Component: SettingsApp, maximizable: false },
  about: { title: "About", icon: Info, size: { w: 460, h: 560 }, Component: AboutApp, maximizable: false },
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
  "presentation",
  "designs",
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
