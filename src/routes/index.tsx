import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FootballIcon,
  Calendar01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "hugeicons-react";
import type { Match } from "@/lib/matches";
import { fetchHomeMatches } from "@/lib/api";
import {
  onScoreUpdated,
  onMomentumUpdated,
  onMatchPulseUpdated,
  onMatchFinished,
} from "@/lib/socket";
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
  // Initialize with empty arrays, load data from API
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [recent, setRecent] = useState<Match[]>([]);

  // Load data from the backend API.
  useEffect(() => {
    let cancelled = false;

    fetchHomeMatches()
      .then((data) => {
        if (cancelled) return;
        // Guard against malformed API responses
        if (Array.isArray(data?.live)) setLive(data.live);
        if (Array.isArray(data?.upcoming)) setUpcoming(data.upcoming);
        if (Array.isArray(data?.recent)) setRecent(data.recent);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Socket: update scores/minute on live cards without refetching
  useEffect(() => {
    const unsubScore = onScoreUpdated(({ matchId, homeScore, awayScore, minute }) => {
      setLive((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, home: { ...m.home, score: homeScore }, away: { ...m.away, score: awayScore }, minute }
            : m
        )
      );
    });

    const unsubMomentum = onMomentumUpdated(({ matchId, momentum }) => {
      setLive((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, momentum } : m))
      );
    });

    const unsubPulse = onMatchPulseUpdated(({ matchId, headline }) => {
      setLive((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, headline } : m))
      );
    });

    const unsubFinished = onMatchFinished(({ matchId, homeScore, awayScore, turningPoints }) => {
      setLive((prev) => {
        const finished = prev.find((m) => m.id === matchId);
        if (!finished) return prev;
        const updated: Match = {
          ...finished,
          status: "finished",
          home: { ...finished.home, score: homeScore },
          away: { ...finished.away, score: awayScore },
          turningPoints,
        };
        setRecent((r) => [updated, ...r]);
        return prev.filter((m) => m.id !== matchId);
      });
    });

    return () => {
      unsubScore();
      unsubMomentum();
      unsubPulse();
      unsubFinished();
    };
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
            viewAllTo="/recent"
          />
          {loading ? (
            <SectionSkeleton rows={2} />
          ) : recent.length === 0 ? (
            <EmptyState message="No recent matches." />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {recent.slice(0, 2).map((m) => (
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
  viewAllTo,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  viewAllTo?: string;
}) {
  return (
    <div className="flex items-center justify-between">
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
      {viewAllTo && (
        <Link
          to={viewAllTo as any}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight01Icon size={11} strokeWidth={2} />
        </Link>
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
  const [home = 0, draw = 0, away = 0] = match.winProbability ?? [0, 0, 0];
  const momentumLabel =
    Math.abs(match.momentum ?? 0) < 15
      ? "Balanced"
      : (match.momentum ?? 0) > 0
        ? match.home.name
        : match.away.name;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left — scoreboard + headline */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="live-dot" />
            <span className="text-foreground">LIVE · {match.minute}'</span>
            <span>·</span>
            <span>{match.stage}</span>
          </div>
          <div className="mt-3 flex justify-center lg:justify-start">
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
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:underline"
          >
            Open match
            <ArrowRight01Icon size={14} strokeWidth={2} />
          </Link>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-border" />
        <div className="lg:hidden h-px bg-border mx-4" />

        {/* Right — live stats panel */}
        <div className="lg:w-[220px] shrink-0 p-4 lg:p-5 flex flex-col gap-4">
          {/* Win probability */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Win probability
            </p>
            <div className="flex h-2 overflow-hidden rounded-full gap-0.5">
              <div className="bg-foreground rounded-l-full transition-[width] duration-700" style={{ width: `${home}%` }} />
              <div className="bg-muted-foreground/30 transition-[width] duration-700" style={{ width: `${draw}%` }} />
              <div className="bg-muted-foreground/60 rounded-r-full transition-[width] duration-700" style={{ width: `${away}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span className="text-foreground font-medium">{home}%</span>
              <span>{draw}% D</span>
              <span>{away}%</span>
            </div>
          </div>

          {/* Momentum */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Momentum</p>
              <span className="text-[10px] text-foreground font-medium">{momentumLabel}</span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]">
              <div
                className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700"
                style={{ width: `${50 + (match.momentum ?? 0) / 2}%` }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
            </div>
          </div>

          {/* Key stats */}
          <div className="space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stats</p>
            {[
              { label: "Possession", home: `${match.stats?.possession?.[0] ?? 0}%`, away: `${match.stats?.possession?.[1] ?? 0}%` },
              { label: "Shots", home: String(match.stats?.shots?.[0] ?? 0), away: String(match.stats?.shots?.[1] ?? 0) },
              { label: "xG", home: String(match.stats?.xg?.[0] ?? 0), away: String(match.stats?.xg?.[1] ?? 0) },
            ].map(({ label, home: h, away: a }) => (
              <div key={label} className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground w-6 text-left">{h}</span>
                <span className="text-muted-foreground flex-1 text-center">{label}</span>
                <span className="text-muted-foreground w-6 text-right">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const momentum = match.momentum ?? 0;
  const momentumLabel =
    Math.abs(momentum) < 15
      ? "Balanced"
      : momentum > 0
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
          <MomentumBar value={momentum} />
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
  const homePct = 50 + (value ?? 0) / 2;
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
