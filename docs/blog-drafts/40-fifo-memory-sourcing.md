---
title: "FIFO Memory: 70% Discontinued and Still Required"
slug: "fifo-memory-sourcing"
status: "draft"
seoTitle: "FIFO Memory Sourcing: IDT 72xx, Flags, Widths and Alternatives"
seoDesc: "FIFO memory has the highest obsolescence rate of any memory family we track. Reading IDT/Renesas part numbers, flag behaviour, sync vs async, and the FPGA replacement route."
seoKeywords: "FIFO memory sourcing, IDT 7200 FIFO, 72V FIFO obsolete, synchronous FIFO, asynchronous FIFO, FIFO flags, FIFO replacement FPGA, bidirectional FIFO"
tags: "FIFO, memory, IDT, Renesas, legacy sourcing, obsolescence, FPGA replacement"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Memory Sourcing"
relatedProducts: "72221L15PFGI8, 7283L15PAGI, 72825LB15BGG, 7205L30LB8, CY7C433-40JC, 5962-8753102XA"
---

# FIFO Memory: 70% Discontinued and Still Required

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: FIFO memory, flags, synchronous and asynchronous, legacy sourcing, FPGA replacement

---

**FIFO memory has the highest obsolescence rate of any memory family we track: of 4,136 part numbers, 2,899 are discontinued — 70%.** The reason is straightforward. A dedicated FIFO chip existed because boards needed a rate-matching buffer between two clock domains, and there was nowhere else to put one. Modern FPGAs and processors have that buffering on-chip, so nobody designs in a discrete FIFO any more. But an enormous installed base of telecom, industrial, test and broadcast equipment still uses them, and those boards are still being built and repaired. This guide covers what varies between FIFOs, how to read the part numbers, and when the FPGA route makes sense.

## Key takeaways

- **70% discontinued**: the highest rate of any memory family, because the function moved on-chip.
- **Flag behaviour is the substitution trap.** Empty, full, half-full and programmable almost-flags differ in timing and in whether they are synchronous.
- **Synchronous and asynchronous FIFOs are different components**, and the async ones are the older and scarcer group.
- **Depth × width is not the whole specification** — bus matching, retransmit and bidirectional variants exist and are not interchangeable.
- **Replacing a FIFO with FPGA logic is often viable** and sometimes the only route, but it is a board change and needs the flag semantics reproduced exactly.
- **Authorised aftermarket carries a meaningful share** of what remains.

---

## Why FIFOs became obsolete

The dedicated FIFO solved a problem that no longer needs a chip.

Its job is to buffer data between a writer and a reader that do not share a clock, or that run at different rates: a common requirement in the 1990s and 2000s when boards were built from discrete logic, DSPs and small FPGAs with little internal memory. A 512 × 9 FIFO between an ADC and a processor bus was ordinary design practice.

Today the same function is a few lines of HDL instantiating block RAM inside an FPGA that is already on the board, or a peripheral inside the microcontroller. There is no reason to add a component.

But the installed base did not disappear. Telecom line cards, semiconductor test equipment, industrial motion controllers, broadcast video gear and medical imaging systems built in that era are long-life products still in production or under support contract. They need the original part.

## Reading the part numbers

Most of the surviving devices come from the IDT lineage, now Renesas. The numbering is dense:

```
72 221 L 15 PF G I 8
│  │   │ │  │  │ │ └── Additional variant code
│  │   │ │  │  │ └──── Temperature: I = industrial
│  │   │ │  │  └────── G = green / RoHS
│  │   │ │  └───────── Package: PF = TQFP, PA = PGA, BG = BGA, LB = LCC
│  │   │ └──────────── Access/cycle time in ns
│  │   └────────────── L = low power
│  └────────────────── Device: depth and width encoding
└───────────────────── Family: 72 = IDT FIFO
```

The device-number encoding is not intuitive and varies across the family. **Do not infer depth and width from the number** — look it up. `72221`, `7283`, `72825` and `7205` are all FIFOs of quite different geometry and generation.

Also present in the space: Cypress `CY7C4xx` parts such as `CY7C433-40JC`, and military-grade parts carrying SMD numbers such as `5962-8753102XA`, which are a distinct procurement category with their own documentation requirements.

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Type | Synchronous, mainstream depths | Asynchronous, bidirectional, bus-matching |
| Depth × width | 512×9 – 32K×9 common | Very deep, very wide, unusual widths |
| Speed | Mid grades | Fastest grades |
| Package | TQFP, PLCC | PGA, LCC, ceramic |
| Grade | Commercial, industrial | Military / SMD-numbered |

