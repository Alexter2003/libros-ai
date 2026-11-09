import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AgentsController } from './agents.controller';
import { ReadingOrderService } from './reading-order.service';
import { RecommenderService } from './recommender.service';

@Module({
  imports: [AiModule],
  controllers: [AgentsController],
  providers: [RecommenderService, ReadingOrderService],
})
export class AgentsModule {}
