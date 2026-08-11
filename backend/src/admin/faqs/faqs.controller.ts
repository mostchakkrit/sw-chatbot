import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';

interface FaqBody {
  question?: string;
  content?: string;
  category?: string | null;
}

@Controller('admin/faqs')
@UseGuards(JwtAuthGuard)
export class FaqsController {
  constructor(private readonly knowledgeBase: KnowledgeBaseService) {}

  @Get()
  list() {
    return this.knowledgeBase.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.knowledgeBase.getById(id);
  }

  @Post()
  create(@Body() body: FaqBody) {
    if (!body.content?.trim()) {
      throw new BadRequestException('content (คำตอบ) is required');
    }
    return this.knowledgeBase.addEntry(
      body.content.trim(),
      body.category?.trim() || undefined,
      undefined,
      body.question?.trim() || undefined,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: FaqBody) {
    return this.knowledgeBase.update(id, {
      question: body.question !== undefined ? body.question.trim() || null : undefined,
      content: body.content !== undefined ? body.content.trim() : undefined,
      category: body.category !== undefined ? body.category?.trim() || null : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeBase.remove(id);
  }
}
