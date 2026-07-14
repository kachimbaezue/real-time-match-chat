import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  ArrowLeft01Icon,
  Share01Icon,
  PlayCircle02Icon,
  FlashIcon,
  FootballIcon,
  CircleIcon,
  Square01Icon,
  ArrowDataTransferHorizontalIcon,
  Flag01Icon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  ChartLineData02Icon,
  StopCircleIcon,
  Location01Icon,
} from "hugeicons-react";
import { getMatch, type Match, type TimelineEvent } from "@/lib/matches";
import { fetchMatch } from "@/lib/api";
import {
  onScoreUpdated,
  onStatsUpdated,
  onTimelineUpdated,
  onMomentumUpdated,
  onMatchPulseUpdated,
  onWinProbabilityUpdated,
  onJoinedNowUpdated,
  onMatchFinished,
} from "@/lib/socket";
import { Flag } from "@/components/Flag";
import { Scoreboard } from "@/components/Scoreboard";
import { PredictionRow } from "@/components/PredictionRow";
import { MomentumBar } from "@/routes/index";
import { MatchDetailSkeleton } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/match/$id")({
  loader: async ({ params }) => {
    // Try real API first, fall back to static mock
    try {
      return await fetchMatch(params.id);
    } catch {
      const match = getMatch(params.id);
      if (!match) throw notFound();
      return match;
    }
  },
  head: ({ loaderData: m }) => ({
    meta: [
      {
        title: m
          ? `${m.home.name} ${m.home.score}–${m.away.score} ${m.away.name} — Pulse`
          : "Match — Pulse",
      },
      { name: "description", content: m?.headline ?? "Live football insights from Pulse." },
    ],
  }),
  component: MatchPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Match not found.</div>
  ),
});

function MatchPage() {
  const loaderMatch = Route.useLoaderData();
  // Local state so socket updates re-render without a page reload
  const [match, setMatch] = useState<Match>(loaderMatch);
  const isFinished = match.status === "finished";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMatch(loaderMatch);
  }, [loaderMatch.id]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, [match.id]);

  // Wire all socket events scoped to this match
  useEffect(() => {
    const id = match.id;

    const unsubs = [
      onScoreUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({
          ...m,
          home: { ...m.home, score: p.homeScore },
          away: { ...m.away, score: p.awayScore },
          minute: p.minute,
        }));
      }),
      onStatsUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({ ...m, stats: p.stats }));
      }),
      onTimelineUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({
          ...m,
          timeline: [p.event, ...m.timeline],
        }));
      }),
      onMomentumUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({ ...m, momentum: p.momentum }));
      }),
      onMatchPulseUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({ ...m, pulse: p.pulse, headline: p.headline }));
      }),
      onWinProbabilityUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({ ...m, winProbability: p.winProbability }));
      }),
      onJoinedNowUpdated((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({ ...m, joinedNow: p.joinedNow }));
      }),
      onMatchFinished((p) => {
        if (p.matchId !== id) return;
        setMatch((m) => ({
          ...m,
          status: "finished",
          home: { ...m.home, score: p.homeScore },
          away: { ...m.away, score: p.awayScore },
          turningPoints: p.turningPoints,
        }));
      }),
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [match.id]);

  if (!ready) {
    return (
      <>
        <MatchHeader match={match} />
        <MatchDetailSkeleton />
      </>
    );
  }

  return (
    <>
      <MatchHeader match={match} />
      <div className="mx-auto max-w-6xl px-4 py-4 pb-8 lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <ScoreboardCard match={match} />
            {match.pulse.length > 0 && <MatchPulseCard match={match} />}
            {!isFinished && <WinProbabilityCard match={match} />}
            {match.momentum !== 0 && <MomentumCard match={match} />}
            <StatsCard match={match} />
            {isFinished && match.turningPoints && (
              <TurningPointsCard match={match} />
            )}
            {isFinished && <WinProbabilityCard match={match} />}
            {match.timeline.length > 0 && (
              <TimelineCard events={match.timeline} match={match} />
            )}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-16 lg:h-fit">
            {match.joinedNow.length > 0 && <JoinedNowCard match={match} />}
            <ReplayCard match={match} />
          </aside>
        </div>
      </div>
    </>
  );
}

