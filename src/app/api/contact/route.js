import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendContactNotification } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// IP-based rate limiter — max 5 submissions per hour per IP.
// Backed by Redis when REDIS_URL is set (cluster-safe), in-memory otherwise.
const CONTACT_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5, prefix: 'contact' };

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    if (!(await rateLimit(ip, CONTACT_RATE_LIMIT))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const data = await request.json();

    // Validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Sanitize
    const sanitize = (s, maxLen = 500) =>
      s ? String(s).trim().replace(/[<>]/g, '').substring(0, maxLen) : '';

    const contactData = {
      name: sanitize(data.name, 200),
      email: sanitize(data.email, 200),
      company: sanitize(data.company, 200),
      phone: sanitize(data.phone, 50),
      subject: sanitize(data.subject, 200),
      message: sanitize(data.message, 5000),
    };

    // Save to database for admin review
    try {
      await prisma.contactSubmission.create({
        data: {
          name: contactData.name,
          email: contactData.email,
          company: contactData.company || null,
          phone: contactData.phone || null,
          subject: contactData.subject,
          message: contactData.message,
          ipAddress: ip,
        },
      });
    } catch (dbErr) {
      console.error('Failed to save contact to DB:', dbErr.message);
      // Continue even if DB save fails — email notification is more important
    }

    // Fire-and-forget admin notification with a dedicated contact template
    // (the RFQ template rendered an empty parts table for contact messages).
    sendContactNotification(contactData).catch(err =>
      console.error('[Contact email] notification failed:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (e) {
    console.error('Contact form error:', e);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}

