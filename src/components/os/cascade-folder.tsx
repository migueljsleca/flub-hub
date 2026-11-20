"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FolderOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CascadeItem = {
  name: string;
  /** Full-size file: image or MP4. */
  href: string;
  /** Still preview (for videos, a frame of the clip). */
  thumb: string;
  /** width / height, so tiles keep their real shape before images load. */
  ratio: number;
  video?: boolean;
};

const GAP = 8;
const PAD = 12;
const MIN_COLUMN = 240; // px; column count follows the window width
const DRIFT = 22; // px per second the grid slides down on its own
const RESUME_AFTER = 1400; // ms of no scrolling before the drift picks up again

type Column = { items: { index: number; item: CascadeItem }[]; height: number };

/**
 * Infinite cascading (masonry) grid. Every piece keeps its real proportions,
 * nothing is cropped; items go left-to-right into the shortest column.
 *
 * Each column is its own endless loop (its items repeated), and one shared
 * offset `y` moves all of them: the grid drifts down slowly by itself, and the
 * wheel / trackpad / touch scrolls it up or down forever. Offsets are written
 * straight to each column's transform every frame (no React render per frame).
 * Videos autoplay muted in a loop, but only while on screen.
 */
export function CascadeFolder({ items }: { items: CascadeItem[] }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [open, setOpen] = useState<number | null>(null);
  const motion = useRef({ y: 0, lastInput: -Infinity, paused: false });

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width - PAD * 2, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = useMemo<Column[]>(() => {
    if (size.w <= 0) return [];
    const count = Math.max(2, Math.floor((size.w + GAP) / (MIN_COLUMN + GAP)));
    const colWidth = (size.w - GAP * (count - 1)) / count;
    const cols: Column[] = Array.from({ length: count }, () => ({ items: [], height: 0 }));
    items.forEach((item, index) => {
      const shortest = cols.reduce((best, c, i) => (c.height < cols[best].height ? i : best), 0);
      cols[shortest].items.push({ index, item });
      cols[shortest].height += colWidth / item.ratio + GAP;
    });
    return cols;
  }, [items, size.w]);

  // Pause the drift while the viewer is open.
  useEffect(() => {
    motion.current.paused = open !== null;
  }, [open]);

  // Drift + wrap loop.
  useEffect(() => {
    if (columns.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const m = motion.current;
      if (!reduced && !m.paused && now - m.lastInput > RESUME_AFTER) m.y -= DRIFT * dt; // content moves down
      columns.forEach((_, i) => {
        const el = colRefs.current[i];
        if (!el) return;
        // Loop length = one copy of the column, measured from the real layout so
        // sub-pixel rounding can't make the wrap jump. (Transforms don't affect
        // layout, so reading offsetHeight here doesn't force a reflow.)
        const copies = Number(el.dataset.copies) || 1;
        const period = (el.offsetHeight + GAP) / copies;
        if (period <= 0) return;
        const offset = ((m.y % period) + period) % period; // 0..period, wraps both ways
        el.style.transform = `translate3d(0, ${-offset}px, 0)`;
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [columns]);

  // Wheel / trackpad and touch drag scroll the shared offset, forever.
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (motion.current.paused) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      motion.current.y += e.deltaY * unit;
      motion.current.lastInput = performance.now();
    };
    let touchY: number | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") touchY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (touchY === null || motion.current.paused) return;
      motion.current.y -= e.clientY - touchY;
      motion.current.lastInput = performance.now();
      touchY = e.clientY;
    };
    const onUp = () => (touchY = null);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <FolderOpen className="size-8 opacity-40" strokeWidth={1.5} />
        This folder is empty
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={viewRef} className="h-full touch-none overflow-hidden" style={{ padding: `0 ${PAD}px` }}>
        <div className="flex items-start" style={{ gap: GAP }}>
          {columns.map((col, c) => {
            // enough copies of the column to always cover the view, plus one to wrap into
            const copies = Math.max(2, Math.ceil(size.h / Math.max(col.height, 1)) + 1);
            return (
              <div
                key={c}
                ref={(el) => {
                  colRefs.current[c] = el;
                }}
                data-copies={copies}
                className="flex min-w-0 flex-1 flex-col will-change-transform"
                style={{ gap: GAP }}
              >
                {Array.from({ length: copies }, (_, k) =>
                  col.items.map(({ index, item }) => (
                    <Tile key={`${k}-${item.href}`} item={item} onOpen={() => setOpen(index)} />
                  )),
                )}
              </div>
            );
          })}
        </div>
      </div>
      {open !== null && <Viewer items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Tile({ item, onOpen }: { item: CascadeItem; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Videos loop silently, but only while visible: the grid repeats, so many
  // copies exist and most are off screen at any moment.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={item.name}
      className="group relative block w-full shrink-0 overflow-hidden bg-card outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-flux-soft"
      style={{ aspectRatio: item.ratio }}
    >
      {item.video ? (
        <video
          ref={videoRef}
          src={item.href}
          poster={item.thumb}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Image src={item.thumb} alt="" fill sizes="(max-width: 1200px) 33vw, 25vw" className="object-cover" />
      )}
      <span className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-white/80 px-1.5 pt-1 pb-0.5 font-heading text-[11px] leading-none font-bold tracking-tight text-flux-ink uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {item.name}
      </span>
    </button>
  );
}

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: CascadeItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const step = (d: number) => onIndex((index + d + items.length) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  return (
    <div role="dialog" aria-label={item.name} className="absolute inset-0 z-10 flex flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <span className="truncate bg-flux-soft px-1.5 pt-1 pb-0.5 font-heading text-xs leading-none font-bold tracking-tight text-flux-ink uppercase">
          {item.name}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} / {items.length}
        </span>
        <div className="flex-1" />
        <ViewerButton label="Open in new tab" onClick={() => window.open(item.href, "_blank", "noopener,noreferrer")}>
          <ExternalLink />
        </ViewerButton>
        <ViewerButton label="Close" onClick={onClose}>
          <X />
        </ViewerButton>
      </div>
      <div className="relative min-h-0 flex-1">
        {item.video ? (
          <video
            key={item.href}
            src={item.href}
            poster={item.thumb}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="absolute inset-0 size-full object-contain p-4"
          />
        ) : (
          <Image key={item.href} src={item.href} alt={item.name} fill sizes="100vw" className="object-contain p-4" />
        )}
        <ViewerButton label="Previous" onClick={() => step(-1)} className="absolute top-1/2 left-2 -translate-y-1/2">
          <ChevronLeft />
        </ViewerButton>
        <ViewerButton label="Next" onClick={() => step(1)} className="absolute top-1/2 right-2 -translate-y-1/2">
          <ChevronRight />
        </ViewerButton>
      </div>
    </div>
  );
}

function ViewerButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center border bg-card text-foreground hover:border-flux-soft hover:bg-flux-soft hover:text-flux-ink [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}
