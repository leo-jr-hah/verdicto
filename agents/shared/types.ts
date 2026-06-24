// Shared TypeScript types for all Verdict agents
// DO NOT change after Day 3 - all agents depend on these

// ─── Asset Types ─────────────────────────────────────────────────────────────

export type AssetType = 'real-estate' | 'art' | 'commodity';

export interface AssetListing {
  id: string;
  type: AssetType;
  name: string;
  description: string;
  askingPrice: number;
  location?: string;
  artist?: string;
  weight?: number;
  documents?: string[];
}

// ─── Valuation ───────────────────────────────────────────────────────────────

export interface ValuationResult {
  agent: string;
  method: 'comparable_sales' | 'dcf' | 'appraisal' | 'market_price';
  asset_id: string;
  estimated_value: number;
  confidence: number;
  per_spot_value: number;
  reasoning: string;
  timestamp: number;
  dataSource?: string;
  /** True if the LLM (MiMo + Groq) was unavailable and a deterministic fallback was used. */
  fallbackTriggered?: boolean;
  /** Which fallback level fired: 'groq' (MiMo failed, Groq succeeded), 'heuristic' (both failed), or undefined if primary LLM worked. */
  fallbackProvider?: 'groq' | 'heuristic';
}

export interface AssessmentCase {
  assessment_id: number;
  asset_id: string;
  asset_name: string;
  asset_type: AssetType;
  location: string;
  spot_count: number;
  asking_price: number;
  valuation_a: ValuationResult;
  valuation_b: ValuationResult;
  divergence_percent: number;
  status: 'pending' | 'deliberating' | 'voting' | 'resolved';
  assessment_fee_motes: string;
  created_at: number;
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

export type VerdictChoice = 'agent_a_preferred' | 'split_fifty' | 'agent_b_preferred';

export interface VerdictResult {
  assessment_id: number;
  verdict: VerdictChoice;
  votes: JurorVote[];
  final_value: number;
  executed_at: number;
  tx_hash?: string;
}

export interface DeliberationEvent {
  type: 'assessment' | 'vote' | 'verdict' | 'payment';
  assessment_id: number;
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

// Demo seed data - 3 pre-seeded assessments for the dashboard
export const DEMO_ASSESSMENTS: Partial<AssessmentCase>[] = [
  {
    assessment_id: 1,
    asset_id: 'RE-MIAMI-001',
    asset_name: 'Miami Beachfront Condo',
    asset_type: 'real-estate',
    location: 'Miami, FL',
    spot_count: 1,
    asking_price: 1_250_000,
    divergence_percent: 25,
    status: 'pending',
    assessment_fee_motes: '100000000',
  },
  {
    assessment_id: 2,
    asset_id: 'ART-NYC-007',
    asset_name: 'Contemporary Oil Painting',
    asset_type: 'art',
    location: 'New York, NY',
    spot_count: 1,
    asking_price: 85_000,
    divergence_percent: 31,
    status: 'resolved',
    assessment_fee_motes: '100000000',
  },
  {
    assessment_id: 3,
    asset_id: 'GOLD-003',
    asset_name: '10oz Gold Bar (999.9)',
    asset_type: 'commodity',
    location: 'Global',
    spot_count: 10,
    asking_price: 23_500,
    divergence_percent: 12,
    status: 'deliberating',
    assessment_fee_motes: '100000000',
  },
];

// Agent reputation seed data
export const AGENT_SEED_SCORES: Record<string, Record<string, number>> = {
  'valuation-agent-a': { 'real-estate': 750, art: 680, commodity: 720 },
  'valuation-agent-b': { 'real-estate': 780, art: 710, commodity: 690 },
  'evidence-analyst': { 'real-estate': 820, art: 790, commodity: 810 },
  'market-data-interpreter': { 'real-estate': 770, art: 730, commodity: 800 },
  'precedent-researcher': { 'real-estate': 740, art: 850, commodity: 700 },
};
