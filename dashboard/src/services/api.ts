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
  metadata?: Record<string, unknown>;
}

export async function fetchTransactions(): Promise<TransactionEntry[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.transactions || [];
  } catch (err) {
    console.warn('[API] Failed to fetch transactions:', err);
    return [];
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
