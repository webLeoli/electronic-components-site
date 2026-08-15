import {
  getProductDisplayImage,
  generateRepresentativeImageAlt,
} from './product-image-resolver';
import { getStatusInfo } from './product-status';
import { canonicalManufacturer, isDistributorBrand, manufacturerSlug } from './manufacturer-canonical';
import { formatInt } from './text';

const SITE_NAME = 'FPGACenter';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://fpgacenter.com';
// Brand positioning (2026-05-17): obsolete & hard-to-find sourcing is the
// primary business; FPGA/CPLD depth (24K+ FPGAs, 4.6K+ CPLDs) is the named
// specialty and matches the domain. This string is reused by every page that
// lacks a more specific description, so it must stand alone as a one-line
// pitch.
// Aim for ≤160 chars so Google doesn't truncate. The current copy is 155.
const SITE_DESC = 'Sourcing for hard-to-find and obsolete electronic components — 720K+ part numbers including 24K+ FPGAs and CPLDs. No MOQ, IDEA-1010 inspected, global shipping.';
// Short tagline used in <title> tags (must keep `${SITE_NAME} — ${SITE_TAGLINE}`
// under ~60 chars so Google doesn't truncate the brand keyword).
const SITE_TAGLINE = 'Obsolete & FPGA Component Sourcing';
// Longer brand-positioning line for hero subtitles and OG descriptions where
// truncation isn't a concern.
const SITE_PITCH = 'Hard-to-find and obsolete electronic components, with deep FPGA, CPLD & IC inventory';
const NON_CONFIRMED_STOCK_STATUSES = new Set(['obsolete', 'eol', 'nrnd']);

// Warn if SITE_URL is still localhost in production — all canonical/sitemap URLs will be wrong
if (process.env.NODE_ENV === 'production' && SITE_URL.includes('localhost')) {
  console.warn(
    '\x1b[33m⚠️  SEO WARNING: SITE_URL is set to localhost in production!\x1b[0m\n' +
    '   All canonical URLs, sitemap entries, and OG tags will point to localhost.\n' +
    '   Set NEXT_PUBLIC_SITE_URL and SITE_URL to your production domain in .env'
  );
}

// Generate URL path for product pages: /product/{manufacturer-slug}/{partNumber}
// This is the single source of truth for product URLs across the entire site.
//
// The brand segment is canonicalized (lib/manufacturer-canonical.js), not just
// slugified: a row still carrying a duplicate feed spelling would otherwise get
// its own parallel URL space. The product route compares the requested segment
// against this path and 301s mismatches, so canonicalizing here is what retires
// the old brand slugs — with or without the data migration having run.
export function productPath(partNumber, manufacturer) {
  const mfrSlug = manufacturerSlug(canonicalManufacturer(manufacturer) || 'unknown');
  return `/product/${mfrSlug}/${encodeURIComponent(partNumber)}`;
}

export function hasConfirmedStock(product) {
  if (!product || NON_CONFIRMED_STOCK_STATUSES.has(product.status)) return false;
  return product.stock != null && product.stock > 0;
}

export function getAvailabilityText(product, { includeUnit = false } = {}) {
  if (hasConfirmedStock(product)) {
    return `${formatInt(product.stock)}${includeUnit ? ' pcs' : ''} In Stock`;
  }
  if (product?.status === 'obsolete' || product?.status === 'eol') return 'RFQ for sourcing';
  return 'Available on request';
}

export function getAvailabilityTone(product) {
  if (hasConfirmedStock(product)) return 'success';
  if (product?.status === 'obsolete' || product?.status === 'eol') return 'muted';
  return 'warning';
}

export function getSchemaAvailability(product) {
  if (hasConfirmedStock(product)) return 'https://schema.org/InStock';
  return 'https://schema.org/LimitedAvailability';
}

