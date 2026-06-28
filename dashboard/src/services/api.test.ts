import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetchDisputes should return a list of disputes', async () => {
    const mockDisputes = [{ id: '1', status: 'open' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, disputes: mockDisputes })
    });

    const result = await api.fetchDisputes();
    expect(result).toEqual(mockDisputes);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/oracle/disputes'));
  });

  it('fetchDisputes should return empty array on fetch failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    const result = await api.fetchDisputes();
    expect(result).toEqual([]);
  });
});
