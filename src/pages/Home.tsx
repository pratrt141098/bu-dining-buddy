import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Clock, Ticket, AlertTriangle, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyBar } from "@/components/OccupancyBar";
import { FoodAvailability } from "@/components/FoodAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { HALLS } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";
import {
  hallPredictions,
  lunchPredictions,
  NAME_TO_HALL_ID,
  type HallPrediction,
} from "@/data/modelOutput";
import { getDailyMealPredictions, getDayName } from "@/data/dailySummary";
import { filterByDietary, getInventoryStatus } from "@/data/menuData";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isLunchNow() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 11 * 60 && minutes <= 16 * 60 + 30;
}

function currentMealForUI(date: Date): MealKey {
  const hour = date.getHours();
  return hour >= 11 && hour < 16 ? "lunch" : "dinner";
}

type MealKey = "lunch" | "dinner";

type MenuItemSummary = {
  item_id: string;
  item_name: string;
  station: string;
  depletion_pct: number | null;
  depleted: boolean;
};

type HallMenuData = {
  total: number;
  matches: number;
  items: MenuItemSummary[];
};

const MAX_MENU_VISIBLE = 6;

export default function Home() {
  const navigate = useNavigate();
  const { name, mealPlanData, dietary } = usePreferences();
  const lowSwipes = mealPlanData.swipesRemainingThisWeek <= 3;

  const [meal, setMeal] = useState<MealKey>(() => (isLunchNow() ? "lunch" : "dinner"));
  const [now, setNow] = useState(() => new Date());
  const [ctaAnimatingId, setCtaAnimatingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [menuCountsByHall, setMenuCountsByHall] = useState<Record<string, HallMenuData>>({});

  const dayName = getDayName(now);

  const dayMealPredictions: HallPrediction[] = useMemo(
    () => getDailyMealPredictions(dayName, meal),
    [dayName, meal],
  );

  const useLiveForSelectedMeal = dayMealPredictions.length > 0;

  const predictions = useLiveForSelectedMeal
    ? dayMealPredictions
    : meal === "lunch"
      ? lunchPredictions
      : hallPredictions;

  // Always sort by predicted wait ascending so rank reflects current data.
  const ranked: HallPrediction[] = useMemo(
    () => [...predictions].sort((a, b) => a.predictedWaitSec - b.predictedWaitSec),
    [predictions],
  );

  // Resolve canonical hall id (for routing + foodLevel/tags lookup).
  const detailIdFor = (p: HallPrediction) => NAME_TO_HALL_ID[p.name] ?? p.id;
  const foodLevelFor = (p: HallPrediction) =>
    HALLS.find((h) => h.id === detailIdFor(p))?.foodLevel ?? "Good";
  const hallNameFor = (p: HallPrediction) =>
    HALLS.find((h) => h.id === detailIdFor(p))?.name ?? p.name;

  // Tick every second so displayed time and freshness labels stay current.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setMeal(currentMealForUI(now));
  }, [now]);

  useEffect(() => {
    let cancelled = false;

    async function loadMenuCounts() {
      const mealPeriod = meal;
      const counts = await Promise.all(
        HALLS.map(async (hall) => {
          const inventory = await getInventoryStatus(hall.name, mealPeriod, new Date());
          const nonDepleted = inventory.filter((item) => !item.depleted);
          const matches = await filterByDietary(nonDepleted, dietary);

          const sortedItems: MenuItemSummary[] = nonDepleted
            .slice()
            .sort((a, b) => {
              const aLevel = a.depletion_pct !== null ? 1 - a.depletion_pct : 0;
              const bLevel = b.depletion_pct !== null ? 1 - b.depletion_pct : 0;
              return bLevel - aLevel;
            })
            .map((item) => ({
              item_id: String(item.item_id),
              item_name: String(item.item_name),
              station: String(item.station),
              depletion_pct: item.depletion_pct,
              depleted: item.depleted,
            }));

          return [
            hall.name,
            { total: nonDepleted.length, matches: matches.length, items: sortedItems },
          ] as const;
        }),
      );

      if (!cancelled) {
        setMenuCountsByHall(Object.fromEntries(counts));
      }
    }

    loadMenuCounts();

    return () => {
      cancelled = true;
    };
  }, [meal, dietary]);

  const currentTimeLabel = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const updatedLabel = `Current time ${currentTimeLabel} · 15-min refresh`;
  const showUnavailableWarning = !useLiveForSelectedMeal && !warningDismissed;

  const handleGoHere = (detailId: number) => {
    setCtaAnimatingId(detailId);
    setTimeout(() => {
      setCtaAnimatingId(null);
      navigate(`/halls/${detailId}`);
    }, 200);
  };

  return (
    <MobileShell>
      {/* Top bar */}
      <header className="px-space-4 pt-[max(1rem,env(safe-area-inset-top))] pb-space-3 flex items-center justify-between">
        <div className="flex items-center gap-space-3">
          <div className="w-11 h-11 rounded-lg-token bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">BU</div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground">BU Dining</h1>
        </div>
        <Link to="/profile" aria-label="Profile" className="w-11 h-11 rounded-lg-token border border-white/10 bg-card text-foreground flex items-center justify-center font-body font-medium text-sm no-tap-highlight">
          {name.charAt(0)}
        </Link>
      </header>

      {/* Greeting */}
      <section className="px-space-4 pt-space-3 pb-space-2">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground text-center">{greeting()}, {name}</h2>
        <p className="font-body text-sm text-muted-foreground mt-space-2 flex items-center gap-space-2 text-left">
          <Clock className="w-3.5 h-3.5" /> {updatedLabel}
        </p>
      </section>

      {showUnavailableWarning && (
        <section className="px-space-4 pb-space-2">
          <div className="ios-card bg-status-warn/10 border-status-warn/30 p-space-3 flex items-start justify-between gap-space-3">
            <p className="font-body text-sm text-status-warn text-left">
              Predicted wait data is temporarily unavailable. Showing fallback BU hall predictions.
            </p>
            <button
              type="button"
              aria-label="Dismiss warning"
              onClick={() => setWarningDismissed(true)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-sm-token text-status-warn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Meal plan strip */}
      <section className="px-space-4 pt-space-3 pb-space-4">
        <button
          onClick={() => navigate("/profile")}
          className={`w-full min-h-[44px] ios-card px-space-4 py-space-3 flex items-center gap-space-2 font-body text-sm font-medium text-left no-tap-highlight active:scale-[0.99] transition-transform ${
            lowSwipes ? "text-status-warn" : "text-foreground"
          }`}
        >
          {lowSwipes ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <Ticket className="w-4 h-4 shrink-0 text-primary" />
          )}
          <span className="truncate">
            {mealPlanData.swipesRemainingThisWeek} swipes left this week · ${mealPlanData.dollarBalance.toFixed(2)} dining dollars
          </span>
        </button>
      </section>

      {/* Section header + meal toggle */}
      <section className="px-space-4 pt-space-2 pb-space-3">
        <h3 className="font-display text-2xl font-bold text-foreground">Predicted wait times</h3>
        <div
          role="tablist"
          aria-label="Meal period"
          className="mt-space-3 inline-flex w-full bg-[var(--color-surface-1)] border border-white/10 rounded-xl-token p-space-1"
        >
          {([
            { key: "lunch" as MealKey, label: "Lunch (11a–4:30p)" },
            { key: "dinner" as MealKey, label: "Dinner (5p–9:30p)" },
          ]).map((opt) => {
            const active = meal === opt.key;
            return (
              <button
                key={opt.key}
                role="tab"
                aria-selected={active}
                onClick={() => setMeal(opt.key)}
                className={`flex-1 min-h-[44px] rounded-sm-token px-space-2 py-space-2 font-body text-sm font-medium transition-colors no-tap-highlight ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Recommendation cards */}
      <section className="px-space-4 space-y-space-4">
        {loading
          ? [0, 1, 2].map((n) => (
              <article key={`skeleton-${n}`} className="ios-card p-space-4">
                <div className="flex items-start justify-between mb-space-3">
                  <div className="flex-1 space-y-space-2">
                    <Skeleton className="h-[20px] w-[65%] rounded-sm-token" />
                    <Skeleton className="h-[16px] w-[45%] rounded-sm-token" />
                  </div>
                  <Skeleton className="h-[22px] w-[110px] rounded-sm-token" />
                </div>
                <Skeleton className="h-[8px] w-full rounded-sm-token" />
                <div className="mt-space-3 flex gap-space-2">
                  <Skeleton className="h-[22px] w-[80px] rounded-sm-token" />
                  <Skeleton className="h-[22px] w-[92px] rounded-sm-token" />
                </div>
                <Skeleton className="mt-space-4 h-[44px] w-full rounded-lg-token" />
              </article>
            ))
          : ranked.map((hall, idx) => {
          const detailId = detailIdFor(hall);
          const waitMin = Math.round(hall.predictedWaitMin);
          const canonicalHallName = hallNameFor(hall);
          const menuCounts = menuCountsByHall[canonicalHallName] ?? { total: 0, matches: 0, items: [] };
          const preferenceLabel = dietary.join(", ");
          const showNoMatchWarning = dietary.length > 0 && menuCounts.matches === 0;
          return (
            <article
              key={`${meal}-${hall.id}`}
              className="ios-card card-enter p-space-4 relative"
              style={{ ["--stagger" as string]: idx }}
            >
              <div className="flex items-start justify-between gap-space-3 mb-space-3">
                <div className="flex items-center gap-space-3 min-w-0">
                  <div className="shrink-0 w-11 h-11 rounded-lg-token bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground truncate">{hall.name}</h3>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="inline-flex items-center gap-space-1 bg-primary-soft text-primary font-body text-xs font-medium px-space-2 py-space-1 rounded-sm-token">
                    <Clock className="w-3 h-3" /> ~{waitMin} min predicted wait
                  </span>
                </div>
              </div>

              <OccupancyBar pct={Math.round(hall.occupancyPct)} />

              <p
                className={`mt-space-2 font-body text-xs text-left ${
                  showNoMatchWarning ? "text-[#F59E0B]" : "text-muted-foreground"
                }`}
              >
                {showNoMatchWarning
                  ? `⚠ No ${preferenceLabel} options right now`
                  : `${menuCounts.total} options available · ${menuCounts.matches} match your preferences`}
              </p>

              {menuCounts.items.length > 0 && (
                <div className="mt-space-3 border-t border-white/5 pt-space-3">
                  <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-space-2">
                    Menu Options
                  </p>
                  <div className="space-y-[6px]">
                    {menuCounts.items.slice(0, MAX_MENU_VISIBLE).map((item) => {
                      const invLevel =
                        item.depletion_pct !== null
                          ? Math.round((1 - item.depletion_pct) * 100)
                          : null;
                      const badgeClass =
                        invLevel !== null && invLevel >= 70
                          ? "bg-emerald-500/15 text-emerald-400"
                          : invLevel !== null && invLevel >= 30
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400";
                      return (
                        <div
                          key={item.item_id}
                          className="flex items-center justify-between gap-space-2"
                        >
                          <span className="font-body text-xs text-foreground truncate">
                            {item.item_name}
                          </span>
                          <span
                            className={`shrink-0 font-body text-[11px] font-medium px-1.5 py-0.5 rounded-sm-token ${badgeClass}`}
                          >
                            {invLevel !== null ? `${invLevel}%` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {menuCounts.items.length > MAX_MENU_VISIBLE && (
                    <p className="font-body text-xs text-muted-foreground mt-space-2">
                      +{menuCounts.items.length - MAX_MENU_VISIBLE} more options
                    </p>
                  )}
                </div>
              )}

              <FoodAvailability level={foodLevelFor(hall)} />

              <div className="mt-space-3 flex flex-wrap gap-space-2">
                {hall.dietaryTags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-space-1 bg-primary/15 text-primary font-body text-xs font-medium px-space-2 py-space-1 rounded-sm-token">
                    {t} <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleGoHere(detailId)}
                className={`cta-shadow mt-space-4 min-h-[44px] w-full bg-primary text-primary-foreground rounded-lg-token py-space-3 font-body font-medium text-sm flex items-center justify-center gap-space-2 text-left no-tap-highlight ${ctaAnimatingId === detailId ? "cta-pulse" : ""}`}
              >
                Go Here →
              </button>
            </article>
          );
        })}

        <p className="font-body text-xs text-muted-foreground text-left pt-space-2 pb-space-6">
          Predicted wait times • underlying swipe counts have a 15-min delay
        </p>
      </section>
    </MobileShell>
  );
}
