---
title: "FPGA Configuration Memory: The Dedicated PROM Is a Dead Product Category"
slug: "fpga-configuration-flash-pairing"
status: "draft"
seoTitle: "FPGA Configuration Flash Pairing: XCF, XC18V, EPCS, EPCQ Replacement"
seoDesc: "536 dedicated FPGA configuration PROM part numbers, 486 inactive — 91%. Why XC18V and EPC16 are 100% gone, how to move to generic serial flash, and the density, mode and voltage checks that decide it."
seoKeywords: "FPGA configuration flash, XC18V04 obsolete, XCF08P replacement, EPCS16 EPCQ replacement, EPC16 obsolete, generic SPI flash for FPGA config, M25P16 obsolete N25Q, configuration bitstream density"
tags: "FPGA, configuration PROM, serial flash, bitstream, boot mode, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "FPGA & CPLD Sourcing"
relatedProducts: "XCF16PVO48C, XCF08PVO48C, XC18V04PCG44C, XC18V512SOG20C, XC17256EL-VO8C0100, EPCQ32ASI8N, AT17LV256-10SU, SST27SF010-70-3C-PHE"
---

# FPGA Configuration Memory: The Dedicated PROM Is a Dead Product Category

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: availability data, moving to generic serial flash, density and mode checks, voltage, programming flow

---

**Of the 536 dedicated FPGA configuration PROM part numbers in our catalogue, 486 are no longer active — 91%.** Broken down by family it is starker: `XC18V…` is 28 of 28 inactive, `EPC16…` 15 of 15, `EPC8…` 5 of 5, `EPCS…` 8 of 8, `XC17…` 176 of 181 and `EPC1…` 38 of 39. The dedicated configuration PROM — a purpose-built device whose only job was to hold a bitstream and clock it into an FPGA at power-up — has been eliminated as a product category, because generic serial flash does the same job at a fraction of the price. That is good news for new designs and a specific, solvable problem for existing ones: the replacement is available and cheap, but it is not a drop-in, because the bitstream format, the pin functions and often the FPGA's configuration mode all change.

## Key takeaways

- **Dedicated configuration PROMs: 486 of 536 part numbers inactive (91%).** Several families are at 100%.
- **The replacement is generic serial flash**, and its availability is excellent: `MX25L…` is 16 of 200 inactive, `IS25LP…` 12 of 183.
- **But not all serial flash is healthy either** — `M25P…` is 217 of 222 inactive (98%) and `N25Q…` 272 of 293 (93%), so a "modern" choice made ten years ago is also gone.
- **Configuration mode changes with the memory type**: master serial, SPI, BPI and JTAG are different pin functions and different strap settings.
- **Density must cover the bitstream plus anything else you store**, with the compression setting accounted for.
- **Voltage matters twice**: the flash supply and the FPGA's configuration-bank I/O voltage must agree.
- **The programming flow changes** — indirect programming through the FPGA's JTAG port replaces a dedicated PROM programmer, which affects manufacturing test.

---

## The availability data

Measured 2026-08-04. Dedicated configuration devices, from the [FPGA configuration PROM category](/category/fpga-config-proms) — 536 parts, 486 inactive, 273 indexable. Vendors: Atmel 208, Xilinx 191, Altera 81, Rochester Electronics 52.

| Family | What it was | Parts | Not active | Rate |
| --- | --- | ---: | ---: | ---: |
| `XC18V…` | Xilinx in-system programmable config PROM | 28 | 28 | **100%** |
| `EPC16…` | Altera enhanced configuration device | 15 | 15 | **100%** |
| `EPC8…` | Altera enhanced configuration device | 5 | 5 | **100%** |
| `EPCS…` | Altera serial configuration device | 8 | 8 | **100%** |
| `XC17…` | Xilinx one-time-programmable PROM | 181 | 176 | 97% |
| `EPC1…` | Altera one-time-programmable config device | 39 | 38 | 97% |
| `EPCQ…` | Altera quad serial configuration device | 11 | 9 | 82% |
| `EPC2…` | Altera reprogrammable config device | 18 | 12 | 67% |
| `XCF…` | Xilinx Platform Flash | 19 | 12 | 63% |

