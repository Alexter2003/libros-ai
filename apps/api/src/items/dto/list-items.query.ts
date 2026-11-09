import { ApiPropertyOptional } from '@nestjs/swagger';
import { Kind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { trimString } from './item-fields';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export class ListItemsQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ enum: Kind })
  @IsOptional()
  @IsEnum(Kind)
  kind?: Kind;

  @ApiPropertyOptional({ description: 'Case-insensitive search over title, author and series' })
  @IsOptional()
  @trimString()
  @IsString()
  @MaxLength(100)
  q?: string;
}
