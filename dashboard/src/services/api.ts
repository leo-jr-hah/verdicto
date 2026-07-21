/**
 * API service for fetching real data from the orchestrator backend.
 */

// In dev, empty string uses Vite proxy (/api/* - localhost:3011)
// In production, set VITE_ORCHESTRATOR_URL to the deployed backend URL
import { createLogger } from '../utils/logger.js';
const log = createLogger('API');

export const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || (import.meta.env.PROD ? 'https://verdicto-production.up.railway.app' : '');
const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? 'wss://verdicto-production.up.railway.app/ws' : '');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransactionEntry {
  id: string;
  type: 'Hash Commitment' | 'Native Transfer' | 'HMAC Receipt Chain' | 'ExecuteVerdict' | 'UpdateReputation' | 'SubmitAssessment' | 'x402 Payment' | 'ContractCall' | 'Dispute Filed' | 'Retrial Complete';
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
    fallbackTriggered?: boolean;
    fallbackProvider?: 'groq' | 'heuristic';
  };
  valuationB: {
    method: string;
    value: number;
    confidence: number;
    source: string;
    reasoning: string;
    fallbackTriggered?: boolean;
    fallbackProvider?: 'groq' | 'heuristic';
  };
  verdict: {
    decision: string;
    finalValue: number;
  } | null;
  marketData: {
    source: string;
    comparables: number;
    assetType?: string;
  } | null;
  analysisSteps?: AnalysisStep[];
  dataSources?: DataSource[];
  methodology?: Methodology;
  timestamp: number;
  /** Agents that fell back to deterministic responses (empty = all LLMs worked). */
  fallbackAgents?: Array<{ agent: string; provider: 'groq' | 'heuristic' }>;
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

// ─── Lending Types ───────────────────────────────────────────────────────────

export interface Loan {
  loanId: string;
  assetId: string;
  assetType: AssetType;
  assetName: string;
  assessedValue: number;
  ltvRatio: number;
  loanAmountCSPR: number;
  status: 'active' | 'healthy' | 'warning' | 'liquidated' | 'repaid';
  healthRatio: number;
  repaidAmountCSPR: number;
  createdAt: number;
  lastRevaluedAt: number;
  disbursementTxHash: string;
  // Verdicto Point 1: Trust-score-aware LTV breakdown
  trustBreakdown: { confidence: number; valueRatio: number; ltvRange: string };
  // Verdicto Point 2: Escrow lock/release tx hashes
  escrowLockTxHash?: string;
  escrowReleaseTxHash?: string;
  // Verdicto Point 3: Revaluation history with juror deliberation
  revaluationHistory: Array<{
    timestamp: number;
    previousValue: number;
    newValue: number;
    healthRatio: number;
    status: string;
    valuationA: { value: number; method: string; confidence: number; reasoning: string };
    valuationB: { value: number; method: string; confidence: number; reasoning: string };
    deliberationReceiptHash?: string;
  }>;
}

export interface LoanCreateRequest {
  borrowerPublicKey: string;
  assetId: string;
  assetType: AssetType;
  assetName: string;
  assessedValue: number;
  askingPrice: number;
  confidence: number;
  assessmentId?: string;
  assessmentTimestamp?: number;
  divergence?: number;
}

export interface LoanCreateResponse {
  loanId: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  assessedValue: number;
  ltvRatio: number;
  loanAmountCSPR: number;
  tier: string;
  platformFeeCSPR: number;
  status: string;
  healthRatio: number;
  disbursementTxHash: string;
  broadcastSuccess: boolean;
  createdAt: number;
  // Verdicto Point 1: Trust breakdown
  trustBreakdown: { confidence: number; valueRatio: number; ltvRange: string };
  // Verdicto Point 2: Escrow
  escrowLockTxHash?: string;
  escrowReleaseTxHash?: string;
}

