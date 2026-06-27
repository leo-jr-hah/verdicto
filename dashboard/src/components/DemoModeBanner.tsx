import React from 'react';
import { Beaker, ExternalLink } from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Banner shown at the top of the app when running in demo mode.
 * Informs users that all data is simulated and no real transactions occur.
 */
export const DemoModeBanner: React.FC = () => {
  if (!DEMO_MODE) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--text-secondary) 0%, var(--red-600) 100%)',
        color: 'var(--text-inverse)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <Beaker size={16} />
      <span>DEMO MODE - All data is simulated. No real payments or blockchain transactions.</span>
      <a
        href="https://testnet.cspr.live/tools/faucet"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--text-inverse)',
          textDecoration: 'underline',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginLeft: '0.5rem',
        }}
      >
        Get testnet CSPR <ExternalLink size={12} />
      </a>
    </div>
  );
};
