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

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripDraftScaffolding } from '../src/lib/blog-content.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PUBLISH = args.includes('--publish');
const FILE_ARG = args.find(a => a.startsWith('--file='));
const ONLY_FILE = FILE_ARG ? FILE_ARG.split('=')[1] : null;

const DRAFTS_DIR = 'docs/blog-drafts';

function categorySlugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Match on name first, then slug, so a draft can name a category either way.
// Never auto-creates: a typo would otherwise silently spawn a new taxonomy
// entry and split a cluster in half.
async function resolveCategory(name) {
  const slug = categorySlugify(name);
  const found = await prisma.blogCategory.findFirst({
    where: { OR: [{ name }, { slug }] },
    select: { id: true, name: true },
  });
  if (!found) {
    console.warn(`  ! unknown blog category "${name}" (slug "${slug}") — leaving uncategorised`);
    return null;
  }
  return found;
}

// Flat `key: "value"` / `key: 123` parser — enough for the fields we carry.
function parseFlatYaml(text) {
  const meta = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^(\w+):\s*(?:"([^"]*)"|(\d+))/);
    if (m) meta[m[1]] = m[2] !== undefined ? m[2] : Number(m[3]);
  }
  return meta;
}

function parseDraft(path) {
  const raw = readFileSync(path, 'utf8');

  // Two metadata conventions are accepted:
  //   1. Top YAML frontmatter (`--- ... ---`) — preferred, and what an editor
  //      adding cover images will naturally reach for.
  //   2. A trailing "## DB import metadata" block with a ```yaml fence — the
  //      original convention, still used by the earlier drafts.
  // Frontmatter wins when both are present.
  const frontmatter = /^﻿?\s*---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/.exec(raw);
  const metaIdx = raw.indexOf('## DB import metadata');

  let meta;
  if (frontmatter) {
    meta = parseFlatYaml(frontmatter[1]);
  } else if (metaIdx !== -1) {
    const yamlMatch = raw.slice(metaIdx).match(/```yaml\s*([\s\S]*?)```/);
    if (!yamlMatch) throw new Error(`${path}: missing yaml metadata fence`);
    meta = parseFlatYaml(yamlMatch[1]);
  } else {
    throw new Error(`${path}: no YAML frontmatter and no "## DB import metadata" section`);
  }

  // Drop the writer-facing header/footer and the frontmatter itself. Without
  // this the article renders with raw `title: "..."` lines, a literal "# Title"
  // paragraph and an Author/Reading-time blockquote visible to readers — the
  // page already supplies the H1 and byline from the post record.
  const bodySource = metaIdx === -1 ? raw : raw.slice(0, metaIdx);
  const body = stripDraftScaffolding(bodySource);

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
      // A draft declaring status: "published" must still get a date, or it goes
      // live with a null publishedAt and sorts to the bottom of every listing.
      publishedAt: PUBLISH || meta.status === 'published' ? new Date() : null,
      author:      meta.author || 'FPGACenter Sourcing Team',
      tags:        meta.tags || null,
      seoTitle:    meta.seoTitle || meta.title,
      seoDesc:     meta.seoDesc || null,
      seoKeywords: meta.seoKeywords || null,
      readingTime: meta.readingTime || null,
      relatedProducts: meta.relatedProducts || null,
    };

    // Cover images are optional and may be added after the article is written.
    // Only include the field when frontmatter explicitly declares it, so a
    // later content re-import cannot wipe a cover uploaded through the admin.
    if (meta.coverImage !== undefined) {
      data.coverImage = meta.coverImage || null;
    }

    // Resolve the draft's `category:` name to a BlogCategory. This mapping did
    // not exist before, so every imported article landed with categoryId = null
    // — which also silenced the "related posts" block on the site's five
    // strongest pages, since that block only renders when a category is set.
    if (meta.category) {
      const category = await resolveCategory(meta.category);
      if (category) data.categoryId = category.id;
    } else {
      console.warn(`  ! no category declared — post will have no related-posts block`);
    }

    console.log(`[${file}]`);
    console.log(`  title: ${data.title}`);
    console.log(`  slug:  ${data.slug}`);
    console.log(`  status: ${data.status}  body: ${body.length}c (${(body.split(/\s+/).length).toLocaleString()} words)`);

    if (DRY_RUN) continue;

    const existing = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
      select: { id: true, status: true, publishedAt: true },
    });
    if (existing) {
      // Never demote a live article. The draft files all carry
      // `status: "draft"`, so re-importing to pick up a content edit used to
      // unpublish every post it touched and wipe its publishedAt — silently
      // pulling five live articles off the site.
      const update = { ...data };
      if (existing.status === 'published' && !PUBLISH) {
        update.status = 'published';
        update.publishedAt = existing.publishedAt;
        console.log('  (already published — keeping status and publish date)');
      }
      await prisma.blogPost.update({ where: { id: existing.id }, data: update });
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
