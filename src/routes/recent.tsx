import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/AppLayout";
import { getRecentMatches, type Match } from "@/lib/matches";
import { Flag } from "@/components/Flag";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Location01Icon,
  PlayCircle02Icon,
} from "hugeicons-react";
import { SectionSkeleton, RecentCardSkeleton } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/recent")({
  head: () => ({
    meta: [
      { title: "Recent — Pulse" },
      { name: "description", content: "Recently finished FIFA World Cup 2026 matches." },
    ],
  }),
  component: RecentPage,
});

function RecentPage() {
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<Match[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRecent(getRecentMatches());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <TopBar title="Recent" />
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <RecentCardSkeleton key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
            <CheckmarkCircle01Icon size={32} strokeWidth={1.5} className="text-muted-foreground" />
            <p className="text-[14px] font-medium text-foreground">No recent matches yet</p>
            <p className="text-[13px] text-muted-foreground">
              Finished matches will appear here with full analysis.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              {recent.length} finished {recent.length === 1 ? "match" : "matches"}
            </p>
            <div className="mt-4 space-y-3">
              {recent.map((m) => (
                <RecentCard key={m.id} match={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function RecentCard({ match }: { match: Match }) {
  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckmarkCircle01Icon size={11} strokeWidth={2} />
          <span className="uppercase tracking-widest">Full-time · {match.stage}</span>
        </div>
        <span>{match.kickoff}</span>
      </div>

      {/* Score row */}
      <div className="flex items-center gap-4">
        <TeamScore name={match.home.name} code={match.home.short} score={match.home.score} />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-elevated)] text-[11px] font-bold text-muted-foreground">
          FT
        </div>
        <TeamScore name={match.away.name} code={match.away.short} score={match.away.score} align="right" />
      </div>

      {match.venue && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Location01Icon size={10} strokeWidth={2} />
          <span>{match.venue}</span>
        </div>
      )}

      {match.headline && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {match.headline}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <PlayCircle02Icon size={12} strokeWidth={2} />
          <span>Replay available</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
          Full analysis
          <ArrowRight01Icon size={12} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

function TeamScore({
  name,
  code,
  score,
  align = "left",
}: {
  name: string;
  code: string;
  score: number;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <Flag code={code} size={18} />
      <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
        <div className="text-[13px] font-semibold text-foreground">{name}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{code}</div>
      </div>
      <span className="font-numeric text-[22px] font-bold leading-none text-foreground">
        {score}
      </span>
    </div>
  );
}
