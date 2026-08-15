---
title: "Flash and EEPROM Sourcing: Command Sets, Sectors and Endurance"
slug: "flash-eeprom-sourcing-guide"
status: "draft"
seoTitle: "Flash & EEPROM Sourcing: NOR, NAND, Serial and Substitution"
seoDesc: "Substituting flash is a firmware problem as much as a hardware one. Command sets, sector architecture, SFDP, I²C addressing, page-write sizes and endurance — what actually has to match."
seoKeywords: "flash memory sourcing, serial NOR flash replacement, W25Q16, SST39VF, EEPROM 24LC, SFDP, flash sector architecture, NAND flash sourcing, EEPROM page write"
tags: "flash, EEPROM, NOR, NAND, serial flash, memory, endurance, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Memory Sourcing"
relatedProducts: "W25Q16JWZPIQ, W25X10CLSNIG TR, SST39VF1601C-70-4I-EKE, 24LC16BT-I/SN, AT24C64D-MAHM-E, CAT24C64WI-GT3, FM25V05-G"
---

# Flash and EEPROM Sourcing: Command Sets, Sectors and Endurance

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: NOR flash, NAND flash, serial flash, EEPROM, FRAM, substitution, endurance

---

**Substituting non-volatile memory is a firmware exercise disguised as a purchasing one.** Two serial flash devices of the same density and package can differ in command set, sector architecture, status-register layout and supported SPI modes — all of which the driver depends on. Our catalogue holds 15,689 flash and 9,653 EEPROM part numbers, with 55% of flash already discontinued against 31% of EEPROM. This guide covers what has to match, why the two families obsolete at such different rates, and how to substitute without discovering the problem in the bootloader.

## Key takeaways

- **Flash is 55% discontinued; EEPROM only 31%.** Serial EEPROM is still designed into new products, so its lines stay in production.
- **Density and package tell you almost nothing.** Command set, sector architecture and status-register behaviour decide compatibility.
- **SFDP is the closest thing to a compatibility standard** for serial NOR — check whether both parts support it before assuming a driver will work.
- **Erase granularity is a firmware constraint.** A different sector size changes how wear levelling and configuration storage behave.
- **EEPROM substitution traps are I²C address range, page-write size and write-cycle time**, which differ between vendors at the same density.
- **Endurance can decrease on newer parts.** Check it against your write duty cycle rather than assuming improvement.

---

## Four technologies, one shelf

"Non-volatile memory" covers devices with quite different behaviour.

| Technology | Erase granularity | Typical endurance | Typical role |
| --- | --- | --- | --- |
| **Serial NOR flash** | Sector (4 KB) / block (32–64 KB) | 10K–100K cycles | Boot code, FPGA configuration, firmware images |
| **Parallel NOR flash** | Sector / block | 10K–100K cycles | Legacy execute-in-place, industrial |
| **NAND flash** | Block, large | 1K–100K cycles | Bulk storage, file systems |
| **EEPROM** | Byte | ~1M cycles | Configuration, calibration, serial numbers |
| **FRAM** | Byte | 10^12+ cycles | High-write-rate logging, counters |

The erase granularity row is the one that matters for substitution. EEPROM can rewrite a single byte; flash must erase a whole sector before rewriting any part of it. A design that writes a few bytes frequently belongs on EEPROM or FRAM, and moving it to flash (even flash of the right density) changes the firmware substantially.

## Why flash and EEPROM obsolete at different rates

55% of the flash part numbers we cover are discontinued, against 31% of EEPROM.

The reason is what each is used for. Flash densities track whatever the current generation of products needs, so a 2 Mb parallel NOR that was mainstream in 2005 has no market today and no fab wants the capacity. Small serial EEPROMs, by contrast, are still designed into new products constantly — every board that needs to store a MAC address, a calibration constant or a configuration byte uses one, and those requirements have not changed in twenty years.

The practical consequence: **legacy parallel NOR and older NAND are the difficult part of this space**, while serial NOR and serial EEPROM remain comparatively well supplied. Parts such as `W25Q16JWZPIQ`, `W25X10CLSNIG`, `24LC16BT-I/SN` and `AT24C64D-MAHM-E` are current; a great deal of parallel flash is not.

## Serial NOR: what actually has to match

This is the family where a "compatible" part most often is not.

### Command set

Serial flash devices respond to opcodes — read, page program, sector erase, read status, write enable, and dozens more. The basic set is broadly conventional across vendors, but:

- **Erase commands differ** in which granularities are offered and what opcode selects them.
- **Fast-read variants** (dual, quad, DTR) use different opcodes and different dummy-cycle counts.
- **Status and configuration registers** differ in layout, in how many there are, and in which bits are volatile versus non-volatile.
- **Protection schemes** (block protection bits, individual sector lock, one-time-programmable regions) vary substantially.

A driver written against one vendor's datasheet frequently works for basic read and program on another part and then fails on erase, protection or fast-read configuration.

### SFDP is the closest thing to a standard

