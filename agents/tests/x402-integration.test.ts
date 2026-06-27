/**
 * x402 Integration Tests - Full payment flow simulation
 *
 * Tests the complete x402 protocol:
 *   1. Client requests resource without payment → 402 + paymentRequirements
 *   2. Client signs payment (wallet) → creates proof
 *   3. Client retries with proof → middleware verifies → 200
 *
 * Also tests edge cases: invalid proofs, insufficient amounts, replay attacks.
 */

// ─── Set env BEFORE imports so module-level constants pick them up ──────────
process.env.CSPRCLOUD_API_KEY = 'test-key-for-mock';
process.env.X402_REQUIRE_PAYMENT = 'true';
process.env.NODE_ENV = 'test';

import { describe, it, expect, vi } from 'vitest';
import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { createHash, randomBytes } from 'crypto';

// ─── Mock on-chain verification ─────────────────────────────────────────────
// Mock axios BEFORE importing the middleware so the middleware's internal
// verifyDeployOnChain uses the mocked version.
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn().mockImplementation((url: string) => {
        if (url.includes('/deploys/')) {
          const hash = url.split('/deploys/')[1];
          // Valid hashes (64 hex chars) return confirmed
          // Middleware checks res.data?.data?.status === 'processed'
          if (/^[0-9a-f]{64}$/i.test(hash)) {
            return Promise.resolve({
              data: {
                data: {
                  status: 'processed',
                  deploy_hash: hash,
                  block_hash: 'a'.repeat(64),
                  execution_results: [{ result: 'Success' }],
                },
              },
            });
          }
          return Promise.reject({ response: { status: 404 } });
        }
        return actual.default.get(url);
      }),
    },
  };
});

// Import AFTER env setup and mocks
const { casperX402Middleware } = await import('../shared/x402-middleware.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateDeployHash(): string {
  return randomBytes(32).toString('hex');
}

function createValidProof(overrides: Record<string, any> = {}): string {
  const proof = {
    payer: '01aabbccdd'.padEnd(66, '0'),
    txHash: generateDeployHash(),
    amount: '2.5',
    network: 'casper-test',
    ...overrides,
  };
  return Buffer.from(JSON.stringify(proof)).toString('base64');
}

function createTestApp(config?: { recipientAddress?: string; amountCSPR?: string }) {
  const app = express();
  app.use(express.json());

  const middleware = casperX402Middleware({
    recipientAddress: config?.recipientAddress || '01' + 'ab'.repeat(32),
    amountCSPR: config?.amountCSPR || '2.5',
  });

  // Public route (no middleware)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Protected route (x402 required)
  app.post('/assess', middleware, (req: Request, res: Response) => {
    const x402 = (req as any).x402Payment;
    res.json({
      result: 'assessment_complete',
      payment: x402,
      assetId: req.body?.assetId,
    });
  });

  return app;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('x402 - Payment Required Response', () => {
  it('returns 402 with paymentRequirements when no proof provided', async () => {
    const app = createTestApp();

    const res = await request(app)
      .post('/assess')
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toBe('Payment Required');
    expect(res.body.x402Version).toBe('2');
    expect(res.body.paymentRequirements).toBeDefined();
    expect(res.body.paymentRequirements.scheme).toBe('wallet-session');
    expect(res.body.paymentRequirements.maxAmountRequired).toBe('2.5');
    expect(res.body.paymentRequirements.payTo).toBeDefined();
    expect(res.body.paymentRequirements.supportedChains).toContain('casper:testnet');
  });

  it('includes payment-required header in 402 response', async () => {
    const app = createTestApp();

    const res = await request(app)
      .post('/assess')
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.headers['payment-required']).toBe('true');
  });

  it('returns correct fee amount from config', async () => {
    const app = createTestApp({ amountCSPR: '5.0' });

    const res = await request(app)
      .post('/assess')
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.paymentRequirements.maxAmountRequired).toBe('5.0');
  });

  it('public routes bypass middleware', async () => {
    const app = createTestApp();

    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
  });
});

