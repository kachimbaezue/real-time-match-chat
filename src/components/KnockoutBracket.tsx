import { Link } from "@tanstack/react-router";
import { Flag } from "@/components/Flag";
import type { Match } from "@/lib/matches";

interface Node {
  id?: string;
  home: { name: string; short: string; score?: number };
  away: { name: string; short: string; score?: number };
  status: Match["status"];
  minute?: number;
  kickoff?: string;
}

interface Props {
  semis: Node[]; // exactly 2 semis
  final: Node; // 1 final (may be TBD)
}

/**
 * SVG-connected knockout bracket. Two semis on the left, final on the right,
 * with proper elbow lines joining them.
 */
export function KnockoutBracket({ semis, final }: Props) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 lg:p-6">
      <div className="relative grid grid-cols-[1fr_60px_1fr] items-center gap-2 lg:gap-4">
        {/* Left: 2 semis stacked */}
        <div className="flex flex-col gap-6">
          {semis.map((n, i) => (
            <BracketCard key={i} node={n} />
          ))}
        </div>

        {/* Middle: connector lines (SVG) */}
        <div className="relative h-full min-h-[220px]">
          <BracketConnector />
        </div>

        {/* Right: final centered */}
        <div className="flex h-full items-center justify-center">
          <BracketCard node={final} highlight />
        </div>
      </div>
    </div>
  );
}

function BracketConnector() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 220"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Top semi → junction */}
      <path
        d="M 0 55 L 50 55 L 50 110"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      {/* Bottom semi → junction */}
      <path
        d="M 0 165 L 50 165 L 50 110"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      {/* Junction → final */}
      <path
        d="M 50 110 L 100 110"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="50" cy="110" r="2.5" fill="var(--color-foreground)" />
    </svg>
  );
}

function BracketCard({ node, highlight }: { node: Node; highlight?: boolean }) {
  const inner = (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border p-2.5 transition-colors ${
        highlight
          ? "border-[color-mix(in_oklab,var(--color-border)_50%,var(--color-warning)_40%)] bg-[color-mix(in_oklab,var(--color-warning)_6%,var(--color-card))]"
          : "border-border bg-[var(--color-elevated)] hover:border-foreground/30"
      }`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {highlight ? "Final" : node.status === "live" ? "Live" : "Semi-final"}
      </div>
      <BracketRow team={node.home} score={node.home.score} />
      <BracketRow team={node.away} score={node.away.score} />
      {node.status === "upcoming" && node.kickoff && (
        <div className="mt-0.5 text-[10px] text-muted-foreground">{node.kickoff}</div>
      )}
      {node.status === "live" && node.minute !== undefined && (
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-foreground">
          <span className="live-dot" /> {node.minute}'
        </div>
      )}
    </div>
  );

  if (node.id && node.status !== "finished") {
    return (
      <Link to="/match/$id" params={{ id: node.id }} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function BracketRow({
  team,
  score,
}: {
  team: { name: string; short: string };
  score?: number;
}) {
  const tbd = team.short === "TBD";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <div
          className={`h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ${
            tbd ? "bg-[var(--color-elevated)] ring-1 ring-inset ring-border" : ""
          }`}
        >
          {!tbd && <Flag code={team.short} size={12} />}
        </div>
        <span
          className={`truncate text-[12px] font-medium ${
            tbd ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {tbd ? "TBD" : team.short}
        </span>
      </div>
      <span
        className={`font-numeric text-[13px] font-semibold ${
          tbd ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {tbd || score === undefined ? "-" : score}
      </span>
    </div>
  );
}
