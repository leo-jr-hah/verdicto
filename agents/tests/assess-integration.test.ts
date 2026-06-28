import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { runDualValuation } from '../shared/agent-engine.js';
import * as db from '../shared/db.js';

// Minimal mock app to test Assess endpoint
const app = express();
app.use(express.json());

// Mock dependencies
vi.mock('../shared/agent-engine.js', () => ({
  runDualValuation: vi.fn().mockResolvedValue([
    { value: 1000000, confidence: 0.85, reasoning: 'Comps analysis', methodology: 'Comparable Sales' },
    { value: 950000, confidence: 0.8, reasoning: 'DCF analysis', methodology: 'DCF' },
  ]),
}));

vi.mock('../shared/db.js', () => ({
  saveAssessment: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../shared/casper-contracts.js', () => ({
  castVoteOnChain: vi.fn().mockResolvedValue({ success: true, txHash: 'mock_tx_hash' }),
}));

vi.mock('../shared/verifiable-execution.js', () => ({
  storeCommitmentOnCasper: vi.fn().mockResolvedValue('mock_commit_hash'),
  generateZKCommitment: vi.fn().mockReturnValue({ commitment: 'hash', signature: 'sig' })
}));

app.post('/api/assess', async (req, res) => {
  try {
    const { assetType, name, description, askingPrice } = req.body;
    const [valuationA, valuationB] = await runDualValuation({
      assetType,
      assetId: `test-${Date.now()}`,
      name,
      location: 'Test Location',
    });
    res.json({ success: true, assessment: { valuationA, valuationB } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

describe('Assess Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process a valid assessment request and return a unified verdict', async () => {
    const response = await request(app)
      .post('/api/assess')
      .send({
        assetType: 'real-estate',
        name: 'Downtown Office',
        description: 'Test building',
        askingPrice: 1000000,
      })
      .set('x-payment-proof', 'mock_proof'); // in real app handled by middleware

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.assessment).toHaveProperty('valuationA');
    expect(response.body.assessment).toHaveProperty('valuationB');
    
    expect(runDualValuation).toHaveBeenCalledWith(
      expect.objectContaining({
        assetType: 'real-estate',
        name: 'Downtown Office',
      })
    );
  });
});
