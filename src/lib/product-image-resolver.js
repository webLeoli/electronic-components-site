// Shared product image resolver for UI, metadata, and structured data.
// "Representative" means a generic package-family image, not an exact part photo.

const REPRESENTATIVE_PACKAGE_IMAGES = {
  'fpga-bga-large': {
    src: '/package-images/generated/fpga-bga-large-photo.jpg',
    label: 'Large BGA FPGA package',
  },
  'fpga-bga-small': {
    src: '/package-images/generated/fpga-bga-small-photo.jpg',
    label: 'Compact BGA FPGA package',
  },
  'fpga-qfp': {
    src: '/package-images/generated/fpga-qfp-photo.jpg',
    label: 'QFP FPGA or CPLD package',
  },
  'cpld-plcc': {
    src: '/package-images/generated/cpld-plcc-photo.jpg',
    label: 'PLCC CPLD package',
  },
  'ic-bga': {
    src: '/package-images/generated/ic-bga-photo.jpg',
    label: 'BGA integrated circuit package',
  },
  'ic-lga': {
    src: '/package-images/generated/ic-lga-photo.jpg',
    label: 'LGA integrated circuit package',
  },
  'ic-wlcsp': {
    src: '/package-images/generated/ic-wlcsp-photo.jpg',
    label: 'WLCSP chip-scale package',
  },
  'ic-qfn': {
    src: '/package-images/generated/ic-qfn-photo.jpg',
    label: 'QFN or DFN integrated circuit package',
  },
  'ic-soic': {
    src: '/package-images/generated/ic-soic-photo.jpg',
    label: 'SOIC or TSSOP integrated circuit package',
  },
  'dip': {
    src: '/package-images/generated/dip-photo.jpg',
    label: 'DIP through-hole integrated circuit package',
  },
  'power-to220': {
    src: '/package-images/generated/power-to220-photo.jpg',
    label: 'TO-220 power semiconductor package',
  },
  'power-dpak': {
    src: '/package-images/generated/power-dpak-photo.jpg',
    label: 'DPAK or D2PAK power semiconductor package',
  },
  'regulator-sot223': {
    src: '/package-images/generated/regulator-sot223-photo.jpg',
    label: 'SOT-223 voltage regulator package',
  },
  'transistor-sot': {
    src: '/package-images/generated/transistor-sot-photo.jpg',
    label: 'SOT surface-mount semiconductor package',
  },
  'module-board': {
    src: '/package-images/generated/module-board-photo.jpg',
    label: 'Electronic module package',
  },
  'passive-smd': {
    src: '/package-images/generated/passive-smd-photo.jpg',
    label: 'SMD passive component package',
  },
  'diode-axial': {
    src: '/package-images/generated/diode-axial-photo.jpg',
    label: 'Axial diode package',
  },
  'diode-sod': {
    src: '/package-images/generated/diode-sod-photo.jpg',
    label: 'SMD diode package',
  },
  'crystal-metal': {
    src: '/package-images/generated/crystal-metal-photo.jpg',
    label: 'Crystal or oscillator package',
  },
  'capacitor-radial': {
    src: '/package-images/generated/capacitor-radial-photo.jpg',
    label: 'Radial electrolytic capacitor package',
  },
  'inductor-smd': {
    src: '/package-images/generated/inductor-smd-photo.jpg',
    label: 'Shielded SMD inductor package',
  },
};

function parseSpecsObject(specs) {
  if (!specs) return {};
  if (typeof specs === 'object') return specs;
  try {
    return JSON.parse(specs);
  } catch {
    return {};
  }
}

function getProductImageBlob(product) {
  const specs = parseSpecsObject(product?.specs);
  const specPackageValues = Object.entries(specs)
    .filter(([key]) => /package|case|mount|footprint|category|family|type/i.test(key))
    .map(([, value]) => value)
    .filter(Boolean);

  return [
    product?.partNumber,
    product?.manufacturer,
    product?.description,
    product?.packageType,
    product?.mountType,
    product?.category?.name,
    product?.category?.slug,
    product?.category?.parent?.name,
    product?.category?.parent?.slug,
    ...specPackageValues,
  ].filter(Boolean).join(' ').toUpperCase();
}