function MatchHeader({ match }: { match: Match }) {
  const [mount, setMount] = useState<Element | null>(null);
  useEffect(() => { setMount(document.getElementById("header-mount")); }, []);

  const bar = (
    <div
      className="flex h-13 items-center justify-between px-5 lg:px-6"
      style={{ background: "var(--panel)" }}
    >
      <Link
        to="/"
        className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft01Icon size={16} strokeWidth={1.75} />
        Matches
      </Link>
      <div className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block">
        {match.stage} · {match.competition}
      </div>
      <div className="flex items-center gap-1">
        <IconButton label="Share">
          <Share01Icon size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );

  if (!mount) return null;
  return ReactDOM.createPortal(bar, mount);
}

function IconButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--color-elevated)] hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function ScoreboardCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 lg:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-5 w-5 object-contain opacity-80" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {match.competition}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {isLive ? (
            <>
              <span className="live-dot" />
              <span className="text-foreground">LIVE · {match.minute}'</span>
            </>
          ) : isFinished ? (
            <span className="flex items-center gap-1">
              <CheckmarkCircle01Icon size={11} strokeWidth={2} />
              Full-time
            </span>
          ) : (
            <span>{match.kickoff}</span>
          )}
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Scoreboard
          home={match.home}
          away={match.away}
          minute={match.minute}
          status={match.status}
          size="lg"
        />
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground">
        <TeamName team={match.home} align="left" />
        <TeamName team={match.away} align="right" />
      </div>

      {match.venue && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Location01Icon size={10} strokeWidth={2} />
          <span>{match.venue}</span>
        </div>
      )}

      {match.headline && (
        <p className="mx-auto mt-5 max-w-xl text-center text-[13px] leading-relaxed text-muted-foreground">
          {match.headline}
        </p>
      )}
    </section>
  );
}

function TeamName({ team, align }: { team: { name: string; short: string }; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <Flag code={team.short} size={12} />
      <span className="font-display text-[12px] font-semibold uppercase tracking-wider text-foreground">
        {team.name}
      </span>
    </div>
  );
}

function MatchPulseCard({ match }: { match: Match }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const isFinished = match.status === "finished";

  useEffect(() => {
    if (match.pulse.length <= 1) return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % match.pulse.length), 5000);
    return () => clearInterval(id);
  }, [match.pulse.length]);

  return (
    <section
      className="rounded-2xl border p-4 lg:p-5 relative overflow-hidden"
      style={{
        borderColor: "color-mix(in oklab, var(--color-border) 50%, var(--color-foreground) 25%)",
        background: "color-mix(in oklab, var(--color-card) 85%, var(--color-foreground) 4%)",
      }}
    >
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, var(--color-foreground), transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "color-mix(in oklab, var(--color-foreground) 12%, transparent)" }}
          >
            <FootballIcon size={14} strokeWidth={1.75} className="text-foreground" />
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
            Match Pulse
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isFinished && (
            <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/60">
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              Live
            </span>
          )}
          <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            AI · {isFinished ? "final" : `${match.minute}'`}
          </span>
        </div>
      </div>

      {/* Active pulse line — big + prominent */}
      <div className="relative mt-4">
        <p className="text-[15px] font-medium leading-relaxed text-foreground lg:text-[16px]">
          {match.pulse[activeIdx]}
        </p>
      </div>

      {/* Dot indicators + other lines */}
      {match.pulse.length > 1 && (
        <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
          {match.pulse.map((line, i) => {
            if (i === activeIdx) return null;
            return (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="block w-full text-left text-[12px] leading-relaxed text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                {line}
              </button>
            );
          })}
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {match.pulse.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="transition-all duration-300"
                aria-label={`View insight ${i + 1}`}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIdx ? 16 : 5,
                    height: 5,
                    background: i === activeIdx
                      ? "var(--color-foreground)"
                      : "color-mix(in oklab, var(--color-foreground) 25%, transparent)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MomentumCard({ match }: { match: Match }) {
  const label =
    Math.abs(match.momentum) < 15 ? "Balanced"
    : match.momentum > 0 ? match.home.name
    : match.away.name;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Momentum</SectionLabel>
        <span className="text-[12px] text-foreground">{label}</span>
      </div>
      <div className="mt-4">
        <Waveform value={match.momentum} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{match.home.short}</span>
        <MomentumBar value={match.momentum} />
        <span>{match.away.short}</span>
      </div>
    </Card>
  );
}

function Waveform({ value }: { value: number }) {
  const bars = 48;
  const bias = value / 100;
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = Math.sin(i * 1.3) * 0.5 + Math.cos(i * 0.7) * 0.3;
    const noise = 0.5 + 0.5 * seed;
    const position = i / (bars - 1);
    const homeSide = 1 - position;
    const emphasis = bias > 0 ? homeSide * bias : (1 - homeSide) * -bias;
    return Math.max(0.15, Math.min(1, noise * 0.7 + emphasis * 0.9));
  });

  return (
    <div className="flex h-12 items-center gap-[2px]">
      {heights.map((h, i) => {
        const mid = bars / 2;
        const isHome = i < mid;
        const highlighted =
          (value > 0 && isHome && i > mid - 16) ||
          (value < 0 && !isHome && i < mid + 16);
        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-500"
            style={{
              height: `${h * 100}%`,
              background: highlighted
                ? "var(--color-foreground)"
                : "color-mix(in oklab, var(--color-foreground) 22%, transparent)",
            }}
          />
        );
      })}
    </div>
  );
}

