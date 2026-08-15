---
title: "How to Choose the Right FPGA for Your Project"
slug: "how-to-choose-right-fpga"
status: "published"
seoTitle: "How to Choose an FPGA: Selection and Sourcing Guide"
seoDesc: "Choosing an FPGA on logic cells alone is how projects fail. I/O count, clocking, hard blocks, toolchain licensing, package escape and lifecycle all constrain it — plus part-number decoding."
seoKeywords: "how to choose an FPGA, FPGA selection guide, FPGA vs CPLD, logic cells, FPGA speed grade, FPGA part number decode, FPGA sourcing, Spartan Cyclone comparison"
tags: "FPGA, CPLD, Xilinx, AMD, Altera, Intel, Lattice, Microchip, selection guide, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 19
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC7A35T-1CPG236C, XC6SLX9-2CPG196I, EP4CE6E22C8N, EPM240T100C5N, LFE5U-85F-8BG554C, A3PN125-Z2VQG100"
---

# How to Choose the Right FPGA for Your Project

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~19 minutes
> **Topics**: FPGA selection, CPLD, logic cells, speed grade, packages, sourcing

---

**Choosing an FPGA on logic-cell count alone is the most common way an FPGA project goes wrong.** Logic capacity is rarely the binding constraint. I/O count, clock resources, hard blocks, package escape routing, toolchain licensing and (increasingly) whether the part will still exist in eight years all constrain the decision harder than LUTs do. This guide works through the constraints in the order they actually bite, then covers how to read a part number and what to do when the device you chose goes end-of-life.


<img src="/uploads/blog/how-to-choose-right-fpga.webp" alt="FPGA selection workbench with BGA device, I/O routing and design tools" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Run out of I/O before you run out of logic.** Pin count, not logic cells, is the usual first wall —. It is the one that forces a package change and a board respin.
- **Hard blocks decide the family**, not the density. Transceivers, memory controllers, PCIe endpoints and DSP slices are present or absent; you cannot synthesise them.
- **Speed grade is a purchasing decision made at design time.** A faster grade costs more and is harder to source; a slower one may not close timing.
- **Toolchain licensing constrains the part.** Free tool editions cover only a subset of devices, and a licence for the larger ones is a real annual cost.
- **CPLDs are not small FPGAs.** Instant-on, non-volatile configuration and deterministic timing make them the right answer for glue logic and power sequencing.
- **Lifecycle is a design parameter.** Choose a family whose production life matches your product's, or budget for the sourcing exercise you have just scheduled.

---

## Start with the constraints, not the catalogue

Vendor selectors sort by logic capacity because it is the easiest number to index. It is seldom the number that decides. Before opening any selector, write down six figures:

| Constraint | What to write down | Why it binds first |
| --- | --- | --- |
| I/O count | Total signals, split by voltage standard | Forces package and pin count |
| Clock domains | How many, their frequencies, relationships | Limits by clock region and PLL count |
| Hard blocks | Transceivers, DDR, PCIe, Ethernet MAC, DSP | Present or absent; cannot be synthesised |
| Memory | On-chip block RAM in bits, external interfaces | Block RAM is finite and partitioned |
| Logic | Estimated LUTs/LEs, with margin | The number everyone starts with, rarely binding |
| Lifetime | How long the product must be buildable | Determines family, not density |

Two of these deserve immediate expansion, because they are where designs get stuck.

### I/O is usually the wall

A design that needs 180 user I/O in three voltage standards will be forced into a package before logic capacity matters. Package choice then sets the pin count, and pin count is what you pay for.

Three details that catch people:

- **I/O banks have their own supply rails.** A bank runs at one VCCIO. Mixing 3.3 V, 1.8 V and LVDS across too few banks means signals do not fit even when the total pin count does.
- **Not all pins are user I/O.** Configuration, JTAG, dedicated clock inputs and power take a substantial fraction of a package's balls.
- **Differential pairs consume two pins and must be routed as pairs**, on specific pin combinations within a bank.

### Hard blocks decide the family

You can build a UART out of logic. You cannot build a multi-gigabit transceiver, a hardened memory controller or a PCIe endpoint out of logic. If the design needs any of those, the requirement selects the family before anything else does, and often selects a much larger and more expensive device than the logic budget alone would suggest.

