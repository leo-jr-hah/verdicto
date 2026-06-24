import { useState, useCallback, useRef } from 'react';
import { PLATFORM_WALLET } from '../config/casper';

/**
 * Shared payment flow hook — eliminates the repeated
 * showModal / signing / signError / handleConfirm / handleCancel
 * pattern duplicated across AssessView, BorrowView, InsureView, and PredictionView.
 *
 * @param signPayment  - The wallet's signPayment function (from useWallet / CSPRClickContext)
 * @param feeCSPR      - The CSPR amount to charge (e.g. 2.5 for assessment)
 * @param onSuccess    - Called with (paymentProof, deployHash) after successful signing.
 *                       Should perform the actual API call. Rejections are caught and
 *                       displayed to the user.
 */
export function usePaymentFlow(
  signPayment: ((recipient: string, amount: number) => Promise<{ paymentProof: string; deployHash: string }>) | undefined,
  feeCSPR: number,
  onSuccess: (paymentProof: string, deployHash: string) => Promise<void>,
) {
  const [showModal, setShowModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  /** Optional stash for any payload the caller needs to carry across the payment step */
  const pendingPayloadRef = useRef<any>(null);

  /**
   * Open the payment modal.
   * Call this from the submit button handler after building the request.
   */
  const openModal = useCallback((payload?: any) => {
    pendingPayloadRef.current = payload ?? null;
    setSignError(null);
    setShowModal(true);
  }, []);

  /**
   * Confirm handler — wired to PaymentModal's onConfirm.
   * Attempts wallet connection if needed, then signs the CSPR transfer.
   */
  const confirm = useCallback(async () => {
    if (!signPayment) {
      setSignError('Wallet not available. Please install Casper Wallet.');
      return;
    }

    setSigning(true);
    setSignError(null);

    try {
      const { paymentProof, deployHash } = await signPayment(PLATFORM_WALLET, feeCSPR);
      await onSuccess(paymentProof, deployHash);
      setShowModal(false);
    } catch (err: any) {
      if (err?.message?.includes('cancelled') || err?.message?.includes('denied')) {
        setSignError('Payment was cancelled. Please approve the transfer in your wallet.');
      } else {
        setSignError(err?.message || 'Failed to sign payment. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  }, [signPayment, feeCSPR, onSuccess]);

  /** Cancel handler — wired to PaymentModal's onCancel */
  const cancel = useCallback(() => {
    setShowModal(false);
    setSigning(false);
    setSignError(null);
    pendingPayloadRef.current = null;
  }, []);

  return {
    showModal,
    signing,
    signError,
    openModal,
    confirm,
    cancel,
    setSignError,
    pendingPayloadRef,
    feeCSPR,
    platformWallet: PLATFORM_WALLET,
  };
}
