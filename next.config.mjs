/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly normalize URLs — redirect /path/ → /path (prevents duplicate content)
  trailingSlash: false,

  // Compression — enable gzip/brotli at the framework level
  compress: true,

  // Image optimization — AVIF > WebP > original, with aggressive caching
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
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
    ];
  },
};

export default nextConfig;
