/**
 * Component Image System — FPGACenter
 * 
 * Generates professional SVG-based images for electronic components
 * when no real product photo is available. Uses component type/category
 * to render appropriate chip/part illustrations.
 */

// Category → SVG icon path data (professional electronics icons)
export const CATEGORY_ICONS = {
  // ICs
  'integrated-circuits':    { svg: 'chip', color: '#4285F4' },
  'microcontrollers':       { svg: 'chip', color: '#4285F4' },
  'fpga':                   { svg: 'fpga', color: '#7C3AED' },
  'memory':                 { svg: 'memory', color: '#2563EB' },
  'pmic':                   { svg: 'chip', color: '#DC2626' },
  'interface':              { svg: 'chip', color: '#059669' },
  'dsp':                    { svg: 'chip', color: '#6366F1' },
  'cpld':                   { svg: 'fpga', color: '#7C3AED' },
  
  // Discrete
  'discrete-semiconductors': { svg: 'transistor', color: '#EA4335' },
  'mosfets':                { svg: 'transistor', color: '#EA4335' },
  'diodes':                 { svg: 'diode', color: '#F59E0B' },
  'transistors':            { svg: 'transistor', color: '#EA4335' },
  'igbts':                  { svg: 'transistor', color: '#DC2626' },
  'thyristors':             { svg: 'transistor', color: '#B91C1C' },
  
  // Passive
  'capacitors':             { svg: 'capacitor', color: '#10B981' },
  'resistors':              { svg: 'resistor', color: '#8B5CF6' },
  'inductors':              { svg: 'inductor', color: '#F97316' },
  
  // Connectors
  'connectors':             { svg: 'connector', color: '#0EA5E9' },
  
  // Others
  'sensors':                { svg: 'sensor', color: '#14B8A6' },
  'optoelectronics':        { svg: 'led', color: '#EAB308' },
  'crystals-oscillators':   { svg: 'crystal', color: '#6366F1' },
  'relays':                 { svg: 'relay', color: '#78716C' },
  'switches':               { svg: 'switch', color: '#64748B' },
  'power-supplies':         { svg: 'power', color: '#DC2626' },
  'rf-rfid':                { svg: 'rf', color: '#0891B2' },
  'transformers':           { svg: 'inductor', color: '#D97706' },
  'filters':                { svg: 'chip', color: '#7C3AED' },
  'cables':                 { svg: 'connector', color: '#475569' },
};

