---
title: "Legacy DRAM and SDRAM Sourcing: The Controller Is the Constraint"
slug: "dram-sdram-legacy-sourcing"
status: "draft"
seoTitle: "Legacy SDRAM Sourcing: SDR, DDR and Why Substitution Is Hard"
seoDesc: "Half of DRAM part numbers are discontinued. Why the memory controller — not the chip — decides compatibility, reading SDRAM part numbers, refresh and temperature, and realistic substitution paths."
seoKeywords: "SDRAM sourcing, legacy SDRAM, IS42S16400, obsolete DRAM, SDR SDRAM replacement, DDR migration, SDRAM timing parameters, memory controller configuration"
tags: "DRAM, SDRAM, memory, legacy sourcing, memory controller, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Memory Sourcing"
relatedProducts: "IS42S16160J-6BLI, IS42S16400F-7TLI, W979H2KBVX1E TR, IS42S32400B-7TL, MT41K256M16TW-107 XIT:P TR, IS42RM16160D-7BLI"
---

# Legacy DRAM and SDRAM Sourcing: The Controller Is the Constraint

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: SDRAM, DRAM, memory controller, timing parameters, legacy sourcing

---

**DRAM is the memory family where the chip is the easy part and the controller is the problem.** Unlike SRAM or flash, a DRAM device does not simply respond to reads and writes; it is driven by a state machine that must issue an initialisation sequence, honour a dozen timing parameters, and refresh the array on schedule. Those parameters are configured in silicon or firmware for a specific device. Of the 10,061 DRAM and SDRAM part numbers in our catalogue, 5,241 are discontinued, and substituting one is usually a controller reconfiguration rather than a purchase decision.

## Key takeaways

- **52% of DRAM/SDRAM part numbers are discontinued**, and legacy SDR SDRAM supports a very large embedded and industrial installed base.
- **The controller holds device-specific timing.** Same density and organisation is not enough; tRCD, tRP, tRFC, CAS latency and the init sequence all have to match or be reconfigured.
- **Organisation matters more than density** — ×8, ×16 and ×32 parts of the same capacity are different devices with different pin counts.
- **Refresh requirements change with temperature**, and extended-temperature parts often need double refresh above 85 °C.
- **Moving from SDR to DDR is a redesign**, not a substitution — different signalling, termination, voltage and controller entirely.
- Where the controller is inside an FPGA, reconfiguration may be tractable; where it is inside a discontinued SoC, it may not be.

---

## Why DRAM is different from other memory

Every other memory type on a board is essentially passive: assert an address, get data. DRAM is an active system with a state machine on the other side of it.

To read a byte from SDRAM, the controller must have already:

- Run a specific power-up initialisation sequence — precharge all, auto-refresh cycles, mode register set.
- Programmed the mode register with CAS latency, burst length and burst type.
- Been tracking which row is open in which bank.
- Been issuing refresh commands at the required interval.

Every one of those depends on parameters taken from a specific datasheet. A different device of identical capacity may need a different CAS latency, different row-to-column delay, or a different refresh interval, and if the controller is not reconfigured, the result ranges from data corruption under load to a system that will not boot.

This is why "same density, same organisation" is a much weaker guarantee for DRAM than for SRAM or flash.

## Reading an SDRAM part number

```
IS42S 16 160 J - 6  B L I
│     │  │   │   │  │ │ └── Temperature: I = industrial
│     │  │   │   │  │ └──── Power: L = low power
│     │  │   │   │  └────── Package: B = TSOP-II / BGA variant by family
│     │  │   │   └───────── Speed grade: -6 ≈ 166 MHz, -7 ≈ 143 MHz
│     │  │   └───────────── Revision
│     │  └───────────────── Density code: 160 = 256 Mb
│     └──────────────────── Organisation: 16 = ×16 data width
└────────────────────────── Family: ISSI SDRAM (S = SDR)
```

The two fields that most often get missed:

Organisation (×8, ×16, ×32). A 256 Mb device can be 32M × 8, 16M × 16 or 8M × 32. These have different pin counts, different packages and different bus widths. `IS42S16160J-6BLI` is ×16; `IS42S32400B-7TL` is ×32. They are not alternatives to each other.

Speed grade. Expressed as a number that maps to a maximum clock frequency, and the mapping is family-specific rather than universal. A slower grade cannot run at the controller's configured frequency; a faster grade generally can run slower, which makes it the safe direction.

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Type | SDR SDRAM, DDR3 | DDR1, DDR2, RLDRAM, mobile/LPDDR legacy |
| Density | 64 Mb – 512 Mb SDR | Very low densities, and largest legacy |
| Organisation | ×16 | ×32, ×4 |
| Speed | Mid grades | Fastest grades |
| Temperature | Commercial | Industrial and automotive |

