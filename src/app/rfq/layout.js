import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Request for Quote (RFQ)',
  description: 'Submit a quote request for hard-to-find and obsolete electronic components. Our procurement team will source any part within 24 hours.',
  openGraph: {
    title: `Request for Quote | ${SITE_NAME}`,
    description: 'Submit a quote request for hard-to-find electronic components. Response within 24 hours.',
    url: `${SITE_URL}/rfq`,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} RFQ` }],
  },
  alternates: {
    canonical: `${SITE_URL}/rfq`,
  },
};

export default function RFQLayout({ children }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Request for Quote' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
