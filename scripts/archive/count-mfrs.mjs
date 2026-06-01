import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const mc = await p.manufacturer.count();
console.log('厂商总数:', mc);
const top = await p.product.groupBy({ by: ['manufacturer'], _count: { _all: true }, orderBy: { _count: { manufacturer: 'desc' } }, take: 10 });
console.log('Top 10 厂商:');
top.forEach(m => console.log(' ', m.manufacturer, '-', m._count._all, '个产品'));
await p.$disconnect();
