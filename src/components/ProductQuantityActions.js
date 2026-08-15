'use client';

/**
 * Quantity + RFQ actions for the product sidebar.
 *
 * The quantity box used to be a bare `<input id="qty-input">` rendered by the
 * server component, with nothing reading it: AddToRfqButton got no qty prop and
 * fell back to its default of 1, so a buyer who typed 5,000 sent an RFQ for a
 * single unit. Quantity now lives in client state and feeds both the cart and
 * the direct "Verify Stock" link.
 */

import { useState } from 'react';
import Link from 'next/link';
import AddToRfqButton from '@/components/AddToRfqButton';

export default function ProductQuantityActions({ partNumber, manufacturer = '', moq = 1 }) {
  const minQty = Math.max(1, Number(moq) || 1);
  const [qty, setQty] = useState(String(minQty));

  // Fall back to the MOQ when the field is blank or nonsense, so neither the
  // cart nor the RFQ link can carry a zero/NaN quantity.
  const parsed = Number.parseInt(qty, 10);
  const effectiveQty = Number.isFinite(parsed) && parsed >= 1 ? parsed : minQty;

  const rfqHref = `/rfq?part=${encodeURIComponent(partNumber)}&qty=${effectiveQty}${manufacturer ? `&manufacturer=${encodeURIComponent(manufacturer)}` : ''}`;

  return (
    <>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <label
          htmlFor="qty-input"
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}
        >
          Quantity
        </label>
        <input
          type="number"
          className="input"
          id="qty-input"
          min={minQty}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={() => { if (!Number.isFinite(parsed) || parsed < 1) setQty(String(minQty)); }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <Link href={rfqHref} className="btn btn-primary btn-lg" style={{ width: '100%' }} id="rfq-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Verify Stock &amp; Date Code
        </Link>
        <AddToRfqButton
          partNumber={partNumber}
          manufacturer={manufacturer}
          qty={effectiveQty}
        />
      </div>
    </>
  );
}
