import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/AppLayout";
import { getLiveMatches, type Match } from "@/lib/matches";
import { Flag } from "@/components/Flag";
import { MomentumBar } from "@/routes/index";
import { SectionSkeleton } from "@/components/SkeletonLoader";
import { ArrowRight01Icon } from "hugeicons-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live — Pulse" },
      { name: "description", content: "All football matches happening right now." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<Match[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLive(getLiveMatches());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <TopBar title="Live" />
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
        {loading ? (
          <>
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-elevated)]" />
            <SectionSkeleton rows={3} />
          </>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              {live.length} {live.length === 1 ? "match" : "matches"} happening right now
            </p>
            {live.length === 0 ? (
              <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
                <div className="text-[32px]">⚽</div>
                <p className="text-[14px] font-medium text-foreground">No live matches right now</p>
                <p className="text-[13px] text-muted-foreground">
                  Check back when the next match kicks off.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {live.map((m) => (
                  <LiveMatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function LiveMatchCard({ match }: { match: Match }) {
  const momentumLabel =
    Math.abs(match.momentum) < 15
      ? "Balanced"
      : match.momentum > 0
        ? match.home.short
        : match.away.short;

  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{match.stage} · {match.competition}</span>
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <span className="live-dot" /> {match.minute}'
        </span>
      </div>
      <div className="space-y-2.5">
        <TeamLine name={match.home.name} code={match.home.short} score={match.home.score} />
        <TeamLine name={match.away.name} code={match.away.short} score={match.away.score} />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="uppercase tracking-widest">Momentum</span>
          <span className="text-foreground">{momentumLabel}</span>
        </div>
        <MomentumBar value={match.momentum} />
      </div>
      {match.headline && (
        <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{match.headline}</p>
      )}
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
        Open match
        <ArrowRight01Icon size={12} strokeWidth={2} />
      </div>
    </Link>
  );
}

function TeamLine({ name, code, score }: { name: string; code: string; score: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Flag code={code} size={18} />
        <span className="text-[14px] font-medium">{name}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{code}</span>
      </div>
      <span className="font-numeric text-[20px] font-bold">{score}</span>
    </div>
  );
}
