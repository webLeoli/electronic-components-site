import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function compare() {
  const total = await prisma.product.count();
  
  const descDist = await prisma.$queryRawUnsafe(`
    SELECT 
      CASE 
        WHEN LENGTH(description) <= 30 THEN '01: 0-30 chars'
        WHEN LENGTH(description) <= 50 THEN '02: 31-50 chars'
        WHEN LENGTH(description) <= 80 THEN '03: 51-80 chars'
        WHEN LENGTH(description) <= 120 THEN '04: 81-120 chars'
        WHEN LENGTH(description) <= 200 THEN '05: 121-200 chars'
        WHEN LENGTH(description) <= 300 THEN '06: 201-300 chars'
        ELSE '07: 300+ chars'
      END as range,
      COUNT(*)::int as cnt
    FROM "Product"
    WHERE description IS NOT NULL AND description != ''
    GROUP BY range
    ORDER BY range
  `);
  
  console.log('=== Description Length Distribution (AFTER enrichment) ===\n');
  descDist.forEach(r => {
    const pct = (r.cnt / total * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(r.cnt / total * 50));
    console.log(`  ${r.range}: ${r.cnt.toLocaleString().padStart(8)} (${pct.padStart(5)}%) ${bar}`);
  });

  const avgLen = await prisma.$queryRawUnsafe(
    `SELECT AVG(LENGTH(description))::int as avg_len FROM "Product" WHERE description IS NOT NULL AND description != ''`
  );
  console.log(`\n  Average description length: ${avgLen[0].avg_len} chars`);

  const gt40 = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as cnt FROM "Product" WHERE LENGTH(description) > 40`
  );
  console.log(`  Products with desc > 40 chars: ${gt40[0].cnt.toLocaleString()} (${(gt40[0].cnt/total*100).toFixed(1)}%)`);

  const unique = await prisma.$queryRawUnsafe(
    `SELECT COUNT(DISTINCT LEFT(description, 80))::int as cnt FROM "Product" WHERE description IS NOT NULL AND description != ''`
  );
  console.log(`  Unique descriptions (80 chars): ${unique[0].cnt.toLocaleString()}`);

  console.log('\n=== BEFORE vs AFTER ===');
  console.log('  BEFORE: avg 29 chars | 1.6% > 40 chars | 132K unique');
  console.log(`  AFTER:  avg ${avgLen[0].avg_len} chars | ${(gt40[0].cnt/total*100).toFixed(1)}% > 40 chars | ${unique[0].cnt.toLocaleString()} unique`);

  await prisma.$disconnect();
}
compare();
