---
title: "Legacy Microprocessors: 64% Gone, and the One You Can Still Buy Is From 1982"
slug: "legacy-microprocessor-sourcing-guide"
status: "draft"
seoTitle: "Legacy Microprocessor Sourcing: PowerQUICC, 68000, MIPS, Z80 Availability"
seoDesc: "5,169 MPU part numbers, 64% inactive — the worst rate of any large category. Family-by-family data, why the E suffix is a functional difference, mask revisions, and aftermarket part-number suffixes."
seoKeywords: "legacy microprocessor sourcing, MPC8548 obsolete, PowerQUICC end of life, MC68000 availability, IDT79 MIPS obsolete, Z80 discontinued, mask revision errata, MPU last time buy, N80C188"
tags: "microprocessors, MPU, PowerPC, PowerQUICC, 68000, MIPS, Z80, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Processors, DSP & SoC"
relatedProducts: "MPC8548EPXAUJD557, MPC8548PXAUJD557, MC68HC000EI12, IDT79RV4700-100DP, N80C188/TR, SPEAR310-2, MPC8313EZQAGDC, MC8640HX1250HE"
---

# Legacy Microprocessors: 64% Gone, and the One You Can Still Buy Is From 1982

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: family availability data, functional suffixes, mask revisions, aftermarket part numbers, migration paths

---

**Of the 5,169 microprocessor part numbers in our [MPU category](/category/microprocessors), 3,300 are no longer active — 64%, the worst rate of any large category we hold.** And the distribution is not what most engineers expect. Freescale's PowerQUICC line, which shipped into industrial and telecom equipment through the 2010s, runs 77% inactive, and its automotive-qualified `KMPC` variants are 99% gone. The IDT MIPS processors are at 100%. Meanwhile `N80C188/TR` (an Intel embedded x86 from 1982) is **active** in our catalogue through the authorised aftermarket. Availability in this category has almost nothing to do with how modern a part is, and everything to do with whether someone still runs a production line for it.

## Key takeaways

