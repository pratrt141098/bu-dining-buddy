import { useState, useEffect, type ReactNode } from "react";
import { useSettings } from "../context/SettingsContext";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: value ? "#00A896" : "var(--color-surface-3)",
        border: "1px solid rgba(255,255,255,0.15)",
        position: "relative",
        cursor: "pointer",
        transition: "background 200ms",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: value ? 21 : 3,
          transition: "left 180ms ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function FieldRow({ label, sublabel, children }: { label: string; sublabel?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontFamily: "var(--font-body)", marginBottom: sublabel ? 3 : 0 }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{sublabel}</div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 700,
        color: "white",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginBottom: 20,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {title}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 72,
          background: "var(--color-surface-2)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "var(--radius-md)",
          color: "white",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          padding: "6px 10px",
          textAlign: "center",
          outline: "none",
        }}
      />
      {suffix && (
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{suffix}</span>
      )}
    </div>
  );
}

export default function Settings() {
  const s = useSettings();

  const [local, setLocal] = useState({
    occupancyWarningThreshold: s.occupancyWarningThreshold,
    depletionWarningThreshold: s.depletionWarningThreshold,
    highDemandThreshold: s.highDemandThreshold,
    showPersonaBreakdown: s.showPersonaBreakdown,
    showRestockRecommendations: s.showRestockRecommendations,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocal({
      occupancyWarningThreshold: s.occupancyWarningThreshold,
      depletionWarningThreshold: s.depletionWarningThreshold,
      highDemandThreshold: s.highDemandThreshold,
      showPersonaBreakdown: s.showPersonaBreakdown,
      showRestockRecommendations: s.showRestockRecommendations,
    });
  }, []);

  function handleSave() {
    s.update(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
        }}
      >
        {/* Section 1 */}
        <div style={{ marginBottom: 36 }}>
          <SectionHeading title="Alert Thresholds" />

          <FieldRow
            label="Occupancy Warning Threshold"
            sublabel="Show amber warning when occupancy exceeds this"
          >
            <NumberInput
              value={local.occupancyWarningThreshold}
              onChange={(v) => setLocal((p) => ({ ...p, occupancyWarningThreshold: v }))}
              min={1}
              max={100}
              suffix="%"
            />
          </FieldRow>

          <FieldRow
            label="Depletion Warning Threshold"
            sublabel="Show red flag when item depletion rate exceeds this"
          >
            <NumberInput
              value={local.depletionWarningThreshold}
              onChange={(v) => setLocal((p) => ({ ...p, depletionWarningThreshold: v }))}
              min={1}
              max={100}
              suffix="%"
            />
          </FieldRow>

          <FieldRow
            label="High Demand Badge Threshold"
            sublabel="Label a hall as 'High Demand' when avg occupancy exceeds this"
          >
            <NumberInput
              value={local.highDemandThreshold}
              onChange={(v) => setLocal((p) => ({ ...p, highDemandThreshold: v }))}
              min={1}
              max={100}
              suffix="%"
            />
          </FieldRow>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeading title="Display Preferences" />

          <FieldRow
            label="Show Persona Breakdown on Traffic page"
          >
            <Toggle
              value={local.showPersonaBreakdown}
              onChange={(v) => setLocal((p) => ({ ...p, showPersonaBreakdown: v }))}
            />
          </FieldRow>

          <FieldRow
            label="Show Restock Recommendations on Inventory page"
          >
            <Toggle
              value={local.showRestockRecommendations}
              onChange={(v) => setLocal((p) => ({ ...p, showRestockRecommendations: v }))}
            />
          </FieldRow>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            width: "100%",
            background: "#00A896",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "white",
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            padding: "12px 0",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          Save Settings
        </button>

        {saved && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#00A896",
              textAlign: "center",
              animation: "fadeIn 200ms ease",
            }}
          >
            ✓ Settings saved for this session
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "var(--color-text-faint)",
            textAlign: "center",
          }}
        >
          Settings reset on page refresh — no persistent storage in this build.
        </div>
      </div>
    </div>
  );
}
