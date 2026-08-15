---
title: "FPGA vs Microcontroller: Which One Does Your Design Actually Need?"
slug: "fpga-vs-microcontroller"
status: "draft"
seoTitle: "FPGA vs Microcontroller: How to Decide, With Numbers"
seoDesc: "FPGA or MCU? A sourcing engineer compares latency math, unit-cost crossover, power, toolchain cost, SoC hybrids and lifecycle — ending in a decision table."
seoKeywords: "fpga vs microcontroller, fpga vs mcu, difference between fpga and microcontroller, when to use fpga, soc fpga, zynq vs mcu, fpga cost comparison"
tags: "FPGA, microcontroller, MCU, Xilinx, AMD, Altera, Intel, STM32, Zynq, selection guide, sourcing"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 17
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC7Z010-1CLG400C, STM32F103C8T6, XC6SLX9-2CPG196I, EP4CE6E22C8N, ATMEGA328P-PU, 5CSEBA6U23I7"
---

# FPGA vs Microcontroller: Which One Does Your Design Actually Need?

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: FPGA vs MCU, latency and determinism, unit cost, power, SoC FPGAs, lifecycle

---

**"FPGA vs microcontroller" is not a performance question; it is a question about the shape of your problem.** A microcontroller executes one instruction stream and time-slices everything through it. An FPGA is a fabric of logic that does everything you built, every clock cycle, in parallel. Most designs that agonize over this choice are actually MCU designs with one hard real-time corner — and most of the remainder are FPGA designs whose team is only comfortable writing C. This guide works through the differences that actually decide: the latency math, the unit-cost crossover, power, toolchain and team cost, the hybrid parts that let you stop choosing, and the lifecycle differences that determine whether you can still buy the part in year twelve.

## Key takeaways

- **The architectural difference is parallel fabric vs sequential CPU.** An MCU does one thing at a time very fast; an FPGA does a thousand things at once, each modestly fast. Everything else follows from this.
- **Determinism, not throughput, is the usual reason to pick an FPGA.** An MCU interrupt responds in hundreds of nanoseconds with microseconds of worst-case jitter; an FPGA pipeline responds in a fixed number of clocks, every time.
- **The unit-cost comparison flips with volume and workload.** A $2 MCU beats a $10 FPGA until the workload needs three MCUs, an MCU plus external logic, or a rate no MCU can hit.
- **Team cost usually exceeds silicon cost.** C firmware engineers are plentiful and iterate in seconds; RTL engineers are scarcer and iterate in tens of minutes of place-and-route.
- **SoC FPGAs (Zynq, Cyclone V SoC) and MCU + CPLD combos mean "both" is a real answer**, and often the right one.
- **Lifecycle profiles differ.** Mainstream MCUs carry 10-15-year longevity commitments; FPGA families EOL as fabrication processes retire, which changes how you plan the [BOM](/bom).

---

## The architecture difference, stated plainly

A microcontroller is a CPU core — a Cortex-M, an AVR, a RISC-V — bonded to flash, SRAM and a set of fixed-function peripherals. Software runs as a single instruction stream (or a few, on multi-core parts). When five things need to happen "at once," the core time-slices between them using interrupts and a scheduler. The peripherals (timers, UARTs, ADCs, DMA) provide some true concurrency, but only for the functions the vendor hardened into silicon.

An FPGA is the opposite construction: an array of small lookup tables (LUTs), flip-flops, block RAMs and DSP slices connected by programmable routing. There is no instruction stream. You describe hardware in an HDL, the tools place and route it, and after configuration the device *is* that hardware. If you build forty state machines, all forty run on every clock edge, simultaneously, forever. Concurrency is not scheduled; it is physical.

Two consequences fall straight out of this:

- **An MCU's performance degrades as you add tasks.** Every new interrupt source and every new loop steals cycles from everything else. An FPGA's existing logic is untouched by new logic until you run out of fabric or routing.
- **An MCU's behavior is easy to change and hard to make exactly repeatable.** An FPGA's behavior is exactly repeatable (it is synchronous hardware) and slower to change (every edit is a synthesis and place-and-route run).

Neither property is a virtue in the abstract. The question is which one your design needs.

## The latency and determinism math

This is where the decision usually gets made, so it is worth doing the arithmetic honestly rather than trading adjectives.

