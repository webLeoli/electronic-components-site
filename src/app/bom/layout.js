import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'BOM Quote Tool',
  description: 'Upload your Bill of Materials and get quotes for all components at once. Support for CSV, TSV, and paste-from-Excel formats. Fast turnaround with competitive pricing.',
  alternates: { canonical: `${SITE_URL}/bom` },
  openGraph: {
    title: `BOM Quote Tool | ${SITE_NAME}`,
    description: 'Upload your BOM and get quotes for all electronic components at once.',
    url: `${SITE_URL}/bom`,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} BOM Tool` }],
  },
};

export default function BOMLayout({ children }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'BOM Quote Tool' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
