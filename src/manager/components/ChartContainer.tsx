import type { ReactNode, CSSProperties } from "react";

interface ChartContainerProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function ChartContainer({ title, subtitle, children, style }: ChartContainerProps) {
  return (
    <div
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "var(--radius-xl)",
        padding: 24,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 700,
          color: "white",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-faint)",
          marginBottom: 20,
        }}
      >
        {subtitle}
      </div>
      {children}
    </div>
  );
}
