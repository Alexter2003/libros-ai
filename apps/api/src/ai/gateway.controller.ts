import { ApiProperty } from '@nestjs/swagger';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponse } from '../users/user.response';
import { GenerateDto } from './dto/generate.dto';
import { GatewayService } from './gateway.service';
import { QuotaStatus, TokenQuotaService } from './token-quota.service';

class GenerateResponse {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  inputTokens!: number;

  @ApiProperty()
  outputTokens!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiProperty()
  service!: string;
}

class QuotaResponse implements QuotaStatus {
  @ApiProperty({ type: Number, nullable: true })
  tokenLimit!: number | null;

  @ApiProperty()
  tokensUsed!: number;

  @ApiProperty({ type: Number, nullable: true })
  tokensRemaining!: number | null;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class GatewayController {
  constructor(
    private readonly gateway: GatewayService,
    private readonly quota: TokenQuotaService,
  ) {}

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate text with an enabled AI service, subject to the token limit' })
  generate(@Body() dto: GenerateDto, @CurrentUser() actor: UserResponse): Promise<GenerateResponse> {
    return this.gateway.generate(actor.id, dto);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Token limit, tokens used and tokens remaining for the current user' })
  getQuota(@CurrentUser() actor: UserResponse): Promise<QuotaResponse> {
    return this.quota.getStatus(actor.id);
  }
}
