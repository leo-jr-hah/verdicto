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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';

export const WalletConnectButton: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { connected, publicKey, loading, error, connect, disconnect, walletInstalled } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Calculate fixed dropdown position when opened
  const updateDropdownPos = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top - 8, // 8px gap above button
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      updateDropdownPos();
      // Recalc on scroll/resize
      window.addEventListener('scroll', updateDropdownPos, true);
      window.addEventListener('resize', updateDropdownPos);
      return () => {
        window.removeEventListener('scroll', updateDropdownPos, true);
        window.removeEventListener('resize', updateDropdownPos);
      };
    }
  }, [dropdownOpen, updateDropdownPos]);

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
      <div ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => { updateDropdownPos(); setDropdownOpen(!dropdownOpen); }}
          title={publicKey}
          className="flex items-center justify-center rounded-full cursor-pointer transition-colors"
          style={{ width: 36, height: 36, padding: 0, position: 'relative', border: '1.5px solid var(--border-color)', background: 'var(--bg-inset)' }}
        >
          <Wallet size={16} style={{ color: 'var(--text-primary)' }} />
          <div
            className="absolute rounded-full"
            style={{ top: 2, right: 2, width: 8, height: 8, background: 'var(--success)', border: '2px solid var(--bg-dark, #020a13)' }}
          />
        </button>

        {dropdownOpen && (
          <div
            className="wallet-dropdown"
            style={{
              position: 'fixed',
              bottom: `calc(100vh - ${dropdownPos.top}px)`,
              left: dropdownPos.left,
              minWidth: 220,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 10000,
            }}
          >
            {/* Connected account info */}
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <div className="mono-xs uppercase" style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>Connected</div>
              <div className="mono-sm" style={{ color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {publicKey}
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => { copyKey(); }}
              className="flex items-center gap-2 w-full text-sm cursor-pointer transition-colors"
              style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-inset)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              className="flex items-center gap-2 w-full text-sm cursor-pointer transition-colors"
              style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220, 50, 50, 0.15)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
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
      <div ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => { updateDropdownPos(); setDropdownOpen(!dropdownOpen); }}
          className="flex items-center gap-2 p-2 text-sm font-semibold rounded-full cursor-pointer transition-colors w-full justify-center"
          style={{ color: 'var(--text-primary)', background: 'var(--bg-inset)', border: '1.5px solid var(--border-color)' }}
        >
          <div className="flex-shrink-0 rounded-full" style={{ width: 8, height: 8, background: 'var(--success)' }} />
          <span className="truncate">{truncateKey(publicKey)}</span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </button>

        {dropdownOpen && (
          <div
            className="wallet-dropdown"
            style={{
              position: 'fixed',
              bottom: `calc(100vh - ${dropdownPos.top}px)`,
              left: dropdownPos.left,
              width: dropdownPos.width,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 10000,
            }}
          >
            {/* Full key */}
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <div className="mono-xs uppercase" style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>Connected</div>
              <div className="mono-sm" style={{ color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {publicKey}
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => { copyKey(); }}
              className="flex items-center gap-2 w-full text-sm cursor-pointer transition-colors"
              style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-inset)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              className="flex items-center gap-2 w-full text-sm cursor-pointer transition-colors"
              style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220, 50, 50, 0.15)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
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
