import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiServicesService } from '../../../src/ai/ai-services/ai-services.service';
import { GatewayService } from '../../../src/ai/gateway/gateway.service';
import { ModelProvider } from '../../../src/ai/providers/model-provider';
import { TokenQuotaService } from '../../../src/ai/token-quota/token-quota.service';
import { FakePrisma } from '../../support/fake-prisma';
import { fakeProvider } from '../../support/fake-model-provider';

async function setup(limit: number | null, generate: ModelProvider['generate']) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', limit);
  const services = new AiServicesService(prisma.asPrisma());
  const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
  const provider = fakeProvider({ generate });
  const gateway = new GatewayService(services, new TokenQuotaService(prisma.asPrisma()), provider);
  return { prisma, services, service, gateway };
}

describe('gateway: service availability', () => {
  it('refuses calls to a disabled service without invoking the model', async () => {
    const generate = vi
      .fn<ModelProvider['generate']>()
      .mockResolvedValue({ text: 'hi', inputTokens: 1, outputTokens: 1 });
    const { services, service, gateway } = await setup(null, generate);
    await services.update(service.id, { enabled: false });

    await expect(gateway.generate('u1', { serviceId: service.id, prompt: 'hello' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(generate).not.toHaveBeenCalled();
  });
});

describe('gateway: usage recording', () => {
  it('stores exactly one event with the tokens reported by the model', async () => {
    const generate = vi
      .fn<ModelProvider['generate']>()
      .mockResolvedValue({ text: 'answer', inputTokens: 11, outputTokens: 22 });
    const { prisma, service, gateway } = await setup(null, generate);

    const result = await gateway.generate('u1', { serviceId: service.id, prompt: 'hello' });

    expect(result).toMatchObject({ text: 'answer', inputTokens: 11, outputTokens: 22, totalTokens: 33 });
    expect(prisma.usage).toEqual([
      { userId: 'u1', serviceId: service.id, serviceName: 'Nova Lite', inputTokens: 11, outputTokens: 22 },
    ]);
  });

  it('stores nothing when the model call fails', async () => {
    const generate = vi
      .fn<ModelProvider['generate']>()
      .mockRejectedValue(new ServiceUnavailableException('The AI model is temporarily unavailable'));
    const { prisma, service, gateway } = await setup(null, generate);

    await expect(gateway.generate('u1', { serviceId: service.id, prompt: 'hello' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.usage).toHaveLength(0);
  });

  it('does not call the model nor store usage when the limit is reached', async () => {
    const generate = vi
      .fn<ModelProvider['generate']>()
      .mockResolvedValue({ text: 'answer', inputTokens: 5, outputTokens: 5 });
    const { prisma, service, gateway } = await setup(10, generate);
    prisma.usage.push({ userId: 'u1', serviceId: null, serviceName: 'old', inputTokens: 5, outputTokens: 5 });

    const error = await gateway
      .generate('u1', { serviceId: service.id, prompt: 'hello' })
      .catch((e: unknown) => e);

    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(generate).not.toHaveBeenCalled();
    expect(prisma.usage).toHaveLength(1);
  });
});
