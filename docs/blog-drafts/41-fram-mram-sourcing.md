---
title: "FRAM and MRAM: When EEPROM Endurance Runs Out"
slug: "fram-mram-sourcing"
status: "draft"
seoTitle: "FRAM & MRAM Sourcing Guide: Endurance, Speed and Selection"
seoDesc: "FRAM writes at bus speed with effectively unlimited endurance. When it replaces EEPROM, how it differs from MRAM, the density ceiling, and why this family barely obsoletes."
seoKeywords: "FRAM sourcing, FM25V05, ferroelectric RAM, MRAM, FRAM vs EEPROM, nonvolatile memory endurance, MB85RS, FRAM write speed, data logging memory"
tags: "FRAM, MRAM, ferroelectric, nonvolatile memory, endurance, data logging, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 15
category: "Memory Sourcing"
relatedProducts: "FM25V05-G, FM24V02A-G, FM24CL64B-G, MB85RS64VPNF-G-JNERE1, MB85RS512TPNF-G-JNE1, FM25640B-GA"
---

# FRAM and MRAM: When EEPROM Endurance Runs Out

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~15 minutes
> **Topics**: FRAM, MRAM, endurance, write speed, non-volatile memory selection

---

**FRAM solves a problem that EEPROM and flash cannot: writing non-volatile data frequently, fast, and without wearing out.** A ferroelectric RAM writes at bus speed with no internal write cycle, at byte granularity, with endurance measured in the trillions of cycles rather than the thousands or millions. It costs more per bit and comes in lower densities, which is why it is a specialist choice rather than a default. It is also the memory family with the **lowest obsolescence rate we track** — 14%, against 52-70% for the rest. This guide covers when it is the right answer and what to check when sourcing it.

## Key takeaways

- **Endurance is the reason to use FRAM**: roughly 10^12 to 10^14 cycles against about 10^6 for EEPROM and 10^4–10^5 for flash.
- **FRAM writes at bus speed.** There is no millisecond write cycle and no acknowledgement polling, which changes firmware, usually for the better.
- **Density is the ceiling.** FRAM tops out far below flash, so it suits configuration, logging and state, not bulk storage.
- **Only 14% of FRAM/MRAM part numbers are discontinued**, the lowest of any memory family we cover.
- **FRAM and MRAM are different technologies** with different trade-offs; FRAM dominates the low-density non-volatile role.
- **Read cycles are destructive internally**: the device rewrites automatically, but it means read-disturb specifications exist.

---

## The problem FRAM solves

A design that writes non-volatile data on a duty cycle will eventually wear out EEPROM or flash, and the failure arrives in the field.

A worked example, repeated from [memory IC sourcing](/blog/memory-ic-sourcing-guide) because it is the argument:

```
Log one record per minute:  60 × 24 × 365 = 525,600 writes/year
EEPROM rated 1,000,000 cycles per byte
Without wear levelling → exhausted in under two years
```

The usual responses are wear levelling in firmware, or accepting a limited service life. Both are engineering effort spent working around a component limitation. FRAM removes the limitation:

| Technology | Endurance (cycles) | Write time | Granularity |
| --- | --- | --- | --- |
| NOR flash | 10^4 – 10^5 | ms (sector erase + program) | Sector erase, byte/page program |
| EEPROM | ~10^6 | 3–10 ms per page | Byte |
| **FRAM** | **10^12 – 10^14** | **Bus speed, no delay** | **Byte** |
| MRAM | 10^12 – 10^15 | Bus speed | Byte |
| Battery-backed SRAM | Unlimited | Bus speed | Byte |

At 525,600 writes per year, a 10^12-cycle rating is roughly two million years to the same byte. Wear ceases to be a design consideration.

## Where FRAM belongs

Good fits:

- **Data logging** — event logs, run-hour counters, trip records in industrial equipment.
- **Frequently updated state** — position counters in motion control, totalisers in metering.
- **Configuration that changes often**, as opposed to configuration written once at manufacture.
- **Power-fail state capture**, because writes complete immediately, there is no partially-written page if power is lost mid-write, which is a real EEPROM failure mode.
- **Replacing battery-backed SRAM** — same write behaviour, no battery. This is a common modernisation and removes a maintenance item.

Poor fits:

- **Bulk storage.** FRAM densities are orders of magnitude below flash.
- **Code storage.** Possible but uneconomic.
- **Write-once configuration.** EEPROM is cheaper and adequate.

