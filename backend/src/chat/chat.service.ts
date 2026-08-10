import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, ChatTurn } from '../groq/groq.service';
import { KnowledgeBaseService, RetrievedChunk } from '../knowledge-base/knowledge-base.service';

const SIMILARITY_DISTANCE_THRESHOLD = 0.75;
const TOP_K = 3;

const SYSTEM_PROMPT_TEMPLATE = (context: string) => `คุณเป็นผู้ช่วยฝ่ายบริการลูกค้าของร้านค้าที่ขายหูฟังไร้สาย
ตอบคำถามลูกค้าโดยอ้างอิงจากข้อมูลต่อไปนี้เท่านั้น ห้ามเดาหรือแต่งข้อมูลเพิ่มเอง
ตอบเป็นภาษาไทย กระชับ สุภาพ

ข้อมูลอ้างอิง:
${context}`;

export const ESCALATION_MESSAGE =
  'ขอโทษด้วยค่ะ ดิฉันไม่มีข้อมูลเพียงพอที่จะตอบคำถามนี้ กำลังส่งต่อให้เจ้าหน้าที่ช่วยดูแลต่อนะคะ รอสักครู่ค่ะ';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly knowledgeBase: KnowledgeBaseService,
  ) {}

  async getOrCreateConversation(conversationId: string | undefined, customerIdentifier: string) {
    if (conversationId) {
      const existing = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
      if (existing) return existing;
    }
    return this.prisma.conversation.create({ data: { customerIdentifier } });
  }

  async recordCustomerMessage(conversationId: string, content: string) {
    return this.prisma.message.create({
      data: { conversationId, sender: 'customer', content },
    });
  }

  async recordBotMessage(conversationId: string, content: string, retrievedContext?: RetrievedChunk[]) {
    return this.prisma.message.create({
      data: {
        conversationId,
        sender: 'bot',
        content,
        retrievedContext: (retrievedContext as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async buildHistory(conversationId: string): Promise<ChatTurn[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, sender: { in: ['customer', 'bot'] } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    return messages.map((m) => ({
      role: m.sender === 'customer' ? 'user' : 'model',
      text: m.content,
    }));
  }

  async retrieveContext(question: string): Promise<{ chunks: RetrievedChunk[]; sufficient: boolean }> {
    const chunks = await this.knowledgeBase.search(question, TOP_K);
    const sufficient = chunks.length > 0 && chunks[0].distance <= SIMILARITY_DISTANCE_THRESHOLD;
    return { chunks, sufficient };
  }

  async escalate(conversationId: string, reason: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'escalated' },
    });
    return this.prisma.escalation.create({
      data: { conversationId, reason },
    });
  }

  streamReply(history: ChatTurn[], contextChunks: RetrievedChunk[]) {
    const context = contextChunks.map((c, i) => `${i + 1}. ${c.content}`).join('\n');
    return this.groq.streamReply(history, SYSTEM_PROMPT_TEMPLATE(context));
  }
}
