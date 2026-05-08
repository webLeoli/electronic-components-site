'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="footer" id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" style={{ fontSize: '22px', marginBottom: '4px' }}>
              <div className="logo-icon">F</div>
              FPGA<span style={{ color: 'var(--color-accent)' }}>Center</span>
            </Link>
            <p>
              Your trusted source for hard-to-find and obsolete electronic components.
              Thousands of parts available with no minimum order quantity.
              Quality assured through rigorous inspection and testing.
            </p>
          </div>

          <div className="footer-col">
            <h4>Products</h4>
            <Link href="/category/embedded">Embedded & Programmable</Link>
            <Link href="/category/power-management">Power Management</Link>
            <Link href="/category/memory">Memory ICs</Link>
            <Link href="/category/analog">Analog & Mixed Signal</Link>
            <Link href="/category/logic">Logic ICs</Link>
            <Link href="/category/interface">Interface & Communication</Link>
            <Link href="/category">All Categories</Link>
          </div>

          <div className="footer-col">
            <h4>Services</h4>
            <Link href="/rfq">Request a Quote</Link>
            <Link href="/bom">BOM Tool</Link>
            <Link href="/search">Part Search</Link>
            <Link href="/manufacturers">Manufacturers</Link>
            <Link href="/blog">Technical Articles</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/quality">Quality Assurance</Link>
            <Link href="/shipping">Shipping Info</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} FPGACenter. All rights reserved.</div>
          <div className="footer-certs">
            <span className="footer-cert">ISO 9001</span>
            <span className="footer-cert">IDEA-STD-1010</span>
            <span className="footer-cert">ERAI Member</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

