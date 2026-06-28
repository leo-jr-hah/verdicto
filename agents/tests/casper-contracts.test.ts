import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as db from '../shared/db.js';
import { executeCasperTransfer } from '../shared/casper-contracts.js';

// Mock dependencies
vi.mock('../shared/db.js', () => ({
  saveDispute: vi.fn().mockResolvedValue(undefined),
  getAllDisputes: vi.fn().mockResolvedValue([]),
}));

describe('casper-contracts', () => {
  beforeEach(() => {
    // Reset env
    process.env.DEMO_MODE = 'true';
    process.env.DEPLOYER_PRIVATE_KEY = 'test_key';
    process.env.CSPRCLOUD_API_KEY = 'test_api_key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executeCasperTransfer should return simulated hash in demo mode', async () => {
    process.env.DEMO_MODE = 'true';
    const hash = await executeCasperTransfer('0xTarget', 1000, 123);
    expect(hash).toMatch(/^demo_/);
  });
});
