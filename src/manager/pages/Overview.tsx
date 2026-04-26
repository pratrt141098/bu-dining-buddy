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
  Label,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { loadSwipes, loadInventory, loadSummary } from "../data/loaders";
import type { SwipeRow, InventoryRow, SummaryRow } from "../data/types";
import {
  HALLS,
  HALL_COLORS,
  HALL_DISPLAY,
  DAY_ORDER,
  DAY_SHORT,
  CHART_GRID_STROKE,
  CHART_AXIS_STYLE,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "../data/constants";
import { useSettings } from "../context/SettingsContext";
import { ChartContainer } from "../components/ChartContainer";
import { KpiCard } from "../components/KpiCard";
import { SkeletonCard, SkeletonKpi } from "../components/SkeletonCard";

// ── Donut center label ────────────────────────────────────────
function DonutCenterLabel({ viewBox, total }: { viewBox?: { cx?: number; cy?: number }; total: number }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={26} fontWeight={700}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" fill="#9fb0c7" fontSize={11}>
        total swipes
      </text>
    </g>
  );
}

interface MealTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; pct: string } }>;
}

function MealTooltip({ active, payload }: MealTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600 }}>{d.name}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: 12, marginTop: 2 }}>
        {payload[0].value.toLocaleString()} swipes · {d.pct}
      </div>
    </div>
  );
}

