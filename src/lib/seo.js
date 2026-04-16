const SITE_NAME = 'FPGACenter';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://fpgacenter.com';
const SITE_DESC = 'Professional sourcing for hard-to-find and obsolete electronic components. Extensive inventory with no minimum order quantity. Global shipping.';

export function generateProductMeta(product) {
  const mfr = product.manufacturer || 'Electronic Component';
  const title = `${product.partNumber} - ${mfr} | Buy Online`;
  const ogTitle = `${product.partNumber} - ${mfr} | Buy at ${SITE_NAME}`;
  const description = `Buy ${product.partNumber} by ${mfr}. ${product.description || 'Original part, fast delivery, no MOQ requirement.'} In stock at ${SITE_NAME}.`;

  const meta = {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `${SITE_URL}/product/${product.partNumber}`,
      siteName: SITE_NAME,
      type: 'website',
    },
    alternates: {
      canonical: `${SITE_URL}/product/${product.partNumber}`,
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
  }

  return meta;
}

export function generateCategoryMeta(category) {
  const title = `${category.name} - Electronic Components`;
  const ogTitle = `${category.name} - Electronic Components | ${SITE_NAME}`;
  const description = category.seoDesc || `Browse ${category.name} electronic components. Find hard-to-find and obsolete parts at ${SITE_NAME}. Fast delivery, no minimum order.`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `${SITE_URL}/category/${category.slug}`,
      siteName: SITE_NAME,
      type: 'website',
    },
    alternates: {
      canonical: `${SITE_URL}/category/${category.slug}`,
    },
  };
}

export function generateProductJsonLd(product) {
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
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.partNumber}`,
      priceCurrency: 'USD',
      price: product.minPrice || undefined,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: product.status === 'active'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
      priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };

  // Add image with SEO-friendly alt embedded in the URL filename
  if (product.imageUrl) {
    jsonLd.image = product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${SITE_URL}${product.imageUrl}`;
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
        availableLanguage: ['English', 'Chinese'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Shenzhen',
      addressRegion: 'Guangdong',
      addressCountry: 'CN',
    },
    sameAs: [],
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