### The MCU side: interrupt latency plus jitter

Take an STM32F103C8T6 — a Cortex-M3 at 72 MHz, probably the most-cloned MCU in history. The core's architectural interrupt entry is 12 cycles, which is 167 ns at 72 MHz. That is the *best case*. Real response time adds:

- **Flash wait states.** At 72 MHz the F103 runs its flash with 2 wait states; the prefetch buffer hides most of it, until it doesn't.
- **A higher-priority or currently executing ISR.** If a same-or-higher-priority handler is running, your interrupt waits for it. Tail-chaining helps, but a 5 µs handler ahead of you is 5 µs of added latency.
- **Critical sections.** Every `disable_irq()` in the firmware, including inside vendor libraries and the RTOS kernel, adds its length to your worst case.
- **Bus contention.** DMA transfers and the CPU share the bus matrix.

The honest number for a well-written bare-metal F103 design is roughly **0.2-0.5 µs typical response with a worst case of 2-10 µs** depending on what else the firmware does — and the worst case is what a control loop or a protocol deadline cares about. Under an RTOS, add scheduler latency: waking a task rather than responding in the ISR typically costs 1-10 µs more. The critical point is that the worst case is a property of the *whole firmware image*, so it can silently regress with any code change, and proving a bound requires analysis or measurement of everything that can preempt you.

### The FPGA side: a clocked pipeline

Now the same event handled in fabric on, say, an XC6SLX9 or EP4CE6E22C8N clocked at 100 MHz. The signal is registered on the next clock edge (worst case one period, 10 ns), passes through however many pipeline stages you designed — three stages is 30 ns — and the response asserts. Total: **40 ns worst case, and the same 40 ns every single time**, independent of what the other 90% of the fabric is doing. The static timing report is a proof, not an estimate: if the design meets timing at 100 MHz, that latency bound holds over voltage, temperature and process for the speed grade you bought.

That is a factor of 50-250× on worst-case latency, but the more important ratio is the jitter: microseconds of variability on the MCU against **zero cycles of variability** in fabric. For motor commutation, laser or ultrasound pulse timing, CCD/CMOS sensor readout, protocol framers, and anything where a deadline miss is a field failure rather than a hiccup, that is the whole argument.

### The honest counterpoint

Most embedded workloads do not care. A 10 µs jitter on a task that runs every 10 ms is 0.1% and invisible. MCU vendors have also hardened the common hard-real-time cases into peripherals: advanced motor-control timers with dead-time insertion, quadrature decoders, CAN controllers, ADC triggers slaved to timers. If a hardened peripheral covers your critical path, the MCU's jitter problem disappears for that path. The FPGA case begins where the peripheral list ends: nonstandard protocols, many parallel channels, pixel- or sample-rate processing, and picosecond-class timing relationships between pins.

## Throughput: where the crossover actually sits

Raw clock speed favors nobody — a 72-480 MHz MCU core against a fabric that closes timing at 50-200 MHz on the families in this article. The FPGA wins on *width*, not speed. A Cortex-M4 doing a 16-bit multiply-accumulate per cycle at 168 MHz delivers ~168 M MAC/s. An EP4CE6 has 15 hardware 18×18 multipliers; at a modest 100 MHz that is 1.5 G MAC/s from the smallest member of a low-cost family, and mid-size parts carry hundreds of DSP slices. When the workload is a filter bank, a video pipeline, or 32 channels of anything, the MCU needs to run its one ALU 32 times faster; the FPGA just instantiates 32 copies.

The corollary: if your workload fits in one MCU with headroom, the FPGA's parallelism is capacity you paid for and will not use.

## Unit cost: the real crossover

Catalog pricing at moderate volume, as of this writing, for the parts on this article's related list:

| Part | What it is | Typical 1k-unit price band | Hidden adders |
| --- | --- | --- | --- |
| ATMEGA328P-PU | 8-bit AVR, 20 MHz | $1.30-2.50 | Essentially none |
| STM32F103C8T6 | Cortex-M3, 72 MHz | $1.50-3.00 | None (internal flash, single rail) |
| EP4CE6E22C8N | Cyclone IV E, ~6k LEs | $5-12 | Config flash ~$1, second rail, sequencing |
| XC6SLX9-2CPG196I | Spartan-6, ~9k logic cells | $8-18 | Config flash, 2-3 rails, BGA assembly |
| XC7Z010-1CLG400C | Zynq-7000 SoC (2× Cortex-A9 + fabric) | $40-90 | DDR3, PMIC, boot flash — a computer, not a chip |
| 5CSEBA6U23I7 | Cyclone V SoC (2× Cortex-A9 + fabric) | $60-130 | Same class of adders as Zynq |

