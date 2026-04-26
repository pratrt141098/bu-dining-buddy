import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDir?: "up" | "down";
  /** Optional secondary line rendered below the value in xs muted text */
  subLabel?: string;
  /** When true, renders value at 18px instead of 36px (for name strings) */
  compact?: boolean;
}

export function KpiCard({ label, value, trend, trendDir = "up", subLabel, compact }: KpiCardProps) {
  const trendColor = trendDir === "up" ? "#00A896" : "#EF4444";
  const TrendIcon = trendDir === "up" ? TrendingUp : TrendingDown;

  return (
    <div
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "var(--radius-xl)",
        padding: "24px 28px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: compact ? 18 : 36,
          fontWeight: 700,
          color: "white",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          marginBottom: subLabel ? 4 : 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
      {subLabel && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-body)",
            marginBottom: 8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subLabel}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {label}
        </div>
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: trendColor,
            }}
          >
            <TrendIcon size={13} />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
