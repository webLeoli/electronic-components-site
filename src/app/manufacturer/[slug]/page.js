import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productPath, SITE_URL, SITE_NAME, hasConfirmedStock, getAvailabilityText } from '@/lib/seo';
import { FALLBACK_BRANDS } from '@/lib/fallbacks';

// Dynamic by inference (reads searchParams for pagination); page-independent
// aggregates are cached per manufacturer below.

function slugifyManufacturer(name) {
  return (name || 'unknown')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fallback list for manufacturers that exist in Product but have no
// Manufacturer row yet. The DISTINCT is a full-table aggregate over 700K+ rows,
// so it MUST be cached: uncached it was a per-request seq scan reachable by any
// bogus /manufacturer/* URL (a trivial DB DoS via crawlers/scanners).
const getDistinctManufacturerNames = unstable_cache(
  async () => {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "manufacturer" FROM "Product" LIMIT 5000`
    );
    return rows.map(r => r.manufacturer);
  },
  ['distinct-manufacturer-fallback'],
  { revalidate: 86400 }
);

const getManufacturer = cache(async (slug) => {
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    select: { name: true, slug: true, description: true, website: true, founded: true, headquarters: true, specialties: true, stockNote: true },
  });
  if (manufacturer) return manufacturer;

  const distinctNames = await getDistinctManufacturerNames();
  const match = distinctNames.find(name => slugifyManufacturer(name) === slug);
  if (match) {
    return { name: match, slug };
  }

  const brandName = FALLBACK_BRANDS.find(b => slugifyManufacturer(b) === slug);
  return brandName ? { name: brandName, slug } : null;
});

function parseSpecialties(str) {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

// This route is dynamic because it reads `searchParams.page` for pagination
// and resolves manufacturer records from the database on demand. The
// page-independent aggregate queries are cached per manufacturer below.

// Cache the expensive, page-independent aggregates per manufacturer for 1 hour.
const getManufacturerStats = (name) => unstable_cache(
  async () => {
    const [totalProducts, categories, statusDist, inStockCount] = await Promise.all([
      prisma.product.count({ where: { manufacturer: name } }),
      prisma.$queryRawUnsafe(
        `SELECT "categoryId", COUNT(*)::int as "_count" FROM "Product" WHERE "manufacturer" = $1 AND "categoryId" IS NOT NULL GROUP BY "categoryId"`,
        name
      ),
      prisma.$queryRawUnsafe(
        `SELECT "status", COUNT(*)::int as "cnt" FROM "Product" WHERE "manufacturer" = $1 GROUP BY "status" ORDER BY "cnt" DESC`,
        name
      ),
      prisma.product.count({ where: { manufacturer: name, status: 'active', stock: { gt: 0 } } }),
    ]);

    const categoryIds = categories.map(c => c.categoryId).filter(Boolean);
    const categoryData = categoryIds.length > 0
      ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, slug: true, name: true } })
      : [];

    return { totalProducts, categories, statusDist, inStockCount, categoryData };
  },
  ['manufacturer-stats', name],
  { revalidate: 3600, tags: [`manufacturer:${name}`] }
)();

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);
  const manufacturer = await getManufacturer(slug);
  if (!manufacturer) return { title: 'Manufacturer Not Found' };

  const specialties = parseSpecialties(manufacturer.specialties);
  const specText = specialties.length > 0 ? ` Specializing in ${specialties.slice(0, 3).join(', ')}.` : '';

  const title = page > 1
    ? `${manufacturer.name} Electronic Components - Page ${page}`
    : `Buy ${manufacturer.name} Electronic Components`;
  const description = manufacturer.description
    ? manufacturer.description.substring(0, 155) + '...'
    : `Buy ${manufacturer.name} electronic components at ${SITE_NAME}.${specText} Original parts, global sourcing, no MOQ, fast delivery.`;
  const canonicalUrl = `${SITE_URL}/manufacturer/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `${manufacturer.name} Electronic Components | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${manufacturer.name} Electronic Components` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${manufacturer.name} Electronic Components | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: { canonical: canonicalUrl },
  };
}

const ITEMS_PER_PAGE = 20;

export default async function ManufacturerPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);

  const manufacturer = await getManufacturer(slug);
  if (!manufacturer) notFound();

  const specialties = parseSpecialties(manufacturer.specialties);

  const [stats, products] = await Promise.all([
    getManufacturerStats(manufacturer.name),
    prisma.product.findMany({
      where: { manufacturer: manufacturer.name },
      include: { category: { select: { slug: true, name: true } } },
      orderBy: { partNumber: 'asc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ]);
  const { totalProducts, categories, statusDist, inStockCount, categoryData } = stats;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const categoryMap = Object.fromEntries(categoryData.map(c => [c.id, c]));

  // Status distribution
  const statusMap = Object.fromEntries(statusDist.map(s => [s.status, s.cnt]));
  const activeCount = statusMap['active'] || 0;
  const eolCount = (statusMap['eol'] || 0) + (statusMap['obsolete'] || 0);

  // JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Manufacturers', item: `${SITE_URL}/manufacturers` },
      { '@type': 'ListItem', position: 3, name: manufacturer.name },
    ],
  };

  const brandLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: manufacturer.name,
    url: `${SITE_URL}/manufacturer/${manufacturer.slug}`,
    ...(manufacturer.description ? { description: manufacturer.description } : {}),
    ...(manufacturer.website ? { sameAs: manufacturer.website } : {}),
    ...(manufacturer.founded ? { foundingDate: manufacturer.founded } : {}),
  };

  const itemListLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${manufacturer.name} Electronic Components`,
    numberOfItems: totalProducts,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${productPath(p.partNumber, p.manufacturer)}`,
      name: p.partNumber,
    })),
  } : null;

  // FAQ for SEO
  const faqs = [];
  faqs.push({
    q: `Where can I buy ${manufacturer.name} electronic components?`,
    a: `${SITE_NAME} stocks ${totalProducts.toLocaleString()} ${manufacturer.name} part numbers with ${inStockCount.toLocaleString()} currently in stock. All parts are 100% original with full traceability. No minimum order quantity required. Submit an RFQ for competitive pricing.`,
  });
  if (eolCount > 0) {
    faqs.push({
      q: `Can I still get obsolete ${manufacturer.name} parts?`,
      a: `Yes. ${SITE_NAME} specializes in sourcing hard-to-find and obsolete components. We have ${eolCount.toLocaleString()} end-of-life/obsolete ${manufacturer.name} part numbers in our database, many available from verified stock or through our global sourcing network.`,
    });
  }
  if (specialties.length > 0) {
    faqs.push({
      q: `What types of ${manufacturer.name} products does ${SITE_NAME} carry?`,
      a: `We stock ${manufacturer.name} products across ${categoryData.length} categories including ${specialties.slice(0, 4).join(', ')}. Browse our full catalog or contact our sourcing team for any specific ${manufacturer.name} part number.`,
    });
  }

  const faqLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandLd) }} />
      {itemListLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">›</span>
          <Link href="/manufacturers">Manufacturers</Link>
          <span className="separator">›</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{manufacturer.name}</span>
        </nav>

        {/* ── Hero Section ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.06) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl) var(--space-2xl)',
          marginBottom: 'var(--space-xl)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="manufacturer-logo-placeholder" style={{ fontSize: '36px', width: '80px', height: '80px', flexShrink: 0 }}>
              {manufacturer.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{manufacturer.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                {manufacturer.headquarters && (
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>📍 {manufacturer.headquarters}</span>
                )}
                {manufacturer.founded && (
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>📅 Est. {manufacturer.founded}</span>
                )}
                {manufacturer.website && (
                  <a href={manufacturer.website} target="_blank" rel="noopener noreferrer nofollow"
                    style={{ fontSize: '13px', color: 'var(--color-accent)' }}>
                    🔗 Official Site →
                  </a>
                )}
              </div>
              {manufacturer.description && (
                <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-secondary)', margin: 0 }}>
                  {manufacturer.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>{totalProducts.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Parts</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>{inStockCount.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>In Stock</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{categoryData.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Categories</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: activeCount > 0 ? '#22c55e' : 'var(--color-text-muted)' }}>{activeCount.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active</div>
          </div>
          {eolCount > 0 && (
            <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{eolCount.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>EOL/Obsolete</div>
            </div>
          )}
        </div>

        {/* ── Specialties Tags ── */}
        {specialties.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 className="product-section-title">Key Product Lines</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              {specialties.map(s => (
                <span key={s} className="product-app-tag">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Sourcing Note ── */}
        {manufacturer.stockNote && (
          <div style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              ✅ Why Source {manufacturer.name} from {SITE_NAME}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {manufacturer.stockNote}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>✓ Originality review</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>✓ No Minimum Order</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>✓ Quality Inspection</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>✓ Global Shipping</span>
            </div>
          </div>
        )}

        {/* ── Category Distribution ── */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 className="product-section-title">{manufacturer.name} Product Categories</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              {categories
                .sort((a, b) => b._count - a._count)
                .map(cat => {
                  const catInfo = categoryMap[cat.categoryId];
                  if (!catInfo) return null;
                  return (
                    <Link key={cat.categoryId} href={`/category/${catInfo.slug}`} className="manufacturer-cat-badge">
                      {catInfo.name} <span className="count">({cat._count})</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Products Table ── */}
        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 className="section-title">All {manufacturer.name} Products</h2>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages || 1}
          </span>
        </div>

        {products.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="table" id="manufacturer-products-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Package</th>
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
                        <Link href={productPath(product.partNumber, product.manufacturer)}>{product.partNumber}</Link>
                      </td>
                      <td>
                        {product.category ? (
                          <Link href={`/category/${product.category.slug}`} style={{ color: 'var(--color-text-secondary)' }}>
                            {product.category.name}
                          </Link>
                        ) : '—'}
                      </td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {product.packageType || '—'}
                      </td>
                      <td>
                        <span className={hasConfirmedStock(product) ? 'text-success' : 'text-muted'}>
                          {getAvailabilityText(product)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {product.minPrice > 0 ? `$${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                      </td>
                      <td>
                        <span className={`badge ${
                          product.status === 'active' ? 'badge-success' :
                          product.status === 'obsolete' ? 'badge-danger' :
                          product.status === 'eol' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {product.status === 'nrnd' ? 'NRND' : product.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <Link href={`/rfq?part=${encodeURIComponent(product.partNumber)}`} className="btn btn-outline btn-sm">RFQ</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {page > 1 && (
                  <Link href={`/manufacturer/${slug}?page=${page - 1}`} className="pagination-btn">← Prev</Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + Math.max(1, page - 3);
                  if (p > totalPages) return null;
                  return (
                    <Link key={p} href={`/manufacturer/${slug}?page=${p}`}
                      className={`pagination-btn ${p === page ? 'active' : ''}`}>
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link href={`/manufacturer/${slug}?page=${page + 1}`} className="pagination-btn">Next →</Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📦</div>
            <h3>No products listed yet</h3>
            <p>We&apos;re adding {manufacturer.name} products. Submit an RFQ to source any part.</p>
            <Link href="/rfq" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Submit RFQ</Link>
          </div>
        )}

        {/* ── FAQ Section ── */}
        {faqs.length > 0 && (
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <h2 className="product-section-title">Frequently Asked Questions</h2>
            <div className="product-faq-list" style={{ marginTop: 'var(--space-md)' }}>
              {faqs.map((faq, i) => (
                <details key={i} className="product-faq-item" open={i === 0}>
                  <summary className="product-faq-q">{faq.q}</summary>
                  <p className="product-faq-a">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div style={{
          marginTop: 'var(--space-2xl)',
          padding: 'var(--space-xl)',
          background: 'linear-gradient(135deg, var(--color-accent), #6366f1)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          color: '#fff',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Need {manufacturer.name} Components?
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: 'var(--space-lg)' }}>
            Submit an RFQ for competitive pricing on any {manufacturer.name} part. No minimum order, fast global shipping.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/rfq" className="btn" style={{ background: '#fff', color: 'var(--color-accent)', fontWeight: 700 }}>
              Request Quote
            </Link>
            <Link href="/contact" className="btn" style={{ border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
