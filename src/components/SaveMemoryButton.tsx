import { useState } from "react";
import { BookmarkAdd02Icon, BookmarkCheck02Icon } from "hugeicons-react";
import type { Match } from "@/lib/matches";
import { buildMemory, saveMemory, getMemories, getOrCreateLocalId } from "@/lib/memories";
import { useWallet } from "@/hooks/useWallet";

interface SaveMemoryButtonProps {
  match: Match;
}

/**
 * Save Memory button — works WITHOUT a wallet.
 *
 * Without Phantom: saves to a random stable local ID (device-bound).
 * With Phantom connected: signs a message proving the user witnessed this
 *   match, stores the base64 signature as txRef — a cryptographic receipt.
 *   The wallet address keys the memory so it's retrievable on any device.
 */
export function SaveMemoryButton({ match }: SaveMemoryButtonProps) {
  const { connected, address } = useWallet();
  const identity = address ?? getOrCreateLocalId();

  const [saved, setSaved] = useState<boolean>(() => {
    return getMemories(identity).some((m) => m.matchId === match.id);
  });
  const [justSaved, setJustSaved] = useState(false);
  const [signing, setSigning] = useState(false);

  if (match.status !== "finished") return null;

  const handleClick = async () => {
    if (saved || signing) return;

    let txRef: string | null = null;

    // If Phantom is connected, sign a message — creates a verifiable receipt
    if (connected && address && typeof window !== "undefined") {
      try {
        setSigning(true);
        const solana = (window as any).solana;
        if (solana?.isPhantom) {
          const message = `Pulse Memory\nMatch: ${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}\nID: ${match.id}\nSaved: ${new Date().toISOString()}`;
          const encoded = new TextEncoder().encode(message);
          const { signature } = await solana.signMessage(encoded, "utf8");
          // Convert Uint8Array signature to base64 string for storage
          txRef = btoa(String.fromCharCode(...signature));
        }
      } catch {
        // User rejected signing or Phantom not available — save without signature
        txRef = null;
      } finally {
        setSigning(false);
      }
    }

    const memory = buildMemory(match, identity, txRef);
    saveMemory(memory);
    setSaved(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={saved || signing}
      title={saved ? "Memory already saved" : connected ? "Save & sign with wallet" : "Save match memory"}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
        saved
          ? "border-border text-muted-foreground cursor-default opacity-70"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-[var(--color-elevated)]",
      ].join(" ")}
    >
      {signing ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-muted-foreground border-t-foreground" />
          Signing…
        </>
      ) : saved ? (
        <>
          <BookmarkCheck02Icon size={14} strokeWidth={2} />
          {justSaved ? (connected ? "Signed & Saved!" : "Saved!") : "Saved"}
        </>
      ) : (
        <>
          <BookmarkAdd02Icon size={14} strokeWidth={1.75} />
          {connected ? "Sign & Save Memory" : "Save Memory"}
        </>
      )}
    </button>
  );
}
