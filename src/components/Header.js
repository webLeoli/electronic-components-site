'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import RfqCartIndicator from './RfqCartIndicator';

// Main visible categories (6 items)
const MAIN_CATEGORIES = [
  { name: 'ICs', slug: 'integrated-circuits', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { name: 'Semiconductors', slug: 'discrete-semiconductors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/></svg> },
  { name: 'Capacitors', slug: 'capacitors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg> },
  { name: 'Resistors', slug: 'resistors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 12 6 12 8 8 12 16 16 8 18 12 22 12"/></svg> },
  { name: 'Connectors', slug: 'connectors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h8"/></svg> },
  { name: 'Sensors', slug: 'sensors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

// Additional categories in "More" dropdown
const MORE_CATEGORIES = [
  { name: 'Optoelectronics', slug: 'optoelectronics' },
  { name: 'Relays', slug: 'relays' },
  { name: 'Switches', slug: 'switches' },
  { name: 'Crystals & Oscillators', slug: 'crystals-oscillators' },
  { name: 'Power Supplies', slug: 'power-supplies' },
  { name: 'RF / RFID', slug: 'rf-rfid' },
];

export default function Header() {
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Hide header on admin routes
  if (pathname?.startsWith('/admin')) return null;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <header className="header" id="site-header">
        <div className="header-inner">
          <Link href="/" className="logo" id="logo-link">
            <div className="logo-icon">F</div>
            FPGA<span>Center</span>
          </Link>

          <form className="search-bar" onSubmit={handleSearch} id="header-search">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search by part number, keyword, or manufacturer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="search-input"
            />
            <button type="submit" className="search-btn" id="search-btn">Search</button>
          </form>

          <div className="header-actions">
            <RfqCartIndicator />
          </div>
        </div>
      </header>

      <nav className="category-bar" id="category-nav">
        <div className="category-bar-inner">
          {MAIN_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="cat-link"
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
              {cat.name}
            </Link>
          ))}

          {/* More dropdown */}
          <div className="cat-more-wrapper" ref={moreRef}>
            <button
              className="cat-link cat-more-btn"
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
            >
              More
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {moreOpen && (
              <div className="cat-more-dropdown">
                {MORE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="cat-more-item"
                    onClick={() => setMoreOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/category"
                  className="cat-more-item cat-more-all"
                  onClick={() => setMoreOpen(false)}
                >
                  All Categories →
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
