import { Module } from '@nestjs/common';
import { AiServicesController } from './ai-services.controller';
import { AiServicesService } from './ai-services.service';
import { BedrockModelProvider } from './bedrock-model.provider';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ModelProvider } from './model-provider';
import { TokenLimitController } from './token-limit.controller';
import { TokenQuotaService } from './token-quota.service';

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
