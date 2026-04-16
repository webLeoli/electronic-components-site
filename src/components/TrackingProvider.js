'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initTracker, trackProductView, trackCategoryView, trackSearch } from '@/lib/tracker';

/**
 * TrackingProvider — invisible client component that initializes the
 * traffic tracker on every page navigation and auto-tracks product/category/search views.
 */
export default function TrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize tracker on every navigation (captures UTM, counts page views)
    initTracker();

    // Auto-detect and track specific page types
    // Product page: /product/PART_NUMBER
    const productMatch = pathname.match(/^\/product\/(.+)$/);
    if (productMatch) {
      const partNumber = decodeURIComponent(productMatch[1]);
      trackProductView(partNumber);
    }

    // Category page: /category/SLUG
    const categoryMatch = pathname.match(/^\/category\/(.+)$/);
    if (categoryMatch) {
      const slug = decodeURIComponent(categoryMatch[1]);
      trackCategoryView(slug);
    }

    // Search page: /search?q=QUERY
    if (pathname === '/search') {
      const query = searchParams.get('q');
      if (query) {
        trackSearch(query);
      }
    }
  }, [pathname, searchParams]);

  return null; // Invisible component
}
