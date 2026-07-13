import { ArrowRight01Icon } from "hugeicons-react";
import { Flag } from "@/components/Flag";

/**
 * Prediction-market style row: colored horizontal bar filled to a percentage,
 * with a label on the left, a percentage on the right and a chevron.
 */
interface Props {
  label: string;
  flagCode?: string;
  percent: number; // 0..100
  tone?: "primary" | "accent" | "muted" | "danger" | "warning";
  onClick?: () => void;
  suffix?: string;
}

const tones: Record<NonNullable<Props["tone"]>, { bg: string; fg: string; bar: string }> = {
  primary: {
    bg: "bg-[color-mix(in_oklab,var(--color-success)_18%,var(--color-card))]",
    fg: "text-[color-mix(in_oklab,var(--color-success)_85%,white)]",
    bar: "bg-[color-mix(in_oklab,var(--color-success)_28%,transparent)]",
  },
  accent: {
    bg: "bg-[color-mix(in_oklab,#a78bfa_18%,var(--color-card))]",
    fg: "text-[#c9b6ff]",
    bar: "bg-[color-mix(in_oklab,#a78bfa_28%,transparent)]",
  },
  muted: {
    bg: "bg-[var(--color-elevated)]",
    fg: "text-foreground",
    bar: "bg-[color-mix(in_oklab,var(--color-foreground)_10%,transparent)]",
  },
  danger: {
    bg: "bg-[color-mix(in_oklab,var(--color-danger)_16%,var(--color-card))]",
    fg: "text-[color-mix(in_oklab,var(--color-danger)_80%,white)]",
    bar: "bg-[color-mix(in_oklab,var(--color-danger)_26%,transparent)]",
  },
  warning: {
    bg: "bg-[color-mix(in_oklab,var(--color-warning)_14%,var(--color-card))]",
    fg: "text-[color-mix(in_oklab,var(--color-warning)_85%,white)]",
    bar: "bg-[color-mix(in_oklab,var(--color-warning)_26%,transparent)]",
  },
};

export function PredictionRow({
  label,
  flagCode,
  percent,
  tone = "muted",
  onClick,
  suffix = "%",
}: Props) {
  const t = tones[tone];
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center justify-between overflow-hidden rounded-lg ${t.bg} px-3 py-2.5 text-left transition-transform hover:scale-[1.005] active:scale-[0.995]`}
    >
      <div
        className={`absolute inset-y-0 left-0 ${t.bar} transition-[width] duration-700 ease-out`}
        style={{ width: `${clamped}%` }}
      />
      <div className="relative flex min-w-0 items-center gap-2">
        {flagCode && <Flag code={flagCode} size={14} />}
        <span className="truncate text-[13px] font-medium text-foreground">{label}</span>
      </div>
      <div className="relative flex items-center gap-1.5">
        <span className={`font-numeric text-[13px] font-semibold ${t.fg}`}>
          {clamped.toFixed(0)}
          {suffix}
        </span>
        <ArrowRight01Icon size={14} strokeWidth={2} className={t.fg} />
      </div>
    </button>
  );
}
