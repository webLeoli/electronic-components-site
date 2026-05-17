import Link from 'next/link';
import prisma from '@/lib/db';
import { SITE_NAME, SITE_URL, SITE_DESC, generateOrganizationJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'About Us',
  description: 'FPGACenter is a specialty distributor of obsolete and hard-to-find electronic components, including a deep catalog of FPGAs and CPLDs. Operating since 2016 from Shenzhen with IDEA-STD-1010-aligned inspection.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description: 'Specialty distributor of obsolete and hard-to-find electronic components.',
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} About Us` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `About Us | ${SITE_NAME}`,
    description: 'Specialty distributor of obsolete and hard-to-find electronic components.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const MILESTONES = [
  { year: '2016', title: 'Founded',          desc: 'Established in Shenzhen as an independent distributor specialising in hard-to-find ICs and programmable logic devices.' },
  { year: '2018', title: 'Hong Kong office', desc: 'Opened trading and logistics operations in Hong Kong to support faster international shipping and customs clearance.' },
  { year: '2020', title: 'Quality system',   desc: 'Adopted incoming inspection procedures aligned with IDEA-STD-1010 protocol and IPC-1601 PCN monitoring.' },
  { year: '2022', title: 'Platform launch',  desc: 'Launched the online catalog and RFQ platform, enabling part search, BOM submission, and direct sourcing inquiries.' },
  { year: '2024', title: 'Sourcing network', desc: 'Grew the qualified supplier network to cover authorised, franchised, and specialty channels across Asia, Europe, and North America.' },
  { year: '2026', title: 'Catalog expanded', desc: 'Reached 720,000+ part numbers across 380+ manufacturers, with particular depth in obsolete FPGAs, CPLDs, and legacy ICs.' },
];

// Sourcing process — explicit, conservative, mirrors blog post language to
// keep the about page consistent with what we say in /blog content.
const SOURCING_PROCESS = [
  {
    n: 1,
    title: 'Supplier qualification',
    desc: 'Every supplier in our network is qualified through documentation review, sample inspection history, and ongoing performance tracking. We prioritise suppliers with verifiable quality systems (ISO 9001, AS9120 where applicable) and franchise relationships where they exist.',
  },
  {
    n: 2,
    title: 'Sourcing & verification',
    desc: 'For each request, we check authorised distribution first, then the manufacturer\'s last-time-buy availability, and then our qualified specialty channels. Pricing, lead time, and supply provenance are documented before any order is placed.',
  },
  {
    n: 3,
    title: 'Inspection aligned with IDEA-STD-1010',
    desc: 'Parts received from non-authorised channels are inspected against IDEA-STD-1010-B protocol — external visual examination, marking permanency testing, lot documentation review — and, where appropriate, package material analysis (XRF) and electrical sampling.',
  },
  {
    n: 4,
    title: 'Documentation & traceability',
    desc: 'Each shipment carries a certificate of conformance with lot codes, date codes, supply chain provenance, and inspection findings. Documentation is retained for the lifetime of the customer relationship.',
  },
];

// Department-level introduction — matches the blog signature "FPGACenter
// Sourcing Team" without manufacturing individual identities we can't back up.
const TEAMS = [
  {
    name: 'Sourcing Team',
    desc: 'Procurement specialists focused on FPGA, CPLD, and obsolete IC sourcing through both authorised and specialty distribution channels.',
  },
  {
    name: 'Quality Assurance',
    desc: 'Inspection technicians performing IDEA-STD-1010-aligned receiving inspection, documentation review, and lot disposition.',
  },
  {
    name: 'Customer Support',
    desc: 'Sales engineers handling RFQs, BOM lifecycle analysis, and order coordination across time zones.',
  },
];

const VALUES = [
  { icon: '▲', title: 'Verify, don\'t assume', desc: 'Every non-authorised lot passes through inspection before it ships. Documentation accompanies every shipment.' },
  { icon: '●', title: 'Long-horizon customers', desc: 'Most of our revenue comes from sustaining-engineering and procurement teams supporting products with 10-20 year lifecycles. We optimise for the long relationship, not the single transaction.' },
  { icon: '◆', title: 'Specialty, not breadth', desc: 'We focus on the parts other distributors stop carrying — obsolete ICs, legacy FPGAs and CPLDs, and hard-to-find inventory — rather than competing on commodity volume.' },
  { icon: '►', title: 'Operational responsiveness', desc: 'Same-day quoting on in-stock parts. Express dispatch from Hong Kong logistics to most countries in 2-7 business days.' },
];

const FAQS = [
  {
    q: 'What types of parts does FPGACenter source?',
    a: 'Our focus is obsolete and hard-to-find electronic components: legacy FPGAs and CPLDs (Spartan, Cyclone, MachXO, MAX series), end-of-life ICs, NRND parts, and specialty inventory across 380+ manufacturers. We also support BOM lifecycle analysis for procurement teams running quarterly risk reviews.',
  },
  {
    q: 'Are FPGACenter\'s parts authentic?',
    a: 'Parts sourced through authorised distribution are authentic by definition. For parts sourced through specialty channels (which is normal for components that have left authorised distribution), every lot is inspected against IDEA-STD-1010-B protocol with full documentation. No inspection process is infallible, but the combination of qualified suppliers, layered inspection, and traceability documentation is the industry-standard approach to managing counterfeit risk.',
  },
  {
    q: 'Is FPGACenter an authorised distributor or a specialty distributor?',
    a: 'We operate as a specialty distributor focused on the obsolete and hard-to-find segment. For parts still in authorised distribution, we typically refer customers to franchise distributors (Mouser, Digi-Key, Arrow, etc.) because that is the lower-cost, lower-risk channel. We add value where authorised stock is depleted or where specialty inspection is required.',
  },
  {
    q: 'What\'s the minimum order quantity?',
    a: 'No minimum order quantity. We support customers ordering single units for prototypes as well as customers ordering tens of thousands of units for production builds.',
  },
  {
    q: 'How quickly can FPGACenter ship?',
    a: 'In-stock items typically dispatch same-day for orders placed before our cut-off, with express delivery to most countries in 2-7 business days. Specialty-sourced obsolete parts have longer lead times depending on availability — typical range is 1-6 weeks.',
  },
  {
    q: 'Do you support BOM analysis?',
    a: 'Yes. Send us a bill of materials and we can return a risk-prioritised report identifying NRND, EOL, and obsolete exposure, along with sourcing or replacement options for flagged parts. This is part of our sourcing service rather than a separately billed consulting engagement.',
  },
];

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString()}K+`;
  return n.toLocaleString();
}

