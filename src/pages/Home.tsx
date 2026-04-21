import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, Ticket, AlertTriangle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyBar } from "@/components/OccupancyBar";
import { FoodAvailability } from "@/components/FoodAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { HALLS, rankHalls, Hall, HallStatus } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";
import { useDiningData, HallPrediction } from "@/hooks/useDiningData";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Map API hall_name → local mock hall id (for foodLevel, tags, etc.)
const NAME_TO_ID: Record<string, number> = {
  "Marciano Commons": 1,
  "Warren Towers Dining": 2,
  "West Campus Dining": 3,
  "Stuvi2 / towers": 4,
  "Sargent Choice Café": 5,
};

function mergeHall(pred: HallPrediction): Hall | null {
  const id = NAME_TO_ID[pred.hall_name];
  const base = HALLS.find(h => h.id === id);
  if (!base) return null;
  return {
    ...base,
    occupancy: Math.round(pred.occupancy_pct),
    waitMin: pred.predicted_wait_min,
    status: pred.status as HallStatus,
  };
}

function minutesSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

export default function Home() {
  const navigate = useNavigate();
  const { name, dietary, mealPlanData } = usePreferences();
  const { halls: apiHalls, loading, error, lastUpdated } = useDiningData();
  const lowSwipes = mealPlanData.swipesRemainingThisWeek <= 3;

  // Merge API data with local mock metadata, then rank by dietary + wait time.
  const merged: Hall[] = useMemo(() => {
    if (!apiHalls || apiHalls.length === 0) return [];
    const arr = apiHalls.map(mergeHall).filter((h): h is Hall => h !== null);
    return [...arr].sort((a, b) => a.waitMin - b.waitMin);
  }, [apiHalls]);

  const ranked = useMemo(() => rankHalls(merged, dietary).slice(0, 3), [merged, dietary]);

  // Maintain a display order over the ranked list (indices into `ranked`)
  const [order, setOrder] = useState<number[]>(() => ranked.map((_, i) => i));
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setOrder(ranked.map((_, i) => i));
  }, [ranked]);

  // Tick every 30s so "Updated X min ago" stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const swapTopTwo = () => {
    if (order.length < 2 || fading) return;
    setFading(true);
    window.setTimeout(() => {
      setOrder(prev => {
        const next = [...prev];
        [next[0], next[1]] = [next[1], next[0]];
        return next;
      });
      window.setTimeout(() => setFading(false), 30);
    }, 250);
  };

  const display = order.map(i => ranked[i]).filter(Boolean);

  const hasData = apiHalls && apiHalls.length > 0;
  const updatedLabel = hasData
    ? `Updated ${minutesSince(lastUpdated ?? new Date())} min ago · 15-min refresh`
    : loading
      ? "Fetching predictions..."
      : `Updated ${minutesSince(lastUpdated ?? new Date())} min ago · 15-min refresh`;

  return (
    <MobileShell>
      {/* Top bar */}
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">BU</div>
          <h1 className="font-bold text-base tracking-tight">BU Dining</h1>
        </div>
        <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm no-tap-highlight">
          {name.charAt(0)}
        </Link>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-2 pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{greeting()}, {name}</h2>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {updatedLabel}
        </p>
      </section>

      {/* Error banner — only when we have no data at all */}
      {error && !hasData && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 text-xs font-medium text-status-warn bg-status-warn/10 border border-status-warn/30 rounded-xl px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Predictions unavailable — showing last known data</span>
          </div>
        </div>
      )}

      {/* Meal plan strip */}
      <section className="px-5 pt-2 pb-3">
        <button
          onClick={() => navigate("/profile")}
          className={`w-full ios-card px-4 py-3 flex items-center gap-2 text-sm font-medium no-tap-highlight active:scale-[0.99] transition-transform ${
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

      {/* Recommendation cards */}
      <section className="px-5 space-y-4">
        {loading && display.length === 0 ? (
          <>
            {[0, 1, 2].map(i => (
              <article key={i} className="ios-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-24 mt-2" />
                <Skeleton className="h-4 w-40 mt-4" />
                <Skeleton className="h-11 w-full rounded-xl mt-4" />
              </article>
            ))}
          </>
        ) : (
          display.map((hall, idx) => {
            const isSwapping = fading && idx < 2;
            return (
              <article
                key={hall.id}
                className={`ios-card p-4 relative transition-opacity duration-300 ease-out ${
                  isSwapping ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <h3 className="font-bold text-base text-foreground truncate">{hall.name}</h3>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> ~{hall.waitMin} min wait
                  </span>
                </div>

                <OccupancyBar pct={hall.occupancy} />

                <FoodAvailability level={hall.foodLevel} />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hall.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {t} <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/halls/${hall.id}`)}
                  className="cta-shadow mt-4 w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 no-tap-highlight active:scale-[0.98] transition-transform"
                >
                  Go Here <ArrowRight className="w-4 h-4" />
                </button>

                {idx === 0 && display.length > 1 && (
                  <button
                    onClick={swapTopTwo}
                    disabled={fading}
                    className="mt-2 w-full text-primary font-semibold text-sm py-2 no-tap-highlight disabled:opacity-60"
                  >
                    Next Best Rec →
                  </button>
                )}
              </article>
            );
          })
        )}

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Predicted wait times • 15-min refresh
        </p>
      </section>
    </MobileShell>
  );
}
