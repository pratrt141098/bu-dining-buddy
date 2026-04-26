import { createContext, useContext, useState, type ReactNode } from "react";

export interface Settings {
  occupancyWarningThreshold: number;
  depletionWarningThreshold: number;
  highDemandThreshold: number;
  showPersonaBreakdown: boolean;
  showRestockRecommendations: boolean;
}

const DEFAULTS: Settings = {
  occupancyWarningThreshold: 85,
  depletionWarningThreshold: 70,
  highDemandThreshold: 85,
  showPersonaBreakdown: true,
  showRestockRecommendations: true,
};

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsContext.Provider value={{ ...settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
