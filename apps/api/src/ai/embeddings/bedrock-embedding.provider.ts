import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider, EmbeddingResult } from './embedding-provider';

export const EMBEDDING_DIMENSIONS = 1024;
const DEFAULT_EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

interface TitanEmbeddingResponse {
  embedding?: number[];
  inputTextTokenCount?: number;
}

@Injectable()
export class BedrockEmbeddingProvider extends EmbeddingProvider {
  private readonly logger = new Logger(BedrockEmbeddingProvider.name);
  private client?: BedrockRuntimeClient;

  constructor(private readonly config: ConfigService) {
    super();
  }

  override async embed(text: string): Promise<EmbeddingResult> {
    try {
      const response = await this.getClient().send(
        new InvokeModelCommand({
          modelId: this.config.get<string>('BEDROCK_EMBEDDING_MODEL_ID') || DEFAULT_EMBEDDING_MODEL_ID,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({ inputText: text, dimensions: EMBEDDING_DIMENSIONS, normalize: true }),
        }),
      );
      const parsed = JSON.parse(new TextDecoder().decode(response.body)) as TitanEmbeddingResponse;
      if (
        !Array.isArray(parsed.embedding) ||
        parsed.embedding.length !== EMBEDDING_DIMENSIONS ||
        parsed.inputTextTokenCount === undefined
      ) {
        throw new Error('InvalidEmbeddingResponse');
      }
      return { embedding: parsed.embedding, inputTokens: parsed.inputTextTokenCount };
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Embedding invocation failed: ${reason}`);
      throw new ServiceUnavailableException('The AI model is temporarily unavailable');
    }
  }

  private getClient(): BedrockRuntimeClient {
    if (!this.client) {
      const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
      this.client = new BedrockRuntimeClient({
        region: this.config.get<string>('AWS_REGION') || 'us-east-2',
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
      });
    }
    return this.client;
  }
}
