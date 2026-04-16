import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/seo';
import { FALLBACK_BRANDS } from '@/lib/fallbacks';

export const revalidate = 3600;

export async function generateStaticParams() {
  const manufacturers = await prisma.manufacturer.findMany({ select: { slug: true } });
  return manufacturers.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const manufacturer = await prisma.manufacturer.findUnique({ where: { slug } });
  if (!manufacturer) {
    // Check if slug matches a fallback brand
    const brandName = FALLBACK_BRANDS.find(b => b.toLowerCase().replace(/[\s\/]+/g, '-') === slug);
    if (!brandName) return { title: 'Manufacturer Not Found' };
    const title = `${brandName} Electronic Components`;
    const ogTitle = `${brandName} Electronic Components | FPGACenter`;
    const description = `Buy ${brandName} electronic components at FPGACenter. Original parts, fast delivery, no MOQ.`;
    return { title, description, openGraph: { title: ogTitle, description, url: `${SITE_URL}/manufacturer/${slug}`, siteName: 'FPGACenter', type: 'website' }, alternates: { canonical: `${SITE_URL}/manufacturer/${slug}` } };
  }

  const productCount = await prisma.product.count({ where: { manufacturer: manufacturer.name } });
  const title = `${manufacturer.name} Electronic Components`;
  const ogTitle = `${manufacturer.name} Electronic Components | FPGACenter`;
  const description = `Buy ${manufacturer.name} electronic components at FPGACenter. ${productCount.toLocaleString()} parts in stock including ICs, semiconductors, and more. Original parts, fast delivery, no MOQ.`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: `Browse ${productCount.toLocaleString()} ${manufacturer.name} components in stock at FPGACenter.`,
      url: `${SITE_URL}/manufacturer/${slug}`,
      siteName: 'FPGACenter',
      type: 'website',
    },
    alternates: {
      canonical: `${SITE_URL}/manufacturer/${slug}`,
    },
  };
}

const ITEMS_PER_PAGE = 20;

export default async function ManufacturerPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);

  let manufacturer = await prisma.manufacturer.findUnique({ where: { slug } });
  if (!manufacturer) {
    const brandName = FALLBACK_BRANDS.find(b => b.toLowerCase().replace(/[\s\/]+/g, '-') === slug);
    if (!brandName) notFound();
    manufacturer = { name: brandName, slug };
  }

  const totalProducts = await prisma.product.count({
    where: { manufacturer: manufacturer.name },
  });
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const products = await prisma.product.findMany({
    where: { manufacturer: manufacturer.name },
    include: { category: true },
    orderBy: { partNumber: 'asc' },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  // Get category distribution
  const categories = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { manufacturer: manufacturer.name },
    _count: true,
  });

  // Fetch category names
  const categoryIds = categories.map(c => c.categoryId).filter(Boolean);
  const categoryData = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = Object.fromEntries(categoryData.map(c => [c.id, c]));

  // JSON-LD: BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Manufacturers', item: `${SITE_URL}/manufacturers` },
      { '@type': 'ListItem', position: 3, name: manufacturer.name },
    ],
  };

  // JSON-LD: ItemList (top products)
  const itemListLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${manufacturer.name} Electronic Components`,
    numberOfItems: totalProducts,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${encodeURIComponent(p.partNumber)}`,
      name: p.partNumber,
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemListLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
    <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <Link href="/manufacturers">Manufacturers</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{manufacturer.name}</span>
      </nav>

      {/* Manufacturer Header */}
      <div className="manufacturer-header">
        <div className="manufacturer-logo-placeholder">
          {manufacturer.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{manufacturer.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {totalProducts.toLocaleString()} products available • {categoryData.length} categories
          </p>
          {manufacturer.website && (
            <a href={manufacturer.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '4px', display: 'inline-block' }}>
              Visit Official Website →
            </a>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      {categories.length > 0 && (
        <div className="manufacturer-categories" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className="product-section-title">Product Categories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            {categories.map(cat => {
              const catInfo = categoryMap[cat.categoryId];
              if (!catInfo) return null;
              return (
                <Link key={cat.categoryId} href={`/category/${catInfo.slug}`}
                  className="manufacturer-cat-badge">
                  {catInfo.name} <span className="count">({cat._count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Table */}
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
                      <Link href={`/product/${encodeURIComponent(product.partNumber)}`}>{product.partNumber}</Link>
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
                      <span className={product.stock > 0 ? 'text-success' : 'text-danger'}>
                        {product.stock > 0 ? product.stock.toLocaleString() : 'Contact'}
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

          {/* Pagination */}
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
    </div>
    </>
  );
}
