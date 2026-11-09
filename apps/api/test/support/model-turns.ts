import { ConversationResult, ToolCall } from '../../src/ai/providers/model-provider';

export function call(name: string, input: ToolCall['input'] = {}, toolUseId = `${name}-1`): ToolCall {
  return { toolUseId, name, input };
}

export function toolTurn(...calls: ToolCall[]): ConversationResult {
  return {
    message: { role: 'assistant', content: calls.map((toolCall) => ({ kind: 'toolUse', call: toolCall })) },
    text: '',
    toolCalls: calls,
    inputTokens: 10,
    outputTokens: 5,
  };
}

export function answerTurn(text: string): ConversationResult {
  return {
    message: { role: 'assistant', content: [{ kind: 'text', text }] },
    text,
    toolCalls: [],
    inputTokens: 20,
    outputTokens: 8,
  };
}
