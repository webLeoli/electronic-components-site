import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { sendRfqNotification, sendRfqConfirmation } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { enforceMaxBody } from '@/lib/request-limits';

// Room for the multipart envelope and the ordinary form fields that travel
// alongside the BOM, so a legitimate 10MB file is never rejected for the
// boundary markers wrapped around it.
const MULTIPART_OVERHEAD_ALLOWANCE = 1 * 1024 * 1024;

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

// IP-based rate limiting, in two tiers, because one tier gets the trade-off
// wrong in whichever direction you pick.
//
// RFQ_RATE_LIMIT is the real quota: 3 accepted quote requests per hour per IP.
// It is consumed only AFTER validation passes. Charging it up front — which is
// what this route used to do — meant a visitor who mistyped their email three
// times had spent the whole hour's budget on 400s and could not then submit the
// request they came to make. On a site where the quote form IS the conversion,
// that is a lost customer, and it is invisible in logs because the 429 looks
// like abuse being blocked correctly.
//
// RFQ_REQUEST_LIMIT is the flood guard that the first tier used to provide:
// generous enough that no honest visitor reaches it, tight enough that nobody
// can hammer the endpoint with 10MB multipart bodies for free.
const RFQ_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3, prefix: 'rfq' };
const RFQ_REQUEST_LIMIT = { windowMs: 60 * 60 * 1000, max: 30, prefix: 'rfq-req' };

// Spam detection heuristics.
//
// Signals are split by confidence because the consequences are not symmetric.
// A HARD signal parks the submission in the 'spam' queue: no notification email
// is sent and scripts/purge-pii.mjs deletes it after 30 days. That is only
// acceptable for signals a real buyer cannot trip. Everything else is SOFT: the
// RFQ stays in the normal 'new' queue and is emailed as usual, with the reason
// recorded in `notes` so the team can judge it.
//
// The previous version treated every heuristic as hard, and one of them was
// `/^[A-Z\s]{10,}$/` on the name field — an all-caps name of ten characters or
// more. Industrial buyers routinely type "ZHANG WEIMING" or "JOHN ANDERSON" in
// caps, and each of those leads was silently discarded after the customer had
// been shown "we'll respond within 24 hours". That rule is gone; only genuinely
// malformed input (control/markup characters) still flags the name.
const HARD_SPAM_REASONS = new Set(['honeypot_filled', 'invalid_parts_json', 'no_valid_parts']);

