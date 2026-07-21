// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaymentFlow } from './usePaymentFlow';

describe('usePaymentFlow', () => {
  const mockSignPayment = vi.fn();
  const mockOnSuccess = vi.fn();
  const feeCSPR = 5;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      usePaymentFlow(mockSignPayment, feeCSPR, mockOnSuccess)
    );

    expect(result.current.showModal).toBe(false);
    expect(result.current.signing).toBe(false);
    expect(result.current.signError).toBeNull();
  });

  it('should handle modal opening and cancellation', () => {
    const { result } = renderHook(() => 
      usePaymentFlow(mockSignPayment, feeCSPR, mockOnSuccess)
    );

    act(() => {
      result.current.openModal();
    });
    expect(result.current.showModal).toBe(true);

    act(() => {
      result.current.cancel();
    });
    expect(result.current.showModal).toBe(false);
  });
});