- **64% of MPU part numbers are inactive**, versus 30-45% in most other categories. The MPU is the least substitutable part on a board, so its obsolescence forces the most expensive redesigns.
- **PowerQUICC/QorIQ is the acute exposure**: `MPC8xxx` is 931 of 1,217 inactive; the automotive `KMPC` prefix is **518 of 524**.
- **`IDT79` MIPS is 100% inactive** (119 of 119) and `TS68` (Thomson's 68000) is 30 of 30.
- **The `E` in `MPC8548E` is a security engine, not a package code.** `MPC8548E` and `MPC8548` are functionally different parts, both active here.
- **Mask revision is not in the orderable part number.** It is in the top-side marking, and firmware errata workarounds are revision-specific.
- **Aftermarket part numbers carry appended codes** — 74% of the part numbers ending `557` in our catalogue are Rochester's. Searching only the OEM number misses that stock.
- **A legacy MPU is a system, not a chip**: companion PHYs, bus timing, boot flash and DDR all constrain the replacement.

---

## The availability data, family by family

Measured 2026-08-04 across our MPU category. These are part numbers we hold, not the vendors' catalogues, but the pattern is consistent with what the market shows.

| Family prefix | What it is | Parts held | Not active | Rate |
| --- | --- | ---: | ---: | ---: |
| `KMPC…` | Freescale automotive-qualified PowerPC | 524 | 518 | **99%** |
| `IDT79…` | IDT MIPS (RC/RV series) | 119 | 119 | **100%** |
| `TS68…` | Thomson/ST 68000 family | 30 | 30 | **100%** |
| `Z80…` | Zilog Z80 | 89 | 80 | 90% |
| `MPC8…` | Freescale PowerQUICC / QorIQ | 1,217 | 931 | 77% |
| `MC683…` | Motorola 683xx embedded controllers | 74 | 56 | 76% |
| `XPC…` | Freescale pre-production/qualified PowerPC | 86 | 64 | 74% |
| `Z84…` | Zilog Z84C00 CMOS Z80 | 55 | 39 | 71% |
| `MC68…` | Motorola 68000 family | 286 | 197 | 69% |
| `SPC5…` | ST Power Architecture automotive | 10 | 3 | 30% |
| `MPC5…` | Freescale/NXP MPC5xxx automotive | 11 | 2 | 18% |
| `N80…` | Intel embedded x86 (80C186/188) | 27 | **0** | **0%** |

Three things a buyer can act on immediately:

The `KMPC` prefix is the single most exposed line we hold. The `K` denotes Freescale's qualified/automotive grade of the same PowerPC silicon, and 518 of 524 part numbers are inactive. If a BOM carries a `KMPC` part, treat it as end-of-life until proven otherwise.

MIPS is finished as a sourceable architecture in this catalogue. `IDT79RV4700-100DP`, `IDT79RC64V475-200DP` and `IDT79RV4650-180DP` are all obsolete, and nothing in the `IDT79` prefix is active. Equipment built on IDT MIPS (a great deal of 1990s and 2000s networking and imaging hardware) has no like-for-like path.

The oldest parts are often the safest. `N80C188/TR` is active through Rochester Electronics while `MPC8313EZQAGDC` and `MPC8343EVRAGD` (parts twenty years newer) are obsolete. Authorised aftermarket production follows demand from installed equipment, not silicon age.

## The suffix that is a different processor

`MPC8548E` and `MPC8548` are not the same device. The `E` denotes an integrated security engine (the SEC crypto accelerator). Everything else (core, package, pinout, speed grade options) matches.

In our catalogue:

```
MPC8548E*  → 48 part numbers
MPC8548*   → 92 part numbers total, so 44 without the E
MPC8548EPXAUJD557  active (Freescale Semiconductor)
MPC8548PXAUJD557   active (Rochester Electronics)
```

Fitting a non-`E` part where the firmware uses the security engine means IPsec, SSL offload or secure boot silently has no hardware behind it. Depending on the software stack this appears as a driver probe failure, a fallback to software crypto at a fraction of the throughput, or a boot failure if secure boot is mandatory.

The reverse substitution (`E` where non-`E` was) is usually harmless functionally but changes power dissipation and price.

This pattern recurs throughout the category, and each vendor encodes it differently:

| Field | Example | What it changes |
| --- | --- | --- |
| Feature suffix | `MPC8548E` vs `MPC8548` | Security engine present |
| Speed grade | Embedded in the ordering code | Core and bus frequency, thermal design |
| Temperature grade | Often a letter mid-code | Industrial vs commercial range |
| Qualification prefix | `KMPC…`, `XPC…`, `SPC5…` | Automotive qualification, or pre-production |
| Package | `PXAUJD`-style blocks | BGA size, ball count, lidded or bare die |

`XPC` deserves a specific warning. Freescale used `XPC` for pre-qualification and prototype silicon. Those parts exist in the market (86 in our catalogue, 64 inactive) and they are not production-qualified devices. **Buying an `XPC` part for production is buying unqualified silicon**, and the same caution applies to the `ES` suffix on FPGA-SoC parts described in [SoC, FPGA-SoC and application processor sourcing](/blog/soc-fpga-application-processor-sourcing-guide).

## Mask revision: the field that is not in the part number

A processor's silicon revision (mask set, stepping, or revision level) is generally not part of the orderable code. It is in the top-side marking and in a device ID register.

Why it matters more here than in any other category:

- **Errata are revision-specific.** A processor ships with an errata document listing dozens of hardware defects and their software workarounds. Firmware validated on revision 2.1 may not include the workaround needed on revision 1.0, and may include one that is harmful on 3.0.
- **Some errata affect boot.** If a workaround lives in the boot loader rather than the OS, a different revision can produce a board that never reaches a prompt.
- **Newer is not automatically safer.** A later revision can change timing enough to expose a marginal DDR interface that passed on the original silicon.

The practical protocol: record the mask revision of the silicon your firmware was validated against, require it (or a documented-compatible revision) on the purchase order, and verify it by reading the device ID register during incoming test rather than trusting the marking. **Where a supplier cannot state the revision, treat the offer as unqualified.**

This is also a reason to prefer authorised aftermarket over open-market purchase for processors specifically: the aftermarket supplier knows what it produced, as discussed in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Aftermarket part numbers are not the OEM part numbers

A pattern worth knowing before your next search. In our catalogue:

```
part numbers ending "557":   850 total, 629 from Rochester Electronics (74%)
part numbers ending "2518":   28 total,  25 from Rochester Electronics (89%)
part numbers ending "551":   426 total, 240 from Rochester Electronics (56%)
```

Aftermarket and continuity suppliers append their own codes to the OEM number, which is how `MPC8548PXAUJD` appears as `MPC8548PXAUJD557`. **A BOM search on the exact OEM string will not match it.**

So when a search returns nothing, search the OEM number as a prefix rather than an exact string. This single habit surfaces stock that appears not to exist —. That is why a "no stock anywhere" conclusion from a parametric search is unreliable for legacy processors. If you send us the OEM number we do this expansion automatically; the [BOM upload](/bom) path handles it too.

## A legacy MPU is a system, not a chip

Replacing a processor is rarely a component decision, because the board around it was designed for that specific device.

| Dependency | What breaks on substitution |
| --- | --- |
| **Boot flash type and mode** | Boot straps, NOR vs NAND vs SPI, and the boot ROM's expectations |
| **DDR controller generation** | DDR2 vs DDR3, timing calibration, memory part compatibility — see [DRAM and SDRAM legacy sourcing](/blog/dram-sdram-legacy-sourcing) |
| **Ethernet MAC and PHY interface** | MII/RMII/RGMII/SGMII generation and the PHY it was validated with |
| **PCI, PCIe or local bus** | Generation and lane count; legacy PCI often has no modern equivalent |
| **Bus timing and wait states** | Peripheral access timing on an external bus |
| **Interrupt controller mapping** | Firmware's vector assumptions |
| **Clock tree and PLL ratios** | Available core/bus/DDR ratio combinations |
| **Voltage rails and sequencing** | Multiple rails in a specific order — see [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide) |
| **Toolchain and BSP** | Compiler, board support package and OS port for that exact device |

That last row is often the binding constraint. A processor may still be purchasable while its board support package no longer builds on any supported host, or while the OS version it was ported to has no security updates. Conversely a redesign may be blocked not by hardware effort but by the absence of a maintained BSP for the replacement.

Practical consequence for the sourcing decision: the cost of a processor redesign is dominated by software revalidation, not by the board. That usually makes a last-time buy attractive even at a poor unit price, which changes the arithmetic below.

## Last-time buy arithmetic for a processor

Because the redesign cost is high, the quantity calculation matters more here.

```
annual usage                        500 units/year
remaining product life               12 years
service and spares (10%)
------------------------------------------------
base requirement    500 × 12       = 6,000 units
spares allowance    6,000 × 10%    =   600 units
yield/attrition     6,600 × 3%     =   198 units
------------------------------------------------
last-time-buy quantity             ≈ 6,800 units
```

Then the storage question, which for BGA processors is a real constraint. Large BGAs are moisture-sensitive devices, typically MSL 3, which under J-STD-033 means a floor life of 168 hours out of dry-pack before a bake is required. Twelve years of storage requires:

- **Original dry-pack integrity** — sealed moisture-barrier bags with desiccant and humidity indicator cards, not opened and re-bagged.
- **A bake procedure documented for the day the parts are used**, because a 12-year-old MSL 3 part will need it.
- **Solderability consideration**: tin whisker growth and intermetallic ageing on the balls after a decade, which is a genuine reason some assemblers re-ball old BGAs, a practice with its own risks.

The full storage method is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and the counterfeit-inspection dimension in [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Migration paths when a buy is not possible

Four routes, in ascending order of engineering cost.

1. Authorised aftermarket. Rochester Electronics holds 1,145 part numbers in this category. For 68000-family, 80C186/188, ADSP-era and some PowerPC parts this is original-die production with traceability: the only true drop-in that will ever exist.

2. Within-family migration. Moving from `MPC8313` to a still-active `MPC8548` or `P2041` keeps the architecture, the toolchain and much of the BSP, but changes package, rails, DDR generation and peripheral mix. It is a board redesign with software porting rather than a rewrite.

3. Architecture change. Moving from PowerPC or MIPS to Arm or RISC-V is a full software port. It is often the right answer for a product with a long remaining life, because it moves onto silicon with a supply base. It is the same decision described in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller) — one scale larger.

4. FPGA emulation of the original processor. For genuinely irreplaceable legacy — a machine tool controller whose firmware exists only as a ROM image, with no source: a soft core implementing the original instruction set inside an FPGA can preserve the software exactly. This is a real, used technique for 68000-class and Z80-class systems, and it turns a processor problem into an FPGA problem, which is a healthier supply position. The FPGA side is covered in [how to choose the right FPGA](/blog/how-to-choose-right-fpga), and the CPLD-scale version of the same trick (bridging legacy bus timing) in [Altera MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths).

Route 4 is also how legacy peripherals get preserved: an FPGA can present the original parallel bus timing to an unchanged processor while talking to modern memory and serial peripherals behind it, which is exactly the pattern in [ADC sourcing](/blog/adc-sourcing-guide) for converters.

## Sourcing notes

Vendor concentration: NXP Semiconductors 1,493 part numbers, Freescale Semiconductor 1,285 (the same silicon under two brand records — worth searching both), Rochester Electronics 1,145, Texas Instruments 322, Zilog 240, Renesas 138, IDT 119, STMicroelectronics 101.

Two search habits follow from that split. First, **search both `NXP` and `Freescale` as manufacturers**: the merger left both names in circulation and a search filtered on one misses the other. Second, **search the OEM number as a prefix** to catch appended aftermarket codes, as shown above.

Currently obsolete in our catalogue and typical of what buyers ask for: `MC68HC000EI12`, `MPC8377CVRALGA`, `MPC8272ZQMIBA`, `MPC8313EZQAGDC`, `MPC8343EVRAGD`, `MC8640HX1250HE`, `OMAPL138EZWTQ4R`, and the IDT MIPS parts above. In last-time buy: `SPEAR310-2` (ST's ARM9 SPEAr), `D32210FPV` and `D32211FPV` (Renesas).

Still active and useful to know: `MPC8548EPXAUJD557` and `MPC8548PXAUJD557`, `P2041NXN1PNB557`, `N80C188/TR`, and the Renesas `R9A07G0…` RZ family for new designs.

Incoming inspection for processors is more demanding than for most parts:

- **Read the device ID and revision registers** and compare with what firmware expects. This is the check that matters most and it requires a working test fixture, which is why processors should be bought where provenance is documented.
- **Boot the actual firmware image**, not a generic test. A processor that passes a JTAG ID check can still be a different feature variant.
- **Verify the feature suffix functionally** — for an `E` part, exercise the crypto engine; for a variant with a specific peripheral, exercise that peripheral.
- **X-ray the BGA** for ball integrity and evidence of reballing, and check date codes for lot consistency per [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Feature suffix (`E`, security engine, peripheral variants) | Hardware function silently absent |
| 2 | Mask/silicon revision vs validated firmware | Errata workarounds mismatched; may not boot |
| 3 | Qualification prefix (`KMPC`, `XPC`, `SPC`) | Unqualified or pre-production silicon in production |
| 4 | Speed grade and thermal design | Timing failures or overheating |
| 5 | Temperature grade | Out of specification at extremes |
| 6 | Package, ball count and mechanical height | Does not fit; heatsink clearance |
| 7 | DDR controller generation and memory compatibility | No memory training |
| 8 | Boot mode straps and flash type | Never boots |
| 9 | Ethernet MAC interface generation and PHY pairing | No network |
| 10 | Bus timing for external peripherals | Peripheral access failures |
| 11 | Voltage rails, sequencing and PMIC pairing | Damage or no start |
| 12 | Toolchain and BSP availability | Cannot build or maintain firmware |
| 13 | MSL handling and bake before assembly | Popcorning during reflow |

## FAQ

### Why are microprocessors so much more obsolete than other components?

Because a processor anchors a system design rather than serving it. Vendors retire a processor family when the platform it was built for stops selling, and there is no incentive for anyone else to make a compatible part, since the value is in the software ecosystem rather than the pinout. Our catalogue shows 64% of 5,169 MPU part numbers inactive against roughly 30-45% for most other categories. The same property that makes them irreplaceable (everything on the board is designed around them) is what makes their obsolescence so consequential.

### What does the E mean in MPC8548E?

An integrated security engine: the crypto accelerator used for IPsec, SSL and secure boot offload. `MPC8548E` and `MPC8548` are otherwise the same processor, and both are active in our catalogue, one from Freescale and one through Rochester Electronics. Fitting the non-`E` part where firmware expects the engine gives a driver probe failure, a silent fallback to software crypto at much lower throughput, or a boot failure where secure boot is mandatory. It is a functional difference, not a package code.

### How do I know which silicon revision I need?

From your own validation record, because the revision is generally not in the orderable part number; it is in the top-side marking and in a device ID register. Processor errata documents list dozens of hardware defects with revision-specific software workarounds, so firmware validated on one revision may lack a workaround needed on another, or include one that is wrong for a later one. Record the revision your firmware was qualified against, specify it on the purchase order, and verify it by reading the ID register during incoming test.

### What is an XPC part number?

Freescale's prefix for pre-qualification and prototype silicon. These parts circulate in the market (86 in our catalogue, 64 of them inactive) and they are not production-qualified devices, so their specifications and errata may differ from the production part they preceded. Buying `XPC` material for production means shipping unqualified silicon. The same caution applies to `ES`-suffixed engineering samples in the FPGA and SoC categories.

### Why does searching for a legacy processor part number return nothing?

Often because aftermarket suppliers append their own codes to the OEM number, so an exact-string search misses their stock. In our catalogue 74% of part numbers ending in `557` are Rochester Electronics material, as are 89% of those ending `2518`. Search the OEM number as a prefix rather than an exact match. Also search both `NXP` and `Freescale` as manufacturer names, since the merger left both in circulation and filtering on one hides the other.

### Which is more expensive, a last-time buy or a processor redesign?

Usually the redesign, because its cost is dominated by software revalidation rather than board work — new BSP, driver porting, regression testing, and in regulated products requalification. That is why processor last-time buys are often justified at unit prices that would be absurd for a commodity part. Size the buy properly: annual usage times remaining life, plus a spares allowance and an attrition allowance, and then plan the storage, because large BGAs are moisture-sensitive and a decade in a compromised dry-pack is a real risk.

### Can an FPGA replace an obsolete processor?

For genuinely irreplaceable legacy, yes. It is a used technique rather than a theoretical one. A soft core implementing the original instruction set (68000-class or Z80-class, for instance) can run the original firmware image unmodified, which matters when the source code no longer exists. It converts a dead-end processor problem into an FPGA problem, where the supply base is healthier and re-targetable. A smaller version of the same idea uses a CPLD to present the original bus timing to unchanged software while modern parts sit behind it.

### Which legacy processor families still have supply?

The ones with living installed bases served by the authorised aftermarket. `N80C188/TR` (Intel embedded x86 from the early 1980s) is active in our catalogue, as are `MPC8548` variants, `P2041NXN1PNB557` and a range of 68000-family parts through Rochester Electronics, which holds 1,145 part numbers here. What has no path is IDT MIPS (`IDT79`, 119 of 119 inactive), Thomson 68000 (`TS68`, 30 of 30) and Freescale's automotive `KMPC` prefix (518 of 524).

## Related reading

The rest of this cluster: [DSP sourcing](/blog/dsp-sourcing-guide) (where toolchain obsolescence is even sharper) [SoC, FPGA-SoC and application processor sourcing](/blog/soc-fpga-application-processor-sourcing-guide), and [specialty logic: DDR registers and ECL](/blog/specialty-logic-ddr-ecl-sourcing-guide).

The system around the processor: [DRAM and SDRAM legacy sourcing](/blog/dram-sdram-legacy-sourcing), [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide) for boot devices, [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide) for the rails, [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for the clock tree.

Decisions and mechanics: [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us the OEM part number with the silicon revision your firmware was validated on. We search prefixes rather than exact strings, which is how stock in this category is found.

[**Submit an RFQ**](/rfq) | [**Browse microprocessors**](/category/microprocessors) | [**Upload a BOM**](/bom)
