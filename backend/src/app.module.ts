import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ChatModule, KnowledgeBaseModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