Now the serial flash that replaces them, site-wide by prefix:

| Family | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| `IS25LP…` (ISSI) | 183 | 12 | **7%** |
| `MX25L…` (Macronix) | 200 | 16 | **8%** |
| `MT25Q…` (Micron) | 200 | 47 | 24% |
| `SST25…` (Microchip) | 204 | 74 | 36% |
| `S25FL…` (Cypress/Infineon) | 1,167 | 434 | 37% |
| `W25Q…` (Winbond) | 1,224 | 661 | 54% |
| `AT45DB…` (Atmel/Microchip DataFlash) | 298 | 218 | 73% |
| `N25Q…` (Micron, superseded) | 293 | 272 | **93%** |
| `M25P…` (ST/Micron, superseded) | 222 | 217 | **98%** |

Three conclusions a buyer can act on.

The dedicated PROM is not coming back. If a design uses one, plan the migration rather than hunting stock — though note that `XCF…` at 63% and `EPC2…` at 67% still contain live ordering codes, and `XCF16PVO48C`, `XCF08PVO48C` and `EPCQ32ASI8N` are active in our catalogue, several through Rochester Electronics.

Choosing serial flash by "it's a standard SPI part" is how you end up here again. `M25P16`-class parts were the standard choice for a decade and are now 98% inactive; `N25Q` succeeded them and is 93% gone. **Density and package are not enough — check the family's health**, and prefer parts whose vendors are still investing in the line.

`AT45DB` DataFlash is a special case at 73% inactive, and it matters because DataFlash uses a page-oriented architecture with non-power-of-two page sizes by default. Designs that used it for configuration plus data storage may depend on that page structure, so a move to a conventional SPI flash changes the addressing.

## Configuration mode: the part decides the pins

An FPGA can load its bitstream several ways, and the mode is selected by strap pins at power-up. Changing the memory type changes the mode.

| Mode | Memory it expects | Pins used | Notes |
| --- | --- | --- | --- |
| **Master serial** | Dedicated PROM (`XC17…`, `XC18V…`, `EPC1…`) | Dedicated CCLK, DIN, DONE, INIT | The legacy arrangement; FPGA clocks the PROM |
| **Master SPI** | Generic SPI serial flash | SPI pins on dual-purpose I/O | The modern replacement path |
| **Master BPI** | Parallel NOR flash | A wide address/data bus | Fast, uses many pins |
| **Slave serial / slave SelectMAP** | A processor or CPLD feeds the bitstream | — | Common where a host already exists |
| **JTAG** | Programmer or embedded controller | TCK/TMS/TDI/TDO | Always available; slow |

What this means for a migration from a dedicated PROM to SPI flash:

- **The mode straps change**, so the board's mode pins must be re-strapped, often a resistor change, occasionally a layout change.
- **The SPI pins are dual-purpose I/O on many families.** After configuration they can revert to user I/O, or be retained for run-time access to the flash, and which behaviour you get is a bitstream setting. If those pins are already used for something else in the design, they are not available.
- **The bitstream file format differs.** A PROM file (`.mcs`, `.pof`-class) built for a dedicated device is not the same as a raw or SPI-formatted image; the tools generate a different output, and the byte order and any header can differ.
- **Compression and encryption settings** affect the image size and the mode's support for them.

A CPLD or small FPGA as a configuration controller is a legitimate third path — it reads any memory you like and drives slave serial mode —. It is how some legacy designs were built. If the design already has a CPLD, this may be the least-disruptive migration. The relevant CPLD availability data is in [Altera MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths).

## Density: cover the bitstream, then everything else

The configuration memory must hold the bitstream plus whatever else the design keeps there. Uncompressed bitstream size scales with device size, and the memory has to be sized against the *uncompressed* worst case unless compression is guaranteed.

The arithmetic to do before choosing:

```
bitstream (uncompressed, from the tool report)          e.g. 32 Mbit device family
+ second bitstream, if the design supports fallback     (dual-image update: ×2)
+ golden image, if field update must be recoverable     (+1 image)
+ software image for a soft processor                    (application dependent)
+ non-volatile user data (calibration, serial numbers)   (application dependent)
+ bad-block / spare margin
------------------------------------------------------------------
required flash density
```

