import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.blogPost.findMany({
  where: { status: 'published' },
  select: { slug: true, title: true, seoDesc: true, excerpt: true },
});
for (const r of rows) {
  const d = r.seoDesc || r.excerpt || '';
  if (d.length > 165) {
    console.log(`--- ${r.slug} (${d.length})`);
    console.log(`seoDesc: ${r.seoDesc}`);
    console.log(`excerpt(${(r.excerpt || '').length}): ${r.excerpt}`);
  }
}
await p.$disconnect();
