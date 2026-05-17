import './globals.css';
import { Suspense } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrackingProvider from '@/components/TrackingProvider';
import FloatingRfqButton from '@/components/FloatingRfqButton';
import CodeInjection from '@/components/CodeInjection';
import { RfqCartProvider } from '@/lib/rfq-cart';
import { SITE_NAME, SITE_DESC, SITE_URL, SITE_TAGLINE } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport = {
  themeColor: '#3B82F6',
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
        {/* Preload font CSS → browser starts download before parser reaches stylesheet link */}
        <link rel="manifest" href="/manifest.webmanifest" />
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
      <body suppressHydrationWarning className={`${inter.variable} ${jetBrainsMono.variable}`}>
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
