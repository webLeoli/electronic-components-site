/**
 * Manufacturer Data Enrichment Script
 *
 * Strategy:
 *   1. Top brands: curated descriptions, specialties, headquarters, founded year
 *   2. All others: auto-generate from their product category distribution in DB
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Curated data for major semiconductor brands ──
const CURATED = {
  'Texas Instruments': {
    description: 'Texas Instruments (TI) is one of the world\'s largest semiconductor companies, specializing in analog and embedded processing chips. TI designs and manufactures semiconductors that help over 100,000 customers transform the future of electronics. Their products are integral to industrial, automotive, personal electronics, communications equipment, and enterprise systems.',
    specialties: '["Analog ICs", "Embedded Processors", "Power Management", "Data Converters", "Amplifiers", "Interface ICs", "Clock & Timing"]',
    founded: '1951', headquarters: 'Dallas, Texas, USA', country: 'US',
    website: 'https://www.ti.com',
    stockNote: 'FPGACenter maintains extensive TI inventory including hard-to-find legacy parts. We stock both current-production and obsolete TI components with full traceability.',
  },
  'STMicroelectronics': {
    description: 'STMicroelectronics is a global semiconductor leader serving customers across the spectrum of electronics applications. With a portfolio of over 15,000 products, ST provides innovative solutions for Smart Driving, IoT, 5G, and power management. Their STM32 microcontroller family is one of the most widely used MCU platforms worldwide.',
    specialties: '["Microcontrollers (STM32)", "Power Semiconductors", "MEMS Sensors", "Motor Drivers", "Automotive ICs", "Industrial ICs"]',
    founded: '1987', headquarters: 'Geneva, Switzerland', country: 'CH',
    website: 'https://www.st.com',
    stockNote: 'Authorized STM32 and ST power device sourcing. FPGACenter stocks the full STM32F/G/H/L series and STPower MOSFETs with competitive lead times.',
  },
  'Microchip': {
    description: 'Microchip Technology is a leading provider of smart, connected, and secure embedded control solutions. Their portfolio includes PIC and AVR microcontrollers, dsPIC DSCs, analog and interface products, FPGA/SoCs, and wireless connectivity solutions. Microchip serves over 125,000 customers across industrial, automotive, consumer, aerospace, and communications markets.',
    specialties: '["PIC/AVR Microcontrollers", "Analog & Interface", "Wireless (Wi-Fi, BLE, LoRa)", "FPGAs (Microsemi)", "Memory (SST)", "Timing & Communication"]',
    founded: '1989', headquarters: 'Chandler, Arizona, USA', country: 'US',
    website: 'https://www.microchip.com',
    stockNote: 'Full Microchip product line available including legacy PIC16/PIC18 and acquired Microsemi FPGA inventory. We specialize in sourcing Microchip parts affected by extended lead times.',
  },
  'NXP Semiconductors': {
    description: 'NXP Semiconductors is a global leader in secure connectivity solutions for embedded applications, driving innovation in automotive, industrial & IoT, mobile, and communication infrastructure. NXP\'s technology powers solutions for a smarter, safer, and more connected world with a strong focus on automotive processing and security.',
    specialties: '["Automotive Processors", "NFC & RFID", "Secure Elements", "i.MX Applications Processors", "LPC Microcontrollers", "RF Power Amplifiers"]',
    founded: '2006', headquarters: 'Eindhoven, Netherlands', country: 'NL',
    website: 'https://www.nxp.com',
    stockNote: 'Comprehensive NXP inventory including i.MX, LPC, and Kinetis series. Hard-to-find automotive-grade NXP parts available with full PPAP documentation.',
  },
  'Infineon Technologies': {
    description: 'Infineon Technologies is a world leader in semiconductor solutions for power systems, IoT, and automotive applications. Following the acquisition of Cypress Semiconductor, Infineon offers one of the broadest portfolios for automotive, industrial power control, and security applications. Their products enable decarbonization and digitalization across industries.',
    specialties: '["Power MOSFETs & IGBTs", "Automotive MCUs (AURIX)", "Security Controllers", "Wi-Fi/BT (Cypress)", "PSoC MCUs", "Radar Sensors"]',
    founded: '1999', headquarters: 'Neubiberg, Germany', country: 'DE',
    website: 'https://www.infineon.com',
    stockNote: 'Infineon and legacy Cypress/IR parts in stock. FPGACenter sources genuine Infineon power devices and AURIX MCUs for automotive and industrial applications.',
  },
  'Analog Devices Inc.': {
    description: 'Analog Devices (ADI) is a global leader in high-performance analog, mixed-signal, and digital signal processing integrated circuits. ADI\'s products convert, condition, and process real-world phenomena such as light, sound, temperature, motion, and pressure into electrical signals. Following the Maxim Integrated acquisition, ADI offers an unmatched breadth of signal chain solutions.',
    specialties: '["Data Converters (ADC/DAC)", "Amplifiers & Comparators", "Power Management (Maxim)", "RF & Microwave", "Sensors & MEMS", "Interface & Isolation"]',
    founded: '1965', headquarters: 'Wilmington, Massachusetts, USA', country: 'US',
    website: 'https://www.analog.com',
    stockNote: 'ADI and legacy Maxim/Linear Technology parts sourced directly. FPGACenter specializes in precision ADI data converters and RF components.',
  },
  'Onsemi': {
    description: 'onsemi (formerly ON Semiconductor) is a leading supplier of intelligent power and sensing technologies. The company provides industry-leading products for automotive, industrial, cloud power, and IoT applications. onsemi\'s portfolio is focused on intelligent power and sensing solutions that are enabling a more sustainable ecosystem.',
    specialties: '["Power MOSFETs", "Image Sensors", "Automotive Sensing", "SiC Power Devices", "Motor Drivers", "LED Drivers"]',
    founded: '1999', headquarters: 'Scottsdale, Arizona, USA', country: 'US',
    website: 'https://www.onsemi.com',
    stockNote: 'Full onsemi catalog available including Fairchild Semiconductor legacy parts. SiC modules and automotive-grade image sensors in stock.',
  },
  'Renesas': {
    description: 'Renesas Electronics is a premier supplier of advanced semiconductor solutions including microcontrollers, SoC solutions, analog and power devices. Renesas is the #1 supplier of MCUs and a leading supplier of automotive SoCs globally. Their embedded processing solutions serve automotive, industrial, infrastructure, and IoT markets.',
    specialties: '["Automotive MCUs (RH850)", "RA/RX/RL78 MCUs", "Power Management", "Analog & Mixed Signal", "Timing (IDT)", "Connectivity"]',
    founded: '2010', headquarters: 'Tokyo, Japan', country: 'JP',
    website: 'https://www.renesas.com',
    stockNote: 'Renesas, legacy IDT and Intersil parts available. FPGACenter stocks Renesas automotive MCUs and timing ICs with certified authenticity.',
  },
  'Intel': {
    description: 'Intel Corporation is the world\'s largest semiconductor chip manufacturer. Beyond CPUs, Intel\'s Programmable Solutions Group (formerly Altera) produces industry-leading FPGAs, CPLDs, and structured ASICs used in data centers, communications, military, and industrial markets. Intel PSG\'s Stratix, Arria, Cyclone, and MAX families are foundational to modern FPGA design.',
    specialties: '["FPGAs (Stratix, Arria, Cyclone)", "CPLDs (MAX)", "Processors & SoCs", "Ethernet Controllers", "Memory (Optane)", "Programmable Acceleration"]',
    founded: '1968', headquarters: 'Santa Clara, California, USA', country: 'US',
    website: 'https://www.intel.com',
    stockNote: 'Intel FPGA/CPLD specialist. FPGACenter maintains deep stock of Cyclone, MAX, Arria, and Stratix series including legacy Altera parts and obsolete packages.',
  },
  'AMD / Xilinx': {
    description: 'AMD\'s Adaptive and Embedded Computing Group (formerly Xilinx) is the world\'s leading FPGA and adaptive SoC company. Xilinx invented the FPGA in 1985 and continues to lead the industry with Versal Adaptive SoCs, UltraScale+, and cost-optimized Artix/Spartan families. Their devices power 5G infrastructure, data centers, automotive ADAS, aerospace, and industrial systems.',
    specialties: '["FPGAs (Artix, Kintex, Virtex)", "Adaptive SoCs (Versal, Zynq)", "Spartan FPGAs", "Alveo Accelerator Cards", "Vivado Design Suite", "AI/ML Inference"]',
    founded: '1984', headquarters: 'San Jose, California, USA', country: 'US',
    website: 'https://www.xilinx.com',
    stockNote: 'Core FPGA supplier. FPGACenter is specialized in Xilinx/AMD FPGA sourcing with inventory spanning Spartan-3 through Versal. Obsolete Xilinx parts available.',
  },
  'Lattice Semiconductor Corporation': {
    description: 'Lattice Semiconductor is a leader in low-power, small form-factor FPGAs and programmable connectivity solutions. Their products enable smart, secure, and connected solutions for the network edge in industrial, automotive, computing, communications, and consumer markets. Lattice\'s CrossLink, MachXO, iCE, and Certus/Nexus FPGA families are optimized for power-sensitive edge applications.',
    specialties: '["Low-Power FPGAs", "CrossLink FPGA", "MachXO FPGAs", "iCE40 FPGAs", "Certus/Nexus FPGAs", "FPGA IP Solutions"]',
    founded: '1983', headquarters: 'Hillsboro, Oregon, USA', country: 'US',
    website: 'https://www.latticesemi.com',
    stockNote: 'Lattice FPGA specialist. Full iCE40, MachXO, ECP, and CrossLink inventory including legacy discontinued parts.',
  },
  'Diodes Incorporated': {
    description: 'Diodes Incorporated is a leading global manufacturer and supplier of high-quality application-specific standard products within the discrete, logic, analog, and mixed-signal semiconductor markets. Their products are found in consumer electronics, computing, communications, industrial, and automotive end markets.',
    specialties: '["Discrete Semiconductors", "Logic ICs", "Analog ICs", "Connectivity & Timing", "Power Management", "LED Drivers"]',
    founded: '1959', headquarters: 'Plano, Texas, USA', country: 'US',
    website: 'https://www.diodes.com',
    stockNote: 'Comprehensive Diodes Inc. inventory. MOSFETs, Schottky diodes, and logic ICs available with volume pricing.',
  },
  'ROHM Semiconductor': {
    description: 'ROHM Semiconductor is a global leader in SiC power devices, analog ICs, and passive components. Headquartered in Kyoto, Japan, ROHM produces everything from ICs and discrete semiconductors to modules and passive components. Their SiC MOSFET technology leads the industry for EV and power conversion applications.',
    specialties: '["SiC Power Devices", "Power Management ICs", "LED Drivers", "Op-Amps", "Transistors & Diodes", "Resistors & Capacitors"]',
    founded: '1958', headquarters: 'Kyoto, Japan', country: 'JP',
    website: 'https://www.rohm.com',
    stockNote: 'ROHM SiC devices and analog ICs in stock. FPGACenter offers competitive pricing on ROHM power management solutions.',
  },
  'Silicon Labs': {
    description: 'Silicon Laboratories (Silicon Labs) is the leader in secure, intelligent wireless technology for IoT. Their integrated hardware and software platform, intuitive development tools, and unmatched ecosystem enable developers to build connected solutions for industrial automation, smart home, metering, and commercial buildings.',
    specialties: '["Wireless SoCs (EFR32)", "IoT Solutions", "Bluetooth & Zigbee", "8-bit MCUs (EFM8)", "32-bit MCUs (EFM32)", "Timing & Isolation"]',
    founded: '1996', headquarters: 'Austin, Texas, USA', country: 'US',
    website: 'https://www.silabs.com',
    stockNote: 'Silicon Labs wireless and MCU products available. EFR32 Wireless Gecko and legacy C8051F series in stock.',
  },
  'Nexperia USA Inc.': {
    description: 'Nexperia is the expert in essential semiconductors — discrete devices, logic, and MOSFETs that are the building blocks of every electronic design. Shipping over 100 billion components annually, Nexperia\'s products set industry benchmarks for efficiency, reliability, and consistency in high-volume automotive, industrial, and mobile applications.',
    specialties: '["Discrete Semiconductors", "MOSFETs (Trench)", "Logic ICs", "ESD Protection", "Bipolar Transistors", "Automotive-Grade Discretes"]',
    founded: '2017', headquarters: 'Nijmegen, Netherlands', country: 'NL',
    website: 'https://www.nexperia.com',
    stockNote: 'Nexperia discretes and logic in high volume. Automotive AEC-Q101 qualified parts available from stock.',
  },
  'Monolithic Power Systems Inc.': {
    description: 'Monolithic Power Systems (MPS) designs high-performance, integrated power management solutions. MPS\'s simple and innovative single-chip designs are used across automotive, industrial, cloud computing, telecom, and consumer electronics. Known for best-in-class efficiency, small footprint, and ease of use.',
    specialties: '["DC-DC Converters", "LED Drivers", "Motor Drivers", "Battery Management", "Power Modules", "Automotive Power"]',
    founded: '1997', headquarters: 'Kirkland, Washington, USA', country: 'US',
    website: 'https://www.monolithicpower.com',
    stockNote: 'MPS power management ICs available. FPGACenter sources genuine MPS parts for telecom and automotive power applications.',
  },
  'Micron Technology Inc.': {
    description: 'Micron Technology is one of the world\'s largest semiconductor memory and storage manufacturers. Micron produces DRAM, NAND flash, NOR flash, and 3D XPoint memory used in mobile, data center, automotive, and IoT applications. Their innovations in memory density and performance drive advances in AI, machine learning, and autonomous vehicles.',
    specialties: '["DRAM (DDR4/DDR5)", "NAND Flash", "NOR Flash", "Managed NAND (eMMC/UFS)", "Automotive Memory", "Industrial SSDs"]',
    founded: '1978', headquarters: 'Boise, Idaho, USA', country: 'US',
    website: 'https://www.micron.com',
    stockNote: 'Micron memory products in stock including hard-to-find DDR3/DDR4 and legacy NOR flash. Automotive-grade memory available.',
  },
  'Winbond Electronics': {
    description: 'Winbond Electronics is a leading global supplier of semiconductor memory solutions including Serial Flash (SPI NOR), DRAM (SDR/DDR), and Specialty DRAM. Winbond\'s products are essential building blocks for IoT devices, consumer electronics, communications equipment, and automotive systems.',
    specialties: '["SPI NOR Flash", "Serial NAND Flash", "Specialty DRAM", "HyperRAM", "QsPI Flash", "Automotive Memory"]',
    founded: '1987', headquarters: 'Taichung, Taiwan', country: 'TW',
    website: 'https://www.winbond.com',
    stockNote: 'Winbond flash memory specialist. W25Q series SPI flash and W9825G SDRAM available from stock.',
  },
  'Murata': {
    description: 'Murata Manufacturing is the world\'s leading manufacturer of ceramic-based passive electronic components including MLCCs, inductors, and filters. Murata also produces wireless modules, sensors, power supplies, and timing devices that are essential to smartphones, automotive electronics, and IoT devices worldwide.',
    specialties: '["MLCCs (Capacitors)", "Inductors & Coils", "EMI Filters", "Wireless Modules", "Resonators & Oscillators", "Power Supplies"]',
    founded: '1944', headquarters: 'Nagaokakyo, Kyoto, Japan', country: 'JP',
    website: 'https://www.murata.com',
    stockNote: 'Murata passive components available including allocated MLCCs. FPGACenter sources Murata capacitors and inductors for high-volume projects.',
  },
  'TDK': {
    description: 'TDK Corporation is a global leader in electronic components and systems. TDK\'s portfolio includes passive components (capacitors, inductors, ferrites), sensors, power supplies, and energy devices (batteries). TDK\'s InvenSense MEMS sensors and EPCOS passive components are industry standards.',
    specialties: '["MLCCs (TDK/EPCOS)", "Inductors & Transformers", "Ferrite Cores", "Film Capacitors", "MEMS Sensors (InvenSense)", "Rechargeable Batteries"]',
    founded: '1935', headquarters: 'Tokyo, Japan', country: 'JP',
    website: 'https://www.tdk.com',
    stockNote: 'TDK and EPCOS passive components in stock. FPGACenter carries TDK capacitors, inductors, and ferrite products.',
  },
  'Vishay': {
    description: 'Vishay Intertechnology is one of the world\'s largest manufacturers of discrete semiconductors and passive electronic components. Vishay\'s products include MOSFETs, diodes, resistors, inductors, and capacitors that serve virtually every sector of the electronics industry from automotive and industrial to consumer and military.',
    specialties: '["Resistors (Dale, Beyschlag)", "MOSFETs (Siliconix)", "Diodes", "Inductors", "Capacitors", "Optocouplers"]',
    founded: '1962', headquarters: 'Malvern, Pennsylvania, USA', country: 'US',
    website: 'https://www.vishay.com',
    stockNote: 'Vishay full product line available. Precision resistors, Siliconix MOSFETs, and IR diodes in stock with volume discounts.',
  },
  'Samsung': {
    description: 'Samsung Semiconductor (Samsung LSI) is the world\'s second-largest semiconductor company and the global leader in memory chips. Samsung produces DRAM, NAND Flash, and foundry chips powering data centers, mobile devices, and AI systems. Samsung also leads in advanced process nodes for foundry services.',
    specialties: '["DRAM (DDR/LPDDR)", "NAND Flash (V-NAND)", "Mobile SoCs (Exynos)", "Image Sensors (ISOCELL)", "Display Drivers", "Foundry Services"]',
    founded: '1969', headquarters: 'Hwaseong, South Korea', country: 'KR',
    website: 'https://semiconductor.samsung.com',
    stockNote: 'Samsung memory and semiconductor products available. LPDDR and eMMC for mobile applications in stock.',
  },
  'Yageo': {
    description: 'YAGEO Corporation is one of the world\'s largest passive component manufacturers. YAGEO produces resistors, capacitors, inductors, and wireless components serving automotive, industrial, telecom, and consumer markets. Through acquisitions of Pulse Electronics, KEMET, and others, YAGEO offers a comprehensive passive component portfolio.',
    specialties: '["Chip Resistors", "MLCCs (KEMET)", "Tantalum Capacitors", "Inductors", "Ferrite Beads", "Wireless Components"]',
    founded: '1977', headquarters: 'New Taipei City, Taiwan', country: 'TW',
    website: 'https://www.yageo.com',
    stockNote: 'YAGEO and KEMET passive components available at competitive pricing. Chip resistors and MLCCs in stock for volume orders.',
  },
  'Skyworks Solutions': {
    description: 'Skyworks Solutions is an innovator of high-performance analog semiconductors. Skyworks\' RF solutions connect people, places, and things spanning automotive, broadband, cellular infrastructure, connected home, industrial, medical, military, smartphone, tablet, and wearable markets.',
    specialties: '["RF Front-End Modules", "Power Amplifiers", "Filters & Duplexers", "Switches & Attenuators", "Wireless Connectivity", "Automotive RF"]',
    founded: '2002', headquarters: 'Irvine, California, USA', country: 'US',
    website: 'https://www.skyworksinc.com',
    stockNote: 'Skyworks RF solutions available. Power amplifiers and front-end modules for 4G/5G applications in stock.',
  },
  'Cypress Semiconductor': {
    description: 'Cypress Semiconductor (now part of Infineon) was a leader in embedded solutions including PSoC programmable SoCs, USB controllers, SRAM memory, and wireless connectivity (Wi-Fi, Bluetooth). Cypress products remain widely used and are still manufactured under the Infineon umbrella.',
    specialties: '["PSoC MCUs", "USB Controllers", "SRAM Memory", "Wi-Fi & Bluetooth (CYW)", "Capacitive Sensing (CapSense)", "NOR Flash"]',
    founded: '1982', headquarters: 'San Jose, California, USA', country: 'US',
    website: 'https://www.infineon.com/cypress',
    stockNote: 'Legacy Cypress parts including PSoC, CY7C SRAM, and CYW wireless modules available. FPGACenter specializes in sourcing discontinued Cypress components.',
  },
  'Rochester Electronics': {
    description: 'Rochester Electronics is the world\'s largest authorized distributor of end-of-life (EOL) semiconductors, providing a continuous source of supply for critical applications. Rochester is authorized by over 70 semiconductor manufacturers to continue the supply of their discontinued products with full manufacturer quality and traceability.',
    specialties: '["End-of-Life Semiconductors", "Obsolete Components", "Licensed Manufacturing", "Long-Term Supply", "Drop-In Replacements", "Military/Aerospace Grade"]',
    founded: '1981', headquarters: 'Newburyport, Massachusetts, USA', country: 'US',
    website: 'https://www.rocelec.com',
    stockNote: 'Rochester Electronics authorized parts available through FPGACenter. Military and aerospace obsolete components with full traceability.',
  },
};

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📝 Manufacturer Data Enrichment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allMfrs = await prisma.manufacturer.findMany({ orderBy: { name: 'asc' } });
  console.log(`  Total manufacturers: ${allMfrs.length}\n`);

  // Phase 1: Apply curated data
  let curatedCount = 0;
  for (const mfr of allMfrs) {
    const curated = CURATED[mfr.name];
    if (curated) {
      await prisma.manufacturer.update({
        where: { id: mfr.id },
        data: {
          description: curated.description,
          specialties: curated.specialties,
          founded: curated.founded,
          headquarters: curated.headquarters,
          country: curated.country || mfr.country,
          website: curated.website || mfr.website,
          stockNote: curated.stockNote,
        },
      });
      console.log(`  ✅ [Curated] ${mfr.name}`);
      curatedCount++;
    }
  }
  console.log(`\n  Phase 1 done: ${curatedCount} brands enriched with curated data.\n`);

  // Phase 2: Auto-generate for remaining manufacturers
  const remaining = allMfrs.filter(m => !CURATED[m.name]);
  console.log(`  Phase 2: Auto-generating for ${remaining.length} manufacturers...\n`);

  let autoCount = 0;
  for (const mfr of remaining) {
    if (mfr.description && mfr.description.length > 50) continue; // already has content

    // Get category distribution for this manufacturer
    const cats = await prisma.$queryRawUnsafe(
      `SELECT c."name", COUNT(*)::int as cnt FROM "Product" p JOIN "Category" c ON p."categoryId" = c."id" WHERE p."manufacturer" = $1 GROUP BY c."name" ORDER BY cnt DESC LIMIT 8`,
      mfr.name
    );
    const productCount = await prisma.product.count({ where: { manufacturer: mfr.name } });

    const catNames = cats.map(c => c.name);
    const topCats = catNames.slice(0, 5);
    const specialtiesJson = JSON.stringify(topCats);

    // Generate description from real data
    const catText = topCats.length > 0 ? topCats.join(', ') : 'electronic components';
    const desc = `${mfr.name} is a semiconductor manufacturer producing ${catText}. ` +
      `FPGACenter stocks ${productCount.toLocaleString()} ${mfr.name} products with global sourcing capabilities, ` +
      `quality inspection, and competitive pricing. ` +
      `All ${mfr.name} components sourced through FPGACenter are 100% original with full traceability documentation.`;

    const stockNote = `FPGACenter carries ${productCount.toLocaleString()} ${mfr.name} part numbers. ` +
      `Submit an RFQ for volume pricing and lead time on any ${mfr.name} component.`;

    await prisma.manufacturer.update({
      where: { id: mfr.id },
      data: {
        description: desc,
        specialties: specialtiesJson,
        stockNote: stockNote,
      },
    });
    autoCount++;
    if (autoCount % 50 === 0) process.stdout.write(`  ⏳ ${autoCount}/${remaining.length}\n`);
  }

  console.log(`  Phase 2 done: ${autoCount} brands auto-enriched.\n`);
  console.log(`  ✅ Total: ${curatedCount + autoCount} manufacturers enriched.`);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
