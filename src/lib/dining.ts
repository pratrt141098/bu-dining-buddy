export type DietaryTag = "Halal" | "Vegan" | "Vegetarian" | "Gluten-Free";
export type HallStatus = "Normal" | "Busy" | "High" | "Closed";
export type CampusArea = "East" | "West" | "Central";

export interface Hall {
  id: number;
  name: string;
  capacity: number;
  occupancy: number;
  waitMin: number;
  status: HallStatus;
  tags: DietaryTag[];
  area: CampusArea;
}

export const HALLS: Hall[] = [
  { id: 1, name: "Marciano Commons", capacity: 800, occupancy: 88, waitMin: 12, status: "High", tags: ["Halal", "Vegan"], area: "East" },
  { id: 2, name: "Warren Towers Dining", capacity: 600, occupancy: 54, waitMin: 6, status: "Normal", tags: ["Vegetarian"], area: "Central" },
  { id: 3, name: "West Campus Dining", capacity: 500, occupancy: 71, waitMin: 8, status: "Busy", tags: ["Halal", "Gluten-Free"], area: "West" },
  { id: 4, name: "Stuvi2 Dining", capacity: 400, occupancy: 41, waitMin: 4, status: "Normal", tags: ["Vegan"], area: "East" },
  { id: 5, name: "Sargent Choice Café", capacity: 300, occupancy: 94, waitMin: 18, status: "High", tags: ["Gluten-Free"], area: "Central" },
];

export const ALL_DIETARY: DietaryTag[] = ["Vegetarian", "Vegan", "Halal", "Gluten-Free"];
export const ALL_AREAS: CampusArea[] = ["East", "West", "Central"];

export function rankHalls(halls: Hall[], dietary: DietaryTag[]): Hall[] {
  const filtered = dietary.length === 0
    ? halls
    : halls.filter(h => dietary.every(d => h.tags.includes(d)));
  // Fallback: if filter empties the list, fall back to unfiltered ranking
  const list = filtered.length > 0 ? filtered : halls;
  return [...list].filter(h => h.status !== "Closed").sort((a, b) => a.waitMin - b.waitMin);
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
