import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { SEED_ITEMS, coverSlug, type SeedItem } from '../apps/api/prisma/seed-data';

const COVERS_DIR = join(__dirname, '../apps/web/public/covers');
const MANIFEST = join(__dirname, '../apps/api/prisma/covers.json');
const FORCE = process.argv.includes('--force');
const MIN_BYTES = 2000;

// Open Library cover ids for titles whose ISBN lookup returns the wrong volume or nothing
const COVER_ID_OVERRIDES: Record<string, number> = {
  'the-sandman-vol-1-preludes-nocturnes': 7508162,
  'y-the-last-man-vol-1-unmanned': 12293475,
  'sapiens-a-brief-history-of-humankind': 8634250,
  'hellboy-vol-1-seed-of-destruction': 2958492,
  'locke-key-vol-1-welcome-to-lovecraft': 6671226,
  'sin-city-vol-1-the-hard-goodbye': 869322,
};

// Titles whose only available image is not a usable cover; they use the generated placeholder
const NO_COVER = new Set(['y-the-last-man-vol-3-one-small-step']);

async function download(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length >= MIN_BYTES ? buffer : null;
  } catch {
    return null;
  }
}

async function getJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
}

async function editionTitle(isbn: string): Promise<string> {
  const data = await getJson(`https://openlibrary.org/isbn/${isbn}.json`);
  const title = field(data, 'title');
  return typeof title === 'string' ? title : '(unknown edition)';
}

async function fromOpenLibraryIsbn(item: SeedItem): Promise<Buffer | null> {
  if (!item.isbn) return null;
  return download(`https://covers.openlibrary.org/b/isbn/${item.isbn}-L.jpg?default=false`);
}

async function fromOpenLibrarySearch(item: SeedItem): Promise<Buffer | null> {
  const query = new URLSearchParams({ title: item.title, author: item.author.split(' and ')[0], limit: '1' });
  const data = await getJson(`https://openlibrary.org/search.json?${query}`);
  const docs = field(data, 'docs');
  const coverId = Array.isArray(docs) ? field(docs[0], 'cover_i') : undefined;
  return typeof coverId === 'number'
    ? download(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`)
    : null;
}

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((t) => t.length > 1 && t !== 'vol');
}

async function fromOpenLibraryQuery(item: SeedItem): Promise<Buffer | null> {
  const wanted = tokens(item.title);
  const query = new URLSearchParams({
    q: `${item.title} ${item.author.split(' and ')[0]}`,
    limit: '10',
    fields: 'title,cover_i',
  });
  const data = await getJson(`https://openlibrary.org/search.json?${query}`);
  const docs = field(data, 'docs');
  if (!Array.isArray(docs)) return null;
  let best: { id: number; score: number } | null = null;
  for (const doc of docs) {
    const id = field(doc, 'cover_i');
    const title = field(doc, 'title');
    if (typeof id !== 'number' || typeof title !== 'string') continue;
    const have = new Set(tokens(title));
    const score = wanted.filter((t) => have.has(t)).length / wanted.length;
    if (!best || score > best.score) best = { id, score };
  }
  return best && best.score >= 0.5
    ? download(`https://covers.openlibrary.org/b/id/${best.id}-L.jpg?default=false`)
    : null;
}

async function fromGoogleBooks(item: SeedItem): Promise<Buffer | null> {
  const q = `intitle:${item.title} inauthor:${item.author.split(' and ')[0]}`;
  const data = await getJson(
    `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({ q, maxResults: '1' })}`,
  );
  const items = field(data, 'items');
  const links = Array.isArray(items) ? field(field(items[0], 'volumeInfo'), 'imageLinks') : undefined;
  const thumb = field(links, 'thumbnail');
  if (typeof thumb !== 'string') return null;
  return download(thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2'));
}

async function main(): Promise<void> {
  mkdirSync(COVERS_DIR, { recursive: true });
  const misses: string[] = [];

  for (const item of SEED_ITEMS) {
    const slug = coverSlug(item);
    if (NO_COVER.has(slug)) {
      console.log(`~ ${slug}: skipped (placeholder)`);
      continue;
    }
    const target = join(COVERS_DIR, `${slug}.webp`);
    if (existsSync(target) && !FORCE) {
      console.log(`= ${slug}: already present`);
      continue;
    }
    const overrideId = COVER_ID_OVERRIDES[slug];
    const sources: [string, () => Promise<Buffer | null>][] = [
      ...(overrideId
        ? [['openlibrary-id', () => download(`https://covers.openlibrary.org/b/id/${overrideId}-L.jpg?default=false`)] as [string, () => Promise<Buffer | null>]]
        : []),
      ['openlibrary-isbn', () => fromOpenLibraryIsbn(item)],
      ['openlibrary-search', () => fromOpenLibrarySearch(item)],
      ['openlibrary-query', () => fromOpenLibraryQuery(item)],
      ['googlebooks', () => fromGoogleBooks(item)],
    ];
    let saved = false;
    for (const [name, load] of sources) {
      const raw = await load();
      if (!raw) continue;
      const webp = await sharp(raw)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      writeFileSync(target, webp);
      const edition = item.isbn && name === 'openlibrary-isbn' ? ` [edition: ${await editionTitle(item.isbn)}]` : '';
      console.log(`+ ${slug}: ${name}, ${(webp.length / 1024).toFixed(1)} KB${edition}`);
      saved = true;
      break;
    }
    if (!saved) {
      misses.push(slug);
      console.log(`- ${slug}: no cover found`);
    }
  }

  const present = new Set(readdirSync(COVERS_DIR).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)));
  const slugs = SEED_ITEMS.map(coverSlug).filter((slug) => present.has(slug)).sort();
  writeFileSync(MANIFEST, `${JSON.stringify(slugs, null, 2)}\n`);
  console.log(`\nManifest: ${slugs.length}/${SEED_ITEMS.length} covers. Missing: ${misses.join(', ') || 'none'}`);
}

void main();
