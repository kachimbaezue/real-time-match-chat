import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect, type ReactNode } from "react";
import ReactDOM from "react-dom";
import {
  Home01Icon,
  FootballIcon,
  Calendar01Icon,
  Clock01Icon,
  Search01Icon,
  SidebarLeft01Icon,
  Cancel01Icon,
  Activity01Icon as HotIcon,
  ChampionIcon,
  BookmarkAdd02Icon,
} from "hugeicons-react";
import { type Match } from "@/lib/matches";
import { fetchHomeMatches } from "@/lib/api";
import { Flag } from "@/components/Flag";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  dot?: "live" | "hot";
};

const NAV: readonly NavItem[] = [
  { to: "/",         label: "Home",        icon: Home01Icon                 },
  { to: "/live",     label: "Live",        icon: FootballIcon, dot: "live"  },
  { to: "/hot",      label: "Hot",         icon: HotIcon,    dot: "hot"  },
  { to: "/moments",  label: "Moments",     icon: ChampionIcon               },
  { to: "/memories", label: "My Memories", icon: BookmarkAdd02Icon          },
  { to: "/upcoming", label: "Upcoming",    icon: Calendar01Icon             },
  { to: "/recent",   label: "Recent",      icon: Clock01Icon                },
];

const OPEN_W  = 220;
const CLOSE_W = 56;

/* ── Search modal ──────────────────────────────────────────────────────────── */
// Simple in-memory cache so we don't re-fetch on every keypress
let _cachedMatches: Match[] | null = null;

async function loadAllMatches(): Promise<Match[]> {
  if (_cachedMatches) return _cachedMatches;
  try {
    const data = await fetchHomeMatches();
    _cachedMatches = [
      ...(data?.live ?? []),
      ...(data?.upcoming ?? []),
      ...(data?.recent ?? []),
    ];
    return _cachedMatches;
  } catch {
    return [];
  }
}

function filterMatches(all: Match[], query: string): Match[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return all.filter((m) =>
    m.home.name.toLowerCase().includes(q) ||
    m.away.name.toLowerCase().includes(q) ||
    m.home.short.toLowerCase().includes(q) ||
    m.away.short.toLowerCase().includes(q) ||
    m.competition.toLowerCase().includes(q) ||
    m.stage.toLowerCase().includes(q) ||
    (m.venue ?? "").toLowerCase().includes(q)
  );
}