function detectSpam(data) {
  const reasons = [];

  // 1. Honeypot field (should be empty) — hidden from humans, so any value is
  //    an automated submission. HARD.
  if (data.website && data.website.trim() !== '') {
    reasons.push('honeypot_filled');
  }

  // 2. Submission too fast (< 5 seconds from page load). SOFT: a slow hydration
  //    or an autofilled form can beat the clock legitimately.
  if (data._loadTime) {
    const elapsed = Date.now() - parseInt(data._loadTime);
    if (elapsed < 5000) {
      reasons.push('too_fast');
    }
  }

  // 3. Disposable-mailbox providers. SOFT: some buyers screen new suppliers
  //    behind a throwaway address before revealing a corporate one.
  const spamEmailPatterns = [
    /@(mailinator|guerrillamail|tempmail|throwaway|yopmail|sharklasers)/i,
    /test@test/i,
  ];
  if (spamEmailPatterns.some(p => p.test(data.email))) {
    reasons.push('spam_email');
  }

  // 4. Message contains excessive URLs (link-spam signature). SOFT: a buyer can
  //    legitimately paste several datasheet links.
  const urlCount = ((data.message || '').match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    reasons.push('excessive_urls');
  }

  // 5. Markup/control characters in the name. SOFT.
  if (data.name && /[<>{}|\\]/.test(data.name)) {
    reasons.push('suspicious_name');
  }

  // 6. Parts validation — at least one valid part number. HARD: the client
  //    cannot reach this endpoint with no parsable part unless it is scripted.
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

// True only for signals that justify discarding the lead outright.
function isHardSpam(reasons) {
  return reasons.some(reason => HARD_SPAM_REASONS.has(reason));
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
    // Before request.formData() buffers anything. The BOM size check further
    // down runs too late to protect memory — by then the body is already in
    // the heap several times over.
    const tooLarge = enforceMaxBody(request, BOM_MAX_SIZE + MULTIPART_OVERHEAD_ALLOWANCE);
    if (tooLarge) return tooLarge;

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Flood guard only — the submission quota is charged after validation.
    if (!(await rateLimit(ip, RFQ_REQUEST_LIMIT))) {
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

    // Parts array structure validation
    let parsedParts;
    try {
      // The browser form posts multipart, where every field is a string, so
      // parts arrives JSON-encoded. A JSON request body can carry the real
      // array — accept both rather than JSON.parse an array, which stringifies
      // it to "[object Object]" and rejects a perfectly valid submission.
      parsedParts = Array.isArray(data.parts) ? data.parts : JSON.parse(data.parts);
      if (!Array.isArray(parsedParts) || parsedParts.length === 0) throw new Error('empty');
    } catch {
      return NextResponse.json(
        { error: 'Invalid parts data. Please re-add your parts and try again.' },
        { status: 400 }
      );
    }

    // Sanitize + validate each part item
    const validParts = parsedParts
      .map(p => ({
        partNumber: String(p.partNumber || '').trim().replace(/[<>]/g, '').substring(0, 100),
        manufacturer: String(p.manufacturer || '').trim().replace(/[<>]/g, '').substring(0, 100),
        qty: Math.max(1, parseInt(p.qty) || 1),       // default qty=1 if missing/invalid
        targetPrice: String(p.targetPrice || '').trim().substring(0, 50),
      }))
      .filter(p => p.partNumber.length >= 2);         // must have a real part number

    if (validParts.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one valid part number.' },
        { status: 400 }
      );
    }

    // Validate the BOM before charging quota. The file is already in memory
    // from the request; a rejected type/size must not burn a lead slot.
    let pendingBom = null;
    if (bomFile) {
      if (bomFile.size > BOM_MAX_SIZE) {
        return NextResponse.json(
          { error: `BOM file too large: ${(bomFile.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB.` },
          { status: 400 }
        );
      }

      const originalName = bomFile.name || '';
      const ext = path.extname(originalName).toLowerCase();
      if (!BOM_ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid BOM file type. Allowed: ${BOM_ALLOWED_EXTENSIONS.join(', ')}` },
          { status: 400 }
        );
      }

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

      const buffer = Buffer.from(await bomFile.arrayBuffer());
      if (!validateFileContent(buffer, ext)) {
        return NextResponse.json(
          { error: 'File content does not match the declared file type, or contains prohibited content.' },
          { status: 400 }
        );
      }
      pendingBom = { buffer, ext, originalName };
    }

    // The request is well-formed and is about to become a lead — now charge the
    // submission quota. Everything above this line is free to retry.
    if (!(await rateLimit(ip, RFQ_RATE_LIMIT))) {
      return NextResponse.json(
        { error: 'You have submitted several requests recently. Please try again later, or email us directly.' },
        { status: 429 }
      );
    }

    // Re-serialize sanitized parts for storage
    data.parts = JSON.stringify(validParts);

    // Spam detection. Only hard signals suppress the lead; soft ones are
    // annotated and still reach the team.
    const spamReasons = detectSpam(data);
    const isSpam = isHardSpam(spamReasons);
    const softFlags = spamReasons.filter(reason => !HARD_SPAM_REASONS.has(reason));

    // Sanitize inputs
    const sanitize = (s, maxLen = 500) =>
      s ? String(s).trim().replace(/[<>]/g, '').substring(0, maxLen) : null;

    // Process tracking data
    const tracking = data._tracking || {};
    const sourceChannel = deriveSourceChannel(tracking);

    let bomFilePath = null;
    let bomFileName = null;
    if (pendingBom && !isSpam) {
      const uploadDir = path.join(process.cwd(), 'data', 'bom-uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const secureFilename = generateSecureFilename(pendingBom.ext);
      await writeFile(path.join(uploadDir, secureFilename), pendingBom.buffer);
      bomFilePath = secureFilename;
      bomFileName = pendingBom.originalName;
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
        notes: isSpam
          ? `Auto-flagged as spam: ${spamReasons.join(', ')}`
          : softFlags.length
            ? `Needs review (delivered as normal): ${softFlags.join(', ')}`
            : null,
        trackingData: Object.keys(tracking).length > 0 ? JSON.stringify(tracking) : null,
        sourceChannel,
        landingPage: sanitize(tracking.landing_page, 500),
      },
    });

    // Send email notifications (only for non-spam, fire and forget).
    // .catch is mandatory: an unhandled rejection here (bad SMTP config, TLS
    // error thrown before sendEmail's own retry loop) would crash the process.
    if (!isSpam) {
      sendRfqNotification(rfq).catch(err => console.error('[RFQ email] admin notification failed:', err));
      sendRfqConfirmation(rfq).catch(err => console.error('[RFQ email] customer confirmation failed:', err));
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
