// Convert bold-text FAQ questions into real H3 headings in the draft files.
//
// The earlier articles wrote their FAQ questions as `**Question?**` on its own
// line. That renders as a bold paragraph: no heading anchor, no table-of-contents
// entry, and — the reason this matters — invisible to extractFaqEntries(), which
// looks for h3 elements when building FAQPage structured data. Generative engines
// quote question/answer pairs more readily than any other content shape, so these
// were the pages most worth marking up and the only ones not marked up.
//
// Only lines inside the `## FAQ` section are touched, so bold call-outs elsewhere
// in the article (including the CTA immediately after the FAQ) are left alone.
//
// Usage:
//   node scripts/upgrade-faq-headings.mjs --dry-run
//   node scripts/upgrade-faq-headings.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const DRAFTS_DIR = 'docs/blog-drafts';

let filesChanged = 0;
let questionsConverted = 0;

for (const file of readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md')).sort()) {
  const path = join(DRAFTS_DIR, file);
  const raw = readFileSync(path, 'utf8');

  const faqStart = raw.search(/^## FAQ\s*$/m);
  if (faqStart === -1) continue;

  const afterHeading = raw.indexOf('\n', faqStart) + 1;
  const rest = raw.slice(afterHeading);
  // The FAQ section ends at the next H2, or at a horizontal rule that separates
  // it from the closing call-to-action.
  const endMatch = rest.search(/^(## |---\s*$)/m);
  const sectionEnd = endMatch === -1 ? raw.length : afterHeading + endMatch;

  const section = raw.slice(afterHeading, sectionEnd);
  let converted = 0;
  const upgraded = section.replace(/^\*\*(.+?)\*\*[ \t]*$/gm, (_, question) => {
    converted++;
    return `### ${question}`;
  });

  if (!converted) continue;

  // A markdown H3 needs a blank line before the answer paragraph to parse
  // cleanly; the bold form did not.
  const spaced = upgraded.replace(/^(### .+)\n(?!\n)/gm, '$1\n\n');
  const next = raw.slice(0, afterHeading) + spaced + raw.slice(sectionEnd);

  filesChanged++;
  questionsConverted += converted;
  console.log(`${dryRun ? '[dry-run] ' : ''}${file}: ${converted} question(s) -> H3`);

  if (!dryRun) writeFileSync(path, next, 'utf8');
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${questionsConverted} questions across ${filesChanged} file(s).`);
