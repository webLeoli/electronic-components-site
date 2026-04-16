export const FALLBACK_CATEGORIES = [
  { name: 'Integrated Circuits', slug: 'integrated-circuits', icon: '⚡', _count: { products: 3200 }, parentId: null, children: [] },
  { name: 'Discrete Semiconductors', slug: 'discrete-semiconductors', icon: '◆', _count: { products: 1850 }, parentId: null, children: [] },
  { name: 'Capacitors', slug: 'capacitors', icon: '⊞', _count: { products: 960 }, parentId: null, children: [] },
  { name: 'Resistors', slug: 'resistors', icon: 'Ω', _count: { products: 720 }, parentId: null, children: [] },
  { name: 'Connectors', slug: 'connectors', icon: '⊕', _count: { products: 1100 }, parentId: null, children: [] },
  { name: 'Sensors', slug: 'sensors', icon: '◉', _count: { products: 480 }, parentId: null, children: [] },
  { name: 'Optoelectronics', slug: 'optoelectronics', icon: '◈', _count: { products: 350 }, parentId: null, children: [] },
  { name: 'Crystals & Oscillators', slug: 'crystals-oscillators', icon: '◇', _count: { products: 280 }, parentId: null, children: [] },
  { name: 'Relays', slug: 'relays', icon: '⚙', _count: { products: 220 }, parentId: null, children: [] },
  { name: 'Switches', slug: 'switches', icon: '⊘', _count: { products: 180 }, parentId: null, children: [] },
  { name: 'Power Supplies', slug: 'power-supplies', icon: '⊡', _count: { products: 150 }, parentId: null, children: [] },
  { name: 'RF / RFID', slug: 'rf-rfid', icon: '◎', _count: { products: 120 }, parentId: null, children: [] },
];

export const FALLBACK_PARTS = [
  { partNumber: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', category: { name: 'Microcontrollers' }, stock: 15000, minPrice: 2.85, status: 'active' },
  { partNumber: 'LM7805CT', manufacturer: 'Texas Instruments', category: { name: 'Voltage Regulators' }, stock: 8500, minPrice: 0.45, status: 'active' },
  { partNumber: 'ATMEGA328P-AU', manufacturer: 'Microchip', category: { name: 'Microcontrollers' }, stock: 12000, minPrice: 1.95, status: 'active' },
  { partNumber: 'NE555P', manufacturer: 'Texas Instruments', category: { name: 'Timers' }, stock: 50000, minPrice: 0.15, status: 'active' },
  { partNumber: 'IRF540NPBF', manufacturer: 'Infineon', category: { name: 'MOSFETs' }, stock: 25000, minPrice: 0.65, status: 'active' },
  { partNumber: 'XC6SLX9-2TQG144C', manufacturer: 'Xilinx', category: { name: 'FPGAs' }, stock: 500, minPrice: 12.50, status: 'obsolete' },
  { partNumber: 'AD9361BBCZ', manufacturer: 'Analog Devices', category: { name: 'RF Transceivers' }, stock: 200, minPrice: 85.00, status: 'nrnd' },
  { partNumber: 'EPM240T100C5N', manufacturer: 'Intel/Altera', category: { name: 'CPLDs' }, stock: 3000, minPrice: 3.20, status: 'eol' },
];

export const FALLBACK_BRANDS = [
  'Texas Instruments', 'STMicroelectronics', 'Microchip', 'NXP', 'Infineon',
  'Analog Devices', 'ON Semiconductor', 'Renesas', 'Broadcom', 'Maxim Integrated',
  'Vishay', 'ROHM', 'Murata', 'TDK', 'Samsung', 'Xilinx', 'Intel', 'Lattice',
  'Cypress', 'Nexperia', 'Diodes Inc', 'ISSI', 'Winbond', 'Alliance Memory',
];
