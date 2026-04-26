import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Package, UtensilsCrossed, BarChart2, Settings2 } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/traffic", label: "Traffic", icon: TrendingUp },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/menu", label: "Menu Performance", icon: UtensilsCrossed },
  { path: "/halls", label: "Hall Comparison", icon: BarChart2 },
  { path: "/settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="mgr-sidebar"
      style={{
        width: 240,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "var(--color-surface-1)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <img src="/bu_dining_buddy_logo.svg" alt="BU Dining Buddy" style={{ height: 36, width: "auto" }} />
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            marginTop: 6,
            fontFamily: "var(--font-body)",
          }}
        >
          Manager View
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                textDecoration: "none",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                color: isActive ? "#00A896" : "var(--color-text-muted)",
                background: isActive ? "var(--color-surface-2)" : "transparent",
                borderLeft: isActive ? "3px solid #00A896" : "3px solid transparent",
                transition: "color 180ms ease, background 180ms ease",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Data caveat */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
          color: "var(--color-text-faint)",
          lineHeight: 1.6,
        }}
      >
        Data: 15-min delay (Aramark system) · Apr 6–12 2026
      </div>
    </aside>
  );
}
