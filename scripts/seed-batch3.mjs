import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const cats = {
    'microcontrollers':'Microcontrollers','memory':'Memory','analog':'Analog & Mixed Signal',
    'power-management':'Power Management','interface':'Interface ICs','sensors':'Sensors',
    'connectors':'Connectors','discrete':'Discrete Semiconductors','rf-wireless':'RF & Wireless',
    'clock-timing':'Clock & Timing','optoelectronics':'Optoelectronics',
    'automotive':'Automotive Grade ICs',
  };
  const catMap = {};
  for (const [slug, name] of Object.entries(cats)) {
    const c = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
    catMap[slug] = c.id;
  }
  const mfrs = ['GigaDevice','WCH','Allwinner','Rockchip','HiSilicon','Nations Technologies',
    'Airoha','BYD Semiconductor','SG Micro','Chipown','Holtek','Nuvoton','Realtek',
    'MediaTek','Qualcomm','Broadcom','Marvell','MaxLinear','Semtech','LoRa Alliance',
    'Silicon Labs','Nordic Semiconductor','Dialog Semiconductor','Qorvo','Skyworks',
    'NXP','Infineon','Renesas','Texas Instruments','Analog Devices','ON Semiconductor',
    'STMicroelectronics','Microchip','FTDI','Maxim Integrated','Vishay','Nexperia',
    'ROHM','Toshiba','Mitsubishi Electric','Amphenol','TE Connectivity','Hirose',
    'JAE Electronics','Harting','Phoenix Contact'];
  for (const name of mfrs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    await prisma.manufacturer.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  const products = [
    // ========== CHINESE SEMICONDUCTORS — GigaDevice ==========
    { pn:'GD32F103RCT6', mfr:'GigaDevice', desc:'ARM Cortex-M3 MCU, 256KB Flash, 48KB SRAM, 108MHz, STM32F103 compatible', cat:'microcontrollers', pkg:'LQFP-64', price:2.80, stock:500, lead:'In stock' },
    { pn:'GD32F303RCT6', mfr:'GigaDevice', desc:'ARM Cortex-M4 MCU, 256KB Flash, 48KB SRAM, 120MHz, DSP+FPU', cat:'microcontrollers', pkg:'LQFP-64', price:3.50, stock:400, lead:'In stock' },
    { pn:'GD32F407VET6', mfr:'GigaDevice', desc:'ARM Cortex-M4 MCU, 512KB Flash, 192KB SRAM, 168MHz', cat:'microcontrollers', pkg:'LQFP-100', price:5.00, stock:250, lead:'In stock' },
    { pn:'GD32E230C8T6', mfr:'GigaDevice', desc:'ARM Cortex-M23 MCU, 64KB Flash, 8KB SRAM, ultra-low cost', cat:'microcontrollers', pkg:'LQFP-48', price:0.80, stock:1000, lead:'In stock' },
    { pn:'GD32F450ZIT6', mfr:'GigaDevice', desc:'ARM Cortex-M4 MCU, 3MB Flash, 256KB SRAM, 200MHz, TFT-LCD', cat:'microcontrollers', pkg:'LQFP-144', price:8.00, stock:120, lead:'1-2 weeks' },
    { pn:'GD25Q128ESIG', mfr:'GigaDevice', desc:'SPI NOR Flash, 128Mb, 120MHz, quad SPI, wide voltage', cat:'memory', pkg:'SOIC-8', price:1.20, stock:800, lead:'In stock' },
    { pn:'GD25Q64CSIG', mfr:'GigaDevice', desc:'SPI NOR Flash, 64Mb, 120MHz, quad SPI', cat:'memory', pkg:'SOIC-8', price:0.80, stock:1200, lead:'In stock' },
    { pn:'GD25Q256DFIG', mfr:'GigaDevice', desc:'SPI NOR Flash, 256Mb, 120MHz, quad SPI, 4-byte address', cat:'memory', pkg:'SOIC-16', price:2.80, stock:300, lead:'In stock' },
    // ========== CHINESE — WCH (沁恒) ==========
    { pn:'CH340G', mfr:'WCH', desc:'USB to UART bridge, full speed USB 2.0, SOP-16', cat:'interface', pkg:'SOP-16', price:0.30, stock:2000, lead:'In stock' },
    { pn:'CH340C', mfr:'WCH', desc:'USB to UART bridge, no external crystal needed, SOP-16', cat:'interface', pkg:'SOP-16', price:0.35, stock:1500, lead:'In stock' },
    { pn:'CH32V307RCT6', mfr:'WCH', desc:'RISC-V MCU, 256KB Flash, 64KB SRAM, Ethernet, USB, 144MHz', cat:'microcontrollers', pkg:'LQFP-64', price:2.50, stock:400, lead:'In stock' },
    { pn:'CH32V003F4P6', mfr:'WCH', desc:'RISC-V MCU, 16KB Flash, 2KB SRAM, ultra-low cost, TSSOP-20', cat:'microcontrollers', pkg:'TSSOP-20', price:0.10, stock:5000, lead:'In stock' },
    { pn:'CH552G', mfr:'WCH', desc:'8-bit USB MCU, 16KB Flash, built-in USB, SOP-16', cat:'microcontrollers', pkg:'SOP-16', price:0.25, stock:3000, lead:'In stock' },
    { pn:'CH9102F', mfr:'WCH', desc:'USB to UART bridge, CDC mode, QFN-24', cat:'interface', pkg:'QFN-24', price:0.50, stock:800, lead:'In stock' },
    // ========== CHINESE — SG Micro / Nations ==========
    { pn:'SGM2036-3.3YN5G/TR', mfr:'SG Micro', desc:'300mA LDO regulator, 3.3V, ultra-low noise, SOT-23-5', cat:'power-management', pkg:'SOT-23-5', price:0.08, stock:5000, lead:'In stock' },
    { pn:'SGM8541XN5G/TR', mfr:'SG Micro', desc:'Rail-to-rail op-amp, 1MHz, SOT-23-5, low cost', cat:'analog', pkg:'SOT-23-5', price:0.06, stock:8000, lead:'In stock' },
    { pn:'N32G455RET6', mfr:'Nations Technologies', desc:'ARM Cortex-M4F MCU, 512KB Flash, 144KB SRAM, 144MHz, crypto', cat:'microcontrollers', pkg:'LQFP-64', price:3.00, stock:300, lead:'In stock' },
    // ========== CHINESE — Allwinner / Rockchip ==========
    { pn:'ALLWINNER-V3S', mfr:'Allwinner', desc:'ARM Cortex-A7 SoC, 64MB DDR2, H.264, camera ISP, Linux', cat:'microcontrollers', pkg:'QFN-128', price:4.50, stock:200, lead:'In stock' },
    { pn:'ALLWINNER-T113-S3', mfr:'Allwinner', desc:'Dual Cortex-A7 SoC, HiFi4 DSP, video codec, RISC-V', cat:'microcontrollers', pkg:'QFN-128', price:5.50, stock:150, lead:'1-2 weeks' },
    { pn:'RK3399', mfr:'Rockchip', desc:'Dual Cortex-A72 + Quad Cortex-A53, Mali-T860 GPU, 4K', cat:'microcontrollers', pkg:'FCBGA-480', price:18.00, stock:60, lead:'2-3 weeks' },
    { pn:'RK3568', mfr:'Rockchip', desc:'Quad Cortex-A55, Mali-G52 GPU, NPU 0.8TOPS, PCIe 3.0', cat:'microcontrollers', pkg:'FCBGA-560', price:15.00, stock:80, lead:'2-3 weeks' },
    // ========== AUTOMOTIVE GRADE ICs ==========
    { pn:'STM32F105RBT7', mfr:'STMicroelectronics', desc:'ARM Cortex-M3 MCU, automotive grade -40 to +105°C, CAN, USB', cat:'automotive', pkg:'LQFP-64', price:12.00, stock:35, lead:'4-6 weeks' },
    { pn:'TJA1050T/CM', mfr:'NXP', desc:'CAN transceiver, automotive grade, AEC-Q100, SOIC-8', cat:'automotive', pkg:'SOIC-8', price:1.20, stock:300, lead:'In stock' },
    { pn:'TJA1042T/3/1J', mfr:'NXP', desc:'CAN FD transceiver, 5Mbps, AEC-Q100, SOIC-8', cat:'automotive', pkg:'SOIC-8', price:1.80, stock:200, lead:'In stock' },
    { pn:'TJA1101BHN/S911', mfr:'NXP', desc:'Automotive Ethernet PHY, 100BASE-T1, AEC-Q100', cat:'automotive', pkg:'HVQFN-40', price:5.50, stock:80, lead:'2-3 weeks' },
    { pn:'MCP2551-I/SN', mfr:'Microchip', desc:'CAN transceiver, 1Mbps, AEC-Q100, SOIC-8', cat:'automotive', pkg:'SOIC-8', price:1.00, stock:350, lead:'In stock' },
    { pn:'TLE9251VSJ', mfr:'Infineon', desc:'High-speed CAN transceiver, AEC-Q100, wake-up/standby', cat:'automotive', pkg:'PG-DSO-8', price:1.50, stock:200, lead:'In stock' },
    { pn:'BTS7960B', mfr:'Infineon', desc:'Automotive half-bridge driver, 43A, PWM, AEC-Q100', cat:'automotive', pkg:'TO-263-7', price:4.50, stock:120, lead:'1-2 weeks' },
    { pn:'L9960', mfr:'STMicroelectronics', desc:'Automotive H-bridge driver, dual DC motor, AEC-Q100', cat:'automotive', pkg:'PowerSSO-36', price:6.00, stock:50, lead:'3-5 weeks' },
    { pn:'TPS92515QDGNRQ1', mfr:'Texas Instruments', desc:'Automotive LED driver, buck, 65V, AEC-Q100', cat:'automotive', pkg:'MSOP-8', price:2.80, stock:150, lead:'1-2 weeks' },
    { pn:'UJA1169ATK/F', mfr:'NXP', desc:'Automotive system basis chip, CAN+LIN+LDO, AEC-Q100', cat:'automotive', pkg:'HVSON-14', price:4.00, stock:80, lead:'2-4 weeks' },
    { pn:'MC33903DPEK/F', mfr:'NXP', desc:'Automotive SBC, CAN/LIN, watchdog, AEC-Q100, LQFP-48', cat:'automotive', pkg:'LQFP-48', price:5.50, stock:45, lead:'3-5 weeks' },
    // ========== INTERFACE — Legacy/Scarce ==========
    { pn:'FT2232HL-REEL', mfr:'FTDI', desc:'Dual USB to UART/FIFO/MPSSE, Hi-Speed USB 2.0', cat:'interface', pkg:'LQFP-64', price:6.50, stock:90, lead:'1-2 weeks' },
    { pn:'FT232RL-REEL', mfr:'FTDI', desc:'USB to UART bridge, SSOP-28, classic design-in', cat:'interface', pkg:'SSOP-28', price:4.50, stock:150, lead:'In stock' },
    { pn:'CP2102N-A02-GQFN28R', mfr:'Silicon Labs', desc:'USB to UART bridge, QFN-28, auto-baud', cat:'interface', pkg:'QFN-28', price:2.80, stock:200, lead:'In stock' },
    { pn:'MAX485ESA+T', mfr:'Maxim Integrated', desc:'RS-485/422 transceiver, half-duplex, SOIC-8', cat:'interface', pkg:'SOIC-8', price:1.50, stock:300, lead:'In stock' },
    { pn:'MAX3485EESA+T', mfr:'Maxim Integrated', desc:'RS-485/422 transceiver, 3.3V, 10Mbps, SOIC-8', cat:'interface', pkg:'SOIC-8', price:2.00, stock:250, lead:'In stock' },
    { pn:'SN65HVD230DR', mfr:'Texas Instruments', desc:'CAN transceiver, 3.3V, 1Mbps, standby mode, SOIC-8', cat:'interface', pkg:'SOIC-8', price:1.50, stock:400, lead:'In stock' },
    { pn:'ADM2587EBRWZ', mfr:'Analog Devices', desc:'Isolated RS-485 transceiver, 2.5kV isolation, integrated DC-DC', cat:'interface', pkg:'SOIC-20W', price:8.50, stock:55, lead:'2-3 weeks' },
    { pn:'ISO1540DR', mfr:'Texas Instruments', desc:'Isolated I2C buffer, 2.5kV isolation, bidirectional', cat:'interface', pkg:'SOIC-8', price:4.50, stock:80, lead:'1-2 weeks' },
    { pn:'ADUM1201ARZ', mfr:'Analog Devices', desc:'Dual-channel digital isolator, 2.5kV, 25Mbps, SOIC-8', cat:'interface', pkg:'SOIC-8', price:3.00, stock:150, lead:'In stock' },
    { pn:'ADUM1401CRWZ', mfr:'Analog Devices', desc:'Quad-channel digital isolator, 2.5kV, SOIC-16W', cat:'interface', pkg:'SOIC-16W', price:5.50, stock:80, lead:'1-2 weeks' },
    { pn:'W5500', mfr:'WCH', desc:'Hardwired TCP/IP Ethernet controller, SPI, 8 sockets', cat:'interface', pkg:'LQFP-48', price:2.00, stock:300, lead:'In stock' },
    // ========== RF & WIRELESS ==========
    { pn:'NRF24L01P-R7', mfr:'Nordic Semiconductor', desc:'2.4GHz wireless transceiver, SPI, 2Mbps, ultra-low power', cat:'rf-wireless', pkg:'QFN-20', price:1.50, stock:500, lead:'In stock' },
    { pn:'CC1101RGPR', mfr:'Texas Instruments', desc:'Sub-1GHz transceiver, 315/433/868/915MHz, SPI', cat:'rf-wireless', pkg:'QFN-20', price:2.50, stock:200, lead:'In stock' },
    { pn:'SX1276IMLTRT', mfr:'Semtech', desc:'LoRa transceiver, 137-1020MHz, long range, SPI', cat:'rf-wireless', pkg:'QFN-28', price:4.50, stock:120, lead:'1-2 weeks' },
    { pn:'SX1262IMLTRT', mfr:'Semtech', desc:'LoRa transceiver, 150-960MHz, +22dBm, low power', cat:'rf-wireless', pkg:'QFN-24', price:3.80, stock:150, lead:'1-2 weeks' },
    { pn:'CC2530F256RHAR', mfr:'Texas Instruments', desc:'ZigBee SoC, 2.4GHz, 8051 core, 256KB Flash', cat:'rf-wireless', pkg:'QFN-40', price:3.50, stock:180, lead:'In stock' },
    { pn:'NRF52832-QFAA-R7', mfr:'Nordic Semiconductor', desc:'BLE 5.0 SoC, ARM Cortex-M4F, 512KB Flash, 64KB RAM', cat:'rf-wireless', pkg:'QFN-48', price:3.00, stock:250, lead:'In stock' },
    { pn:'ESP8266EX', mfr:'Espressif', desc:'WiFi SoC, 802.11b/g/n, 80MHz, 1MB Flash, ultra-low cost', cat:'rf-wireless', pkg:'QFN-32', price:1.00, stock:1000, lead:'In stock' },
    { pn:'RTL8720DN', mfr:'Realtek', desc:'Dual-band WiFi + BLE 5.0 SoC, ARM Cortex-M33, KM4', cat:'rf-wireless', pkg:'QFN-68', price:4.00, stock:100, lead:'2-3 weeks' },
    { pn:'AT86RF233-ZU', mfr:'Microchip', desc:'IEEE 802.15.4 transceiver, 2.4GHz, -104dBm sensitivity', cat:'rf-wireless', pkg:'QFN-32', price:2.80, stock:80, lead:'2-3 weeks' },
    // ========== OPTOELECTRONICS ==========
    { pn:'SFH-4550', mfr:'ROHM', desc:'IR LED, 950nm, 150mW, narrow beam, 3mm through-hole', cat:'optoelectronics', pkg:'T-1', price:0.80, stock:500, lead:'In stock' },
    { pn:'TSOP38238', mfr:'Vishay', desc:'IR receiver module, 38kHz, 45m range, DIP-3', cat:'optoelectronics', pkg:'DIP-3', price:0.50, stock:600, lead:'In stock' },
    { pn:'PC817C', mfr:'Toshiba', desc:'Optocoupler, phototransistor output, DIP-4, legacy standard', cat:'optoelectronics', pkg:'DIP-4', price:0.10, stock:5000, lead:'In stock' },
    { pn:'HCPL-3120-000E', mfr:'Broadcom', desc:'IGBT gate drive optocoupler, 2.5A output, 8-DIP', cat:'optoelectronics', pkg:'DIP-8', price:3.50, stock:120, lead:'1-2 weeks' },
    { pn:'TLP281-4GB', mfr:'Toshiba', desc:'Quad optocoupler, phototransistor, SOP-16', cat:'optoelectronics', pkg:'SOP-16', price:0.80, stock:400, lead:'In stock' },
    { pn:'6N137-000E', mfr:'Broadcom', desc:'High-speed optocoupler, 10Mbps, logic output, DIP-8', cat:'optoelectronics', pkg:'DIP-8', price:1.50, stock:250, lead:'In stock' },
    // ========== DISCRETE — Scarce ==========
    { pn:'2N3904', mfr:'ON Semiconductor', desc:'NPN transistor, 40V, 200mA, general purpose, TO-92', cat:'discrete', pkg:'TO-92', price:0.03, stock:10000, lead:'In stock' },
    { pn:'2N3906', mfr:'ON Semiconductor', desc:'PNP transistor, 40V, 200mA, general purpose, TO-92', cat:'discrete', pkg:'TO-92', price:0.03, stock:10000, lead:'In stock' },
    { pn:'IRFZ44NPBF', mfr:'Infineon', desc:'N-channel MOSFET, 55V, 49A, 17.5mΩ, TO-220AB', cat:'discrete', pkg:'TO-220AB', price:0.80, stock:500, lead:'In stock' },
    { pn:'IRF3205PBF', mfr:'Infineon', desc:'N-channel MOSFET, 55V, 110A, 8mΩ, TO-220AB', cat:'discrete', pkg:'TO-220AB', price:1.20, stock:400, lead:'In stock' },
    { pn:'IGBT-FGH40N60SFD', mfr:'ON Semiconductor', desc:'IGBT, 600V, 40A, fast switching, TO-247, inverter grade', cat:'discrete', pkg:'TO-247', price:4.50, stock:100, lead:'1-2 weeks' },
    { pn:'IPW60R045CP', mfr:'Infineon', desc:'CoolMOS N-channel MOSFET, 600V, 60A, 45mΩ, TO-247', cat:'discrete', pkg:'TO-247', price:6.00, stock:60, lead:'2-3 weeks' },
    { pn:'IXFN120N65X2', mfr:'IXYS', desc:'N-channel MOSFET, 650V, 120A, SOT-227B, power module', cat:'discrete', pkg:'SOT-227B', price:35.00, stock:10, lead:'6-10 weeks' },
  ];

  let created=0, skipped=0;
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where:{ partNumber:p.pn } });
    if (exists) { skipped++; continue; }
    await prisma.product.create({ data:{
      partNumber:p.pn, manufacturer:p.mfr, description:p.desc,
      categoryId:catMap[p.cat]||null, packageType:p.pkg,
      mountType: p.pkg?.includes('DIP')||p.pkg?.includes('TO-9')||p.pkg?.includes('TO-2')||p.pkg?.includes('T-1') ? 'THT' : 'SMD',
      minPrice:p.price, stock:p.stock, moq:1, leadTime:p.lead, status:'active',
    }});
    created++;
  }
  const total = await prisma.product.count();
  console.log(`\n✅ Batch 3 done! Created: ${created}, Skipped: ${skipped}, Total: ${total}`);
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
