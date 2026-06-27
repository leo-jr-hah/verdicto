/**
 * Supabase Database Layer
 *
 * Provides read/write helpers for all persistent data.
 * Falls back gracefully when SUPABASE_URL is not configured (local dev).
 *
 * Tables:
 *   - assessments     (receipt chains)
 *   - loans           (lending records)
 *   - insurance       (policy records)
 *   - oracle_verdicts (verdict oracle)
 *   - disputes        (dispute & re-trial records)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Client Initialization ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _client: SupabaseClient | null = null;

async function getClient(): Promise<SupabaseClient | null> {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  [DB] ⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB writes disabled');
    return null;
  }

  // Node < 22 lacks native WebSocket — inject `ws` package for Supabase realtime
  let realtimeOptions: Record<string, any> = { params: { eventsPerSecond: 0 } };
  try {
    const ws = (await import('ws')).default;
    realtimeOptions.transport = ws;
  } catch { /* ws not installed — fine on Node 22+ which has native WS */ }

  _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: realtimeOptions,
  });
  console.log(`  [DB] ✅ Supabase client initialized (${SUPABASE_URL})`);
  return _client;
}

// ─── Generic Upsert Helper ──────────────────────────────────────────────────

async function upsert(table: string, row: Record<string, any>, onConflict?: string) {
  const client = await getClient();
  if (!client) return; // graceful no-op

  try {
    const { error } = await client
      .from(table)
      .upsert(row, { onConflict: onConflict || undefined });
    if (error) {
      console.error(`  [DB] ❌ Upsert into ${table} failed:`, error.message);
    }
  } catch (err: any) {
    console.error(`  [DB] ❌ Upsert into ${table} exception:`, err.message);
  }
}

async function insert(table: string, row: Record<string, any>) {
  const client = await getClient();
  if (!client) return;

  try {
    const { error } = await client.from(table).insert(row);
    if (error) {
      console.error(`  [DB] ❌ Insert into ${table} failed:`, error.message);
    }
  } catch (err: any) {
    console.error(`  [DB] ❌ Insert into ${table} exception:`, err.message);
  }
}

