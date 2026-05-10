import Link from 'next/link';
import prisma from '@/lib/db';
import { SITE_NAME, SITE_URL, SITE_DESC } from '@/lib/seo';
import CategoryIcon from '@/components/CategoryIcon';
import { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_CATEGORIES, FALLBACK_PARTS, FALLBACK_BRANDS } from '@/lib/fallbacks';
import { unstable_cache } from 'next/cache';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: `${SITE_NAME} - Hard-to-Find & Obsolete Electronic Components`,
  description: SITE_DESC,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} - Hard-to-Find & Obsolete Electronic Components`,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} - Electronic Component Sourcing` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Electronic Component Sourcing`,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.png`],
  },
};


const FEATURES = [
  { icon: '⊹', title: 'Hard-to-Find Parts', desc: 'Specializing in obsolete, end-of-life, and hard-to-source electronic components worldwide.' },
  { icon: '✓', title: 'Quality Guaranteed', desc: 'Every component undergoes rigorous testing. 100% original and genuine parts with full traceability.' },
  { icon: '▣', title: 'No Minimum Order', desc: 'Order any quantity from 1 piece to millions. Perfect for prototyping and production alike.' },
  { icon: '➤', title: 'Fast Global Shipping', desc: 'Same-day dispatch for in-stock items. Express delivery to 60+ countries via DHL, FedEx, UPS.' },
];

// Fetch dynamic data from database (cached for 5 minutes)
const getHomeData = unstable_cache(
  async () => {
    try {
      const [allCategories, popularProducts, manufacturers, stats] = await Promise.all([
        // All categories with direct product counts (for recursive summing)
        prisma.category.findMany({
          select: {
            id: true, name: true, slug: true, icon: true,
            parentId: true, sortOrder: true,
            _count: { select: { products: true } },
          },
        }),
        // Popular products (highest stock, active)
        prisma.product.findMany({
          where: { status: 'active', stock: { gt: 0 } },
          select: {
            partNumber: true, manufacturer: true, stock: true, minPrice: true, status: true,
            category: { select: { name: true } },
          },
          orderBy: { stock: 'desc' },
          take: 8,
        }),
        // Top manufacturers with verified slugs from Manufacturer table
        prisma.manufacturer.findMany({
          select: { name: true, slug: true },
          orderBy: { name: 'asc' },
          take: 24,
        }),
        // Overall stats
        Promise.all([
          prisma.product.count(),
          prisma.manufacturer.count(),
        ]),
      ]);

      // Build recursive product count for L1 categories
      // L1 → sum of (L2 children → sum of L3 children direct product counts)
      const byParent = new Map();
      for (const cat of allCategories) {
        const pid = cat.parentId || '__root__';
        if (!byParent.has(pid)) byParent.set(pid, []);
        byParent.get(pid).push(cat);
      }

      function sumProducts(catId) {
        const cat = allCategories.find(c => c.id === catId);
        let total = cat?._count?.products || 0;
        const children = byParent.get(catId) || [];
        for (const child of children) {
          total += sumProducts(child.id);
        }
        return total;
      }

      const rootCategories = (byParent.get('__root__') || [])
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
        .slice(0, 12)
        .map(cat => ({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          _count: { products: sumProducts(cat.id) },
        }));

      return {
        categories: rootCategories.length > 0 ? rootCategories : FALLBACK_CATEGORIES,
        popularProducts: popularProducts.length > 0 ? popularProducts : null,
        manufacturers: manufacturers.length > 0 ? manufacturers : null,
        totalProducts: stats[0] || 10000,
        totalManufacturers: stats[1] || 500,
      };
    } catch (e) {
      console.error('Homepage data fetch error:', e.message);
      return {
        categories: FALLBACK_CATEGORIES,
        popularProducts: null,
        manufacturers: null,
        totalProducts: 10000,
        totalManufacturers: 500,
      };
    }
  },
  ['homepage-data'],
  { revalidate: 300, tags: ['homepage'] }
);


