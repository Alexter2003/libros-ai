import { PartialType } from '@nestjs/swagger';
import { CreateAiServiceDto } from './create-ai-service.dto';

export class UpdateAiServiceDto extends PartialType(CreateAiServiceDto) {}
