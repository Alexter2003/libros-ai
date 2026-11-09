import { Logger } from '@nestjs/common';
import {
  ConversationMessage,
  ConversationResult,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from '../ai/providers/model-provider';
import { AgentTool, ToolInputError } from './agent-tool';
import { MAX_AGENT_STEPS } from './agents.constants';

export type ModelStep = (messages: ConversationMessage[], tools: ToolDefinition[]) => Promise<ConversationResult>;

export interface AgentLoopInput {
  step: ModelStep;
  tools: AgentTool[];
  prompt: string;
  maxSteps?: number;
}

export interface AgentLoopResult {
  text: string | null;
  inputTokens: number;
  outputTokens: number;
}

const logger = new Logger('AgentLoop');

async function runTool(tools: AgentTool[], call: ToolCall): Promise<ToolResult> {
  const tool = tools.find((candidate) => candidate.definition.name === call.name);
  if (!tool) {
    return { toolUseId: call.toolUseId, text: `Unknown tool "${call.name}"`, isError: true };
  }
  try {
    return { toolUseId: call.toolUseId, text: await tool.run(call.input), isError: false };
  } catch (error) {
    if (error instanceof ToolInputError) {
      return { toolUseId: call.toolUseId, text: error.message, isError: true };
    }
    logger.warn(`Tool ${call.name} failed: ${error instanceof Error ? error.name : 'UnknownError'}`);
    return { toolUseId: call.toolUseId, text: 'The tool is temporarily unavailable', isError: true };
  }
}

export async function runAgentLoop(input: AgentLoopInput): Promise<AgentLoopResult> {
  const { step, tools, prompt, maxSteps = MAX_AGENT_STEPS } = input;
  const definitions = tools.map((tool) => tool.definition);
  const messages: ConversationMessage[] = [{ role: 'user', content: [{ kind: 'text', text: prompt }] }];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let current = 0; current < maxSteps; current += 1) {
    const result = await step(messages, definitions);
    inputTokens += result.inputTokens;
    outputTokens += result.outputTokens;
    if (result.toolCalls.length === 0) {
      return { text: result.text, inputTokens, outputTokens };
    }
    const results: ToolResult[] = [];
    for (const call of result.toolCalls) {
      results.push(await runTool(tools, call));
    }
    messages.push(result.message, {
      role: 'user',
      content: results.map((toolResult) => ({ kind: 'toolResult', result: toolResult })),
    });
  }
  return { text: null, inputTokens, outputTokens };
}