Note that legacy and allocation-market pricing on the FPGA lines moves much more than the MCU lines — these are bands, not quotes, and the exact orderable suffix matters. The pattern to take away:

- **At the bottom, the MCU wins by 3-6× on the chip and more at board level.** The MCU needs one rail and no configuration device. The SRAM-based FPGA needs a configuration flash, two or three rails, and usually sequencing between them.
- **The crossover comes from consolidation.** The FPGA earns its price when it replaces an MCU *plus* external logic (encoder counters, protocol ASICs, a lattice of glue), or when the workload would force two or three MCUs and the interconnect and firmware complexity between them, or when the alternative is a much more expensive application processor.
- **A worked example.** A 16-channel quadrature-encoder acquisition board: an STM32F103 has 4 usable encoder timers, so the MCU route is four F103s (~$8) plus an interconnect and four firmware images to synchronize — or one F103 plus dedicated counter ICs such as LS7366R at roughly $4-6 *each*, which is $65-100 of counters. One EP4CE6 at ~$8 plus $1 of config flash takes all 16 channels with identical logic instantiated 16 times, latched on one clock edge. The FPGA is the cheap option here, and it is not close.

Do this arithmetic on your own bill of materials before deciding; the answer is workload-specific. Our [BOM review service](/bom) exists partly because teams discover this crossover after layout rather than before.

## Power

The MCU wins low power decisively, and the margin is orders of magnitude at idle:

- A modern MCU sleeps at **single-digit microamps** with RAM retention and wakes in microseconds. Coin-cell products are built on this.
- An SRAM-based FPGA has **static current in the milliamps to tens of milliamps** just being configured, before it does anything. It must reconfigure after any power-down (tens of ms from flash), so duty-cycling the supply costs you the instant response you bought the FPGA for. There is also a configuration inrush to budget for.
- Flash-based FPGAs and CPLD-class parts narrow the gap (microamp-class static current, instant-on) but do not close it to MCU sleep levels for battery products.

Per unit of *work*, the picture inverts: a filter that saturates a 168 MHz MCU at 100 mW may fit in a corner of an idle fabric and cost 20 mW of dynamic power. So: battery-powered and duty-cycled products lean strongly MCU; line-powered products doing heavy parallel work can be *more* efficient on an FPGA.

## Toolchain and team cost — usually the biggest line item

Silicon cost is visible in the BOM; engineering cost is not, which is why it decides more projects than it should.

| | MCU | FPGA |
| --- | --- | --- |
| Language | C/C++, huge talent pool | VHDL/Verilog, meaningfully scarcer talent |
| Tools | Free (GCC, vendor IDEs) | Vivado/Quartus free tiers cover these small parts; licenses for larger ones |
| Edit-test loop | Seconds to compile and flash | Minutes to tens of minutes of synthesis + place-and-route |
| Debug | printf, GDB, cheap trace | Simulation first, then embedded logic analyzers (ILA/SignalTap) |
| Verification culture | Test what matters | Testbench everything; a fabric bug can be a board respin |

Two practical notes. First, the iteration-speed difference compounds: a firmware engineer might try thirty ideas in a day; an RTL engineer with a 25-minute build tries a dozen, which is why disciplined simulation is not optional in FPGA work. Second, the free-tool boundary matters at sourcing time — all six parts on this article's related list are covered by free tool editions, but stepping up to larger devices adds a per-seat annual license that belongs in your project budget, not discovered later.

If your team has no RTL experience, budget a real ramp (months, not weeks) or contract the fabric design — and remember that the *maintenance* of that RTL over a 10-year product life needs an owner too.

## The hybrid options: when the answer is "both"

The choice stopped being binary years ago, and pretending otherwise produces bad architectures. Three patterns cover most real systems:

### 1. SoC FPGA: hard ARM cores plus fabric on one die

