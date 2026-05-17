// Produce a JSON snapshot of every category with the data we need to build
// per-category SEO copy:
//   - product count (direct + transitive — products in descendant L2/L3 also count)
//   - top 3 manufacturers by product count
//   - top 5 part numbers (highest qualityScore as proxy for popularity)
//   - existing seoTitle / seoDesc (so we can preserve hand-curated ones if any)
//   - child category names (for L1 aggregation pages)
//   - example package types and temperature ranges (for richer copy)
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');

(async () => {
  const p = new PrismaClient();

  const categories = await p.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true, seoTitle: true, seoDesc: true, sortOrder: true },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  // Build parent → children map for transitive counting
  const byParent = new Map();
  for (const c of categories) {
    const k = c.parentId ?? '__root__';
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(c);
  }
  function descendantIds(id) {
    const out = [id];
    const children = byParent.get(id) || [];
    for (const ch of children) out.push(...descendantIds(ch.id));
    return out;
  }

  const result = [];
  for (const c of categories) {
    const ids = descendantIds(c.id);

    const productCount = await p.product.count({ where: { categoryId: { in: ids } } });
    if (productCount === 0) {
      result.push({
        id: c.id, slug: c.slug, name: c.name, parentId: c.parentId,
        existingSeoTitle: c.seoTitle, existingSeoDesc: c.seoDesc,
        productCount: 0, topMfrs: [], topParts: [], childNames: [],
        packageSamples: [], tempRanges: [],
      });
      continue;
    }

    const topMfrs = await p.$queryRawUnsafe(
      `SELECT manufacturer, COUNT(*)::int AS c FROM "Product" WHERE "categoryId" = ANY($1::int[]) AND manufacturer IS NOT NULL AND manufacturer != '' GROUP BY manufacturer ORDER BY c DESC LIMIT 3`,
      ids,
    );
    const topParts = await p.product.findMany({
      where: { categoryId: { in: ids }, indexable: true },
      select: { partNumber: true, manufacturer: true, qualityScore: true },
      orderBy: { qualityScore: 'desc' },
      take: 5,
    });
    const indexableCount = await p.product.count({ where: { categoryId: { in: ids }, indexable: true } });
    const childNames = (byParent.get(c.id) || []).map(ch => ch.name);

    // Sample package types and temperature ranges from indexable products
    const packageSamples = (await p.$queryRawUnsafe(
      `SELECT "packageType", COUNT(*)::int AS c FROM "Product" WHERE "categoryId" = ANY($1::int[]) AND "packageType" IS NOT NULL AND "packageType" != '' GROUP BY "packageType" ORDER BY c DESC LIMIT 5`,
      ids,
    )).map(r => r.packageType);

    result.push({
      id: c.id, slug: c.slug, name: c.name, parentId: c.parentId,
      existingSeoTitle: c.seoTitle, existingSeoDesc: c.seoDesc,
      productCount,
      indexableCount,
      topMfrs: topMfrs.map(r => r.manufacturer),
      topParts: topParts.map(r => r.partNumber),
      childNames,
      packageSamples,
    });
  }

  fs.writeFileSync('scripts/categories-snapshot.json', JSON.stringify(result, null, 2));
  console.log(`✓ Wrote scripts/categories-snapshot.json — ${result.length} categories`);
  console.log(`  ${result.filter(r => r.productCount > 0).length} non-empty`);
  console.log(`  ${result.filter(r => !r.existingSeoDesc).length} missing seoDesc`);
  console.log(`  ${result.filter(r => !r.existingSeoTitle).length} missing seoTitle`);

  await p.$disconnect();
})();
