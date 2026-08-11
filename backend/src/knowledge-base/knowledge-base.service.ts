import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';

export interface RetrievedChunk {
  id: string;
  question: string | null;
  content: string;
  category: string | null;
  distance: number;
}

export interface FaqEntry {
  id: string;
  question: string | null;
  content: string;
  category: string | null;
  updatedAt: Date;
}

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async list(): Promise<FaqEntry[]> {
    return this.prisma.$queryRaw<FaqEntry[]>`
      SELECT id, question, content, category, updated_at AS "updatedAt"
      FROM knowledge_base
      ORDER BY updated_at DESC
    `;
  }

  async getById(id: string): Promise<FaqEntry> {
    const [entry] = await this.prisma.$queryRaw<FaqEntry[]>`
      SELECT id, question, content, category, updated_at AS "updatedAt"
      FROM knowledge_base
      WHERE id = ${id}
    `;
    if (!entry) throw new NotFoundException('faq not found');
    return entry;
  }

  async addEntry(content: string, category?: string, createdBy?: string, question?: string) {
    const embedding = await this.embeddingService.embed(question || content);
    const vectorLiteral = toVectorLiteral(embedding);
    const id = randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO knowledge_base (id, question, content, embedding, category, created_by, updated_at)
      VALUES (${id}, ${question ?? null}, ${content}, ${vectorLiteral}::vector, ${category ?? null}, ${createdBy ?? null}, now())
    `;

    return { id, question: question ?? null, content, category: category ?? null };
  }

  async update(id: string, input: { content?: string; category?: string | null; question?: string | null }) {
    const existing = await this.getById(id);
    const nextQuestion = input.question !== undefined ? input.question : existing.question;
    const nextContent = input.content !== undefined ? input.content : existing.content;
    const nextCategory = input.category !== undefined ? input.category : existing.category;

    const embedding = await this.embeddingService.embed(nextQuestion || nextContent);
    const vectorLiteral = toVectorLiteral(embedding);

    await this.prisma.$executeRaw`
      UPDATE knowledge_base
      SET question = ${nextQuestion}, content = ${nextContent}, category = ${nextCategory}, embedding = ${vectorLiteral}::vector, updated_at = now()
      WHERE id = ${id}
    `;

    return { id, question: nextQuestion ?? null, content: nextContent, category: nextCategory ?? null };
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.$executeRaw`DELETE FROM knowledge_base WHERE id = ${id}`;
  }

  async search(query: string, topK = 3): Promise<RetrievedChunk[]> {
    const embedding = await this.embeddingService.embed(query);
    const vectorLiteral = toVectorLiteral(embedding);

    return this.prisma.$queryRaw<RetrievedChunk[]>`
      SELECT id, question, content, category, embedding <=> ${vectorLiteral}::vector AS distance
      FROM knowledge_base
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `;
  }
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