The XC7Z010-1CLG400C (Zynq-7000: dual Cortex-A9 at 667 MHz-1 GHz plus Artix-class fabric) and the 5CSEBA6U23I7 (Cyclone V SoC: dual Cortex-A9 plus 110k-LE-class fabric) put a genuine software processor and a genuine FPGA on one chip, connected by wide AXI ports instead of a board-level bus. The software side runs Linux or an RTOS and does the 90% of the product that is bookkeeping, networking and UI; the fabric does the 10% that is hard real time or high throughput. The cost is real: DDR memory, a PMIC, boot flash and a bring-up effort closer to a single-board computer than to a microcontroller. Choose an SoC FPGA when you need both a real OS and real fabric and you can amortize that platform effort. Both families are well established in [Xilinx](/manufacturer/xilinx) and [Altera](/manufacturer/altera) sourcing channels, which matters for the long-tail years.

### 2. MCU + small FPGA/CPLD: the pragmatic two-chip split

Keep the STM32 (team knows it, tools are free, low power works) and put the one nasty timing problem — the encoder bank, the custom serial protocol, the pixel clock — into a small fabric part like an XC6SLX9 or a CPLD, talked to over SPI or a parallel bus. Each chip does what it is good at, each can be sourced and revised independently, and the firmware team's world does not change. This is the most common architecture we see in industrial RFQs, by a wide margin.

### 3. Soft cores: an MCU inside the FPGA

MicroBlaze, Nios II, or a RISC-V core instantiated in fabric gives you a control processor without a second package. Useful for housekeeping inside an FPGA-centric design; a poor way to *replace* an MCU (a soft core consumes significant fabric to deliver 1990s-class CPU performance, and you now maintain a CPU subsystem in RTL). Choose a soft core for supervisory logic inside a design that is an FPGA anyway; choose a hard MCU when software is a main character.

## Lifecycle and sourcing: the difference nobody prices in at design time

This is the part of the comparison we live in daily, and it cuts differently than most engineers expect.

**MCUs have institutionalized longevity.** ST's rolling 10-year longevity commitment covers the STM32F103; Microchip's practice is longer still — the ATMEGA328P has been orderable for over 15 years and remains active. Mainstream MCUs also have a second-source ecosystem of clones and near-clones (the GD32F103 story), which is simultaneously a sourcing safety valve and a counterfeit-risk complication.

**FPGAs EOL by family, tied to fabrication process.** When a foundry node retires, the whole family built on it goes: Spartan-3 and the early Cyclone generations are already in last-time-buy history, Spartan-6 and Cyclone IV are deep into maturity with rising legacy pricing, while AMD has publicly committed 7-series/Zynq-7000 production into the mid-2030s. The pattern to internalize: an FPGA family's remaining life is set by its *process node's* economics, not by demand for your part, and the EOL takes every speed grade, package and temperature variant of the family with it.

Three planning consequences:

1. **A 15-year industrial product on an FPGA needs an exit plan at design time** — a pin-compatible larger family member, a planned last-time-buy, or a budgeted redesign window. On an MCU, the same product usually just needs the vendor's longevity letter in the design file.
2. **Toolchain preservation is an FPGA-specific liability.** Current Vivado does not target Spartan-6; sustaining that design means maintaining ISE 14.7 on an old OS image. MCU toolchains (GCC) effectively never strand you.
3. **The allocation behavior differs.** In shortages, MCUs go scarce broadly but recover; legacy FPGAs go scarce *permanently* once the LTB window closes, and pricing reflects it. This is precisely the market our [FPGA sourcing desk](/fpga-sourcing) works: verified stock of mature and EOL programmable logic with date codes and provenance.

## The decision table

| If your design... | Choose | Because |
| --- | --- | --- |
| Fits one MCU's peripherals with headroom | MCU | Cheapest silicon, cheapest team, fastest iteration |
| Needs µA sleep / battery life | MCU | FPGA static power is disqualifying |
| Has one hard real-time corner an MCU peripheral covers | MCU | Hardened timers/CAN/encoders solve it for free |
| Has hard deadlines no peripheral covers, or needs bounded jitter you must *prove* | FPGA | Static timing analysis is a proof; firmware worst cases are not |
| Processes many parallel channels or sample/pixel-rate data | FPGA | Width beats clock speed |
| Implements a nonstandard or legacy protocol | FPGA | You cannot buy that peripheral |
| Needs a real OS **and** hard real-time fabric | SoC FPGA (Zynq / Cyclone V SoC) | One die, AXI instead of a board bus |
| Is 90% comfortable MCU work with one nasty timing problem | MCU + small FPGA/CPLD | Isolate the hard part; keep the team productive |
| Must be buildable for 15 years | Check lifecycle *first* | MCU longevity programs vs FPGA family EOL cycles change the answer |

