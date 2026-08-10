import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';

export interface RetrievedChunk {
  id: string;
  content: string;
  category: string | null;
  distance: number;
}

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async addEntry(content: string, category?: string, createdBy?: string) {
    const embedding = await this.embeddingService.embed(content);
    const vectorLiteral = toVectorLiteral(embedding);
    const id = randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO knowledge_base (id, content, embedding, category, created_by, updated_at)
      VALUES (${id}, ${content}, ${vectorLiteral}::vector, ${category ?? null}, ${createdBy ?? null}, now())
    `;

    return { id, content, category: category ?? null };
  }

  async search(query: string, topK = 3): Promise<RetrievedChunk[]> {
    const embedding = await this.embeddingService.embed(query);
    const vectorLiteral = toVectorLiteral(embedding);

    return this.prisma.$queryRaw<RetrievedChunk[]>`
      SELECT id, content, category, embedding <=> ${vectorLiteral}::vector AS distance
      FROM knowledge_base
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `;
  }
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
