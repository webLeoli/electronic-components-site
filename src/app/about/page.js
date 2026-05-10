import Link from 'next/link';
import prisma from '@/lib/db';
import { SITE_NAME, SITE_URL, generateOrganizationJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'About Us',
  description: 'Learn about FPGACenter — your trusted partner for hard-to-find and obsolete electronic components. ISO 9001 certified quality, global sourcing network, and 15+ years of industry experience.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description: 'Your trusted partner for hard-to-find and obsolete electronic components.',
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
  },
};

const MILESTONES = [
  { year: '2016', title: 'Founded', desc: 'Established in Shenzhen as an independent electronic components distributor, focused on sourcing hard-to-find ICs and programmable logic devices.' },
  { year: '2018', title: 'Hong Kong Office', desc: 'Opened trading and logistics office in Hong Kong to facilitate international transactions and faster customs clearance.' },
  { year: '2020', title: 'Quality System', desc: 'Implemented comprehensive incoming inspection and anti-counterfeit screening protocols aligned with industry standards.' },
  { year: '2022', title: 'Platform Launch', desc: 'Launched online catalog and RFQ platform, enabling customers worldwide to search inventory and submit inquiries directly.' },
  { year: '2024', title: 'Expanded Sourcing', desc: 'Grew supplier network to cover 50+ authorized and franchised sources across Asia, Europe, and North America.' },
];

const VALUES = [
  { icon: '🛡️', title: 'Quality First', desc: 'Every component is inspected and tested before shipment. Zero tolerance for counterfeits.' },
  { icon: '🤝', title: 'Customer Focus', desc: 'We prioritize long-term relationships over short-term profits. Your success is our success.' },
  { icon: '🌍', title: 'Global Reach', desc: 'Our worldwide sourcing network ensures we can find even the most elusive components.' },
  { icon: '⚡', title: 'Speed & Agility', desc: 'Same-day quoting and rapid fulfillment to keep your production lines running.' },
];

// Dynamic stats are fetched from DB; static stats are hardcoded
function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString()}K+`;
  return n.toLocaleString();
}

export const revalidate = 3600;

export default async function AboutPage() {
  // Fetch live counts so stats are consistent with homepage
  let totalProducts = 10000;
  let totalManufacturers = 500;
  try {
    [totalProducts, totalManufacturers] = await Promise.all([
      prisma.product.count(),
      prisma.manufacturer.count(),
    ]);
  } catch {}

  const STATS = [
    { value: '8+', label: 'Years in Business' },
    { value: formatCount(totalProducts), label: 'Part Numbers Listed' },
    { value: formatCount(totalManufacturers), label: 'Manufacturers Covered' },
    { value: '60+', label: 'Countries Served' },
    { value: '5K+', label: 'Orders Fulfilled' },
    { value: '99.2%', label: 'Customer Satisfaction' },
  ];

  const CERTS = [
    { name: 'ISO 9001:2015', desc: 'Quality Management System' },
    { name: 'IDEA-STD-1010', desc: 'Component Inspection Standard' },
    { name: 'ERAI Member', desc: 'Electronic Resellers Association' },
    { name: 'ECIA Authorized', desc: 'Industry Association Member' },
  ];

  const jsonLd = generateOrganizationJsonLd();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'About Us' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="section" style={{ paddingTop: 'var(--space-3xl)' }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">›</span>
            <span style={{ color: 'var(--color-text-primary)' }}>About Us</span>
          </nav>

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-lg)' }}>
              Your Trusted Partner for <span className="text-accent">Electronic Components</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '650px', margin: '0 auto' }}>
              Since 2016, FPGACenter has been helping engineers, manufacturers, and procurement teams
              source hard-to-find, obsolete, and end-of-life electronic components with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-2xl) 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-lg)', textAlign: 'center' }}>
            {STATS.map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-accent)' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Our Core Values</h2>
            <p className="section-subtitle" style={{ maxWidth: '500px' }}>The principles that guide every decision we make</p>
          </div>
          <div className="features-grid">
            {VALUES.map((val, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{val.icon}</div>
                <h3>{val.title}</h3>
                <p>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Our Journey</h2>
            <p className="section-subtitle">Key milestones in our history</p>
          </div>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {MILESTONES.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 'var(--space-xl)', padding: 'var(--space-lg) 0',
                borderBottom: i < MILESTONES.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)', flexShrink: 0, width: '80px' }}>
                  {m.year}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{m.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Certifications & Memberships</h2>
            <p className="section-subtitle">Industry-recognized standards of excellence</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', maxWidth: '800px', margin: '0 auto' }}>
            {CERTS.map((cert, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>{cert.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
              Ready to Work With Us?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Whether you need a single component or millions, our team is ready to help.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq" className="btn btn-primary btn-lg">Submit RFQ →</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
