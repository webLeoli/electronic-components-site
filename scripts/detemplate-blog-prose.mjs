// Reduce templated prose cadence in blog drafts.
//
// Why this exists: a measurement on 2026-08-11 showed the corpus shares one
// mechanical rhythm — a bolded declarative opening most paragraphs, a heavy em
// dash habit, and a handful of repeated stock phrases. Ninety articles with an
// identical cadence is a site-level problem, not a per-article blemish. See the
// "House style" section of docs/blog-information-gain-architecture.md for the
// measured targets.
//
// What it does NOT touch, deliberately:
//   · table rows, fenced code blocks and YAML frontmatter — an em dash in a table
//     cell means "no data" and is correct typography, not a fingerprint
//   · `## Key takeaways` and the FAQ H3 questions — extractFaqEntries depends on
//     the H3s and the verifier treats zero FAQ entries as an error
//   · the article's FIRST bolded opening sentence — rule 1 of the depth standard
//     requires a bolded definition sentence as the opening line
//   · any claim, number, part number or link
//
// It is a prose edit only. Re-import and re-verify afterwards; no data needs
// re-checking.
//
// Usage:
//   node scripts/detemplate-blog-prose.mjs --dry-run 83 84 85
//   node scripts/detemplate-blog-prose.mjs --dry-run --diff 87
//   node scripts/detemplate-blog-prose.mjs 83 84 85 86 87 88 89 90 91 92 93 94
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/blog-drafts';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const showDiff = args.includes('--diff');
const wanted = args.filter((a) => !a.startsWith('--'));

// Em dash replacements. Each targets a construction where the substitute is
// unambiguously grammatical: joining two independent clauses (semicolon) or
// attaching a conjunction/relative clause (comma).
const DASH_RULES = [
  [/ — it is /g, '; it is '],
  [/ — they are /g, '; they are '],
  [/ — that is /g, '; that is '],
  [/ — this is /g, '; this is '],
  [/ — and /g, ', and '],
  [/ — but /g, ', but '],
  [/ — so /g, ', so '],
  [/ — or /g, ', or '],
  [/ — not /g, ', not '],
  [/ — which /g, ', which '],
  [/ — because /g, ', because '],
  [/ — where /g, ', where '],
  [/ — while /g, ', while '],
  [/ — often /g, ', often '],
  [/ — usually /g, ', usually '],
];

// Word-level stock-phrase swaps. Safe to apply anywhere, including inside a bold
// span: they replace words and never introduce a sentence boundary.
const SAFE_PHRASE_RULES = [
  [/is the whole argument\b/g, 'is the argument'],
  [/is the whole point\b/g, 'is the point'],
  [/is the whole trade\b/g, 'is the trade'],
  [/is the whole story\b/g, 'is the story'],
  [/is the whole problem\b/g, 'is the problem'],
  [/is the whole question\b/g, 'is the question'],
  [/is the whole budget\b/g, 'is the entire budget'],
  [/is the whole function\b/g, 'is the function'],
  [/is the useful part\b/g, 'is what to take away'],
  [/are the useful part\b/g, 'are what to rely on'],
];

// Stock phrases whose rewrite introduces a sentence break. These must stay OUTSIDE
// bold spans, or one emphasis ends up spanning two sentences.
const PHRASE_RULES = [
  [/Consequences, stated plainly:/gi, 'The consequences:'],
  [/, stated plainly\./gi, ' that matter:'],
  [/, stated plainly:/gi, ':'],
  [/\bstated plainly,\s*/gi, ''],
  [/The generalisation is the useful part\./g, 'The generalisation matters more than the example.'],
  [/is the useful part\b/g, 'is what to take away'],
  [/is the whole argument\b/g, 'is the argument'],
  [/is the whole point\b/g, 'is the point'],
  [/is the whole trade\b/g, 'is the trade'],
  [/is the whole story\b/g, 'is the story'],
  // Splitting these into two sentences also varies sentence length, which is
  // the other half of what the house style asks for.
  [/, and it is why /g, '. That is why '],
  [/ and it is why /g, '. That is why '],
  [/, and it is /g, '. It is '],
  [/ and it is /g, '. It is '],
];

// A paired em dash is a parenthetical. Parentheses say the same thing without
// contributing to the marker count. Bounded length and no sentence break inside,
// so this cannot swallow two dashes belonging to different sentences.
const PAIRED = [[/ — ([^—.]{3,80}?) — /g, ' ($1) ']];

