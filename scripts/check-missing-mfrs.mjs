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
  const mfrCount = await prisma.manufacturer.count();
  const allMfrs = await prisma.manufacturer.findMany({ select: { name: true, slug: true } });
  const mfrSlugs = new Set(allMfrs.map(m => m.slug));
  const mfrNames = new Set(allMfrs.map(m => m.name));

  // Get distinct manufacturers from Product table
  const productMfrs = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT "manufacturer" FROM "Product" WHERE "manufacturer" IS NOT NULL AND "manufacturer" != '' ORDER BY "manufacturer"`
  );

  console.log(`Manufacturer表: ${mfrCount} 条记录`);
  console.log(`Product表不同厂商: ${productMfrs.length} 个`);

  // Find missing
  const missing = [];
  for (const row of productMfrs) {
    const name = row.manufacturer;
    const slug = slugify(name);
    if (!mfrSlugs.has(slug) && !mfrNames.has(name)) {
      missing.push({ name, slug });
    }
  }

  console.log(`\n缺失的厂商: ${missing.length} 个\n`);

  if (missing.length <= 100) {
    missing.forEach((m, i) => console.log(`  ${i+1}. ${m.name} → slug: ${m.slug}`));
  } else {
    missing.slice(0, 50).forEach((m, i) => console.log(`  ${i+1}. ${m.name} → slug: ${m.slug}`));
    console.log(`  ... 还有 ${missing.length - 50} 个`);
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
