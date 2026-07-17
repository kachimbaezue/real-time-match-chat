import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
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
  ArrowRight01Icon,
  SparklesIcon,
  SentIcon,
  Cancel01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "hugeicons-react";

export const Route = createFileRoute("/moments")({
  head: () => ({
    meta: [
      { title: "Moments — Pulse | 2026 FIFA World Cup History" },
      { name: "description", content: "History-making records, biggest upsets and defining moments from the 2026 FIFA World Cup. Ask our AI anything about the tournament." },
      { property: "og:title", content: "Moments — Pulse" },
      { property: "og:description", content: "Records shattered. Upsets that stunned the world. The 2026 World Cup moments that will be talked about for decades." },
    ],
  }),
  component: MomentsPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  title: string;
  items: Item[];
}

interface Item {
  text: string;
  flag?: string; // 2-letter ISO
  sub?: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "tournament",
    icon: ChampionIcon,
    label: "History",
    title: "Tournament firsts",
    items: [
      { text: "First-ever 48-team FIFA World Cup" },
      { text: "First World Cup hosted by three countries", sub: "USA, Canada & Mexico" },
      { text: "First World Cup with 104 matches" },
      { text: "First World Cup featuring a Round of 32" },
      { text: "1,200+ players — largest squad count in history" },
      { text: "Most stadiums and most travel distance ever" },
    ],
  },
  {
    id: "messi",
    icon: UserStar01Icon,
    label: "Messi",
    title: "Lionel Messi",
    items: [
      { text: "All-time leading World Cup goalscorer", flag: "AR" },
      { text: "Most World Cup appearances ever", flag: "AR" },
      { text: "Oldest player to score multiple goals in a World Cup", flag: "AR" },
      { text: "Led Argentina to the final at age 39", flag: "AR" },
    ],
  },
  {
    id: "ronaldo",
    icon: UserStar01Icon,
    label: "Ronaldo",
    title: "Cristiano Ronaldo",
    items: [
      { text: "First player to appear in six FIFA World Cups", flag: "PT" },
      { text: "Oldest outfield player in World Cup history", flag: "PT" },
    ],
  },
  {
    id: "mbappe",
    icon: FlashIcon,
    label: "Mbappé",
    title: "Kylian Mbappé",
    items: [
      { text: "Broke multiple French World Cup scoring records", flag: "FR" },
      { text: "Scored in every World Cup he has played", flag: "FR" },
      { text: "Surpassed all-time knockout-stage scoring marks", flag: "FR" },
    ],
  },
  {
    id: "upsets",
    icon: AlertDiamondIcon,
    label: "Upsets",
    title: "Giant killers",
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
    icon: FootballIcon,
    label: "Matches",
    title: "Matches that stopped the world",
    items: [
      { text: "Argentina 3–2 Cape Verde", flag: "AR" },
      { text: "Belgium 3–2 Senegal", flag: "BE" },
      { text: "England 3–2 Mexico", flag: "GB" },
      { text: "Spain 2–1 Belgium", flag: "ES" },
      { text: "Argentina 2–1 England — Semi-final", flag: "AR", sub: "Messi's final chapter" },
      { text: "Spain 2–0 France — Semi-final", flag: "ES", sub: "One of the tournament's great defensive performances" },
    ],
  },
  {
    id: "controversies",
    icon: AlertDiamondIcon,
    label: "Controversies",
    title: "What divided fans",
    items: [
      { text: "VAR controversy in almost every knockout round", sub: "Long reviews, inconsistent calls, marginal offsides" },
      { text: "Connected Ball Technology decided key goals and offsides", sub: "Criticism that decisions became overly technical" },
      { text: "Hydration breaks interrupted match flow", sub: "Mandatory cooling breaks sparked debate" },
      { text: "Extreme heat raised player safety concerns" },
      { text: "Argentina's Las Malvinas banner post-semi-final", sub: "FIFA investigation sparked" },
      { text: "Skycam cable controversy in one knockout match" },
      { text: "Third-place playoff criticised by coaches and fans" },
    ],
  },
  {
    id: "stories",
    icon: BookOpen01Icon,
    label: "Storylines",
    title: "What we'll remember",
    items: [
      { text: "Messi chasing another World Cup title at 39" },
      { text: "Spain reaching the final with the tournament's best defensive record", flag: "ES" },
      { text: "Argentina defending their World Cup crown", flag: "AR" },
      { text: "England falling just short in the semi-final again", flag: "GB" },
      { text: "Smaller nations proving they belong at the top table" },
      { text: "A 48-team format that changed the tournament forever" },
    ],
  },
];

