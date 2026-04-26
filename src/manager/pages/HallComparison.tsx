import { useEffect, useMemo, useState } from "react";
import { loadSwipes, loadInventory, loadSummary } from "../data/loaders";
import type { SwipeRow, InventoryRow, SummaryRow } from "../data/types";
import {
  HALLS,
  HALL_COLORS,
  HALL_DISPLAY,
  DAY_ORDER,
  DAY_SHORT,
  MEAL_ORDER,
  CHART_GRID_STROKE,
  CHART_AXIS_STYLE,
} from "../data/constants";
import { ChartContainer } from "../components/ChartContainer";
import { SkeletonCard } from "../components/SkeletonCard";

// Inline SVG sparkline
function Sparkline({ data, width = 120, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (!data.length || data.every((d) => d === 0)) {
    return <div style={{ width, height, opacity: 0.2, background: "var(--color-surface-2)", borderRadius: 3 }} />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 3;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
      const y = height - pad - ((val - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke="#00A896"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface HallMetrics {
  hall: string;
  totalSwipes: number;
  avgOcc: number;
  peakMeal: string;
  mostDepletedItem: string;
  avgWaitMin: string;
  dailyTrend: number[];
}

export default function HallComparison() {
  const [swipes, setSwipes] = useState<SwipeRow[] | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [summary, setSummary] = useState<SummaryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSwipes(), loadInventory(), loadSummary()]).then(([sw, inv, sum]) => {
      if (!cancelled) { setSwipes(sw); setInventory(inv); setSummary(sum); }
    });
    return () => { cancelled = true; };
  }, []);

  const hallMetrics = useMemo((): HallMetrics[] => {
    if (!swipes || !inventory || !summary) return [];
    return HALLS.map((hall) => {
      const hs = swipes.filter((s) => s.hall === hall);
      const avgOcc = hs.length ? hs.reduce((s, r) => s + r.occupancy_rate, 0) / hs.length : 0;
      const avgWaitMin = hs.length
        ? (hs.reduce((s, r) => s + r.wait_time_sec, 0) / hs.length / 60).toFixed(1)
        : "0";

      // Peak meal from summary
      const hallSum = summary.filter((r) => r.hall === hall);
      const mealOcc = MEAL_ORDER.map((m) => {
        const rows = hallSum.filter((r) => r.meal_period === m);
        return { meal: m, avg: rows.length ? rows.reduce((s, r) => s + r.avg_occupancy, 0) / rows.length : 0 };
      });
      const peakMeal = mealOcc.sort((a, b) => b.avg - a.avg)[0]?.meal ?? "—";

      // Most depleted item
      const hallInv = inventory.filter((r) => r.hall === hall);
      const itemDep = new Map<string, { name: string; pct: number }>();
      for (const row of hallInv) {
        const cur = itemDep.get(row.item_id);
        if (!cur || row.depletion_pct > cur.pct) {
          itemDep.set(row.item_id, { name: row.item_name, pct: row.depletion_pct });
        }
      }
      const sorted = Array.from(itemDep.values()).sort((a, b) => b.pct - a.pct);
      const mostDepletedItem = sorted[0]?.name ?? "—";

      // Daily trend
      const dailyTrend = DAY_ORDER.map((d) => hs.filter((s) => s.day_of_week === d).length);

      return { hall, totalSwipes: hs.length, avgOcc, peakMeal, mostDepletedItem: mostDepletedItem.length > 22 ? mostDepletedItem.slice(0, 22) + "…" : mostDepletedItem, avgWaitMin, dailyTrend };
    });
  }, [swipes, inventory, summary]);

  // Heatmap: hall × hour (7–21), avg swipes per bin
  const heatmap = useMemo(() => {
    if (!swipes) return { data: [], maxVal: 0 };
    const hours = Array.from({ length: 15 }, (_, i) => i + 7);
    const data = HALLS.map((hall) => {
      const row = { hall };
      for (const hour of hours) {
        const bins = new Map<string, number>();
        const hs = swipes.filter((s) => s.hall === hall && s.swipe_hour === hour);
        for (const s of hs) {
          if (!bins.has(s.ts_bin)) bins.set(s.ts_bin, s.bin_swipe_count);
        }
        const counts = Array.from(bins.values());
        (row as Record<string, string | number>)[`h${hour}`] = counts.length
          ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
          : 0;
      }
      return row as Record<string, string | number>;
    });
    let maxVal = 0;
    for (const row of data) {
      for (const k of Object.keys(row)) {
        if (k.startsWith("h")) maxVal = Math.max(maxVal, row[k] as number);
      }
    }
    return { data, maxVal };
  }, [swipes]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  function hourLabel(h: number) {
    if (h === 12) return "12p";
    return `${h > 12 ? h - 12 : h}${h >= 12 ? "p" : "a"}`;
  }

  function heatColor(val: number, max: number): string {
    if (!val || !max) return "var(--color-surface-1)";
    const t = Math.min(1, val / max);
    // Interpolate between surface-1 (#1e293b) and #00A896
    const r = Math.round(0x1e + (0x00 - 0x1e) * t);
    const g = Math.round(0x29 + (0xa8 - 0x29) * t);
    const b = Math.round(0x3b + (0x96 - 0x3b) * t);
    return `rgb(${r},${g},${b})`;
  }

  if (!swipes || !inventory || !summary) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} height={280} />)}
        </div>
        <SkeletonCard height={240} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hall comparison cards — 3+2 grid */}
      <div>
        <p className="section-label" style={{ marginBottom: 12 }}>HALL METRICS THIS WEEK</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {hallMetrics.map(({ hall, totalSwipes, avgOcc, peakMeal, mostDepletedItem, avgWaitMin, dailyTrend }) => (
            <div
              key={hall}
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "var(--radius-xl)",
                padding: "22px 22px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {HALL_DISPLAY[hall]}
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: HALL_COLORS[hall],
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Metrics table */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, marginBottom: 16 }}>
                {[
                  { label: "Weekly swipes", value: totalSwipes.toLocaleString() },
                  { label: "Avg occupancy", value: (avgOcc * 100).toFixed(0) + "%" },
                  { label: "Peak meal", value: peakMeal.charAt(0).toUpperCase() + peakMeal.slice(1) },
                  { label: "Most depleted", value: mostDepletedItem },
                  { label: "Avg wait", value: avgWaitMin + " min" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                    <span style={{ color: "white", fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Sparkline */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: "var(--color-text-faint)", marginBottom: 6 }}>
                  Daily swipe trend (Mon–Sun)
                </div>
                <Sparkline data={dailyTrend} width={160} height={38} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  {DAY_ORDER.map((d) => (
                    <span key={d} style={{ fontSize: 9, color: "var(--color-text-faint)" }}>
                      {DAY_SHORT[d].slice(0, 1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "var(--radius-xl)",
          padding: 24,
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>
          Average Hourly Traffic Heatmap (All Days)
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: 20 }}>
          Source: bu_dining_swipes_week.csv · 15-min Aramark delay
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-faint)", marginBottom: 6 }}>
          Values = avg swipes per 15-min bin
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${hours.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
          <div />
          {hours.map((h) => (
            <div key={h} style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-muted)", padding: "2px 0" }}>
              {hourLabel(h)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {heatmap.data.map((row) => {
          const hall = row.hall as string;
          return (
            <div
              key={hall}
              style={{ display: "grid", gridTemplateColumns: `120px repeat(${hours.length}, 1fr)`, gap: 3, marginBottom: 3 }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  paddingRight: 8,
                }}
              >
                {HALL_DISPLAY[hall]}
              </div>
              {hours.map((h) => {
                const val = row[`h${h}`] as number;
                const bg = heatColor(val, heatmap.maxVal);
                return (
                  <div
                    key={h}
                    title={`${HALL_DISPLAY[hall]} · ${hourLabel(h)} · avg ${val} swipes/bin`}
                    style={{
                      background: bg,
                      borderRadius: 4,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}
                  >
                    {val >= 3 && (
                      <span style={{ fontSize: 9, color: val / heatmap.maxVal > 0.5 ? "rgba(255,255,255,0.9)" : "var(--color-text-muted)" }}>
                        {val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>Low</span>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: "linear-gradient(to right, var(--color-surface-1), #00A896)",
              maxWidth: 200,
            }}
          />
          <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>High</span>
        </div>
      </div>
    </div>
  );
}
