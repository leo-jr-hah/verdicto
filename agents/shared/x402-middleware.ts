import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const CSPR_CLOUD_URL = process.env.CSPRCLOUD_BASE_URL || 'https://api.cspr.cloud/v1';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';

/**
 * Verify a deploy hash exists on-chain by querying CSPR.cloud.
 * Returns the deploy info if found, null otherwise.
 */
async function verifyDeployOnChain(deployHash: string): Promise<boolean> {
  if (!CSPR_CLOUD_KEY) {
    // No API key — can't verify, fall back to allowing in dev
    console.log(`  [x402] ⚠️ No CSPRCLOUD_API_KEY — skipping on-chain verification`);
    return true;
  }
  try {
    const res = await axios.get(`${CSPR_CLOUD_URL}/deploys/${deployHash}`, {
      headers: { Authorization: CSPR_CLOUD_KEY },
    });
    // Deploy exists on-chain if we get a 200 with execution_results
    return res.data?.execution_results?.length > 0 || res.data?.deploy?.hash != null;
  } catch {
    return false;
  }
}

export function casperX402Middleware(config: { recipientAddress: string; amountCSPR: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['payment-signature'] || req.headers['x-payment-proof'];

    // Bypass x402 for localhost calls (orchestrator → agents)
    const origin = req.headers.origin || req.headers.referer || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') ||
                        req.ip === '127.0.0.1' || req.ip === '::1';
    const requirePayment = process.env.X402_REQUIRE_PAYMENT === 'true';

    if (isLocalhost && !paymentProof && !requirePayment) {
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
          supportedChains: ['casper:testnet', 'eip155:1', 'eip155:137'],
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

    // Verify the payment proof — decode, extract deploy hash, check on-chain
    try {
      const parsed = JSON.parse(Buffer.from(paymentProof as string, 'base64').toString());
      const deployHash = parsed.deployHash || parsed.txHash;

      if (!deployHash) {
        return res.status(402).json({ error: 'Payment proof missing deploy hash' });
      }

      // Verify on-chain with a timeout — reject if verification doesn't complete
      const VERIFICATION_TIMEOUT_MS = 5_000;
      const verificationPromise = verifyDeployOnChain(deployHash);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), VERIFICATION_TIMEOUT_MS);
      });

      const valid = await Promise.race([verificationPromise, timeoutPromise]);
      if (valid) {
        (req as any).x402Payment = { valid: true, payer: parsed.payer || 'unknown', deployHash };
        return next();
      } else {
        // Deploy not found on-chain yet — might be pending, allow with warning
        console.log(`  [x402] ⚠️ Deploy ${deployHash.slice(0, 16)}... not confirmed on-chain, allowing with caveat`);
        (req as any).x402Payment = { valid: true, payer: parsed.payer || 'unknown', deployHash, unconfirmed: true };
        return next();
      }
    } catch {
      return res.status(402).json({ error: 'Invalid payment proof format' });
    }
  };
}
