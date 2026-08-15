---
title: "Sourcing Xilinx Spartan-6 in 2026: What Still Works"
slug: "sourcing-xilinx-spartan-6-guide"
status: "draft"
seoTitle: "Xilinx Spartan-6 Sourcing Guide 2026: Stock, Risk, Migration"
seoDesc: "Spartan-6 is deep in its sustaining phase. Decoding XC6SLX part numbers, what speed and temperature suffixes cost in availability, BGA counterfeit risk, and the ISE toolchain problem."
seoKeywords: "Spartan-6 sourcing, XC6SLX, XC6SLX9, Spartan-6 obsolete, Spartan-6 replacement, ISE 14.7, Spartan-6 counterfeit, XC6SLX45"
tags: "FPGA, Xilinx, AMD, Spartan-6, XC6SLX, legacy sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 15
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC6SLX9-2CPG196I, XC7A35T-1CPG236C"
---

# Sourcing Xilinx Spartan-6 in 2026: What Still Works

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~15 minutes
> **Topics**: Spartan-6, XC6SLX, legacy FPGA sourcing, ISE toolchain, migration

---

**Spartan-6 is a sustaining-phase part: still obtainable, no longer a design-in candidate.** Launched in 2009 on a 45 nm process, it became one of the most widely deployed low-cost FPGA families ever made, and an enormous installed base of industrial, test and medical equipment still depends on it. This guide covers what is realistically available, how the part-number suffix determines whether you can get it, where the counterfeit risk concentrates, and what the toolchain situation means for anyone still building these boards.


<img src="/uploads/blog/sourcing-xilinx-spartan-6-guide.webp" alt="Spartan-6 generation BGA FPGA prepared for legacy system sourcing" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Availability is per suffix, not per family.** `XC6SLX9` tells a supplier almost nothing — speed grade, package and temperature grade each have independent stock.
- **Industrial-temperature and faster speed grades are the thin end.** Commercial `-2` parts in common packages remain findable; `-3I` in an unusual package is where quotes come back empty.
- **BGA packages carry the highest counterfeit exposure** in this family, and reballed parts circulate. Provenance and inspection are not optional.
- **ISE 14.7 is the last toolchain that supports Spartan-6**. It is frozen. Vivado never supported this family and never will.
- The realistic migration target is **Artix-7**, but it is a redesign — different toolchain, different I/O banking, different configuration flow.
- We cover roughly **400 Spartan-6 part numbers**, a mix of active and obsolete.

---

## Where Spartan-6 actually stands

Spartan-6 occupies an awkward but very common position: **too old to design in, too widely deployed to abandon.** AMD (which acquired Xilinx) continues to list parts of the family, but it has been in long-term sustaining status for years, and the practical experience of buying it is closer to legacy sourcing than to mainstream procurement.

The installed base is the reason it keeps coming up. Spartan-6 was the default choice for cost-sensitive logic between roughly 2010 and 2016, which means it sits inside a generation of industrial controllers, test instruments, machine-vision systems, broadcast equipment and medical devices that are still being built and repaired today.

In our own catalogue the family runs to roughly 400 part numbers spanning both active and obsolete status — for example `XC6SLX9-2CPG196I`, a 196-ball chip-scale BGA industrial part, is among the better-stocked variants.

## Decoding the part number, and why it decides availability

The suffix is the part. A request for "XC6SLX9" cannot be quoted; a request for `XC6SLX9-2CPG196I` can.

```
XC6SLX9 - 2  CPG196  I
│         │  │       └── Temperature: C = commercial (0…85 °C), I = industrial (−40…100 °C)
│         │  └────────── Package: CPG196 = 196-ball, 0.5 mm pitch chip-scale BGA
│         └───────────── Speed grade: -2 (standard), -3 (fastest); -1L / -2L = low power
└─────────────────────── Device: Spartan-6 LX, ~9k logic cells
```

The four fields combine into a large number of orderable variants, and stock is distributed very unevenly across them:

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Device | LX9, LX16, LX25, LX45 | LX75, LX100, LX150; any LXT variant |
| Speed grade | -2 | -3, and the -1L/-2L low-power grades |
| Package | TQG144, CSG324, FGG484 | CPG196 and other fine-pitch CSPs; uncommon FG sizes |
| Temperature | C (commercial) | I (industrial), and Q/automotive |

