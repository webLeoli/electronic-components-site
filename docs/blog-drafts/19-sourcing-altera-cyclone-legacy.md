---
title: "Sourcing Altera Cyclone I to IV: Legacy Continuity Without a Redesign"
slug: "sourcing-altera-cyclone-legacy"
status: "draft"
seoTitle: "Altera Cyclone I-IV Sourcing Guide: EP1C to EP4CE Legacy Parts"
seoDesc: "Cyclone, Cyclone II, III and IV sourcing in 2026: decoding EP1C/EP2C/EP3C/EP4CE part numbers, Quartus version cliffs, configuration device pairing, and when migration beats a last-time-buy."
seoKeywords: "Cyclone sourcing, EP4CE, EP2C, EP1C, Cyclone II obsolete, Cyclone IV replacement, Quartus II 13.0sp1, Altera legacy FPGA, EPCS configuration device"
tags: "FPGA, Altera, Intel, Cyclone, EP4CE, legacy sourcing, Quartus, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "FPGA & CPLD Sourcing"
relatedProducts: "EP4CE6E22C8N, EP1C3T100C8N, EPM240T100C5N"
---

# Sourcing Altera Cyclone I to IV: Legacy Continuity Without a Redesign

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: Cyclone, EP4CE, Altera legacy FPGA, Quartus, configuration devices

---

**The Cyclone line spans twenty years and four distinct generations, and they are in completely different places in their lifecycles.** Cyclone IV remains findable; Cyclone I and II are firmly legacy. Anyone sustaining a design built on any of them faces the same three problems: identifying the exact orderable variant, keeping a Quartus version that still supports the device, and remembering that the FPGA is only half the sourcing job; the configuration device is the other half. We cover roughly 950 Cyclone part numbers across the generations.


<img src="/uploads/blog/sourcing-altera-cyclone-legacy.webp" alt="Legacy Cyclone FPGA paired with configuration memory on a production board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Four generations, four lifecycle positions.** EP1C and EP2C are legacy; EP3C and EP4CE remain more obtainable. Treat them as separate sourcing problems.
- **The configuration device is part of the BOM risk.** An EPCS serial flash going obsolete strands a working FPGA. People forget to check it.
- **Quartus has hard version cliffs.** Modern Quartus Prime dropped Cyclone I–III entirely; 13.0sp1 is the last version supporting the oldest devices.
- **`EP4CE6E22C8N` is four decisions**, not one part: device, package, speed grade and RoHS status all have independent availability.
- Cyclone parts are lower unit value than legacy Xilinx, so **counterfeit pressure is lower but not zero** — remarking of speed grades is the common form.
- Migration within the family (Cyclone IV → 10 LP) is far cheaper than a cross-vendor move, but still a toolchain and board exercise.

---

## Four generations, four different problems

"Cyclone" covers devices introduced from 2002 to around 2009, and grouping them together is the first mistake.

| Generation | Prefix | Process | Introduced | Lifecycle position today |
| --- | --- | --- | --- | --- |
| Cyclone | EP1C | 130 nm | 2002 | Legacy — obsolete, specialty channels |
| Cyclone II | EP2C | 90 nm | 2004 | Legacy — mostly obsolete |
| Cyclone III | EP3C | 65 nm | 2007 | Mature, thinning |
| Cyclone IV E/GX | EP4CE / EP4CGX | 60 nm | 2009 | Mature, most obtainable |

In our catalogue the Cyclone families together run to roughly 950 part numbers, with `EP4CE6E22C8N` among the commonly requested Cyclone IV variants and older devices such as `EP1C3T100C8N` present but marked obsolete.

The practical implication: a BOM containing an EP2C part and a BOM containing an EP4CE part are not comparable sourcing exercises. The first is legacy sourcing with provenance checking; the second is closer to ordinary procurement with availability checks.

## Decoding the part number

Altera part numbers pack four independent decisions into one string:

```
EP4CE6 E22 C8 N
│      │   │  └── N = lead-free (RoHS); absence indicates leaded
│      │   └───── Speed grade: C6 (fastest) … C8, C9 (slowest); I7 = industrial
│      └───────── Package: E22 = 144-pin EQFP; also T = TQFP, F = FBGA, U = UBGA, Q = PQFP
└──────────────── Device: Cyclone IV E, ~6,000 logic elements
```

A second example from the older generation:

