import { cache } from 'react';
import prisma from '@/lib/db';
import {
  generateProductMeta,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  productPath,
  SITE_NAME,
  SITE_URL,
  hasConfirmedStock,
  getAvailabilityText,
  getAvailabilityTone,
} from '@/lib/seo';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AddToRfqButton from '@/components/AddToRfqButton';
import ProductQuantityActions from '@/components/ProductQuantityActions';
import ProductImage, { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_PARTS } from '@/lib/fallbacks';
import { getStatusInfo } from '@/lib/product-status';
import { getProductMemoryCached } from '@/lib/product-memory-cache';
import { isDistributorBrand, manufacturerSlug as slugifyManufacturer } from '@/lib/manufacturer-canonical';
import { formatInt } from '@/lib/text';

/**
 * Spec entries that actually carry a value.
 *
 * Supplier feeds ship a fixed key set and fill the unknown ones with "-", so a
 * raw Object.entries() gives rows like "Operating Temperature: -". Both the
 * generated prose and the rendered spec table have to skip those: a table of
 * dashes makes a page look specified when it is not, which is the same signal
 * lib/quality-score.js stopped paying for. Shared so the two can never disagree
 * about what counts as a real value.
 */
function meaningfulSpecEntries(specs) {
  return Object.entries(specs || {}).filter(([, v]) => {
    const val = String(v ?? '').trim();
    return val && val !== '-' && val !== '—' && val !== 'N/A' && val !== 'n/a' && val !== 'TBD';
  });
}

