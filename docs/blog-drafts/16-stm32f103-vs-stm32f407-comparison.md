---
title: "STM32F103 vs STM32F407: Which MCU Is Right for You?"
slug: "stm32f103-vs-stm32f407-comparison"
status: "published"
seoTitle: "STM32F103 vs STM32F407: Full Comparison and Migration Guide"
seoDesc: "STM32F103 vs STM32F407 compared on core, memory, peripherals, power and cost — plus what actually breaks when migrating between them, and how to source both in 2026."
seoKeywords: "STM32F103 vs STM32F407, STM32F103, STM32F407, Cortex-M3 vs Cortex-M4, STM32 comparison, STM32 migration, STM32F103 replacement"
tags: "STM32, MCU, microcontroller, ARM, Cortex-M3, Cortex-M4, comparison, migration"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "MCU Sourcing & Alternatives"
relatedProducts: "STM32F103RBT6TR, STM32F103VCH6, STM32F103RCT7, STM32F407VET6, STM32F407IGT7, STM32F407VGT6J"
---

# STM32F103 vs STM32F407: Which MCU Is Right for You?

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: STM32, Cortex-M3, Cortex-M4, MCU selection, migration

---

**The STM32F103 and STM32F407 are not competitors — they sit two generations and one core apart.** The F103 is a Cortex-M3 workhorse from 2007 that remains one of the most widely deployed microcontrollers ever made. The F407 is a Cortex-M4F device with roughly three times the clock, a floating-point unit and a substantially richer peripheral set. This guide compares them on the axes that decide a design, then covers what actually breaks when migrating between them.


<img src="/uploads/blog/stm32f103-vs-stm32f407-comparison.webp" alt="STM32F103-class and STM32F407-class microcontrollers compared side by side" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **The F407's headline advantage is not clock speed, it is the FPU and the DSP instruction set.** If the application does floating-point maths or filtering, the gap is far larger than the 72 MHz to 168 MHz ratio suggests.
- The **F103 wins on power, cost and board simplicity**. For a design that does not need the compute, moving up is a downgrade in every other respect.
- They are **not pin-compatible in any usable sense**. Migration is a board change, not a substitution.
- Firmware migration is mostly mechanical, with two real traps: **flash wait states** at higher clock, and the F407's **separate bus matrix and CCM RAM**, which DMA cannot reach.
- Both remain widely available in 2026, but **specific F407 orderable part numbers have gone obsolete** while the family continues: the part number matters more than the family.

---

## The short answer

| Question | Answer |
| --- | --- |
| Simple control, sensors, UART/SPI/I²C, cost-sensitive | **STM32F103** |
| Floating-point maths, DSP filtering, motor control with FOC | **STM32F407** |
| Colour LCD, camera interface, Ethernet, USB OTG HS | **STM32F407** |
| Battery-powered, every milliamp counts | **STM32F103** (or a modern L-series) |
| Existing F103 design that has run out of headroom | F407 — but budget a **board redesign**, not a swap |

## Core and compute

The F103 is a Cortex-M3 at up to 72 MHz. The F407 is a Cortex-M4F at up to 168 MHz. The clock ratio is 2.3×, but the useful ratio depends entirely on what the code does.

| | STM32F103 | STM32F407 |
| --- | --- | --- |
| Core | Cortex-M3 | Cortex-M4F |
| Max clock | 72 MHz | 168 MHz |
| Floating-point unit | None — software emulation | Single-precision hardware FPU |
| DSP instructions | No | Yes (SIMD, single-cycle MAC) |
| Typical DMIPS | ~90 | ~210 |

For integer control code, the difference is roughly the clock ratio. For floating-point work it is not close: a single-precision multiply-accumulate that the M3 emulates in tens of cycles executes in one on the M4F. Applications where this dominates:

- Field-oriented motor control with a floating-point observer
- Digital filters — FIR/IIR on audio or sensor streams
- Sensor fusion with quaternion maths
- Any control loop written in floating point rather than fixed point

Conversely, if the firmware is integer state machines and peripheral shuffling, the F407's compute advantage delivers almost nothing while costing power, board area and money.

## Memory

