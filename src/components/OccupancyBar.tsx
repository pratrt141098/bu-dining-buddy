import { occupancyColor } from "@/lib/dining";

export function OccupancyBar({ pct }: { pct: number }) {
  const tone = occupancyColor(pct);
  const colorClass =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-bad";

  const width = Math.min(100, pct);

  return (
    <div className="w-full">
      <div
        className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% capacity`}
      >
        <div
          className={`h-full ${colorClass} rounded-full`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{pct}% capacity</p>
    </div>
  );
}
