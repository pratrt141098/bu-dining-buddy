import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Star } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { StatusBadge } from "@/components/StatusBadge";
import { FoodLevelDot } from "@/components/FoodAvailability";
import { ALL_AREAS, CampusArea, HALLS, occupancyColor, rankHalls } from "@/lib/dining";
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
              className="ios-card min-h-[44px] p-space-3 text-left flex flex-col gap-space-2 active:scale-[0.98] transition-transform no-tap-highlight relative"
            >
              {recommended && (
                <span className="absolute -top-2 -right-2 inline-flex items-center gap-space-1 bg-primary text-primary-foreground font-body text-xs font-medium px-space-2 py-space-1 rounded-sm-token">
                  <Star className="w-3 h-3 fill-current" /> Recommended
                </span>
              )}
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-body text-sm font-medium leading-tight text-foreground line-clamp-2 flex items-start gap-space-1">
                  <FoodLevelDot level={hall.foodLevel} />
                  <span className="line-clamp-2">{hall.name}</span>
                </h3>
              </div>
              <StatusBadge status={hall.status} />
              <div className="mt-auto pt-space-2">
                <p className={`font-display text-2xl font-bold tracking-tight ${occColor}`}>{hall.occupancy}%</p>
                <p className="font-body text-xs text-muted-foreground mt-space-1 text-left">~{hall.waitMin} min predicted wait</p>
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
