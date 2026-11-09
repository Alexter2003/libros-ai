import { Injectable } from '@nestjs/common';
import { Kind } from '@prisma/client';
import { EmbeddingsService, SimilarItem } from '../ai/embeddings/embeddings.service';
import { JsonValue } from '../ai/providers/model-provider';
import { filterRelevant } from '../chat/rag-prompt';
import { MIN_SIMILARITY, SYNOPSIS_MAX_CHARS } from '../chat/rag.constants';
import { PrismaService } from '../prisma/prisma.service';
import { AgentTool, ToolInputError, readText } from './agent-tool';
import {
  MAX_TOOL_TEXT_CHARS,
  TOOL_SEARCH_LIMIT,
  TOOL_SERIES_LIMIT,
  TOOL_SERIES_SIMILAR_LIMIT,
} from './agents.constants';
import { SeriesEntry } from './reading-order';

export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  kind: Kind;
}

const ENTRY_SELECT = {
  id: true,
  title: true,
  author: true,
  kind: true,
  year: true,
  issueNumber: true,
  series: true,
} as const;

type StoredEntry = SeriesEntry & { series: string | null; kind: Kind };

function toCatalogItem(item: CatalogItem): CatalogItem {
  return { id: item.id, title: item.title, author: item.author, kind: item.kind };
}

function toEntry(item: StoredEntry): SeriesEntry {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    kind: item.kind,
    year: item.year,
    issueNumber: item.issueNumber,
  };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function summarize(item: SimilarItem): JsonValue {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    kind: item.kind,
    genre: item.genre,
    year: item.year,
    series: item.series,
  };
}

export class CatalogRecorder {
  readonly items = new Map<string, CatalogItem>();
  readonly volumesBySeries = new Map<string, SeriesEntry[]>();
  firstSearch: CatalogItem[] | null = null;
  lastSeries: string | null = null;
  standalone: SeriesEntry | null = null;

  recordSearch(found: CatalogItem[]): void {
    const items = found.map(toCatalogItem);
    for (const item of items) this.items.set(item.id, item);
    this.firstSearch ??= items;
  }

  recordItem(item: CatalogItem): void {
    this.items.set(item.id, toCatalogItem(item));
  }

  recordSeries(name: string, volumes: SeriesEntry[]): void {
    this.volumesBySeries.set(name, volumes);
    this.lastSeries = name;
  }

  recordStandalone(entry: SeriesEntry): void {
    this.standalone ??= entry;
  }
}

export interface CatalogToolkit {
  recorder: CatalogRecorder;
  searchCatalog: AgentTool;
  getItem: AgentTool;
  findSeries: AgentTool;
  listSeriesVolumes: AgentTool;
}

const QUERY_SCHEMA = (key: string, description: string): AgentTool['definition']['inputSchema'] => ({
  type: 'object',
  properties: { [key]: { type: 'string', description, maxLength: MAX_TOOL_TEXT_CHARS } },
  required: [key],
});