## What has to match

### 1. Timing parameters

The controller is configured with a set of values in clock cycles. The important ones:

| Parameter | What it is | Consequence if wrong |
| --- | --- | --- |
| **CAS latency (CL)** | Clocks from read command to data | Data sampled at the wrong cycle |
| **tRCD** | Row-to-column delay | Column command issued too early |
| **tRP** | Precharge time | Row activated before precharge completes |
| **tRAS** | Row active time (minimum) | Row closed too soon |
| **tRC** | Row cycle time | Bank reused too quickly |
| **tRFC** | Refresh cycle time | Refresh overlaps next command |
| **tREFI** | Refresh interval | Data decay if too long |

These are not all in a headline table. They come from the datasheet's AC characteristics section, and the controller values are usually derived once, at design time, and never revisited.

A substitution requires reading both datasheets' timing tables and confirming the controller's configured values are legal for the new device. Where the new part is *slower* on any parameter, the controller must be reconfigured, which may mean an FPGA rebuild, a bootloader change, or a device-tree edit depending on where the controller lives.

### 2. Where the controller actually lives

This determines whether reconfiguration is a small job or an impossible one.

| Controller location | Reconfiguration difficulty |
| --- | --- |
| FPGA soft or hard memory controller | Moderate — rebuild with new parameters, but see toolchain caveats |
| Processor with device-tree or board-file config | Moderate — edit and rebuild |
| Bootloader with hard-coded register writes | Moderate, if the source exists |
| SoC with parameters fixed in ROM or fused | **May be impossible** |
| Discontinued SoC with no toolchain | Blocked — see below |

The worst case is common in legacy designs: an SDRAM controller inside a processor whose toolchain no longer builds, so the timing parameters cannot be changed even though they are only numbers. When that happens, the only path is finding a DRAM whose timings are compatible with the existing configuration, which narrows the candidate list dramatically.

This is the same class of constraint described in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller) and [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide): the tooling, not the part, is the binding limit.

### 3. Refresh and temperature

DRAM holds data as charge on a capacitor, so it must be refreshed or the data decays. The standard refresh interval assumes an operating temperature ceiling — typically 85 °C.

Above that, leakage roughly doubles for every 10 °C, and extended-temperature devices require **double refresh rate** above 85 °C. If a design moves to an industrial-temperature part and the controller keeps the standard refresh interval, data decays at high ambient — producing bit errors that appear only in hot environments and disappear on the bench.

Some parts implement temperature-compensated self-refresh, which handles this in the device during low-power modes but not during normal operation.

**Check:** the refresh interval specified for both parts at your maximum operating temperature, and whether the controller supports switching refresh rate.

### 4. Voltage and signalling

SDR SDRAM is 3.3 V. DDR is 2.5 V, DDR2 1.8 V, DDR3 1.5 V, DDR4 1.2 V. Beyond the supply, each generation uses different signalling and termination — DDR introduced differential strobes and on-die termination, and the routing rules differ substantially.

Moving between generations is a board redesign, not a substitution. There is no such thing as replacing an SDR SDRAM with a DDR device on the same footprint.

## Substitution paths, ranked

| Situation | Path |
| --- | --- |
| Same manufacturer, same family, different suffix | Usually straightforward — check timings anyway |
| Different manufacturer, same density/organisation/speed | Compare timing tables; reconfigure controller if needed |
| Only a faster grade available | Safe direction — verify the controller can drive it slower |
| Only a different organisation available | Board change; the bus width differs |
| Only a newer DRAM generation available | Redesign — different voltage, signalling and controller |
| Controller cannot be reconfigured | Find a device compatible with existing timings, or last-time buy |

For most legacy SDR SDRAM designs the realistic answer is a [last-time buy](/blog/last-time-buy-quantity-and-storage), precisely because the controller constraint makes substitution expensive and the alternative (moving to DDR) is a full redesign of the memory subsystem.

Parts still active in our catalogue include `IS42S16160J-6BLI` and `W979H2KBVX1E TR` on the SDR side, with `MT41K256M16TW-107 XIT:P TR` representing current DDR3. Discontinued lines such as `IS42S16400F-7TLI`, `IS42S32400B-7TL` and `IS42RM16160D-7BLI` are the ones generating sourcing requests.

## Testing incoming DRAM

