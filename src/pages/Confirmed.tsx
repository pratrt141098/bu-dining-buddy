import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export default function Confirmed() {
  return (
    <MobileShell hideTabBar>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center cta-shadow animate-in zoom-in duration-300">
          <Check className="w-12 h-12" strokeWidth={3} />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">Nice — we logged your visit.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Your recommendation adoption was counted toward this week's metric.
        </p>

        <div className="mt-8 ios-card px-5 py-4 w-full max-w-xs">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">This week</p>
          <p className="mt-1 text-2xl font-bold text-primary">142 lunch adoptions</p>
          <p className="text-xs text-muted-foreground">across campus</p>
        </div>

        <button className="mt-8 px-5 py-2.5 rounded-xl border border-border font-semibold text-sm text-foreground no-tap-highlight active:scale-[0.98] transition-transform">
          Rate your experience
        </button>

        <Link to="/" className="mt-6 text-primary font-semibold text-sm no-tap-highlight">
          ← Back to recommendations
        </Link>
      </div>
    </MobileShell>
  );
}
