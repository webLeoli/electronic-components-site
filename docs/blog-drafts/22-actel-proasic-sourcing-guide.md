---
title: "Actel ProASIC and IGLOO Sourcing: Flash FPGAs for Long-Life Programmes"
slug: "actel-proasic-sourcing-guide"
status: "draft"
seoTitle: "Actel ProASIC3 & IGLOO Sourcing Guide: A3P, AGL, APA Parts"
seoDesc: "Actel ProASIC3, IGLOO and ProASIC Plus sourcing: why flash FPGAs suit aerospace and long-life industrial designs, decoding A3P and AGL part numbers, and the Libero version problem."
seoKeywords: "ProASIC3 sourcing, A3P250, AGL125, Actel FPGA, IGLOO FPGA, APA450, flash FPGA, Microsemi Microchip FPGA, Libero IDE"
tags: "FPGA, Actel, Microsemi, Microchip, ProASIC3, IGLOO, flash FPGA, aerospace, legacy sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "FPGA & CPLD Sourcing"
relatedProducts: "A3PN125-Z2VQG100, A3P250-2QNG132, AGL125V5-CS196I, APA450-FG256, A3P1000L-FG256, AGLE600V2-FG256"
---

# Actel ProASIC and IGLOO Sourcing: Flash FPGAs for Long-Life Programmes

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: ProASIC3, IGLOO, Actel, flash FPGA, aerospace, long-life sourcing

---

**Actel's flash-based FPGAs occupy a niche that SRAM FPGAs cannot fill: non-volatile, instant-on, single-chip, and inherently immune to configuration upset.** That combination is why they populate aerospace, defence, medical and long-life industrial designs, and why sourcing them is a different exercise from sourcing a Spartan or a Cyclone. The parts have outlived two corporate acquisitions (Actel to Microsemi, Microsemi to Microchip), and our catalogue covers roughly 2,600 part numbers across the families. This guide covers what is available, why programme requirements complicate substitution, and the toolchain situation.


<img src="/uploads/blog/actel-proasic-sourcing-guide.webp" alt="Flash-based Actel ProASIC FPGA on a long-life aerospace control board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Flash configuration is the point.** No external configuration memory, live in microseconds, and no configuration bitstream to be corrupted by a radiation event.
- **A larger share of these parts is still active** than in comparable legacy Xilinx or Altera families — flash FPGAs have long production lives by design.
- **Three brands, one lineage.** Parts appear as Actel, Microsemi or Microchip depending on when they were made; the die is the same.
- **Programme requirements often forbid substitution outright.** In qualified aerospace and defence builds the part number is frozen by the approval, not by engineering preference.
- **Libero has a hard split**: Libero IDE for the oldest devices, Libero SoC for ProASIC3 onward. The version is tied to the device generation.
- Counterfeit exposure is **high in relative terms** because unit values are high and demand is inelastic.

---

## Why flash FPGAs are a separate category

Most FPGAs are SRAM-based: they hold their configuration in volatile memory and reload it from external flash at every power-up. Actel's ProASIC and IGLOO families store configuration in on-chip flash instead. Four consequences follow, and each maps to a reason these parts get designed in:

| Property | Consequence | Why it matters |
| --- | --- | --- |
| Non-volatile config | No external configuration memory | One fewer part, one fewer lifecycle risk, smaller BOM |
| Instant-on | Functional in microseconds | Can perform power sequencing and system supervision |
| No bitstream load | Nothing to intercept or corrupt at boot | Design security; no configuration readback path |
| Immune to config upset | A radiation event cannot corrupt stored configuration | Aerospace and high-reliability use |

That last property is the reason the family has a permanent constituency. An SRAM FPGA's configuration cells are susceptible to single-event upsets; a flash FPGA's are not. For space, avionics and nuclear-adjacent instrumentation, this is not a preference but a requirement, which is also why the RTAX radiation-tolerant line exists alongside the commercial families.

The trade is capacity and speed: flash FPGAs top out at far lower densities and clock rates than contemporaneous SRAM parts. Nobody chooses ProASIC3 for signal-processing throughput.

## The families and where they stand

| Family | Prefix | Introduced | Notes | Status |
| --- | --- | --- | --- | --- |
| ProASIC Plus | APA | Early 2000s | First widely used flash FPGA line | Mature, some active |
| ProASIC3 / 3E / 3L / nano | A3P, A3PE, A3PN | 2005 onward | The volume family | Mature, much still active |
| IGLOO / IGLOOe / IGLOO nano | AGL, AGLE, AGLN | 2008 onward | Low-power derivative of ProASIC3 | Mature, much still active |
| RTAX / RTSX | RTAX, RTSX | — | Radiation-tolerant, antifuse | Specialist, long life |
| SmartFusion / SmartFusion2 | A2F, M2S | 2010 onward | Flash FPGA + ARM core | Current |

Representative parts we hold include `A3PN125-Z2VQG100` (ProASIC3 nano, active), `A3P250-2QNG132` (obsolete), `AGL125V5-CS196I` and `AGLE600V2-FG256` (IGLOO, active), `APA450-FG256` and `APA750-FGG896I` (ProASIC Plus, active), and `A3P1000L-FG256` (low-power ProASIC3, active).

