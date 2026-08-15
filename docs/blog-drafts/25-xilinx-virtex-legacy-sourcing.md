---
title: "Legacy Virtex Sourcing: Virtex-II, Virtex-4 and Virtex-5 in 2026"
slug: "xilinx-virtex-legacy-sourcing"
status: "draft"
seoTitle: "Virtex-II, Virtex-4 & Virtex-5 Sourcing: Legacy FPGA Guide"
seoDesc: "Legacy Virtex parts are high-value, fully obsolete and the highest counterfeit-risk FPGAs in the market. Decoding XC2V/XC4V/XC5V numbers, why defence programmes cannot substitute, and what to inspect."
seoKeywords: "Virtex-II sourcing, XC2VP30, Virtex-4 obsolete, XC4VLX, Virtex-5 replacement, XC5VLX, legacy Virtex FPGA, Virtex-II Pro, high value FPGA counterfeit"
tags: "FPGA, Xilinx, AMD, Virtex-II, Virtex-4, Virtex-5, legacy sourcing, counterfeit, defence"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC2VP7-6FF672I, XC2VP30-5FF1152C, XC2V1500-4FFG896C, XC2V6000-4FF1152I, XC2V250-4FGG256I, XC2V2000-4FG676I"
---

# Legacy Virtex Sourcing: Virtex-II, Virtex-4 and Virtex-5 in 2026

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: Virtex-II, Virtex-4, Virtex-5, high-value legacy FPGA, counterfeit risk, defence sourcing

---

**Legacy Virtex parts are the highest-risk FPGAs in the component market, and the risk is commercial rather than technical.** These were flagship devices costing hundreds to thousands of dollars each. They are now comprehensively obsolete, they sit inside defence, aerospace, test and broadcast systems that cannot easily be redesigned, and demand is inelastic because the programmes using them have no alternative. That combination (high value, no substitution path, buyers under schedule pressure) is precisely what attracts counterfeiters. We cover roughly 954 legacy Virtex part numbers, and essentially all of them are discontinued.


<img src="/uploads/blog/xilinx-virtex-legacy-sourcing.webp" alt="High-value legacy Virtex-class FPGA undergoing traceability inspection" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Effectively the entire legacy Virtex range is obsolete.** Of the ~954 part numbers we cover, discontinued status is close to universal.
- **Unit values run from tens to thousands of dollars**, which changes the economics of both counterfeiting and inspection. Decapsulation sampling is proportionate here in a way it is not for a jellybean part.
- **Substitution is usually prohibited, not merely difficult.** Many of these boards are inside qualified programmes where the part number is frozen by an approval.
- **Virtex-II Pro contains PowerPC hard cores.** Nothing in a modern FPGA is a drop-in equivalent, and the software stack is part of the problem.
- **ISE only**, and the oldest devices need specific ISE versions rather than simply "the last one".
- The realistic strategies are **authorised aftermarket, a properly sized last-time-buy, and rigorous incoming inspection** — in that order.

---

## What these parts are and where they live

Virtex was Xilinx's flagship line: the largest, fastest and most expensive devices of each generation.

| Family | Prefix | Introduced | Notable feature |
| --- | --- | --- | --- |
| Virtex-II | XC2V | 2001 | High logic density for its era |
| Virtex-II Pro | XC2VP | 2002 | **Embedded PowerPC 405 cores**, RocketIO transceivers |
| Virtex-4 | XC4V | 2004 | LX / SX / FX variants; FX has PowerPC and Ethernet MACs |
| Virtex-5 | XC5V | 2006 | LX / LXT / SXT / FXT / TXT variants; 6-input LUTs |

Representative parts from our holdings: `XC2VP30-5FF1152C`, `XC2VP7-6FF672I`, `XC2V6000-4FF1152I`, `XC2V1500-4FFG896C`, `XC2V2000-4FG676I`, `XC2V250-4FGG256I` — all obsolete.

Where they sit today: radar and signal-intelligence systems, avionics, satellite ground equipment, semiconductor test heads, medical imaging, professional broadcast infrastructure and industrial machine vision. These are products with twenty- to thirty-year service lives, low build volumes, and certification or qualification regimes that make redesign extraordinarily expensive.

That profile is the story. A commercial product would have been redesigned a decade ago. These have not been, and will not be.

## Decoding the part number

```
XC2VP30 - 5  FF1152  C
│         │  │       └── Temperature: C = commercial, I = industrial
│         │  └────────── Package: FF1152 = 1152-ball flip-chip BGA
│         └───────────── Speed grade: -4, -5, -6 (higher = faster)
└─────────────────────── Device: Virtex-II Pro, 30,816 logic cells
```

The `FFG` versus `FF` distinction (as in `XC2V1500-4FFG896C` versus `XC2V6000-4FF1152I`) marks lead-free versus leaded. For legacy defence and aerospace work this is not a detail: many programmes were qualified on **leaded** solder and tin-lead termination, and a RoHS part with pure-tin finish introduces tin-whisker risk that the qualification explicitly excluded. Substituting `FFG` for `FF` can be a compliance failure even though the die is identical.

