import { NextResponse } from 'next/server';

/**
 * Reject oversized request bodies BEFORE reading them.
 *
 * request.formData() / request.json() buffer the whole body in memory, so any
 * size check written after them has already paid the cost. A 50MB upload to
 * the public quote form was measured taking the process from 10MB to 225MB —
 * roughly 4.5x the payload, because the body gets copied again by the
 * multipart parser and once more into a Buffer — and only THEN got its polite
 * "file too large" 400. Unauthenticated, so a handful of concurrent requests
 * is enough to exhaust the single PM2 instance.
 *
 * Content-Length is advisory: a chunked request omits it entirely, and this
 * check cannot see past it. It stops the accidental and the casual case, not a
 * determined attacker — `client_max_body_size` in nginx is what actually
 * enforces this, because it drops the body before Node ever sees it. Both,
 * not either.
 *
 * @returns a 413 Response when the declared length is over the limit, else null
 */
export function enforceMaxBody(request, maxBytes) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return NextResponse.json(
      { error: 'Request too large.', maxBytes },
      { status: 413 }
    );
  }
  return null;
}
