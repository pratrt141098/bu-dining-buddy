import { useEffect, useState } from "react";
import { occupancyColor } from "@/lib/dining";

export function OccupancyBar({ pct }: { pct: number }) {
  const tone = occupancyColor(pct);
  const colorClass =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-bad";

  const target = Math.min(100, pct);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Start at 0, then animate to target on next frame
    setWidth(0);
    const id = requestAnimationFrame(() => {
      // Second rAF ensures the 0 width is committed before transitioning
      requestAnimationFrame(() => setWidth(target));
    });
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="w-full">
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% capacity`}
      >
        <div
          className={`h-full ${colorClass} rounded-full transition-[width] duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{pct}% capacity</p>
    </div>
  );
}
