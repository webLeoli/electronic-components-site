---
title: "Non-Volatile Logging: Battery-Backed SRAM vs EEPROM vs FRAM vs MRAM vs NOR Flash"
slug: "nonvolatile-logging-technology-comparison"
status: "draft"
seoTitle: "FRAM vs MRAM vs EEPROM vs Battery-Backed SRAM for Logging: Measured"
seoDesc: "Battery-backed SRAM — the cheap answer historically — is 48-100% obsolete by family; FRAM and MRAM are 0-29%. Endurance arithmetic for five technologies, and why wear levelling is the real choice."
seoKeywords: "FRAM vs MRAM vs EEPROM, battery backed SRAM obsolete, nvSRAM replacement, EEPROM endurance calculation, wear levelling flash logging, non-volatile memory comparison, FM24V FM25V sourcing"
tags: "comparison, non-volatile memory, FRAM, MRAM, EEPROM, endurance, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 17
category: "Memory Sourcing"
relatedProducts: "FM25V05-G, FM24V02A-G, MB85RS512TPNF-G-JNE1, FM24CL64B-G, FM25V20-G, CAT24C64WI-GT3, AT24C64D-MAHM-E, AT24C08BN-SH-B"
---

# Non-Volatile Logging: Battery-Backed SRAM vs EEPROM vs FRAM vs MRAM vs NOR Flash

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~17 minutes
> **Topics**: endurance arithmetic per technology, wear levelling as the real decision, the availability inversion, vendor lineage inside one technology

---

**The conventional cost ranking of non-volatile memory is almost exactly inverted by its availability ranking, and the technology that used to be the cheap answer is the one you can no longer buy.** Measured on 2026-08-11: battery-backed SRAM and nvSRAM families run from 48% to **100% inactive** (`CY14` 48%, `BQ4` 74%, `STK14` 82%, `DS1644` 80%, `DS1210` 100%), while FRAM and MRAM (the parts that were always "too expensive for logging") sit at **0% to 29%** (`CY15` 0%, Everspin `MR25H` and `MR4A` 0%, `FM24` 6%, `MB85R` 19%, `FM25` 29%).

We have individual sourcing guides for [SRAM](/blog/sram-sourcing-guide), [flash and EEPROM](/blog/flash-eeprom-sourcing-guide) and [FRAM and MRAM](/blog/fram-mram-sourcing). None of them answers the question an engineer actually has, which is: *my product must retain a few kilobytes of log data across power cycles for fifteen years, which of these five do I use, and what is the arithmetic?* That is this article.

The short version: **the real choice is not a memory technology, it is how much wear-levelling complexity you are willing to write and maintain.** Two of the five need none.

## Key takeaways

- **Writing one record per second to a single EEPROM byte exhausts a 1-million-cycle rating in 11.6 days.** Wear levelling is not an optimisation; it is the design.
- **FRAM and MRAM need no wear levelling at all** — at 10^14 cycles, one write per second lasts about 3 million years. Everspin specifies MRAM at 10^16 accesses.
- **NOR flash cannot log at all without sector-level management**, because logging one record per second forces roughly 123,000 erases per year on one 4 KB sector against a 100,000-cycle rating.
- **Battery-backed SRAM cannot be stockpiled.** The lithium cell ages from the date code, not from installation, which breaks last-time-buy arithmetic: the same mechanism that makes embedded-battery RTC modules unbuyable in advance.
- **The availability answer inverts the cost answer.** nvSRAM and battery-backed families are 48-100% inactive; FRAM and MRAM are 0-29%.
- **Inside EEPROM, vendor lineage matters more than technology**: Microchip's `24LC` is **2% inactive** and `25LC` 1%, while the Atmel-heritage `AT24C` is **68%** and `CAT24` 53%. Same technology, 34× difference.
- **Choose by write rate first, retention second, capacity third.** Cost only decides between options that all pass.

---

## The five options, side by side

Measured availability, 2026-08-11, alongside the parameters that actually decide. Endurance and retention figures are typical published values for the technology class; confirm against the specific device.

