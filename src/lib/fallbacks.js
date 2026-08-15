export const FALLBACK_CATEGORIES = [
  { name: 'Embedded & Programmable', slug: 'embedded', icon: '⚡', _count: { products: 146000 }, parentId: null, children: [] },
  { name: 'Power Management', slug: 'power-management', icon: '🔋', _count: { products: 145000 }, parentId: null, children: [] },
  { name: 'Memory', slug: 'memory', icon: '💾', _count: { products: 67000 }, parentId: null, children: [] },
  { name: 'Clock & Timing', slug: 'clock-timing', icon: '⏰', _count: { products: 62000 }, parentId: null, children: [] },
  { name: 'Analog & Mixed Signal', slug: 'analog', icon: '📈', _count: { products: 56000 }, parentId: null, children: [] },
  { name: 'Logic', slug: 'logic', icon: '🔢', _count: { products: 47000 }, parentId: null, children: [] },
  { name: 'Interface & Communication', slug: 'interface', icon: '🔌', _count: { products: 33000 }, parentId: null, children: [] },
  { name: 'Audio, Video & Telecom', slug: 'audio-video-telecom', icon: '🎬', _count: { products: 20000 }, parentId: null, children: [] },
];

// Shown only when the database is unreachable, so the site still renders
// navigation instead of an error.
//
// stock and minPrice are deliberately absent. They used to carry invented
// numbers — "15,000 in stock, $2.85" for STM32F103C8T6 — and a database outage
// does not stop the homepage from rendering, so those figures were served to
// customers and crawlers as if they were live inventory. On a site whose product
// IS stock accuracy, quoting an availability nobody verified is the one thing
// the fallback must not do. Without them the same cards render "Available on
// request" and "RFQ", which is true in every state of the world.
export const FALLBACK_PARTS = [
  { partNumber: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', category: { name: 'Microcontrollers (MCU)' }, stock: 0, minPrice: null, status: 'active' },
  { partNumber: 'XC7A35T-1CPG236C', manufacturer: 'Xilinx', category: { name: 'FPGAs' }, stock: 0, minPrice: null, status: 'active' },
  { partNumber: 'LM7805CT', manufacturer: 'Texas Instruments', category: { name: 'Linear Regulators (LDO)' }, stock: 0, minPrice: null, status: 'active' },
  { partNumber: 'ATMEGA328P-AU', manufacturer: 'Microchip', category: { name: 'Microcontrollers (MCU)' }, stock: 0, minPrice: null, status: 'active' },
  { partNumber: 'IS61WV25616BLL-10TLI', manufacturer: 'ISSI', category: { name: 'SRAM' }, stock: 0, minPrice: null, status: 'active' },
  { partNumber: 'EP4CE6E22C8N', manufacturer: 'Intel', category: { name: 'FPGAs' }, stock: 0, minPrice: null, status: 'eol' },
  { partNumber: 'AD9361BBCZ', manufacturer: 'Analog Devices', category: { name: 'Drivers, Receivers & Transceivers' }, stock: 0, minPrice: null, status: 'nrnd' },
  { partNumber: 'EPM240T100C5N', manufacturer: 'Intel', category: { name: 'CPLDs' }, stock: 0, minPrice: null, status: 'eol' },
];

// Brand names here must be the CANONICAL spellings from
// lib/manufacturer-canonical.js. They are used as a degraded-mode brand list and
// as a last-resort resolver in the /manufacturer/[slug] route, so a duplicate
// spelling in this list resurrects the very 0-product page the merge retired —
// 'AMD / Xilinx', 'Analog Devices Inc.', 'Lattice Semiconductor Corporation',
// 'Micron Technology Inc.', 'Monolithic Power Systems Inc.' and
// 'Nexperia USA Inc.' all used to be listed and all resolved to empty pages.
export const FALLBACK_BRANDS = [
  'Texas Instruments', 'STMicroelectronics', 'Microchip', 'NXP Semiconductors', 'Infineon',
  'Analog Devices', 'Onsemi', 'Renesas', 'Skyworks', 'Cypress Semiconductor',
  'Rochester Electronics', 'Torex Semiconductor', 'ABLIC', 'Intel', 'Xilinx',
  'Diodes', 'Micron Technology', 'ROHM Semiconductor', 'Silicon Labs',
  'Lattice Semiconductor', 'ISSI',
  'Monolithic Power Systems', 'Nexperia', 'Winbond Electronics',
];
