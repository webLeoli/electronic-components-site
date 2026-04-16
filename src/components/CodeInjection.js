import { getSettings } from '@/lib/settings';
import Script from 'next/script';

/**
 * Server component that reads code integration settings from DB 
 * and injects GA, GSC, and custom scripts into the page.
 */
export default async function CodeInjection() {
  let settings = {};
  try {
    settings = await getSettings();
  } catch {
    return null;
  }

  // Basic format validation to prevent malformed IDs being injected
  const gaId = /^G-[A-Z0-9]+$/.test(settings.ga_measurement_id || '') ? settings.ga_measurement_id : null;
  const gscVerification = /^[a-zA-Z0-9_-]{10,}$/.test(settings.gsc_verification || '') ? settings.gsc_verification : null;
  const fbPixelId = /^\d{10,20}$/.test(settings.fb_pixel_id || '') ? settings.fb_pixel_id : null;
  const customHeadCode = settings.custom_head_code;

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Google Search Console verification */}
      {gscVerification && (
        <meta name="google-site-verification" content={gscVerification} />
      )}

      {/* Facebook Pixel */}
      {fbPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Custom head code — injected via Script for correct placement */}
      {customHeadCode && (
        <Script id="custom-head-code" strategy="afterInteractive">
          {customHeadCode}
        </Script>
      )}
    </>
  );
}

