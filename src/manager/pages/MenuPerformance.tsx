import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { loadInventory, loadMenuItems } from "../data/loaders";
import type { InventoryRow, MenuItemRow } from "../data/types";
import {
  HALLS,
  HALL_DISPLAY,
  DIETARY_COLORS,
  CHART_GRID_STROKE,
  CHART_AXIS_STYLE,
  TOOLTIP_STYLE,
  CHART_COLORS,
} from "../data/constants";
import { useFilter } from "../context/FilterContext";
import { useSettings } from "../context/SettingsContext";
import { ChartContainer } from "../components/ChartContainer";
import { SkeletonCard } from "../components/SkeletonCard";
import { EmptyState } from "../components/EmptyState";

const DIETARY_TAGS = ["none", "halal", "vegetarian", "vegan", "gluten_free"] as const;
const DIETARY_LABELS: Record<string, string> = {
  none: "None", halal: "Halal", vegetarian: "Vegetarian", vegan: "Vegan", gluten_free: "Gluten Free",
};

function parseTags(raw: string): string[] {
  return raw.replace(/['"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
}

function truncate(s: string, max = 24) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

interface DietaryTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; pct: string } }>;
}

function DietaryTooltip({ active, payload }: DietaryTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = DIETARY_COLORS[(d.name ?? "").toLowerCase().replace(/\s+/g, "_")] ?? CHART_COLORS[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, color }}>{d.name}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: 12, marginTop: 2 }}>
        {payload[0].value} items · {d.pct}
      </div>
    </div>
  );
}