Unlike SRAM, a simple write-read test is insufficient for DRAM, because refresh and timing faults are load- and temperature-dependent. A meaningful incoming test:

1. **Full-array pattern write and verify** — catches density remarking.
2. **Sustained read/write at rated clock**, not a slow test, for long enough that refresh behaviour is exercised.
3. **Test at elevated temperature** if the parts are specified industrial, since refresh-related failures appear there and nowhere else.
4. **Verify the device identification** where the part supports mode-register readback.

The counterfeit forms are the same as for other memory (density and speed-grade remarking) and are covered in [writing a counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy).

## FAQ

### Why is SDRAM harder to substitute than SRAM or flash?

Because SDRAM is driven by a controller state machine configured with device-specific timing parameters. The controller must run a particular power-up initialisation sequence, program a mode register with CAS latency and burst settings, track open rows across banks, and issue refresh commands on schedule. Those values come from a specific datasheet, so a different device of identical capacity may require different timings, and without reconfiguration the result ranges from corruption under load to a system that will not boot.

### What does the organisation number in an SDRAM part number mean?

It is the data bus width. A 256 Mb SDRAM can be organised as 32M × 8, 16M × 16 or 8M × 32, and these are physically different devices with different pin counts, packages and bus widths. In ISSI part numbers such as IS42S16160J, the 16 after IS42S indicates a ×16 organisation. A ×16 and a ×32 device of the same total capacity are not alternatives to one another.

### Can I replace an SDR SDRAM with DDR?

No, not as a substitution. Each DRAM generation uses a different supply voltage — 3.3 V for SDR, 2.5 V for DDR, 1.8 V for DDR2, 1.5 V for DDR3, 1.2 V for DDR4, and different signalling, including differential strobes and on-die termination introduced with DDR. Routing rules, controller design and board layout all change. Moving generations is a redesign of the memory subsystem, not a component swap.

### What SDRAM timing parameters do I need to check?

CAS latency, tRCD (row to column delay), tRP (precharge time), tRAS (minimum row active time), tRC (row cycle time), tRFC (refresh cycle time) and tREFI (refresh interval). These come from the AC characteristics section of the datasheet rather than the headline table, and the controller's configured values must remain legal for the replacement device. Where the new part is slower on any parameter, the controller needs reconfiguring.

### What if the memory controller cannot be reconfigured?

This is common in legacy designs where the controller sits inside a processor whose toolchain no longer builds, or where timing parameters are fixed in ROM or fuses. In that case the only path is finding a DRAM whose timing specifications are compatible with the existing controller configuration, which narrows the candidate list substantially. Where no compatible device exists, a last-time buy is usually the realistic answer.

### Why does DRAM fail only at high temperature?

Because DRAM stores data as charge on a capacitor that leaks, and leakage roughly doubles for every 10 °C rise. The standard refresh interval assumes an operating ceiling around 85 °C; above that, extended-temperature devices require double the refresh rate. If a design uses an industrial-temperature part but the controller keeps the standard refresh interval, data decays at high ambient — producing bit errors that appear only in hot environments and are invisible on the bench.

### How should I test incoming DRAM?

A simple write-read test is insufficient because refresh and timing faults are load- and temperature-dependent. Perform a full-array pattern write and verify to catch density remarking, then run sustained read/write traffic at the rated clock for long enough to exercise refresh behaviour. If the parts are specified for industrial temperature, test at elevated temperature as well, since refresh-related failures appear there and nowhere else.

### Is legacy SDR SDRAM still available?

Yes, though 52% of the DRAM and SDRAM part numbers we cover are discontinued. Current SDR parts such as IS42S16160J-6BLI and W979H2KBVX1E remain available, while many older densities and organisations have gone. Because the controller constraint makes substitution expensive and moving to DDR is a full redesign, a last-time buy sized against remaining production is frequently the most economical response for a legacy SDR design.

## Related reading

The family-level picture (why memory obsoletes on economics and what has to match generally) is in [memory IC sourcing](/blog/memory-ic-sourcing-guide). For the other families, [SRAM sourcing](/blog/sram-sourcing-guide) and [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide). Where the controller cannot be reconfigured, the toolchain problem is the same one described in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller), and the usual answer is [a properly sized last-time buy](/blog/last-time-buy-quantity-and-storage).

Send us the part number with your controller's configured timings and we will tell you which devices are actually compatible without a reconfiguration.

[**Submit an RFQ**](/rfq) | [**Browse DRAM & SDRAM**](/category/dram-sdram) | [**Upload a BOM**](/bom)
