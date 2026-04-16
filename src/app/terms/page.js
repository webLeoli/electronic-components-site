import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Read the terms and conditions governing the use of FPGACenter services, product sales, returns, and warranties.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Terms & Conditions | ${SITE_NAME}`,
    description: 'Terms and conditions for FPGACenter electronic component distribution services.',
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
  },
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using the FPGACenter website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services. These terms apply to all visitors, users, and customers of FPGACenter.`,
  },
  {
    title: '2. Products and Services',
    content: `FPGACenter provides electronic component distribution services, including but not limited to the sale of integrated circuits, semiconductors, passive components, and related electronic parts. All products listed on our website are subject to availability. We reserve the right to discontinue or modify any product listing without prior notice. Product specifications are provided for reference and should be verified against manufacturer datasheets.`,
  },
  {
    title: '3. Pricing and Payment',
    content: `All prices listed are in US Dollars (USD) unless otherwise stated. Prices are subject to change without notice. Quoted prices are valid for the duration specified in the quotation (typically 3 business days unless otherwise stated). Payment terms are Net 30 for approved accounts; new customers may be required to prepay. Accepted payment methods include wire transfer, credit card, and PayPal. All prices are exclusive of applicable taxes, duties, and shipping charges unless explicitly stated otherwise.`,
  },
  {
    title: '4. Orders and Fulfillment',
    content: `Orders are confirmed only upon written acknowledgment from FPGACenter. We reserve the right to accept or reject any order. Minimum order quantities (MOQ) may apply to certain products. Lead times are estimates and not guarantees. FPGACenter is not liable for delays caused by factors beyond our control, including but not limited to supplier delays, natural disasters, or shipping carrier issues. Orders cannot be cancelled after shipment.`,
  },
  {
    title: '5. Shipping and Delivery',
    content: `Shipping terms are EXW (Ex Works) unless otherwise agreed. Risk of loss passes to the buyer upon delivery to the carrier. FPGACenter offers various shipping methods including DHL, FedEx, UPS, and sea freight. Shipping costs are calculated based on weight, dimensions, and destination. Insurance coverage is included at no additional charge for all shipments. See our Shipping page for detailed delivery information.`,
  },
  {
    title: '6. Returns and Refunds',
    content: `Returns are accepted within 30 days of delivery for products in their original, unopened condition. A Return Merchandise Authorization (RMA) number must be obtained before returning any product. Custom or special-order items are non-returnable. Refunds are processed within 10 business days after receiving and inspecting the returned product. Return shipping costs are the responsibility of the buyer unless the return is due to our error. Components that have been soldered, modified, or damaged are not eligible for return.`,
  },
  {
    title: '7. Warranty',
    content: `FPGACenter warrants that all products sold are authentic and conform to manufacturer specifications. Our standard warranty period is 90 days from the date of delivery. We do not warrant products against misuse, unauthorized modification, or damage caused by improper handling. In no event shall FPGACenter's liability exceed the purchase price of the product. Warranty claims must be submitted in writing with supporting documentation.`,
  },
  {
    title: '8. Quality Assurance',
    content: `All products undergo inspection and testing in accordance with our ISO 9001:2015 quality management system. Components are sourced from authorized distributors, original manufacturers, and vetted independent suppliers. We maintain full traceability documentation for all products. Certificates of Conformance (CoC) are available upon request. Counterfeit components are strictly prohibited in our supply chain.`,
  },
  {
    title: '9. Intellectual Property',
    content: `All content on the FPGACenter website, including text, graphics, logos, and software, is the property of FPGACenter or its content suppliers and is protected by intellectual property laws. Product names, logos, and trademarks mentioned on this website belong to their respective manufacturers. Use of any content from this website without written permission is strictly prohibited.`,
  },
  {
    title: '10. Limitation of Liability',
    content: `FPGACenter shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services. Our total liability for any claim shall not exceed the amount paid by you for the specific product giving rise to such claim. We are not responsible for compatibility issues with third-party products or systems.`,
  },
  {
    title: '11. Export Compliance',
    content: `Customers are responsible for compliance with all applicable export control laws and regulations. Certain electronic components may be subject to export restrictions under EAR (Export Administration Regulations) or ITAR (International Traffic in Arms Regulations). It is the buyer's responsibility to obtain any necessary export licenses or permits. FPGACenter reserves the right to refuse orders that may violate export control regulations.`,
  },
  {
    title: '12. Modifications',
    content: `FPGACenter reserves the right to modify these Terms and Conditions at any time. Changes will be posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the modified terms.`,
  },
];

export default function TermsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Terms & Conditions' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Terms & Conditions</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: 'var(--space-sm)' }}>
          Terms & Conditions
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)', fontSize: '14px' }}>
          Last updated: March 15, 2026 • Effective immediately
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {SECTIONS.map((section, i) => (
            <div key={i}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                {section.title}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Questions About Our Terms?</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>Contact our legal team for clarification on any of these terms.</p>
          <Link href="/contact" className="btn btn-primary">Contact Us</Link>
        </div>
      </div>
    </div>
    </>
  );
}
