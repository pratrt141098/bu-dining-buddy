import type { CSSProperties } from "react";

interface SkeletonCardProps {
  height?: number;
  style?: CSSProperties;
}

export function SkeletonCard({ height = 300, style }: SkeletonCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "var(--radius-xl)",
        padding: 24,
        height,
        ...style,
      }}
    >
      <div className="skeleton-pulse" style={{ height: 16, width: "40%", marginBottom: 8 }} />
      <div className="skeleton-pulse" style={{ height: 11, width: "60%", marginBottom: 24 }} />
      <div className="skeleton-pulse" style={{ height: height - 100, width: "100%" }} />
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "var(--radius-xl)",
        padding: "24px 28px",
        flex: 1,
      }}
    >
      <div className="skeleton-pulse" style={{ height: 36, width: "55%", marginBottom: 12 }} />
      <div className="skeleton-pulse" style={{ height: 13, width: "80%" }} />
    </div>
  );
}