// After the clause rules, the dominant leftover is an em dash introducing an
// explanation that begins with an article. Two grammatical substitutes, and which
// one is correct depends on whether what follows is a clause or a noun phrase:
//   independent clause (has a finite verb) -> semicolon
//   appositive noun phrase (no finite verb) -> comma
const FINITE_VERB =
  /\b(is|are|was|were|has|have|had|can|could|will|would|does|do|did|must|should|may|might|becomes|means|makes|gives|takes|carries|holds|needs|costs|encodes?|reads?|sets?|leaves?|keeps?|stops?|turns?|runs?|goes|comes|sits?|works?|fails?|appears?)\b/;

// A colon is the one substitute that is correct for BOTH readings, so prefer it:
//   "no status to read: the flash never answers"      (independent clause)
//   "`W25Q128`: the densities used for configuration" (appositive noun phrase)
// A comma produces a splice in the first case and a semicolon reads wrongly in the
// second, which a review of the first pass confirmed. Fall back to the clause/
// phrase heuristic only when the sentence already carries a colon, to avoid two.
// A dash introducing a list takes a colon, always. Requires a comma in the
// remainder so this only fires on an actual enumeration, not on any capitalised
// clause: "authorized distribution — Mouser, Digi-Key, Arrow, and others."
function fixListDash(line) {
  return line.replace(/ — ([A-Z][^—]*?,[^—]*?)(?=$|(?<=[a-z0-9)])\. )/g, (m, rest) =>
    line.slice(0, line.indexOf(m)).includes(': ') ? `, ${rest}` : `: ${rest}`,
  );
}

function fixArticleDash(line) {
  return line.replace(
    / — ((?:the|a|an|The|A|An) [^—]*?)(?=$|(?<=[a-z0-9)])\. )/g,
    (m, rest, offset) => {
      const alreadyColon = line.slice(0, offset).includes(': ');
      if (!alreadyColon) return `: ${rest}`;
      return FINITE_VERB.test(rest) ? `; ${rest}` : `, ${rest}`;
    },
  );
}

// Apply a transform only to the parts of a line OUTSIDE **bold** spans. Splitting
// a sentence inside a bold span leaves two sentences sharing one emphasis, which
// reads worse than the tic being fixed.
function outsideBold(line, fn) {
  return line
    .split(/(\*\*[^*]*\*\*)/)
    .map((seg) => (seg.startsWith('**') ? seg : fn(seg)))
    .join('');
}

