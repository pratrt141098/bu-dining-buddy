import { FoodLevel, foodLevelTone } from "@/lib/dining";

export function FoodAvailability({ level }: { level: FoodLevel }) {
  const tone = foodLevelTone(level);
  const colorClass =
    tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-warn" : "text-status-bad";

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 text-xs">
        <span aria-hidden>🍽️</span>
        <span className="text-muted-foreground">Food availability:</span>
        <span className={`font-semibold ${colorClass}`}>{level}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        Estimated — based on typical replenishment patterns. Not real-time.
      </p>
    </div>
  );
}

export function FoodLevelDot({ level }: { level: FoodLevel }) {
  const tone = foodLevelTone(level);
  const bg =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-bad";
  return <span className={`inline-block w-2 h-2 rounded-full ${bg}`} aria-label={`Food level: ${level}`} />;
}
