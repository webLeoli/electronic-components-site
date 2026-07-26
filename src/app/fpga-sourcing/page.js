import Link from 'next/link';
import { formatCount } from '@/lib/text';
import { unstable_cache } from 'next/cache';
import { SITE_NAME, SITE_URL, getAvailabilityText, hasConfirmedStock } from '@/lib/seo';
import { getFpgaSeries, getSeriesStats } from '@/lib/fpga-growth';

// ISR: regenerate at most hourly.
export const revalidate = 3600;

export const metadata = {
  title: 'FPGA and CPLD Sourcing',
  description: 'Source Xilinx, Altera, Intel, Lattice, Actel, and Microchip FPGA and CPLD parts with RFQ support for stock, date code, lead time, and alternates.',
  alternates: { canonical: `${SITE_URL}/fpga-sourcing` },
  openGraph: {
    title: `FPGA and CPLD Sourcing | ${SITE_NAME}`,
    description: 'Legacy FPGA and CPLD sourcing for production continuity, repairs, shortages, and obsolete part replacement.',
    url: `${SITE_URL}/fpga-sourcing`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} FPGA and CPLD Sourcing` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `FPGA and CPLD Sourcing | ${SITE_NAME}`,
    description: 'Legacy FPGA and CPLD sourcing with stock, date-code, lead-time, and alternate checks.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const getLandingData = unstable_cache(
  async () => Promise.all(getFpgaSeries().map(series => getSeriesStats(series))),
  ['fpga-sourcing-landing-data'],
  { revalidate: 3600, tags: ['fpga-sourcing'] },
);


export default async function FpgaSourcingPage() {
  const seriesStats = await getLandingData();
  const totalParts = seriesStats.reduce((sum, series) => sum + series.total, 0);
  const totalStocked = seriesStats.reduce((sum, series) => sum + series.inStock, 0);
  const totalRisk = seriesStats.reduce((sum, series) => sum + series.eolLike, 0);
  const featured = seriesStats.flatMap(series => series.samples.slice(0, 2)).slice(0, 10);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'FPGA and CPLD Sourcing' },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `FPGA and CPLD Sourcing | ${SITE_NAME}`,
    url: `${SITE_URL}/fpga-sourcing`,
    description: metadata.description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: seriesStats.length,
      itemListElement: seriesStats.map((series, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: series.title,
        url: `${SITE_URL}/fpga-sourcing/${series.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <section className="growth-hero">
        <div className="container growth-hero-grid">
          <div>
            <div className="eyebrow">Legacy programmable logic sourcing</div>
            <h1>FPGA and CPLD sourcing for production continuity</h1>
            <p>
              Find Xilinx, Altera, Intel, Lattice, Actel, and Microchip programmable logic parts.
              Send a single part number or a BOM to verify stock, date code, package, lead time, MOQ, and alternates.
            </p>
            <form className="hero-search growth-search" action="/search" method="GET" role="search">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input className="input" type="search" name="q" placeholder="Search XC6SLX9, EP4CE22, LCMXO2, A3P..." />
              <button type="submit" className="search-btn">Search FPGA Parts</button>
            </form>
            <div className="growth-hero-actions">
              <Link href="/rfq?category=FPGA%20and%20CPLD" className="btn btn-primary btn-lg">Request FPGA Quote</Link>
              <Link href="/bom" className="btn btn-secondary btn-lg">Upload BOM</Link>
            </div>
          </div>

          <aside className="growth-scorecard">
            <div>
              <span>{formatCount(totalParts)}</span>
              <strong>FPGA/CPLD matches</strong>
            </div>
            <div>
              <span>{formatCount(totalStocked)}</span>
              <strong>stock signals</strong>
            </div>
            <div>
              <span>{formatCount(totalRisk)}</span>
              <strong>EOL/obsolete/NRND records</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">High-intent FPGA and CPLD families</h2>
              <p className="section-subtitle">Dedicated landing pages for the part families buyers actually search by name.</p>
            </div>
          </div>

          <div className="series-grid">
            {seriesStats.map(series => (
              <Link href={`/fpga-sourcing/${series.slug}`} key={series.slug} className="series-card">
                <span className="series-family">{series.family}</span>
                <h2>{series.shortTitle}</h2>
                <p>{series.intro}</p>
                <div className="series-card-stats">
                  <span>{series.total.toLocaleString()} matches</span>
                  <span>{series.inStock.toLocaleString()} stocked</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Programmable logic quote targets</h2>
                <p className="section-subtitle">Sample parts from the FPGA/CPLD catalog. Final stock, lot, and price are confirmed by RFQ.</p>
              </div>
              <Link href="/rfq?category=FPGA%20and%20CPLD" className="btn btn-primary">Quote a Part</Link>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Manufacturer</th>
                    <th>Category</th>
                    <th>Package</th>
                    <th>Availability</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {featured.map(product => (
                    <tr key={product.partNumber}>
                      <td className="part-number"><Link href={product.href}>{product.partNumber}</Link></td>
                      <td>{product.manufacturer}</td>
                      <td>{product.category?.name || 'Programmable Logic'}</td>
                      <td>{product.packageType || 'Confirm'}</td>
                      <td>
                        <span className={hasConfirmedStock(product) ? 'text-success' : 'text-muted'}>
                          {getAvailabilityText(product)}
                        </span>
                      </td>
                      <td>{product.minPrice > 0 ? `$${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}` : 'RFQ'}</td>
                      <td><Link href={`/rfq?part=${encodeURIComponent(product.partNumber)}`} className="btn btn-outline btn-sm">Verify</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
