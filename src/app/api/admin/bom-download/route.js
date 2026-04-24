import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * Secure BOM file download — admin only.
 * 
 * Files are stored in data/bom-uploads/ (NOT in public/),
 * so they can only be accessed through this authenticated endpoint.
 * 
 * This prevents:
 * - Unauthenticated access to customer BOM files
 * - Direct URL enumeration attacks
 * - Stored XSS via uploaded files (Content-Disposition: attachment forces download)
 */

// MIME types for download — all forced as attachment (never rendered in browser)
const DOWNLOAD_MIMES = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

export async function GET(request) {
  try {
    // 1. AUTHENTICATION CHECK — uses shared admin-auth helper
    const session = getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For multi-user mode (non-legacy), verify user is active in DB
    if (session.userId !== 0) {
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: session.userId },
      });
      if (!adminUser || !adminUser.isActive) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. GET RFQ ID from query params
    const { searchParams } = new URL(request.url);
    const rfqId = parseInt(searchParams.get('id'));
    if (!rfqId || isNaN(rfqId)) {
      return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 });
    }

    // 3. LOOK UP the RFQ and its BOM file
    const rfq = await prisma.rfqSubmission.findUnique({
      where: { id: rfqId },
      select: { bomFile: true, bomFileName: true },
    });

    if (!rfq || !rfq.bomFile) {
      return NextResponse.json({ error: 'BOM file not found' }, { status: 404 });
    }

    // 4. CONSTRUCT safe file path — prevent path traversal
    const filename = path.basename(rfq.bomFile); // Strip any directory components
    const filePath = path.join(process.cwd(), 'data', 'bom-uploads', filename);

    // Verify the resolved path is within the expected directory
    const expectedDir = path.resolve(process.cwd(), 'data', 'bom-uploads');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(expectedDir)) {
      console.error('[BOM Download] Path traversal attempt blocked:', rfq.bomFile);
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // 5. READ and SERVE the file
    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = DOWNLOAD_MIMES[ext] || 'application/octet-stream';

    // Sanitize download filename to prevent header injection
    const downloadName = (rfq.bomFileName || filename)
      .replace(/[^\w\s._-]/g, '_')
      .substring(0, 200);

    // 6. RETURN with security headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // CRITICAL: "attachment" forces download, never renders in browser
        // This blocks stored XSS even if the file contains malicious HTML
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(fileBuffer.length),
        // Prevent MIME sniffing — browser must respect our Content-Type
        'X-Content-Type-Options': 'nosniff',
        // Block any script execution context
        'Content-Security-Policy': "default-src 'none'",
        // No caching of sensitive files
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (e) {
    console.error('[BOM Download] Error:', e);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
