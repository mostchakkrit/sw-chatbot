import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../../chat/chat-events.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatEvents: ChatEventsService,
  ) {}

  async list(status?: string) {
    return this.prisma.conversation.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getById(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        escalations: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!conversation) throw new NotFoundException('conversation not found');
    return conversation;
  }

  async reply(id: string, content: string, adminId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('conversation not found');

    const message = await this.prisma.message.create({
      data: { conversationId: id, sender: 'admin', content },
    });
    this.chatEvents.publish(id, {
      sender: 'admin',
      content,
      createdAt: message.createdAt.toISOString(),
    });

    await this.prisma.conversation.update({
      where: { id },
      data: { status: 'resolved' },
    });

    const openEscalation = await this.prisma.escalation.findFirst({
      where: { conversationId: id, resolvedBy: null },
      orderBy: { createdAt: 'desc' },
    });
    if (openEscalation) {
      await this.prisma.escalation.update({
        where: { id: openEscalation.id },
        data: { resolvedBy: adminId },
      });
    }

    return this.getById(id);
  }
}
