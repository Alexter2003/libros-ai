import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { AiServicesService } from "../ai/ai-services/ai-services.service";
import { EmbeddingsService } from "../ai/embeddings/embeddings.service";
import { GatewayService } from "../ai/gateway/gateway.service";
import { TokenQuotaService } from "../ai/token-quota/token-quota.service";
import { MIN_SIMILARITY } from "../chat/rag.constants";
import { PrismaService } from "../prisma/prisma.service";
import { NO_SERIES_EXPLANATION } from "./agents.constants";
import { ReadingOrderDto } from "./dto/reading-order.dto";
import {
  SeriesEntry,
  buildReadingOrderPrompt,
  sortReadingOrder,
} from "./reading-order";

export interface ReadingOrderItem extends SeriesEntry {
  position: number;
}

export interface ReadingOrderResult {
  series: string | null;
  items: ReadingOrderItem[];
  explanation: string;
  inputTokens: number;
  outputTokens: number;
}

const ENTRY_SELECT = {
  id: true,
  title: true,
  author: true,
  kind: true,
  year: true,
  issueNumber: true,
} as const;

@Injectable()
export class ReadingOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly services: AiServicesService,
    private readonly quota: TokenQuotaService,
    private readonly embeddings: EmbeddingsService,
    private readonly gateway: GatewayService,
  ) {}

  async order(
    userId: string,
    dto: ReadingOrderDto,
  ): Promise<ReadingOrderResult> {
    const service = await this.services.getOrThrow(dto.serviceId);
    if (!service.enabled) {
      throw new UnprocessableEntityException("AI service is disabled");
    }
    await this.quota.assertWithinQuota(userId);

    const resolved = await this.resolve(userId, dto.query);
    if (!resolved) {
      return {
        series: null,
        items: [],
        explanation: NO_SERIES_EXPLANATION,
        inputTokens: 0,
        outputTokens: 0,
      };
    }

    const ordered = sortReadingOrder(resolved.entries);
    const result = await this.gateway.generate(userId, {
      serviceId: dto.serviceId,
      prompt: buildReadingOrderPrompt(resolved.name, ordered),
    });
    return {
      series: resolved.name,
      items: ordered.map((entry, index) => ({ ...entry, position: index + 1 })),
      explanation: result.text,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  }

  private async resolve(
    userId: string,
    query: string,
  ): Promise<{ name: string; entries: SeriesEntry[] } | null> {
    const exact = await this.prisma.item.findFirst({
      where: { series: { equals: query, mode: "insensitive" } },
      select: { series: true },
    });
    const partial =
      exact ??
      (await this.prisma.item.findFirst({
        where: { series: { contains: query, mode: "insensitive" } },
        orderBy: { series: "asc" },
        select: { series: true },
      }));
    if (partial?.series) return this.loadSeries(partial.series);

    const byTitle = await this.prisma.item.findFirst({
      where: { title: { contains: query, mode: "insensitive" } },
      orderBy: { title: "asc" },
      select: { ...ENTRY_SELECT, series: true },
    });
    if (byTitle) return this.fromItem(byTitle);

    const vector = await this.embeddings.embedQuery(userId, query);
    const [best] = await this.embeddings.search(vector, 1);
    if (!best || best.score < MIN_SIMILARITY) return null;
    if (best.series) return this.loadSeries(best.series);
    return {
      name: best.title,
      entries: [
        {
          id: best.id,
          title: best.title,
          author: best.author,
          kind: best.kind,
          year: best.year,
          issueNumber: null,
        },
      ],
    };
  }

  private async fromItem(
    item: SeriesEntry & { series: string | null },
  ): Promise<{ name: string; entries: SeriesEntry[] }> {
    if (item.series) return this.loadSeries(item.series);
    const entry: SeriesEntry = {
      id: item.id,
      title: item.title,
      author: item.author,
      kind: item.kind,
      year: item.year,
      issueNumber: item.issueNumber,
    };
    return { name: item.title, entries: [entry] };
  }

  private async loadSeries(
    name: string,
  ): Promise<{ name: string; entries: SeriesEntry[] }> {
    const entries = await this.prisma.item.findMany({
      where: { series: name },
      select: ENTRY_SELECT,
    });
    return { name, entries };
  }
}