And as decision rules rather than a bare table: **choose a microcontroller when** the workload is sequential, the peripherals cover your real-time corners, power or cost floors matter, and your team ships C — which is most products. **Choose an FPGA when** you must prove a latency bound, process wide parallel data, or implement logic nobody sells as a peripheral — and the silicon and team premiums are covered by consolidation or by requirements an MCU cannot meet at any price. **Choose both** — an SoC FPGA or a two-chip split — when the product genuinely contains both kinds of problem, which describes more industrial designs than either purist answer.

## When "both" is the design: a short worked example

Consider a representative motor-drive retrofit controller. Requirements: Ethernet/IP connectivity with a web UI (software problem), plus six-axis commutation at 50 kHz loop rate with synchronized ADC sampling across axes to under 100 ns (fabric problem). An MCU-only architecture needs three high-end MCUs and still cannot *prove* the cross-axis sampling bound — it can only measure it and hope. An FPGA-only architecture buries the networking stack in a soft core that somebody then has to maintain as RTL. The clean answer is one Zynq XC7Z010 — Linux and the network stack on the A9 cores, six commutation pipelines and one ADC sequencer in fabric, a documented AXI register map between them. The BOM line rises by a few tens of dollars over the three-MCU version; the engineering budget drops by an integration layer, a synchronization scheme, and the respin that scheme would eventually have cost. This trade — hard real-time margins on one side, a maintainable software platform on the other — is exactly the situation SoC FPGAs exist for.

## FAQ

### Is an FPGA faster than a microcontroller?

Per instruction stream, no — MCU cores clock as fast or faster than small-FPGA fabric. An FPGA is faster whenever the work parallelizes: it can instantiate dozens of datapaths that all run every cycle, and it responds to events in a fixed number of clocks rather than through interrupt latency. For sequential control code, the MCU is the faster and vastly cheaper tool.

### Can an FPGA replace a microcontroller?

Technically yes — via a soft core like MicroBlaze, Nios II or RISC-V — but it is usually the wrong trade. The soft core consumes fabric, delivers modest CPU performance, and turns your firmware platform into RTL you must maintain. Replace an MCU with fabric only when the MCU work is trivial housekeeping inside a design that is an FPGA anyway; otherwise use a hard-core SoC FPGA or two chips.

### When should I use an FPGA instead of an MCU?

When you must *prove* a timing bound rather than measure one; when the data is wide and parallel (many channels, pixel or sample rates); when the protocol or interface does not exist as a peripheral; or when one FPGA consolidates an MCU plus a pile of external logic. If none of those apply, the MCU is almost always the right answer on cost, power and team velocity.

### What is an SoC FPGA and when is it worth it?

A device with hard ARM cores and FPGA fabric on one die — Zynq-7000 (e.g., XC7Z010-1CLG400C) and Cyclone V SoC (e.g., 5CSEBA6U23I7) are the established families. Worth it when the product needs both a real OS and provable-latency fabric, and you can absorb a platform bring-up (DDR, PMIC, boot flash) closer to a single-board computer than a microcontroller.

### Which is easier to source long-term, an MCU or an FPGA?

Different risks. Mainstream MCUs carry 10-15-year vendor longevity commitments and often have second sources, but suffer broad allocation crunches. FPGAs EOL as whole families when their fabrication process retires — every package and speed grade at once — and never come back, so they demand a last-time-buy or migration plan. Check the lifecycle status of the *exact orderable part number* before committing either way.

## Sourcing help

We stock and source the parts discussed here — from ATMEGA328P and STM32F103 through Spartan-6, Cyclone IV, and the Zynq and Cyclone V SoC families — including EOL variants through authorized aftermarket and vetted independent channels. Send the full orderable part number (device, speed grade, package, temperature grade) and target quantity, and we will respond with real availability, date codes and lead times.

[**Submit an RFQ**](/rfq) | [**FPGA sourcing hub**](/fpga-sourcing)
