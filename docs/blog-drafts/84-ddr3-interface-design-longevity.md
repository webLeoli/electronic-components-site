---
title: "Designing a DDR3 Interface You Can Still Populate in Ten Years"
slug: "ddr3-interface-design-longevity"
status: "draft"
seoTitle: "DDR3 Interface Design for Long-Life Products: Footprint and Timing Headroom"
seoDesc: "Micron's DDR3 MT41J is 95% obsolete while ISSI's IS43 is 30% — the second source outlived the first. How to design a DDR3 footprint that accepts another vendor, density and voltage without a respin."
seoKeywords: "DDR3 interface design, DDR3L 1.35V vs 1.5V, DDR3 footprint density migration, tRFC refresh overhead, DDR3 speed grade decode, discrete DRAM no SPD, DDR3 second source, IS43 ISSI DDR3"
tags: "DDR3, memory interface design, hardware design, design for availability, FPGA, second sourcing"
author: "FPGACenter Engineering Team"
readingTime: 18
category: "Hardware Design & Integration"
relatedProducts: "MT41J128M16HA-15E AIT:D, MT41K64M16TW-107 AUT:J, IS43TR16128C-107MBLI-TR, MT47H64M16HR-3 L:G, IS43R86400E-6BLI"
---

# Designing a DDR3 Interface You Can Still Populate in Ten Years

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~18 minutes
> **Topics**: footprint headroom across densities, the 1.5 V/1.35 V decision, refresh arithmetic, why discrete DRAM has no SPD, second-source qualification

---

**The DDR3 device you designed with is more likely to be obsolete than the DDR3 device you can buy today, and they are not the same part.** Measured across our catalogue on 2026-08-11, Micron's `MT41J` (DDR3, 1.5 V) is **95% inactive** and `MT41K` (DDR3L, 1.35 V) is 61%, while ISSI's `IS43` range (the second source nobody designed in) is **30%**. DDR2 `MT47H` is 88% gone and SDR `MT48LC` 91%.

If your product has a ten-year production life, the memory decision is not "which DRAM do I choose". It is "what does my board have to look like so that a DRAM I have not chosen yet will populate on it". This guide covers the five design decisions that determine that, with the arithmetic for each, and the one that surprises most teams: **a discrete DRAM has no SPD, so its timings are compiled into your bitstream, and a vendor change is a firmware release rather than a BOM edit.**

## Key takeaways

- **The survivor is the second source.** `MT41J` 95% inactive, `MT41K` 61%, `IS43` 30%. Qualify a second vendor at design time, not at end-of-life.
- **Design the rail at 1.5 V unless power forces otherwise.** DDR3L parts are specified to run at both 1.35 V and 1.5 V; plain DDR3 parts run only at 1.5 V. A 1.5 V rail populates both; a 1.35 V-only rail excludes half the market.
- **Route every address ball your package defines, including the ones your density does not use.** Higher densities consume previously-unconnected balls for extra row address bits. This one layout decision buys you two density steps.
- **Never swap DQ bits across byte lanes.** Within a lane it is free; across lanes it breaks `DQS` and `DM` association.
- **`tRFC` scales with density, so a density change alters refresh overhead** — from about 1.4% at 1 Gb to 3.3% at 4 Gb, and double that above 85 °C.
- **There is no SPD on a discrete DRAM.** The controller's timing parameters are set at build time, which is why substitution needs a re-parameterised, re-verified memory controller.
- **The 240 Ω `ZQ` resistor and the `VREF` divider are BOM items that silently determine signal integrity.** Both get the wrong tolerance more often than they get the wrong value.

---

## What the catalogue says about DRAM availability

DRAM is the most obsolete branch of our catalogue, and the vendor concentration inverts what most BOMs assume. Measured 2026-08-11:

| Family | Prefix | Part numbers | Not active | Generation |
| --- | --- | ---: | ---: | --- |
| ISSI | `IS43` | 1,052 | **30%** | DDR2 / DDR3 / LPDDR |
| Micron DDR3L 1.35 V | `MT41K` | 278 | 61% | DDR3L |
| ISSI legacy | `IS42` | 1,030 | 62% | SDR / DDR / DDR2 |
| Micron LPDDR3/4 | `MT53` | 1,258 | 52% (19 in last-time buy) | LPDDR |
| Micron DDR2 | `MT47H` | 311 | 88% | DDR2 |
| Micron SDR | `MT48LC` | 462 | 91% | SDR |
| **Micron DDR3 1.5 V** | `MT41J` | 95 | **95%** | DDR3 |
| Micron DDR | `MT46V` | 407 | 95% | DDR |