## What has to match

### 1. Flag behaviour: the real trap

A FIFO's flags are its interface, and they are where substitutions fail.

Every FIFO has empty and full flags. Beyond that, variation is extensive:

| Flag | Variation between devices |
| --- | --- |
| **Empty / Full** | Synchronous to read/write clock, or asynchronous; active high or low |
| **Half-full** | Present or absent; timing relative to the boundary |
| **Almost-empty / Almost-full** | Fixed offset, or programmable — and the programming method varies |
| **Programmable offsets** | Loaded serially, in parallel, or fixed at defaults |

Two specific hazards:

Synchronous versus asynchronous flag assertion. In a synchronous FIFO the flags update on a clock edge with defined setup and hold; in an asynchronous device they change combinationally after a delay. Logic written against one will glitch or miss transitions against the other.

Almost-full offset defaults. If the original relied on a default offset value and the replacement defaults differently (or requires programming that the board never performs) the flow control breaks at exactly the point the buffer is under stress, which is the hardest condition to test.

**Check:** every flag the design uses, its polarity, whether it is synchronous, and how any programmable offset is set.

### 2. Synchronous versus asynchronous FIFOs

| | Asynchronous FIFO | Synchronous FIFO |
| --- | --- | --- |
| Control | Read and write strobes | Read and write clocks with enables |
| Flags | Combinational, delay-specified | Registered to a clock |
| Typical era | Older | Newer |
| Availability | Scarcer | Better |

They are not interchangeable. An async part in a synchronous design has no clock inputs; a sync part in an async design has no strobe interface.

### 3. Geometry and specialty variants

Beyond plain depth × width:

- **Width 9, 18, 36** rather than 8, 16, 32: the extra bit per byte carries parity or a tag, and dropping it loses a signal the design may depend on.
- **Bus-matching FIFOs** convert between widths, for example writing ×36 and reading ×9. A plain FIFO cannot substitute.
- **Bidirectional FIFOs** provide two independent channels in opposite directions in one package.
- **Retransmit capability** allows re-reading data from a marked point, used in protocol engines.
- **Depth expansion** — some parts support cascading with dedicated pins. Cascaded designs constrain the replacement further.

### 4. Timing

Access and cycle time work as for [SRAM](/blog/sram-sourcing-guide): a slower part in a design timed for a faster one produces data-dependent errors. The safe direction is a faster grade.

## The FPGA replacement route

Where an FPGA is already on the board, reimplementing the FIFO in logic is frequently the durable answer, and sometimes the only one, when no compatible device remains.

What it involves:

- **Block RAM** in the FPGA configured as a dual-clock FIFO. Every vendor provides a generator for this, and the resource cost is usually modest.
- **Reproducing flag semantics exactly**, including polarity, synchronicity and any almost-full/almost-empty offsets the surrounding logic depends on.
- **Pin availability.** The FIFO's data and control signals must reach the FPGA, which usually means a board revision unless the traces already run past it.
- **Timing closure** on the new paths.

Assess FPGA resource headroom before committing. A 32K × 36 FIFO is over a megabit of storage, which exceeds the block RAM available in small devices entirely: the selection considerations in [how to choose the right FPGA](/blog/how-to-choose-right-fpga) apply directly.

Where the board's FPGA is itself a legacy part with no spare capacity or no working toolchain, this route closes: the constraint described in [sourcing Xilinx Spartan-3](/blog/sourcing-xilinx-spartan-3-legacy).

## Sourcing paths, ranked

| Situation | Path |
| --- | --- |
| Exact part still active | Ordinary procurement — check the full suffix |
| Discontinued, authorised aftermarket available | **Buy the original.** Lowest risk, no engineering |
| Discontinued, different package/speed of same device | Usually workable; verify timing and footprint |
| Discontinued, no compatible device | FPGA reimplementation, or last-time buy of remaining stock |
| Military / SMD-numbered part in a qualified build | Original with full traceability; substitution usually prohibited |

