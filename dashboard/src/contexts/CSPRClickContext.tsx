/**
 * CSPRClickProvider - wallet context using the official Casper Wallet SDK.
 *
 * Detection: window.CasperWalletProvider (injected by Casper Wallet v2.x extension).
 * API docs: https://github.com/make-software/casper-wallet-sdk
 * Reference: https://github.com/make-software/casper-wallet-playground
 *
 * IMPORTANT: Casper Wallet extension does NOT have provider.on() / provider.off().
 * Instead, it dispatches DOM CustomEvents on `window`. You listen with:
 *   window.addEventListener(CasperWalletEventTypes.Connected, handler)
 *
 * The event.detail is a JSON string: { activeKey: string, isConnected: boolean, isLocked: boolean }
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { makeCsprTransferDeploy, Deploy, PublicKey } from 'casper-js-sdk';

/* ---------- Types (matching Casper Wallet SDK) ---------- */

interface CasperWalletProvider {
  requestConnection(): Promise<boolean>;
  requestSwitchAccount(): Promise<boolean>;
  sign(transactionJson: string, signingPublicKeyHex: string): Promise<{ signature?: string; cancelled?: boolean }>;
  signMessage(message: string, signingPublicKeyHex: string): Promise<{ signature?: string; cancelled?: boolean }>;
  getActivePublicKey(): Promise<string>;
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;
}

interface CasperWalletEventTypes {
  Connected: string;
  Disconnected: string;
  ActiveKeyChanged: string;
  SwitchedAccount: string;
}

/** Event.detail parsed from Casper Wallet CustomEvents */
interface CasperWalletState {
  activeKey: string | null;
  isConnected: boolean;
  isLocked: boolean;
}

declare global {
  interface Window {
    CasperWalletProvider?: () => CasperWalletProvider;
    CasperWalletEventTypes?: CasperWalletEventTypes;
  }
}

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
  /** Sign a native CSPR transfer deploy and return the payment proof */
  signPayment: (recipientAddress: string, amountCSPR: number) => Promise<{
    paymentProof: string;
    deployHash: string;
  }>;
}

const WalletContext = createContext<WalletState | null>(null);

/* ---------- Constants ---------- */

const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en';

/* ---------- Helpers ---------- */

/** Check if Casper Wallet extension is installed */
function isCasperWalletInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.CasperWalletProvider === 'function';
}

