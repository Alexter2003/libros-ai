import { Module } from '@nestjs/common';
import { AiServicesController } from './ai-services/ai-services.controller';
import { AiServicesService } from './ai-services/ai-services.service';
import { BedrockModelProvider } from './providers/bedrock-model.provider';
import { GatewayController } from './gateway/gateway.controller';
import { GatewayService } from './gateway/gateway.service';
import { ModelProvider } from './providers/model-provider';
import { TokenLimitController } from './token-quota/token-limit.controller';
import { TokenQuotaService } from './token-quota/token-quota.service';

@Module({
  controllers: [AiServicesController, GatewayController, TokenLimitController],
  providers: [
    AiServicesService,
    TokenQuotaService,
    GatewayService,
    { provide: ModelProvider, useClass: BedrockModelProvider },
  ],
  exports: [GatewayService, TokenQuotaService, AiServicesService],
})
export class AiModule {}
