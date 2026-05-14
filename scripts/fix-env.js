const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let content = fs.readFileSync(envPath, 'utf-8');

// Remove all SITE_URL and SESSION_SECRET lines (they are broken)
const lines = content.split('\n').filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('SITE_URL')) return false;
  if (trimmed.startsWith('NEXT_PUBLIC_SITE_URL')) return false;
  if (trimmed.startsWith('SESSION_SECRET')) return false;
  if (trimmed === '# --- Site URL ---') return false;
  return true;
});

// Remove trailing empty lines
while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
  lines.pop();
}

// Add correct lines
lines.push('');
lines.push('# --- Site URL ---');
lines.push('SITE_URL="https://fpgacenter.com"');
lines.push('NEXT_PUBLIC_SITE_URL="https://fpgacenter.com"');
lines.push('SESSION_SECRET=1340f95d9408c9bc4c8b4e8b3e4ab8cdcf04a3f2ec17510e91aa41adaa951c5e');
lines.push('');

fs.writeFileSync(envPath, lines.join('\n'));

console.log('Fixed .env file. Last 5 lines:');
const result = fs.readFileSync(envPath, 'utf-8').split('\n');
result.slice(-7).forEach(l => console.log(l));
