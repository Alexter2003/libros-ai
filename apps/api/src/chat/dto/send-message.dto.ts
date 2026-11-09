import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../items/dto/item-fields';
import { MAX_QUESTION_CHARS } from '../rag.constants';

export class SendMessageDto {
  @ApiProperty({ maxLength: MAX_QUESTION_CHARS })
  @trimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_QUESTION_CHARS)
  message!: string;

  @ApiProperty({ description: 'Enabled AI service that writes the answer' })
  @IsUUID()
  serviceId!: string;

  @ApiPropertyOptional({ description: 'Existing session to continue; omitted to start a new one' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
