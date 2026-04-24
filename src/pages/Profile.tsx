import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { ALL_AREAS, ALL_DIETARY, CampusArea, DietaryTag } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";

const AREA_LABEL: Record<CampusArea, string> = {
  East: "East Campus",
  West: "West Campus",
  Central: "Central",
};

export default function Profile() {
  const prefs = usePreferences();
  // Dietary chips update the global context immediately so Home re-ranks live.
  const dietary = prefs.dietary;
  const [area, setArea] = useState<CampusArea | null>(prefs.area);
  const [mealPlan, setMealPlan] = useState(prefs.mealPlan);

  const toggleDiet = (t: DietaryTag) => {
    const next = dietary.includes(t) ? dietary.filter(x => x !== t) : [...dietary, t];
    prefs.setDietary(next);
  };

  const noneSelected = dietary.length === 0;

  const save = () => {
    prefs.setArea(area);
    prefs.setMealPlan(mealPlan);
    toast.success("Preferences saved");
  };

  return (
    <MobileShell>
      <header className="px-space-4 pt-[max(1rem,env(safe-area-inset-top))] pb-space-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Your Profile</h1>
        <p className="font-body text-sm text-muted-foreground mt-space-2 text-left">Personalize your recommendations</p>
      </header>

      {/* Dietary preferences */}
      <section className="px-space-4 mt-space-6">
        <h2 className="font-body font-medium text-sm text-muted-foreground uppercase tracking-wider mb-space-3">Dietary preferences</h2>
        <div className="ios-card p-space-3 space-y-space-2">
          <label htmlFor="diet-none" className="min-h-[44px] flex items-center justify-between gap-space-3 cursor-pointer text-left">
            <span className="font-body text-sm text-foreground">None</span>
            <input
              id="diet-none"
              type="checkbox"
              checked={noneSelected}
              onChange={() => prefs.setDietary([])}
              className="h-4 w-4 accent-[#00A896]"
            />
          </label>
          {ALL_DIETARY.map((t) => {
            const id = `diet-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            const checked = dietary.includes(t);
            return (
              <label key={t} htmlFor={id} className="min-h-[44px] flex items-center justify-between gap-space-3 cursor-pointer text-left border-t border-white/10 pt-space-2">
                <span className="font-body text-sm text-foreground">{t}</span>
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDiet(t)}
                  className="h-4 w-4 accent-[#00A896]"
                />
              </label>
            );
          })}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-space-2 text-left">
          Recommendations update instantly as you tap.
        </p>
      </section>

      {/* Campus area */}
      <section className="px-space-4 mt-space-7">
        <h2 className="font-body font-medium text-sm text-muted-foreground uppercase tracking-wider mb-space-3">Your campus area</h2>
        <div className="grid grid-cols-3 gap-space-2">
          {ALL_AREAS.map(a => {
            const active = area === a;
            return (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`min-h-[44px] rounded-lg-token py-space-3 px-space-2 font-body text-sm font-medium border transition-colors no-tap-highlight ${
                  active
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-white/10 bg-card text-foreground"
                }`}
              >
                {AREA_LABEL[a]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Meal plan toggle */}
      <section className="px-space-4 mt-space-7">
        <h2 className="font-body font-medium text-sm text-muted-foreground uppercase tracking-wider mb-space-3">Meal plan</h2>
        <div className="ios-card px-space-4 py-space-3 flex items-center justify-between">
          <label htmlFor="meal-plan-switch" className="font-body font-medium text-sm text-foreground text-left">Active meal plan</label>
          <button
            id="meal-plan-switch"
            role="switch"
            aria-checked={mealPlan}
            onClick={() => setMealPlan(v => !v)}
            className={`relative min-h-[44px] min-w-[44px] w-12 h-7 rounded-sm-token transition-colors no-tap-highlight ${
              mealPlan ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                mealPlan ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </section>

      {/* Meal plan usage */}
      <section className="px-space-4 mt-space-7">
        <h2 className="font-body font-medium text-sm text-muted-foreground uppercase tracking-wider mb-space-3">Meal Plan Usage</h2>
        <div className="ios-card px-space-4 py-space-4">
          <div className="h-2 w-full rounded-sm-token bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-sm-token"
              style={{ width: `${Math.min(100, (prefs.mealPlanData.swipesUsedThisWeek / prefs.mealPlanData.weeklyAllowance) * 100)}%` }}
            />
          </div>
          <p className="mt-space-3 font-body text-sm font-medium text-foreground text-left">
            {prefs.mealPlanData.swipesUsedThisWeek} of {prefs.mealPlanData.weeklyAllowance} swipes used this week
          </p>
          <p className="mt-space-1 font-body text-sm text-muted-foreground text-left">
            Dining dollars remaining: <span className="text-foreground font-semibold">${prefs.mealPlanData.dollarBalance.toFixed(2)}</span>
          </p>
          <p className="mt-space-2 font-body text-xs font-medium text-status-warn flex items-center gap-space-1 text-left">
            <span aria-hidden>⚠</span>
            At this pace, swipes run out by {prefs.mealPlanData.projectedRunOutDay}
          </p>
        </div>
      </section>

      <div className="px-space-4 mt-space-10 mb-space-4">
        <button
          onClick={save}
          className="cta-shadow min-h-[44px] w-full bg-primary text-primary-foreground rounded-lg-token py-space-3 font-body font-medium text-sm no-tap-highlight"
        >
          Save preferences
        </button>
      </div>
    </MobileShell>
  );
}
