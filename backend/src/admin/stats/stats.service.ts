import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DAILY_TREND_DAYS = 14;

interface StatusCount {
  status: string;
  count: bigint;
}

interface DailyCount {
  day: Date;
  count: bigint;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const trendStart = new Date(now.getTime() - (DAILY_TREND_DAYS - 1) * 24 * 60 * 60 * 1000);
    trendStart.setUTCHours(0, 0, 0, 0);

    const [statusCounts, totalMessages, last24h, prior24h, dailyRows] = await Promise.all([
      this.prisma.$queryRaw<StatusCount[]>`
        SELECT status, COUNT(*) AS count FROM conversations GROUP BY status
      `,
      this.prisma.message.count(),
      this.prisma.conversation.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.conversation.count({ where: { createdAt: { gte: twoDaysAgo, lt: dayAgo } } }),
      this.prisma.$queryRaw<DailyCount[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
        FROM conversations
        WHERE created_at >= ${trendStart}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.count)]));
    const totalConversations = statusCounts.reduce((sum, s) => sum + Number(s.count), 0);

    const dailyMap = new Map(dailyRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
    const dailyConversations = Array.from({ length: DAILY_TREND_DAYS }, (_, i) => {
      const d = new Date(trendStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      return { date: key, count: dailyMap.get(key) ?? 0 };
    });

    return {
      totals: {
        conversations: totalConversations,
        messages: totalMessages,
        botHandling: statusMap['bot_handling'] ?? 0,
        escalated: statusMap['escalated'] ?? 0,
        resolved: statusMap['resolved'] ?? 0,
      },
      last24h: {
        conversations: last24h,
        previousConversations: prior24h,
      },
      statusBreakdown: ['bot_handling', 'escalated', 'resolved'].map((status) => ({
        status,
        count: statusMap[status] ?? 0,
        percent: totalConversations > 0 ? Math.round(((statusMap[status] ?? 0) / totalConversations) * 1000) / 10 : 0,
      })),
      dailyConversations,
    };
  }
}
