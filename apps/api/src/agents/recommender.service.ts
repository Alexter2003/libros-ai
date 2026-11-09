import { Injectable } from '@nestjs/common';
import { GatewayService } from '../ai/gateway/gateway.service';
import { runAgentLoop } from './agent-loop';
import { RECOMMENDER_SYSTEM_PROMPT, buildRecommendPrompt, parseRecommendations } from './agent-prompts';
import { CatalogToolsService } from './catalog-tools';
import { RecommendDto } from './dto/recommend.dto';

export interface Recommendation {
  id: string;
  title: string;
  author: string;
  kind: string;
  reason: string;
}

export interface RecommendResult {
  recommendations: Recommendation[];
  inputTokens: number;
  outputTokens: number;
}

@Injectable()
export class RecommenderService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly catalog: CatalogToolsService,
  ) {}

  async recommend(userId: string, dto: RecommendDto): Promise<RecommendResult> {
    const toolkit = this.catalog.toolkit(userId);
    const loop = await runAgentLoop({
      step: (messages, tools) =>
        this.gateway.converse(userId, {
          serviceId: dto.serviceId,
          system: RECOMMENDER_SYSTEM_PROMPT,
          messages,
          tools,
        }),
      tools: [toolkit.searchCatalog, toolkit.getItem],
      prompt: buildRecommendPrompt(dto.description),
    });

    const { items, firstSearch } = toolkit.recorder;
    const recommendations: Recommendation[] = [];
    for (const { id, reason } of parseRecommendations(loop.text ?? '', [...items.values()], firstSearch ?? [])) {
      const item = items.get(id);
      if (item) {
        recommendations.push({ id, title: item.title, author: item.author, kind: item.kind, reason });
      }
    }
    return { recommendations, inputTokens: loop.inputTokens, outputTokens: loop.outputTokens };
  }
}
