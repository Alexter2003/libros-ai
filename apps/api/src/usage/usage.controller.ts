import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponse } from '../users/user.response';
import { RangeQuery } from './dto/report.query';
import { parseRange } from './usage-aggregation';
import { OwnUsageResponse } from './usage.responses';
import { UsageService } from './usage.service';

@ApiTags('usage')
@ApiBearerAuth()
@Controller('usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get('me')
  @ApiOperation({
    summary: 'My token consumption: totals, quota, per service and per day (UTC days)',
  })
  me(@CurrentUser() actor: UserResponse, @Query() query: RangeQuery): Promise<OwnUsageResponse> {
    return this.usage.own(actor.id, parseRange(query.from, query.to));
  }
}
