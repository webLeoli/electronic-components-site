import Link from 'next/link';
import prisma from '@/lib/db';

export const metadata = {
  title: 'Product Not Found',
  robots: { index: false, follow: true },
};

export default async function ProductNotFound() {
  // Fetch popular products to reduce bounce rate
  let hotProducts = [];
  try {
    hotProducts = await prisma.product.findMany({
      where: { status: 'active', stock: { gt: 0 } },
      select: { partNumber: true, manufacturer: true, minPrice: true, stock: true },
      orderBy: { stock: 'desc' },
      take: 6,
    });
  } catch {}

  return (
    <div className="container" style={{
      padding: 'var(--space-3xl) var(--space-lg)',
      minHeight: '60vh',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '64px', marginBottom: 'var(--space-md)' }}>🔍</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
          Product Not Found
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '500px',
          margin: '0 auto var(--space-xl)',
          lineHeight: 1.7,
        }}>
          The part number you&apos;re looking for doesn&apos;t exist in our database yet.
          Try searching or submit an RFQ — we can source almost any component.
        </p>

        {/* Search box for immediate recovery */}
        <form action="/search" method="GET" style={{
          maxWidth: '500px', margin: '0 auto var(--space-xl)',
        }}>
          <div className="hero-search" style={{ maxWidth: '100%' }}>
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="q"
              className="input"
              placeholder="Try another part number..."
              id="not-found-search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </div>
        </form>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-secondary">← Back to Home</Link>
          <Link href="/rfq" className="btn btn-primary">Submit RFQ</Link>
        </div>
      </div>

      {/* Popular products to reduce bounce */}
      {hotProducts.length > 0 && (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
            Popular Products In Stock
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 'var(--space-md)',
          }}>
            {hotProducts.map(p => (
              <Link
                key={p.partNumber}
                href={`/product/${encodeURIComponent(p.partNumber)}`}
                className="card"
                style={{ padding: 'var(--space-lg)', textDecoration: 'none' }}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                  {p.partNumber}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {p.manufacturer || 'Various'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: '13px' }}>
                  <span className="text-success">{p.stock?.toLocaleString()} in stock</span>
                  <span style={{ fontWeight: 600 }}>{p.minPrice ? `$${p.minPrice.toFixed(2)}` : 'RFQ'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
