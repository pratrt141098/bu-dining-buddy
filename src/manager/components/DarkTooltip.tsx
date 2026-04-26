import { TOOLTIP_STYLE } from "../data/constants";

interface TooltipPayload {
  name: string;
  value: number | string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Record<string, any>;
}

interface DarkTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number | string, name: string) => string;
}

export function DarkTooltip({ active, payload, label, formatter }: DarkTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div style={TOOLTIP_STYLE}>
      {label !== undefined && label !== "" && (
        <div style={{ color: "var(--color-text-muted)", marginBottom: 8, fontSize: 12 }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {formatter
              ? formatter(entry.value, entry.name)
              : typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Tooltip for scatter charts where payload[0].payload has the raw data object */
interface ScatterTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Array<{ payload: Record<string, any> }>;
}

export function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, marginBottom: 6, maxWidth: 200 }}>{d.item_name}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 2 }}>
        {d.hall} · {d.meal_period}
      </div>
      <div style={{ fontSize: 12, marginBottom: 2 }}>
        Starting: <strong>{d.starting_units}</strong>
      </div>
      <div style={{ fontSize: 12, marginBottom: 2 }}>
        Remaining: <strong>{d.units_remaining}</strong>
      </div>
      <div style={{ fontSize: 12 }}>
        Depletion:{" "}
        <strong style={{ color: d.depleted ? "#EF4444" : "#00A896" }}>
          {(d.depletion_pct * 100).toFixed(0)}%
        </strong>
      </div>
    </div>
  );
}
