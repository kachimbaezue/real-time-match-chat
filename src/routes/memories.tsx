import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookmarkAdd02Icon } from "hugeicons-react";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { useWallet } from "@/hooks/useWallet";
import { getMemories, type MatchMemory } from "@/lib/memories";
import { WalletModal } from "@/components/WalletModal";

export const Route = createFileRoute("/memories")({
  component: MemoriesPage,
});

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
    memory.pulse.length > 80 ? memory.pulse.slice(0, 80) + "…" : memory.pulse;

  return (
    <article className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 animate-fade-up hover:border-border/80 transition-colors">
      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Flag code={memory.homeTeam.slice(0, 3).toUpperCase()} size={13} />
          <span className="font-display text-[13px] font-semibold text-foreground truncate">
            {memory.homeTeam}
          </span>
        </div>
        <span className="font-numeric text-[16px] font-bold text-foreground tabular-nums shrink-0">
          {memory.homeScore} – {memory.awayScore}
        </span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="font-display text-[13px] font-semibold text-foreground truncate">
            {memory.awayTeam}
          </span>
          <Flag code={memory.awayTeam.slice(0, 3).toUpperCase()} size={13} />
        </div>
      </div>

      {/* Competition + date */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{memory.competition}</span>
        <span>{formatDate(memory.savedAt)}</span>
      </div>

      {/* AI pulse snippet */}
      {pulseSnippet && (
        <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
          {pulseSnippet}
        </p>
      )}

      {/* CTA */}
      <Link
        to="/memories/$id"
        params={{ id: memory.id }}
        className="mt-auto inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
      >
        View Memory
      </Link>
    </article>
  );
}

/* ── MemoriesPage ────────────────────────────────────────────────────────── */
function MemoriesPage() {
  const { connected, address, connecting, connect, disconnect, phantomInstalled } = useWallet();
  const [memories, setMemories] = useState<MatchMemory[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Reload memories when wallet connects
  useEffect(() => {
    if (connected && address) {
      setMemories(getMemories(address));
    } else {
      setMemories([]);
    }
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
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-[20px] font-bold tracking-tight text-foreground">
            My Match Memories
          </h1>
          {connected && address && (
            <span className="hidden sm:block text-[11px] font-mono text-muted-foreground">
              {shortenAddress(address)}
            </span>
          )}
        </div>

        {/* State 1: Not connected */}
        {!connected && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <BookmarkAdd02Icon size={24} strokeWidth={1.75} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-[16px] font-semibold text-foreground">
                My Match Memories
              </h2>
              <p className="text-[13px] text-muted-foreground max-w-xs">
                Connect your Phantom wallet to save and revisit your favourite finished matches.
              </p>
            </div>
            <button
              onClick={() => setWalletModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* State 2: Connected, no memories */}
        {connected && memories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <BookmarkAdd02Icon size={24} strokeWidth={1.75} className="text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <p className="text-[14px] font-semibold text-foreground">No Match Memories yet.</p>
              <p className="text-[13px] text-muted-foreground max-w-xs">
                After a match ends, open the match page and tap "Save Memory" to store it here.
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

        {/* State 3: Connected with memories */}
        {connected && memories.length > 0 && (
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
        phantomInstalled={phantomInstalled}
      />
    </>
  );
}
