import { useState, useCallback, useRef, useEffect } from 'react';
import {
  submitAssessment,
  fetchDemoAssets,
  type AssessmentRequest,
  type AssessmentResult,
  type DemoAsset,
  type AssetType,
} from '../services/api';

interface UseAssessmentState {
  loading: boolean;
  error: string | null;
  result: AssessmentResult | null;
  demoAssets: DemoAsset[];
  demoLoading: boolean;
}

interface UseAssessmentReturn extends UseAssessmentState {
  assess: (request: AssessmentRequest, paymentProof?: string) => Promise<void>;
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
  });

  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const assess = useCallback(async (request: AssessmentRequest, paymentProof?: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));

    try {
      const response = await submitAssessment(request, paymentProof);

      if (response.success && response.assessment) {
        setState(prev => ({
          ...prev,
          loading: false,
          result: response.assessment!,
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
    });
  }, [state.demoAssets]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return { ...state, assess, loadDemoAssets, reset, clearError };
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