function extractPackagePinCount(text) {
  const packageFirst = text.match(
    /\b(?:BGA|FBGA|CABGA|CSBGA|UFBGA|UBGA|LFBGA|TEBGA|TFBGA|FGG|FFG|FBG|CPG|CSG|CLG|FTG|FLG|FHG|SBG|TQFP|LQFP|VQFP|PQFP|EQFP|TQG|PQG|EQG|QFN|DFN|VQFN|LFCSP|SOIC|SOP|SSOP|TSSOP|MSOP|DIP|PDIP|PLCC|TO-?220|SOT-?223|SOT-?23)[-_ ]?(\d{2,4})\b/i
  );
  if (packageFirst) return Number(packageFirst[1]);

  const numberFirst = text.match(
    /\b(\d{2,4})[-_ ]?(?:BGA|FBGA|CABGA|CSBGA|UFBGA|UBGA|LFBGA|TEBGA|TFBGA|TQFP|LQFP|VQFP|PQFP|EQFP|QFN|DFN|VQFN|LFCSP|SOIC|SOP|SSOP|TSSOP|MSOP|DIP|PDIP|PLCC)\b/i
  );
  return numberFirst ? Number(numberFirst[1]) : null;
}

function hasAny(text, patterns) {
  return patterns.some(pattern => pattern.test(text));
}

function isFpgaLike(product, text) {
  const pn = (product?.partNumber || '').toUpperCase();
  return (
    /\b(FPGA|FIELD PROGRAMMABLE|PROGRAMMABLE LOGIC|CPLD|PLD)\b/.test(text) ||
    /^(XC|XQ|XA|EP[0-9A-Z]|EPM|10M|5M|LCMX|LFE|ICE40|A3P|A3PE|AGL|APA|M2S|GW[0-9A-Z])/i.test(pn)
  );
}

function isCpldLike(product, text) {
  const pn = (product?.partNumber || '').toUpperCase();
  return (
    /\b(CPLD|PLD|MAX II|MAX 3000|MAX 7000|COOLRUNNER|MACHXO)\b/.test(text) ||
    /^(EPM|MAX|XC95|XCR|ATF15|LCMX)/i.test(pn)
  );
}

function representativeEntry(key, source, confidence = 'medium') {
  const entry = REPRESENTATIVE_PACKAGE_IMAGES[key];
  return entry ? { key, source, confidence, kind: 'representative', ...entry } : null;
}

