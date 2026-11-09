import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ReindexQuery {
  @ApiPropertyOptional({ default: false, description: 'Regenerate the embeddings of every item, not only the missing ones' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @IsBoolean()
  all: boolean = false;
}
