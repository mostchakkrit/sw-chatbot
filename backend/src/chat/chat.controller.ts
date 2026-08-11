import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatService, ESCALATION_MESSAGE } from './chat.service';
import { ChatEventsService } from './chat-events.service';

interface ChatRequestBody {
  conversationId?: string;
  customerIdentifier: string;
  message: string;
}

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatEvents: ChatEventsService,
  ) {}

  @Get(':conversationId/history')
  async history(
    @Param('conversationId') conversationId: string,
    @Query('customerIdentifier') customerIdentifier: string,
  ) {
    if (!customerIdentifier) {
      throw new BadRequestException('customerIdentifier is required');
    }
    const history = await this.chatService.getHistory(conversationId, customerIdentifier);
    if (!history) throw new NotFoundException('conversation not found');
    return history;
  }

  @Get(':conversationId/stream')
  subscribe(@Param('conversationId') conversationId: string, @Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = this.chatEvents.subscribe(conversationId, (event) => {
      res.write(`event: admin-message\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  }

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
      const reply = await this.chatService.streamReply(history, chunks);
      for await (const chunk of reply) {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      if (!fullText.trim()) {
        await this.chatService.escalate(conversation.id, 'empty completion from model');
        await this.chatService.recordBotMessage(conversation.id, ESCALATION_MESSAGE);
        res.write(`data: ${JSON.stringify({ text: ESCALATION_MESSAGE })}\n\n`);
        res.write(`event: escalate\ndata: ${JSON.stringify({})}\n\n`);
        res.write(`event: end\ndata: ${JSON.stringify({})}\n\n`);
        return;
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
