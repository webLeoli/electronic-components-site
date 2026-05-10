import './globals.css';
import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrackingProvider from '@/components/TrackingProvider';
import FloatingRfqButton from '@/components/FloatingRfqButton';
import CodeInjection from '@/components/CodeInjection';
import { RfqCartProvider } from '@/lib/rfq-cart';
import { SITE_NAME, SITE_DESC, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: {
    default: `${SITE_NAME} - Hard-to-Find & Obsolete Electronic Components`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),

  openGraph: {
    title: `${SITE_NAME} - Hard-to-Find & Obsolete Electronic Components`,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',

  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Hard-to-Find & Obsolete Electronic Components`,
    description: SITE_DESC,

  },
  // robots.txt is handled by src/app/robots.js
  // Note: do NOT set alternates.canonical here — it would be inherited by all
  // child pages as the homepage URL, causing massive canonical conflicts.
  // Each page sets its own canonical via page-level metadata.
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* DNS prefetch + preconnect for fastest possible font delivery */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload font CSS → browser starts download before parser reaches stylesheet link */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        {/* Site navigation schema for Google sitelinks accuracy */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SiteNavigationElement',
          name: [
            'Electronic Component Categories',
            'Request for Quote',
            'BOM Quote Tool',
            'Manufacturers',
            'Technical Articles',
            'Quality Assurance',
            'About Us',
            'Contact Us',
          ],
          url: [
            `${SITE_URL}/category`,
            `${SITE_URL}/rfq`,
            `${SITE_URL}/bom`,
            `${SITE_URL}/manufacturers`,
            `${SITE_URL}/blog`,
            `${SITE_URL}/quality`,
            `${SITE_URL}/about`,
            `${SITE_URL}/contact`,
          ],
        })}} />
        <Suspense fallback={null}>
          <CodeInjection />
        </Suspense>
      </head>
      <body suppressHydrationWarning>
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
