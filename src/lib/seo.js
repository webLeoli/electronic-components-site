const SITE_NAME = 'FPGACenter';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://fpgacenter.com';
const SITE_DESC = 'Professional sourcing for hard-to-find and obsolete electronic components. Extensive inventory with no minimum order quantity. Global shipping.';

// Warn if SITE_URL is still localhost in production — all canonical/sitemap URLs will be wrong
if (process.env.NODE_ENV === 'production' && SITE_URL.includes('localhost')) {
  console.warn(
    '\x1b[33m⚠️  SEO WARNING: SITE_URL is set to localhost in production!\x1b[0m\n' +
    '   All canonical URLs, sitemap entries, and OG tags will point to localhost.\n' +
    '   Set NEXT_PUBLIC_SITE_URL and SITE_URL to your production domain in .env'
  );
}

export function generateProductMeta(product) {
  const mfr = product.manufacturer || 'Electronic Component';
  const encodedPN = encodeURIComponent(product.partNumber);
  const stockLabel = product.stock > 0 ? 'In Stock' : 'Available';
  const categoryName = product.category?.name || '';

  // Title: Part# - Manufacturer | Status | FPGACenter
  // e.g. "XC7A35T-1CPG236C - Xilinx | In Stock | Buy Online"
  const title = `${product.partNumber} - ${mfr} | ${stockLabel} | Buy Online`;
  const ogTitle = `${product.partNumber} - ${mfr} | Buy at ${SITE_NAME}`;

  // Description: richer with category, package, stock for SERP snippet
  const descParts = [`Buy ${product.partNumber} by ${mfr}`];
  if (categoryName) descParts.push(`(${categoryName})`);
  if (product.packageType) descParts.push(`in ${product.packageType} package`);
  descParts.push('.');
  if (product.stock > 0) {
    descParts.push(`${product.stock.toLocaleString()} units in stock.`);
  }
  if (product.minPrice > 0) {
    descParts.push(`From $${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}.`);
  }
  descParts.push(`No MOQ. Fast shipping from ${SITE_NAME}.`);
  const description = descParts.join(' ');
  const productUrl = `${SITE_URL}/product/${encodedPN}`;

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

  // Include product image for rich previews (social sharing, chat embeds)
  if (product.imageUrl) {
    const imageUrl = product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${SITE_URL}${product.imageUrl}`;
    meta.openGraph.images = [{
      url: imageUrl,
      alt: `${product.partNumber} ${product.manufacturer} Electronic Component`,
      width: 600,
      height: 600,
    }];
    meta.twitter.images = [imageUrl];
  }

  return meta;
}

export function generateCategoryMeta(category, { page = 1 } = {}) {
  const description = category.seoDesc || `Browse ${category.name} electronic components. Find hard-to-find and obsolete parts at ${SITE_NAME}. Fast delivery, no minimum order.`;
  const baseUrl = `${SITE_URL}/category/${category.slug}`;
  // Canonical always points to the base category URL (page 1).
  // Paginated views are not independent entities — they share the same intent.
  // Google can still crawl ?page=N for product discovery but consolidates equity.
  const canonicalUrl = baseUrl;

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
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function generateProductJsonLd(product) {
  const encodedPN = encodeURIComponent(product.partNumber);
  const productUrl = `${SITE_URL}/product/${encodedPN}`;
  const hasPrice = product.minPrice != null && product.minPrice > 0;
  const priceValid = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

  // Build offer — use AggregateOffer for price range display in Google
  const baseOffer = {
    url: productUrl,
    availability: product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    // FPGACenter sells original/genuine parts — even obsolete/EOL products
    // are new-old-stock (NOS), not second-hand. Always NewCondition.
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    // Shipping details for Google Shopping rich results
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'USD',
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'US',
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
      },
    },
    // Return policy — 30-day returns for defective/incorrect parts
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  };

  let offers;
  if (hasPrice) {
    // AggregateOffer shows price range in Google ("$0.50 - $1.20" instead of single price)
    const lowPrice = +(product.minPrice * 0.58).toFixed(4); // bulk tier estimate
    offers = {
      '@type': 'AggregateOffer',
      ...baseOffer,
      priceCurrency: 'USD',
      lowPrice: lowPrice,
      highPrice: product.minPrice,
      offerCount: 6, // 6 price tiers
      priceValidUntil: priceValid,
    };
  } else {
    offers = {
      '@type': 'Offer',
      ...baseOffer,
    };
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.partNumber,
    description: product.description || `${product.partNumber}${product.manufacturer ? ` by ${product.manufacturer}` : ''} electronic component`,
    brand: product.manufacturer ? {
      '@type': 'Brand',
      name: product.manufacturer,
    } : undefined,
    sku: product.partNumber,
    mpn: product.partNumber,
    category: product.category?.name,
    offers,
  };

  // Add product image — use generic component image as fallback for Rich Results
  if (product.imageUrl) {
    jsonLd.image = product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${SITE_URL}${product.imageUrl}`;
  } else {
    jsonLd.image = `${SITE_URL}/og-image.png`;
  }

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
      value: product.status === 'active' ? 'Active' :
             product.status === 'obsolete' ? 'Obsolete' :
             product.status === 'eol' ? 'End of Life' :
             product.status === 'nrnd' ? 'Not Recommended for New Design' : product.status,
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
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: SITE_DESC,
    foundingDate: '2016',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'sales@fpgacenter.com',
        contactType: 'sales',
        availableLanguage: ['English'],
      },
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'ISO 9001:2015' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'IDEA-STD-1010' },
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
 * Generate WebSite JSON-LD with SearchAction for Google Sitelinks Searchbox.
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export { SITE_NAME, SITE_URL, SITE_DESC };
