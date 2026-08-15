// Shared blog-content helpers used by both the manual blog CRUD route and the
// AI writer route, so the two write paths can never drift apart in strictness.

// Write-time defensive strip. The public renderer re-sanitizes with a full
// sanitize-html allowlist at render time (src/app/blog/[slug]/page.js); this is
// the first line of defense so the DB never stores obviously hostile markup.
export function stripDangerousHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '')
    .replace(/<script[\s>][\s\S]*$/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/<iframe[\s>][\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s>][\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s>][\s\S]*?>/gi, '')
    .replace(/<link[\s>][\s\S]*?>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '');
}

/**
 * Strip editorial scaffolding from a drafted article body.
 *
 * The markdown in docs/blog-drafts carries a working header for the writer —
 * an H1 repeating the title, an Author/Reading time/Topics blockquote, a note
 * pointing at the import metadata block, and a signature footer. All of it was
 * being stored verbatim and rendered to visitors, so every imported post opened
 * with a literal "# EOL vs NRND vs Obsolete…" paragraph followed by
 * "For DB import — see metadata block at the very end of this file."
 *
 * The page already renders post.title as the H1 and the byline from post.author,
 * so this material is duplicate at best and internal noise at worst.
 */
export function stripDraftScaffolding(markdown) {
  if (!markdown) return '';
  let out = String(markdown);

  // Leading YAML frontmatter. Drafts may carry a `--- ... ---` block at the top
  // as well as the `## DB import metadata` block at the bottom; without this the
  // frontmatter survives into the body and the article opens with raw
  // `title: "..."` lines. Must run before the horizontal-rule cleanup below,
  // which would otherwise consume only the opening delimiter.
  out = out.replace(/^﻿?\s*---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/, '');

  // Leading H1 — the page renders post.title itself.
  out = out.replace(/^\s*#\s+.+?\r?\n/, '');

  // Writer-facing blockquote header: a run of "> ..." lines mentioning Author,
  // Reading time, Topics or the import note. Only stripped at the very top, so
  // pull-quotes inside the article survive.
  out = out.replace(
    /^(?:\s*>.*(?:\r?\n|$))+/,
    block => (/\*\*(Author|Reading time|Topics)\*\*|For DB import/i.test(block) ? '' : block),
  );

  // Any stray standalone "For DB import" note that escaped the block above.
  out = out.replace(/^.*For DB import.*(?:\r?\n|$)/gim, '');

  // Trailing signature block: "---" then Author/Last reviewed lines.
  out = out.replace(
    /\r?\n-{3,}\s*(?:\r?\n\s*)*(?:\*\*(?:Author|Last reviewed)\*\*:.*(?:\r?\n|$)|\s*)+-{0,3}\s*$/i,
    '\n',
  );

  // Collapse the blank lines those removals leave behind, then drop the
  // horizontal rule that used to separate the header from the article.
  out = out.replace(/^(?:\s*\r?\n)+/, '');
  out = out.replace(/^-{3,}\s*(?:\r?\n)+/, '');

  return out.replace(/\r?\n{3,}/g, '\n\n').trim();
}

/**
 * Pull a FAQ section out of rendered article HTML so it can be emitted as
 * FAQPage structured data.
 *
 * Generative engines (AI Overviews, Perplexity, ChatGPT browsing) preferentially
 * quote self-contained question/answer pairs, and FAQPage is the machine-readable
 * form of exactly that. An article only needs an `## FAQ` (or "Frequently asked
 * questions") heading followed by `###` questions — no schema fields, no editor
 * work.
 *
 * Returns [] when the article has no FAQ section, so callers can skip the block.
 *
 * @param {string} html   Article HTML, after heading ids have been injected.
 * @param {(s: string) => string} stripHtml  Tag stripper supplied by the caller.
 */
export function extractFaqEntries(html, stripHtml) {
  if (!html) return [];

  // Locate the FAQ H2 and take everything up to the next H2.
  const faqHeading = /<h2[^>]*>\s*(?:FAQ|FAQs|Frequently\s+asked\s+questions)[^<]*<\/h2>/i.exec(html);
  if (!faqHeading) return [];

  const start = faqHeading.index + faqHeading[0].length;
  const rest = html.slice(start);
  const nextH2 = /<h2[^>]*>/i.exec(rest);
  const section = nextH2 ? rest.slice(0, nextH2.index) : rest;

  const entries = [];
  const questionRe = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[^>]*>|$)/gi;
  let match;
  while ((match = questionRe.exec(section)) !== null) {
    const question = stripHtml(match[1]).trim();
    const answer = stripHtml(match[2]).replace(/\s+/g, ' ').trim();
    // Skip stubs: a one-word "answer" is worse than no structured data at all,
    // because Google treats thin FAQPage markup as a quality signal against you.
    if (question && answer.length >= 40) entries.push({ question, answer });
  }

  return entries;
}

export function calcReadingTime(content) {
  const words = (content || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
