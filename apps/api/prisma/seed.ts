import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { SEED_ITEMS, coverSlug } from './seed-data';

const prisma = new PrismaClient();

const DEFAULT_AI_SERVICE = 'Nova Lite';
const DEFAULT_MODEL_ID = 'us.amazon.nova-lite-v1:0';

function loadCoverSlugs(): Set<string> {
  const manifest = join(__dirname, 'covers.json');
  if (!existsSync(manifest)) return new Set();
  const parsed: unknown = JSON.parse(readFileSync(manifest, 'utf-8'));
  return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
}

async function main(): Promise<void> {
  const covers = loadCoverSlugs();
  let created = 0;
  let updated = 0;

  for (const item of SEED_ITEMS) {
    const slug = coverSlug(item);
    const data = {
      genre: item.genre,
      year: item.year,
      synopsis: item.synopsis,
      isbn: item.isbn ?? null,
      series: item.series ?? null,
      issueNumber: item.issueNumber ?? null,
      ...(covers.has(slug) ? { coverUrl: `/covers/${slug}.webp` } : {}),
    };
    const key = { title_author_kind: { title: item.title, author: item.author, kind: item.kind } };
    const existing = await prisma.item.findUnique({ where: key, select: { id: true } });
    await prisma.item.upsert({
      where: key,
      create: { title: item.title, author: item.author, kind: item.kind, ...data },
      update: data,
    });
    if (existing) updated += 1;
    else created += 1;
  }

  const total = await prisma.item.count();
  console.log(`Seed finished: ${created} created, ${updated} updated, ${total} items in catalog.`);

  await prisma.aiService.upsert({
    where: { name: DEFAULT_AI_SERVICE },
    create: {
      name: DEFAULT_AI_SERVICE,
      modelId: process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID,
      provider: 'bedrock',
      maxOutputTokens: 1024,
      temperature: 0.3,
    },
    update: {},
  });
  console.log(`AI services in catalog: ${await prisma.aiService.count()}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
