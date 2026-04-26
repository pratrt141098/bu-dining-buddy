import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  Cell,
  LabelList,
} from "recharts";
import { loadSwipes } from "../data/loaders";
import type { SwipeRow } from "../data/types";
import {
  HALLS,
  HALL_COLORS,
  HALL_DISPLAY,
  DAY_ORDER,
  DAY_SHORT,
  MEAL_ORDER,
  MEAL_COLORS,
  CHART_GRID_STROKE,
  CHART_AXIS_STYLE,
  CHART_COLORS,
  PERSONA_LABELS,
  TOOLTIP_STYLE,
} from "../data/constants";
import { useFilter } from "../context/FilterContext";
import { useSettings } from "../context/SettingsContext";
import { ChartContainer } from "../components/ChartContainer";
import { SkeletonCard } from "../components/SkeletonCard";
import { EmptyState } from "../components/EmptyState";
import { DarkTooltip } from "../components/DarkTooltip";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

function hourLabel(h: number) {
  if (h === 12) return "12p";
  return `${h > 12 ? h - 12 : h}${h >= 12 ? "p" : "a"}`;
}

const WAIT_BINS = [
  { label: "Under 1 min", min: 0, max: 60, color: "#00A896" },
  { label: "1–2 min", min: 61, max: 120, color: "#00A896" },
  { label: "2–3 min", min: 121, max: 180, color: "#00A896" },
  { label: "3–5 min", min: 181, max: 300, color: "#F59E0B" },
  { label: "5+ min", min: 301, max: Infinity, color: "#EF4444" },
];

