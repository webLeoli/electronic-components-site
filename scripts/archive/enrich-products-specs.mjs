import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    const specs = {};
    const desc = p.description || '';
    
    // Core details
    specs.Manufacturer = p.manufacturer;
    if (p.packageType) specs['Package / Case'] = p.packageType;
    if (p.mountType) specs['Mounting Type'] = p.mountType;
    specs['RoHS Status'] = 'ROHS3 Compliant';
    specs['Moisture Sensitivity Level (MSL)'] = '3 (168 Hours)';
    specs['Lifecycle Status'] = p.status.charAt(0).toUpperCase() + p.status.slice(1);
    
    if (p.leadTime) specs['Factory Lead Time'] = p.leadTime;

    // Parses from description
    const descLower = desc.toLowerCase();
    
    if (descLower.includes('fpga') || descLower.includes('cpld')) {
      const gatesMatch = desc.match(/([\d\.]+M)\s*gates/i) || desc.match(/(\d+K)\s*gates/i);
      if (gatesMatch) specs['Gate Count'] = gatesMatch[1];
      
      const logicMatch = desc.match(/(\d+,\d+|\d+K)\s*logic\s*(cells|elements|LEs|LUTs)/i) || desc.match(/(\d+)\s*LUTs/i) || desc.match(/(\d+)\s*LEs/i) || desc.match(/(\d+)\s*ALUTs/i);
      if (logicMatch) specs['Logic Elements/Cells'] = logicMatch[1].replace('K', '000');
      
      const macroMatch = desc.match(/(\d+)\s*macrocells/i);
      if (macroMatch) specs['Macrocells'] = macroMatch[1];
    }
    
    if (descLower.includes('mcu') || descLower.includes('arm') || descLower.includes('pic') || descLower.includes('avr')) {
      const coreMatch = desc.match(/(ARM Cortex-[\w\d]+|ARM\d+|8051|PIC\d+|AVR|RISC-V|ColdFire)/i);
      if (coreMatch) specs['Core Processor'] = coreMatch[1];
      
      const flashMatch = desc.match(/([\d\.]+(?:KB|MB))\s*Flash/i);
      if (flashMatch) specs['Program Memory Size'] = flashMatch[1];
      
      const ramMatch = desc.match(/([\d\.]+(?:KB|MB))\s*SRAM/i) || desc.match(/([\d\.]+(?:KB|MB))\s*RAM/i);
      if (ramMatch) specs['RAM Size'] = ramMatch[1];
      
      const speedMatch = desc.match(/(\d+MHz)/i);
      if (speedMatch) specs['Speed'] = speedMatch[1];
      
      if (descLower.includes('can')) specs['Peripherals'] = (specs['Peripherals'] ? specs['Peripherals'] + ', ' : '') + 'CAN';
      if (descLower.includes('usb')) specs['Peripherals'] = (specs['Peripherals'] ? specs['Peripherals'] + ', ' : '') + 'USB';
      if (descLower.includes('ethernet')) specs['Peripherals'] = (specs['Peripherals'] ? specs['Peripherals'] + ', ' : '') + 'Ethernet';
    }
    
    if (descLower.includes('memory') || descLower.includes('ram') || descLower.includes('flash') || descLower.includes('eprom')) {
      const sizeMatch = desc.match(/([\d\.]+(?:Kb|Mb|Gb))/i);
      if (sizeMatch) specs['Memory Size'] = sizeMatch[1];
      
      const speedMatch = desc.match(/(\d+ns|\d+MHz)/i);
      if (speedMatch) specs['Speed/Access Time'] = speedMatch[1];
      
      if (descLower.includes('spi')) specs['Memory Interface'] = 'SPI';
      if (descLower.includes('parallel')) specs['Memory Interface'] = 'Parallel';
      if (descLower.includes('i2c')) specs['Memory Interface'] = 'I²C';
      
      if (descLower.includes('sram')) { specs['Memory Type'] = 'Volatile'; specs['Memory Format'] = 'SRAM'; }
      if (descLower.includes('flash')) { specs['Memory Type'] = 'Non-Volatile'; specs['Memory Format'] = 'FLASH'; }
      if (descLower.includes('eprom')) { specs['Memory Type'] = 'Non-Volatile'; specs['Memory Format'] = 'EPROM'; }
    }
    
    if (descLower.includes('regulator') || descLower.includes('converter') || descLower.includes('mosfet') || descLower.includes('power')) {
      const voltMatch = desc.match(/([\d\.]+[kKV]?)\s*(?:V|Volts)\b/i);
      if (voltMatch) {
         if (descLower.includes('input')) specs['Voltage - Input'] = voltMatch[1];
         else specs['Voltage - Output'] = voltMatch[1];
      }
      
      const currMatch = desc.match(/([\d\.]+(?:A|mA|µA))/i);
      if (currMatch) specs['Current - Output'] = currMatch[1];
      
      const freqMatch = desc.match(/([\d\.]+(?:kHz|MHz))/i);
      if (freqMatch) specs['Switching Frequency'] = freqMatch[1];
      
      const resMatch = desc.match(/([\d\.]+(?:mΩ|Ohm))/i);
      if (resMatch && descLower.includes('mosfet')) specs['Rds On (Max)'] = resMatch[1];
    }
    
    if (descLower.includes('adc') || descLower.includes('dac')) {
      const resMatch = desc.match(/(\d+)-bit/i);
      if (resMatch) specs['Bits'] = resMatch[1];
      
      const rateMatch = desc.match(/(\d+(?:kSPS|MSPS))/i);
      if (rateMatch) specs['Sampling Rate'] = rateMatch[1];
      
      const channelMatch = desc.match(/(\d+)-channel/i);
      if (channelMatch) specs['Number of Channels'] = channelMatch[1];
    }
    
    if (descLower.includes('military') || descLower.includes('883') || descLower.includes('qml') || descLower.includes('jan') || descLower.includes('space') || descLower.includes('rad-hard')) {
      specs['Qualification'] = 'MIL-SPEC / Space Grade';
      specs['Operating Temperature'] = '-55°C ~ 125°C';
    } else if (descLower.includes('automotive') || descLower.includes('aec-q100')) {
      specs['Qualification'] = 'AEC-Q100 (Automotive)';
      specs['Operating Temperature'] = '-40°C ~ 125°C';
    } else {
      specs['Operating Temperature'] = '-40°C ~ 85°C (TA)'; // Default industrial
    }

    // Assign mock datasheet if missing
    let datasheetUrl = p.datasheet;
    if (!datasheetUrl) {
      // Basic mock PDF url based on part number
      datasheetUrl = `/data/datasheets/${p.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    }
    
    await prisma.product.update({
      where: { id: p.id },
      data: {
        specs: JSON.stringify(specs),
        datasheet: datasheetUrl
      }
    });

    updatedCount++;
  }
  
  console.log(`✅ Successfully enriched specs and datasheets for ${updatedCount} products.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