| | STM32F103 (typical range) | STM32F407 (typical range) |
| --- | --- | --- |
| Flash | 16 KB – 1 MB | 512 KB – 1 MB |
| SRAM | 6 KB – 96 KB | 128 KB + 64 KB CCM |
| External memory bus | FSMC on higher-density parts only | FSMC, broader support |
| Backup SRAM | 42 bytes (backup registers) | 4 KB battery-backed |

Two F407-specific details matter more than the raw numbers:

Core-Coupled Memory (CCM). The F407's 64 KB of CCM RAM is attached directly to the core and is fast, but **DMA cannot access it**. Placing a DMA buffer in CCM produces a transfer that silently does nothing, or a hard fault, depending on configuration. This is one of the most common F407 mistakes, and it does not exist on the F103 because the F103 has no CCM.

Bus matrix. The F407 has a multi-layer AHB matrix, so DMA traffic and core fetches can proceed in parallel across different masters. It is faster, and it also means contention behaviour differs from the F103's simpler arrangement — relevant if you are migrating timing-sensitive DMA code.

## Peripherals

The F103 covers the standard set. The F407 adds interfaces that are the reason to choose it at all.

| Peripheral | STM32F103 | STM32F407 |
| --- | --- | --- |
| USB | Full-speed device (some parts OTG FS) | OTG FS **and** OTG HS with ULPI |
| Ethernet | No | 10/100 MAC with IEEE 1588 |
| Camera interface | No | 8/10/12/14-bit DCMI |
| SDIO | Yes on higher-density | Yes |
| CAN | 1–2 × bxCAN | 2 × bxCAN |
| ADC | 2–3 × 12-bit, 1 Msps | 3 × 12-bit, 2.4 Msps, interleaved triple mode |
| DAC | 2-channel on some parts | 2-channel |
| Timers | Up to 4 general + 2 advanced | Up to 12 general + 2 advanced |
| RNG / crypto | No | True RNG; crypto on F41x variants |

If the requirement list contains **Ethernet, a camera, USB high-speed, or hardware RNG**, the decision is already made: the F103 cannot do those at all.

## Power

The F103 is substantially the lower-power part, and not only because it is slower. Its process, smaller die and simpler bus structure all contribute.

For a battery-powered design, neither is really the right answer in 2026 (the STM32L series exists precisely for that) but between these two, the F103 draws considerably less in run mode at comparable workloads and has a simpler set of low-power modes to reason about. The F407 at full clock with all peripherals enabled is a meaningfully warm device that needs decoupling and supply capacity to match.

Check the supply requirements too: the F407's higher pin-count packages need more decoupling capacitors and a dedicated VDDA arrangement, which is part of why migration is a board change.

## Cost and board complexity

| | STM32F103 | STM32F407 |
| --- | --- | --- |
| Typical package range | LQFP48 – LQFP100 | LQFP100 – LQFP176, BGA |
| Board layers commonly needed | 2–4 | 4+ |
| Decoupling complexity | Modest | Higher, multiple supply domains |
| Relative unit cost | Lower | Higher |

The board-level cost difference is often larger than the chip cost difference. An F103 design frequently closes on two layers; an F407 design with high-speed USB or Ethernet realistically wants four or more, plus controlled-impedance routing.

## Migrating F103 → F407: what actually breaks

They share a vendor, a core architecture family and a HAL, so migration is mostly mechanical. Four things are not.

### 1. Flash wait states

At 72 MHz the F103 runs with a small number of flash wait states. At 168 MHz the F407 requires considerably more, plus its ART accelerator (prefetch, instruction and data cache) to reach full performance. Consequences:

- Any **software delay loop** changes duration, and not proportionally to the clock, because cache behaviour is now involved.
- **Bit-banged protocols** timed by instruction counting will run at a different rate.
- **Interrupt latency becomes data-dependent**: a cold cache path is slower than a warm one, so worst-case latency is no longer the number you measured on the bench.

The correct fix is to move any timing dependency onto a hardware timer, which is better design regardless.

### 2. CCM RAM and DMA

As above: 64 KB of the F407's RAM is unreachable by DMA. If the linker script places a buffer there (which it may do automatically if you naively map the largest RAM region) DMA transfers to that buffer fail. Symptoms are a peripheral that appears to work while the data never changes.

### 3. Clock tree and PLL configuration

