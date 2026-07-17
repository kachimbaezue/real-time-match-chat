import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import {
  ChampionIcon,
  Award01Icon,
  FootballIcon,
  UserStar01Icon,
  AlertDiamondIcon,
  FlashIcon,
  BookOpen01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  SentIcon,
  Cancel01Icon,
  Search01Icon,
} from "hugeicons-react";

export const Route = createFileRoute("/moments")({
  head: () => ({
    meta: [
      { title: "Moments — Pulse | 2026 FIFA World Cup History" },
      { name: "description", content: "History-making records, biggest upsets and defining moments from the 2026 FIFA World Cup." },
      { property: "og:title", content: "Moments — Pulse" },
      { property: "og:description", content: "Records shattered. Upsets that stunned the world. Moments talked about for decades." },
    ],
  }),
  component: MomentsPage,
});

// ── Data ──────────────────────────────────────────────────────────────────────

interface MomentItem {
  text: string;
  sub?: string;
  flag?: string;
}

interface Section {
  id: string;
  category: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  items: MomentItem[];
}

const SECTIONS: Section[] = [
  {
    id: "history",
    category: "History",
    tagline: "Tournament firsts",
    icon: ChampionIcon,
    items: [
      { text: "First-ever 48-team FIFA World Cup" },
      { text: "First World Cup hosted by three countries", sub: "USA, Canada & Mexico" },
      { text: "First World Cup with 104 matches" },
      { text: "First Round of 32 in World Cup history" },
      { text: "1,200+ players — largest squad count ever" },
      { text: "Most stadiums and most travel distance in any World Cup" },
    ],
  },
  {
    id: "messi",
    category: "Records",
    tagline: "Lionel Messi · Argentina",
    icon: UserStar01Icon,
    items: [
      { text: "All-time leading World Cup goalscorer", flag: "AR" },
      { text: "Most World Cup appearances ever", flag: "AR" },
      { text: "Oldest player to score multiple goals in a World Cup", flag: "AR" },
      { text: "Led Argentina to the final at age 39", flag: "AR" },
    ],
  },
  {
    id: "ronaldo",
    category: "Records",
    tagline: "Cristiano Ronaldo · Portugal",
    icon: UserStar01Icon,
    items: [
      { text: "First player to appear in six FIFA World Cups", flag: "PT" },
      { text: "Oldest outfield player in World Cup history", flag: "PT" },
    ],
  },
  {
    id: "mbappe",
    category: "Records",
    tagline: "Kylian Mbappé · France",
    icon: FlashIcon,
    items: [
      { text: "Broke multiple French World Cup scoring records", flag: "FR" },
      { text: "Scored in every World Cup he has played", flag: "FR" },
      { text: "Surpassed all-time knockout-stage scoring marks", flag: "FR" },
    ],
  },
  {
    id: "upsets",
    category: "Upsets",
    tagline: "Giant killers",
    icon: AlertDiamondIcon,
    items: [
      { text: "Morocco eliminated the Netherlands on penalties", flag: "MA" },
      { text: "Norway knocked out Brazil in the Round of 16", flag: "NO" },
      { text: "Paraguay eliminated Germany on penalties", flag: "PY" },
      { text: "Egypt beat Australia in a dramatic shootout", flag: "EG" },
      { text: "Cape Verde reached the knockout stage", flag: "CV" },
      { text: "Colombia reached the Round of 16", flag: "CO" },
    ],
  },
  {
    id: "matches",
    category: "Matches",
    tagline: "Matches that stopped the world",
    icon: FootballIcon,
    items: [
      { text: "Argentina 3–2 Cape Verde", flag: "AR" },
      { text: "Belgium 3–2 Senegal", flag: "BE" },
      { text: "England 3–2 Mexico", flag: "GB" },
      { text: "Spain 2–1 Belgium", flag: "ES" },
      { text: "Argentina 2–1 England", sub: "Semi-final", flag: "AR" },
      { text: "Spain 2–0 France", sub: "Semi-final", flag: "ES" },
    ],
  },
  {
    id: "controversies",
    category: "Controversies",
    tagline: "What divided fans",
    icon: AlertDiamondIcon,
    items: [
      { text: "VAR controversy in almost every knockout round", sub: "Long reviews, inconsistent calls, marginal offsides" },
      { text: "Connected Ball Technology divided opinion", sub: "Goals and offsides decided by ball sensor" },
      { text: "Mandatory hydration breaks interrupted match flow" },
      { text: "Extreme heat raised player safety concerns" },
      { text: "Argentina's Las Malvinas banner post-semi-final", sub: "FIFA investigation sparked" },
      { text: "Skycam cable controversy in one knockout match" },
      { text: "Third-place playoff criticised by coaches and fans" },
    ],
  },
  {
    id: "stories",
    category: "Storylines",
    tagline: "What we'll remember",
    icon: BookOpen01Icon,
    items: [
      { text: "Messi chasing another World Cup title at 39" },
      { text: "Spain reaching the final with the tournament's best defensive record", flag: "ES" },
      { text: "Argentina defending their World Cup crown", flag: "AR" },
      { text: "England falling just short in the semi-final again", flag: "GB" },
      { text: "Smaller nations proving they belong at the highest level" },
      { text: "A 48-team format that changed world football forever" },
    ],
  },
];

