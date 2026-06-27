import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shared modal shell used by all app views (Borrow, Insure, Disputes, etc.)
 * Wraps content in a consistent overlay + card with spring animation.
 *
 * Usage:
 *   <AppModal open={show} onClose={() => setShow(false)}>
 *     <h3>Title</h3>
 *     ...content...
 *     <AppModalActions>
 *       <button className="btn btn-secondary" onClick={...}>Cancel</button>
 *       <button className="btn" onClick={...}>Confirm</button>
 *     </AppModalActions>
 *   </AppModal>
 */
interface AppModalProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  open,
  onClose,
  maxWidth = 440,
  children,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="payment-modal-overlay"
          onClick={onClose}
          style={{ zIndex: 10000 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="payment-modal"
            style={{
              maxWidth,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Standardized action row for modals — places Cancel (left) and Confirm (right)
 * in the same layout as PaymentModal.
 */
export const AppModalActions: React.FC<{
  onCancel?: () => void;
  cancelLabel?: string;
  cancelDisabled?: boolean;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onConfirm: () => void;
  confirmIcon?: React.ReactNode;
}> = ({
  onCancel,
  cancelLabel = 'Cancel',
  cancelDisabled = false,
  confirmLabel,
  confirmDisabled = false,
  confirmLoading = false,
  onConfirm,
  confirmIcon,
}) => (
  <div className="flex gap-3" style={{ marginTop: '1.5rem' }}>
    {onCancel && (
      <button
        onClick={onCancel}
        disabled={cancelDisabled || confirmLoading}
        className="btn btn-secondary"
        style={{
          flex: 1,
          padding: '0.75rem',
          cursor: confirmLoading ? 'not-allowed' : 'pointer',
          opacity: confirmLoading ? 0.5 : 1,
        }}
      >
        {cancelLabel}
      </button>
    )}
    <button
      onClick={onConfirm}
      disabled={confirmDisabled || confirmLoading}
      className="btn"
      style={{
        flex: onCancel ? 2 : 1,
        padding: '0.75rem',
        background: confirmLoading ? 'var(--red-700)' : 'var(--red-600)',
        color: 'white',
        cursor: confirmDisabled || confirmLoading ? 'not-allowed' : 'pointer',
        opacity: confirmDisabled ? 0.5 : 1,
      }}
    >
      {confirmLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <span className="spin" style={{ display: 'inline-flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </span>
          Processing…
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          {confirmIcon}
          {confirmLabel}
        </span>
      )}
    </button>
  </div>
);

export default AppModal;
