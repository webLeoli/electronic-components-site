import { SITE_NAME, SITE_URL, generateOrganizationJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with FPGACenter for pricing, availability, custom sourcing, and technical support. Response within 24 hours. Offices in Shenzhen and Hong Kong.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: 'Contact FPGACenter for electronic component inquiries. Response within 24 hours.',
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `Contact ${SITE_NAME}` }],
  },
};

export default function ContactLayout({ children }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact Us' },
    ],
  };

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE_NAME}`,
    url: `${SITE_URL}/contact`,
    mainEntity: generateOrganizationJsonLd(),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      {children}
    </>
  );
}
