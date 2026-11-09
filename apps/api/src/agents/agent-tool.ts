import { JsonValue, ToolDefinition } from '../ai/providers/model-provider';
import { MAX_TOOL_TEXT_CHARS } from './agents.constants';

export interface AgentTool {
  definition: ToolDefinition;
  run(input: JsonValue): Promise<string>;
}

export class ToolInputError extends Error {}

export function readText(input: JsonValue, key: string, maxChars: number = MAX_TOOL_TEXT_CHARS): string {
  const value = typeof input === 'object' && input !== null && !Array.isArray(input) ? input[key] : undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0 || text.length > maxChars) {
    throw new ToolInputError(`"${key}" must be a text of 1 to ${maxChars} characters`);
  }
  return text;
}
