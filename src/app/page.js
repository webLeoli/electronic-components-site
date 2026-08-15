import Link from 'next/link';
import { formatCount } from '@/lib/text';
import prisma from '@/lib/db';
import { productPath, SITE_NAME, SITE_URL, SITE_DESC, SITE_TAGLINE, hasConfirmedStock, getAvailabilityText } from '@/lib/seo';
import CategoryIcon from '@/components/CategoryIcon';
import { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_CATEGORIES, FALLBACK_PARTS, FALLBACK_BRANDS } from '@/lib/fallbacks';
import { DISTRIBUTOR_BRANDS } from '@/lib/manufacturer-canonical';
import { buildProgrammableLogicWhere, getFpgaSeries } from '@/lib/fpga-growth';
import { getSubsystems } from '@/lib/robotics-growth';
import { getStatusInfo } from '@/lib/product-status';
import { unstable_cache } from 'next/cache';

// ISR: the homepage re-renders at most every 5 minutes; data-layer caches below
// keep the expensive queries warm between regenerations.
export const revalidate = 300;

export const metadata = {
  title: `${SITE_NAME} - Legacy FPGA & CPLD Sourcing`,
  description: SITE_DESC,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} - Legacy FPGA & CPLD Sourcing`,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} - Obsolete & FPGA Component Sourcing` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Legacy FPGA & CPLD Sourcing`,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.png`],
  },
};


const FEATURES = [
  { icon: 'QA', title: 'Verified Supply', desc: 'Inspection, traceability review, and source checks before order confirmation.' },
  { icon: '24', title: '24h RFQ Response', desc: 'Send a part number or BOM and receive availability, lead time, and quote options.' },
  { icon: 'MOQ', title: 'Flexible Quantity', desc: 'Support for prototypes, repairs, spot buys, and production replenishment.' },
  { icon: 'ALT', title: 'Alternate Sourcing', desc: 'Lifecycle-aware suggestions for obsolete, EOL, and constrained components.' },
];

const DAILY_ROTATION_SIZE = 8;
const PRODUCT_SELECT = {
  id: true,
  partNumber: true,
  manufacturer: true,
  stock: true,
  minPrice: true,
  status: true,
  packageType: true,
  leadTime: true,
  category: { select: { name: true } },
};

const FPGA_SERIES_SHORTCUTS = getFpgaSeries().slice(0, 8);
const ROBOTICS_SUBSYSTEM_SHORTCUTS = getSubsystems();

function getDailyRotationKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const getDailyRotatingProducts = unstable_cache(
  async (rotationKey) => {
    // Indexed boolean instead of the 30-branch ILIKE OR predicate: the flag is
    // precomputed by scripts/flag-programmable-logic.mjs. The final fallback
    // below still uses the live predicate in case the flag was never backfilled.
    const where = {
      isProgrammableLogic: true,
      stock: { gt: 0 },
      duplicateOfId: null,
      status: { notIn: ['obsolete', 'eol', 'nrnd'] },
      manufacturer: { notIn: Array.from(DISTRIBUTOR_BRANDS) },
    };
    const idRange = await prisma.product.aggregate({
      where,
      _min: { id: true },
      _max: { id: true },
    });

    const minId = idRange._min.id;
    const maxId = idRange._max.id;
    if (!minId || !maxId) return [];

    const rand = seededRandom(hashSeed(`homepage-products:${rotationKey}`));
    const products = [];
    const seen = new Set();
    const maxAttempts = DAILY_ROTATION_SIZE * 8;

    for (let attempt = 0; products.length < DAILY_ROTATION_SIZE && attempt < maxAttempts; attempt++) {
      const candidateId = minId + Math.floor(rand() * (maxId - minId + 1));
      const notIn = Array.from(seen);
      const product = await prisma.product.findFirst({
        where: {
          ...where,
          id: { gte: candidateId },
          ...(notIn.length ? { partNumber: { notIn } } : {}),
        },
        select: PRODUCT_SELECT,
        orderBy: { id: 'asc' },
      }) || await prisma.product.findFirst({
        where: {
          ...where,
          id: { lte: candidateId },
          ...(notIn.length ? { partNumber: { notIn } } : {}),
        },
        select: PRODUCT_SELECT,
        orderBy: { id: 'desc' },
      });

      if (product && !seen.has(product.partNumber)) {
        seen.add(product.partNumber);
        products.push(product);
      }
    }

    if (products.length < DAILY_ROTATION_SIZE) {
      const fallback = await prisma.product.findMany({
        where: {
          ...where,
          ...(seen.size ? { partNumber: { notIn: Array.from(seen) } } : {}),
        },
        select: PRODUCT_SELECT,
        orderBy: { stock: 'desc' },
        take: DAILY_ROTATION_SIZE - products.length,
      });
      products.push(...fallback);
    }

    if (products.length === 0) {
      return prisma.product.findMany({
        where: {
          ...buildProgrammableLogicWhere(),
          duplicateOfId: null,
          stock: { gt: 0 },
          status: { notIn: ['obsolete', 'eol', 'nrnd'] },
          manufacturer: { notIn: Array.from(DISTRIBUTOR_BRANDS) },
        },
        select: PRODUCT_SELECT,
        orderBy: [{ stock: 'desc' }, { qualityScore: 'desc' }, { partNumber: 'asc' }],
        take: DAILY_ROTATION_SIZE,
      });
    }

    return products;
  },
  ['homepage-daily-rotating-products'],
  { revalidate: 86400, tags: ['homepage', 'homepage-products'] }
);

