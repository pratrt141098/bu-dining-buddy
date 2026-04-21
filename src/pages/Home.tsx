import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, Ticket, AlertTriangle, Cpu } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyBar } from "@/components/OccupancyBar";
import { FoodAvailability } from "@/components/FoodAvailability";
import { HALLS } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";
import {
  hallPredictions,
  lunchPredictions,
  MODEL_META,
  NAME_TO_HALL_ID,
  type HallPrediction,
} from "@/data/modelOutput";

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

type MealKey = "lunch" | "dinner";

export default function Home() {
  const navigate = useNavigate();
  const { name, mealPlanData } = usePreferences();
  const lowSwipes = mealPlanData.swipesRemainingThisWeek <= 3;

  const [meal, setMeal] = useState<MealKey>(() => (isLunchNow() ? "lunch" : "dinner"));

  const predictions = meal === "lunch" ? lunchPredictions : hallPredictions;

  // Always sort by predicted wait ascending so rank reflects current data.
  const ranked: HallPrediction[] = useMemo(
    () => [...predictions].sort((a, b) => a.predictedWaitSec - b.predictedWaitSec),
    [predictions],
  );

  // Resolve canonical hall id (for routing + foodLevel/tags lookup).
  const detailIdFor = (p: HallPrediction) => NAME_TO_HALL_ID[p.name] ?? p.id;
  const foodLevelFor = (p: HallPrediction) =>
    HALLS.find((h) => h.id === detailIdFor(p))?.foodLevel ?? "Good";

  // Tick every 30s so "Updated X min ago" stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const lastRefresh = useMemo(() => new Date(MODEL_META.lastRefresh), []);
  const minutesAgo = Math.max(0, Math.floor((Date.now() - lastRefresh.getTime()) / 60000));
  const updatedLabel = `Updated ${minutesAgo} min ago · 15-min refresh`;

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
        <div className="mt-2 inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          <Cpu className="w-3 h-3 text-primary" />
          <span>GBM model · {Math.round(MODEL_META.trainingRows / 1000)}k swipes</span>
        </div>
      </section>

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

      {/* Section header + meal toggle */}
      <section className="px-5 pt-1 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Predicted wait times</h3>
        <div
          role="tablist"
          aria-label="Meal period"
          className="mt-2 inline-flex w-full bg-card border border-border rounded-xl p-1"
        >
          {([
            { key: "lunch" as MealKey, label: "Lunch (11a–4:30p)" },
            { key: "dinner" as MealKey, label: "Dinner (now)" },
          ]).map((opt) => {
            const active = meal === opt.key;
            return (
              <button
                key={opt.key}
                role="tab"
                aria-selected={active}
                onClick={() => setMeal(opt.key)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors no-tap-highlight ${
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
      <section className="px-5 space-y-4">
        {ranked.map((hall, idx) => {
          const detailId = detailIdFor(hall);
          const waitMin = Math.round(hall.predictedWaitMin);
          return (
            <article key={`${meal}-${hall.id}`} className="ios-card p-4 relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-base text-foreground truncate">{hall.name}</h3>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> ~{waitMin} min predicted wait
                  </span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    GBM model · trained on 137,179 swipes
                  </span>
                </div>
              </div>

              <OccupancyBar pct={Math.round(hall.occupancyPct)} />

              <FoodAvailability level={foodLevelFor(hall)} />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {hall.dietaryTags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {t} <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate(`/halls/${detailId}`)}
                className="cta-shadow mt-4 w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 no-tap-highlight active:scale-[0.98] transition-transform"
              >
                Go Here <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          );
        })}

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Predicted wait times • underlying swipe counts have a 15-min delay
        </p>
      </section>
    </MobileShell>
  );
}
