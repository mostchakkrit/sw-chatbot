import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface ConversationMessageEvent {
  sender: 'admin';
  content: string;
  createdAt: string;
}

@Injectable()
export class ChatEventsService {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  publish(conversationId: string, event: ConversationMessageEvent): void {
    this.emitter.emit(conversationId, event);
  }

  subscribe(conversationId: string, listener: (event: ConversationMessageEvent) => void): () => void {
    this.emitter.on(conversationId, listener);
    return () => this.emitter.off(conversationId, listener);
  }
}
