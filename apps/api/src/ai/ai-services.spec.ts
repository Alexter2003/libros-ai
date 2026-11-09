import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserResponse } from '../users/user.response';
import { AiServicesController } from './ai-services.controller';
import { AiServicesService } from './ai-services.service';
import { GatewayService } from './gateway.service';
import { ModelProvider } from './model-provider';
import { FakePrisma } from './testing/fake-prisma';
import { TokenQuotaService } from './token-quota.service';

function setup() {
  const prisma = new FakePrisma();
  prisma.addUser('u1', null);
  const services = new AiServicesService(prisma.asPrisma());
  const generate = vi.fn<ModelProvider['generate']>().mockResolvedValue({
    text: 'hi',
    inputTokens: 1,
    outputTokens: 1,
  });
  const provider: ModelProvider = { generate };
  const gateway = new GatewayService(services, new TokenQuotaService(prisma.asPrisma()), provider);
  return { prisma, services, gateway, generate };
}

function contextFor(handler: (...args: never[]) => unknown, role: Role): ExecutionContext {
  const user = { role } as UserResponse;
  return {
    getHandler: () => handler,
    getClass: () => AiServicesController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AI service management', () => {
  it('creates a service enabled by default', async () => {
    const { services } = setup();
    const created = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
    expect(created.enabled).toBe(true);
  });

  it('rejects a duplicate name regardless of letter case', async () => {
    const { services } = setup();
    await services.create({ name: 'Nova Lite', modelId: 'model-1' });
    await expect(services.create({ name: 'nova LITE', modelId: 'model-2' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuses calls to a disabled service without invoking the model', async () => {
    const { services, gateway, generate } = setup();
    const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
    await services.update(service.id, { enabled: false });
    await expect(gateway.generate('u1', { serviceId: service.id, prompt: 'hello' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it('lists only enabled services for regular users', async () => {
    const { services } = setup();
    await services.create({ name: 'On', modelId: 'm' });
    await services.create({ name: 'Off', modelId: 'm', enabled: false });
    const controller = new AiServicesController(services);
    const forUser = await controller.list({ role: Role.USER } as UserResponse);
    const forAdmin = await controller.list({ role: Role.ADMIN } as UserResponse);
    expect(forUser.map((service) => service.name)).toEqual(['On']);
    expect(forAdmin).toHaveLength(2);
  });

  it('forbids regular users from managing services', () => {
    const guard = new RolesGuard(new Reflector());
    const handlers = [
      AiServicesController.prototype.create,
      AiServicesController.prototype.update,
      AiServicesController.prototype.remove,
    ];
    for (const handler of handlers) {
      expect(() => guard.canActivate(contextFor(handler, Role.USER))).toThrow(ForbiddenException);
      expect(guard.canActivate(contextFor(handler, Role.ADMIN))).toBe(true);
    }
  });
});
