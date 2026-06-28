import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { runAgentDeliberation } from '../shared/agent-engine.js';
import * as db from '../shared/db.js';

// Minimal mock app to test Assess endpoint
const app = express();
app.use(express.json());

// Mock dependencies
vi.mock('../shared/agent-engine.js', () => ({
  runAgentDeliberation: vi.fn().mockResolvedValue({
    assetId: 'test-asset-123',
    assetType: 'real-estate',
    name: 'Test Asset',
    assessedValue: 1000000,
    confidence: 0.85,
    divergence: 0.05,
    decision: 'AgentAPreferred',
    valuationA: { value: 1000000, confidence: 0.85 },
    valuationB: { value: 950000, confidence: 0.8 },
    timestamp: Date.now()
  })
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
    const result = await runAgentDeliberation(assetType, name, description, askingPrice);
    res.json({ success: true, assessment: result });
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
    expect(response.body.assessment).toHaveProperty('assessedValue', 1000000);
    expect(response.body.assessment).toHaveProperty('confidence', 0.85);
    
    expect(runAgentDeliberation).toHaveBeenCalledWith(
      'real-estate',
      'Downtown Office',
      'Test building',
      1000000
    );
  });
});
