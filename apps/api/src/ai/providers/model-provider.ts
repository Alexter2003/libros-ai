export interface GenerationRequest {
  modelId: string;
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: { [key: string]: JsonValue };
}

export interface ToolCall {
  toolUseId: string;
  name: string;
  input: JsonValue;
}

export interface ToolResult {
  toolUseId: string;
  text: string;
  isError: boolean;
}

export type ContentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'toolUse'; call: ToolCall }
  | { kind: 'toolResult'; result: ToolResult };

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: ContentBlock[];
}

export interface ConversationRequest {
  modelId: string;
  system?: string;
  messages: ConversationMessage[];
  tools: ToolDefinition[];
  maxOutputTokens?: number;
  temperature?: number;
}

export interface ConversationResult {
  message: ConversationMessage;
  text: string;
  toolCalls: ToolCall[];
  inputTokens: number;
  outputTokens: number;
}

export abstract class ModelProvider {
  abstract generate(request: GenerationRequest): Promise<GenerationResult>;
  abstract converse(request: ConversationRequest): Promise<ConversationResult>;
}
