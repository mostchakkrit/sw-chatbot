import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatEventsModule } from '../chat/chat-events.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsService } from './conversations/conversations.service';
import { FaqsController } from './faqs/faqs.controller';
import { StatsController } from './stats/stats.controller';
import { StatsService } from './stats/stats.service';

@Module({
  imports: [
    PrismaModule,
    ChatEventsModule,
    KnowledgeBaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController, ConversationsController, FaqsController, StatsController],
  providers: [AuthService, JwtAuthGuard, ConversationsService, StatsService],
})
export class AdminModule {}
