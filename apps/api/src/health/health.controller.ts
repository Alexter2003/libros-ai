import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthReport, HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Service and database health' })
  async get(): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status === 'error') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
