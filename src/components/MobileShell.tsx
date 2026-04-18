import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, LayoutGrid, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/halls", label: "All Halls", icon: LayoutGrid },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileShell({ children, hideTabBar = false }: { children: ReactNode; hideTabBar?: boolean }) {
  const { pathname } = useLocation();
  // Hide tab bar on confirmation & detail screens
  const hide = hideTabBar || pathname.startsWith("/halls/") || pathname === "/confirmed";

  return (
    <div className="min-h-screen w-full flex justify-center bg-muted">
      <div className="relative w-full max-w-[430px] min-h-screen bg-background flex flex-col shadow-xl">
        <main className={`flex-1 flex flex-col ${hide ? "pb-6" : "pb-24"}`}>
          {children}
        </main>
        {!hide && <BottomTabBar />}
      </div>
    </div>
  );
}

function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="grid grid-cols-3 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 no-tap-highlight transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-[11px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
