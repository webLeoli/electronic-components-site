---
title: "FPGA Speed Grades Explained: What -1, -2, -3 Actually Buy You"
slug: "fpga-speed-grades-explained"
status: "draft"
seoTitle: "FPGA Speed Grades Explained: -1 vs -2 vs -3 Compared"
seoDesc: "What an FPGA speed grade physically is, how Xilinx and Altera number them in opposite directions, what -1 vs -2 changes in timing and price, and how to buy."
seoKeywords: "fpga speed grade, xilinx speed grade, altera speed grade, speed grade difference, fpga timing closure, speed grade binning, XC7A35T-1 vs XC7A35T-2, fpga sourcing"
tags: "FPGA, speed grade, Xilinx, AMD, Altera, Intel, timing closure, Artix-7, Cyclone IV, sourcing"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 14
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC7A35T-1CPG236C, XC7A35T-2CPG236C, XC6SLX9-2CPG196I, XC6SLX9-3CPG196C, EP4CE22F17C6N, EP4CE22F17C8N"
---

# FPGA Speed Grades Explained: What -1, -2, -3 Actually Buy You

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~14 minutes
> **Topics**: FPGA speed grades, binning, timing closure, Xilinx, Altera, sourcing

---

**A speed grade is not a different chip. It is the same die, sorted after test into a bin whose timing the vendor is willing to guarantee — and that one suffix character moves your maximum clock rate, your unit price, and your ability to actually buy the part, all at once.** Engineers treat the speed grade as a timing-closure detail; buyers treat it as an inscrutable suffix. Both readings miss the point. The speed grade is the single character in an FPGA part number where engineering economics and sourcing economics collide, and the two vendors that dominate legacy sourcing requests number their grades in opposite directions. This guide covers what a grade physically is, exactly what changes between -1 and -2 (and what does not), the low-voltage L variants, how temperature grade multiplies the orderable-part matrix, and what a design team should specify so that the part is still purchasable five years from now.

## Key takeaways

- **Speed grades are bins, not designs.** Every grade of a given device is the same mask set and the same die; post-fabrication test sorts each unit into the fastest timing model it passes with margin.
- **Xilinx and Altera number in opposite directions.** For Xilinx/AMD, higher is faster (-3 beats -1). For Altera/Intel, lower is faster (C6 beats C8). Cross-referencing without knowing this inverts your timing budget.
- **A grade step moves every timing arc, typically 10-15% on Fmax.** Logic, routing, block RAM, DSP, I/O timing, and often maximum transceiver line rates all shift together.
- **Pinout never changes; price and availability change a lot.** Two grades of the same device are drop-in identical on the board and completely independent line items on the market.
- **Faster grades allocate first and die first.** Mid grades are produced and stocked in volume; the fastest bin is the first to disappear in a shortage and often the first grade dropped near end-of-life.
- **Spec the slowest grade that closes timing with margin, and qualify two.** A design that only closes on the fastest grade has a single point of sourcing failure written into its netlist.

---

## What a speed grade physically is

Every FPGA of a given device type starts life identical: one mask set, one process, one die. But semiconductor fabrication is statistical. Transistor threshold voltages, gate lengths, and interconnect resistance vary across a wafer and between wafer lots, so two physically identical dice come out of the fab with measurably different switching speeds. This is ordinary process variation, not a defect.

At final test, the vendor runs each unit against a series of timing models. A die that meets the tightest model — every propagation delay, every setup and hold window, at the worst-case corner of voltage and temperature for its grade — is marked as the fastest grade. A die that misses the tightest model but passes the next one down is marked one grade slower, and so on. The result is **binning**: the same product sorted into guaranteed-performance tiers, exactly as CPU vendors have done for decades.

Three consequences follow directly from this, and each one matters to sourcing:

1. **A faster-grade part is a strict superset of a slower one.** An XC7A35T-2 meets every timing number the -1 model guarantees, plus tighter ones. Substituting faster-for-slower is electrically safe; slower-for-faster is not.
2. **The grade mix is set by yield, not by demand.** The vendor cannot simply make more -3 parts when customers want them; the wafer decides what fraction of dice bin fastest. Demand spikes on the top grade therefore turn into allocation, not into increased output.
3. **The grade is tested-in, not designed-in.** There is no "-2 design" to restart if the -2 disappears from the market. When a vendor rationalizes a product line, it consolidates test flows around the grades that sell — which is why end-of-life parts so often survive in exactly one grade.

## How vendors number grades — and the inversion trap

Here is the trap that catches every engineer who crosses vendor lines, and every buyer who cross-references a bill of materials without a datasheet open.

