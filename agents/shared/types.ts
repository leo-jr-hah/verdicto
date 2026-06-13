// Shared TypeScript types for all Casper RWA Court agents
// DO NOT change after Day 3 — all agents depend on these

export interface ValuationResult {
  agent: string;
  method: 'comparable_sales' | 'dcf';
  asset_id: string;
  estimated_value: number;
  confidence: number;
  per_spot_value: number;
  reasoning: string;
  timestamp: number;
}

export interface DisputeCase {
  dispute_id: number;
  asset_id: string;
  asset_name: string;
  location: string;
  spot_count: number;
  valuation_a: ValuationResult;
  valuation_b: ValuationResult;
  divergence_percent: number;
  status: 'pending' | 'deliberating' | 'voting' | 'resolved';
  filing_fee_motes: string;
  filed_at: number;
}

export interface JurorAssessment {
  juror_id: string;
  specialization: 'evidence' | 'market_data' | 'precedent';
  initial_verdict: VerdictChoice;
  reasoning: string;
  confidence: number;
  round: 1 | 2;
}

export interface JurorVote {
  juror: string;
  verdict: VerdictChoice;
  reasoning: string;
  weight: number; // reputation score 0-1000
  tx_hash?: string; // Casper testnet transaction hash
}

export type VerdictChoice = 'full_refund' | 'split_fifty' | 'full_release';

export interface VerdictResult {
  dispute_id: number;
  verdict: VerdictChoice;
  votes: JurorVote[];
  final_value: number;
  executed_at: number;
  tx_hash?: string;
}

export interface DeliberationEvent {
  type: 'assessment' | 'vote' | 'verdict' | 'payment';
  dispute_id: number;
  data: JurorAssessment | JurorVote | VerdictResult | PaymentEvent;
  timestamp: number;
}

export interface PaymentEvent {
  from: string;
  to: string;
  amount_cspr: number;
  tool: string;
  tx_hash: string; // simulated for hackathon
}

// Demo seed data — 3 pre-seeded disputes for the dashboard
export const DEMO_DISPUTES: Partial<DisputeCase>[] = [
  {
    dispute_id: 1,
    asset_id: 'PARKING-MIAMI-001',
    asset_name: 'Miami Downtown Parking',
    location: 'Miami, FL',
    spot_count: 100,
    divergence_percent: 25,
    status: 'pending',
    filing_fee_motes: '100000000',
  },
  {
    dispute_id: 2,
    asset_id: 'PARKING-NYC-007',
    asset_name: 'Manhattan Midtown Garage',
    location: 'New York, NY',
    spot_count: 250,
    divergence_percent: 31,
    status: 'resolved',
    filing_fee_motes: '100000000',
  },
  {
    dispute_id: 3,
    asset_id: 'PARKING-LA-003',
    asset_name: 'Beverly Hills Surface Lot',
    location: 'Beverly Hills, CA',
    spot_count: 75,
    divergence_percent: 28,
    status: 'deliberating',
    filing_fee_motes: '100000000',
  },
];

// Agent reputation seed data
export const AGENT_SEED_SCORES = {
  'valuation-agent-a': { parking: 750, real_estate: 700 },
  'valuation-agent-b': { parking: 720, real_estate: 780 },
  'evidence-analyst':  { parking: 810, real_estate: 650 },
};

// Precedent cases for Vectra vector store
export const PRECEDENT_CASES = [
  {
    case_id: 'DIS-001',
    asset_type: 'parking',
    location: 'Miami',
    val_a: 2400000,
    val_b: 1800000,
    divergence: 25,
    verdict: 'split_fifty',
    final_value: 2100000,
    reasoning: 'Weighted average of both methods. Comparable sales showed recent market premium, DCF captured income fundamentals. Court split the difference.',
  },
  {
    case_id: 'DIS-002',
    asset_type: 'parking',
    location: 'New York',
    val_a: 8500000,
    val_b: 5200000,
    divergence: 38,
    verdict: 'full_refund',
    final_value: 5200000,
    reasoning: 'Comparable sales method used inflated 2021 comps. DCF method with 6.5% cap rate more accurately reflected post-correction market.',
  },
  {
    case_id: 'DIS-003',
    asset_type: 'parking',
    location: 'Chicago',
    val_a: 3100000,
    val_b: 3400000,
    divergence: 9,
    verdict: 'split_fifty',
    final_value: 3250000,
    reasoning: 'Both valuations within acceptable range. Minor divergence due to cap rate assumptions. Split deemed fair.',
  },
  {
    case_id: 'DIS-004',
    asset_type: 'parking',
    location: 'Los Angeles',
    val_a: 4200000,
    val_b: 6800000,
    divergence: 38,
    verdict: 'full_release',
    final_value: 6800000,
    reasoning: 'Comparable sales missed recent LA premium. DCF correctly captured EV charging revenue potential adding 40% income uplift.',
  },
  {
    case_id: 'DIS-005',
    asset_type: 'parking',
    location: 'Miami',
    val_a: 1900000,
    val_b: 1600000,
    divergence: 17,
    verdict: 'split_fifty',
    final_value: 1750000,
    reasoning: 'Standard split for Miami waterfront parking. Both methods sound but differing occupancy assumptions led to divergence.',
  },
];