// ── AI ────────────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";
const SYSTEM = `You are a 2026 FIFA World Cup expert for the Pulse app. Only answer questions about the 2026 FIFA World Cup. If asked anything else say: "I only cover the 2026 World Cup."

Facts: First 48-team WC (USA/Canada/Mexico, 104 matches). Argentina reached the final — Messi (39) became all-time WC top scorer. Spain reached the final, best defensive record, beat France 2–0 in SF. Ronaldo: first 6-WC player. Mbappé: broke French records. Upsets: Morocco beat Netherlands, Norway beat Brazil, Paraguay beat Germany (all pens). Matches: Argentina 3-2 Cape Verde, Belgium 3-2 Senegal, England 3-2 Mexico, Argentina 2-1 England SF, Spain 2-0 France SF. Controversies: VAR, Connected Ball Tech, heat, hydration breaks, Las Malvinas banner. Be direct, max 2–3 sentences.`;

interface ChatMsg { role: "user" | "ai"; text: string }

async function askWC(question: string, history: ChatMsg[]): Promise<string> {
  try {
    const ctx = history.slice(-4).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: `${SYSTEM}\n\n${ctx ? ctx + "\n" : ""}User: ${question}\nAssistant:`, maxTokens: 150 }),
    });
    if (!res.ok) throw new Error();
    const d = await res.json() as { text: string };
    return d.text || "Ask me anything about the 2026 World Cup.";
  } catch {
    const q = question.toLowerCase();
    if (q.includes("messi")) return "Messi became the all-time World Cup top scorer at the 2026 tournament, leading Argentina to the final at age 39.";
    if (q.includes("ronaldo")) return "Ronaldo made history by appearing in six World Cups — a record that may never be broken.";
    if (q.includes("mbapp")) return "Mbappé broke multiple French WC records and scored in every World Cup he has played.";
    if (q.includes("spain")) return "Spain reached the final with the tournament's best defensive record, beating France 2–0 in the semi-final.";
    if (q.includes("argentina")) return "Argentina, led by Messi, reached the final — beating England 2–1 in a dramatic semi-final.";
    if (q.includes("upset")) return "Morocco beat the Netherlands, Norway beat Brazil, and Paraguay beat Germany — all on penalties.";
    if (q.includes("var")) return "VAR was heavily criticised throughout the tournament, with long reviews and inconsistent calls in nearly every knockout round.";
    return "Ask me anything about the 2026 World Cup — records, upsets, key matches, or controversies.";
  }
}

// ── AI — floating "Ask AI" pill + card/drawer ─────────────────────────────────

const CHIPS = ["What did Messi achieve?", "Biggest upset?", "Who reached the final?", "VAR controversy?"];

/**
 * Layout matches the reference image:
 * - Fixed bottom-right pill button ("Ask AI")
 * - Click → card slides up above the button (desktop)
 * - On mobile → full-height bottom drawer
 * - Card: large border-radius (like the image), ~Google-bar height for input
 */
function AIWidget() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState<ChatMsg[]>([]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const next = [...msgs, { role: "user" as const, text: q }];
    setMsgs(next);
    setLoading(true);
    const answer = await askWC(q, next);
    setMsgs(m => [...m, { role: "ai", text: answer }]);
    setLoading(false);
  }

  const card = (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--panel)",
        // big radius like the reference image
        borderRadius: 20,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Drag handle (mobile only) */}
      <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
        <div className="h-1 w-10 rounded-full bg-border" />
      </div>

      {/* Header — just the X, no subtitle/tagline */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1 shrink-0">
        <p className="text-[18px] font-bold text-foreground leading-tight">How can we help?</p>
        <button
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
        >
          <Cancel01Icon size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Chips or messages */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
        {msgs.length === 0 ? (
          <div className="space-y-1 py-1">
            {CHIPS.map((c, i) => (
              <button
                key={c}
                onClick={() => send(c)}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[13px] font-medium text-foreground transition-colors group",
                  i === 0 ? "bg-[var(--color-elevated)]" : "hover:bg-[var(--color-elevated)]",
                ].join(" ")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background/30 text-[11px]">
                  {["⚽","🏆","🇦🇷","🟥"][i]}
                </span>
                {c}
                <ArrowDown01Icon size={12} strokeWidth={2} className="ml-auto -rotate-90 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 py-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={[
                  "max-w-[84%] px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl",
                  m.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-[var(--color-elevated)] text-foreground rounded-bl-md",
                ].join(" ")}>
                  {m.text}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-elevated)] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — Google-bar height, same large radius */}
      <div className="px-5 pb-5 pt-2 shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); send(); }}
          className="flex items-center gap-3 px-4 rounded-2xl bg-[var(--color-elevated)]"
          style={{ height: 52 }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the 2026 World Cup…"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
          {input.trim() && (
            <button
              type="submit"
              disabled={loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background disabled:opacity-30 transition-opacity"
            >
              <SentIcon size={13} strokeWidth={2} />
            </button>
          )}
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <>
      {/* Backdrop when open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: bottom drawer ── */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col lg:hidden animate-slide-up"
          style={{ top: "5rem" }}
        >
          <div className="flex-1 flex flex-col rounded-t-3xl overflow-hidden" style={{ background: "var(--panel)" }}>
            {card}
          </div>
        </div>
      )}

      {/* ── Desktop: floating card above the pill — with gap ── */}
      {open && (
        <div
          className="hidden lg:block fixed z-50 w-[380px] animate-scale-in"
          style={{
            bottom: "calc(2.5rem + 44px + 12px)", /* pill bottom + pill height + gap */
            right: "1.5rem",
            transformOrigin: "bottom right",
          }}
        >
          {card}
        </div>
      )}

      {/* Fixed button — bottom-right, moderate radius, white bg with double border */}
      <div className="fixed bottom-24 right-4 lg:bottom-10 lg:right-6 z-50">
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            background: "white",
            color: "#000",
            borderRadius: 10,
            /* double border: white outer ring + thin black line */
            boxShadow: "0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.85), 0 4px 20px rgba(0,0,0,0.35)",
            border: "none",
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          Ask AI
        </button>
      </div>
    </>,
    document.body
  );
}

