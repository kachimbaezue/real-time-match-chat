import { useState, useCallback } from "react";
import {
  connectPhantom,
  disconnectWallet,
  getWalletState,
  isPhantomInstalled,
} from "@/lib/wallet";

export interface UseWalletReturn {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  phantomInstalled: boolean;
}

export function useWallet(): UseWalletReturn {
  const initial = getWalletState();
  const [connected, setConnected] = useState<boolean>(initial.connected);
  const [address, setAddress] = useState<string | null>(initial.address);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [phantomInstalled] = useState<boolean>(isPhantomInstalled());

  const connect = useCallback(async () => {
    if (!isPhantomInstalled()) return;
    setConnecting(true);
    try {
      const addr = await connectPhantom();
      if (addr) {
        setConnected(true);
        setAddress(addr);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setConnected(false);
    setAddress(null);
  }, []);

  return { connected, address, connecting, connect, disconnect, phantomInstalled };
}
