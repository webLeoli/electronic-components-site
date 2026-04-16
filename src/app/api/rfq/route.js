import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { sendRfqNotification, sendRfqConfirmation } from '@/lib/email';

// Derive a precise channel label from tracking data — 5-layer priority
function deriveSourceChannel(tracking) {
  if (!tracking) return 'direct';

  // LAYER 1: Ad Click IDs (most precise — proves it's a paid click)
  const adClick = tracking.ad_click || tracking.last_ad_click;
  if (adClick && adClick.source) {
    return `${adClick.source}_paid`;
  }

  // LAYER 2: UTM parameters
  const src = (tracking.utm_source || '').toLowerCase();
  const medium = (tracking.utm_medium || '').toLowerCase();
  if (src) {
    if (['cpc', 'ppc', 'paid', 'paid_social'].includes(medium)) return `${src}_paid`;
    if (medium === 'email') return `${src}_email`;
    if (['social', 'paid_social'].includes(medium)) return `${src}_social`;
    if (medium === 'organic') return `${src}_organic`;
    if (medium === 'referral') return `${src}_referral`;
    if (medium === 'display') return `${src}_display`;
    if (medium === 'video') return `${src}_video`;
    return `${src}_${medium || 'other'}`;
  }

  // LAYER 3: Client-side parsed referrer (from tracker.js intelligence)
  const parsedRef = tracking.referrer_parsed || tracking.last_referrer_parsed;
  if (parsedRef && parsedRef.channel) {
    return parsedRef.channel;
  }

  // LAYER 4: Raw referrer fallback (server-side parse)
  const ref = tracking.referrer || '';
  if (ref) {
    try {
      const hostname = new URL(ref).hostname.toLowerCase();
      if (/google\./i.test(hostname)) return 'google_organic';
      if (/bing\./i.test(hostname)) return 'bing_organic';
      if (/baidu\./i.test(hostname)) return 'baidu_organic';
      if (/yahoo\./i.test(hostname)) return 'yahoo_organic';
      if (/yandex\./i.test(hostname)) return 'yandex_organic';
      if (/facebook|fb\./i.test(hostname)) return 'facebook_social';
      if (/linkedin/i.test(hostname)) return 'linkedin_social';
      if (/twitter|x\.com/i.test(hostname)) return 'twitter_social';
      if (/reddit/i.test(hostname)) return 'reddit_social';
      if (/youtube/i.test(hostname)) return 'youtube_social';
      return `referral_${hostname.replace(/^www\./, '').split('.')[0]}`;
    } catch {}
  }

  // LAYER 5: No attribution data = direct
  return 'direct';
}

// In-memory rate limiter (per IP)  
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 submissions per hour per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  // Clean old entries
  const timestamps = rateLimitMap.get(key).filter(t => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(key, timestamps);
  
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }
  
  timestamps.push(now);
  return true;
}

// Spam detection heuristics
function detectSpam(data) {
  const reasons = [];
  
  // 1. Honeypot field (should be empty)
  if (data.website && data.website.trim() !== '') {
    reasons.push('honeypot_filled');
  }

  // 2. Submission too fast (< 5 seconds from page load)
  if (data._loadTime) {
    const elapsed = Date.now() - parseInt(data._loadTime);
    if (elapsed < 5000) {
      reasons.push('too_fast');
    }
  }

  // 3. Email patterns commonly used by spammers
  const spamEmailPatterns = [
    /@(mailinator|guerrillamail|tempmail|throwaway|yopmail|sharklasers)/i,
    /test@test/i,
  ];
  if (spamEmailPatterns.some(p => p.test(data.email))) {
    reasons.push('spam_email');
  }

  // 4. Message contains excessive URLs (spam signature)
  const urlCount = ((data.message || '').match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    reasons.push('excessive_urls');
  }

  // 5. All caps name or nonsense characters
  if (data.name && (/^[A-Z\s]{10,}$/.test(data.name) || /[<>{}|\\]/.test(data.name))) {
    reasons.push('suspicious_name');
  }

  // 6. Parts validation — at least one valid part number
  try {
    const parts = JSON.parse(data.parts || '[]');
    const validParts = parts.filter(p => p.partNumber && p.partNumber.trim().length >= 2);
    if (validParts.length === 0) {
      reasons.push('no_valid_parts');
    }
  } catch {
    reasons.push('invalid_parts_json');
  }

  return reasons;
}

