import { useLocation } from "react-router-dom";
import { Printer } from "lucide-react";
import { useFilter } from "../context/FilterContext";
import { HALL_SELECTOR_OPTIONS, DAY_OPTIONS } from "../data/constants";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/traffic": "Traffic",
  "/inventory": "Inventory",
  "/menu": "Menu Performance",
  "/halls": "Hall Comparison",
  "/settings": "Settings",
};

export function TopBar() {
  const { selectedHall, selectedDay, setSelectedHall, setSelectedDay } = useFilter();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Overview";
  const isOverview = location.pathname === "/";

  return (
    <header
      className="mgr-topbar"
      style={{
        position: "fixed",
        top: 0,
        left: 240,
        right: 0,
        height: 64,
        background: "var(--color-surface-1)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 40,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 700,
          color: "white",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {isOverview && (
          <button
            className="mgr-no-print"
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "var(--radius-md)",
              color: "white",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              padding: "6px 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Printer size={14} />
            Export Shift Summary
          </button>
        )}

        <select
          value={selectedHall}
          onChange={(e) => setSelectedHall(e.target.value)}
          aria-label="Select hall"
        >
          {HALL_SELECTOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          aria-label="Select day"
        >
          {DAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
