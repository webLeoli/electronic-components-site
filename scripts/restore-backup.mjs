// Restore a backup file produced by the admin Backup page (/admin/backup).
//
// Usage:
//   node scripts/restore-backup.mjs <backup.json> [--dry-run]
//
// Semantics (idempotent - safe to run twice):
//   blogCategories     upsert by slug
//   blogPosts          upsert by slug; categoryId remapped via embedded category slug
//   rfqSubmissions     insert, skipping ids that already exist
//   contactSubmissions insert, skipping ids that already exist
//   products           upsert by partNumber
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const [, , file, ...flags] = process.argv;
const dryRun = flags.includes('--dry-run');

if (!file) {
  console.error('Usage: node scripts/restore-backup.mjs <backup.json> [--dry-run]');
  process.exit(1);
}

const raw = JSON.parse(await readFile(file, 'utf8'));
if (raw.format !== 'fpgacenter-backup') {
  console.error('Not a fpgacenter-backup file (missing format marker).');
  process.exit(1);
}
const data = raw.data || {};
const prisma = new PrismaClient();
const log = (msg) => console.log(`${dryRun ? '[dry-run] ' : ''}${msg}`);

log(`Backup from ${raw.exportedAt}, range ${raw.range?.from || 'ALL'} .. ${raw.range?.to || 'ALL'}`);

// --- blog categories ---
if (data.blogCategories?.length) {
  for (const cat of data.blogCategories) {
    if (!dryRun) {
      await prisma.blogCategory.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: { name: cat.name, slug: cat.slug },
      });
    }
  }
  log(`blogCategories: ${data.blogCategories.length} upserted`);
}

// --- blog posts ---
if (data.blogPosts?.length) {
  const cats = await prisma.blogCategory.findMany({ select: { id: true, slug: true } });
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));
  let done = 0;
  for (const post of data.blogPosts) {
    const { id, category, categoryId, ...fields } = post;
    const mappedCategoryId = category?.slug ? (catBySlug.get(category.slug) ?? null) : null;
    const payload = {
      ...fields,
      categoryId: mappedCategoryId,
      publishedAt: fields.publishedAt ? new Date(fields.publishedAt) : null,
      createdAt: fields.createdAt ? new Date(fields.createdAt) : undefined,
    };
    if (!dryRun) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: payload,
        create: payload,
      });
    }
    done++;
  }
  log(`blogPosts: ${done} upserted`);
}

// --- rfq submissions ---
async function insertSkippingExisting(model, rows, label, dateFields) {
  if (!rows?.length) return;
  const existing = new Set(
    (await model.findMany({ select: { id: true }, where: { id: { in: rows.map((r) => r.id) } } })).map((r) => r.id),
  );
  const fresh = rows.filter((r) => !existing.has(r.id));
  if (!dryRun && fresh.length) {
    const prepared = fresh.map((r) => {
      const row = { ...r };
      for (const f of dateFields) if (row[f]) row[f] = new Date(row[f]);
      return row;
    });
    for (let i = 0; i < prepared.length; i += 500) {
      await model.createMany({ data: prepared.slice(i, i + 500) });
    }
  }
  log(`${label}: ${fresh.length} inserted, ${existing.size} already present`);
}

await insertSkippingExisting(prisma.rfqSubmission, data.rfqSubmissions, 'rfqSubmissions', ['submittedAt', 'processedAt']);
await insertSkippingExisting(prisma.contactSubmission, data.contactSubmissions, 'contactSubmissions', ['submittedAt']);

// --- products ---
if (data.products?.length) {
  let done = 0;
  for (const product of data.products) {
    const { id, categoryId, ...fields } = product;
    const payload = {
      ...fields,
      createdAt: fields.createdAt ? new Date(fields.createdAt) : undefined,
    };
    if (!dryRun) {
      await prisma.product.upsert({
        where: { partNumber: product.partNumber },
        update: payload,
        create: payload,
      });
    }
    done++;
    if (done % 1000 === 0) log(`products: ${done}/${data.products.length}...`);
  }
  log(`products: ${done} upserted (categoryId not remapped - relink via category sync if needed)`);
}

await prisma.$disconnect();
log('Restore complete.');
