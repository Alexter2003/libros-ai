import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AiService, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiServiceDto } from './dto/create-ai-service.dto';
import { UpdateAiServiceDto } from './dto/update-ai-service.dto';

const DUPLICATE_MESSAGE = 'An AI service with the same name already exists';

@Injectable()
export class AiServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(onlyEnabled: boolean): Promise<AiService[]> {
    return this.prisma.aiService.findMany({
      where: onlyEnabled ? { enabled: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getOrThrow(id: string): Promise<AiService> {
    const service = await this.prisma.aiService.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`AI service ${id} not found`);
    }
    return service;
  }

  async create(dto: CreateAiServiceDto): Promise<AiService> {
    await this.assertNameAvailable(dto.name);
    try {
      return await this.prisma.aiService.create({ data: dto });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(id: string, dto: UpdateAiServiceDto): Promise<AiService> {
    await this.getOrThrow(id);
    if (dto.name !== undefined) {
      await this.assertNameAvailable(dto.name, id);
    }
    try {
      return await this.prisma.aiService.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.aiService.delete({ where: { id } });
  }

  private async assertNameAvailable(name: string, exceptId?: string): Promise<void> {
    const existing = await this.prisma.aiService.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_MESSAGE);
    }
  }

  private mapWriteError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(DUPLICATE_MESSAGE);
    }
    return error;
  }
}