Note how many of these are still active. This is the structural difference from the Xilinx and Altera legacy families: flash FPGAs are designed into programmes with twenty-year horizons, and the vendor's business model reflects that. It changes the sourcing conversation; the first question is usually availability and lead time, not whether the part exists at all.

## Three brand names, one part

Actel was acquired by Microsemi in 2010; Microsemi was acquired by Microchip in 2018. The same die therefore appears in the market marked Actel, Microsemi or Microchip depending on when it was manufactured.

Practical implications:

- **Do not treat differently branded parts as different devices.** An Actel-marked A3P250 and a Microsemi-marked A3P250 of the same suffix are the same part.
- **But do treat the marking as provenance information.** An unexpectedly recent date code on an Actel-marked part is a flag worth investigating, since Actel branding ceased years ago.
- **Documentation moved.** Datasheets and application notes have migrated across two corporate websites; older revisions can be hard to locate, and archiving the datasheet revision that a design was qualified against is worthwhile.

## Decoding the part numbers

ProASIC3:

```
A3P250 - 2  QN G 132
│        │  │  │ └── Pin count: 132
│        │  │  └──── G = RoHS / lead-free
│        │  └─────── Package: QN = QFN; also VQ = VQFP, FG = FBGA, CS = chip-scale
│        └────────── Speed grade: STD, -1, -2 (higher number = faster)
└─────────────────── Device: ProASIC3, 250k system gates
```

IGLOO:

```
AGL125 V5 - CS196 I
│      │    │     └── Temperature: I = industrial, C = commercial
│      │    └──────── Package: CS196 = 196-ball chip-scale BGA
│      └───────────── Core voltage option (V2 / V5 denote supported core supply)
└──────────────────── IGLOO, 125k system gates
```

Two family-specific points:

- **Capacity is quoted in "system gates", not LUTs.** This is a marketing-era unit and is not comparable to a logic-cell or LE count from another vendor. For real comparison, look at the tile or VersaTile count in the datasheet.
- **The voltage option in IGLOO part numbers is significant.** V2 and V5 variants support different core supply arrangements, and they are not interchangeable.

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Family | ProASIC3, IGLOO mainstream | ProASIC Plus large densities, RTAX |
| Density | 125k–600k gates | Largest devices in each family |
| Package | VQFP, QFN, CS196 | Large FBGA (FGG896 and similar) |
| Speed | STD, -1 | -2 |
| Temperature | Commercial, industrial | Military / extended, screened parts |

## Programme requirements change the rules

In aerospace, defence and medical builds, the part number is frequently frozen by an approval rather than by engineering judgement. This is the biggest practical difference between sourcing these parts and sourcing commercial FPGAs.

What that means in practice:

- **Substitution may be prohibited outright** without requalification of the assembly: a process measured in months and often costing more than any conceivable inventory buy.
- **Date-code and lot-traceability requirements** are contractual, not advisory. A part without full traceability may be unusable regardless of whether it works.
- **Screened and up-screened variants** are separate part numbers with their own supply chains and much longer lead times.
- **Counterfeit consequences are disproportionate.** In a commercial product a counterfeit causes a field failure; in a qualified programme it can invalidate an entire build's documentation.

For these reasons the correct first move for a programme part is almost always to source the exact original with full traceability, and to plan a last-time-buy sized against the programme's remaining life rather than the next production run.

## Toolchain

| Tool | Covers |
| --- | --- |
| Libero IDE (v9.x, legacy) | ProASIC Plus (APA), older Actel devices |
| Libero SoC | ProASIC3, IGLOO, SmartFusion, SmartFusion2 and later |

The split is by device generation, and Libero SoC does not open a Libero IDE project for an APA device. As elsewhere, the durable approach is to archive a virtual machine containing the correct tool version, the licence configuration, the project and the generated programming file.

Two Actel-specific notes:

- **Programming hardware matters.** These devices are programmed with FlashPro units, and older FlashPro generations pair with older software. Confirm that the programmer, its driver and the tool version form a working set before you need to build.
- **Security settings can be one-way.** Flash FPGAs support permanent lock and security options; a device locked during production may not be reprogrammable, which affects rework and failure analysis.

## Counterfeit exposure

**Relatively high, for structural reasons**: unit values are substantial, demand is inelastic because programmes cannot easily substitute, and lead times encourage buyers to accept unfamiliar sources.

Risk concentrates on:

- **Large FBGA parts** such as `FGG896` devices, where value is highest and the package hides evidence.
- **Screened and military-grade variants**, where the premium over the commercial equivalent creates an obvious remarking incentive: a commercial part remarked to an industrial or screened grade.
- **Any part where the branding and date code are inconsistent**, given the Actel/Microsemi/Microchip transition timeline.

Mitigations: full documented traceability, X-ray on BGA lots, decapsulation sampling proportionate to lot value, and JTAG IDCODE verification on receipt. For programme parts, the documentation trail is as important as the electrical verification. See our [quality process](/quality) and [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide).

