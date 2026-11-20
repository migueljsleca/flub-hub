"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconComponent } from "./apps";

export type Rect = { x: number; y: number; w: number; h: number };

export type WindowState = Rect & {
  id: string;
  z: number;
  maximized: boolean;
};

const MIN_W = 320;
const MIN_H = 220;
/** Fraction of the desktop left free on each side of a maximized window. */
const MAXIMIZED_GAP = 0.02;
/** Space the window frame takes around its content: 1px borders, 36px title bar. */
export const CHROME = { w: 2, h: 38 };

/** The biggest window that fits in maxW x maxH whose content area has `aspect` (w / h). */
export function fitAspect(maxW: number, maxH: number, aspect: number) {
  const cw = Math.max(0, Math.min(maxW - CHROME.w, (maxH - CHROME.h) * aspect));
  return { w: Math.round(cw + CHROME.w), h: Math.round(cw / aspect + CHROME.h) };
}

type Props = {
  win: WindowState;
  title: string;
  icon: IconComponent;
  focused: boolean;
  /** Content is an iframe: block it while unfocused so a click focuses the window. */
  embed?: boolean;
  /** When set, the title bar gets an "Open in new tab" button. */
  url?: string;
  /** False hides the maximize button and the double-click-to-maximize. */
  maximizable?: boolean;
  /** Lock the content area to this ratio (w / h): resizing and maximizing keep it. */
  aspect?: number;
  /** Area windows may move in. */
  bounds: { w: number; h: number };
  onFocus: () => void;
  onClose: () => void;
  onToggleMaximize: () => void;
  /** Called once when a move/resize ends, with the final rect. */
  onRect: (rect: Rect) => void;
  children: ReactNode;
};

export function OsWindow({
  win,
  title,
  icon: Icon,
  focused,
  embed,
  url,
  maximizable = true,
  aspect,
  bounds,
  onFocus,
  onClose,
  onToggleMaximize,
  onRect,
  children,
}: Props) {
  const el = useRef<HTMLElement>(null);
  const drag = useRef<{ px: number; py: number; rect: Rect; last: Rect; mode: "move" | "resize" } | null>(null);

  const start = (e: ReactPointerEvent<HTMLElement>, mode: "move" | "resize") => {
    if (e.button !== 0 || win.maximized) return;
    if (mode === "move" && (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = { x: win.x, y: win.y, w: win.w, h: win.h };
    drag.current = { px: e.clientX, py: e.clientY, rect, last: rect, mode };
    // Iframes would swallow the pointer mid-drag; switch them off until drop.
    document.documentElement.dataset.dragging = "";
    // Safety net: whatever happens, a release anywhere clears the flag.
    window.addEventListener("pointerup", clearDragging, { once: true });
  };

  // While dragging, write straight to the element's style: no React render per
  // mouse move, so the window tracks the cursor 1:1. State is updated on drop.
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const node = el.current;
    if (!d || !node) return;
    // Button already released (pointerup lost, e.g. outside the window): stop.
    if ((e.buttons & 1) === 0) return end();
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    d.last =
      d.mode === "move"
        ? {
            ...d.rect,
            // keep at least part of the title bar reachable
            x: clamp(d.rect.x + dx, 80 - d.rect.w, bounds.w - 80),
            y: clamp(d.rect.y + dy, 0, bounds.h - 40),
          }
        : aspect
          ? {
              ...d.rect,
              ...fitAspect(clamp(d.rect.w + dx, MIN_W, bounds.w - d.rect.x), bounds.h - d.rect.y, aspect),
            }
          : {
              ...d.rect,
              w: clamp(d.rect.w + dx, MIN_W, bounds.w - d.rect.x),
              h: clamp(d.rect.h + dy, MIN_H, bounds.h - d.rect.y),
            };
    node.style.left = `${d.last.x}px`;
    node.style.top = `${d.last.y}px`;
    node.style.width = `${d.last.w}px`;
    node.style.height = `${d.last.h}px`;
  };

  const end = () => {
    const d = drag.current;
    drag.current = null;
    delete document.documentElement.dataset.dragging;
    if (d && d.last !== d.rect) onRect(d.last);
  };

  // "Maximized" leaves a 2% margin on every side rather than covering the whole desktop.
  const gapX = Math.round(bounds.w * MAXIMIZED_GAP);
  const gapY = Math.round(bounds.h * MAXIMIZED_GAP);
  const area = { w: bounds.w - gapX * 2, h: bounds.h - gapY * 2 };
  const fit = aspect ? fitAspect(area.w, area.h, aspect) : area;
  const rect = win.maximized
    ? { x: Math.round((bounds.w - fit.w) / 2), y: Math.round((bounds.h - fit.h) / 2), ...fit }
    : win;

  return (
    <section
      ref={el}
      role="dialog"
      aria-label={title}
      onPointerDownCapture={onFocus}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: win.z }}
      className={cn(
        // Flat: solid fill, hard 1px edge, square corners, no blur or shadow
        "absolute flex flex-col overflow-hidden border bg-card text-card-foreground",
        // Open animation only. Not `duration-150`: in Tailwind v4 that also sets a
        // transition on every property, so left/top would ease and the window
        // would trail the cursor while dragging.
        "animate-in fade-in-0 zoom-in-[0.98] [animation-duration:150ms] transition-none",
        focused ? "border-flux-soft" : "border-border",
      )}
    >
      <header
        onPointerDown={(e) => start(e, "move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onDoubleClick={(e) => maximizable && !(e.target as HTMLElement).closest("button") && onToggleMaximize()}
        className={cn(
          "flex h-9 shrink-0 cursor-default touch-none items-center gap-2 pr-0.5 pl-3 select-none",
          // Focused title bar is a highlighter box, like the poster headlines
          focused ? "bg-flux-soft text-flux-ink" : "border-b bg-card text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.25} />
        <h2 className="flex-1 truncate font-heading text-[13px] font-bold tracking-tight uppercase">{title}</h2>
        {url && (
          <WinButton label="Open in new tab" onClick={() => openInNewTab(url)} focused={focused}>
            <ExternalLink />
          </WinButton>
        )}
        {maximizable && (
          <WinButton label={win.maximized ? "Restore" : "Maximize"} onClick={onToggleMaximize} focused={focused}>
            {win.maximized ? <Minimize2 /> : <Maximize2 />}
          </WinButton>
        )}
        <WinButton label="Close" onClick={onClose} focused={focused} danger>
          <X />
        </WinButton>
      </header>

      <div className="relative min-h-0 flex-1">
        {children}
        {embed && !focused && <div aria-hidden className="absolute inset-0" />}
      </div>

      {!win.maximized && (
        <div
          aria-hidden
          onPointerDown={(e) => start(e, "resize")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          className="absolute right-0 bottom-0 size-4 cursor-nwse-resize touch-none"
        />
      )}
    </section>
  );
}

function WinButton({
  label,
  onClick,
  focused,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  focused: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center [&_svg]:size-3.5 [&_svg]:stroke-[2.25]",
        danger
          ? "hover:bg-flux-carrot hover:text-white"
          : focused
            ? "hover:bg-flux-ink hover:text-flux-soft"
            : "hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function clearDragging() {
  delete document.documentElement.dataset.dragging;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max));
}
