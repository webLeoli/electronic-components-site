/**
 * FPGA/CPLD part-number decoder — pure string parsing, no data fetches.
 *
 * Powers /tools/fpga-part-number-decoder. Decoding is deliberately
 * conservative: every rule here states only what the vendor ordering guides
 * document for the covered families, and anything else is surfaced as an
 * unrecognized segment rather than a guess. A wrong decode shown to an
 * engineer is worse than an honest "verify against the ordering guide".
 *
 * Returned shape:
 *   {
 *     vendor, family, seriesSlug,      // seriesSlug → /fpga-sourcing/[slug]
 *     segments: [{ part, label, meaning }],
 *     notes: [string],
 *   }
 * or null when nothing matched.
 */

const XILINX_7_FAMILIES = {
  S: { name: 'Spartan-7', note: 'no serial transceivers in this family' },
  A: { name: 'Artix-7', note: null },
  K: { name: 'Kintex-7', note: null },
  V: { name: 'Virtex-7', note: null },
  Z: { name: 'Zynq-7000 (SoC: ARM + FPGA fabric)', note: null },
};

const XILINX_TEMP = {
  C: 'Commercial temperature grade',
  I: 'Industrial temperature grade',
  E: 'Extended temperature grade',
  Q: 'Defense-grade temperature range',
};

const XILINX_PREFIX = {
  XC: 'Commercial product line',
  XA: 'Automotive (AEC-Q100 qualified) product line',
  XQ: 'Defense-grade product line',
};

const ALTERA_TEMP = {
  C: 'Commercial temperature grade',
  I: 'Industrial temperature grade',
  A: 'Automotive temperature grade',
};

// Altera package letter families. Digits after the letter mean different
// things per generation (see notes emitted alongside), so only the letter is
// decoded here.
const ALTERA_PKG = {
  E: 'EQFP package family',
  T: 'TQFP package family',
  Q: 'PQFP package family',
  F: 'FineLine BGA package family',
  U: 'UBGA package family',
  M: 'MBGA package family',
  C: 'FBGA package family',
};

function seg(part, label, meaning) {
  return { part, label, meaning };
}

function decodeXilinx7(pn) {
  const m = /^(XC|XA|XQ)7(S|A|K|V|Z)(\d{2,4})(T)?-(\d)(L)?([A-Z]{2,3})(\d{2,4})(C|I|E|Q)?(ES)?$/.exec(pn);
  if (!m) return null;
  const [, prefix, fam, size, t, speed, lowV, pkg, pins, temp, es] = m;
  const family = XILINX_7_FAMILIES[fam];
  const segments = [
    seg(prefix, 'Product line', XILINX_PREFIX[prefix]),
    seg('7', 'Series', '7-series (28 nm generation)'),
    seg(fam, 'Family', family.name),
    seg(size + (t || ''), 'Capacity designator', `Approximate logic-cell class "${size}"${t ? '; T = serial transceivers on the die' : ''}`),
    seg(`-${speed}${lowV || ''}`, 'Speed grade', `Speed grade ${speed}${lowV ? 'L (low-voltage bin)' : ''} — on Xilinx FPGAs a HIGHER number is faster`),
    seg(pkg + pins, 'Package', `${pkg} package family, ${parseInt(pins, 10)} pins/balls${pkg.endsWith('G') ? ' (G = lead-free)' : ''}`),
  ];
  if (temp) segments.push(seg(temp, 'Temperature grade', XILINX_TEMP[temp]));
  if (es) segments.push(seg('ES', 'Engineering sample', 'NOT production silicon — do not accept against a production order'));
  const notes = [];
  if (family.note) notes.push(`${family.name}: ${family.note}.`);
  if (!temp) notes.push('No temperature grade suffix found — a complete orderable part number ends in C, I, E or Q.');
  return { vendor: 'Xilinx (AMD)', family: family.name, seriesSlug: 'xilinx-7-series', segments, notes };
}