// SVG path definitions for component types
const SVG_COMPONENTS = {
  chip: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="30" y="30" width="60" height="60" rx="4" fill="currentColor" opacity="0.15"/>
      <rect x="32" y="32" width="56" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Pins left -->
      <line x1="18" y1="42" x2="32" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="52" x2="32" y2="52" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="62" x2="32" y2="62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="72" x2="32" y2="72" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Pins right -->
      <line x1="88" y1="42" x2="102" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="88" y1="52" x2="102" y2="52" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="88" y1="62" x2="102" y2="62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="88" y1="72" x2="102" y2="72" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Pins top -->
      <line x1="45" y1="18" x2="45" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="55" y1="18" x2="55" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="65" y1="18" x2="65" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="75" y1="18" x2="75" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Pins bottom -->
      <line x1="45" y1="88" x2="45" y2="102" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="55" y1="88" x2="55" y2="102" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="65" y1="88" x2="65" y2="102" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="75" y1="88" x2="75" y2="102" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Pin 1 marker -->
      <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.4"/>
    `,
  },
  fpga: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="25" y="25" width="70" height="70" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="27" y="27" width="66" height="66" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Inner grid -->
      <rect x="40" y="40" width="40" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      <line x1="53" y1="40" x2="53" y2="80" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>
      <line x1="67" y1="40" x2="67" y2="80" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>
      <line x1="40" y1="53" x2="80" y2="53" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>
      <line x1="40" y1="67" x2="80" y2="67" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>
      <!-- BGA balls bottom -->
      <circle cx="35" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="45" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="55" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="65" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="75" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="85" cy="100" r="2.5" fill="currentColor" opacity="0.3"/>
      <!-- BGA balls top -->
      <circle cx="35" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="45" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="55" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="65" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="75" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="85" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>
      <!-- BGA balls left -->
      <circle cx="18" cy="40" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="18" cy="50" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="18" cy="60" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="18" cy="70" r="2.5" fill="currentColor" opacity="0.3"/>
      <!-- BGA balls right -->
      <circle cx="102" cy="40" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="102" cy="50" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="102" cy="60" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="102" cy="70" r="2.5" fill="currentColor" opacity="0.3"/>
      <circle cx="37" cy="37" r="3" fill="currentColor" opacity="0.4"/>
    `,
  },
  transistor: {
    viewBox: '0 0 120 120',
    paths: `
      <circle cx="60" cy="60" r="28" fill="currentColor" opacity="0.1"/>
      <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Emitter -->
      <line x1="60" y1="42" x2="60" y2="78" stroke="currentColor" stroke-width="2.5"/>
      <line x1="60" y1="50" x2="80" y2="38" stroke="currentColor" stroke-width="2.5"/>
      <line x1="60" y1="70" x2="80" y2="82" stroke="currentColor" stroke-width="2.5"/>
      <!-- Arrow -->
      <polygon points="74,78 80,82 74,84" fill="currentColor"/>
      <!-- Leads -->
      <line x1="60" y1="42" x2="60" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="80" y1="38" x2="95" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="80" y1="82" x2="95" y2="102" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- Labels -->
      <text x="50" y="16" font-size="9" fill="currentColor" opacity="0.5" font-family="monospace">B</text>
      <text x="97" y="18" font-size="9" fill="currentColor" opacity="0.5" font-family="monospace">C</text>
      <text x="97" y="105" font-size="9" fill="currentColor" opacity="0.5" font-family="monospace">E</text>
    `,
  },
  capacitor: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="60" y1="15" x2="60" y2="45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="75" x2="60" y2="105" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="35" y1="45" x2="85" y2="45" stroke="currentColor" stroke-width="3"/>
      <path d="M35,75 Q60,60 85,75" fill="none" stroke="currentColor" stroke-width="3"/>
      <!-- + sign -->
      <text x="90" y="40" font-size="14" fill="currentColor" opacity="0.4" font-family="monospace">+</text>
      <!-- Body shading -->
      <rect x="38" y="48" width="44" height="24" rx="3" fill="currentColor" opacity="0.08"/>
    `,
  },
  resistor: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="60" y1="15" x2="60" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="88" x2="60" y2="105" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="42" y="32" width="36" height="56" rx="3" fill="currentColor" opacity="0.12"/>
      <rect x="42" y="32" width="36" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Color bands -->
      <rect x="42" y="40" width="36" height="6" fill="currentColor" opacity="0.3"/>
      <rect x="42" y="52" width="36" height="6" fill="currentColor" opacity="0.2"/>
      <rect x="42" y="64" width="36" height="6" fill="currentColor" opacity="0.15"/>
      <rect x="42" y="76" width="36" height="4" fill="currentColor" opacity="0.25"/>
    `,
  },
  diode: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="60" y1="15" x2="60" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="78" x2="60" y2="105" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="38,42 82,42 60,75" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/>
      <line x1="38" y1="78" x2="82" y2="78" stroke="currentColor" stroke-width="3"/>
    `,
  },
  connector: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="30" y="25" width="60" height="70" rx="4" fill="currentColor" opacity="0.1"/>
      <rect x="30" y="25" width="60" height="70" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Pin holes -->
      <circle cx="45" cy="40" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="60" cy="40" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="75" cy="40" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="45" cy="55" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="60" cy="55" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="75" cy="55" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="45" cy="70" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="60" cy="70" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="75" cy="70" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Notch -->
      <path d="M48,25 L48,20 L72,20 L72,25" fill="none" stroke="currentColor" stroke-width="1.5"/>
    `,
  },
  inductor: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="60" y1="15" x2="60" y2="35" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="85" x2="60" y2="105" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Coil loops -->
      <path d="M60,35 Q75,42 60,50 Q45,58 60,65 Q75,72 60,80 Q50,85 60,85" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <!-- Core lines -->
      <line x1="40" y1="55" x2="40" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      <line x1="80" y1="55" x2="80" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    `,
  },
  sensor: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="35" y="30" width="50" height="55" rx="6" fill="currentColor" opacity="0.1"/>
      <rect x="35" y="30" width="50" height="55" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Sensing element -->
      <circle cx="60" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <circle cx="60" cy="50" r="5" fill="currentColor" opacity="0.2"/>
      <!-- Signal waves -->
      <path d="M80,35 Q90,30 90,40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      <path d="M84,30 Q97,25 97,42" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
      <!-- Leads -->
      <line x1="45" y1="85" x2="45" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="60" y1="85" x2="60" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="75" y1="85" x2="75" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  led: {
    viewBox: '0 0 120 120',
    paths: `
      <path d="M40,50 L60,25 L80,50 Z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/>
      <line x1="40" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="2.5"/>
      <line x1="60" y1="50" x2="60" y2="85" stroke="currentColor" stroke-width="2"/>
      <line x1="60" y1="25" x2="60" y2="10" stroke="currentColor" stroke-width="2"/>
      <!-- Light rays -->
      <line x1="85" y1="30" x2="95" y2="22" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      <polygon points="93,20 97,24 91,24" fill="currentColor" opacity="0.3"/>
      <line x1="88" y1="40" x2="100" y2="38" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      <polygon points="98,36 102,40 96,40" fill="currentColor" opacity="0.3"/>
    `,
  },
  crystal: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="60" y1="15" x2="60" y2="35" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="85" x2="60" y2="105" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="42" y1="35" x2="78" y2="35" stroke="currentColor" stroke-width="2.5"/>
      <line x1="42" y1="85" x2="78" y2="85" stroke="currentColor" stroke-width="2.5"/>
      <rect x="46" y="42" width="28" height="36" rx="2" fill="currentColor" opacity="0.12"/>
      <rect x="46" y="42" width="28" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    `,
  },
  relay: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="28" y="28" width="64" height="64" rx="4" fill="currentColor" opacity="0.1"/>
      <rect x="28" y="28" width="64" height="64" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Coil -->
      <circle cx="48" cy="60" r="14" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Contact arm -->
      <line x1="68" y1="48" x2="85" y2="38" stroke="currentColor" stroke-width="2"/>
      <circle cx="68" cy="48" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="85" cy="60" r="3" fill="currentColor" opacity="0.4"/>
      <!-- Pins -->
      <line x1="38" y1="92" x2="38" y2="105" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="58" y1="92" x2="58" y2="105" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="78" y1="92" x2="78" y2="105" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  switch: {
    viewBox: '0 0 120 120',
    paths: `
      <line x1="25" y1="65" x2="45" y2="65" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="75" y1="65" x2="95" y2="65" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="47" cy="65" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="73" cy="65" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>
      <line x1="50" y1="63" x2="70" y2="48" stroke="currentColor" stroke-width="2.5"/>
    `,
  },
  power: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="30" y="35" width="60" height="50" rx="4" fill="currentColor" opacity="0.1"/>
      <rect x="30" y="35" width="60" height="50" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Lightning bolt -->
      <polygon points="62,40 52,58 58,58 50,78 70,55 62,55 68,40" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1"/>
      <!-- Input/output -->
      <line x1="15" y1="55" x2="30" y2="55" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="15" y1="68" x2="30" y2="68" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="90" y1="55" x2="105" y2="55" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="90" y1="68" x2="105" y2="68" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <text x="12" y="52" font-size="8" fill="currentColor" opacity="0.3">IN</text>
      <text x="93" y="52" font-size="8" fill="currentColor" opacity="0.3">OUT</text>
    `,
  },
  rf: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" opacity="0.1"/>
      <rect x="35" y="40" width="50" height="45" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Antenna -->
      <line x1="60" y1="40" x2="60" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="50" y1="22" x2="60" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="70" y1="22" x2="60" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- Signal waves -->
      <path d="M75,28 Q82,25 82,35" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      <path d="M80,24 Q90,20 90,38" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
      <path d="M85,20 Q98,15 98,42" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
      <!-- Pins -->
      <line x1="45" y1="85" x2="45" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="60" y1="85" x2="60" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="75" y1="85" x2="75" y2="100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  memory: {
    viewBox: '0 0 120 120',
    paths: `
      <rect x="25" y="30" width="70" height="50" rx="3" fill="currentColor" opacity="0.12"/>
      <rect x="25" y="30" width="70" height="50" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Memory blocks -->
      <rect x="32" y="38" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5"/>
      <rect x="48" y="38" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5"/>
      <rect x="64" y="38" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5"/>
      <rect x="80" y="38" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5"/>
      <rect x="32" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="0.5"/>
      <rect x="48" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="0.5"/>
      <rect x="64" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="0.5"/>
      <rect x="80" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="0.5"/>
      <!-- Notch -->
      <path d="M55,30 A5,5 0 0,0 65,30" fill="var(--color-bg-primary, #0B1426)"/>
      <!-- Pins bottom -->
      <line x1="35" y1="80" x2="35" y2="95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="48" y1="80" x2="48" y2="95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="60" y1="80" x2="60" y2="95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="72" y1="80" x2="72" y2="95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="85" y1="80" x2="85" y2="95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },
};

