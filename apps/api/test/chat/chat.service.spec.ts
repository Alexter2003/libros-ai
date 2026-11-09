import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiServicesService } from '../../src/ai/ai-services/ai-services.service';
import { EmbeddingsService, SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { GatewayService } from '../../src/ai/gateway/gateway.service';
import { ModelProvider } from '../../src/ai/providers/model-provider';
import { TokenQuotaService } from '../../src/ai/token-quota/token-quota.service';
import { ChatService } from '../../src/chat/chat.service';
import { NOT_ENOUGH_INFORMATION_ANSWER } from '../../src/chat/rag.constants';
import { FakePrisma } from '../support/fake-prisma';
import { fakeProvider } from '../support/fake-model-provider';

function item(score: number): SimilarItem {
  return {
    id: 'item-1',
    title: 'Watchmen',
    author: 'Alan Moore',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 1986,
    series: null,
    synopsis: 'Retired heroes investigate a murder.',
    score,
  };
}

async function setup(options: { score?: number; generate?: ModelProvider['generate'] } = {}) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', null);
  prisma.addUser('u2', null);
  const services = new AiServicesService(prisma.asPrisma());
  const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
  const quota = new TokenQuotaService(prisma.asPrisma());
  const generate =
    options.generate ??
    vi.fn<ModelProvider['generate']>().mockResolvedValue({ text: 'Watchmen es un cómic.', inputTokens: 40, outputTokens: 12 });
  const gateway = new GatewayService(services, quota, fakeProvider({ generate }));
  const embeddings = {
    embedQuery: vi.fn().mockResolvedValue([0.1]),
    search: vi.fn().mockResolvedValue([item(options.score ?? 0.8)]),
  } as unknown as EmbeddingsService;
  const chat = new ChatService(prisma.asPrisma(), services, quota, embeddings, gateway);
  return { prisma, service, chat, generate };
}

describe('chat history: register', () => {
  it('stores the user message and the assistant answer with sources and tokens', async () => {
    const { prisma, service, chat } = await setup();

    const answer = await chat.send('u1', { message: 'Tell me about Watchmen', serviceId: service.id });

    expect(answer).toMatchObject({ grounded: true, inputTokens: 40, outputTokens: 12 });
    const session = await chat.getSession('u1', answer.sessionId);
    expect(session.messages.map((message) => message.role)).toEqual(['USER', 'ASSISTANT']);
    expect(session.messages.at(1)).toMatchObject({ inputTokens: 40, outputTokens: 12 });
    expect(session.messages.at(1)?.sources).toEqual([
      { id: 'item-1', title: 'Watchmen', author: 'Alan Moore', kind: 'COMIC', score: 0.8 },
    ]);
    expect(prisma.usage).toHaveLength(1);
  });

  it('truncates the session title to 80 characters', async () => {
    const { service, chat } = await setup();
    const message = 'a'.repeat(200);

    const { sessionId } = await chat.send('u1', { message, serviceId: service.id });

    const session = await chat.getSession('u1', sessionId);
    expect(session.title).toBe('a'.repeat(80));
  });

  it('continues an existing session and keeps messages in order', async () => {
    const { service, chat } = await setup();
    vi.useFakeTimers({ now: new Date('2026-01-01T10:00:00Z') });
    const first = await chat.send('u1', { message: 'one', serviceId: service.id });
    vi.setSystemTime(new Date('2026-01-01T10:01:00Z'));

    await chat.send('u1', { message: 'two', serviceId: service.id, sessionId: first.sessionId });
    vi.useRealTimers();

    const session = await chat.getSession('u1', first.sessionId);
    expect(session.messages.map((message) => message.content)).toEqual([
      'one',
      'Watchmen es un cómic.',
      'two',
      'Watchmen es un cómic.',
    ]);
  });

  it('sends the previous turn to the model on a follow-up question', async () => {
    const generate = vi.fn<ModelProvider['generate']>().mockResolvedValue({ text: 'ok', inputTokens: 1, outputTokens: 1 });
    const { service, chat } = await setup({ generate });
    const first = await chat.send('u1', { message: 'Who is Rorschach?', serviceId: service.id });

    await chat.send('u1', { message: 'and who wrote it?', serviceId: service.id, sessionId: first.sessionId });

    expect(generate.mock.calls.at(1)?.[0].prompt).toContain('Who is Rorschach?');
  });
});

describe('chat history: query', () => {
  it('lists only the caller sessions, most recent first', async () => {
    const { service, chat } = await setup();
    const older = await chat.send('u1', { message: 'older', serviceId: service.id });
    await chat.send('u2', { message: 'other user', serviceId: service.id });
    const newer = await chat.send('u1', { message: 'newer', serviceId: service.id });

    const sessions = await chat.listSessions('u1');

    expect(sessions.map((session) => session.id)).toEqual([newer.sessionId, older.sessionId]);
  });

  it('returns 404 when reading another user session', async () => {
    const { service, chat } = await setup();
    const { sessionId } = await chat.send('u1', { message: 'private', serviceId: service.id });

    await expect(chat.getSession('u2', sessionId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 and stores nothing when continuing another user session', async () => {
    const { prisma, service, chat } = await setup();
    const { sessionId } = await chat.send('u1', { message: 'private', serviceId: service.id });
    const before = prisma.messages.length;

    await expect(chat.send('u2', { message: 'intruder', serviceId: service.id, sessionId })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.messages).toHaveLength(before);
  });
});

describe('chat answers', () => {
  it('answers "not enough information" without calling the model when nothing is similar enough', async () => {
    const generate = vi.fn<ModelProvider['generate']>();
    const { service, chat } = await setup({ score: 0.05, generate });

    const answer = await chat.send('u1', { message: 'What is the capital of France?', serviceId: service.id });

    expect(answer).toMatchObject({
      answer: NOT_ENOUGH_INFORMATION_ANSWER,
      grounded: false,
      sources: [],
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('stores no message when the model fails', async () => {
    const generate = vi.fn<ModelProvider['generate']>().mockRejectedValue(new ServiceUnavailableException());
    const { prisma, service, chat } = await setup({ generate });

    await expect(chat.send('u1', { message: 'Tell me about Watchmen', serviceId: service.id })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.sessions).toHaveLength(0);
    expect(prisma.messages).toHaveLength(0);
  });
});
