// Catalogue measurement tool — the first step before committing to a blog topic.
//
// docs/blog-content-plan.md sets a hard rule: check catalogue depth BEFORE
// writing. That rule has already saved one wasted batch (Passives: 130 parts out
// of 719,342) and reframed another (Programmable Timers: a 3% obsolescence rate
// that turned out to be one vendor's configuration space). The numbers this
// script prints are also the first-party data the articles are built on, so they
// belong in a repeatable script rather than in ad-hoc queries.
//
// Usage:
//   node scripts/measure-catalogue.mjs categories          # every category, by size
//   node scripts/measure-catalogue.mjs prefixes <file>     # family census from a JSON list
//   node scripts/measure-catalogue.mjs prefix XC7A XC7K …  # ad-hoc prefix census
//   node scripts/measure-catalogue.mjs vendors             # by manufacturer
//   node scripts/measure-catalogue.mjs cat <slug>          # one category + its top vendors
//   node scripts/measure-catalogue.mjs packages            # by package type
//   node scripts/measure-catalogue.mjs find <substring>    # part-number search with status split
//
// "Not active" throughout means obsolete + lastbuy + nrnd, matching the
// definition used in every published article.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const [mode, ...rest] = process.argv.slice(2);

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '—');
const row = (label, parts, notActive, width = 42) =>
  `${String(label).padEnd(width)} ${String(parts).padStart(8)} ${String(notActive).padStart(8)} ${pct(notActive, parts).padStart(6)}`;
const header = (label, width = 42) =>
  `${'—'.repeat(width)} ${'—'.repeat(8)} ${'—'.repeat(8)} ${'—'.repeat(6)}\n` +
  `${label.padEnd(width)} ${'parts'.padStart(8)} ${'inactive'.padStart(8)} ${'rate'.padStart(6)}`;

async function categories() {
  const rows = await prisma.$queryRaw`
    SELECT c.slug, c.name, COUNT(*)::int AS parts,
           SUM(CASE WHEN p.status <> 'active' THEN 1 ELSE 0 END)::int AS inactive
    FROM "Product" p JOIN "Category" c ON c.id = p."categoryId"
    GROUP BY c.slug, c.name
    ORDER BY parts DESC`;
  console.log(header('category (slug)'));
  for (const r of rows) console.log(row(r.slug, r.parts, r.inactive));
  console.log(`\n${rows.length} categories`);
}

async function vendors() {
  const rows = await prisma.$queryRaw`
    SELECT manufacturer, COUNT(*)::int AS parts,
           SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END)::int AS inactive
    FROM "Product"
    GROUP BY manufacturer
    HAVING COUNT(*) >= 200
    ORDER BY parts DESC`;
  console.log(header('manufacturer (>=200 parts)'));
  for (const r of rows) console.log(row(r.manufacturer, r.parts, r.inactive));
}

async function packages() {
  const rows = await prisma.$queryRaw`
    SELECT COALESCE("packageType", '(none)') AS pkg, COUNT(*)::int AS parts,
           SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END)::int AS inactive
    FROM "Product"
    GROUP BY 1
    HAVING COUNT(*) >= 300
    ORDER BY parts DESC`;
  console.log(header('package'));
  for (const r of rows) console.log(row(r.pkg, r.parts, r.inactive));
}

async function oneCategory(slug) {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return console.log(`no category with slug "${slug}"`);
  const rows = await prisma.$queryRaw`
    SELECT manufacturer, COUNT(*)::int AS parts,
           SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END)::int AS inactive
    FROM "Product" WHERE "categoryId" = ${cat.id}
    GROUP BY manufacturer ORDER BY parts DESC LIMIT 25`;
  const total = rows.reduce((a, r) => a + r.parts, 0);
  const dead = rows.reduce((a, r) => a + r.inactive, 0);
  console.log(`${cat.name}  (${slug})`);
  console.log(header('  manufacturer'));
  for (const r of rows) console.log(row(`  ${r.manufacturer}`, r.parts, r.inactive));
  console.log(row('  — top-25 subtotal', total, dead));
}

// Census by part-number prefix. Prefixes are matched case-insensitively with
// LIKE 'prefix%', so they measure an ordering-code family, not a device.
async function prefixCensus(list) {
  console.log(header('family prefix', 30));
  for (const entry of list) {
    const { prefix, note } = typeof entry === 'string' ? { prefix: entry } : entry;
    const [r] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS parts,
              SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END)::int AS inactive,
              SUM(CASE WHEN status = 'lastbuy' THEN 1 ELSE 0 END)::int AS lastbuy
       FROM "Product" WHERE "partNumber" ILIKE $1`,
      `${prefix}%`,
    );
    if (!r.parts) {
      console.log(`${prefix.padEnd(30)} ${'0'.padStart(8)}${note ? `   ${note}` : ''}`);
      continue;
    }
    console.log(
      row(prefix, r.parts, r.inactive, 30) +
        (r.lastbuy ? `  LTB=${r.lastbuy}` : '') +
        (note ? `  ${note}` : ''),
    );
  }
}

async function find(substr) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "partNumber", manufacturer, status, "packageType", stock
     FROM "Product" WHERE "partNumber" ILIKE $1
     ORDER BY status, "partNumber" LIMIT 40`,
    `%${substr}%`,
  );
  const [c] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS parts,
            SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END)::int AS inactive
     FROM "Product" WHERE "partNumber" ILIKE $1`,
    `%${substr}%`,
  );
  console.log(`"${substr}" — ${c.parts} part numbers, ${c.inactive} not active (${pct(c.inactive, c.parts)})`);
  for (const r of rows) {
    console.log(
      `  ${r.partNumber.padEnd(28)} ${(r.manufacturer || '').padEnd(22)} ${r.status.padEnd(9)} ${(r.packageType || '').padEnd(14)} stock=${r.stock}`,
    );
  }
}

try {
  if (mode === 'categories') await categories();
  else if (mode === 'vendors') await vendors();
  else if (mode === 'packages') await packages();
  else if (mode === 'cat') await oneCategory(rest[0]);
  else if (mode === 'prefix') await prefixCensus(rest);
  else if (mode === 'prefixes') {
    const { readFile } = await import('node:fs/promises');
    await prefixCensus(JSON.parse(await readFile(rest[0], 'utf8')));
  } else if (mode === 'find') await find(rest.join(' '));
  else console.log('modes: categories | vendors | packages | cat <slug> | prefix <p…> | prefixes <file.json> | find <substr>');
} finally {
  await prisma.$disconnect();
}
