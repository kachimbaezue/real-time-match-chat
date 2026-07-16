import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { fetchHotFeed, type HotFeedItem } from "@/lib/api";
import {
  FootballIcon,
  ArrowRight01Icon,
  ChartLineData02Icon,
  FlashIcon,
  Activity01Icon,
  RefreshIcon,
} from "hugeicons-react";

export const Route = createFileRoute("/hot")({
  head: () => ({
    meta: [
      { title: "Hot — Pulse" },
      { name: "description", content: "Live World Cup thread — goals, red cards, AI reads. Powered by TxLINE." },
    ],
  }),
  component: HotPage,
});

// ── utils ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)    return "just now";
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function typeEmoji(type: HotFeedItem["type"]): string {
  switch (type) {
    case "goal":       return "⚽";
    case "red_card":   return "🟥";
    case "yellow_card":return "🟨";
    case "penalty":    return "🥅";
    case "fulltime":   return "🏁";
    case "status":     return "🔔";
    case "insight":    return "⚡";
    case "stat":       return "📊";
    default:           return "📌";
  }
}

function typeLabel(type: HotFeedItem["type"]): string {
  switch (type) {
    case "goal":       return "Goal";
    case "red_card":   return "Red card";
    case "yellow_card":return "Yellow";
    case "penalty":    return "Penalty";
    case "fulltime":   return "Full time";
    case "status":     return "Update";
    case "insight":    return "AI Read";
    case "stat":       return "Stats";
    default:           return "Update";
  }
}

function typeDotColor(type: HotFeedItem["type"]): string {
  switch (type) {
    case "goal":       return "bg-white";
    case "red_card":   return "bg-red-500";
    case "yellow_card":return "bg-yellow-400";
    case "penalty":    return "bg-orange-500";
    case "fulltime":   return "bg-emerald-500";
    case "insight":    return "bg-violet-500";
    case "stat":       return "bg-sky-500";
    default:           return "bg-muted-foreground/40";
  }
}

function typeIcon(type: HotFeedItem["type"]) {
  switch (type) {
    case "goal":        return <FootballIcon size={13} strokeWidth={2} />;
    case "red_card":    return <span className="block h-3 w-2.5 rounded-[2px] bg-red-400" />;
    case "yellow_card": return <span className="block h-3 w-2.5 rounded-[2px] bg-yellow-400" />;
    case "penalty":     return <Activity01Icon size={13} strokeWidth={2} />;
    case "fulltime":    return <span className="text-[9px] font-bold">FT</span>;
    case "insight":     return <FlashIcon size={13} strokeWidth={2} />;
    case "stat":        return <ChartLineData02Icon size={13} strokeWidth={2} />;
    default:            return <span className="text-[11px]">•</span>;
  }
}

// ── WC status banner ────────────────────────────────────────────────────────

function WCStatusBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-border overflow-hidden"
      style={{ background: "color-mix(in oklab, var(--color-card) 80%, var(--color-foreground) 6%)" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <FootballIcon size={14} strokeWidth={1.75} className="text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            FIFA World Cup 2026 · Status
          </span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
          102 / 104 played
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {[
          { label: "Teams", val: "48" },
          { label: "Played", val: "102" },
          { label: "Left", val: "2" },
        ].map(({ label, val }) => (
          <div key={label} className="flex flex-col items-center py-3">
            <span className="font-numeric text-[22px] font-bold text-foreground">{val}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming matches */}
      <div className="border-t border-border/60 divide-y divide-border/40">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-[13px]">🥉</span>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-foreground">3rd Place — France vs England</p>
            <p className="text-[10px] text-muted-foreground">Jul 18 · 5:00PM ET · Hard Rock Stadium, Miami</p>
          </div>
          <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">UPCOMING</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-[13px]">🏆</span>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-foreground">Final — Spain vs Argentina</p>
            <p className="text-[10px] text-muted-foreground">Jul 19 · 3:00PM ET · MetLife Stadium, NJ</p>
          </div>
          <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">UPCOMING</span>
        </div>
      </div>

      {/* Top scorer note */}
      <div className="border-t border-border/60 px-4 py-2.5 flex items-center gap-2">
        <span className="text-[11px]">🥅</span>
        <span className="text-[11px] text-muted-foreground">Top scorer: <span className="text-foreground font-medium">Lionel Messi (ARG) — 8 goals</span></span>
      </div>
    </div>
  );
}

// ── Thread item (spaghetti thread style) ───────────────────────────────────

function ThreadItem({
  item,
  isLast,
  isFirst,
}: {
  item: HotFeedItem;
  isLast: boolean;
  isFirst: boolean;
}) {
  const [timeStr, setTimeStr] = useState(() => relativeTime(item.ts));
  const isHighImportance = item.importance >= 3;

  useEffect(() => {
    const t = setInterval(() => setTimeStr(relativeTime(item.ts)), 15_000);
    return () => clearInterval(t);
  }, [item.ts]);

  return (
    <div className="flex gap-3">
      {/* Left — thread line + dot */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
        {/* Top connector line */}
        {!isFirst && (
          <div className="w-px flex-none bg-border/50" style={{ height: 12 }} />
        )}
        {/* The dot */}
        <div
          className={[
            "flex items-center justify-center rounded-full shrink-0 z-10",
            isHighImportance
              ? "h-7 w-7 border-2 border-foreground/20 text-foreground"
              : "h-6 w-6 border border-border text-muted-foreground",
            "bg-card",
          ].join(" ")}
        >
          {typeIcon(item.type)}
        </div>
        {/* Bottom connector line — runs to next item */}
        {!isLast && (
          <div className="w-px flex-1 min-h-[24px] bg-border/50" />
        )}
      </div>

      {/* Right — card content */}
      <div className={["pb-4 flex-1 min-w-0", isLast ? "" : ""].join(" ")}>
        {/* Type tag + time */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={[
            "flex items-center gap-1 text-[10px] font-semibold",
            item.type === "goal"        ? "text-foreground" :
            item.type === "red_card"    ? "text-red-400" :
            item.type === "yellow_card" ? "text-yellow-400" :
            item.type === "penalty"     ? "text-orange-400" :
            item.type === "fulltime"    ? "text-emerald-400" :
            item.type === "insight"     ? "text-violet-400" :
            item.type === "stat"        ? "text-sky-400" :
            "text-muted-foreground",
          ].join(" ")}>
            {typeEmoji(item.type)} {typeLabel(item.type)}
          </span>
          {item.minute > 0 && (
            <span className="text-[10px] text-muted-foreground">{item.minute}'</span>
          )}
          {isHighImportance && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-foreground">
              <span className="live-dot" style={{ width: 4, height: 4 }} />
              Big moment
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{timeStr}</span>
        </div>

        {/* Main text — the thread "post" */}
        <Link
          to="/match/$id"
          params={{ id: item.match.id }}
          className="group block"
        >
          <p className={[
            "leading-relaxed text-foreground",
            isHighImportance ? "text-[15px] font-semibold" : "text-[13px] font-medium",
          ].join(" ")}>
            {item.text}
          </p>

          {item.detail && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">{item.detail}</p>
          )}

          {/* Match score pill */}
          <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--color-elevated)] px-3 py-1.5 pr-2 hover:border-foreground/20 transition-colors">
            <Flag code={item.match.home.slice(0, 3).toUpperCase()} size={13} />
            <span className="text-[12px] font-semibold text-foreground">{item.match.home}</span>
            <span className="font-numeric text-[13px] font-bold text-foreground tabular-nums">
              {item.match.homeScore}
            </span>
            <span className="mx-0.5 text-[10px] text-muted-foreground">
              {item.match.status === "live"
                ? <span className="flex items-center gap-1"><span className="live-dot" style={{ width: 4, height: 4 }} />{item.match.minute}'</span>
                : item.match.status === "finished" ? "FT" : "vs"
              }
            </span>
            <span className="font-numeric text-[13px] font-bold text-foreground tabular-nums">
              {item.match.awayScore}
            </span>
            <span className="text-[12px] font-semibold text-foreground">{item.match.away}</span>
            <Flag code={item.match.away.slice(0, 3).toUpperCase()} size={13} />
            <ArrowRight01Icon size={11} strokeWidth={2} className="ml-1 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Filter pill ────────────────────────────────────────────────────────────

type FilterType = "all" | "goals" | "cards" | "ai" | "live";

function FilterPill({
  active, label, count, onClick,
}: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
        active
          ? "bg-foreground text-background"
          : "bg-[var(--color-elevated)] text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={[
          "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
          active ? "bg-background/20 text-background" : "bg-border text-muted-foreground",
        ].join(" ")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyThread({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-elevated)]">
        <FootballIcon size={22} strokeWidth={1.5} className="text-muted-foreground/50" />
      </div>
      <p className="text-[14px] font-semibold text-foreground">
        {filter === "live" ? "No live matches right now" : "Thread is quiet"}
      </p>
      <p className="text-[12px] text-muted-foreground max-w-xs">
        {filter === "live"
          ? "Check back when the next match kicks off."
          : "Match events will appear here as the tournament unfolds. The thread auto-updates every 20s."}
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function HotPage() {
  const [feed, setFeed] = useState<HotFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const items = await fetchHotFeed();
      setFeed(items);
      setLastRefresh(Date.now());
    } catch {
      // backend offline — keep existing
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(), 20_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = feed.filter((item) => {
    switch (filter) {
      case "goals":  return item.type === "goal" || item.type === "fulltime";
      case "cards":  return item.type === "red_card" || item.type === "yellow_card" || item.type === "penalty";
      case "ai":     return item.type === "insight" || item.type === "stat";
      case "live":   return item.match.status === "live";
      default:       return true;
    }
  });

  const goalCount  = feed.filter(i => i.type === "goal").length;
  const cardCount  = feed.filter(i => ["red_card","yellow_card","penalty"].includes(i.type)).length;
  const aiCount    = feed.filter(i => ["insight","stat"].includes(i.type)).length;
  const liveCount  = feed.filter(i => i.match.status === "live").length;

  return (
    <>
      <TopBar title="Hot" />
      <div ref={topRef} className="mx-auto max-w-xl px-4 py-5 lg:px-5 lg:py-8">

        {/* WC context banner */}
        <WCStatusBanner />

        {/* Thread header + refresh */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-[15px] font-bold text-foreground tracking-tight">
              What's happening ⚡
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Live thread · TxLINE data · {relativeTime(lastRefresh)}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            aria-label="Refresh"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-colors disabled:opacity-40"
          >
            <RefreshIcon size={12} strokeWidth={1.75} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          <FilterPill active={filter === "all"}   label="All"     count={feed.length} onClick={() => setFilter("all")} />
          <FilterPill active={filter === "goals"} label="⚽ Goals" count={goalCount}  onClick={() => setFilter("goals")} />
          <FilterPill active={filter === "cards"} label="🟨 Cards" count={cardCount}  onClick={() => setFilter("cards")} />
          <FilterPill active={filter === "ai"}    label="⚡ AI"   count={aiCount}     onClick={() => setFilter("ai")} />
          {liveCount > 0 && (
            <FilterPill active={filter === "live"} label="🔴 Live" count={liveCount} onClick={() => setFilter("live")} />
          )}
        </div>

        {/* Thread body */}
        {loading ? (
          /* Skeleton thread */
          <div className="flex flex-col gap-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 28 }}>
                  {i > 0 && <div className="w-px bg-border/40" style={{ height: 12 }} />}
                  <div className="h-6 w-6 rounded-full bg-[var(--color-elevated)] animate-pulse" />
                  {i < 4 && <div className="w-px flex-1 min-h-[40px] bg-border/40" />}
                </div>
                <div className="flex-1 pb-4 space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--color-elevated)] animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-[var(--color-elevated)] animate-pulse" />
                  <div className="h-8 w-48 rounded-xl bg-[var(--color-elevated)] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyThread filter={filter} />
        ) : (
          /* Spaghetti thread */
          <div>
            {filtered.map((item, idx) => (
              <ThreadItem
                key={item.id}
                item={item}
                isFirst={idx === 0}
                isLast={idx === filtered.length - 1}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
            <img src="/txline-logo.svg" alt="TxLINE" className="h-3 opacity-30" />
            <span>Data by TxLINE · refreshes every 20s</span>
          </div>
        )}
      </div>
    </>
  );
}
