import { hourlyPredictions, type HourlyPoint } from "@/data/modelOutput";

interface Props {
  hallName: string;
}

const X_LABELS: { hour: number; label: string }[] = [
  { hour: 7, label: "7a" },
  { hour: 10, label: "10a" },
  { hour: 12, label: "12p" },
  { hour: 15, label: "3p" },
  { hour: 18, label: "6p" },
  { hour: 21, label: "9p" },
];

export function WaitTrendSparkline({ hallName }: Props) {
  const series: HourlyPoint[] = hourlyPredictions[hallName] ?? [];
  if (series.length === 0) return null;

  const W = 320;
  const H = 140;
  const padL = 32;
  const padR = 12;
  const padT = 14;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const minHour = 7;
  const maxHour = 21;
  const yMax = 8; // axis 0 → 8 min

  const x = (hour: number) =>
    padL + ((hour - minHour) / (maxHour - minHour)) * innerW;
  const y = (wait: number) =>
    padT + (1 - Math.min(wait, yMax) / yMax) * innerH;

  const points = series.map((p) => `${x(p.hour)},${y(p.waitMin)}`).join(" ");
  const areaPath =
    `M ${x(series[0].hour)},${padT + innerH} ` +
    series.map((p) => `L ${x(p.hour)},${y(p.waitMin)}`).join(" ") +
    ` L ${x(series[series.length - 1].hour)},${padT + innerH} Z`;

  const nowHour = new Date().getHours();
  const showNow = nowHour >= minHour && nowHour <= maxHour;
  const teal = "#00A896";

  return (
    <div className="ios-card p-4">
      <h3 className="font-bold text-base text-foreground mb-1">
        Predicted Wait Today (Monday)
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">
        GBM model · hour-by-hour forecast
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Predicted wait time chart for ${hallName}`}
      >
        {/* gridlines */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + innerH}
          stroke="hsl(0 0% 100% / 0.08)"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + innerH}
          x2={W - padR}
          y2={padT + innerH}
          stroke="hsl(0 0% 100% / 0.08)"
          strokeWidth={1}
        />

        {/* y axis labels */}
        <text
          x={padL - 6}
          y={y(0) + 3}
          textAnchor="end"
          fontSize="9"
          fill="hsl(var(--muted-foreground))"
        >
          0 min
        </text>
        <text
          x={padL - 6}
          y={y(yMax) + 3}
          textAnchor="end"
          fontSize="9"
          fill="hsl(var(--muted-foreground))"
        >
          8 min
        </text>

        {/* area fill */}
        <path d={areaPath} fill={teal} fillOpacity={0.12} />

        {/* line */}
        <polyline
          points={points}
          fill="none"
          stroke={teal}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* now marker */}
        {showNow && (
          <>
            <line
              x1={x(nowHour)}
              y1={padT}
              x2={x(nowHour)}
              y2={padT + innerH}
              stroke={teal}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
            <text
              x={x(nowHour)}
              y={padT - 4}
              textAnchor="middle"
              fontSize="9"
              fill={teal}
              fontWeight={600}
            >
              now
            </text>
          </>
        )}

        {/* x axis labels */}
        {X_LABELS.map((t) => (
          <text
            key={t.hour}
            x={x(t.hour)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="hsl(var(--muted-foreground))"
          >
            {t.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
