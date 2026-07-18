import { createFileRoute, Link } from "@tanstack/react-router";
import { getMemory, type MatchMemory } from "@/lib/memories";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { Scoreboard } from "@/components/Scoreboard";
import {
  ArrowLeft01Icon,
  BookmarkCheck02Icon,
  FlashIcon,
  Clock01Icon,
  ChartLineData02Icon,
  CircleIcon,
  Square01Icon,
  ArrowDataTransferHorizontalIcon,
  Flag01Icon,
  CheckmarkCircle01Icon,
  PlayCircle02Icon,
} from "hugeicons-react";

export const Route = createFileRoute("/memories/$id")({
  component: MemoryDetailPage,
});

function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Shared primitives ───────────────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 lg:p-5">
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

/* ── Timeline helpers ────────────────────────────────────────────────────── */
type EventType =
  | "goal"
  | "yellow"
  | "red"
  | "sub"
  | "momentum"
  | "penalty"
  | "kickoff"
  | "halftime"
  | "fulltime";

function eventIcon(type: EventType) {
  switch (type) {
    case "goal":     return CircleIcon;
    case "yellow":
    case "red":      return Square01Icon;
    case "sub":      return ArrowDataTransferHorizontalIcon;
    case "momentum": return FlashIcon;
    case "penalty":  return Flag01Icon;
    case "fulltime": return CheckmarkCircle01Icon;
    default:         return PlayCircle02Icon;
  }
}

function eventTone(type: EventType): string {
  switch (type) {
    case "goal":     return "var(--color-success)";
    case "yellow":   return "var(--color-warning)";
    case "red":      return "var(--color-danger)";
    case "fulltime": return "var(--color-success)";
    case "momentum": return "var(--color-foreground)";
    default:         return "var(--color-muted-foreground)";
  }
}