```
EP1C3 T100 C8 N
│     │    │  └── Lead-free
│     │    └───── Speed grade C8, commercial
│     └────────── 100-pin TQFP
└──────────────── Cyclone (first generation), ~3,000 logic elements
```

Note the speed-grade convention runs **opposite to Xilinx**: for Altera, a *lower* number is *faster*. C6 outperforms C8. Teams that work across both vendors get this wrong regularly, and specifying C6 when C8 would do unnecessarily narrows the sourcing pool and raises the price.

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Device | EP4CE6, EP4CE10, EP4CE22 | EP4CE75, EP4CE115; all EP1C/EP2C |
| Speed | C8 | C6, and industrial I7 |
| Package | TQFP (T144), EQFP (E22) | Larger FBGA, UBGA |
| RoHS | N (lead-free) | Leaded versions, largely gone |

## The configuration device is half the problem

A Cyclone FPGA is volatile: it loads its bitstream at power-up from an external device. For most Cyclone designs that is an EPCS-series serial configuration flash, or a parallel flash driven by a microcontroller.

This matters for sourcing because the configuration device has its own lifecycle. It is routinely omitted from obsolescence reviews. A design can pass a BOM scrub on the FPGA and still be stranded because the EPCS part it boots from has gone.

Three things to check:

- **Is the configuration device still available?** EPCS parts have their own end-of-life history, and some are harder to find than the FPGAs they serve.
- **Can it be substituted with a generic SPI flash?** Frequently yes — many Cyclone designs can boot from a standard SPI flash device with a compatible command set and adequate capacity, but this needs verification against the specific configuration scheme and bitstream size, and the erase/program timing must suit the board's power-up sequence.
- **Does the board have JTAG access?** If it does, in-system programming provides a fallback and a production-test path.

Where a substitution is being considered, the flash device is an ordinary sourcing exercise; the framework in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) is the right way to catch this class of dependency before it bites.

## Quartus version cliffs

Altera's toolchain dropped older Cyclone devices in hard steps, and picking the wrong version means the device simply is not in the list.

| Toolchain | Supports |
| --- | --- |
| Quartus II 13.0sp1 | The last version supporting Cyclone (EP1C) and Cyclone II |
| Quartus II 13.1 – 15.x | Cyclone III and IV, no longer the oldest parts |
| Quartus Prime (Standard / Lite, modern) | Cyclone IV onward; older families removed |

Consequences that mirror the Spartan-6 situation:

- **Archive the toolchain, not just the source.** A virtual machine image with the correct Quartus version, its licence configuration, the operating system it runs on and the project files is the durable artefact.
- **Archive the programming file.** Rebuilding a byte-identical `.sof`/`.pof` years later assumes an unchanged toolchain, which is fragile.
- **Licensing.** The free Web Edition covered smaller devices; larger ones needed a subscription. Confirm this before an urgent rebuild rather than during one.

For a design still in production on Cyclone II, the toolchain is usually a stronger argument for migration than part availability is.

## Counterfeit and quality risk

Cyclone parts carry lower unit value than legacy Virtex or Spartan devices, so they attract less counterfeiting, but the risk is not zero, and it rises for the larger densities and BGA packages.

The forms that show up:

- **Speed-grade remarking.** A C8 sold as a C6. Electrically detectable only by testing at speed, which most incoming inspection does not do.
- **Density remarking.** An EP4CE6 marked as an EP4CE22. Detectable in seconds via JTAG IDCODE.
- **Recycled parts from scrapped boards**, refurbished and sold as new. Visual and lead-finish inspection catches most.

The JTAG IDCODE read is the highest-value check for this family: it is fast, requires no decapsulation, and directly confirms the die density. For TQFP and EQFP packages (which most Cyclone designs use) visual and lead inspection is straightforward and effective. BGA variants warrant X-ray.

Our [quality process](/quality) covers what we apply; [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) covers the inspection categories in full.

## Migration options

Within the family first. Intel positioned Cyclone 10 LP as the continuation path for Cyclone IV. It is architecturally close: the migration is far less disruptive than a cross-vendor move. It still requires a toolchain change, re-verification and probably a board revision, but the fabric and IP concepts carry across.

Cross-vendor means a full port: different toolchain, different primitives, different constraint format, regenerated IP, new pinout. Treat it as a redesign.

Or do not migrate. For a stable design with a few years of production remaining, a last-time-buy of both the FPGA and its configuration device is usually cheaper than a redesign plus requalification. The decision framework:

