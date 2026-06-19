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

export const WalletConnectButton: React.FC = () => {
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

  // Connected state: show key + dropdown
  if (connected && publicKey) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10B981',
            flexShrink: 0,
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncateKey(publicKey)}
          </span>
          <ChevronDown size={14} style={{
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.5rem',
            minWidth: '220px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}>
            {/* Connected account info */}
            <div style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '0.25rem',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Connected
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}>
                {publicKey}
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => { copyKey(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                color: '#EF4444',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
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

  // Disconnected (or loading): single "Connect Wallet" button
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={connect}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: loading ? 'var(--text-secondary)' : 'var(--text-primary)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Wallet size={14} />
        {loading ? 'Connecting...' : walletInstalled ? 'Connect Wallet' : 'Install Wallet'}
      </button>

      {error && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          color: '#EF4444',
          whiteSpace: 'normal',
          zIndex: 1000,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