| | Battery-backed SRAM / nvSRAM | EEPROM | NOR flash | FRAM | MRAM |
| --- | --- | --- | --- | --- | --- |
| Write endurance | Unlimited (cell) | ~10^6 cycles/byte | ~10^5 cycles/sector | 10^14-10^15 | **10^16** |
| Erase before write | No | No | **Yes, per sector** | No | No |
| Write time | Nanoseconds | 3-5 ms per page | ms per page, plus erase | Nanoseconds | Nanoseconds |
| Retention | **Battery life** (~10 yr) | 100-200 yr | ~20 yr | 10-150 yr (temp-dependent) | ~20 yr |
| Retention clock starts | **At the date code** | At write | At write | At write | At write |
| Wear levelling needed | No | **Yes** | **Yes, extensively** | No | No |
| Power-loss safety | Good (if battery healthy) | Byte/page atomic | **Erase window is exposed** | Excellent | Excellent |
| Cost per bit | Low (was) | Lowest | Lowest at capacity | High | Highest |
| Catalogue availability | **48-100% inactive** | 1-68%, by lineage | 57% inactive | 0-29% inactive | **0% inactive** |

## The endurance arithmetic

Do this calculation before choosing anything. It eliminates two of the five options in most logging designs.

Take a common industrial case: a datalogger writing one 16-byte record per second, continuously, for a fifteen-year service life.

```
Write rate      = 1 record/s
Per year        = 1 × 60 × 60 × 24 × 365 = 31,536,000 writes/year
Over 15 years   = 473,040,000 writes
```

### EEPROM, writing to one location

```
Rating          = 1,000,000 cycles
Life            = 1,000,000 / 31,536,000 per year
                = 0.032 years = 11.6 days
```

Eleven and a half days. This is the number that surprises people. That is why so many fielded products have an EEPROM that failed in a way nobody diagnosed: the log stopped updating and the product carried on.

### EEPROM, with wear levelling across the device

```
Device          = 64 kbit = 8,192 bytes
Records         = 8,192 / 16 = 512 slots
Total writes    = 512 slots × 1,000,000 cycles = 512,000,000
Life            = 512,000,000 / 31,536,000 = 16.2 years
```

Now it works — barely, with no margin, and only if the wear levelling is correct. A rotating write pointer across all 512 slots, itself stored somewhere that does not wear out, plus a way to find the newest record after an unexpected reset. That is real firmware with real failure modes. It is the actual cost of choosing EEPROM.

### NOR flash, one 4 KB sector

```
Records per sector = 4,096 / 16 = 256
Sector erases/year = 31,536,000 / 256 = 123,188
Rating             = 100,000 cycles
Life               = 100,000 / 123,188 = 0.81 years
```

Under a year on a single sector. Spread across a 16 Mbit device's 512 sectors it becomes about 415 years, but only with sector-rotation logic, an erase-in-progress recovery path, and acceptance that a power loss during an erase leaves a sector in an indeterminate state. Flash is the right answer at megabyte capacities and the wrong answer for a few kilobytes of frequently-updated data.

### FRAM or MRAM

```
Rating          = 10^14 cycles (FRAM, typical for FM24V/FM25V class)
Life            = 10^14 / 31,536,000 = 3,171,000 years
```

No wear levelling, no erase cycle, no page-write delay, no power-loss window. Writes complete at bus speed, so a write interrupted by power loss either happened or did not. For a logging application at any meaningful write rate, this is the difference between a memory driver and a memory access.

### Battery-backed SRAM

Cell endurance is unlimited, so the arithmetic moves to the battery, and that is where the problem is.

## Why battery-backed SRAM lost, and what it teaches

A battery-backed SRAM module's retention clock starts at manufacture, not at installation. The embedded lithium cell self-discharges on the shelf. A module with a ten-year retention specification and a three-year-old date code has seven years left before it is installed in anything.

This breaks last-time-buy arithmetic completely. The standard response to an end-of-life notice (compute your remaining build plus service demand and buy it) assumes stored parts keep their specification. For an embedded-battery device the stored parts are consuming their specification while stored. You cannot buy fifteen years of a ten-year part.

It is the same mechanism recorded in our [RTC sourcing guide](/blog/rtc-sourcing-guide), where `DS1743`, `DS1251` and `DS12885`-class modules cannot be stockpiled and the date code becomes part of the specification. The measured consequence for logging is stark: `DS1210` (the battery-controller companion) is **100% inactive** across every ordering code we list, `STK14` 82%, `DS1644` 80%, `BQ4` 74%, and the broader `CY14` nvSRAM family 48%.

If you are maintaining a product with battery-backed SRAM, this is the highest-priority item on its obsolescence list, because the replacement path is not a substitution; it is a firmware and schematic change to a different technology. Plan it as a project, not as a purchase. For designs that must keep the same footprint temporarily, [SRAM sourcing](/blog/sram-sourcing-guide) covers what remains available and the aftermarket lineage worth searching.

