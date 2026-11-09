import { ApiProperty } from '@nestjs/swagger';
import { Controller, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserResponse } from '../../users/user.response';
import { ReindexQuery } from './dto/reindex.query';
import { EmbeddingsService, ReindexResult } from './embeddings.service';

class ReindexResponse implements ReindexResult {
  @ApiProperty()
  indexed!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty()
  total!: number;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class EmbeddingsController {
  constructor(private readonly embeddings: EmbeddingsService) {}

  @Post('reindex')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generate item embeddings for the chatbot: missing ones, or all with all=true (admin)' })
  reindex(@Query() query: ReindexQuery, @CurrentUser() actor: UserResponse): Promise<ReindexResponse> {
    return this.embeddings.reindex(actor.id, query.all);
  }
}
