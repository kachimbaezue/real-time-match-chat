import ReactDOM from "react-dom";
import { Cancel01Icon } from "hugeicons-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => Promise<void>;
  connecting: boolean;
  phantomInstalled: boolean;
}

export function WalletModal({
  isOpen,
  onClose,
  onConnect,
  connecting,
  phantomInstalled,
}: WalletModalProps) {
  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border shadow-2xl animate-scale-in"
        style={{ background: "var(--panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/solana.png" alt="Solana" className="h-6 w-6 object-contain" />
            <span className="font-display text-[14px] font-bold text-foreground">
              Connect Wallet
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--color-elevated)] hover:text-foreground transition-colors"
          >
            <Cancel01Icon size={15} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {!phantomInstalled ? (
            <>
              <p className="text-[13px] leading-relaxed text-muted-foreground mb-4">
                Phantom wallet is required to save match memories. Install it to continue.
              </p>
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
              >
                Install Phantom
              </a>
              <button
                onClick={onClose}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-muted-foreground mb-4">
                Connect your Phantom wallet to save match memories on Solana.
              </p>
              <button
                onClick={onConnect}
                disabled={connecting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? "Connecting…" : "Connect Phantom Wallet"}
              </button>
              <button
                onClick={onClose}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(modal, document.body);
}