## The finding inside EEPROM: lineage beats technology

Two EEPROM families using the same technology, in the same packages, at the same densities, differ by 34× in obsolescence rate.

| Family | Vendor lineage | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `25LC` | Microchip, own design | 450 | **1%** |
| `24LC` | Microchip, own design | 658 | **2%** |
| `M24C` | STMicroelectronics | 183 | 37% |
| `CAT24` | Catalyst → onsemi | 350 | 53% |
| `AT25` | Atmel → Microchip | 854 | 55% |
| `AT24C` | Atmel → Microchip | 851 | **68%** |

Microchip's own `24LC` line is 2% inactive while the `AT24C` line it acquired from Atmel is 68%: a company keeping its own catalogue alive while rationalising the overlapping range it bought. This is the acquisition-history mechanism from the [IC obsolescence data study](/blog/ic-obsolescence-data-study), visible at maximum resolution: same technology, same function, same footprints, and the only difference is which company originally designed it.

The practical rule: when specifying a commodity part, check the lineage of the specific family, not the reputation of the vendor whose name is on it now. `AT24C64D-MAHM-E` is currently active; `AT24C08BN-SH-B` is obsolete; both are Atmel-heritage parts under Microchip. The family-level rate tells you which way the pruning is going.

## The decision procedure

Four questions in order. The first one that binds decides.

### 1. What is the write rate to the busiest location?

| Writes over service life, per location | Use |
| --- | --- |
| Under ~100,000 | Any of the five |
| 100,000 to ~1 million | EEPROM with simple rotation, or FRAM |
| Over ~1 million | **FRAM or MRAM** — wear levelling stops being tractable |
| Continuous, milliseconds apart | **FRAM or MRAM** — page-write time alone disqualifies EEPROM |

EEPROM's 3-5 ms page-write time is an independent disqualifier that gets forgotten. At one write per second it is 0.5% duty; at ten writes per second it is 5% and the bus is busy; at a hundred it is impossible regardless of endurance.

### 2. Can a power loss occur mid-write?

If yes, **FRAM and MRAM are the only options with no exposed window**, because a write completes in nanoseconds at bus speed. EEPROM's page write and flash's sector erase both have windows measured in milliseconds during which a power loss leaves the contents indeterminate — recoverable with journalling and a checksum, at the cost of more firmware and more capacity.

This is the criterion that decides most industrial designs, because "the machine is switched off with a rotary isolator" is the normal case, not the exception.

### 3. What retention do you need, and at what temperature?

Retention is a temperature-dependent specification and the ranking changes with it. FRAM retention is strongly temperature-dependent; EEPROM and flash lose retention as they accumulate write cycles, so a heavily-worn device does not meet its datasheet retention any more. **If the product logs continuously at 85 °C, get the retention figure at 85 °C and at end-of-life cycle count, not the headline number.** Battery-backed SRAM is the only option whose retention has nothing to do with writes and everything to do with the date code.

### 4. How much capacity?

FRAM and MRAM are available in kilobits to a few megabits, which covers logging, calibration and configuration. Above a few megabytes the choice collapses to NOR or NAND flash and the wear-levelling firmware becomes unavoidable — at which point use a filesystem designed for it rather than writing one.

## What to specify, by application

| Application | Choose | Reason |
| --- | --- | --- |
| Event log, several writes per second | **FRAM** (`FM24V`, `FM25V`, `MB85R`) | No wear levelling, no power-loss window, 6-19% inactive |
| Calibration constants, written at production only | **EEPROM** (`24LC`, `25LC`) | 1-2% inactive, lowest cost, write rate irrelevant |
| Operating-hours counter, updated continuously | **FRAM or MRAM** | The classic EEPROM-killer application |
| Firmware images, megabytes | **NOR flash** with a wear-levelling layer | Only option at capacity; see [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide) |
| Safety-critical state across brownout | **MRAM or FRAM** | Write atomicity is a safety argument, not a convenience |
| Replacing battery-backed SRAM in a legacy design | **FRAM or nvSRAM**, with schematic change | The battery path has no future; 48-100% inactive |
| Very high temperature, long retention | **Check per device** | Retention is temperature-dependent for all of them |

Current status by part number is on the [FRAM and MRAM](/category/fram-mram), [EEPROM](/category/eeprom), [SRAM](/category/sram) and [flash memory](/category/flash-memory) category pages. `FM25V20-G` is an example of a FRAM ordering code that has already gone obsolete while `FM25V05-G` and `FM24V02A-G` remain active, so check the code, not the family, and [send an RFQ](/rfq) if you need it confirmed against current stock.

