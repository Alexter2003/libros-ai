import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerationRequest, GenerationResult, ModelProvider } from './model-provider';

@Injectable()
export class BedrockModelProvider extends ModelProvider {
  private readonly logger = new Logger(BedrockModelProvider.name);
  private client?: BedrockRuntimeClient;

  constructor(private readonly config: ConfigService) {
    super();
  }

  override async generate(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await this.getClient().send(new ConverseCommand(this.buildInput(request)));
      const usage = response.usage;
      if (usage?.inputTokens === undefined || usage.outputTokens === undefined) {
        throw new Error('MissingUsage');
      }
      const text = (response.output?.message?.content ?? []).map((block) => block.text ?? '').join('');
      return { text, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens };
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Model invocation failed: ${reason}`);
      throw new ServiceUnavailableException('The AI model is temporarily unavailable');
    }
  }

  private buildInput(request: GenerationRequest): ConverseCommandInput {
    return {
      modelId: request.modelId,
      messages: [{ role: 'user', content: [{ text: request.prompt }] }],
      inferenceConfig: {
        ...(request.maxOutputTokens !== undefined ? { maxTokens: request.maxOutputTokens } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      },
    };
  }

  private getClient(): BedrockRuntimeClient {
    if (!this.client) {
      const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
      this.client = new BedrockRuntimeClient({
        region: this.config.get<string>('AWS_REGION') || 'us-east-2',
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      });
    }
    return this.client;
  }
}
