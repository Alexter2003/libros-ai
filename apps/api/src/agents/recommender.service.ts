import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AiServicesService } from '../ai/ai-services/ai-services.service';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { GatewayService } from '../ai/gateway/gateway.service';
import { TokenQuotaService } from '../ai/token-quota/token-quota.service';
import { filterRelevant } from '../chat/rag-prompt';
import { MIN_SIMILARITY } from '../chat/rag.constants';
import { buildRecommendPrompt, parseRecommendations } from './agent-prompts';
import { CANDIDATE_LIMIT } from './agents.constants';
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
    private readonly services: AiServicesService,
    private readonly quota: TokenQuotaService,
    private readonly embeddings: EmbeddingsService,
    private readonly gateway: GatewayService,
  ) {}

  async recommend(userId: string, dto: RecommendDto): Promise<RecommendResult> {
    const service = await this.services.getOrThrow(dto.serviceId);
    if (!service.enabled) {
      throw new UnprocessableEntityException('AI service is disabled');
    }
    await this.quota.assertWithinQuota(userId);

    const vector = await this.embeddings.embedQuery(userId, dto.description);
    const candidates = filterRelevant(await this.embeddings.search(vector, CANDIDATE_LIMIT), MIN_SIMILARITY);
    if (candidates.length === 0) {
      return { recommendations: [], inputTokens: 0, outputTokens: 0 };
    }

    const result = await this.gateway.generate(userId, {
      serviceId: dto.serviceId,
      prompt: buildRecommendPrompt(candidates, dto.description),
    });
    const byId = new Map(candidates.map((item) => [item.id, item]));
    const recommendations: Recommendation[] = [];
    for (const { id, reason } of parseRecommendations(result.text, candidates)) {
      const item = byId.get(id);
      if (item) {
        recommendations.push({ id, title: item.title, author: item.author, kind: item.kind, reason });
      }
    }
    return { recommendations, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  }
}
