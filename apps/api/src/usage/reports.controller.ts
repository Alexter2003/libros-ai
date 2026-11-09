import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AllowApiKey } from '../auth/decorators/allow-api-key.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SessionReportQuery, UsageReportQuery } from './dto/report.query';
import { parseRange } from './usage-aggregation';
import { SessionMessagesResponse, SessionRowResponse, UsageRowResponse } from './usage.responses';
import { UsageService } from './usage.service';

@ApiTags('reports')
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly usage: UsageService) {}

  @Get('usage')
  @AllowApiKey()
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @ApiOperation({
    summary:
      'Usage rows per day, user and AI service (admin token or API key). Days are UTC; from/to are inclusive.',
  })
  usageRows(@Query() query: UsageReportQuery): Promise<UsageRowResponse[]> {
    return this.usage.usageRows({
      userId: query.userId,
      serviceId: query.serviceId,
      range: parseRange(query.from, query.to),
    });
  }

  @Get('chat-sessions')
  @AllowApiKey()
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Chat session metadata of all users, without message content (admin token or API key)',
  })
  sessions(@Query() query: SessionReportQuery): Promise<SessionRowResponse[]> {
    return this.usage.sessionRows({ userId: query.userId, range: parseRange(query.from, query.to) });
  }

  @Get('chat-sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read the messages of any chat session (admin token only)' })
  session(@Param('id', ParseUUIDPipe) id: string): Promise<SessionMessagesResponse> {
    return this.usage.sessionMessages(id);
  }
}
