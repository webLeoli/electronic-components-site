import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Quality Assurance',
  description: 'Our rigorous quality assurance process ensures 100% authentic electronic components. ISO 9001, AS6081 certified. Full traceability, inspection, and testing for every order.',
  alternates: { canonical: `${SITE_URL}/quality` },
  openGraph: {
    title: `Quality Assurance | ${SITE_NAME}`,
    description: 'ISO 9001 certified quality management. Every component inspected and traceable.',
    url: `${SITE_URL}/quality`,
    siteName: SITE_NAME,
  },
};

const QA_STEPS = [
  { step: '01', title: 'Supplier Verification', desc: 'Every supplier is vetted through ERAI, GIDEP, and our proprietary database. We maintain a pre-approved supplier list and reject any source with quality flags.', icon: '🔍' },
  { step: '02', title: 'Incoming Inspection', desc: 'Visual and microscopic inspection of all incoming shipments. We check packaging integrity, labeling consistency, date codes, and lot codes.', icon: '📋' },
  { step: '03', title: 'Authentication Testing', desc: 'X-ray fluorescence (XRF), decapsulation, and die analysis for high-risk components. We use heated solvent testing for remarking detection.', icon: '🔬' },
  { step: '04', title: 'Electrical Testing', desc: 'Functional testing per manufacturer specifications. We perform parametric testing, curve tracing, and full datasheet verification.', icon: '⚡' },
  { step: '05', title: 'Documentation', desc: 'Complete Certificate of Conformance (CoC) provided with every shipment. Full traceability from source to customer.', icon: '📄' },
  { step: '06', title: 'Secure Packaging', desc: 'ESD-safe, moisture-barrier packaging per IPC/JEDEC standards. Climate-controlled storage for moisture-sensitive components.', icon: '📦' },
];

const CERTS = [
  { name: 'ISO 9001:2015', desc: 'Quality Management System certified to international standards', scope: 'Distribution, inspection, and testing of electronic components' },
  { name: 'IDEA-STD-1010B', desc: 'Acceptability of Electronic Components', scope: 'Visual inspection and acceptance criteria for independent distribution' },
  { name: 'SAE AS6171', desc: 'Test Methods for Suspect/Counterfeit Parts', scope: 'Electrical and physical test procedures' },
  { name: 'SAE AS6496', desc: 'Fraudulent/Counterfeit Parts Requirements', scope: 'Independent distribution quality requirements' },
  { name: 'ERAI Member', desc: 'Risk mitigation through industry data sharing', scope: 'Access to reported fraud and counterfeit alerts' },
  { name: 'CCAP-101', desc: 'Counterfeit Components Avoidance Program', scope: 'Comprehensive anti-counterfeit measures' },
];

const TESTING = [
  { name: 'X-Ray Fluorescence (XRF)', desc: 'Material composition analysis to detect remarking or substitution' },
  { name: 'Scanning Acoustic Microscopy', desc: 'Internal die and wire bond integrity inspection' },
  { name: 'Decapsulation & Die Analysis', desc: 'Physical die verification against manufacturer specifications' },
  { name: 'Solvent Testing', desc: 'Detection of remarked or resurfaced components' },
  { name: 'Curve Tracing', desc: 'Electrical characterization and comparison to known-good units' },
  { name: 'Burn-In Testing', desc: 'Accelerated life testing for reliability verification' },
];

export default function QualityPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Quality Assurance' },
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
            <span style={{ color: 'var(--color-text-primary)' }}>Quality Assurance</span>
          </nav>

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-lg)' }}>
              Uncompromising <span className="text-accent">Quality</span> Standards
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '650px', margin: '0 auto' }}>
              Every component that leaves our facility has been rigorously inspected, tested, and documented.
              Our zero-defect philosophy means you can trust every part we ship.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-lg)', textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            {[
              { value: '99.2%', label: 'Order Accuracy' },
              { value: '<0.05%', label: 'Defect Rate' },
              { value: '100%', label: 'Parts Inspected' },
              { value: '<0.3%', label: 'Return Rate' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success)' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QA Process */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Our 6-Step Quality Process</h2>
            <p className="section-subtitle">From source verification to secure delivery</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', maxWidth: '1000px', margin: '0 auto' }}>
            {QA_STEPS.map(step => (
              <div key={step.step} className="card" style={{ padding: 'var(--space-xl)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', fontWeight: 900, color: 'rgba(255,107,0,0.12)' }}>{step.step}</div>
                <div style={{ fontSize: '32px', marginBottom: 'var(--space-md)' }}>{step.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Certifications & Standards</h2>
            <p className="section-subtitle">Industry-recognized quality compliance</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', maxWidth: '1000px', margin: '0 auto' }}>
            {CERTS.map((cert, i) => (
              <div key={i} className="card" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>{cert.name}</div>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{cert.desc}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{cert.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Capabilities */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Testing Capabilities</h2>
            <p className="section-subtitle">Advanced equipment and methods to ensure authenticity</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)', maxWidth: '900px', margin: '0 auto' }}>
            {TESTING.map((test, i) => (
              <div key={i} style={{ padding: 'var(--space-lg)', borderLeft: '3px solid var(--color-accent)', background: 'var(--color-bg-card)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{test.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{test.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
              Quality You Can Trust
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Request a Certificate of Conformance with any order, or contact us to discuss your specific quality requirements.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq" className="btn btn-primary btn-lg">Submit RFQ →</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">Contact Quality Team</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
