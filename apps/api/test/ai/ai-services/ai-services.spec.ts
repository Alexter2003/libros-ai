import { ConflictException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AiServicesController } from '../../../src/ai/ai-services/ai-services.controller';
import { AiServicesService } from '../../../src/ai/ai-services/ai-services.service';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';
import { UserResponse } from '../../../src/users/user.response';
import { FakePrisma } from '../../support/fake-prisma';

function setup() {
  const prisma = new FakePrisma();
  const services = new AiServicesService(prisma.asPrisma());
  return { services };
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
