import type { ReactNode } from "react";
import { DECK_COLORS, DeckFerro, FluxLockup, Hl, Img, Meta, Slide, sealSeams } from "../kit";

/**
 * A rotated Figma frame: `x y w h` is the rotated frame's bounding box (what
 * Figma reports), `fw fh` the frame's own size, `deg` its rotation.
 */
function Rotated({ x, y, w, h, fw, fh, deg, children }: { x: number; y: number; w: number; h: number; fw: number; fh: number; deg: number; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: x, top: y, width: w, height: h }}>
      <div className="relative flex-none" style={{ width: fw, height: fh, transform: `rotate(${deg}deg)` }}>
        {children}
      </div>
    </div>
  );
}

/** "STRANGE / ATTRACTS" boxes: fixed-size lime blocks, type centred, cap-trimmed. */
function Word({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  return (
    <div
      className="absolute flex items-center justify-center p-[5.534px]"
      style={{ left: x, top: y, width: w, height: 105.596, background: DECK_COLORS.lime, ...sealSeams(DECK_COLORS.lime) }}
    >
      <p className="text-[131.786px] leading-[0.8] font-bold whitespace-nowrap text-[#01161e] uppercase [text-box:trim-both_cap_alphabetic]">
        {children}
      </p>
    </div>
  );
}

/** 01 · Cover (Figma 335:2358). */
export function Slide01() {
  return (
    <Slide bg="blue">
      {/* slot · ferrofluid/13 (869.12, 165): the liquid, people/07 and the "Strange attracts" boxes */}
      <DeckFerro x={909.31} y={165} w={1099.624} h={1180} look="spikes" />
      <Img x={1102.62} y={453.24} w={632.25} h={784.756} src="/deck/01/people-07.webp" alt="" />
      <Word x={1006.12} y={245} w={631.401}>
        Strange
      </Word>
      <Word x={1094.74} y={347.4} w={692.45}>
        attracts
      </Word>

      <Rotated x={1370.12} y={511} w={687.665} h={797.219} fw={520} fh={680} deg={16.04}>
        <Img x={0} y={34.57} w={520} h={645.43} src="/deck/01/people-06.webp" alt="" />
      </Rotated>
      <Rotated x={789.12} y={511} w={694.669} h={818.803} fw={560} fh={720} deg={-11.73}>
        <Img x={0} y={24.92} w={560} h={695.079} src="/deck/01/people-05.webp" alt="" />
      </Rotated>

      <FluxLockup x={80} y={245} w={715.294} />
      <Hl x={80.12} y={755} size={40}>
        Two days of music for taste that doesn’t fit in.
      </Hl>
      <Hl x={210.12} y={798} size={40}>
        {"4 & 5 November  ·  New York City"}
      </Hl>

      <Meta section="Campaign pitch · See What You Hear" n={1} />
    </Slide>
  );
}
