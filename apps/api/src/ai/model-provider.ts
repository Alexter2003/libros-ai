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

export abstract class ModelProvider {
  abstract generate(request: GenerationRequest): Promise<GenerationResult>;
}
