import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../items/dto/item-fields';
import { MAX_DESCRIPTION_CHARS } from '../agents.constants';

export class RecommendDto {
  @ApiProperty({ maxLength: MAX_DESCRIPTION_CHARS, description: 'What the user likes, in free text' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_DESCRIPTION_CHARS)
  description!: string;

  @ApiProperty({ description: 'Enabled AI service that writes the reasons' })
  @IsUUID()
  serviceId!: string;
}
