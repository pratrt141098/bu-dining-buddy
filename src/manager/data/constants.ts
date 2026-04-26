export const CHART_COLORS = ["#00A896", "#F59E0B", "#EF4444", "#6366F1", "#EC4899"] as const;

/** Actual hall names as they appear in CSV data */
export const HALLS = [
  "Marciano Commons",
  "Warren Towers Dining",
  "West Campus Dining",
  "Stuvi2 / towers",
  "Sargent Choice Café",
] as const;

export type HallName = (typeof HALLS)[number];

/** Display label for each CSV hall name */
export const HALL_DISPLAY: Record<string, string> = {
  "Marciano Commons": "Marciano",
  "Warren Towers Dining": "Warren Towers",
  "West Campus Dining": "West Campus",
  "Stuvi2 / towers": "Stuvi2",
  "Sargent Choice Café": "Sargent Café",
};

/** Color for each hall, indexed by HALLS order */
export const HALL_COLORS: Record<string, string> = {
  "Marciano Commons": CHART_COLORS[0],
  "Warren Towers Dining": CHART_COLORS[1],
  "West Campus Dining": CHART_COLORS[2],
  "Stuvi2 / towers": CHART_COLORS[3],
  "Sargent Choice Café": CHART_COLORS[4],
};

/** Hall selector dropdown options — label is display, value is CSV hall name */
export const HALL_SELECTOR_OPTIONS = [
  { label: "All Halls", value: "All Halls" },
  { label: "Marciano Commons", value: "Marciano Commons" },
  { label: "Warren Towers", value: "Warren Towers Dining" },
  { label: "West Campus", value: "West Campus Dining" },
  { label: "Stuvi2 / Towers", value: "Stuvi2 / towers" },
  { label: "Sargent Choice Café", value: "Sargent Choice Café" },
] as const;

/** Day selector dropdown options — value is the day_of_week string in the CSV */
export const DAY_OPTIONS = [
  { label: "All Days", value: "All Days" },
  { label: "Mon Apr 6", value: "Monday" },
  { label: "Tue Apr 7", value: "Tuesday" },
  { label: "Wed Apr 8", value: "Wednesday" },
  { label: "Thu Apr 9", value: "Thursday" },
  { label: "Fri Apr 10", value: "Friday" },
  { label: "Sat Apr 11", value: "Saturday" },
  { label: "Sun Apr 12", value: "Sunday" },
] as const;

export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const MEAL_ORDER = ["breakfast", "lunch", "dinner"] as const;

export const MEAL_COLORS: Record<string, string> = {
  breakfast: CHART_COLORS[0],
  lunch: CHART_COLORS[1],
  dinner: CHART_COLORS[2],
};

export const DIETARY_COLORS: Record<string, string> = {
  halal: "#F59E0B",
  vegan: "#22C55E",
  vegetarian: "#00A896",
  gluten_free: "#64748B",
  none: "#475569",
};

export const PERSONA_LABELS: Record<string, string> = {
  residential_east: "Res East",
  residential_west: "Res West",
  residential_central: "Res Central",
  commuter: "Commuter",
  off_campus_plan: "Off-Campus",
};

export const CHART_GRID_STROKE = "rgba(255,255,255,0.06)";
export const CHART_AXIS_STYLE = { fill: "#9fb0c7", fontSize: 12 };

export const TOOLTIP_STYLE: import("react").CSSProperties = {
  background: "var(--color-surface-3)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  color: "white",
  fontSize: 13,
  boxShadow: "none",
};
