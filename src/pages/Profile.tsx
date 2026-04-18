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
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize your recommendations</p>
      </header>

      {/* Dietary preferences */}
      <section className="px-5 mt-6">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Dietary preferences</h2>
        <div className="flex flex-wrap gap-2">
          <Pill active={noneSelected} onClick={() => prefs.setDietary([])}>None</Pill>
          {ALL_DIETARY.map(t => (
            <Pill key={t} active={dietary.includes(t)} onClick={() => toggleDiet(t)}>{t}</Pill>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Recommendations update instantly as you tap.
        </p>
      </section>

      {/* Campus area */}
      <section className="px-5 mt-7">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Your campus area</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {ALL_AREAS.map(a => {
            const active = area === a;
            return (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`rounded-2xl py-4 px-2 text-sm font-semibold border-2 transition-all no-tap-highlight active:scale-[0.97] ${
                  active
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {AREA_LABEL[a]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Meal plan toggle */}
      <section className="px-5 mt-7">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Meal plan</h2>
        <div className="ios-card px-4 py-3.5 flex items-center justify-between">
          <span className="font-medium text-sm">Active meal plan</span>
          <button
            role="switch"
            aria-checked={mealPlan}
            onClick={() => setMealPlan(v => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors no-tap-highlight ${
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

      <div className="px-5 mt-10 mb-4">
        <button
          onClick={save}
          className="cta-shadow w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-base no-tap-highlight active:scale-[0.98] transition-transform"
        >
          Save preferences
        </button>
      </div>
    </MobileShell>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors no-tap-highlight active:scale-[0.97] ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}
