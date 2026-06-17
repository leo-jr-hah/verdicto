import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
  createExecutionCommitment,
  type ExecutionCommitment,
} from '../shared/verifiable-execution.js';

describe('createExecutionCommitment', () => {
  it('returns a valid commitment object with all fields', () => {
    const input = 'parking revenue claim $12,500';
    const agentState = { role: 'valuation-a', confidence: 0.85 };
    const blockHeight = 12345;

    const result = createExecutionCommitment(input, agentState, blockHeight);

    expect(result).toHaveProperty('commitment');
    expect(result).toHaveProperty('agentStateHash');
    expect(result).toHaveProperty('inputHash');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('blockHeight');
  });

  it('produces deterministic hashes for same input', () => {
    const input = 'test input';
    const state = { key: 'value' };
    const block = 100;

    const a = createExecutionCommitment(input, state, block);
    const b = createExecutionCommitment(input, state, block);

    // Same input → same hashes (timestamps differ, so commitment differs)
    expect(a.inputHash).toBe(b.inputHash);
    expect(a.agentStateHash).toBe(b.agentStateHash);
  });

  it('produces different hashes for different inputs', () => {
    const state = { key: 'value' };
    const block = 100;

    const a = createExecutionCommitment('input A', state, block);
    const b = createExecutionCommitment('input B', state, block);

    expect(a.inputHash).not.toBe(b.inputHash);
    expect(a.commitment).not.toBe(b.commitment);
  });

  it('produces different hashes for different agent states', () => {
    const input = 'same input';
    const block = 100;

    const a = createExecutionCommitment(input, { role: 'agent-a' }, block);
    const b = createExecutionCommitment(input, { role: 'agent-b' }, block);

    expect(a.agentStateHash).not.toBe(b.agentStateHash);
    expect(a.commitment).not.toBe(b.commitment);
  });

  it('hashes are valid hex strings of correct length', () => {
    const result = createExecutionCommitment('test', { x: 1 }, 42);

    expect(result.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(result.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.agentStateHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('inputHash matches manual SHA-256 of input', () => {
    const input = 'verify me';
    const result = createExecutionCommitment(input, {}, 0);

    const expected = createHash('sha256').update(input).digest('hex');
    expect(result.inputHash).toBe(expected);
  });

  it('agentStateHash matches manual SHA-256 of JSON state', () => {
    const state = { foo: 'bar', num: 42 };
    const result = createExecutionCommitment('x', state, 0);

    const expected = createHash('sha256').update(JSON.stringify(state)).digest('hex');
    expect(result.agentStateHash).toBe(expected);
  });

  it('handles "latest" block height by converting to 0', () => {
    const result = createExecutionCommitment('test', {}, 'latest');
    expect(result.blockHeight).toBe(0);
  });

  it('handles numeric string block height', () => {
    const result = createExecutionCommitment('test', {}, '999');
    expect(result.blockHeight).toBe(999);
  });

  it('timestamp is approximately now', () => {
    const before = Date.now();
    const result = createExecutionCommitment('test', {}, 0);
    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });
});
