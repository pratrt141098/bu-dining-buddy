import type { HallPrediction } from "@/data/modelOutput";
import { hallPredictions, lunchPredictions, NAME_TO_HALL_ID } from "@/data/modelOutput";
import summaryCsv from "../../model/bu_dining_summary_stats.csv?raw";

type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type MealPeriod = "breakfast" | "lunch" | "dinner";

interface SummaryRow {
  swipeDate: string;
  dayOfWeek: DayName;
  hall: string;
  mealPeriod: MealPeriod;
  avgWaitSec: number;
  avgOccupancy: number;
}

function statusFromOccupancy(pct: number): HallPrediction["status"] {
  if (pct >= 90) return "High";
  if (pct >= 75) return "Busy";
  return "Normal";
}

function parseSummaryCsv(csvRaw: string): SummaryRow[] {
  const lines = csvRaw.trim().split("\n");
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const parts = line.split(",");
    return {
      swipeDate: parts[0],
      dayOfWeek: parts[1] as DayName,
      hall: parts[2],
      mealPeriod: parts[3] as MealPeriod,
      avgWaitSec: Number(parts[6]),
      avgOccupancy: Number(parts[8]),
    };
  });
}

const summaryRows = parseSummaryCsv(summaryCsv);

const basePredictionByName = [...lunchPredictions, ...hallPredictions].reduce<
  Record<string, HallPrediction>
>((acc, item) => {
  if (!acc[item.name]) {
    acc[item.name] = item;
  }
  return acc;
}, {});

export function getDayName(date: Date): DayName {
  return date.toLocaleDateString("en-US", { weekday: "long" }) as DayName;
}

export function getMealPeriodForTime(date: Date): MealPeriod | "closed" {
  const hour = date.getHours();
  if (hour >= 6 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 21) return "dinner";
  return "closed";
}

export function getDailyMealPredictions(day: DayName, meal: MealPeriod): HallPrediction[] {
  const rows = summaryRows
    .filter((r) => r.dayOfWeek === day && r.mealPeriod === meal)
    .map((r) => {
      const base = basePredictionByName[r.hall];
      if (!base) return null;

      const occupancyPct = Math.round(r.avgOccupancy * 100);
      const waitSec = Math.round(r.avgWaitSec);
      const waitMin = Math.round((waitSec / 60) * 10) / 10;
      const canonicalId = NAME_TO_HALL_ID[r.hall] ?? base.id;

      return {
        ...base,
        id: canonicalId,
        name: r.hall,
        predictedWaitSec: waitSec,
        predictedWaitMin: waitMin,
        occupancyPct,
        status: statusFromOccupancy(occupancyPct),
        mealPeriod: meal,
        modelGenerated: true,
      } as HallPrediction;
    })
    .filter((item): item is HallPrediction => item !== null)
    .sort((a, b) => a.predictedWaitSec - b.predictedWaitSec)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return rows;
}