// ── Forecast helpers ──────────────────────────────────────────
const CURRENT_HOUR = 11; // simulated "now": 11am = Lunch
const UPCOMING_MEAL = CURRENT_HOUR < 10 ? "breakfast" : CURRENT_HOUR < 15 ? "lunch" : "dinner";
const MEAL_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export default function Overview() {
  const { highDemandThreshold } = useSettings();
  const [swipes, setSwipes] = useState<SwipeRow[] | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [summary, setSummary] = useState<SummaryRow[] | null>(null);
  const loading = swipes === null || inventory === null || summary === null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSwipes(), loadInventory(), loadSummary()]).then(([sw, inv, sum]) => {
      if (!cancelled) { setSwipes(sw); setInventory(inv); setSummary(sum); }
    });
    return () => { cancelled = true; };
  }, []);

  const kpis = useMemo(() => {
    if (!swipes || !inventory) return null;
    const totalSwipes = swipes.length;
    const peakOccupancy = swipes.reduce((m, s) => Math.max(m, s.occupancy_rate), 0);
    const avgWaitMin = (swipes.reduce((s, r) => s + r.wait_time_sec, 0) / swipes.length / 60).toFixed(1);
    const depletionCount = inventory.filter((r) => r.depleted === true).length;
    return { totalSwipes, peakOccupancy, avgWaitMin, depletionCount };
  }, [swipes, inventory]);

  const dailyBarData = useMemo(() => {
    if (!swipes) return [];
    return DAY_ORDER.map((day) => {
      const row: Record<string, string | number> = { day: DAY_SHORT[day] };
      for (const hall of HALLS) {
        row[hall] = swipes.filter((s) => s.day_of_week === day && s.hall === hall).length;
      }
      return row;
    });
  }, [swipes]);

  const mealDonutData = useMemo(() => {
    if (!swipes) return [];
    const total = swipes.length;
    return ["breakfast", "lunch", "dinner"].map((m) => {
      const val = swipes.filter((s) => s.meal_period === m).length;
      return {
        name: m.charAt(0).toUpperCase() + m.slice(1),
        value: val,
        pct: ((val / total) * 100).toFixed(0) + "%",
      };
    });
  }, [swipes]);

  const hallCards = useMemo(() => {
    if (!swipes) return [];
    const thr = highDemandThreshold / 100;
    return HALLS.map((hall) => {
      const hs = swipes.filter((s) => s.hall === hall);
      const avgOcc = hs.length ? hs.reduce((s, r) => s + r.occupancy_rate, 0) / hs.length : 0;
      const byday = DAY_ORDER.map((d) => hs.filter((s) => s.day_of_week === d).length);
      const peakDayIdx = byday.indexOf(Math.max(...byday));
      const peakDay = DAY_SHORT[DAY_ORDER[peakDayIdx]];
      let status: string, statusColor: string;
      if (avgOcc > thr) { status = "High Demand"; statusColor = "#EF4444"; }
      else if (avgOcc >= 0.65) { status = "Moderate"; statusColor = "#F59E0B"; }
      else { status = "Low"; statusColor = "#00A896"; }
      return { hall, totalSwipes: hs.length, avgOcc, peakDay, status, statusColor };
    });
  }, [swipes, highDemandThreshold]);

  // Hall capacities from swipes (take first row per hall)
  const hallCapacities = useMemo(() => {
    if (!swipes) return {} as Record<string, number>;
    const caps: Record<string, number> = {};
    for (const s of swipes) {
      if (!caps[s.hall]) caps[s.hall] = s.hall_capacity;
      if (Object.keys(caps).length >= HALLS.length) break;
    }
    return caps;
  }, [swipes]);

  const forecastCards = useMemo(() => {
    if (!summary || !swipes) return [];
    const thr = highDemandThreshold / 100;
    return HALLS.map((hall) => {
      const rows = summary.filter((r) => r.hall === hall && r.meal_period === UPCOMING_MEAL);
      const avgSwipes = rows.length
        ? Math.round(rows.reduce((s, r) => s + r.total_swipes, 0) / rows.length)
        : 0;
      const capacity = hallCapacities[hall] ?? 1;
      const occ = avgSwipes / capacity;
      let status: string, statusColor: string;
      if (occ > thr) { status = "High Demand"; statusColor = "#EF4444"; }
      else if (occ >= 0.65) { status = "Moderate"; statusColor = "#F59E0B"; }
      else { status = "Low"; statusColor = "#00A896"; }
      return { hall, avgSwipes, occ, status, statusColor };
    });
  }, [summary, swipes, hallCapacities, highDemandThreshold]);

  const mealColors = [CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2]];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonKpi key={i} />)}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <SkeletonCard style={{ flex: "0 0 60%" }} />
          <SkeletonCard style={{ flex: "0 0 40%" }} />
        </div>
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Print-only header */}
      <div className="mgr-print-header">
        <div className="print-title">BU Dining Optimizer — Weekly Summary</div>
        <div className="print-subtitle">Apr 6–12, 2026 · Generated by Manager Dashboard</div>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 16 }}>
        <KpiCard label="Total Swipes This Week" value={kpis!.totalSwipes.toLocaleString()} trend="+12%" trendDir="up" />
        <KpiCard label="Peak Occupancy" value={(kpis!.peakOccupancy * 100).toFixed(0) + "%"} trend="+8%" trendDir="up" />
        <KpiCard label="Avg Wait Time" value={kpis!.avgWaitMin + " min"} trend="-5%" trendDir="down" />
        <KpiCard label="Depletion Incidents" value={kpis!.depletionCount.toLocaleString()} trend="+3%" trendDir="up" />
      </div>

      {/* Charts row */}
      <div className="mgr-no-print" style={{ display: "flex", gap: 16 }}>
        {/* Daily traffic by hall */}
        <div style={{ flex: "0 0 calc(60% - 8px)", minWidth: 0 }}>
          <ChartContainer title="Weekly Traffic by Hall" subtitle="Source: bu_dining_swipes_week.csv · 15-min Aramark delay">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyBarData} barGap={2} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="day" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{ ...TOOLTIP_STYLE, minWidth: 180 }}>
                        <div style={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 8 }}>{label}</div>
                        {payload.map((e, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color as string, display: "inline-block" }} />
                            <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}>{HALL_DISPLAY[e.name as string] ?? e.name}:</span>
                            <span style={{ fontWeight: 600 }}>{(e.value as number).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, color: "#9fb0c7" }} formatter={(val) => HALL_DISPLAY[val] ?? val} />
                {HALLS.map((hall) => (
                  <Bar key={hall} dataKey={hall} fill={HALL_COLORS[hall]} radius={[2, 2, 0, 0]} maxBarSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Meal period donut */}
        <div style={{ flex: "0 0 calc(40% - 8px)", minWidth: 0 }}>
          <ChartContainer title="Meal Period Split" subtitle="Source: bu_dining_swipes_week.csv · all halls, all days" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mealDonutData} cx="50%" cy="50%" innerRadius={72} outerRadius={108} paddingAngle={3} dataKey="value" label={false}>
                  {mealDonutData.map((_, i) => (
                    <Cell key={i} fill={mealColors[i]} />
                  ))}
                  <Label
                    content={(props) => (
                      <DonutCenterLabel viewBox={props.viewBox as { cx?: number; cy?: number }} total={swipes!.length} />
                    )}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<MealTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 12, color: "#9fb0c7", lineHeight: "24px" }}
                  formatter={(val, entry) => {
                    const d = (entry as { payload?: { pct: string } }).payload;
                    return `${val} — ${d?.pct ?? ""}`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Hall cards */}
      <div>
        <p className="section-label" style={{ marginBottom: 12 }}>AT-A-GLANCE: THIS WEEK</p>
        <div style={{ display: "flex", gap: 12 }}>
          {hallCards.map(({ hall, totalSwipes, avgOcc, peakDay, status, statusColor }) => (
            <div
              key={hall}
              style={{
                flex: 1,
                background: "var(--color-surface-1)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "var(--radius-xl)",
                padding: "18px 20px",
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "white", marginBottom: 12 }}>
                {HALL_DISPLAY[hall]}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Weekly swipes</span>
                  <span style={{ color: "white", fontWeight: 600 }}>{totalSwipes.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Avg occupancy</span>
                  <span style={{ color: "white", fontWeight: 600 }}>{(avgOcc * 100).toFixed(0)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Peak day</span>
                  <span style={{ color: "white", fontWeight: 600 }}>{peakDay}</span>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{ display: "inline-block", background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast section */}
      <div className="mgr-no-print">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 0 }}>
            FORECASTED TRAFFIC — NEXT MEAL PERIOD
          </p>
          <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>
            Simulated now: {CURRENT_HOUR}:00 → {MEAL_LABEL[UPCOMING_MEAL]}
          </span>
        </div>
        <div
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "var(--radius-xl)",
            padding: "18px 20px",
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 700, color: "white", marginBottom: 2 }}>
            Forecasted Traffic — Next Meal Period
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: 20 }}>
            Source: bu_dining_summary_stats.csv · 7-day historical average
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {forecastCards.map(({ hall, avgSwipes, occ, status, statusColor }) => (
              <div
                key={hall}
                style={{
                  flex: 1,
                  background: "var(--color-surface-2)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "white", marginBottom: 10 }}>
                  {HALL_DISPLAY[hall]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Forecast swipes</span>
                    <span style={{ color: "white", fontWeight: 700 }}>{avgSwipes.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Forecast occ.</span>
                    <span style={{ color: "white", fontWeight: 600 }}>{(occ * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-block", background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>
                    {status}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--color-text-faint)" }}>
                    <ArrowRight size={10} />
                    7-day avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