function decodeXilinxSpartan6(pn) {
  const m = /^(XC|XA|XQ)6S(LX)(\d{1,3})(T)?-(\d)(L)?([A-Z]{2,3})(\d{2,4})(C|I|Q)?(ES)?$/.exec(pn);
  if (!m) return null;
  const [, prefix, lx, size, t, speed, lowV, pkg, pins, temp, es] = m;
  const segments = [
    seg(prefix, 'Product line', XILINX_PREFIX[prefix]),
    seg('6S', 'Series', 'Spartan-6 (45 nm generation)'),
    seg(lx + size + (t || ''), 'Device', `Spartan-6 LX${size}${t ? 'T — with serial transceivers' : ' — no transceivers'}`),
    seg(`-${speed}${lowV || ''}`, 'Speed grade', `Speed grade ${speed}${lowV ? 'L (low-power bin)' : ''} — higher is faster`),
    seg(pkg + pins, 'Package', `${pkg} package family, ${parseInt(pins, 10)} pins/balls${pkg.endsWith('G') ? ' (G = lead-free)' : ''}`),
  ];
  if (temp) segments.push(seg(temp, 'Temperature grade', XILINX_TEMP[temp]));
  if (es) segments.push(seg('ES', 'Engineering sample', 'NOT production silicon'));
  const notes = ['Spartan-6 is a legacy family with tightening supply — not the same architecture as Spartan-7.'];
  return { vendor: 'Xilinx (AMD)', family: 'Spartan-6', seriesSlug: 'xilinx-spartan-6', segments, notes };
}

function decodeXilinxUltraScale(pn) {
  const m = /^(XC|XQ)(KU|VU|ZU|AU)(\d{1,3})(P)?-?(\d)?(L?[A-Z]{2,4})?(\d{3,4})?(C|I|E)?(ES\d?)?$/.exec(pn);
  if (!m || !m[5]) return null; // require at least a speed grade to avoid loose matches
  const [, prefix, fam, size, plus, speed, pkg, pins, temp, es] = m;
  const famNames = { KU: 'Kintex UltraScale', VU: 'Virtex UltraScale', ZU: 'Zynq UltraScale+', AU: 'Artix UltraScale+' };
  const segments = [
    seg(prefix, 'Product line', XILINX_PREFIX[prefix]),
    seg(fam, 'Family', famNames[fam] + (plus ? '+' : '')),
    seg(size, 'Capacity designator', `Device size class ${size}`),
    seg(`-${speed}`, 'Speed grade', `Speed grade ${speed} — higher is faster`),
  ];
  if (pkg && pins) segments.push(seg(pkg + pins, 'Package', `${pkg} package family, ${parseInt(pins, 10)} balls — UltraScale package letters also encode construction; verify in the ordering guide`));
  if (temp) segments.push(seg(temp, 'Temperature grade', XILINX_TEMP[temp]));
  if (es) segments.push(seg(es, 'Engineering sample', 'NOT production silicon'));
  return { vendor: 'Xilinx (AMD)', family: famNames[fam], seriesSlug: null, segments, notes: [] };
}

function decodeXilinxXC9500(pn) {
  const m = /^XC95(\d{2,3})(XL|XV)?-(\d{1,2})([A-Z]{2,3})(\d{2,3})(C|I)?$/.exec(pn);
  if (!m) return null;
  const [, macro, variant, delay, pkg, pins, temp] = m;
  const segments = [
    seg(`XC95${macro}${variant || ''}`, 'Device', `XC9500${variant || ''} CPLD, ${parseInt(macro, 10)} macrocells${variant === 'XL' ? ' (3.3 V)' : variant === 'XV' ? ' (2.5 V)' : ' (5 V)'}`),
    seg(`-${delay}`, 'Speed', `${delay} ns propagation delay — on XC9500 CPLDs a LOWER number is faster (opposite of Xilinx FPGAs)`),
    seg(pkg + pins, 'Package', `${pkg} package family, ${parseInt(pins, 10)} pins`),
  ];
  if (temp) segments.push(seg(temp, 'Temperature grade', XILINX_TEMP[temp]));
  const notes = ['The entire XC9500/XL/XV product line is discontinued — supply is aftermarket only.'];
  return { vendor: 'Xilinx (AMD)', family: 'XC9500 CPLD', seriesSlug: null, segments, notes };
}

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

