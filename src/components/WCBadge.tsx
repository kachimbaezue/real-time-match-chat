import wcLogo from "@/assets/wc-logo.png.asset.json";

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

// FIFA World Cup 2026 logo tag chip. Uses the official trophy logo asset.
export function WCBadge({ size = 20, showText = true, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-[var(--color-elevated)] pl-1.5 pr-3 py-1 ${className}`}
    >
      <span
        className="grid place-items-center rounded-full bg-background"
        style={{ width: size + 6, height: size + 6 }}
      >
        <img
          src={wcLogo.url}
          alt=""
          style={{ width: size, height: size }}
          className="object-contain"
        />
      </span>
      {showText && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
          FIFA World Cup 2026
        </span>
      )}
    </div>
  );
}
