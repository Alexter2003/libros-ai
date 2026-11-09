import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { parseRecommendations } from '../../src/agents/agent-prompts';
import { GENERIC_REASON, NO_SERIES_EXPLANATION } from '../../src/agents/agents.constants';
import { CatalogToolsService } from '../../src/agents/catalog-tools';
import { SeriesEntry, resolveReadingOrder, sortReadingOrder } from '../../src/agents/reading-order';
import { ReadingOrderService } from '../../src/agents/reading-order.service';
import { RecommenderService } from '../../src/agents/recommender.service';
import { AiServicesService } from '../../src/ai/ai-services/ai-services.service';
import { EmbeddingsService, SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { GatewayService } from '../../src/ai/gateway/gateway.service';
import { ConversationResult, ModelProvider } from '../../src/ai/providers/model-provider';
import { TokenQuotaService } from '../../src/ai/token-quota/token-quota.service';
import { StoredItem, fakePrisma, similar, stored } from '../support/catalog-fakes';
import { fakeProvider } from '../support/fake-model-provider';
import { FakePrisma } from '../support/fake-prisma';
import { answerTurn, call, toolTurn } from '../support/model-turns';

async function setup(options: { turns: ConversationResult[]; items?: StoredItem[]; search?: SimilarItem[] }) {
  const prisma = new FakePrisma();
  prisma.addUser('u1', null);
  const services = new AiServicesService(prisma.asPrisma());
  const service = await services.create({ name: 'Nova Lite', modelId: 'model-1' });
  const converse = vi.fn<ModelProvider['converse']>();
  for (const turn of options.turns) converse.mockResolvedValueOnce(turn);
  const gateway = new GatewayService(services, new TokenQuotaService(prisma.asPrisma()), fakeProvider({ converse }));
  const embeddings = {
    embedQuery: vi.fn().mockResolvedValue([0.1]),
    search: vi.fn().mockResolvedValue(options.search ?? []),
  } as unknown as EmbeddingsService;
  const catalog = new CatalogToolsService(fakePrisma(options.items ?? []), embeddings);
  return {
    prisma,
    services,
    service,
    converse,
    recommender: new RecommenderService(gateway, catalog),
    reading: new ReadingOrderService(gateway, catalog),
  };
}

describe('parseRecommendations', () => {
  const allowed = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

  it('keeps valid ids with their reasons', () => {
    const text = '{"recommendations":[{"id":"b","reason":"Porque sí"}]}';
    expect(parseRecommendations(text, allowed, [])).toEqual([{ id: 'b', reason: 'Porque sí' }]);
  });

  it('discards ids that were not returned by a tool and duplicates', () => {
    const text = '{"recommendations":[{"id":"zzz","reason":"x"},{"id":"a","reason":"uno"},{"id":"a","reason":"dos"}]}';
    expect(parseRecommendations(text, allowed, [])).toEqual([{ id: 'a', reason: 'uno' }]);
  });

  it('extracts JSON surrounded by prose and caps at 3', () => {
    const text = `Claro:\n{"recommendations":[${['a', 'b', 'c', 'd'].map((id) => `{"id":"${id}","reason":"r"}`).join(',')}]}\nListo`;
    expect(parseRecommendations(text, allowed, []).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to the given items when the output is not valid', () => {
    expect(parseRecommendations('no json here', allowed, allowed)).toEqual(
      ['a', 'b', 'c'].map((id) => ({ id, reason: GENERIC_REASON })),
    );
  });
});

describe('recommender agent', () => {
  const search = [similar('a', 0.8), similar('b', 0.7)];

  it('searches, recommends only items the tools returned and sums the tokens of every call', async () => {
    const { recommender, service, prisma } = await setup({
      search,
      turns: [
        toolTurn(call('search_catalog', { query: 'fantasía' })),
        answerTurn('{"recommendations":[{"id":"b","reason":"Encaja"},{"id":"ghost","reason":"Inventado"}]}'),
      ],
    });

    const result = await recommender.recommend('u1', { description: 'fantasía', serviceId: service.id });

    expect(result.recommendations).toEqual([
      { id: 'b', title: 'Title b', author: 'Author', kind: 'BOOK', reason: 'Encaja' },
    ]);
    expect(result).toMatchObject({ inputTokens: 30, outputTokens: 13 });
    expect(prisma.usage).toHaveLength(2);
  });

  it('can recommend an item it only read with get_item', async () => {
    const { recommender, service } = await setup({
      items: [stored('s1', 'Saga, Vol. 1', 'Saga', 1)],
      turns: [
        toolTurn(call('get_item', { id: 's1' })),
        answerTurn('{"recommendations":[{"id":"s1","reason":"Épica"}]}'),
      ],
    });

    const result = await recommender.recommend('u1', { description: 'épica', serviceId: service.id });

    expect(result.recommendations.map((item) => item.id)).toEqual(['s1']);
  });

  it('falls back to the first search when the final output is not valid', async () => {
    const { recommender, service } = await setup({
      search,
      turns: [toolTurn(call('search_catalog', { query: 'x' })), answerTurn('lo siento')],
    });

    const result = await recommender.recommend('u1', { description: 'x', serviceId: service.id });

    expect(result.recommendations.map((item) => [item.id, item.reason])).toEqual([
      ['a', GENERIC_REASON],
      ['b', GENERIC_REASON],
    ]);
  });

  it('returns nothing when no tool found a relevant item, even if the model invents one', async () => {
    const { recommender, service } = await setup({
      search: [similar('a', 0.05)],
      turns: [
        toolTurn(call('search_catalog', { query: 'nada' })),
        answerTurn('{"recommendations":[{"id":"a","reason":"x"}]}'),
      ],
    });

    const result = await recommender.recommend('u1', { description: 'nada', serviceId: service.id });

    expect(result.recommendations).toEqual([]);
  });

  it('returns nothing when the model never searches and invents ids', async () => {
    const { recommender, service } = await setup({
      search,
      turns: [answerTurn('{"recommendations":[{"id":"a","reason":"x"}]}')],
    });

    const result = await recommender.recommend('u1', { description: 'x', serviceId: service.id });

    expect(result.recommendations).toEqual([]);
  });

  it('falls back to the first search when the step limit is reached', async () => {
    const turns = Array.from({ length: 5 }, () => toolTurn(call('search_catalog', { query: 'again' })));
    const { recommender, service } = await setup({ search, turns });

    const result = await recommender.recommend('u1', { description: 'x', serviceId: service.id });

    expect(result.recommendations.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.inputTokens).toBe(50);
  });

  it('rejects a disabled service before doing any work', async () => {
    const { recommender, service, services, converse } = await setup({ turns: [] });
    await services.update(service.id, { enabled: false });

    await expect(recommender.recommend('u1', { description: 'x', serviceId: service.id })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(converse).not.toHaveBeenCalled();
  });
});

function entry(id: string, issueNumber: number | null, year = 2000): SeriesEntry {
  return { id, title: `Title ${id}`, author: 'A', kind: 'COMIC', year, issueNumber };
}

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

describe('resolveReadingOrder', () => {
  const numbered = [entry('3', 3), entry('1', 1), entry('2', 2)];

  it('accepts a proposal that is a permutation and keeps issue order', () => {
    expect(resolveReadingOrder(numbered, ['1', '2', '3']).map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('falls back to the deterministic order when issue numbers are out of order', () => {
    expect(resolveReadingOrder(numbered, ['3', '1', '2']).map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('falls back when the proposal misses, repeats or invents volumes', () => {
    for (const proposal of [['1', '2'], ['1', '1', '2'], ['1', '2', 'ghost']]) {
      expect(resolveReadingOrder(numbered, proposal).map((item) => item.id)).toEqual(['1', '2', '3']);
    }
  });

  it('accepts the model order for volumes without issue numbers', () => {
    const unnumbered = [entry('a', null, 2001), entry('b', null, 1999)];
    expect(resolveReadingOrder(unnumbered, ['a', 'b']).map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('reading-order agent', () => {
  const saga: StoredItem[] = [
    stored('s3', 'Saga, Vol. 3', 'Saga', 3),
    stored('s1', 'Saga, Vol. 1', 'Saga', 1),
    stored('s2', 'Saga, Vol. 2', 'Saga', 2),
  ];
  const finish = (order: string[]) =>
    answerTurn(JSON.stringify({ series: 'Saga', order, explanation: 'Empieza por el uno.' }));
  const lookup = (query: string) => [
    toolTurn(call('find_series', { query })),
    toolTurn(call('list_series_volumes', { series: 'Saga' })),
  ];

  it('finds the series by name, lists its volumes and returns them in order', async () => {
    const { reading, service, prisma } = await setup({ items: saga, turns: [...lookup('saga'), finish(['s1', 's2', 's3'])] });

    const result = await reading.order('u1', { query: 'saga', serviceId: service.id });

    expect(result.series).toBe('Saga');
    expect(result.items.map((item) => [item.position, item.id])).toEqual([[1, 's1'], [2, 's2'], [3, 's3']]);
    expect(result.explanation).toBe('Empieza por el uno.');
    expect(result).toMatchObject({ inputTokens: 40, outputTokens: 18 });
    expect(prisma.usage).toHaveLength(3);
  });

  it('resolves a title inside the series to the whole series', async () => {
    const { reading, service } = await setup({ items: saga, turns: [...lookup('Vol. 2'), finish(['s1', 's2', 's3'])] });

    const result = await reading.order('u1', { query: 'Vol. 2', serviceId: service.id });

    expect(result.items).toHaveLength(3);
  });

  it('uses the deterministic order when the model order breaks the issue numbers', async () => {
    const { reading, service } = await setup({ items: saga, turns: [...lookup('saga'), finish(['s3', 's1', 's2'])] });

    const result = await reading.order('u1', { query: 'saga', serviceId: service.id });

    expect(result.items.map((item) => item.id)).toEqual(['s1', 's2', 's3']);
  });

  it('uses the listed series and the default explanation when the final output is not valid', async () => {
    const { reading, service } = await setup({ items: saga, turns: [...lookup('saga'), answerTurn('no sé')] });

    const result = await reading.order('u1', { query: 'saga', serviceId: service.id });

    expect(result.items.map((item) => item.id)).toEqual(['s1', 's2', 's3']);
    expect(result.explanation).toBeTruthy();
  });

  it('falls back to the code order when the step limit is reached', async () => {
    const turns = [...lookup('saga'), ...Array.from({ length: 3 }, () => toolTurn(call('find_series', { query: 'saga' })))];
    const { reading, service } = await setup({ items: saga, turns });

    const result = await reading.order('u1', { query: 'saga', serviceId: service.id });

    expect(result.items.map((item) => item.id)).toEqual(['s1', 's2', 's3']);
  });

  it('returns the single item when it belongs to no series', async () => {
    const { reading, service } = await setup({
      items: [stored('x', 'Blankets', null, null)],
      search: [similar('x', 0.7)],
      turns: [
        toolTurn(call('find_series', { query: 'memorias' })),
        answerTurn('{"series":null,"order":["x"],"explanation":"Es una obra única."}'),
      ],
    });

    const result = await reading.order('u1', { query: 'memorias', serviceId: service.id });

    expect(result.series).toBe('Blankets');
    expect(result.items.map((item) => item.id)).toEqual(['x']);
  });

  it('reports that nothing matches when the tools find nothing', async () => {
    const { reading, service } = await setup({
      items: saga,
      search: [similar('x', 0.05)],
      turns: [toolTurn(call('find_series', { query: 'zzz' })), answerTurn('{"series":null,"order":[],"explanation":""}')],
    });

    const result = await reading.order('u1', { query: 'zzz', serviceId: service.id });

    expect(result).toMatchObject({ series: null, items: [], explanation: NO_SERIES_EXPLANATION });
  });
});
