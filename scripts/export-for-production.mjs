/**
 * Export database to production-compatible SQL
 * Matches the EXACT Prisma schema columns (no extra fields)
 * 
 * Usage: node scripts/export-for-production.mjs
 * Output: fpgacenter_production.sql (~550MB)
 */
import { PrismaClient } from '@prisma/client';
import { createWriteStream } from 'fs';

const prisma = new PrismaClient();
const BATCH = 2000;

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}
function dt(val) {
  if (!val) return "'" + new Date().toISOString() + "'";
  return "'" + new Date(val).toISOString() + "'";
}
function num(val, def = 0) {
  if (val === null || val === undefined) return def;
  return val;
}

async function main() {
  const out = createWriteStream('./fpgacenter_production.sql', { highWaterMark: 1024 * 1024 });
  const w = (s) => out.write(s);

  w('-- FPGACenter Production Database Restore\n');
  w('-- Generated: ' + new Date().toISOString() + '\n');
  w('-- Compatible with production Prisma schema\n\n');

  // ─────────────────────────────────────────────
  // 1. Categories (schema: id, name, slug, parentId, icon, seoTitle, seoDesc, sortOrder)
  // ─────────────────────────────────────────────
  console.log('📁 Exporting categories...');
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });

  // Delete children first (FK constraint), then parents
  w('-- Clear existing categories (order matters for FK)\n');
  w('DELETE FROM "Category" WHERE "parentId" IS NOT NULL;\n');
  w('DELETE FROM "Category" WHERE "parentId" IS NOT NULL;\n'); // 2nd pass for L3→L2
  w('DELETE FROM "Category";\n\n');

  // Insert parents first, then children
  const l1 = categories.filter(c => !c.parentId);
  const l2 = categories.filter(c => c.parentId && l1.some(p => p.id === c.parentId));
  const l3 = categories.filter(c => c.parentId && l2.some(p => p.id === c.parentId));

  for (const cats of [l1, l2, l3]) {
    for (const c of cats) {
      w(`INSERT INTO "Category" (id, name, slug, "parentId", icon, "seoTitle", "seoDesc", "sortOrder") VALUES (${c.id}, ${esc(c.name)}, ${esc(c.slug)}, ${c.parentId || 'NULL'}, ${esc(c.icon)}, ${esc(c.seoTitle)}, ${esc(c.seoDesc)}, ${num(c.sortOrder)}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, "parentId"=EXCLUDED."parentId", icon=EXCLUDED.icon, "seoTitle"=EXCLUDED."seoTitle", "seoDesc"=EXCLUDED."seoDesc", "sortOrder"=EXCLUDED."sortOrder";\n`);
    }
  }
  console.log(`  ✅ ${categories.length} categories (L1:${l1.length}, L2:${l2.length}, L3:${l3.length})`);

  // ─────────────────────────────────────────────
  // 2. Manufacturers (schema: id, name, slug, logo, website, country)
  // ─────────────────────────────────────────────
  console.log('\n🏭 Exporting manufacturers...');
  const mfrs = await prisma.manufacturer.findMany({ orderBy: { id: 'asc' } });
  w('\n-- Manufacturers\n');
  for (const m of mfrs) {
    w(`INSERT INTO "Manufacturer" (id, name, slug, logo, website, country) VALUES (${m.id}, ${esc(m.name)}, ${esc(m.slug)}, ${esc(m.logo)}, ${esc(m.website)}, ${esc(m.country)}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, logo=EXCLUDED.logo, website=EXCLUDED.website, country=EXCLUDED.country;\n`);
  }
  console.log(`  ✅ ${mfrs.length} manufacturers`);

  // ─────────────────────────────────────────────
  // 3. Products (schema matches existing dump format)
  // ─────────────────────────────────────────────
  console.log('\n📦 Exporting products...');
  const total = await prisma.product.count();
  w('\n-- Products\n');

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
      w(`INSERT INTO "Product" (id, "partNumber", manufacturer, description, "categoryId", "packageType", "mountType", status, stock, "minPrice", moq, "leadTime", datasheet, "imageUrl", specs, "createdAt", "updatedAt") VALUES (${p.id}, ${esc(p.partNumber)}, ${esc(p.manufacturer)}, ${esc(p.description)}, ${p.categoryId || 'NULL'}, ${esc(p.packageType)}, ${esc(p.mountType)}, ${esc(p.status)}, ${num(p.stock)}, ${p.minPrice ?? 'NULL'}, ${num(p.moq, 1)}, ${esc(p.leadTime)}, ${esc(p.datasheet)}, ${esc(p.imageUrl)}, ${esc(p.specs)}, ${dt(p.createdAt)}, ${dt(p.updatedAt)}) ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description, "categoryId"=EXCLUDED."categoryId", "packageType"=EXCLUDED."packageType", "mountType"=EXCLUDED."mountType", status=EXCLUDED.status, stock=EXCLUDED.stock, "minPrice"=EXCLUDED."minPrice", specs=EXCLUDED.specs, "updatedAt"=EXCLUDED."updatedAt";\n`);
    }

    cursor = products[products.length - 1].id;
    dumped += products.length;

    // Backpressure
    if (!out.write('')) {
      await new Promise(r => out.once('drain', r));
    }

    if (dumped % 20000 === 0) {
      console.log(`  ${dumped.toLocaleString()} / ${total.toLocaleString()} (${Math.round(dumped/total*100)}%)`);
    }
  }
  console.log(`  ✅ ${dumped.toLocaleString()} products total`);

  // ─────────────────────────────────────────────
  // 4. Reset sequences
  // ─────────────────────────────────────────────
  w('\n-- Reset auto-increment sequences\n');
  w(`SELECT setval('"Category_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Category"));\n`);
  w(`SELECT setval('"Manufacturer_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Manufacturer"));\n`);
  w(`SELECT setval('"Product_id_seq"', (SELECT COALESCE(MAX(id),1) FROM "Product"));\n`);

  // Close stream
  await new Promise(r => out.end(r));

  console.log('\n' + '='.repeat(50));
  console.log('✅ Export complete: fpgacenter_production.sql');
  console.log('='.repeat(50));
  console.log('\n📋 To import on VPS:');
  console.log('   1. Upload fpgacenter_production.sql to VPS');
  console.log('   2. Run: psql $DATABASE_URL < fpgacenter_production.sql');

  await prisma.$disconnect();
}

main().catch(e => { console.error('❌ Error:', e); process.exit(1); });
