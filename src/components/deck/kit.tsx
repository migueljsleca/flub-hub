"use client";

import type { CSSProperties, ReactNode } from "react";
import { FerroCanvas, type FerroLook } from "@/components/os/ferro-stage";
import { cn } from "@/lib/utils";
import { DECK_LOOKS, type DeckLookId } from "./looks";

/*
 * Building blocks for the pitch deck. Every slide is a 1920x1080 page and
 * positions things in Figma's own pixels (x/y/w/h straight from the frame),
 * so a slide reads like its Figma layer list. The deck scales the page to fit.
 */

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
export const SLIDE_COUNT = 14;

/** Slide backgrounds and highlighter colours from the FLUX palette. */
export const DECK_COLORS = {
  ink: "#01161e",
  blue: "#3772ff",
  rose: "#f037a4",
  carrot: "#ff4401",
  lime: "#d7fb41",
  aqua: "#c5fffd",
  periwinkle: "#adbdff",
  white: "#ffffff",
} as const;
export type DeckColor = keyof typeof DECK_COLORS;

type Box = { x: number; y: number; w?: number; h?: number };

/**
 * Bleed a block's fill 0.6px on every side. Where two flat blocks meet (stacked
 * highlight boxes, the lockup's tag under the FLUX box), scaling the slide to a
 * fractional size can leave a hairline of background between them; this seals it.
 */
export const sealSeams = (color: string) => ({ boxShadow: `0 0 0 0.6px ${color}` });
const boxStyle = ({ x, y, w, h }: Box): CSSProperties => ({ left: x, top: y, width: w, height: h });

/** The 1920x1080 page. */
export function Slide({ bg, children, className }: { bg: DeckColor; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden font-heading text-white", className)}
      style={{ width: SLIDE_W, height: SLIDE_H, background: DECK_COLORS[bg] }}
    >
      {children}
    </div>
  );
}

/** The running header on every slide: "FLUX · Spotify 2026", the section, and "NN / 15". */
export function Meta({ section, n, className }: { section: string; n: number; className?: string }) {
  const label = "absolute top-[44px] text-[17px] leading-none font-medium tracking-[1.02px] whitespace-pre uppercase";
  return (
    <div className={cn("text-white/75", className)}>
      <p className={label} style={{ left: 80 }}>{"FLUX  ·  Spotify 2026"}</p>
      <p className={label} style={{ left: 760 }}>{section.replaceAll(" · ", "  ·  ")}</p>
      <p className={cn(label, "w-[200px] text-right")} style={{ left: 1640 }}>
        {String(n).padStart(2, "0")} / {SLIDE_COUNT}
      </p>
    </div>
  );
}

/**
 * Highlighter box: bold ink type on a flat colour block, padded 10/7 with the
 * text trimmed to its cap height (like Figma's "hl ·" frames). `size` is the
 * font size in px; Figma's box height = size * ~0.714 + 14.
 */
export function Hl({
  x,
  y,
  size,
  color = "lime",
  children,
  className,
}: Box & { size: number; color?: DeckColor; children: ReactNode; className?: string }) {
  return (
    <div className={cn("absolute px-[10px] py-[7px]", className)} style={{
        ...boxStyle({ x, y }),
        background: DECK_COLORS[color],
        ...sealSeams(DECK_COLORS[color]),
      }}>
      <p
        // z-[1]: the type sits above every box fill on the slide, so in stacked
        // headlines the next line's box never covers this line's descenders.
        className="relative z-[1] leading-[0.8] font-bold whitespace-pre text-[#01161e] [text-box:trim-both_cap_alphabetic]"
        style={{ fontSize: size }}
      >
        {children}
      </p>
    </div>
  );
}

/** Absolutely placed text block (body copy, labels). Style it with className. */
export function Text({ x, y, w, h, children, className }: Box & { children: ReactNode; className?: string }) {
  return (
    <div className={cn("absolute", className)} style={boxStyle({ x, y, w, h })}>
      {children}
    </div>
  );
}

/** Image cropped to its box (object-cover by default), square corners. */
export function Img({
  x,
  y,
  w,
  h,
  src,
  alt = "",
  fit = "cover",
  position,
  className,
}: Box & { src: string; alt?: string; fit?: "cover" | "contain"; position?: string; className?: string }) {
  return (
    // Plain <img>: the deck's images are pre-sized WebPs in /public/deck.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={cn("pointer-events-none absolute max-w-none select-none", className)}
      style={{ ...boxStyle({ x, y, w, h }), objectFit: fit, objectPosition: position }}
    />
  );
}

