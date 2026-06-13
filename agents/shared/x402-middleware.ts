import type { Request, Response, NextFunction } from 'express';

export function simulatedX402Middleware(config: { recipientAddress: string; amountCSPR: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['x-payment-proof'];

    if (!paymentProof) {
      // Return true x402 HTTP 402 Payment Required response
      return res.status(402).json({
        error: 'Payment Required',
        x402Version: '1',
        paymentRequirements: {
          scheme: 'exact',
          network: 'casper-testnet',
          maxAmountRequired: config.amountCSPR,
          resource: req.path,
          description: `Access to ${req.path}`,
          mimeType: 'application/json',
          payTo: config.recipientAddress,
        },
      });
    }

    // In a real x402 implementation, we would verify the Casper transaction proof here.
    // For this hackathon simulation, we accept the mock proof and attach it to the request.
    try {
      const parsed = JSON.parse(Buffer.from(paymentProof as string, 'base64').toString());
      (req as any).x402Payment = { valid: true, payer: parsed.payer || 'simulated-payer' };
      next();
    } catch {
      return res.status(402).json({ error: 'Invalid payment proof format' });
    }
  };
}