export interface RevaluationResult {
  loanId: string;
  previousValue: number;
  newValue: number;
  valueChangePercent: number;
  healthRatio: number;
  status: string;
  marginCall: boolean;
  liquidated: boolean;
  valuationA: { value: number; method: string; confidence: number; reasoning: string };
  valuationB: { value: number; method: string; confidence: number; reasoning: string };
  // Verdicto Point 3: Deliberation proof
  divergence: number;
  receiptHash: string;
  commitmentTxHash: string;
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
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    const preview = text.slice(0, 200);
    throw new ApiError(
      `Expected JSON but got ${contentType || 'unknown content-type'}. URL: ${res.url}. Response preview: ${preview}`,
      res.status,
      text
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
    log.error('Failed to fetch transactions: ' + err);
    throw err;
  }
}

export async function cleanupTransactions(): Promise<{ removed: number; remaining: number }> {
  const res = await fetch(`${ORCHESTRATOR_URL}/api/transactions/cleanup`, { method: 'DELETE' });
  return handleResponse<{ success: boolean; removed: number; remaining: number }>(res);
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export interface PredictionEntry {
  prediction_id: string;
  question: string;
  timeframe: string;
  asset_type: string;
  probability: number;
  confidence: number;
  agents: { name: string; role: string; color: string; probability: number; confidence: number; reasoning: string }[];
  risk_factors: string[];
  created_at: number;
}

export async function fetchPredictions(): Promise<PredictionEntry[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/predictions`);
    const data = await handleResponse<{ success: boolean; predictions: PredictionEntry[] }>(res);
    return data.predictions || [];
  } catch (err) {
    log.error('Failed to fetch predictions: ' + err);
    throw err;
  }
}

// ─── Assessments ─────────────────────────────────────────────────────────────

export async function startAssessment(): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/assessments/start`, { method: 'POST' });
    return await handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Assessment ──────────────────────────────────────────────────────────────

/** x402 payment requirements returned by the backend when payment is needed */
export interface X402PaymentRequirements {
  x402Version: string;
  paymentRequirements: {
    scheme: string;
    supportedChains: string[];
    chainId: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    sessionEnabled: boolean;
  };
}

/** Result of submitAssessment - either success, payment required, or error */
export type AssessmentResponse =
  | { status: 'success'; assessment: AssessmentResult }
  | { status: 'payment_required'; paymentRequirements: X402PaymentRequirements }
  | { status: 'error'; error: string };

/**
 * Submit an assessment request to the orchestrator.
 *
 * x402 flow:
 *   1. First call: no paymentProof - backend may return 402 with payment requirements
 *   2. If 402: return payment requirements to the caller (UI shows payment modal)
 *   3. User signs payment via wallet - caller retries with paymentProof
 *   4. Second call: includes x-payment-proof header - backend verifies and proceeds
 */
export async function submitAssessment(
  request: AssessmentRequest,
  paymentProof?: string,
): Promise<AssessmentResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (paymentProof) {
      headers['x-payment-proof'] = paymentProof;
    }

    const res = await fetch(`${ORCHESTRATOR_URL}/api/assess`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Handle 402 Payment Required - return requirements for UI to handle
    if (res.status === 402) {
      const body = await res.json();
      if (body.paymentRequirements) {
        return {
          status: 'payment_required',
          paymentRequirements: body as X402PaymentRequirements,
        };
      }
      // 402 without requirements - treat as error
      return { status: 'error', error: body.error || 'Payment required' };
    }

    const body = await res.json();
    if (body.success && body.assessment) {
      return { status: 'success', assessment: body.assessment };
    }
    return { status: 'error', error: body.error || 'Assessment failed' };
  } catch (err: any) {
    return { status: 'error', error: err.message || 'Network error' };
  }
}

// ─── Frontend fallback demos (shown when backend is unreachable) ─────────────

