/**
 * WalletConnectButton — displays in the top nav bar.
 *
 * States:
 *   - No extension installed → "Install Wallet" link
 *   - Disconnected → "Connect Wallet" button
 *   - Connected → truncated public key + dropdown with disconnect
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, ExternalLink, LogOut, Copy, Check } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export const WalletConnectButton: React.FC = () => {
  const { connected, publicKey, loading, error, connect, disconnect, isExtensionInstalled } = useWallet();
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

  // No extension installed
  if (!isExtensionInstalled) {
    return (
      <a
        href="https://chrome.google.com/webstore/detail/casper-wallet/abkahkcbhngaabpcpabfkpccmepffjck"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--primary)',
          background: 'rgba(255, 59, 59, 0.08)',
          border: '1px solid rgba(255, 59, 59, 0.2)',
          borderRadius: '999px',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <Wallet size={14} />
        Install Wallet
        <ExternalLink size={12} />
      </a>
    );
  }

  // Connected state
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
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
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
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 100,
          }}>
            <div style={{
              padding: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '0.25rem',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}>
              <div style={{ marginBottom: '0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Connected Account
              </div>
              {publicKey}
            </div>

            <button
              onClick={copyKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-surface-alt)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Public Key'}
            </button>

            <button
              onClick={() => { disconnect(); setDropdownOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,59,59,0.06)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Disconnected — show connect button
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
          color: loading ? 'var(--text-tertiary)' : 'var(--text-primary)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Wallet size={14} />
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'rgba(255,59,59,0.08)',
          border: '1px solid rgba(255,59,59,0.2)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          color: 'var(--primary)',
          whiteSpace: 'nowrap',
          maxWidth: '280px',
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
