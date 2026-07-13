import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FootballIcon,
  Calendar01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "hugeicons-react";
import { getLiveMatches, getUpcomingMatches, getRecentMatches, type Match } from "@/lib/matches";
import { Flag } from "@/components/Flag";
import { TopBar } from "@/components/AppLayout";
import { Scoreboard } from "@/components/Scoreboard";
import { SectionSkeleton, HeroSkeleton } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live matches — Pulse" },
      {
        name: "description",
        content:
          "Every live World Cup match with AI insights that explain the state of play in seconds.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [recent, setRecent] = useState<Match[]>([]);

  useEffect(() => {
    // Simulate brief data load (replace with real fetch when backend is running)
    const t = setTimeout(() => {
      setLive(getLiveMatches());
      setUpcoming(getUpcomingMatches());
      setRecent(getRecentMatches());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const featured = live[0];

  return (
    <>
      <TopBar title="Pulse" />
      <div className="mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8">
        {/* Hero — featured live match */}
        {loading ? (
          <HeroSkeleton />
        ) : featured ? (
          <FeaturedMatch match={featured} />
        ) : null}

        {/* Live now */}
        <section className="mt-8">
          <SectionHeader
            icon={<FootballIcon size={15} strokeWidth={1.75} />}
            label="Live now"
            count={loading ? undefined : live.length}
          />
          {loading ? (
            <SectionSkeleton rows={2} />
          ) : live.length === 0 ? (
            <EmptyState message="No live matches right now." />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {live.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section className="mt-8">
          <SectionHeader
            icon={<Calendar01Icon size={15} strokeWidth={1.75} />}
            label="Upcoming"
            count={loading ? undefined : upcoming.length}
          />
          {loading ? (
            <SectionSkeleton rows={2} />
          ) : upcoming.length === 0 ? (
            <EmptyState message="No upcoming matches scheduled." />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section className="mt-8">
          <SectionHeader
            icon={<Clock01Icon size={15} strokeWidth={1.75} />}
            label="Recent"
            count={loading ? undefined : recent.length}
          />
          {loading ? (
            <SectionSkeleton rows={2} />
          ) : recent.length === 0 ? (
            <EmptyState message="No recent matches." />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em]">
        {label}
      </span>
      {count !== undefined && (
        <span className="rounded-full border border-border px-1.5 py-0.5 font-numeric text-[9px] font-semibold">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-3 text-[13px] text-muted-foreground">{message}</p>
  );
}

function FeaturedMatch({ match }: { match: Match }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 lg:p-6">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="live-dot" />
        <span className="text-foreground">LIVE · {match.minute}'</span>
        <span>·</span>
        <span>{match.stage}</span>
      </div>
      <div className="mt-3">
        <Scoreboard
          home={match.home}
          away={match.away}
          minute={match.minute}
          status={match.status}
          size="lg"
        />
      </div>
      {match.headline && (
        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {match.headline}
        </p>
      )}
      <Link
        to="/match/$id"
        params={{ id: match.id }}
        className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:underline"
      >
        Open match
        <ArrowRight01Icon size={14} strokeWidth={2} />
      </Link>
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
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
      className="group block rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-foreground/25"
    >
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span className="truncate">{match.stage}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="live-dot" />
            {match.minute}'
          </span>
        ) : isFinished ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckmarkCircle01Icon size={10} strokeWidth={2} />
            FT
          </span>
        ) : (
          <span>{match.kickoff}</span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <TeamRow team={match.home} score={!match.status || match.status !== "upcoming" ? match.home.score : undefined} />
        <TeamRow team={match.away} score={!match.status || match.status !== "upcoming" ? match.away.score : undefined} />
      </div>

      {isLive && (
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="uppercase tracking-widest">Momentum</span>
            <span className="text-foreground">{momentumLabel}</span>
          </div>
          <MomentumBar value={match.momentum} />
        </div>
      )}

      {match.headline && !isLive && (
        <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {match.headline}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
        {isFinished ? "View result" : "Open match"}
        <ArrowRight01Icon size={12} strokeWidth={2} />
      </div>
    </Link>
  );
}

function TeamRow({
  team,
  score,
}: {
  team: { name: string; short: string };
  score?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Flag code={team.short} size={14} />
        <span className="truncate font-display text-[13px] font-semibold tracking-wide">
          {team.name}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {team.short}
        </span>
      </div>
      <span className="font-numeric text-[18px] font-bold leading-none">
        {score !== undefined ? score : <span className="text-[12px] font-medium text-muted-foreground">-</span>}
      </span>
    </div>
  );
}

export function MomentumBar({ value }: { value: number }) {
  const homePct = 50 + value / 2;
  return (
    <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]">
      <div
        className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700 ease-out"
        style={{ width: `${homePct}%` }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
    </div>
  );
}
