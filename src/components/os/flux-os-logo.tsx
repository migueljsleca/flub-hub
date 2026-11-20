import { cn } from "@/lib/utils";

/*
 * "FLUX / OPERATING SYSTEM" lockup, from Figma (Project 2 - bootcamp explore,
 * node 272:3294). Geometry is in the Figma frame's own units (607.336 wide).
 * The boxes use the theme's light colour (Figma var "type-boxes"), so the
 * lockup follows the Blue / Rose / Carrot theme; ink is FLUX Ink Black.
 */
const W = 607.336;
const H = 223.78;
const FLUX_BOX_H = 186.522;
const LABEL = { x: 261, y: 183, w: 284.78, h: 40.78, pad: 10.89, capHeight: 19, fontSize: 26.868, textWidth: 263 };
const INK = "#01161E";

const FLUX_PATHS = [
  "M4.21994 182.113V4.21995H136.582V41.2914H48.2578V77.3676H122.152V112.946H48.2578V182.113H4.21994Z",
  "M148.913 182.113V4.21995H192.951V144.793H272.817V182.113H148.913Z",
  "M354.369 185.347C329.821 185.347 311.243 179.625 298.637 168.18C286.032 156.735 279.729 140.48 279.729 119.415V4.21995H323.766V120.908C323.766 140.314 333.967 150.018 354.369 150.018C364.155 150.018 371.619 147.364 376.761 142.056C381.903 136.582 384.474 129.284 384.474 120.161V4.21995H428.512V119.415C428.512 140.314 422.209 156.569 409.603 168.18C397.163 179.625 378.752 185.347 354.369 185.347Z",
  "M432.687 182.113L491.653 88.8124L437.663 4.21995H487.921L518.026 55.9706H518.523L549.126 4.21995H596.896L544.15 88.3148L603.116 182.113H551.116L517.777 121.903H517.279L482.696 182.113H432.687Z"
];

export function FluxOsLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto", className)}
      role="img"
      aria-label="FLUX Operating System"
    >
      <rect width={W} height={FLUX_BOX_H} fill="var(--flux-soft)" />
      {FLUX_PATHS.map((d, i) => (
        <path key={i} d={d} fill={INK} />
      ))}
      <rect x={LABEL.x} y={LABEL.y} width={LABEL.w} height={LABEL.h} fill="var(--flux-soft)" />
      <text
        x={LABEL.x + LABEL.pad}
        y={LABEL.y + LABEL.pad + LABEL.capHeight}
        fill={INK}
        fontFamily='"Neue Haas Grotesk Display Pro", var(--font-geist-sans), sans-serif'
        fontWeight={700}
        fontSize={LABEL.fontSize}
        // pin the measured width so a fallback font still fills the box exactly
        textLength={LABEL.textWidth}
        lengthAdjust="spacingAndGlyphs"
      >
        OPERATING SYSTEM
      </text>
    </svg>
  );
}
