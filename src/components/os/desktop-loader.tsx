"use client";

import dynamic from "next/dynamic";

/**
 * The desktop is fully client-side (window sizes, localStorage, clock), so it
 * skips prerendering. The plain background shows until it mounts.
 */
export const DesktopLoader = dynamic(() => import("./desktop").then((m) => m.Desktop), {
  ssr: false,
  loading: () => <div className="h-dvh w-full bg-background" />,
});
