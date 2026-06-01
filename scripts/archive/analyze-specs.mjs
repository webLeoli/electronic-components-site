import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyze() {
  // Sample products from different categories to understand specs structure
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true, slug: true },
    take: 15,
  });

  for (const cat of categories) {
    const product = await prisma.product.findFirst({
      where: { categoryId: cat.id, specs: { not: null } },
      select: { partNumber: true, manufacturer: true, description: true, specs: true, packageType: true, mountType: true, status: true },
    });
    if (!product) continue;

    const specs = JSON.parse(product.specs || '{}');
    const specKeys = Object.keys(specs);
    
    console.log(`\n=== ${cat.name} (${cat.slug}) ===`);
    console.log(`  Part: ${product.partNumber} by ${product.manufacturer}`);
    console.log(`  Current desc: "${product.description}" (${product.description?.length} chars)`);
    console.log(`  Spec keys (${specKeys.length}):`);
    
    // Show all spec key-value pairs
    for (const [k, v] of Object.entries(specs)) {
      const cleanKey = k.trim().replace(/\s+/g, ' ');
      console.log(`    "${cleanKey}": "${String(v).substring(0, 60)}"`);
    }
  }

  // Find the most common spec keys across all products
  console.log('\n\n=== Most Common Spec Keys (sampled) ===');
  const sample = await prisma.product.findMany({
    where: { specs: { not: null } },
    select: { specs: true },
    take: 1000,
    orderBy: { id: 'asc' },
  });
  
  const keyCount = {};
  sample.forEach(p => {
    try {
      const specs = JSON.parse(p.specs);
      Object.keys(specs).forEach(k => {
        const clean = k.trim().replace(/\s+/g, ' ');
        keyCount[clean] = (keyCount[clean] || 0) + 1;
      });
    } catch {}
  });
  
  const sorted = Object.entries(keyCount).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 30).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}/1000 (${(v/10).toFixed(0)}%)`);
  });

  await prisma.$disconnect();
}
analyze();