That fifth bullet under good fits deserves emphasis: **replacing battery-backed SRAM with FRAM eliminates the retention-current and battery-life problem** described in [SRAM sourcing](/blog/sram-sourcing-guide), and eliminates a component that needs replacing in the field. For industrial equipment being refreshed, it is frequently the right modernisation.

## FRAM versus MRAM

Both are non-volatile with RAM-like write behaviour, but they occupy different positions.

| | FRAM | MRAM |
| --- | --- | --- |
| Mechanism | Ferroelectric polarisation | Magnetic tunnel junction |
| Typical densities | 4 Kb – 8 Mb | 256 Kb – 256 Mb+ |
| Write energy | Very low | Higher |
| Read | Destructive internally, auto-rewritten | Non-destructive |
| Availability | Widely available in serial packages | Narrower, more specialist |
| Typical role | Low-density non-volatile state | Higher-density, sometimes SRAM replacement |

For the low-density configuration-and-logging role, FRAM dominates. It is what the overwhelming majority of parts in this category are. MRAM appears where higher density is needed with RAM-like behaviour, including some SRAM-replacement roles.

## Interfaces and part numbers

Most FRAM in this space is serial, in SPI or I²C variants that mirror the corresponding EEPROM interfaces:

```
FM25 V05 - G
│    │     └── Package / lead finish
│    └──────── Density and voltage: V = low voltage, 05 = 512 Kb
└───────────── Family: FM25 = SPI FRAM (FM24 = I²C FRAM)
```

The `FM24` versus `FM25` distinction is the interface: **FM24 is I²C, FM25 is SPI.** They are not interchangeable, and the numbering is easy to misread at a glance.

Representative parts in our catalogue: `FM25V05-G` and `FM24V02A-G` (Cypress lineage, now Infineon), `FM24CL64B-G`, and Fujitsu's `MB85RS64VPNF-G-JNERE1` and `MB85RS512TPNF-G-JNE1`. The `MB85RS` series is the Fujitsu SPI FRAM family and is the other main source.

A useful sourcing property: serial FRAM largely follows the pinout and command conventions of the serial EEPROM it replaces. An SPI FRAM will typically drop into an SPI EEPROM footprint, and an I²C FRAM into an I²C EEPROM footprint — subject to the checks below.

## What to check when substituting

### Replacing EEPROM with FRAM

This is the common direction. It is usually straightforward:

| Item | Note |
| --- | --- |
| **Interface and pinout** | SPI FRAM ↔ SPI EEPROM, I²C FRAM ↔ I²C EEPROM. Verify the drawing |
| **Voltage range** | FRAM operates over wide ranges; confirm against your rail |
| **I²C address** | Same address-pin considerations as EEPROM — check block-select behaviour |
| **Write timing in firmware** | **The main change.** EEPROM firmware polls for write completion; FRAM completes immediately |
| **Page-write logic** | FRAM has no page boundary wrap, so page-crossing code becomes unnecessary |
| **Write-protect pin** | Behaviour differs between devices |

The firmware simplification is real but must be deliberate. Code that waits for an EEPROM write to complete will simply waste time on FRAM, which is harmless; code that assumes page-boundary wrapping and works around it is now doing something unnecessary. Neither breaks, but leaving EEPROM-shaped firmware in place forfeits most of the benefit.

### Replacing FRAM with FRAM

Between vendors (Infineon `FM25`/`FM24` and Fujitsu `MB85RS`) check:

- **Command set**, which is broadly conventional for SPI devices but differs in status-register details.
- **Maximum clock frequency.**
- **Density encoding in the part number**, which differs between the two families.

### Read-disturb and endurance in practice

FRAM reads are internally destructive: the read operation disturbs the polarisation state and the device rewrites it automatically. This is invisible to the user, but it means:

- Read endurance is a specified figure, not infinite, though it is typically very high.
- Extremely read-intensive applications should check the read-endurance specification rather than assuming reads are free.

For essentially all normal applications this is not a constraint, but it exists and appears in datasheets.

## Why this family barely obsoletes

14% discontinued, against 52-70% for SRAM, flash, DRAM and FIFO.

Two reasons. First, FRAM densities are low and stable — there is no relentless push to a denser node, because the applications need kilobits, not gigabits. The economic pressure that drives [memory obsolescence generally](/blog/memory-ic-sourcing-guide) does not apply.

