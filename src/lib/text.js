// Shared text/format helpers. Consolidates copies that had drifted apart
// across pages (formatCount existed in 4 files with 2 variants, escapeHtml in
// 2 files) so the same statistic can't render differently on two pages.

// "1234" -> "1K+", "719342" -> "719K+", "1200000" -> "1.2M+"
export function formatCount(value) {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M+`;
  if (value >= 1000) return `${Math.round(value / 1000).toLocaleString()}K+`;
  return value.toLocaleString();
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
