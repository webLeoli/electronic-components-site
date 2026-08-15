/**
 * Create Manufacturer rows for brands that exist in Product but have no profile
 * row yet.
 *
 * This script used to be the main source of duplicate brands: it took every
 * distinct Product.manufacturer string at face value, so "Analog Devices Inc."
 * became a second brand page next to "Analog Devices" — and an empty one, since
 * the products sat under the other spelling. It now refuses to create a row for
 * any spelling that lib/manufacturer-canonical.js knows is an alias, and reports
 * them instead: those rows need scripts/merge-manufacturers.mjs, not a new page.
 */
import { PrismaClient } from '@prisma/client';
import {
  canonicalManufacturer,
  manufacturerSlug,
} from '../src/lib/manufacturer-canonical.js';

const prisma = new PrismaClient();

async function run() {
  const allMfrs = await prisma.manufacturer.findMany({ select: { name: true, slug: true } });
  const mfrSlugs = new Set(allMfrs.map(m => m.slug));
  const mfrNames = new Set(allMfrs.map(m => m.name));

  const productMfrs = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT "manufacturer" FROM "Product" WHERE "manufacturer" IS NOT NULL AND "manufacturer" != '' ORDER BY "manufacturer"`
  );

  const missing = [];
  const needsMerge = [];
  for (const row of productMfrs) {
    const name = row.manufacturer;
    const canonical = canonicalManufacturer(name);

    if (canonical !== name) {
      // The catalogue still holds a duplicate spelling. Creating a brand page for
      // it would re-fork the URL space; the products have to move instead.
      needsMerge.push({ name, canonical });
      continue;
    }

    const slug = manufacturerSlug(name);
    if (!mfrSlugs.has(slug) && !mfrNames.has(name)) {
      missing.push({ name, slug });
    }
  }

  if (needsMerge.length > 0) {
    console.log(`⚠️  ${needsMerge.length} 个产品厂商名仍是重复拼写，未建页面：`);
    for (const m of needsMerge) console.log(`   "${m.name}" → 应为 "${m.canonical}"`);
    console.log('   跑 node scripts/merge-manufacturers.mjs 合并它们。\n');
  }

  console.log(`需要补充的厂商: ${missing.length} 个\n`);

  if (missing.length === 0) {
    console.log('没有缺失的厂商，无需操作。');
    await prisma.$disconnect();
    return;
  }

  // Batch insert
  let created = 0;
  for (const m of missing) {
    try {
      await prisma.manufacturer.create({
        data: { name: m.name, slug: m.slug },
      });
      console.log(`  ✅ ${m.name} (${m.slug})`);
      created++;
    } catch (e) {
      if (e.code === 'P2002') {
        console.log(`  ⚠️  ${m.name} — slug冲突，跳过`);
      } else {
        console.log(`  ❌ ${m.name} — ${e.message}`);
      }
    }
  }

  console.log(`\n完成: 新增 ${created} 个厂商`);
  const totalNow = await prisma.manufacturer.count();
  console.log(`Manufacturer表现在共: ${totalNow} 条记录`);

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
