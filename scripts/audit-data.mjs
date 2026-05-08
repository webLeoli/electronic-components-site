import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
  const total = await prisma.product.count();
  const withDesc = await prisma.product.count({ where: { description: { not: '' } } });
  const withSpecs = await prisma.product.count({ where: { specs: { not: null } } });
  const emptySpecs = await prisma.product.count({ where: { OR: [{ specs: null }, { specs: '{}' }, { specs: '' }] } });
  const withPrice = await prisma.product.count({ where: { minPrice: { gt: 0 } } });
  const withStock = await prisma.product.count({ where: { stock: { gt: 0 } } });
  const withPkg = await prisma.product.count({ where: { packageType: { not: null } } });
  const withMount = await prisma.product.count({ where: { mountType: { not: null } } });
  const withDS = await prisma.product.count({ where: { datasheet: { not: null } } });
  const withImg = await prisma.product.count({ where: { imageUrl: { not: null } } });
  
  // Check description uniqueness
  const uniqueDescs = await prisma.$queryRawUnsafe(
    `SELECT COUNT(DISTINCT LEFT(description, 80)) as cnt FROM "Product" WHERE description IS NOT NULL AND description != ''`
  );
  
  // Average description length
  const avgLen = await prisma.$queryRawUnsafe(
    `SELECT AVG(LENGTH(description))::int as avg_len, MIN(LENGTH(description)) as min_len, MAX(LENGTH(description)) as max_len FROM "Product" WHERE description IS NOT NULL AND description != ''`
  );
  
  // Sample 5 descriptions
  const samples = await prisma.product.findMany({
    select: { partNumber: true, description: true, manufacturer: true, specs: true },
    where: { description: { not: '' } },
    take: 5,
    orderBy: { id: 'asc' }
  });
  
  // Manufacturer distribution - top 20
  const topMfrs = await prisma.$queryRawUnsafe(
    `SELECT manufacturer, COUNT(*)::int as cnt FROM "Product" GROUP BY manufacturer ORDER BY cnt DESC LIMIT 20`
  );
  
  // Status distribution
  const statusDist = await prisma.$queryRawUnsafe(
    `SELECT status, COUNT(*)::int as cnt FROM "Product" GROUP BY status ORDER BY cnt DESC`
  );

  // How many products have stock > 0 AND price > 0 (real "buyable" products)
  const buyable = await prisma.product.count({ where: { stock: { gt: 0 }, minPrice: { gt: 0 } } });

  console.log('=== FPGACenter Data Quality Audit ===\n');
  console.log(`Total Products: ${total.toLocaleString()}`);
  console.log(`\n--- Field Coverage ---`);
  console.log(`Description:  ${withDesc.toLocaleString()} (${(withDesc/total*100).toFixed(1)}%)`);
  console.log(`Specs JSON:   ${(total-emptySpecs).toLocaleString()} non-empty (${((total-emptySpecs)/total*100).toFixed(1)}%)`);
  console.log(`Price > $0:   ${withPrice.toLocaleString()} (${(withPrice/total*100).toFixed(1)}%)`);
  console.log(`Stock > 0:    ${withStock.toLocaleString()} (${(withStock/total*100).toFixed(1)}%)`);
  console.log(`Package Type: ${withPkg.toLocaleString()} (${(withPkg/total*100).toFixed(1)}%)`);
  console.log(`Mount Type:   ${withMount.toLocaleString()} (${(withMount/total*100).toFixed(1)}%)`);
  console.log(`Datasheet:    ${withDS.toLocaleString()} (${(withDS/total*100).toFixed(1)}%)`);
  console.log(`Image:        ${withImg.toLocaleString()} (${(withImg/total*100).toFixed(1)}%)`);
  console.log(`Buyable (stock+price): ${buyable.toLocaleString()} (${(buyable/total*100).toFixed(1)}%)`);
  
  console.log(`\n--- Description Quality ---`);
  console.log(`Unique descriptions (first 80 chars): ${uniqueDescs[0].cnt.toLocaleString()}`);
  console.log(`Avg length: ${avgLen[0].avg_len} chars | Min: ${avgLen[0].min_len} | Max: ${avgLen[0].max_len}`);
  
  console.log(`\n--- Sample Descriptions ---`);
  samples.forEach(s => {
    console.log(`  ${s.partNumber}: "${s.description?.substring(0, 120)}..."`);
    if (s.specs) {
      const sp = JSON.parse(s.specs);
      console.log(`    specs keys: [${Object.keys(sp).join(', ')}]`);
    }
  });
  
  console.log(`\n--- Top 20 Manufacturers ---`);
  topMfrs.forEach(m => console.log(`  ${m.manufacturer}: ${m.cnt.toLocaleString()}`));
  
  console.log(`\n--- Status Distribution ---`);
  statusDist.forEach(s => console.log(`  ${s.status}: ${s.cnt.toLocaleString()}`));

  await prisma.$disconnect();
}

audit().catch(e => { console.error(e); process.exit(1); });
