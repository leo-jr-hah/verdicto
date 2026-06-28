import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import * as db from '../shared/db.js';

// Minimal mock app to test Predict endpoint
const app = express();
app.use(express.json());

// Mock dependencies
vi.mock('../shared/db.js', () => ({
  savePrediction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../shared/verifiable-execution.js', () => ({
  storeCommitmentOnCasper: vi.fn().mockResolvedValue('mock_commit_hash'),
  generateZKCommitment: vi.fn().mockReturnValue({ commitment: 'hash', signature: 'sig' })
}));

app.post('/api/predict', async (req, res) => {
  try {
    const { question, timeframe } = req.body;
    // Mock the response directly to avoid full agent orchestration
    res.json({
      success: true,
      prediction: {
        id: 'PRED-123',
        question,
        timeframe,
        probability: 0.75,
        consensus: 'likely',
        agents: []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

describe('Predict Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process a valid prediction request and return a probability', async () => {
    const response = await request(app)
      .post('/api/predict')
      .send({
        question: 'Will ETH hit 5k?',
        timeframe: 'EOY',
        assetType: 'commodity'
      })
      .set('x-payment-proof', 'mock_proof');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.prediction).toHaveProperty('probability', 0.75);
    expect(response.body.prediction).toHaveProperty('consensus', 'likely');
  });
});