export function getProductRepresentativeImage(product) {
  if (!product || product.imageUrl) return null;

  const text = getProductImageBlob(product);
  const pinCount = extractPackagePinCount(text);
  const fpgaLike = isFpgaLike(product, text);
  const cpldLike = isCpldLike(product, text);

  const bgaPatterns = [
    /\b(?:BGA|FBGA|CABGA|CSBGA|UFBGA|UBGA|LFBGA|TEBGA|TFBGA)\b/,
    /\b(?:FGG|FFG|FBG|CPG|CSG|CLG|FTG|FLG|FHG|SBG|UBG)\d{2,4}\b/,
  ];
  const qfpPatterns = [
    /\b(?:TQFP|LQFP|VQFP|PQFP|EQFP|QFP)\b/,
    /\b(?:TQG|PQG|EQG|VQG)\d{2,4}\b/,
    /\b[EPFT]\d{2,4}C?\d?[NI]?\b/,
  ];
  const passiveSmdPattern = /\b(?:0201|0402|0603|0805|1206|1210|1812|MLCC|CHIP RESISTOR)\b/;
  const diodeLike = /\b(?:DIODE|RECTIFIER|ZENER|TVS|SCHOTTKY|BRIDGE)\b/.test(text);
  const capacitorLike = /\b(?:CAPACITOR|CAP|ELECTROLYTIC|TANTALUM)\b/.test(text);

  if (fpgaLike || cpldLike) {
    if (hasAny(text, qfpPatterns)) return representativeEntry('fpga-qfp', 'package', 'high');
    if (/\b(?:PLCC|JLCC|CLCC)\b/.test(text)) return representativeEntry('cpld-plcc', 'package', 'high');
    if (hasAny(text, bgaPatterns)) {
      return pinCount && pinCount <= 256
        ? representativeEntry('fpga-bga-small', 'package', 'high')
        : representativeEntry('fpga-bga-large', 'package', 'high');
    }
    return cpldLike
      ? representativeEntry('fpga-qfp', 'category', 'medium')
      : representativeEntry('fpga-bga-large', 'category', 'medium');
  }

  if (/\b(?:MODULE|MOD|SOM|WROOM|WROVER|BOARD|EVAL)\b/.test(text)) {
    return representativeEntry('module-board', 'package', 'high');
  }
  if (/\b(?:DPAK|D2PAK|TO-?252|TO-?263)\b/.test(text)) {
    return representativeEntry('power-dpak', 'package', 'high');
  }
  if (/\b(?:TO-?220|TO-?247)\b/.test(text)) {
    return representativeEntry('power-to220', 'package', 'high');
  }
  if (/\bSOT-?223\b/.test(text)) {
    return representativeEntry('regulator-sot223', 'package', 'high');
  }
  if (/\b(?:SOT-?23|SOT-?89|SC-70)\b/.test(text)) {
    return representativeEntry('transistor-sot', 'package', 'high');
  }
  if (/\b(?:DIP|PDIP|CDIP)\b/.test(text)) {
    return representativeEntry('dip', 'package', 'high');
  }
  if (/\b(?:WLCSP|WLP|WCSP|DSBGA|UCSP|CSP)\b/.test(text)) {
    return representativeEntry('ic-wlcsp', 'package', 'high');
  }
  if (/\b(?:LGA|LAND GRID ARRAY)\b/.test(text)) {
    return representativeEntry('ic-lga', 'package', 'high');
  }
  if (hasAny(text, bgaPatterns)) {
    return representativeEntry('ic-bga', 'package', 'high');
  }
  if (/\b(?:QFN|DFN|VQFN|WQFN|LFCSP|MLF)\b/.test(text)) {
    return representativeEntry('ic-qfn', 'package', 'high');
  }
  if (hasAny(text, qfpPatterns)) {
    return representativeEntry('fpga-qfp', 'package', 'high');
  }
  if (/\b(?:SOIC|SOP|SSOP|TSSOP|MSOP|HSOP)\b/.test(text)) {
    return representativeEntry('ic-soic', 'package', 'high');
  }
  if (/\b(?:SOD-?123|SOD-?323|SOD-?523|SOD-?923)\b/.test(text) || (diodeLike && /\b(?:SMA|SMB|SMC|DO-?214)\b/.test(text))) {
    return representativeEntry('diode-sod', 'package', 'high');
  }
  if (/\b(?:DO-?41|DO-?35|AXIAL)\b/.test(text)) {
    return representativeEntry('diode-axial', 'package', 'high');
  }
  if (/\b(?:CRYSTAL|OSCILLATOR|XTAL|HC-?49|XO|TCXO|VCXO|OCXO)\b/.test(text)) {
    return representativeEntry('crystal-metal', 'package', 'high');
  }
  if (capacitorLike && !passiveSmdPattern.test(text) && /\b(?:RADIAL|ELECTROLYTIC|ALUMINUM|THROUGH[- ]?HOLE)\b/.test(text)) {
    return representativeEntry('capacitor-radial', 'package', 'high');
  }
  if (/\b(?:INDUCTOR|CHOKE|COIL|POWER INDUCTOR)\b/.test(text)) {
    return representativeEntry('inductor-smd', 'category', 'medium');
  }
  if (passiveSmdPattern.test(text) || /\b(?:RESISTOR|CAPACITOR)\b/.test(text)) {
    return representativeEntry('passive-smd', 'package', 'medium');
  }
  if (/\b(?:MEMORY|FLASH|SRAM|DRAM|EEPROM)\b/.test(text)) {
    return representativeEntry('ic-soic', 'category', 'low');
  }

  return null;
}

export function getProductDisplayImage(product) {
  if (product?.imageUrl) {
    return {
      kind: 'exact',
      source: 'product',
      confidence: 'high',
      src: product.imageUrl,
      label: 'Exact product image',
    };
  }
  return getProductRepresentativeImage(product);
}

export function generateRepresentativeImageAlt(product, image) {
  const identity = [product?.partNumber, product?.manufacturer].filter(Boolean).join(' ');
  const label = image?.label || 'representative electronic component package';
  return `${identity || 'Electronic component'} - ${label}`;
}