@Injectable()
export class CatalogToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  toolkit(userId: string): CatalogToolkit {
    const recorder = new CatalogRecorder();
    return {
      recorder,
      searchCatalog: this.searchCatalog(userId, recorder),
      getItem: this.getItem(recorder),
      findSeries: this.findSeries(userId, recorder),
      listSeriesVolumes: this.listSeriesVolumes(recorder),
    };
  }

  private searchCatalog(userId: string, recorder: CatalogRecorder): AgentTool {
    return {
      definition: {
        name: 'search_catalog',
        description:
          'Search the books and comics catalog by meaning. Returns up to 8 relevant items (id, title, author, kind, genre, year, series) or an empty list when nothing is relevant.',
        inputSchema: QUERY_SCHEMA('query', 'What to look for: topics, genres, moods or titles'),
      },
      run: async (input) => {
        const query = readText(input, 'query');
        const vector = await this.embeddings.embedQuery(userId, query);
        const found = filterRelevant(await this.embeddings.search(vector, TOOL_SEARCH_LIMIT), MIN_SIMILARITY);
        recorder.recordSearch(found);
        return JSON.stringify(found.map(summarize));
      },
    };
  }

  private getItem(recorder: CatalogRecorder): AgentTool {
    return {
      definition: {
        name: 'get_item',
        description: 'Read the full details of one catalog item by its id, including its synopsis.',
        inputSchema: QUERY_SCHEMA('id', 'The id of the item, as returned by another tool'),
      },
      run: async (input) => {
        const id = readText(input, 'id');
        const item = await this.prisma.item.findUnique({
          where: { id },
          select: { ...ENTRY_SELECT, genre: true, synopsis: true },
        });
        if (!item) throw new ToolInputError('No item with that id');
        recorder.recordItem(item);
        return JSON.stringify({
          id: item.id,
          title: item.title,
          author: item.author,
          kind: item.kind,
          genre: item.genre,
          year: item.year,
          series: item.series,
          issueNumber: item.issueNumber,
          synopsis: truncate(item.synopsis, SYNOPSIS_MAX_CHARS),
        });
      },
    };
  }

  private findSeries(userId: string, recorder: CatalogRecorder): AgentTool {
    return {
      definition: {
        name: 'find_series',
        description:
          'Find the series that match a name or one of its titles. Returns candidates as {series, matchedItem}; series is null when the matched item does not belong to a series.',
        inputSchema: QUERY_SCHEMA('query', 'A series name or the title of one of its volumes'),
      },
      run: async (input) => {
        const query = readText(input, 'query');
        const named = await this.prisma.item.findMany({
          where: { series: { contains: query, mode: 'insensitive' } },
          distinct: ['series'],
          orderBy: { series: 'asc' },
          take: TOOL_SERIES_LIMIT,
          select: { series: true },
        });
        if (named.length > 0) {
          return JSON.stringify(named.map(({ series }) => ({ series, matchedItem: null })));
        }
        const titled = await this.prisma.item.findMany({
          where: { title: { contains: query, mode: 'insensitive' } },
          orderBy: { title: 'asc' },
          take: TOOL_SERIES_LIMIT,
          select: ENTRY_SELECT,
        });
        if (titled.length > 0) return this.describeMatches(titled, recorder);

        const vector = await this.embeddings.embedQuery(userId, query);
        const similar = filterRelevant(
          await this.embeddings.search(vector, TOOL_SERIES_SIMILAR_LIMIT),
          MIN_SIMILARITY,
        );
        const stored = await this.prisma.item.findMany({
          where: { id: { in: similar.map((item) => item.id) } },
          select: ENTRY_SELECT,
        });
        return this.describeMatches(stored, recorder);
      },
    };
  }

  private describeMatches(matches: StoredEntry[], recorder: CatalogRecorder): string {
    for (const match of matches) {
      if (match.series === null) recorder.recordStandalone(toEntry(match));
    }
    return JSON.stringify(
      matches.map((match) => ({ series: match.series, matchedItem: { id: match.id, title: match.title } })),
    );
  }

  private listSeriesVolumes(recorder: CatalogRecorder): AgentTool {
    return {
      definition: {
        name: 'list_series_volumes',
        description:
          'List every volume of a series by its exact name (as returned by find_series): id, title, author, kind, year and issueNumber (null when the volume has no number).',
        inputSchema: QUERY_SCHEMA('series', 'The exact series name'),
      },
      run: async (input) => {
        const name = readText(input, 'series');
        const volumes = await this.prisma.item.findMany({
          where: { series: name },
          orderBy: { title: 'asc' },
          select: ENTRY_SELECT,
        });
        if (volumes.length === 0) throw new ToolInputError('No series with that exact name');
        const entries = volumes.map(toEntry);
        recorder.recordSeries(name, entries);
        return JSON.stringify(entries);
      },
    };
  }
}
