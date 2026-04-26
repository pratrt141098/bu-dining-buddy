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
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { Download } from "lucide-react";
import { loadInventory } from "../data/loaders";
import type { InventoryRow } from "../data/types";
import {
  HALLS,
  HALL_DISPLAY,
  MEAL_ORDER,
  MEAL_COLORS,
  DIETARY_COLORS,
  CHART_GRID_STROKE,
  CHART_AXIS_STYLE,
  TOOLTIP_STYLE,
} from "../data/constants";
import { useFilter } from "../context/FilterContext";
import { useSettings } from "../context/SettingsContext";
import { ChartContainer } from "../components/ChartContainer";
import { KpiCard } from "../components/KpiCard";
import { SkeletonCard, SkeletonKpi } from "../components/SkeletonCard";
import { EmptyState } from "../components/EmptyState";
import { ScatterTooltip } from "../components/DarkTooltip";

const PAGE_SIZE = 15;

function parseDietaryTags(raw: string): string[] {
  return raw.replace(/['"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
}

function DietaryPill({ tag }: { tag: string }) {
  const color = DIETARY_COLORS[tag] ?? "#475569";
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600, marginRight: 4, display: "inline-block" }}>
      {tag}
    </span>
  );
}

function downloadCsv(data: InventoryRow[]) {
  const headers = ["Date", "Hall", "Meal Period", "Item Name", "Dietary Tags", "Depletion Time", "Units Served", "Starting Units"];
  const rows = data.map((r) => [
    r.date, r.hall, r.meal_period, r.item_name,
    String(r.dietary_tags).replace(/['"]/g, ""),
    r.depletion_time ?? "",
    r.units_served, r.starting_units,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "depletion-log-week.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [depPage, setDepPage] = useState(1);
  const [restPage, setRestPage] = useState(1);
  const { selectedHall, selectedDay } = useFilter();
  const { showRestockRecommendations } = useSettings();

  useEffect(() => {
    let cancelled = false;
    loadInventory().then((inv) => { if (!cancelled) setInventory(inv); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setDepPage(1); setRestPage(1); }, [selectedHall, selectedDay]);

  const filtered = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(
      (r) =>
        (selectedHall === "All Halls" || r.hall === selectedHall) &&
        (selectedDay === "All Days" || r.day_of_week === selectedDay)
    );
  }, [inventory, selectedHall, selectedDay]);

  const kpis = useMemo(() => {
    if (!inventory) return null;
    const depleted = filtered.filter((r) => r.depleted === true);
    const avgDepletion = filtered.length
      ? (filtered.reduce((s, r) => s + r.depletion_pct, 0) / filtered.length * 100).toFixed(1)
      : "0";
    const hallCounts = HALLS.map((h) => ({ hall: h, count: depleted.filter((r) => r.hall === h).length }));
    const highestRisk = [...hallCounts].sort((a, b) => b.count - a.count)[0];
    return { depletedCount: depleted.length, avgDepletion, highestRisk: HALL_DISPLAY[highestRisk?.hall] ?? "—" };
  }, [filtered, inventory]);

  const depletionBarData = useMemo(() => {
    if (!inventory) return [];
    return HALLS.map((hall) => {
      const row: Record<string, string | number> = { hall: HALL_DISPLAY[hall] };
      for (const meal of MEAL_ORDER) {
        const rows = inventory.filter((r) => r.hall === hall && r.meal_period === meal);
        row[meal] = rows.length ? parseFloat((rows.reduce((s, r) => s + r.depletion_pct, 0) / rows.length * 100).toFixed(1)) : 0;
      }
      return row;
    });
  }, [inventory]);

  const scatterData = useMemo(() => {
    if (!filtered.length) return { depleted: [], active: [] };
    return {
      depleted: filtered.filter((r) => r.depleted === true),
      active: filtered.filter((r) => r.depleted !== true),
    };
  }, [filtered]);

  const depletionLog = useMemo(() => {
    if (!filtered.length) return [];
    return filtered
      .filter((r) => r.depleted === true)
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        return d !== 0 ? d : (a.depletion_time ?? "").localeCompare(b.depletion_time ?? "");
      });
  }, [filtered]);

  // Restock recommendations — uses full inventory (not filtered by day)
  const restockData = useMemo(() => {
    if (!inventory) return [];
    const invToSearch = selectedHall === "All Halls" ? inventory : inventory.filter((r) => r.hall === selectedHall);
    const map = new Map<string, { item_name: string; hall: string; meal_period: string; max_starting: number; served_sum: number; count: number }>();
    for (const row of invToSearch) {
      if (row.depleted !== true) continue;
      const key = `${row.item_id}__${row.hall}`;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { item_name: row.item_name, hall: row.hall, meal_period: row.meal_period, max_starting: row.starting_units, served_sum: row.units_served, count: 1 });
      } else {
        cur.served_sum += row.units_served;
        cur.count++;
        cur.max_starting = Math.max(cur.max_starting, row.starting_units);
      }
    }
    return Array.from(map.values())
      .map((v) => {
        const avg_served = Math.round(v.served_sum / v.count);
        const suggested = Math.ceil(avg_served * 1.15);
        const action = suggested > v.max_starting ? "Increase stock" : "Review timing";
        const actionColor = action === "Increase stock" ? "#F59E0B" : "#EF4444";
        return { ...v, avg_served, suggested, action, actionColor };
      })
      .sort((a, b) => b.suggested - a.suggested);
  }, [inventory, selectedHall]);

  const depTotalPages = Math.ceil(depletionLog.length / PAGE_SIZE);
  const depPageRows = depletionLog.slice((depPage - 1) * PAGE_SIZE, depPage * PAGE_SIZE);
  const restTotalPages = Math.ceil(restockData.length / PAGE_SIZE);
  const restPageRows = restockData.slice((restPage - 1) * PAGE_SIZE, restPage * PAGE_SIZE);

  if (!inventory) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 16 }}>{[0, 1, 2].map((i) => <SkeletonKpi key={i} />)}</div>
        <div style={{ display: "flex", gap: 16 }}>
          <SkeletonCard style={{ flex: 1 }} />
          <SkeletonCard style={{ flex: 1 }} />
        </div>
        <SkeletonCard height={400} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 16 }}>
        <KpiCard label="Items Depleted This Week" value={kpis!.depletedCount.toLocaleString()} />
        <KpiCard label="Avg Depletion Rate" value={kpis!.avgDepletion + "%"} />
        <KpiCard label="Highest Risk Hall" value={kpis!.highestRisk} />
      </div>

      {/* Charts row */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Where Food Runs Out Most" subtitle="Source: bu_dining_inventory.csv · avg depletion % by hall and meal" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={depletionBarData} barGap={2} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="hall" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }} itemStyle={{ color: "white" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} />
                {MEAL_ORDER.map((m) => (
                  <Bar key={m} dataKey={m} fill={MEAL_COLORS[m]} radius={[2, 2, 0, 0]} maxBarSize={18} name={m.charAt(0).toUpperCase() + m.slice(1)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Starting vs Remaining Inventory" subtitle="Source: bu_dining_inventory.csv · red = depleted, teal = active" style={{ height: "100%" }}>
            {!filtered.length ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="starting_units" type="number" name="Starting" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} label={{ value: "Starting Units", position: "insideBottom", offset: -8, fill: "#9fb0c7", fontSize: 11 }} />
                  <YAxis dataKey="units_remaining" type="number" name="Remaining" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={45} />
                  <ZAxis range={[20, 20]} />
                  <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }} />
                  <Scatter data={scatterData.active} fill="#00A896" opacity={0.7} />
                  <Scatter data={scatterData.depleted} fill="#EF4444" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Depletion Log */}
      <TableCard
        title="Depletion Log"
        subtitle="Source: bu_dining_inventory.csv · rows where depleted = true · sorted by date desc"
        count={`${depletionLog.length} depletion incidents`}
        headerRight={
          depletionLog.length > 0 && (
            <button
              onClick={() => downloadCsv(depletionLog)}
              className="mgr-no-print"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)", color: "white", fontFamily: "var(--font-body)", fontSize: 12, padding: "5px 10px", cursor: "pointer" }}
            >
              <Download size={14} />
              Download CSV
            </button>
          )
        }
      >
        {depletionLog.length === 0 ? (
          <EmptyState message="No depletion incidents for this selection" />
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-body)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Date", "Hall", "Meal", "Item Name", "Dietary Tags", "Depletion Time", "Units Served", "Starting Units"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depPageRows.map((row, i) => (
                  <HoverRow key={`${row.date}-${row.hall}-${row.item_id}`} even={i % 2 === 0}>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{row.date}</td>
                    <td style={{ padding: "10px 12px", color: "white", whiteSpace: "nowrap" }}>{HALL_DISPLAY[row.hall] ?? row.hall}</td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{row.meal_period}</td>
                    <td style={{ padding: "10px 12px", color: "white" }}>{row.item_name}</td>
                    <td style={{ padding: "10px 12px" }}>{parseDietaryTags(row.dietary_tags).map((tag) => <DietaryPill key={tag} tag={tag} />)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{row.depletion_time || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "white", textAlign: "right" }}>{row.units_served.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", color: "white", textAlign: "right" }}>{row.starting_units.toLocaleString()}</td>
                  </HoverRow>
                ))}
              </tbody>
            </table>
            <Paginator page={depPage} total={depTotalPages} onChange={setDepPage} />
          </>
        )}
      </TableCard>

      {/* Restock Recommendations */}
      {showRestockRecommendations && restockData.length > 0 && (
        <TableCard
          title="Restock Recommendations"
          subtitle="Suggested = avg units served on depleted days × 1.15 buffer"
          count={`${restockData.length} items flagged for restock review`}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-body)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Item Name", "Hall", "Meal", "Current Starting", "Avg Served (depleted days)", "Suggested Starting", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restPageRows.map((row, i) => (
                <HoverRow key={`${row.item_name}-${row.hall}`} even={i % 2 === 0}>
                  <td style={{ padding: "10px 12px", color: "white" }}>{row.item_name}</td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{HALL_DISPLAY[row.hall] ?? row.hall}</td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{row.meal_period}</td>
                  <td style={{ padding: "10px 12px", color: "white", textAlign: "right" }}>{row.max_starting.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "white", textAlign: "right" }}>{row.avg_served.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right", color: row.actionColor }}>{row.suggested.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ display: "inline-block", background: `${row.actionColor}22`, color: row.actionColor, border: `1px solid ${row.actionColor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {row.action}
                    </span>
                  </td>
                </HoverRow>
              ))}
            </tbody>
          </table>
          <Paginator page={restPage} total={restTotalPages} onChange={setRestPage} />
        </TableCard>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────
import type { ReactNode } from "react";

function TableCard({
  title, subtitle, count, headerRight, children,
}: {
  title: string; subtitle: string; count?: string; headerRight?: ReactNode; children: ReactNode;
}) {
  return (
    <div style={{ background: "var(--color-surface-1)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "var(--radius-xl)", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "white" }}>{title}</div>
          {count && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{count}</div>}
        </div>
        {headerRight}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: 20 }}>{subtitle}</div>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

function HoverRow({ even, children }: { even: boolean; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: hovered ? "var(--color-surface-2)" : even ? "transparent" : "rgba(255,255,255,0.01)", cursor: "default", transition: "background 120ms" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </tr>
  );
}

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: "var(--color-surface-2)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "var(--radius-sm)", padding: "4px 12px", color: disabled ? "var(--color-text-faint)" : "var(--color-text-primary)", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
  });
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 16 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Page {page} of {total}</span>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={btnStyle(page === 1)}>Prev</button>
      <button onClick={() => onChange(Math.min(total, page + 1))} disabled={page === total} style={btnStyle(page === total)}>Next</button>
    </div>
  );
}
