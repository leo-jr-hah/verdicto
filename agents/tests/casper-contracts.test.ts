import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as db from '../shared/db.js';

// Mock dependencies
vi.mock('../shared/db.js', () => ({
  saveDispute: vi.fn().mockResolvedValue(undefined),
  getAllDisputes: vi.fn().mockResolvedValue([]),
}));

// Mock child_process.execFile to avoid calling casper-client CLI
vi.mock('child_process', () => ({
  execFile: vi.fn((_cmd: string, _args: string[], _opts: any, cb: Function) => {
    // Write a fake deploy JSON to the output file
    const fs = require('fs');
    const args = _args as string[];
    const outIdx = args.indexOf('-o');
    if (outIdx >= 0 && args[outIdx + 1]) {
      fs.writeFileSync(args[outIdx + 1], JSON.stringify({ deploy: { hash: 'a'.repeat(64) } }));
    }
    cb(null, 'success', '');
  }),
}));

// Mock axios to avoid real RPC calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { result: { deploy_hash: 'a'.repeat(64) } } }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('casper-contracts', () => {
  beforeEach(() => {
    process.env.DEPLOYER_PRIVATE_KEY = '/tmp/test-key.pem';
    process.env.CSPRCLOUD_API_KEY = 'test_api_key';
    process.env.CASPER_CHAIN_NAME = 'casper-test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executeCasperTransfer should return a deploy hash', async () => {
    const { executeCasperTransfer } = await import('../shared/casper-contracts.js');
    const hash = await executeCasperTransfer('0203' + 'ab'.repeat(31), 1000, 123);
    expect(hash).toMatch(/^[0-9a-f]{64}$/i);
  });
});
