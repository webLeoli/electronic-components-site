---
title: "Xilinx 7 Series and Zynq-7000 Sourcing: Current Parts, Real Constraints"
slug: "xilinx-7-series-zynq-sourcing"
status: "draft"
seoTitle: "Xilinx 7 Series & Zynq-7000 Sourcing: Artix, Kintex, Virtex"
seoDesc: "Artix-7, Kintex-7, Virtex-7 and Zynq-7000 sourcing: decoding XC7A/XC7K/XC7Z part numbers, the -1/-2/-3 and -1L/-2L split, why some variants are already obsolete, and Zynq boot-mode constraints."
seoKeywords: "Artix-7 sourcing, XC7A35T, Kintex-7, XC7K410T, Zynq-7000, XC7Z020, 7 series speed grade, Xilinx 7 series obsolete, XC7A100T availability"
tags: "FPGA, SoC, Xilinx, AMD, Artix-7, Kintex-7, Virtex-7, Zynq-7000, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC7A35T-1CPG236C, XC7A15T-2FGG484C, XC7A75T-1FGG484C, XC7K420T-1FFG901I, XC7Z020-L1CLG400I, XC7K410T-1FFV900I"
---

# Xilinx 7 Series and Zynq-7000 Sourcing: Current Parts, Real Constraints

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: Artix-7, Kintex-7, Virtex-7, Zynq-7000, speed grades, sourcing

---

**The 7 Series is the current mainstream Xilinx family and the migration target for most legacy designs, but "current" does not mean every variant is available.** Individual orderable parts within the family are already discontinued while their siblings remain in full production, and the family's speed-grade and power-variant structure creates more distinct line items than most teams realise. We cover roughly 660 7 Series and Zynq part numbers, a mix of active and obsolete. This guide covers what varies, what is already going, and the Zynq-specific constraints that catch people migrating from a pure FPGA.


<img src="/uploads/blog/xilinx-7-series-zynq-sourcing.webp" alt="7 Series FPGA and Zynq-class SoC packages on current evaluation boards" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **"7 Series is current" is not a sourcing answer.** `XC7K410T-1FFV900I` is obsolete while `XC7K420T-1FFG901I` is active — same family, adjacent devices.
- **The speed-grade structure is denser than it looks**: -1, -2, -3 plus low-power -1L and -2L, and the L variants run at reduced core voltage. They are not interchangeable.
- **Zynq is an SoC, not an FPGA.** Boot mode, DDR pinout and the processing-system supply arrangement constrain the board in ways a pure FPGA does not.
- **Artix-7 is where most legacy migrations land**, which makes it the family to check availability on before committing to a migration plan.
- **Vivado, not ISE**, and Vivado has its own version-support cliffs for the oldest 7 Series parts and the older Zynq silicon revisions.
- The largest Virtex-7 devices are **effectively specialty items** with long lead times and prices to match.

---

## Four families under one name

The 7 Series is a single architecture scaled across four positioning tiers, unlike the legacy families where each generation was distinct.

| Family | Prefix | Position | Transceivers |
| --- | --- | --- | --- |
| Artix-7 | XC7A | Cost-optimised, high volume | GTP on some devices |
| Kintex-7 | XC7K | Price-performance midrange | GTX |
| Virtex-7 | XC7V | Highest performance | GTX / GTH / GTZ |
| Zynq-7000 | XC7Z | Artix or Kintex fabric **+ dual-core ARM Cortex-A9** | Depends on device |

Representative parts we hold: `XC7A35T-1CPG236C`, `XC7A15T-2FGG484C`, `XC7A75T-1FGG484C` (Artix), `XC7K420T-1FFG901I` (Kintex, active), `XC7K410T-1FFV900I` (Kintex, **obsolete**), `XC7Z020-L1CLG400I` (Zynq, low-power variant), `XC7VX1140T-2FLG1928C` and `XC7VH580T-2FLG1931C` (Virtex-7, the latter obsolete).

Note the two obsolete entries. A Kintex-7 device and a Virtex-7 device are already discontinued while the family as a whole is current. This is the single most important practical point about 7 Series sourcing: the family's status tells you nothing about your part.

## Decoding the part number

```
XC7A35T - 1  CPG236  C
│         │  │       └── Temperature: C = commercial, I = industrial, Q = automotive
│         │  └────────── Package: CPG236 = 236-ball chip-scale BGA
│         └───────────── Speed grade: -1, -2, -3 (higher = faster); -1L, -2L = low power
└─────────────────────── Device: Artix-7, ~33k logic cells ("T" = with transceivers/features)
```

Zynq adds a wrinkle:

```
XC7Z020 - L1  CLG400  I
│         │   │       └── Temperature grade
│         │   └───────── Package
│         └───────────── L1 = low-power variant at speed grade 1
└─────────────────────── Zynq-7000, Artix-class fabric + dual Cortex-A9
```

### The speed-grade and low-power split matters more than usual

