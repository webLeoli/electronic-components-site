---
title: "Lattice MachXO and ECP Sourcing: Bridging Logic That Outlives the Board"
slug: "lattice-machxo-ecp-sourcing"
status: "draft"
seoTitle: "Lattice MachXO, MachXO2/XO3 and ECP Sourcing Guide"
seoDesc: "Lattice MachXO, MachXO2, MachXO3, ECP and ispMACH sourcing: decoding LCMXO and LFE part numbers, instant-on versus SRAM configuration, generation gaps, and realistic migration paths."
seoKeywords: "MachXO sourcing, LCMXO, MachXO2 replacement, LFE5U, ECP5, ispMACH M4A, Lattice CPLD obsolete, LatticeDiamond ispLEVER"
tags: "FPGA, CPLD, Lattice, MachXO, MachXO2, ECP5, ispMACH, legacy sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "FPGA & CPLD Sourcing"
relatedProducts: "LFE5U-85F-8BG554C, LCMXO1200C-3T100I, LCMXO640C-3F256C, LFEC1E-3T144C, M4A3-64/64-10VC, LFE3-70E-7FN1156I"
---

# Lattice MachXO and ECP Sourcing: Bridging Logic That Outlives the Board

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: MachXO, MachXO2, ECP5, ispMACH, Lattice legacy sourcing

---

**Lattice devices are the most numerous programmable-logic parts in our catalogue (around 2,800 part numbers) and most people never think about them until one goes missing.** MachXO, ispMACH and the ECP families are bridging and control logic: the device that translates a bus, sequences the supplies, or glues an old interface to a new processor. They are rarely the headline component, which is exactly why their obsolescence tends to be discovered late. This guide covers what is available across the generations, the instant-on distinction that determines whether a substitution is even possible, and the toolchain situation.


<img src="/uploads/blog/lattice-machxo-ecp-sourcing.webp" alt="Lattice-style bridging FPGA connecting interfaces on an industrial board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Around 2,800 Lattice part numbers**, the largest programmable-logic holding we have, and heavily weighted toward obsolete devices.
- **The MachXO generations are not interchangeable.** MachXO (LCMXO), MachXO2 (LCMXO2) and MachXO3 (LCMXO3) differ in process, configuration and I/O.
- **Instant-on is the reason these parts exist.** MachXO is flash-configured and live in microseconds; ECP is SRAM-based and needs external configuration memory. Substituting across that line changes board behaviour.
- **ispMACH 4000 (M4A) is a 1990s-era CPLD line, effectively all obsolete**, and is the Lattice equivalent of MAX 7000.
- **Toolchain splits at a hard line**: ispLEVER for the oldest devices, Diamond for the rest. Radiant covers only the newest parts.
- Lattice parts are **low-to-mid unit value** — counterfeit pressure is moderate, concentrated on the larger ECP BGAs.

---

## Four product lines that get conflated

"Lattice" in a BOM could mean any of four quite different things, and the sourcing exercise differs for each.

| Line | Prefix | Type | Configuration | Position today |
| --- | --- | --- | --- | --- |
| ispMACH 4000 | M4A | CPLD | Flash, instant-on | Obsolete |
| MachXO | LCMXO | CPLD/FPGA hybrid | Flash, instant-on | Largely obsolete |
| MachXO2 / XO3 | LCMXO2 / LCMXO3 | Low-power FPGA | Flash, instant-on | Mature, obtainable |
| EC / ECP / ECP2 / ECP3 / ECP5 | LFEC / LFE2 / LFE3 / LFE5 | SRAM FPGA | External config memory | ECP5 active; earlier obsolete |

Representative parts we see: `LFE5U-85F-8BG554C` (ECP5, active), `LCMXO1200C-3T100I` and `LCMXO640C-3F256C` (first-generation MachXO, obsolete), `LFEC1E-3T144C` (early EC, obsolete), `M4A3-64/64-10VC` (ispMACH, obsolete), and `LFE3-70E-7FN1156I` (ECP3, obsolete, and notably supplied through Rochester Electronics, the authorised aftermarket route).

That last one is worth dwelling on: an obsolete ECP3 available through authorised aftermarket is a Tier 1 substitution in the [analog second-sourcing framework](/blog/analog-power-second-sourcing-guide) sense — same die, same process, continued production. It is the best possible outcome for a legacy sourcing problem.

## The instant-on line

This is the single most important distinction in the Lattice range, and it determines whether a cross-family substitution is possible at all.

Flash-configured (ispMACH, MachXO, MachXO2, MachXO3): configuration lives on-chip. The device is functional within microseconds of power-up. No external configuration memory, no boot delay, no extra BOM line.

