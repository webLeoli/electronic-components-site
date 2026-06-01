import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Quality Assurance',
  description: 'Quality assurance for high-value electronic components: supplier qualification, IDEA-STD-1010-aligned inspection, traceability review, and risk-based testing.',
  alternates: { canonical: `${SITE_URL}/quality` },
  openGraph: {
    title: `Quality Assurance | ${SITE_NAME}`,
    description: 'Supplier qualification, traceability review, and risk-based inspection for hard-to-find and obsolete components.',
    url: `${SITE_URL}/quality`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Quality Assurance` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Quality Assurance | ${SITE_NAME}`,
    description: 'Supplier qualification, traceability review, and risk-based inspection for hard-to-find and obsolete components.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const QA_STEPS = [
  { step: '01', title: 'Supplier qualification', desc: 'Suppliers are reviewed against available market records, transaction history, documentation quality, and internal performance data. Sources with unresolved quality flags are rejected.', icon: 'QA' },
  { step: '02', title: 'Incoming inspection', desc: 'Visual and microscopic inspection checks packaging integrity, labeling consistency, date codes, lot codes, and obvious remarking risk.', icon: 'IN' },
  { step: '03', title: 'Risk-based authentication', desc: 'XRF, marking permanency checks, X-ray, decapsulation, and die review can be added for high-risk or high-value lots when the order scope requires it.', icon: 'XR' },
  { step: '04', title: 'Electrical testing', desc: 'Functional or parametric testing is applied where suitable samples, fixtures, and customer requirements justify the added verification scope.', icon: 'ET' },
  { step: '05', title: 'Documentation', desc: 'Certificate of Conformance and lot-level documentation are available based on order requirements, supplier records, and inspection scope.', icon: 'DOC' },
  { step: '06', title: 'Secure packaging', desc: 'ESD-safe and moisture-aware packaging are used for sensitive devices, with shipping requirements matched to component risk.', icon: 'ESD' },
];

const STANDARDS = [
  { name: 'IDEA-STD-1010B aligned', desc: 'External visual inspection, marking review, packaging review, and acceptance criteria for independent distribution.' },
  { name: 'ISO 9001 process reference', desc: 'Supplier qualification, inspection records, corrective action, and documentation controls.' },
  { name: 'SAE AS6171 aware', desc: 'Reference framework for advanced electrical and physical test options when the lot risk requires it.' },
  { name: 'SAE AS6496 aware', desc: 'Reference framework for counterfeit avoidance and independent distribution quality controls.' },
];

const TESTING = [
  'X-Ray Fluorescence (XRF)',
  'X-ray inspection',
  'Marking permanency review',
  'Solvent testing',
  'Curve tracing',
  'Functional or parametric test support',
  'Decapsulation and die review when required',
  'Lot documentation and date-code review',
];

const FAQS = [
  {
    q: 'Does every order receive the same testing scope?',
    a: 'No. The correct scope depends on part value, age, source channel, application risk, available samples, and customer requirements. We avoid claiming unnecessary tests and define the scope before order commitment.',
  },
  {
    q: 'Can FPGACenter provide traceability documents?',
    a: 'Traceability and CoC documents are available based on supplier records, order requirements, and lot condition. For obsolete parts, we confirm available documentation before final quote acceptance.',
  },
  {
    q: 'Why is FPGA and CPLD sourcing higher risk?',
    a: 'Older programmable logic parts can be high-value, package-specific, and difficult to replace. Exact ordering code, speed grade, package, date code, and provenance should be verified before purchase.',
  },
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="section" style={{ paddingTop: 'var(--space-3xl)' }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">/</span>
            <span style={{ color: 'var(--color-text-primary)' }}>Quality Assurance</span>
          </nav>

          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
            <div className="eyebrow">Risk-aware component sourcing</div>
            <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-lg)' }}>
              Quality controls for high-value and obsolete components
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '720px', margin: '0 auto' }}>
              FPGACenter verifies supplier quality, lot documentation, packaging condition,
              and inspection scope before order commitment. For legacy FPGA and CPLD parts,
              we focus on exact ordering code, provenance, and risk-based authentication.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Quality workflow</h2>
            <p className="section-subtitle">A practical process for independent and specialty sourcing channels.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', maxWidth: '1040px', margin: '0 auto' }}>
            {QA_STEPS.map(step => (
              <div key={step.step} className="card" style={{ padding: 'var(--space-xl)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', fontWeight: 900, color: 'rgba(239,79,36,0.12)' }}>{step.step}</div>
                <div style={{ width: 46, height: 46, borderRadius: 8, background: '#fff4ef', color: '#ef4f24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: 'var(--space-md)' }}>{step.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Standards and references</h2>
            <p className="section-subtitle">We describe alignment and process references conservatively unless a customer requests certified documentation.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)', maxWidth: '980px', margin: '0 auto' }}>
            {STANDARDS.map(item => (
              <div key={item.name} className="card" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent)', marginBottom: 8 }}>{item.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Available verification options</h2>
            <p className="section-subtitle">Testing scope is confirmed per order, part risk, and customer requirement.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)', maxWidth: '900px', margin: '0 auto' }}>
            {TESTING.map(item => (
              <div key={item} style={{ padding: '14px 16px', borderLeft: '3px solid var(--color-accent)', background: '#ffffff', borderRadius: '0 8px 8px 0', color: '#475569', fontWeight: 700, fontSize: 13 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Quality FAQ</h2>
          </div>
          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'grid', gap: 'var(--space-md)' }}>
            {FAQS.map((faq, index) => (
              <details key={faq.q} className="card" open={index === 0}>
                <summary style={{ cursor: 'pointer', fontWeight: 800 }}>{faq.q}</summary>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
              Need verification before purchase?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Send the exact part number, quantity, application risk, and documentation requirement. We will confirm what can be verified before quoting.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq?category=Quality%20Verification" className="btn btn-primary btn-lg">Request Verification Quote</Link>
              <Link href="/fpga-sourcing" className="btn btn-secondary btn-lg">FPGA Sourcing</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
