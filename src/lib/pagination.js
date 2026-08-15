/**
 * Shared pagination policy for the indexable listings (/category, /manufacturer).
 *
 * Two problems this solves, both of which stranded products:
 *
 * 1. The cap. A flat MAX_PAGES of 100 meant only the first 2,000 rows of a
 *    listing were reachable at all. 54 categories hold more than 2,000 products
 *    and 572,980 products sat past the wall — 80% of the catalogue, browsable
 *    only via the sitemap. The cap now covers the largest listing (101,457
 *    products = 5,073 pages) with headroom. It stays finite so a crafted
 *    ?page=999999 cannot ask Postgres for an unbounded offset.
 *
 *    Deep offsets are affordable here because both listings sort on a covering
 *    composite index and the row fetch is cached for 5 minutes. Measured on the
 *    719K-row table, ordering by (categoryId, partNumber):
 *
 *      skip=0      8ms      skip=20,000   148ms
 *      skip=2,000  17ms     skip=50,000   272ms
 *                           skip=101,000  599ms
 *
 * 2. The click depth. The widget only ever linked current±2, so reaching page
 *    2,500 took ~1,250 hops from page 1 — past any crawler's practical depth
 *    budget, which made a higher cap useless on its own. buildPageList adds
 *    decade jumps, so any page in a 5,000-page listing is 4-5 hops from the
 *    first. These are the same ?page=N URLs as before; only which ones get
 *    linked changes.
 */

const LISTING_MAX_PAGES = 6000;

/**
 * Page numbers to render, with '…' markers where the sequence skips.
 * Always includes: first, last, a ±2 window around the current page, and
 * ±10 / ±100 / ±1000 jumps.
 */
function buildPageList(current, total) {
  if (total <= 1) return total === 1 ? [1] : [];

  const wanted = new Set([1, total]);
  for (let delta = -2; delta <= 2; delta++) wanted.add(current + delta);
  for (const step of [10, 100, 1000]) {
    wanted.add(current - step);
    wanted.add(current + step);
  }

  const pages = [...wanted]
    .filter(p => Number.isInteger(p) && p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out = [];
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) out.push('…');
    out.push(page);
  });
  return out;
}

export { LISTING_MAX_PAGES, buildPageList };