SRAM-configured (EC, ECP, ECP2, ECP3, ECP5): configuration is loaded at power-up from an external SPI flash. Boot takes milliseconds to hundreds of milliseconds depending on device size and bus width.

Substituting an SRAM part where a flash part was used breaks anything that depended on the device being alive early — power sequencing, reset control, boot-mode strapping. It also adds a configuration flash to the BOM, which is a new part with its own lifecycle, and a new failure mode. The reverse direction is usually safe functionally but the flash parts top out at much lower densities.

Check before considering any cross-family move: does anything on the board depend on this device being functional before the main supplies have finished sequencing?

## Decoding the part numbers

The two prefixes follow different schemes.

MachXO:

```
LCMXO1200 C - 3 T100 I
│         │   │ │    └── Temperature: C = commercial, I = industrial
│         │   │ └─────── Package: T100 = 100-pin TQFP; F = fpBGA, M = csBGA
│         │   └───────── Speed grade: -3 (fastest), -4, -5 … HIGHER = SLOWER here
│         └───────────── Core voltage variant: C = 2.5/3.3 V, E = 1.2 V
└─────────────────────── Device: MachXO, 1200 LUTs
```

ECP family:

```
LFE5U - 85 F - 8 BG554 C
│       │  │   │ │     └── Temperature grade
│       │  │   │ └─────── Package: BG554 = 554-ball BGA
│       │  │   └───────── Speed grade: 6, 7, 8 — HIGHER = FASTER on ECP5
│       │  └───────────── F = variant designator
│       └──────────────── 85k LUTs
└──────────────────────── ECP5 U (no SERDES; UM = with SERDES)
```

The speed-grade direction reverses between families, which is a genuine trap: on MachXO a `-3` is the fastest, while on ECP5 an `-8` is the fastest. Getting this backwards when specifying a replacement either over-specifies (narrowing availability and raising price) or under-specifies (timing does not close).

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Family | MachXO2/XO3, ECP5 | ispMACH M4A, MachXO 1st gen, ECP/ECP2 |
| Density | Small and mid | Largest in each family |
| Package | TQFP, small csBGA | Large fpBGA (FN1156, BG554) |
| Speed | Middle grades | Fastest grade in family |
| Temperature | Commercial | Industrial |

## Generation gaps within MachXO

MachXO, MachXO2 and MachXO3 share a marketing name and very little else. They were built on different processes with different architectures, and the migration between them is a port, not a recompile:

- **Different configuration architecture.** MachXO2 introduced user flash memory and a different configuration and update mechanism.
- **Different I/O capabilities and banking.** Voltage support and differential I/O differ.
- **Different hard blocks.** MachXO2 and XO3 add hardened I²C, SPI and timer functions that the original MachXO lacks — convenient, but if firmware or logic was written to implement those in fabric, the port does not automatically simplify.
- **Different packages.** Pin-out does not carry across.

For a design on first-generation MachXO, the practical choices are the same three as anywhere else: buy the original, move to MachXO2/XO3 as a proper port, or leave it alone.

## Toolchain: three tools, hard boundaries

| Tool | Covers |
| --- | --- |
| ispLEVER (and ispLEVER Classic) | ispMACH 4000, older EC/ECP, first-generation MachXO |
| Lattice Diamond | MachXO2, MachXO3, ECP2/ECP3/ECP5, and most of the mid-range |
| Lattice Radiant | Newest families only — does **not** cover the legacy range |

The boundary that catches people is Radiant: it is the current tool and looks like the obvious choice, but it does not open a Diamond project for an older device. Sustaining a MachXO2 or ECP5 design means keeping Diamond, and sustaining an ispMACH design means keeping ispLEVER Classic.

The archival discipline is the same as for [Spartan-6](/blog/sourcing-xilinx-spartan-6-guide) and [Cyclone](/blog/sourcing-altera-cyclone-legacy): a virtual machine image with the operating system, the tool version, the licence configuration and the project files, plus the generated bitstream or programming file stored alongside the source.

One Lattice-specific note: licences for these tools have historically been node-locked to a network interface MAC address. Archiving a virtual machine means also recording how the licence was tied, or the archived image will not build when it is finally needed.

## Counterfeit and quality risk

Moderate, and concentrated in the larger BGA parts. The TQFP and small csBGA devices that make up most MachXO and ispMACH volume are low value and easy to inspect visually.

Where care is needed:

- **Large ECP fpBGA parts** (`FN1156`, `BG554` and similar) carry meaningful unit value and hide their evidence. X-ray and sample decapsulation are proportionate on lots of any size.
- **Speed-grade remarking**, made more likely by the reversed conventions between families: a mismarked part is harder for an inspector to spot when the direction is not intuitive.
- **Recycled parts** from scrapped telecom and networking equipment, where these devices are common.