At category level, `dram-sdram` holds 10,061 part numbers at 53% inactive, with 84 in an active last-time-buy window. The `memory` branch as a whole is 49% inactive: the worst of the eight branches, as recorded in the [IC obsolescence data study](/blog/ic-obsolescence-data-study).

The pattern is not that DDR3 is dead. DDR3 remains in production and will be for years, because industrial, networking and automotive designs consume it. The pattern is that **the specific ordering codes designed into 2012-2015 products have been pruned**, and the surviving supply sits with different vendors, different densities, different voltage variants and different speed grades. Everything below follows from that.

## Decision 1: the voltage rail

Specify a 1.5 V rail, and make the regulator capable of 1.35 V, unless a power budget forces 1.35 V-only.

The reasoning is asymmetric and often stated backwards:

| Device class | Runs at 1.5 V | Runs at 1.35 V |
| --- | --- | --- |
| DDR3 (`MT41J`, older `IS43TR`) | Yes | No |
| DDR3L (`MT41K`, current `IS43TR`) | Yes | Yes |

DDR3L is a dual-voltage specification. A DDR3L device operates at 1.35 V for the power saving and at 1.5 V for compatibility with existing designs. Plain DDR3 has no 1.35 V mode.

So a 1.5 V design can populate both classes, and a 1.35 V design can populate only DDR3L. Given that `MT41J` (DDR3, 1.5 V only) is 95% inactive, the practical value of that flexibility today is smaller than it was, but it runs the other way too: several long-life industrial DDR3 devices that remain active are 1.5 V parts, and a 1.35 V-only board cannot take them.

The cost of the flexibility is small. A point-of-load regulator with a resistor-selectable or firmware-selectable output covers both, at the price of one resistor option and a documented build variant. The cost of not having it is a respin.

Two constraints to check before assuming you can move the rail:

- **The FPGA or SoC I/O bank must support the standard you intend to drive** — SSTL15 for 1.5 V, SSTL135 for 1.35 V. A bank configured for one is not automatically capable of the other, and on some devices the choice is fixed at bitstream build.
- **`VREF` tracks the rail.** If `VREF` comes from a resistor divider, moving the rail moves `VREF` correctly by construction; if it comes from a fixed reference, it does not.

## Decision 2 — footprint headroom across densities

Route every address ball the package defines, including the ones your chosen density leaves unconnected. Higher-density devices in the same package use those balls for additional row address bits.

This is the single highest-value layout decision in this article. It is nearly free. DDR3 x16 devices share a JEDEC 96-ball FBGA outline; x8 devices share a 78-ball outline. Within an organisation, the ball map is stable and the extra address bits appear on defined positions:

| Density, x16 | Addressable rows | Row address bits | Highest address pin used |
| --- | ---: | ---: | --- |
| 1 Gb (64M x16) | 8,192 | 13 | `A12` |
| 2 Gb (128M x16) | 16,384 | 14 | `A13` |
| 4 Gb (256M x16) | 32,768 | 15 | `A14` |

A board laid out for 1 Gb that leaves `A13` and `A14` unrouted cannot take a 2 Gb or 4 Gb device, even though the part drops into the footprint mechanically. A board that routes `A14` from day one accepts all three, and the unused pins are simply driven low by the controller at the smaller density.

Three related rules:

- **Do not mix organisations in the same footprint.** x8 (78-ball) and x16 (96-ball) are different outlines. Choosing x16 for a 16-bit bus gives you one device; choosing two x8 devices gives you two footprints, two sets of `DQS` and a wider migration space. For long-life industrial designs the x16 single-device option is usually easier to keep populated, because it is the volume part.
- **DDR3 and DDR4 are not footprint-compatible.** DDR4 reorganises the ball map, adds bank groups and moves `VREFDQ` on-die. Planning a "DDR3 now, DDR4 later" footprint does not work; plan a DDR3 footprint with density headroom instead.
- **Check the extended-temperature variant exists at the densities you are planning for.** Industrial-grade ordering codes (the `IT`/`AIT` suffix families such as `MT41J128M16HA-15E AIT:D`) are a smaller subset than commercial, and they obsolete sooner because fewer designs consume them.

## Decision 3 — what you may and may not swap

Within a byte lane, `DQ` bit order is free. Across byte lanes, nothing is free. Address, bank and command pins can never be reordered.