const FALLBACK_DEMOS: DemoAsset[] = [
  // ── Real Estate (5) ──────────────────────────────────────────────────────
  {
    type: 'real-estate',
    name: 'Miami Beachfront Condo',
    description: '2BR/2BA oceanfront unit at 123 Ocean Dr, Miami Beach. Built 2019, floor-to-ceiling impact glass, private balcony with Atlantic views.',
    askingPrice: 1_250_000,
    location: '123 Ocean Dr, Miami Beach, FL 33339',
    sqft: 1200,
  },
  {
    type: 'real-estate',
    name: 'Brooklyn Brownstone Duplex',
    description: 'Owner\'s duplex in Bed-Stuy, 3BR/2.5BA, original crown moldings, updated kitchen with Viking appliances, private backyard.',
    askingPrice: 1_875_000,
    location: '287 Hancock St, Brooklyn, NY 11216',
    sqft: 2400,
  },
  {
    type: 'real-estate',
    name: 'Austin Suburban Ranch',
    description: '4BR/3BA single-family on 0.5 acres in Cedar Park. Open floor plan, quartz counters, 3-car garage, pool.',
    askingPrice: 685_000,
    location: '456 Ranch Rd, Cedar Park, TX 78613',
    sqft: 2800,
  },
  {
    type: 'real-estate',
    name: 'Denver Loft Conversion',
    description: 'Industrial loft in RiNo arts district, 1BR/1BA, exposed brick, 14-ft ceilings, rooftop deck access, built 2021.',
    askingPrice: 520_000,
    location: '2960 Walnut St, Denver, CO 80205',
    sqft: 950,
  },
  {
    type: 'real-estate',
    name: 'San Francisco Victorian TIC',
    description: '2BR/1BA top-floor Victorian flat in Hayes Valley, bay windows, hardwood floors, updated plumbing & electrical.',
    askingPrice: 1_150_000,
    location: '415 Page St, San Francisco, CA 94117',
    sqft: 1100,
  },
  // ── Art (5) ──────────────────────────────────────────────────────────────
  {
    type: 'art',
    name: 'Contemporary Oil on Canvas',
    description: 'Large-scale abstract expressionist work, 48×60 inches, signed and dated 2021. Exhibited at Miami Basel satellite fair.',
    askingPrice: 45_000,
    artistOrMedium: 'Oil on Canvas',
  },
  {
    type: 'art',
    name: 'Japanese Woodblock Print',
    description: 'Early 20th century shin-hanga landscape by Kawase Hasui, edition 24/100, excellent condition with original mat.',
    askingPrice: 8_500,
    artistOrMedium: 'Woodblock Print',
  },
  {
    type: 'art',
    name: 'Bronze Sculpture, Standing Figure',
    description: 'Lost-wax cast bronze, 36 inches tall, by mid-century American sculptor. Foundry mark and edition number on base.',
    askingPrice: 32_000,
    artistOrMedium: 'Bronze Sculpture',
  },
  {
    type: 'art',
    name: 'Vintage Analog Photography Collection',
    description: 'Set of 12 gelatin silver prints, 16×20 each, documenting 1970s NYC street life. Artist proof, signed verso.',
    askingPrice: 18_500,
    artistOrMedium: 'Gelatin Silver Print',
  },
  {
    type: 'art',
    name: 'Digital Art NFT, Generative Series',
    description: 'On-chain generative artwork from a curated Art Blocks collection, minted 2022. Token #417 of 500.',
    askingPrice: 6_200,
    artistOrMedium: 'Generative Digital Art',
  },
  // ── Commodity (5) ────────────────────────────────────────────────────────
  {
    type: 'commodity',
    name: '10 oz Gold Bar',
    description: 'LBMA-certified 10 troy oz gold bar, .9999 fine, serial verified, sealed in assay card.',
    askingPrice: 23_500,
    weightOz: 10,
  },
  {
    type: 'commodity',
    name: '100 oz Silver Bar',
    description: 'COMEX-approved 100 troy oz silver bar, .999 fine, with serial number and certificate.',
    askingPrice: 2_800,
    weightOz: 100,
  },
  {
    type: 'commodity',
    name: '1 oz Platinum Coin',
    description: 'American Platinum Eagle, 1 oz .9995 fine, 2023 issue, BU condition in original mint tube.',
    askingPrice: 1_050,
    weightOz: 1,
  },
  {
    type: 'commodity',
    name: '1 kg Gold Bar',
    description: 'PAMP Suisse 1 kilogram gold bar, .9999 fine, individually serialized with Veriscan technology.',
    askingPrice: 74_000,
    weightOz: 32.15,
  },
  {
    type: 'commodity',
    name: '500 oz Silver Monster Box',
    description: 'Sealed US Mint monster box containing 500 American Silver Eagle coins, 2024 issue, .999 fine.',
    askingPrice: 16_500,
    weightOz: 500,
  },
];

