import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiKey } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateApiKey, hashApiKey } from './api-key.util';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string): Promise<{ key: ApiKey; plain: string }> {
    const generated = generateApiKey();
    const key = await this.prisma.apiKey.create({
      data: { name, keyHash: generated.hash, prefix: generated.prefix },
    });
    return { key, plain: generated.plain };
  }

  list(): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async revoke(id: string): Promise<ApiKey> {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`API key ${id} not found`);
    }
    if (existing.revokedAt) {
      return existing;
    }
    return this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async authenticate(plain: string): Promise<ApiKey | null> {
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(plain) } });
    if (!key || key.revokedAt) {
      return null;
    }
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return key;
  }
}
