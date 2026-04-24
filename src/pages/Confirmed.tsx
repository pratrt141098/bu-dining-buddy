import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export default function Confirmed() {
  return (
    <MobileShell hideTabBar>
      <div className="flex-1 flex flex-col justify-center px-space-4">
        <div className="inline-flex min-h-[44px] items-center gap-space-2 px-space-3 py-space-2 rounded-sm-token bg-primary/15 text-primary font-body text-sm font-medium w-fit">
          <Check className="w-4 h-4" strokeWidth={3} />
          Visit logged
        </div>

        <h1 className="mt-space-4 font-display text-2xl font-bold tracking-tight text-foreground text-left">Nice — we logged your visit.</h1>
        <p className="mt-space-2 font-body text-sm text-muted-foreground max-w-xs text-left">
          Your recommendation adoption was counted toward this week's metric.
        </p>

        <div className="mt-space-8 ios-card px-space-4 py-space-4 w-full max-w-xs">
          <p className="font-body text-xs uppercase tracking-wider font-medium text-muted-foreground text-left">This week</p>
          <p className="mt-space-1 font-display text-2xl font-bold text-primary text-left">142 lunch adoptions</p>
          <p className="font-body text-xs text-muted-foreground text-left">across campus</p>
        </div>

        <button className="mt-space-8 min-h-[44px] px-space-4 py-space-2 rounded-lg-token border border-white/10 font-body font-medium text-sm text-foreground no-tap-highlight text-left w-fit">
          Rate your experience
        </button>

        <Link to="/" className="mt-space-6 min-h-[44px] inline-flex items-center text-primary font-body font-medium text-sm no-tap-highlight text-left w-fit">
          ← Back to recommendations
        </Link>
      </div>
    </MobileShell>
  );
}
