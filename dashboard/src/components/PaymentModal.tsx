import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, Loader2 } from 'lucide-react';

/**
 * Shared payment confirmation modal used across all products.
 * Consistent design: dark overlay, centered card, fee breakdown, confirm/cancel buttons.
 *
 * Props:
 *  - open: whether to show
 *  - title: e.g. "Confirm Assessment Payment"
 *  - description: e.g. "A micropayment is required to run the AI valuation pipeline."
 *  - feeLabel: e.g. "Assessment Fee"
 *  - feeAmount: numeric CSPR amount
 *  - networkLabel: defaults to "Casper Testnet"
 *  - features: bullet points for "You'll receive" section (optional)
 *  - signing: true while waiting for wallet
 *  - signError: error message to display (null if none)
 *  - onConfirm: called when user clicks Pay
 *  - onCancel: called when user clicks Cancel or overlay
 */
export interface PaymentModalProps {
  open: boolean;
  title: string;
  description: string;
  feeLabel: string;
  feeAmount: number;
  networkLabel?: string;
  features?: string[];
  signing: boolean;
  signError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  title,
  description,
  feeLabel,
  feeAmount,
  networkLabel = 'Casper Testnet',
  features,
  signing,
  signError,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Zap size={24} color="#8B5CF6" />
              </div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                {description}
              </p>
            </div>

            {/* Fee breakdown */}
            <div style={{
              background: 'var(--bg-surface-alt)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feeLabel}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {feeAmount} CSPR
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
              }}>
                <span>Network</span>
                <span>{networkLabel}</span>
              </div>
            </div>

            {/* What you get */}
            {features && features.length > 0 && (
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>You'll receive:</div>
                {features.map((f, i) => (
                  <div key={i}>• {f}</div>
                ))}
              </div>
            )}

            {/* Error */}
            {signError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: '#EF4444',
              }}>
                {signError}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onCancel}
                disabled={signing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: signing ? 'not-allowed' : 'pointer',
                  opacity: signing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={signing}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: signing ? '#6366f1aa' : '#6366f1',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: signing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {signing ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Waiting for wallet...
                  </>
                ) : (
                  <>
                    <Wallet size={16} />
                    Pay {feeAmount} CSPR & Confirm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
