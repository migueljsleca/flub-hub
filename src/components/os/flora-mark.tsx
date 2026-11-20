import { cn } from "@/lib/utils";

/** FLORA's four-petal mark, path data copied verbatim from flora.ai. Colour follows `currentColor`. */
export function FloraMark({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} role="img" aria-label="FLORA">
      <path d="M 0 0 L 5.759 0 C 8.94 0 11.519 2.579 11.519 5.759 C 11.519 8.94 8.94 11.519 5.759 11.519 C 2.579 11.519 0 8.94 0 5.759 Z" />
      <path transform="translate(12.481 12.481)" d="M 0 5.759 C 0 2.579 2.579 0 5.759 0 C 8.94 0 11.519 2.579 11.519 5.759 L 11.519 11.519 L 5.759 11.519 C 2.579 11.519 0 8.94 0 5.759 Z" />
      <path transform="translate(0 12.481)" d="M 0 5.759 C 0 2.579 2.579 0 5.759 0 C 8.94 0 11.519 2.579 11.519 5.759 C 11.519 8.94 8.94 11.519 5.759 11.519 L 0 11.519 Z" />
      <path transform="translate(12.481 0)" d="M 0 5.759 C 0 2.579 2.579 0 5.759 0 L 11.519 0 L 11.519 5.759 C 11.519 8.94 8.94 11.519 5.759 11.519 C 2.579 11.519 0 8.94 0 5.759 Z" />
    </svg>
  );
}
