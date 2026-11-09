import { vi } from 'vitest';
import { SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface StoredItem {
  id: string;
  title: string;
  author: string;
  kind: 'BOOK' | 'COMIC';
  genre: string;
  year: number;
  synopsis: string;
  series: string | null;
  issueNumber: number | null;
}

export function stored(id: string, title: string, series: string | null, issueNumber: number | null): StoredItem {
  return { id, title, author: 'Author', kind: 'COMIC', genre: 'Fantasy', year: 2000 + (issueNumber ?? 0), synopsis: 'A story.', series, issueNumber };
}

type Filter = { contains?: string; in?: string[] };

export function fakePrisma(items: StoredItem[]): PrismaService {
  const has = (value: string | null, filter?: Filter) =>
    filter?.contains !== undefined && value !== null && value.toLowerCase().includes(filter.contains.toLowerCase());
  const findMany = vi.fn(
    async ({ where }: { where: { series?: string | Filter; title?: Filter; id?: Filter } }) => {
      const rows = items.filter((item) => {
        if (typeof where.series === 'string') return item.series === where.series;
        if (where.series) return has(item.series, where.series);
        if (where.title) return has(item.title, where.title);
        return where.id?.in?.includes(item.id) ?? false;
      });
      return where.series && typeof where.series !== 'string'
        ? rows.filter((row, index) => rows.findIndex((other) => other.series === row.series) === index)
        : rows;
    },
  );
  const findUnique = vi.fn(async ({ where }: { where: { id: string } }) => items.find((item) => item.id === where.id) ?? null);
  return { item: { findMany, findUnique } } as unknown as PrismaService;
}

export function similar(id: string, score: number): SimilarItem {
  return { id, title: `Title ${id}`, author: 'Author', kind: 'BOOK', genre: 'Fantasy', year: 2000, series: null, synopsis: 'A story.', score };
}

