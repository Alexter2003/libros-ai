import { describe, expect, it, vi } from 'vitest';
import { buildRecommendPrompt, parseRecommendations } from '../../src/agents/agent-prompts';
import { GENERIC_REASON, NO_SERIES_EXPLANATION } from '../../src/agents/agents.constants';
import { sortReadingOrder } from '../../src/agents/reading-order';
import { ReadingOrderService } from '../../src/agents/reading-order.service';
import { RecommenderService } from '../../src/agents/recommender.service';
import { AiServicesService } from '../../src/ai/ai-services/ai-services.service';
import { EmbeddingsService, SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { GatewayService } from '../../src/ai/gateway/gateway.service';
import { ModelProvider } from '../../src/ai/providers/model-provider';
import { TokenQuotaService } from '../../src/ai/token-quota/token-quota.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { FakePrisma } from '../support/fake-prisma';

function candidate(id: string, score = 0.8): SimilarItem {
  return {
    id,
    title: `Title ${id}`,
    author: 'Author',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 2000,
    series: null,
    synopsis: 'A story.',
    score,
  };
}

interface StoredItem {
  id: string;
  title: string;
  author: string;
  kind: string;
  year: number;
  series: string | null;
  issueNumber: number | null;
}

function fakeItems(items: StoredItem[]): PrismaService {
  type Filter = { equals?: string; contains?: string };
  const matches = (value: string | null, filter?: Filter): boolean => {
    if (!filter || value === null) return false;
    const lower = value.toLowerCase();
    if (filter.equals !== undefined) return lower === filter.equals.toLowerCase();
    return filter.contains !== undefined && lower.includes(filter.contains.toLowerCase());
  };
  const find = (where: { series?: string | Filter; title?: Filter }) =>
    items.filter((item) => {
      if (typeof where.series === 'string') return item.series === where.series;
      if (where.series) return matches(item.series, where.series);
      return matches(item.title, where.title);
    });
  return {
    item: {
      findFirst: vi.fn(async ({ where }: { where: { series?: Filter; title?: Filter } }) => find(where)[0] ?? null),
      findMany: vi.fn(async ({ where }: { where: { series: string } }) => find(where)),
    },
  } as unknown as PrismaService;
}

async function setup(options: { search?: SimilarItem[]; text?: string; items?: StoredItem[] } = {}) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', null);
  const services = new AiServicesService(prisma.asPrisma());
  const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
  const quota = new TokenQuotaService(prisma.asPrisma());
  const generate = vi
    .fn<ModelProvider['generate']>()
    .mockResolvedValue({ text: options.text ?? 'ok', inputTokens: 30, outputTokens: 10 });
  const gateway = new GatewayService(services, quota, { generate });
  const embeddings = {
    embedQuery: vi.fn().mockResolvedValue([0.1]),
    search: vi.fn().mockResolvedValue(options.search ?? []),
  } as unknown as EmbeddingsService;
  const recommender = new RecommenderService(services, quota, embeddings, gateway);
  const reading = new ReadingOrderService(fakeItems(options.items ?? []), services, quota, embeddings, gateway);
  return { prisma, service, recommender, reading, generate };
}

