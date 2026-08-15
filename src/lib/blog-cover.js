import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { getManifestBlogCover } from './blog-cover-manifest.js';

const COVER_THEMES = [
  {
    match: ['fpga', 'cpld', 'spartan', 'cyclone', 'logic'],
    label: 'FPGA',
    title: 'Programmable Logic',
    className: 'theme-fpga',
  },
  {
    match: ['counterfeit', 'quality', 'inspection', 'idea'],
    label: 'QA',
    title: 'Quality Control',
    className: 'theme-quality',
  },
  {
    match: ['obsolete', 'eol', 'nrnd', 'lifecycle'],
    label: 'EOL',
    title: 'Lifecycle Sourcing',
    className: 'theme-lifecycle',
  },
  {
    match: ['bom', 'scrubbing', 'procurement', 'sourcing'],
    label: 'BOM',
    title: 'Procurement Guide',
    className: 'theme-sourcing',
  },
  {
    match: ['microcontroller', 'stm32', 'mcu'],
    label: 'MCU',
    title: 'Embedded Systems',
    className: 'theme-embedded',
  },
];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function getRenderableCover(imageValue) {
  const image = String(imageValue || '').trim();
  if (!image) return null;

  // Remote covers cannot be verified locally and are rendered as supplied.
  if (/^https?:\/\//i.test(image)) return image;

  // Local covers are served from public/. Only return the URL when its file is
  // actually present: missing assets keep the generated fallback instead of a
  // broken image, while newly uploaded legacy or /uploads/ files begin working
  // automatically without another code change.
  if (image.startsWith('/')) {
    const pathname = image.split(/[?#]/, 1)[0];
    const publicRoot = resolve(process.cwd(), 'public');
    const filePath = resolve(publicRoot, `.${pathname}`);
    const isInsidePublic = filePath === publicRoot || filePath.startsWith(`${publicRoot}${sep}`);

    return isInsidePublic && existsSync(filePath) ? image : null;
  }

  return null;
}

export function getBlogCoverImage(post) {
  const manifestCover = getManifestBlogCover(post?.slug);

  return getRenderableCover(post?.coverImage) || getRenderableCover(manifestCover?.src);
}

export function getBlogCoverMobileImage(post) {
  const manifestCover = getManifestBlogCover(post?.slug);
  const desktopImage = getBlogCoverImage(post);
  if (!manifestCover || desktopImage !== manifestCover.src) return null;

  const mobileImage = manifestCover.src.replace(/\.webp(?:[?#].*)?$/i, '-640.webp');
  return getRenderableCover(mobileImage);
}

export function getBlogCoverAlt(post) {
  const manifestCover = getManifestBlogCover(post?.slug);
  return manifestCover?.alt || String(post?.title || 'Electronic components technical article');
}

export function getBlogCoverTheme(post) {
  const haystack = [
    post?.title,
    post?.slug,
    post?.excerpt,
    post?.category?.name,
    post?.category?.slug,
    post?.tags,
  ].map(normalizeText).join(' ');

  return COVER_THEMES.find(theme => theme.match.some(term => haystack.includes(term))) || {
    label: 'IC',
    title: 'Component Insight',
    className: 'theme-default',
  };
}
