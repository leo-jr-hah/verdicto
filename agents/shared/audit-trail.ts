import { createHmac, randomUUID, createHash, timingSafeEqual } from 'crypto';
import { createLogger } from './logger.js';

const log = createLogger('Audit');

export interface DeliberationReceipt {
  receiptId: string; // UUID
  assessmentId: string; // Link to assessment
  jurorId: string; // Agent identity
  round: number; // Deliberation round
  inputHash: string; // SHA-256 of input evidence
  outputHash: string; // SHA-256 of juror output
  reasoningHash: string; // SHA-256 of reasoning text
  timestamp: number; // Unix timestamp
  signature: string; // HMAC-SHA256(derivedKey, receiptData)
  previousReceiptId: string; // Chain to previous receipt
}

/**
 * Derives a dedicated HMAC key from a private key material.
 * We never use the raw private key as a symmetric secret;
 * instead we hash it with a fixed domain separator so the
 * HMAC key is irreversible and distinct from the signing key.
 */
function deriveHmacKey(privateKeyMaterial: string): string {
  return createHash('sha256')
    .update('verdict:deliberation-receipt-hmac')
    .update(privateKeyMaterial)
    .digest('hex');
}

export function createDeliberationReceipt(
  jurorSecret: string,
  assessmentId: string,
  jurorId: string,
  round: number,
  input: string,
  output: string,
  reasoning: string,
  previousReceiptId: string = 'genesis'
): DeliberationReceipt {
  const receiptId = randomUUID();
  const timestamp = Date.now();
  const hmacKey = deriveHmacKey(jurorSecret);
  
  // Hash inputs and outputs to prevent tampering
  const inputHash = createHmac('sha256', hmacKey).update(input).digest('hex');
  const outputHash = createHmac('sha256', hmacKey).update(output).digest('hex');
  const reasoningHash = createHmac('sha256', hmacKey).update(reasoning).digest('hex');
  
  // Construct receipt data string for signing
  const receiptData = `${receiptId}|${assessmentId}|${jurorId}|${round}|${inputHash}|${outputHash}|${reasoningHash}|${timestamp}|${previousReceiptId}`;
  
  // Cryptographically sign the receipt
  const signature = createHmac('sha256', hmacKey).update(receiptData).digest('hex');
  
  return {
    receiptId,
    assessmentId,
    jurorId,
    round,
    inputHash,
    outputHash,
    reasoningHash,
    timestamp,
    signature,
    previousReceiptId
  };
}

export function verifyReceiptChain(
  receipts: DeliberationReceipt[],
  getSecretForJuror: (jurorId: string) => string
): boolean {
  if (receipts.length === 0) return true;

  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];

    // 1. Verify temporal chaining (skip genesis receipt)
    if (i > 0 && r.previousReceiptId !== receipts[i - 1].receiptId) {
      log.error(`Chain broken at receipt ${i}: expected prev=${receipts[i - 1].receiptId}, got ${r.previousReceiptId}`);
      return false;
    }

    // 2. Verify HMAC signature using per-juror secret
    const hmacKey = deriveHmacKey(getSecretForJuror(r.jurorId));
    const receiptData = `${r.receiptId}|${r.assessmentId}|${r.jurorId}|${r.round}|${r.inputHash}|${r.outputHash}|${r.reasoningHash}|${r.timestamp}|${r.previousReceiptId}`;
    const expectedSignature = createHmac('sha256', hmacKey).update(receiptData).digest('hex');

    if (!timingSafeEqual(Buffer.from(r.signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      log.error(`Signature mismatch on receipt ${i} (${r.receiptId})`);
      return false;
    }
  }
  return true;
}