export const revalidate = 3600;

export default async function AboutPage() {
  // Pull live counts so the stats block is always accurate
  let totalProducts = 720000;
  let totalManufacturers = 380;
  let totalIndexable = 525000;
  try {
    [totalProducts, totalManufacturers, totalIndexable] = await Promise.all([
      prisma.product.count(),
      prisma.manufacturer.count(),
      prisma.product.count({ where: { indexable: true } }),
    ]);
  } catch {}

  // Verifiable stats only — anything we can't substantiate is omitted.
  // (Removed "99.2% Customer Satisfaction" and "5K+ Orders Fulfilled" as
  // unsubstantiated numbers were flagged as EEAT risk during 2026-05 audit.)
  const STATS = [
    { value: '10+',                            label: 'Years in Business' },
    { value: formatCount(totalProducts),       label: 'Part Numbers Listed' },
    { value: formatCount(totalManufacturers),  label: 'Manufacturers Covered' },
    { value: '60+',                            label: 'Countries Served' },
  ];

  // Only credentials we can substantiate. (Removed "ECIA Authorized" as
  // unsubstantiated — ECIA membership is typically for manufacturers; add
  // back only if FPGACenter has documented membership.)
  const CERTS = [
    { name: 'ISO 9001:2015',         desc: 'Quality Management System' },
    { name: 'IDEA-STD-1010-aligned', desc: 'Receiving inspection protocol' },
    { name: 'ERAI Member',           desc: 'Electronic Resellers Association International' },
  ];

  const orgJsonLd = generateOrganizationJsonLd();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'About Us' },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // Pull the most-recent published blog posts to link back from About
  let recentPosts = [];
  try {
    recentPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { title: true, slug: true, readingTime: true },
      orderBy: { publishedAt: 'desc' },
      take: 4,
    });
  } catch {}

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="section" style={{ paddingTop: 'var(--space-3xl)' }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">›</span>
            <span style={{ color: 'var(--color-text-primary)' }}>About Us</span>
          </nav>

          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-lg)' }}>
              Specialty Distributor for <span className="text-accent">Obsolete & Hard-to-Find Components</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '700px', margin: '0 auto' }}>
              FPGACenter has been sourcing obsolete and hard-to-find electronic components since 2016,
              with particular depth in legacy FPGAs and CPLDs. We serve sustaining-engineering and procurement teams
              who need verifiable parts after the original distribution channels have closed.
            </p>
          </div>
        </div>
      </section>

      {/* Stats — verifiable numbers only */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-2xl) 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-lg)', textAlign: 'center' }}>
            {STATS.map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-accent)' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sourcing Process — explicit, mirrors blog content */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">How We Source Obsolete Parts</h2>
            <p className="section-subtitle" style={{ maxWidth: '600px' }}>The four-step process behind every shipment we send.</p>
          </div>
          <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {SOURCING_PROCESS.map(step => (
              <div key={step.n} className="card" style={{ display: 'flex', gap: 'var(--space-lg)', padding: 'var(--space-lg)', alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--color-accent)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 800,
                }}>
                  {step.n}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{step.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">How We Operate</h2>
            <p className="section-subtitle" style={{ maxWidth: '500px' }}>The operating principles we use day-to-day.</p>
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

      {/* Teams */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Our Team</h2>
            <p className="section-subtitle" style={{ maxWidth: '600px' }}>The departments behind the inventory, inspections, and customer relationships.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-lg)', maxWidth: '900px', margin: '0 auto' }}>
            {TEAMS.map((t, i) => (
              <div key={i} className="card" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-accent)' }}>{t.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
          {/* TODO (content op): replace this placeholder note with real team photos
              once available. Keep names/photos optional — the department-level
              description above is the EEAT floor; photos are a meaningful boost. */}
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-lg)' }}>
            All blog content is published under the <strong>FPGACenter Sourcing Team</strong> byline.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Our Journey</h2>
            <p className="section-subtitle">Key milestones in our history</p>
          </div>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
            <h2 className="section-title">Standards & Memberships</h2>
            <p className="section-subtitle">Industry frameworks our process aligns with.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', maxWidth: '760px', margin: '0 auto' }}>
            {CERTS.map((cert, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>{cert.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest from our blog — internal linking + freshness signal */}
      {recentPosts.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container">
            <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
              <h2 className="section-title">Recent Insights</h2>
              <p className="section-subtitle">Procurement, quality, and FPGA sourcing guidance from our team.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', maxWidth: '900px', margin: '0 auto' }}>
              {recentPosts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="card" style={{ padding: 'var(--space-lg)', textDecoration: 'none' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px' }}>{p.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {p.readingTime ? `${p.readingTime} min read` : 'Read more →'}
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
              <Link href="/blog" className="btn btn-secondary">All posts →</Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {FAQS.map((f, i) => (
              <details key={i} className="card" style={{ padding: 'var(--space-lg)' }} open={i === 0}>
                <summary style={{ fontSize: '16px', fontWeight: 700, cursor: 'pointer', listStyle: 'none' }}>
                  {f.q}
                </summary>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginTop: 'var(--space-md)', marginBottom: 0 }}>
                  {f.a}
                </p>
              </details>
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
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-xl)', fontSize: '16px' }}>
              Send us a part number, an RFQ, or a full BOM — our sourcing team will respond within one business day.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/rfq" className="btn btn-primary btn-lg">Submit RFQ →</Link>
              <Link href="/bom" className="btn btn-secondary btn-lg">Submit a BOM</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