The F407's clock tree is more elaborate: a main PLL plus a dedicated PLL for USB/SDIO/RNG, separate prescalers for two APB domains at different maximum frequencies. Copying an F103 clock configuration will not work, and getting the APB prescalers wrong produces timer clocks at half or double the expected rate, which manifests as every timing being consistently off by 2×.

### 4. Peripheral register differences

Despite the shared HAL, the F407's ADC, timers and GPIO configuration registers differ from the F103's. GPIO in particular moved to a different configuration model between these generations. Code written against F103 registers directly, rather than through the HAL, will need rewriting.

The broader MCU second-sourcing framework also needs to cover errata comparison and the peripheral corner cases that are easiest to miss.

## Sourcing both in 2026

Both families remain in production and widely available, but **availability is per orderable part number, not per family**. In our catalogue the F103 line is well stocked with active parts such as `STM32F103RBT6TR`, `STM32F103VCH6` and `STM32F103RCT7`, while on the F407 side `STM32F407IGT7` and `STM32F407VET6` are active and `STM32F407VGT6J` is already marked obsolete.

That pattern is typical and worth internalising: a family being "in production" tells you nothing about the specific temperature grade, package and packing variant on your BOM. The suffix is the part.

Where a specific variant has gone, the options are the usual three: a different variant of the same die, authorised aftermarket stock, or a last-time-buy. [How to source obsolete electronic components](/blog/how-to-source-obsolete-electronic-components) covers the paths in order of preference.

## FAQ

### What is the main difference between STM32F103 and STM32F407?

The STM32F103 is a Cortex-M3 running at up to 72 MHz with no floating-point unit, while the STM32F407 is a Cortex-M4F running at up to 168 MHz with a single-precision hardware FPU and DSP instructions. The F407 also adds Ethernet, a camera interface, USB high-speed and a much larger timer and ADC complement. The F103 is cheaper, lower-power and simpler to lay out.

### Is the STM32F407 pin-compatible with the STM32F103?

No. They use different package ranges and different pin assignments, and the F407 has additional supply and ground pins plus different decoupling requirements. Moving from one to the other is a board redesign, not a component substitution. Within each family, higher-density variants in the same package are generally pin-compatible with lower-density ones.

### Do I need an FPU for motor control?

Not necessarily. Field-oriented control can be implemented in fixed-point arithmetic on a Cortex-M3, and the STM32F103 has been used for exactly that for many years. An FPU makes the code substantially easier to write and tune, allows a floating-point observer or more elaborate control law, and leaves headroom for higher loop rates. If the control algorithm is already written and working in fixed point, the FPU is a convenience rather than a requirement.

### Why does my DMA transfer fail on the STM32F407?

The most likely cause is that the buffer is located in Core-Coupled Memory. The F407 has 64 KB of CCM RAM attached directly to the core, and the DMA controllers cannot access it. A buffer placed there (sometimes by a linker script that simply targets the largest RAM region) produces transfers that silently move no data. Move DMA buffers into the main SRAM region.

### Why is my timer running at the wrong frequency after migrating to the F407?

Almost certainly an APB prescaler configuration issue. The F407 has two APB domains with different maximum frequencies, and the timer clock is doubled relative to the APB clock whenever that bus's prescaler is not 1. Copying a clock configuration from an F103 design, which has a simpler tree, commonly produces timer clocks that are off by a factor of two in one direction or the other.

### Can I still buy the STM32F103 in 2026?

Yes. The STM32F103 family remains in production and is one of the most widely stocked microcontroller lines available, with numerous active orderable part numbers. Availability should nonetheless be checked at the specific part-number level, since individual package, temperature-grade and packing variants are discontinued independently of the family.

### Should I migrate an existing STM32F103 design to the STM32F407?

Only if the design has genuinely run out of compute or needs a peripheral the F103 lacks: Ethernet, camera, USB high-speed. The migration requires a new board, revised clock configuration, attention to flash wait states and CCM placement, and requalification. If the constraint is simply that a specific F103 part number has become hard to source, a different F103 variant or authorised aftermarket stock is a far cheaper answer.

## Getting the part you need

Whether the requirement is a specific F103 variant that has become awkward to find or a full lifecycle picture for a design going into its second decade, send us the part number and we will come back with real availability — including authorised aftermarket stock where the original variant is discontinued.

[**Submit an RFQ**](/rfq) | [**Browse microcontrollers**](/category/microcontrollers) | [**Upload a BOM**](/bom)