The `L` variants (`-1L`, `-2L`) operate at a **reduced core voltage** — typically 0.9 V rather than 1.0 V — to cut static power. Consequences:

- **They are not drop-in for the standard variants.** The core supply rail differs, so substituting an `-1L` for a `-1` on a board designed for 1.0 V, or vice versa, is a power-supply change.
- **Performance differs.** An `-1L` is not simply a `-1` that uses less power; timing closure must be re-verified.
- **Availability differs independently.** L variants are lower volume and can be harder to find.

Combined with three standard speed grades, several package options and three temperature grades, a single device such as `XC7A35T` fans out into dozens of orderable part numbers with independent stock.

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Family | Artix-7, Kintex-7 mainstream | Virtex-7 large devices, VH/VX variants |
| Density | A15T–A100T, K160T–K420T | The largest in each family |
| Speed | -1, -2 | -3, and both L variants |
| Package | CPG236, CSG324, FGG484 | Very large FLG/FFG BGAs |
| Temperature | Commercial | Industrial, automotive (Q) |

## Zynq: an SoC brings board-level constraints

Zynq-7000 pairs 7 Series programmable logic with a hard dual-core ARM Cortex-A9 processing system. That processing system is not optional; it is a processor with its own supplies, its own DDR interface and its own boot requirements.

Four things that constrain a Zynq board and do not apply to a pure FPGA:

Boot mode pins. The processing system boots from QSPI, SD, NAND, NOR or JTAG according to strapping pins sampled at reset. These must be correct and stable at power-up: a floating strap produces a device that boots unpredictably or not at all.

DDR interface pinout is fixed. The processing system's memory controller uses dedicated pins in a defined arrangement. Unlike fabric I/O, you cannot reassign them, so the DDR routing is largely determined by the device and package before layout begins.

Supply sequencing. The processing system and programmable logic have separate supply domains with a required power-up order. Getting it wrong produces boot failures that look like software problems.

MIO versus EMIO. Peripherals can be routed to dedicated multiplexed I/O pins or through the fabric. Which peripherals are available on MIO depends on the package, so a package change can force peripherals through the fabric with different timing and pin-count implications.

For teams migrating from a pure FPGA design, the practical consequence is that **Zynq is a bigger jump than the logic-cell count suggests** — it brings an embedded software stack, a boot flow and a memory subsystem along with the fabric. The general framework for that class of change is in [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide), which covers the same kinds of peripheral and boot-configuration hazards.

## Toolchain

Vivado, not ISE. The 7 Series is the first Xilinx generation Vivado targets, and ISE support ended with it — early 7 Series devices were supported by both ISE 14.7 and early Vivado, which occasionally causes confusion in older projects.

Vivado has its own version constraints:

- **Older Vivado versions do not know about later silicon revisions**, particularly for Zynq. A device stepping newer than your tool may not be recognised.
- **Very old 7 Series devices have been deprecated from recent Vivado releases.** The tool is not a permanent superset.
- **The embedded stack matters for Zynq.** Vitis (formerly SDK), the board support package and the first-stage bootloader are part of the archive, not optional extras.
- **Device support packs.** Some devices require an additional install; confirm before assuming a fresh Vivado installation covers your part.

The archival advice is the same as for the legacy families, and it applies even to current parts: record the exact tool version, archive it with the project, and archive the generated bitstream rather than assuming a future rebuild will be byte-identical.

## Where 7 Series parts get scarce

Three patterns account for most 7 Series sourcing difficulty:

Allocation on mainstream Artix and Kintex. These are high-volume production parts, and when semiconductor supply tightens they go to allocation with long lead times. This is a scheduling problem rather than an obsolescence one, but it has the same effect on a build.

Quiet discontinuation of specific variants. As seen with `XC7K410T-1FFV900I`, individual orderable parts are retired while the family continues, often the less popular package or speed combinations. A design specified on an unusual variant carries this risk without anyone noticing until reorder.

The very large Virtex-7 devices. Parts like `XC7VX1140T-2FLG1928C` are specialty items: low volume, very high value, long lead times. Sourcing them resembles legacy Virtex sourcing more than mainstream procurement, including the counterfeit considerations in [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing).

## Counterfeit exposure

Lower than for legacy Virtex, but real, and rising with device value.

- **Mainstream Artix parts** are moderate value and widely available, so counterfeit pressure is limited.
- **Large Kintex and Virtex-7 devices** carry high enough value to attract the same treatment as legacy Virtex: density and speed-grade remarking, reballing, blacktopping.
- **Allocation periods increase risk** across the board, because buyers under schedule pressure accept unfamiliar sources: the same dynamic that makes shortages and counterfeiting correlate.