## Replacement paths

| Situation | Best path |
| --- | --- |
| Qualified programme, substitution prohibited | Source original with full traceability; size a last-time-buy to programme life |
| Commercial industrial design, part active | Ordinary procurement — check suffix availability |
| ProASIC Plus (APA) obsolete variant | Different package/speed of the same density, or ProASIC3 as a port |
| ProASIC3 → IGLOO | Related architectures; still a port, but the closest move available |
| Need more capacity | SmartFusion2 (M2S) keeps flash configuration at higher density |
| Cross-vendor | Rarely viable — nothing else combines flash config, instant-on and this reliability pedigree |

The last row is the crux. For a commercial glue-logic role, a Lattice MachXO2 is a reasonable alternative — see [Lattice MachXO and ECP sourcing](/blog/lattice-machxo-ecp-sourcing). For a radiation-tolerant or qualified role, there is often no alternative at all, and the sourcing plan has to reflect that.

## FAQ

### What is a flash FPGA and how is it different from an SRAM FPGA?

A flash FPGA stores its configuration in on-chip non-volatile flash memory, so it retains its programming without power and is functional within microseconds of power-up. An SRAM FPGA holds configuration in volatile memory and must reload it from an external flash device at every power-up, taking milliseconds or longer. The flash approach removes the external configuration memory from the bill of materials, enables the device to perform power sequencing, and makes the configuration immune to radiation-induced upset.

### Are Actel ProASIC3 and IGLOO parts still available?

A substantial proportion remain active, which distinguishes them from comparable legacy Xilinx and Altera families. Flash FPGAs are designed into programmes with very long horizons and the vendor's production planning reflects that. Individual orderable variants do reach end-of-life independently, so availability must still be checked at the full part-number level including density, speed grade, package and temperature grade.

### Why are Actel parts branded Actel, Microsemi and Microchip?

Actel was acquired by Microsemi in 2010, and Microsemi was acquired by Microchip in 2018. The same die therefore appears in the market under all three brands depending on manufacturing date. Parts with the same suffix are the same device regardless of branding, but the brand is useful provenance information: an Actel-marked part carrying a recent date code is inconsistent and worth investigating, since that branding ceased years ago.

### How do I read a ProASIC3 part number?

Take A3P250-2QNG132. A3P250 identifies a ProASIC3 device of 250,000 system gates, -2 is the speed grade where higher numbers are faster and STD is the base grade, QN denotes a QFN package, G indicates lead-free construction, and 132 is the pin count. Note that capacity is quoted in system gates, a marketing-era unit that is not comparable to logic-cell counts from other vendors; compare VersaTile counts in the datasheet instead.

### Can I substitute a different FPGA for a ProASIC3 in a qualified programme?

Usually not without requalifying the assembly, which is typically a months-long process costing more than any realistic inventory purchase. In aerospace, defence and medical builds the part number is frozen by the approval rather than by engineering preference, and date-code and lot-traceability requirements are contractual. The standard approach is to source the exact original with full traceability and size a last-time-buy against the programme's remaining life.

### Which Libero version do I need?

It depends on the device generation. Libero IDE, the 9.x series, covers ProASIC Plus (APA prefix) and older Actel devices. Libero SoC covers ProASIC3, IGLOO, SmartFusion and SmartFusion2 onward. The two are not interchangeable and Libero SoC will not open a legacy Libero IDE project. Also confirm that your FlashPro programmer generation, its driver and the tool version work together before you need to rebuild.

### Why are flash FPGAs used in aerospace applications?

Because their configuration cannot be corrupted by a radiation-induced single-event upset. An SRAM FPGA holds its configuration in volatile cells that a high-energy particle can flip, potentially altering the circuit itself; a flash FPGA's configuration is stored in non-volatile cells that are not susceptible in the same way. Combined with instant-on operation and the absence of an external configuration device, this makes them suitable for space, avionics and high-reliability instrumentation, with the RTAX line addressing the most demanding radiation environments.

### Are counterfeit ProASIC and IGLOO parts a significant risk?

Yes, disproportionately so. Unit values are high, demand is inelastic because programmes cannot easily substitute, and long lead times push buyers toward unfamiliar sources. Risk concentrates on large FBGA devices where value is highest and the package conceals evidence, and on screened or military-grade variants where the premium over commercial equivalents creates a strong remarking incentive. For programme parts the documentation trail matters as much as electrical verification, since a traceability gap can invalidate a build regardless of whether the part functions.

## Related reading

The general selection framework is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the equivalent legacy situations in other vendors' ranges, see [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide), [sourcing Altera Cyclone I to IV](/blog/sourcing-altera-cyclone-legacy), [MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths) and [Lattice MachXO and ECP sourcing](/blog/lattice-machxo-ecp-sourcing).

Send the full orderable part number together with any traceability or screening requirements, and we will come back with real availability, date codes and documentation across authorised aftermarket and specialty channels.

[**Submit an RFQ**](/rfq) | [**Actel / ProASIC sourcing**](/fpga-sourcing/microchip-actel-proasic) | [**Upload a BOM**](/bom)
