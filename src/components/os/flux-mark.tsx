import { FLUX_BOX, FLUX_PATHS } from "@/lib/flux-wordmark";
import { cn } from "@/lib/utils";

/** The FLUX wordmark as inline SVG; colour follows `currentColor`. */
export function FluxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${FLUX_BOX.width} ${FLUX_BOX.height}`}
      className={cn("fill-current", className)}
      role="img"
      aria-label="FLUX"
    >
      {FLUX_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