export async function fetchDemoAssets(): Promise<DemoAsset[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/assess/demo`);
    const data = await handleResponse<{ success: boolean; assets: DemoAsset[] }>(res);
    const assets = data.assets || [];
    // If backend returned data, use it; otherwise fall back to frontend demos
    return assets.length > 0 ? assets : FALLBACK_DEMOS;
  } catch (err) {
    log.warn('Backend unreachable, using built-in demo assets');
    return FALLBACK_DEMOS;
  }
}

// ─── Receipt Verification ────────────────────────────────────────────────────

export interface ReceiptVerificationResult {
  success: boolean;
  valid: boolean;
  receiptCount: number;
  assessmentId?: string;
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

export async function verifyReceiptChain(assessmentId: string): Promise<ReceiptVerificationResult> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/receipts/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId }),
    });
    return await handleResponse(res);
  } catch (err: any) {
    return { success: false, valid: false, receiptCount: 0, reason: err.message, details: [] };
  }
}

// ─── Contract State ──────────────────────────────────────────────────────────

export interface ContractState {
  assessments: {
    total: number;
    pending: number;
    deliberating: number;
    voting: number;
    resolved: number;
  };
  agents: Array<{
    id: string;
    name: string;
    reputation: number;
    totalAssessments: number;
    accuracy: number;
  }>;
  payments: {
    totalCollected: number;
    totalProcessed: number;
    activeAssessments: number;
  };
  receipts: {
    total: number;
    verified: number;
    pending: number;
  };
  totalTransactions?: number;
  onChainTransactions?: number;
  lastUpdated: number;
}

export async function fetchContractState(): Promise<ContractState | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/contract-state`);
    const data = await handleResponse<{ success: boolean; state: ContractState }>(res);
    return data.state || null;
  } catch (err) {
    log.error('Failed to fetch contract state: ' + err);
    return null;
  }
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export type WSMessageType = 'transaction' | 'assessment_started' | 'valuation_result' | 'juror_vote' | 'final_verdict' | 'agent_thought' | 'receipt_created';

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  payload: any;
}

export function createWebSocket(onMessage: (msg: WSMessage) => void): WebSocket {
  const wsUrl = WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    log.info('WS connected to orchestrator');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      log.warn('WS failed to parse message: ' + err);
    }
  };

  ws.onerror = () => {
    // Silently handle — WS is optional for live updates
  };

  ws.onclose = () => {
    log.info('WS disconnected');
  };

  return ws;
}

// ─── Lending API ─────────────────────────────────────────────────────────────

/**
 * Create a loan against a previously assessed asset.
 * May return 402 if x402 payment is required.
 */
export async function createLoan(
  request: LoanCreateRequest,
  paymentProof?: string,
): Promise<{ status: 'success' | 'payment_required' | 'error'; loan?: LoanCreateResponse; paymentRequirements?: X402PaymentRequirements; error?: string; hint?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (paymentProof) {
    headers['x-payment-proof'] = paymentProof;
  }

  const res = await fetch(`${ORCHESTRATOR_URL}/api/loans/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const data = await res.json();

  if (res.status === 402 && data.paymentRequirements) {
    return { status: 'payment_required', paymentRequirements: data.paymentRequirements };
  }

  if (!res.ok || !data.success) {
    return { status: 'error', error: data.error || `HTTP ${res.status}`, hint: data.hint };
  }

  return { status: 'success', loan: data.loan };
}

/**
 * Fetch all loans, optionally filtered by borrower public key.
 */
export async function fetchLoans(borrowerPublicKey?: string): Promise<Loan[]> {
  try {
    const url = borrowerPublicKey
      ? `${ORCHESTRATOR_URL}/api/loans?borrower=${encodeURIComponent(borrowerPublicKey)}`
      : `${ORCHESTRATOR_URL}/api/loans`;
    const res = await fetch(url);
    const data = await handleResponse<{ success: boolean; loans: Loan[] }>(res);
    return data.loans || [];
  } catch (err) {
    log.error('Failed to fetch loans: ' + err);
    return [];
  }
}

/**
 * Fetch a single loan by ID.
 */
export async function fetchLoan(loanId: string): Promise<Loan | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/loans/${loanId}`);
    const data = await handleResponse<{ success: boolean; loan: Loan }>(res);
    return data.loan || null;
  } catch (err) {
    log.error('Failed to fetch loan: ' + err);
    return null;
  }
}

