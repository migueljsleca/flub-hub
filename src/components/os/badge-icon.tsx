import { cn } from "@/lib/utils";

/**
 * Portrait event badge for Flux Pass, matching the vertical lanyard badge in
 * the flux-pass mockup: lanyard slot, person, name line. Drawn like a Lucide
 * outline icon (24px grid, round caps) so it sits with the other line icons.
 */
export function BadgeIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* card */}
      <rect x="5.5" y="2" width="13" height="20" rx="2" />
      {/* lanyard slot */}
      <path d="M10 5h4" />
      {/* person */}
      <circle cx="12" cy="10.5" r="2.25" />
      <path d="M8.5 16.5c.6-1.9 1.9-2.9 3.5-2.9s2.9 1 3.5 2.9" />
      {/* name */}
      <path d="M9.5 19h5" />
    </svg>
  );
}
