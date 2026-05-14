import ContactForm from './ContactForm';
import { SITE_NAME, SITE_URL, generateOrganizationJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Contact Us',
  description: 'Contact FPGACenter for electronic component sourcing, pricing inquiries, and technical support. Reach us by email, phone, or WhatsApp. Offices in Shenzhen and Hong Kong.',
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: 'Contact FPGACenter for electronic component sourcing, pricing inquiries, and technical support. Reach us by email, phone, or WhatsApp.',
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Contact` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contact Us | ${SITE_NAME}`,
    description: 'Contact FPGACenter for electronic component sourcing, pricing inquiries, and technical support.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: { canonical: `${SITE_URL}/contact` },
};

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

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <ContactForm />
    </>
  );
}
