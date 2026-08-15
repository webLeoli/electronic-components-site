import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import DecoderTool from './DecoderTool';

export const metadata = {
  title: 'FPGA Part Number Decoder — Xilinx, Altera, Lattice',
  description: 'Free FPGA/CPLD part number decoder. Paste a Xilinx, Altera/Intel, Lattice, or Microchip part number and see the family, speed grade, package, and temperature grade explained segment by segment.',
  alternates: { canonical: `${SITE_URL}/tools/fpga-part-number-decoder` },
  openGraph: {
    title: `FPGA Part Number Decoder | ${SITE_NAME}`,
    description: 'Decode Xilinx, Altera/Intel, Lattice, and Microchip FPGA/CPLD part numbers: family, speed grade, package, and temperature grade explained.',
    url: `${SITE_URL}/tools/fpga-part-number-decoder`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FPGA Part Number Decoder' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `FPGA Part Number Decoder | ${SITE_NAME}`,
    description: 'Decode Xilinx, Altera/Intel, Lattice, and Microchip FPGA/CPLD part numbers segment by segment.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const FAQS = [
  {
    q: 'What does the T in XC7A35T mean?',
    a: 'The trailing T on a Xilinx 7-series device name means the die carries serial transceivers (GTP/GTX). Its absence, in families where both variants exist, means the transceivers are not present — and no configuration bitstream can add them.',
  },
  {
    q: 'Is a higher FPGA speed grade always faster?',
    a: 'On Xilinx FPGAs, yes: -3 is faster than -1. On Altera/Intel FPGAs the numbering is inverted: a Cyclone IV C6 is faster than a C8. And on the old Xilinx XC9500 CPLDs the number is a propagation delay in nanoseconds, so lower is faster. Always check which convention the family uses before cross-referencing.',
  },
  {
    q: 'What is the difference between XC, XA, and XQ prefixes?',
    a: 'XC is the standard commercial product line, XA is automotive (AEC-Q100 qualified), and XQ is defense-grade. The silicon design is the same family, but qualification, temperature range, and traceability requirements differ — they are not drop-in substitutes for each other in a controlled BOM.',
  },
  {
    q: 'Do the digits in the package code mean pin count or body size?',
    a: 'It depends on the vendor and generation. Xilinx package digits are the pin/ball count (CPG236 = 236 balls). Altera MAX-series digits are the pin count (T100 = TQFP-100), but Cyclone/Stratix digits are the package body size in millimeters (F17 = 17×17 mm FBGA). This is one of the most common misreads in procurement.',
  },
];

export default function DecoderPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: 'FPGA Part Number Decoder' },
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)', maxWidth: '900px' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">›</span>
          <Link href="/tools">Tools</Link>
          <span className="separator">›</span>
          <span style={{ color: 'var(--color-text-primary)' }}>FPGA Part Number Decoder</span>
        </nav>

        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
          FPGA Part Number <span className="text-accent">Decoder</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginBottom: 'var(--space-xl)', lineHeight: 1.7 }}>
          Paste any Xilinx, Altera/Intel, Lattice, or Microchip (Actel) FPGA/CPLD part number and see
          what every segment means: family, capacity, speed grade, package, and temperature grade.
          Free, instant, runs entirely in your browser.
        </p>

        <DecoderTool />

        <div className="product-section">
          <h2 className="product-section-title">Why part-number segments matter in procurement</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>
            An FPGA part number is a complete order specification. Two parts that differ only in the
            speed grade, the temperature suffix, or one package letter are different orderable items
            with different stock, different prices, and — for EOL families — different remaining supply.
            A substitution that ignores one segment can be electrically genuine and still unusable on
            your board. When a supplier offers you a &ldquo;same&rdquo; part with a different suffix,
            decode both before accepting.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
            For the full numbering guides, see{' '}
            <Link href="/blog/xilinx-part-number-decoder">Xilinx part numbers decoded</Link> and{' '}
            <Link href="/blog/altera-intel-part-number-decoder">Altera/Intel part numbers decoded</Link>.
            For sourcing help on a specific family, start at <Link href="/fpga-sourcing">FPGA &amp; CPLD sourcing</Link>.
          </p>
        </div>

        <div className="product-section" id="decoder-faq">
          <h2 className="product-section-title">Frequently asked questions</h2>
          {FAQS.map((f, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{f.q}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
