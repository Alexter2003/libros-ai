import { Module } from '@nestjs/common';
import { AiServicesController } from './ai-services/ai-services.controller';
import { AiServicesService } from './ai-services/ai-services.service';
import { BedrockEmbeddingProvider } from './embeddings/bedrock-embedding.provider';
import { EmbeddingProvider } from './embeddings/embedding-provider';
import { EmbeddingsController } from './embeddings/embeddings.controller';
import { EmbeddingsService } from './embeddings/embeddings.service';
import { BedrockModelProvider } from './providers/bedrock-model.provider';
import { GatewayController } from './gateway/gateway.controller';
import { GatewayService } from './gateway/gateway.service';
import { ModelProvider } from './providers/model-provider';
import { TokenLimitController } from './token-quota/token-limit.controller';
import { TokenQuotaService } from './token-quota/token-quota.service';

@Module({
  controllers: [AiServicesController, GatewayController, TokenLimitController, EmbeddingsController],
  providers: [
    AiServicesService,
    TokenQuotaService,
    GatewayService,
    EmbeddingsService,
    { provide: ModelProvider, useClass: BedrockModelProvider },
    { provide: EmbeddingProvider, useClass: BedrockEmbeddingProvider },
  ],
  exports: [GatewayService, TokenQuotaService, AiServicesService, EmbeddingsService],
})
export class AiModule {}
