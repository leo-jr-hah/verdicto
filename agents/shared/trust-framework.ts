import { createHash, randomBytes } from 'crypto';

export interface AgentTrustScore {
  agentId: string; // ECDSA public key derived
  identityVerified: boolean; // On-chain identity registration
  executionScore: number; // 0-100 based on challenge-response
  outputConsistency: number; // 0-100 based on variance across runs
  economicStake: number; // CSPR staked as collateral
  aggregateScore: number; // Weighted combination (0-1000)
  tier: 'unverified' | 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function generateChallenge(): string {
  return randomBytes(32).toString('hex');
}

export function calculateSimilarity(response1: string, response2: string): number {
  // Simple Jaccard similarity approximation for demo purposes
  if (response1 === response2) return 100;
  if (!response1 || !response2) return 0;
  
  const words1 = new Set(response1.toLowerCase().split(/\W+/));
  const words2 = new Set(response2.toLowerCase().split(/\W+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return Math.round((intersection.size / union.size) * 100);
}

export function scoreAgainstExpected(response: string, expected: string): number {
  return calculateSimilarity(response, expected);
}

/**
 * Executes a mock challenge-response verification for juror agents
 * based on the March 2026 IETF Trust Scoring Draft.
 */
export async function verifyJurorExecution(
  agentId: string,
  task: string,
  expectedOutput: string,
  runJurorWithChallenge: (agentId: string, task: string, challenge: string) => Promise<string>
): Promise<number> {
  // 1. Generate random challenge nonce
  const challenge = generateChallenge();
  
  // 2. Agent executes with challenge nonce
  const response = await runJurorWithChallenge(agentId, task, challenge);
  
  // 3. Verify determinism — same challenge -> similar output
  const response2 = await runJurorWithChallenge(agentId, task, challenge);
  const consistency = calculateSimilarity(response, response2);
  
  // 4. Verify against expected baseline
  const accuracy = scoreAgainstExpected(response, expectedOutput);
  
  return Math.round((consistency * 0.4) + (accuracy * 0.6));
}

/**
 * Computes the 5-dimension aggregate trust score.
 */
export function computeAggregateTrust(score: Omit<AgentTrustScore, 'aggregateScore' | 'tier'>): AgentTrustScore {
  const executionWeight = 0.4;
  const consistencyWeight = 0.3;
  const stakeWeight = 0.3;
  
  // Cap stake score at 100 (assuming 1000 CSPR is max useful stake for this tier)
  const stakeScore = Math.min((score.economicStake / 1000) * 100, 100);
  
  const aggregate = Math.round(
    (score.executionScore * executionWeight + 
     score.outputConsistency * consistencyWeight + 
     stakeScore * stakeWeight) * 10 // Scale to 1000
  );
  
  let tier: AgentTrustScore['tier'] = 'unverified';
  if (!score.identityVerified) tier = 'unverified';
  else if (aggregate >= 900) tier = 'platinum';
  else if (aggregate >= 750) tier = 'gold';
  else if (aggregate >= 500) tier = 'silver';
  else tier = 'bronze';
  
  return {
    ...score,
    aggregateScore: aggregate,
    tier
  };
}
