'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import RfqCartIndicator from './RfqCartIndicator';

// Main visible categories (6 items) — matches our 3-level taxonomy
const MAIN_CATEGORIES = [
  { name: 'Embedded', slug: 'embedded', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg> },
  { name: 'Power', slug: 'power-management', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { name: 'Memory', slug: 'memory', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/></svg> },
  { name: 'Analog', slug: 'analog', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { name: 'Logic', slug: 'logic', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h8"/></svg> },
  { name: 'Interface', slug: 'interface', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg> },
];

// Additional categories in "More" dropdown
const MORE_CATEGORIES = [
  { name: 'Clock & Timing', slug: 'clock-timing' },
  { name: 'Audio, Video & Telecom', slug: 'audio-video-telecom' },
  { name: 'FPGAs', slug: 'fpgas' },
  { name: 'Microcontrollers', slug: 'microcontrollers' },
  { name: 'Voltage Regulators', slug: 'voltage-regulators' },
  { name: 'Data Converters', slug: 'data-converters' },
];

export default function Header() {
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

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

  // Hide header on admin routes
  if (pathname?.startsWith('/admin')) return null;

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

          <form className="search-bar" onSubmit={handleSearch} action="/search" method="GET" role="search" id="header-search">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="input"
              name="q"
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
