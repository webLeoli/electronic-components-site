import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const sourceDir = join(process.cwd(), 'output', 'imagegen-sources');
const outputDir = join(process.cwd(), 'public', 'uploads', 'blog');
const desktop = { width: 1200, height: 630, maxBytes: 180 * 1024, quality: 78 };
const mobile = { width: 640, height: 336, maxBytes: 70 * 1024, quality: 76 };

async function encode(input, output, spec) {
  let quality = spec.quality;

  while (quality >= 58) {
    await sharp(input)
      .rotate()
      .resize(spec.width, spec.height, { fit: 'cover', position: 'centre' })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(output);

    const size = (await stat(output)).size;
    if (size <= spec.maxBytes || quality === 58) return { size, quality };
    quality = Math.max(58, quality - 4);
  }
}

await mkdir(outputDir, { recursive: true });
const sources = (await readdir(sourceDir)).filter((name) => name.endsWith('.png')).sort();
const results = [];

for (const source of sources) {
  const slug = parse(source).name;
  const input = join(sourceDir, source);
  const desktopPath = join(outputDir, `${slug}.webp`);
  const mobilePath = join(outputDir, `${slug}-640.webp`);
  const desktopResult = await encode(input, desktopPath, desktop);
  const mobileResult = await encode(input, mobilePath, mobile);

  results.push({
    slug,
    desktop: { width: desktop.width, height: desktop.height, ...desktopResult },
    mobile: { width: mobile.width, height: mobile.height, ...mobileResult },
  });
}

console.log(JSON.stringify(results, null, 2));
