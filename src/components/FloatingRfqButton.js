'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingRfqButton() {
  const pathname = usePathname();

  // Hide on admin, RFQ, and contact pages (already have quote forms)
  if (
    pathname?.startsWith('/admin') ||
    pathname === '/rfq' ||
    pathname === '/contact'
  ) return null;

  return (
    <div className="rfq-float">
      <Link href="/rfq" className="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Get Quote
      </Link>
    </div>
  );
}