/**
 * Repay part of a loan. Requires real CSPR transfer txHash.
 */
export async function repayLoan(
  loanId: string,
  amount: number,
  txHash?: string,
): Promise<{ success: boolean; loan?: any; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/loans/${loanId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, txHash }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Trigger revaluation of a loan's collateral.
 */
export async function revalueLoan(
  loanId: string,
): Promise<{ success: boolean; revaluation?: RevaluationResult; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/loans/${loanId}/revalue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Insurance Types ─────────────────────────────────────────────────────────

export interface InsurancePolicy {
  policyId: string;
  assetId: string;
  assetType: AssetType;
  assetName: string;
  assessedValue: number;
  coverageAmount: number;
  premiumCSPR: number;
  deductiblePercent: number;
  status: 'active' | 'expired' | 'claimed' | 'paid';
  riskScore: number;
  riskFactors: string[];
  tier: string;
  expiresAt: number;
  createdAt: number;
  coolingOffEnd: number;
  claimHistory: Array<{
    claimId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'denied' | 'paid';
    filedAt: number;
    resolvedAt?: number;
  }>;
}

export interface InsuranceCreateRequest {
  ownerPublicKey: string;
  assetId: string;
  assetType: AssetType;
  assetName: string;
  assessedValue: number;
  askingPrice: number;
  confidence: number;
  coveragePercent?: number;
  assessmentId?: string;
}

export interface InsuranceCreateResponse {
  policyId: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  assessedValue: number;
  coverageAmount: number;
  premiumCSPR: number;
  deductiblePercent: number;
  riskScore: number;
  riskFactors: string[];
  tier: string;
  platformFeeCSPR: number;
  status: string;
  expiresAt: number;
  createdAt: number;
  coolingOffEnd: number;
}

export interface ClaimResult {
  claimId: string;
  policyId: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'paid';
  reason: string;
  revaluation?: {
    previousValue: number;
    newValue: number;
    lossPercent: number;
  };
  confidence?: {
    agentA: number;
    agentB: number;
  };
}

// ─── Insurance API ───────────────────────────────────────────────────────────

/**
 * Create an insurance policy for a previously assessed asset.
 * May return 402 if x402 payment is required.
 */
export async function createInsurancePolicy(
  request: InsuranceCreateRequest,
  paymentProof?: string,
): Promise<{ status: 'success' | 'payment_required' | 'error'; policy?: InsuranceCreateResponse; paymentRequirements?: X402PaymentRequirements; error?: string; hint?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (paymentProof) {
    headers['x-payment-proof'] = paymentProof;
  }

  const res = await fetch(`${ORCHESTRATOR_URL}/api/insurance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const data = await res.json();

  if (res.status === 402 && data.paymentRequirements) {
    return { status: 'payment_required', paymentRequirements: data.paymentRequirements };
  }

  if (!res.ok || !data.success) {
    return { status: 'error', error: data.error || `HTTP ${res.status}`, hint: data.hint };
  }

  return { status: 'success', policy: data.policy };
}

/**
 * Fetch all insurance policies, optionally filtered by owner public key.
 */
export async function fetchInsurancePolicies(ownerPublicKey?: string): Promise<InsurancePolicy[]> {
  try {
    const url = ownerPublicKey
      ? `${ORCHESTRATOR_URL}/api/insurance?owner=${encodeURIComponent(ownerPublicKey)}`
      : `${ORCHESTRATOR_URL}/api/insurance`;
    const res = await fetch(url);
    const data = await handleResponse<{ success: boolean; policies: InsurancePolicy[] }>(res);
    return data.policies || [];
  } catch (err) {
    log.error('Failed to fetch insurance policies: ' + err);
    return [];
  }
}

/**
 * Fetch a single insurance policy by ID.
 */
export async function fetchInsurancePolicy(policyId: string): Promise<InsurancePolicy | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/insurance/${policyId}`);
    const data = await handleResponse<{ success: boolean; policy: InsurancePolicy }>(res);
    return data.policy || null;
  } catch (err) {
    log.error('Failed to fetch insurance policy: ' + err);
    return null;
  }
}

/**
 * File a claim against an insurance policy.
 */
export async function fileInsuranceClaim(
  policyId: string,
  reason: string,
  ownerPublicKey: string,
  requestedAmount?: number,
): Promise<{ success: boolean; claim?: ClaimResult; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/insurance/${policyId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, ownerPublicKey, requestedAmount }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface InsurancePoolStats {
  capitalCSPR: number;
  totalPremiumsCollected: number;
  activePolicies: number;
  totalCoverageExposure: number;
  solvencyRatio: number;
}

/**
 * Fetch insurance capital pool health stats.
 */
export async function fetchInsurancePoolStats(): Promise<InsurancePoolStats | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/insurance/pool-stats`);
    const data = await handleResponse<{ success: boolean; pool: InsurancePoolStats }>(res);
    return data.pool || null;
  } catch (err) {
    log.error('Failed to fetch insurance pool stats: ' + err);
    return null;
  }
}

// ─── Reputation API ──────────────────────────────────────────────────────────

export interface OnChainReputation {
  agentId: string;
  generalScore: number;
  realEstateScore: number;
  reliabilityScore: number;
  assessmentCount: number;
}

/**
 * Fetch agent reputation data from the backend (reads on-chain ReputationRegistry,
 * falls back to env defaults if on-chain read fails).
 */
export async function fetchReputations(): Promise<OnChainReputation[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/reputation`);
    const data = await handleResponse<{ success: boolean; reputations: OnChainReputation[] }>(res);
    return data.reputations || [];
  } catch (err) {
    log.error('Failed to fetch reputations: ' + err);
    return [];
  }
}

