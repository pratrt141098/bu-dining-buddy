export type DietaryTag = "Halal" | "Vegan" | "Vegetarian" | "Gluten-Free";
export type HallStatus = "Normal" | "Busy" | "High" | "Closed";
export type CampusArea = "East" | "West" | "Central";
export type FoodLevel = "Excellent" | "Good" | "Low";

export interface Hall {
  id: number;
  name: string;
  capacity: number;
  occupancy: number;
  waitMin: number;
  status: HallStatus;
  tags: DietaryTag[];
  area: CampusArea;
  foodLevel: FoodLevel;
}

export const HALLS: Hall[] = [
  { id: 1, name: "Marciano Commons", capacity: 800, occupancy: 88, waitMin: 12, status: "High", tags: ["Halal", "Vegan"], area: "East", foodLevel: "Low" },
  { id: 2, name: "Warren Towers Dining", capacity: 600, occupancy: 54, waitMin: 6, status: "Normal", tags: ["Vegetarian"], area: "Central", foodLevel: "Good" },
  { id: 3, name: "West Campus Dining", capacity: 500, occupancy: 71, waitMin: 8, status: "Busy", tags: ["Halal", "Gluten-Free"], area: "West", foodLevel: "Good" },
  { id: 4, name: "Stuvi2 Dining", capacity: 400, occupancy: 41, waitMin: 4, status: "Normal", tags: ["Vegan"], area: "East", foodLevel: "Excellent" },
  { id: 5, name: "Sargent Choice Café", capacity: 300, occupancy: 94, waitMin: 18, status: "High", tags: ["Gluten-Free"], area: "Central", foodLevel: "Low" },
];

export function foodLevelTone(level: FoodLevel): "good" | "warn" | "bad" {
  if (level === "Excellent") return "good";
  if (level === "Good") return "warn";
  return "bad";
}

export const ALL_DIETARY: DietaryTag[] = ["Vegetarian", "Vegan", "Halal", "Gluten-Free"];
export const ALL_AREAS: CampusArea[] = ["East", "West", "Central"];

export function rankHalls(halls: Hall[], dietary: DietaryTag[]): Hall[] {
  const open = halls.filter(h => h.status !== "Closed");
  if (dietary.length === 0) {
    return [...open].sort((a, b) => a.waitMin - b.waitMin);
  }
  // Score = number of selected dietary tags the hall satisfies.
  // Higher score first; tie-break by shorter wait time.
  const score = (h: Hall) => dietary.reduce((n, d) => n + (h.tags.includes(d) ? 1 : 0), 0);
  return [...open].sort((a, b) => {
    const diff = score(b) - score(a);
    return diff !== 0 ? diff : a.waitMin - b.waitMin;
  });
}

export function occupancyColor(pct: number): "good" | "warn" | "bad" {
  if (pct < 60) return "good";
  if (pct <= 85) return "warn";
  return "bad";
}

export function statusTone(status: HallStatus): "good" | "warn" | "bad" | "muted" {
  switch (status) {
    case "Normal": return "good";
    case "Busy": return "warn";
    case "High": return "bad";
    case "Closed": return "muted";
  }
}

// Sample menu items per hall (deterministic, no lorem)
export const HALL_MENUS: Record<number, { name: string; tags: DietaryTag[] }[]> = {
  1: [
    { name: "Mediterranean Chicken Bowl", tags: ["Halal"] },
    { name: "Roasted Cauliflower Steak", tags: ["Vegan"] },
    { name: "Lemon Herb Quinoa Salad", tags: ["Vegetarian", "Gluten-Free"] },
  ],
  2: [
    { name: "Margherita Flatbread", tags: ["Vegetarian"] },
    { name: "Grilled Salmon & Rice", tags: ["Gluten-Free"] },
    { name: "Buffalo Chicken Wrap", tags: [] },
  ],
  3: [
    { name: "Halal Beef Shawarma", tags: ["Halal"] },
    { name: "Rice Noodle Stir Fry", tags: ["Gluten-Free", "Vegan"] },
    { name: "Garden Harvest Soup", tags: ["Vegetarian"] },
  ],
  4: [
    { name: "Black Bean Burger", tags: ["Vegan"] },
    { name: "Sweet Potato Tacos", tags: ["Vegetarian"] },
    { name: "Citrus Kale Salad", tags: ["Vegan", "Gluten-Free"] },
  ],
  5: [
    { name: "Quinoa Power Bowl", tags: ["Gluten-Free", "Vegetarian"] },
    { name: "Grilled Turkey Avocado", tags: [] },
    { name: "Fresh Berry Parfait", tags: ["Vegetarian", "Gluten-Free"] },
  ],
};
