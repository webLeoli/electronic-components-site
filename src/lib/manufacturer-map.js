// Manufacturer Name Standardization Map
// Format: "original name in DB" → "standardized display name"
//
// PRINCIPLE: In electronics procurement, buyers search by the brand printed
// on the component. Acquired brands that are still actively searched MUST
// remain independent — do NOT merge into parent company.
//
// Rules applied:
// 1. Remove ®, ™ symbols
// 2. Remove Inc., Corp., Ltd., LLC, Co., GmbH, AG, Pte, etc.
// 3. Merge only true duplicates (same company, different spelling)
// 4. Keep acquired brands that are still actively searched
// 5. Fix encoding issues

export const MANUFACTURER_STANDARDIZATION = {
  // === FPGA Brands (CRITICAL for FPGACenter) ===
  "AMD / Xilinx": "Xilinx",             // Keep Xilinx — #1 FPGA search term
  "Xilinx": "Xilinx",
  "Altera": "Altera",                   // Keep Altera — re-independent 2024
  "Lattice Semiconductor Corporation": "Lattice Semiconductor",
  "Lattice": "Lattice Semiconductor",

  // === Analog Devices family (keep acquired brands separate) ===
  "Analog Devices Inc.": "Analog Devices",
  "Analog Devices Inc./Maxim Integrated": "Analog Devices",  // DB combined entry → ADI
  "Analog Devices": "Analog Devices",
  "Maxim Integrated": "Maxim Integrated",         // KEEP — LDOs/ADCs still searched as Maxim
  "Linear Technology": "Linear Technology",         // KEEP — LTC series is industry standard
  // NOTE: "Analog Technologies" is a DIFFERENT company (San Jose) — do NOT map to ADI

  // === Renesas family (keep acquired brands separate) ===
  "Renesas": "Renesas",
  "Dialog Semiconductor": "Dialog Semiconductor",   // KEEP — PMICs still branded Dialog
  "Intersil Corporation": "Intersil",               // KEEP — precision analog, still searched
  "IDT": "IDT",                                     // KEEP — clock/timing ICs

  // === Microchip family (keep acquired brands separate) ===
  "Microchip": "Microchip",
  "Atmel": "Atmel",                                // KEEP — ATmega/ATtiny/SAM series
  "Microsemi Corporation": "Microsemi",            // KEEP — aerospace/defense brand
  "Microsemi": "Microsemi",
  "Standard Microsystems(SMSC)": "SMSC",           // KEEP — USB/Ethernet ICs
  "Micrel, Inc.": "Micrel",                        // KEEP — power management brand

  // === Infineon family ===
  "Infineon Technologies": "Infineon",
  "Infineon": "Infineon",
  "Cypress Semiconductor": "Cypress Semiconductor", // KEEP — PSoC/USB still branded Cypress
  "International Rectifier(IR)": "International Rectifier",  // KEEP — MOSFETs still searched as IR
  "International Rectifier": "International Rectifier",
  "Spansion®": "Spansion",                         // KEEP — NOR Flash brand

  // === Onsemi family ===
  "Onsemi": "Onsemi",
  "ON Semiconductor": "Onsemi",                    // Same company, different name
  "Fairchild Semiconductor": "Fairchild Semiconductor", // KEEP — MOSFETs/regulators

  // === NXP family ===
  "NXP Semiconductors": "NXP Semiconductors",
  "NXP": "NXP Semiconductors",
  "Freescale Semiconductor": "Freescale Semiconductor", // KEEP — i.MX, Kinetis series

  // === Texas Instruments family ===
  "Texas Instruments": "Texas Instruments",
  "Unitrode Corp.": "Unitrode",                   // KEEP — old TI acquisition, still on datasheets
  "TI Burr-Brown™": "Burr-Brown",                 // KEEP — precision ADC brand

  // === True duplicates (same company, merge OK) ===
  "ISSI": "ISSI",
  "ISSI®": "ISSI",
  "ISSI, Integrated Silicon Solution Inc": "ISSI",

  "Nexperia USA Inc.": "Nexperia",
  "Nexperia Energy Harvesting Solutions(Nowi)": "Nexperia",
  "Nexperia": "Nexperia",

  "Nuvoton Technology Corporation America": "Nuvoton Technology",
  "Nuvoton Technology": "Nuvoton Technology",

  "Digi International Inc. (Digi)": "Digi International",
  "Digi International, Inc.": "Digi International",

  "LSI Computer Systems, Inc. (LSI/CSI)": "LSI",
  "LSI/CSI": "LSI",

  "Astera Labs, Inc.": "Astera Labs",
  "Astera Labs": "Astera Labs",

  "Asahi Kasei Microdevices(AKM)": "AKM Semiconductor",
  "Asahi Kasei Microdevices": "AKM Semiconductor",

  "GigaDevice Semiconductor": "GigaDevice",
  "GigaDevice": "GigaDevice",

  "Sharp Microelectronics": "Sharp",
  "Socle Technology SHARP": "Sharp",
  "Sharp": "Sharp",

  "FTDI, Future Technology Devices International Ltd": "FTDI",
  "FTDI Chip": "FTDI",
  "FTDI": "FTDI",

  "Toshiba Semiconductor and Storage": "Toshiba",
  "Toshiba": "Toshiba",

  "MYIR Tech": "MYIR Tech",
  "MYIR Tech Limited": "MYIR Tech",

  "GHI Electronics, LLC": "GHI Electronics",
  "GHI Electronics": "GHI Electronics",

  "Broadcom Limited": "Broadcom",
  "Broadcom": "Broadcom",

  "Lantronix, Inc.": "Lantronix",
  "Lantronix": "Lantronix",

  "Samsung": "Samsung",
  "Samsung Electro-Mechanics": "Samsung",

  "Omron Automation & Safety": "Omron",
  "Omron Electronic Components": "Omron",

  "Alpha & Omega Semiconductor": "Alpha & Omega Semiconductor",
  "Alpha & Omega": "Alpha & Omega Semiconductor",

  "Micron Technology Inc.": "Micron",
  "Micron": "Micron",

  "Realtek": "Realtek",
  "Realtek Semiconductor": "Realtek",

  "InvenSense": "TDK InvenSense",
  "TDK InvenSense": "TDK InvenSense",

  "Finisar Corporation": "Finisar",  // Keep — optical transceiver brand
  "Finisar": "Finisar",

  "Motorola, Inc.": "Motorola",

  "Sigma Designs Inc.": "Sigma Designs",

  // === Remove legal suffixes ===
  "ABLIC Inc.": "ABLIC",
  "Everspin Technologies Inc.": "Everspin Technologies",
  "GSI Technology Inc.": "GSI Technology",
  "Holt Integrated Circuits Inc.": "Holt Integrated Circuits",
  "Monolithic Power Systems Inc.": "Monolithic Power Systems",
  "Nisshinbo Micro Devices Inc.": "Nisshinbo Micro Devices",
  "NTE Electronics Inc.": "NTE Electronics",
  "Cirrus Logic Inc.": "Cirrus Logic",
  "Etron Technology, Inc.": "Etron Technology",
  "HVM Technology, Inc.": "HVM Technology",
  "Kaga FEI America, Inc.": "Kaga FEI",
  "Kioxia America, Inc.": "Kioxia",
  "Marvell Technology, Inc.": "Marvell",
  "Micro Commercial Components, Corp.": "MCC",
  "Micross Components, Inc.": "Micross Components",
  "Ampleon USA Inc.": "Ampleon",
  "Panjit International Inc.": "Panjit",
  "Powerex Inc.": "Powerex",
  "Efinix, Inc.": "Efinix",
  "Critical Link, LLC": "Critical Link",
  "iNRCORE, LLC": "iNRCORE",
  "Mitex, LLC": "Mitex",
  "Binho, LLC": "Binho",
  "QST Products LLC.": "QST Products",
  "Delkin Devices,Inc.": "Delkin Devices",
  "Grayhill Inc.": "Grayhill",
  "Nearson Inc.": "Nearson",
  "Netlist Inc.": "Netlist",
  "DLP Design Inc.": "DLP Design",
  "Prolabs Ltd.": "Prolabs",
  "SST Sensing Ltd.": "SST Sensing",
  "Intelligent Memory Ltd.": "Intelligent Memory",
  "Azoteq (Pty) Ltd.": "Azoteq",
  "Trinamic Motion Control GmbH": "Trinamic",
  "BECOM Systems GmbH": "BECOM Systems",
  "Octavo Systems LLC": "Octavo Systems",
  "Adafruit Industries LLC": "Adafruit",
  "Semtech Corporation": "Semtech",
  "CTS Corporation": "CTS",
  "Terasic Inc.": "Terasic",
  "CCS, Inc.": "CCS",
  "ECS Inc.": "ECS",
  "ebm-papst Inc.": "ebm-papst",
  "IEI Integration Corp.": "IEI",
  "HY Electronic (Cayman) Limited": "HY Electronic",
  "Swissbit AG": "Swissbit",
  "Micro Crystal AG": "Micro Crystal",
  "Flexxon Pte Ltd": "Flexxon",
  "Insignis Technology Corporation": "Insignis Technology",
  "Fremont Micro Devices Ltd": "Fremont Micro Devices",
  "Elite Semiconductor Microelectronics Technology": "Elite Semiconductor",
  "Dell Technologies OEM Solutions": "Dell Technologies",
  "Eon Silicon Solution, Inc.": "Eon Silicon",

  // === Remove ® ™ symbols ===
  "Macom®": "MACOM",
  "Mornsun®": "Mornsun",
  "MoSys™": "MoSys",
  "Moxa®": "Moxa",

  // === Fix encoding ===
  "Weidmüller": "Weidmuller",
  "Boréas Technologies": "Boreas Technologies",

  // === Shorten / Clean ===
  "System-On-Chip (SOC) Technologies": "SOC Technologies",
  "B&K Precision": "BK Precision",
  "Wandboard.Org": "Wandboard",
  "Diodes Incorporated": "Diodes",
  "Pericom Semiconductor": "Diodes",   // fully absorbed, parts re-branded
  "Rochester Electronics": "Rochester Electronics",
  "Skyworks Solutions": "Skyworks",
  "Silicon Labs": "Silicon Labs",
  "ROHM Semiconductor": "ROHM",
  "Sanken Electric": "Sanken",
  "Intel": "Intel",
  "Torex Semiconductor": "Torex Semiconductor",
  "STMicroelectronics": "STMicroelectronics",
  "Vishay": "Vishay",
  "Quality Semiconductor": "Quality Semiconductor",
  "Harris Semiconductor": "Harris Semiconductor",  // Keep — legacy mil-spec parts
};

// Generate URL-safe slug from standardized name
export function manufacturerSlug(name) {
  const std = MANUFACTURER_STANDARDIZATION[name] || name;
  return std
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get standardized display name
export function standardizeName(name) {
  return MANUFACTURER_STANDARDIZATION[name] || name;
}