// ── Section thread item ───────────────────────────────────────────────────────

function SectionThread({ section, isLast }: { section: Section; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = section.icon;
  const preview = section.items.slice(0, 3);
  const rest = section.items.slice(3);

  return (
    <div className="flex gap-3">
      {/* Thread spine */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card z-10 shrink-0">
          <Icon size={14} strokeWidth={1.75} className="text-foreground" />
        </div>
        {!isLast && <div className="w-px flex-1 min-h-[24px] bg-border/40 mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-7 flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {section.category}
        </span>
        <h3 className="font-display text-[15px] font-bold text-foreground mt-0.5 mb-3">
          {section.tagline}
        </h3>

        <div className="space-y-2.5">
          {preview.map((item, i) => (
            <MomentItemRow key={i} item={item} />
          ))}
          {expanded && rest.map((item, i) => (
            <MomentItemRow key={`r${i}`} item={item} />
          ))}
        </div>

        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded
              ? <><ArrowUp01Icon size={11} strokeWidth={2} /> Show less</>
              : <><ArrowDown01Icon size={11} strokeWidth={2} /> {rest.length} more</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

function MomentItemRow({ item }: { item: MomentItem }) {
  return (
    <div className="flex items-start gap-2.5">
      {item.flag
        ? <Flag code={item.flag} size={13} className="mt-0.5 shrink-0" />
        : <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground/30 shrink-0" />
      }
      <div className="min-w-0">
        <p className="text-[13px] text-foreground leading-snug">{item.text}</p>
        {item.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Categories for filtering (not individual names)
const FILTERS = [
  { id: "all",           label: "All" },
  { id: "history",       label: "History" },
  { id: "records",       label: "Records" },
  { id: "upsets",        label: "Upsets" },
  { id: "matches",       label: "Matches" },
  { id: "controversies", label: "Controversies" },
  { id: "stories",       label: "Storylines" },
];

function MomentsPage() {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const searchRef             = useRef<HTMLInputElement>(null);

  const displayed = SECTIONS.filter(s => {
    const matchFilter =
      filter === "all" ||
      filter === s.id ||
      (filter === "records" && s.category === "Records");
    const q = search.toLowerCase().trim();
    const matchSearch = !q || s.tagline.toLowerCase().includes(q) ||
      s.items.some(i => i.text.toLowerCase().includes(q) || (i.sub ?? "").toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  return (
    <>
      <TopBar title="Moments" />

      <div className="mx-auto max-w-xl px-4 py-5 lg:px-5 lg:py-8">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <ChampionIcon size={14} strokeWidth={1.75} className="text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              2026 FIFA World Cup
            </span>
          </div>
          <h1 className="font-display text-[20px] font-bold text-foreground tracking-tight">
            History Made
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Records, upsets and moments that will be talked about for decades.
          </p>
        </div>

        {/* Search bar — centered, prominent */}
        <div className="relative mb-5">
          <Search01Icon
            size={14}
            strokeWidth={1.75}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search moments, players, matches…"
            className="w-full rounded-2xl border border-border bg-[var(--color-elevated)] pl-9 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Cancel01Icon size={13} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Filter pills — categories only, no names */}
        <div className="-mx-4 px-4 mb-6 flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap",
                filter === f.id
                  ? "bg-foreground text-background"
                  : "bg-[var(--color-elevated)] text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Thread */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-[14px] font-semibold text-foreground">No results</p>
            <p className="text-[12px] text-muted-foreground">Try a different search or filter.</p>
          </div>
        ) : (
          <div>
            {displayed.map((section, idx) => (
              <SectionThread
                key={section.id}
                section={section}
                isLast={idx === displayed.length - 1}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/35">
          <Award01Icon size={11} strokeWidth={1.75} />
          <span>2026 FIFA World Cup · USA, Canada &amp; Mexico</span>
        </div>
      </div>

      <AIWidget />
    </>
  );
}