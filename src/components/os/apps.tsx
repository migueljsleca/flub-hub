"use client";

import Image from "next/image";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Images,
  Info,
  Settings2,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FERROFLUIDS,
  FLUX_PALETTE,
  FLUX_THEMES,
  FLUX_THEME_IDS,
  ferroSrc,
  ferroThumb,
  readStored,
  writeStored,
} from "@/lib/flux";
import { cn } from "@/lib/utils";
import { FluxOsLogo } from "./flux-os-logo";
import { useOs } from "./os-context";

export type AppId = "files" | "gallery" | "notes" | "settings" | "about";

export type AppDef = {
  title: string;
  icon: LucideIcon;
  size: { w: number; h: number };
  Component: ComponentType;
};

/* ------------------------------------------------------------------ Files */

const PROJECT_FOLDERS = [
  "flux-pass",
  "flux-pass-doc",
  "ferrofluid-lab",
  "shakeout-lab",
  "poster-wall",
  "venue",
  "tee-print",
  "stickers",
  "badge-mockup",
  "video-mockup",
  "concepts",
  "icons",
];

function FilesApp() {
  const [path, setPath] = useState<string[]>([]);
  const folder = path.at(-1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-3 py-2 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={path.length === 0}
          onClick={() => setPath((p) => p.slice(0, -1))}
          aria-label="Back"
        >
          <ArrowLeft />
        </Button>
        <button className="px-1 font-medium hover:bg-flux-soft hover:text-flux-ink" onClick={() => setPath([])}>
          Project 2
        </button>
        {path.map((p) => (
          <span key={p} className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            <span className="text-foreground">{p}</span>
          </span>
        ))}
      </div>

      {folder ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="size-8 opacity-40" />
          This folder is empty
        </div>
      ) : (
        <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1 overflow-auto p-3">
          {PROJECT_FOLDERS.map((name) => (
            <button
              key={name}
              onDoubleClick={() => setPath([name])}
              onKeyDown={(e) => e.key === "Enter" && setPath([name])}
              className="group flex flex-col items-center gap-1.5 p-2 outline-none hover:bg-secondary focus-visible:bg-secondary"
            >
              <Folder className="size-9 text-flux-soft" strokeWidth={1.75} />
              <span className="w-full truncate text-center text-xs text-muted-foreground group-hover:text-foreground">
                {name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Gallery */

function GalleryApp() {
  const { setWallpaper, wallpaper } = useOs();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % FERROFLUIDS.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? i : (i - 1 + FERROFLUIDS.length) % FERROFLUIDS.length));
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (open !== null) {
    const id = FERROFLUIDS[open];
    const isWallpaper = wallpaper === id;
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>
            <ArrowLeft /> All
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            ferrofluid {id} · {open + 1}/{FERROFLUIDS.length}
          </span>
          <Button size="sm" variant={isWallpaper ? "secondary" : "default"} onClick={() => setWallpaper(id)}>
            {isWallpaper ? <Check /> : null}
            {isWallpaper ? "Wallpaper" : "Set as wallpaper"}
          </Button>
        </div>
        <div className="relative flex-1 bg-flux">
          <Image src={ferroSrc(id)} alt={`Ferrofluid ${id}`} fill sizes="600px" className="object-contain p-8" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 left-2 -translate-y-1/2"
            onClick={() => setOpen((open - 1 + FERROFLUIDS.length) % FERROFLUIDS.length)}
            aria-label="Previous"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            onClick={() => setOpen((open + 1) % FERROFLUIDS.length)}
            aria-label="Next"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full auto-rows-min grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 overflow-auto p-3">
      {FERROFLUIDS.map((id, i) => (
        <button
          key={id}
          onClick={() => setOpen(i)}
          className="relative aspect-square overflow-hidden border bg-background transition-colors hover:border-flux hover:bg-flux"
        >
          <Image src={ferroThumb(id)} alt={`Ferrofluid ${id}`} fill sizes="100px" className="object-contain p-2" />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Notes */

const NOTES_KEY = "flux-os:notes";
const isString = (v: unknown): v is string => typeof v === "string";

function NotesApp() {
  const [text, setText] = useState(() =>
    readStored(NOTES_KEY, "Welcome to Flux OS.\n\nAnything you write here stays in this browser.", isString),
  );

  useEffect(() => {
    const t = setTimeout(() => writeStored(NOTES_KEY, text), 250);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        placeholder="Start typing…"
      />
      <div className="flex justify-between border-t px-4 py-1.5 text-[11px] text-muted-foreground tabular-nums">
        <span>Saved locally</span>
        <span>{text.length} chars</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Settings */

function SettingsApp() {
  const { theme, setTheme, wallpaper, setWallpaper } = useOs();

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
        <h3 className="inline-block bg-flux-soft px-1.5 py-0.5 text-xs font-bold tracking-tight text-flux-ink">Wallpaper</h3>
        <div className="grid grid-cols-6 gap-1.5">
          <button
            onClick={() => setWallpaper(null)}
            className={cn(
              "flex aspect-square items-center justify-center border bg-background text-[11px] font-medium text-muted-foreground",
              wallpaper === null ? "border-flux-soft bg-flux-soft text-flux-ink" : "hover:bg-secondary",
            )}
          >
            None
          </button>
          {FERROFLUIDS.map((id) => (
            <button
              key={id}
              onClick={() => setWallpaper(id)}
              className={cn(
                "relative aspect-square border",
                wallpaper === id ? "border-flux bg-flux" : "bg-background hover:bg-secondary",
              )}
              aria-label={`Ferrofluid ${id}`}
            >
              <Image src={ferroThumb(id)} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
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

export const APPS: Record<AppId, AppDef> = {
  files: { title: "Projects", icon: Folder, size: { w: 620, h: 420 }, Component: FilesApp },
  gallery: { title: "Ferrofluids", icon: Images, size: { w: 640, h: 480 }, Component: GalleryApp },
  notes: { title: "Notes", icon: StickyNote, size: { w: 440, h: 400 }, Component: NotesApp },
  settings: { title: "Settings", icon: Settings2, size: { w: 520, h: 520 }, Component: SettingsApp },
  about: { title: "About", icon: Info, size: { w: 420, h: 300 }, Component: AboutApp },
};

