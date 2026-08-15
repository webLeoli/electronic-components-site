// One-off read-only audit of published blog posts: SEO fields, content
// hygiene, internal links, cover assets. Prints findings grouped by severity.
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

const issues = []; // { severity, slug, field, detail }
function add(severity, slug, field, detail) {
  issues.push({ severity, slug, field, detail });
}

const posts = await prisma.blogPost.findMany({
  where: { status: 'published' },
  include: { category: { select: { name: true, slug: true } } },
  orderBy: { publishedAt: 'asc' },
});
const allSlugs = new Set(posts.map(p => p.slug));
const draftPosts = await prisma.blogPost.findMany({
  where: { status: { not: 'published' } },
  select: { slug: true, status: true },
});
const draftSlugs = new Map(draftPosts.map(p => [p.slug, p.status]));

console.log(`Published posts: ${posts.length}; non-published: ${draftPosts.length}`);

const seoTitles = new Map();
const seoDescs = new Map();
const titles = new Map();

for (const p of posts) {
  const c = p.content || '';

  // --- SEO field checks ---
  const st = p.seoTitle || p.title;
  const sd = p.seoDesc || p.excerpt || '';
  if (!p.seoTitle) add('info', p.slug, 'seoTitle', 'missing (falls back to title)');
  if (st.length > 65) add('warn', p.slug, 'seoTitle', `too long: ${st.length} chars: "${st}"`);
  if (!sd) add('error', p.slug, 'seoDesc', 'no seoDesc AND no excerpt');
  else if (sd.length > 165) add('warn', p.slug, 'seoDesc', `too long: ${sd.length} chars`);
  else if (sd.length < 70) add('warn', p.slug, 'seoDesc', `too short: ${sd.length} chars`);
  if (!p.excerpt) add('warn', p.slug, 'excerpt', 'missing');
  if (!p.publishedAt) add('error', p.slug, 'publishedAt', 'published post with null publishedAt');
  if (p.publishedAt && p.publishedAt > new Date()) add('error', p.slug, 'publishedAt', `future date ${p.publishedAt.toISOString()}`);
  if (!p.categoryId) add('warn', p.slug, 'category', 'no category');

  for (const [map, key] of [[seoTitles, st], [seoDescs, sd], [titles, p.title]]) {
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p.slug);
  }

  // --- Content hygiene ---
  const words = c.split(/\s+/).filter(Boolean).length;
  if (words < 400) add('warn', p.slug, 'content', `thin content: ${words} words`);
  if (/^---\s*\n/.test(c)) add('error', p.slug, 'content', 'YAML frontmatter leaked into body');
  if (/^#\s+/m.test(c)) add('warn', p.slug, 'content', 'contains H1 (#) heading in body');
  if (/For DB import/i.test(c)) add('error', p.slug, 'content', 'draft scaffolding "For DB import" in body');
  if (/DB import metadata/i.test(c)) add('error', p.slug, 'content', 'DB import metadata block in body');
  if (/\*\*(Author|Reading time|Topics)\*\*\s*:/i.test(c.slice(0, 600))) add('error', p.slug, 'content', 'writer header (Author/Reading time/Topics) at top of body');
  if (/\/images\/blog\//.test(c)) add('warn', p.slug, 'content', 'legacy /images/blog/ image reference (renders placeholder)');
  if (/TODO|TKTK|\[placeholder\]|lorem ipsum/i.test(c)) add('error', p.slug, 'content', 'TODO/placeholder text in body');
  if (/添加|请注意|如下所示|谢谢/.test(c)) add('warn', p.slug, 'content', 'Chinese text found in EN article');

  const expectedRt = Math.max(1, Math.ceil(words / 200));
  if (p.readingTime && Math.abs(p.readingTime - expectedRt) > Math.max(3, expectedRt * 0.5)) {
    add('info', p.slug, 'readingTime', `stored ${p.readingTime} vs computed ${expectedRt}`);
  }

  // --- Internal links ---
  const hrefs = [...c.matchAll(/(?:href="|\]\()(\/[^)"#?\s]+)/g)].map(m => m[1]);
  for (const href of new Set(hrefs)) {
    const m = href.match(/^\/blog\/([^/]+)$/);
    if (m) {
      const target = decodeURIComponent(m[1]);
      if (!allSlugs.has(target)) {
        if (draftSlugs.has(target)) add('info', p.slug, 'link', `links to unpublished (${draftSlugs.get(target)}) post /blog/${target} — unwrapped at render`);
        else add('error', p.slug, 'link', `links to non-existent post /blog/${target}`);
      }
    }
  }

  // Absolute self-domain links (should be relative)
  const absSelf = c.match(/https?:\/\/(?:www\.)?fpgacenter[^\s)"'<]*/gi);
  if (absSelf) add('info', p.slug, 'link', `absolute self-domain links: ${[...new Set(absSelf)].slice(0, 3).join(', ')}`);

  // --- Images in content: check local files exist ---
  const imgSrcs = [...c.matchAll(/(?:<img[^>]*src="|!\[[^\]]*\]\()(\/[^)"\s]+)/g)].map(m => m[1]);
  for (const src of new Set(imgSrcs)) {
    if (src.startsWith('/images/blog/')) continue; // handled above
    const fp = resolve(process.cwd(), 'public', `.${src.split(/[?#]/)[0]}`);
    if (!existsSync(fp)) add('error', p.slug, 'image', `content image missing on disk: ${src}`);
    const alt1 = c.match(new RegExp(`<img[^>]*src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`));
    if (alt1 && !/alt="[^"]+"/.test(alt1[0])) add('warn', p.slug, 'image', `img missing alt: ${src}`);
  }

  // --- Cover image ---
  if (p.coverImage && !/^https?:/i.test(p.coverImage)) {
    const fp = resolve(process.cwd(), 'public', `.${p.coverImage.split(/[?#]/)[0]}`);
    if (!existsSync(fp)) add('warn', p.slug, 'cover', `coverImage missing on disk: ${p.coverImage} (falls back)`);
  }

  // --- relatedProducts validity ---
  const parts = (p.relatedProducts || '').split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length > 0) {
    const found = await prisma.product.findMany({
      where: { partNumber: { in: parts }, duplicateOfId: null },
      select: { partNumber: true },
    });
    const foundSet = new Set(found.map(f => f.partNumber));
    const missing = parts.filter(x => !foundSet.has(x));
    if (missing.length) add('warn', p.slug, 'relatedProducts', `not found in DB: ${missing.join(', ')}`);
  }
}

for (const [map, name] of [[titles, 'title'], [seoTitles, 'seoTitle'], [seoDescs, 'seoDesc']]) {
  for (const [key, slugs] of map) {
    if (slugs.length > 1) add('warn', slugs.join(' + '), `duplicate ${name}`, `"${key.slice(0, 80)}"`);
  }
}

// --- Category sanity ---
const cats = await prisma.blogCategory.findMany({
  include: { _count: { select: { posts: { where: { status: 'published' } } } } },
});
for (const cat of cats) {
  if (cat._count.posts === 0) add('info', cat.slug, 'category', 'category has 0 published posts');
}

const order = { error: 0, warn: 1, info: 2 };
issues.sort((a, b) => order[a.severity] - order[b.severity] || a.slug.localeCompare(b.slug));
let counts = { error: 0, warn: 0, info: 0 };
for (const i of issues) {
  counts[i.severity]++;
  console.log(`[${i.severity.toUpperCase()}] ${i.slug} :: ${i.field} :: ${i.detail}`);
}
console.log(`\nTotals: ${counts.error} errors, ${counts.warn} warnings, ${counts.info} info`);
await prisma.$disconnect();
