import {
  MANUFACTURER_ALIAS_GROUPS,
  LEGACY_BRAND_SLUGS,
  manufacturerSlug,
} from './src/lib/manufacturer-canonical.js';

// 301s for the brand slugs retired by scripts/merge-manufacturers.mjs, generated
// from the alias table itself so the two can never disagree. Both URL shapes that
// embed a brand slug are covered:
//   /manufacturer/<old>        → /manufacturer/<new>
//   /product/<old>/:partNumber → /product/<new>/:partNumber
// The brand segment is a single path component, so one rule per retired brand
// covers every product URL under it (~90K products across ~45 rules). The product
// route also 301s stale segments on its own; these rules just answer without a
// database round-trip, and keep working for parts that have since been removed.
function manufacturerRedirects() {
  // Keyed by source: several spellings can share one slug ("TI Burr-Brown™" and
  // "TI Burr-Brown" both slugify to ti-burr-brown), and Next rejects duplicate
  // sources.
  const bySource = new Map();
  const pairs = [
    ...Object.entries(MANUFACTURER_ALIAS_GROUPS).flatMap(([canonical, aliases]) =>
      aliases.map(alias => [canonical, manufacturerSlug(alias)])),
    // Slugs that changed shape without a rename (accent folding).
    ...Object.entries(LEGACY_BRAND_SLUGS).map(([oldSlug, canonical]) => [canonical, oldSlug]),
  ];
  for (const [canonical, from] of pairs) {
    const to = manufacturerSlug(canonical);
    if (!from || from === to) continue;
    for (const rule of [
      { source: `/manufacturer/${from}`, destination: `/manufacturer/${to}`, permanent: true },
      { source: `/product/${from}/:partNumber`, destination: `/product/${to}/:partNumber`, permanent: true },
    ]) {
      if (!bySource.has(rule.source)) bySource.set(rule.source, rule);
    }
  }
  return [...bySource.values()];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly normalize URLs — redirect /path/ → /path (prevents duplicate content)
  trailingSlash: false,

  // Don't advertise the framework in response headers
  poweredByHeader: false,

  // Compression — enable gzip/brotli at the framework level
  compress: true,

  // Image optimization — AVIF > WebP > original, with aggressive caching
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Permanent redirects for retired/duplicate URLs.
  async redirects() {
    return [
      {
        // Duplicate taxonomy entry: /category/clock-dds and /category/dds both
        // rendered "Direct Digital Synthesis (DDS)" as their H1. clock-dds held
        // zero products and had no seoTitle/seoDesc, so it was a thin duplicate
        // of the real page (82 products). Consolidate the link equity.
        source: '/category/clock-dds',
        destination: '/category/dds',
        permanent: true,
      },
      ...manufacturerRedirects(),
    ];
  },

  // Security & caching response headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Clickjacking protection (modern CSP replacement for X-Frame-Options)
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          // MIME sniffing protection
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HSTS — force HTTPS for 1 year, include subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Limit browser feature access
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Basic XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Static assets — immutable 1-year cache
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Font files — long cache (they never change)
        source: '/:path*.woff2',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Icons & manifest — medium cache
        source: '/(icon-:size*|manifest.webmanifest|favicon.ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=604800' },
        ],
      },
      {
        // Robots + sitemap — short cache (revalidate hourly)
        source: '/(robots.txt|sitemap.xml|sitemap:path*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
        ],
      },
      {
        // Static marketing images in /public (hero backgrounds, og-image,
        // package photos) — without this Next serves them with max-age=0 and
        // every page view revalidates a ~150KB background image.
        source: '/:path*.(png|webp|jpg|jpeg|svg|gif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
