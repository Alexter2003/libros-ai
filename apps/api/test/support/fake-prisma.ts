import { AiService } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

interface UserRow {
  id: string;
  tokenLimit: number | null;
}

export interface UsageRow {
  userId: string;
  serviceId: string | null;
  serviceName: string;
  inputTokens: number;
  outputTokens: number;
}

interface NameFilter {
  equals: string;
}

interface ServiceWhere {
  id?: string | { not: string };
  name?: NameFilter;
  enabled?: boolean;
}

export class FakePrisma {
  users = new Map<string, UserRow>();
  services: AiService[] = [];
  usage: UsageRow[] = [];
  private nextId = 1;

  user = {
    findUnique: ({ where }: { where: { id: string } }): Promise<UserRow | null> =>
      Promise.resolve(this.users.get(where.id) ?? null),
  };

  usageEvent = {
    create: ({ data }: { data: UsageRow }): Promise<UsageRow> => {
      this.usage.push(data);
      return Promise.resolve(data);
    },
    aggregate: ({
      where,
    }: {
      where: { userId: string };
    }): Promise<{ _sum: { inputTokens: number | null; outputTokens: number | null } }> => {
      const rows = this.usage.filter((row) => row.userId === where.userId);
      return Promise.resolve({
        _sum: {
          inputTokens: rows.length ? rows.reduce((sum, row) => sum + row.inputTokens, 0) : null,
          outputTokens: rows.length ? rows.reduce((sum, row) => sum + row.outputTokens, 0) : null,
        },
      });
    },
  };

  aiService = {
    findMany: ({ where }: { where?: ServiceWhere } = {}): Promise<AiService[]> =>
      Promise.resolve(this.services.filter((service) => this.matches(service, where))),
    findUnique: ({ where }: { where: { id: string } }): Promise<AiService | null> =>
      Promise.resolve(this.services.find((service) => service.id === where.id) ?? null),
    findFirst: ({ where }: { where: ServiceWhere }): Promise<AiService | null> =>
      Promise.resolve(this.services.find((service) => this.matches(service, where)) ?? null),
    create: ({ data }: { data: Partial<AiService> & { name: string; modelId: string } }): Promise<AiService> => {
      const now = new Date();
      const service: AiService = {
        id: `service-${this.nextId++}`,
        provider: 'bedrock',
        enabled: true,
        maxOutputTokens: null,
        temperature: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      this.services.push(service);
      return Promise.resolve(service);
    },
    update: ({ where, data }: { where: { id: string }; data: Partial<AiService> }): Promise<AiService> => {
      const service = this.services.find((candidate) => candidate.id === where.id);
      if (!service) return Promise.reject(new Error('missing service'));
      Object.assign(service, data);
      return Promise.resolve(service);
    },
    delete: ({ where }: { where: { id: string } }): Promise<void> => {
      this.services = this.services.filter((service) => service.id !== where.id);
      return Promise.resolve();
    },
  };

  asPrisma(): PrismaService {
    return this as unknown as PrismaService;
  }

  addUser(id: string, tokenLimit: number | null): void {
    this.users.set(id, { id, tokenLimit });
  }

  private matches(service: AiService, where?: ServiceWhere): boolean {
    if (!where) return true;
    if (where.enabled !== undefined && service.enabled !== where.enabled) return false;
    if (where.name && service.name.toLowerCase() !== where.name.equals.toLowerCase()) return false;
    if (typeof where.id === 'object' && service.id === where.id.not) return false;
    return true;
  }
}