Serial Flash Discoverable Parameters is a JEDEC standard (JESD216) that puts a machine-readable parameter table inside the device describing its geometry, opcodes and timing. A driver that reads SFDP can configure itself for an unfamiliar part.

If both the original and the candidate support SFDP, and your bootloader or driver uses it, substitution is dramatically easier. **Check for SFDP support explicitly** — older devices predate it, and its presence or absence is a good first filter on candidates.

### Sector and block architecture

Erase granularity is a firmware constraint, not a datasheet detail:

- **A design storing configuration in one 4 KB sector** cannot move to a part whose smallest erase unit is 64 KB without restructuring its storage layout.
- **Uniform versus boot-block architecture.** Some flash devices have smaller sectors at one end of the array for boot code and larger ones elsewhere. Substituting a uniform-sector part into a design that relies on small boot sectors changes the memory map.
- **Wear-levelling assumptions** built into firmware depend on sector count and size.

### Voltage, clock and modes

- **Supply voltage.** 3.3 V is standard, 1.8 V parts are common in newer designs, and they are not interchangeable.
- **Maximum clock frequency**, which constrains boot time.
- **Supported modes** — single, dual, quad SPI, and QPI. A quad-capable design will not perform correctly on a single-only part, and enabling quad mode frequently requires setting a non-volatile configuration bit whose location is vendor-specific.

## Parallel NOR: the legacy problem

Parallel flash is where the hard sourcing sits. Devices like `SST39VF1601C-70-4I-EKE` serve execute-in-place designs in industrial equipment, where the processor boots directly from flash without a copy step.

Substitution constraints are tighter than for serial:

- **Access time grade**, exactly as for [SRAM](/blog/sram-sourcing-guide): a slower part causes data-dependent read errors.
- **Bus width and organisation** — ×8, ×16, or selectable, with a BYTE# pin.
- **Command set**: the older JEDEC-standard command sequences vary in detail between vendors.
- **Sector map**, which is frequently hard-coded in a bootloader.
- **Package** — TSOP-48 and PLCC are being rationalised out.

For a design that boots directly from parallel flash, a substitution generally requires bootloader changes, which pulls in the toolchain-archival problem described in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller).

## EEPROM: the traps at the same density

Serial EEPROM looks like the easiest substitution in electronics and has three consistent traps.

1. I²C address range. A `24LC16` uses three of its address bits internally for block selection, so it occupies eight I²C addresses and none of the A0–A2 pins do what you expect. Smaller and larger densities in the same family behave differently. Substituting across densities can therefore collide with another device on the bus: a fault that appears as intermittent bus errors rather than an obvious failure.

2. Page-write size. EEPROMs buffer a write page internally — commonly 8, 16, 32, 64 or 128 bytes depending on density and vendor. Writing across a page boundary wraps within the page rather than continuing, silently corrupting data. **Firmware written for a 32-byte page will corrupt data on a 16-byte-page part** while appearing to work for small writes.

3. Write-cycle time. The internal write takes milliseconds, during which the device does not acknowledge. Firmware that polls for acknowledgement handles this correctly; firmware that uses a fixed delay tuned to the original part will fail on a slower one.

Parts such as `24LC16BT-I/SN`, `AT24C64D-MAHM-E` and `CAT24C64WI-GT3` are broadly interchangeable at the same density from different vendors, but only after checking these three items.

## Endurance and retention against your duty cycle

Check both against what the firmware actually does, not against the headline number.

A worked example. A design logs a 64-byte record once per minute to a serial EEPROM rated 1,000,000 cycles per byte:

```
Writes per year = 60 × 24 × 365 = 525,600
```

Without wear levelling, writing to the same location exhausts the rating in **under two years**. With wear levelling across a 64 Kb device the same workload is comfortable for decades. **The endurance figure is per location, and the firmware determines how it is consumed.**

For genuinely high write rates, FRAM is the right answer — `FM25V05-G` and `FM24V02A-G` in our catalogue serve exactly this case, with endurance high enough that wear ceases to be a design consideration.

Also note: **retention degrades with accumulated write cycles and with temperature.** A part rated for twenty years at 55 °C is not rated for twenty years at 85 °C, and a location near its endurance limit retains data for far less than the headline figure.

## Substitution checklist

| # | Item | Applies to | Failure if wrong |
| --- | --- | --- | --- |
| 1 | Command set and opcode compatibility | Flash | Erase or protection commands fail |
| 2 | SFDP support on both parts | Serial NOR | Driver cannot self-configure |
| 3 | Sector/block architecture and erase granularity | Flash | Storage layout and wear levelling break |
| 4 | Boot-block vs uniform sectors | NOR | Memory map changes |
| 5 | Supported SPI modes and quad-enable bit location | Serial NOR | Quad mode fails or corrupts |
| 6 | Access time grade | Parallel NOR | Data-dependent read errors |
| 7 | I²C address range and block-select bits | EEPROM | Bus address collision |
| 8 | Page-write size | EEPROM | Silent data corruption at page boundaries |
| 9 | Write-cycle time and ACK polling | EEPROM | Fixed-delay firmware fails |
| 10 | Endurance vs write duty cycle, with wear levelling | All | Wear-out in the field |
| 11 | Supply voltage and I/O levels | All | Marginal or damaging |

