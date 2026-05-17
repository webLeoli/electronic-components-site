/**
 * Email Service — FPGACenter
 * 
 * Provides email sending capabilities via SMTP (nodemailer).
 * Configure SMTP settings in .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ADMIN_EMAIL
 * 
 * If SMTP is not configured, all send operations silently skip.
 */

import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null; // SMTP not configured
  }

  const port = parseInt(process.env.SMTP_PORT || '587');

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  return _transporter;
}

/**
 * Send an email with retry. Silently skips if SMTP is not configured.
 */
export async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] SMTP not configured, skipping:', subject);
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"FPGACenter" <noreply@fpgacenter.com>`,
    to,
    subject,
    text,
    html,
  };

  // Retry up to 2 times with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log('[Email] Sent successfully:', subject);
      return true;
    } catch (err) {
      if (attempt < 2) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`[Email] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err.message);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('[Email] All retries exhausted:', err.message);
        return false;
      }
    }
  }
  return false;
}

/**
 * Escape HTML special characters to prevent injection in email templates.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send RFQ notification to admin
 */
export async function sendRfqNotification(rfq) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;

  const parts = (() => {
    try { return JSON.parse(rfq.parts || '[]'); } catch { return []; }
  })();

  const partsText = parts.map(p =>
    `  • ${p.partNumber}${p.manufacturer ? ` (${p.manufacturer})` : ''} — Qty: ${p.qty || 'N/A'}`
  ).join('\n');

  const partsHtml = parts.map(p =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-weight:600">${escapeHtml(p.partNumber)}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(p.manufacturer) || '—'}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(p.qty) || 'N/A'}</td></tr>`
  ).join('');

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

  const text = `New Quote Request\n\n` +
    `Name: ${rfq.name}\n` +
    `Email: ${rfq.email}\n` +
    `Company: ${rfq.company || 'N/A'}\n` +
    `Phone: ${rfq.phone || 'N/A'}\n` +
    `Country: ${rfq.country || 'N/A'}\n\n` +
    `Parts Requested (${parts.length}):\n${partsText}\n\n` +
    `Message: ${rfq.message || 'None'}\n\n` +
    (rfq.bomFile ? `BOM File: ${rfq.bomFileName || 'Attached'} (download from Admin Panel)\n\n` : '') +
    `---\nView in Admin: ${siteUrl}/admin/rfq`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px">
      <div style="background:#0B1426;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:18px">📋 New RFQ Submission</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:0.8">${parts.length} part(s) requested</p>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h3 style="margin:0 0 12px;font-size:15px;color:#374151">Contact Information</h3>
        <table style="width:100%;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:4px 0;color:#6b7280;width:100px">Name</td><td style="padding:4px 0;font-weight:600">${escapeHtml(rfq.name)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Email</td><td style="padding:4px 0"><a href="mailto:${escapeHtml(rfq.email)}" style="color:#FF6B00">${escapeHtml(rfq.email)}</a></td></tr>
          ${rfq.company ? `<tr><td style="padding:4px 0;color:#6b7280">Company</td><td style="padding:4px 0">${escapeHtml(rfq.company)}</td></tr>` : ''}
          ${rfq.phone ? `<tr><td style="padding:4px 0;color:#6b7280">Phone</td><td style="padding:4px 0">${escapeHtml(rfq.phone)}</td></tr>` : ''}
          ${rfq.country ? `<tr><td style="padding:4px 0;color:#6b7280">Country</td><td style="padding:4px 0">${escapeHtml(rfq.country)}</td></tr>` : ''}
        </table>

        <h3 style="margin:0 0 12px;font-size:15px;color:#374151">Parts Requested</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Part Number</th>
            <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Manufacturer</th>
            <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Qty</th>
          </tr></thead>
          <tbody>${partsHtml}</tbody>
        </table>

        ${rfq.message ? `<h3 style="margin:0 0 8px;font-size:15px;color:#374151">Message</h3><p style="font-size:14px;color:#4b5563;background:#f9fafb;padding:12px;border-radius:6px">${escapeHtml(rfq.message)}</p>` : ''}

        ${rfq.bomFile ? `<div style="margin-top:12px;padding:12px;background:#FFF7ED;border:1px solid #FFEDD5;border-radius:6px"><p style="margin:0;font-size:14px;color:#9A3412">📎 <strong>BOM File Uploaded:</strong> ${escapeHtml(rfq.bomFileName) || 'BOM file attached'} — <a href="${siteUrl}/admin/rfq" style="color:#FF6B00">Download from Admin Panel</a></p></div>` : ''}

        <div style="margin-top:24px;text-align:center">
          <a href="${siteUrl}/admin/rfq" style="display:inline-block;padding:10px 24px;background:#FF6B00;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
            View in Admin Panel →
          </a>
        </div>
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">
        FPGACenter — Electronic Component Sourcing
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[FPGACenter] New RFQ from ${rfq.name} (${parts.length} parts)`,
    text,
    html,
  });
}

/**
 * Send RFQ confirmation to customer
 */
export async function sendRfqConfirmation(rfq) {
  const parts = (() => {
    try { return JSON.parse(rfq.parts || '[]'); } catch { return []; }
  })();

  const partsHtml = parts.map(p =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace">${escapeHtml(p.partNumber)}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(p.manufacturer) || '—'}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(p.qty) || 'N/A'}</td></tr>`
  ).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px">
      <div style="background:#0B1426;color:white;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="margin:0;font-size:20px">✅ Quote Request Received</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <p style="font-size:15px;color:#374151">Hi ${escapeHtml(rfq.name)},</p>
        <p style="font-size:14px;color:#4b5563;line-height:1.7">
          Thank you for your quote request. Our procurement team has received your inquiry for
          <strong>${parts.length} part(s)</strong>${rfq.bomFile ? ' along with your uploaded BOM file' : ''} and will respond within <strong>24 hours</strong>.
        </p>

        <h3 style="margin:20px 0 12px;font-size:15px;color:#374151">Your Requested Parts</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Part Number</th>
            <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Manufacturer</th>
            <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Qty</th>
          </tr></thead>
          <tbody>${partsHtml}</tbody>
        </table>

        <div style="margin-top:24px;padding:16px;background:#FFF7ED;border:1px solid #FFEDD5;border-radius:6px">
          <p style="margin:0;font-size:14px;color:#9A3412">
            <strong>Reference ID:</strong> RFQ-${String(rfq.id).padStart(6, '0')}<br>
            Please use this reference when contacting us about this request.
          </p>
        </div>

        <p style="font-size:14px;color:#4b5563;margin-top:20px;line-height:1.7">
          If you have any questions, reply to this email or contact us at
          <a href="mailto:sales@fpgacenter.com" style="color:#FF6B00">sales@fpgacenter.com</a>.
        </p>
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">
        FPGACenter — Electronic Component Sourcing<br>
        <a href="${process.env.SITE_URL || 'https://fpgacenter.com'}" style="color:#9ca3af">fpgacenter.com</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: rfq.email,
    subject: `Your Quote Request RFQ-${String(rfq.id).padStart(6, '0')} — FPGACenter`,
    text: `Hi ${rfq.name},\n\nThank you for your quote request for ${parts.length} part(s). Our team will respond within 24 hours.\n\nReference ID: RFQ-${String(rfq.id).padStart(6, '0')}\n\nBest regards,\nFPGACenter Team`,
    html,
  });
}
