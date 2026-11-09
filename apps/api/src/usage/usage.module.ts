import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ReportsController } from './reports.controller';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [AiModule],
  controllers: [UsageController, ReportsController],
  providers: [UsageService],
})
export class UsageModule {}
