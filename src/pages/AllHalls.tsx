import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { StatusBadge } from "@/components/StatusBadge";
import { FoodLevelDot } from "@/components/FoodAvailability";
import { ALL_AREAS, CampusArea, HALLS, occupancyColor, rankHalls } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";

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

  const topRecId = useMemo(() => rankHalls(HALLS, dietary)[0]?.id, [dietary]);

  const visible = useMemo(
    () => HALLS.filter(h => filter === "All" || h.area === filter),
    [filter]
  );

  return (
    <MobileShell>
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-2xl font-bold tracking-tight">All Halls</h1>
        <p className="text-sm text-muted-foreground mt-1">Predicted wait times • 15-min refresh</p>
      </header>

      {/* Filter chips */}
      <div className="px-5 pt-3 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors no-tap-highlight ${
                active ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
              }`}
            >
              {FILTER_LABEL[f]}
            </button>
          );
        })}
      </div>

      {/* Tile grid */}
      <section className="px-5 grid grid-cols-2 gap-3">
        {visible.map(hall => {
          const tone = occupancyColor(hall.occupancy);
          const occColor =
            tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-warn" : "text-status-bad";
          const recommended = hall.id === topRecId;
          return (
            <button
              key={hall.id}
              onClick={() => navigate(`/halls/${hall.id}`)}
              className="ios-card p-3.5 text-left flex flex-col gap-2 active:scale-[0.98] transition-transform no-tap-highlight relative"
            >
              {recommended && (
                <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                  <Star className="w-3 h-3 fill-current" /> Recommended
                </span>
              )}
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 flex items-start gap-1.5">
                  <FoodLevelDot level={hall.foodLevel} />
                  <span className="line-clamp-2">{hall.name}</span>
                </h3>
              </div>
              <StatusBadge status={hall.status} />
              <div className="mt-auto pt-2">
                <p className={`text-3xl font-bold tracking-tight ${occColor}`}>{hall.occupancy}%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">~{hall.waitMin} min predicted wait</p>
              </div>
            </button>
          );
        })}
      </section>
    </MobileShell>
  );
}
