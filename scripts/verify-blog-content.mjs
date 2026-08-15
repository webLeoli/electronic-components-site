// Pre-publish verifier for every blog post in the database.
//
// Run this before publishing anything (and after any bulk import). It checks the
// things that silently degrade a post after it goes live:
//
//   · category assigned          — without it the related-posts block never renders
//   · FAQ extraction             — replays the heading conversion in
//                                  src/app/blog/[slug]/page.js and runs the real
//                                  extractFaqEntries, so you can confirm FAQPage
//                                  structured data will emit BEFORE publishing.
//                                  Drafts 404 on the live route, so this is the
//                                  only way to check them.
//   · internal /blog/ links      — a link to a slug that does not exist is a 404,
//                                  and a link to a DRAFT is a 404 until it is
//                                  published (reported separately)
//   · internal /category/ links  — must match a Category slug
//   · relatedProducts            — every part number must exist in the catalogue.
//                                  IMPORTANT: the blog page splits this field on
//                                  commas, so a part number that itself contains
//                                  a comma (Nexperia's "74HC14D,652") can never
//                                  resolve. Those are reported as errors.
//   · structure                  — H2 count, FAQ count, word count against the
//                                  depth standard in docs/blog-content-plan.md
//
// Usage:
//   node scripts/verify-blog-content.mjs                 # all posts
//   node scripts/verify-blog-content.mjs --published     # published only
//   node scripts/verify-blog-content.mjs <slug> [slug…]  # specific posts
//   node scripts/verify-blog-content.mjs --quiet          # only problems
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { extractFaqEntries } from '../src/lib/blog-content.js';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const publishedOnly = args.includes('--published');
const slugArgs = args.filter((a) => !a.startsWith('--'));
const prisma = new PrismaClient();

const stripHtml = (html) => html.replace(/<[^>]+>/g, '').trim();

// Mirrors the heading and inline conversions in src/app/blog/[slug]/page.js
// closely enough for FAQ extraction, then sanitises as the page does.
function renderHeadings(md) {
  let html = md
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h2', 'h3', 'h4']),
  });
}

const where = slugArgs.length ? { slug: { in: slugArgs } } : publishedOnly ? { status: 'published' } : {};
const posts = await prisma.blogPost.findMany({
  where,
  select: {
    slug: true, title: true, status: true, content: true, relatedProducts: true,
    seoDesc: true, seoTitle: true, category: { select: { name: true } },
  },
  orderBy: { id: 'asc' },
});

const all = await prisma.blogPost.findMany({ select: { slug: true, status: true } });
const publishedSlugs = new Set(all.filter((p) => p.status === 'published').map((p) => p.slug));
const knownSlugs = new Set(all.map((p) => p.slug));
const categorySlugs = new Set((await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug));

let problems = 0;
let warnings = 0;

for (const post of posts) {
  const errors = [];
  const warns = [];

  const faq = extractFaqEntries(renderHeadings(post.content), stripHtml);
  const h2 = (post.content.match(/^## /gm) || []).length;
  const h3 = (post.content.match(/^### /gm) || []).length;
  const words = post.content.split(/\s+/).filter(Boolean).length;

  if (!post.category) errors.push('no category — related-posts block will not render');
  if (faq.length === 0) errors.push('no FAQ entries extracted — no FAQPage structured data');
  else if (faq.length < 6) warns.push(`only ${faq.length} FAQ entries (target 6-8)`);
  if (h2 === 0) errors.push('no H2 headings — no table of contents, no heading anchors');
  else if (h2 + h3 < 12) warns.push(`only ${h2 + h3} headings (target 12+)`);
  if (words < 1500) warns.push(`${words} words (target 2,500-3,500)`);
  if ((post.seoDesc || '').length > 200) warns.push(`seoDesc ${post.seoDesc.length} chars (keep under ~160-200)`);
  if (!post.seoTitle) warns.push('no seoTitle');

  const links = [...post.content.matchAll(/\]\((\/[^)\s]+)\)/g)].map((m) => m[1]);
  const blogLinks = [...new Set(links.filter((l) => l.startsWith('/blog/')).map((l) => l.slice(6).split('#')[0]))];
  const catLinks = [...new Set(links.filter((l) => l.startsWith('/category/')).map((l) => l.slice(10).split('#')[0]))];

  const dead = blogLinks.filter((s) => !knownSlugs.has(s));
  if (dead.length) errors.push(`dead /blog/ links: ${dead.join(', ')}`);
  const toDrafts = blogLinks.filter((s) => knownSlugs.has(s) && !publishedSlugs.has(s));
  if (post.status === 'published' && toDrafts.length) {
    errors.push(`published post links to unpublished drafts (live 404s): ${toDrafts.join(', ')}`);
  } else if (toDrafts.length) {
    warns.push(`links to ${toDrafts.length} still-unpublished sibling(s) — publish order matters`);
  }
  const deadCat = catLinks.filter((s) => !categorySlugs.has(s));
  if (deadCat.length) errors.push(`dead /category/ links: ${deadCat.join(', ')}`);

  const rpRaw = (post.relatedProducts || '').trim();
  if (!rpRaw) {
    warns.push('no relatedProducts — no path from the article into the catalogue');
  } else {
    const parts = rpRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const missing = [];
    for (const pn of parts) {
      const found = await prisma.product.findUnique({ where: { partNumber: pn }, select: { id: true } });
      if (!found) missing.push(pn);
    }
    if (missing.length) {
      errors.push(
        `relatedProducts not in catalogue: ${missing.join(' | ')}` +
          (rpRaw.match(/[A-Z0-9]\s*,\s*\d{3}(,|$)/i) ? '  (looks like a part number containing a comma — the page splits on commas, use a comma-free variant)' : ''),
      );
    }
  }

  if (errors.length) problems++;
  if (warns.length) warnings++;
  if (quiet && !errors.length && !warns.length) continue;

  const tag = errors.length ? 'FAIL' : warns.length ? 'warn' : ' ok ';
  console.log(
    `[${tag}] ${post.slug.padEnd(46)} ${post.status.padEnd(9)} ` +
      `H2=${String(h2).padStart(2)} H3=${String(h3).padStart(2)} FAQ=${String(faq.length).padStart(2)} ` +
      `${String(words).padStart(5)}w links=${String(blogLinks.length + catLinks.length).padStart(2)}`,
  );
  for (const e of errors) console.log(`         ✗ ${e}`);
  for (const w of warns) console.log(`         · ${w}`);
}

console.log(`\n${posts.length} posts checked — ${problems} with errors, ${warnings} with warnings`);
await prisma.$disconnect();
process.exit(problems ? 1 : 0);
