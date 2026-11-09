import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class RangeQuery {
  @ApiPropertyOptional({ example: '2026-11-01', description: 'First day included (UTC, ISO date)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'Last day included (UTC, ISO date)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class UsageReportQuery extends RangeQuery {
  @ApiPropertyOptional({ description: 'Only rows of this user' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Only rows of this AI service' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}

export class SessionReportQuery extends RangeQuery {
  @ApiPropertyOptional({ description: 'Only sessions of this user' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