## Logic capacity: how to estimate, and why the numbers do not compare

Logic-cell counts are not comparable across vendors. Xilinx counts "logic cells", Altera/Intel counts "logic elements", Lattice counts "LUTs". The underlying architectures differ: LUT input width, how many flip-flops accompany each LUT, whether carry chains and wide muxes are counted, so a 6,000-LE device and a 6,000-LC device are not equivalent.

For estimating, the usable rules of thumb are:

- Start from a comparable previous design if you have one; scale by function count, not by feeling.
- Synthesise early. A trial synthesis of the largest known block against a candidate device is worth more than any estimate.
- Leave headroom. Utilisation above roughly 70-80% makes place-and-route slow and timing closure difficult, and leaves nothing for the features that will inevitably be added.
- Count block RAM separately. It is a distinct resource and frequently exhausts before logic does, particularly in designs with buffers or FIFOs.

## Speed grade: a purchasing decision made at design time

Speed grade is the one selection parameter that is simultaneously an engineering choice and a sourcing choice. A faster grade eases timing closure and costs more; a slower grade is cheaper and more widely stocked but may not close.

What this means in practice:

- **Design for the slowest grade you can close timing on**, with margin. If the design only closes on the fastest grade, you have created a single point of sourcing failure — that grade will be the first to go on allocation.
- **Speed grade is part of the orderable part number.** Two parts differing only in speed grade are different line items with independent availability and independent lifecycle.
- **Temperature grade behaves the same way.** Industrial and extended-temperature variants are separate part numbers, often with much thinner stock than the commercial version.

This is worth internalising before layout, because changing grade late is cheap and changing device is not.

## Package and the escape-routing problem

The package you choose determines how many board layers you need. A fine-pitch BGA is not just a footprint; it is a routing problem.

| Package | Typical pitch | Board layers commonly required | Rework |
| --- | --- | --- | --- |
| TQFP / PQFP | 0.5 mm | 2-4 | Straightforward |
| BGA | 1.0 mm | 4-6 | Requires BGA rework station |
| BGA | 0.8 mm | 6-8 | Requires BGA rework station |
| BGA | 0.5 mm | 8+, often with microvias | Specialist |

Escaping signals from the inner rows of a fine-pitch BGA requires a via per pin and enough layers to route them out. That is why the same die in a 0.5 mm BGA can cost more at board level than in a 1.0 mm package even when the chip is cheaper.

For a legacy design, the package also determines whether **reballing** is a rework option: a topic with real quality implications, since a reballed part is no longer in its original condition. See our [quality process](/quality) for how we treat that.

## Toolchain, licensing and IP

The toolchain is part of the device selection, and its licensing tiers do not follow device density in an intuitive way.

- Free tool editions cover a subset of devices. Larger or newer parts often require a paid licence with an annual cost per seat.
- Some vendor IP cores (memory controllers, high-speed interfaces) carry their own licences.
- Older devices are frequently dropped by current tool versions, so sustaining a legacy design can mean maintaining an old toolchain on an old operating system. This is a genuine long-term cost of choosing a device late in its life. It is covered in more depth in [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life).
- Simulation, timing analysis and debug tooling maturity vary meaningfully by vendor.

## FPGA or CPLD?

A CPLD is not a small FPGA, and choosing one over the other is a decision about behaviour, not capacity.

| | CPLD | FPGA |
| --- | --- | --- |
| Configuration | Non-volatile, on-chip | Usually volatile, loaded at power-up |
| Start-up | Instant-on, microseconds | Milliseconds to hundreds of milliseconds |
| External config memory | Not required | Usually required |
| Timing | Highly deterministic | Depends on place-and-route |
| Typical use | Glue logic, power sequencing, boot control, level translation | Signal processing, interfaces, parallel compute |

The instant-on property is the decisive one. If a device must hold a board in a known state at power-up, sequence supplies, or control the boot of something else, a CPLD does it without an external configuration device and without a boot delay. That is why CPLD families such as MAX and MachXO remain in production long after contemporaneous FPGAs have gone, and why they show up so often in sourcing requests.

Browse [MAX CPLD sourcing](/fpga-sourcing/altera-max-cpld) and [Lattice MachXO and ECP](/fpga-sourcing/lattice-machxo-ecp).