## Sourcing notes

Serial NOR and serial EEPROM remain well supplied, largely from Winbond, Microchip, Onsemi and others, so most substitutions here are ordinary procurement once the compatibility work is done.

Parallel NOR, legacy NAND and older EEPROM in obsolete packages are where authorised aftermarket matters. Parts such as `CG8392AA` and `TIG022TS-TL-E` in our flash category come through Rochester Electronics — licensed continuation with full traceability, which for a bootloader-critical device removes both the counterfeit question and the requalification question. Check that channel first, per [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Incoming test for flash and EEPROM should include a full-array write, read-back and verify, which detects density remarking directly. For flash, also verify the JEDEC ID and, where supported, the SFDP table: a remarked part frequently reports the wrong device ID, and that check takes seconds.

## FAQ

### Why is flash memory more likely to be obsolete than EEPROM?

Because they serve different design needs. Flash densities track whatever current products require, so a density that was mainstream fifteen years ago has no market and no fab wants the capacity — 55% of the flash part numbers we cover are discontinued. Small serial EEPROMs, by contrast, are still designed into new products constantly for storing MAC addresses, calibration constants and configuration, and that requirement has not changed, so those lines stay in production. EEPROM's discontinuation rate is 31%.

### Can I replace a serial flash with any part of the same density?

Not reliably. Two serial flash devices of identical density and package can differ in command set, erase granularity, status and configuration register layout, protection scheme, supported SPI modes, and the location of the quad-enable bit. A driver written for one frequently handles basic read and program on another and then fails on erase, protection or fast-read configuration. Check whether both parts support SFDP, which is the closest thing to a compatibility standard.

### What is SFDP and why does it matter?

Serial Flash Discoverable Parameters, defined in JEDEC standard JESD216, is a machine-readable parameter table stored inside a serial flash device describing its geometry, opcodes and timing. A driver or bootloader that reads SFDP can configure itself for an unfamiliar part rather than relying on hard-coded assumptions. If both the original and the candidate support SFDP and your firmware uses it, substitution becomes dramatically easier, so SFDP support is a good first filter when shortlisting candidates.

### What happens if the replacement flash has a different sector size?

Firmware breaks in ways that may not be immediately obvious. Flash must erase a whole sector before any part of it can be rewritten, so a design storing configuration in a 4 KB sector cannot simply move to a device whose smallest erase unit is 64 KB: the storage layout, and any wear-levelling scheme built on sector count, has to be restructured. Boot-block devices, which have smaller sectors at one end of the array, change the memory map when replaced with a uniform-sector part.

### Why does my EEPROM data get corrupted at certain addresses?

Almost certainly a page-write size mismatch. EEPROMs buffer writes in an internal page (commonly 8, 16, 32, 64 or 128 bytes depending on density and vendor) and a write that crosses a page boundary wraps within the page rather than continuing to the next one. Firmware written for a 32-byte page will silently corrupt data on a part with a 16-byte page, while appearing to work correctly for writes that happen to stay within a page.

### Why does substituting an EEPROM cause I²C bus errors?

Because larger EEPROMs use some of their I²C address bits internally for block selection. A 24LC16, for example, uses three bits this way and therefore occupies eight I²C addresses, with the A0 to A2 pins not functioning as simple address selects. Substituting across densities changes how many addresses the device occupies, which can collide with another device on the same bus — presenting as intermittent bus errors rather than an obvious failure.

### How do I check whether endurance is sufficient?

Compare the rated cycles against what the firmware actually writes to a single location, not against total writes. A design logging a record once per minute performs about 525,600 writes per year, which exhausts a one-million-cycle rating in under two years if it always writes the same location, but is comfortable for decades with wear levelling across a device. Endurance is specified per location, so the firmware's write pattern determines whether the rating is adequate.

### When should I use FRAM instead of flash or EEPROM?

When the write rate is high enough that endurance becomes a design constraint. FRAM offers roughly 10^12 write cycles or more against about one million for EEPROM and tens of thousands for flash, writes at bus speed rather than taking milliseconds, and erases at byte granularity. It costs more per bit and comes in lower densities, but for data logging, counters and frequently updated state it removes wear-out from the design entirely. It also has the lowest obsolescence rate of the memory families we track.

## Related reading

The family-level picture — why memory obsoletes faster than other components, and the general substitution rules — is in [memory IC sourcing](/blog/memory-ic-sourcing-guide). For volatile memory, [SRAM sourcing](/blog/sram-sourcing-guide). Where a substitution requires bootloader changes, the toolchain-archival advice in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller) applies. For the channel decision, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number with your command-set, sector and voltage constraints and we will come back with candidates that your firmware will actually drive.

[**Submit an RFQ**](/rfq) | [**Browse Flash memory**](/category/flash-memory) | [**Upload a BOM**](/bom)
