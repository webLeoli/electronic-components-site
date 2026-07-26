'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * TrackingProvider — invisible client component that initializes the
 * traffic tracker on every page navigation and auto-tracks product/category/search views.
 *
 * The tracker module (~23KB) is loaded lazily via dynamic import so it lives in
 * its own async chunk instead of the shared client bundle on every page.
 */
export default function TrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    import('@/lib/tracker').then((tracker) => {
      if (cancelled) return;

      // Initialize tracker on every navigation (captures UTM, counts page views)
      tracker.initTracker();

      // Product page route is /product/[manufacturer]/[partNumber] — the old
      // single-capture regex passed "manufacturer/partNumber" as the part
      // number and corrupted every products_viewed analytics aggregate.
      const productMatch = pathname.match(/^\/product\/([^/]+)\/([^/]+)$/);
      if (productMatch) {
        const manufacturer = decodeURIComponent(productMatch[1]);
        const partNumber = decodeURIComponent(productMatch[2]);
        tracker.trackProductView(partNumber, manufacturer);
      }

      // Category route is /category/[[...slug]] — the deepest segment is the
      // actual category slug.
      const categoryMatch = pathname.match(/^\/category\/(.+)$/);
      if (categoryMatch) {
        const segments = categoryMatch[1].split('/').filter(Boolean);
        const slug = decodeURIComponent(segments[segments.length - 1] || '');
        if (slug) tracker.trackCategoryView(slug);
      }

      // Search page: /search?q=QUERY
      if (pathname === '/search') {
        const query = searchParams.get('q');
        if (query) {
          tracker.trackSearch(query);
        }
      }
    });
    return () => { cancelled = true; };
  }, [pathname, searchParams]);

  return null; // Invisible component
}
