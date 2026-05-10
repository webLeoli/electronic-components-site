import { cache } from 'react';
import prisma from '@/lib/db';
import { generateProductMeta, generateProductJsonLd, generateBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToRfqButton from '@/components/AddToRfqButton';
import ProductImage, { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_PARTS } from '@/lib/fallbacks';

// --- Rich Description Generator ---
// Builds multi-paragraph description from product data instead of generic one-liner
function generateRichDescription(product, specs) {
  const parts = [];
  const mfr = product.manufacturer || 'a leading manufacturer';
  const cat = product.category?.name || 'Electronic Component';
  const parentCat = product.category?.parent?.name;

  // Para 1: Product identity
  let intro = `The ${product.partNumber} is a ${cat.toLowerCase()}`;
  if (parentCat) intro += ` in the ${parentCat} family`;
  intro += ` manufactured by ${mfr}.`;
  if (product.status === 'active') {
    intro += ' This component is currently in active production.';
  } else if (product.status === 'obsolete') {
    intro += ` Although this part has been marked as obsolete by ${mfr}, ${SITE_NAME} maintains verified stock of genuine ${product.partNumber} units sourced through our certified supply chain.`;
  } else if (product.status === 'eol') {
    intro += ` This component has reached End of Life status. ${SITE_NAME} specializes in sourcing EOL parts with full traceability and quality assurance.`;
  }
  parts.push(intro);

  // Para 2: Key specs summary (dynamically from specs JSON)
  const specEntries = Object.entries(specs);
  if (specEntries.length > 0) {
    const highlights = specEntries.slice(0, 5).map(([k, v]) =>
      `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`
    ).join(', ');
    parts.push(`Key specifications include ${highlights}.`);
  }

  // Para 3: Package & mount info
  if (product.packageType || product.mountType) {
    let pkgInfo = 'This device';
    if (product.packageType) pkgInfo += ` comes in a ${product.packageType} package`;
    if (product.mountType) pkgInfo += ` with ${product.mountType.toLowerCase()} mounting`;
    pkgInfo += '.';
    parts.push(pkgInfo);
  }

  // Para 4: Availability
  if (product.stock > 0) {
    parts.push(`${SITE_NAME} currently has ${product.stock.toLocaleString()} units of ${product.partNumber} in stock, available for immediate shipment with no minimum order quantity.`);
  } else {
    parts.push(`Contact ${SITE_NAME} for availability and lead time on ${product.partNumber}. We can source this part through our global network of authorized distributors.`);
  }

  return parts;
}

// --- Application Area Mapping ---
// Maps category names to relevant application domains (like FPGAKey's "Application Field")
const APPLICATION_AREA_MAP = {
  'FPGA': ['5G & Telecommunications', 'Artificial Intelligence', 'Data Center & Cloud', 'Aerospace & Defense', 'Industrial Automation'],
  'Embedded': ['IoT & Smart Devices', 'Industrial Control', 'Automotive Electronics', 'Consumer Electronics', 'Medical Devices'],
  'Microcontroller': ['IoT & Smart Devices', 'Consumer Electronics', 'Industrial Automation', 'Automotive Electronics', 'Wearable Technology'],
  'Memory': ['Data Center & Cloud', 'Consumer Electronics', 'Automotive Electronics', 'Networking Equipment', 'Industrial Computing'],
  'Power': ['Automotive Electronics', 'Industrial Automation', 'Telecommunications', 'Consumer Electronics', 'Renewable Energy'],
  'Analog': ['Instrumentation', 'Medical Devices', 'Audio & Video', 'Automotive Electronics', 'Industrial Control'],
  'Logic': ['Consumer Electronics', 'Industrial Control', 'Telecommunications', 'Computing', 'Automotive Electronics'],
  'Interface': ['Networking Equipment', 'Industrial Automation', 'Telecommunications', 'Data Center & Cloud', 'Consumer Electronics'],
  'Sensor': ['IoT & Smart Devices', 'Automotive Electronics', 'Medical Devices', 'Industrial Automation', 'Consumer Electronics'],
  'Wireless': ['IoT & Smart Devices', '5G & Telecommunications', 'Consumer Electronics', 'Automotive Electronics', 'Smart Home'],
};

function getApplicationAreas(categoryName, parentCategoryName) {
  const name = (parentCategoryName || categoryName || '').toLowerCase();
  for (const [key, areas] of Object.entries(APPLICATION_AREA_MAP)) {
    if (name.includes(key.toLowerCase())) return areas;
  }
  // Default applications for any electronic component
  return ['Industrial Automation', 'Consumer Electronics', 'Telecommunications', 'Automotive Electronics', 'IoT & Smart Devices'];
}

// --- Product FAQ Generator ---
// Creates genuinely unique FAQ from real product data (not templated spam)
function generateProductFAQ(product, specs) {
  const faqs = [];
  const mfr = product.manufacturer || 'the manufacturer';

  // Q1: Availability (always unique per product due to stock count)
  if (product.stock > 0) {
    faqs.push({
      q: `Is the ${product.partNumber} in stock and ready to ship?`,
      a: `Yes, ${SITE_NAME} currently has ${product.stock.toLocaleString()} units of ${product.partNumber} in stock. Orders placed before 3 PM (CST) are eligible for same-day dispatch. No minimum order quantity required.`,
    });
  } else {
    faqs.push({
      q: `Can I still purchase the ${product.partNumber}?`,
      a: `While ${product.partNumber} is currently showing limited availability, ${SITE_NAME} can source this part through our global network of certified suppliers. Submit an RFQ for lead time and pricing.`,
    });
  }

  // Q2: Package info (only if data exists)
  if (product.packageType) {
    faqs.push({
      q: `What package type is the ${product.partNumber} available in?`,
      a: `The ${product.partNumber} by ${mfr} is available in a ${product.packageType} package${product.mountType ? ` with ${product.mountType.toLowerCase()} mounting configuration` : ''}. All parts are original and shipped in manufacturer-standard packaging.`,
    });
  }

  // Q3: Lifecycle-specific (unique by status)
  if (product.status === 'obsolete' || product.status === 'eol') {
    const statusLabel = product.status === 'obsolete' ? 'obsolete' : 'end-of-life';
    faqs.push({
      q: `The ${product.partNumber} is marked as ${statusLabel}. Are the parts genuine?`,
      a: `Absolutely. All ${product.partNumber} units sourced by ${SITE_NAME} are 100% original ${mfr} components. We follow IDEA-STD-1010 inspection standards and provide full traceability documentation. ${statusLabel === 'obsolete' ? 'We specialize in obsolete part sourcing and maintain verified stock of discontinued components.' : ''}`,
    });
  }

  // Q4: Price tiers (only if price exists)
  if (product.minPrice > 0) {
    faqs.push({
      q: `What is the pricing for ${product.partNumber}?`,
      a: `Unit pricing for ${product.partNumber} starts at $${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)} with volume discounts available for quantities of 10+, 100+, 500+, and 1,000+ units. Submit an RFQ for a customized quote based on your specific quantity requirements.`,
    });
  }

  return faqs;
}

// React cache() deduplicates this query within a single request
// so generateMetadata and ProductPage share the same DB result
const getProduct = cache(async (partNumber) => {
  const product = await prisma.product.findUnique({
    where: { partNumber },
    include: { category: { include: { parent: true } } },
  });
  if (product) return product;
  const fallback = FALLBACK_PARTS.find(p => p.partNumber === partNumber);
  return fallback ? {
    ...fallback,
    id: 0,
    description: `${fallback.partNumber} by ${fallback.manufacturer}. High quality electronic component in stock.`,
    packageType: 'Tape & Reel (TR)',
    mountType: 'Surface Mount',
    moq: 1,
    leadTime: 'In Stock',
    specs: '{}',
    imageUrl: null,
  } : null;
});

// ISR: revalidate every 1 hour
export const revalidate = 3600;

// Skip build-time prerendering — with 720K products, ISR handles everything.
// Pages are generated on first request and cached for `revalidate` seconds.
export async function generateStaticParams() {
  return [];
}

// Dynamic metadata for SEO — uses cached getProduct()
export async function generateMetadata({ params }) {
  try {
    const { partNumber } = await params;
    const product = await getProduct(decodeURIComponent(partNumber));
    if (!product) return { title: 'Product Not Found' };
    const meta = generateProductMeta(product);

    // Quality gate: use pre-computed indexable flag from the quality scoring system.
    // Scores are computed by scripts/compute-quality-scores.mjs and stored in DB.
    if (!product.indexable) {
      meta.robots = { index: false, follow: true };
    }

    return meta;
  } catch {
    return { title: 'Product Not Found' };
  }
}

// Helper: parse specs JSON safely
function parseSpecs(specsStr) {
  try {
    return specsStr ? JSON.parse(specsStr) : {};
  } catch {
    return {};
  }
}

// Helper: status display
function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', className: 'badge-success' },
    obsolete: { label: 'Obsolete', className: 'badge-danger' },
    eol: { label: 'End of Life', className: 'badge-warning' },
    nrnd: { label: 'Not Recommended', className: 'badge-info' },
  };
  const s = map[status] || map.active;
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