export default function MenuPerformance() {
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRow[] | null>(null);
  const { selectedHall, selectedDay } = useFilter();
  const { depletionWarningThreshold } = useSettings();

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadInventory(), loadMenuItems()]).then(([inv, menu]) => {
      if (!cancelled) { setInventory(inv); setMenuItems(menu); }
    });
    return () => { cancelled = true; };
  }, []);

  const filteredInv = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(
      (r) =>
        (selectedHall === "All Halls" || r.hall === selectedHall) &&
        (selectedDay === "All Days" || r.day_of_week === selectedDay)
    );
  }, [inventory, selectedHall, selectedDay]);

  const filteredMenu = useMemo(() => {
    if (!menuItems) return [];
    return selectedHall === "All Halls" ? menuItems : menuItems.filter((m) => m.hall === selectedHall);
  }, [menuItems, selectedHall]);

  // Top 10 most served
  const top10 = useMemo(() => {
    if (!filteredInv.length) return [];
    const byItem = new Map<string, { name: string; served: number }>();
    for (const row of filteredInv) {
      const cur = byItem.get(row.item_id) ?? { name: row.item_name, served: 0 };
      cur.served += row.units_served;
      byItem.set(row.item_id, cur);
    }
    return Array.from(byItem.values())
      .sort((a, b) => b.served - a.served)
      .slice(0, 10)
      .map((d) => ({ name: truncate(d.name), served: d.served }));
  }, [filteredInv]);

  // Dietary donut
  const dietaryData = useMemo(() => {
    if (!filteredMenu.length) return [];
    const counts: Record<string, number> = { none: 0, halal: 0, vegetarian: 0, vegan: 0, gluten_free: 0 };
    for (const item of filteredMenu) {
      const tags = parseTags(item.dietary_tags);
      const nonNoneTags = tags.filter((t) => t !== "none");
      if (!nonNoneTags.length) { counts.none++; continue; }
      for (const tag of nonNoneTags) {
        if (tag in counts) counts[tag]++;
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: DIETARY_LABELS[k] ?? k, rawName: k, value: v, pct: ((v / total) * 100).toFixed(0) + "%" }));
  }, [filteredMenu]);

  // Calorie range by station
  const calorieData = useMemo(() => {
    if (!filteredMenu.length) return [];
    const byStation = new Map<string, number[]>();
    for (const item of filteredMenu) {
      if (!item.calories || item.calories <= 0) continue;
      const arr = byStation.get(item.station) ?? [];
      arr.push(item.calories);
      byStation.set(item.station, arr);
    }
    return Array.from(byStation.entries())
      .map(([station, cals]) => ({
        station: truncate(station, 18),
        min: Math.min(...cals),
        avg: Math.round(cals.reduce((a, b) => a + b, 0) / cals.length),
        max: Math.max(...cals),
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [filteredMenu]);

  // Station health grid
  const stationHealth = useMemo(() => {
    if (!inventory || !menuItems) return [];
    const menuFiltered = selectedHall === "All Halls" ? menuItems : menuItems.filter((m) => m.hall === selectedHall);
    const stationMap = new Map<string, string[]>();
    for (const item of menuFiltered) {
      const ids = stationMap.get(item.station) ?? [];
      ids.push(item.item_id);
      stationMap.set(item.station, ids);
    }
    return Array.from(stationMap.entries()).map(([station, itemIds]) => {
      const invRows = filteredInv.filter((r) => itemIds.includes(r.item_id));
      const avgDep = invRows.length ? (invRows.reduce((s, r) => s + r.depletion_pct, 0) / invRows.length) * 100 : 0;
      let barColor = "#00A896";
      if (avgDep > 70) barColor = "#EF4444";
      else if (avgDep >= 40) barColor = "#F59E0B";
      return { station, itemCount: itemIds.length, avgDep, barColor };
    }).sort((a, b) => b.avgDep - a.avgDep);
  }, [inventory, menuItems, filteredInv, selectedHall]);

  // Dietary gap analysis — depletion rate by dietary tag grouped by hall
  const dietaryGapData = useMemo(() => {
    if (!inventory) return { chartData: [], highTags: [] };
    const halls = selectedHall === "All Halls" ? HALLS : ([selectedHall] as string[]);
    const chartData = halls.map((hall) => {
      const row: Record<string, string | number> = { hall: HALL_DISPLAY[hall] };
      for (const tag of DIETARY_TAGS) {
        const rows = inventory.filter(
          (r) =>
            r.hall === hall &&
            (selectedDay === "All Days" || r.day_of_week === selectedDay) &&
            parseTags(r.dietary_tags).includes(tag)
        );
        row[tag] = rows.length ? parseFloat((rows.reduce((s, r) => s + r.depletion_pct, 0) / rows.length * 100).toFixed(1)) : 0;
      }
      return row;
    });

    // Compute overall avg per tag for the alert
    const highTags: string[] = [];
    for (const tag of DIETARY_TAGS) {
      const rows = inventory.filter(
        (r) =>
          (selectedHall === "All Halls" || r.hall === selectedHall) &&
          (selectedDay === "All Days" || r.day_of_week === selectedDay) &&
          parseTags(r.dietary_tags).includes(tag)
      );
      if (rows.length) {
        const avg = rows.reduce((s, r) => s + r.depletion_pct, 0) / rows.length * 100;
        if (avg > depletionWarningThreshold) {
          highTags.push(`${DIETARY_LABELS[tag]} (${avg.toFixed(0)}%)`);
        }
      }
    }

    return { chartData, highTags };
  }, [inventory, selectedHall, selectedDay, depletionWarningThreshold]);

  if (!inventory || !menuItems) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SkeletonCard height={320} />
        <div style={{ display: "flex", gap: 16 }}>
          <SkeletonCard style={{ flex: 1 }} />
          <SkeletonCard style={{ flex: 1 }} />
        </div>
        <SkeletonCard height={280} />
        <SkeletonCard height={240} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top 10 most served */}
      <ChartContainer
        title="Top 10 Most Served Items"
        subtitle={`Source: bu_dining_inventory.csv · ${selectedHall === "All Halls" ? "all halls" : HALL_DISPLAY[selectedHall] ?? selectedHall} · units served`}
      >
        {!top10.length ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={160} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }} itemStyle={{ color: "white" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="served" fill="#00A896" radius={[0, 3, 3, 0]} maxBarSize={22} name="Units Served">
                <LabelList dataKey="served" position="right" formatter={(v: number) => v.toLocaleString()} style={{ fill: "#9fb0c7", fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Dietary donut */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Menu Dietary Coverage" subtitle="Source: bu_dining_menu_items.csv · count of items per dietary category" style={{ height: "100%" }}>
            {!dietaryData.length ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dietaryData} cx="45%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                    {dietaryData.map((entry, i) => (
                      <Cell key={i} fill={DIETARY_COLORS[entry.rawName] ?? CHART_COLORS[i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DietaryTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12, color: "#9fb0c7", lineHeight: "24px" }} formatter={(val, entry) => {
                    const d = (entry as { payload?: { pct: string } }).payload;
                    return `${val} — ${d?.pct ?? ""}`;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Calorie range */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Calorie Range by Station" subtitle="Source: bu_dining_menu_items.csv · min / avg / max calories per station" style={{ height: "100%" }}>
            {!calorieData.length ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={calorieData} barGap={2} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="station" tick={{ ...CHART_AXIS_STYLE, angle: -25, textAnchor: "end" }} axisLine={false} tickLine={false} interval={0} height={50} />
                  <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={42} />
                  <Tooltip formatter={(v: number) => `${v} kcal`} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }} itemStyle={{ color: "white" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} />
                  <Bar dataKey="min" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} maxBarSize={14} name="Min" />
                  <Bar dataKey="avg" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} maxBarSize={14} name="Avg" />
                  <Bar dataKey="max" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} maxBarSize={14} name="Max" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Station health grid */}
      <div>
        <p className="section-label" style={{ marginBottom: 12 }}>STATION-LEVEL INVENTORY HEALTH</p>
        {stationHealth.length === 0 ? (
          <div style={{ background: "var(--color-surface-1)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "var(--radius-xl)", padding: 24 }}>
            <EmptyState message="No station data for this selection" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {stationHealth.map(({ station, itemCount, avgDep, barColor }) => (
              <div key={station} style={{ background: "var(--color-surface-1)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, color: "white", marginBottom: 8 }}>{station}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 10 }}>{itemCount} items · avg depletion {avgDep.toFixed(0)}%</div>
                <div style={{ height: 6, background: "var(--color-surface-2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, avgDep)}%`, background: barColor, borderRadius: 3, transition: "width 600ms ease" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dietary gap analysis */}
      <ChartContainer
        title="Depletion Rate by Dietary Tag"
        subtitle="Source: bu_dining_inventory.csv joined on item_id with bu_dining_menu_items.csv"
      >
        {!dietaryGapData.chartData.length ? (
          <EmptyState />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dietaryGapData.chartData} barGap={2} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="hall" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v}%`, DIETARY_LABELS[name] ?? name]}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }}
                  itemStyle={{ color: "white" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} formatter={(v) => DIETARY_LABELS[v] ?? v} />
                {DIETARY_TAGS.map((tag) => (
                  <Bar key={tag} dataKey={tag} fill={DIETARY_COLORS[tag]} radius={[2, 2, 0, 0]} maxBarSize={18} name={tag} />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {/* Alert callout */}
            {dietaryGapData.highTags.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  background: "rgba(245,158,11,0.10)",
                  border: "1px solid rgba(245,158,11,0.35)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#F59E0B",
                }}
              >
                {dietaryGapData.highTags.map((tag, i) => {
                  const [name, pctRaw] = tag.split(" (");
                  const pct = pctRaw?.replace(")", "") ?? "";
                  return (
                    <div key={i} style={{ marginBottom: i < dietaryGapData.highTags.length - 1 ? 4 : 0 }}>
                      ⚠ <strong>{name}</strong> items are depleting at {pct} — consider increasing starting stock for these items.
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ChartContainer>
    </div>
  );
}
