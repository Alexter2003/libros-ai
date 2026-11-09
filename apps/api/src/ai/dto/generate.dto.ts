import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../items/dto/item-fields';

export const MAX_PROMPT_LENGTH = 4000;

export class GenerateDto {
  @ApiProperty({ description: 'Id of an enabled AI service' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: 'Recommend a classic science fiction book.' })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_PROMPT_LENGTH)
  prompt!: string;
}
