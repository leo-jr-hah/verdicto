import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  generateChallenge,
  scoreAgainstExpected,
  computeAggregateTrust,
  type AgentTrustScore,
} from '../shared/trust-framework.js';

describe('generateChallenge', () => {
  it('returns a 64-char hex string (32 bytes)', () => {
    const challenge = generateChallenge();
    expect(challenge).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns unique values on each call', () => {
    const a = generateChallenge();
    const b = generateChallenge();
    expect(a).not.toBe(b);
  });
});

describe('calculateSimilarity', () => {
  it('returns 100 for identical strings', () => {
    expect(calculateSimilarity('hello world', 'hello world')).toBe(100);
  });

  it('returns 0 for completely different strings', () => {
    const score = calculateSimilarity('apple banana cherry', 'x y z');
    expect(score).toBe(0);
  });

  it('returns partial score for overlapping strings', () => {
    const score = calculateSimilarity('the quick brown fox', 'the slow brown dog');
    // Words: {the, quick, brown, fox} vs {the, slow, brown, dog}
    // Intersection: {the, brown} = 2, Union: {the, quick, brown, fox, slow, dog} = 6
    // 2/6 * 100 = 33
    expect(score).toBeGreaterThanOrEqual(30);
    expect(score).toBeLessThanOrEqual(40);
  });

  it('returns 100 for two empty strings (they are equal)', () => {
    // Edge case: '' === '' is true, so similarity is 100
    expect(calculateSimilarity('', '')).toBe(100);
  });

  it('returns 0 when one string is empty', () => {
    expect(calculateSimilarity('hello', '')).toBe(0);
    expect(calculateSimilarity('', 'hello')).toBe(0);
  });

  it('is case-insensitive', () => {
    const score = calculateSimilarity('Hello World', 'hello world');
    expect(score).toBe(100);
  });
});

describe('scoreAgainstExpected', () => {
  it('delegates to calculateSimilarity', () => {
    expect(scoreAgainstExpected('same', 'same')).toBe(100);
    expect(scoreAgainstExpected('a', 'b')).toBe(0);
  });
});

describe('computeAggregateTrust', () => {
  const baseScore = {
    agentId: 'test-agent-1',
    identityVerified: true,
    executionScore: 80,
    outputConsistency: 70,
    economicStake: 500,
  };

  it('computes aggregate score within expected range', () => {
    const result = computeAggregateTrust(baseScore);
    expect(result.aggregateScore).toBeGreaterThan(0);
    expect(result.aggregateScore).toBeLessThanOrEqual(1000);
  });

  it('assigns platinum tier for high scores', () => {
    const result = computeAggregateTrust({
      ...baseScore,
      executionScore: 100,
      outputConsistency: 100,
      economicStake: 1000,
    });
    expect(result.tier).toBe('platinum');
    expect(result.aggregateScore).toBeGreaterThanOrEqual(900);
  });

  it('assigns gold tier for good scores', () => {
    const result = computeAggregateTrust({
      ...baseScore,
      executionScore: 85,
      outputConsistency: 80,
      economicStake: 800,
    });
    expect(result.tier).toBe('gold');
  });

  it('assigns silver tier for medium scores', () => {
    const result = computeAggregateTrust({
      ...baseScore,
      executionScore: 60,
      outputConsistency: 50,
      economicStake: 400,
    });
    expect(result.tier).toBe('silver');
  });

  it('assigns bronze tier for low scores', () => {
    const result = computeAggregateTrust({
      ...baseScore,
      executionScore: 30,
      outputConsistency: 20,
      economicStake: 50,
    });
    expect(result.tier).toBe('bronze');
  });

  it('assigns unverified tier when identity is not verified', () => {
    const result = computeAggregateTrust({
      ...baseScore,
      identityVerified: false,
      executionScore: 100,
      outputConsistency: 100,
      economicStake: 1000,
    });
    expect(result.tier).toBe('unverified');
  });

  it('caps stake score at 100 (1000 CSPR max)', () => {
    const lowStake = computeAggregateTrust({ ...baseScore, economicStake: 500 });
    const highStake = computeAggregateTrust({ ...baseScore, economicStake: 5000 });
    // Stake is capped at 1000 CSPR - 100 score, so 5000 CSPR doesn't go higher
    // But 500 CSPR = 50 score vs 1000+ CSPR = 100 score, so difference is bounded
    const stakeDiff = Math.abs(lowStake.aggregateScore - highStake.aggregateScore);
    // Max possible difference: (100-50)*0.3*10 = 150
    expect(stakeDiff).toBeLessThanOrEqual(150);
  });

  it('preserves all input fields in output', () => {
    const result = computeAggregateTrust(baseScore);
    expect(result.agentId).toBe(baseScore.agentId);
    expect(result.identityVerified).toBe(baseScore.identityVerified);
    expect(result.executionScore).toBe(baseScore.executionScore);
    expect(result.outputConsistency).toBe(baseScore.outputConsistency);
    expect(result.economicStake).toBe(baseScore.economicStake);
  });
});
