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
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="premium-shell relative isolate overflow-hidden w-full max-w-[390px] min-h-screen flex flex-col shadow-2xl">
        <main className={`screen-enter relative z-10 flex-1 flex flex-col ${hide ? "pb-6" : "pb-28"}`}>
          {children}
        </main>
        {!hide && <BottomTabBar />}
      </div>
    </div>
  );
}

function BottomTabBar() {
  return (
    <nav className="fixed bottom-2 inset-x-0 mx-auto max-w-[390px] z-40 rounded-2xl border border-white/10 bg-tabbar/92 backdrop-blur-lg shadow-xl">
      <div className="grid grid-cols-3 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-h-[44px] flex-col items-center justify-center gap-1 py-1.5 rounded-xl no-tap-highlight transition-all ${
                isActive ? "text-primary bg-white/5" : "text-tabbar-inactive"
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
