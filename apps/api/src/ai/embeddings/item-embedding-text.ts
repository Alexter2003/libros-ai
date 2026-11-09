import { Item } from '@prisma/client';

export const EMBEDDED_FIELDS = ['title', 'author', 'kind', 'genre', 'year', 'series', 'synopsis'] as const;

type EmbeddedItem = Pick<Item, (typeof EMBEDDED_FIELDS)[number]>;

export function buildItemEmbeddingText(item: EmbeddedItem): string {
  const lines = [
    `Title: ${item.title}`,
    `Author: ${item.author}`,
    `Type: ${item.kind === 'COMIC' ? 'comic' : 'book'}`,
    `Genre: ${item.genre}`,
    `Year: ${item.year}`,
  ];
  if (item.series) lines.push(`Series: ${item.series}`);
  lines.push(`Synopsis: ${item.synopsis}`);
  return lines.join('\n');
}

export function embeddedFieldsChanged(current: EmbeddedItem, next: Partial<EmbeddedItem>): boolean {
  return EMBEDDED_FIELDS.some((field) => field in next && next[field] !== current[field]);
}