// Price tier simulation
function getPriceTiers(basePrice) {
  if (!basePrice || basePrice <= 0) return [];
  return [
    { qty: '1+', price: basePrice },
    { qty: '10+', price: +(basePrice * 0.92).toFixed(4) },
    { qty: '100+', price: +(basePrice * 0.82).toFixed(4) },
    { qty: '500+', price: +(basePrice * 0.72).toFixed(4) },
    { qty: '1000+', price: +(basePrice * 0.65).toFixed(4) },
    { qty: '5000+', price: +(basePrice * 0.58).toFixed(4) },
  ];
}

export default async function ProductPage({ params }) {
  const { partNumber } = await params;
  const product = await getProduct(decodeURIComponent(partNumber));

  if (!product) {
    notFound();
  }

  const specs = parseSpecs(product.specs);
  const priceTiers = getPriceTiers(product.minPrice);

  // Run all secondary queries in parallel to avoid serial timeout
  const [manufacturerRecord, relatedProducts, sameManufacturerProducts] = await Promise.all([
    // Lookup manufacturer slug from DB
    product.manufacturer
      ? prisma.manufacturer.findFirst({
          where: { name: product.manufacturer },
          select: { slug: true },
        })
      : null,
    // Fetch related products (same category)
    product.categoryId
      ? prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            partNumber: { not: product.partNumber },
          },
          take: 6,
          orderBy: { stock: 'desc' },
        })
      : [],
    // Fetch more products from same manufacturer (for internal linking)
    product.manufacturer
      ? prisma.product.findMany({
          where: {
            manufacturer: product.manufacturer,
            partNumber: { not: product.partNumber },
          },
          select: { partNumber: true, description: true, minPrice: true, stock: true },
          take: 6,
          orderBy: { stock: 'desc' },
        })
      : [],
  ]);
  const manufacturerSlug = manufacturerRecord?.slug || (product.manufacturer || 'unknown').toLowerCase().replace(/[\s\/]+/g, '-');

  // Build breadcrumb items
  const breadcrumbItems = [{ name: 'Home', url: '/' }];
  if (product.category?.parent) {
    breadcrumbItems.push({
      name: product.category.parent.name,
      url: `/category/${product.category.parent.slug}`,
    });
  }
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `/category/${product.category.slug}`,
    });
  }
  breadcrumbItems.push({ name: product.partNumber });

  const productJsonLd = generateProductJsonLd(product);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // Generate data-driven content (unique per product — not templated)
  const richDescParagraphs = generateRichDescription(product, specs);
  const applicationAreas = getApplicationAreas(product.category?.name, product.category?.parent?.name);
  const faqs = generateProductFAQ(product, specs);

  // FAQ JSON-LD — each FAQ is dynamically generated from real product data
  // (stock count, price, package, lifecycle status), making every page unique.
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  // TOC sections for page navigation
  const tocSections = [
    { id: 'product-overview', label: 'Overview', show: true },
    { id: 'product-pricing', label: 'Pricing', show: priceTiers.length > 0 },
    { id: 'product-specs', label: 'Specifications', show: Object.keys(specs).length > 0 },
    { id: 'product-applications', label: 'Applications', show: true },
    { id: 'product-faq', label: 'FAQ', show: faqs.length > 0 },
    { id: 'product-related', label: 'Related Products', show: relatedProducts.length > 0 },
  ].filter(s => s.show);

  return (
    <>
      {/* JSON-LD: Product + Breadcrumb + FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb" id="product-breadcrumb">
          {breadcrumbItems.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {i > 0 && <span className="separator">›</span>}
              {item.url ? (
                <Link href={item.url}>{item.name}</Link>
              ) : (
                <span style={{ color: 'var(--color-text-primary)' }}>{item.name}</span>
              )}
            </span>
          ))}
        </nav>

        {/* TOC — Page Navigation (like FPGAKey's Product Catalogue) */}
        <nav className="product-toc" id="product-toc" aria-label="Page sections">
          {tocSections.map((sec, i) => (
            <a key={sec.id} href={`#${sec.id}`} className="product-toc-item">
              <span className="product-toc-num">{i + 1}</span>
              {sec.label}
            </a>
          ))}
        </nav>

        {/* Product Header */}
        <div className="product-page-layout" id="product-overview">
          <div className="product-main">
            {/* Part Number & Basic Info */}
            <div className="product-header-section">
              <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
                {/* Product Image */}
                <ProductImage product={product} size={160} priority style={{ flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    <h1 className="product-part-number">{product.partNumber}</h1>
                    <StatusBadge status={product.status} />
                  </div>

              {product.manufacturer && (
                <div className="product-manufacturer">
                  {manufacturerRecord ? (
                    <Link href={`/manufacturer/${manufacturerSlug}`}>
                      {product.manufacturer}
                    </Link>
                  ) : (
                    <span>{product.manufacturer}</span>
                  )}
                </div>
              )}

              {/* Description moved to dedicated section below specs — no duplication */}
                </div>
              </div>

              {/* Stock & Availability */}
              <div className="product-availability">
                <div className="product-status">
                  <span className={`status-dot ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`} />
                  <span style={{ fontWeight: 600, color: product.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {product.stock > 0 ? `${product.stock.toLocaleString()} In Stock` : 'Out of Stock'}
                  </span>
                </div>
                {product.leadTime && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    Lead Time: {product.leadTime}
                  </span>
                )}
                {product.moq > 1 && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    MOQ: {product.moq}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="product-quick-info">
              <div className="quick-info-item">
                <span className="quick-info-label">Package</span>
                <span className="quick-info-value">{product.packageType || 'N/A'}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Mount</span>
                <span className="quick-info-value">{product.mountType || 'N/A'}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Lifecycle</span>
                <span className="quick-info-value" style={{ textTransform: 'capitalize' }}>{product.status}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Manufacturer</span>
                <span className="quick-info-value">{product.manufacturer}</span>
              </div>
            </div>

            {/* Price Tiers */}
            {priceTiers.length > 0 && (
              <div className="product-section" id="product-pricing">
                <h2 className="product-section-title">Pricing</h2>
                <div className="price-tiers">
                  {priceTiers.map((tier, i) => (
                    <div key={i} className="price-tier">
                      <div className="qty">{tier.qty}</div>
                      <div className="price">${tier.price.toFixed(tier.price < 1 ? 4 : 2)}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)', lineHeight: 1.5 }}>
                  * Estimated pricing for reference only. Final price depends on quantity, availability, and market conditions.
                  Submit an RFQ for an exact quote.
                </p>
              </div>
            )}

            {/* Technical Specifications */}
            {Object.keys(specs).length > 0 && (
              <div className="product-section" id="product-specs">
                <h2 className="product-section-title">Technical Specifications</h2>
                <div className="table-wrapper">
                  <table className="table specs-table" id="specs-table">
                    <tbody>
                      {Object.entries(specs).map(([key, value]) => (
                        <tr key={key}>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)', width: '200px', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </td>
                          <td>{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Datasheet */}
            {product.datasheet && (
              <div className="product-section">
                <h2 className="product-section-title">Documentation</h2>
                <a href={product.datasheet} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Download Datasheet (PDF)
                </a>
              </div>
            )}

            {/* Rich Product Description — multi-paragraph, data-driven */}
            <div className="product-section" id="product-description">
              <h2 className="product-section-title">Product Overview</h2>
              <div className="product-rich-desc">
                {richDescParagraphs.map((para, i) => (
                  <p key={i} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Application Areas — SEO internal linking + long-tail keywords */}
            <div className="product-section" id="product-applications">
              <h2 className="product-section-title">Application Areas</h2>
              <div className="product-app-areas">
                {applicationAreas.map(area => (
                  <span key={area} className="product-app-tag">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* FAQ — data-driven, unique per product */}
            {faqs.length > 0 && (
              <div className="product-section" id="product-faq">
                <h2 className="product-section-title">Frequently Asked Questions</h2>
                <div className="product-faq-list">
                  {faqs.map((faq, i) => (
                    <details key={i} className="product-faq-item" open={i === 0}>
                      <summary className="product-faq-q">{faq.q}</summary>
                      <p className="product-faq-a">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Actions */}
          <aside className="product-sidebar">
            <div className="card sidebar-action-card">
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                {product.minPrice > 0 ? (
                  <>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Unit Price From</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-accent)' }}>
                      ${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Contact for Pricing</div>
                )}
              </div>

              {/* Quantity Input */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Quantity
                </label>
                <input type="number" className="input" defaultValue={product.moq} min={product.moq} id="qty-input" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <Link href={`/rfq?part=${encodeURIComponent(product.partNumber)}`} className="btn btn-primary btn-lg" style={{ width: '100%' }} id="rfq-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Request Quote
                </Link>
                <AddToRfqButton
                  partNumber={product.partNumber}
                  manufacturer={product.manufacturer}
                />
              </div>

              <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <div className="sidebar-info-row">
                  <span>✓</span><span>100% Original & Genuine</span>
                </div>
                <div className="sidebar-info-row">
                  <span>▣</span><span>No Minimum Order Quantity</span>
                </div>
                <div className="sidebar-info-row">
                  <span>➤</span><span>Same-Day Dispatch Available</span>
                </div>
                <div className="sidebar-info-row">
                  <span>◈</span><span>Quality Inspection & Testing</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="product-section" id="product-related" style={{ marginTop: 'var(--space-2xl)' }}>
            <div className="section-header">
              <h2 className="section-title">Related Products</h2>
              {product.category && (
                <Link href={`/category/${product.category.slug}`} className="view-all">
                  View All {product.category.name} →
                </Link>
              )}
            </div>
            <div className="table-wrapper">
              <table className="table" id="related-products-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Manufacturer</th>
                    <th>Description</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {relatedProducts.map((rp) => (
                    <tr key={rp.partNumber}>
                      <td className="part-number">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProductIcon product={rp} size={28} />
                          <Link href={`/product/${encodeURIComponent(rp.partNumber)}`}>{rp.partNumber}</Link>
                        </div>
                      </td>
                      <td>{rp.manufacturer}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rp.description}
                      </td>
                      <td>
                        <span className={rp.stock > 0 ? 'text-success' : 'text-danger'}>
                          {rp.stock > 0 ? rp.stock.toLocaleString() : 'Contact'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rp.minPrice ? `$${rp.minPrice.toFixed(rp.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                      </td>
                      <td><StatusBadge status={rp.status} /></td>
                      <td>
                        <AddToRfqButton
                          partNumber={rp.partNumber}
                          manufacturer={rp.manufacturer}
                          variant="small"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* More from same manufacturer — internal linking */}
        {sameManufacturerProducts.length > 0 && product.manufacturer && (
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
              <h2 className="product-section-title">More from {product.manufacturer}</h2>
              {manufacturerRecord && (
                <Link href={`/manufacturer/${manufacturerSlug}`} className="view-all" style={{ fontSize: '13px' }}>
                  View All {product.manufacturer} →
                </Link>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-md)',
            }}>
              {sameManufacturerProducts.map(sp => (
                <Link
                  key={sp.partNumber}
                  href={`/product/${encodeURIComponent(sp.partNumber)}`}
                  className="card"
                  style={{ padding: 'var(--space-md)', textDecoration: 'none', transition: 'border-color 0.2s' }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                    {sp.partNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sp.description || 'Electronic Component'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: '12px' }}>
                    <span className={sp.stock > 0 ? 'text-success' : 'text-danger'}>
                      {sp.stock > 0 ? `${sp.stock.toLocaleString()} pcs` : 'RFQ'}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {sp.minPrice ? `$${sp.minPrice.toFixed(sp.minPrice < 1 ? 4 : 2)}` : 'Quote'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