## The vendor landscape, from a sourcing point of view

Choosing a vendor is partly a technical decision and partly a bet on how long the part will be buildable. Approximate holdings in our catalogue give a sense of what is realistically available today:

| Family | Vendor | Part numbers we cover | Typical role |
| --- | --- | ---: | --- |
| [Spartan-6](/fpga-sourcing/xilinx-spartan-6) | Xilinx / AMD | ~400 | Legacy industrial workhorse |
| [Spartan-3 / 3E / 3A](/fpga-sourcing/xilinx-spartan-3) | Xilinx / AMD | ~370 | Long-life embedded, mostly obsolete |
| [Virtex-II / 4 / 5](/fpga-sourcing/xilinx-virtex-legacy) | Xilinx / AMD | ~950 | High-value legacy, defence and test |
| [7 Series / Zynq](/fpga-sourcing/xilinx-7-series) | Xilinx / AMD | ~660 | Current mainstream |
| [Cyclone I–IV](/fpga-sourcing/altera-cyclone) | Altera / Intel | ~950 | Cost-optimised legacy |
| [MAX CPLD](/fpga-sourcing/altera-max-cpld) | Altera / Intel | ~1,030 | Glue logic, sequencing |
| [MachXO / ECP](/fpga-sourcing/lattice-machxo-ecp) | Lattice | ~2,440 | Bridging, low power, control |
| [Actel ProASIC / IGLOO](/fpga-sourcing/microchip-actel-proasic) | Microchip / Actel | ~1,850 | Flash-based, aerospace, low power |

A few sourcing-relevant observations:

- **Flash-based FPGAs** (Actel ProASIC, IGLOO) are non-volatile like a CPLD but with FPGA-scale logic. For aerospace, defence and radiation-tolerant work this matters, and those families tend to have long production lives.
- **Lattice** parts dominate by count here largely because MachXO and ispMACH devices are used as bridging and control logic across an enormous range of products.
- **The legacy Xilinx families** carry the highest per-unit values and the highest counterfeit risk, which is why provenance checking matters most there. See [IDEA-STD-1010 inspection](/blog/idea-std-1010-counterfeit-detection-guide).

## Decoding an FPGA part number

Every character in an FPGA part number is orderable information. A worked example on a common Artix-7 device:

```
XC7A35T - 1  CPG236  C
│         │  │       └── Temperature grade: C = commercial, I = industrial
│         │  └────────── Package: CPG236 = 236-ball chip-scale BGA
│         └───────────── Speed grade: -1 (slowest), -2, -3 (fastest)
└─────────────────────── Device: Artix-7, ~33k logic cells
```

And an Altera example:

```
EP4CE6 E22 C8 N
│      │   │  └── N = lead-free / RoHS
│      │   └───── C8 = commercial, speed grade 8
│      └───────── E22 = EQFP 144-pin
└──────────────── Cyclone IV E, ~6k logic elements
```

The practical consequence: **"we use the EP4CE6" is not a purchasing instruction.** The speed grade, package and temperature grade are separate orderable variants with independent stock and independent lifecycle status. A family being in production says nothing about whether your specific suffix is available, a point covered in more detail in [STM32F103 vs STM32F407](/blog/stm32f103-vs-stm32f407-comparison), where the same pattern applies.

## Designing for a part you can still buy

Lifecycle belongs in the selection criteria alongside logic cells. Ask three questions before committing:

1. **Where is this family in its life?** A part introduced two years ago and a part introduced fifteen years ago carry very different remaining lifetimes, even if both are marked Active today.
2. **How long must the product be buildable?** Industrial and medical products routinely outlive the silicon they were designed around. If the product needs a fifteen-year build life, that is a constraint on the family.
3. **What is the exit plan?** Either a pin-compatible successor within the family, a second source, or a planned last-time-buy. Having no answer is itself an answer, and an expensive one.

For a design already in this situation, [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life) covers migration paths and toolchain preservation, and [how to source obsolete electronic components](/blog/how-to-source-obsolete-electronic-components) covers the five sourcing paths in order of preference.

## A selection sequence

