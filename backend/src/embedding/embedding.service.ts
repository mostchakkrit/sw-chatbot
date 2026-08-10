import { Injectable, OnModuleInit } from '@nestjs/common';
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private extractor!: FeatureExtractionPipeline;

  async onModuleInit() {
    this.extractor = (await pipeline('feature-extraction', MODEL_ID)) as FeatureExtractionPipeline;
  }

  async embed(text: string): Promise<number[]> {
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  }
}
