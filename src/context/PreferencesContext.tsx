import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { CampusArea, DietaryTag } from "@/lib/dining";

export interface MealPlanData {
  swipesUsedThisWeek: number;
  swipesRemainingThisWeek: number;
  weeklyAllowance: number;
  dollarBalance: number;
  projectedRunOutDay: string;
}

interface Preferences {
  name: string;
  dietary: DietaryTag[];
  area: CampusArea | null;
  mealPlan: boolean;
  adoptions: number;
  mealPlanData: MealPlanData;
}

interface PrefsCtx extends Preferences {
  setDietary: (d: DietaryTag[]) => void;
  setArea: (a: CampusArea | null) => void;
  setMealPlan: (b: boolean) => void;
  logAdoption: () => void;
}

const Ctx = createContext<PrefsCtx | null>(null);

const DEFAULT_MEAL_PLAN: MealPlanData = {
  swipesUsedThisWeek: 9,
  swipesRemainingThisWeek: 5,
  weeklyAllowance: 14,
  dollarBalance: 42.5,
  projectedRunOutDay: "Thursday",
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [dietary, setDietary] = useState<DietaryTag[]>([]);
  const [area, setArea] = useState<CampusArea | null>("East");
  const [mealPlan, setMealPlan] = useState(true);
  const [adoptions, setAdoptions] = useState(0);
  const [mealPlanData] = useState<MealPlanData>(DEFAULT_MEAL_PLAN);

  const value = useMemo<PrefsCtx>(() => ({
    name: "Alex",
    dietary,
    area,
    mealPlan,
    adoptions,
    mealPlanData,
    setDietary,
    setArea,
    setMealPlan,
    logAdoption: () => setAdoptions(a => a + 1),
  }), [dietary, area, mealPlan, adoptions, mealPlanData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePreferences must be used within PreferencesProvider");
  return v;
}
