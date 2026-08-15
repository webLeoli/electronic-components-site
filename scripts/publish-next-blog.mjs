/**
 * Publish the next queued blog draft, no more often than once per interval.
 *
 * Queue order follows the numeric filenames in docs/blog-drafts, EXCEPT that
 * drafts carrying `priority: 1` in their frontmatter jump the queue and use
 * the shorter PRIORITY_PUBLISH_INTERVAL_HOURS (default 12h) instead of the
 * normal BLOG_PUBLISH_INTERVAL_HOURS (default 48h). This lets a batch of
 * high-traffic evergreen articles roll out over a few days without waiting
 * behind the long sourcing-guide queue — and without publishing all at once,
 * which would look like scaled content dumping.
 *
 * Published posts are ignored, so re-running is safe and future numbered
 * drafts join the end of the queue automatically.
 *
 * Usage:
 *   node scripts/publish-next-blog.mjs --dry-run
 *   node scripts/publish-next-blog.mjs
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const draftsDir = join(process.cwd(), 'docs', 'blog-drafts');
const intervalHours = Number(process.env.BLOG_PUBLISH_INTERVAL_HOURS || 48);
const priorityIntervalHours = Number(process.env.PRIORITY_PUBLISH_INTERVAL_HOURS || 12);
const timerToleranceMs = 5 * 60 * 1000;

if (!Number.isFinite(intervalHours) || intervalHours < 1) {
  throw new Error('BLOG_PUBLISH_INTERVAL_HOURS must be a positive number');
}
if (!Number.isFinite(priorityIntervalHours) || priorityIntervalHours < 1) {
  throw new Error('PRIORITY_PUBLISH_INTERVAL_HOURS must be a positive number');
}

function queuedSlugs() {
  return readdirSync(draftsDir)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map(file => {
      const source = readFileSync(join(draftsDir, file), 'utf8');
      const match = source.match(/^slug:\s*["']?([^"'\r\n]+)["']?\s*$/m);
      if (!match) return null;
      const priorityMatch = source.match(/^priority:\s*["']?(\d+)["']?\s*$/m);
      return { file, slug: match[1].trim(), priority: priorityMatch ? Number(priorityMatch[1]) : 0 };
    })
    .filter(Boolean)
    // Stable sort: priority drafts first (higher number = sooner), then the
    // original numeric filename order within each tier.
    .sort((a, b) => b.priority - a.priority);
}

try {
  const latest = await prisma.blogPost.findFirst({
    where: { status: 'published', publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, publishedAt: true },
  });
  await publishNext(latest);
} finally {
  await prisma.$disconnect();
}

async function publishNext(latest) {
  const drafts = await prisma.blogPost.findMany({
    where: { status: 'draft' },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      seoTitle: true,
      seoDesc: true,
    },
  });
  const bySlug = new Map(drafts.map(post => [post.slug, post]));
  const next = queuedSlugs().map(item => ({ ...item, post: bySlug.get(item.slug) })).find(item => item.post);

  if (!next) {
    console.log('EMPTY no queued drafts remain');
    return;
  }

  // The interval belongs to the CANDIDATE: a priority draft may publish sooner
  // after the previous post than a normal one.
  const effectiveIntervalMs = (next.priority > 0 ? priorityIntervalHours : intervalHours) * 60 * 60 * 1000;
  if (latest?.publishedAt) {
    const elapsedMs = Date.now() - latest.publishedAt.getTime();
    // The systemd timer can fire a few seconds earlier than it did on the
    // previous run. A small tolerance prevents that harmless clock drift from
    // stretching the intended cadence by a whole timer period.
    if (elapsedMs < effectiveIntervalMs - timerToleranceMs) {
      const nextAt = new Date(latest.publishedAt.getTime() + effectiveIntervalMs);
      console.log(`DEFER latest=${latest.slug} next=${next.slug}${next.priority > 0 ? ' (priority)' : ''} nextEligibleAt=${nextAt.toISOString()}`);
      return;
    }
  }

  const problems = [];
  if (next.post.title.trim().length < 20) problems.push('title is too short');
  if (next.post.content.trim().length < 1500) problems.push('content is too short');
  if (!next.post.seoTitle || next.post.seoTitle.trim().length < 20) problems.push('SEO title is missing/short');
  if (!next.post.seoDesc || next.post.seoDesc.trim().length < 70) problems.push('SEO description is missing/short');
  if (problems.length) {
    throw new Error(`Refusing to publish ${next.slug}: ${problems.join(', ')}`);
  }

  if (dryRun) {
    console.log(`DRY_RUN next=${next.slug} file=${next.file}${next.priority > 0 ? ' (priority)' : ''} title=${JSON.stringify(next.post.title)}`);
    return;
  }

  const publishedAt = new Date();
  const result = await prisma.blogPost.updateMany({
    where: { id: next.post.id, status: 'draft' },
    data: { status: 'published', publishedAt },
  });
  if (result.count !== 1) {
    throw new Error(`Publish race detected for ${next.slug}; no row was changed`);
  }

  console.log(`PUBLISHED slug=${next.slug} publishedAt=${publishedAt.toISOString()} file=${next.file}`);
}