The LXT variants (Spartan-6 devices with gigabit transceivers) are a separate sourcing problem from the plain LX parts and are considerably scarcer.

What to do: quote the full orderable part number, and know in advance which fields you can flex. A design that closes timing at `-2` but was specified `-3` has a much wider sourcing window. If the operating environment genuinely permits commercial temperature, saying so opens up stock.

## Counterfeit exposure is concentrated here

Legacy BGA FPGAs are among the highest-risk parts in the entire component market, and Spartan-6 sits squarely in that group: high unit value, obsolete-adjacent status, strong continuing demand, and a package that hides evidence.

The specific risks:

- **Remarked lower-grade or lower-density parts.** An LX9 remarked as an LX45, or a `-2` remarked as a `-3`. Both are electrically testable, but only if you test.
- **Reballed parts.** A device recovered from scrap boards, cleaned and fitted with new balls. It may function, but it has been through an uncontrolled thermal cycle and is no longer in original condition.
- **Recycled parts sold as new.** Visually convincing after refurbishment; detectable through package and lead-finish inspection.

Mitigations that actually work: buy from sources that provide traceable provenance, require inspection to a recognised standard, and (for BGA specifically) insist on X-ray and decapsulation sampling on lots of any significant value. Our [quality process](/quality) describes what we apply, and [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide) covers the eight inspection categories in detail.

A device-specific check worth doing on receipt: read the IDCODE via JTAG. It is a cheap, fast way to confirm the die is the density it claims to be, and it catches remarking that survives visual inspection.

## The toolchain problem

Spartan-6 is supported only by ISE, and ISE is frozen at version 14.7. Vivado, the tool that replaced ISE, never supported Spartan-6 and never will: the family predates the architecture Vivado targets.

Practical consequences for anyone sustaining a Spartan-6 design:

- **Preserve the build environment.** ISE 14.7 runs on operating systems that are themselves end-of-life. The durable answer is a virtual machine image, archived alongside the project, containing the OS, the tool, the licence configuration and the exact project files.
- **Licensing.** ISE WebPACK covered the smaller devices free of charge; larger ones required a licence. Confirm the licence situation before you need to rebuild in a hurry.
- **Nobody is fixing tool bugs.** Any ISE issue you hit is permanent. Workarounds found in old forum threads are, in practice, the documentation.
- **Bitstream reproducibility.** Archive the generated bitstream, not just the source. Rebuilding an identical bitstream years later depends on the entire toolchain being byte-identical, which is a fragile assumption.

This toolchain issue is frequently the deciding factor in migration timing, not part availability. A team can usually buy Spartan-6 parts; they may not be able to modify the design.

The same pattern applies across legacy programmable logic and is covered more broadly in [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life).

## Migration: Artix-7 is the target. It is a redesign

The natural successor is Artix-7, which occupies the same position in AMD's line-up: low-cost, general-purpose, no transceivers in the base variants. `XC7A35T-1CPG236C` is roughly the modern counterpart of a mid-range Spartan-6.

What migration actually involves:

| Area | Change |
| --- | --- |
| Toolchain | ISE → Vivado. Different constraint format (UCF → XDC), different synthesis, different flow |
| I/O banking | Different bank structure and voltage rules; pin assignment must be redone |
| Configuration | Different flow and configuration memory options |
| Clocking | Different mixed-mode clock manager primitives |
| IP cores | Regenerate; old CORE Generator IP does not carry over |
| Board | New package, new footprint, likely new stack-up |

None of that is exotic, but together it is a project (typically a board respin plus significant FPGA work) not a substitution. Budget it as such.

When migration is not worth it: if the product has a few years of production left, a last-time-buy of Spartan-6 parts is usually far cheaper than a redesign plus requalification. FPGAs store well in sealed, dry packaging. The calculation shifts toward migration when remaining life is long, volumes are high, or the design needs changes that the frozen toolchain makes impractical.

## A sourcing checklist

