import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BLOG_CATEGORIES = [
  { name: 'Buying Guides', slug: 'buying-guides' },
  { name: 'Product Comparisons', slug: 'product-comparisons' },
  { name: 'Technical Tutorials', slug: 'technical-tutorials' },
  { name: 'Industry News', slug: 'industry-news' },
];

const BLOG_POSTS = [
  {
    title: 'How to Choose the Right FPGA for Your Project',
    slug: 'how-to-choose-right-fpga',
    excerpt: 'A comprehensive guide to selecting the ideal FPGA for your next embedded design project. Compare Xilinx, Intel/Altera, and Lattice offerings across key parameters.',
    categorySlug: 'buying-guides',
    tags: 'FPGA, Xilinx, Intel, Altera, Lattice, selection guide',
    seoTitle: 'How to Choose the Right FPGA for Your Project | 2026 Guide',
    seoDesc: 'Learn how to select the best FPGA for your project. Compare Xilinx Artix/Kintex, Intel Cyclone/MAX, and Lattice iCE40 across logic cells, power, price, and toolchains.',
    seoKeywords: 'FPGA selection guide, best FPGA 2026, Xilinx vs Intel FPGA, FPGA comparison, choose FPGA',
    relatedProducts: 'XC7A35T-1CPG236C,EP4CE6E22C8N,EPM240T100C5N',
    content: `Choosing the right FPGA (Field-Programmable Gate Array) can make or break your embedded systems project. With dozens of families from multiple vendors, the selection process requires careful evaluation of your specific requirements against available options.

## Why FPGA Selection Matters

An FPGA represents a significant investment — not just in component cost, but in development time, toolchain licensing, and long-term support. Making the wrong choice can lead to:

- **Insufficient logic resources** requiring a costly mid-project migration
- **Excessive power consumption** that violates thermal budgets
- **End-of-life surprises** when a vendor discontinues a family
- **Toolchain lock-in** that limits future design flexibility

## Key Selection Parameters

### Logic Cell Count

The most fundamental parameter is the number of logic cells (or Logic Elements / LUTs). Here's a rough sizing guide:

| Application | Recommended Logic Cells |
| --- | --- |
| Simple glue logic | 1,000 – 5,000 |
| SPI/I2C controllers | 5,000 – 15,000 |
| Video processing | 15,000 – 50,000 |
| Network packet processing | 50,000 – 200,000 |
| High-performance computing | 200,000+ |

**Pro tip:** Always select an FPGA with at least 30% more logic capacity than your initial estimate. Design complexity tends to grow.

### Memory Resources

Evaluate both:

- **Block RAM (BRAM):** Dedicated memory blocks, typically 18Kb or 36Kb
- **Distributed RAM:** Small memories built from LUT fabric

For data-intensive applications like video buffering or packet queuing, BRAM count is often the limiting factor, not logic cells.

### DSP Blocks

If your application involves signal processing, look for dedicated DSP slices:

- **Xilinx DSP48E1** — 25×18 multiplier + 48-bit accumulator
- **Intel DSP Block** — Similar 18×18 or 27×27 multiplier configurations

### I/O Standards & Count

Count your required I/O pins and verify the FPGA supports your voltage standards:

- LVCMOS 3.3V / 2.5V / 1.8V
- LVDS (differential signaling)
- SSTL / HSTL (for DDR memory interfaces)

### Transceivers

For high-speed serial protocols (PCIe, Ethernet, SATA), you'll need integrated transceivers (MGTs):

- Xilinx GTP (3.2 Gbps) | GTX (10.3 Gbps) | GTH (16.3 Gbps)
- Intel GXB (3.125 Gbps) | Transceiver (6.5 Gbps)

## Vendor Comparison

### Xilinx (AMD)

**Best for:** High-performance applications, AI/ML inference, data center

- **Artix-7:** Cost-optimized, 12K–215K logic cells, excellent for mid-range
- **Kintex-7:** Performance-optimized with transceivers
- **Virtex-7:** Ultra-high performance, expensive
- **UltraScale+:** Latest generation, maximum density

**Toolchain:** Vivado (free for smaller devices via WebPACK)

### Intel/Altera

**Best for:** Cost-sensitive designs, education, DSP-heavy applications

- **MAX 10:** Non-volatile, instant-on, great for simple designs
- **Cyclone IV/V:** Cost-optimized, widely available
- **Arria:** Mid-range performance with transceivers
- **Stratix:** High-end, data center focused

**Toolchain:** Quartus Prime (free Lite edition available)

### Lattice

**Best for:** Ultra-low power, mobile, edge AI

- **iCE40:** Ultra-low power, tiny packages
- **ECP5:** Good balance of features and price
- **CrossLink-NX:** Designed for sensor bridging

**Toolchain:** Radiant / open-source support (Yosys/nextpnr)

## Decision Flowchart

1. **Need sub-1W power?** → Lattice iCE40/CrossLink-NX
2. **Budget under $5?** → Intel MAX 10, Lattice iCE40
3. **Need high-speed transceivers?** → Xilinx Kintex or Intel Arria
4. **Need instant-on (no configuration)?** → Intel MAX 10
5. **General purpose, mid-range?** → Xilinx Artix-7 or Intel Cyclone V
6. **Maximum performance?** → Xilinx UltraScale+ or Intel Stratix 10

## Conclusion

The "best" FPGA doesn't exist in isolation — it depends entirely on your application's specific requirements. Start by listing your non-negotiable needs (I/O count, speed, power budget), then evaluate available options within that constraint space.

At FPGACenter, we stock a wide range of FPGAs from all major vendors, including hard-to-find and obsolete parts. Whether you need a single prototype unit or production quantities, we can help you source the right component.`,
  },
  {
    title: 'STM32F103 vs STM32F407: Which MCU is Right for You?',
    slug: 'stm32f103-vs-stm32f407-comparison',
    excerpt: 'A detailed head-to-head comparison of two popular STM32 microcontrollers. Performance benchmarks, peripheral differences, and cost analysis to help you decide.',
    categorySlug: 'product-comparisons',
    tags: 'STM32, MCU, microcontroller, ARM, Cortex-M3, Cortex-M4, comparison',
    seoTitle: 'STM32F103 vs STM32F407: Complete Comparison Guide | 2026',
    seoDesc: 'STM32F103 vs STM32F407 comparison. Core architecture, clock speed, peripherals, price, and power consumption analyzed. Find which STM32 MCU fits your project.',
    seoKeywords: 'STM32F103 vs STM32F407, STM32 comparison, ARM Cortex-M3 vs M4, best STM32 MCU, STM32 selection',
    relatedProducts: 'STM32F103C8T6,STM32F407VGT6',
    content: `The STM32F103 and STM32F407 are two of the most popular microcontrollers in the embedded world. While both are part of ST's STM32 family, they target different performance tiers. This guide breaks down every key difference to help you make the right choice.

## Quick Comparison Table

| Feature | STM32F103 | STM32F407 |
| --- | --- | --- |
| Core | ARM Cortex-M3 | ARM Cortex-M4F |
| Max Clock | 72 MHz | 168 MHz |
| Flash | 64KB – 512KB | 512KB – 1MB |
| SRAM | 20KB – 64KB | 128KB – 192KB |
| FPU | No | Yes (single precision) |
| DSP | No | Yes |
| USB | Full-Speed (12 Mbps) | High-Speed OTG (480 Mbps) |
| Ethernet | No | Yes (MAC) |
| Camera | No | DCMI interface |
| Price Range | $1.50 – $4.00 | $6.00 – $12.00 |

## Architecture Deep Dive

### Cortex-M3 vs Cortex-M4F

The fundamental difference is the processor core:

**Cortex-M3 (STM32F103):**
- 3-stage pipeline, Thumb-2 instruction set
- Hardware multiply (single cycle 32×32)
- No floating-point unit — all FP operations in software
- Excellent for control-oriented tasks

**Cortex-M4F (STM32F407):**
- 3-stage pipeline with branch speculation
- DSP instructions (SIMD, saturating arithmetic)
- Single-precision FPU (IEEE 754 compliant)
- 2.5× faster for DSP/math-heavy workloads

### Performance Benchmarks

Real-world benchmark comparison:

| Benchmark | F103 (72 MHz) | F407 (168 MHz) | Speedup |
| --- | --- | --- | --- |
| CoreMark | 91 | 565 | 6.2× |
| Dhrystone (DMIPS) | 89 | 210 | 2.4× |
| FFT 1024-pt (float) | ~45 ms | ~2.1 ms | 21× |
| GPIO toggle rate | 18 MHz | 84 MHz | 4.7× |

The FPU makes an enormous difference for any floating-point math — up to 21× faster for FFT operations.

## Peripheral Comparison

### Communication Interfaces

**STM32F103:**
- 3× USART
- 2× SPI
- 2× I2C
- 1× USB Full-Speed
- 1× CAN

**STM32F407:**
- 6× USART (4× UART)
- 3× SPI (+ I2S)
- 3× I2C
- 1× USB OTG HS + 1× USB OTG FS
- 2× CAN
- Ethernet MAC
- DCMI (camera interface)
- SDIO

### ADC Performance

Both have 12-bit ADCs, but with different capabilities:

- **F103:** 2× ADC, 1 MSPS, 16 channels
- **F407:** 3× ADC, 2.4 MSPS, 24 channels, triple interleaved mode (7.2 MSPS effective)

### Timer Resources

Both are well-equipped for motor control and PWM, but the F407 has more timers with more advanced features including synchronized multi-axis motor control.

## When to Choose STM32F103

The F103 remains an excellent choice for:

- **Simple control applications** — sensor reading, relay control, LED driving
- **Cost-sensitive products** — $1.50 unit cost at volume
- **Low-power designs** — lower active current at lower clock speeds
- **Legacy compatibility** — vast ecosystem of existing libraries and designs
- **Beginner learning** — extensive community tutorials available

## When to Choose STM32F407

Choose the F407 when you need:

- **Floating-point math** — PID controllers, sensor fusion, DSP
- **Audio processing** — I2S interface + DMA + FPU
- **USB High-Speed** — mass storage, high-bandwidth devices
- **Ethernet connectivity** — IoT gateways, industrial networking
- **Camera/imaging** — DCMI interface for OV7670 or similar
- **Complex applications** — RTOS with many tasks, large codebases

## Cost Analysis

At FPGACenter, current pricing:

- **STM32F103C8T6** (64KB Flash, LQFP-48): ~$2.85
- **STM32F407VGT6** (1MB Flash, LQFP-100): ~$8.50

For production volumes of 1000+, expect:
- F103: $1.20 – $1.80
- F407: $5.50 – $7.50

## Conclusion

**Choose STM32F103** if your application is simple, cost-sensitive, and doesn't need floating-point math or high-speed connectivity.

**Choose STM32F407** if you need DSP capabilities, FPU, Ethernet, USB High-Speed, or more resources for complex applications.

Both are excellent microcontrollers backed by ST's comprehensive HAL library and STM32CubeIDE toolchain. The right choice depends entirely on your specific requirements.`,
  },
  {
    title: 'Understanding MLCC Capacitors: Types, Specs, and Applications',
    slug: 'understanding-mlcc-capacitors-guide',
    excerpt: 'Everything you need to know about MLCC (Multi-Layer Ceramic Chip) capacitors — from dielectric classes and voltage derating to selecting the right capacitor for decoupling, filtering, and timing.',
    categorySlug: 'technical-tutorials',
    tags: 'MLCC, capacitor, ceramic capacitor, decoupling, passive components, EMC',
    seoTitle: 'MLCC Capacitors Guide: Types, Specs & Selection | 2026',
    seoDesc: 'Complete guide to MLCC ceramic capacitors. Learn about X7R vs C0G dielectrics, DC bias effects, voltage derating, and how to select the right capacitor for your design.',
    seoKeywords: 'MLCC capacitor guide, ceramic capacitor types, X7R vs C0G, capacitor selection, MLCC derating',
    relatedProducts: 'GRM188R71C104KA01D',
    content: `MLCC (Multi-Layer Ceramic Chip) capacitors are the most widely used passive component in modern electronics. A typical smartphone contains over 1,000 MLCCs, while an automotive ECU may use 3,000+. Understanding their characteristics is essential for reliable circuit design.

## What is an MLCC?

An MLCC consists of alternating layers of ceramic dielectric and metal electrodes, stacked and sintered into a monolithic block. The multilayer structure provides high capacitance in a small package.

**Key advantages over other capacitor types:**
- Very small size (down to 0201 / 01005)
- Low ESR (Equivalent Series Resistance)
- High frequency performance
- No polarity — can be used with AC signals
- Long lifetime (no electrolyte to dry out)

## Dielectric Classes

### Class 1: C0G / NP0

**Temperature coefficient:** ±30 ppm/°C
**Capacitance range:** 0.5 pF – 100 nF

C0G (also called NP0) capacitors have:
- **Zero DC bias effect** — capacitance doesn't change with applied voltage
- **Negligible aging** — capacitance stable over decades
- **Excellent Q factor** — very low losses at RF frequencies
- **No piezoelectric effect** — no audible noise

**Best for:** Timing circuits, oscillators, RF filters, PLL loop filters, precision analog circuits.

**Limitation:** Available only in smaller capacitance values and larger package sizes.

### Class 2: X7R, X5R

**Temperature coefficient:** ±15% (X7R: -55°C to +125°C), ±15% (X5R: -55°C to +85°C)

X7R and X5R offer much higher volumetric capacitance:
- **Significant DC bias effect** — a 10µF X7R cap at rated voltage may only provide 4-5µF
- **Aging:** ~2.5% per decade (logarithmic scale)
- **Piezoelectric effect** — can produce audible noise ("singing capacitors")
- **Available in high values:** up to 100µF in small packages

**Best for:** Decoupling, bulk bypass, DC-DC converter I/O, general filtering.

### Class 3: Y5V, Z5U

**Temperature coefficient:** +22% / -82% (Y5V)

Highest capacitance density but worst stability. Avoid for precision applications.

## Critical MLCC Behaviors

### DC Bias Effect

This is the most important — and most overlooked — MLCC characteristic. As DC voltage increases, capacitance **decreases dramatically** for Class 2 dielectrics.

| Capacitor | Rated at 0V | At 50% rated voltage | At rated voltage |
| --- | --- | --- | --- |
| 10µF 25V X5R | 10 µF | 6.5 µF | 3.5 µF |
| 10µF 10V X5R | 10 µF | 5.0 µF | 2.0 µF |
| 100nF 16V C0G | 100 nF | 100 nF | 100 nF |

**Rule of thumb:** For X5R/X7R, you lose 30-80% of rated capacitance at rated voltage. Always check the manufacturer's DC bias curves.

### Voltage Derating

Industry best practice for reliability:
- **Consumer:** Derate to 80% of rated voltage
- **Industrial:** Derate to 70%
- **Automotive/Aerospace:** Derate to 50%

Example: For a 3.3V rail, use at least a 6.3V rated MLCC (50% derating).

### Aging

Class 2 MLCCs lose capacitance logarithmically over time:
- ~2.5% per time decade (1 hr → 10 hr → 100 hr → 1000 hr)
- Aging resets when heated above Curie temperature (~125°C)
- After 10 years: approximately 10-12% loss

### Flex Cracking

MLCCs are ceramic — they crack if the PCB flexes too much. For large packages (0805+):
- Use flex-rated terminations (soft termination)
- Add solder fillet reinforcement
- Avoid placing near board edges or mounting holes

## Package Size Guide

| Size Code | Dimensions (mm) | Typical Use |
| --- | --- | --- |
| 0201 | 0.6 × 0.3 | Mobile, wearable |
| 0402 | 1.0 × 0.5 | General purpose |
| 0603 | 1.6 × 0.8 | Most common |
| 0805 | 2.0 × 1.25 | Power, high voltage |
| 1206 | 3.2 × 1.6 | High capacitance, automotive |
| 1210 | 3.2 × 2.5 | Bulk bypass |

## Application-Specific Selection

### Power Supply Decoupling

- Use X7R or X5R, closest to the IC power pins
- Typical: 100nF (high frequency) + 10µF (bulk)
- Consider DC bias — a 4.7µF at operating voltage may suffice over a 10µF that derates heavily

### High-Frequency / RF

- Use C0G/NP0 exclusively
- Consider parasitic inductance — smaller packages have lower ESL
- 0402 C0G for GHz applications

### DC-DC Converter I/O

- Input: X7R, rated for input voltage ripple + DC bias
- Output: Low-ESR X5R/X7R, check transient response requirements
- Always consult the converter datasheet for recommended capacitor values

## Conclusion

MLCCs are deceptively complex. The stated capacitance on the label is rarely what you get in your actual circuit. For reliable designs:

1. Always check DC bias curves from the manufacturer
2. Derate voltage by 50% minimum for critical applications
3. Use C0G for precision; X7R for general purpose
4. Account for aging in long-lifetime products
5. Watch out for flex cracking on large packages

FPGACenter stocks a comprehensive range of MLCCs from Murata, Samsung, TDK, and Yageo. Contact us for volume pricing on any capacitor specification.`,
  },
];

async function seedBlog() {
  console.log('🌱 Seeding blog content...');

  // Create categories
  for (const cat of BLOG_CATEGORIES) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Created ${BLOG_CATEGORIES.length} blog categories`);

  // Create posts
  for (const postData of BLOG_POSTS) {
    const category = await prisma.blogCategory.findUnique({ where: { slug: postData.categorySlug } });
    const readingTime = Math.max(1, Math.ceil((postData.content || '').split(/\s+/).length / 200));

    await prisma.blogPost.upsert({
      where: { slug: postData.slug },
      update: {},
      create: {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content,
        status: 'published',
        publishedAt: new Date(),
        author: 'FPGACenter Team',
        categoryId: category?.id || null,
        tags: postData.tags,
        seoTitle: postData.seoTitle,
        seoDesc: postData.seoDesc,
        seoKeywords: postData.seoKeywords,
        relatedProducts: postData.relatedProducts,
        readingTime,
        viewCount: Math.floor(Math.random() * 500) + 100,
      },
    });
    console.log(`  📝 ${postData.title}`);
  }
  console.log(`✅ Created ${BLOG_POSTS.length} blog posts`);
  console.log('🎉 Blog seeding complete!');
}

seedBlog().catch(console.error).finally(() => prisma.$disconnect());
