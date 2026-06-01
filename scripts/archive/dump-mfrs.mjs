import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const all = await p.product.groupBy({ by: ['manufacturer'], _count: { _all: true }, orderBy: { _count: { manufacturer: 'desc' } } });
all.forEach(m => console.log(`${m._count._all}\t${m.manufacturer}`));
console.log(`\nTotal: ${all.length} unique names`);
await p.$disconnect();
