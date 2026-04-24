import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRightCircle,
  CheckCircle,
  MessageSquare,
  Minus,
  RefreshCw,
  Star,
  XCircle,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

// ─── placeholder data (wire to localStorage later) ───────────────────────────

const lastAdoptedHall = "Marciano Commons";
const lastAdoptedMeal = "dinner";
const lastAdoptedTime = "6:55 PM";
const lastAdoptedDate = "Yesterday";

// ─── constants ────────────────────────────────────────────────────────────────

const STAR_LABELS = [
  "",
  "Not great",
  "Below average",
  "It was okay",
  "Pretty good",
  "Excellent",
];

const WAIT_OPTS = ["< 5 min", "5–10 min", "10–20 min", "20+ min"] as const;

const FOOD_OPTS = [
  {
    Icon: CheckCircle,
    color: "#00A896",
    label: "Yes, everything I wanted was available",
    sublabel: "No issues finding something that matched my preferences",
    value: "full" as const,
  },
  {
    Icon: AlertTriangle,
    color: "#F59E0B",
    label: "Partially — some items were unavailable",
    sublabel: "A station or item I wanted had run out",
    value: "partial" as const,
  },
  {
    Icon: XCircle,
    color: "#EF4444",
    label: "No — couldn't find what I wanted",
    sublabel: "Nothing matched my dietary preferences or items were gone",
    value: "none" as const,
  },
];

const INFLUENCE_OPTS = [
  {
    Icon: ArrowRightCircle,
    color: "#00A896",
    label: "Yes — I went somewhere I wouldn't have otherwise",
    sublabel: "The recommendation sent me to a different hall",
    value: "yes" as const,
  },
  {
    Icon: RefreshCw,
    color: "#94A3B8",
    label: "Somewhat — it confirmed my choice",
    sublabel: "I was already thinking Marciano, and the app agreed",
    value: "somewhat" as const,
  },
  {
    Icon: Minus,
    color: "#64748B",
    label: "No — I would have gone here anyway",
    sublabel: "The app didn't factor into my decision",
    value: "no" as const,
  },
];

// ─── types ────────────────────────────────────────────────────────────────────

type FoodAvailability = "full" | "partial" | "none";
type Influence = "yes" | "somewhat" | "no";

type FeedbackEntry = {
  timestamp: string;
  hall: string;
  meal: string;
  time: string;
  starRating: number;
  waitTime: string;
  foodAvailability: FoodAvailability | "";
  influence: Influence | "";
  comment: string;
};

// ─── dot indicator ────────────────────────────────────────────────────────────

function DotIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-[7px]">
      {Array.from({ length: total }).map((_, i) => {
        const isCompleted = i < current;
        const isCurrent = i === current;
        return (
          <span
            key={i}
            style={
              isCompleted
                ? { width: 6, height: 6, backgroundColor: "#00A896", borderRadius: "50%" }
                : isCurrent
                  ? { width: 8, height: 8, backgroundColor: "#00A896", borderRadius: "50%" }
                  : {
                      width: 8,
                      height: 8,
                      backgroundColor: "var(--color-surface-2)",
                      border: "1px solid #00A896",
                      borderRadius: "50%",
                    }
            }
          />
        );
      })}
    </div>
  );
}

// ─── selectable card (Q3 / Q4) ───────────────────────────────────────────────

