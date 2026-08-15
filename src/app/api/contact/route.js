import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendContactNotification } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { enforceMaxBody } from '@/lib/request-limits';

// A contact message is a name, an email and some prose. Generous for that,
// nowhere near enough to be worth sending as an attack.
const CONTACT_MAX_BODY = 256 * 1024;

// IP-based rate limiting in two tiers, same reasoning as /api/rfq: the
// submission quota is charged only once a request is well-formed, so three
// typos in the email field cannot spend a visitor's whole hour and lock them
// out of contacting the company. The wider guard still stops flooding.
// Backed by Redis when REDIS_URL is set (cluster-safe), in-memory otherwise.
const CONTACT_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5, prefix: 'contact' };
const CONTACT_REQUEST_LIMIT = { windowMs: 60 * 60 * 1000, max: 40, prefix: 'contact-req' };

export async function POST(request) {
  try {
    // Before request.json() buffers the body.
    const tooLarge = enforceMaxBody(request, CONTACT_MAX_BODY);
    if (tooLarge) return tooLarge;

    const ip = getClientIp(request);

    // Flood guard only.
    if (!(await rateLimit(ip, CONTACT_REQUEST_LIMIT))) {
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

    // Well-formed: now charge the submission quota.
    if (!(await rateLimit(ip, CONTACT_RATE_LIMIT))) {
      return NextResponse.json(
        { error: 'You have sent several messages recently. Please try again later.' },
        { status: 429 }
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
    let dbSaved = false;
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
      dbSaved = true;
    } catch (dbErr) {
      console.error('Failed to save contact to DB:', dbErr.message);
    }

    // Await the notification when the DB row failed: if neither the database
    // nor the email captured the message, telling the visitor "sent
    // successfully" silently loses their enquiry.
    if (dbSaved) {
      sendContactNotification(contactData).catch(err =>
        console.error('[Contact email] notification failed:', err)
      );
    } else {
      const emailed = await sendContactNotification(contactData).catch(err => {
        console.error('[Contact email] notification failed:', err);
        return false;
      });
      if (!emailed) {
        return NextResponse.json(
          { error: 'We could not receive your message right now. Please email us directly at sales@fpgacenter.com.' },
          { status: 500 }
        );
      }
    }

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

