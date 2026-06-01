// Replay the queries that src/app/category/[[...slug]]/page.js runs for an L1,
// but instrumented with timings. No HTTP — talk to Prisma directly so the
// numbers reflect database latency without the Next.js render overhead.
const { PrismaClient } = require('@prisma/client');

const SLUG = process.argv[2] || 'embedded';
const ITEMS_PER_PAGE = 20;

(async () => {
  const prisma = new PrismaClient();
  const total0 = Date.now();

  console.log(`\n=== Replay queries for /category/${SLUG} ===\n`);

  let t = Date.now();
  const category = await prisma.category.findUnique({
    where: { slug: SLUG },
    include: {
      parent: { include: { parent: true } },
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
          children: {
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { products: true } } },
          },
        },
      },
    },
  });
  console.log(`  Q1 category (+children +grandchildren +counts):  ${Date.now() - t}ms`);
  if (!category) { console.log('not found'); await prisma.$disconnect(); return; }

  const categoryIds = [category.id];
  if (category.children?.length) {
    for (const ch of category.children) {
      categoryIds.push(ch.id);
      if (ch.children) categoryIds.push(...ch.children.map(gc => gc.id));
    }
  }
  console.log(`  → categoryIds (${categoryIds.length}): ${categoryIds.slice(0, 8).join(',')}${categoryIds.length > 8 ? '…' : ''}`);

  t = Date.now();
  const totalProducts = await prisma.product.count({
    where: { categoryId: { in: categoryIds } },
  });
  console.log(`  Q2 product.count where categoryId IN (…):        ${Date.now() - t}ms  → ${totalProducts.toLocaleString()} rows`);

  t = Date.now();
  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } },
    orderBy: { partNumber: 'asc' },
    skip: 0,
    take: ITEMS_PER_PAGE,
    include: { category: { select: { slug: true, name: true } } },
  });
  console.log(`  Q3 product.findMany skip=0 take=20 order partNumber: ${Date.now() - t}ms  → ${products.length} rows`);

  // Also try page 50 (deep pagination) to see if offset hurts
  t = Date.now();
  const productsDeep = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } },
    orderBy: { partNumber: 'asc' },
    skip: 1000,
    take: ITEMS_PER_PAGE,
    include: { category: { select: { slug: true, name: true } } },
  });
  console.log(`  Q4 product.findMany skip=1000 take=20 (page 50):   ${Date.now() - t}ms  → ${productsDeep.length} rows`);

  console.log(`\n  TOTAL DB time: ${Date.now() - total0}ms`);

  // Show the actual SQL the count generates (EXPLAIN-like)
  console.log(`\n=== EXPLAIN ANALYZE for the count query ===`);
  t = Date.now();
  const explain = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT COUNT(*) FROM "Product" WHERE "categoryId" = ANY($1::int[])`,
    categoryIds,
  );
  console.log(explain.map(r => r['QUERY PLAN']).join('\n'));
  console.log(`  (EXPLAIN took ${Date.now() - t}ms)`);

  await prisma.$disconnect();
})();