The rule follows from what the signals do:

| Signal group | Reorderable? | Why |
| --- | --- | --- |
| `DQ` within one byte lane | **Yes** | The same controller writes and reads it; bit position is symmetric and training absorbs skew |
| `DQ` across byte lanes | **No** | Each lane has its own `DQS` strobe and `DM` mask; crossing lanes breaks the association |
| `DQS`/`DQS#` pairs | No | Must stay with their lane, and polarity must be preserved |
| `DM` | No | Masks its own lane's byte |
| `A[n:0]`, `BA[2:0]` | **No** | Decoded internally to select row and bank |
| `RAS#`, `CAS#`, `WE#`, `CS#`, `CKE`, `ODT` | No | Decoded as a command |
| `CK`/`CK#` | No | Polarity matters |

The freedom to reorder `DQ` inside a lane is what makes a clean escape from via congestion under a BGA, and it costs nothing. Teams routinely leave it on the table, then route a serpentine to preserve a bit order the device does not care about — adding length mismatch to solve a non-problem.

The two components in this group that get specified wrong:

- **The `ZQ` calibration resistor is 240 Ω, ±1%, to ground, close to the ball.** It sets the device's output driver impedance and `ODT` values through an internal calibration. A 5% resistor, or a 240 Ω part placed 20 mm away with a via, degrades every signal in the interface in a way that shows up as marginal timing rather than as an obvious fault.
- **The `VREF` divider needs 1% resistors and local decoupling**, and it must track the rail. `VREFCA` and `VREFDQ` are comparison references at half the supply; noise or offset on them eats directly into the data and command input windows.

## Decision 4 — refresh, density and temperature

Changing density changes refresh overhead, and running above 85 °C doubles it. Both are controller configuration changes, not board changes, and both are easy to miss during a substitution.

DDR3 refreshes on an average interval `tREFI` of 7.8 µs at or below 85 °C, and each refresh occupies the device for `tRFC`, which scales with density because more rows are refreshed per command:

| Density | `tRFC` (typical) | Overhead at `tREFI` = 7.8 µs | Overhead above 85 °C (`tREFI` = 3.9 µs) |
| --- | ---: | ---: | ---: |
| 1 Gb | 110 ns | 1.4% | 2.8% |
| 2 Gb | 160 ns | 2.1% | 4.1% |
| 4 Gb | 260 ns | 3.3% | 6.7% |
| 8 Gb | 350 ns | 4.5% | 9.0% |

The arithmetic, worked for the 4 Gb row:

```
Overhead = tRFC / tREFI
         = 260 ns / 7,800 ns
         = 3.33%

Above 85 °C, tREFI halves:
         = 260 ns / 3,900 ns
         = 6.67%
```

Two consequences that matter for an industrial design. First, an upward density substitution (the natural response to a 1 Gb part going obsolete) silently reduces available memory bandwidth, by 1.9 percentage points going from 1 Gb to 4 Gb, and by 3.9 points if the enclosure runs hot. If your design was already close to its bandwidth budget, the substitution is a performance regression that no functional test will catch.

Second, **the extended-temperature refresh doubling is a specification of the device, not of your ambient.** A device rated to 95 °C requires the halved `tREFI` above 85 °C junction, and the controller must be configured to provide it. Get this wrong and you have a data-retention fault that appears only in a hot enclosure, at low duty cycle, and looks exactly like a software bug.

## Decision 5: the speed grade, and why the number looks arbitrary

The speed-grade suffix is the clock period in tenths of a nanosecond, so a smaller number is a faster part. Once you can read it, a substitution search widens considerably:

| Suffix | Clock period | Clock | Data rate |
| --- | --- | --- | --- |
| `-187E` | 1.87 ns | 533 MHz | 1066 MT/s |
| `-15E` | 1.5 ns | 667 MHz | 1333 MT/s |
| `-125` | 1.25 ns | 800 MHz | 1600 MT/s |
| `-107` | 1.07 ns | 933 MHz | 1866 MT/s |
| `-093` | 0.93 ns | 1066 MHz | 2133 MT/s |

So `MT41J128M16HA-15E AIT:D` is a 1333 MT/s industrial part, and `MT41K64M16TW-107 AUT:J` is an 1866 MT/s automotive-grade one. The same convention appears on DDR2: `MT47H64M16HR-3 L:G` is a 3 ns part, 667 MT/s.

