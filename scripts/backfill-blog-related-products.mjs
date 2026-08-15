// Set `relatedProducts` on posts that have none, without touching their content.
//
// Five of the strongest published articles shipped with relatedProducts empty,
// so the on-page "related parts" block never rendered and the best content had
// no path into the catalogue. The draft files in docs/blog-drafts/ now declare
// the same lists, so a future re-import stays consistent — but re-importing a
// published post would also rewrite its body, and the live bodies have had
// script fixes applied (scaffolding strip, FAQ heading upgrade) that may not be
// reflected on disk. This script therefore writes only the one field.
//
// Every part number is verified to exist in the catalogue before it is written;
// an unknown part number aborts that post rather than shipping a dead link.
//
// Idempotent. Skips posts that already have a non-empty relatedProducts unless
// --force is passed.
//
// Usage:
//   node scripts/backfill-blog-related-products.mjs --dry-run
//   node scripts/backfill-blog-related-products.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const prisma = new PrismaClient();

// NOTE: part numbers containing a comma cannot be used here. The blog page
// splits relatedProducts on commas, so a Nexperia-style "74HC14D,652" resolves
// as two unknown parts and silently drops out of the widget.
const ASSIGNMENTS = {
  'how-to-source-obsolete-electronic-components':
    'AD574AJE, REF102AP, AD7703AR, ADG508FBN, AD7541AJP, X9313UST1, MC10EL32DTG, EPM7064SLC44-10N',
  'eol-nrnd-obsolete-ic-lifecycle-explained':
    'CD4024BHSR, REF102AP, LT1016CN8, MAX368CPN+, AD7703AR, PCM1704U, SSTVF16857AGT, X9313UST1',
  'bom-scrubbing-lifecycle-risk-analysis':
    'CD4024BHSR, MAX368CPN+, X9313UST1, SSTVF16857AGT, AD7541AJP, EPM7064SLC44-10N, XC2V1500-4FFG896C, MC10EL32DTG',
  'fpga-obsolescence-spartan-cyclone-end-of-life':
    'XC3S50-4PQG208I, XC3S500E-4PQ208C, EP1C3T100C8N, EP1C6T144C7, EPM7064SLC44-10N, EPM7128BTC144-10N, XC2V1500-4FFG896C, XC2VP7-6FF672I',
  'idea-std-1010-counterfeit-detection-guide':
    'AD574AJE, AD7703AR, PCM1704U, ADG508FBN, EPM7064SLC44-10N, XC2VP7-6FF672I, AD7541AJP, REF102AP',
};

let written = 0;

for (const [slug, list] of Object.entries(ASSIGNMENTS)) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, status: true, relatedProducts: true },
  });
  if (!post) {
    console.error(`  ! no such post "${slug}"`);
    continue;
  }
  if (post.relatedProducts && post.relatedProducts.trim() && !force) {
    console.log(`  · ${slug} already has relatedProducts — skipping`);
    continue;
  }

  const parts = list.split(',').map((s) => s.trim()).filter(Boolean);
  const missing = [];
  for (const pn of parts) {
    const found = await prisma.product.findUnique({ where: { partNumber: pn }, select: { id: true } });
    if (!found) missing.push(pn);
  }
  if (missing.length) {
    console.error(`  ! ${slug}: not in catalogue — ${missing.join(', ')} (skipped)`);
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}${slug} [${post.status}] ← ${parts.length} parts`);
  if (!dryRun) {
    await prisma.blogPost.update({ where: { id: post.id }, data: { relatedProducts: list } });
    written++;
  }
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${written} posts updated`);
await prisma.$disconnect();
