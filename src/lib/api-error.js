import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Uniform 500 handler for API routes.
 *
 * Logs the full error server-side (previously most admin routes returned the
 * raw error to the browser and logged NOTHING) and returns a generic message
 * so Prisma/DB internals never leak to clients. The short reference id ties a
 * user report back to the server log line.
 */
export function apiError(e, context) {
  const ref = crypto.randomBytes(4).toString('hex');
  console.error(`[api-error:${context}] ref=${ref}`, e);
  return NextResponse.json({ error: `Internal error (ref: ${ref})` }, { status: 500 });
}
