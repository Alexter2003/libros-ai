import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AiService } from '@prisma/client';
import { AiServicesService } from '../ai-services/ai-services.service';
import { GenerateDto } from './dto/generate.dto';
import { ConversationMessage, ConversationResult, ModelProvider, ToolDefinition } from '../providers/model-provider';
import { totalTokens } from '../token-quota/token-calculation';
import { TokenQuotaService } from '../token-quota/token-quota.service';

export interface GatewayResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  service: string;
}

export interface ConversationInput {
  serviceId: string;
  system?: string;
  messages: ConversationMessage[];
  tools: ToolDefinition[];
}

export interface GatewayConversationResult extends ConversationResult {
  totalTokens: number;
  service: string;
}

@Injectable()
export class GatewayService {
  constructor(
    private readonly services: AiServicesService,
    private readonly quota: TokenQuotaService,
    private readonly provider: ModelProvider,
  ) {}

  async generate(userId: string, dto: GenerateDto): Promise<GatewayResult> {
    const service = await this.admit(userId, dto.serviceId);

    const result = await this.provider.generate({
      modelId: service.modelId,
      prompt: dto.prompt,
      maxOutputTokens: service.maxOutputTokens ?? undefined,
      temperature: service.temperature ?? undefined,
    });

    await this.quota.record(userId, service, result);
    return {
      text: result.text,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: totalTokens(result),
      service: service.name,
    };
  }

  async converse(userId: string, input: ConversationInput): Promise<GatewayConversationResult> {
    const service = await this.admit(userId, input.serviceId);

    const result = await this.provider.converse({
      modelId: service.modelId,
      system: input.system,
      messages: input.messages,
      tools: input.tools,
      maxOutputTokens: service.maxOutputTokens ?? undefined,
      temperature: service.temperature ?? undefined,
    });

    await this.quota.record(userId, service, result);
    return { ...result, totalTokens: totalTokens(result), service: service.name };
  }

  private async admit(userId: string, serviceId: string): Promise<AiService> {
    const service = await this.services.getOrThrow(serviceId);
    if (!service.enabled) {
      throw new UnprocessableEntityException('AI service is disabled');
    }
    await this.quota.assertWithinQuota(userId);
    return service;
  }
}
