import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ItemsModule,
    AiModule,
    ChatModule,
    AgentsModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
