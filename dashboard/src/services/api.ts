/**
 * API service for fetching real data from the orchestrator backend.
 */

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:3011';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3010';

// ─── Types ───────────────────────────────────────────────────────────────────

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

export type AssetType = 'real-estate' | 'art' | 'commodity';

export interface AssessmentRequest {
  assetType: AssetType;
  name: string;
  description?: string;
  askingPrice: number;
  location?: string;
  artistOrMedium?: string;
  weightOz?: number;
  sqft?: number;
}

export interface AnalysisStep {
  step: number;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface DataSource {
  name: string;
  type: string;
  status: 'live' | 'mock' | 'failed';
  detail: string;
}

export interface Methodology {
  title: string;
  description: string;
  methods: Array<{
    name: string;
    description: string;
  }>;
}

export interface AssessmentResult {
  assetId: string;
  assetType: AssetType;
  name: string;
  askingPrice: number;
  assessedValue: number;
  divergence: number;
  valuationA: {
    method: string;
    value: number;
    confidence: number;
    source: string;
    reasoning: string;
  };
  valuationB: {
    method: string;
    value: number;
    confidence: number;
    source: string;
    reasoning: string;
  };
  verdict: {
    decision: string;
    finalValue: number;
  } | null;
  marketData: {
    source: string;
    comparables: number;
  } | null;
  analysisSteps?: AnalysisStep[];
  dataSources?: DataSource[];
  methodology?: Methodology;
  timestamp: number;
}

export interface DemoAsset {
  type: AssetType;
  name: string;
  description: string;
  askingPrice: number;
  location?: string;
  sqft?: number;
  artistOrMedium?: string;
  weightOz?: number;
}

// ─── Error Handling ──────────────────────────────────────────────────────────

class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(
      (body as any)?.error || `HTTP ${res.status}`,
      res.status,
      body
    );
  }
  return res.json();
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<TransactionEntry[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/transactions`);
    const data = await handleResponse<{ success: boolean; transactions: TransactionEntry[] }>(res);
    return (data.transactions || []).map(tx => ({
      ...tx,
      onChain: tx.onChain ?? false,
      explorerUrl: tx.explorerUrl ?? '',
    }));
  } catch (err) {
    console.error('[API] Failed to fetch transactions:', err);
    throw err;
  }
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function startDispute(): Promise<{ success: boolean; disputeId?: string; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/disputes/start`, { method: 'POST' });
    return await handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Assessment ──────────────────────────────────────────────────────────────

export async function submitAssessment(
  request: AssessmentRequest,
  paymentProof?: string,
): Promise<{ success: boolean; assessment?: AssessmentResult; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (paymentProof) {
      headers['payment-signature'] = paymentProof;
      headers['x-payment-proof'] = paymentProof;
    }

    const res = await fetch(`${ORCHESTRATOR_URL}/api/assess`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    return await handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchDemoAssets(): Promise<DemoAsset[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/assess/demo`);
    const data = await handleResponse<{ success: boolean; assets: DemoAsset[] }>(res);
    return data.assets || [];
  } catch (err) {
    console.error('[API] Failed to fetch demo assets:', err);
    return [];
  }
}

// ─── Receipt Verification ────────────────────────────────────────────────────

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
    return await handleResponse(res);
  } catch (err: any) {
    return { success: false, valid: false, receiptCount: 0, reason: err.message, details: [] };
  }
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export type WSMessageType = 'transaction' | 'dispute_started' | 'valuation_result' | 'juror_vote' | 'final_verdict' | 'agent_thought' | 'receipt_created';

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