// ─── Prediction API ──────────────────────────────────────────────────────────

export interface PredictionAgent {
  name: string;
  role: string;
  color: string;
  probability: number;
  confidence: number;
  reasoning: string;
  fallbackTriggered?: boolean;
}

export interface PredictionResult {
  predictionId: string;
  question: string;
  timeframe: string;
  assetType: string;
  probability: number;
  confidence: number;
  agents: PredictionAgent[];
  riskFactors: string[];
  timestamp: number;
}

export interface PredictionRequest {
  question: string;
  timeframe: string;
  assetType?: string;
}

export type PredictionResponse =
  | { status: 'success'; prediction: PredictionResult }
  | { status: 'payment_required'; paymentRequirements: X402PaymentRequirements }
  | { status: 'error'; error: string };

/**
 * Submit a prediction request to the orchestrator.
 * x402 flow: first call may return 402, user signs payment, retry with proof.
 */
export async function submitPrediction(
  request: PredictionRequest,
  paymentProof?: string,
): Promise<PredictionResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (paymentProof) {
      headers['x-payment-proof'] = paymentProof;
    }

    const res = await fetch(`${ORCHESTRATOR_URL}/api/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Detect HTML response (Vite catch-all when backend is down)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return {
        status: 'error',
        error: 'Backend service unavailable - please try again shortly.',
      };
    }

    if (res.status === 402) {
      const body = await res.json();
      if (body.paymentRequirements) {
        return {
          status: 'payment_required',
          paymentRequirements: body as X402PaymentRequirements,
        };
      }
      return { status: 'error', error: body.error || 'Payment required' };
    }

    const body = await res.json();
    if (body.success && body.prediction) {
      return { status: 'success', prediction: body.prediction };
    }
    return { status: 'error', error: body.error || 'Prediction failed' };
  } catch (err: any) {
    return { status: 'error', error: err.message || 'Network error' };
  }
}

// ─── Verdict Oracle ──────────────────────────────────────────────────────────

export interface OracleVerdict {
  assetId: string;
  value: number;
  confidence: number;
  jurorCount: number;
  receiptHash: string;
  timestamp: number;
  expiry: number;
  agentWeights: string;
  decision: string;
}

export interface OracleStats {
  totalVerdicts: number;
  freshVerdicts: number;
  avgConfidence: number;
  totalQueries: number;
  activeDisputes: number;
  overturnedVerdicts: number;
}

export interface OracleVerdictsResponse {
  success: boolean;
  verdicts: OracleVerdict[];
  stats: OracleStats;
}

export interface OracleVerdictResponse {
  success: boolean;
  verdict: OracleVerdict;
}

/**
 * Fetch all stored verdicts from the Verdict Oracle.
 */
export async function fetchOracleVerdicts(): Promise<OracleVerdictsResponse> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/verdicts`);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return { success: false, verdicts: [], stats: { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 } };
    }
    return await res.json();
  } catch {
    return { success: false, verdicts: [], stats: { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 } };
  }
}

