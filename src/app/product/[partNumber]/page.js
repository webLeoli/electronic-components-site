import prisma from '@/lib/db';
import { generateProductMeta, generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToRfqButton from '@/components/AddToRfqButton';
import ProductImage, { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_PARTS } from '@/lib/fallbacks';

// ISR: revalidate every 1 hour
export const revalidate = 3600;

// Generate static params for known products (optional — ISR handles unknown ones)
export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      select: { partNumber: true },
      where: { manufacturer: { not: null } }, // Only products with complete data
      take: 20,
    });
    return products.map((p) => ({ partNumber: p.partNumber }));
  } catch {
    return []; // If DB unavailable at build time, skip prerendering
  }
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }) {
  try {
    const { partNumber } = await params;
    const decodedPart = decodeURIComponent(partNumber);
    let product = await prisma.product.findUnique({
      where: { partNumber: decodedPart },
      include: { category: true },
    });
    if (!product) {
      const fallback = FALLBACK_PARTS.find(p => p.partNumber === decodedPart);
      if (fallback) product = fallback;
      else return { title: 'Product Not Found' };
    }
    return generateProductMeta(product);
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
  const decodedPart = decodeURIComponent(partNumber);

  let product = await prisma.product.findUnique({
    where: { partNumber: decodedPart },
    include: { category: { include: { parent: true } } },
  });

  if (!product) {
    const fallback = FALLBACK_PARTS.find(p => p.partNumber === decodedPart);
    if (fallback) {
      product = {
        ...fallback,
        id: 0,
        description: `${fallback.partNumber} by ${fallback.manufacturer}. High quality electronic component in stock.`,
        packageType: 'Tape & Reel (TR)',
        mountType: 'Surface Mount',
        moq: 1,
        leadTime: 'In Stock',
        specs: '{}',
        imageUrl: null,
      };
    } else {
      notFound();
    }
  }

  const specs = parseSpecs(product.specs);
  const priceTiers = getPriceTiers(product.minPrice);

  // Lookup manufacturer slug from DB (avoids hardcoded string->slug mismatch)
  const manufacturerRecord = product.manufacturer
    ? await prisma.manufacturer.findFirst({
        where: { name: product.manufacturer },
        select: { slug: true },
      })
    : null;
  const manufacturerSlug = manufacturerRecord?.slug || (product.manufacturer || 'unknown').toLowerCase().replace(/[\s\/]+/g, '-');

  // Fetch related products (same category)
  const relatedProducts = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          partNumber: { not: product.partNumber },
        },
        take: 6,
        orderBy: { stock: 'desc' },
      })
    : [];

  // Fetch more products from same manufacturer (for internal linking)
  const sameManufacturerProducts = product.manufacturer
    ? await prisma.product.findMany({
        where: {
          manufacturer: product.manufacturer,
          partNumber: { not: product.partNumber },
        },
        select: { partNumber: true, description: true, minPrice: true, stock: true },
        take: 6,
        orderBy: { stock: 'desc' },
      })
    : [];

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

  // FAQ JSON-LD for rich snippets
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${product.partNumber} original and genuine?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, all ${product.partNumber} components from FPGACenter are 100% original and genuine${product.manufacturer ? ` from ${product.manufacturer}` : ''}. Every part undergoes rigorous quality inspection and testing before shipment.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the lead time for ${product.partNumber}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: product.stock > 0
            ? `${product.partNumber} is currently in stock with ${product.stock.toLocaleString()} units available. In-stock items ship same day for orders placed before 3PM.`
            : `${product.partNumber} is currently on lead time. Submit an RFQ and our team will provide availability and lead time within 24 hours.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the minimum order quantity for ${product.partNumber}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `FPGACenter has no minimum order quantity for ${product.partNumber}. You can order from 1 piece to production volumes.`,
        },
      },
      {
        '@type': 'Question',
        name: `Can I get a datasheet for ${product.partNumber}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: product.datasheet
            ? `Yes, the ${product.partNumber} datasheet is available for download on the product page.`
            : `Contact our sales team for the ${product.partNumber} datasheet and technical documentation.`,
        },
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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

        {/* Product Header */}
        <div className="product-page-layout" id="product-detail">
          <div className="product-main">
            {/* Part Number & Basic Info */}
            <div className="product-header-section">
              <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
                {/* Product Image */}
                <ProductImage product={product} size={160} style={{ flexShrink: 0 }} />

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

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
                {product.description}
              </p>
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
              <div className="product-section">
                <h2 className="product-section-title">Pricing</h2>
                <div className="price-tiers">
                  {priceTiers.map((tier, i) => (
                    <div key={i} className="price-tier">
                      <div className="qty">{tier.qty}</div>
                      <div className="price">${tier.price.toFixed(tier.price < 1 ? 4 : 2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {Object.keys(specs).length > 0 && (
              <div className="product-section">
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
                <a href={product.datasheet} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
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
          <div className="product-section" style={{ marginTop: 'var(--space-2xl)' }}>
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