| Vendor | Notation | Direction | Example, slowest → fastest |
| --- | --- | --- | --- |
| Xilinx / AMD | -1, -2, -3 | **Higher = faster** | XC7A35T-1 → -2 → -3 |
| Altera / Intel | -6, -7, -8 (Cyclone), -1 to -4 (Stratix/Arria) | **Lower = faster** | EP4CE22...C8N → C7N → C6N |
| Lattice | -6, -7, -8 (ECP5) | Higher = faster | LFE5U...-6 → -7 → -8 |
| Microchip / Actel | STD, -1, -2 | Higher = faster | STD → -1 → -2 |

Read that middle row again. On a Cyclone IV, the **EP4CE22F17C6N is the premium fast part** and the EP4CE22F17C8N is the slowest, cheapest, most widely stocked one. An engineer trained on Xilinx numbering who sees a "6" and mentally files it as "slow grade" has just inverted the timing budget of whatever cross-reference they were building. We see this error in real BOMs: a buyer substitutes a C8N for a C6N because "it's only a suffix," and the board fails timing in the field at temperature.

The rule when cross-referencing across vendors is mechanical: **never map grade numbers to grade numbers. Map both sides to the datasheet Fmax of a reference block** (a block RAM, a DSP path, an I/O standard) and compare those. It takes ten minutes and it is the only comparison that means anything.

## What changes between grades — and what does not

A speed grade is implemented as a complete timing model — the "speed file" the place-and-route tools read. Stepping one grade moves essentially every number in that file.

**What changes:**

| Parameter | Effect of one grade faster |
| --- | --- |
| Logic and routing delays | Shorter on every arc; typically 10-15% aggregate Fmax gain |
| Block RAM / FIFO Fmax | Higher guaranteed clock rate |
| DSP slice Fmax | Higher, often the headline spec difference |
| I/O timing | Tighter clock-to-out, shorter setup requirements |
| Memory interface rates | Higher maximum DDR2/DDR3 data rates |
| Transceiver line rates | Maximum lane rate is frequently grade-dependent |
| Unit price | Higher — often 15-30% per step at distribution |
| Availability | Thinner stock, earlier allocation in shortages |

The 10-15% figure is a working rule of thumb, not a datasheet number: the exact delta varies by device, by resource, and by which paths dominate your design. A routing-dominated design may see less benefit from a grade step than a DSP-dominated one. Treat the percentage as typical and let a trial place-and-route give you the real number — it always will, and it costs nothing.

**What does not change:**

- **The die.** Same logic cells, same block RAM, same DSPs, same transceivers. Nothing is added or removed.
- **The pinout and package.** An XC7A35T-1CPG236C and an XC7A35T-2CPG236C are drop-in identical on the PCB. No layout change, no footprint change, no BOM change beyond the line item itself.
- **The bitstream.** The same configuration file loads and runs on both grades. Whether it *meets timing* on both is a separate question answered by static timing analysis, not by whether it boots.
- **Power, almost.** At the same clock rate and voltage, dynamic power is essentially identical. Static power differs slightly: faster bins are faster because their transistors switch harder, and harder-switching transistors leak more, so a fast-grade part typically shows somewhat higher static current. For most designs the delta is noise; for battery-powered or thermally-capped designs it is worth reading the quiescent current tables per grade.

This asymmetry — nothing changes on the board, everything changes on the invoice and the stock check — is why the speed grade is the cheapest engineering variable to get right at design time and the most expensive to be casual about afterward.

## The -1L and -2L low-voltage variants

Xilinx has offered low-power "L" bins in several families: -1L in Spartan-6, -2L in the 7-series. These are not faster or slower bins in the ordinary sense; they are parts characterized to run the core at a **reduced VCCINT** (typically 0.9-0.95 V against a nominal 1.0-1.2 V, depending on family). At the reduced voltage they deliver roughly the performance of the next grade down while drawing meaningfully less static and dynamic power. Run at nominal voltage, a -2L behaves much like a -2.

From a design standpoint, L grades are a legitimate tool when the power budget is the binding constraint — sealed enclosures, passive cooling, PoE-powered equipment. From a sourcing standpoint, treat them with caution:

- **L grades are ordered by a small fraction of the customer base**, so distribution stock is thin at the best of times and lead times stretch first.
- **They complicate substitution.** A standard -2 can often stand in for a -2L electrically *if* the board's regulator is set to nominal voltage and the power budget tolerates it — but that is an engineering-approved change, not a buyer's swap.
- **Near end-of-life, L variants are among the first suffixes rationalized away.**

Our practical advice: specify an L grade only when the power analysis genuinely requires it, and if you do, document the nominal-voltage fallback substitution in the BOM from day one.

## Speed grade × temperature grade: the orderable-part matrix

The speed grade does not live alone in the part number. It multiplies against the temperature grade, and the product of the two is what you actually order.

