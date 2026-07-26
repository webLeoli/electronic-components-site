import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { SITE_NAME, SITE_URL, productPath, getAvailabilityText, hasConfirmedStock } from '@/lib/seo';
import { buildSeriesWhere, getFpgaSeriesBySlug } from '@/lib/fpga-growth';

// On-demand ISR: built on first hit, then revalidated hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const series = getFpgaSeriesBySlug(slug);
  if (!series) return { title: 'FPGA Series Not Found' };

  const description = `${series.intro} RFQ support for stock, date code, package, lead time, MOQ, and alternates.`;
  const canonical = `${SITE_URL}/fpga-sourcing/${series.slug}`;

  return {
    title: series.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${series.title} | ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: series.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${series.title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

async function getSeriesPageData(series) {
  const where = buildSeriesWhere(series);
  const [total, inStock, constrained, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: buildSeriesWhere(series, { stockedOnly: true }) }),
    prisma.product.count({
      where: {
        AND: [
          where,
          { status: { in: ['obsolete', 'eol', 'nrnd'] } },
        ],
      },
    }),
    prisma.product.findMany({
      where,
      select: {
        partNumber: true,
        manufacturer: true,
        description: true,
        packageType: true,
        mountType: true,
        stock: true,
        minPrice: true,
        status: true,
        leadTime: true,
        category: { select: { slug: true, name: true } },
      },
      orderBy: [{ stock: 'desc' }, { qualityScore: 'desc' }, { partNumber: 'asc' }],
      take: 40,
    }),
  ]);

  return { total, inStock, constrained, products };
}

function statusLabel(status) {
  if (status === 'eol') return 'EOL';
  if (status === 'nrnd') return 'NRND';
  return (status || 'active').toUpperCase();
}

export default async function FpgaSeriesPage({ params }) {
  const { slug } = await params;
  const series = getFpgaSeriesBySlug(slug);
  if (!series) notFound();

  const { total, inStock, constrained, products } = await getSeriesPageData(series);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'FPGA and CPLD Sourcing', item: `${SITE_URL}/fpga-sourcing` },
      { '@type': 'ListItem', position: 3, name: series.shortTitle },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: series.title,
    numberOfItems: total,
    itemListElement: products.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.partNumber,
      url: `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">/</span>
          <Link href="/fpga-sourcing">FPGA Sourcing</Link>
          <span className="separator">/</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{series.shortTitle}</span>
        </nav>

        <section className="series-detail-hero">
          <div>
            <span className="series-family">{series.family}</span>
            <h1>{series.title}</h1>
            <p>{series.intro}</p>
            <div className="series-intent-row">
              {series.searchIntent.split(',').map(term => (
                <span key={term.trim()}>{term.trim()}</span>
              ))}
            </div>
          </div>
          <aside className="series-detail-card">
            <div><strong>{total.toLocaleString()}</strong><span>matching part numbers</span></div>
            <div><strong>{inStock.toLocaleString()}</strong><span>stock signals</span></div>
            <div><strong>{constrained.toLocaleString()}</strong><span>EOL/obsolete/NRND</span></div>
            <Link href={`/rfq?category=${encodeURIComponent(series.shortTitle)}`} className="btn btn-primary">Request {series.shortTitle} Quote</Link>
          </aside>
        </section>

        <section className="product-procurement-strip">
          <div>
            <strong>Before you buy: verify the exact lot.</strong>
            <span>{SITE_NAME} confirms package, speed grade, date code, MOQ, lead time, and acceptable alternates before order commitment.</span>
          </div>
          <div className="product-procurement-actions">
            <Link href={`/rfq?category=${encodeURIComponent(series.shortTitle)}`} className="btn btn-primary btn-sm">Send RFQ</Link>
            <Link href="/bom" className="btn btn-secondary btn-sm">Upload BOM</Link>
          </div>
        </section>

        {products.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Manufacturer</th>
                  <th>Description</th>
                  <th>Package</th>
                  <th>Stock</th>
                  <th>Lead Time</th>
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
                    <td>{product.manufacturer}</td>
                    <td style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.description || `${product.partNumber} programmable logic component`}
                    </td>
                    <td>{product.packageType || 'Confirm'}</td>
                    <td>
                      <span className={hasConfirmedStock(product) ? 'text-success' : 'text-muted'}>
                        {getAvailabilityText(product)}
                      </span>
                    </td>
                    <td>{product.leadTime || 'RFQ'}</td>
                    <td>
                      <span className={`badge ${
                        product.status === 'active' ? 'badge-success' :
                        product.status === 'obsolete' ? 'badge-danger' :
                        product.status === 'eol' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {statusLabel(product.status)}
                      </span>
                    </td>
                    <td><Link href={`/rfq?part=${encodeURIComponent(product.partNumber)}`} className="btn btn-outline btn-sm">Verify</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h2>No listed products yet</h2>
            <p>Send the exact {series.shortTitle} part number and our sourcing team will verify availability.</p>
            <Link href={`/rfq?category=${encodeURIComponent(series.shortTitle)}`} className="btn btn-primary">Submit RFQ</Link>
          </div>
        )}

        <section className="series-risk-section">
          <h2>How to reduce sourcing risk for {series.shortTitle}</h2>
          <div className="series-risk-grid">
            <div>
              <h3>Match the full ordering code</h3>
              <p>Package, speed grade, temperature range, and lead finish can change whether a device is usable in an existing board.</p>
            </div>
            <div>
              <h3>Ask for lot-level evidence</h3>
              <p>For older FPGA and CPLD parts, request date code, packaging condition, traceability notes, and inspection scope before purchase.</p>
            </div>
            <div>
              <h3>Check approved alternates early</h3>
              <p>When the exact part is constrained, pre-approved alternates or same-family package equivalents can protect repair and production timelines.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