function decodeAlteraEP(pn) {
  const m = /^EP([1-4])(CE|CGX|C|SE|SGX|S|AGX)(\d{1,3})([A-Z])(\d{1,3})(C|I|A)(\d)(N)?(ES)?$/.exec(pn);
  if (!m) return null;
  const [, gen, fam, size, pkgL, pkgN, temp, speed, leadfree, es] = m;
  const roman = ROMAN[parseInt(gen, 10)];
  const famNames = {
    C: `Cyclone ${roman}`,
    CE: `Cyclone ${roman} E`,
    CGX: `Cyclone ${roman} GX (with transceivers)`,
    S: `Stratix ${roman}`,
    SE: `Stratix ${roman} E`,
    SGX: `Stratix ${roman} GX`,
    AGX: `Arria ${roman} GX`,
  };
  const famName = famNames[fam] || `EP${gen}${fam}`;
  // Two conventions coexist across generations: small digits are the package
  // body size in mm (Cyclone IV "F17" = 17×17 mm FBGA), large digits are the
  // pin/ball count (Cyclone II "T144" = TQFP-144).
  const pkgNum = parseInt(pkgN, 10);
  const pkgMeaning = pkgNum >= 40
    ? `${ALTERA_PKG[pkgL] || pkgL + ' package'}, ${pkgNum} pins/balls`
    : `${ALTERA_PKG[pkgL] || pkgL + ' package'}, ${pkgNum}×${pkgNum} mm body — digits are the BODY SIZE, not the pin count; ball count comes from the ordering guide`;
  const segments = [
    seg(`EP${gen}${fam}`, 'Family', famName),
    seg(size, 'Capacity', `Approximately ${parseInt(size, 10)}K logic elements`),
    seg(pkgL + pkgN, 'Package', pkgMeaning),
    seg(temp, 'Temperature grade', ALTERA_TEMP[temp]),
    seg(speed, 'Speed grade', `Speed grade ${speed} — on Altera a LOWER number is faster (inverted vs Xilinx)`),
  ];
  if (leadfree) segments.push(seg('N', 'Lead-free', 'RoHS-compliant lead-free package'));
  if (es) segments.push(seg('ES', 'Engineering sample', 'NOT production silicon'));
  const notes = [];
  if (parseInt(gen, 10) <= 3) notes.push(`${famName} is discontinued — supply is last-time-buy stock and aftermarket only.`);
  return { vendor: 'Altera (Intel)', family: famName, seriesSlug: 'altera-cyclone', segments, notes };
}

function decodeAlteraMax(pn) {
  const m = /^EPM(\d{2,4})([AGZ]?)([A-Z])(\d{2,3})(C|I|A)(\d{1,2})(N)?$/.exec(pn);
  if (!m) return null;
  const [, size, variant, pkgL, pkgN, temp, speed, leadfree] = m;
  const isMax2 = ['240', '570', '1270', '2210'].includes(size);
  const famName = isMax2 ? 'MAX II' : /^(3|7)/.test(size) ? `MAX ${size.startsWith('3') ? '3000' : '7000'}` : 'MAX-series CPLD';
  const segments = [
    seg(`EPM${size}${variant}`, 'Device', `${famName} CPLD, capacity designator ${size}${variant ? ` (variant ${variant})` : ''}`),
    seg(pkgL + pkgN, 'Package', `${ALTERA_PKG[pkgL] || pkgL + ' package'}, ${parseInt(pkgN, 10)} pins — on MAX-series the digits ARE the pin count`),
    seg(temp, 'Temperature grade', ALTERA_TEMP[temp]),
    seg(speed, 'Speed grade', `Speed grade ${speed} — lower is faster`),
  ];
  if (leadfree) segments.push(seg('N', 'Lead-free', 'RoHS-compliant lead-free package'));
  const notes = [];
  if (!isMax2) notes.push('MAX 3000/7000 families are discontinued — aftermarket supply only.');
  return { vendor: 'Altera (Intel)', family: famName, seriesSlug: 'altera-max-cpld', segments, notes };
}

