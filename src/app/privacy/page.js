import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how FPGACenter collects, uses, and protects your personal information. Our commitment to data privacy and GDPR compliance.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: 'How FPGACenter collects, uses, and protects your personal information. GDPR & CCPA compliant.',
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
  },
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect information that you voluntarily provide to us, including:\n\n• **Contact Information**: Name, email address, phone number, and company name when you submit an RFQ, register an account, or contact us.\n• **Order Information**: Billing and shipping addresses, payment details, and order history.\n• **Communication Data**: Messages, inquiries, and support correspondence.\n• **Usage Data**: IP address, browser type, pages visited, referring URL, device information, and cookies (see Section 5).\n\nWe do not collect sensitive personal information such as social security numbers, genetic data, or biometric data.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information for the following purposes:\n\n• **Order Processing**: To process your orders, send confirmations, and provide shipping updates.\n• **Quote Requests**: To respond to RFQ submissions with pricing and availability.\n• **Customer Support**: To address your questions, concerns, and technical inquiries.\n• **Service Improvement**: To analyze usage patterns and improve our website and services.\n• **Marketing**: To send newsletters and product updates (only with your consent, and you can unsubscribe at any time).\n• **Legal Compliance**: To comply with applicable laws, regulations, and legal processes.`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n\n• **Service Providers**: With trusted third-party service providers who assist us in operating our business (shipping carriers, payment processors, email providers). These providers are contractually obligated to protect your data.\n• **Legal Requirements**: When required by law, court order, or government regulation.\n• **Business Transfers**: In connection with a merger, acquisition, or sale of assets.\n• **Consent**: When you explicitly authorize us to share your information.`,
  },
  {
    title: '4. Data Security',
    content: `We implement industry-standard security measures to protect your personal information:\n\n• TLS/SSL encryption for all data transmissions\n• Encrypted storage for sensitive data\n• Access controls and authentication for internal systems\n• Regular security audits and vulnerability assessments\n• Employee training on data privacy and security practices\n\nWhile we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but commit to promptly notifying you of any data breach that may affect your personal information.`,
  },
  {
    title: '5. Cookies and Tracking',
    content: `Our website uses cookies and similar technologies to enhance your experience:\n\n• **Essential Cookies**: Necessary for website functionality (session management, authentication).\n• **Analytics Cookies**: Help us understand how visitors use our site (Google Analytics). These collect anonymized data.\n• **Preference Cookies**: Remember your settings and preferences.\n\nYou can control cookies through your browser settings. Disabling cookies may affect some website functionality. We do not use cookies for targeted advertising.`,
  },
  {
    title: '6. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal data:\n\n• **Access**: Request a copy of the personal data we hold about you.\n• **Correction**: Request correction of inaccurate or incomplete data.\n• **Deletion**: Request deletion of your personal data (subject to legal requirements).\n• **Portability**: Request a machine-readable copy of your data.\n• **Objection**: Object to the processing of your data for specific purposes.\n• **Withdrawal**: Withdraw consent for marketing communications at any time.\n\nTo exercise any of these rights, please contact us at privacy@fpgacenter.com.`,
  },
  {
    title: '7. Data Retention',
    content: `We retain your personal information for as long as necessary to fulfill the purposes described in this policy:\n\n• **Account Data**: Retained while your account is active, plus 3 years after account closure.\n• **Order Records**: Retained for 7 years for tax and legal compliance.\n• **RFQ Data**: Retained for 2 years after the last interaction.\n• **Marketing Preferences**: Until you unsubscribe or request deletion.\n• **Website Analytics**: Anonymized data retained for 26 months.`,
  },
  {
    title: '8. International Data Transfers',
    content: `FPGACenter operates globally with offices in China, Hong Kong, and the United States. Your data may be transferred to and processed in countries outside of your home country. We ensure appropriate safeguards are in place for international data transfers, including Standard Contractual Clauses approved by relevant data protection authorities.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a minor, we will promptly delete it.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We will notify you of material changes via email or a prominent notice on our website. We encourage you to review this policy periodically.`,
  },
  {
    title: '11. Contact Us',
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us:\n\n• **Email**: privacy@fpgacenter.com\n• **Mail**: FPGACenter Data Protection Officer, Nanshan District, Shenzhen, China\n• For EU residents, you also have the right to lodge a complaint with your local data protection authority.`,
  },
];

/**
 * Renders text with **bold** markdown and \n newlines safely.
 * Uses regex to split on paired ** markers — avoids misalignment from odd counts.
 */
function RichText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => {
        const parts = [];
        let key = 0;
        const re = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = re.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
          }
          parts.push(<strong key={key++}>{match[1]}</strong>);
          lastIndex = re.lastIndex;
        }
        if (lastIndex < line.length) {
          parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
        }
        return (
          <span key={li} style={{ display: 'block', minHeight: line === '' ? '8px' : undefined }}>
            {parts.length > 0 ? parts : line}
          </span>
        );
      })}
    </>
  );
}

export default function PrivacyPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Privacy Policy</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: 'var(--space-sm)' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)', fontSize: '14px' }}>
          Last updated: March 15, 2026 • GDPR &amp; CCPA Compliant
        </p>

        <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-2xl)', borderColor: 'var(--color-accent)', background: 'rgba(255,107,0,0.03)' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--color-accent)' }}>Summary:</strong> We collect minimal personal information
            necessary to process your orders and inquiries. We never sell your data. You can request access, correction,
            or deletion of your data at any time by contacting privacy@fpgacenter.com.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {SECTIONS.map((section, i) => (
            <div key={i}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                {section.title}
              </h2>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <RichText text={section.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
