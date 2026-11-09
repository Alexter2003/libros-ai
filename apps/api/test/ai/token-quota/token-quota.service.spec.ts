import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TokenQuotaService } from '../../../src/ai/token-quota/token-quota.service';
import { FakePrisma } from '../../support/fake-prisma';

function setup(limit: number | null, used: Array<[number, number]>) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', limit);
  for (const [inputTokens, outputTokens] of used) {
    prisma.usage.push({ userId: 'u1', serviceId: null, serviceName: 'x', inputTokens, outputTokens });
  }
  return new TokenQuotaService(prisma.asPrisma());
}

describe('quota service', () => {
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
