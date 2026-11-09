export interface EmbeddingResult {
  embedding: number[];
  inputTokens: number;
}

export abstract class EmbeddingProvider {
  abstract embed(text: string): Promise<EmbeddingResult>;
}
