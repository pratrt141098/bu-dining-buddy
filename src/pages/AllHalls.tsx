import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ALL_AREAS, CampusArea, HALL_DISPLAY_NAMES, HALLS, occupancyColor, rankHalls } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";
import { getDailyMealPredictions, getDayName, getMealPeriodForTime } from "@/data/dailySummary";

const FILTERS: ("All" | CampusArea)[] = ["All", ...ALL_AREAS];
const FILTER_LABEL: Record<string, string> = {
  All: "All",
  East: "East Campus",
  West: "West Campus",
  Central: "Central",
};

export default function AllHalls() {
  const navigate = useNavigate();
  const { dietary } = usePreferences();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const now = new Date();
  const dayName = getDayName(now);
  const activeMeal = getMealPeriodForTime(now);
  const mealForDisplay = activeMeal === "closed" ? "dinner" : activeMeal;

  const predictionById = useMemo(() => {
    const rows = getDailyMealPredictions(dayName, mealForDisplay);
    return rows.reduce<Record<number, (typeof rows)[number]>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [dayName, mealForDisplay]);

  const hallsForDay = useMemo(
    () =>
      HALLS.map((hall) => {
        const pred = predictionById[hall.id];
        if (!pred) return hall;
        return {
          ...hall,
          occupancy: Math.round(pred.occupancyPct),
          waitMin: Math.round(pred.predictedWaitMin),
          status: pred.status,
        };
      }),
    [predictionById],
  );

  const topRecId = useMemo(() => rankHalls(hallsForDay, dietary)[0]?.id, [dietary, hallsForDay]);

  const visible = useMemo(
    () => hallsForDay.filter(h => filter === "All" || h.area === filter),
    [filter, hallsForDay]
  );

  const dietaryMatches = useMemo(() => {
    if (dietary.length === 0) return visible;
    return visible.filter((h) => dietary.some((tag) => h.tags.includes(tag)));
  }, [dietary, visible]);

  const noMatches = dietary.length > 0 && dietaryMatches.length === 0;

  return (
    <MobileShell>
      <header className="px-space-4 pt-[max(1rem,env(safe-area-inset-top))] pb-space-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">All Halls</h1>
        <p className="font-body text-sm text-muted-foreground mt-space-2 text-left">
          Predicted {mealForDisplay} wait times for {dayName}
        </p>
      </header>

      {/* Filter chips */}
      <div className="px-space-4 pt-space-3 pb-space-4 flex gap-space-2 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 min-h-[44px] px-space-3 py-space-2 rounded-sm-token font-body text-sm font-medium transition-colors no-tap-highlight ${
                active ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-white/10"
              }`}
            >
              {FILTER_LABEL[f]}
            </button>
          );
        })}
      </div>

      {/* Tile grid */}
      <section className="px-space-4 grid grid-cols-2 gap-space-3">
        {dietaryMatches.map(hall => {
          const tone = occupancyColor(hall.occupancy);
          const occColor =
            tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-warn" : "text-status-bad";
          const recommended = hall.id === topRecId;
          return (
            <button
              key={hall.id}
              onClick={() => navigate(`/halls/${hall.id}`)}
              className={`ios-card min-h-[44px] p-space-3 flex flex-col items-center gap-space-2 active:scale-[0.98] transition-transform no-tap-highlight text-center ${
                recommended ? "ring-2 ring-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.25)]" : ""
              }`}
            >
              <h3 className="font-body text-sm font-medium leading-tight text-foreground line-clamp-2">
                {HALL_DISPLAY_NAMES[hall.id] ?? hall.name}
              </h3>
              <StatusBadge status={hall.status} />
              <div className="mt-auto pt-space-2">
                <p className={`font-display text-2xl font-bold tracking-tight ${occColor}`}>{hall.occupancy}%</p>
                <p className="font-body text-xs text-muted-foreground mt-space-1">~{hall.waitMin} min predicted wait</p>
              </div>
            </button>
          );
        })}

        {noMatches && (
          <div className="col-span-2 ios-card p-space-4">
            <p className="font-body text-sm text-muted-foreground text-left inline-flex items-center gap-space-2">
              <Settings className="w-4 h-4 text-primary" />
              No halls match your current filters — try updating your preferences in Settings
            </p>
          </div>
        )}
      </section>
    </MobileShell>
  );
}
