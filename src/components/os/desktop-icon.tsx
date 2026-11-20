"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Point = { x: number; y: number };

export const ICON_W = 96;
export const ICON_H = 96;
const DRAG_THRESHOLD = 4; // px before a press turns into a drag

type Props = {
  label: string;
  icon: LucideIcon;
  pos: Point;
  selected: boolean;
  /** Area the icon may be dragged in. */
  bounds: { w: number; h: number };
  onSelect: () => void;
  onOpen: () => void;
  /** Called once when a drag ends, with the final position. */
  onDrop: (pos: Point) => void;
};

/** A desktop icon you can click to select, double-click to open, and drag anywhere. */
export function DesktopIcon({ label, icon: Icon, pos, selected, bounds, onSelect, onOpen, onDrop }: Props) {
  const el = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ px: number; py: number; start: Point; moved: boolean; last: Point } | null>(null);

  const start = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, start: pos, moved: false, last: pos };
    onSelect();
  };

  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if ((e.buttons & 1) === 0) return end();
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    d.last = {
      x: clamp(d.start.x + dx, 0, bounds.w - ICON_W),
      y: clamp(d.start.y + dy, 0, bounds.h - ICON_H),
    };
    // Move the element directly (no React render per mouse move); commit on drop.
    if (el.current) {
      el.current.style.left = `${d.last.x}px`;
      el.current.style.top = `${d.last.y}px`;
    }
  };

  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) onDrop(d.last);
  };

  return (
    <button
      ref={el}
      type="button"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{ left: pos.x, top: pos.y, width: ICON_W }}
      className="group absolute z-[1] flex touch-none flex-col items-center gap-1.5 p-2 outline-none"
    >
      <span
        className={cn(
          "flex size-14 items-center justify-center border transition-colors",
          selected ? "border-flux-soft bg-flux-soft text-flux-ink" : "bg-card text-flux-soft group-hover:bg-secondary",
        )}
      >
        <Icon className="size-7" strokeWidth={1.75} />
      </span>
      <span
        className={cn(
          "max-w-full truncate px-1.5 py-0.5 text-xs font-medium",
          selected ? "bg-flux-soft font-bold text-flux-ink" : "text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max));
}
