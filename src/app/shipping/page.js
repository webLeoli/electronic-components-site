import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Shipping & Delivery',
  description: 'Fast worldwide shipping for electronic components. Same-day dispatch available. Express delivery via DHL, FedEx, UPS to 60+ countries. ESD-safe packaging.',
  alternates: { canonical: `${SITE_URL}/shipping` },
  openGraph: {
    title: `Shipping & Delivery | ${SITE_NAME}`,
    description: 'Fast worldwide shipping for electronic components to 60+ countries.',
    url: `${SITE_URL}/shipping`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Shipping` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Shipping & Delivery | ${SITE_NAME}`,
    description: 'Fast worldwide shipping for electronic components to 60+ countries.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const SHIPPING_METHODS = [
  { name: 'Express Air', carriers: 'DHL, FedEx, UPS', time: '1-3 business days', desc: 'Priority air freight for urgent orders. Door-to-door delivery with full tracking.', icon: '✈️', highlight: true },
  { name: 'Standard Air', carriers: 'DHL, FedEx, EMS', time: '3-7 business days', desc: 'Economical air shipping for standard orders. Reliable tracking and delivery.', icon: '📦', highlight: false },
  { name: 'Sea Freight', carriers: 'Multiple carriers', time: '15-30 business days', desc: 'Cost-effective option for large bulk orders. Ideal for production quantities.', icon: '🚢', highlight: false },
  { name: 'Local Pickup', carriers: 'Self-service', time: 'Same day', desc: 'Pick up directly from our Shenzhen or Hong Kong warehouses during business hours.', icon: '🏢', highlight: false },
];

const REGIONS = [
  { region: 'North America', countries: 'USA, Canada, Mexico', expressTime: '2-3 days', standardTime: '5-7 days', icon: '🇺🇸' },
  { region: 'Europe', countries: 'UK, Germany, France, etc.', expressTime: '2-4 days', standardTime: '5-8 days', icon: '🇪🇺' },
  { region: 'Asia Pacific', countries: 'China, Japan, Korea, etc.', expressTime: '1-3 days', standardTime: '3-5 days', icon: '🌏' },
  { region: 'South America', countries: 'Brazil, Argentina, etc.', expressTime: '3-5 days', standardTime: '7-12 days', icon: '🌎' },
  { region: 'Middle East & Africa', countries: 'UAE, Saudi Arabia, etc.', expressTime: '3-5 days', standardTime: '7-10 days', icon: '🌍' },
  { region: 'Oceania', countries: 'Australia, New Zealand', expressTime: '3-4 days', standardTime: '5-8 days', icon: '🇦🇺' },
];

const PACKAGING = [
  { title: 'ESD Protection', desc: 'All components are packaged in ESD-safe bags and containers per ANSI/ESD S20.20 standards.' },
  { title: 'Moisture Barrier', desc: 'Moisture-sensitive components are vacuum sealed with desiccant per IPC/JEDEC J-STD-033.' },
  { title: 'Shock Protection', desc: 'Foam inserts, bubble wrap, and reinforced boxes protect against transit damage.' },
  { title: 'Temperature Control', desc: 'Temperature-sensitive components shipped with thermal packaging when required.' },
];

export default function ShippingPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shipping & Delivery' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <section className="section" style={{ paddingTop: 'var(--space-3xl)' }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">›</span>
            <span style={{ color: 'var(--color-text-primary)' }}>Shipping & Delivery</span>
          </nav>

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-lg)' }}>
              Fast <span className="text-accent">Global</span> Shipping
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
              Same-day dispatch for in-stock items. Express delivery to 60+ countries
              with full tracking and ESD-safe packaging.
            </p>
          </div>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Shipping Methods</h2>
            <p className="section-subtitle">Choose the option that best fits your timeline</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', maxWidth: '1100px', margin: '0 auto' }}>
            {SHIPPING_METHODS.map((method, i) => (
              <div key={i} className="card" style={{
                padding: 'var(--space-xl)', textAlign: 'center',
                borderColor: method.highlight ? 'var(--color-accent)' : undefined,
                position: 'relative',
              }}>
                {method.highlight && (
                  <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', padding: '2px 12px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 700 }}>
                    MOST POPULAR
                  </span>
                )}
                <div style={{ fontSize: '36px', marginBottom: 'var(--space-md)' }}>{method.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{method.name}</h3>
                <div style={{ fontSize: '14px', color: 'var(--color-accent)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{method.time}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>{method.carriers}</div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{method.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Times by Region */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Delivery Times by Region</h2>
            <p className="section-subtitle">Estimated transit times after dispatch</p>
          </div>
          <div className="table-wrapper" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Region</th>
                  <th>Key Countries</th>
                  <th>Express</th>
                  <th>Standard</th>
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '20px', textAlign: 'center' }}>{r.icon}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.region}</td>
                    <td>{r.countries}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{r.expressTime}</td>
                    <td>{r.standardTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Packaging Standards */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Packaging Standards</h2>
            <p className="section-subtitle">Professional packaging for safe delivery</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)', maxWidth: '800px', margin: '0 auto' }}>
            {PACKAGING.map((pkg, i) => (
              <div key={i} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, color: 'var(--color-accent)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{pkg.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{pkg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes + CTA */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📋 Important Information</h2>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {[
                  'Orders placed before 2:00 PM (EST) ship the same day for in-stock items.',
                  'Customs duties and import taxes are the responsibility of the buyer.',
                  'Hazardous goods (batteries, etc.) may require special shipping arrangements.',
                  'Free shipping on orders over $500 within the continental United States.',
                  'All shipments include full insurance coverage at no additional cost.',
                  'Real-time tracking number provided immediately after dispatch.',
                ].map((note, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, paddingLeft: '20px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--color-success)' }}>✓</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Need a Custom Shipping Solution?</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>Contact our logistics team for bulk orders, special handling, or freight forwarding.</p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <Link href="/contact" className="btn btn-primary">Contact Logistics</Link>
                <Link href="/rfq" className="btn btn-secondary">Submit RFQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
