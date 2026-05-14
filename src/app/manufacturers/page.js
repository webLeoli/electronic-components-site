import prisma from '@/lib/db';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { unstable_cache } from 'next/cache';

export const metadata = {
  title: 'Electronic Component Manufacturers',
  description: 'Browse electronic components by manufacturer. Find parts from Texas Instruments, STMicroelectronics, Microchip, Xilinx, Intel/Altera, and 3000+ more brands.',
  alternates: { canonical: `${SITE_URL}/manufacturers` },
  openGraph: {
    title: `Electronic Component Manufacturers | ${SITE_NAME}`,
    description: 'Browse 3000+ electronic component manufacturers. Find parts by brand at FPGACenter.',
    url: `${SITE_URL}/manufacturers`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Manufacturers` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Electronic Component Manufacturers | ${SITE_NAME}`,
    description: 'Browse 3000+ electronic component manufacturers. Find parts by brand at FPGACenter.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const revalidate = 3600;

// Cache heavy queries for 1 hour
const getManufacturersData = unstable_cache(
  async () => {
    const [manufacturers, productCounts] = await Promise.all([
      prisma.manufacturer.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
      // Raw SQL instead of groupBy — avoids full 720K row scan timeout
      prisma.$queryRawUnsafe(
        `SELECT "manufacturer", COUNT(*)::int as "count" FROM "Product" GROUP BY "manufacturer"`
      ),
    ]);
    const countMap = Object.fromEntries(productCounts.map(p => [p.manufacturer, p.count]));

    // Group by first letter
    const grouped = {};
    manufacturers.forEach(m => {
      const letter = m.name.charAt(0).toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(m);
    });

    return { manufacturers, countMap, grouped, letters: Object.keys(grouped).sort() };
  },
  ['manufacturers-list'],
  { revalidate: 3600, tags: ['manufacturers'] }
);

export default async function ManufacturersPage() {
  const { manufacturers, countMap, grouped, letters } = await getManufacturersData();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Manufacturers' },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Electronic Component Manufacturers',
    url: `${SITE_URL}/manufacturers`,
    description: `Browse components from ${manufacturers.length}+ authorized manufacturers and distributors.`,
    numberOfItems: manufacturers.length,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Manufacturers</span>
      </nav>

      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
        Electronic Component Manufacturers
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)', fontSize: '15px' }}>
        Browse components from {manufacturers.length}+ authorized manufacturers and distributors
      </p>

      {/* Letter Index */}
      <div className="manufacturers-letter-index" id="letter-index">
        {letters.map(letter => (
          <a key={letter} href={`#letter-${letter}`} className="letter-link">{letter}</a>
        ))}
      </div>

      {/* Manufacturer Grid */}
      <div className="manufacturers-list">
        {letters.map(letter => (
          <div key={letter} id={`letter-${letter}`} className="manufacturer-letter-group">
            <h2 className="letter-heading">{letter}</h2>
            <div className="manufacturer-grid">
              {grouped[letter].map(m => (
                <Link key={m.slug} href={`/manufacturer/${m.slug}`} className="manufacturer-card">
                  <div className="manufacturer-logo-sm">{m.name.charAt(0)}</div>
                  <div>
                    <div className="manufacturer-name">{m.name}</div>
                    <div className="manufacturer-count">{(countMap[m.name] || 0).toLocaleString()} products</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
