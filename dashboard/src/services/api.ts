/**
 * API service for fetching real data from the orchestrator backend.
 */

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:3011';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3010';

export interface TransactionEntry {
  id: string;
  type: 'ZK-Lite Commitment' | 'Native Transfer' | 'HMAC Receipt Chain' | 'ExecuteVerdict' | 'UpdateReputation' | 'InitiateDispute' | 'x402 Payment';
  action: string;
  hash: string;
  contract: string;
  blockHeight: string;
  timestamp: string;
  explorerUrl: string;
  onChain: boolean;
  metadata?: Record<string, unknown>;
}

export async function fetchTransactions(): Promise<TransactionEntry[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const txs = data.transactions || [];
    // Backward compat: default onChain=false for entries missing the field
    return txs.map((tx: any) => ({
      ...tx,
      onChain: tx.onChain ?? false,
      explorerUrl: tx.explorerUrl ?? '',
    }));
  } catch (err) {
    console.error('[API] Failed to fetch transactions:', err);
    throw err; // Re-throw so caller can handle it
  }
}

export async function startDispute(): Promise<{ success: boolean; disputeId?: string; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/disputes/start`, { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface ReceiptVerificationResult {
  success: boolean;
  valid: boolean;
  receiptCount: number;
  disputeId?: string;
  reason?: string;
  details: Array<{
    receiptId: string;
    jurorId: string;
    round: number;
    timestamp: number;
    chainLinkValid: boolean;
    isGenesis: boolean;
    isTerminal: boolean;
  }>;
}

export async function verifyReceiptChain(disputeId: string): Promise<ReceiptVerificationResult> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/receipts/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { success: false, valid: false, receiptCount: 0, reason: err.message, details: [] };
  }
}

export type WSMessageType = 'transaction' | 'dispute_started' | 'valuation_result' | 'juror_vote' | 'final_verdict';

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  payload: any;
}

export function createWebSocket(onMessage: (msg: WSMessage) => void): WebSocket {
  const ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log('[WS] Connected to orchestrator');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.warn('[WS] Failed to parse message:', err);
    }
  };
  
  ws.onclose = () => {
    console.log('[WS] Disconnected');
  };
  
  return ws;
}
