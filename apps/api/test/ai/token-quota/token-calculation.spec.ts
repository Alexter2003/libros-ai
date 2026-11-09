import { describe, expect, it } from 'vitest';
import {
  hasReachedLimit,
  remainingTokens,
  sumTokens,
  totalTokens,
} from '../../../src/ai/token-quota/token-calculation';

describe('token calculation', () => {
  it('adds input and output tokens', () => {
    expect(totalTokens({ inputTokens: 12, outputTokens: 30 })).toBe(42);
  });

  it('sums several usage events', () => {
    expect(
      sumTokens([
        { inputTokens: 1, outputTokens: 2 },
        { inputTokens: 10, outputTokens: 20 },
      ]),
    ).toBe(33);
    expect(sumTokens([])).toBe(0);
  });

  it('blocks exactly at the limit and not before', () => {
    expect(hasReachedLimit(99, 100)).toBe(false);
    expect(hasReachedLimit(100, 100)).toBe(true);
    expect(hasReachedLimit(101, 100)).toBe(true);
  });

  it('treats a limit of zero as blocked and a null limit as unlimited', () => {
    expect(hasReachedLimit(0, 0)).toBe(true);
    expect(hasReachedLimit(1_000_000, null)).toBe(false);
  });

  it('never reports negative remaining tokens', () => {
    expect(remainingTokens(40, 100)).toBe(60);
    expect(remainingTokens(150, 100)).toBe(0);
    expect(remainingTokens(150, null)).toBeNull();
  });
});