// ============================================================
// BOM UPLOAD SECURITY
// ============================================================

const BOM_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const BOM_ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx', '.txt'];

// Magic bytes (file signatures) for allowed file types
// This prevents extension spoofing — we verify the actual binary content
const MAGIC_BYTES = {
  // XLSX (ZIP-based Office Open XML)
  xlsx: [
    { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }, // PK zip header
  ],
  // XLS (Microsoft Compound Binary File)
  xls: [
    { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }, // OLE2 header
  ],
  // PDF
  pdf: [
    { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  // DOC (also OLE2 like XLS)
  doc: [
    { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] },
  ],
  // DOCX (ZIP-based like XLSX)
  docx: [
    { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] },
  ],
};

// Extensions that require magic byte verification
const BINARY_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.doc', '.docx'];

// Extension → valid magic byte keys
const EXT_TO_MAGIC = {
  '.xlsx': 'xlsx',
  '.xls': 'xls',
  '.pdf': 'pdf',
  '.doc': 'doc',
  '.docx': 'docx',
};

/**
 * Validate file content matches its declared extension.
 * Returns true if the file is safe, false if suspicious.
 */
function validateFileContent(buffer, ext) {
  // Text-based formats (.csv, .txt) — check for no binary control chars
  // and no HTML/script injection
  if (ext === '.csv' || ext === '.txt') {
    const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
    const text = sample.toString('utf-8');

    // Block files containing script tags, event handlers, or HTML that
    // a browser might interpret if served as text/html
    const dangerousPatterns = [
      /<script[\s>]/i,
      /on(load|error|click|mouseover)\s*=/i,
      /<iframe[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
      /<link[\s>]/i,
      /javascript:/i,
      /data:text\/html/i,
    ];
    if (dangerousPatterns.some(p => p.test(text))) {
      return false;
    }
    return true;
  }

  // Binary formats — verify magic bytes
  const magicKey = EXT_TO_MAGIC[ext];
  if (!magicKey || !MAGIC_BYTES[magicKey]) return true; // Unknown format, skip

  const signatures = MAGIC_BYTES[magicKey];
  return signatures.some(sig => {
    if (buffer.length < sig.offset + sig.bytes.length) return false;
    return sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte);
  });
}

/**
 * Generate a cryptographically random filename.
 * This prevents:
 * - Path traversal (no user-controlled characters in path)
 * - Name guessing / enumeration (random hex)
 * - Double extension attacks (only one trusted extension)
 */
function generateSecureFilename(ext) {
  const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
  const timestamp = Date.now();
  // Only use the validated extension — never trust user-supplied filename in the path
  return `bom_${timestamp}_${randomPart}${ext}`;
}