A JTAG IDCODE read remains the highest-value receipt check and confirms both device and, on 7 Series, the silicon revision. For high-value devices, escalate as described in [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing) and [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Practical sourcing guidance

| # | Action | Why |
| --- | --- | --- |
| 1 | Quote the full orderable part number, including any L suffix | Dozens of variants per device, independent stock |
| 2 | State which fields can flex (speed, temperature, package) | Widens the pool during allocation |
| 3 | Check lifecycle at part level, not family level | Individual variants are already obsolete |
| 4 | Prefer mainstream variants at design time | An unusual package/speed combination is a future sourcing risk |
| 5 | For Zynq, confirm silicon revision against tool version | Newer steppings need newer Vivado |
| 6 | JTAG IDCODE on receipt | Confirms device and revision |
| 7 | For large Virtex-7, apply legacy-grade inspection | Value justifies it |

Point 4 deserves emphasis because it is the only one that is free: choosing a common package and a mid speed grade at design time costs nothing and materially reduces sourcing risk for the product's whole life. The reasoning is set out in [how to choose the right FPGA](/blog/how-to-choose-right-fpga).

## FAQ

### Is the Xilinx 7 Series still in production?

Yes, the 7 Series remains AMD's mainstream FPGA family and is the usual migration target for legacy designs. However, individual orderable part numbers within the family have been discontinued while their siblings remain active — for example XC7K410T-1FFV900I is obsolete while XC7K420T-1FFG901I is active. Lifecycle status must therefore be checked at the full part-number level including density, speed grade, package and temperature grade.

### What is the difference between Artix-7, Kintex-7 and Virtex-7?

They are positioning tiers of one architecture. Artix-7 is cost-optimised for high-volume, power-sensitive designs and carries GTP transceivers on some devices. Kintex-7 targets price-performance in the midrange with GTX transceivers. Virtex-7 provides the highest logic capacity and fastest transceivers, including GTH and GTZ, at correspondingly high cost. Zynq-7000 combines Artix- or Kintex-class fabric with a hard dual-core ARM Cortex-A9 processing system.

### What does the L suffix mean in a Xilinx 7 Series part number?

The L variants, written -1L and -2L, are low-power devices that operate at a reduced core voltage — typically 0.9 V rather than 1.0 V. They are not drop-in replacements for the standard grades, because the core supply rail differs and timing performance is not identical. They also have independent availability and are generally lower volume, so an L variant can be harder to source than its standard counterpart.

### Is Zynq-7000 harder to design in than a plain FPGA?

It brings constraints a pure FPGA does not. The hard processing system boots from a source selected by strapping pins sampled at reset, its DDR memory controller uses fixed dedicated pins that cannot be reassigned, the processing system and programmable logic have separate supply domains requiring a defined power-up order, and which peripherals are available on dedicated MIO pins depends on the package. It also brings an embedded software stack (bootloader, board support package and operating system) into the project.

### Do I use ISE or Vivado for 7 Series?

Vivado. The 7 Series is the first generation Vivado targets and is where ISE support ended, though the earliest 7 Series devices were briefly supported by both, which can cause confusion in older projects. Be aware that Vivado has its own version constraints: older releases do not recognise newer silicon revisions, particularly for Zynq, and some early 7 Series devices have been deprecated from recent releases.

### Which 7 Series parts are hardest to source?

The largest Virtex-7 devices, such as the VX and VH variants, are specialty items with low volume, very high value and long lead times. Beyond those, the fastest -3 speed grade, both low-power L variants, industrial and automotive temperature grades, and unusual package combinations are all harder than mainstream commercial parts. During semiconductor allocation periods, even high-volume Artix and Kintex devices can carry long lead times.

### How do I reduce 7 Series sourcing risk at design time?

Choose a common package and a mid speed grade rather than the fastest, and avoid unusual package or temperature combinations unless the application genuinely requires them. This costs nothing at design time and materially widens the sourcing pool for the product's entire life, because unusual variants are the ones quietly discontinued while the family continues. Design to close timing at a slower grade so that a faster part is a fallback rather than a requirement.

### Are counterfeit 7 Series FPGAs a concern?

Less so than for legacy Virtex, but the risk scales with device value. Mainstream Artix parts are moderate value and widely available, limiting counterfeit pressure. Large Kintex and Virtex-7 devices carry enough value to attract density remarking, speed-grade remarking and reballing. Risk also rises during allocation periods, when schedule pressure pushes buyers toward unfamiliar sources. A JTAG IDCODE read on receipt confirms both device identity and silicon revision.

## Related reading

The selection framework (hard blocks and I/O before logic cells, speed grade as a sourcing decision) is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the legacy families that migrate here, see [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide), [sourcing Xilinx Spartan-3](/blog/sourcing-xilinx-spartan-3-legacy) and [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing). For the embedded-software side of a Zynq migration, [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide) covers the analogous peripheral and boot hazards.

Send the full orderable part number with the fields you can flex, and we will come back with real availability and lead times — including on variants that have quietly gone end-of-life while the family continues.

[**Submit an RFQ**](/rfq) | [**7 Series sourcing**](/fpga-sourcing/xilinx-7-series) | [**Upload a BOM**](/bom)
