import { Injectable, Logger } from '@nestjs/common';
import { Item, Kind, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenQuotaService } from '../token-quota/token-quota.service';
import { EmbeddingProvider } from './embedding-provider';
import { buildItemEmbeddingText } from './item-embedding-text';

export const EMBEDDING_SERVICE_NAME = 'Titan Embeddings';

export interface SimilarItem {
  id: string;
  title: string;
  author: string;
  kind: Kind;
  genre: string;
  year: number;
  series: string | null;
  synopsis: string;
  score: number;
}

export interface ReindexResult {
  indexed: number;
  failed: number;
  total: number;
}

export function toVectorLiteral(values: number[]): string {
  return `[${values.map((value) => Number(value)).join(',')}]`;
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: EmbeddingProvider,
    private readonly quota: TokenQuotaService,
  ) {}

  async embedQuery(userId: string, text: string): Promise<number[]> {
    const { embedding, inputTokens } = await this.provider.embed(text);
    await this.recordUsage(userId, inputTokens);
    return embedding;
  }

  async embedItem(userId: string, item: Item): Promise<void> {
    const { embedding, inputTokens } = await this.provider.embed(buildItemEmbeddingText(item));
    await this.prisma.$executeRaw`
      UPDATE "Item" SET "embedding" = ${toVectorLiteral(embedding)}::vector WHERE "id" = ${item.id}
    `;
    await this.recordUsage(userId, inputTokens);
  }

  async refreshItem(userId: string, item: Item): Promise<void> {
    try {
      await this.embedItem(userId, item);
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      this.logger.warn(`Embedding refresh failed for item ${item.id}: ${reason}`);
      await this.prisma.$executeRaw`UPDATE "Item" SET "embedding" = NULL WHERE "id" = ${item.id}`;
    }
  }

  async search(vector: number[], limit: number): Promise<SimilarItem[]> {
    const literal = toVectorLiteral(vector);
    return this.prisma.$queryRaw<SimilarItem[]>(Prisma.sql`
      SELECT "id", "title", "author", "kind", "genre", "year", "series", "synopsis",
             1 - ("embedding" <=> ${literal}::vector) AS "score"
      FROM "Item"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${literal}::vector
      LIMIT ${limit}
    `);
  }

  async reindex(userId: string, all: boolean): Promise<ReindexResult> {
    const items = await this.prisma.item.findMany({
      where: all ? {} : { id: { in: await this.idsWithoutEmbedding() } },
      orderBy: { id: 'asc' },
    });
    let indexed = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await this.embedItem(userId, item);
        indexed += 1;
      } catch {
        failed += 1;
      }
    }
    return { indexed, failed, total: items.length };
  }

  private async idsWithoutEmbedding(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Item" WHERE "embedding" IS NULL
    `;
    return rows.map((row) => row.id);
  }

  private recordUsage(userId: string, inputTokens: number): Promise<void> {
    return this.quota.record(userId, { id: null, name: EMBEDDING_SERVICE_NAME }, { inputTokens, outputTokens: 0 });
  }
}
