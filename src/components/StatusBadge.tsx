import { HallStatus, statusTone } from "@/lib/dining";

export function StatusBadge({ status }: { status: HallStatus }) {
  const tone = statusTone(status);
  const cls = {
    good: "bg-status-good/15 text-status-good",
    warn: "bg-status-warn/15 text-status-warn",
    bad: "bg-status-bad/15 text-status-bad",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