// ── AI ────────────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

const WC_CONTEXT = `You are a 2026 FIFA World Cup expert for the Pulse app. Only answer questions about the 2026 FIFA World Cup. If asked about anything else, politely say you only cover the 2026 World Cup.

Key facts:
- First 48-team World Cup hosted by USA, Canada and Mexico, 104 matches
- Argentina reached the final (Messi, 39, became all-time WC top scorer, most appearances)  
- Spain reached the final with the best defensive record, beat France 2-0 in semi-final
- Ronaldo: first player to appear in 6 World Cups
- Mbappé: broke French WC scoring records, scored in every WC he's played
- Big upsets: Morocco beat Netherlands, Norway beat Brazil, Paraguay beat Germany (all on penalties)
- Key matches: Argentina 3-2 Cape Verde, Belgium 3-2 Senegal, England 3-2 Mexico, Argentina 2-1 England (SF), Spain 2-0 France (SF)
- Controversies: VAR debates, Connected Ball Technology, extreme heat, hydration breaks, Las Malvinas banner
- Cape Verde and Colombia were the tournament's Cinderella stories

Keep answers under 3 sentences. Be direct and confident.`;

async function askAI(question: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `${WC_CONTEXT}\n\nUser: ${question}\nAssistant:`,
        maxTokens: 150,
      }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json() as { text: string };
    return data.text || "I couldn't find an answer for that.";
  } catch {
    const q = question.toLowerCase();
    if (q.includes("messi")) return "Messi became the all-time World Cup top scorer at the 2026 tournament, leading Argentina to the final at age 39.";
    if (q.includes("ronaldo")) return "Ronaldo made history by appearing in six World Cups — a record that may never be broken.";
    if (q.includes("mbapp")) return "Mbappé broke multiple French scoring records and continued his streak of scoring in every World Cup he has played.";
    if (q.includes("spain")) return "Spain reached the final with the tournament's best defensive record, beating France 2–0 in the semi-final.";
    if (q.includes("argentina")) return "Argentina, led by Messi, reached the final once again — beating England 2–1 in the semi-final.";
    if (q.includes("upset") || q.includes("surprise")) return "Morocco beat the Netherlands, Norway beat Brazil, and Paraguay beat Germany — all on penalties.";
    if (q.includes("var")) return "VAR was heavily criticised throughout — long reviews, inconsistent decisions and marginal offsides featured in almost every knockout round.";
    return "Ask me anything about the 2026 World Cup — records, upsets, key matches, or controversies.";
  }
}

// ── Section row ───────────────────────────────────────────────────────────────