The dual-image case is the one that catches people. A field-updatable design that must survive a failed update keeps two bitstreams plus a fallback, so the flash is at least twice the bitstream size. If the original design used a dedicated PROM sized exactly to one bitstream, moving to field update is a density change as well as a memory change.

Also check:

- **Compression**: reduces the stored image but adds decompression time, and support varies by family and mode.
- **Configuration time**, which is set by the clock rate and the image size, and matters where a system supervisor releases reset on a deadline, the sequencing question in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).
- **Whether the FPGA can read the flash after configuration** for user data, which is a mode and bitstream setting.

## Voltage: two separate checks

Configuration memory voltage has bitten enough designs to deserve its own section.

The flash's own supply. Serial flash is commonly 3.3 V or 1.8 V, and some parts are dual-supply. The legacy dedicated PROMs were mostly 3.3 V or 5 V (`XC17…` includes 5 V-era parts) so a migration frequently changes the rail.

The FPGA's configuration-bank I/O voltage. The bank carrying the configuration pins has its own V_CCIO, and it must match the flash's interface voltage. Mismatch produces one of two failures:

- **Flash at 3.3 V, bank at 1.8 V**: the flash's output high exceeds the bank's tolerance, a reliability and possibly a damage problem.
- **Flash at 1.8 V, bank at 3.3 V**: the flash's output high may not reach the bank's input threshold, so configuration fails intermittently, often temperature-dependent. This is the same threshold arithmetic as in [decoding a 74-series part number](/blog/74-series-logic-decode-guide).

Level translation in a configuration path is possible but adds delay and risk; the clean answer is to match the voltages, which may mean choosing the flash to suit the bank rather than the other way round. Where translation is unavoidable, the constraints are in [level shifter selection](/blog/level-shifter-selection-guide).

Also confirm **the flash's supported clock rate at that voltage** — many parts are slower at 1.8 V, and whether the FPGA's configuration clock rate setting is within it.

## The programming flow changes, and so does manufacturing

**A dedicated PROM could be programmed in a device programmer before assembly, or in-system through its own JTAG chain. Generic SPI flash attached to an FPGA is usually programmed *indirectly*: the tools load a temporary bitstream into the FPGA that turns it into a flash programmer, then write the flash through the FPGA's JTAG port.**

Consequences to plan for:

- **Programming time changes**, often substantially. It is now proportional to image size over a JTAG link.
- **The manufacturing test flow changes.** A separate PROM-programming station disappears; JTAG access becomes mandatory at test.
- **Test-point requirements change**: the JTAG chain must be accessible, and the flash's SPI signals may need probe access for failure analysis.
- **Field update becomes possible**, which is usually a benefit, but it introduces the dual-image and golden-image requirements above.
- **Blank-part handling**: pre-programmed flash from a distributor is an option for volume, and it changes incoming inspection (you now verify programmed content, not just the part).

In-system programmability is also a lifecycle argument. `XC17…` parts were one-time programmable; `XC18V…` and `XCF…` were in-system programmable. A design that used an OTP PROM has never had a field-update path, so the migration to serial flash adds a capability that may need its own security review — bitstream encryption and authentication, if the design's intellectual property matters.

## Sourcing notes

What is still available in the dedicated families: `XCF16PVO48C`, `XCF08PVO48C` and variants, `XC17256EL-VO8C0100`, `AT17LV256-10SU`, `AT17LV256-10JU`, `EPCQ32ASI8N`, and `SST27SF010-70-3C-PHE` all appear as active in our catalogue, several through Rochester Electronics, so a short-term bridge exists for some designs.

