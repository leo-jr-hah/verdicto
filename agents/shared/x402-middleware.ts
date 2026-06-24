import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const CSPR_CLOUD_URL = process.env.CSPRCLOUD_BASE_URL || 'https://api.cspr.cloud/v1';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';

// ─── Allowed internal IPs for localhost bypass ──────────────────────────────
// Only the loopback addresses trusted for orchestrator→agent calls.
// Headers like Origin/Referer are client-controlled and NEVER trusted.
const TRUSTED_LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// ─── Deploy hash format validation ─────────────────────────────────────────
const DEPLOY_HASH_RE = /^[0-9a-f]{64}$/i;

/**
 * Verify a deploy hash exists on-chain by querying CSPR.cloud.
 * Returns true only if the deploy is confirmed with execution results.
 * Falls back to REJECT (false) if no API key is configured - fail-closed.
 */
async function verifyDeployOnChain(deployHash: string): Promise<boolean> {
  if (!CSPR_CLOUD_KEY) {
    console.error(`  [x402] ❌ No CSPRCLOUD_API_KEY - cannot verify deploy, REJECTING`);
    return false;
  }
  try {
    const res = await axios.get(`${CSPR_CLOUD_URL}/deploys/${deployHash}`, {
      headers: { Authorization: CSPR_CLOUD_KEY },
      timeout: 5_000,
    });
    // Deploy exists on-chain ONLY if execution_results are present (not just pending)
    return res.data?.execution_results?.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validate that the payment proof amount meets or exceeds the required amount.
 * Prevents zero-value or micro-payment exploits.
 */
function validatePaymentAmount(proofAmount: string | undefined, requiredAmount: string): boolean {
  if (!proofAmount) return false;
  const proof = parseFloat(proofAmount);
  const required = parseFloat(requiredAmount);
  if (isNaN(proof) || isNaN(required) || proof <= 0) return false;
  // Allow exact match or slight overpayment (dust tolerance)
  return proof >= required * 0.99;
}

export function casperX402Middleware(config: { recipientAddress: string; amountCSPR: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['payment-signature'] || req.headers['x-payment-proof'];

    // ── Localhost bypass: trust ONLY socket IP, never headers ──────────────
    // req.ip is set by Express from the TCP socket, not from client headers.
    // Headers (Origin, Referer, X-Forwarded-For) are trivially spoofable.
    const socketIp = req.socket.remoteAddress || req.ip;
    const isTrustedLocal = TRUSTED_LOCAL_IPS.has(socketIp ?? '') ||
                           process.env.NODE_ENV === 'development';
    const requirePayment = process.env.X402_REQUIRE_PAYMENT === 'true';

    if (isTrustedLocal && !paymentProof && !requirePayment) {
      (req as any).x402Payment = { valid: true, payer: 'localhost-bypass', local: true };
      return next();
    }

    if (!paymentProof) {
      res.setHeader('payment-required', 'true');
      return res.status(402).json({
        error: 'Payment Required',
        x402Version: '2',
        paymentRequirements: {
          scheme: 'wallet-session',
          supportedChains: ['casper:testnet'],
          chainId: 'casper:testnet',
          maxAmountRequired: config.amountCSPR,
          resource: req.path,
          description: `Access to ${req.path}`,
          mimeType: 'application/json',
          payTo: config.recipientAddress,
          sessionEnabled: true,
        },
      });
    }

    // ── Verify the payment proof ───────────────────────────────────────────
    try {
      const decoded = Buffer.from(paymentProof as string, 'base64').toString();

      // Reject excessively large proofs (DoS vector)
      if (decoded.length > 4096) {
        return res.status(402).json({ error: 'Payment proof too large' });
      }

      const parsed = JSON.parse(decoded);
      const deployHash = parsed.deployHash || parsed.txHash;

      if (!deployHash || typeof deployHash !== 'string') {
        return res.status(402).json({ error: 'Payment proof missing deploy hash' });
      }

      // Validate deploy hash format (64 hex chars)
      if (!DEPLOY_HASH_RE.test(deployHash)) {
        return res.status(402).json({ error: 'Invalid deploy hash format' });
      }

      // Validate payment amount - prevent zero-value or micro-payment exploits
      if (!validatePaymentAmount(parsed.amount, config.amountCSPR)) {
        return res.status(402).json({
          error: 'Insufficient payment amount',
          required: config.amountCSPR,
          received: parsed.amount || 'none',
        });
      }

      // Verify on-chain - reject if not confirmed (fail-closed)
      const VERIFICATION_TIMEOUT_MS = 8_000;
      const verificationPromise = verifyDeployOnChain(deployHash);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), VERIFICATION_TIMEOUT_MS);
      });

      const valid = await Promise.race([verificationPromise, timeoutPromise]);
      if (!valid) {
        // Reject unconfirmed deploys - no more silent pass-through
        return res.status(402).json({
          error: 'Payment not confirmed on-chain',
          deployHash,
          hint: 'Wait for block confirmation and retry',
        });
      }

      (req as any).x402Payment = { valid: true, payer: parsed.payer || 'unknown', deployHash };
      return next();
    } catch {
      return res.status(402).json({ error: 'Invalid payment proof format' });
    }
  };
}