Take the Artix-7 example: XC7A35T-**1**CPG236**C** and XC7A35T-**1**CPG236**I** share a speed grade but differ in temperature range (commercial 0 to 85°C junction versus industrial -40 to 100°C). They are tested to different corners, carry different prices, sit in different stock bins, and can reach end-of-availability independently. **A -1 commercial and a -1 industrial are different orderable parts in every way that matters to purchasing.**

Two structural facts about the matrix are worth memorizing:

- **The fastest grade usually exists only in commercial temperature.** On most Xilinx families the -3 is commercial-only; industrial tops out at -2. A design that needs industrial temperature range *and* top-bin speed has often specified a part that does not exist.
- **Substitution runs one way on each axis.** Industrial can substitute commercial (wider tested range); faster can substitute slower (superset timing). So a -2I is, electrically, a universal donor for a -1C requirement — and in shortages that is frequently the substitution that keeps a line running. It still needs engineering sign-off and a documented deviation, because the reverse swap, made silently by whoever is holding the purchase order that week, is how field failures happen.

When we process an RFQ that names only "XC7A35T," the first thing we ask for is the full suffix. A family-level part name is not a purchasable item, and quoting against the wrong grade wastes everyone's week. Send the complete orderable number through our [RFQ form](/rfq) and the quote will actually match your BOM.

## Worked example: XC7A35T-1 versus XC7A35T-2, in the timing report and on the invoice

Concrete numbers make the trade-off legible, so here is a constructed example with illustrative figures — typical of this class of design, not a specific project's timing report. Take an industrial protocol bridge on an Artix-7: 32-bit datapath, target clock 125 MHz — an 8.000 ns period.

**On the XC7A35T-1CPG236C.** First place-and-route: worst negative slack (WNS) of **-0.42 ns**. The critical path is a 34-level arithmetic-and-mux chain in the framing logic. Two paths get a pipeline register each; one comparator tree is restructured. Second run: WNS **+0.31 ns**. The design closes, with about 4% margin on the period. Engineering effort for work of this shape: roughly two engineer-weeks including regression.

**On the XC7A35T-2CPG236C, same netlist, no changes.** First place-and-route: WNS **+1.38 ns**. The grade step delivers roughly 13% more headroom on the dominant paths — squarely inside the typical 10-15% band — and the design closes untouched, with 17% margin.

Now the invoice side, using illustrative single-lot distribution pricing (real quotes move with market conditions — treat the ratio as the point, not the absolute figures):

| | XC7A35T-1CPG236C | XC7A35T-2CPG236C |
| --- | --- | --- |
| Illustrative unit price | $52 | $65 |
| Premium per unit | — | $13 (+25%) |
| Annual volume 3,000 units | $156,000 | $195,000 |
| Annual premium | — | **$39,000/yr, every year** |
| Engineering cost to close on -1 | ~2 engineer-weeks, one-time | $0 |
| Timing margin after closure | +0.31 ns (4%) | +1.38 ns (17%) |

Read the table honestly and the decision is volume-dependent. At 3,000 units a year, two engineer-weeks of pipelining pays for itself inside the first quarter, and the -1 is the right call — *provided* the 4% margin is defensible against future ECOs. At 200 units a year the premium is $2,600 annually, and burning two engineer-weeks to save it is a bad trade; take the -2 and bank the margin. And there is a third quantity the invoice does not show: the -2's 17% margin is insurance against the feature that marketing will add in eighteen months. Margin has a monetary value even though no line item carries it.

What you should *not* do is the thing that happens by default: close timing on whichever grade the eval board happened to carry, and let that accident become the production specification.

## Timing closure economics: buy margin or buy silicon

Generalizing from the worked example, the trade has three terms:

1. **The recurring premium**: (fast-grade price − slow-grade price) × annual volume × production years.
2. **The one-time engineering cost**: the effort to close timing on the slower grade — pipelining, floorplanning, restructuring — plus the regression risk of touching a working design.
3. **The margin asymmetry**: the slower grade closed with thin margin is fragile against design changes, tool-version changes, and utilization growth; the faster grade's surplus margin absorbs all three.

High-volume, cost-sensitive products should almost always spend the engineering and ship the slower grade. Low-volume, long-life industrial products should almost always spend the money and ship the margin — especially because *long-life* products are precisely the ones that will face a sourcing event, and margin is what makes a grade substitution painless when that day comes.

## Sourcing reality: which grades exist when you need them

Everything above is design-time reasoning. Here is what the market side looks like from where we sit, processing FPGA requests daily across current and end-of-life families on our [FPGA sourcing desk](/fpga-sourcing):

