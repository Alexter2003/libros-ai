export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export function totalTokens(usage: TokenUsage): number {
  return usage.inputTokens + usage.outputTokens;
}

export function sumTokens(events: readonly TokenUsage[]): number {
  return events.reduce((sum, event) => sum + totalTokens(event), 0);
}

export function hasReachedLimit(consumed: number, limit: number | null): boolean {
  return limit !== null && consumed >= limit;
}

export function remainingTokens(consumed: number, limit: number | null): number | null {
  return limit === null ? null : Math.max(limit - consumed, 0);
}
