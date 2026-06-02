const OLD_GENERATED_BLOG_PATH = '/images/blog/';

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

export function getBlogCoverImage(post) {
  const image = String(post?.coverImage || '').trim();
  if (!image) return null;

  // Old generated assets were local placeholders and are not part of the clean
  // production repo. Treat them as missing so the UI never shows broken covers.
  if (image.startsWith(OLD_GENERATED_BLOG_PATH)) return null;

  return image;
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
