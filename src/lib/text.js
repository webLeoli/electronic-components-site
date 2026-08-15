// Shared text/format helpers. Consolidates copies that had drifted apart
// across pages (formatCount existed in 4 files with 2 variants, escapeHtml in
// 2 files) so the same statistic can't render differently on two pages.

/**
 * Trim text to a meta-description length without cutting a word in half.
 *
 * Callers used to do `text.substring(0, 155) + '...'`, which appended an
 * ellipsis even when the text already fitted and happily sliced through the
 * middle of a word ("TI designs and manufact..."). Every one of the 383
 * manufacturer pages shipped a SERP snippet that looked truncated.
 */
export function truncateAtWord(text, maxLength) {
  const s = String(text ?? '').trim();
  if (s.length <= maxLength) return s;

  // Reserve one character for the ellipsis, then back off to a word boundary.
  const slice = s.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(' ');
  // Only honour the boundary if it isn't so early that we lose most of the text.
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.]+$/, '')}…`;
}

const PUBLIC_LOCALE = 'en-US';

/** Integer for public pages. Unpinned toLocaleString() used the host locale
 *  (zh-CN Node prints 6503 as "6.503"), which then leaked into SERP snippets. */
export function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString(PUBLIC_LOCALE);
}

// "1234" -> "1K+", "719342" -> "719K+", "1200000" -> "1.2M+"
export function formatCount(value) {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M+`;
  if (value >= 1000) return `${Math.round(value / 1000).toLocaleString(PUBLIC_LOCALE)}K+`;
  return formatInt(value);
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
