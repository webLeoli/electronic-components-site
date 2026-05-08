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

export const FALLBACK_PARTS = [
  { partNumber: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', category: { name: 'Microcontrollers (MCU)' }, stock: 15000, minPrice: 2.85, status: 'active' },
  { partNumber: 'XC7A35T-1CPG236C', manufacturer: 'AMD / Xilinx', category: { name: 'FPGAs' }, stock: 2000, minPrice: 18.90, status: 'active' },
  { partNumber: 'LM7805CT', manufacturer: 'Texas Instruments', category: { name: 'Linear Regulators (LDO)' }, stock: 8500, minPrice: 0.45, status: 'active' },
  { partNumber: 'ATMEGA328P-AU', manufacturer: 'Microchip', category: { name: 'Microcontrollers (MCU)' }, stock: 12000, minPrice: 1.95, status: 'active' },
  { partNumber: 'IS61WV25616BLL-10TLI', manufacturer: 'ISSI', category: { name: 'SRAM' }, stock: 5000, minPrice: 3.20, status: 'active' },
  { partNumber: 'EP4CE6E22C8N', manufacturer: 'Intel', category: { name: 'FPGAs' }, stock: 1500, minPrice: 6.80, status: 'eol' },
  { partNumber: 'AD9361BBCZ', manufacturer: 'Analog Devices Inc.', category: { name: 'Drivers, Receivers & Transceivers' }, stock: 200, minPrice: 85.00, status: 'nrnd' },
  { partNumber: 'EPM240T100C5N', manufacturer: 'Intel', category: { name: 'CPLDs' }, stock: 3000, minPrice: 3.20, status: 'eol' },
];

export const FALLBACK_BRANDS = [
  'Texas Instruments', 'STMicroelectronics', 'Microchip', 'NXP Semiconductors', 'Infineon Technologies',
  'Analog Devices Inc.', 'Onsemi', 'Renesas', 'Skyworks Solutions', 'Cypress Semiconductor',
  'Rochester Electronics', 'Torex Semiconductor', 'ABLIC Inc.', 'Intel', 'AMD / Xilinx',
  'Diodes Incorporated', 'Micron Technology Inc.', 'ROHM Semiconductor', 'Silicon Labs',
  'Lattice Semiconductor Corporation', 'ISSI, Integrated Silicon Solution Inc',
  'Monolithic Power Systems Inc.', 'Nexperia USA Inc.', 'Winbond Electronics',
];