## Frequently asked questions

### Why does everyone still use EEPROM if it wears out so fast?

Because most EEPROM applications write a handful of times in the product's life, where 1 million cycles is effectively infinite. Calibration constants, serial numbers and configuration written at production never approach the limit. EEPROM fails when it is used for *logging* (a repeated write to the same location) and one write per second exhausts a 1-million-cycle rating in 11.6 days. The technology is fine; the application match is what goes wrong.

### Is FRAM worth the price premium over EEPROM?

For anything that writes repeatedly, yes, and the comparison is not really about the part cost. FRAM removes the wear-levelling firmware, its testing, its failure modes, the page-write delay and the power-loss recovery path. Against an EEPROM design that needs a rotating pointer across 512 slots to reach 16 years of life with no margin, the FRAM part costs more and the *design* costs less. It is also better positioned on availability at 6-19% inactive against 68% for some EEPROM lineages.

### Can I use NOR flash for a small log?

Only with sector-rotation logic. It is usually the wrong tool. Logging one 16-byte record per second into a 4 KB sector forces about 123,000 erases per year against a 100,000-cycle rating — under a year of life. Spreading across a whole device works arithmetically but adds erase-in-progress recovery, because a power loss during a sector erase leaves that sector indeterminate. Use flash for images and bulk data; use FRAM or MRAM for frequently-updated small records.

### What replaces battery-backed SRAM?

FRAM or MRAM, with a schematic and firmware change — there is no drop-in. The battery-backed families are 48-100% inactive depending on lineage, and the fundamental problem is not availability but that the embedded lithium cell ages from the date code, so you cannot buy a fifteen-year supply of a ten-year part. Treat it as a planned redesign with a deadline rather than a sourcing exercise.

### Why is one EEPROM family 2% obsolete and another 68%?

Acquisition history. Microchip's own `24LC` and `25LC` lines measure 2% and 1% inactive; the `AT24C` and `AT25` lines it acquired from Atmel measure 68% and 55%. Same technology, same densities, same packages: the difference is which range the current owner is investing in and which it is rationalising. Check the family's measured rate rather than the vendor's overall reputation.

### Does MRAM's unlimited endurance make it the default choice?

Only where write rate or write atomicity governs. MRAM measures 0% inactive in our catalogue, which is excellent, but the population is small (51 ordering codes across `MR25H` and `MR4A`) and cost per bit is the highest of the five. For a calibration store written once, an `24LC` EEPROM at 2% inactive is the better engineering and commercial answer. Reserve MRAM and FRAM for the applications that actually stress endurance or power-loss atomicity.

### How do I know if my existing product has this problem?

Look for a repeated write to a fixed address, then compute cycles over the service life. Operating-hours counters, cycle counters, "last known state" stores and rolling event logs are the usual offenders. If the number exceeds the device rating, the failure is already scheduled, and it presents as a stale value rather than an error, so it will not appear in field returns. A [BOM scrub](/bom) will separately flag whether the memory device itself is heading for obsolescence.

### Does retention degrade with use?

For EEPROM and flash, yes — retention is specified at a cycle count, and a heavily-worn cell retains data for less time. A device rated for 100 years of retention at 10,000 cycles does not offer 100 years after 900,000 cycles. FRAM and MRAM do not degrade this way, and battery-backed SRAM's retention is set entirely by the cell's remaining charge. If your product both writes often and must retain data through long unpowered storage, this interaction is the specification to check. It is rarely on the front page of a datasheet.

## Sources

Availability and status figures are our own measurement across 719,342 catalogue
part numbers, dated 2026-08-11 and reproducible with
`scripts/measure-catalogue.mjs`. Technology parameters are from the primary
sources below; **confirm endurance and retention against the specific device's
datasheet**, because both vary within a technology and retention is specified at
a stated cycle count and temperature.

- Everspin Technologies, *Comparing Technologies: MRAM vs. FRAM* — application
  note; specifies MRAM endurance at 10^16 accesses and contrasts floating-gate
  limits. [everspin.com](https://www.everspin.com/file/157445/download)
- Infineon Technologies, *F-RAM (Ferroelectric RAM)* product documentation —
  endurance and retention for the `FM24`/`FM25` families.
  [infineon.com](https://www.infineon.com/products/memories/f-ram-ferroelectric-ram)
- Manufacturer datasheets for the specific ordering codes cited, for retention
  at cycle count and temperature.