A faster grade always substitutes for a slower one, provided the controller is programmed to the slower timings. That proviso is where discrete DRAM differs fundamentally from a DIMM. It is the most under-appreciated point in this article.

## The SPD problem: why a DRAM swap is a firmware release

A DIMM carries an SPD EEPROM that publishes its timings, so a BIOS reads the module and configures itself. A discrete DRAM soldered to your board carries nothing.

Your memory controller's timing parameters — `CL`, `tRCD`, `tRP`, `tRFC`, `tFAW`, `tRRD`, refresh interval, drive strength, `ODT` values, write-leveling results — are set when the design is built, whether that is a parameterised FPGA memory-controller IP core, a device tree, or a register initialisation table in firmware.

The consequences:

1. **A vendor substitution requires re-parameterising the controller**, because `tRFC` and `tFAW` differ with density and `CL` differs with speed grade. The BOM change alone produces a board that trains successfully and corrupts data under load.
2. **It requires re-running calibration and re-verifying margin.** Write leveling and read training adapt to the device, but the pass/fail margin they achieve does not have to be the same. An eye that was comfortable with one vendor's driver impedance can be marginal with another's.
3. **It requires a documented, versioned pairing.** The bitstream or firmware image is specific to the DRAM it was parameterised for. Treat "bitstream v4.2 + `IS43TR16128C`" as the shippable unit, exactly as the [configuration flash article](/blog/fpga-boot-flash-design-longevity) argues for treating the flash image as flash-specific.

The practical implication is that a second source must be qualified while the design is live, not when the first source goes obsolete. Qualifying a second DRAM costs a controller re-parameterisation, a margin test at temperature extremes, and a build variant. Doing it at design time costs a week. Doing it in a panic, against a last-time-buy deadline, on a product already in the field, costs a great deal more, and this is the ordinary case, because 84 `dram-sdram` part numbers are in a last-time-buy window right now.

## A qualification checklist for a second DRAM source

Nine checks, each with a pass criterion. Run them before the first source needs replacing.

1. **Organisation and package match** — same x8/x16, same ball count and outline. Pass: the device fits the routed footprint including address headroom.
2. **Voltage class** — DDR3L if the rail can be 1.35 V, either class if the rail is 1.5 V. Pass: device specification includes the rail you will actually build.
3. **Density and address pins** — all row address bits the candidate needs are routed. Pass: highest address pin used by the candidate is present on the board.
4. **Speed grade at or faster than the design point.** Pass: candidate's `CL` at your operating frequency is supported by the controller configuration.
5. **`tRFC`, `tFAW`, `tRRD` re-entered into the controller configuration.** Pass: parameters are read from the candidate's datasheet, not inherited.
6. **Refresh mode for temperature** — halved `tREFI` above 85 °C if the candidate specifies it. Pass: controller applies it in the operating range you ship.
7. **Training margin measured at temperature extremes**, not at ambient. Pass: margin at hot and cold corners is documented, not just "training completed".
8. **Sustained-load data integrity test**, not a boot test. Pass: a memory test running long enough to include thousands of refresh cycles under bus contention.
9. **Availability recorded with a date.** Pass: the candidate's status and stock are checked and dated — status is a snapshot, as the [data study](/blog/ic-obsolescence-data-study) sets out.

## Where this leaves an existing board

If the layout has no address headroom, your options are same-density substitution or a respin. Same-density DDR3 supply currently sits with ISSI and with Micron's DDR3L codes; `IS43TR16128C-107MBLI-TR` is an example of an active 2 Gb x16 industrial part in our catalogue, against `MT41J128M16HA-15E AIT:D`, which is not.

If the layout has headroom, an upward density substitution is usually the cheapest path, at the cost of a controller re-parameterisation and the refresh overhead computed above.

If neither works, the aftermarket path applies exactly as it does for logic: search the base number as a prefix rather than an exact string, and search legacy vendor names as well as current ones. For the procurement side of this problem (grading, storage, moisture sensitivity and inspection of legacy DRAM) see [legacy DRAM and SDRAM sourcing](/blog/dram-sdram-legacy-sourcing) and the [memory IC sourcing guide](/blog/memory-ic-sourcing-guide). Current status by part number is on the [DRAM and SDRAM category](/category/dram-sdram) pages, and a [BOM scrub](/bom) will flag which of your memory line items are already in a last-time-buy window.

## Frequently asked questions

### Can I put a DDR3L device in a DDR3 design?

