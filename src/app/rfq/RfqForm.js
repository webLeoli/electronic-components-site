'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRfqCart } from '@/lib/rfq-cart';
import { getTrackingData, resetBehaviorData } from '@/lib/tracker';

export default function RfqForm() {
  const searchParams = useSearchParams();
  const prefilledPart = searchParams.get('part') || '';
  const { items: cartItems, removeItem, clearCart, addItem, count } = useRfqCart();
  const fileInputRef = useRef(null);

  // Local form lines — initialized from cart
  const [lines, setLines] = useState([]);
  const [contact, setContact] = useState({ name: '', email: '', company: '', phone: '', country: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Anti-spam: bots fill this
  const [loadTime, setLoadTime] = useState(0); // Anti-spam: time check

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadTime(Date.now());
  }, []);
  const [bomFile, setBomFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Sync cart items into lines on mount
  useEffect(() => {
    if (initialized) return;

    let initialLines = [];

    if (cartItems.length > 0) {
      // Use cart items as the starting lines
      initialLines = cartItems.map(item => ({
        partNumber: item.partNumber || '',
        manufacturer: item.manufacturer || '',
        qty: item.qty ? String(item.qty) : '',
        targetPrice: item.targetPrice || '',
      }));
    }

    // If a part was passed via URL and isn't already in cart
    if (prefilledPart) {
      const exists = initialLines.some(
        line => line.partNumber.toUpperCase() === prefilledPart.toUpperCase()
      );
      if (!exists) {
        initialLines.push({ partNumber: prefilledPart, manufacturer: '', qty: '', targetPrice: '' });
        // Also add to global cart
        addItem(prefilledPart);
      }
    }

    // Always have at least one empty line
    if (initialLines.length === 0) {
      initialLines = [{ partNumber: '', manufacturer: '', qty: '', targetPrice: '' }];
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(initialLines);
    setInitialized(true);
  }, [cartItems, prefilledPart, initialized, addItem]);

  const addLine = () => {
    setLines([...lines, { partNumber: '', manufacturer: '', qty: '', targetPrice: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
      // Also remove from cart if it was a cart item
      if (index < count) {
        removeItem(index);
      }
    }
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  // BOM file handling
  const BOM_ALLOWED = ['.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx', '.txt'];
  const BOM_MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleBomFile = (file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!BOM_ALLOWED.includes(ext)) {
      setSubmitError(`Invalid file type "${ext}". Allowed: ${BOM_ALLOWED.join(', ')}`);
      return;
    }
    if (file.size > BOM_MAX_SIZE) {
      setSubmitError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB.`);
      return;
    }
    setSubmitError('');
    setBomFile(file);
  };

  const dragCounter = useRef(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter') {
      dragCounter.current++;
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragActive(false);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBomFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'xlsx': case 'xls': return '📊';
      case 'csv': return '📋';
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      default: return '📎';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    // Filter out empty lines
    const validLines = lines.filter(l => l.partNumber.trim());
    if (validLines.length === 0) {
      setSubmitting(false);
      setSubmitError('Please add at least one part number.');
      return;
    }

    try {
      // Collect tracking data
      const trackingPayload = getTrackingData();

      // Use FormData to support file upload
      const formData = new FormData();
      formData.append('name', contact.name);
      formData.append('email', contact.email);
      formData.append('company', contact.company || '');
      formData.append('phone', contact.phone || '');
      formData.append('country', contact.country || '');
      formData.append('message', contact.message || '');
      formData.append('parts', JSON.stringify(validLines));
      formData.append('website', honeypot); // Honeypot field
      formData.append('_loadTime', String(loadTime)); // Time check
      formData.append('_tracking', JSON.stringify(trackingPayload)); // Traffic source data

      // Attach BOM file if present
      if (bomFile) {
        formData.append('bomFile', bomFile);
      }

      const res = await fetch('/api/rfq', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        resetBehaviorData(); // Clear behavior tracking after submission
        setSubmitted(true);
      } else if (res.status === 429) {
        setSubmitError('You have submitted too many requests. Please try again later.');
      } else {
        setSubmitError(data.error || 'Failed to submit. Please try again.');
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
            Quote Request Submitted!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-xl)', lineHeight: 1.7 }}>
            Thank you for your inquiry. Our procurement team will review your request and respond within <strong>24 hours</strong> with pricing and availability.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button onClick={() => { setSubmitted(false); setLines([{ partNumber: '', manufacturer: '', qty: '', targetPrice: '' }]); setContact({ name: '', email: '', company: '', phone: '', country: '', message: '' }); setBomFile(null); setInitialized(true); }}
              className="btn btn-primary">
              Submit Another Quote
            </button>
            <Link href="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Request for Quote</span>
      </nav>

      {/* Page Header */}
      <div className="rfq-header">
        <div>
          <div className="eyebrow">Procurement request</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
            Request for Quote
            {count > 0 && (
              <span className="rfq-cart-count-header">
                {count} {count === 1 ? 'part' : 'parts'} in your inquiry
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', maxWidth: '600px', lineHeight: 1.7 }}>
            Can&apos;t find what you need? Submit a quote request and our procurement team will
            source it for you — including hard-to-find, obsolete, and end-of-life components.
          </p>
        </div>
        <div className="rfq-benefits">
          <div className="rfq-benefit"><span>24h</span> Target response</div>
          <div className="rfq-benefit"><span>BOM</span> Multi-line quoting</div>
          <div className="rfq-benefit"><span>QA</span> Quality review</div>
        </div>
      </div>

      <div className="rfq-layout">
      <form onSubmit={handleSubmit} id="rfq-form" className="rfq-form-main">
        {/* Anti-spam honeypot — invisible to humans, bots auto-fill it */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
        </div>

        {submitError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px' }}>
            ⚠️ {submitError}
          </div>
        )}
        {/* Part Lines */}
        <div className="rfq-section">
          <h2 className="rfq-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Parts Required
            {lines.filter(l => l.partNumber.trim()).length > 0 && (
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                ({lines.filter(l => l.partNumber.trim()).length} items)
              </span>
            )}
          </h2>

          <div className="rfq-parts-header">
            <span className="rfq-col-label" style={{ flex: 2 }}>Part Number *</span>
            <span className="rfq-col-label" style={{ flex: 1.5 }}>Manufacturer</span>
            <span className="rfq-col-label" style={{ flex: 1 }}>Quantity *</span>
            <span className="rfq-col-label" style={{ flex: 1 }}>Target Price (USD)</span>
            <span className="rfq-col-label" style={{ width: '40px' }}></span>
          </div>

          {lines.map((line, i) => (
            <div key={i} className={`rfq-part-row ${i < count ? 'from-cart' : ''}`}>
              {i < count && (
                <div className="rfq-cart-badge" title="Added from product browsing">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <input
                type="text"
                className="input"
                placeholder="e.g. STM32F103C8T6"
                value={line.partNumber}
                onChange={(e) => updateLine(i, 'partNumber', e.target.value)}
                required
                style={{ flex: 2 }}
                id={`part-number-${i}`}
              />
              <input
                type="text"
                className="input"
                placeholder="e.g. STMicroelectronics"
                value={line.manufacturer}
                onChange={(e) => updateLine(i, 'manufacturer', e.target.value)}
                style={{ flex: 1.5 }}
              />
              <input
                type="number"
                className="input"
                placeholder="Qty"
                value={line.qty}
                onChange={(e) => updateLine(i, 'qty', e.target.value)}
                required
                min="1"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                className="input"
                placeholder="$ Target"
                value={line.targetPrice}
                onChange={(e) => updateLine(i, 'targetPrice', e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-icon-danger"
                onClick={() => removeLine(i)}
                disabled={lines.length === 1}
                style={{ width: '40px', flexShrink: 0 }}
                aria-label="Remove line"
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={addLine} id="add-line-btn">
              + Add Another Part
            </button>
            {count > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { clearCart(); setLines([{ partNumber: '', manufacturer: '', qty: '', targetPrice: '' }]); }}
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* BOM File Upload */}
        <div className="rfq-section">
          <h2 className="rfq-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload BOM File
            <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
              (Optional)
            </span>
          </h2>

          <p className="rfq-bom-description">
            Have a Bill of Materials? Upload your BOM file and our team will quote all items at once.
            This is especially useful for large orders with many components.
          </p>

          {!bomFile ? (
            <div
              className={`rfq-bom-dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              id="bom-upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleBomFile(e.target.files?.[0])}
                style={{ display: 'none' }}
                id="bom-file-input"
              />
              <div className="rfq-bom-dropzone-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="rfq-bom-dropzone-text">
                <strong>Drag & drop your BOM file here</strong>
                <span>or click to browse</span>
              </div>
              <div className="rfq-bom-dropzone-formats">
                Supported: Excel (.xlsx, .xls), CSV, PDF, Word, TXT — Max 10MB
              </div>
            </div>
          ) : (
            <div className="rfq-bom-file-preview">
              <div className="rfq-bom-file-info">
                <span className="rfq-bom-file-icon">{getFileIcon(bomFile.name)}</span>
                <div className="rfq-bom-file-details">
                  <span className="rfq-bom-file-name">{bomFile.name}</span>
                  <span className="rfq-bom-file-size">{formatFileSize(bomFile.size)}</span>
                </div>
              </div>
              <button
                type="button"
                className="rfq-bom-file-remove"
                onClick={() => { setBomFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                aria-label="Remove file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="rfq-section">
          <h2 className="rfq-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Contact Information
          </h2>

          <div className="rfq-contact-grid">
            <div className="rfq-field">
              <label className="rfq-label" htmlFor="contact-name">Full Name *</label>
              <input
                type="text"
                className="input"
                id="contact-name"
                placeholder="Your full name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                required
              />
            </div>
            <div className="rfq-field">
              <label className="rfq-label" htmlFor="contact-email">Email *</label>
              <input
                type="email"
                className="input"
                id="contact-email"
                placeholder="your@email.com"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
              />
            </div>
            <div className="rfq-field">
              <label className="rfq-label" htmlFor="contact-company">Company</label>
              <input
                type="text"
                className="input"
                id="contact-company"
                placeholder="Company name"
                value={contact.company}
                onChange={(e) => setContact({ ...contact, company: e.target.value })}
              />
            </div>
            <div className="rfq-field">
              <label className="rfq-label" htmlFor="contact-phone">Phone</label>
              <input
                type="tel"
                className="input"
                id="contact-phone"
                placeholder="+1 234 567 8900"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            <div className="rfq-field" style={{ gridColumn: 'span 2' }}>
              <label className="rfq-label" htmlFor="contact-country">Country / Region</label>
              <select
                className="input"
                id="contact-country"
                value={contact.country}
                onChange={(e) => setContact({ ...contact, country: e.target.value })}
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="CN">China</option>
                <option value="DE">Germany</option>
                <option value="GB">United Kingdom</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="IN">India</option>
                <option value="BR">Brazil</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="MX">Mexico</option>
                <option value="TW">Taiwan</option>
                <option value="SG">Singapore</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Enhanced message / additional notes area */}
          <div className="rfq-field" style={{ marginTop: 'var(--space-lg)' }}>
            <label className="rfq-label" htmlFor="contact-message">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Additional Message
            </label>
            <p className="rfq-message-hint">
              Tell us about your project requirements, preferred conditions, or any special needs.
              The more details you provide, the more accurate our quote will be.
            </p>
            <textarea
              className="input"
              id="contact-message"
              placeholder="For example:&#10;• Project timeline and delivery schedule&#10;• Preferred packaging (tape & reel, tray, tube, etc.)&#10;• Quality standards required (automotive, military, commercial)&#10;• Any alternative part numbers acceptable&#10;• Volume pricing inquiry for future orders&#10;• Urgency level (standard, expedited, hot)"
              rows={6}
              value={contact.message}
              onChange={(e) => setContact({ ...contact, message: e.target.value })}
              style={{ resize: 'vertical', minHeight: '140px' }}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="rfq-submit-area">
          <div className="rfq-submit-info">
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              By submitting, you agree to our <Link href="/terms" style={{ color: 'var(--color-accent)' }}>Terms &amp; Conditions</Link> and <Link href="/privacy" style={{ color: 'var(--color-accent)' }}>Privacy Policy</Link>.
            </p>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            id="rfq-submit-btn"
            style={{ minWidth: '200px' }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" /> Submitting...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Submit Quote Request ({lines.filter(l => l.partNumber.trim()).length} {lines.filter(l => l.partNumber.trim()).length === 1 ? 'part' : 'parts'}{bomFile ? ' + BOM' : ''})
              </span>
            )}
          </button>
        </div>
      </form>

      <aside className="rfq-side-panel">
        <div className="rfq-side-card">
          <h2>What improves quote accuracy</h2>
          <ul>
            <li>Exact part number and manufacturer</li>
            <li>Required quantity, target price, and date code</li>
            <li>Package preference, MOQ flexibility, or approved alternates</li>
            <li>BOM file for multi-line or production orders</li>
          </ul>
        </div>
        <div className="rfq-side-card accent">
          <h2>Response includes</h2>
          <p>Stock confirmation, lead time, MOQ, quote options, and sourcing notes for obsolete or constrained components.</p>
        </div>
      </aside>
      </div>
    </div>
  );
}
