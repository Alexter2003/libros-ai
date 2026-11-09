import { HttpException, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiServicesService } from '../../../src/ai/ai-services/ai-services.service';
import { GatewayService } from '../../../src/ai/gateway/gateway.service';
import { ConversationResult, ModelProvider } from '../../../src/ai/providers/model-provider';
import { TokenQuotaService } from '../../../src/ai/token-quota/token-quota.service';
import { FakePrisma } from '../../support/fake-prisma';
import { fakeProvider } from '../../support/fake-model-provider';

const reply: ConversationResult = {
  message: { role: 'assistant', content: [{ kind: 'text', text: 'hi' }] },
  text: 'hi',
  toolCalls: [],
  inputTokens: 7,
  outputTokens: 3,
};

async function setup(limit: number | null) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', limit);
  const services = new AiServicesService(prisma.asPrisma());
  const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
  const converse = vi.fn<ModelProvider['converse']>().mockResolvedValue(reply);
  const gateway = new GatewayService(services, new TokenQuotaService(prisma.asPrisma()), fakeProvider({ converse }));
  const input = { serviceId: service.id, messages: [], tools: [] };
  return { prisma, services, service, gateway, converse, input };
}

describe('gateway: tool-use conversations', () => {
  it('refuses a disabled service without calling the model or recording usage', async () => {
    const { prisma, services, service, gateway, converse, input } = await setup(null);
    await services.update(service.id, { enabled: false });

    await expect(gateway.converse('u1', input)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(converse).not.toHaveBeenCalled();
    expect(prisma.usage).toHaveLength(0);
  });

  it('blocks a user over the token limit', async () => {
    const { gateway, converse, input } = await setup(0);

    const error: unknown = await gateway.converse('u1', input).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect(error instanceof HttpException && error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(converse).not.toHaveBeenCalled();
  });

  it('records the tokens of the call for the service', async () => {
    const { prisma, service, gateway, input } = await setup(null);

    const result = await gateway.converse('u1', input);

    expect(result).toMatchObject({ text: 'hi', totalTokens: 10, service: 'Nova Lite' });
    expect(prisma.usage).toEqual([
      { userId: 'u1', serviceId: service.id, serviceName: 'Nova Lite', inputTokens: 7, outputTokens: 3 },
    ]);
  });
});