Yes — DDR3L is specified to operate at 1.5 V as well as 1.35 V, so it populates a 1.5 V board. The reverse is not true: a plain DDR3 device has no 1.35 V mode and will not work on a 1.35 V-only rail. This asymmetry is why a 1.5 V rail is the more sourceable choice for a long-life design, even though 1.35 V saves power.

### Why is Micron's DDR3 more obsolete than ISSI's?

Because the two vendors serve different ends of the market. Our measurement is `MT41J` at 95% inactive and `IS43` at 30%. High-volume DRAM vendors follow density generations and prune ordering codes aggressively once the volume moves on; specialist suppliers build a business on supporting industrial designs for longer. The lesson generalises beyond memory; it is the same mechanism that makes mid-range FPGAs outlive high-end ones.

### Do I need to re-verify the memory interface if I only change the DRAM vendor?

Yes. A discrete DRAM has no SPD, so its timings are compiled into your controller configuration, and they differ between vendors and densities. At minimum, re-enter `tRFC`, `tFAW`, `tRRD` and `CL`, re-run training, and measure margin at both temperature extremes. A board that trains successfully with inherited timings can still corrupt data under sustained load.

### How much bandwidth does refresh actually cost?

From about 1.4% at 1 Gb to 4.5% at 8 Gb, and double that above 85 °C. The calculation is `tRFC / tREFI`: at 4 Gb that is 260 ns / 7,800 ns = 3.3%, rising to 260 ns / 3,900 ns = 6.7% when the halved refresh interval applies. Substituting upward in density therefore reduces available bandwidth, which matters if the original design was near its budget.

### Can I reorder DQ pins to simplify routing?

Within a byte lane, yes, freely. Across byte lanes, no. Each lane has its own `DQS` strobe and `DM` mask, so a bit that crosses lanes loses its strobe association. Address, bank and command pins can never be reordered because they are decoded internally. Using the in-lane freedom is the correct way to relieve via congestion under a BGA.

### What is the 240 Ω resistor for and does the tolerance matter?

It is the `ZQ` calibration reference that sets the device's output driver impedance and on-die termination values, and yes — specify ±1% and place it close to the ball. A 5% part or a long connection degrades every signal in the interface simultaneously, and it presents as reduced timing margin rather than as an identifiable fault.

### Should I design a footprint that can take DDR4 later?

No — DDR3 and DDR4 are not footprint-compatible. DDR4 changes the ball map, introduces bank groups and moves the data reference on-die. A dual-generation footprint is not achievable. Spend the same effort on density headroom within DDR3 instead, which is achievable and buys two density steps.

### How do I read the speed-grade suffix?

It is the clock period in tenths of a nanosecond, so smaller is faster. `-15E` is 1.5 ns (1333 MT/s), `-125` is 1600 MT/s, `-107` is 1866 MT/s. A faster grade substitutes for a slower one as long as the controller is configured with timings the candidate supports at your operating frequency — which, on a discrete DRAM with no SPD, means editing the configuration rather than relying on auto-detection.

## Sources

Availability figures are our own measurement across 719,342 catalogue part
numbers, dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`.
Timing parameters are JEDEC-specified values, cross-checked against manufacturer
datasheets. **Confirm every timing parameter against the datasheet for the
ordering code you are fitting**; that is the point of the SPD section above.

- JEDEC **JESD79-3** (DDR3 SDRAM standard) and **JESD79-3-1** (DDR3L addendum).
  `tRFC` is density-dependent and fixed in time rather than in clock cycles:
  90 ns at 512 Mb, 110 ns at 1 Gb, 160 ns at 2 Gb, 260 ns at 4 Gb, 350 ns at
  8 Gb. `tREFI` is 7.8 µs to 85 °C and halves to 3.9 µs in the extended
  temperature range. [jedec.org](https://www.jedec.org/)
- Micron/Alliance Memory DDR3L device datasheets, for speed-grade codes and their
  data rates (`-125` = 1600 MT/s at 11-11-11, `-107` = 1866 MT/s at 13-13-13) and
  for the row/bank/column addressing per density and organisation.
  [alliancememory.com](https://www.alliancememory.com/)
- Texas Instruments, *DDR3 Design Requirements for KeyStone Devices* (SPRABI1) —
  a worked example of controller-side constraints, fly-by topology and
  write levelling. [ti.com](https://www.ti.com/lit/pdf/sprabi1)
- Your memory controller IP's user guide, for the parameter set that must be
  re-entered on a device change.
