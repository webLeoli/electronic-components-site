/**
 * Import 5 blog drafts from docs/blog-drafts/ into BlogPost table.
 *
 * Each markdown file ends with a YAML metadata block in a fenced code block,
 * which we parse for title/slug/seoTitle/seoDesc/seoKeywords/tags/etc.
 * The article body (everything before the "## DB import metadata" heading)
 * becomes the `content` field as-is — page.js renders markdown server-side.
 *
 * Usage:
 *   node scripts/import-blog-drafts.mjs --dry-run                # show what would be written
 *   node scripts/import-blog-drafts.mjs                          # write as status=draft (safe)
 *   node scripts/import-blog-drafts.mjs --publish                # write as status=published
 *   node scripts/import-blog-drafts.mjs --file=01-eol...md       # only one file
 *
 * Re-runs are idempotent (upsert by slug).
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PUBLISH = args.includes('--publish');
const FILE_ARG = args.find(a => a.startsWith('--file='));
const ONLY_FILE = FILE_ARG ? FILE_ARG.split('=')[1] : null;

const DRAFTS_DIR = 'docs/blog-drafts';

function parseDraft(path) {
  const raw = readFileSync(path, 'utf8');

  // Split off the metadata block: anything after "## DB import metadata"
  const metaIdx = raw.indexOf('## DB import metadata');
  if (metaIdx === -1) throw new Error(`${path}: missing "## DB import metadata" section`);

  const body = raw.slice(0, metaIdx).trim();
  const metaSection = raw.slice(metaIdx);

  // Extract the YAML block: ```yaml ... ```
  const yamlMatch = metaSection.match(/```yaml\s*([\s\S]*?)```/);
  if (!yamlMatch) throw new Error(`${path}: missing yaml metadata fence`);
  const yamlText = yamlMatch[1];

  // Simple YAML parser for our flat key: "value" format
  const meta = {};
  for (const line of yamlText.split('\n')) {
    const m = line.match(/^(\w+):\s*(?:"([^"]*)"|(\d+))/);
    if (m) {
      const key = m[1];
      const val = m[2] !== undefined ? m[2] : Number(m[3]);
      meta[key] = val;
    }
  }

  if (!meta.title || !meta.slug) throw new Error(`${path}: missing title or slug in metadata`);

  return { body, meta };
}

(async () => {
  const files = readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.md'))
    .filter(f => !ONLY_FILE || f === ONLY_FILE)
    .sort();

  console.log(`Mode:    ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Publish: ${PUBLISH ? 'status=published' : 'status=draft'}`);
  console.log(`Files:   ${files.length}\n`);

  let created = 0, updated = 0;

  for (const file of files) {
    const fullPath = join(DRAFTS_DIR, file);
    let parsed;
    try {
      parsed = parseDraft(fullPath);
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
      continue;
    }
    const { body, meta } = parsed;

    const data = {
      title:       meta.title,
      slug:        meta.slug,
      content:     body,
      excerpt:     meta.seoDesc || null,
      status:      PUBLISH ? 'published' : (meta.status || 'draft'),
      publishedAt: PUBLISH ? new Date() : null,
      author:      meta.author || 'FPGACenter Sourcing Team',
      tags:        meta.tags || null,
      seoTitle:    meta.seoTitle || meta.title,
      seoDesc:     meta.seoDesc || null,
      seoKeywords: meta.seoKeywords || null,
      readingTime: meta.readingTime || null,
    };

    console.log(`[${file}]`);
    console.log(`  title: ${data.title}`);
    console.log(`  slug:  ${data.slug}`);
    console.log(`  status: ${data.status}  body: ${body.length}c (${(body.split(/\s+/).length).toLocaleString()} words)`);

    if (DRY_RUN) continue;

    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) {
      await prisma.blogPost.update({ where: { id: existing.id }, data });
      updated++;
      console.log(`  → updated (id=${existing.id})`);
    } else {
      const r = await prisma.blogPost.create({ data });
      created++;
      console.log(`  → created (id=${r.id})`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`${DRY_RUN ? 'Would create/update' : 'Created'}: ${created}, Updated: ${updated}`);

  await prisma.$disconnect();
})();