function isSkippableLine(line, state) {
  if (/^```/.test(line)) {
    state.inCode = !state.inCode;
    return true;
  }
  if (state.inCode) return true;
  if (/^\s*\|/.test(line)) return true; // table row
  if (/^\s*>/.test(line)) return true; // writer-facing blockquote header
  return false;
}

// Frontmatter is delimited by the first two `---` lines.
function splitFrontmatter(text) {
  const m = /^(﻿?\s*---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n)/.exec(text);
  return m ? [m[1], text.slice(m[1].length)] : ['', text];
}

function detemplate(text) {
  const [front, body] = splitFrontmatter(text);
  const counts = { bold: 0, dash: 0, phrase: 0 };
  const state = { inCode: false };
  let keptFirstBold = false;

  const lines = body.split('\n').map((line) => {
    if (isSkippableLine(line, state)) return line;

    let out = line;

    // Strip the bold wrapper from a paragraph-opening declarative, keeping the
    // sentence itself. The first one in the article stays: the depth standard
    // requires a bolded definition sentence as the opening line.
    // A bold span immediately followed by a colon is a FIELD LABEL, not a
    // declarative opener: "**What it means**: the manufacturer has announced…".
    // The older articles use runs of these as a pseudo-table, and stripping the
    // emphasis flattens a real structure. Caught in review of the published-post
    // report before anything was applied.
    const boldOpener = /^\*\*([^*]{10,}?)\*\*(?!:)/;
    if (boldOpener.test(out)) {
      if (!keptFirstBold) {
        keptFirstBold = true;
      } else {
        out = out.replace(boldOpener, '$1');
        counts.bold++;
      }
    }

    const beforeSafe = out;
    for (const [re, to] of SAFE_PHRASE_RULES) out = out.replace(re, to);
    if (out !== beforeSafe) counts.phrase++;

    // Sentence-splitting rewrites stay outside bold spans.
    const beforePhrase = out;
    out = outsideBold(out, (seg) => {
      let s = seg;
      for (const [re, to] of PHRASE_RULES) s = s.replace(re, to);
      return s;
    });
    if (out !== beforePhrase) counts.phrase++;

    const dashesBefore = (out.match(/—/g) || []).length;
    for (const [re, to] of PAIRED) out = out.replace(re, to);
    for (const [re, to] of DASH_RULES) out = out.replace(re, to);
    out = fixArticleDash(out);
    out = fixListDash(out);
    counts.dash += dashesBefore - (out.match(/—/g) || []).length;

    return out;
  });

  return { text: front + lines.join('\n'), counts };
}

// Measuring the fingerprint requires excluding the places where an em dash is
// structural typography rather than prose habit. Counting these inflated three
// files past the ceiling and would have pushed a rewrite of correct headings:
//   · heading separators — "## Stage 1 — Power, measured properly"
//   · list-item labels   — "1. **Read the status pins** — two minutes"
//   · table cells, where "—" means "no data"
function toProse(body) {
  const state = { inCode: false };
  return body
    .split('\n')
    .filter((line) => !isSkippableLine(line, state))
    .map((line) => {
      if (/^#{1,6} /.test(line)) return ''; // headings
      // Leading "label — description" on a list item: drop the label and its dash.
      // Label forms seen in the corpus: **bold**, *italic*, `code`, or a short
      // capitalised phrase. The older articles use the italic form heavily
      // ("- *Spartan-3 family* — Formally discontinued years ago"), which is a
      // definition list, not a prose habit.
      // A bold label at the very start of a line, followed by a dash, is also a
      // definition-list entry: "**Stage 1: Identify** — quarterly BOM scrub…".
      const labelled = line.replace(/^(\*\*[^*]+\*\*)\s—\s/, '$1: ');
      if (labelled !== line) return labelled;
      return line.replace(
        /^(\s*(?:[-*]|\d+\.)\s+(?:\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|[A-Z][^—]{0,40}?))\s—\s/,
        '$1: ',
      );
    })
    .join('\n');
}

function metrics(text) {
  const [, body] = splitFrontmatter(text);
  const prose = toProse(body);
  const w = prose.split(/\s+/).filter(Boolean).length || 1;
  const n = (re) => (prose.match(re) || []).length;
  return {
    words: w,
    dash: (1000 * n(/—/g)) / w,
    // Field labels ("**What it means**: …") are structure, not prose cadence, so
    // they are excluded here for the same reason heading dashes are.
    bold: (1000 * n(/^\*\*[^*]{10,}\*\*(?!:)/gm)) / w,
    // Case-insensitive: a sentence-initial "Stated plainly" slipped past the
    // case-sensitive version, and the sentence-splitting rules then cut it into the
    // fragment "Stated plainly." Order matters — tics must be removed before the
    // splitters run.
    tic: (1000 * n(/stated plainly|the useful part|is the whole /gi)) / w,
    // Word boundary matters: without it "the integration band it is specified
    // over" counts as the tic. The transform rules carry a leading space and were
    // never affected, but the metric was over-reporting.
    andit: (1000 * n(/\band it is /g)) / w,
  };
}

// --------------------------------------------------------------------------
// Published-post mode.
//
// A published article's on-disk draft may have diverged from the live content
// (blog-content-plan.md records script fixes applied to live bodies that were
// never written back). Re-importing the draft would therefore overwrite live text
// with stale text. So for published posts the transform runs against the DATABASE
// content and writes back to the database, never through the importer.
//
// Default is report-only. Use --apply to write.
//   node scripts/detemplate-blog-prose.mjs --published
//   node scripts/detemplate-blog-prose.mjs --published --report
//   node scripts/detemplate-blog-prose.mjs --published --apply
// --------------------------------------------------------------------------
if (args.includes('--published')) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const apply = args.includes('--apply');
  const writeReport = args.includes('--report');
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    select: { id: true, slug: true, content: true },
    orderBy: { id: 'asc' },
  });

  // DB bodies carry CRLF on the older posts. Preserve each line's ending so the
  // only difference in the stored content is the prose edit itself.
  const transform = (content) => {
    const lines = content.split('\n');
    const cr = lines.map((l) => l.endsWith('\r'));
    const stripped = lines.map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l)).join('\n');
    const { text, counts } = detemplate(stripped);
    const outLines = text.split('\n').map((l, i) => (cr[i] ? `${l}\r` : l));
    return { text: outLines.join('\n'), counts };
  };

  const report = [
    '# Prose de-templating: proposed changes to the 21 published articles',
    '',
    `Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/detemplate-blog-prose.mjs --published --report\`.`,
    '',
    'Computed against the **database** content, not the on-disk drafts, because a',
    'published body may have diverged from its draft. Applying writes to the',
    'database directly and does not touch the draft files.',
    '',
    'Changes are punctuation and the removal of `**` wrappers only. No claim, number,',
    'part number, heading or link is altered.',
    '',
    '| Slug | Em dash | Bold openers | Tics | "and it is" |',
    '| --- | ---: | ---: | ---: | ---: |',
  ];
  const samples = [];

  console.log(
    `${'slug'.padEnd(50)} ${'dash'.padStart(12)} ${'boldopen'.padStart(12)} ${'tic'.padStart(11)} ${'andit'.padStart(11)}`,
  );
  let changed = 0;
  for (const post of posts) {
    const { text, counts } = transform(post.content);
    const a = metrics(post.content);
    const b = metrics(text);
    const f = (x, y) => `${x.toFixed(1)}→${y.toFixed(1)}`;
    console.log(
      `${post.slug.slice(0, 50).padEnd(50)} ${f(a.dash, b.dash).padStart(12)} ${f(a.bold, b.bold).padStart(12)} ${f(a.tic, b.tic).padStart(11)} ${f(a.andit, b.andit).padStart(11)}`,
    );
    report.push(
      `| \`${post.slug}\` | ${f(a.dash, b.dash)} | ${f(a.bold, b.bold)} | ${f(a.tic, b.tic)} | ${f(a.andit, b.andit)} |`,
    );

    if (text !== post.content) {
      changed++;
      const ol = post.content.split('\n');
      const nl = text.split('\n');
      const diff = [];
      for (let i = 0; i < ol.length && diff.length < 8; i++) {
        if (ol[i] !== nl[i]) {
          diff.push(`- ${ol[i].replace(/\r$/, '').slice(0, 400)}`);
          diff.push(`+ ${nl[i].replace(/\r$/, '').slice(0, 400)}`);
          diff.push('');
        }
      }
      samples.push(`\n### \`${post.slug}\`\n\n${counts.bold + counts.dash + counts.phrase} substitutions. First changes:\n\n\`\`\`diff\n${diff.join('\n')}\`\`\`\n`);
      if (apply) {
        await prisma.blogPost.update({ where: { id: post.id }, data: { content: text } });
      }
    }
  }

  if (writeReport) {
    const { writeFileSync: wf } = await import('node:fs');
    wf('docs/blog-prose-retrofit-published-review.md', `${report.join('\n')}\n\n## Sample diffs\n${samples.join('')}`, 'utf8');
    console.log('\nreport written to docs/blog-prose-retrofit-published-review.md');
  }
  console.log(
    `\n${posts.length} published posts, ${changed} would change ${apply ? '— APPLIED to the database' : '(report only; pass --apply to write)'}`,
  );
  await prisma.$disconnect();
  process.exit(0);
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => (wanted.length ? wanted.includes(f.slice(0, 2)) : true));