/** Derive a display-friendly account hash from a public key hex */
function accountHashFromPublicKey(publicKeyHex: string): string {
  if (publicKeyHex.length > 16) {
    return `account-hash-${publicKeyHex.substring(0, 8)}...${publicKeyHex.substring(publicKeyHex.length - 8)}`;
  }
  return `account-hash-${publicKeyHex}`;
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

  const providerRef = useRef<CasperWalletProvider | null>(null);

  // Helper to update wallet state from a public key
  const updateFromPublicKey = useCallback((pk: string) => {
    setConnected(true);
    setPublicKey(pk);
    setAccountHash(accountHashFromPublicKey(pk));
    setAccountName(pk.substring(0, 12) + '...');
  }, []);

  const clearState = useCallback(() => {
    setConnected(false);
    setPublicKey(null);
    setAccountHash(null);
    setAccountName(null);
  }, []);

  // Check wallet installation on mount + periodically (extension may load after page)
  useEffect(() => {
    setWalletInstalled(isCasperWalletInstalled());

    const interval = setInterval(() => {
      const installed = isCasperWalletInstalled();
      setWalletInstalled(installed);
      if (installed) clearInterval(interval);
    }, 500);

    const timeout = setTimeout(() => clearInterval(interval), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Subscribe to Casper Wallet CustomEvents on window
  // The extension dispatches DOM events, NOT provider.on()!
  useEffect(() => {
    const events = window.CasperWalletEventTypes;
    if (!events) return;

    const handleConnected = (e: Event) => {
      try {
        const state: CasperWalletState = JSON.parse((e as CustomEvent).detail);
        if (state.activeKey) {
          updateFromPublicKey(state.activeKey);
        }
      } catch {
        // If parse fails, try getting active key directly
        providerRef.current?.getActivePublicKey().then(updateFromPublicKey).catch(() => {});
      }
    };

    const handleDisconnected = () => {
      clearState();
    };

    const handleActiveKeyChanged = (e: Event) => {
      try {
        const state: CasperWalletState = JSON.parse((e as CustomEvent).detail);
        if (state.activeKey) {
          updateFromPublicKey(state.activeKey);
        } else {
          clearState();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener(events.Connected, handleConnected);
    window.addEventListener(events.Disconnected, handleDisconnected);
    window.addEventListener(events.ActiveKeyChanged, handleActiveKeyChanged);

    return () => {
      window.removeEventListener(events.Connected, handleConnected);
      window.removeEventListener(events.Disconnected, handleDisconnected);
      window.removeEventListener(events.ActiveKeyChanged, handleActiveKeyChanged);
    };
  }, [updateFromPublicKey, clearState]);

  // Also check if already connected on mount (page refresh while wallet is connected)
  useEffect(() => {
    if (!isCasperWalletInstalled()) return;

    const provider = window.CasperWalletProvider!();
    providerRef.current = provider;

    provider.isConnected().then((connected) => {
      if (connected) {
        provider.getActivePublicKey().then(updateFromPublicKey).catch(() => {});
      }
    }).catch(() => {});
  }, [updateFromPublicKey]);

  const connect = useCallback(async () => {
    setError(null);

    // If wallet not installed, open Chrome Web Store
    if (!isCasperWalletInstalled()) {
      window.open(CHROME_WEB_STORE_URL, '_blank');
      return;
    }

    setLoading(true);

    // Safety timeout: if the popup is closed without resolving,
    // reset loading after 30 seconds (user likely closed the popup)
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 30000);

    try {
      // Create provider instance
      const provider = window.CasperWalletProvider!();
      providerRef.current = provider;

      // Request connection — this opens the wallet popup
      const accepted = await provider.requestConnection();

      clearTimeout(safetyTimeout);

      if (accepted) {
        // Get the active public key
        const pk = await provider.getActivePublicKey();
        updateFromPublicKey(pk);
      }
      // If not accepted, user cancelled — silently ignore
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      // User cancelled or wallet error
      if (
        err?.message?.includes('cancelled') ||
        err?.message?.includes('denied') ||
        err?.message?.includes('rejected')
      ) {
        // silently ignore user cancellation
      } else {
        setError(err?.message || 'Failed to connect wallet.');
      }
    } finally {
      setLoading(false);
    }
  }, [updateFromPublicKey]);

  const disconnect = useCallback(() => {
    const provider = providerRef.current;

    if (provider) {
      provider.disconnect().catch(() => {
        // ignore errors on disconnect
      });
    }

    clearState();
    providerRef.current = null;
  }, [clearState]);

  /**
   * Sign a native CSPR transfer deploy via the wallet extension,
   * then broadcast it to the Casper testnet via RPC.
   * Returns a base64-encoded payment proof with the confirmed deploy hash.
   */
  const signPayment = useCallback(async (
    recipientAddress: string,
    amountCSPR: number,
  ): Promise<{ paymentProof: string; deployHash: string }> => {
    const provider = providerRef.current;
    if (!provider || !publicKey) {
      throw new Error('Wallet not connected');
    }

    // Convert CSPR to motes (1 CSPR = 10^9 motes)
    const amountMotes = Math.floor(amountCSPR * 1e9).toString();

    // Create the transfer deploy
    const deploy = makeCsprTransferDeploy({
      senderPublicKeyHex: publicKey,
      recipientPublicKeyHex: recipientAddress,
      transferAmount: amountMotes,
      chainName: 'casper-test',
      ttl: 1800000, // 30 minutes
      gasPrice: 1,
    });

    // Get the deploy JSON for signing
    const deployJson = Deploy.toJSON(deploy);

    // Ask the wallet to sign it — this opens the wallet popup
    const result = await provider.sign(JSON.stringify(deployJson), publicKey);

    if (result.cancelled || !result.signature) {
      throw new Error('Payment signing was cancelled');
    }

    // Set the signature on the deploy (static method)
    // The wallet returns a hex string; SDK accepts it at runtime despite TS typing
    const signedDeploy = Deploy.setSignature(deploy, result.signature as unknown as Uint8Array, PublicKey.fromHex(publicKey));

    // Get the deploy JSON with signature
    const signedDeployJson = Deploy.toJSON(signedDeploy);
    const deployHash = (signedDeployJson as any).hash || (signedDeployJson as any).deploy?.hash || '';

    // ── Attempt to broadcast the signed deploy to Casper testnet ──
    // NOTE: Direct browser → RPC calls often fail due to CORS restrictions.
    // In production, the backend would relay the signed deploy.
    // For the hackathon, we try the broadcast but gracefully handle CORS failures.
    let confirmedHash = deployHash;
    let broadcastSuccess = false;

    try {
      const CSPR_TESTNET_RPC = 'https://node.testnet.cspr.cloud/rpc';
      const rpcPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'account_put_deploy',
        params: [signedDeployJson],
      };

      const rpcResponse = await fetch(CSPR_TESTNET_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcPayload),
      });

      const rpcResult = await rpcResponse.json();

      if (rpcResult.error) {
        console.warn('RPC broadcast error (deploy still signed):', rpcResult.error);
      } else {
        confirmedHash = rpcResult.result?.deploy_hash || deployHash;
        broadcastSuccess = true;
      }
    } catch (fetchErr) {
      // CORS or network error — expected in browser context
      console.warn('Deploy broadcast failed (CORS/network). Deploy is signed and valid as proof.', fetchErr);
    }

    // Build the payment proof (base64-encoded JSON)
    // The signed deploy itself is cryptographic proof of payment intent
    const paymentProof = {
      scheme: 'casper',
      payload: {
        deploy: signedDeployJson,
        payer: publicKey,
        amount: amountCSPR.toString(),
        network: 'casper:testnet',
      },
      deployHash: confirmedHash,
      broadcast: broadcastSuccess,
    };

    const proofHeader = btoa(JSON.stringify(paymentProof));

    return { paymentProof: proofHeader, deployHash: confirmedHash };
  }, [publicKey]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        accountHash,
        accountName,
        loading,
        error,
        connect,
        disconnect,
        walletInstalled,
        signPayment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Access wallet state from any component.
 * Must be used inside <CSPRClickProvider>.
 */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <CSPRClickProvider>');
  }
  return ctx;
}