export default function Traffic() {
  const [swipes, setSwipes] = useState<SwipeRow[] | null>(null);
  const { selectedHall, selectedDay } = useFilter();
  const { showPersonaBreakdown } = useSettings();

  useEffect(() => {
    let cancelled = false;
    loadSwipes().then((sw) => { if (!cancelled) setSwipes(sw); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!swipes) return [];
    return swipes.filter(
      (s) =>
        (selectedHall === "All Halls" || s.hall === selectedHall) &&
        (selectedDay === "All Days" || s.day_of_week === selectedDay)
    );
  }, [swipes, selectedHall, selectedDay]);

  const dayCount = selectedDay === "All Days" ? 7 : 1;

  const hourlyData = useMemo(() => {
    if (!swipes || !filtered.length) return [];
    return HOURS.map((hour) => {
      const point: Record<string, string | number> = { label: hourLabel(hour), hour };
      if (selectedHall === "All Halls") {
        for (const hall of HALLS) {
          const cnt = filtered.filter((s) => s.hall === hall && s.swipe_hour === hour).length;
          point[hall] = Math.round(cnt / dayCount);
        }
      } else {
        const cnt = filtered.filter((s) => s.swipe_hour === hour).length;
        point["count"] = Math.round(cnt / dayCount);
      }
      return point;
    });
  }, [filtered, selectedHall, dayCount, swipes]);

  const occupancyData = useMemo(() => {
    if (!swipes) return [];
    return HALLS.map((hall) => {
      const row: Record<string, string | number> = { hall: HALL_DISPLAY[hall] };
      for (const meal of MEAL_ORDER) {
        const rows = swipes.filter((s) => s.hall === hall && s.meal_period === meal);
        row[meal] = rows.length ? parseFloat((rows.reduce((s, r) => s + r.occupancy_rate, 0) / rows.length * 100).toFixed(1)) : 0;
      }
      return row;
    });
  }, [swipes]);

  const waitData = useMemo(() => {
    if (!swipes) return [];
    const hallsToShow = selectedHall === "All Halls" ? HALLS : ([selectedHall] as string[]);
    return DAY_ORDER.map((day) => {
      const point: Record<string, string | number> = { day: DAY_SHORT[day] };
      for (const hall of hallsToShow) {
        const rows = swipes.filter((s) => s.hall === hall && s.day_of_week === day);
        point[hall] = rows.length ? parseFloat((rows.reduce((s, r) => s + r.wait_time_sec, 0) / rows.length / 60).toFixed(1)) : 0;
      }
      return point;
    });
  }, [swipes, selectedHall]);

  const personaData = useMemo(() => {
    if (!swipes) return [];
    return DAY_ORDER.map((day) => {
      const dayRows = filtered.filter((s) => s.day_of_week === day);
      const point: Record<string, string | number> = { day: DAY_SHORT[day] };
      for (const persona of Object.keys(PERSONA_LABELS)) {
        point[persona] = dayRows.filter((s) => s.persona === persona).length;
      }
      return point;
    });
  }, [filtered, swipes]);

  const waitDistData = useMemo(() => {
    if (!filtered.length) return [];
    return WAIT_BINS.map((b) => ({
      label: b.label,
      count: filtered.filter((s) => s.wait_time_sec >= b.min && s.wait_time_sec <= b.max).length,
      color: b.color,
    }));
  }, [filtered]);

  const hallsForWait = selectedHall === "All Halls" ? HALLS : ([selectedHall] as string[]);

  if (!swipes) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SkeletonCard height={360} />
        <div style={{ display: "flex", gap: 16 }}>
          <SkeletonCard style={{ flex: 1 }} />
          <SkeletonCard style={{ flex: 1 }} />
        </div>
        <SkeletonCard />
        <SkeletonCard height={260} />
      </div>
    );
  }

  const hasData = filtered.length > 0;
  const pageTitle = `${selectedHall} — ${selectedDay}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hourly line chart */}
      <ChartContainer
        title={`Swipe Volume by Hour — ${pageTitle}`}
        subtitle="Source: bu_dining_swipes_week.csv · 15-min Aramark delay · averaged across selected days"
      >
        {!hasData ? (
          <EmptyState />
        ) : selectedHall === "All Halls" ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 8 }}>{label}</div>
                    {payload.map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color as string, display: "inline-block" }} />
                        <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}>{HALL_DISPLAY[e.name as string] ?? e.name}:</span>
                        <span style={{ fontWeight: 600 }}>{e.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, color: "#9fb0c7" }} formatter={(v) => HALL_DISPLAY[v] ?? v} />
              <ReferenceLine x="12p" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: "Lunch peak", position: "insideTopRight", fill: "#9fb0c7", fontSize: 10 }} />
              {HALLS.map((hall) => (
                <Line key={hall} type="monotone" dataKey={hall} stroke={HALL_COLORS[hall]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A896" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00A896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<DarkTooltip formatter={(v) => String(v)} />} />
              <ReferenceLine x="12p" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: "Lunch peak", position: "insideTopRight", fill: "#9fb0c7", fontSize: 10 }} />
              <Area type="monotone" dataKey="count" name="Swipes" stroke="#00A896" strokeWidth={2.5} fill="url(#tealFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Occupancy by meal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Occupancy Rate by Meal Period" subtitle="Source: bu_dining_summary_stats.csv · avg across all selected days" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={occupancyData} layout="vertical" barGap={2} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="hall" type="category" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }} itemStyle={{ color: "white" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} />
                <ReferenceLine x={85} stroke="#F59E0B" strokeDasharray="4 3" label={{ value: "Capacity warning", position: "insideTopRight", fill: "#F59E0B", fontSize: 10 }} />
                {MEAL_ORDER.map((m) => (
                  <Bar key={m} dataKey={m} fill={MEAL_COLORS[m]} radius={[0, 3, 3, 0]} maxBarSize={14} name={m.charAt(0).toUpperCase() + m.slice(1)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Wait time by day */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartContainer title="Avg Wait Time by Day" subtitle="Source: bu_dining_swipes_week.csv · minutes per hall" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={waitData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="day" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}m`} />
                <Tooltip formatter={(v: number, name: string) => [`${v} min`, HALL_DISPLAY[name] ?? name]} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12 }} itemStyle={{ color: "white" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} formatter={(v) => HALL_DISPLAY[v] ?? v} />
                {hallsForWait.map((hall, i) => (
                  <Line key={hall} type="monotone" dataKey={hall} stroke={HALL_COLORS[hall] ?? CHART_COLORS[i % 5]} strokeWidth={2} dot={{ r: 3, fill: HALL_COLORS[hall] ?? CHART_COLORS[i % 5] }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Persona stacked bar */}
      {showPersonaBreakdown && (
        <ChartContainer title="Traffic by User Persona" subtitle="Source: bu_dining_swipes_week.csv · stacked swipe count by persona type">
          {!hasData ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={personaData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="day" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }} itemStyle={{ color: "white", fontSize: 12 }} formatter={(v: number, name: string) => [v.toLocaleString(), PERSONA_LABELS[name] ?? name]} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9fb0c7" }} formatter={(v) => PERSONA_LABELS[v] ?? v} />
                {Object.keys(PERSONA_LABELS).map((p, i) => (
                  <Bar key={p} dataKey={p} stackId="persona" fill={CHART_COLORS[i % 5]} maxBarSize={48} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      )}

      {/* Wait time distribution histogram */}
      <ChartContainer
        title="Wait Time Distribution"
        subtitle="Source: bu_dining_swipes_week.csv · filtered by selected hall + day"
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waitDistData} barCategoryGap="32%" margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 4 }}
                itemStyle={{ color: "white" }}
                formatter={(v: number) => [v.toLocaleString(), "Swipes"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={100}>
                {waitDistData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  formatter={(v: number) => v.toLocaleString()}
                  style={{ fill: "#9fb0c7", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
}
