/**
 * Import products from ics.jsonl into local PostgreSQL database
 * Stream-based for large files (700k+ records)
 * Usage: node scripts/import-jsonl.mjs "C:\Users\Acer\Downloads\ics.jsonl"
 */

import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { resolve } from 'path';

const prisma = new PrismaClient();
const BATCH_SIZE = 200;

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/\$([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function parseStock(stockStr) {
  if (!stockStr) return 0;
  const num = parseInt(stockStr.replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function parseMoq(moqStr) {
  if (!moqStr) return 1;
  const num = parseInt(moqStr, 10);
  return isNaN(num) ? 1 : num;
}

function mapStatus(productStatus) {
  if (!productStatus) return 'active';
  const lower = productStatus.toLowerCase();
  if (lower.includes('obsolete') || lower.includes('discontinued')) return 'obsolete';
  if (lower.includes('nrnd') || lower.includes('not recommended')) return 'nrnd';
  if (lower.includes('last')) return 'lastbuy';
  return 'active';
}

async function main() {
  const filePath = process.argv[2] || 'C:\\Users\\Acer\\Downloads\\ics.jsonl';
  console.log(`📂 Reading file: ${filePath}`);

  // Phase 1: First pass - collect categories and manufacturers
  console.log('\n🔍 Phase 1: Scanning for categories and manufacturers...');
  const categoryMap = new Map();
  const manufacturerSet = new Map();
  let totalLines = 0;

  const rl1 = createInterface({
    input: createReadStream(resolve(filePath), { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl1) {
    if (!line.trim()) continue;
    totalLines++;
    try {
      const item = JSON.parse(line);
      const manufacturer = item['Manufacturer'] || 'Unknown';
      const mfrSlug = slugify(manufacturer);
      manufacturerSet.set(manufacturer, mfrSlug);

      const specs = item.specifications || {};
      const catString = specs['Category'];
      if (catString) {
        const parts = catString.split('/');
        const parentName = parts[0]?.trim();
        const childName = parts[1]?.trim();

        if (parentName) {
          const parentSlug = slugify(parentName);
          if (!categoryMap.has(parentSlug)) {
            categoryMap.set(parentSlug, { name: parentName, slug: parentSlug, parentSlug: null });
          }
          if (childName) {
            const childSlug = slugify(childName);
            if (!categoryMap.has(childSlug)) {
              categoryMap.set(childSlug, { name: childName, slug: childSlug, parentSlug });
            }
          }
        }
      }
    } catch (e) { /* skip */ }

    if (totalLines % 100000 === 0) console.log(`  Scanned ${totalLines.toLocaleString()} lines...`);
  }

  console.log(`  ✅ Total lines: ${totalLines.toLocaleString()}`);
  console.log(`  📁 ${categoryMap.size} unique categories`);
  console.log(`  🏭 ${manufacturerSet.size} unique manufacturers`);

  // Phase 2: Create categories
  console.log('\n📁 Phase 2: Creating categories...');
  const categoryIdMap = new Map();

  // Parents first
  for (const [slug, cat] of categoryMap) {
    if (!cat.parentSlug) {
      const r = await prisma.category.upsert({
        where: { slug },
        update: { name: cat.name },
        create: { name: cat.name, slug },
      });
      categoryIdMap.set(slug, r.id);
    }
  }
  // Then children
  for (const [slug, cat] of categoryMap) {
    if (cat.parentSlug) {
      const parentId = categoryIdMap.get(cat.parentSlug) || null;
      const r = await prisma.category.upsert({
        where: { slug },
        update: { name: cat.name, parentId },
        create: { name: cat.name, slug, parentId },
      });
      categoryIdMap.set(slug, r.id);
    }
  }
  console.log(`  ✅ ${categoryIdMap.size} categories created/updated`);

  // Phase 3: Create manufacturers
  console.log('\n🏭 Phase 3: Creating manufacturers...');
  for (const [name, slug] of manufacturerSet) {
    await prisma.manufacturer.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  console.log(`  ✅ ${manufacturerSet.size} manufacturers created/updated`);

  // Phase 4: Second pass - import products
  console.log(`\n📦 Phase 4: Importing products (batch size: ${BATCH_SIZE})...`);
  let imported = 0;
  let skipped = 0;
  let lineNum = 0;
  let batch = [];

  const rl2 = createInterface({
    input: createReadStream(resolve(filePath), { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  async function flushBatch() {
    if (batch.length === 0) return;
    const ops = batch.map(r => {
      return prisma.product.upsert({
        where: { partNumber: r.partNumber },
        update: {
          manufacturer: r.manufacturer,
          description: r.description,
          categoryId: r.categoryId,
          packageType: r.packageType,
          mountType: r.mountType,
          status: r.status,
          minPrice: r.minPrice,
          stock: r.stock,
          moq: r.moq,
          specs: r.specs,
        },
        create: {
          partNumber: r.partNumber,
          manufacturer: r.manufacturer,
          description: r.description,
          categoryId: r.categoryId,
          packageType: r.packageType,
          mountType: r.mountType,
          status: r.status,
          minPrice: r.minPrice,
          stock: r.stock,
          moq: r.moq,
          specs: r.specs,
        },
      });
    });

    try {
      await prisma.$transaction(ops);
      imported += batch.length;
    } catch (e) {
      // Fallback: one by one
      for (const r of batch) {
        try {
          await prisma.product.upsert({
            where: { partNumber: r.partNumber },
            update: {
              manufacturer: r.manufacturer,
              description: r.description,
              categoryId: r.categoryId,
              packageType: r.packageType,
              mountType: r.mountType,
              status: r.status,
              minPrice: r.minPrice,
              stock: r.stock,
              moq: r.moq,
              specs: r.specs,
            },
            create: {
              partNumber: r.partNumber,
              manufacturer: r.manufacturer,
              description: r.description,
              categoryId: r.categoryId,
              packageType: r.packageType,
              mountType: r.mountType,
              status: r.status,
              minPrice: r.minPrice,
              stock: r.stock,
              moq: r.moq,
              specs: r.specs,
            },
          });
          imported++;
        } catch (e2) {
          skipped++;
        }
      }
    }
    batch = [];
  }

  for await (const line of rl2) {
    if (!line.trim()) continue;
    lineNum++;

    try {
      const item = JSON.parse(line);
      const partNumber = item['Mfr.Part #'];
      if (!partNumber) { skipped++; continue; }

      const specs = item.specifications || {};
      const catString = specs['Category'];
      let categoryId = null;
      if (catString) {
        const parts = catString.split('/');
        const childName = parts[1]?.trim();
        const parentName = parts[0]?.trim();
        if (childName) categoryId = categoryIdMap.get(slugify(childName)) || null;
        if (!categoryId && parentName) categoryId = categoryIdMap.get(slugify(parentName)) || null;
      }

      const pkg = specs['Package /  Case'] || item['Package'] || null;

      batch.push({
        partNumber,
        manufacturer: item['Manufacturer'] || 'Unknown',
        description: item['Description'] || null,
        categoryId,
        packageType: pkg && pkg !== '-' ? pkg : null,
        mountType: specs['Mounting  Type'] || null,
        status: mapStatus(specs['Product  Status']),
        minPrice: parsePrice(item['Unit Price']),
        stock: parseStock(item['stock']),
        moq: parseMoq(item['moq']),
        specs: Object.keys(specs).length > 0 ? JSON.stringify(specs) : null,
      });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
        const pct = (lineNum / totalLines * 100).toFixed(1);
        process.stdout.write(`\r  📦 ${lineNum.toLocaleString()} / ${totalLines.toLocaleString()} (${pct}%) | ✅ ${imported.toLocaleString()} imported, ⚠️ ${skipped} skipped`);
      }
    } catch (e) {
      skipped++;
    }
  }

  // Flush remaining
  await flushBatch();

  console.log('\n');
  console.log('='.repeat(50));
  console.log(`✅ Import complete!`);
  console.log(`   Products imported: ${imported.toLocaleString()}`);
  console.log(`   Products skipped:  ${skipped.toLocaleString()}`);
  console.log(`   Categories:        ${categoryIdMap.size}`);
  console.log(`   Manufacturers:     ${manufacturerSet.size}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