| Field | Notes on availability |
| --- | --- |
| Family | Virtex-II most available; Virtex-5 variants scarcer |
| Density | Mid densities easier; the largest devices are very scarce and very expensive |
| Package | Large flip-chip BGA throughout — no easy packages in this range |
| Speed | Fastest grades are hardest and command large premiums |
| Temperature | Industrial and any screened grade substantially harder |
| Finish | Leaded (FF) versus lead-free (FFG) — check which the qualification requires |

## Why substitution usually is not an option

In most of the systems using these parts, the part number is frozen by an approval rather than chosen by an engineer.

Three compounding reasons:

Qualification. Changing the FPGA in a certified avionics or medical system triggers requalification of the assembly — months of work and a cost that dwarfs any inventory purchase.

The PowerPC problem. Virtex-II Pro and Virtex-4 FX contain hard PowerPC 405 cores. No current FPGA has one. Migrating means porting embedded software from PowerPC to a soft-core MicroBlaze or an ARM-based device, plus rebuilding whatever board support package and RTOS configuration the system depends on. That is a software project layered on top of a hardware project, and for a system with a mature, validated software load it is often simply not attempted.

Transceivers and I/O. RocketIO transceiver characteristics, I/O standards and pinout do not carry across generations. Even where a modern device is functionally superior, the board does not accept it.

The consequence for procurement: **the sourcing plan for these parts should be built around obtaining the original, not around finding an alternative.**

## Counterfeit risk: the highest in the FPGA market

Everything about this category favours the counterfeiter. High unit value creates the incentive. Obsolete status means there is no authorised channel to undercut. Inelastic demand means buyers accept unfamiliar sources. Flip-chip BGA packaging hides the evidence.

The forms encountered:

- **Density remarking.** An XC2V250 remarked as an XC2V6000: a value difference of orders of magnitude on parts that look identical.
- **Speed-grade remarking.** A `-4` sold as a `-6`, exploiting the premium on fast grades.
- **Reballed devices** recovered from scrapped boards. May function; has been through an uncontrolled thermal cycle; is not in original condition.
- **Blacktopping and remarking** — grinding off the original marking, applying a new surface and re-laser-marking.
- **Leaded parts sold as RoHS, or vice versa**, which matters in both directions here.
- **Entirely non-functional devices** (dummy parts or dead dies) sold into urgent orders where the buyer cannot test before accepting.

### Inspection proportionate to value

For a part worth a few cents, X-ray is disproportionate. For a part worth $2,000, decapsulation sampling is cheap insurance. A reasonable escalation for this category:

| Check | Detects | Cost relative to part value |
| --- | --- | --- |
| Visual and marking-permanency (solvent test) | Blacktopping, crude remarking | Negligible |
| Dimensional and package inspection | Reballing, wrong package | Negligible |
| X-ray | Reballing, wire-bond anomalies, wrong die | Low |
| JTAG IDCODE | **Density remarking** | Negligible — do this always |
| Electrical / functional test at speed | Speed-grade remarking, dead parts | Moderate |
| Decapsulation and die marking | Wrong die, recycled parts | Moderate — justified at this value |
| XRF for lead content | Leaded/RoHS misrepresentation | Low |

The JTAG IDCODE read is the single highest-value check and should be non-negotiable on every legacy Virtex receipt. It takes minutes and directly catches the most lucrative counterfeit type.

Full inspection categories are covered in [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide); our applied process is described under [quality](/quality).

## Toolchain

ISE, and for the oldest devices, specific ISE versions. Unlike Spartan-6 where 14.7 covers everything, legacy Virtex support varied across ISE releases — Virtex-II support in particular was dropped from later ISE versions, so "install the last ISE" is not necessarily correct.

Practical guidance:

- **Record which ISE version the design was built with**, and archive that version rather than the newest.
- Preserve a virtual machine with the OS, the tool, the licence and the project.
- Archive the generated bitstream. For a qualified system, the bitstream is frequently part of the configuration-controlled baseline anyway.
- For Virtex-II Pro and Virtex-4 FX designs, **archive the embedded software toolchain too** — EDK, the PowerPC compiler, the board support package. The FPGA bitstream alone does not reconstitute the system.

That last point is where sustaining these systems actually gets hard. The FPGA design is one artefact among several, and the software toolchain for a discontinued embedded PowerPC is at least as fragile as the FPGA tool.

## Sourcing strategy

Given that substitution is largely off the table, the strategy is about acquisition and verification.

1. Authorised aftermarket first. Where a device is available through an authorised continuation source, that is the lowest-risk outcome: original tooling, traceable provenance, no counterfeit question. Always check this before the open market.

2. Size a last-time-buy against programme life, not next year's build. These systems have long service lives and a spares obligation that may extend past production. Include spares and repair depot demand in the quantity.