/**
 * Get the SVG type and color for a category slug
 */
export function getCategoryVisual(slug) {
  const entry = CATEGORY_ICONS[slug];
  if (entry) return entry;
  // Fuzzy match
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (slug?.includes(key) || key.includes(slug || '')) return val;
  }
  return { svg: 'chip', color: '#64748B' };
}

/**
 * Get SVG component data
 */
export function getComponentSvg(type) {
  return SVG_COMPONENTS[type] || SVG_COMPONENTS.chip;
}

/**
 * Determine component visual type from product data
 */
export function getProductVisualType(product) {
  const pn = (product?.partNumber || '').toUpperCase();
  const cat = product?.category?.slug || product?.category?.name?.toLowerCase() || '';
  const desc = (product?.description || '').toLowerCase();

  // Category-based
  if (CATEGORY_ICONS[cat]) return CATEGORY_ICONS[cat];

  // Part number patterns
  if (/^(STM32|ATMEGA|PIC|ESP32|MSP430|NRF5|SAM|LPC|RP2)/i.test(pn)) return { svg: 'chip', color: '#4285F4' };
  if (/^(XC|EP|ICE40|LFE|GW)/i.test(pn)) return { svg: 'fpga', color: '#7C3AED' };
  if (/^(W25|IS62|AS4C|MT4|HY57|K4|M27|SST|MX25)/i.test(pn)) return { svg: 'memory', color: '#2563EB' };
  if (/^(IRF|IRFP|FQP|AO|IRL|2N|BC|BD|TIP|BU|MJ)/i.test(pn)) return { svg: 'transistor', color: '#EA4335' };
  if (/^(1N|BAV|BAS|MBR|SS[0-9]|SR[0-9]|UF[0-9])/i.test(pn)) return { svg: 'diode', color: '#F59E0B' };
  if (/^(LM78|LM79|AMS1|REG|TPS|LT[0-9]|MC78|L78|LP29)/i.test(pn)) return { svg: 'power', color: '#DC2626' };
  if (/^(AD9|CC1|SI4|RFM|SX1|NRF24|ESP8266)/i.test(pn)) return { svg: 'rf', color: '#0891B2' };
  if (/^(GRM|CL[0-9]|CC0|MLCC|TAJC)/i.test(pn)) return { svg: 'capacitor', color: '#10B981' };
  if (/^(RC[0-9]|ERJ|CRCW|RES)/i.test(pn)) return { svg: 'resistor', color: '#8B5CF6' };

  // Description-based fallback
  if (desc.includes('capacitor')) return { svg: 'capacitor', color: '#10B981' };
  if (desc.includes('resistor')) return { svg: 'resistor', color: '#8B5CF6' };
  if (desc.includes('mosfet') || desc.includes('transistor')) return { svg: 'transistor', color: '#EA4335' };
  if (desc.includes('diode')) return { svg: 'diode', color: '#F59E0B' };
  if (desc.includes('inductor') || desc.includes('choke')) return { svg: 'inductor', color: '#F97316' };
  if (desc.includes('connector')) return { svg: 'connector', color: '#0EA5E9' };
  if (desc.includes('sensor')) return { svg: 'sensor', color: '#14B8A6' };
  if (desc.includes('led') || desc.includes('opto')) return { svg: 'led', color: '#EAB308' };
  if (desc.includes('crystal') || desc.includes('oscillator')) return { svg: 'crystal', color: '#6366F1' };
  if (desc.includes('relay')) return { svg: 'relay', color: '#78716C' };
  if (desc.includes('fpga') || desc.includes('cpld')) return { svg: 'fpga', color: '#7C3AED' };
  if (desc.includes('memory') || desc.includes('flash') || desc.includes('sram')) return { svg: 'memory', color: '#2563EB' };

  return { svg: 'chip', color: '#64748B' };
}

