import { ApiProperty } from '@nestjs/swagger';

export class UsageTotalsResponse {
  @ApiProperty()
  requests!: number;

  @ApiProperty()
  inputTokens!: number;

  @ApiProperty()
  outputTokens!: number;

  @ApiProperty()
  totalTokens!: number;
}

export class ServiceTotalsResponse extends UsageTotalsResponse {
  @ApiProperty()
  serviceName!: string;
}

export class DayTotalsResponse extends UsageTotalsResponse {
  @ApiProperty({ example: '2026-11-09', description: 'UTC day' })
  date!: string;
}

export class QuotaResponse {
  @ApiProperty({ type: Number, nullable: true })
  tokenLimit!: number | null;

  @ApiProperty()
  tokensUsed!: number;

  @ApiProperty({ type: Number, nullable: true })
  tokensRemaining!: number | null;
}

export class OwnUsageResponse {
  @ApiProperty({ type: UsageTotalsResponse })
  totals!: UsageTotalsResponse;

  @ApiProperty({ type: [ServiceTotalsResponse] })
  byService!: ServiceTotalsResponse[];

  @ApiProperty({ type: [DayTotalsResponse] })
  byDay!: DayTotalsResponse[];

  @ApiProperty({ type: QuotaResponse })
  quota!: QuotaResponse;
}

export class UsageRowResponse extends UsageTotalsResponse {
  @ApiProperty({ example: '2026-11-09', description: 'UTC day' })
  date!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  serviceName!: string;
}

export class SessionRowResponse {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  messageCount!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  lastActivityAt!: Date;
}

export class ReportMessageResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT'] })
  role!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ nullable: true, description: 'Catalog items cited by the answer' })
  sources!: unknown;

  @ApiProperty({ type: Number, nullable: true })
  inputTokens!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  outputTokens!: number | null;

  @ApiProperty()
  createdAt!: Date;
}

export class SessionMessagesResponse {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: [ReportMessageResponse] })
  messages!: ReportMessageResponse[];
}
