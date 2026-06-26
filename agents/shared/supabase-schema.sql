-- Verdicto Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Paste → Run)

-- ─── 1. Assessments (receipt chains) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessments (
  assessment_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  receipt_chain JSONB DEFAULT '[]',
  final_verdict TEXT,
  final_value NUMERIC,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

CREATE INDEX IF NOT EXISTS idx_assessments_asset_id ON assessments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- ─── 2. Loans ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loans (
  loan_id TEXT PRIMARY KEY,
  borrower_public_key TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  assessed_value NUMERIC NOT NULL,
  ltv_ratio NUMERIC NOT NULL,
  loan_amount_cspr NUMERIC NOT NULL,
  collateral_assessment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  health_ratio NUMERIC NOT NULL DEFAULT 100,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  last_revalued_at BIGINT,
  repaid_amount_cspr NUMERIC NOT NULL DEFAULT 0,
  repayment_history JSONB DEFAULT '[]',
  disbursement_tx_hash TEXT,
  platform_fee_cspr NUMERIC DEFAULT 0,
  trust_breakdown JSONB DEFAULT '{}',
  escrow_lock_tx_hash TEXT,
  escrow_release_tx_hash TEXT,
  revaluation_history JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_public_key);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at DESC);

-- ─── 3. Insurance ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance (
  policy_id TEXT PRIMARY KEY,
  owner_public_key TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  assessed_value NUMERIC NOT NULL,
  coverage_amount NUMERIC NOT NULL,
  premium_cspr NUMERIC NOT NULL,
  deductible_percent NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  risk_score NUMERIC NOT NULL,
  risk_factors JSONB DEFAULT '[]',
  tier TEXT NOT NULL,
  platform_fee_cspr NUMERIC DEFAULT 0,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  claim_history JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_insurance_owner ON insurance(owner_public_key);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON insurance(status);
CREATE INDEX IF NOT EXISTS idx_insurance_created_at ON insurance(created_at DESC);

-- ─── 4. Oracle Verdicts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS oracle_verdicts (
  asset_id TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  juror_count INTEGER NOT NULL DEFAULT 0,
  receipt_hash TEXT,
  timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  expiry BIGINT NOT NULL,
  agent_weights TEXT,
  decision TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verdicts_timestamp ON oracle_verdicts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_expiry ON oracle_verdicts(expiry);

-- ─── 5. Disputes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  original_verdict JSONB NOT NULL,
  challenger_key TEXT NOT NULL,
  stake_cspr NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  status TEXT NOT NULL DEFAULT 'pending',
  retrial JSONB,
  outcome TEXT,
  resolved_at BIGINT,
  stake_distribution JSONB,
  payment_tx_hash TEXT,
  payment_payer TEXT
);

CREATE INDEX IF NOT EXISTS idx_disputes_asset_id ON disputes(asset_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- ─── Done! ───────────────────────────────────────────────────────────────────
-- All 5 tables created. The backend will start writing data once deployed.
