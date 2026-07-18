import { useState } from "react";
import { BookmarkAdd02Icon, BookmarkCheck02Icon } from "hugeicons-react";
import type { Match } from "@/lib/matches";
import { buildMemory, saveMemory, getMemories } from "@/lib/memories";
import { useWallet } from "@/hooks/useWallet";
import { WalletModal } from "@/components/WalletModal";

interface SaveMemoryButtonProps {
  match: Match;
}

export function SaveMemoryButton({ match }: SaveMemoryButtonProps) {
  const { connected, address, connecting, connect, phantomInstalled } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const [saved, setSaved] = useState<boolean>(() => {
    if (!address) return false;
    const existing = getMemories(address);
    return existing.some((m) => m.matchId === match.id);
  });
  const [justSaved, setJustSaved] = useState(false);

  // Only render for finished matches
  if (match.status !== "finished") return null;

  const alreadySaved = saved;

  const handleClick = () => {
    if (!connected || !address) {
      setModalOpen(true);
      return;
    }
    if (alreadySaved) return;

    const memory = buildMemory(match, address);
    saveMemory(memory);
    setSaved(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleConnect = async () => {
    await connect();
    setModalOpen(false);
    // After connecting, auto-save
    // address won't update synchronously — let user click again
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={alreadySaved}
        title={alreadySaved ? "Memory already saved" : "Save match memory"}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
          alreadySaved
            ? "border-border text-muted-foreground cursor-default opacity-70"
            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-[var(--color-elevated)]",
        ].join(" ")}
      >
        {alreadySaved ? (
          <>
            <BookmarkCheck02Icon size={14} strokeWidth={2} />
            {justSaved ? "Saved!" : "Saved"}
          </>
        ) : (
          <>
            <BookmarkAdd02Icon size={14} strokeWidth={1.75} />
            Save Memory
          </>
        )}
      </button>

      <WalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
        connecting={connecting}
        phantomInstalled={phantomInstalled}
      />
    </>
  );
}
