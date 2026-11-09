import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AgentTool, ToolInputError, readText } from '../../src/agents/agent-tool';
import { ModelStep, runAgentLoop } from '../../src/agents/agent-loop';
import { ConversationResult } from '../../src/ai/providers/model-provider';
import { answerTurn, call, toolTurn } from '../support/model-turns';

function echoTool(run?: AgentTool['run']): AgentTool {
  return {
    definition: { name: 'echo', description: 'Echoes the text', inputSchema: { type: 'object' } },
    run: run ?? ((input) => Promise.resolve(readText(input, 'text'))),
  };
}

function scripted(...turns: ConversationResult[]) {
  const step = vi.fn<ModelStep>();
  for (const turn of turns) step.mockResolvedValueOnce(turn);
  return step;
}

describe('agent loop', () => {
  it('runs a requested tool, feeds the result back and finishes with the answer', async () => {
    const step = scripted(toolTurn(call('echo', { text: 'hola' })), answerTurn('listo'));

    const result = await runAgentLoop({ step, tools: [echoTool()], prompt: 'go' });

    expect(result).toEqual({ text: 'listo', inputTokens: 30, outputTokens: 13 });
    const secondCall = step.mock.calls[1]?.[0] ?? [];
    expect(secondCall.at(-1)).toEqual({
      role: 'user',
      content: [{ kind: 'toolResult', result: { toolUseId: 'echo-1', text: 'hola', isError: false } }],
    });
  });

  it('answers immediately when the model does not need a tool', async () => {
    const step = scripted(answerTurn('directo'));

    const result = await runAgentLoop({ step, tools: [echoTool()], prompt: 'go' });

    expect(result.text).toBe('directo');
    expect(step).toHaveBeenCalledOnce();
  });

  it('reports an unknown tool to the model and continues', async () => {
    const step = scripted(toolTurn(call('missing')), answerTurn('ok'));

    const result = await runAgentLoop({ step, tools: [echoTool()], prompt: 'go' });

    expect(result.text).toBe('ok');
    const fed = step.mock.calls[1]?.[0].at(-1)?.content[0];
    expect(fed).toMatchObject({ kind: 'toolResult', result: { isError: true } });
  });

  it('reports invalid tool input as an error result', async () => {
    const step = scripted(toolTurn(call('echo', { text: '   ' })), answerTurn('ok'));

    await runAgentLoop({ step, tools: [echoTool()], prompt: 'go' });

    const fed = step.mock.calls[1]?.[0].at(-1)?.content[0];
    expect(fed).toMatchObject({ kind: 'toolResult', result: { isError: true } });
  });

  it('hides unexpected tool failures behind a generic error result', async () => {
    const failing = echoTool(() => Promise.reject(new ServiceUnavailableException('secret detail')));
    const step = scripted(toolTurn(call('echo', { text: 'x' })), answerTurn('ok'));

    await runAgentLoop({ step, tools: [failing], prompt: 'go' });

    const fed = step.mock.calls[1]?.[0].at(-1)?.content[0];
    expect(fed).toMatchObject({ result: { isError: true, text: 'The tool is temporarily unavailable' } });
  });

  it('stops at the step limit and reports no final text', async () => {
    const step = vi.fn<ModelStep>().mockResolvedValue(toolTurn(call('echo', { text: 'again' })));

    const result = await runAgentLoop({ step, tools: [echoTool()], prompt: 'go', maxSteps: 3 });

    expect(result).toEqual({ text: null, inputTokens: 30, outputTokens: 15 });
    expect(step).toHaveBeenCalledTimes(3);
  });

  it('lets an error from the model step propagate', async () => {
    const step = vi.fn<ModelStep>().mockRejectedValue(new ServiceUnavailableException());

    await expect(runAgentLoop({ step, tools: [echoTool()], prompt: 'go' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

describe('readText', () => {
  it('trims valid text and rejects empty, oversized or missing values', () => {
    expect(readText({ q: '  dune ' }, 'q')).toBe('dune');
    expect(() => readText({ q: '' }, 'q')).toThrow(ToolInputError);
    expect(() => readText({ q: 'x'.repeat(201) }, 'q')).toThrow(ToolInputError);
    expect(() => readText({}, 'q')).toThrow(ToolInputError);
    expect(() => readText('nope', 'q')).toThrow(ToolInputError);
  });
});
