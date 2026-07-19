import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookmarkAdd02Icon, CheckmarkCircle01Icon } from "hugeicons-react";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { useWallet } from "@/hooks/useWallet";
import { getMemories, type MatchMemory, getOrCreateLocalId } from "@/lib/memories";
import { WalletModal } from "@/components/WalletModal";

export const Route = createFileRoute("/memories")({
  component: MemoriesPage,
});

/** Get or create a stable anonymous local identity */
function getLocalId(): string {
  return getOrCreateLocalId();
}

function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── MemoryCard ──────────────────────────────────────────────────────────── */
function MemoryCard({ memory }: { memory: MatchMemory }) {
  const pulseSnippet =
    memory.pulse.length > 100 ? memory.pulse.slice(0, 100) + "…" : memory.pulse;

  const winnerLabel =
    memory.winner === "home"
      ? memory.homeTeam
      : memory.winner === "away"
        ? memory.awayTeam
        : "Draw";

  return (
    <article className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 animate-fade-up hover:border-foreground/20 transition-colors">
      {/* Badge row */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{memory.competition}</span>
        <span className="flex items-center gap-1">
          <CheckmarkCircle01Icon size={10} strokeWidth={2} />
          FT
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Flag code={memory.homeTeam.slice(0, 3).toUpperCase()} size={14} />
          <span className="font-display text-[13px] font-semibold text-foreground truncate">
            {memory.homeTeam}
          </span>
        </div>
        <span className="font-numeric text-[18px] font-bold text-foreground tabular-nums shrink-0 px-2">
          {memory.homeScore} – {memory.awayScore}
        </span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="font-display text-[13px] font-semibold text-foreground truncate">
            {memory.awayTeam}
          </span>
          <Flag code={memory.awayTeam.slice(0, 3).toUpperCase()} size={14} />
        </div>
      </div>

      {/* Winner tag + signature badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {memory.winner === "draw" ? "Match ended in a draw" : `${winnerLabel} won`}
          {" · "}
          {formatDate(memory.savedAt)}
        </p>
        {memory.txRef && (
          <span
            title={`Signed with wallet: ${memory.txRef.slice(0, 12)}…`}
            className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Signed
          </span>
        )}
      </div>

      {/* AI pulse snippet */}
      {pulseSnippet && (
        <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
          {pulseSnippet}
        </p>
      )}

      {/* CTA */}
      <Link
        to="/match/$id"
        params={{ id: memory.matchId }}
        className="mt-auto inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
      >
        View Match
      </Link>
    </article>
  );
}

/* ── MemoriesPage ────────────────────────────────────────────────────────── */
function MemoriesPage() {
  const { connected, address, connecting, connect, disconnect } = useWallet();
  const [memories, setMemories] = useState<MatchMemory[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  useEffect(() => {
    // Load memories using wallet address if connected, else local anonymous ID
    const identity = address ?? getLocalId();
    setMemories(getMemories(identity));
  }, [connected, address]);

  const handleConnect = async () => {
    await connect();
    setWalletModalOpen(false);
  };

  return (
    <>
      <TopBar
        title="My Memories"
        action={
          connected && address ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">
                {shortenAddress(address)}
              </span>
              <button
                onClick={disconnect}
                className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-[20px] font-bold tracking-tight text-foreground">
            My Match Memories
          </h1>

          {/* Wallet connect — optional enhancement, not a gate */}
          {!connected && (
            <button
              onClick={() => setWalletModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
            >
              <img src="/solana.png" alt="" className="h-3.5 w-3.5 object-contain opacity-70" />
              Connect wallet to sync
            </button>
          )}
        </div>

        {/* No memories saved yet */}
        {memories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <BookmarkAdd02Icon size={24} strokeWidth={1.75} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-[14px] font-semibold text-foreground">No memories saved yet</p>
              <p className="text-[13px] text-muted-foreground max-w-xs">
                Open any finished match and tap{" "}
                <span className="font-medium text-foreground">Save Memory</span>{" "}
                to store it here. No wallet needed.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
            >
              Browse matches
            </Link>
          </div>
        )}

        {/* Memories grid */}
        {memories.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memories
              .slice()
              .sort((a, b) => b.savedAt - a.savedAt)
              .map((m) => (
                <MemoryCard key={m.id} memory={m} />
              ))}
          </div>
        )}
      </div>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConnect={handleConnect}
        connecting={connecting}
        phantomInstalled={typeof window !== "undefined" && !!(window as any).solana?.isPhantom}
      />
    </>
  );
}
