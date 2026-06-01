// 抓出 8000 产品（含 Silver/Bronze/no-tier），看 v2 classifier 的 fallback 分布。
// 通过实际 import desc-templates.js 保证用的是当前规则。
const { PrismaClient } = require('@prisma/client');

(async () => {
  const { classifyCategory } = (await import('../src/lib/desc-templates.js'))._internals;

  const p = new PrismaClient();
  const SAMPLE = 8000;

  // Skip the early seed range; sample from the middle/back of the ID space
  // to mirror the user's earlier 32.5% fallback observation.
  const offset = parseInt(process.env.OFFSET || '300000', 10);
  const products = await p.product.findMany({
    where: { id: { gt: offset } },
    include: { category: { include: { parent: true } } },
    take: SAMPLE,
    orderBy: { id: 'asc' },
  });

  const fallbackCats = {};
  const fallbackParents = {};
  let fallbacks = 0;

  for (const prod of products) {
    const result = classifyCategory(prod.category?.name, prod.category?.parent?.name);
    if (result.noun === 'integrated circuit') {
      fallbacks++;
      const catName = prod.category?.name || '(no category)';
      const parentName = prod.category?.parent?.name || '(no parent)';
      const key = `${parentName} / ${catName}`;
      fallbackCats[key] = (fallbackCats[key] || 0) + 1;
      fallbackParents[parentName] = (fallbackParents[parentName] || 0) + 1;
    }
  }

  console.log(`\nSampled ${products.length} products (any tier)`);
  console.log(`Fallback to 'integrated circuit': ${fallbacks} (${(fallbacks / products.length * 100).toFixed(2)}%)\n`);

  if (fallbacks > 0) {
    console.log('Top fallback (parent / category) combinations:');
    console.log('-----------------------------------------------');
    Object.entries(fallbackCats).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, c]) => {
      console.log(`  ${String(c).padStart(4)}  ${k}`);
    });
  }

  await p.$disconnect();
})();
