/**
 * Phantom wallet integration — no auth, wallet address = identity
 */

const STORAGE_KEY = "pulse_wallet";

export interface WalletState {
  connected: boolean;
  address: string | null;
}

/** Check if Phantom is installed */
export function isPhantomInstalled(): boolean {
  return typeof window !== "undefined" && !!(window as any).solana?.isPhantom;
}

/** Get current wallet state from localStorage */
export function getWalletState(): WalletState {
  if (typeof window === "undefined") return { connected: false, address: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { connected: false, address: null };
    return JSON.parse(raw) as WalletState;
  } catch {
    return { connected: false, address: null };
  }
}

/** Save wallet state to localStorage */
export function saveWalletState(state: WalletState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

/** Connect to Phantom wallet — returns public key string or null */
export async function connectPhantom(): Promise<string | null> {
  if (!isPhantomInstalled()) return null;
  try {
    const solana = (window as any).solana;
    const resp = await solana.connect();
    const address: string = resp.publicKey.toString();
    saveWalletState({ connected: true, address });
    return address;
  } catch {
    return null;
  }
}

/** Disconnect wallet and clear localStorage */
export function disconnectWallet(): void {
  if (typeof window === "undefined") return;
  try {
    if (isPhantomInstalled()) {
      (window as any).solana.disconnect();
    }
  } catch {
    // ignore disconnect errors
  }
  saveWalletState({ connected: false, address: null });
  localStorage.removeItem(STORAGE_KEY);
}