function WinProbabilityCard({ match }: { match: Match }) {
  const [home, draw, away] = match.winProbability;
  const rows = [
    { label: `${match.home.name} win`, flagCode: match.home.short, pct: home, tone: "primary" as const },
    { label: "Draw", pct: draw, tone: "muted" as const, flagCode: undefined },
    { label: `${match.away.name} win`, flagCode: match.away.short, pct: away, tone: "accent" as const },
  ];
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChartLineData02Icon size={14} strokeWidth={1.75} />
          <SectionLabel>Win probability</SectionLabel>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {match.status === "finished" ? "Final model" : "Live model"}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {sorted.map((r) => (
          <PredictionRow key={r.label} label={r.label} flagCode={r.flagCode} percent={r.pct} tone={r.tone} />
        ))}
      </div>
    </Card>
  );
}

function StatsCard({ match }: { match: Match }) {
  const rows: { label: string; values: [number, number]; format?: (n: number) => string }[] = [
    { label: "Possession", values: match.stats.possession, format: (n) => `${n}%` },
    { label: "Shots", values: match.stats.shots },
    { label: "Shots on target", values: match.stats.shotsOnTarget },
    { label: "Corners", values: match.stats.corners },
    { label: "Fouls", values: match.stats.fouls },
    { label: "Expected goals", values: match.stats.xg, format: (n) => n.toFixed(1) },
  ];

  return (
    <Card>
      <SectionLabel>Statistics</SectionLabel>
      <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{match.home.short}</span>
        <span>{match.away.short}</span>
      </div>
      <div className="mt-2 space-y-3">
        {rows.map((r) => (
          <StatRow key={r.label} label={r.label} values={r.values} format={r.format} />
        ))}
      </div>
    </Card>
  );
}