async function select(table: string, filters: Record<string, any>, order?: { column: string; ascending?: boolean }) {
  const client = await getClient();
  if (!client) return null;

  try {
    let query = client.from(table).select('*');
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }
    const { data, error } = await query;
    if (error) {
      console.error(`  [DB] ❌ Select from ${table} failed:`, error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.error(`  [DB] ❌ Select from ${table} exception:`, err.message);
    return null;
  }
}

async function selectOne(table: string, filters: Record<string, any>) {
  const rows = await select(table, filters);
  return rows && rows.length > 0 ? rows[0] : null;
}

// ─── Assessment (Receipt Chain) ─────────────────────────────────────────────

export interface DbAssessment {
  assessment_id: string;
  asset_id: string;
  receipt_chain: any[];       // JSON-serialized DeliberationReceipt[]
  final_verdict?: string;
  final_value?: number;
  created_at: number;
}

export async function saveAssessment(assessment: DbAssessment) {
  await upsert('assessments', {
    assessment_id: assessment.assessment_id,
    asset_id: assessment.asset_id,
    receipt_chain: JSON.stringify(assessment.receipt_chain),
    final_verdict: assessment.final_verdict,
    final_value: assessment.final_value,
    created_at: assessment.created_at,
  }, 'assessment_id');
}

export async function getAssessment(assessmentId: string): Promise<DbAssessment | null> {
  const row = await selectOne('assessments', { assessment_id: assessmentId });
  if (!row) return null;
  return {
    ...row,
    receipt_chain: typeof row.receipt_chain === 'string' ? JSON.parse(row.receipt_chain) : row.receipt_chain,
  };
}

export async function getAssessmentsFromDb(limit = 100): Promise<DbAssessment[]> {
  const rows = await select('assessments', {}, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.slice(0, limit).map(row => ({
    ...row,
    receipt_chain: typeof row.receipt_chain === 'string' ? JSON.parse(row.receipt_chain) : row.receipt_chain,
  }));
}

// ─── Loans ──────────────────────────────────────────────────────────────────

export interface DbLoan {
  loan_id: string;
  borrower_public_key: string;
  asset_id: string;
  asset_type: string;
  asset_name: string;
  assessed_value: number;
  ltv_ratio: number;
  loan_amount_cspr: number;
  collateral_assessment_id: string;
  status: string;
  health_ratio: number;
  created_at: number;
  last_revalued_at: number;
  repaid_amount_cspr: number;
  repayment_history: any[];
  disbursement_tx_hash: string;
  platform_fee_cspr: number;
  trust_breakdown: any;
  escrow_lock_tx_hash?: string;
  escrow_release_tx_hash?: string;
  revaluation_history: any[];
}

export async function saveLoan(loan: DbLoan) {
  await upsert('loans', {
    loan_id: loan.loan_id,
    borrower_public_key: loan.borrower_public_key,
    asset_id: loan.asset_id,
    asset_type: loan.asset_type,
    asset_name: loan.asset_name,
    assessed_value: loan.assessed_value,
    ltv_ratio: loan.ltv_ratio,
    loan_amount_cspr: loan.loan_amount_cspr,
    collateral_assessment_id: loan.collateral_assessment_id,
    status: loan.status,
    health_ratio: loan.health_ratio,
    created_at: loan.created_at,
    last_revalued_at: loan.last_revalued_at,
    repaid_amount_cspr: loan.repaid_amount_cspr,
    repayment_history: JSON.stringify(loan.repayment_history),
    disbursement_tx_hash: loan.disbursement_tx_hash,
    platform_fee_cspr: loan.platform_fee_cspr,
    trust_breakdown: JSON.stringify(loan.trust_breakdown),
    escrow_lock_tx_hash: loan.escrow_lock_tx_hash,
    escrow_release_tx_hash: loan.escrow_release_tx_hash,
    revaluation_history: JSON.stringify(loan.revaluation_history),
  }, 'loan_id');
}

export async function getLoan(loanId: string): Promise<DbLoan | null> {
  const row = await selectOne('loans', { loan_id: loanId });
  if (!row) return null;
  return {
    ...row,
    repayment_history: typeof row.repayment_history === 'string' ? JSON.parse(row.repayment_history) : row.repayment_history,
    trust_breakdown: typeof row.trust_breakdown === 'string' ? JSON.parse(row.trust_breakdown) : row.trust_breakdown,
    revaluation_history: typeof row.revaluation_history === 'string' ? JSON.parse(row.revaluation_history) : row.revaluation_history,
  };
}

export async function getLoansByBorrower(borrowerPublicKey: string): Promise<DbLoan[]> {
  const rows = await select('loans', { borrower_public_key: borrowerPublicKey }, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.map(row => ({
    ...row,
    repayment_history: typeof row.repayment_history === 'string' ? JSON.parse(row.repayment_history) : row.repayment_history,
    trust_breakdown: typeof row.trust_breakdown === 'string' ? JSON.parse(row.trust_breakdown) : row.trust_breakdown,
    revaluation_history: typeof row.revaluation_history === 'string' ? JSON.parse(row.revaluation_history) : row.revaluation_history,
  }));
}

export async function getAllLoans(): Promise<DbLoan[]> {
  const rows = await select('loans', {}, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.map(row => ({
    ...row,
    repayment_history: typeof row.repayment_history === 'string' ? JSON.parse(row.repayment_history) : row.repayment_history,
    trust_breakdown: typeof row.trust_breakdown === 'string' ? JSON.parse(row.trust_breakdown) : row.trust_breakdown,
    revaluation_history: typeof row.revaluation_history === 'string' ? JSON.parse(row.revaluation_history) : row.revaluation_history,
  }));
}

// ─── Insurance ──────────────────────────────────────────────────────────────

export interface DbInsurance {
  policy_id: string;
  owner_public_key: string;
  asset_id: string;
  asset_type: string;
  asset_name: string;
  assessed_value: number;
  coverage_amount: number;
  premium_cspr: number;
  deductible_percent: number;
  status: string;
  risk_score: number;
  risk_factors: string[];
  tier: string;
  platform_fee_cspr: number;
  expires_at: number;
  created_at: number;
  claim_history: any[];
}

export async function saveInsurance(policy: DbInsurance) {
  await upsert('insurance', {
    policy_id: policy.policy_id,
    owner_public_key: policy.owner_public_key,
    asset_id: policy.asset_id,
    asset_type: policy.asset_type,
    asset_name: policy.asset_name,
    assessed_value: policy.assessed_value,
    coverage_amount: policy.coverage_amount,
    premium_cspr: policy.premium_cspr,
    deductible_percent: policy.deductible_percent,
    status: policy.status,
    risk_score: policy.risk_score,
    risk_factors: JSON.stringify(policy.risk_factors),
    tier: policy.tier,
    platform_fee_cspr: policy.platform_fee_cspr,
    expires_at: policy.expires_at,
    created_at: policy.created_at,
    claim_history: JSON.stringify(policy.claim_history),
  }, 'policy_id');
}

export async function getInsurance(policyId: string): Promise<DbInsurance | null> {
  const row = await selectOne('insurance', { policy_id: policyId });
  if (!row) return null;
  return {
    ...row,
    risk_factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors,
    claim_history: typeof row.claim_history === 'string' ? JSON.parse(row.claim_history) : row.claim_history,
  };
}

export async function getInsuranceByOwner(ownerPublicKey: string): Promise<DbInsurance[]> {
  const rows = await select('insurance', { owner_public_key: ownerPublicKey }, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.map(row => ({
    ...row,
    risk_factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors,
    claim_history: typeof row.claim_history === 'string' ? JSON.parse(row.claim_history) : row.claim_history,
  }));
}

export async function getAllInsurance(): Promise<DbInsurance[]> {
  const rows = await select('insurance', {}, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.map(row => ({
    ...row,
    risk_factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors,
    claim_history: typeof row.claim_history === 'string' ? JSON.parse(row.claim_history) : row.claim_history,
  }));
}

// ─── Oracle Verdicts ────────────────────────────────────────────────────────

export interface DbVerdict {
  asset_id: string;
  value: number;
  confidence: number;
  juror_count: number;
  receipt_hash: string;
  timestamp: number;
  expiry: number;
  agent_weights: string;
  decision: string;
}

export async function saveVerdict(verdict: DbVerdict) {
  await upsert('oracle_verdicts', {
    asset_id: verdict.asset_id,
    value: verdict.value,
    confidence: verdict.confidence,
    juror_count: verdict.juror_count,
    receipt_hash: verdict.receipt_hash,
    timestamp: verdict.timestamp,
    expiry: verdict.expiry,
    agent_weights: verdict.agent_weights,
    decision: verdict.decision,
  }, 'asset_id');
}

export async function getVerdict(assetId: string): Promise<DbVerdict | null> {
  return selectOne('oracle_verdicts', { asset_id: assetId });
}

export async function getAllVerdicts(): Promise<DbVerdict[]> {
  const rows = await select('oracle_verdicts', {}, { column: 'timestamp', ascending: false });
  return rows || [];
}

// ─── Disputes ───────────────────────────────────────────────────────────────

export interface DbDispute {
  id: string;
  asset_id: string;
  original_verdict: any;
  challenger_key: string;
  stake_cspr: number;
  reason: string;
  created_at: number;
  status: string;
  retrial?: any;
  outcome?: string;
  resolved_at?: number;
  stake_distribution?: any;
  payment_tx_hash?: string;
  payment_payer?: string;
}

export async function saveDispute(dispute: DbDispute) {
  await upsert('disputes', {
    id: dispute.id,
    asset_id: dispute.asset_id,
    original_verdict: JSON.stringify(dispute.original_verdict),
    challenger_key: dispute.challenger_key,
    stake_cspr: dispute.stake_cspr,
    reason: dispute.reason,
    created_at: dispute.created_at,
    status: dispute.status,
    retrial: dispute.retrial ? JSON.stringify(dispute.retrial) : null,
    outcome: dispute.outcome,
    resolved_at: dispute.resolved_at,
    stake_distribution: dispute.stake_distribution ? JSON.stringify(dispute.stake_distribution) : null,
    payment_tx_hash: dispute.payment_tx_hash,
    payment_payer: dispute.payment_payer,
  }, 'id');
}

export async function getDispute(disputeId: string): Promise<DbDispute | null> {
  const row = await selectOne('disputes', { id: disputeId });
  if (!row) return null;
  return {
    ...row,
    original_verdict: typeof row.original_verdict === 'string' ? JSON.parse(row.original_verdict) : row.original_verdict,
    retrial: row.retrial ? (typeof row.retrial === 'string' ? JSON.parse(row.retrial) : row.retrial) : undefined,
    stake_distribution: row.stake_distribution ? (typeof row.stake_distribution === 'string' ? JSON.parse(row.stake_distribution) : row.stake_distribution) : undefined,
  };
}

export async function getAllDisputes(): Promise<DbDispute[]> {
  const rows = await select('disputes', {}, { column: 'created_at', ascending: false });
  if (!rows) return [];
  return rows.map(row => ({
    ...row,
    original_verdict: typeof row.original_verdict === 'string' ? JSON.parse(row.original_verdict) : row.original_verdict,
    retrial: row.retrial ? (typeof row.retrial === 'string' ? JSON.parse(row.retrial) : row.retrial) : undefined,
    stake_distribution: row.stake_distribution ? (typeof row.stake_distribution === 'string' ? JSON.parse(row.stake_distribution) : row.stake_distribution) : undefined,
  }));
}

// ─── Transactions ───────────────────────────────────────────────────────────

export interface DbTransaction {
  id: string;
  type: string;
  action: string;
  hash: string;
  contract: string;
  block_height: string;
  timestamp: number;
  explorer_url: string;
  on_chain: boolean;
  metadata?: Record<string, unknown>;
}

export async function saveTransactionToDb(tx: DbTransaction) {
  await upsert('transactions', {
    id: tx.id,
    type: tx.type,
    action: tx.action,
    hash: tx.hash,
    contract: tx.contract,
    block_height: tx.block_height,
    timestamp: tx.timestamp,
    explorer_url: tx.explorer_url,
    on_chain: tx.on_chain,
    metadata: tx.metadata ? JSON.stringify(tx.metadata) : '{}',
  }, 'id');
}

export async function getTransactionsFromDb(limit = 200): Promise<DbTransaction[]> {
  const client = await getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('  [DB] ❌ Select transactions failed:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    }));
  } catch (err: any) {
    console.error('  [DB] ❌ Select transactions exception:', err.message);
    return [];
  }
}

// ─── Predictions ───────────────────────────────────────────────────────────

export interface DbPrediction {
  prediction_id: string;
  question: string;
  timeframe: string;
  asset_type: string;
  probability: number;
  confidence: number;
  agents: any[];
  risk_factors: string[];
  created_at: number;
}

export async function savePrediction(pred: DbPrediction) {
  await upsert('predictions', {
    prediction_id: pred.prediction_id,
    question: pred.question,
    timeframe: pred.timeframe,
    asset_type: pred.asset_type,
    probability: pred.probability,
    confidence: pred.confidence,
    agents: JSON.stringify(pred.agents),
    risk_factors: JSON.stringify(pred.risk_factors),
    created_at: pred.created_at,
  }, 'prediction_id');
}

export async function getPredictionsFromDb(limit = 100): Promise<DbPrediction[]> {
  const client = await getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('  [DB] ❌ Select predictions failed:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      ...row,
      agents: typeof row.agents === 'string' ? JSON.parse(row.agents) : row.agents,
      risk_factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors,
    }));
  } catch (err: any) {
    console.error('  [DB] ❌ Select predictions exception:', err.message);
    return [];
  }
}

// ─── Health Check ───────────────────────────────────────────────────────────

export async function checkDbHealth(): Promise<boolean> {
  const client = await getClient();
  if (!client) return false;
  try {
    const { error } = await client.from('assessments').select('assessment_id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
