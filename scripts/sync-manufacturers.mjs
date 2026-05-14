import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function slugify(name) {
  return (name || 'unknown')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const allMfrs = await prisma.manufacturer.findMany({ select: { name: true, slug: true } });
  const mfrSlugs = new Set(allMfrs.map(m => m.slug));
  const mfrNames = new Set(allMfrs.map(m => m.name));

  const productMfrs = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT "manufacturer" FROM "Product" WHERE "manufacturer" IS NOT NULL AND "manufacturer" != '' ORDER BY "manufacturer"`
  );

  const missing = [];
  for (const row of productMfrs) {
    const name = row.manufacturer;
    const slug = slugify(name);
    if (!mfrSlugs.has(slug) && !mfrNames.has(name)) {
      missing.push({ name, slug });
    }
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