Second, it is a growing rather than a declining category. FRAM is still being designed into new products, particularly in metering, industrial control and automotive, so manufacturers have every reason to keep lines running.

The practical implication: **for a new design that needs frequently-written non-volatile storage, FRAM is a lower lifecycle risk than the EEPROM it replaces**, which is an unusual thing to be able to say about a more specialised part.

Some obsolete parts do exist (`FM25640B-GA` for example) and where they do, the usual channel checks apply, described in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor). Several current FRAM parts in our catalogue come through Rochester Electronics.

## FAQ

### What is FRAM and how does it differ from EEPROM?

FRAM, ferroelectric RAM, stores data as the polarisation state of a ferroelectric material rather than as charge on a floating gate. The practical differences are endurance and speed: FRAM offers roughly 10^12 to 10^14 write cycles against about 10^6 for EEPROM, and writes complete at bus speed rather than taking several milliseconds. Both offer byte-level granularity, and serial FRAM largely mirrors the pinout and command conventions of the serial EEPROM it replaces.

### When should I use FRAM instead of EEPROM?

When the application writes frequently enough that endurance becomes a design constraint, or when write speed matters. Data logging, run-hour counters, motion-control position state, metering totalisers and power-fail state capture all fit. A design writing one record per minute performs over half a million writes per year, which exhausts a one-million-cycle EEPROM rating in under two years without wear levelling, and FRAM removes the constraint entirely rather than working around it.

### Can FRAM replace battery-backed SRAM?

Frequently yes. It is a common modernisation. FRAM offers the same immediate byte-level write behaviour without needing a backup battery, which removes both the data-retention-current constraint that governs battery-backed SRAM design and a field-replaceable component. The limits are density, since FRAM is available in far smaller capacities than SRAM, and cost per bit.

### Is FRAM a drop-in replacement for serial EEPROM?

Often close to it. SPI FRAM typically fits an SPI EEPROM footprint and I²C FRAM an I²C EEPROM footprint, with conventional command sets. Verify the pinout drawing, the voltage range, and the I²C addressing behaviour including any block-select bits. The main firmware change is that FRAM writes complete immediately, so acknowledgement polling and page-boundary workarounds become unnecessary — code that keeps them still works, but forfeits most of the benefit.

### What is the difference between FRAM and MRAM?

FRAM stores data as ferroelectric polarisation; MRAM uses magnetic tunnel junctions. FRAM is typically available at lower densities, from a few kilobits to a few megabits, with very low write energy, and dominates the configuration and logging role. MRAM reaches higher densities and is used where more capacity is needed with RAM-like write behaviour, including some SRAM-replacement applications, but is a narrower and more specialist market.

### Are FRAM reads destructive?

Internally, yes — reading disturbs the ferroelectric polarisation and the device automatically rewrites it as part of the read operation. This is invisible in normal use, but it means read endurance is a specified figure rather than unlimited, and extremely read-intensive applications should check that specification. For almost all normal usage it is not a practical constraint.

### Why is FRAM less likely to be discontinued than other memory?

Two reasons. Its densities are low and stable, so it is not subject to the economics that push other memory types onto ever-denser process nodes and strand the older capacities. And it is a growing category still being designed into new products in metering, industrial control and automotive, so manufacturers have reason to keep lines running. Only 14% of the FRAM and MRAM part numbers we cover are discontinued, against 52 to 70 percent for SRAM, flash, DRAM and FIFO.

### What is the difference between FM24 and FM25 FRAM parts?

The interface. FM24 devices use I²C and FM25 devices use SPI, in the same way that 24-series and 25-series EEPROMs split. They are not interchangeable, and the numbering is easy to misread at a glance — FM24V02A-G and FM25V05-G differ in far more than density. Fujitsu's equivalent SPI family uses the MB85RS prefix.

## Related reading

For the family-level picture and why memory obsoletes on economics, see [memory IC sourcing](/blog/memory-ic-sourcing-guide). For the EEPROM and flash devices FRAM most often replaces, [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide). For the battery-backed SRAM designs it can modernise, [SRAM sourcing](/blog/sram-sourcing-guide).

Send us the part number with your interface, density and voltage requirements and we will come back with what is available across the FRAM families.

[**Submit an RFQ**](/rfq) | [**Browse FRAM & MRAM**](/category/fram-mram) | [**Upload a BOM**](/bom)
