import { Suspense } from 'react';
import RfqForm from './RfqForm';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Request for Quote',
  description: 'Can\'t find the electronic components you need? Submit a quote request and our global procurement team will source hard-to-find, obsolete, and end-of-life parts. Response within 24 hours.',
  openGraph: {
    title: `Request for Quote | ${SITE_NAME}`,
    description: 'Can\'t find the electronic components you need? Submit a quote request and our global procurement team will source hard-to-find, obsolete, and end-of-life parts.',
    url: `${SITE_URL}/rfq`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} RFQ` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Request for Quote | ${SITE_NAME}`,
    description: 'Submit a quote request for hard-to-find electronic components. Response within 24 hours.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: { canonical: `${SITE_URL}/rfq` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Request for Quote' },
  ],
};

export default function RFQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📋</div>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading quote form...</p>
        </div>
      }>
        <RfqForm />
      </Suspense>
    </>
  );
}