/**
 * Fetch a specific verdict by asset ID.
 */
export async function fetchOracleVerdict(assetId: string): Promise<OracleVerdictResponse | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/verdict/${encodeURIComponent(assetId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch oracle statistics.
 */
export async function fetchOracleStats(): Promise<OracleStats> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/stats`);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 };
    }
    const body = await res.json();
    return body.stats || { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 };
  } catch {
    return { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 };
  }
}

// ─── Dispute & Re-trial ──────────────────────────────────────────────────

export interface RetrialJuror {
  agentId: string;
  name: string;
  methodology: string;
  reputation: number;
  vote: 'A' | 'B' | 'Split';
  confidence: number;
  reasoning: string;
}

export interface RetrialResult {
  retrialId: string;
  startedAt: number;
  completedAt: number;
  panel: RetrialJuror[];
  originalVerdict: { value: number; confidence: number; decision: string };
  newVerdict: { value: number; confidence: number; decision: string };
  valueDelta: number;
  confidenceDelta: number;
  receiptHash: string;
  reasoning: string;
}

export interface Dispute {
  id: string;
  assetId: string;
  originalVerdict: OracleVerdict;
  challengerKey: string;
  stakeCSPR: number;
  reason: string;
  createdAt: number;
  status: 'pending' | 'under_retrial' | 'resolved';
  retrial?: RetrialResult;
  outcome?: 'upheld' | 'overturned';
  resolvedAt?: number;
  stakeDistribution?: { recipient: string; amountCSPR: number }[];
  paymentTxHash?: string;   // on-chain deploy hash of the 5 CSPR stake payment
  paymentPayer?: string;    // public key that paid the stake
}

export async function fetchDisputes(): Promise<Dispute[]> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/disputes`);
    const body = await res.json();
    return body.disputes || [];
  } catch {
    return [];
  }
}

export async function fetchDispute(disputeId: string): Promise<Dispute | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/disputes/${encodeURIComponent(disputeId)}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body.dispute || null;
  } catch {
    return null;
  }
}

export type FileDisputeResponse =
  | { status: 'success'; dispute: Dispute }
  | { status: 'payment_required'; paymentRequirements: any }
  | { status: 'error'; error: string; hint?: string };

export async function fileDispute(
  assetId: string,
  challengerKey: string,
  reason: string,
  paymentProof?: string,
): Promise<FileDisputeResponse> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (paymentProof) {
      headers['x-payment-proof'] = paymentProof;
    }

    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/dispute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ assetId, challengerKey, reason }),
    });

    if (res.status === 402) {
      const body = await res.json();
      return { status: 'payment_required', paymentRequirements: body.paymentRequirements };
    }

    const data = await res.json();
    if (data.success && data.dispute) {
      return { status: 'success', dispute: data.dispute };
    }
    return { status: 'error', error: data.error || 'Unknown error', hint: data.hint };
  } catch (err: any) {
    return { status: 'error', error: err.message };
  }
}

export async function triggerRetrial(disputeId: string): Promise<{ success: boolean; dispute?: Dispute; error?: string }> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/oracle/disputes/${encodeURIComponent(disputeId)}/retrial`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