export async function POST(request) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse form data (supports both FormData and JSON)
    let data = {};
    let bomFile = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data = {
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company'),
        phone: formData.get('phone'),
        country: formData.get('country'),
        message: formData.get('message'),
        parts: formData.get('parts'),
        website: formData.get('website'),
        _loadTime: formData.get('_loadTime'),
      };
      // Parse tracking data from string
      const trackingStr = formData.get('_tracking');
      if (trackingStr) {
        try { data._tracking = JSON.parse(trackingStr); } catch { data._tracking = {}; }
      }
      // Get uploaded BOM file
      bomFile = formData.get('bomFile');
      if (bomFile && typeof bomFile === 'string') bomFile = null; // FormData returns string if no file
      if (bomFile && bomFile.size === 0) bomFile = null;
    } else {
      data = await request.json();
    }

    // Basic validation
    if (!data.name || !data.email || !data.parts) {
      return NextResponse.json(
        { error: 'Name, email, and at least one part are required.' },
        { status: 400 }
      );
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Spam detection
    const spamReasons = detectSpam(data);
    const isSpam = spamReasons.length > 0;

    // Sanitize inputs
    const sanitize = (s, maxLen = 500) => 
      s ? String(s).trim().replace(/[<>]/g, '').substring(0, maxLen) : null;

    // Process tracking data
    const tracking = data._tracking || {};
    const sourceChannel = deriveSourceChannel(tracking);

    // ============================================================
    // SECURE BOM FILE UPLOAD
    // ============================================================
    let bomFilePath = null;
    let bomFileName = null;
    if (bomFile && !isSpam) {
      // 1. SIZE CHECK — prevent storage exhaustion
      if (bomFile.size > BOM_MAX_SIZE) {
        return NextResponse.json(
          { error: `BOM file too large: ${(bomFile.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB.` },
          { status: 400 }
        );
      }

      // 2. EXTENSION CHECK — only allow known BOM formats
      const originalName = bomFile.name || '';
      const ext = path.extname(originalName).toLowerCase();
      if (!BOM_ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid BOM file type. Allowed: ${BOM_ALLOWED_EXTENSIONS.join(', ')}` },
          { status: 400 }
        );
      }

      // 3. DOUBLE EXTENSION CHECK — block "file.html.xlsx" style tricks
      const nameParts = originalName.split('.');
      if (nameParts.length > 2) {
        const dangerousExts = ['.html', '.htm', '.php', '.jsp', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.sh', '.js', '.svg', '.xml'];
        const allExts = nameParts.slice(1).map(e => '.' + e.toLowerCase());
        if (allExts.some(e => dangerousExts.includes(e))) {
          return NextResponse.json(
            { error: 'File name contains suspicious extensions.' },
            { status: 400 }
          );
        }
      }

      // 4. READ FILE CONTENT for content validation
      const bytes = await bomFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 5. MAGIC BYTE / CONTENT VALIDATION — verify actual file type
      if (!validateFileContent(buffer, ext)) {
        return NextResponse.json(
          { error: 'File content does not match the declared file type, or contains prohibited content.' },
          { status: 400 }
        );
      }

      // 6. SAVE TO PRIVATE DIRECTORY (outside public/) — files NOT directly web-accessible
      const uploadDir = path.join(process.cwd(), 'data', 'bom-uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // 7. SECURE FILENAME — random, no user-controlled path components
      const secureFilename = generateSecureFilename(ext);
      const filePath = path.join(uploadDir, secureFilename);

      await writeFile(filePath, buffer);

      // Store internal path (NOT a public URL — served via API only)
      bomFilePath = secureFilename;
      bomFileName = originalName;
    }

    // Save to database
    const rfq = await prisma.rfqSubmission.create({
      data: {
        name: sanitize(data.name, 200),
        email: sanitize(data.email, 200),
        company: sanitize(data.company, 200),
        phone: sanitize(data.phone, 50),
        country: sanitize(data.country, 10),
        message: sanitize(data.message, 2000),
        parts: data.parts, // Already JSON string
        bomFile: bomFilePath,
        bomFileName: bomFileName,
        status: isSpam ? 'spam' : 'new',
        ipAddress: ip,
        userAgent: userAgent.substring(0, 500),
        notes: isSpam ? `Auto-flagged: ${spamReasons.join(', ')}` : null,
        trackingData: Object.keys(tracking).length > 0 ? JSON.stringify(tracking) : null,
        sourceChannel,
        landingPage: sanitize(tracking.landing_page, 500),
      },
    });

    // Send email notifications (only for non-spam, fire and forget)
    if (!isSpam) {
      sendRfqNotification(rfq);   // Notify admin
      sendRfqConfirmation(rfq);   // Confirm to customer
    }

    return NextResponse.json({
      success: true,
      id: rfq.id,
      message: 'Your quote request has been submitted successfully.',
    });
  } catch (e) {
    console.error('RFQ submission error:', e);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}
