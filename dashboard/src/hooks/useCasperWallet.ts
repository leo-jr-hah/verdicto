/**
 * React hook for Casper Wallet browser extension integration.
 *
 * The Casper Wallet extension injects `window.casper` with methods for
 * connecting, signing, and querying the user's CSPR account.
 *
 * This hook exposes:
 *  - connected: whether the wallet is currently connected
 *  - publicKey: the user's hex-encoded public key (or null)
 *  - accountHash: the derived account hash (or null)
 *  - connect(): request connection via the extension
 *  - disconnect(): clear local state
 *  - error: any error message from the extension
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/* ---------- Types exposed by the Casper Wallet browser extension ---------- */

interface CasperWalletProvider {
  requestConnection(): Promise<string>;       // returns public key hex
  isConnected(): Promise<boolean>;
  getActivePublicKey(): Promise<string>;      // returns public key hex
  disconnect(): Promise<boolean>;
  sign(deployJSON: string, publicKey: string): Promise<string>;
}

declare global {
  interface Window {
    casper?: CasperWalletProvider;
  }
}

/* ---------- Helper: convert public key hex → account hash ---------- */

function accountHashFromPublicKey(publicKeyHex: string): string {
  // Casper account hash = BLAKE2b256 of the public key, prefixed with "account-hash-"
  // For the hackathon demo we derive a deterministic placeholder that is visually
  // distinct but still looks like a real account hash. The real implementation
  // would use casper-js-sdk's CLPublicKey.fromHex(key).toAccountHashStr().
  //
  // We keep this lightweight so we don't pull in the full SDK just for one hash.
  // The backend already validates real deploys — this is only for UI display.
  const cleanHex = publicKeyHex.replace(/^0(0|x)/i, '');
  // Use a simple deterministic hash for display
  let hash = 0;
  for (let i = 0; i < cleanHex.length; i++) {
    hash = ((hash << 5) - hash + cleanHex.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Format like a real account hash for display
  return `account-hash-${cleanHex.substring(0, 8)}...${hex}`;
}

/* ---------- Hook ---------- */

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  accountHash: string | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isExtensionInstalled: boolean;
}

export function useCasperWallet(): WalletState {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [accountHash, setAccountHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const mountedRef = useRef(true);

  // Check extension availability on mount
  useEffect(() => {
    mountedRef.current = true;
    const hasExtension = typeof window !== 'undefined' && !!window.casper;
    if (mountedRef.current) setIsExtensionInstalled(hasExtension);

    // Check if already connected (extension remembers connections)
    if (hasExtension) {
      window.casper!.isConnected().then((isConnected) => {
        if (isConnected && mountedRef.current) {
          return window.casper!.getActivePublicKey();
        }
        return null;
      }).then((pk) => {
        if (pk && mountedRef.current) {
          setConnected(true);
          setPublicKey(pk);
          setAccountHash(accountHashFromPublicKey(pk));
        }
      }).catch(() => {
        // Extension might reject if not connected yet — that's fine
      });
    }

    // Listen for account changes in the extension
    const handleAccountChange = () => {
      if (!window.casper) return;
      window.casper.isConnected().then((isConnected) => {
        if (!isConnected) {
          setConnected(false);
          setPublicKey(null);
          setAccountHash(null);
        } else {
          window.casper!.getActivePublicKey().then((pk) => {
            if (mountedRef.current) {
              setPublicKey(pk);
              setAccountHash(accountHashFromPublicKey(pk));
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    };

    window.addEventListener('casper-wallet:accountChanged', handleAccountChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('casper-wallet:accountChanged', handleAccountChange);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.casper) {
      setError('Casper Wallet extension not found. Install it from the Chrome Web Store.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pk = await window.casper.requestConnection();
      if (mountedRef.current) {
        setConnected(true);
        setPublicKey(pk);
        setAccountHash(accountHashFromPublicKey(pk));
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        // User rejected or extension error
        const message = err?.message || 'Connection rejected by user';
        setError(message);
        setConnected(false);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (window.casper) {
      window.casper.disconnect().catch(() => {});
    }
    setConnected(false);
    setPublicKey(null);
    setAccountHash(null);
    setError(null);
  }, []);

  return {
    connected,
    publicKey,
    accountHash,
    loading,
    error,
    connect,
    disconnect,
    isExtensionInstalled,
  };
}
