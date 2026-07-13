import { Flag } from "@/components/Flag";

/**
 * Scoreboard block inspired by broadcast/FIFA scoreboards.
 * A tight horizontal strip: [white block: flag + CODE][dark block: score]
 * for each team, joined seamlessly.
 */
interface Props {
  home: { short: string; score: number; name: string };
  away: { short: string; score: number; name: string };
  minute?: number;
  status: "live" | "upcoming" | "finished";
  kickoff?: string;
  size?: "sm" | "md" | "lg";
}

export function Scoreboard({ home, away, minute, status, kickoff, size = "md" }: Props) {
  const isLive = status === "live";
  const isUpcoming = status === "upcoming";

  const sizes = {
    sm: { h: "h-9", code: "text-[10px]", score: "text-[14px]", flag: 12 },
    md: { h: "h-11", code: "text-[11px]", score: "text-[18px]", flag: 14 },
    lg: { h: "h-14", code: "text-[13px]", score: "text-[24px]", flag: 18 },
  }[size];

  return (
    <div className="inline-flex overflow-hidden rounded-md shadow-[0_0_0_1px_var(--color-border)]">
      {/* Home team block */}
      <TeamBlock
        code={home.short}
        flagSize={sizes.flag}
        h={sizes.h}
        codeSize={sizes.code}
      />
      {/* Home score */}
      <div
        className={`${sizes.h} flex min-w-[38px] items-center justify-center bg-black px-2 font-display font-bold text-white ${sizes.score} font-numeric`}
      >
        {isUpcoming ? "-" : home.score}
      </div>
      {/* Center minute pill */}
      <div className={`${sizes.h} flex items-center justify-center bg-[#0a1f5c] px-3 text-white`}>
        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="font-display text-[11px] font-bold tracking-wider">{minute}'</span>
          </div>
        ) : (
          <span className="font-display text-[10px] font-semibold uppercase tracking-widest">
            {kickoff ?? "vs"}
          </span>
        )}
      </div>
      {/* Away score */}
      <div
        className={`${sizes.h} flex min-w-[38px] items-center justify-center bg-black px-2 font-display font-bold text-white ${sizes.score} font-numeric`}
      >
        {isUpcoming ? "-" : away.score}
      </div>
      {/* Away team block */}
      <TeamBlock
        code={away.short}
        flagSize={sizes.flag}
        h={sizes.h}
        codeSize={sizes.code}
      />
    </div>
  );
}

function TeamBlock({
  code,
  flagSize,
  h,
  codeSize,
}: {
  code: string;
  flagSize: number;
  h: string;
  codeSize: string;
}) {
  return (
    <div className={`${h} flex items-center gap-1.5 bg-white px-2.5 text-black`}>
      <Flag code={code} size={flagSize} />
      <span className={`font-display font-bold tracking-wider ${codeSize}`}>{code}</span>
    </div>
  );
}
