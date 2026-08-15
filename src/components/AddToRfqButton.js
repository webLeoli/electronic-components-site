'use client';

/**
 * AddToRfqButton — Reusable client component for adding parts to the RFQ cart.
 * 
 * Works in server-rendered pages by receiving data as props.
 * Shows a toast notification on successful add.
 */

import { useState } from 'react';
import { useRfqCart } from '@/lib/rfq-cart';
import { trackRfqTrigger } from '@/lib/tracker';

export default function AddToRfqButton({
  partNumber,
  manufacturer = '',
  qty = 1,
  variant = 'default', // 'default' | 'small' | 'icon' | 'table-row'
  className = '',
}) {
  const { addItem, items } = useRfqCart();
  const [showToast, setShowToast] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Match the cart's own dedupe key (partNumber + manufacturer), otherwise the
  // button claims "Already in RFQ" for the same PN from a different maker.
  const isInCart = items.some(
    item =>
      item.partNumber.toUpperCase() === partNumber.toUpperCase() &&
      (item.manufacturer || '').toUpperCase() === (manufacturer || '').toUpperCase()
  );

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(partNumber, manufacturer, qty);
    trackRfqTrigger(
      variant === 'icon' ? 'table_icon_btn' :
      variant === 'small' || variant === 'table-row' ? 'table_row_btn' :
      'product_page_btn',
      partNumber
    );
    setJustAdded(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    setTimeout(() => setJustAdded(false), 3000);
  };

  // Different button variants for different contexts
  if (variant === 'icon') {
    return (
      <button
        onClick={handleAdd}
        className={`rfq-cart-btn-icon ${isInCart ? 'in-cart' : ''} ${className}`}
        title={isInCart ? 'Already in RFQ cart — click to add more' : 'Add to RFQ cart'}
        aria-label={`Add ${partNumber} to RFQ cart`}
      >
        {justAdded ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        {showToast && <span className="rfq-mini-toast">Added!</span>}
      </button>
    );
  }

  if (variant === 'small' || variant === 'table-row') {
    return (
      <button
        onClick={handleAdd}
        className={`btn btn-outline btn-sm rfq-add-btn ${justAdded ? 'added' : ''} ${className}`}
        style={{ position: 'relative' }}
      >
        {justAdded ? '✓ Added' : (isInCart ? '+ Add More' : '+ RFQ')}
        {showToast && <span className="rfq-mini-toast">Added to cart!</span>}
      </button>
    );
  }

  // Default: full button for product sidebar
  return (
    <button
      onClick={handleAdd}
      className={`btn ${justAdded ? 'btn-success' : 'btn-outline'} btn-lg rfq-add-btn ${className}`}
      style={{ width: '100%', position: 'relative' }}
      id="add-rfq-btn"
    >
      {justAdded ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Added to RFQ Cart!
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="12" x2="12" y2="18" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          {isInCart ? 'Add More to RFQ Cart' : 'Add to RFQ Cart'}
        </span>
      )}
      {showToast && <span className="rfq-toast-popup">✓ Added to your RFQ inquiry list</span>}
    </button>
  );
}