| # | Item | Why |
| --- | --- | --- |
| 1 | Full orderable part number, all four fields | Family-level requests cannot be quoted |
| 2 | State which fields can flex (speed, temperature) | Widens the pool substantially |
| 3 | Quantity and remaining production life | Determines last-time-buy versus spot buy |
| 4 | Required documentation and inspection level | Sets the sourcing channel |
| 5 | Date-code constraints, if any | Affects availability and price |
| 6 | Whether reballed parts are acceptable | Usually they should not be |
| 7 | JTAG IDCODE check on receipt | Cheap detection of remarking |

## FAQ

### Is the Xilinx Spartan-6 obsolete?

Spartan-6 is in long-term sustaining status rather than fully obsolete. AMD still lists parts of the family, but it has not been a design-in candidate for years and the buying experience resembles legacy sourcing: availability varies sharply by orderable part number, and some variants are effectively gone while others remain findable. Individual device, speed grade, package and temperature combinations reach end-of-life independently of the family as a whole.

### What replaced the Spartan-6?

Artix-7 is the direct successor in AMD's line-up, occupying the same low-cost general-purpose position. It is not a drop-in replacement: it uses a different toolchain (Vivado rather than ISE), different I/O banking rules, a different configuration flow and different clocking primitives, and it comes in different packages. Migrating is a board redesign plus substantial FPGA work rather than a component substitution.

### Can I still use ISE for Spartan-6 in 2026?

Yes, and you must: ISE 14.7 is the final version that supports Spartan-6, and Vivado never supported the family. ISE is frozen, so no bug fixes are coming, and it runs on operating systems that are themselves end-of-life. Teams sustaining Spartan-6 designs should archive a virtual machine image containing the operating system, the tool, the licence configuration and the project, and should archive generated bitstreams rather than relying on rebuilding them later.

### How do I read a Spartan-6 part number?

Take XC6SLX9-2CPG196I. XC6SLX9 is the device: a Spartan-6 LX with roughly 9,000 logic cells. The -2 is the speed grade, where -3 is faster and -1L or -2L denote low-power variants. CPG196 is the package, a 196-ball chip-scale BGA at 0.5 mm pitch. The trailing I is the temperature grade, industrial rather than commercial. All four fields must be specified to place an order, because each combination is a separate orderable part with its own availability.

### Are counterfeit Spartan-6 FPGAs common?

Legacy BGA FPGAs are among the highest-risk categories in the component market, and Spartan-6 has the combination that attracts counterfeiters: high unit value, sustained demand, obsolete-adjacent status, and a package that conceals evidence. The common forms are remarking a lower density or slower speed grade as a higher one, reballing recovered devices, and selling refurbished recycled parts as new. Traceable provenance, inspection to a recognised standard, X-ray on BGA lots, and a JTAG IDCODE check on receipt are the practical defences.

### Should I do a last-time-buy or migrate to Artix-7?

Compare the redesign cost against the inventory cost. Migration means a new board, a toolchain change from ISE to Vivado, reworked pin assignment and clocking, regenerated IP, and requalification — commonly a multi-month project. A last-time-buy avoids all of that and FPGAs store well in sealed dry packaging. Last-time-buy generally wins when remaining production life is a few years, volumes are moderate, and the design is stable. Migration wins when remaining life is long, volumes are high, or the frozen ISE toolchain blocks changes the product needs.

### Which Spartan-6 variants are hardest to source?

The larger densities such as LX75, LX100 and LX150, anything in the LXT sub-family with gigabit transceivers, the fastest -3 speed grade, the low-power -1L and -2L grades, industrial and automotive temperature variants, and uncommon fine-pitch packages. Commercial-temperature -2 parts in widely used packages remain the most findable. Knowing which of these fields your design can flex materially widens the available pool.

## Related reading

The general selection framework — I/O and hard blocks before logic cells, speed grade as a sourcing decision, package and board cost — is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the wider legacy picture across Spartan and Cyclone families, see [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life). For inspection standards on high-risk legacy parts, see [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

Send us the full orderable part number with the fields you can flex, and we will come back with real availability, date codes and lead times — including authorised aftermarket and specialty-channel stock.

[**Submit an RFQ**](/rfq) | [**Spartan-6 sourcing**](/fpga-sourcing/xilinx-spartan-6) | [**Upload a BOM**](/bom)