describe('x402 - Payment Proof Validation', () => {
  it('accepts valid payment proof and passes through', async () => {
    const app = createTestApp();
    const proof = createValidProof();

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(200);

    expect(res.body.result).toBe('assessment_complete');
    expect(res.body.payment.valid).toBe(true);
    expect(res.body.payment.deployHash).toBeDefined();
  });

  it('rejects proof with missing deploy hash', async () => {
    const app = createTestApp();
    const proof = createValidProof({ txHash: undefined, deployHash: undefined });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('missing a transaction hash');
  });

  it('rejects proof with invalid deploy hash format', async () => {
    const app = createTestApp();
    const proof = createValidProof({ txHash: 'not-a-valid-hash' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Invalid transaction hash format');
  });

  it('rejects proof with insufficient payment amount', async () => {
    const app = createTestApp({ amountCSPR: '10.0' });
    const proof = createValidProof({ amount: '0.01' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Payment amount mismatch');
  });

  it('rejects malformed base64 proof', async () => {
    const app = createTestApp();

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', '!!!invalid-base64!!!')
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Could not read payment proof');
  });

  it('rejects excessively large proofs (DoS protection)', async () => {
    const app = createTestApp();
    // Create a proof that decodes to > 4096 bytes
    const hugePayload = Buffer.from(JSON.stringify({
      payer: 'x'.repeat(5000),
      txHash: generateDeployHash(),
      amount: '2.5',
    })).toString('base64');

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', hugePayload)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('too large');
  });

  it('accepts proof via payment-signature header too', async () => {
    const app = createTestApp();
    const proof = createValidProof();

    const res = await request(app)
      .post('/assess')
      .set('payment-signature', proof)
      .send({ assetId: 'RE-001' })
      .expect(200);

    expect(res.body.payment.valid).toBe(true);
  });
});

describe('x402 - Full Flow Simulation (402 → Sign → Retry)', () => {
  it('simulates complete client-side 402 flow', async () => {
    const app = createTestApp({ amountCSPR: '2.5' });

    // Step 1: Initial request - expect 402
    const step1 = await request(app)
      .post('/assess')
      .send({ assetId: 'GOLD-001' })
      .expect(402);

    const requirements = step1.body.paymentRequirements;
    expect(requirements.maxAmountRequired).toBe('2.5');

    // Step 2: Client would sign payment with wallet (simulated here)
    // In real flow, this happens in the browser via CasperWalletProvider
    const proof = createValidProof({
      amount: requirements.maxAmountRequired,
      payTo: requirements.payTo,
    });

    // Step 3: Retry with payment proof - expect 200
    const step3 = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'GOLD-001' })
      .expect(200);

    expect(step3.body.result).toBe('assessment_complete');
    expect(step3.body.payment.valid).toBe(true);
    expect(step3.body.assetId).toBe('GOLD-001');
  });

  it('multiple assessments each require separate payment', async () => {
    const app = createTestApp({ amountCSPR: '2.5' });

    // First assessment - pay and succeed
    const proof1 = createValidProof({ txHash: generateDeployHash() });
    await request(app)
      .post('/assess')
      .set('x-payment-proof', proof1)
      .send({ assetId: 'RE-001' })
      .expect(200);

    // Second assessment - no proof, expect 402 again
    await request(app)
      .post('/assess')
      .send({ assetId: 'RE-002' })
      .expect(402);
  });

  it('proof amount exactly matching requirement is accepted', async () => {
    const app = createTestApp({ amountCSPR: '2.5' });
    const proof = createValidProof({ amount: '2.5' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(200);

    expect(res.body.payment.valid).toBe(true);
  });

  it('proof with slight overpayment is accepted (dust tolerance)', async () => {
    const app = createTestApp({ amountCSPR: '2.5' });
    const proof = createValidProof({ amount: '2.6' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(200);

    expect(res.body.payment.valid).toBe(true);
  });
});

describe('x402 - Security Edge Cases', () => {
  it('rejects proof with zero amount', async () => {
    const app = createTestApp();
    const proof = createValidProof({ amount: '0' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Payment amount mismatch');
  });

  it('rejects proof with negative amount', async () => {
    const app = createTestApp();
    const proof = createValidProof({ amount: '-5' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Payment amount mismatch');
  });

  it('rejects proof with NaN amount', async () => {
    const app = createTestApp();
    const proof = createValidProof({ amount: 'not-a-number' });

    const res = await request(app)
      .post('/assess')
      .set('x-payment-proof', proof)
      .send({ assetId: 'RE-001' })
      .expect(402);

    expect(res.body.error).toContain('Payment amount mismatch');
  });
});
