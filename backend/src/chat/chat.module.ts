import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GroqModule } from '../groq/groq.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [GroqModule, KnowledgeBaseModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
