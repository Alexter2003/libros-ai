import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiService } from '@prisma/client';

export class AiServiceResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  modelId!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  maxOutputTokens!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  temperature!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export function toAiServiceResponse(service: AiService): AiServiceResponse {
  return {
    id: service.id,
    name: service.name,
    modelId: service.modelId,
    provider: service.provider,
    enabled: service.enabled,
    maxOutputTokens: service.maxOutputTokens,
    temperature: service.temperature,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}
