import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { AiService, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenUsage, hasReachedLimit, remainingTokens } from './token-calculation';

export interface QuotaStatus {
  tokenLimit: number | null;
  tokensUsed: number;
  tokensRemaining: number | null;
}

@Injectable()
export class TokenQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<QuotaStatus> {
    const [user, sums] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { tokenLimit: true } }),
      this.prisma.usageEvent.aggregate({
        where: { userId },
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    const tokensUsed = (sums._sum.inputTokens ?? 0) + (sums._sum.outputTokens ?? 0);
    return {
      tokenLimit: user.tokenLimit,
      tokensUsed,
      tokensRemaining: remainingTokens(tokensUsed, user.tokenLimit),
    };
  }

  async assertWithinQuota(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (hasReachedLimit(status.tokensUsed, status.tokenLimit)) {
      throw new HttpException(
        'Token limit reached. Ask an administrator to raise your limit.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async record(userId: string, service: Pick<AiService, 'id' | 'name'>, usage: TokenUsage): Promise<void> {
    await this.prisma.usageEvent.create({
      data: {
        userId,
        serviceId: service.id,
        serviceName: service.name,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });
  }

  async setLimit(userId: string, tokenLimit: number | null): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id: userId }, data: { tokenLimit } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User ${userId} not found`);
      }
      throw error;
    }
  }
}
