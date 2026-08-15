import { headers } from 'next/headers';
import prisma from '@/lib/db';
import Link from 'next/link';
import AddToRfqButton from '@/components/AddToRfqButton';
import { ProductIcon } from '@/components/ProductImage';
import { productPath, SITE_NAME, SITE_URL, hasConfirmedStock, getAvailabilityText } from '@/lib/seo';
import { getStatusInfo } from '@/lib/product-status';
import { MIN_SEARCH_QUERY_LENGTH, MAX_SEARCH_QUERY_LENGTH, SEARCH_RATE_LIMIT, countSearchMatches } from '@/lib/search-policy';
import { canonicalNamesForQuery } from '@/lib/manufacturer-canonical';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { formatInt } from '@/lib/text';

// Catalogue size claim kept in step with lib/seo SITE_DESC — this page used to
// advertise "over 1 million components" against a 720K-row catalogue.
export const metadata = {
  title: 'Search Electronic Components',
  description: 'Search our catalogue of 720K+ electronic components by part number, manufacturer, or keyword.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: `Search Electronic Components | ${SITE_NAME}`,
    description: 'Search 720K+ electronic components by part number, manufacturer, or keyword.',
    url: `${SITE_URL}/search`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Search` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Search Electronic Components | ${SITE_NAME}`,
    description: 'Search 720K+ electronic components by part number, manufacturer, or keyword.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const ITEMS_PER_PAGE = 20;
const MAX_PAGES = 100; // Protect DB from deep pagination attacks

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const query = sp?.q?.trim() || '';
  // Enforce page bounds: 1 <= page <= MAX_PAGES
  const page = Math.max(1, Math.min(parseInt(sp?.page) || 1, MAX_PAGES));
  const sort = sp?.sort || 'partNumber';
  const order = sp?.order || 'asc';

  let products = [];
  let totalProducts = 0;
  let totalCapped = false;
  let totalPages = 0;
  let queryError = null;

  if (query) {
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      queryError = `Search term must be at least ${MIN_SEARCH_QUERY_LENGTH} characters long.`;
    } else if (query.length > MAX_SEARCH_QUERY_LENGTH) {
      queryError = `Search term is too long (maximum ${MAX_SEARCH_QUERY_LENGTH} characters).`;
    } else if (!(await rateLimit(getClientIp({ headers: await headers() }), SEARCH_RATE_LIMIT))) {
      // Same bucket as /api/search. Checked only once the query is known to be
      // index-servable, so a rejected short query costs nothing.
      queryError = 'Too many searches from your connection. Please wait a moment and try again.';
    } else {
      // Search in partNumber, manufacturer, description.
      // duplicateOfId: null keeps punctuation variants of the same part from
      // taking two result slots (scripts/dedupe-part-numbers.mjs).
      const textOr = [
        { partNumber: { contains: query, mode: 'insensitive' } },
        { manufacturer: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
      // Retired brand spellings still have to find their products — a search for
      // "Skyworks Solutions" must not come back empty now that the rows say
      // "Skyworks". See canonicalNamesForQuery.
      const brandNames = canonicalNamesForQuery(query);

      // Counted to a cap, not exactly: an exact count of a broad term cost 6.3s
      // on its own, and pagination stops at MAX_PAGES × ITEMS_PER_PAGE anyway.
      const counted = await countSearchMatches(prisma, {
        textOr, brandNames, baseWhere: { duplicateOfId: null },
      });
      totalProducts = counted.total;
      totalCapped = counted.capped;

      // When the query only matches through a retired brand name, search that
      // brand directly instead of OR-ing it into the text predicate: the
      // (manufacturer, partNumber) and (manufacturer, stock) indexes then serve
      // the sort, where the OR form degenerates into a scan.
      // Existence check, not a count: whether the text side matches anything is
      // all that matters here, and `take: 1` lets the planner stop at the first
      // row instead of counting every match.
      const textMatchesAnything = brandNames.length === 0 || (await prisma.product.findMany({
        where: { OR: textOr, duplicateOfId: null }, select: { id: true }, take: 1,
      })).length > 0;
      const where = (brandNames.length && !textMatchesAnything)
        ? { manufacturer: { in: brandNames }, duplicateOfId: null }
        : { OR: [...textOr, ...brandNames.map(name => ({ manufacturer: { equals: name } }))], duplicateOfId: null };
      // Cap total pages to prevent deep pagination queries
      totalPages = Math.min(Math.ceil(totalProducts / ITEMS_PER_PAGE), MAX_PAGES);

      const validSorts = ['partNumber', 'manufacturer', 'minPrice', 'stock'];
      const sortField = validSorts.includes(sort) ? sort : 'partNumber';
      const sortDir = order === 'desc' ? 'desc' : 'asc';
      const orderBy = { [sortField]: sortDir };
      const ROW_SELECT = {
        partNumber: true, manufacturer: true, description: true, packageType: true,
        mountType: true, status: true, minPrice: true, stock: true, moq: true,
        imageUrl: true, category: { select: { slug: true, name: true } },
      };

      if (!totalCapped) {
        // Few enough matches that the database can sort them outright.
        products = await prisma.product.findMany({
          where, orderBy,
          skip: (page - 1) * ITEMS_PER_PAGE,
          take: ITEMS_PER_PAGE,
          // Explicit select keeps specs/datasheet blobs out of the result rows.
          select: ROW_SELECT,
        });
      } else {
        // Broad term. Sorting it in the database means sorting every match: a
        // word like "regulator" hits ~100K descriptions and ORDER BY costs 1.4s
        // against 9ms for the same query unsorted. Since pagination stops at
        // MAX_PAGES × ITEMS_PER_PAGE anyway, take exactly that many candidates
        // (the planner stops early), rank them here, and page within them.
        const pool = await prisma.product.findMany({
          where,
          select: { id: true, partNumber: true, manufacturer: true, minPrice: true, stock: true },
          take: MAX_PAGES * ITEMS_PER_PAGE,
        });
        const dir = sortDir === 'desc' ? -1 : 1;
        pool.sort((a, b) => {
          const x = a[sortField], y = b[sortField];
          if (x == null && y == null) return 0;
          if (x == null) return 1;
          if (y == null) return -1;
          if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
          return String(x).localeCompare(String(y)) * dir;
        });
        const pageIds = pool.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(r => r.id);
        const rows = pageIds.length
          ? await prisma.product.findMany({ where: { id: { in: pageIds } }, select: ROW_SELECT })
          : [];
        // findMany returns rows in its own order; restore the ranked one.
        const byPart = new Map(rows.map(r => [r.partNumber, r]));
        const ranked = pool.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
        products = ranked.map(r => byPart.get(r.partNumber)).filter(Boolean);
      }
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Search' },
    ],
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)', minHeight: '60vh' }}>
      {/* Search Header */}
      <div className="search-page-header">
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
          {query ? (
            <>Search Results for <span className="text-accent">&quot;{query}&quot;</span></>
          ) : (
            'Search Electronic Components'
          )}
        </h1>
        {query && (
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {/* "2,000+" when the count hit its cap — the exact figure is not
                worth the full-table scan it costs (see search-policy.js). */}
            {formatInt(totalProducts)}{totalCapped ? '+' : ''} {totalProducts === 1 ? 'result' : 'results'} found
          </p>
        )}
      </div>

      {/* Search Form */}
      <form action="/search" method="GET" className="search-page-form" id="search-page-form">
        <div className="hero-search" style={{ maxWidth: '100%', margin: '0 0 var(--space-xl)' }}>
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            className="input"
            placeholder="Search by part number, manufacturer, or keyword..."
            defaultValue={query}
            id="search-page-input"
          />
          <button type="submit" className="search-btn" id="search-page-btn">Search</button>
        </div>
      </form>

      {/* Query Error State */}
      {queryError && (
        <div className="empty-state" style={{ padding: 'var(--space-2xl) var(--space-xl)', background: 'rgba(255, 61, 0, 0.05)', border: '1px solid rgba(255, 61, 0, 0.2)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>⚠️</div>
          <h3 style={{ color: 'var(--color-danger)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Invalid Search</h3>
          <p>{queryError}</p>
        </div>
      )}

      {/* No Query State */}
      {!query && (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-md)' }}>🔍</div>
          <h3>Enter a Part Number or Keyword</h3>
          <p>Try searching for a specific part like &quot;STM32F103&quot;, a manufacturer like &quot;Texas Instruments&quot;, or a component type.</p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
            {['STM32F103C8T6', 'ATMEGA328P', 'IRF540N', 'NE555P', 'Xilinx', 'LM7805'].map(term => (
              <Link key={term} href={`/search?q=${term}`} className="btn btn-secondary btn-sm">
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {query && !queryError && products.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="table" id="search-results-table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Manufacturer</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.partNumber}>
                    <td className="part-number">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ProductIcon product={product} size={28} />
                        <Link href={productPath(product.partNumber, product.manufacturer)}>
                          <HighlightText text={product.partNumber} query={query} />
                        </Link>
                      </div>
                    </td>
                    <td><HighlightText text={product.manufacturer} query={query} /></td>
                    <td>
                      {product.category ? (
                        <Link href={`/category/${product.category.slug}`} style={{ color: 'var(--color-text-secondary)' }}>
                          {product.category.name}
                        </Link>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.description}
                    </td>
                    <td>
                      <span className={hasConfirmedStock(product) ? 'text-success' : 'text-muted'}>
                        {getAvailabilityText(product)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {product.minPrice ? `$${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusInfo(product.status).badgeClass}`}>
                        {getStatusInfo(product.status).short}
                      </span>
                    </td>
                    <td>
                      <AddToRfqButton
                        partNumber={product.partNumber}
                        manufacturer={product.manufacturer}
                        variant="small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {page > 1 && (
                <Link href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}&sort=${sort}&order=${order}`} className="pagination-btn" rel="nofollow">← Prev</Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + Math.max(1, page - 2);
                if (p > totalPages) return null;
                return (
                  <Link key={p} href={`/search?q=${encodeURIComponent(query)}&page=${p}&sort=${sort}&order=${order}`}
                    className={`pagination-btn ${p === page ? 'active' : ''}`} rel="nofollow">
                    {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}&sort=${sort}&order=${order}`} className="pagination-btn" rel="nofollow">Next →</Link>
              )}
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {query && !queryError && products.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-md)' }}>😕</div>
          {page > 1 && totalProducts > 0 ? (
            <>
              <h3>No more results on this page</h3>
              <p>Page {page} is past the last matching row for &quot;{query}&quot;.</p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <Link href={`/search?q=${encodeURIComponent(query)}`} className="btn btn-primary">
                  Back to first page
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3>No Results Found</h3>
              <p>We couldn&apos;t find &quot;{query}&quot; in our inventory. But we can source it for you!</p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <Link href={`/rfq?part=${encodeURIComponent(query)}`} className="btn btn-primary">
                  Submit RFQ for &quot;{query}&quot;
                </Link>
                <Link href="/" className="btn btn-secondary">Back to Home</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}

// Highlight matching keywords in text
function HighlightText({ text, query }) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(splitRegex);
  const lowerQuery = query.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lowerQuery ? (
      <mark key={i} style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)', padding: '0 2px', borderRadius: '2px' }}>
        {part}
      </mark>
    ) : part
  );
}
