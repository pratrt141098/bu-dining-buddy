import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { OccupancyRing } from "@/components/OccupancyRing";
import { StatusBadge } from "@/components/StatusBadge";
import { HALLS, HALL_MENUS, rankHalls } from "@/lib/dining";
import { usePreferences } from "@/context/PreferencesContext";

export default function HallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dietary, logAdoption } = usePreferences();

  const hall = HALLS.find(h => h.id === Number(id));

  const nextHallId = useMemo(() => {
    const ranked = rankHalls(HALLS, dietary);
    const next = ranked.find(h => h.id !== Number(id));
    return next?.id;
  }, [id, dietary]);

  if (!hall) {
    return (
      <MobileShell>
        <div className="px-5 py-10 text-center">
          <p className="text-muted-foreground">Hall not found.</p>
          <button onClick={() => navigate("/halls")} className="mt-4 text-primary font-semibold">← Back to all halls</button>
        </div>
      </MobileShell>
    );
  }

  const menu = HALL_MENUS[hall.id] ?? [];

  const handleHeading = () => {
    logAdoption();
    toast("Visit logged ✓", { duration: 3000, position: "bottom-center" });
    navigate("/confirmed");
  };

  return (
    <MobileShell hideTabBar>
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center hover:bg-muted no-tap-highlight"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg tracking-tight truncate">{hall.name}</h1>
      </header>

      {/* Ring */}
      <section className="px-5 pt-4 flex flex-col items-center">
        <OccupancyRing pct={hall.occupancy} />
        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={hall.status} />
          <span className="text-sm font-medium text-muted-foreground">·</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Clock className="w-3.5 h-3.5" /> ~{hall.waitMin} min predicted wait
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Updated 4 min ago • 15-min refresh</p>
      </section>

      {/* Menu */}
      <section className="px-5 mt-6">
        <h2 className="font-bold text-base mb-3">Today's highlights</h2>
        <div className="space-y-2.5">
          {menu.map(item => (
            <div key={item.name} className="ios-card px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-medium text-sm text-foreground">{item.name}</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {item.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-status-good/12 text-status-good text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {t} <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-32" />

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] z-40 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-background/80 border-t border-border">
        <button
          onClick={handleHeading}
          className="cta-shadow w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-base no-tap-highlight active:scale-[0.98] transition-transform"
        >
          I'm heading here
        </button>
        <button
          onClick={() => nextHallId && navigate(`/halls/${nextHallId}`)}
          className="mt-2 w-full text-primary font-semibold text-sm py-2 no-tap-highlight"
        >
          See another hall
        </button>
      </div>
    </MobileShell>
  );
}