- **Mid grades are made and stocked in volume.** The -1 and -2 of a popular Xilinx device, or the C8/C7 of a popular Cyclone, are the liquidity pool. Franchise stock, broker stock, and excess inventory all concentrate there.
- **The fastest grade allocates first.** It is the smallest yield fraction, it is disproportionately designed into performance-critical products whose builders will pay to keep lines running, and in every shortage cycle it is the suffix that goes to zero first. In the 2021-2023 shortage, top-grade 7-series parts were quoted at multiples of list while mid grades remained findable.
- **EOL parts survive in one grade.** As a family winds down, the vendor and the channel consolidate around the best-selling suffix. Spartan-6 is the canonical case: for many XC6SLX9 package variants today, the -2 industrial (XC6SLX9-2CPG196I) is dramatically more findable than the -3 commercial, because the -2I was the volume seller into industrial designs. The design that specified the -3 now pays a scarcity premium for a grade whose only advantage was margin the design may never have needed.
- **Low-voltage and extended-temperature suffixes go quiet without announcements.** They fall below the reorder threshold of distribution and simply stop being restocked, years before any formal discontinuation notice.

**What a buyer should do about it — four concrete actions:**

1. **Spec the slowest grade that closes timing with real margin**, at the design review, and record the actual WNS per grade so the decision is auditable.
2. **Qualify two grades in the BOM.** List the primary (say -1) and the approved alternate (-2) as a pre-approved substitution with the engineering rationale attached. When the shortage comes, purchasing acts in hours instead of waiting weeks for a deviation. If your BOM tooling supports approved alternates, encode it there; our [BOM service](/bom) flags single-grade line items for exactly this reason.
3. **Check availability of the exact suffix before design freeze**, not the family. "Artix-7 is widely stocked" tells you nothing about the -3I in your specific package.
4. **For legacy parts, buy the grade that exists.** If the surviving grade is faster than your spec, it substitutes cleanly. If the surviving grade is slower, you need a timing re-analysis before anyone places a PO — and that analysis is cheaper than a field return.

## Decision rule

Here is the rule, stated plainly enough to put in a design checklist:

**Run place-and-route on the slowest available grade. If it closes with ≥10% period margin, specify that grade and list the next grade up as a pre-approved alternate. If it closes with less than 10% margin, compute (grade premium × annual volume × production years) and compare it against the one-time engineering cost of buying that margin back through pipelining; take whichever is cheaper, but never specify the fastest grade of a family unless a slower grade demonstrably cannot close — because the fastest grade is the one the market takes away first.**

And when cross-referencing between vendors: ignore the grade digits entirely and compare datasheet Fmax on a common reference block. Xilinx counts up, Altera counts down, and the suffix will lie to you if you let it.

## FAQ

### Is a higher FPGA speed grade number always faster?

Only for some vendors. Xilinx/AMD and Lattice number upward (-3 is faster than -1; -8 faster than -6 on ECP5), while Altera/Intel numbers downward (a Cyclone IV C6 is faster than a C8). When working across vendors, never compare grade digits directly — compare the guaranteed Fmax of a common resource such as block RAM in each datasheet.

### Can I substitute a faster speed grade for a slower one?

Electrically, yes: a faster grade meets every timing number the slower grade guarantees, the pinout is identical, and the same bitstream runs. It should still go through a documented engineering approval, and note the slight static-power increase on faster bins if your design is thermally or battery constrained. The reverse substitution — slower for faster — is never safe without a full timing re-analysis.

### How much faster is each speed grade step?

Typically 10-15% on achievable Fmax, but this is a rule of thumb, not a guarantee. The delta varies by device, by resource type, and by whether your critical paths are logic-, routing-, or DSP-dominated. A trial place-and-route against both speed files gives the real number for your design in an afternoon.

### Do speed grades change the FPGA's pinout or power?

Pinout, package, and footprint are identical across grades — the parts are drop-in interchangeable on the board. Dynamic power at the same clock is essentially the same; static power is slightly higher on faster bins because faster transistors leak more. Price and market availability, by contrast, differ substantially between grades.

### What are Xilinx -1L and -2L speed grades?

Low-voltage bins characterized to run the core at reduced VCCINT, trading roughly one grade of speed for meaningfully lower power. They suit power-constrained designs but are ordered in small volumes, so stock is thin and they are early casualties when a family winds down. If you specify one, document a nominal-voltage substitution path in the BOM from the start.

### Why is only one speed grade of my end-of-life FPGA still available?

As a family approaches end-of-life, production and channel inventory consolidate around the best-selling grade and the others quietly stop being restocked. If the surviving grade is faster than your specification it substitutes cleanly; if slower, a timing re-analysis is required before purchase. This is why qualifying two grades at design time is cheap insurance.

## Sourcing help

We source current and end-of-life FPGAs across every grade and temperature variant, including the suffixes that no longer show up in distribution search. Send the complete orderable part number — device, speed grade, package, temperature grade — and we will respond with real availability, date codes, and lead times for your exact variant, plus substitution options where a grade has gone scarce.

[**Submit an RFQ**](/rfq) | [**FPGA sourcing hub**](/fpga-sourcing)
