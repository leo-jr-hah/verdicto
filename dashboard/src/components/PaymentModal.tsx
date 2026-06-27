import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, Loader2 } from 'lucide-react';

/**
 * Shared payment confirmation modal used across all products.
 * Brutalist design: sharp borders, mono labels, data-panel fee breakdown.
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
  signErrorHint?: string | null;
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
  signErrorHint,
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
            className="payment-modal bg-elevated border rounded-sm"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div
                className="flex items-center justify-center rounded-full border-accent bg-accent-soft mx-auto mb-4"
                style={{ width: 56, height: 56, borderWidth: 2 }}
              >
                <Zap size={24} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {description}
              </p>
            </div>

            {/* Fee breakdown — data-panel style */}
            <div className="data-panel mb-6">
              <div className="data-panel-body">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-secondary">{feeLabel}</span>
                  <span className="text-xl font-bold text-primary">
                    {feeAmount} CSPR
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-tertiary">
                  <span>Network</span>
                  <span>{networkLabel}</span>
                </div>
              </div>
            </div>

            {/* What you get */}
            {features && features.length > 0 && (
              <div className="text-sm text-secondary mb-6 leading-relaxed">
                <div className="font-semibold text-primary mb-1">You'll receive:</div>
                {features.map((f, i) => (
                  <div key={i}>• {f}</div>
                ))}
              </div>
            )}

            {/* Error */}
            {signError && (
              <div className="bg-error-soft border border-error rounded-sm p-3 mb-4">
                <div className="text-sm text-error">{signError}</div>
                {signErrorHint && (
                  <div className="text-xs text-secondary mt-1">
                    💡 {signErrorHint}
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={signing}
                className="btn-secondary flex-1 p-3 rounded-sm"
                style={{
                  cursor: signing ? 'not-allowed' : 'pointer',
                  opacity: signing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={signing}
                className="btn-primary flex-2 p-3 rounded-sm font-semibold"
                style={{
                  flex: 2,
                  cursor: signing ? 'wait' : 'pointer',
                }}
              >
                {signing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
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
