/**
 * WalletConnectButton — displays in the top nav bar.
 *
 * Always shows "Connect Wallet". On click:
 *   - If extension is installed → triggers the Casper Wallet popup
 *   - If extension is NOT installed → opens Chrome Web Store in new tab
 *
 * When connected → truncated public key + dropdown with disconnect
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

  // Connected state — show key + dropdown
  if (connected && publicKey) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10B981',
          }} />
          {truncateKey(publicKey)}
          <ChevronDown size={14} style={{
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.5rem',
            minWidth: '220px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}>
            <div style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '0.25rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Connected
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'var(--text-primary)',
              }}>
                {publicKey}
              </div>
            </div>

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

  // Disconnected (or loading) — single "Connect Wallet" button
  // The hook's connect() handles: extension present → popup, extension absent → Chrome Web Store
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={connect}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: loading ? 'var(--text-secondary)' : 'var(--text-primary)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Wallet size={14} />
        {loading ? 'Connecting...' : walletInstalled ? 'Connect Wallet' : 'Install Wallet'}
      </button>

      {error && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          color: '#EF4444',
          maxWidth: '280px',
          whiteSpace: 'normal',
          zIndex: 1000,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