function SectionRow({ section }: { section: Section }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = section.icon;
  const preview = section.items.slice(0, 3);
  const rest = section.items.slice(3);

  return (
    <div className="border-b border-border last:border-0">
      {/* Section header */}
      <div className="flex items-center gap-3 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-elevated)] border border-border">
          <Icon size={15} strokeWidth={1.75} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{section.label}</p>
          <h3 className="font-display text-[14px] font-bold text-foreground leading-tight">{section.title}</h3>
        </div>
      </div>

      {/* Items */}
      <div className="pb-4 space-y-2.5 pl-11">
        {preview.map((item, i) => (
          <ItemRow key={i} item={item} />
        ))}
        {expanded && rest.map((item, i) => (
          <ItemRow key={`r${i}`} item={item} />
        ))}
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            {expanded
              ? <><ArrowUp01Icon size={11} strokeWidth={2} />Show less</>
              : <><ArrowDown01Icon size={11} strokeWidth={2} />{rest.length} more</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="flex items-start gap-2.5">
      {item.flag
        ? <Flag code={item.flag} size={13} className="mt-0.5 shrink-0" />
        : <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
      }
      <div>
        <p className="text-[13px] text-foreground leading-snug">{item.text}</p>
        {item.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>}
      </div>
    </div>
  );
}

// ── Floating AI input ─────────────────────────────────────────────────────────

interface AIMessage {
  role: "user" | "ai";
  text: string;
}

function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    const answer = await askAI(q);
    setMessages((m) => [...m, { role: "ai", text: answer }]);
    setLoading(false);
  }

  const CHIPS = ["What did Messi achieve?", "Biggest upset?", "Who reached the final?", "VAR controversy?"];

  return (
    <>
      {/* Floating bar at bottom */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
        {/* Chat bubble when open */}
        {open && (
          <div
            className="mb-2 rounded-2xl border border-border overflow-hidden shadow-2xl shadow-black/40 animate-scale-in"
            style={{ background: "var(--panel)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <SparklesIcon size={13} strokeWidth={1.75} className="text-muted-foreground" />
                <span className="text-[12px] font-semibold text-foreground">Ask about the 2026 World Cup</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Cancel01Icon size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Messages */}
            {messages.length > 0 && (
              <div className="max-h-56 overflow-y-auto px-4 py-3 space-y-2.5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <p className={[
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-background rounded-br-sm"
                        : "bg-[var(--color-elevated)] text-foreground rounded-bl-sm",
                    ].join(" ")}>
                      {msg.text}
                    </p>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-[var(--color-elevated)] px-3.5 py-2.5 flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Quick chips — only when no messages yet */}
            {messages.length === 0 && (
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {CHIPS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setInput(c); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input bar */}
        <div
          className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3 shadow-xl shadow-black/30"
          style={{ background: "var(--panel)" }}
        >
          <SparklesIcon size={14} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={input}
            onFocus={() => setOpen(true)}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Ask anything about the 2026 World Cup…"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {input.trim() && (
            <button
              onClick={send}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-foreground text-background transition-opacity disabled:opacity-40 shrink-0"
            >
              <SentIcon size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function MomentsPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const displayed = activeFilter === "all"
    ? SECTIONS
    : SECTIONS.filter(s => s.id === activeFilter);

  return (
    <>
      <TopBar title="Moments" />
      <div className="mx-auto max-w-xl px-4 py-5 lg:px-5 lg:py-8 pb-40">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <ChampionIcon size={15} strokeWidth={1.75} className="text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">2026 FIFA World Cup</span>
          </div>
          <h1 className="font-display text-[20px] font-bold text-foreground tracking-tight">History Made</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Records, upsets and moments that will be talked about for decades.
          </p>
        </div>

        {/* Filter pills */}
        <div className="-mx-4 px-4 mb-5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[{ id: "all", label: "All" }, ...SECTIONS.map(s => ({ id: s.id, label: s.label }))].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={[
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                activeFilter === f.id
                  ? "bg-foreground text-background"
                  : "bg-[var(--color-elevated)] text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sections — clean single column list */}
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: "var(--color-elevated)" }}>
          <div className="divide-y divide-border px-4">
            {displayed.map(section => (
              <SectionRow key={section.id} section={section} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
          <Award01Icon size={11} strokeWidth={1.75} />
          <span>2026 FIFA World Cup · USA, Canada &amp; Mexico</span>
        </div>
      </div>

      <FloatingAI />
    </>
  );
}
