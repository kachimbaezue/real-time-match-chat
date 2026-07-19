import ReactDOM from "react-dom";
import { Cancel01Icon, LinkSquare02Icon } from "hugeicons-react";

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
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border shadow-2xl"
        style={{ background: "var(--panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/solana.png" alt="Solana" className="h-5 w-5 object-contain" />
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
        <div className="px-5 py-5 space-y-4">
          {!phantomInstalled ? (
            <>
              {/* Step 1 — install */}
              <div className="rounded-xl border border-border bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-[12px] font-semibold text-foreground">Step 1 — Install Phantom</p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Phantom is a free browser extension for Solana. Install it, then come back here to connect.
                </p>
                <a
                  href="https://phantom.app/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Download Phantom
                  <LinkSquare02Icon size={12} strokeWidth={2} />
                </a>
              </div>

              {/* Step 2 — after install */}
              <div className="rounded-xl border border-border p-4 opacity-50 space-y-2">
                <p className="text-[12px] font-semibold text-foreground">Step 2 — Connect</p>
                <p className="text-[12px] text-muted-foreground">
                  After installing, refresh this page and tap "Connect Wallet" again.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
              >
                Maybe later
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Connect your Phantom wallet to sync your match memories across devices.
              </p>
              <button
                onClick={onConnect}
                disabled={connecting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? "Connecting…" : "Connect Phantom"}
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--color-elevated)] transition-colors"
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