A JTAG IDCODE read confirms device identity quickly and is the highest-value receipt check. Our [quality process](/quality) and [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) cover the rest.

## Replacement paths

| Situation | Best path |
| --- | --- |
| ispMACH M4A, sustaining build | Buy original through specialty/aftermarket |
| First-gen MachXO, stable design | Buy original; port to MachXO2/XO3 only if the board is changing anyway |
| MachXO2/XO3 | Generally still obtainable — check the exact suffix |
| ECP/ECP2/ECP3 obsolete | Check authorised aftermarket first (Rochester carries some ECP3) |
| ECP5 | Active; ordinary procurement |
| Cross-vendor move | Full port. Altera MAX II/V and Microchip IGLOO occupy adjacent niches |

For a cross-vendor evaluation, [MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths) covers the Altera side of the same problem, and the general framework is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga).

## FAQ

### What is the difference between MachXO, MachXO2 and MachXO3?

They share a name but were built on different processes with different architectures. MachXO2 introduced a different configuration mechanism and user flash memory, and both MachXO2 and MachXO3 add hardened I²C, SPI and timer blocks that the original MachXO lacks. I/O banking, voltage support and packages all differ, so moving between generations is a design port rather than a recompile: the pin-out does not carry across.

### Are Lattice MachXO parts obsolete?

The first-generation MachXO devices, prefixed LCMXO, are largely obsolete, as is the older ispMACH 4000 line prefixed M4A. MachXO2 and MachXO3 remain mature and generally obtainable. Availability varies sharply by exact orderable part number, so a family-level answer is not useful; the density, package, speed grade and temperature grade each affect whether a specific variant is findable.

### What is the difference between MachXO and ECP devices?

Configuration. MachXO and ispMACH devices store their configuration on-chip in flash and are functional within microseconds of power-up with no external memory. ECP-family devices are SRAM-based and load their configuration at power-up from an external SPI flash, taking milliseconds or longer. That makes MachXO suitable for power sequencing, reset control and boot-mode logic, while ECP suits larger signal-processing and interface designs where boot delay is acceptable.

### How do I read a Lattice MachXO part number?

Take LCMXO1200C-3T100I. LCMXO1200 identifies a MachXO device with 1200 LUTs, the C denotes the 2.5/3.3 V core variant (E indicates 1.2 V), -3 is the speed grade, T100 is a 100-pin TQFP package, and the trailing I is the industrial temperature grade. Note that on MachXO a lower speed-grade number is faster, which is the opposite of the ECP5 convention where higher numbers are faster.

### Which Lattice toolchain do I need for a legacy design?

It depends on the device generation. ispLEVER, or ispLEVER Classic, covers ispMACH 4000, older EC and ECP devices and first-generation MachXO. Lattice Diamond covers MachXO2, MachXO3 and the ECP2 through ECP5 range. Lattice Radiant, the current tool, supports only the newest families and will not open a legacy project. Archive the correct tool version in a virtual machine along with the licence details, since Lattice licences have historically been node-locked to a network interface address.

### Can I replace an obsolete ECP3 device?

Check authorised aftermarket first. Some ECP3 parts, such as LFE3-70E-7FN1156I, are supplied through Rochester Electronics, which continues original production using original tooling; that is the lowest-risk outcome available for a legacy device, requiring only provenance verification rather than requalification. If no aftermarket source exists, migration to ECP5 is a port involving a toolchain change, new pin-out and re-verification.

### Are counterfeit Lattice FPGAs a concern?

The risk is moderate and concentrated in the larger ECP fpBGA parts, which carry meaningful unit value and conceal evidence inside the package. The small TQFP and csBGA MachXO and ispMACH devices that make up most of the volume are low value and straightforward to inspect visually. Speed-grade remarking is a particular hazard in this range because the grade conventions reverse between families, making a mismarked part less obvious. A JTAG IDCODE read on receipt is the most effective quick check.

### Why do Lattice parts appear in so many BOMs?

Because they perform functions that are essential but unglamorous — bus bridging, level translation, power sequencing, boot control and interface glue. They are rarely the headline component in a design, which means their obsolescence is often discovered late, when a build fails rather than when a lifecycle review runs. In our catalogue they are the most numerous programmable-logic family at roughly 2,800 part numbers.

## Related reading

The general selection framework is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the equivalent legacy situations elsewhere, see [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide), [sourcing Altera Cyclone I to IV](/blog/sourcing-altera-cyclone-legacy) and [MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths). For the wider lifecycle picture, [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life).

Send the full orderable part number and we will come back with real availability, including authorised aftermarket stock where the original line is continued.

[**Submit an RFQ**](/rfq) | [**Lattice sourcing**](/fpga-sourcing/lattice-machxo-ecp) | [**Upload a BOM**](/bom)
