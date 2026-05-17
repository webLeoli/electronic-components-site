const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const out = {};

  // 1. Indexable distribution
  out.totalProducts = await p.product.count();
  out.indexableProducts = await p.product.count({ where: { indexable: true } });
  out.indexableNoIndexableFlag = await p.product.count({ where: { indexable: false, qualityScore: { gte: 45 } } });

  // 2. Quality score tiers
  const gold = await p.product.count({ where: { qualityScore: { gte: 70 } } });
  const silver = await p.product.count({ where: { qualityScore: { gte: 45, lt: 70 } } });
  const bronze = await p.product.count({ where: { qualityScore: { gte: 20, lt: 45 } } });
  const noindex = await p.product.count({ where: { qualityScore: { lt: 20 } } });
  out.tierBreakdown = { gold, silver, bronze, noindex };

  // 3. Data completeness
  out.withImage = await p.product.count({ where: { imageUrl: { not: null } } });
  out.withDatasheet = await p.product.count({ where: { datasheet: { not: null } } });
  out.withPrice = await p.product.count({ where: { minPrice: { gt: 0 } } });
  out.withStock = await p.product.count({ where: { stock: { gt: 0 } } });
  out.descShort = await p.product.count({ where: { description: { contains: ' ' }, AND: [{ description: { not: null } }] } });

  // 4. Categories
  out.categoryRoots = await p.category.count({ where: { parentId: null } });
  out.totalCategories = await p.category.count();

  // 5. Manufacturers
  out.manufacturersInTable = await p.manufacturer.count();
  out.distinctMfrInProducts = (await p.$queryRawUnsafe(
    `SELECT COUNT(DISTINCT manufacturer)::int AS c FROM "Product"`
  ))[0].c;

  // 6. Top mfrs by product count
  out.topMfrs = await p.$queryRawUnsafe(
    `SELECT manufacturer, COUNT(*)::int AS c FROM "Product" GROUP BY manufacturer ORDER BY c DESC LIMIT 10`
  );

  // 7. Indexable by mfr (top 10)
  out.indexableByMfr = await p.$queryRawUnsafe(
    `SELECT manufacturer, COUNT(*)::int AS total, SUM(CASE WHEN indexable THEN 1 ELSE 0 END)::int AS indexable
     FROM "Product" GROUP BY manufacturer ORDER BY total DESC LIMIT 10`
  );

  // 8. Description quality samples
  out.veryShortDesc = await p.product.count({
    where: { description: { contains: ' ' }, AND: [{ description: { not: null } }] }
  });
  const shortDescSample = await p.product.findMany({
    select: { partNumber: true, manufacturer: true, description: true },
    take: 5,
    orderBy: { id: 'asc' },
  });
  out.descSample = shortDescSample;

  // 9. Categorization
  out.uncategorized = await p.product.count({ where: { categoryId: null } });

  // 10. Blog
  out.blogPostsPublished = await p.blogPost.count({ where: { status: 'published' } });
  out.blogPostsTotal = await p.blogPost.count();

  // 11. Recent RFQ
  out.rfqLast30Days = await p.rfqSubmission.count({
    where: { submittedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  out.rfqTotal = await p.rfqSubmission.count();

  // 12. ContactSubmission
  out.contactLast30Days = await p.contactSubmission.count({
    where: { submittedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });

  // 13. Sitemap math
  out.sitemapProductFiles = Math.ceil(out.indexableProducts / 5000);

  // 14. Manufacturer record completeness
  const mfrSample = await p.manufacturer.findMany({ take: 5 });
  out.mfrSample = mfrSample.map(m => ({
    name: m.name,
    hasDesc: !!m.description,
    descLen: m.description?.length || 0,
    hasWebsite: !!m.website,
    hasSpecialties: !!m.specialties,
    hasHQ: !!m.headquarters,
  }));
  out.mfrWithDesc = await p.manufacturer.count({ where: { description: { not: null } } });
  out.mfrWithSpecialties = await p.manufacturer.count({ where: { specialties: { not: null } } });

  // 15. Categories without products
  out.emptyCategories = await p.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS c FROM "Category" c WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."categoryId" = c.id) AND NOT EXISTS (SELECT 1 FROM "Category" cc WHERE cc."parentId" = c.id)`
  );

  // 16. Categories without SEO desc
  out.categoriesWithoutSeoDesc = await p.category.count({ where: { seoDesc: null } });

  console.log(JSON.stringify(out, (k, v) => typeof v === 'bigint' ? Number(v) : v, 2));
  await p.$disconnect();
})();
