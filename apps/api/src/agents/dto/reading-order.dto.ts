import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../items/dto/item-fields';
import { MAX_SERIES_QUERY_CHARS } from '../agents.constants';

export class ReadingOrderDto {
  @ApiProperty({ maxLength: MAX_SERIES_QUERY_CHARS, description: 'Series name or the title of one of its entries' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SERIES_QUERY_CHARS)
  query!: string;

  @ApiProperty({ description: 'Enabled AI service that writes the explanation' })
  @IsUUID()
  serviceId!: string;
}
