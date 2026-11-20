"use client";

import { useEffect, useState } from "react";

/** Space kept free at the bottom so maximized windows don't sit under the clock. */
export const CLOCK_RESERVE = 52;

/** Time + date, pinned bottom-right above everything. */
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[9999] flex items-center gap-2.5 border bg-card px-3 py-1.5 tabular-nums select-none">
      <span className="text-xs text-muted-foreground">
        {now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
      </span>
      <span className="text-sm font-bold tracking-tight">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
