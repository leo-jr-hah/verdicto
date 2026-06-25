import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, Loader2 } from 'lucide-react';

/**
 * Shared payment confirmation modal used across all products.
 * Consistent design: dark overlay, centered card, fee breakdown, confirm/cancel buttons.
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
          className="payment-modal-overlay"
          style={{ zIndex: 9999 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="payment-modal"
            style={{ background: 'var(--bg-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
          >
            {/* Header */}
            <div className="text-center" style={{ marginBottom: '1.5rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Zap size={24} color="#8B5CF6" />
              </div>
              <h3 className="text-xl" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {description}
              </p>
            </div>

            {/* Fee breakdown */}
            <div style={{
              background: 'var(--bg-surface-alt)',
              borderRadius: 'var(--card-radius)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feeLabel}</span>
                <span className="text-xl" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {feeAmount} CSPR
                </span>
              </div>
              <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>Network</span>
                <span>{networkLabel}</span>
              </div>
            </div>

            {/* What you get */}
            {features && features.length > 0 && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
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
              }} className="text-sm text-error">
                {signError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={signing}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  cursor: signing ? 'not-allowed' : 'pointer',
                  opacity: signing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={signing}
                className="btn"
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  background: signing ? '#6366f1aa' : '#6366f1',
                  color: 'white',
                  cursor: signing ? 'wait' : 'pointer',
                }}
              >
                {signing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Waiting for Wallet…
                  </>
                ) : (
                  <>
                    <Wallet size={16} />
                    Pay {feeAmount} CSPR
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
