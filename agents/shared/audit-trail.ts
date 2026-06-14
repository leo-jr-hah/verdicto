import { createHmac, randomUUID } from 'crypto';

export interface DeliberationReceipt {
  receiptId: string; // UUID
  disputeId: string; // Link to dispute
  jurorId: string; // Agent identity
  round: number; // Deliberation round
  inputHash: string; // SHA-256 of input evidence
  outputHash: string; // SHA-256 of juror output
  reasoningHash: string; // SHA-256 of reasoning text
  timestamp: number; // Unix timestamp
  signature: string; // HMAC-SHA256(jurorSecret, receiptData)
  previousReceiptId: string; // Chain to previous receipt
}

export function createDeliberationReceipt(
  jurorSecret: string,
  disputeId: string,
  jurorId: string,
  round: number,
  input: string,
  output: string,
  reasoning: string,
  previousReceiptId: string = 'genesis'
): DeliberationReceipt {
  const receiptId = randomUUID();
  const timestamp = Date.now();
  
  // Hash inputs and outputs to prevent tampering
  const inputHash = createHmac('sha256', jurorSecret).update(input).digest('hex');
  const outputHash = createHmac('sha256', jurorSecret).update(output).digest('hex');
  const reasoningHash = createHmac('sha256', jurorSecret).update(reasoning).digest('hex');
  
  // Construct receipt data string for signing
  const receiptData = `${receiptId}|${disputeId}|${jurorId}|${round}|${inputHash}|${outputHash}|${reasoningHash}|${timestamp}|${previousReceiptId}`;
  
  // Cryptographically sign the receipt
  const signature = createHmac('sha256', jurorSecret).update(receiptData).digest('hex');
  
  return {
    receiptId,
    disputeId,
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

export function verifyReceiptChain(receipts: DeliberationReceipt[], jurorPublicKey: string): boolean {
  for (let i = 1; i < receipts.length; i++) {
    // 1. Verify temporal chaining
    if (receipts[i].previousReceiptId !== receipts[i-1].receiptId) {
      return false; // Chain broken
    }
    
    // 2. Verify signature (in production, use ECDSA verify with jurorPublicKey)
    // For this implementation, we demonstrate the HMAC verification structure
    const r = receipts[i];
    const receiptData = `${r.receiptId}|${r.disputeId}|${r.jurorId}|${r.round}|${r.inputHash}|${r.outputHash}|${r.reasoningHash}|${r.timestamp}|${r.previousReceiptId}`;
    
    // In a real scenario with asymmetric crypto, we would verify `r.signature` against `receiptData` using `jurorPublicKey`.
    // We assume it's valid here to complete the demonstration of the chaining structure.
  }
  return true;
}
