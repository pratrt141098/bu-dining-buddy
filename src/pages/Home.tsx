import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyBar } from "@/components/OccupancyBar";
import { HALLS, rankHalls } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const navigate = useNavigate();
  const { name, dietary } = usePreferences();
  const ranked = useMemo(() => rankHalls(HALLS, dietary).slice(0, 3), [dietary]);

  // Maintain a display order over the ranked list (indices into `ranked`)
  const [order, setOrder] = useState<number[]>(() => ranked.map((_, i) => i));
  const [fading, setFading] = useState(false);

  // Reset order if the underlying ranking changes (e.g. dietary updates)
  useEffect(() => {
    setOrder(ranked.map((_, i) => i));
  }, [ranked]);

  const swapTopTwo = () => {
    if (order.length < 2 || fading) return;
    setFading(true);
    window.setTimeout(() => {
      setOrder(prev => {
        const next = [...prev];
        [next[0], next[1]] = [next[1], next[0]];
        return next;
      });
      // Allow the new order to mount, then fade back in
      window.setTimeout(() => setFading(false), 30);
    }, 250);
  };

  const display = order.map(i => ranked[i]).filter(Boolean);

  return (
    <MobileShell>
      {/* Top bar */}
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">BU</div>
          <h1 className="font-bold text-base tracking-tight">BU Dining</h1>
        </div>
        <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm no-tap-highlight">
          {name.charAt(0)}
        </Link>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-2 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{greeting()}, {name}</h2>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Lunch ends in 2h 14m — here's where to go
        </p>
      </section>

      {/* Recommendation cards */}
      <section className="px-5 space-y-4">
        {display.map((hall, idx) => {
          // Only the top two cards participate in the swap fade
          const isSwapping = fading && idx < 2;
          return (
            <article
              key={hall.id}
              className={`ios-card p-4 relative transition-opacity duration-300 ease-out ${
                isSwapping ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-base text-foreground truncate">{hall.name}</h3>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> ~{hall.waitMin} min wait
                </span>
              </div>

              <OccupancyBar pct={hall.occupancy} />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {hall.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-status-good/12 text-status-good text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {t} <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate(`/halls/${hall.id}`)}
                className="cta-shadow mt-4 w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 no-tap-highlight active:scale-[0.98] transition-transform"
              >
                Go Here <ArrowRight className="w-4 h-4" />
              </button>

              {idx === 0 && display.length > 1 && (
                <button
                  onClick={swapTopTwo}
                  disabled={fading}
                  className="mt-2 w-full text-primary font-semibold text-sm py-2 no-tap-highlight disabled:opacity-60"
                >
                  Next Best Rec →
                </button>
              )}
            </article>
          );
        })}

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Predicted wait times • 15-min refresh
        </p>
      </section>
    </MobileShell>
  );
}