function StatusBadge({ status, minute }: { status: string; minute?: number }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-foreground">
        <span className="live-dot" />
        LIVE {minute ? `· ${minute}'` : ""}
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">FT</span>
    );
  }
  return null;
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [allMatches, setAllMatches] = useState<Match[]>(_cachedMatches ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = filterMatches(allMatches, query);
  const hasQuery = query.trim().length > 0;

  // Pre-load match list when modal opens
  useEffect(() => {
    loadAllMatches().then((m) => setAllMatches(m));
  }, []);

  useEffect(() => {
    // Focus input immediately
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "var(--panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar — always at top */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b border-border"
          style={{ background: "var(--panel)" }}
        >
          <Search01Icon size={17} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            id="search-query"
            name="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matches, teams, competitions…"
            autoComplete="off"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Cancel01Icon size={16} strokeWidth={1.75} />
            </button>
          )}
          <button
            onClick={onClose}
            className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-[420px] overflow-y-auto">
          {!hasQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FootballIcon size={28} strokeWidth={1.5} className="text-muted-foreground/40 mb-3" />
              <p className="text-[13px] text-muted-foreground">Type to search for a match or team</p>
            </div>
          )}

          {hasQuery && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] text-muted-foreground">No matches found for <span className="text-foreground">"{query}"</span></p>
            </div>
          )}

          {hasQuery && results.length > 0 && (
            <div className="p-3 space-y-1">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((m) => (
                <Link
                  key={m.id}
                  to="/match/$id"
                  params={{ id: m.id }}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/8 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <Flag code={m.home.short} size={14} />
                      <span className="font-display text-[13px] font-semibold text-foreground">
                        {m.home.name}
                      </span>
                    </div>
                    <span className="font-numeric text-[15px] font-bold text-foreground tabular-nums">
                      {m.status !== "upcoming" ? `${m.home.score} – ${m.away.score}` : "vs"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[13px] font-semibold text-foreground">
                        {m.away.name}
                      </span>
                      <Flag code={m.away.short} size={14} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{m.stage}</span>
                    <StatusBadge status={m.status} minute={m.minute} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── AppLayout ──────────────────────────────────────────────────────────────── */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasLive, setHasLive] = useState(false);
  const sideW = open ? OPEN_W : CLOSE_W;

  // Poll for live matches to drive the indicator dot
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetchHomeMatches()
        .then((data) => {
          if (!cancelled) setHasLive(Array.isArray(data?.live) && data.live.length > 0);
        })
        .catch(() => {/* ignore */});
    };
    check();
    const t = setInterval(check, 60_000); // re-check every minute
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--shell)" }}>
      <style>{`@media(min-width:1024px){.right-col{margin-left:${sideW}px}}`}</style>

      {/* ── Sidebar ── */}
      <aside
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 shrink-0 transition-[width] duration-200 overflow-hidden"
        style={{ width: sideW, background: "var(--panel)" }}
      >
        {/* Logo — top padding so it breathes from the edge */}
        <div className="flex shrink-0 items-center px-4 pt-5 pb-4">
          <img src="/logo.png" alt="Pulse" className="h-14 w-14 shrink-0 object-contain" />
        </div>

        {/* Nav — pushed down with pt-3 so it doesn't crowd the logo */}
        <nav className="flex-1 flex flex-col gap-0.5 px-2 pt-3">
          {NAV.map(({ to, label, icon: Icon, dot }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            const showDot = dot === "live" ? hasLive : dot === "hot" ? hasLive : false;
            return (
              <Link
                key={to}
                to={to}
                title={!open ? label : undefined}
                className={[
                  "group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] font-medium",
                  "transition-colors duration-100 select-none press",
                  active
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/8 hover:text-foreground",
                ].join(" ")}
              >
                <span className="relative shrink-0 flex h-5 w-5 items-center justify-center">
                  <Icon size={17} strokeWidth={active ? 2 : 1.6} />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                  )}
                </span>
                {open && <span className="whitespace-nowrap animate-slide-in-left">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 px-3 pb-4">
          {open && (
            <div className="mb-3 space-y-1">
              {/* Solana logo */}
              <a
                href="https://solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-lg px-1 py-2 hover:bg-white/6 transition-colors"
                title="Solana"
              >
                <img
                  src="/solana.png"
                  alt="Solana"
                  className="h-16 w-16 object-contain shrink-0"
                />
              </a>
              {/* SuperTeam logo */}
              <a
                href="https://superteam.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-lg px-1 py-2 hover:bg-white/6 transition-colors"
                title="Superteam"
              >
                <img
                  src="/super-teamlogo.png"
                  alt="Superteam"
                  className="h-20 max-w-[180px] object-contain shrink-0"
                />
              </a>
              {/* TxLine logo */}
              <a
                href="https://txline.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-lg px-1 py-2 hover:bg-white/6 transition-colors"
                title="TxLine"
              >
                <img
                  src="/txline-logo.svg"
                  alt="TxLine"
                  className="h-8 max-w-[140px] object-contain shrink-0"
                />
              </a>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setOpen(v => !v)}
            title={open ? "Collapse" : "Expand"}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-[12px] text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors press"
          >
            <span className="shrink-0 flex h-5 w-5 items-center justify-center">
              <SidebarLeft01Icon size={16} strokeWidth={1.75} />
            </span>
            {open && <span className="whitespace-nowrap">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Right column ── */}
      <div
        className="right-col flex flex-1 flex-col h-screen transition-[margin-left] duration-200"
        style={{ background: "var(--panel)" }}
      >
        {/* Header portal mount */}
        <div id="header-mount" className="shrink-0" />

        {/* Rounded surface content container */}
        <div className="flex-1 min-h-0 px-2 pb-2">
          <div
            className="h-full rounded-xl overflow-hidden"
            style={{ background: "var(--surface)" }}
          >
            <main className="h-full overflow-y-auto overflow-x-hidden pb-20 lg:pb-6 animate-page-enter">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-4 left-1/2 z-40 lg:hidden -translate-x-1/2 rounded-2xl border border-border shadow-2xl"
        style={{ background: "var(--panel)", width: "calc(100% - 2rem)" }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ to, label, icon: Icon, dot }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            const showDot = dot === "live" ? hasLive : dot === "hot" ? hasLive : false;
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-md py-2",
                  "text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors press",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-foreground" />
                )}
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                  )}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Search modal portal ── */}
      {searchOpen && ReactDOM.createPortal(
        <SearchModal onClose={() => setSearchOpen(false)} />,
        document.body
      )}
    </div>
  );
}

/* ── TopBar — portals into #header-mount ─────────────────────────────────── */
export function TopBar({ title, action }: { title: string; action?: ReactNode }) {
  const [mount, setMount] = useState<Element | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMount(document.getElementById("header-mount"));
  }, []);

  const bar = (
    <div
      className="flex h-13 items-center justify-between px-5 lg:px-6"
      style={{ background: "var(--panel)" }}
    >
      <div className="flex items-center gap-2.5">
        {/* Logo visible on mobile always; on desktop only when sidebar might be collapsed */}
        <img src="/logo.png" alt="" className="h-6 w-6 object-contain lg:hidden" />
        {/* Show title text on mobile; on desktop show nothing — sidebar logo covers it */}
        <h1 className="font-display text-[15px] font-bold tracking-tight lg:hidden">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        {action ?? (
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--color-elevated)] hover:text-foreground transition-colors press"
          >
            <Search01Icon size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {searchOpen && ReactDOM.createPortal(
        <SearchModal onClose={() => setSearchOpen(false)} />,
        document.body
      )}
    </div>
  );

  if (!mount) return null;
  return ReactDOM.createPortal(bar, mount);
}
