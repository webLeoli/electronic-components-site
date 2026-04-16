'use client';

/**
 * RfqCartIndicator — Header badge showing RFQ cart item count.
 * Replaces the static Cart link with a live, interactive RFQ cart indicator.
 */

import Link from 'next/link';
import { useRfqCart } from '@/lib/rfq-cart';

export default function RfqCartIndicator() {
  const { count } = useRfqCart();

  return (
    <Link href="/rfq" className="header-action rfq-cart-indicator" id="rfq-cart-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      <span>RFQ</span>
      {count > 0 && (
        <div className="count rfq-count-badge" key={count}>
          {count}
        </div>
      )}
    </Link>
  );
}
