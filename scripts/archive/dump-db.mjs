/**
 * Export database to SQL using streaming writes
 * Handles 720K products without running out of memory
 */
import { PrismaClient } from '@prisma/client';
import { createWriteStream } from 'fs';

const prisma = new PrismaClient();
const BATCH = 1000;

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}
function dt(val) {
  if (!val) return "'" + new Date().toISOString() + "'";
  return "'" + val.toISOString() + "'";
}

async function dump() {
  const out = createWriteStream('./fpgacenter_dump.sql', { highWaterMark: 1024 * 1024 });
  const w = (s) => out.write(s);

  w('-- FPGACenter Database Dump\n');
  w('-- Generated: ' + new Date().toISOString() + '\n\n');
  w('BEGIN;\n\n');

  // 1. Categories
  console.log('Dumping categories...');
  const categories = await prisma.category.findMany();
  w('TRUNCATE "Category" CASCADE;\n');
  for (const c of categories) {
    w(`INSERT INTO "Category" (id,name,slug,"parentId",description,"seoTitle","seoDesc","productCount","createdAt","updatedAt") VALUES (${c.id},${esc(c.name)},${esc(c.slug)},${c.parentId||'NULL'},${esc(c.description)},${esc(c.seoTitle)},${esc(c.seoDesc)},${c.productCount||0},${dt(c.createdAt)},${dt(c.updatedAt)});\n`);
  }
  console.log(`  ${categories.length} categories`);

  // 2. Manufacturers
  console.log('Dumping manufacturers...');
  const mfrs = await prisma.manufacturer.findMany();
  w('\nTRUNCATE "Manufacturer" CASCADE;\n');
  for (const m of mfrs) {
    w(`INSERT INTO "Manufacturer" (id,name,slug,website,"createdAt","updatedAt") VALUES (${m.id},${esc(m.name)},${esc(m.slug)},${esc(m.website)},${dt(m.createdAt)},${dt(m.updatedAt)});\n`);
  }
  console.log(`  ${mfrs.length} manufacturers`);

  // 3. Products (batched with streaming)
  console.log('Dumping products...');
  const total = await prisma.product.count();
  w('\nTRUNCATE "Product" CASCADE;\n');
  
  let cursor = 0;
  let dumped = 0;

  while (true) {
    const products = await prisma.product.findMany({
      where: { id: { gt: cursor } },
      orderBy: { id: 'asc' },
      take: BATCH,
    });
    if (products.length === 0) break;

    for (const p of products) {
      w(`INSERT INTO "Product" (id,"partNumber",manufacturer,description,"categoryId","packageType","mountType",status,stock,"minPrice",moq,"leadTime",datasheet,"imageUrl",specs,"createdAt","updatedAt") VALUES (${p.id},${esc(p.partNumber)},${esc(p.manufacturer)},${esc(p.description)},${p.categoryId||'NULL'},${esc(p.packageType)},${esc(p.mountType)},${esc(p.status)},${p.stock},${p.minPrice||'NULL'},${p.moq||1},${esc(p.leadTime)},${esc(p.datasheet)},${esc(p.imageUrl)},${esc(p.specs)},${dt(p.createdAt)},${dt(p.updatedAt)});\n`);
    }

    cursor = products[products.length - 1].id;
    dumped += products.length;

    // Wait for drain if buffer is full (backpressure)
    if (!out.write('')) {
      await new Promise(r => out.once('drain', r));
    }

    if (dumped % 50000 === 0) {
      console.log(`  ${dumped.toLocaleString()} / ${total.toLocaleString()}`);
    }
  }
  console.log(`  ${dumped.toLocaleString()} products total`);

  // 4. Reset sequences
  w(`\nSELECT setval('"Category_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Category"));\n`);
  w(`SELECT setval('"Manufacturer_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Manufacturer"));\n`);
  w(`SELECT setval('"Product_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Product"));\n`);
  w('\nCOMMIT;\n');

  // Close stream
  await new Promise(r => out.end(r));
  console.log('\nDump saved to fpgacenter_dump.sql');

  await prisma.$disconnect();
}

dump().catch(e => { console.error(e); process.exit(1); });
