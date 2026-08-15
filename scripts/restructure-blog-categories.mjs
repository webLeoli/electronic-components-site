// Move blog categories from format-based to topic-based.
//
// The original four (Buying Guides / Product Comparisons / Technical Tutorials
// / Industry News) describe an article's FORMAT. Topic clusters cut across
// them, so the on-page "related posts" block — which selects by categoryId —
// mixed unrelated subjects and never reinforced a cluster.
//
// The four existing rows are renamed in place rather than deleted and
// recreated, so no post loses its category during the migration. Two new
// categories are added for topics the old set could not express.
//
// /blog?category=<old-slug> degrades to the unfiltered list (src/app/blog/page.js
// ignores an unrecognised slug), and those URLs canonicalise to /blog, so no
// redirect is required.
//
// Usage:
//   node scripts/restructure-blog-categories.mjs --dry-run
//   node scripts/restructure-blog-categories.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

// Rename by current slug -> new identity.
const RENAMES = [
  { from: 'buying-guides',       slug: 'obsolescence-sourcing', name: 'Obsolescence & Lifecycle Sourcing' },
  { from: 'product-comparisons', slug: 'mcu-sourcing',          name: 'MCU Sourcing & Alternatives' },
  { from: 'technical-tutorials', slug: 'fpga-cpld-sourcing',    name: 'FPGA & CPLD Sourcing' },
  { from: 'industry-news',       slug: 'analog-power-sourcing', name: 'Analog & Power Sourcing' },
];

const ADDITIONS = [
  { slug: 'quality-compliance', name: 'Quality & Compliance' },
  { slug: 'passives-sourcing',  name: 'Passives & Discretes' },
  { slug: 'memory-sourcing', name: 'Memory Sourcing' },
  { slug: 'interface-logic-sourcing', name: 'Interface & Logic Sourcing' },
  { slug: 'data-converter-sourcing', name: 'Data Converters & Signal Chain' },
  { slug: 'timing-clock-sourcing', name: 'Timing & Clock Distribution' },
  { slug: 'processor-dsp-sourcing', name: 'Processors, DSP & SoC' },
  { slug: 'video-telecom-sourcing', name: 'Video, Display & Telecom' },
  // Added 2026-08-11 for the engineering content axis (see
  // docs/blog-technical-content-plan.md). The first eighty articles all answer a
  // procurement question; these three hold design-engineering articles, written
  // for the engineer who chooses the part rather than the buyer who finds it.
  //
  // They are TOPIC categories, not format categories, deliberately. The comment
  // at the top of this file explains why format-based categories were abandoned:
  // the related-posts block selects by categoryId, so "Technical Guides" or
  // "Reviews" would mix an FPGA article with a power-supply one and reinforce
  // nothing. Evaluations and comparisons are a FORMAT and are filed by subject.
  { slug: 'fpga-design', name: 'FPGA Design & Integration' },
  { slug: 'hardware-design', name: 'Hardware Design & Integration' },
  { slug: 'industry-data', name: 'Industry Data & Obsolescence Watch' },
];

// Final home for every existing post.
const POST_CATEGORY = {
  'how-to-source-obsolete-electronic-components':      'obsolescence-sourcing',
  'eol-nrnd-obsolete-ic-lifecycle-explained':          'obsolescence-sourcing',
  'bom-scrubbing-lifecycle-risk-analysis':             'obsolescence-sourcing',
  // Counterfeit inspection is its own discipline and the draft already declared
  // "Quality & Compliance".
  'idea-std-1010-counterfeit-detection-guide':         'quality-compliance',
  // Anchors the FPGA cluster, which is otherwise two thin posts. Its body still
  // cross-links to the obsolescence pillar.
  'fpga-obsolescence-spartan-cyclone-end-of-life':     'fpga-cpld-sourcing',
  'how-to-choose-right-fpga':                          'fpga-cpld-sourcing',
  'fpga-vs-gpu-asic-edge-ai':                          'fpga-cpld-sourcing',
  'stm32f103-vs-stm32f407-comparison':                 'mcu-sourcing',
  'gd32-vs-stm32-gd32f103-motor-control-alternatives': 'mcu-sourcing',
  'understanding-mlcc-capacitors-guide':               'passives-sourcing',
};

for (const { from, slug, name } of RENAMES) {
  const existing = await prisma.blogCategory.findUnique({ where: { slug: from } });
  if (!existing) {
    console.log(`  · ${from} not present (already migrated?) — skipping`);
    continue;
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}rename #${existing.id}: ${from} -> ${slug}  (${name})`);
  if (!dryRun) {
    await prisma.blogCategory.update({ where: { id: existing.id }, data: { slug, name } });
  }
}

for (const { slug, name } of ADDITIONS) {
  const existing = await prisma.blogCategory.findUnique({ where: { slug } });
  if (existing) {
    console.log(`  · ${slug} already exists — skipping`);
    continue;
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}create: ${slug}  (${name})`);
  if (!dryRun) {
    await prisma.blogCategory.create({ data: { slug, name } });
  }
}

console.log('');
const categories = dryRun ? [] : await prisma.blogCategory.findMany({ select: { id: true, slug: true } });
const bySlug = new Map(categories.map(c => [c.slug, c.id]));

for (const [postSlug, catSlug] of Object.entries(POST_CATEGORY)) {
  const post = await prisma.blogPost.findUnique({ where: { slug: postSlug }, select: { id: true, categoryId: true } });
  if (!post) {
    console.error(`  ! no such post "${postSlug}"`);
    continue;
  }
  const categoryId = bySlug.get(catSlug);
  if (dryRun) {
    console.log(`[dry-run] ${postSlug} -> ${catSlug}`);
    continue;
  }
  if (!categoryId) {
    console.error(`  ! category "${catSlug}" missing`);
    continue;
  }
  if (post.categoryId === categoryId) continue;
  await prisma.blogPost.update({ where: { id: post.id }, data: { categoryId } });
  console.log(`${postSlug} -> ${catSlug}`);
}

if (!dryRun) {
  console.log('\n=== final state ===');
  const final = await prisma.blogCategory.findMany({
    select: { slug: true, name: true, _count: { select: { posts: true } } },
    orderBy: { id: 'asc' },
  });
  for (const c of final) console.log(`  ${c.slug.padEnd(24)} ${String(c._count.posts).padStart(2)} posts  ${c.name}`);
  const orphans = await prisma.blogPost.count({ where: { categoryId: null } });
  console.log(`  uncategorised: ${orphans}`);
}

await prisma.$disconnect();