// ============================================================
// Auto Alt Text Generation
// ============================================================

// Map SVG type → readable component category name
const SVG_TYPE_LABELS = {
  chip: 'Integrated Circuit',
  fpga: 'FPGA',
  memory: 'Memory IC',
  transistor: 'Transistor',
  diode: 'Diode',
  capacitor: 'Capacitor',
  resistor: 'Resistor',
  inductor: 'Inductor',
  connector: 'Connector',
  sensor: 'Sensor',
  led: 'LED/Optoelectronic Component',
  crystal: 'Crystal/Oscillator',
  relay: 'Relay',
  switch: 'Switch',
  power: 'Power Supply IC',
  rf: 'RF Module',
};

/**
 * Generate SEO-optimized alt text for a product image.
 * 
 * Examples:
 *   "STM32F103C8T6 STMicroelectronics ARM Cortex-M3 MCU - Buy Electronic Components Online"
 *   "IRF540N Infineon N-Channel MOSFET Transistor - In Stock"
 *   "FPGA IC - Electronic Component" (minimal data)
 */
export function generateProductAlt(product) {
  if (!product) return 'Electronic Component';

  const parts = [];

  // Part number (always first — most critical for SEO)
  if (product.partNumber) parts.push(product.partNumber);

  // Manufacturer
  if (product.manufacturer) parts.push(product.manufacturer);

  // Short description or derive from category
  if (product.description) {
    // Take first ~60 chars of description, truncate at last space
    let desc = product.description.substring(0, 60);
    const lastSpace = desc.lastIndexOf(' ');
    if (lastSpace > 30) desc = desc.substring(0, lastSpace);
    parts.push(desc);
  } else {
    // Use category name or auto-detected type
    const catName = product.category?.name;
    if (catName) {
      parts.push(catName);
    } else {
      const visual = getProductVisualType(product);
      parts.push(SVG_TYPE_LABELS[visual.svg] || 'Electronic Component');
    }
  }

  // Suffix for SEO
  const stock = product.stock;
  if (stock && stock > 0) {
    parts.push('- In Stock');
  } else {
    parts.push('- Buy Online');
  }

  return parts.join(' ');
}

/**
 * Generate SEO-optimized alt text for a category image/icon.
 * 
 * Examples:
 *   "Integrated Circuits - Browse Electronic Components by Category"
 *   "Capacitors - Electronic Components Catalog"
 */
export function generateCategoryAlt(category) {
  if (!category) return 'Electronic Components Category';

  const name = typeof category === 'string' ? category : (category.name || category.slug || '');
  return `${name} - Electronic Components Catalog`;
}

/**
 * Generate a SEO-friendly image filename from product data.
 * 
 * Examples:
 *   "stm32f103c8t6-stmicroelectronics-arm-cortex-m3-mcu.webp"
 *   "irf540n-infineon-n-channel-mosfet-transistor.webp"
 */
export function generateImageFilename(product, ext = '.webp') {
  if (!product) return `electronic-component${ext}`;

  const parts = [];
  if (product.partNumber) {
    parts.push(product.partNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }
  if (product.manufacturer) {
    parts.push(product.manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }
  if (product.description) {
    // Take first 3-4 keywords from description
    const words = product.description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 4);
    if (words.length > 0) parts.push(words.join('-'));
  }

  const name = parts.join('-').substring(0, 80) || 'electronic-component';
  return `${name}${ext}`;
}

