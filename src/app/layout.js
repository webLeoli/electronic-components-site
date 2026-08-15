import './globals.css';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrackingProvider from '@/components/TrackingProvider';
import FloatingRfqButton from '@/components/FloatingRfqButton';
import CodeInjection from '@/components/CodeInjection';
import { RfqCartProvider } from '@/lib/rfq-cart';
import { SITE_NAME, SITE_DESC, SITE_URL, SITE_TAGLINE } from '@/lib/seo';

// No `weight` array: this loads Inter's single variable-font file (all weights
// in one woff2) instead of five separate static-weight files.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),

  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.png`],
  },
  // robots.txt is handled by src/app/robots.txt/route.js
  // Note: do NOT set alternates.canonical here — it would be inherited by all
  // child pages as the homepage URL, causing massive canonical conflicts.
  // Each page sets its own canonical via page-level metadata.
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* DNS prefetch + preconnect for fastest possible font delivery */}
        {/* Preload font CSS → browser starts download before parser reaches stylesheet link */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Site navigation schema for Google sitelinks accuracy */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: [
            ['FPGA & CPLD Sourcing', `${SITE_URL}/fpga-sourcing`],
            ['Robotics Component Sourcing', `${SITE_URL}/robotics-sourcing`],
            ['Electronic Component Categories', `${SITE_URL}/category`],
            ['Request for Quote', `${SITE_URL}/rfq`],
            ['BOM Quote Tool', `${SITE_URL}/bom`],
            ['Manufacturers', `${SITE_URL}/manufacturers`],
            ['Technical Articles', `${SITE_URL}/blog`],
            ['Quality Assurance', `${SITE_URL}/quality`],
            ['About Us', `${SITE_URL}/about`],
            ['Contact Us', `${SITE_URL}/contact`],
          ].map(([name, url], i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'SiteNavigationElement', name, url },
          })),
        })}} />
        <Suspense fallback={null}>
          <CodeInjection />
        </Suspense>
      </head>
      <body suppressHydrationWarning className={inter.variable}>
        <RfqCartProvider>
          <Suspense fallback={null}>
            <TrackingProvider />
          </Suspense>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingRfqButton />
        </RfqCartProvider>
      </body>
    </html>
  );
}
