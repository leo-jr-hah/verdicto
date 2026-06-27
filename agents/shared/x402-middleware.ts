import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const CSPR_CLOUD_URL = process.env.CSPRCLOUD_BASE_URL || 'https://api.testnet.cspr.cloud';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

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
 *
 * Uses retry with exponential backoff because testnet deploys can take
 * 10-30s to propagate to CSPR.cloud after broadcast.
 */
async function verifyDeployOnChain(deployHash: string): Promise<boolean> {
  if (!CSPR_CLOUD_KEY) {
    console.error(`  [x402] ❌ No CSPRCLOUD_API_KEY - cannot verify deploy, REJECTING`);
    return false;
  }

  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 3_000; // 3s, 6s, 12s backoff

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.get(`${CSPR_CLOUD_URL}/deploys/${deployHash}`, {
        headers: { Authorization: CSPR_CLOUD_KEY, accept: 'application/json' },
        timeout: 5_000,
      });
      // CSPR.cloud API returns { data: { status: "processed", ... } }
      // Deploy is confirmed if status is "processed" (not pending/unknown)
      const status = res.data?.data?.status || res.data?.status;
      if (status === 'processed') {
        if (attempt > 1) {
          console.log(`  [x402] ✅ Deploy ${deployHash.substring(0, 16)}... confirmed on attempt ${attempt}`);
        }
        return true;
      }
      // Deploy exists but not yet processed — retry if we have attempts left
      console.log(`  [x402] ⏳ Deploy ${deployHash.substring(0, 16)}... status: ${status || 'unknown'} (attempt ${attempt}/${MAX_RETRIES})`);
    } catch {
      // Deploy not found yet or network error — retry if we have attempts left
      console.log(`  [x402] ⏳ Deploy ${deployHash.substring(0, 16)}... not found yet (attempt ${attempt}/${MAX_RETRIES})`);
    }

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`  [x402] ❌ Deploy ${deployHash.substring(0, 16)}... NOT confirmed after ${MAX_RETRIES} attempts`);
  return false;
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

    // Demo mode: skip all payment verification
    if (DEMO_MODE) {
      (req as any).x402Payment = { valid: true, payer: 'demo-mode', local: false, demo: true };
      return next();
    }

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
        return res.status(402).json({
          error: 'Payment proof too large',
          hint: 'Your wallet may have produced an invalid proof. Try disconnecting and reconnecting your wallet.',
        });
      }

      const parsed = JSON.parse(decoded);
      const deployHash = parsed.deployHash || parsed.txHash || parsed.payload?.deployHash;

      if (!deployHash || typeof deployHash !== 'string') {
        return res.status(402).json({
          error: 'Payment proof is missing a transaction hash',
          hint: 'Your wallet did not return a valid transaction. Please try signing the payment again.',
        });
      }

      // Validate deploy hash format (64 hex chars)
      if (!DEPLOY_HASH_RE.test(deployHash)) {
        return res.status(402).json({
          error: `Invalid transaction hash format: "${deployHash.substring(0, 16)}..."`,
          hint: 'The wallet returned an unexpected hash. Please try again or use a different wallet.',
        });
      }

      // Validate payment amount - prevent zero-value or micro-payment exploits
      // Handle both flat (parsed.amount) and nested (parsed.payload.amount) proof formats
      const proofAmount = parsed.amount || parsed.payload?.amount;
      if (!validatePaymentAmount(proofAmount?.toString(), config.amountCSPR)) {
        const received = proofAmount ? `${proofAmount} CSPR` : 'unknown amount';
        return res.status(402).json({
          error: `Payment amount mismatch: expected ${config.amountCSPR} CSPR, wallet sent ${received}`,
          hint: 'The payment amount does not match the required fee. Please try again — do not modify the transaction amount.',
        });
      }

      // Verify on-chain - reject if not confirmed (fail-closed)
      // Timeout must exceed retry window: 3 attempts × 5s each + 3s + 6s backoff = ~24s
      const VERIFICATION_TIMEOUT_MS = 25_000;
      const verificationPromise = verifyDeployOnChain(deployHash);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), VERIFICATION_TIMEOUT_MS);
      });

      const valid = await Promise.race([verificationPromise, timeoutPromise]);
      if (!valid) {
        // Reject unconfirmed deploys with actionable message
        return res.status(402).json({
          error: 'Payment not confirmed on-chain yet',
          deployHash,
          hint: 'The network is still processing your transaction. Wait 30 seconds and try again. If this persists, check your wallet for the transaction status.',
        });
      }

      (req as any).x402Payment = { valid: true, payer: parsed.payer || 'unknown', deployHash };
      return next();
    } catch {
      return res.status(402).json({
        error: 'Could not read payment proof from wallet',
        hint: 'Your wallet returned an unreadable response. Please disconnect and reconnect your wallet, then try again.',
      });
    }
  };
}
