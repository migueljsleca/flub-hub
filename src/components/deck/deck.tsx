"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";
import { SLIDE_H, SLIDE_W } from "./kit";
import { SLIDES } from "./slides";

/**
 * The pitch deck player: one 1920x1080 slide at a time, scaled to fit.
 * ←/→ (or space, PageUp/PageDown) move, Home/End jump, F toggles full screen.
 * Only the current slide is mounted, so only its live ferrofluids draw.
 */
export function Deck() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const count = SLIDES.length;
  const Current = SLIDES[index];

  const go = (to: number) => setIndex(Math.max(0, Math.min(count - 1, to)));

  // Fit the 1920x1080 page into whatever space the window gives us.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / SLIDE_W, el.clientHeight / SLIDE_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Take keyboard focus on open so arrows work straight away.
  useEffect(() => rootRef.current?.focus({ preventScroll: true }), []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const next = ["ArrowRight", "ArrowDown", "PageDown", " "];
    const prev = ["ArrowLeft", "ArrowUp", "PageUp"];
    if (next.includes(e.key)) go(index + 1);
    else if (prev.includes(e.key)) go(index - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(count - 1);
    else if (e.key === "f" || e.key === "F") toggleFullscreen();
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="group/deck relative grid h-full w-full place-items-center overflow-hidden bg-black outline-none"
    >
      {scale > 0 && (
        <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }} className="relative overflow-hidden">
          <div
            key={index}
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `scale(${scale})` }}
          >
            <Current />
          </div>
        </div>
      )}

      {/* Controls: shown while the pointer is over the deck. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity group-hover/deck:opacity-100">
        <div className="pointer-events-auto flex items-center gap-1 border border-white/15 bg-black/70 p-1 text-white backdrop-blur">
          <DeckButton label="Previous slide" onClick={() => go(index - 1)} disabled={index === 0}>
            <ChevronLeft />
          </DeckButton>
          <span className="min-w-16 text-center text-xs font-medium tabular-nums">
            {index + 1} / {count}
          </span>
          <DeckButton label="Next slide" onClick={() => go(index + 1)} disabled={index === count - 1}>
            <ChevronRight />
          </DeckButton>
          <DeckButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize /> : <Maximize />}
          </DeckButton>
        </div>
      </div>
    </div>
  );
}

function DeckButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center hover:bg-white/15 disabled:opacity-30 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