// Fetch dynamic data from database (cached for 5 minutes)
const getHomeData = unstable_cache(
  async () => {
    try {
      const rotationKey = getDailyRotationKey();
      const [allCategories, popularProducts, manufacturers, stats] = await Promise.all([
        // All categories with direct product counts (for recursive summing)
        prisma.category.findMany({
          select: {
            id: true, name: true, slug: true, icon: true,
            parentId: true, sortOrder: true,
            _count: { select: { products: true } },
          },
        }),
        // Daily rotating products: deterministic random sample per UTC day.
        getDailyRotatingProducts(rotationKey),
        // Homepage equity goes to brands that actually have products, ranked
        // by catalogue depth — alphabetical take(24) started at 4D Systems /
        // ABLIC and skipped Xilinx.
        prisma.$queryRawUnsafe(`
          SELECT m.name, m.slug
          FROM "Manufacturer" m
          INNER JOIN (
            SELECT "manufacturer", COUNT(*)::int AS cnt
            FROM "Product"
            WHERE "duplicateOfId" IS NULL
            GROUP BY "manufacturer"
          ) p ON p."manufacturer" = m.name
          WHERE p.cnt > 0
          ORDER BY p.cnt DESC
          LIMIT 24
        `),
        Promise.all([
          prisma.product.count({ where: { duplicateOfId: null } }),
          prisma.$queryRawUnsafe(`
            SELECT COUNT(*)::int AS cnt
            FROM "Manufacturer" m
            INNER JOIN (
              SELECT DISTINCT "manufacturer" FROM "Product" WHERE "duplicateOfId" IS NULL
            ) p ON p."manufacturer" = m.name
          `),
        ]),
      ]);

      // Build recursive product count for L1 categories
      // L1 sums L2 children and their L3 direct product counts.
      const byParent = new Map();
      for (const cat of allCategories) {
        const pid = cat.parentId || '__root__';
        if (!byParent.has(pid)) byParent.set(pid, []);
        byParent.get(pid).push(cat);
      }

      const catById = new Map(allCategories.map(c => [c.id, c]));
      function sumProducts(catId) {
        const cat = catById.get(catId);
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
        totalManufacturers: stats[1]?.[0]?.cnt || 500,
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

      <section className="hero b2b-hero" id="hero-section">
        <div className="container">
          <div className="hero-content b2b-hero-grid">
            <div className="b2b-hero-copy">
              <div className="eyebrow">FPGA/CPLD sourcing specialist</div>
            <h1 className="animate-fade-in">
              Source <span className="highlight">legacy FPGA & CPLD parts</span> with verified RFQ support
            </h1>
            <p className="animate-fade-in animate-fade-in-delay-1">
              Search {formatCount(totalProducts)} part numbers with deep programmable logic coverage across Xilinx, Altera, Intel, Lattice, Actel, and Microchip. Verify stock, date code, package, lead time, MOQ, and alternates before purchase.
            </p>

            <form className="hero-search animate-fade-in animate-fade-in-delay-2" action="/search" method="GET" role="search" id="hero-search-form">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="search" name="q" className="input" placeholder="Enter FPGA part number, e.g. XC6SLX9 or EP4CE22..." id="hero-search-input" />
              <button type="submit" className="search-btn" id="hero-search-btn">Search FPGA Parts</button>
            </form>
            <div className="hero-actions">
              <Link href="/rfq?category=FPGA%20and%20CPLD" className="btn btn-primary btn-lg">Request FPGA Quote</Link>
              <Link href="/bom" className="btn btn-secondary btn-lg">Upload BOM</Link>
            </div>
            </div>

            <div className="hero-stats animate-fade-in animate-fade-in-delay-3">
              <div className="hero-stat">
                <div className="hero-stat-value">{formatCount(totalProducts)}</div>
                <div className="hero-stat-label">Searchable part numbers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{formatCount(totalManufacturers)}</div>
                <div className="hero-stat-label">Manufacturers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">24h</div>
                <div className="hero-stat-label">Target RFQ reply</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">FPGA</div>
                <div className="hero-stat-label">CPLD and logic focus</div>
              </div>
              <div className="hero-rfq-panel">
                <h2>FPGA quote workflow</h2>
                <ol>
                  <li><span>1</span>Search exact ordering code or upload a BOM</li>
                  <li><span>2</span>Confirm package, speed grade, quantity, and date-code needs</li>
                  <li><span>3</span>Receive stock, lead time, MOQ, alternates, and quote options</li>
                </ol>
                <Link href="/rfq?category=FPGA%20and%20CPLD" className="btn btn-primary">Start FPGA RFQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-service-nav" aria-label="Sourcing shortcuts">
        <div className="container">
          <div className="home-service-nav-grid">
            <Link href="/fpga-sourcing" className="home-service-nav-item">
              <span>FPGA</span>
              <strong>Legacy FPGA/CPLD sourcing</strong>
            </Link>
            <Link href="/robotics-sourcing" className="home-service-nav-item">
              <span>Robotics</span>
              <strong>Chinese alternatives for robot BOMs</strong>
            </Link>
            <Link href="/manufacturers" className="home-service-nav-item">
              <span>Brands</span>
              <strong>Xilinx, Altera, Lattice lines</strong>
            </Link>
            <Link href="/rfq" className="home-service-nav-item primary">
              <span>RFQ</span>
              <strong>Get targeted quotations</strong>
            </Link>
            <Link href="/blog" className="home-service-nav-item">
              <span>Insights</span>
              <strong>Lifecycle and sourcing guides</strong>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Parts Table */}
      <section className="section" id="popular-parts-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured FPGA and CPLD parts</h2>
              <p className="section-subtitle">Programmable logic quote targets with stock, package, and lifecycle signals</p>
            </div>
            <Link href="/fpga-sourcing" className="view-all">View FPGA Sourcing</Link>
          </div>

          <div className="table-wrapper">
            <table className="table" id="popular-parts-table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Manufacturer</th>
                  <th>Category</th>
                  <th>Package</th>
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
                        <Link href={productPath(part.partNumber, part.manufacturer)}>{part.partNumber}</Link>
                      </div>
                    </td>
                    <td>{part.manufacturer}</td>
                    <td>{part.category?.name || '-'}</td>
                    <td>{part.packageType || 'Check'}</td>
                    <td>
                      <span className={hasConfirmedStock(part) ? 'text-success' : 'text-muted'}>
                        {getAvailabilityText(part)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                    {part.minPrice > 0 ? `$${part.minPrice.toFixed(part.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusInfo(part.status).badgeClass}`}>
                        {getStatusInfo(part.status).short}
                      </span>
                    </td>
                    <td>
                      <Link href={`/rfq?part=${encodeURIComponent(part.partNumber)}`} className="btn btn-outline btn-sm">
                        Quote
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FPGA/CPLD Series */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }} id="fpga-series-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">High-intent FPGA and CPLD families</h2>
              <p className="section-subtitle">Built for the searches procurement teams use when an exact programmable logic part is constrained.</p>
            </div>
            <Link href="/fpga-sourcing" className="view-all">All FPGA Series</Link>
          </div>

          <div className="series-grid compact">
            {FPGA_SERIES_SHORTCUTS.map(series => (
              <Link href={`/fpga-sourcing/${series.slug}`} key={series.slug} className="series-card">
                <span className="series-family">{series.family}</span>
                <h3>{series.shortTitle}</h3>
                <p>{series.searchIntent}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Robotics alternatives */}
      <section className="section" id="robotics-sourcing-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Robotics Chinese alternative sourcing</h2>
              <p className="section-subtitle">Cross-reference Western robot BOM parts to vetted Chinese functional alternatives for new and cost-down designs.</p>
            </div>
            <Link href="/robotics-sourcing" className="view-all">Robotics Sourcing</Link>
          </div>

          <div className="series-grid compact">
            {ROBOTICS_SUBSYSTEM_SHORTCUTS.map(subsystem => (
              <Link
                href={subsystem.live ? `/robotics-sourcing/${subsystem.slug}` : `/rfq?category=${encodeURIComponent(subsystem.shortTitle + ' Alternatives')}`}
                key={subsystem.slug}
                className="series-card"
              >
                <span className="series-family">{subsystem.family}</span>
                <h3>{subsystem.shortTitle}</h3>
                <p>{subsystem.role}</p>
                <div className="series-card-stats">
                  <span>{subsystem.chineseBrands.join(' / ')}</span>
                  <span>{subsystem.live ? 'Guide live' : 'RFQ on request'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }} id="categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse supporting component categories</h2>
              <p className="section-subtitle">Use category pages for BOM completion after the FPGA/CPLD sourcing path.</p>
            </div>
            <Link href="/category" className="view-all">All Categories</Link>
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
                    : 'Browse'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section className="section quality-showcase" id="features-section">
        <div className="container">
          <div className="section-header quality-showcase-header">
            <div>
              <span className="eyebrow">Know our service</span>
              <h2 className="section-title">Quality controls for high-value programmable logic</h2>
              <p className="section-subtitle">Quote decisions supported by inspection, traceability review, and lifecycle-aware sourcing.</p>
            </div>
            <Link href="/quality" className="btn btn-secondary">Quality Assurance</Link>
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
              <h2 className="section-title">Manufacturer coverage</h2>
              <p className="section-subtitle">Xilinx, Altera, Intel, Lattice, Microchip, Actel, and broader BOM support across {formatCount(totalManufacturers)} manufacturers</p>
            </div>
            <Link href="/manufacturers" className="view-all">All Manufacturers</Link>
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
              Ready to verify an FPGA or CPLD part?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Send the exact ordering code, target quantity, package preference, date-code requirement, or a full BOM. Our team will confirm stock, lead time, MOQ, pricing, and alternates.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq?category=FPGA%20and%20CPLD" className="btn btn-primary btn-lg">Submit FPGA RFQ</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
