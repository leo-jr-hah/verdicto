/**
 * CSPRClickProvider — lightweight wallet context.
 *
 * Detects Casper Wallet via window.casper (injected by Casper Wallet v2.x
 * browser extension). No external SDK dependency needed for the demo.
 *
 * If the extension is NOT installed, clicking "Connect Wallet" opens the
 * Chrome Web Store so the user can install it.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/* ---------- Context shape ---------- */

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  accountHash: string | null;
  accountName: string | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  walletInstalled: boolean;
}

const WalletContext = createContext<WalletState | null>(null);

/* ---------- Helpers ---------- */

const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en';

function accountHashFromPublicKey(publicKeyHex: string): string {
  const cleanHex = publicKeyHex.replace(/^0(0|x)/i, '');
  let hash = 0;
  for (let i = 0; i < cleanHex.length; i++) {
    hash = ((hash << 5) - hash + cleanHex.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `account-hash-${cleanHex.substring(0, 8)}...${hex}`;
}

/** Check if Casper Wallet extension is installed */
function isCasperWalletInstalled(): boolean {
  return typeof window !== 'undefined' && !!(window as any).casper;
}

/* ---------- Provider ---------- */

export const CSPRClickProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [accountHash, setAccountHash] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInstalled, setWalletInstalled] = useState(false);

  // Check wallet installation on mount
  useEffect(() => {
    setWalletInstalled(isCasperWalletInstalled());

    // Also check periodically (extension may load after page)
    const interval = setInterval(() => {
      setWalletInstalled(isCasperWalletInstalled());
    }, 1000);

    // Stop checking after 10s
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    // If wallet not installed, open Chrome Web Store
    if (!isCasperWalletInstalled()) {
      window.open(CHROME_WEB_STORE_URL, '_blank');
      return;
    }

    setLoading(true);

    try {
      const casper = (window as any).casper;

      // Request connection — Casper Wallet v2.x shows its popup
      const result = await casper.requestConnection();

      if (result && result.publicKey) {
        setConnected(true);
        setPublicKey(result.publicKey);
        setAccountHash(accountHashFromPublicKey(result.publicKey));
        setAccountName(result.activeKey || null);
      }
    } catch (err: any) {
      // User cancelled — not a real error
      if (err?.message?.includes('cancelled') || err?.message?.includes('denied')) {
        // silently ignore
      } else {
        setError(err?.message || 'Failed to connect wallet.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPublicKey(null);
    setAccountHash(null);
    setAccountName(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{
      connected,
      publicKey,
      accountHash,
      accountName,
      loading,
      error,
      connect,
      disconnect,
      walletInstalled,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Access wallet state from any component.
 * Throws if used outside <CSPRClickProvider>.
 */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <CSPRClickProvider>');
  }
  return ctx;
}
