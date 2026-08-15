// Pure FPGA/CPLD series definitions and where-builders.
// NO imports from '@/lib/*' here on purpose: scripts/ (plain node, no path
// aliases) import this file directly, e.g. scripts/flag-programmable-logic.mjs.

const SERIES = [
  {
    slug: 'xilinx-spartan-6',
    title: 'Xilinx Spartan-6 FPGA Sourcing',
    shortTitle: 'Spartan-6',
    maker: 'Xilinx / AMD',
    family: 'Legacy FPGA',
    intro: 'Source Spartan-6 FPGAs for sustaining production, repairs, and redesign bridge buys with stock, date code, and lead-time verification.',
    searchIntent: 'XC6SLX, XC6S, Spartan-6 replacement stock',
    prefixes: ['XC6S', 'XC6SLX'],
    manufacturers: ['Xilinx', 'AMD'],
  },
  {
    slug: 'xilinx-spartan-3',
    title: 'Xilinx Spartan-3 FPGA Sourcing',
    shortTitle: 'Spartan-3',
    maker: 'Xilinx / AMD',
    family: 'Legacy FPGA',
    intro: 'Find Spartan-3, Spartan-3E, and Spartan-3A parts for long-life industrial and embedded systems.',
    searchIntent: 'XC3S, Spartan-3E, Spartan-3A sourcing',
    prefixes: ['XC3S', 'XC3SE', 'XC3SD', 'XC3SA'],
    manufacturers: ['Xilinx', 'AMD'],
  },
  {
    slug: 'xilinx-virtex-legacy',
    title: 'Legacy Xilinx Virtex FPGA Sourcing',
    shortTitle: 'Virtex Legacy',
    maker: 'Xilinx / AMD',
    family: 'High-value FPGA',
    intro: 'Quote Virtex-II, Virtex-4, and Virtex-5 parts with sourcing checks for provenance, package, speed grade, and lot history.',
    searchIntent: 'XC2V, XC4V, XC5V Virtex sourcing',
    prefixes: ['XC2V', 'XC4V', 'XC5V'],
    manufacturers: ['Xilinx', 'AMD'],
  },
  {
    slug: 'xilinx-7-series',
    title: 'Xilinx 7 Series FPGA and SoC Sourcing',
    shortTitle: '7 Series',
    maker: 'Xilinx / AMD',
    family: 'FPGA / SoC',
    intro: 'Source Artix-7, Kintex-7, Virtex-7, and Zynq-7000 parts for production shortages, approved alternates, and urgent replenishment.',
    searchIntent: 'XC7A, XC7K, XC7V, XC7Z sourcing',
    prefixes: ['XC7A', 'XC7K', 'XC7V', 'XC7Z'],
    manufacturers: ['Xilinx', 'AMD'],
  },
  {
    slug: 'altera-cyclone',
    title: 'Altera Cyclone FPGA Sourcing',
    shortTitle: 'Cyclone',
    maker: 'Altera / Intel',
    family: 'FPGA',
    intro: 'Quote Cyclone, Cyclone II, Cyclone III, and Cyclone IV devices for legacy product continuity and shortage recovery.',
    searchIntent: 'EP1C, EP2C, EP3C, EP4C, Cyclone IV sourcing',
    prefixes: ['EP1C', 'EP2C', 'EP3C', 'EP4C', 'EP4CE'],
    manufacturers: ['Altera', 'Intel'],
  },
  {
    slug: 'altera-max-cpld',
    title: 'Altera MAX CPLD Sourcing',
    shortTitle: 'MAX CPLD',
    maker: 'Altera / Intel',
    family: 'CPLD',
    intro: 'Source MAX 3000, MAX 7000, MAX II, and related CPLD families with MOQ and date-code confirmation.',
    searchIntent: 'EPM, MAX II, MAX 7000 CPLD sourcing',
    prefixes: ['EPM', 'epm'],
    manufacturers: ['Altera', 'Intel'],
  },
  {
    slug: 'lattice-machxo-ecp',
    title: 'Lattice MachXO and ECP FPGA Sourcing',
    shortTitle: 'Lattice FPGA',
    maker: 'Lattice',
    family: 'FPGA / CPLD',
    intro: 'Quote MachXO, MachXO2, MachXO3, ECP, and ispMACH devices for embedded control, bridging logic, and board-level repairs.',
    searchIntent: 'LCMXO, LFE, ispMACH sourcing',
    prefixes: ['LCMXO', 'LCMXO2', 'LCMXO3', 'LFE', 'M4A'],
    manufacturers: ['Lattice'],
  },
  {
    slug: 'microchip-actel-proasic',
    title: 'Microchip Actel ProASIC and IGLOO Sourcing',
    shortTitle: 'Actel / ProASIC',
    maker: 'Microchip / Actel',
    family: 'FPGA',
    intro: 'Source Actel, ProASIC3, IGLOO, and aerospace-oriented programmable logic with quality documentation review before shipment.',
    searchIntent: 'A3P, A3PE, AGL, Actel FPGA sourcing',
    // ProASIC Plus uses APA075/150/300/450/600/750/1000. Avoid the
    // overly-broad "APA" prefix, which also matches Advantech APAX industrial
    // controllers and expansion backplanes.
    prefixes: ['A3P', 'A3PE', 'AGL', 'APA0', 'APA1', 'APA3', 'APA4', 'APA6', 'APA7', 'RTAX'],
    manufacturers: ['Actel', 'Microchip'],
  },
];

function startsWithAny(field, prefixes) {
  return prefixes.map(prefix => ({ [field]: { startsWith: prefix, mode: 'insensitive' } }));
}

function categoryEqualsAny(terms) {
  return terms.map(term => ({
    category: { is: { name: { equals: term, mode: 'insensitive' } } },
  }));
}

export function getFpgaSeries() {
  return SERIES;
}

export function getFpgaSeriesBySlug(slug) {
  return SERIES.find(series => series.slug === slug) || null;
}

export function buildSeriesWhere(series, { stockedOnly = false, indexableOnly = false } = {}) {
  const and = [
    {
      OR: startsWithAny('partNumber', series.prefixes),
    },
  ];

  and.push({ duplicateOfId: null });
  if (stockedOnly) and.push({ stock: { gt: 0 } });
  if (indexableOnly) and.push({ indexable: true });

  return { AND: and };
}

export function buildProgrammableLogicWhere({ stockedOnly = false, indexableOnly = false } = {}) {
  const and = [
    {
      // Manufacturer alone is not evidence that a part is programmable logic:
      // Microchip, Intel and AMD also sell large MCU, analog and processor
      // catalogues. Match a known family prefix or an explicit FPGA/CPLD
      // category so homepage recommendations stay topically accurate.
      OR: [
        ...SERIES.flatMap(series => startsWithAny('partNumber', series.prefixes)),
        ...categoryEqualsAny([
          'FPGAs',
          'CPLDs',
          'PLDs - Programmable Logic Devices',
          'FPGAs with Microcontrollers',
        ]),
      ],
    },
  ];

  and.push({ duplicateOfId: null });
  if (stockedOnly) and.push({ stock: { gt: 0 } });
  if (indexableOnly) and.push({ indexable: true });

  return { AND: and };
}