/* ── Stats helper ────────────────────────────────────────────────────────── */
function StatRow({
  label,
  values,
  format,
}: {
  label: string;
  values: [number, number];
  format?: (n: number) => string;
}) {
  const [a, b] = values;
  const total = (a ?? 0) + (b ?? 0) || 1;
  const aPct = ((a ?? 0) / total) * 100;
  const fmt = format ?? ((n: number) => String(n));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-numeric text-[12px]">
        <span className="text-foreground">{fmt(a ?? 0)}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-foreground">{fmt(b ?? 0)}</span>
      </div>
      <div className="flex h-1 gap-1">
        <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]">
          <div
            className="ml-auto h-full bg-foreground transition-[width] duration-500"
            style={{ width: `${aPct}%` }}
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]">
          <div
            className="h-full bg-foreground transition-[width] duration-500"
            style={{ width: `${100 - aPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── MemoryDetailPage ────────────────────────────────────────────────────── */
function MemoryDetailPage() {
  const { id } = Route.useParams();
  const memory: MatchMemory | null = getMemory(id);

  if (!memory) {
    return (
      <>
        <TopBar title="Memory Not Found" />
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 gap-4">
          <p className="text-[14px] font-semibold text-foreground">Memory not found</p>
          <p className="text-[13px] text-muted-foreground">
            This memory may have been deleted or doesn't exist.
          </p>
          <Link
            to="/memories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
          >
            <ArrowLeft01Icon size={14} strokeWidth={1.75} />
            Back to Memories
          </Link>
        </div>
      </>
    );
  }

  const statsRows: { label: string; values: [number, number]; format?: (n: number) => string }[] =
    memory.stats
      ? [
          {
            label: "Possession",
            values: memory.stats.possession ?? [50, 50],
            format: (n) => `${n}%`,
          },
          { label: "Shots", values: memory.stats.shots ?? [0, 0] },
          {
            label: "Shots on target",
            values: memory.stats.shotsOnTarget ?? [0, 0],
          },
          { label: "Corners", values: memory.stats.corners ?? [0, 0] },
          {
            label: "Expected goals",
            values: memory.stats.xg ?? [0, 0],
            format: (n) => n.toFixed(1),
          },
        ]
      : [];

  return (
    <>
      <TopBar title="Match Memory" />

      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 space-y-4">
        {/* Back link */}
        <Link
          to="/memories"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon size={14} strokeWidth={1.75} />
          My Memories
        </Link>

        {/* ── Section 1: Hero ── */}
        <section className="rounded-2xl border border-border bg-card p-5 lg:p-8">
          {/* Competition */}
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {memory.competition}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <CheckmarkCircle01Icon size={11} strokeWidth={2} />
              Full-time
            </span>
          </div>

          {/* Scoreboard */}
          <div className="flex justify-center py-2">
            <Scoreboard
              home={{ name: memory.homeTeam, short: memory.homeTeam.slice(0, 3).toUpperCase(), score: memory.homeScore }}
              away={{ name: memory.awayTeam, short: memory.awayTeam.slice(0, 3).toUpperCase(), score: memory.awayScore }}
              status="finished"
              size="lg"
            />
          </div>

          {/* Team names */}
          <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Flag code={memory.homeTeam.slice(0, 3).toUpperCase()} size={12} />
              <span className="font-display text-[12px] font-semibold uppercase tracking-wider text-foreground">
                {memory.homeTeam}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse">
              <Flag code={memory.awayTeam.slice(0, 3).toUpperCase()} size={12} />
              <span className="font-display text-[12px] font-semibold uppercase tracking-wider text-foreground">
                {memory.awayTeam}
              </span>
            </div>
          </div>

          {/* Date */}
          {memory.kickoffTime && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {memory.kickoffTime}
            </p>
          )}
        </section>

        {/* ── Section 2: AI Story ── */}
        {memory.pulse && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border">
                <FlashIcon size={14} strokeWidth={1.75} className="text-foreground" />
              </div>
              <SectionLabel>Match Pulse</SectionLabel>
            </div>
            <p className="text-[14px] leading-relaxed text-foreground">{memory.pulse}</p>
          </Card>
        )}

        {/* ── Section 3: Match Recap ── */}
        {memory.recap && (
          <Card>
            <div className="flex items-center gap-1.5 mb-3">
              <Clock01Icon size={14} strokeWidth={1.75} />
              <SectionLabel>If You Joined Now</SectionLabel>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{memory.recap}</p>
          </Card>
        )}

        {/* ── Section 4: Turning Points ── */}
        {memory.turningPoints && memory.turningPoints.length > 0 && (
          <Card>
            <div className="flex items-center gap-1.5 mb-3">
              <FlashIcon size={14} strokeWidth={1.75} />
              <SectionLabel>How the match changed</SectionLabel>
            </div>
            <ol className="space-y-3">
              {memory.turningPoints.map((point, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] font-numeric text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{point}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* ── Section 5: Timeline ── */}
        {memory.timeline && memory.timeline.length > 0 && (
          <Card>
            <SectionLabel>Timeline</SectionLabel>
            <ol className="mt-4 space-y-3.5">
              {memory.timeline.map((e: any, i: number) => {
                const isLast = i === memory.timeline.length - 1;
                const teamName =
                  e.team === "home"
                    ? memory.homeTeam
                    : e.team === "away"
                    ? memory.awayTeam
                    : "";
                const Icon = eventIcon(e.type as EventType);
                const tone = eventTone(e.type as EventType);
                return (
                  <li
                    key={i}
                    className="animate-fade-up grid grid-cols-[48px_24px_1fr] items-start gap-2.5"
                  >
                    <div className="pt-0.5 font-numeric text-[12px] text-muted-foreground">
                      {e.type === "kickoff" && e.minute === 0 ? "KO" : `${e.minute}'`}
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background"
                        style={{ color: tone }}
                      >
                        <Icon size={10} strokeWidth={2} />
                      </div>
                      {!isLast && (
                        <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 18 }} />
                      )}
                    </div>
                    <div className="pb-1.5">
                      <div className="text-[12px] font-semibold">{e.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {[teamName, e.detail].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {/* ── Section 6: Statistics ── */}
        {statsRows.length > 0 && (
          <Card>
            <div className="flex items-center gap-1.5 mb-3">
              <ChartLineData02Icon size={14} strokeWidth={1.75} />
              <SectionLabel>Statistics</SectionLabel>
            </div>
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <span>{memory.homeTeam.slice(0, 3).toUpperCase()}</span>
              <span>{memory.awayTeam.slice(0, 3).toUpperCase()}</span>
            </div>
            <div className="space-y-3">
              {statsRows.map((r) => (
                <StatRow key={r.label} label={r.label} values={r.values} format={r.format} />
              ))}
            </div>
          </Card>
        )}

        {/* ── Section 7: Ownership ── */}
        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <BookmarkCheck02Icon size={14} strokeWidth={1.75} />
            <SectionLabel>Memory Ownership</SectionLabel>
          </div>
          <dl className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Wallet</dt>
              <dd className="font-mono text-foreground">{shortenAddress(memory.walletAddress)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Saved</dt>
              <dd className="text-foreground">{formatDate(memory.savedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">On-chain ref</dt>
              <dd className="text-muted-foreground italic">
                {memory.txRef ?? "Pending on-chain"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
