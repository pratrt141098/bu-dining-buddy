import { occupancyColor } from "@/lib/dining";

export function OccupancyRing({ pct, size = 180 }: { pct: number; size?: number }) {
  const tone = occupancyColor(pct);
  const stroke =
    tone === "good" ? "hsl(var(--status-good))" : tone === "warn" ? "hsl(var(--status-warn))" : "hsl(var(--status-bad))";
  const r = (size - 22) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * c;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={14}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight text-foreground">{pct}%</span>
        <span className="text-xs font-medium text-muted-foreground mt-1">capacity</span>
      </div>
    </div>
  );
}
