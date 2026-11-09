import { describe, expect, it } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FakePrisma } from './testing/fake-prisma';
import { hasReachedLimit, remainingTokens, sumTokens, totalTokens } from './token-calculation';
import { TokenQuotaService } from './token-quota.service';

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

describe('quota service', () => {
  function setup(limit: number | null, used: Array<[number, number]>) {
    const prisma = new FakePrisma();
    prisma.addUser('u1', limit);
    for (const [inputTokens, outputTokens] of used) {
      prisma.usage.push({ userId: 'u1', serviceId: null, serviceName: 'x', inputTokens, outputTokens });
    }
    return new TokenQuotaService(prisma.asPrisma());
  }

  it('reports limit, used and remaining from recorded events', async () => {
    const quota = setup(100, [[10, 20], [5, 5]]);
    await expect(quota.getStatus('u1')).resolves.toEqual({
      tokenLimit: 100,
      tokensUsed: 40,
      tokensRemaining: 60,
    });
  });

  it('refuses with 429 once the recorded total reaches the limit', async () => {
    const quota = setup(40, [[10, 20], [5, 5]]);
    const error = await quota.assertWithinQuota('u1').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('allows unlimited users regardless of consumption', async () => {
    const quota = setup(null, [[1_000_000, 1_000_000]]);
    await expect(quota.assertWithinQuota('u1')).resolves.toBeUndefined();
  });
});
