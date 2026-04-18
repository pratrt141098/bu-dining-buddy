import { occupancyColor } from "@/lib/dining";

export function OccupancyBar({ pct }: { pct: number }) {
  const tone = occupancyColor(pct);
  const colorClass =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-bad";

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{pct}% capacity</p>
    </div>
  );
}
