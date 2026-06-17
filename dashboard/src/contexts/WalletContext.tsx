/**
 * WalletContext — provides Casper Wallet state to the entire app.
 *
 * Usage:
 *   1. Wrap your app with <WalletProvider> (done in main.tsx)
 *   2. In any component: const { connected, publicKey, connect } = useWallet();
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useCasperWallet, type WalletState } from '../hooks/useCasperWallet';

const WalletContext = createContext<WalletState | null>(null);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useCasperWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Access wallet state from any component.
 * Throws if used outside <WalletProvider>.
 */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <WalletProvider>');
  }
  return ctx;
}
