import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createLoan,
  fetchLoans,
  fetchLoan,
  repayLoan,
  revalueLoan,
  type Loan,
  type LoanCreateRequest,
  type LoanCreateResponse,
  type RevaluationResult,
  type X402PaymentRequirements,
} from '../services/api';

interface UseLoanState {
  loading: boolean;
  error: string | null;
  loans: Loan[];
  currentLoan: LoanCreateResponse | null;
  revaluationResult: RevaluationResult | null;
  paymentRequired: X402PaymentRequirements | null;
}

interface UseLoanReturn extends UseLoanState {
  /** Step 1: Submit loan request (may trigger 402 → paymentRequired) */
  submitLoan: (request: LoanCreateRequest) => Promise<void>;
  /** Step 2: After wallet signs, retry with payment proof */
  submitLoanWithProof: (request: LoanCreateRequest, paymentProof: string) => Promise<void>;
  /** Load all loans for the current borrower */
  loadLoans: (borrowerPublicKey?: string) => Promise<void>;
  /** Load a single loan by ID */
  loadLoan: (loanId: string) => Promise<void>;
  /** Repay a loan */
  repay: (loanId: string, amount: number, txHash?: string) => Promise<boolean>;
  /** Trigger revaluation */
  revalue: (loanId: string) => Promise<void>;
  /** Reset state */
  reset: () => void;
  clearError: () => void;
}

export function useLoan(): UseLoanReturn {
  const [state, setState] = useState<UseLoanState>({
    loading: false,
    error: null,
    loans: [],
    currentLoan: null,
    revaluationResult: null,
    paymentRequired: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const submitLoan = useCallback(async (request: LoanCreateRequest) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, currentLoan: null, paymentRequired: null }));

    try {
      const response = await createLoan(request);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          currentLoan: response.loan ?? null,
        }));
      } else if (response.status === 'payment_required') {
        setState(prev => ({
          ...prev,
          loading: false,
          paymentRequired: response.paymentRequirements ?? null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Loan request failed.',
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error.',
      }));
    }
  }, []);

  const submitLoanWithProof = useCallback(async (request: LoanCreateRequest, paymentProof: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, currentLoan: null, paymentRequired: null }));

    try {
      const response = await createLoan(request, paymentProof);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          currentLoan: response.loan ?? null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Loan request failed after payment.',
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error.',
      }));
    }
  }, []);

  const loadLoans = useCallback(async (borrowerPublicKey?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const loans = await fetchLoans(borrowerPublicKey);
      setState(prev => ({ ...prev, loading: false, loans }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  const loadLoan = useCallback(async (loanId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const loan = await fetchLoan(loanId);
      if (loan) {
        setState(prev => ({ ...prev, loading: false, loans: [loan] }));
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Loan not found' }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  const repay = useCallback(async (loanId: string, amount: number, txHash?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await repayLoan(loanId, amount, txHash);
      if (result.success) {
        setState(prev => ({ ...prev, loading: false }));
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Repayment failed' }));
        return false;
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      return false;
    }
  }, []);

  const revalue = useCallback(async (loanId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, revaluationResult: null }));
    try {
      const result = await revalueLoan(loanId);
      if (result.success && result.revaluation) {
        setState(prev => ({ ...prev, loading: false, revaluationResult: result.revaluation! }));
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Revaluation failed' }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      loans: [],
      currentLoan: null,
      revaluationResult: null,
      paymentRequired: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    submitLoan,
    submitLoanWithProof,
    loadLoans,
    loadLoan,
    repay,
    revalue,
    reset,
    clearError,
  };
}
