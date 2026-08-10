import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';

interface CreateFaqBody {
  content: string;
  category?: string;
}

@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBase: KnowledgeBaseService) {}

  @Post()
  async create(@Body() body: CreateFaqBody) {
    if (!body.content) throw new BadRequestException('content is required');
    return this.knowledgeBase.addEntry(body.content, body.category);
  }
}
