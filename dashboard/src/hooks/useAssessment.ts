import { useState, useCallback, useRef, useEffect } from 'react';
import {
  submitAssessment,
  fetchDemoAssets,
  type AssessmentRequest,
  type AssessmentResult,
  type X402PaymentRequirements,
  type DemoAsset,
  type AssetType,
} from '../services/api';

interface UseAssessmentState {
  loading: boolean;
  error: string | null;
  result: AssessmentResult | null;
  demoAssets: DemoAsset[];
  demoLoading: boolean;
  /** When set, the UI should show a payment modal with these requirements */
  paymentRequired: X402PaymentRequirements | null;
}

interface UseAssessmentReturn extends UseAssessmentState {
  /** Step 1: Submit assessment (may trigger 402 → paymentRequired) */
  assess: (request: AssessmentRequest) => Promise<void>;
  /** Step 2: After wallet signs, retry with payment proof */
  submitWithPaymentProof: (request: AssessmentRequest, paymentProof: string) => Promise<void>;
  loadDemoAssets: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export function useAssessment(): UseAssessmentReturn {
  const [state, setState] = useState<UseAssessmentState>({
    loading: false,
    error: null,
    result: null,
    demoAssets: [],
    demoLoading: false,
    paymentRequired: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /**
   * Step 1: Submit assessment request.
   * If the backend returns 402, stores payment requirements in state
   * so the UI can show the payment modal.
   */
  const assess = useCallback(async (request: AssessmentRequest) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, result: null, paymentRequired: null }));

    try {
      const response = await submitAssessment(request);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          result: response.assessment,
        }));
      } else if (response.status === 'payment_required') {
        // x402: backend wants payment — store requirements, stop loading
        setState(prev => ({
          ...prev,
          loading: false,
          paymentRequired: response.paymentRequirements,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Assessment failed. Please try again.',
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error. Is the orchestrator running?',
      }));
    }
  }, []);

  /**
   * Step 2: Retry assessment with payment proof (after wallet signs).
   * This is called after the user approves the payment in their wallet.
   */
  const submitWithPaymentProof = useCallback(async (request: AssessmentRequest, paymentProof: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, result: null, paymentRequired: null }));

    try {
      const response = await submitAssessment(request, paymentProof);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          loading: false,
          result: response.assessment,
        }));
      } else if (response.status === 'payment_required') {
        // Still needs payment — proof was invalid
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Payment verification failed. Please try again.',
          paymentRequired: response.paymentRequirements,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Assessment failed after payment.',
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error after payment.',
      }));
    }
  }, []);

  const loadDemoAssets = useCallback(async () => {
    setState(prev => ({ ...prev, demoLoading: true }));

    try {
      const assets = await fetchDemoAssets();
      setState(prev => ({ ...prev, demoAssets: assets, demoLoading: false }));
    } catch {
      setState(prev => ({ ...prev, demoLoading: false }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      loading: false,
      error: null,
      result: null,
      demoAssets: state.demoAssets,
      demoLoading: false,
      paymentRequired: null,
    });
  }, [state.demoAssets]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return { ...state, assess, submitWithPaymentProof, loadDemoAssets, reset, clearError };
}

// ─── Validation Helpers ──────────────────────────────────────────────────────

export interface FormErrors {
  name?: string;
  askingPrice?: string;
  location?: string;
  artistOrMedium?: string;
  weightOz?: string;
}

export function validateAssessmentForm(
  assetType: AssetType,
  name: string,
  askingPrice: string,
  location: string,
  artistOrMedium: string,
  weightOz: string
): FormErrors {
  const errors: FormErrors = {};

  if (!name.trim()) {
    errors.name = 'Asset name is required';
  } else if (name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters';
  }

  const price = parseFloat(askingPrice.replace(/[^0-9.]/g, ''));
  if (!askingPrice.trim()) {
    errors.askingPrice = 'Asking price is required';
  } else if (isNaN(price) || price <= 0) {
    errors.askingPrice = 'Enter a valid price greater than 0';
  } else if (price > 1_000_000_000) {
    errors.askingPrice = 'Price exceeds maximum allowed';
  }

  if (assetType === 'real-estate') {
    if (!location.trim()) {
      errors.location = 'Location is required for real estate';
    }
  }

  if (assetType === 'art') {
    if (!artistOrMedium.trim()) {
      errors.artistOrMedium = 'Artist or medium is required';
    }
  }

  if (assetType === 'commodity') {
    const oz = parseFloat(weightOz);
    if (!weightOz.trim()) {
      errors.weightOz = 'Weight is required';
    } else if (isNaN(oz) || oz <= 0) {
      errors.weightOz = 'Enter a valid weight in troy ounces';
    }
  }

  return errors;
}