function decodeAlteraMax10(pn) {
  const m = /^10M(\d{2})(S|D)([A-Z])([A-Z])(\d{2,3})(C|I|A)(\d{1,2})(G)?(ES)?$/.exec(pn);
  if (!m) return null;
  const [, size, supply, feat, pkgL, pkgN, temp, speed, leadfree, es] = m;
  const segments = [
    seg(`10M${size}`, 'Device', `MAX 10, approximately ${parseInt(size, 10)}K logic elements`),
    seg(supply, 'Supply option', supply === 'S' ? 'Single-supply' : 'Dual-supply'),
    seg(feat, 'Feature option', 'Feature code (analog/flash options) — verify the exact meaning in the Intel MAX 10 ordering guide'),
    seg(pkgL + pkgN, 'Package', `${ALTERA_PKG[pkgL] || pkgL + ' package'}, ${parseInt(pkgN, 10)} pins/balls`),
    seg(temp, 'Temperature grade', ALTERA_TEMP[temp]),
    seg(speed, 'Speed grade', `Speed grade ${speed} — lower is faster`),
  ];
  if (leadfree) segments.push(seg('G', 'Lead-free', 'RoHS-compliant lead-free package'));
  if (es) segments.push(seg('ES', 'Engineering sample', 'NOT production silicon'));
  return { vendor: 'Altera (Intel)', family: 'MAX 10', seriesSlug: 'altera-max-cpld', segments, notes: [] };
}

function decodeLatticeMachXO(pn) {
  const m = /^LCMXO([23])?-?(\d{3,5})([A-Z]{2})-?(\d)([A-Z]{2})(\d{2,3})(C|I)(ES)?$/.exec(pn);
  if (!m) return null;
  const [, gen, luts, variant, speed, pkgL, pkgN, temp, es] = m;
  const famName = gen ? `MachXO${gen}` : 'MachXO';
  const segments = [
    seg(`LCMXO${gen || ''}`, 'Family', famName),
    seg(luts, 'Capacity', `${parseInt(luts, 10)} LUTs`),
    seg(variant, 'Variant', 'Supply/performance variant (e.g. HC = high-performance 2.5/3.3 V, ZE = low-power 1.2 V) — verify in the Lattice ordering guide'),
    seg(`-${speed}`, 'Speed grade', `Speed grade ${speed}`),
    seg(pkgL + pkgN, 'Package', `${pkgL} package family, ${parseInt(pkgN, 10)} pins/balls`),
    seg(temp, 'Temperature grade', temp === 'C' ? 'Commercial temperature grade' : 'Industrial temperature grade'),
  ];
  if (es) segments.push(seg('ES', 'Engineering sample', 'NOT production silicon'));
  return { vendor: 'Lattice Semiconductor', family: famName, seriesSlug: 'lattice-machxo-ecp', segments, notes: [] };
}

function decodeMicrosemiProasic(pn) {
  const m = /^(A3PN?|AGLN?)(\d{3,4})-?(Z?[12F]?)([A-Z]{2}G?)(\d{2,3})(I)?$/.exec(pn);
  if (!m) return null;
  const [, fam, size, grade, pkg, pkgN, temp] = m;
  const famNames = { A3P: 'ProASIC3', A3PN: 'ProASIC3 nano', AGL: 'IGLOO', AGLN: 'IGLOO nano' };
  const segments = [
    seg(fam, 'Family', `${famNames[fam]} (flash-based, instant-on)`),
    seg(size, 'Capacity designator', `Device size class ${size}`),
  ];
  if (grade) segments.push(seg(grade, 'Speed/option', `Speed or option code "${grade}" — verify in the Microchip ordering guide`));
  segments.push(seg(pkg + pkgN, 'Package', `${pkg} package family, ${parseInt(pkgN, 10)} pins/balls${pkg.endsWith('G') ? ' (G = lead-free)' : ''}`));
  if (temp) segments.push(seg('I', 'Temperature grade', 'Industrial temperature grade'));
  return { vendor: 'Microchip (Actel/Microsemi)', family: famNames[fam], seriesSlug: 'microchip-actel-proasic', segments, notes: [] };
}

