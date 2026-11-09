import {
  BedrockRuntimeClient,
  ContentBlock as BedrockContentBlock,
  ConverseCommand,
  ConverseCommandInput,
  ConverseCommandOutput,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContentBlock,
  ConversationMessage,
  ConversationRequest,
  ConversationResult,
  GenerationRequest,
  GenerationResult,
  JsonValue,
  ModelProvider,
  ToolCall,
} from './model-provider';

interface ModelCall {
  response: ConverseCommandOutput;
  inputTokens: number;
  outputTokens: number;
}

function toBedrockBlock(block: ContentBlock): BedrockContentBlock {
  switch (block.kind) {
    case 'text':
      return { text: block.text };
    case 'toolUse':
      return { toolUse: { toolUseId: block.call.toolUseId, name: block.call.name, input: block.call.input } };
    case 'toolResult':
      return {
        toolResult: {
          toolUseId: block.result.toolUseId,
          content: [{ text: block.result.text }],
          status: block.result.isError ? 'error' : 'success',
        },
      };
  }
}

function toBedrockMessage(message: ConversationMessage): Message {
  return { role: message.role, content: message.content.map(toBedrockBlock) };
}

function fromBedrockBlocks(blocks: BedrockContentBlock[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  for (const block of blocks) {
    if (block.text) {
      result.push({ kind: 'text', text: block.text });
    } else if (block.toolUse?.toolUseId && block.toolUse.name) {
      const call: ToolCall = {
        toolUseId: block.toolUse.toolUseId,
        name: block.toolUse.name,
        input: (block.toolUse.input ?? {}) as JsonValue,
      };
      result.push({ kind: 'toolUse', call });
    }
  }
  return result;
}

@Injectable()
export class BedrockModelProvider extends ModelProvider {
  private readonly logger = new Logger(BedrockModelProvider.name);
  private client?: BedrockRuntimeClient;

  constructor(private readonly config: ConfigService) {
    super();
  }

  override async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { response, inputTokens, outputTokens } = await this.invoke({
      modelId: request.modelId,
      messages: [{ role: 'user', content: [{ text: request.prompt }] }],
      inferenceConfig: this.inferenceConfig(request),
    });
    const text = (response.output?.message?.content ?? []).map((block) => block.text ?? '').join('');
    return { text, inputTokens, outputTokens };
  }

  override async converse(request: ConversationRequest): Promise<ConversationResult> {
    const { response, inputTokens, outputTokens } = await this.invoke({
      modelId: request.modelId,
      ...(request.system ? { system: [{ text: request.system }] } : {}),
      messages: request.messages.map(toBedrockMessage),
      ...(request.tools.length > 0
        ? {
            toolConfig: {
              tools: request.tools.map((tool) => ({
                toolSpec: {
                  name: tool.name,
                  description: tool.description,
                  inputSchema: { json: tool.inputSchema },
                },
              })),
            },
          }
        : {}),
      inferenceConfig: this.inferenceConfig(request),
    });
    const content = fromBedrockBlocks(response.output?.message?.content ?? []);
    const text = content.map((block) => (block.kind === 'text' ? block.text : '')).join('');
    const toolCalls = content.flatMap((block) => (block.kind === 'toolUse' ? [block.call] : []));
    return { message: { role: 'assistant', content }, text, toolCalls, inputTokens, outputTokens };
  }

  private async invoke(input: ConverseCommandInput): Promise<ModelCall> {
    try {
      const response = await this.getClient().send(new ConverseCommand(input));
      const usage = response.usage;
      if (usage?.inputTokens === undefined || usage.outputTokens === undefined) {
        throw new Error('MissingUsage');
      }
      return { response, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens };
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Model invocation failed: ${reason}`);
      throw new ServiceUnavailableException('The AI model is temporarily unavailable');
    }
  }

  private inferenceConfig(request: { maxOutputTokens?: number; temperature?: number }) {
    return {
      ...(request.maxOutputTokens !== undefined ? { maxTokens: request.maxOutputTokens } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
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
