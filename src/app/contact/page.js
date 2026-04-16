'use client';

import { useState } from 'react';
import Link from 'next/link';

const CONTACT_INFO = [
  { icon: '✉', label: 'Email', value: 'sales@fpgacenter.com', link: 'mailto:sales@fpgacenter.com' },
  { icon: '☎', label: 'Phone', value: '+852 3008 5028', link: 'tel:+85230085028' },
  { icon: '◆', label: 'WhatsApp', value: '+86 180 2536 8890', link: 'https://wa.me/8618025368890' },
  { icon: '◷', label: 'Business Hours', value: 'Mon-Fri 9:00-18:00 (HKT)', link: null },
];

const OFFICES = [
  { city: 'Shenzhen, China', role: 'Headquarters & Warehouse', address: 'Room 1208, Haisong Bldg, Nanshan District, Shenzhen 518054' },
  { city: 'Hong Kong', role: 'Trading & Logistics', address: 'Unit 12B, Prosperity Centre, 25 Chong Yip St, Kwun Tong' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else if (res.status === 429) {
        setSubmitError('You have sent too many messages. Please try again later.');
      } else {
        setSubmitError(data.error || 'Failed to send message. Please try again.');
      }
    } catch {
      setSubmitError('Connection error. Please check your network and try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)', minHeight: '60vh' }}>
        <div className="rfq-success-card">
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-md)' }}>✅</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>Message Sent!</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', lineHeight: 1.7 }}>
            Thank you for reaching out. Our team will review your message and respond within <strong>24 hours</strong>.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', phone: '', subject: '', message: '' }); }} className="btn btn-primary">
              Send Another Message
            </button>
            <Link href="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Contact Us</span>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: 'var(--space-sm)', textAlign: 'center' }}>
          Get in Touch
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', textAlign: 'center', marginBottom: 'var(--space-2xl)', maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
          Have a question about pricing, availability, or custom sourcing? Our team is here to help.
        </p>

        {/* Contact Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
          {CONTACT_INFO.map((info, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
              <div style={{ fontSize: '28px', marginBottom: 'var(--space-sm)' }}>{info.icon}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>{info.label}</div>
              {info.link ? (
                <a href={info.link} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent)' }}>{info.value}</a>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{info.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="card" style={{ padding: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            📬 Send Us a Message
          </h2>

          <form onSubmit={handleSubmit}>
            {submitError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px' }}>
                ⚠️ {submitError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Full Name *</label>
                <input type="text" className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email *</label>
                <input type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Company</label>
                <input type="text" className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Phone</label>
                <input type="tel" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Subject *</label>
              <select className="input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                <option value="">Select a topic</option>
                <option value="pricing">Pricing & Availability</option>
                <option value="sourcing">Custom Sourcing Request</option>
                <option value="quality">Quality & Compliance</option>
                <option value="shipping">Shipping & Logistics</option>
                <option value="partnership">Business Partnership</option>
                <option value="technical">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Message *</label>
              <textarea className="input" required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us how we can help..." style={{ resize: 'vertical', minHeight: '120px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
                By submitting, you agree to our <Link href="/privacy" style={{ color: 'var(--color-accent)' }}>Privacy Policy</Link>.
                We&apos;ll respond within 24 hours.
              </p>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ minWidth: '180px' }}>
                {submitting ? 'Sending...' : '📨 Send Message'}
              </button>
            </div>
          </form>
        </div>

        {/* Office Locations */}
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
            🌍 Our Offices
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {OFFICES.map((office, i) => (
              <div key={i} className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{office.city}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>{office.role}</div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{office.address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