// --- Rich Description Generator ---
// Builds multi-paragraph description from product data instead of generic one-liner
function generateRichDescription(product, specs) {
  const parts = [];
  const mfr = product.manufacturer || 'a leading manufacturer';
  const cat = product.category?.name || 'Electronic Component';
  const parentCat = product.category?.parent?.name;
  // Rochester Electronics & co. resell other makers' silicon, so "manufactured
  // by" and "marked obsolete by" are both false for their rows — and the OEM's
  // own page for the same part says the opposite. See lib/manufacturer-canonical.
  const isReseller = isDistributorBrand(product.manufacturer);

  // Para 1: Product identity
  let intro = `The ${product.partNumber} is listed under ${cat}`;
  if (parentCat) intro += ` in the ${parentCat} family`;
  intro += isReseller ? ` supplied by ${mfr}.` : ` manufactured by ${mfr}.`;
  if (product.status === 'active') {
    intro += ' This component is currently in active production.';
  } else if (product.status === 'obsolete') {
    intro += isReseller
      ? ` This part is obsolete at the original manufacturer; ${SITE_NAME} can quote verified sourcing options through qualified specialty channels.`
      : ` This part has been marked as obsolete by ${mfr}; ${SITE_NAME} can quote verified sourcing options through qualified specialty channels.`;
  } else if (product.status === 'eol') {
    intro += ` This component has reached End of Life status. ${SITE_NAME} specializes in sourcing EOL parts with full traceability and quality assurance.`;
  } else if (product.status === 'lastbuy') {
    intro += isReseller
      ? ` This part is in a last-time-buy window at the original manufacturer, so remaining supply is finite; ${SITE_NAME} can quote against current availability and advise on alternates.`
      : ` ${mfr} has placed this part in its last-time-buy window, so remaining supply is finite; ${SITE_NAME} can quote against current availability and advise on alternates.`;
  }
  parts.push(intro);

  // Para 2: Key specs summary (dynamically from specs JSON).
  const specEntries = meaningfulSpecEntries(specs);
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
  if (hasConfirmedStock(product)) {
    const moqNote = !product.moq || product.moq <= 1
      ? 'with no minimum order quantity'
      : `with a minimum order of ${product.moq} units`;
    parts.push(`${SITE_NAME} currently has ${formatInt(product.stock)} units of ${product.partNumber} in stock, available for immediate shipment ${moqNote}.`);
  } else if (product.status === 'obsolete' || product.status === 'eol' || product.status === 'nrnd') {
    parts.push(`Submit an RFQ for ${product.partNumber}; ${SITE_NAME} will verify availability, provenance, lead time, and pricing before confirming supply.`);
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
  if (hasConfirmedStock(product)) {
    faqs.push({
      q: `Is the ${product.partNumber} in stock and ready to ship?`,
      a: `Yes, ${SITE_NAME} currently lists ${formatInt(product.stock)} units of ${product.partNumber}. Submit an RFQ to confirm ship date, date code, and lead time.`,
    });
  } else if (product.status === 'obsolete' || product.status === 'eol' || product.status === 'nrnd') {
    faqs.push({
      q: `Can ${SITE_NAME} source the ${product.partNumber}?`,
      a: `Yes. ${SITE_NAME} can quote ${product.partNumber} through qualified specialty sourcing channels. Availability, lead time, provenance, and pricing are verified before an order is confirmed.`,
    });
  } else {
    faqs.push({
      q: `Can I still purchase the ${product.partNumber}?`,
      a: `While ${product.partNumber} is currently showing limited availability, ${SITE_NAME} can source this part through our global network of qualified suppliers. Submit an RFQ for lead time and pricing.`,
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
      a: `All ${product.partNumber} units sourced by ${SITE_NAME} are reviewed for originality, lot condition, and documentation before shipment. We use IDEA-STD-1010-aligned inspection practices for specialty-channel supply. ${statusLabel === 'obsolete' ? 'We specialize in obsolete part sourcing and verify availability before confirming supply.' : ''}`,
    });
  }

  // Q4: Pricing (only if price exists). No invented tier structure here — the
  // visible tier table is labelled an estimate; a FAQPage answer is not.
  if (product.minPrice > 0) {
    faqs.push({
      q: `What is the pricing for ${product.partNumber}?`,
      a: `Unit pricing for ${product.partNumber} starts at $${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}. Volume pricing depends on quantity and market availability — submit an RFQ for a firm quote.`,
    });
  }

  return faqs;
}

// React cache() deduplicates metadata/page work within one render. The bounded
// process cache additionally protects Postgres from repeated crawler traffic
// without creating per-product files on disk.
const getProduct = cache((partNumber) => getProductMemoryCached(`product:${partNumber}`, async () => {
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
}));

// Resolve the survivor of a duplicate group. Same memory cache as getProduct, so
// a crawler hammering a redirecting URL costs one query per TTL, not per hit.
const getCanonicalPart = cache((id) => getProductMemoryCached(`canonical:${id}`, () =>
  prisma.product.findUnique({
    where: { id },
    select: { partNumber: true, manufacturer: true },
  })
));

// Product URLs are heavily crawled. Self-hosted ISR keeps every generated
// HTML/RSC artifact on disk even after the revalidation window expires, so a
// 700K-product catalogue eventually fills the server. Render on demand instead:
// crawlers still receive complete server-rendered HTML, but no per-SKU files
// accumulate under .next/server/app/product.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Helper: status display. Backed by lib/product-status so the badge here, the
// category/search tables, and the JSON-LD lifecycle property can never disagree
// about what a status means.
function StatusBadge({ status }) {
  const info = getStatusInfo(status);
  return <span className={`badge ${info.badgeClass}`}>{info.label}</span>;
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
  const { manufacturer, partNumber } = await params;
  const product = await getProduct(decodeURIComponent(partNumber));

  if (!product) {
    notFound();
  }

  // Punctuation-variant duplicate ("74AHC132D112" for NXP's "74AHC132D,112"):
  // send it to the row that owns the canonical page. Set offline by
  // scripts/dedupe-part-numbers.mjs; see Product.duplicateOfId in schema.prisma.
  if (product.duplicateOfId) {
    const canonical = await getCanonicalPart(product.duplicateOfId);
    if (canonical) {
      permanentRedirect(productPath(canonical.partNumber, canonical.manufacturer));
    }
  }

  // Canonicalize the manufacturer URL segment. The page resolves purely by
  // (unique) partNumber, so any manufacturer slug would otherwise return 200
  // and create duplicate-content URLs. Redirect mismatches to the canonical
  // path (308) instead of relying on the canonical tag alone.
  const canonicalPath = productPath(product.partNumber, product.manufacturer);
  const canonicalMfrSlug = canonicalPath.split('/')[2];
  if (decodeURIComponent(manufacturer).toLowerCase() !== canonicalMfrSlug) {
    permanentRedirect(canonicalPath);
  }

  const specs = parseSpecs(product.specs);
  // Placeholder rows are dropped before rendering — see meaningfulSpecEntries.
  const specEntries = meaningfulSpecEntries(specs);
  const priceTiers = getPriceTiers(product.minPrice);
  const availabilityTone = getAvailabilityTone(product);
  const availabilityColor = availabilityTone === 'success'
    ? 'var(--color-success)'
    : availabilityTone === 'warning'
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)';
  const availabilityDot = availabilityTone === 'success' ? 'in-stock' : 'obsolete';

  // Shared category/manufacturer candidates keep the cache cardinality small:
  // many product pages reuse the same bounded entries.
  const [manufacturerRecord, relatedCandidates, sameManufacturerCandidates] = await Promise.all([
    // Lookup manufacturer slug from DB
    product.manufacturer
      ? getProductMemoryCached(`manufacturer:${product.manufacturer}`, () =>
          prisma.manufacturer.findFirst({
            where: { name: product.manufacturer },
            select: { slug: true },
          }), { ttlMs: 10 * 60 * 1000 })
      : null,
    // Fetch a reusable related-product pool (same category)
    product.categoryId
      ? getProductMemoryCached(`category-related-v2:${product.categoryId}`, () =>
          prisma.product.findMany({
            where: { categoryId: product.categoryId, duplicateOfId: null },
            select: { partNumber: true, manufacturer: true, description: true, stock: true, minPrice: true, status: true, imageUrl: true },
            take: 7,
            orderBy: { stock: 'desc' },
          }))
      : [],
    // Fetch a reusable manufacturer-product pool (for internal linking)
    product.manufacturer
      ? getProductMemoryCached(`manufacturer-products-v2:${product.manufacturer}`, () =>
          prisma.product.findMany({
            where: { manufacturer: product.manufacturer, duplicateOfId: null },
            select: { partNumber: true, description: true, minPrice: true, stock: true, manufacturer: true, status: true },
            take: 7,
            orderBy: { stock: 'desc' },
          }))
      : [],
  ]);
  const relatedProducts = relatedCandidates
    .filter(candidate => candidate.partNumber !== product.partNumber)
    .slice(0, 6);
  const sameManufacturerProducts = sameManufacturerCandidates
    .filter(candidate => candidate.partNumber !== product.partNumber)
    .slice(0, 6);
  const manufacturerSlug = manufacturerRecord?.slug || slugifyManufacturer(product.manufacturer);

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
    { id: 'product-specs', label: 'Specifications', show: specEntries.length > 0 },
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
                  <div className="eyebrow">Component detail</div>
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
                  <span className={`status-dot ${availabilityDot}`} />
                  <span style={{ fontWeight: 600, color: availabilityColor }}>
                    {getAvailabilityText(product)}
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
              <div className="quick-info-item priority">
                <span className="quick-info-label">Stock</span>
                <span className="quick-info-value">{getAvailabilityText(product)}</span>
              </div>
              <div className="quick-info-item priority">
                <span className="quick-info-label">Price</span>
                <span className="quick-info-value">
                  {product.minPrice > 0 ? `$${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                </span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Package</span>
                <span className="quick-info-value">{product.packageType || 'N/A'}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Lead Time</span>
                <span className="quick-info-value">{product.leadTime || (hasConfirmedStock(product) ? 'In stock' : 'Confirm')}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">MOQ</span>
                <span className="quick-info-value">{product.moq || 1}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Lifecycle</span>
                <span className="quick-info-value">{getStatusInfo(product.status).label}</span>
              </div>
            </div>

            <div className="product-procurement-strip">
              <div>
                <strong>Need a firm quote?</strong>
                <span>Confirm price, date code, batch, lead time, and alternates before purchase.</span>
              </div>
              <div className="product-procurement-actions">
                {product.datasheet && (
                  <a href={product.datasheet} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-secondary btn-sm">
                    Datasheet
                  </a>
                )}
                <Link href={`/rfq?part=${encodeURIComponent(product.partNumber)}${product.manufacturer ? `&manufacturer=${encodeURIComponent(product.manufacturer)}` : ''}`} className="btn btn-primary btn-sm">
                  Verify Stock & Date Code
                </Link>
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

            {/* Technical Specifications.
                Rows whose value is a feed placeholder are dropped rather than
                rendered as "Operating Temperature | -". Supplier feeds pad their
                whole key set on every row, so 76,463 products carried 8+ such
                rows: they make a page look specified when it is not, and they
                are the same placeholders the description generator and the
                quality score already learned to ignore. A product whose specs
                are ALL placeholders now renders no table at all instead of an
                empty-looking one. */}
            {specEntries.length > 0 && (
              <div className="product-section" id="product-specs">
                <h2 className="product-section-title">Technical Specifications</h2>
                <div className="table-wrapper">
                  <table className="table specs-table" id="specs-table">
                    <tbody>
                      {specEntries.map(([key, value]) => (
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

              {/* Quantity + RFQ actions (client component: the quantity has to
                  reach both the cart and the RFQ link) */}
              <ProductQuantityActions
                partNumber={product.partNumber}
                manufacturer={product.manufacturer}
                moq={product.moq}
              />

              <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <div className="sidebar-info-row">
                  <span>✓</span><span>Originality & lot review</span>
                </div>
                <div className="sidebar-info-row">
                  <span>▣</span>
                  <span>{!product.moq || product.moq <= 1 ? 'No Minimum Order Quantity' : `Minimum order: ${formatInt(product.moq)}`}</span>
                </div>
                <div className="sidebar-info-row">
                  <span>➤</span><span>{hasConfirmedStock(product) ? 'Same-Day Dispatch Available' : 'Sourcing & Lead-Time Confirmation'}</span>
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
                          <Link href={productPath(rp.partNumber, rp.manufacturer)}>{rp.partNumber}</Link>
                        </div>
                      </td>
                      <td>{rp.manufacturer}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rp.description}
                      </td>
                      <td>
                        <span className={hasConfirmedStock(rp) ? 'text-success' : 'text-muted'}>
                          {getAvailabilityText(rp)}
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
                  href={productPath(sp.partNumber, product.manufacturer)}
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
                    <span className={hasConfirmedStock(sp) ? 'text-success' : 'text-muted'}>
                      {getAvailabilityText(sp, { includeUnit: true })}
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
