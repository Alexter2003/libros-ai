import { describe, expect, it, vi } from 'vitest';
import { ToolInputError } from '../../src/agents/agent-tool';
import { CatalogToolsService } from '../../src/agents/catalog-tools';
import { EmbeddingsService, SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { StoredItem, fakePrisma, similar, stored } from '../support/catalog-fakes';

function setup(items: StoredItem[] = [], search: SimilarItem[] = []) {
  const embeddings = {
    embedQuery: vi.fn().mockResolvedValue([0.1]),
    search: vi.fn().mockResolvedValue(search),
  } as unknown as EmbeddingsService;
  const toolkit = new CatalogToolsService(fakePrisma(items), embeddings).toolkit('u1');
  return { toolkit, embeddings };
}

const saga = [stored('s2', 'Saga, Vol. 2', 'Saga', 2), stored('s1', 'Saga, Vol. 1', 'Saga', 1)];

describe('search_catalog', () => {
  it('returns only items at or above the minimum similarity and records them', async () => {
    const { toolkit } = setup([], [similar('a', 0.8), similar('b', 0.05)]);

    const output = await toolkit.searchCatalog.run({ query: 'fantasía' });

    expect(JSON.parse(output)).toHaveLength(1);
    expect([...toolkit.recorder.items.keys()]).toEqual(['a']);
    expect(toolkit.recorder.firstSearch?.map((item) => item.id)).toEqual(['a']);
  });

  it('returns an empty list when nothing is relevant', async () => {
    const { toolkit } = setup([], [similar('a', 0.05)]);

    expect(await toolkit.searchCatalog.run({ query: 'nada' })).toBe('[]');
  });

  it('rejects an empty query', async () => {
    const { toolkit } = setup();

    await expect(toolkit.searchCatalog.run({ query: ' ' })).rejects.toBeInstanceOf(ToolInputError);
  });
});

describe('get_item', () => {
  it('returns the details and records the item', async () => {
    const { toolkit } = setup(saga);

    const item = JSON.parse(await toolkit.getItem.run({ id: 's1' })) as { title: string; synopsis: string };

    expect(item).toMatchObject({ title: 'Saga, Vol. 1', synopsis: 'A story.' });
    expect(toolkit.recorder.items.has('s1')).toBe(true);
  });

  it('reports an unknown id as a tool error', async () => {
    const { toolkit } = setup(saga);

    await expect(toolkit.getItem.run({ id: 'nope' })).rejects.toBeInstanceOf(ToolInputError);
  });
});

describe('find_series and list_series_volumes', () => {
  it('finds a series by name without using embeddings', async () => {
    const { toolkit, embeddings } = setup(saga);

    const found = JSON.parse(await toolkit.findSeries.run({ query: 'saga' })) as unknown[];

    expect(found).toEqual([{ series: 'Saga', matchedItem: null }]);
    expect(embeddings.embedQuery).not.toHaveBeenCalled();
  });

  it('finds the series of a title', async () => {
    const { toolkit } = setup(saga);

    const found = JSON.parse(await toolkit.findSeries.run({ query: 'Vol. 2' })) as unknown[];

    expect(found).toContainEqual({ series: 'Saga', matchedItem: { id: 's2', title: 'Saga, Vol. 2' } });
  });

  it('falls back to similarity and records a standalone item', async () => {
    const lone = stored('x', 'Blankets', null, null);
    const { toolkit } = setup([lone], [similar('x', 0.7)]);

    const found = JSON.parse(await toolkit.findSeries.run({ query: 'memorias de adolescencia' })) as unknown[];

    expect(found).toEqual([{ series: null, matchedItem: { id: 'x', title: 'Blankets' } }]);
    expect(toolkit.recorder.standalone?.id).toBe('x');
  });

  it('lists the volumes of an exact series and records them', async () => {
    const { toolkit } = setup(saga);

    const volumes = JSON.parse(await toolkit.listSeriesVolumes.run({ series: 'Saga' })) as Array<{ id: string }>;

    expect(volumes.map((volume) => volume.id).sort()).toEqual(['s1', 's2']);
    expect(toolkit.recorder.volumesBySeries.get('Saga')).toHaveLength(2);
    expect(toolkit.recorder.lastSeries).toBe('Saga');
  });

  it('reports an unknown series as a tool error', async () => {
    const { toolkit } = setup(saga);

    await expect(toolkit.listSeriesVolumes.run({ series: 'Nope' })).rejects.toBeInstanceOf(ToolInputError);
  });
});