What is in last-time buy: the Xilinx `XC18V` group — `XC18V04PCG44C`, `XC18V04VQ44C`, `XC18V04VQG44C`, `XC18V04PC44C`, `XC18V01PC20C`, `XC18V512SO20C`, `XC18V512SOG20C`, `XC18V512VQ44C` — plus `XCF128XFT64C`. **If a design uses `XC18V`, this is a live decision**: the family is 100% inactive as a whole and these ordering codes are the remaining window. Size it per [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

What is already obsolete: `XC17V01VO8C`, `XC17S15AVOG8C`, `XC17S100AVO8I`, `EPCS4SI8N`, `EPCQ16SI8N`, `EPCQ512ASI16N`, `AT17LV010-10JI`, `AT17LV020-10JC`, `AT17N010-10PI`.

A note on the Atmel `AT17…` family, which accounts for 208 part numbers here: these were the third-party alternative to Xilinx PROMs and are largely gone. Designs that chose them as a second source now have neither.

Incoming inspection for configuration memory should verify content, not just identity:

- **Read back the device ID** and compare against the expected manufacturer and density codes.
- **For pre-programmed parts, read back the image and compare a checksum** against the golden image. This is the only meaningful test and it catches both wrong-content and wrong-density parts.
- **Verify at the intended clock rate and voltage**, since a part that works slowly at 3.3 V may fail at rate at 1.8 V.
- **Confirm the erase and program cycle count expectation** if the design field-updates: endurance is specified per sector, and a part with a lower rating changes the update budget, the same concern as in [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide).
- **Check date codes and packaging** per [date codes and lot traceability](/blog/date-code-lot-traceability-explained), and note that pre-programmed flash from an unofficial channel is an opportunity to inject modified content, which makes provenance a security matter as well as a quality one.

## Migration checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Configuration mode supported by the FPGA family | FPGA will not load at all |
| 2 | Mode strap pins re-strapped | Wrong mode selected at power-up |
| 3 | SPI pins available (not already used as user I/O) | Pin conflict; redesign |
| 4 | Bitstream file format regenerated for the new mode | Image not recognised |
| 5 | Density covers uncompressed image, ×2 if dual-image | Update path impossible |
| 6 | Golden/fallback image and user data allowance | No recovery from a failed update |
| 7 | Flash supply voltage vs FPGA configuration-bank V_CCIO | Damage, or intermittent configuration failure |
| 8 | Flash clock rate at the chosen voltage | Configuration fails at rate |
| 9 | Configuration time vs reset release deadline | System runs before the FPGA is configured |
| 10 | Post-configuration access to flash, if needed | User data unreachable |
| 11 | Programming flow and JTAG access at manufacturing test | Cannot program in production |
| 12 | Erase/program endurance for field updates | Wear-out during the product life |
| 13 | Bitstream encryption/authentication if IP matters | Bitstream readable from the flash |
| 14 | **Chosen flash family's own lifecycle** | Same problem again in five years |

## FAQ

### Why are dedicated FPGA configuration PROMs all obsolete?

Because generic serial flash does the same job for much less money, so vendors stopped making purpose-built parts. In our catalogue 486 of 536 dedicated configuration PROM part numbers are inactive (91%) with `XC18V`, `EPC16`, `EPC8` and `EPCS` families at 100%. The function did not disappear; it moved to standard SPI flash plus a configuration mode in the FPGA. That means the migration path is cheap and available, which is unusual for an obsolescence problem, but it is a design change rather than a substitution.

### Can I just fit an SPI flash where the old PROM was?

No — three things change together. The FPGA's configuration mode straps must be changed to a master SPI mode, the SPI signals use dual-purpose I/O pins rather than the dedicated PROM interface, so those pins must be free, and the bitstream has to be regenerated in the SPI image format rather than as a PROM file. Voltage also needs checking on both sides. It is normally a resistor-strap and firmware-flow change plus a possible small layout change, not a footprint swap.

### Which serial flash families are safe to design in now?

By our data, the healthiest are ISSI `IS25LP…` at 12 of 183 part numbers inactive and Macronix `MX25L…` at 16 of 200, followed by Micron `MT25Q…` at 47 of 200. Be careful with the ones that used to be the default: `M25P…` is 217 of 222 inactive and `N25Q…` 272 of 293, so a design that migrated to "standard SPI flash" a decade ago is facing the same problem again. Winbond `W25Q…` sits in the middle at 54%, and Atmel `AT45DB…` DataFlash at 73%; the latter also has a page architecture that a conventional SPI part does not reproduce.

### How much flash density do I need?

Start from the uncompressed bitstream size in the tool's report, then add for everything else the memory holds: a second bitstream if the design supports field update with fallback, a golden recovery image, any soft-processor software, and non-volatile user data such as calibration constants and serial numbers. A field-updatable design therefore needs at least twice the bitstream size, often more. Do not size against the compressed image unless compression is guaranteed in your mode, and leave margin; the cost difference between densities is small compared with a board revision.

### What voltage problems occur in a configuration path?

Two, and both are avoidable. If the flash runs at 3.3 V while the FPGA's configuration bank is at 1.8 V, the flash's output high exceeds what the bank tolerates. If the flash runs at 1.8 V and the bank at 3.3 V, the flash's high level may not reach the bank's input threshold, so configuration fails intermittently and often only at temperature: the hardest version of the fault to find. Match the voltages by choosing the flash to suit the bank, and check the flash's rated clock speed at that voltage, since many parts are slower at 1.8 V.

### How does the manufacturing flow change?

A dedicated PROM could be programmed in a device programmer before assembly. Generic SPI flash attached to an FPGA is normally programmed indirectly: the tools load a temporary bitstream that turns the FPGA into a flash programmer and write the flash through the JTAG port. So JTAG access becomes mandatory at test, programming time becomes proportional to image size over a JTAG link, and a separate programming station disappears. Pre-programmed flash from a distributor is an alternative for volume, which shifts incoming inspection to verifying content rather than identity.

### What should I do if my design uses XC18V parts?

Treat it as a live decision rather than a future one. The `XC18V` family is 100% inactive as a whole in our catalogue, and the remaining ordering codes — `XC18V04PCG44C`, `XC18V04VQ44C`, `XC18V04PC44C`, `XC18V01PC20C`, `XC18V512SO20C` and siblings, plus `XCF128XFT64C` — are in last-time buy. Either size a last-time buy against the product's whole remaining life, or plan the migration to serial flash now while the design team still has the project files and the tools that built the bitstream.

### Is there a security consideration in moving to serial flash?

Yes, and it cuts both ways. A one-time-programmable PROM had no field-update path, which also meant no update-based attack surface; standard serial flash is readable and writable, so the bitstream can be extracted from the board unless the FPGA family's encryption and authentication features are enabled. If the design's intellectual property matters, enable bitstream encryption as part of the migration rather than afterwards. Separately, pre-programmed flash bought outside authorised channels is an opportunity to inject modified content, which makes provenance a security control as well as a quality one.

## Related reading

FPGA family and lifecycle context: [how to choose the right FPGA](/blog/how-to-choose-right-fpga), [FPGA obsolescence and end-of-life planning](/blog/fpga-obsolescence-spartan-cyclone-end-of-life), and the device-specific guides — [Spartan-6](/blog/sourcing-xilinx-spartan-6-guide), [Spartan-3](/blog/sourcing-xilinx-spartan-3-legacy), [legacy Virtex](/blog/xilinx-virtex-legacy-sourcing), [7 Series and Zynq](/blog/xilinx-7-series-zynq-sourcing), [Altera Cyclone](/blog/sourcing-altera-cyclone-legacy), [Altera MAX CPLD](/blog/altera-max-cpld-replacement-paths), [Lattice MachXO and ECP](/blog/lattice-machxo-ecp-sourcing), [Actel ProASIC and IGLOO](/blog/actel-proasic-sourcing-guide).

Memory side: [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide) for endurance, retention and the serial-flash families themselves, and [memory IC sourcing](/blog/memory-ic-sourcing-guide) for the wider picture.

System integration: [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for configuration-time versus reset-release, [level shifter selection](/blog/level-shifter-selection-guide) if voltages cannot be matched, [SoC and SoC FPGA sourcing](/blog/soc-fpga-application-processor-sourcing-guide) where the FPGA also boots a processor.

Send us the configuration PROM part number and the FPGA it feeds. We will tell you whether a live ordering code still exists, and if it does not, which serial flash family to migrate to that will not repeat this in five years.

[**Submit an RFQ**](/rfq) | [**Browse configuration PROMs**](/category/fpga-config-proms) | [**Upload a BOM**](/bom)
