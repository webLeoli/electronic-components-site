import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-2xl)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '560px' }}>
        {/* Animated 404 */}
        <div style={{
          fontSize: '120px',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, var(--color-accent), #FFB347)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--space-md)',
          letterSpacing: '-4px',
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          marginBottom: 'var(--space-sm)',
        }}>
          Part Not Found
        </h1>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '16px',
          lineHeight: 1.7,
          marginBottom: 'var(--space-xl)',
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          But don&apos;t worry — we can still help you source any electronic component.
        </p>

        {/* Search Box */}
        <form action="/search" method="GET" style={{
          position: 'relative',
          maxWidth: '420px',
          margin: '0 auto var(--space-xl)',
        }}>
          <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            className="input"
            placeholder="Search for a part number..."
            style={{ paddingLeft: '46px', paddingRight: '110px', height: '50px', fontSize: '15px', borderRadius: 'var(--radius-xl)' }}
          />
          <button type="submit" className="search-btn" style={{ right: '5px', padding: '10px 20px' }}>
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">
            ← Back to Home
          </Link>
          <Link href="/rfq" className="btn btn-secondary">
            Submit RFQ
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact Us
          </Link>
        </div>

        {/* Popular Searches */}
        <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            Popular searches:
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['STM32F103C8T6', 'ATMEGA328P', 'LM7805', 'NE555P', 'XC6SLX9', 'IRF540N'].map(term => (
              <Link key={term} href={`/search?q=${term}`} className="btn btn-secondary btn-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
