/**
 * WalletConnectButton - displays in the sidebar and mobile header.
 *
 * - If extension is NOT installed → shows "Install Wallet" → opens Chrome Web Store
 * - If extension IS installed → shows "Connect Wallet" → triggers Casper Wallet popup
 *
 * When connected → truncated public key + dropdown with:
 *   - Copy Address
 *   - Get Testnet Tokens (faucet link)
 *   - Disconnect
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';

export const WalletConnectButton: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { connected, publicKey, loading, error, connect, disconnect, walletInstalled } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const truncateKey = (key: string) => {
    if (key.length <= 16) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 6)}`;
  };

  const copyKey = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Connected + Collapsed sidebar: golden dot icon ──────────────────────
  if (connected && publicKey && collapsed) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title={publicKey}
          className="flex items-center justify-center rounded-full cursor-pointer transition-colors"
          style={{ width: 36, height: 36, padding: 0, position: 'relative', border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' }}
        >
          <Wallet size={16} style={{ color: 'var(--accent)' }} />
          <div
            className="absolute rounded-full"
            style={{ top: 2, right: 2, width: 8, height: 8, background: 'var(--accent)', border: '2px solid var(--bg-dark, #020a13)' }}
          />
        </button>

        {dropdownOpen && (
          <div
            className="absolute bg-elevated border rounded-sm p-2"
            style={{
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              minWidth: 220,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          >
            {/* Connected account info */}
            <div className="p-3 border-b mb-1">
              <div className="mono-xs uppercase mb-1" style={{ color: 'var(--accent)' }}>Connected</div>
              <div className="mono-sm" style={{ color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {publicKey}
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => { copyKey(); }}
              className="flex items-center gap-2 w-full p-2 text-sm bg-transparent border-none rounded-sm cursor-pointer transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--accent)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              className="flex items-center gap-2 w-full p-2 text-sm bg-transparent border-none rounded-sm cursor-pointer transition-colors"
              style={{ color: 'var(--text-dark-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Connected + Expanded sidebar: key + dropdown ────────────────────────
  if (connected && publicKey) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-2 text-sm font-semibold rounded-full cursor-pointer transition-colors w-full justify-center"
          style={{ color: 'var(--accent)', background: 'var(--accent-soft)', border: '1.5px solid var(--accent)' }}
        >
          <div className="flex-shrink-0 rounded-full" style={{ width: 8, height: 8, background: 'var(--accent)' }} />
          <span className="truncate">{truncateKey(publicKey)}</span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </button>

        {dropdownOpen && (
          <div
            className="absolute bg-elevated border rounded-sm p-2 w-full"
            style={{
              bottom: 'calc(100% + 8px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          >
            {/* Full key */}
            <div className="p-3 border-b mb-1">
              <div className="mono-xs uppercase mb-1" style={{ color: 'var(--accent)' }}>Connected</div>
              <div className="mono-sm" style={{ color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {publicKey}
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => { copyKey(); }}
              className="flex items-center gap-2 w-full p-2 text-sm bg-transparent border-none rounded-sm cursor-pointer transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--accent)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              className="flex items-center gap-2 w-full p-2 text-sm bg-transparent border-none rounded-sm cursor-pointer transition-colors"
              style={{ color: 'var(--text-dark-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Not connected ───────────────────────────────────────────────────────
  if (!walletInstalled) {
    return (
      <a
        href="https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full justify-center text-sm"
      >
        <Wallet size={16} />
        Install Wallet
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={connect}
        disabled={loading}
        className="btn-primary w-full justify-center text-sm"
        style={{ cursor: loading ? 'wait' : 'pointer' }}
      >
        <Wallet size={16} />
        {loading ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && (
        <div className="text-xs text-error text-center">{error}</div>
      )}
    </div>
  );
};

export default WalletConnectButton;