function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString()}K+`;
  return n.toLocaleString();
}

export default async function HomePage() {
  const { categories, popularProducts, manufacturers, totalProducts, totalManufacturers } = await getHomeData();

  const parts = popularProducts || FALLBACK_PARTS;
  const brands = manufacturers || FALLBACK_BRANDS.map(b => ({ name: b, slug: b.toLowerCase().replace(/[\s\/]+/g, '-') }));

  const orgJsonLd = (await import('@/lib/seo')).generateOrganizationJsonLd();
  const websiteJsonLd = (await import('@/lib/seo')).generateWebSiteJsonLd();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="animate-fade-in">
              Find <span className="highlight">Hard-to-Source</span> Electronic Components
            </h1>
            <p className="animate-fade-in animate-fade-in-delay-1">
              {formatCount(totalProducts)} obsolete, end-of-life, and hard-to-find parts from {formatCount(totalManufacturers)} manufacturers.
              Quality assured, no minimum order, worldwide shipping.
            </p>

            <form className="hero-search animate-fade-in animate-fade-in-delay-2" action="/search" method="GET" role="search" id="hero-search-form">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="search" name="q" className="input" placeholder="Enter part number, e.g. STM32F103C8T6..." id="hero-search-input" />
              <button type="submit" className="search-btn" id="hero-search-btn">Search Parts</button>
            </form>

            <div className="hero-stats animate-fade-in animate-fade-in-delay-3">
              <div className="hero-stat">
                <div className="hero-stat-value">{formatCount(totalProducts)}</div>
                <div className="hero-stat-label">Part Numbers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{formatCount(totalManufacturers)}</div>
                <div className="hero-stat-label">Manufacturers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">60+</div>
                <div className="hero-stat-label">Countries Served</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">24h</div>
                <div className="hero-stat-label">Express Shipping</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Parts Table */}
      <section className="section" id="popular-parts-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Popular Parts</h2>
              <p className="section-subtitle">Frequently searched electronic components</p>
            </div>
            <Link href="/search" className="view-all">View All Parts →</Link>
          </div>

          <div className="table-wrapper">
            <table className="table" id="popular-parts-table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Manufacturer</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.partNumber}>
                    <td className="part-number">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ProductIcon product={part} size={28} />
                        <Link href={`/product/${encodeURIComponent(part.partNumber)}`}>{part.partNumber}</Link>
                      </div>
                    </td>
                    <td>{part.manufacturer}</td>
                    <td>{part.category?.name || '—'}</td>
                    <td>
                      <span className={part.stock > 0 ? 'text-success' : 'text-danger'}>
                        {part.stock > 0 ? part.stock.toLocaleString() : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                    {part.minPrice > 0 ? `$${part.minPrice.toFixed(part.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                    </td>
                    <td>
                      <span className={`badge ${
                        part.status === 'active' ? 'badge-success' :
                        part.status === 'obsolete' ? 'badge-danger' :
                        part.status === 'eol' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {part.status === 'nrnd' ? 'NRND' : part.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Link href={`/rfq?part=${encodeURIComponent(part.partNumber)}`} className="btn btn-outline btn-sm">
                        RFQ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }} id="categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-subtitle">Explore our extensive inventory of electronic components</p>
            </div>
            <Link href="/category" className="view-all">All Categories →</Link>
          </div>

          <div className="category-grid">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`category-card animate-fade-in animate-fade-in-delay-${(i % 4) + 1}`}
              >
                <div className="category-icon"><CategoryIcon slug={cat.slug} size={48} variant="card" /></div>
                <h3>{cat.name}</h3>
                <div className="count">
                  {(cat._count?.products || 0) > 0
                    ? `${formatCount(cat._count.products)} parts`
                    : 'Browse →'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section className="section" id="features-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Why Choose FPGACenter</h2>
              <p className="section-subtitle">Your reliable partner for electronic component sourcing</p>
            </div>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat, i) => (
              <div key={i} className={`feature-card animate-fade-in animate-fade-in-delay-${i + 1}`}>
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturers */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }} id="brands-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Authorized & Sourced Brands</h2>
              <p className="section-subtitle">Components from {formatCount(totalManufacturers)} trusted manufacturers</p>
            </div>
            <Link href="/manufacturers" className="view-all">All Manufacturers →</Link>
          </div>

          <div className="brands-marquee-wrapper">
            <div className="brands-scroll">
              {/* First set */}
              {brands.map((brand) => (
                <Link key={`a-${brand.name}`} href={`/manufacturer/${brand.slug}`} className="brand-item">
                  {brand.name}
                </Link>
              ))}
              {/* Duplicate set for seamless loop */}
              {brands.map((brand) => (
                <Link key={`b-${brand.name}`} href={`/manufacturer/${brand.slug}`} className="brand-item" aria-hidden="true" rel="nofollow" tabIndex={-1}>
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" id="cta-section">
        <div className="container">
          <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
              Can&apos;t Find Your Part?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Submit an RFQ and our procurement team will source it for you within 24 hours.
              We specialize in hard-to-find and obsolete components.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq" className="btn btn-primary btn-lg">Submit RFQ →</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
