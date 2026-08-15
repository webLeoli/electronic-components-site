import BomTool from './BomTool';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'BOM Quote Tool',
  description: 'Upload your Bill of Materials and get volume quotes for all components at once. Supports CSV, TSV, and paste-from-spreadsheet. Fast response within 24 hours.',
  openGraph: {
    title: `BOM Quote Tool | ${SITE_NAME}`,
    description: 'Upload your Bill of Materials and get volume quotes for all components at once. Supports CSV, TSV, and paste-from-spreadsheet.',
    url: `${SITE_URL}/bom`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} BOM Quote Tool` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `BOM Quote Tool | ${SITE_NAME}`,
    description: 'Upload your Bill of Materials and get volume quotes for all components at once.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: { canonical: `${SITE_URL}/bom` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'BOM Quote Tool' },
  ],
};

export default function BOMPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BomTool />
    </>
  );
}