function StatRow({ label, values, format }: { label: string; values: [number, number]; format?: (n: number) => string }) {
  const [a, b] = values;
  const total = a + b || 1;
  const aPct = (a / total) * 100;
  const fmt = format ?? ((n: number) => String(n));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-numeric text-[12px]">
        <span className="text-foreground">{fmt(a)}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-foreground">{fmt(b)}</span>
      </div>
      <div className="flex h-1 gap-1">
        <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]">
          <div className="ml-auto h-full bg-foreground transition-[width] duration-500" style={{ width: `${aPct}%` }} />
        </div>
        <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]">
          <div className="h-full bg-foreground transition-[width] duration-500" style={{ width: `${100 - aPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function TurningPointsCard({ match }: { match: Match }) {
  if (!match.turningPoints?.length) return null;
  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <FlashIcon size={14} strokeWidth={1.75} />
        <SectionLabel>How the match changed</SectionLabel>
      </div>
      <ol className="mt-3 space-y-3">
        {match.turningPoints.map((point, i) => (
          <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] font-numeric text-[10px] font-bold text-muted-foreground">
              {i + 1}
            </span>
            <span className="text-foreground/90">{point}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function JoinedNowCard({ match }: { match: Match }) {
  const isFinished = match.status === "finished";
  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <Clock01Icon size={14} strokeWidth={1.75} />
        <SectionLabel>{isFinished ? "Match summary" : "If you joined now"}</SectionLabel>
      </div>
      {!isFinished && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          You joined in the {match.minute}<sup>th</sup> minute. Here's what you missed.
        </p>
      )}
      <ul className="mt-3 space-y-2.5">
        {match.joinedNow.map((line, i) => (
          <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
            <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-muted-foreground" />
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TimelineCard({ events, match }: { events: TimelineEvent[]; match: Match }) {
  return (
    <Card>
      <SectionLabel>Timeline</SectionLabel>
      <ol className="mt-4 space-y-3.5">
        {events.map((e, i) => (
          <TimelineRow key={i} event={e} match={match} isLast={i === events.length - 1} />
        ))}
      </ol>
    </Card>
  );
}

function TimelineRow({ event, match, isLast }: { event: TimelineEvent; match: Match; isLast: boolean }) {
  const teamName = event.team === "home" ? match.home.name : event.team === "away" ? match.away.name : "";
  const Icon = eventIcon(event.type);
  const tone = eventTone(event.type);

  return (
    <li className="animate-fade-up grid grid-cols-[48px_24px_1fr] items-start gap-2.5">
      <div className="pt-0.5 font-numeric text-[12px] text-muted-foreground">
        {event.type === "kickoff" && event.minute === 0 ? "KO" : `${event.minute}'`}
      </div>
      <div className="relative flex flex-col items-center">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background"
          style={{ color: tone }}
        >
          <Icon size={10} strokeWidth={2} />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 18 }} />}
      </div>
      <div className="pb-1.5">
        <div className="text-[12px] font-semibold">{event.label}</div>
        <div className="text-[10px] text-muted-foreground">
          {[teamName, event.detail].filter(Boolean).join(" · ")}
        </div>
      </div>
    </li>
  );
}

function eventIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "goal": return CircleIcon;
    case "yellow": case "red": return Square01Icon;
    case "sub": return ArrowDataTransferHorizontalIcon;
    case "momentum": return FlashIcon;
    case "penalty": return Flag01Icon;
    case "fulltime": return CheckmarkCircle01Icon;
    default: return PlayCircle02Icon;
  }
}

function eventTone(type: TimelineEvent["type"]) {
  switch (type) {
    case "goal": return "var(--color-success)";
    case "yellow": return "var(--color-warning)";
    case "red": return "var(--color-danger)";
    case "fulltime": return "var(--color-success)";
    case "momentum": return "var(--color-foreground)";
    default: return "var(--color-muted-foreground)";
  }
}

// ── Match Replay ──────────────────────────────────────────────────────────────
type ReplayState = "idle" | "playing" | "done";