/** Muted looping video, cropped to its box. */
export function Video({ x, y, w, h, src, poster, className }: Box & { src: string; poster?: string; className?: string }) {
  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={cn("pointer-events-none absolute object-cover", className)}
      style={boxStyle({ x, y, w, h })}
    />
  );
}

/** Inline FLUX wordmark paths, from the Figma lockup (box 900 x 295.131). */
const LOGO_W = 900;
const LOGO_H = 295.131;
const LOGO_PATHS = [
  "M16.4423 274.006V16.4423H208.084V70.1164H80.2028V122.35H187.191V173.862H80.2028V274.006H16.4423Z",
  "M225.938 274.006V16.4423H289.698V219.971H405.332V274.006H225.938Z",
  "M523.408 278.689C487.865 278.689 460.968 270.403 442.717 253.833C424.465 237.262 415.339 213.728 415.339 183.228V16.4423H479.1V185.39C479.1 213.487 493.869 227.536 523.408 227.536C537.577 227.536 548.384 223.694 555.828 216.009C563.273 208.084 566.995 197.517 566.995 184.309V16.4423H630.756V183.228C630.756 213.487 621.63 237.022 603.379 253.833C585.367 270.403 558.71 278.689 523.408 278.689Z",
  "M636.801 274.006L722.175 138.92L644.006 16.4423H716.772L760.359 91.3699H761.08L805.388 16.4423H874.552L798.183 138.2L883.558 274.006H808.27L759.999 186.83H759.279L709.207 274.006H636.801Z",
];

/** The FLUX box on its own, `w` wide, in any highlighter colour. */
export function FluxBox({ x, y, w, color = "lime", className }: { x: number; y: number; w: number; color?: DeckColor; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}
      className={cn("absolute", className)}
      style={{ left: x, top: y, width: w, height: (w * LOGO_H) / LOGO_W }}
      role="img"
      aria-label="FLUX"
    >
      <rect width={LOGO_W} height={LOGO_H} fill={DECK_COLORS[color]} />
      {LOGO_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill={DECK_COLORS.ink} />
      ))}
    </svg>
  );
}

/**
 * The stacked FLUX lockup: FLUX box with the "presented by Spotify" tag
 * tucked under its right edge. Proportions from the Figma component at 900
 * wide (tag 654.93 x 126.374); scales with `w`.
 */
export function FluxLockup({ x, y, w, color = "lime" }: { x: number; y: number; w: number; color?: DeckColor }) {
  const k = w / LOGO_W;
  return (
    <div className="absolute flex flex-col items-end" style={{ left: x, top: y, width: w }}>
      <FluxBox x={0} y={0} w={w} color={color} className="relative" />
      <div
        className="flex items-center"
        style={{ ...sealSeams(DECK_COLORS[color]), background: DECK_COLORS[color], width: 654.93 * k, height: 126.374 * k, padding: 12.604 * k, gap: 30.25 * k }}
      >
        <p
          className="font-bold whitespace-nowrap text-[#01161e] uppercase [text-box:trim-both_cap_alphabetic]"
          style={{ fontSize: 31.098 * k }}
        >
          presented by
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/deck/spotify.svg" alt="Spotify" style={{ width: 369.274 * k, height: 101.165 * k }} />
      </div>
    </div>
  );
}

/**
 * A live 3D ferrofluid in place of a Figma "slot · ferrofluid/NN" frame. Pass
 * the slot's box; the canvas is drawn larger than the slot (by `bleed` on each
 * side) so spikes never clip, and the shape is framed to fill the slot.
 */
export function DeckFerro({
  x,
  y,
  w,
  h,
  look,
  bleed = 0.25,
}: Required<Pick<Box, "x" | "y" | "w" | "h">> & { look: DeckLookId | FerroLook; bleed?: number }) {
  const side = Math.max(w, h) * (1 + bleed * 2);
  const def = typeof look === "string" ? DECK_LOOKS[look] : { look, view: { yaw: 0, pitch: 0.1 } };
  return (
    <FerroCanvas
      look={def.look}
      view={def.view}
      className="absolute"
      style={{ left: x + w / 2 - side / 2, top: y + h / 2 - side / 2, width: side, height: side }}
    />
  );
}
