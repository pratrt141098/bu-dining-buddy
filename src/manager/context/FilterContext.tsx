import { createContext, useContext, useState, type ReactNode } from "react";

export interface FilterState {
  selectedHall: string;
  selectedDay: string;
  setSelectedHall: (hall: string) => void;
  setSelectedDay: (day: string) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedHall, setSelectedHall] = useState("All Halls");
  const [selectedDay, setSelectedDay] = useState("All Days");

  return (
    <FilterContext.Provider value={{ selectedHall, selectedDay, setSelectedHall, setSelectedDay }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within FilterProvider");
  return ctx;
}