function absoluteSiteUrl(url) {
  if (!url) return null;
  return url.startsWith('http')
    ? url
    : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getProductSeoImage(product) {
  const image = getProductDisplayImage(product);
  if (!image?.src) return null;

  return {
    url: absoluteSiteUrl(image.src),
    alt: image.kind === 'exact'
      ? `${product.partNumber} ${product.manufacturer} Electronic Component`
      : generateRepresentativeImageAlt(product, image),
    kind: image.kind,
  };
}

export function generateProductMeta(product) {
  const mfr = product.manufacturer || 'Electronic Component';
  const encodedPN = encodeURIComponent(product.partNumber);
  const stockLabel = hasConfirmedStock(product)
    ? 'In Stock'
    : (product.status === 'obsolete' || product.status === 'eol' ? 'RFQ' : 'Available');
  const categoryName = product.category?.name || '';

  // Root layout appends " | FPGACenter". Do not add "Buy Online" — most of the
  // catalogue is RFQ, and Google rewrites titles that don't match the page.
  const title = `${product.partNumber} - ${mfr} | ${stockLabel}`;
  const ogTitle = `${product.partNumber} - ${mfr}`;

  const descParts = [`${product.partNumber} by ${mfr}`];
  if (categoryName) descParts.push(`(${categoryName})`);
  if (product.packageType) descParts.push(`in ${product.packageType} package`);
  descParts.push('.');
  if (hasConfirmedStock(product)) {
    descParts.push(`${formatInt(product.stock)} units in stock.`);
  } else if (product.status === 'obsolete' || product.status === 'eol') {
    descParts.push('RFQ for verified sourcing.');
  }
  if (product.minPrice > 0) {
    descParts.push(`From $${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}.`);
  }
  descParts.push(`Request a quote at ${SITE_NAME}.`);
  const description = descParts.join(' ');
  const productUrl = `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`;

  const meta = {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: productUrl,
      siteName: SITE_NAME,
      // Note: Next.js metadata API only supports 'website'|'article'|'book'|'profile'|'video.*'.
      // 'product' crashes Next.js 16. Product semantics are conveyed via JSON-LD instead.
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: ogTitle,
      description,
    },
    alternates: {
      canonical: productUrl,
    },
  };

  // Include exact images when available; otherwise use package-family images.
  // Representative images are generic package visuals, not exact part photos.
  const seoImage = getProductSeoImage(product);
  if (seoImage) {
    meta.openGraph.images = [{
      url: seoImage.url,
      alt: seoImage.alt,
      width: 600,
      height: 600,
    }];
    meta.twitter.images = [seoImage.url];
  }

  return meta;
}

