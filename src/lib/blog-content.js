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

export function calcReadingTime(content) {
  const words = (content || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
