// Assign blog categories to posts that were imported without one.
//
// The five substantive sourcing articles came in with categoryId = null, so
// they were missing from every /blog?category= view and from the category
// counts — the taxonomy existed but the best content sat outside it.
//
// Usage:
//   node scripts/assign-blog-categories.mjs --dry-run
//   node scripts/assign-blog-categories.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

// slug -> blog category slug. Buying Guides carries the procurement/sourcing
// cluster; Technical Tutorials carries inspection and analysis method pieces.
const ASSIGNMENTS = {
  'eol-nrnd-obsolete-ic-lifecycle-explained': 'buying-guides',
  'how-to-source-obsolete-electronic-components': 'buying-guides',
  'fpga-obsolescence-spartan-cyclone-end-of-life': 'buying-guides',
  'idea-std-1010-counterfeit-detection-guide': 'technical-tutorials',
  'bom-scrubbing-lifecycle-risk-analysis': 'technical-tutorials',
  'gd32-vs-stm32-gd32f103-motor-control-alternatives': 'product-comparisons',
};

const categories = await prisma.blogCategory.findMany({ select: { id: true, slug: true } });
const byslug = new Map(categories.map(c => [c.slug, c.id]));

let changed = 0;
for (const [postSlug, catSlug] of Object.entries(ASSIGNMENTS)) {
  const categoryId = byslug.get(catSlug);
  if (!categoryId) {
    console.error(`  ! unknown blog category "${catSlug}" — skipping ${postSlug}`);
    continue;
  }
  const post = await prisma.blogPost.findUnique({
    where: { slug: postSlug },
    select: { id: true, categoryId: true },
  });
  if (!post) {
    console.error(`  ! no such post "${postSlug}" — skipping`);
    continue;
  }
  if (post.categoryId === categoryId) continue;

  changed++;
  console.log(`${dryRun ? '[dry-run] ' : ''}${postSlug}: ${post.categoryId ?? 'null'} -> ${catSlug} (${categoryId})`);
  if (!dryRun) {
    await prisma.blogPost.update({ where: { id: post.id }, data: { categoryId } });
  }
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${changed} post(s) recategorised.`);
await prisma.$disconnect();