export function generateCategoryMeta(category, { page = 1 } = {}) {
  const description = category.seoDesc || `Browse ${category.name} electronic components. Find hard-to-find and obsolete parts at ${SITE_NAME}. Fast delivery, no minimum order.`;
  const baseUrl = `${SITE_URL}/category/${category.slug}`;
  // Paginated views self-canonicalize. Pointing page 2+ at page 1 declares them
  // duplicates, so Google drops them and every product listed past the first 20
  // loses its only internal link. Filter permutations (?status=, ?mount=) are
  // deliberately excluded from the canonical: those ARE facets of the same
  // listing and should consolidate onto the plain paginated URL.
  const canonicalUrl = page > 1 ? `${baseUrl}?page=${page}` : baseUrl;

  // Title with product count for CTR — shows inventory scale
  const titleBase = category.seoTitle || `${category.name} - Electronic Components`;
  const title = page > 1
    ? `${titleBase} - Page ${page}`
    : titleBase;

  return {
    title,
    description,
    openGraph: {
      title: `${category.name} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${category.name} Electronic Components` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function generateProductJsonLd(product) {
  const productUrl = `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`;
  const hasPrice = product.minPrice != null && product.minPrice > 0;
  const priceValid = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

  // One Offer at the listed minPrice. A fabricated AggregateOffer lowPrice
  // (minPrice * 0.58) and 0–1 day handling / FreeReturn shipping nodes were
  // ineligible-or-worse for rich results: Google can suppress Product snippets
  // when price or shipping does not match the page.
  let offers;
  if (hasPrice) {
    offers = {
      '@type': 'Offer',
      url: productUrl,
      availability: getSchemaAvailability(product),
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      priceCurrency: 'USD',
      price: product.minPrice,
      priceValidUntil: priceValid,
    };
  }
  // No price: emit NO offers node at all.
  //
  // This used to emit an Offer carrying availability and seller but no price.
  // Google's Product documentation makes "price or priceSpecification.price"
  // REQUIRED on an Offer, so that object was invalid structured data rather than
  // merely incomplete — 116,775 products, 10,815 of them indexed, each reporting
  // a "Missing field price" error in Search Console.
  //
  // `offers` itself is optional: Product needs one of review / aggregateRating /
  // offers to be eligible for a rich result, and a part with no price cannot win
  // a price rich result anyway. Dropping the node costs nothing and clears the
  // error. Setting `price: 0` would be worse than either — in schema.org that
  // states the part is free, which is not what an RFQ-only listing means.

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.partNumber,
    description: product.description || `${product.partNumber}${product.manufacturer ? ` by ${product.manufacturer}` : ''} electronic component`,
    // schema.org brand is the maker of the product. For rows filed under a
    // distributor (Rochester Electronics et al.) the real brand is unknown, and
    // naming the reseller was a false claim in structured data — omit instead.
    brand: product.manufacturer && !isDistributorBrand(product.manufacturer) ? {
      '@type': 'Brand',
      name: product.manufacturer,
    } : undefined,
    sku: product.partNumber,
    mpn: product.partNumber,
    category: product.category?.name,
    offers,
  };

  // Prefer exact photos; fall back to package-family representative images.
  const seoImage = getProductSeoImage(product);
  jsonLd.image = seoImage?.url || `${SITE_URL}/og-image.png`;

  // Additional properties for richer structured data
  const additionalProperties = [];
  if (product.packageType) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Package Type',
      value: product.packageType,
    });
  }
  if (product.mountType) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Mount Type',
      value: product.mountType,
    });
  }
  if (product.status) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Lifecycle Status',
      value: getStatusInfo(product.status).schemaLabel,
    });
  }
  // Parse specs JSON and add key parameters
  if (product.specs) {
    try {
      const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
      Object.entries(specs).slice(0, 10).forEach(([key, value]) => {
        if (value && String(value).length < 100) {
          additionalProperties.push({
            '@type': 'PropertyValue',
            name: key.replace(/([A-Z])/g, ' $1').trim(),
            value: String(value),
          });
        }
      });
    } catch {}
  }
  if (additionalProperties.length > 0) {
    jsonLd.additionalProperty = additionalProperties;
  }

  return jsonLd;
}

export function generateBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };
      if (item.url) entry.item = `${SITE_URL}${item.url}`;
      return entry;
    }),
  };
}

/**
 * Shared Organization JSON-LD — used on homepage and about page.
 * Contains all recommended fields for Google rich results.
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'FPGA Center',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: SITE_DESC,
    slogan: SITE_TAGLINE,
    knowsAbout: [
      'FPGA sourcing',
      'CPLD sourcing',
      'Obsolete electronic components',
      'End-of-life IC sourcing',
      'NRND component supply',
      'Last-time-buy procurement',
      'BOM scrubbing',
    ],
    foundingDate: '2016',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'sales@fpgacenter.com',
        contactType: 'sales',
        availableLanguage: ['English'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Shenzhen',
      addressRegion: 'Guangdong',
      addressCountry: 'CN',
    },
    // Note: add sameAs URLs when social profiles are available, e.g.:
    // sameAs: ['https://linkedin.com/company/fpgacenter', 'https://www.erai.com/...'],
  };
}

/**
 * WebSite JSON-LD. SearchAction is omitted on purpose: /search is noindex and
 * robots-disallowed, so a sitelinks searchbox target would contradict crawl
 * policy. Re-add only if the search landing is allowed to be indexed.
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export { SITE_NAME, SITE_URL, SITE_DESC, SITE_TAGLINE, SITE_PITCH };