function SelectCard({
  Icon,
  color,
  label,
  sublabel,
  selected,
  onClick,
}: {
  Icon: React.ElementType;
  color: string;
  label: string;
  sublabel: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={
        selected
          ? { borderLeft: `2px solid ${color}`, backgroundColor: "var(--color-surface-2)" }
          : { backgroundColor: "var(--color-surface-1)" }
      }
      className="w-full min-h-[64px] flex items-center gap-3 px-4 py-3 rounded-lg-token text-left no-tap-highlight transition-colors"
    >
      <Icon
        className="shrink-0 w-6 h-6"
        style={{ color }}
        strokeWidth={2}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-body text-sm font-medium text-foreground leading-snug">
          {label}
        </span>
        <span className="font-body text-xs text-muted-foreground leading-snug">
          {sublabel}
        </span>
      </div>
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Feedback() {
  const navigate = useNavigate();

  // When wiring up: read from localStorage instead of hardcoded values.
  const hasAdopted = !!lastAdoptedHall;

  const [step, setStep] = useState(0);
  const [starRating, setStarRating] = useState(0); // 0 = none, 1–5
  const [waitTime, setWaitTime] = useState<string | null>(null);
  const [foodAvail, setFoodAvail] = useState<FoodAvailability | null>(null);
  const [influence, setInfluence] = useState<Influence | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    },
    [],
  );

  const handleStarSelect = (n: number) => {
    setStarRating(n);
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => setStep(1), 700);
  };

  const handleSubmit = () => {
    const entry: FeedbackEntry = {
      timestamp: new Date().toISOString(),
      hall: lastAdoptedHall,
      meal: lastAdoptedMeal,
      time: lastAdoptedTime,
      starRating,
      waitTime: waitTime ?? "",
      foodAvailability: foodAvail ?? "",
      influence: influence ?? "",
      comment,
    };
    const existing: FeedbackEntry[] = JSON.parse(
      localStorage.getItem("feedbackLog") ?? "[]",
    );
    localStorage.setItem("feedbackLog", JSON.stringify([...existing, entry]));
    setSubmitted(true);
  };

  // ── empty state ────────────────────────────────────────────────────────────
  if (!hasAdopted) {
    return (
      <MobileShell>
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 pb-16">
          <MessageSquare className="w-10 h-10" style={{ color: "#00A896" }} strokeWidth={1.5} />
          <div className="space-y-2">
            <p className="font-display text-[22px] font-bold text-foreground">
              No recommendation yet
            </p>
            <p className="font-body text-sm text-muted-foreground">
              Get a dining hall recommendation from the Home tab first, then
              come back here to share how it went.
            </p>
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <MobileShell>
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 pb-16">
          <CheckCircle
            className="w-12 h-12"
            style={{ color: "#00A896" }}
            strokeWidth={1.5}
          />
          <div className="space-y-2">
            <p className="font-display text-2xl font-bold text-foreground">
              Thanks — that helps.
            </p>
            <p className="font-body text-[15px] text-muted-foreground">
              Your feedback makes {lastAdoptedMeal} recommendations better for
              the BU crowd.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-2 min-h-[44px] w-full font-body text-sm font-medium rounded-lg-token py-3 no-tap-highlight"
            style={{ color: "#00A896", border: "1px solid #00A896" }}
          >
            Back to recommendations →
          </button>
        </div>
      </MobileShell>
    );
  }

  // ── next button disabled logic ─────────────────────────────────────────────
  const nextDisabled =
    (step === 1 && waitTime === null) ||
    (step === 2 && foodAvail === null) ||
    (step === 3 && influence === null);

  return (
    <MobileShell>
      <PageHeader />

      <div className="flex-1 flex flex-col px-4 pt-1 pb-4">
        {/* Dot progress */}
        <div className="mb-6">
          <DotIndicator total={5} current={step} />
        </div>

        {/* ── Q1: star rating ───────────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-display text-[22px] font-bold text-foreground leading-snug">
                How was {lastAdoptedHall} for {lastAdoptedMeal}?
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {lastAdoptedDate} at {lastAdoptedTime}
              </p>
            </div>

            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleStarSelect(n)}
                  className="flex-1 min-h-[48px] flex items-center justify-center no-tap-highlight"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className="w-8 h-8"
                    style={{
                      fill: n <= starRating ? "#00A896" : "none",
                      stroke: n <= starRating ? "#00A896" : "rgba(255,255,255,0.3)",
                      transition: "fill 150ms ease, stroke 150ms ease",
                    }}
                  />
                </button>
              ))}
            </div>

            <p
              className="font-body text-xs text-muted-foreground text-center transition-opacity duration-150"
              style={{ opacity: starRating > 0 ? 1 : 0 }}
            >
              {STAR_LABELS[starRating]}
            </p>
          </div>
        )}

        {/* ── Q2: wait time pills ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-display text-[22px] font-bold text-foreground leading-snug">
                How long did you actually wait?
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Our model predicted ~7 min for {lastAdoptedHall} at{" "}
                {lastAdoptedMeal}.
              </p>
            </div>

            <div className="flex gap-2">
              {WAIT_OPTS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setWaitTime(opt)}
                  className="flex-1 min-h-[44px] rounded-lg-token font-body text-sm font-medium no-tap-highlight transition-colors px-2 py-2"
                  style={
                    waitTime === opt
                      ? { backgroundColor: "#00A896", color: "#fff" }
                      : {
                          backgroundColor: "var(--color-surface-2)",
                          color: "hsl(var(--muted-foreground))",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Q3: food availability ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-display text-[22px] font-bold text-foreground leading-snug">
                Did you get to eat what you wanted?
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Based on your preference settings.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {FOOD_OPTS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  Icon={opt.Icon}
                  color={opt.color}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={foodAvail === opt.value}
                  onClick={() => setFoodAvail(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Q4: influence ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <p className="font-display text-[22px] font-bold text-foreground leading-snug">
              Did the app change where you went?
            </p>

            <div className="flex flex-col gap-3">
              {INFLUENCE_OPTS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  Icon={opt.Icon}
                  color={opt.color}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={influence === opt.value}
                  onClick={() => setInfluence(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Q5: open text ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-display text-[22px] font-bold text-foreground leading-snug">
                Anything else?
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Takes 10 seconds. Helps us improve {lastAdoptedMeal}{" "}
                recommendations at BU.
              </p>
            </div>

            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 280))}
                placeholder={`e.g. the halal station at ${lastAdoptedHall} ran out by 7:30...`}
                className="w-full rounded-lg-token px-3 py-3 font-body text-[15px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#00A896]"
                style={{
                  minHeight: 120,
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
              <span className="absolute bottom-2 right-3 font-body text-xs text-muted-foreground pointer-events-none">
                {comment.length} / 280
              </span>
            </div>
          </div>
        )}

        {/* ── navigation ────────────────────────────────────────────────── */}
        <div className="mt-auto pt-6">
          {step === 0 ? null : step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={nextDisabled}
              className="min-h-[44px] w-full rounded-lg-token font-body font-semibold text-sm no-tap-highlight transition-opacity"
              style={{
                backgroundColor: "#00A896",
                color: "#fff",
                opacity: nextDisabled ? 0.4 : 1,
                cursor: nextDisabled ? "default" : "pointer",
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="min-h-[44px] w-full rounded-lg-token font-body font-semibold text-sm no-tap-highlight"
              style={{ backgroundColor: "#00A896", color: "#fff" }}
            >
              Submit feedback
            </button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

// ─── shared page header ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Feedback
      </h1>
    </header>
  );
}