| Signal | Points to |
| --- | --- |
| Cyclone IV, stable design, < 5 years remaining | Last-time-buy |
| Cyclone I/II, toolchain blocking needed changes | Migrate |
| High volume, long remaining life | Migrate |
| Certified product (medical, rail, industrial safety) | Last-time-buy, unless requalification is budgeted |
| Configuration device also obsolete | Evaluate both together before deciding |

## A sourcing checklist

| # | Item | Why |
| --- | --- | --- |
| 1 | Full orderable part number including RoHS suffix | Each combination is a separate line item |
| 2 | Confirm the speed grade you actually need | Remember: lower number = faster on Altera |
| 3 | Check the configuration device's lifecycle too | Half the designs that get stranded are stranded here |
| 4 | State flexible fields (speed, temperature, package) | Widens the pool |
| 5 | JTAG IDCODE verification on receipt | Fast detection of density remarking |
| 6 | Confirm which Quartus version the design builds under | Determines whether changes are even possible |
| 7 | Quantity against remaining production life | Last-time-buy sizing |

## FAQ

### Is the Altera Cyclone II still available?

Cyclone II is legacy and generally obsolete through authorised channels, though parts remain obtainable through specialty distribution and authorised aftermarket sources. Cyclone and Cyclone II should be treated as legacy sourcing exercises requiring provenance checking, while Cyclone III and especially Cyclone IV remain considerably more obtainable. Availability always needs checking at the specific orderable part number rather than the family level.

### How do I read an Altera Cyclone part number?

Take EP4CE6E22C8N. EP4CE6 identifies a Cyclone IV E device with roughly 6,000 logic elements, E22 is the package (144-pin EQFP), C8 is the commercial speed grade, and the trailing N indicates lead-free RoHS construction. Note that Altera speed grades run opposite to Xilinx: a lower number is faster, so C6 outperforms C8. All fields must be specified to order.

### What is the replacement for Cyclone IV?

Intel positioned Cyclone 10 LP as the continuation path for Cyclone IV. It is architecturally close enough that migration is substantially easier than moving to another vendor. It is not a drop-in (expect a toolchain change, re-verification and probably a board revision) but the fabric concepts, IP and design approach carry across, unlike a cross-vendor port.

### Which Quartus version do I need for an old Cyclone device?

Quartus II 13.0sp1 is the last version supporting the original Cyclone (EP1C) and Cyclone II families. Versions from 13.1 through the 15.x series cover Cyclone III and IV, and modern Quartus Prime releases support Cyclone IV onward while having dropped the older families entirely. Teams sustaining these designs should archive a virtual machine containing the correct Quartus version, its licence configuration and the project, and should archive the generated programming files rather than assuming they can be rebuilt.

### Do I need to source the configuration device as well as the FPGA?

Almost always, yes. It is the step most often missed. Cyclone FPGAs are volatile and load their bitstream at power-up from an external device, typically an EPCS serial configuration flash. That flash has its own lifecycle and can go obsolete independently of the FPGA, stranding an otherwise sourceable design. Many Cyclone designs can boot from a generic SPI flash instead, but this must be verified against the specific configuration scheme, bitstream size and power-up timing.

### Are counterfeit Cyclone FPGAs a problem?

Less so than for high-value legacy Xilinx parts, because unit values are lower, but the risk is real and rises with density and BGA packaging. The common forms are speed-grade remarking, density remarking, and recycled parts refurbished and sold as new. A JTAG IDCODE read on receipt is the single most effective check for this family since it directly confirms die density in seconds. TQFP and EQFP packages also make visual and lead-finish inspection straightforward.

### Should I migrate off Cyclone II or buy remaining stock?

If the design is stable and has a few years of production left, buying remaining stock of both the FPGA and its configuration device is usually cheaper than a redesign plus requalification. Migration becomes the better answer when remaining production life is long, volumes are high, the product needs design changes that the frozen Quartus II 13.0sp1 toolchain makes impractical, or the configuration device is also unobtainable.

## Related reading

The general selection framework (hard blocks and I/O before logic cells, speed grade as a sourcing decision) is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the parallel situation on the Xilinx side, see [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide). For the wider legacy picture, [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life).

Send the full orderable part number (including the configuration device if you have one) and we will come back with real availability, date codes and lead times across authorised aftermarket and specialty channels.

[**Submit an RFQ**](/rfq) | [**Cyclone sourcing**](/fpga-sourcing/altera-cyclone) | [**Upload a BOM**](/bom)