console.log(
  `${'file'.padEnd(46)} ${'dash'.padStart(12)} ${'boldopen'.padStart(12)} ${'tic'.padStart(10)} ${'andit'.padStart(10)}`,
);

let totalChanges = 0;
for (const f of files) {
  const path = join(DIR, f);
  const original = readFileSync(path, 'utf8');
  const { text, counts } = detemplate(original);
  const a = metrics(original);
  const b = metrics(text);
  const fmt = (x, y) => `${x.toFixed(1)}→${y.toFixed(1)}`.padStart(12);
  console.log(
    `${f.slice(0, 46).padEnd(46)} ${fmt(a.dash, b.dash)} ${fmt(a.bold, b.bold)} ${fmt(a.tic, b.tic).slice(-10).padStart(10)} ${fmt(a.andit, b.andit).slice(-10).padStart(10)}`,
  );
  totalChanges += counts.bold + counts.dash + counts.phrase;

  if (showDiff) {
    const ol = original.split('\n');
    const nl = text.split('\n');
    let shown = 0;
    for (let i = 0; i < ol.length && shown < 6; i++) {
      if (ol[i] !== nl[i]) {
        console.log(`    - ${ol[i].slice(0, 150)}`);
        console.log(`    + ${nl[i].slice(0, 150)}`);
        shown++;
      }
    }
  }

  if (!dryRun && text !== original) writeFileSync(path, text, 'utf8');
}

console.log(
  `\n${files.length} files, ${totalChanges} substitutions ${dryRun ? '(dry run — nothing written)' : 'applied'}`,
);
