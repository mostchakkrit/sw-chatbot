import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class GroqService {
  private readonly client: Groq;
  private readonly chatModel: string;

  constructor(configService: ConfigService) {
    this.client = new Groq({ apiKey: configService.get<string>('GROQ_API_KEY') });
    // llama-3.3-70b-versatile to openai/gpt-oss-20b
    this.chatModel = configService.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-20b';
  }

  async *streamReply(history: ChatTurn[], systemPrompt?: string): AsyncGenerator<string> {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push(
      ...history.map((turn) => ({
        role: (turn.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: turn.text,
      })),
    );

    const stream = await this.client.chat.completions.create({
      model: this.chatModel,
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}
