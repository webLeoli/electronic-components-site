'use client';

import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#0B1426',
        color: '#E8EDF2',
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '32px' }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            marginBottom: '8px',
          }}>
            Something Went Wrong
          </h1>

          <p style={{
            color: '#94A3B8',
            fontSize: '16px',
            lineHeight: 1.7,
            marginBottom: '24px',
          }}>
            We encountered an unexpected error. Please try again or contact our support team if the issue persists.
          </p>

          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre style={{
              background: 'rgba(255, 61, 0, 0.08)',
              border: '1px solid rgba(255, 61, 0, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#fca5a5',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px',
              marginBottom: '24px',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {error.message}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#FF6B00',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#142644',
                color: '#E8EDF2',
                border: '1px solid #1E3050',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Back to Home
            </Link>
          </div>

          <p style={{
            marginTop: '32px',
            fontSize: '13px',
            color: '#64748B',
          }}>
            Need help? Contact us at{' '}
            <a href="mailto:support@fpgacenter.com" style={{ color: '#FF6B00' }}>
              support@fpgacenter.com
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
