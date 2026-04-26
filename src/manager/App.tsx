import { HashRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "./context/FilterContext";
import { SettingsProvider } from "./context/SettingsContext";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import Overview from "./pages/Overview";
import Traffic from "./pages/Traffic";
import Inventory from "./pages/Inventory";
import MenuPerformance from "./pages/MenuPerformance";
import HallComparison from "./pages/HallComparison";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <SettingsProvider>
      <FilterProvider>
        <HashRouter>
          <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
            <Sidebar />
            <div
              className="mgr-content"
              style={{ marginLeft: 240, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}
            >
              <TopBar />
              <main
                className="mgr-main"
                style={{
                  flex: 1,
                  padding: "96px 32px 48px",
                  maxWidth: 1200,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/traffic" element={<Traffic />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/menu" element={<MenuPerformance />} />
                  <Route path="/halls" element={<HallComparison />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      </FilterProvider>
    </SettingsProvider>
  );
}
