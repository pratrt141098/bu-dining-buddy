import { FoodLevel, foodLevelTone } from "@/lib/dining";

export function FoodAvailability({ level }: { level: FoodLevel }) {
  const tone = foodLevelTone(level);
  const colorClass =
    tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-warn" : "text-status-bad";

  return (
    <div className="mt-space-3">
      <div className="flex items-center gap-space-1 font-body text-xs text-left">
        <span aria-hidden>🍽️</span>
        <span className="text-muted-foreground">Food availability:</span>
        <span className={`font-medium ${colorClass}`}>{level}</span>
      </div>
      <p className="font-body text-xs text-muted-foreground mt-space-1 text-left">
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
