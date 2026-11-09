import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../items/dto/item-fields';

export const SUPPORTED_PROVIDERS = ['bedrock'] as const;

export class CreateAiServiceDto {
  @ApiProperty({ example: 'Nova Lite' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'us.amazon.nova-lite-v1:0' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  modelId!: string;

  @ApiPropertyOptional({ enum: SUPPORTED_PROVIDERS, default: 'bedrock' })
  @IsOptional()
  @IsIn(SUPPORTED_PROVIDERS)
  provider?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 8192 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8192)
  maxOutputTokens?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;
}