const DECODERS = [
  decodeXilinx7,
  decodeXilinxSpartan6,
  decodeXilinxUltraScale,
  decodeXilinxXC9500,
  decodeAlteraEP,
  decodeAlteraMax10,
  decodeAlteraMax,
  decodeLatticeMachXO,
  decodeMicrosemiProasic,
];

// Families we can name but not fully segment-decode: better an honest partial
// answer than silence or a guess.
const FAMILY_HINTS = [
  { re: /^5C/, vendor: 'Altera (Intel)', family: 'Cyclone V', seriesSlug: 'altera-cyclone', note: 'Cyclone V uses a longer multi-segment scheme (e.g. 5CSEBA6U23I7); verify segments against the Intel ordering guide.' },
  { re: /^5M/, vendor: 'Altera (Intel)', family: 'MAX V', seriesSlug: 'altera-max-cpld', note: 'MAX V numbering follows the EPM-style scheme.' },
  { re: /^ICE40/, vendor: 'Lattice Semiconductor', family: 'iCE40', seriesSlug: 'lattice-machxo-ecp', note: 'iCE40 numbering: family + variant + LUT class + package (e.g. ICE40HX4K-TQ144).' },
  { re: /^LFE5/, vendor: 'Lattice Semiconductor', family: 'ECP5', seriesSlug: 'lattice-machxo-ecp', note: 'ECP5 numbering: LFE5U/LFE5UM + LUT count + speed + package (e.g. LFE5U-85F-8BG554C).' },
  { re: /^XC2C/, vendor: 'Xilinx (AMD)', family: 'CoolRunner-II CPLD', seriesSlug: null, note: 'CoolRunner-II: XC2C + macrocell count + speed + package + temp (e.g. XC2C64A-7VQG44C). Family is NRND.' },
  { re: /^(XC3S|XC4V|XC5V|XC2V|XCV)/, vendor: 'Xilinx (AMD)', family: 'Legacy Xilinx FPGA (Spartan-3/Virtex)', seriesSlug: 'xilinx-spartan-3', note: 'Legacy families follow the classic XC scheme: device - speed grade - package + temp. Most are discontinued.' },
  { re: /^M2S/, vendor: 'Microchip (Microsemi)', family: 'SmartFusion2', seriesSlug: 'microchip-actel-proasic', note: 'SmartFusion2 SoC FPGA — verify segments against the Microchip ordering guide.' },
  { re: /^APA/, vendor: 'Microchip (Actel)', family: 'ProASIC Plus', seriesSlug: 'microchip-actel-proasic', note: 'ProASIC Plus is discontinued; supply is aftermarket only.' },
];

export function decodePartNumber(input) {
  const pn = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
  if (pn.length < 4) return null;

  for (const decode of DECODERS) {
    const result = decode(pn);
    if (result) return { ...result, normalized: pn, partial: false };
  }

  for (const hint of FAMILY_HINTS) {
    if (hint.re.test(pn)) {
      return {
        vendor: hint.vendor,
        family: hint.family,
        seriesSlug: hint.seriesSlug,
        segments: [],
        notes: [hint.note],
        normalized: pn,
        partial: true,
      };
    }
  }

  return null;
}

export const EXAMPLE_PARTS = [
  'XC7A35T-1CPG236C',
  'XC6SLX9-2TQG144C',
  'EP4CE22F17C6N',
  'EPM240T100C5N',
  '10M08SAE144C8G',
  'LCMXO2-1200HC-4TG100C',
  'XC95144XL-10TQG100C',
];
