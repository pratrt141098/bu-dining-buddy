import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyRing } from "@/components/OccupancyRing";
import { StatusBadge } from "@/components/StatusBadge";
import { FoodAvailability } from "@/components/FoodAvailability";
import { WaitTrendSparkline } from "@/components/WaitTrendSparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { HALL_DISPLAY_NAMES, HALLS, rankHalls } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";
import { getDailyMealPredictions, getDayName, getMealPeriodForTime } from "@/data/dailySummary";
import { filterByDietary, getMenuForSession } from "@/data/menuData";

interface SessionMenuItem {
  item_id: string;
  item_name: string;
  station: string;
  dietary_tags: string[];
  calories: number | null;
  available: boolean;
  units_remaining: number | null;
  depletion_pct: number | null;
  depleted: boolean;
  depletion_time: string | null;
}

const TAG_STYLES: Record<string, string> = {
  halal: "bg-[#F59E0B]/20 text-[#F59E0B]",
  vegan: "bg-[#22C55E]/20 text-[#22C55E]",
  vegetarian: "bg-[#00A896]/20 text-[#00A896]",
  gluten_free: "bg-[#94A3B8]/20 text-[#94A3B8]",
};

function formatTag(tag: string) {
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dietary, logAdoption } = usePreferences();
  const [menuItems, setMenuItems] = useState<SessionMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const baseHall = HALLS.find(h => h.id === Number(id));

  // Merge day-specific synthetic model prediction into the hall view.
  const hall = useMemo(() => {
    if (!baseHall) return null;
    const now = new Date();
    const day = getDayName(now);
    const meal = getMealPeriodForTime(now);
    const mealForDisplay = meal === "closed" ? "dinner" : meal;
    const source = getDailyMealPredictions(day, mealForDisplay);
    const pred = source.find(p => p.id === baseHall.id);
    if (!pred) return baseHall;
    return {
      ...baseHall,
      occupancy: Math.round(pred.occupancyPct),
      waitMin: Math.round(pred.predictedWaitMin),
      status: pred.status,
    };
  }, [baseHall]);

  const nextHallId = useMemo(() => {
    if (!hall) return undefined;
    const ranked = rankHalls(HALLS, dietary);
    const next = ranked.find(h => h.id !== hall.id);
    return next?.id;
  }, [hall, dietary]);

  const sessionMeal = useMemo(() => {
    const meal = getMealPeriodForTime(new Date());
    return meal === "closed" ? "dinner" : meal;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      if (!hall) {
        setMenuLoading(false);
        return;
      }

      setMenuLoading(true);
      const sessionItems = await getMenuForSession(hall.name, sessionMeal, new Date());
      const dietaryItems = await filterByDietary(sessionItems, dietary);

      if (!cancelled) {
        setMenuItems(dietaryItems as SessionMenuItem[]);
        setMenuLoading(false);
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [hall, sessionMeal, dietary]);

  const stationGroups = useMemo(() => {
    const grouped = menuItems.reduce<Record<string, SessionMenuItem[]>>((acc, item) => {
      const station = item.station || "General";
      if (!acc[station]) acc[station] = [];
      acc[station].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [menuItems]);

  const preferenceLabel = dietary.join(", ");
  const noDietaryMatches = dietary.length > 0 && !menuLoading && menuItems.length === 0;

  if (!hall) {
    return (
      <MobileShell>
        <div className="px-space-4 py-space-10 text-left">
          <p className="font-body text-sm text-muted-foreground">Hall not found.</p>
          <button onClick={() => navigate("/halls")} className="mt-space-4 min-h-[44px] text-primary font-body text-sm font-medium">← Back to all halls</button>
        </div>
      </MobileShell>
    );
  }

  const handleHeading = () => {
    logAdoption();
    toast("Visit logged ✓", { duration: 3000, position: "bottom-center" });
    navigate("/confirmed");
  };

  return (
    <MobileShell hideTabBar>
      <header className="px-space-4 pt-[max(1rem,env(safe-area-inset-top))] pb-space-2 flex items-center gap-space-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-11 h-11 -ml-1 rounded-sm-token flex items-center justify-center hover:bg-muted no-tap-highlight"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-2xl font-bold tracking-tight truncate text-foreground">{HALL_DISPLAY_NAMES[hall.id] ?? hall.name}</h1>
      </header>

      {/* Ring */}
      <section className="px-space-4 pt-space-4 flex flex-col items-start">
        <OccupancyRing pct={hall.occupancy} />
        <div className="mt-space-4 flex items-center gap-space-2">
          <StatusBadge status={hall.status} />
          <span className="font-body text-sm font-medium text-muted-foreground">·</span>
          <span className="inline-flex items-center gap-space-1 font-body text-sm font-medium text-primary">
            <Clock className="w-3.5 h-3.5" /> ~{hall.waitMin} min predicted wait
          </span>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-space-2 text-left">15-min refresh • underlying swipe data has 15-min delay</p>
        <div className="w-full mt-space-2">
          <FoodAvailability level={hall.foodLevel} />
        </div>
      </section>

      {/* Trend sparkline */}
      <section className="px-space-4 mt-space-5">
        <WaitTrendSparkline hallName={hall.name} />
      </section>

      {/* What's available */}
      <section className="px-space-4 mt-space-6">
        <h2 className="font-display text-2xl font-bold mb-space-3 text-foreground">What's available</h2>

        {menuLoading && (
          <div className="space-y-space-3">
            {[0, 1, 2].map((idx) => (
              <div key={`menu-skeleton-${idx}`} className="ios-card px-space-4 py-space-3">
                <Skeleton className="h-4 w-24 rounded-sm-token" />
                <div className="mt-space-3 space-y-space-2">
                  {[0, 1].map((inner) => (
                    <div key={`menu-skeleton-row-${idx}-${inner}`} className="space-y-space-1">
                      <div className="flex items-center justify-between gap-space-3">
                        <Skeleton className="h-4 w-40 rounded-sm-token" />
                        <Skeleton className="h-3 w-12 rounded-sm-token" />
                      </div>
                      <Skeleton className="h-5 w-36 rounded-sm-token" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!menuLoading && stationGroups.length > 0 && (
          <div className="space-y-space-3">
            {stationGroups.map(([station, items]) => (
              <div key={station} className="ios-card px-space-4 py-space-3">
                <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-space-2 text-left">
                  {station}
                </h3>
                <div className="space-y-space-2">
                  {items.map((item) => {
                    const showTags = item.dietary_tags.filter((tag) => tag !== "none");
                    return (
                      <div key={item.item_id} className={item.depleted ? "opacity-60" : "opacity-100"}>
                        <div className="flex items-start justify-between gap-space-3">
                          <p
                            className={`font-body text-sm text-left ${
                              item.depleted
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {item.item_name}
                          </p>
                          <p className="font-body text-xs text-muted-foreground shrink-0">
                            {item.calories ? `${item.calories} cal` : ""}
                          </p>
                        </div>

                        {item.depleted && item.depletion_time && (
                          <p className="font-body text-xs text-[#EF4444] text-left mt-space-1">
                            Ran out ~{item.depletion_time}
                          </p>
                        )}

                        {showTags.length > 0 && (
                          <div className="mt-space-1 flex flex-wrap gap-space-1">
                            {showTags.map((tag) => (
                              <span
                                key={`${item.item_id}-${tag}`}
                                className={`inline-flex items-center rounded-sm-token px-space-2 py-[2px] font-body text-xs ${
                                  TAG_STYLES[tag] || "bg-primary/20 text-primary"
                                }`}
                              >
                                {formatTag(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {noDietaryMatches && (
          <p className="font-body text-sm text-muted-foreground text-left">
            No {preferenceLabel} options available right now — try adjusting your filters in Settings.
          </p>
        )}
      </section>

      <div className="h-32" />

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[390px] z-40 px-space-4 pt-space-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background border-t border-white/10">
        <button
          onClick={handleHeading}
          className="cta-shadow min-h-[44px] w-full bg-primary text-primary-foreground rounded-lg-token py-space-3 font-body font-medium text-sm no-tap-highlight"
        >
          I'm heading here
        </button>
        <button
          onClick={() => nextHallId && navigate(`/halls/${nextHallId}`)}
          className="mt-space-2 min-h-[44px] w-full text-primary font-body font-medium text-sm py-space-2 no-tap-highlight text-left"
        >
          See another hall
        </button>
      </div>
    </MobileShell>
  );
}
