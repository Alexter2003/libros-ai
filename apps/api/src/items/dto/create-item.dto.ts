import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Kind } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { COVER_PATTERN, MAX_YEAR, MIN_YEAR, emptyToNull, trimString } from './item-fields';

export class CreateItemDto {
  @ApiProperty({ example: 'Dune' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Frank Herbert' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  author!: string;

  @ApiProperty({ enum: Kind })
  @IsEnum(Kind)
  kind!: Kind;

  @ApiProperty({ example: 'Science fiction' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  genre!: string;

  @ApiProperty({ example: 1965 })
  @IsInt()
  @Min(MIN_YEAR)
  @Max(MAX_YEAR)
  year!: number;

  @ApiProperty()
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  synopsis!: string;

  @ApiPropertyOptional({ nullable: true, example: '9780441013593' })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(20)
  isbn?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '/covers/dune.webp' })
  @IsOptional()
  @emptyToNull()
  @Matches(COVER_PATTERN, { message: 'coverUrl must be an http(s) URL or a site path like /covers/x.webp' })
  @MaxLength(500)
  coverUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Comics only' })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(150)
  series?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Comics only' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  issueNumber?: number | null;
}
