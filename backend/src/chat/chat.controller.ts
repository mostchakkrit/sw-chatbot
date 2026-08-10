import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService, ESCALATION_MESSAGE } from './chat.service';

interface ChatRequestBody {
  conversationId?: string;
  customerIdentifier: string;
  message: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestBody, @Res() res: Response) {
    const { conversationId, customerIdentifier, message } = body;
    if (!customerIdentifier || !message) {
      throw new BadRequestException('customerIdentifier and message are required');
    }

    const conversation = await this.chatService.getOrCreateConversation(conversationId, customerIdentifier);
    await this.chatService.recordCustomerMessage(conversation.id, message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: start\ndata: ${JSON.stringify({ conversationId: conversation.id })}\n\n`);

    try {
      const { chunks, sufficient } = await this.chatService.retrieveContext(message);

      if (!sufficient) {
        await this.chatService.escalate(conversation.id, 'low knowledge-base similarity');
        await this.chatService.recordBotMessage(conversation.id, ESCALATION_MESSAGE);
        res.write(`data: ${JSON.stringify({ text: ESCALATION_MESSAGE })}\n\n`);
        res.write(`event: escalate\ndata: ${JSON.stringify({})}\n\n`);
        res.write(`event: end\ndata: ${JSON.stringify({})}\n\n`);
        return;
      }

      const history = await this.chatService.buildHistory(conversation.id);
      let fullText = '';
      for await (const chunk of this.chatService.streamReply(history, chunks)) {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      await this.chatService.recordBotMessage(conversation.id, fullText, chunks);
      res.write(`event: end\ndata: ${JSON.stringify({})}\n\n`);
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
