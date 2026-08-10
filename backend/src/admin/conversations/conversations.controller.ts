import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, AdminPayload } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';

@Controller('admin/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.conversationsService.list(status);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.conversationsService.getById(id);
  }

  @Post(':id/reply')
  reply(@Param('id') id: string, @Body('content') content: string, @Req() req: Request & { admin?: AdminPayload }) {
    if (!content?.trim()) {
      throw new BadRequestException('content is required');
    }
    return this.conversationsService.reply(id, content.trim(), req.admin!.sub);
  }
}
