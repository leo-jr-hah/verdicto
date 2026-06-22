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

    setState(prev => ({ ...prev, loading: true, error: null, currentPolicy: null, paymentRequired: null }));

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

  const submitPolicyWithProof = useCallback(async (request: InsuranceCreateRequest, paymentProof: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, currentPolicy: null, paymentRequired: null }));

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

  const loadPolicies = useCallback(async (ownerPublicKey?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const policies = await fetchInsurancePolicies(ownerPublicKey);
      setState(prev => ({ ...prev, loading: false, policies }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to load policies.' }));
    }
  }, []);

  const loadPolicy = useCallback(async (policyId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const policy = await fetchInsurancePolicy(policyId);
      if (policy) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Policy not found.' }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to load policy.' }));
    }
  }, []);

  const claim = useCallback(async (policyId: string, reason: string, requestedAmount?: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null, claimResult: null }));
    try {
      const result = await fileInsuranceClaim(policyId, reason, requestedAmount);
      if (result.success && result.claim) {
        setState(prev => ({ ...prev, loading: false, claimResult: result.claim! }));
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Claim failed.' }));
        return false;
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Network error.' }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      loading: false,
      error: null,
      policies: [],
      currentPolicy: null,
      claimResult: null,
      paymentRequired: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
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
