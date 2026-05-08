const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const prod = await p.product.count();
  const cat = await p.category.count();
  const mfr = await p.manufacturer.count();
  console.log('Products:', prod, 'Categories:', cat, 'Manufacturers:', mfr);
  const sample = await p.product.findFirst();
  console.log('Sample:', JSON.stringify(sample, null, 2));
  await p.$disconnect();
})();
