import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createInsurancePolicy,
  fetchInsurancePolicies,
  fetchInsurancePolicy,
  fileInsuranceClaim,
  type InsurancePolicy,
  type InsuranceCreateRequest,
  type InsuranceCreateResponse,
  type ClaimResult,
  type X402PaymentRequirements,
} from '../services/api';

interface UseInsuranceState {
  loading: boolean;
  error: string | null;
  errorHint: string | null;
  policies: InsurancePolicy[];
  currentPolicy: InsuranceCreateResponse | null;
  claimResult: ClaimResult | null;
  paymentRequired: X402PaymentRequirements | null;
}

interface UseInsuranceReturn extends UseInsuranceState {
  /** Step 1: Submit insurance request (may trigger 402 → paymentRequired) */
  submitPolicy: (request: InsuranceCreateRequest) => Promise<void>;
  /** Step 2: After wallet signs, retry with payment proof */
  submitPolicyWithProof: (request: InsuranceCreateRequest, paymentProof: string) => Promise<void>;
  /** Load all policies for the current owner */
  loadPolicies: (ownerPublicKey?: string) => Promise<void>;
  /** Load a single policy by ID */
  loadPolicy: (policyId: string) => Promise<void>;
  /** File a claim */
  claim: (policyId: string, reason: string, requestedAmount?: number) => Promise<boolean>;
  /** Reset state */
  reset: () => void;
  clearError: () => void;
}

export function useInsurance(): UseInsuranceReturn {
  const [state, setState] = useState<UseInsuranceState>({
    loading: false,
    error: null,
    errorHint: null,
    policies: [],
    currentPolicy: null,
    claimResult: null,
    paymentRequired: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const submitPolicy = useCallback(async (request: InsuranceCreateRequest) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, errorHint: null, currentPolicy: null, paymentRequired: null }));

    try {
      const response = await createInsurancePolicy(request);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          currentPolicy: response.policy ?? null,
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
          error: response.error || 'Insurance request failed.',
          errorHint: response.hint || null,
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error.',
        errorHint: 'Check your internet connection and try again.',
      }));
    }
  }, []);

  const submitPolicyWithProof = useCallback(async (request: InsuranceCreateRequest, paymentProof: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, errorHint: null, currentPolicy: null, paymentRequired: null }));

    try {
      const response = await createInsurancePolicy(request, paymentProof);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          currentPolicy: response.policy ?? null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Insurance request failed after payment.',
          errorHint: response.hint || null,
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error.',
        errorHint: 'Check your internet connection and try again.',
      }));
    }
  }, []);

  const loadPolicies = useCallback(async (ownerPublicKey?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, errorHint: null }));
    try {
      const policies = await fetchInsurancePolicies(ownerPublicKey);
      setState(prev => ({ ...prev, loading: false, policies }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  const loadPolicy = useCallback(async (policyId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, errorHint: null }));
    try {
      const policy = await fetchInsurancePolicy(policyId);
      if (policy) {
        setState(prev => ({ ...prev, loading: false, policies: [policy] }));
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Policy not found' }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  const claim = useCallback(async (policyId: string, reason: string, requestedAmount?: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null, errorHint: null }));
    try {
      const result = await fileInsuranceClaim(policyId, reason, requestedAmount);
      if (result.success) {
        setState(prev => ({ ...prev, loading: false, claimResult: result.claim ?? null }));
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Claim failed' }));
        return false;
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      errorHint: null,
      policies: [],
      currentPolicy: null,
      claimResult: null,
      paymentRequired: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, errorHint: null }));
  }, []);

  return {
    ...state,
    submitPolicy,
    submitPolicyWithProof,
    loadPolicies,
    loadPolicy,
    claim,
    reset,
    clearError,
  };
}
