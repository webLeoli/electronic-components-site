const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

const envContent = [
  '# ==============================================',
  '# FPGACenter - Environment Configuration',
  '# ==============================================',
  '',
  '# --- Database ---',
  '# PostgreSQL (production)',
  'DATABASE_URL="postgresql://user_m75rpP:password_thJYhh@127.0.0.1:5432/fpgacenter?schema=public"',
  '',
  '# --- Admin Panel ---',
  'ADMIN_PASSWORD="fpgacenter2026"',
  '',
  '# --- Email Notification (SMTP) ---',
  'SMTP_HOST=""',
  'SMTP_PORT="587"',
  'SMTP_USER=""',
  'SMTP_PASS=""',
  'SMTP_FROM="noreply@fpgacenter.com"',
  'ADMIN_EMAIL="admin@fpgacenter.com"',
  '',
  '# --- Site URL ---',
  'SITE_URL="https://fpgacenter.com"',
  'NEXT_PUBLIC_SITE_URL="https://fpgacenter.com"',
  'SESSION_SECRET=1340f95d9408c9bc4c8b4e8b3e4ab8cdcf04a3f2ec17510e91aa41adaa951c5e',
  '',
].join('\n');

fs.writeFileSync(envPath, envContent);
console.log('.env file has been completely rewritten.');
console.log('Contents:');
console.log(envContent);
