import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="container">
        <div className="footer-rfq-band">
          <div>
            <h2>Need price, stock, or alternates?</h2>
            <p>Send one part number or a full BOM. We will verify availability, lead time, MOQ, and quote options.</p>
          </div>
          <div className="footer-rfq-actions">
            <Link href="/rfq" className="btn btn-primary">Request Quote</Link>
            <Link href="/bom" className="btn btn-secondary">Upload BOM</Link>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo footer-logo">
              <div className="logo-icon">F</div>
              FPGA<span>Center</span>
            </Link>
            <p>
              B2B sourcing support for hard-to-find, obsolete, and production-critical
              electronic components. Send part numbers or a BOM and our procurement
              team will verify availability, lead time, and quote options.
            </p>
            <div className="footer-trust-row">
              <span>ISO 9001</span>
              <span>IDEA-STD-1010</span>
              <span>Traceability</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Products</h4>
            <Link href="/category/embedded">Embedded &amp; Programmable</Link>
            <Link href="/category/power-management">Power Management</Link>
            <Link href="/category/memory">Memory ICs</Link>
            <Link href="/category/analog">Analog &amp; Mixed Signal</Link>
            <Link href="/category/interface">Interface &amp; Communication</Link>
            <Link href="/category">All Categories</Link>
          </div>

          <div className="footer-col">
            <h4>Procurement</h4>
            <Link href="/rfq">Request a Quote</Link>
            <Link href="/bom">Upload BOM</Link>
            <Link href="/search">Part Search</Link>
            <Link href="/manufacturers">Manufacturers</Link>
            <Link href="/quality">Quality Assurance</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Sales</Link>
            <Link href="/shipping">Shipping Info</Link>
            <Link href="/blog">Technical Articles</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div>Copyright {new Date().getFullYear()} FPGACenter. All rights reserved.</div>
          <div className="footer-certs">
            <span className="footer-cert">24h RFQ Response</span>
            <span className="footer-cert">Global Sourcing</span>
            <span className="footer-cert">Original Parts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
