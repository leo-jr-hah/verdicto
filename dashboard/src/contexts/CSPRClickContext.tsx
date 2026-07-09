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
import { ORCHESTRATOR_URL } from '../services/api';

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
  const [userDisconnected, setUserDisconnected] = useState(false);

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
  // Skip if user explicitly disconnected in this session
  useEffect(() => {
    if (!isCasperWalletInstalled() || userDisconnected) return;

    const provider = window.CasperWalletProvider!();
    providerRef.current = provider;

    provider.isConnected().then((connected) => {
      if (connected) {
        provider.getActivePublicKey().then(updateFromPublicKey).catch(() => {});
      }
    }).catch(() => {});
  }, [updateFromPublicKey, userDisconnected]);

  const connect = useCallback(async () => {
    setError(null);
    setUserDisconnected(false); // Reset so auto-reconnect works again

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

      // Request connection - this opens the wallet popup
      const accepted = await provider.requestConnection();

      clearTimeout(safetyTimeout);

      if (accepted) {
        // Get the active public key
        const pk = await provider.getActivePublicKey();
        updateFromPublicKey(pk);
      }
      // If not accepted, user cancelled - silently ignore
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

  const disconnect = useCallback(async () => {
    const provider = providerRef.current;

    // Clear local state first so UI updates immediately
    setUserDisconnected(true);
    clearState();
    providerRef.current = null;

    // Then tell the wallet extension to disconnect (await it so the extension
    // actually processes the disconnect before the user tries to reconnect)
    if (provider) {
      try {
        await provider.disconnect();
      } catch {
        // ignore errors — wallet may already be disconnected
      }
    }
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

    // ── Input validation before signing ──────────────────────────────────
    if (!recipientAddress || typeof recipientAddress !== 'string') {
      throw new Error('Invalid recipient address');
    }
    // Casper public key hex must be 64+ chars (66 for ED25519 with prefix)
    if (recipientAddress.length < 64 || !/^[0-9a-fA-F]+$/.test(recipientAddress)) {
      throw new Error('Recipient address must be a valid hex public key (64+ chars)');
    }
    if (typeof amountCSPR !== 'number' || isNaN(amountCSPR) || amountCSPR <= 0) {
      throw new Error('Payment amount must be a positive number');
    }
    if (amountCSPR > 100) {
      throw new Error('Payment amount exceeds maximum (100 CSPR). Aborting for safety.');
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

    // Ask the wallet to sign it - this opens the wallet popup
    const result = await provider.sign(JSON.stringify(deployJson), publicKey);

    if (result.cancelled || !result.signature) {
      throw new Error('Payment signing was cancelled');
    }

    // ── Debug: log the exact type/shape of the wallet signature ──
    const rawSig: any = result.signature as any;
    console.log('[signPayment] result.signature type:', typeof result.signature);
    console.log('[signPayment] result.signature constructor:', rawSig?.constructor?.name);
    console.log('[signPayment] result.signature:', rawSig);
    console.log('[signPayment] result.signature length:', rawSig?.length);
    if (rawSig instanceof Uint8Array) {
      console.log('[signPayment] - Signature is Uint8Array, length:', rawSig.length);
    } else if (typeof rawSig === 'string') {
      console.log('[signPayment] - Signature is string, first 40 chars:', rawSig.substring(0, 40));
    } else if (Array.isArray(rawSig)) {
      console.log('[signPayment] - Signature is Array, length:', rawSig.length);
    }

    // Convert signature to Uint8Array regardless of input format
    // (wallet SDK types say string, but runtime may return Uint8Array or Array)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sig: any = result.signature as any;
    let sigBytes: Uint8Array;
    if (sig instanceof Uint8Array) {
      sigBytes = sig;
    } else if (Array.isArray(sig)) {
      sigBytes = new Uint8Array(sig);
    } else if (typeof sig === 'string') {
      // Hex string - Uint8Array
      sigBytes = new Uint8Array(sig.length / 2);
      for (let i = 0; i < sig.length; i += 2) {
        sigBytes[i / 2] = parseInt(sig.substring(i, i + 2), 16);
      }
    } else {
      throw new Error(`Unexpected signature type: ${typeof sig}`);
    }

    console.log('[signPayment] sigBytes length:', sigBytes.length, 'first bytes:', Array.from(sigBytes.slice(0, 10)));

    // ── Prepend key-type tag if missing ──
    // Casper RPC expects the signature to include the algorithm prefix byte:
    //   01 = Ed25519, 02 = secp256k1
    // The Casper Wallet extension returns raw 64-byte signatures without the tag.
    // The public key prefix tells us which algorithm to use.
    const keyTypeTag = publicKey.startsWith('01') ? 0x01 : 0x02;
    let taggedSigBytes: Uint8Array;
    if (sigBytes.length === 64) {
      // Raw signature — prepend the key type tag
      taggedSigBytes = new Uint8Array(65);
      taggedSigBytes[0] = keyTypeTag;
      taggedSigBytes.set(sigBytes, 1);
      console.log('[signPayment] Prepended key-type tag:', keyTypeTag.toString(16), '- 65 bytes');
    } else if (sigBytes.length === 65 && (sigBytes[0] === 0x01 || sigBytes[0] === 0x02)) {
      // Already has the tag
      taggedSigBytes = sigBytes;
      console.log('[signPayment] Signature already has key-type tag:', sigBytes[0].toString(16));
    } else {
      // Unknown format — pass through and hope for the best
      taggedSigBytes = sigBytes;
      console.warn('[signPayment] Unexpected signature length:', sigBytes.length, '- passing through');
    }

    const signedDeploy = Deploy.setSignature(deploy, taggedSigBytes, PublicKey.fromHex(publicKey));

    // Get the deploy JSON with signature
    const signedDeployJson = Deploy.toJSON(signedDeploy);
    const deployHash = (signedDeployJson as any).hash || (signedDeployJson as any).deploy?.hash || '';

    // ── Broadcast the signed deploy via backend relay ──
    // Direct browser - RPC calls fail due to CORS, so we relay through the backend.
    let confirmedHash = deployHash;
    let broadcastSuccess = false;

    try {
      const relayRes = await fetch(`${ORCHESTRATOR_URL}/api/relay-deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploy: signedDeployJson }),
      });

      const relayResult = await relayRes.json();

      if (relayResult.success && relayResult.deployHash) {
        confirmedHash = relayResult.deployHash;
        broadcastSuccess = true;
        console.log('✅ Deploy broadcast via relay:', confirmedHash.substring(0, 16) + '...');
      } else {
        // Broadcast failed — the deploy was signed but NOT submitted to chain.
        // Throw so the user knows the payment didn't go through.
        const errMsg = relayResult.error || 'Unknown relay error';
        console.error('❌ Relay broadcast failed:', errMsg);
        throw new Error(`Payment broadcast failed: ${errMsg}. The deploy was signed but NOT submitted to the chain. Please try again.`);
      }
    } catch (relayErr: any) {
      // If it's already our explicit error, re-throw it
      if (relayErr.message?.startsWith('Payment broadcast failed')) {
        throw relayErr;
      }
      // Network/fetch error — relay endpoint might be down
      console.error('❌ Deploy relay unreachable:', relayErr);
      throw new Error(`Payment relay is unreachable (${relayErr.message || 'network error'}). The deploy was signed but NOT submitted to the chain. Please check your connection and try again.`);
    }

    // Build the payment proof (base64-encoded JSON)
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
 *
 * NOTE: This hook lives in the same file as CSPRClickProvider intentionally.
 * Vite fast-refresh sometimes flags mixed component+hook exports. This is a
 * known limitation and does not affect production builds or runtime behavior.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <CSPRClickProvider>');
  }
  return ctx;
}