function ReplayCard({ match }: { match: Match }) {
  const isFinished = match.status === "finished";
  const [replayState, setReplayState] = useState<ReplayState>("idle");
  const [replayMinute, setReplayMinute] = useState(0);
  const [replayHomeScore, setReplayHomeScore] = useState(0);
  const [replayAwayScore, setReplayAwayScore] = useState(0);
  const [replayEvents, setReplayEvents] = useState<TimelineEvent[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sorted ascending for replay
  const sortedTimeline = [...match.timeline].reverse();
  const finalMinute = sortedTimeline[sortedTimeline.length - 1]?.minute ?? 90;

  function startReplay() {
    setReplayMinute(0);
    setReplayHomeScore(0);
    setReplayAwayScore(0);
    setReplayEvents([]);
    setReplayState("playing");

    let currentMinute = 0;
    let homeScore = 0;
    let awayScore = 0;
    const capturedEvents: TimelineEvent[] = [];

    intervalRef.current = setInterval(() => {
      currentMinute += 1;

      // Check if any event fires at this minute
      const fired = sortedTimeline.filter((e) => e.minute === currentMinute);
      for (const e of fired) {
        capturedEvents.push(e);
        if (e.type === "goal") {
          if (e.team === "home") homeScore += 1;
          else if (e.team === "away") awayScore += 1;
        }
      }

      setReplayMinute(currentMinute);
      setReplayHomeScore(homeScore);
      setReplayAwayScore(awayScore);
      setReplayEvents([...capturedEvents]);

      if (currentMinute >= finalMinute) {
        clearInterval(intervalRef.current!);
        setReplayState("done");
      }
    }, Math.max(30, Math.round(1500 / Math.max(finalMinute, 1))));
  }

  function stopReplay() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setReplayState("idle");
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!isFinished) {
    return (
      <Card>
        <div className="flex items-center gap-1.5">
          <PlayCircle02Icon size={14} strokeWidth={1.75} />
          <SectionLabel>Match replay</SectionLabel>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Available after full-time. Watch the entire match unfold in 60 seconds with live score, events, and AI insights.
        </p>
        <button disabled className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground opacity-50 cursor-not-allowed">
          <PlayCircle02Icon size={13} strokeWidth={2} />
          Replay unlocks at full-time
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PlayCircle02Icon size={14} strokeWidth={1.75} />
          <SectionLabel>Match replay</SectionLabel>
        </div>
        {replayState === "playing" && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
            <span className="live-dot" />
            {replayMinute}'
          </span>
        )}
      </div>

      {replayState === "idle" && (
        <>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Watch the entire match story unfold in 90 seconds — goals, cards, and momentum shifts play out in real time.
          </p>
          <button
            onClick={startReplay}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            <PlayCircle02Icon size={13} strokeWidth={2} />
            Watch replay
          </button>
        </>
      )}

      {(replayState === "playing" || replayState === "done") && (
        <div className="mt-3 space-y-3">
          {/* Live score display */}
          <div className="flex items-center justify-between rounded-xl bg-[var(--color-elevated)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Flag code={match.home.short} size={14} />
              <span className="font-display text-[13px] font-bold">{match.home.short}</span>
            </div>
            <span className="font-numeric text-[24px] font-bold tabular-nums">
              {replayHomeScore} – {replayAwayScore}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display text-[13px] font-bold">{match.away.short}</span>
              <Flag code={match.away.short} size={14} />
            </div>
          </div>

          {/* Events feed */}
          {replayEvents.length > 0 && (
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {[...replayEvents].reverse().slice(0, 6).map((e, i) => {
                const tone = eventTone(e.type);
                const Icon = eventIcon(e.type);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="w-8 shrink-0 font-numeric text-muted-foreground">{e.minute}'</span>
                    <Icon size={10} strokeWidth={2} style={{ color: tone, flexShrink: 0 }} />
                    <span className="text-foreground">{e.label}</span>
                    {e.detail && <span className="text-muted-foreground">· {e.detail}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {replayState === "done" ? (
            <button
              onClick={startReplay}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-foreground hover:bg-[var(--color-elevated)] transition-colors"
            >
              <PlayCircle02Icon size={13} strokeWidth={2} />
              Watch again
            </button>
          ) : (
            <button
              onClick={stopReplay}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-[var(--color-elevated)] transition-colors"
            >
              <StopCircleIcon size={13} strokeWidth={2} />
              Stop replay
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Card({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <section
      className={`rounded-2xl border bg-card p-4 lg:p-5 ${
        highlight
          ? "border-[color-mix(in_oklab,var(--color-border)_60%,var(--color-foreground)_30%)]"
          : "border-border"
      }`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}