3. Buy provenance, not just parts. For this category the documentation trail (original packaging, date code consistency, traceable chain of custody) is a substantial fraction of what you are paying for. A cheaper quote without provenance is usually not cheaper.

4. Inspect proportionately. Use the escalation table above. Budget inspection cost as a percentage of lot value rather than trying to minimise it.

5. Store correctly. These are large BGA devices and moisture-sensitive. Dry-pack storage per J-STD-033 with humidity indicators, and controlled bake-before-reflow procedures if the packaging is compromised. A last-time-buy that is stored badly is a write-off discovered years later.

## FAQ

### Are Virtex-II, Virtex-4 and Virtex-5 FPGAs obsolete?

Yes, comprehensively. Essentially all of the roughly 954 legacy Virtex part numbers in our catalogue are discontinued. They remain obtainable through authorised aftermarket continuation sources and specialty distribution, and demand persists because they sit inside defence, aerospace, test and broadcast systems with service lives measured in decades. Availability and price vary enormously by density, speed grade and package.

### Why are legacy Virtex FPGAs such a high counterfeit risk?

Because every factor aligns. Unit values run from tens to thousands of dollars, creating strong incentive. Obsolete status means no authorised channel is available to undercut a counterfeit. Demand is inelastic because the programmes using these parts cannot substitute, so buyers under schedule pressure accept unfamiliar sources. And the flip-chip BGA packaging conceals evidence that would be visible on a leaded package. Density remarking is particularly lucrative because a low-density part and a high-density part are visually identical.

### Can I replace a Virtex-II Pro with a modern FPGA?

Rarely in practice. Virtex-II Pro contains hard PowerPC 405 processor cores that no current FPGA provides, so migration requires porting embedded software to a soft-core MicroBlaze or an ARM-based device, along with rebuilding the board support package and RTOS configuration. Transceiver characteristics, I/O standards and pinout also do not carry across. Layered on top of that, most systems using these parts are qualified, and changing the FPGA triggers requalification of the whole assembly.

### What is the difference between FF and FFG package codes?

FF denotes a leaded package and FFG the lead-free RoHS equivalent, with the same die and ball count. For legacy defence and aerospace programmes this distinction is often contractual rather than cosmetic: many were qualified on tin-lead solder, and a pure-tin finish introduces tin-whisker risk that the qualification specifically excluded. Substituting a lead-free part into such a build can be a compliance failure even though the device is electrically identical.

### How should I inspect a legacy Virtex purchase?

Scale inspection to lot value. A JTAG IDCODE read is essential on every receipt — it confirms die density in minutes and catches the most common and most lucrative form of remarking. Add visual and marking-permanency testing, dimensional inspection for reballing, and X-ray for wire-bond and die anomalies. At the unit values typical of this family, decapsulation sampling and electrical testing at speed are proportionate, as is XRF testing where lead content matters to the qualification.

### Which ISE version do I need for Virtex-II?

Not necessarily the last one. Unlike Spartan-6, where ISE 14.7 covers the family, legacy Virtex support varied across ISE releases and Virtex-II support was dropped from later versions. Record and archive the specific ISE version the design was built with, together with the operating system, licence configuration and project files. For Virtex-II Pro and Virtex-4 FX designs, also archive the embedded software toolchain (EDK, the PowerPC compiler and the board support package) since the FPGA bitstream alone will not reconstitute the system.

### How much should I buy in a last-time-buy for a legacy Virtex design?

Size it against the programme's full remaining life rather than the next production run, and include spares and repair-depot demand. These systems typically carry a spares obligation extending beyond production end, and there will be no second opportunity. Also plan storage: these are large moisture-sensitive BGA devices, so dry-pack storage per J-STD-033 with humidity indicators and a controlled bake-before-reflow procedure are part of the purchase, not an afterthought.

### Is buying from the open market safe for these parts?

It can be, with the right controls, but the documentation trail matters as much as the parts. For this category, provenance (original packaging, consistent date codes, traceable chain of custody) is a substantial part of what you are buying, and a cheaper quote without it is usually not cheaper once inspection and risk are priced in. Check authorised aftermarket continuation sources first, since those carry original tooling and traceable provenance without the counterfeit question.

## Related reading

The general selection framework is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the other legacy families, see [sourcing Xilinx Spartan-3](/blog/sourcing-xilinx-spartan-3-legacy), [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide), [sourcing Altera Cyclone I to IV](/blog/sourcing-altera-cyclone-legacy) and [Actel ProASIC and IGLOO](/blog/actel-proasic-sourcing-guide), which covers the parallel situation for qualified programmes. Inspection standards are in [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

Send the full orderable part number together with your provenance, finish and inspection requirements, and we will come back with real availability and the documentation to go with it.

[**Submit an RFQ**](/rfq) | [**Legacy Virtex sourcing**](/fpga-sourcing/xilinx-virtex-legacy) | [**Upload a BOM**](/bom)
