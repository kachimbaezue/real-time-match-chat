import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import {
  ChampionIcon,
  Trophy01Icon,
  FootballIcon,
  UserStar01Icon,
  AlertDiamondIcon,
  FlashIcon,
  BookOpen01Icon,
  ArrowRight01Icon,
  SparklesIcon,
  SendIcon,
  Cancel01Icon,
  ArrowUp01Icon,
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

// ── Data ──────────────────────────────────────────────────────────────────────

type MomentCategory = "history" | "records" | "upsets" | "matches" | "stars" | "controversies" | "stories";

interface Moment {
  id: string;
  category: MomentCategory;
  title: string;
  subtitle?: string;
  items: string[];
  flag?: string;   // ISO 2-letter for flag
  icon: React.ComponentType<any>;
  accent: string;  // tailwind color class for the glow/border
  featured?: boolean;
}

const MOMENTS: Moment[] = [
  // ── History ──
  {
    id: "tournament",
    category: "history",
    title: "First-Ever 48-Team World Cup",
    subtitle: "A tournament unlike anything before it",
    icon: ChampionIcon,
    accent: "from-amber-500/20 to-yellow-500/5",
    featured: true,
    items: [
      "First World Cup hosted by three countries — USA, Canada & Mexico",
      "First World Cup with 104 matches",
      "First World Cup featuring a Round of 32",
      "Biggest tournament in FIFA history",
      "1,200+ players — largest squad count ever",
      "Most stadiums ever used in a single World Cup",
      "Most travel distance between venues in World Cup history",
    ],
  },
  // ── Records ──
  {
    id: "messi",
    category: "records",
    title: "Lionel Messi",
    subtitle: "The Greatest — rewriting history at 39",
    icon: UserStar01Icon,
    accent: "from-sky-500/20 to-blue-500/5",
    featured: true,
    flag: "ar",
    items: [
      "Became the all-time leading World Cup goalscorer",
      "Extended his record for most World Cup appearances",
      "Oldest player ever to score multiple goals in a World Cup",
      "Led Argentina to another World Cup final at age 39",
    ],
  },
  {
    id: "ronaldo",
    category: "records",
    title: "Cristiano Ronaldo",
    subtitle: "Six World Cups — a record that may never fall",
    icon: UserStar01Icon,
    accent: "from-red-500/20 to-rose-500/5",
    flag: "pt",
    items: [
      "First player ever to appear in six FIFA World Cups",
      "Extended his record as the oldest outfield player in World Cup history",
    ],
  },
  {
    id: "mbappe",
    category: "records",
    title: "Kylian Mbappé",
    subtitle: "France's knockout-stage machine",
    icon: FlashIcon,
    accent: "from-blue-500/20 to-indigo-500/5",
    flag: "fr",
    items: [
      "Broke multiple French World Cup scoring records",
      "Continued his streak of scoring in every World Cup he's played",
      "Surpassed several all-time knockout-stage scoring marks",
    ],
  },
  // ── Upsets ──
  {
    id: "upsets",
    category: "upsets",
    title: "The Giant Killers",
    subtitle: "Moments that stopped the world",
    icon: AlertDiamondIcon,
    accent: "from-emerald-500/20 to-green-500/5",
    featured: true,
    items: [
      "🇲🇦 Morocco eliminated the Netherlands — huge upset on penalties",
      "🇳🇴 Norway knocked out Brazil — one of the biggest surprises of the Round of 16",
      "🇵🇾 Paraguay eliminated Germany — won on penalties after a 1–1 draw",
      "🇪🇬 Egypt beat Australia on penalties — a dramatic shootout thriller",
      "🇨🇻 Cape Verde reached the knockout stage — the tournament's Cinderella story",
      "🇨🇴 Colombia reached the Round of 16 — another strong run for South America",
    ],
  },
  // ── Biggest Matches ──
  {
    id: "matches",
    category: "matches",
    title: "Matches You Had to Watch",
    subtitle: "The games that defined the tournament",
    icon: FootballIcon,
    accent: "from-violet-500/20 to-purple-500/5",
    items: [
      "🇦🇷 Argentina 3–2 🇨🇻 Cape Verde",
      "🇧🇪 Belgium 3–2 🇸🇳 Senegal",
      "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England 3–2 🇲🇽 Mexico",
      "🇪🇸 Spain 2–1 🇧🇪 Belgium",
      "🇦🇷 Argentina 2–1 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (Semi-final)",
      "🇪🇸 Spain 2–0 🇫🇷 France (Semi-final)",
    ],
  },
  // ── Stars ──
  {
    id: "stars",
    category: "stars",
    title: "Individual Brilliance",
    subtitle: "Players who carried their nations",
    icon: SparklesIcon,
    accent: "from-orange-500/20 to-amber-500/5",
    items: [
      "Lionel Messi carrying Argentina once again to a World Cup final at 39",
      "Kylian Mbappé producing another elite tournament — records shattered",
      "Spain's defense emerging as the tournament's defining tactical story",
      "Argentina mounting another miraculous comeback in a World Cup semi-final",
    ],
  },
  // ── Controversies ──
  {
    id: "controversies",
    category: "controversies",
    title: "The Talking Points",
    subtitle: "Decisions and debates that divided fans",
    icon: AlertDiamondIcon,
    accent: "from-rose-500/20 to-red-500/5",
    items: [
      "VAR controversy — almost every knockout round sparked debate. Long reviews, inconsistent decisions, marginal offsides.",
      "Connected Ball Technology — goals and offside calls decided by ball sensors drew heavy criticism.",
      "Hydration breaks — cooling breaks interrupted match flow, splitting opinion worldwide.",
      "Extreme heat — players and coaches repeatedly raised concerns about player safety.",
      "Argentina's \"Las Malvinas\" banner post-semi-final — FIFA investigation sparked.",
      "Skycam debate — questions raised over whether a cable influenced officiating in a knockout match.",
      "Third-place playoff criticism — many fans and coaches called for FIFA to scrap it.",
    ],
  },
  // ── Stories ──
  {
    id: "stories",
    category: "stories",
    title: "The Big Storylines",
    subtitle: "What we'll remember",
    icon: BookOpen01Icon,
    accent: "from-teal-500/20 to-cyan-500/5",
    featured: true,
    items: [
      "Messi chasing another World Cup title at 39 — and leading Argentina to the final",
      "Spain reaching the final with one of the tournament's best defensive records",
      "Argentina defending their World Cup crown",
      "England falling just short in another semi-final",
      "Smaller nations proving they can compete with football's traditional powers",
      "The first 48-team World Cup changing the scale and rhythm of the game forever",
    ],
  },
];

const CATEGORY_LABELS: Record<MomentCategory, string> = {
  history:       "History",
  records:       "Records",
  upsets:        "Upsets",
  matches:       "Matches",
  stars:         "Stars",
  controversies: "Controversies",
  stories:       "Stories",
};

// ── AI Chat ───────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const CONTEXT = `You are a World Cup 2026 expert analyst assistant for the Pulse app.
Here are the key moments from the 2026 FIFA World Cup:
- First-ever 48-team tournament, hosted by USA, Canada & Mexico, 104 matches
- Argentina reached the final (Messi, 39, became all-time World Cup top scorer)
- Spain reached the final with the best defensive record
- Upsets: Morocco beat Netherlands, Norway beat Brazil, Paraguay beat Germany
- Messi: all-time World Cup goalscorer, most appearances, oldest multi-goal scorer
- Ronaldo: appeared in six World Cups (record)
- Mbappé: broke French scoring records, continued knockout-stage streak
- Key matches: Argentina 3-2 Cape Verde, Belgium 3-2 Senegal, England 3-2 Mexico, Argentina 2-1 England (SF), Spain 2-0 France (SF)
- Controversies: VAR debates, Connected Ball Technology, extreme heat, hydration breaks
Answer questions about this World Cup confidently and concisely. Keep answers under 3 sentences unless more detail is asked.`;

async function askAI(messages: ChatMessage[]): Promise<string> {
  try {
    const history = messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const prompt = `${CONTEXT}\n\nConversation:\n${history}\n\nAssistant:`;

    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens: 150 }),
    });

    if (!res.ok) throw new Error("AI unavailable");
    const data = await res.json() as { text: string };
    return data.text ?? "I couldn't find an answer for that.";
  } catch {
    // Fallback: simple keyword matching
    const last = messages[messages.length - 1]?.text.toLowerCase() ?? "";
    if (last.includes("messi")) return "Messi became the all-time World Cup top scorer at the 2026 tournament, leading Argentina to the final at age 39.";
    if (last.includes("ronaldo")) return "Ronaldo made history by appearing in six World Cups — a record that may never be broken.";
    if (last.includes("mbapp")) return "Mbappé broke multiple French scoring records and continued his remarkable streak of scoring in every World Cup.";
    if (last.includes("spain")) return "Spain reached the final with one of the tournament's best defensive records, beating France 2-0 in the semi-final.";
    if (last.includes("argentina")) return "Argentina, led by Messi, reached the final once again — beating England 2-1 in the semi-final in a dramatic match.";
    if (last.includes("upset") || last.includes("surprise")) return "The biggest upsets were Morocco eliminating the Netherlands and Norway knocking out Brazil in the Round of 16.";
    if (last.includes("var")) return "VAR controversy was a major theme — almost every knockout round featured debate about long reviews, inconsistent decisions and marginal offsides.";
    return "I can answer questions about the 2026 World Cup — records, upsets, key matches, and more. Try asking about Messi, Spain, or the biggest upsets!";
  }
}

// ── Card component ────────────────────────────────────────────────────────────

function MomentCard({ moment }: { moment: Moment }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = moment.icon;
  const preview = moment.items.slice(0, 3);
  const rest = moment.items.slice(3);

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border border-border/60 transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-black/20",
        "bg-gradient-to-br",
        moment.accent,
        "bg-[var(--color-elevated)]",
      ].join(" ")}
      style={{ background: "var(--color-elevated)" }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${moment.accent} pointer-events-none`} />

      <div className="relative p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
            <Icon size={17} strokeWidth={1.75} className="text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {moment.flag && (
                <Flag code={moment.flag.toUpperCase()} size={14} />
              )}
              <h3 className="font-display text-[14px] font-bold text-foreground leading-tight">
                {moment.title}
              </h3>
              {moment.featured && (
                <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-foreground">
                  <ChampionIcon size={8} strokeWidth={2} />
                  Historic
                </span>
              )}
            </div>
            {moment.subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{moment.subtitle}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <ul className="space-y-2">
          {preview.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-foreground/85">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground/30 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Expandable rest */}
        {rest.length > 0 && (
          <>
            {expanded && (
              <ul className="mt-2 space-y-2">
                {rest.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-foreground/85 animate-fade-up">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground/30 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>
                  <ArrowUp01Icon size={12} strokeWidth={2} />
                  Show less
                </>
              ) : (
                <>
                  <ArrowRight01Icon size={12} strokeWidth={2} />
                  {rest.length} more
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── AI Chat Drawer ────────────────────────────────────────────────────────────

function AIChatDrawer({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Ask me anything about the 2026 World Cup — records, upsets, controversial moments, star performances. I've got you." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const SUGGESTIONS = [
    "What did Messi achieve?",
    "Biggest upset of the tournament?",
    "What records did Ronaldo break?",
    "Who reached the final?",
  ];

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    const aiText = await askAI([...messages, userMsg]);
    setMessages((m) => [...m, { role: "ai", text: aiText }]);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-end lg:justify-center lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full lg:w-[420px] rounded-t-3xl lg:rounded-2xl border border-border flex flex-col overflow-hidden animate-scale-in"
        style={{ background: "var(--panel)", maxHeight: "85dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
              <SparklesIcon size={14} strokeWidth={1.75} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground">Ask about the World Cup</p>
              <p className="text-[10px] text-muted-foreground">AI · Powered by Groq</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
          >
            <Cancel01Icon size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-[var(--color-elevated)] text-foreground rounded-bl-sm border border-border/60",
                ].join(" ")}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-[var(--color-elevated)] px-3.5 py-2.5">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-[var(--color-elevated)] px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 rounded-2xl border border-border bg-[var(--color-elevated)] px-3 py-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-foreground text-background transition-opacity disabled:opacity-40"
            >
              <SendIcon size={13} strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Filter pill ────────────────────────────────────────────────────────────────

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap",
        active
          ? "bg-foreground text-background"
          : "bg-[var(--color-elevated)] text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function MomentsPage() {
  const [filter, setFilter] = useState<MomentCategory | "all">("all");
  const [chatOpen, setChatOpen] = useState(false);

  const displayed = filter === "all"
    ? MOMENTS
    : MOMENTS.filter((m) => m.category === filter);

  const featured = displayed.filter((m) => m.featured);
  const regular  = displayed.filter((m) => !m.featured);

  return (
    <>
      <TopBar title="Moments" />
      <div className="mx-auto max-w-2xl px-4 py-5 lg:px-5 lg:py-8">

        {/* Hero header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ChampionIcon size={18} strokeWidth={1.75} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                2026 FIFA World Cup
              </span>
            </div>
            <h1 className="font-display text-[22px] font-bold text-foreground tracking-tight leading-tight">
              History Made
            </h1>
            <p className="mt-1 text-[12px] text-muted-foreground max-w-sm">
              Records shattered. Upsets that stunned the world. Moments that will be talked about for decades.
            </p>
          </div>

          {/* AI ask button */}
          <button
            onClick={() => setChatOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2.5 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            <SparklesIcon size={13} strokeWidth={1.75} />
            Ask AI
          </button>
        </div>

        {/* Filter bar */}
        <div className="mb-6 -mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <FilterPill active={filter === "all"} label="All" onClick={() => setFilter("all")} />
          {(Object.keys(CATEGORY_LABELS) as MomentCategory[]).map((cat) => (
            <FilterPill
              key={cat}
              active={filter === cat}
              label={CATEGORY_LABELS[cat]}
              onClick={() => setFilter(cat)}
            />
          ))}
        </div>

        {/* Featured cards — full width */}
        {featured.length > 0 && (
          <div className="mb-4 space-y-3">
            {featured.map((m) => (
              <MomentCard key={m.id} moment={m} />
            ))}
          </div>
        )}

        {/* Regular cards — 2-col grid on desktop */}
        {regular.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {regular.map((m) => (
              <MomentCard key={m.id} moment={m} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
          <Trophy01Icon size={12} strokeWidth={1.75} />
          <span>2026 FIFA World Cup · USA, Canada &amp; Mexico</span>
        </div>
      </div>

      {/* AI Chat */}
      {chatOpen && <AIChatDrawer onClose={() => setChatOpen(false)} />}
    </>
  );
}
