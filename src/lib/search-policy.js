/**
 * Shared limits for the two search entry points (/search page and
 * /api/search), which previously disagreed.
 *
 * MIN_SEARCH_QUERY_LENGTH is a hard performance floor, not a UX preference.
 * Search runs as ILIKE '%q%' over three pg_trgm GIN indexes, and a trigram
 * index cannot serve a pattern shorter than 3 characters — Postgres falls back
 * to a sequential scan of the whole Product table. Measured on the 719K-row
 * catalogue:
 *
 *   q="ic"      (2 chars)  ->  matched all 719,342 rows in  26,322 ms
 *   q="xc7a35t" (7 chars)  ->  matched            36 rows in      72 ms
 *
 * The API route enforced 3 and was safe; the page allowed 2 and had no rate
 * limit, so a single crawler following ?q= links could pin a database
 * connection for half a minute at a time.
 */

const MIN_SEARCH_QUERY_LENGTH = 3;
const MAX_SEARCH_QUERY_LENGTH = 100;

// One bucket shared by the page and the API so the budget is per visitor,
// not per entry point.
const SEARCH_RATE_LIMIT = { windowMs: 60 * 1000, max: 30, prefix: 'search' };

/**
 * Upper bound for the "N results" figure.
 *
 * An exact count was the slowest part of a search by an order of magnitude: a
 * broad term has to be counted across the whole table, and there is no early
 * exit. Measured on the 719K-row catalogue, q="ldo" (111,463 matches):
 *
 *   exact count            6,268 ms
 *   result list (top 10)     850 ms
 *   prefix match              91 ms
 *
 * Nothing consumes a number larger than this: /search caps at MAX_PAGES(100) ×
 * ITEMS_PER_PAGE(20) = 2,000 results, so anything beyond 2,001 only ever renders
 * as text. Counting to the cap and stopping turns those 6 seconds into
 * milliseconds; callers show "2,000+" when the cap is hit.
 */
const SEARCH_COUNT_CAP = 2001;

/**
 * Count matches for a search, cheaply, in both of the regimes that occur here.
 *
 * The two halves of a search query need opposite shapes, and using one shape for
 * both is what made "Skyworks Solutions" take 40 seconds:
 *
 *   text (ILIKE '%q%')   dense when the term is common. A capped findMany stops
 *                        as soon as it has `cap` rows: 143ms.
 *                        An exact count cannot stop early: 6,268ms.
 *   brand (= 'Skyworks') 22,857 scattered rows out of 719K. count() answers from
 *                        the index in 289ms; a capped findMany has to fetch rows
 *                        until it has 2,001 of them and takes 5,220ms.
 *
 * So: cap the text side, count the brand side, add them. The two sets barely
 * overlap in practice — brand names only join the query when the catalogue no
 * longer contains the spelling the visitor typed, so the text side matches
 * nothing for exactly those queries.
 */
async function countSearchMatches(prisma, { textOr, brandNames = [], baseWhere = {} }, cap = SEARCH_COUNT_CAP) {
  const rows = await prisma.product.findMany({
    where: { OR: textOr, ...baseWhere },
    select: { id: true },
    take: cap,
  });
  let total = rows.length;
  if (total >= cap) return { total: cap, capped: true };

  for (const name of brandNames) {
    total += await prisma.product.count({ where: { manufacturer: name, ...baseWhere } });
    if (total >= cap) return { total: cap, capped: true };
  }
  return { total, capped: false };
}

export {
  MIN_SEARCH_QUERY_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  SEARCH_RATE_LIMIT,
  SEARCH_COUNT_CAP,
  countSearchMatches,
};
