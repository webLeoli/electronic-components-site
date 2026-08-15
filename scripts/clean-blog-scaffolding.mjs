// One-off cleanup: remove writer-facing scaffolding that the draft importer
// stored verbatim (leading H1, Author/Reading-time blockquote, "For DB import"
// note, signature footer). See stripDraftScaffolding in src/lib/blog-content.js
// — the importer now applies the same function, so this is only needed for
// posts imported before that fix.
//
// Usage:
//   node scripts/clean-blog-scaffolding.mjs --dry-run
//   node scripts/clean-blog-scaffolding.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { stripDraftScaffolding } from '../src/lib/blog-content.js';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

const posts = await prisma.blogPost.findMany({ select: { id: true, slug: true, content: true } });
let changed = 0;

for (const post of posts) {
  const cleaned = stripDraftScaffolding(post.content);
  if (cleaned === post.content) continue;

  changed++;
  const removed = post.content.length - cleaned.length;
  console.log(`${dryRun ? '[dry-run] ' : ''}${post.slug}: -${removed} chars`);
  console.log(`    old head: ${JSON.stringify(post.content.slice(0, 90))}`);
  console.log(`    new head: ${JSON.stringify(cleaned.slice(0, 90))}`);

  if (!dryRun) {
    await prisma.blogPost.update({ where: { id: post.id }, data: { content: cleaned } });
  }
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${changed} of ${posts.length} posts cleaned.`);
await prisma.$disconnect();