Authorised aftermarket is productive here. `CY7C433-40JC` in our catalogue comes through Rochester Electronics — newly manufactured under licence with full traceability. For a discontinued FIFO in a long-life system, that is the outcome to check for first, as described in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Note also that some remaining stock carries `lastbuy` status — `72221L15PFGI8` is an example. **A last-time-buy window is a deadline**, and the sizing exercise in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) should start immediately when one appears on a part you depend on.

## FAQ

### Why is FIFO memory so heavily discontinued?

Because the function moved on-chip. A discrete FIFO existed to buffer data between two clock domains or rate-mismatched interfaces at a time when boards were built from discrete logic and small FPGAs with little internal memory. Modern FPGAs and microcontrollers provide that buffering natively, so no new design uses a standalone FIFO chip. Of the 4,136 FIFO part numbers we cover, 2,899 are discontinued — 70%, the highest rate of any memory family we track.

### What is the difference between a synchronous and asynchronous FIFO?

An asynchronous FIFO is controlled by read and write strobes and asserts its flags combinationally after a specified delay. A synchronous FIFO uses read and write clocks with enable signals, and its flags are registered to those clocks with defined setup and hold times. They are not interchangeable: an asynchronous part has no clock inputs and a synchronous part has no strobe interface, and logic written against one will glitch or miss transitions against the other.

### What should I check when substituting a FIFO?

Flag behaviour above all: which flags the design uses, their polarity, whether they are synchronous or combinational, and how any programmable almost-full or almost-empty offsets are set. Then geometry — depth, width, and whether the width includes a ninth or eighteenth parity bit the design depends on. Then whether the original was a specialty variant such as bus-matching, bidirectional or retransmit-capable, since a plain FIFO cannot substitute for those. Finally, access and cycle time.

### Why does a FIFO substitution fail only under load?

Usually because of an almost-full or almost-empty offset mismatch. If the original relied on a default offset and the replacement defaults differently, or requires programming that the board never performs, the flow control between writer and reader breaks, but only when the buffer approaches its limits, which is precisely the condition light testing does not reach. Flag timing differences between synchronous and combinational assertion produce a similar load-dependent signature.

### Can I replace a FIFO with FPGA logic?

Often, and where no compatible device remains it may be the only route. Every FPGA vendor provides a generator that configures block RAM as a dual-clock FIFO, and the resource cost is usually modest. The work is in reproducing the flag semantics exactly (polarity, synchronicity and any offsets the surrounding logic depends on) plus getting the signals to the FPGA, which typically means a board revision. Check block RAM headroom first: a 32K × 36 FIFO exceeds a megabit and will not fit in a small device.

### What does the 9-bit or 18-bit width mean on a FIFO?

The extra bit beyond a byte or half-word boundary carries parity, a tag, or a framing marker, depending on the design. It is a real signal the surrounding logic may depend on, so substituting a plain 8-bit-wide FIFO for a 9-bit part silently drops it. Widths of 9, 18 and 36 bits are common in the telecom and networking equipment where these devices were most used.

### Are discontinued FIFOs available through authorised aftermarket?

Yes. It is worth checking first. Some remaining FIFO stock in our catalogue comes through Rochester Electronics (CY7C433-40JC for example) meaning newly manufactured parts under licence with full traceability and no requalification requirement. For a discontinued FIFO inside a long-life telecom or test system, that is a considerably better outcome than either an open-market purchase or an FPGA reimplementation.

### What should I do if a FIFO shows last-time-buy status?

Treat it as a deadline and start immediately. Last-time-buy status means orders will be accepted only until a stated date, after which the part is gone permanently. Size the buy against remaining production plus spares and repair demand over the full support obligation, not against next year's build — for the long-life equipment these parts sit in, spares demand frequently exceeds remaining production volume.

## Related reading

The family-level picture is in [memory IC sourcing](/blog/memory-ic-sourcing-guide), with [SRAM sourcing](/blog/sram-sourcing-guide) covering the closest relative. Where the FPGA replacement route is being considered, [how to choose the right FPGA](/blog/how-to-choose-right-fpga) covers resource assessment. For the sourcing channel, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), and for a last-time-buy window, [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

Send us the part number with the flag behaviour and geometry your design depends on, and we will come back with what is genuinely available — including authorised aftermarket stock.

[**Submit an RFQ**](/rfq) | [**Browse FIFO memory**](/category/fifo-memory) | [**Upload a BOM**](/bom)
