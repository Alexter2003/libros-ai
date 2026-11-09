import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessage, Prisma } from '@prisma/client';
import { QuotaStatus, TokenQuotaService } from '../ai/token-quota/token-quota.service';
import { PrismaService } from '../prisma/prisma.service';
import { DateRange, UsageReportRow, UsageSummary, summarize } from './usage-aggregation';

export interface UsageFilters {
  userId?: string;
  serviceId?: string;
  range: DateRange;
}

export interface SessionReportRow {
  sessionId: string;
  userId: string;
  userEmail: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface SessionMessages {
  sessionId: string;
  userId: string;
  userEmail: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}

export interface OwnUsage extends UsageSummary {
  quota: QuotaStatus;
}

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: TokenQuotaService,
  ) {}

  async own(userId: string, range: DateRange): Promise<OwnUsage> {
    const [rows, quota] = await Promise.all([
      this.usageRows({ userId, range }),
      this.quota.getStatus(userId),
    ]);
    return { ...summarize(rows), quota };
  }

  usageRows(filters: UsageFilters): Promise<UsageReportRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.userId) conditions.push(Prisma.sql`e."userId" = ${filters.userId}`);
    if (filters.serviceId) conditions.push(Prisma.sql`e."serviceId" = ${filters.serviceId}`);
    if (filters.range.from) conditions.push(Prisma.sql`e."createdAt" >= ${filters.range.from}`);
    if (filters.range.toExclusive) conditions.push(Prisma.sql`e."createdAt" < ${filters.range.toExclusive}`);
    const where = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
    return this.prisma.$queryRaw<UsageReportRow[]>(Prisma.sql`
      SELECT to_char(date_trunc('day', e."createdAt"), 'YYYY-MM-DD') AS "date",
             e."userId" AS "userId",
             u."email" AS "userEmail",
             e."serviceName" AS "serviceName",
             COUNT(*)::int AS "requests",
             SUM(e."inputTokens")::int AS "inputTokens",
             SUM(e."outputTokens")::int AS "outputTokens",
             SUM(e."inputTokens" + e."outputTokens")::int AS "totalTokens"
      FROM "UsageEvent" e
      JOIN "User" u ON u."id" = e."userId"
      ${where}
      GROUP BY 1, 2, 3, 4
      ORDER BY 1 ASC, 3 ASC, 4 ASC
    `);
  }

  sessionRows(filters: { userId?: string; range: DateRange }): Promise<SessionReportRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.userId) conditions.push(Prisma.sql`s."userId" = ${filters.userId}`);
    if (filters.range.from) conditions.push(Prisma.sql`s."createdAt" >= ${filters.range.from}`);
    if (filters.range.toExclusive) conditions.push(Prisma.sql`s."createdAt" < ${filters.range.toExclusive}`);
    const where = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
    return this.prisma.$queryRaw<SessionReportRow[]>(Prisma.sql`
      SELECT s."id" AS "sessionId",
             s."userId" AS "userId",
             u."email" AS "userEmail",
             s."title" AS "title",
             COUNT(m."id")::int AS "messageCount",
             COALESCE(SUM(COALESCE(m."inputTokens", 0) + COALESCE(m."outputTokens", 0)), 0)::int AS "totalTokens",
             s."createdAt" AS "createdAt",
             s."updatedAt" AS "lastActivityAt"
      FROM "ChatSession" s
      JOIN "User" u ON u."id" = s."userId"
      LEFT JOIN "ChatMessage" m ON m."sessionId" = s."id"
      ${where}
      GROUP BY s."id", u."email"
      ORDER BY s."updatedAt" DESC
    `);
  }

  async sessionMessages(sessionId: string): Promise<SessionMessages> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { email: true } }, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return {
      sessionId: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      title: session.title,
      createdAt: session.createdAt,
      messages: session.messages,
    };
  }
}