1. Write down the six constraints at the top of this guide.
2. Filter on **hard blocks** first — this eliminates whole families.
3. Filter on **I/O count and banking**, which selects the package.
4. Check **logic and block RAM** with headroom, ideally via a trial synthesis.
5. Choose the **slowest speed grade** that closes timing with margin.
6. Confirm the **toolchain tier** and any IP licences the design needs.
7. Check **lifecycle status and real availability** for the exact orderable part number, including speed and temperature grade.
8. Confirm the **package is manufacturable** on your intended board stack-up.

Step 7 is the one most often skipped at design time and most often regretted later.

## FAQ

### How many logic cells do I need for my FPGA design?

There is no reliable way to answer this from a feature list alone. The practical approach is to synthesise your largest known functional block against a candidate device early, scale from a comparable previous design if you have one, and leave substantial headroom — utilisation above roughly 70 to 80 percent makes place-and-route slow and timing closure difficult. Count block RAM separately, since it is a distinct resource that frequently runs out before logic does.

### Can I compare logic cells between Xilinx and Altera FPGAs?

Not directly. Xilinx counts logic cells, Altera and Intel count logic elements, and Lattice counts LUTs, but the underlying architectures differ in LUT input width, the number of flip-flops per LUT, and how carry chains and wide multiplexers are counted. A 6,000-element device from one vendor is not equivalent to a 6,000-cell device from another. Trial synthesis on the actual candidate devices is the only dependable comparison.

### What is the difference between an FPGA and a CPLD?

The decisive difference is configuration. A CPLD stores its configuration on-chip in non-volatile memory and is functional within microseconds of power-up, needing no external configuration device. An FPGA usually loads its configuration from external memory at power-up, taking milliseconds or longer. CPLDs also offer more deterministic timing. That makes CPLDs the correct choice for glue logic, power sequencing and boot control, while FPGAs suit signal processing, high-speed interfaces and parallel computation.

### What does the speed grade in an FPGA part number mean?

Speed grade indicates the timing performance bin the die was tested into — faster grades guarantee shorter propagation delays and make timing closure easier, at higher cost. It is part of the orderable part number, so two parts differing only in speed grade are separate line items with independent stock and lifecycle. Design for the slowest grade that closes timing with margin: depending on the fastest grade creates a single point of sourcing failure, because premium grades go on allocation first.

### Does the FPGA package affect board cost?

Substantially, and often more than the chip price difference. Escaping signals from the inner rows of a fine-pitch BGA requires a via per pin plus enough layers to route them out, so a 0.5 mm pitch BGA may need eight or more board layers where a 1.0 mm part needs four to six. Package choice also determines whether rework is feasible in-house and whether reballing is even an option for legacy parts.

### How do I read an FPGA part number?

Each field is orderable information. Taking XC7A35T-1CPG236C as an example: XC7A35T identifies an Artix-7 device of roughly 33,000 logic cells, -1 is the speed grade, CPG236 is a 236-ball chip-scale BGA package, and the trailing C is the commercial temperature grade. Because speed, package and temperature grade are all separate orderable variants, naming only the family or base device is not enough to place an order.

### Which FPGA should I choose for a product with a fifteen-year life?

Prioritise family longevity over headline performance. Flash-based families such as Actel ProASIC and IGLOO, and CPLD families such as MAX and MachXO, have historically had very long production lives. Beyond family choice, decide the exit plan at design time: a pin-compatible successor, a qualified second source, or a budgeted last-time-buy. Products in industrial, medical and transport markets routinely outlive the silicon they were designed around, so this belongs in the selection criteria rather than being handled later.

### What happens if my FPGA goes end-of-life mid-production?

The realistic options are a last-time-buy of enough parts to cover remaining production, sourcing through authorised aftermarket and specialty channels, migrating to a pin-compatible successor within the same family, or a redesign onto a current device. Migration is complicated by toolchain issues, since current vendor tools frequently drop support for older devices, so preserving a working build environment is part of the plan.

## Sourcing help

We cover the legacy and current programmable-logic families listed above, including obsolete devices through authorised aftermarket and specialty channels. Send the full orderable part number (device, speed grade, package and temperature grade) and we will come back with real availability, date codes and lead times rather than a family-level answer.

[**Submit an RFQ**](/rfq) | [**FPGA sourcing hub**](/fpga-sourcing) | [**Browse the catalogue**](/category)
