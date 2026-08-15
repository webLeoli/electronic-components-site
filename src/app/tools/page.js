import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Free Engineering & Sourcing Tools',
  description: 'Free tools for electronics engineers and buyers: FPGA part number decoder, BOM quote tool, and sourcing guides for hard-to-find components.',
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: `Free Engineering & Sourcing Tools | ${SITE_NAME}`,
    description: 'FPGA part number decoder, BOM quote tool, and sourcing guides — free tools for electronics engineers and buyers.',
    url: `${SITE_URL}/tools`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Tools` }],
  },
};

const TOOLS = [
  {
    href: '/tools/fpga-part-number-decoder',
    icon: 'PN',
    title: 'FPGA Part Number Decoder',
    desc: 'Paste a Xilinx, Altera/Intel, Lattice, or Microchip part number and see family, speed grade, package, and temperature grade decoded segment by segment.',
  },
  {
    href: '/bom',
    icon: 'BOM',
    title: 'BOM Quote Tool',
    desc: 'Upload or paste your bill of materials, select the lines you need, and get a consolidated quote for all parts at once.',
  },
  {
    href: '/blog',
    icon: 'REF',
    title: 'Sourcing Guides & References',
    desc: 'Part numbering guides, package references, lifecycle and counterfeit-inspection articles written by our sourcing team.',
  },
];

export default function ToolsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">›</span>
          <span style={{ color: 'var(--color-text-primary)' }}>Tools</span>
        </nav>

        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
          Free Engineering &amp; Sourcing <span className="text-accent">Tools</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)', fontSize: '15px', maxWidth: '640px' }}>
          Built by our sourcing team for engineers and buyers. No signup, no tracking walls — use them and get on with your day.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-lg)' }}>
          {TOOLS.map(tool => (
            <Link key={tool.href} href={tool.href} className="card" style={{ padding: 'var(--space-xl)', display: 'block' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginBottom: 'var(--space-sm)' }}>
                {tool.icon}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{tool.title}</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