describe('parseRecommendations', () => {
  const candidates = [candidate('a'), candidate('b'), candidate('c'), candidate('d')];

  it('keeps valid ids with their reasons', () => {
    const text = '{"recommendations":[{"id":"b","reason":"Porque sí"}]}';
    expect(parseRecommendations(text, candidates)).toEqual([{ id: 'b', reason: 'Porque sí' }]);
  });

  it('discards ids that were not candidates and duplicates', () => {
    const text = '{"recommendations":[{"id":"zzz","reason":"x"},{"id":"a","reason":"uno"},{"id":"a","reason":"dos"}]}';
    expect(parseRecommendations(text, candidates)).toEqual([{ id: 'a', reason: 'uno' }]);
  });

  it('extracts JSON surrounded by prose and caps at 3', () => {
    const text = `Claro:\n{"recommendations":[${['a', 'b', 'c', 'd'].map((id) => `{"id":"${id}","reason":"r"}`).join(',')}]}\nListo`;
    expect(parseRecommendations(text, candidates).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to the top candidates when the output is not valid', () => {
    expect(parseRecommendations('no json here', candidates)).toEqual(
      ['a', 'b', 'c'].map((id) => ({ id, reason: GENERIC_REASON })),
    );
  });

  it('lists candidate ids in the prompt', () => {
    expect(buildRecommendPrompt(candidates, 'fantasía')).toContain('id: a');
  });
});

describe('recommender agent', () => {
  it('returns only candidate items and records usage through the gateway', async () => {
    const { recommender, service, prisma } = await setup({
      search: [candidate('a'), candidate('b')],
      text: '{"recommendations":[{"id":"b","reason":"Encaja"},{"id":"ghost","reason":"Inventado"}]}',
    });

    const result = await recommender.recommend('u1', { description: 'fantasía', serviceId: service.id });

    expect(result.recommendations).toEqual([
      { id: 'b', title: 'Title b', author: 'Author', kind: 'BOOK', reason: 'Encaja' },
    ]);
    expect(result).toMatchObject({ inputTokens: 30, outputTokens: 10 });
    expect(prisma.usage).toHaveLength(1);
  });

  it('skips generation when nothing reaches the minimum similarity', async () => {
    const { recommender, service, generate } = await setup({ search: [candidate('a', 0.05)] });

    const result = await recommender.recommend('u1', { description: 'nada', serviceId: service.id });

    expect(result).toEqual({ recommendations: [], inputTokens: 0, outputTokens: 0 });
    expect(generate).not.toHaveBeenCalled();
  });
});

describe('sortReadingOrder', () => {
  it('orders by issue number, then year, with unnumbered entries last', () => {
    const sorted = sortReadingOrder([
      { title: 'C', year: 2003, issueNumber: 3 },
      { title: 'X', year: 1990, issueNumber: null },
      { title: 'A', year: 2001, issueNumber: 1 },
      { title: 'B', year: 2002, issueNumber: 2 },
    ]);
    expect(sorted.map((item) => item.title)).toEqual(['A', 'B', 'C', 'X']);
  });
});

describe('reading-order agent', () => {
  const items: StoredItem[] = [
    { id: '3', title: 'Saga, Vol. 3', author: 'V', kind: 'COMIC', year: 2014, series: 'Saga', issueNumber: 3 },
    { id: '1', title: 'Saga, Vol. 1', author: 'V', kind: 'COMIC', year: 2012, series: 'Saga', issueNumber: 1 },
    { id: '2', title: 'Saga, Vol. 2', author: 'V', kind: 'COMIC', year: 2013, series: 'Saga', issueNumber: 2 },
  ];

  it('resolves a series by name and returns it in order', async () => {
    const { reading, service, generate } = await setup({ items, text: 'Empieza por el uno.' });

    const result = await reading.order('u1', { query: 'saga', serviceId: service.id });

    expect(result.series).toBe('Saga');
    expect(result.items.map((item) => [item.position, item.id])).toEqual([[1, '1'], [2, '2'], [3, '3']]);
    expect(result.explanation).toBe('Empieza por el uno.');
    expect(generate).toHaveBeenCalledOnce();
  });

  it('resolves a title inside the series to the whole series', async () => {
    const { reading, service } = await setup({ items });

    const result = await reading.order('u1', { query: 'Vol. 2', serviceId: service.id });

    expect(result.items).toHaveLength(3);
  });

  it('returns an empty result without generating when nothing matches', async () => {
    const { reading, service, generate } = await setup({ items, search: [candidate('x', 0.05)] });

    const result = await reading.order('u1', { query: 'zzz', serviceId: service.id });

    expect(result).toEqual({ series: null, items: [], explanation: NO_SERIES_EXPLANATION, inputTokens: 0, outputTokens: 0 });
    expect(generate).not.toHaveBeenCalled();
  });
});
