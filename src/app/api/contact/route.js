import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendRfqNotification } from '@/lib/email';

// In-memory rate limiter (per IP).
// NOTE: Works for single-process deployments (PM2 fork mode).
// For cluster mode, replace with a Redis-backed limiter.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const prev = rateLimitMap.get(key) || [];
  const timestamps = prev.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export async function POST(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    if (!checkRateLimit(ip)) {
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

    // Send email notification to admin (reuse existing email infrastructure)
    const notificationData = {
      id: `CONTACT-${Date.now()}`,
      name: contactData.name,
      email: contactData.email,
      company: contactData.company,
      phone: contactData.phone,
      parts: JSON.stringify([{ subject: contactData.subject, message: contactData.message }]),
      message: `[Contact Form - ${contactData.subject}]\n\n${contactData.message}`,
    };

    // Fire and forget email
    sendRfqNotification(notificationData).catch(() => {});

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

