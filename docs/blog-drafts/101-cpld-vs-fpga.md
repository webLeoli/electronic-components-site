---
title: "CPLD vs FPGA: The Differences That Decide Real Designs"
slug: "cpld-vs-fpga"
status: "draft"
seoTitle: "CPLD vs FPGA: Architecture, Cost, and EOL Compared"
seoDesc: "CPLD vs FPGA: macrocell vs LUT architecture, instant-on config, price bands, where each wins, and EOL status of MAX 7000, XC9500 and CoolRunner-II."
seoKeywords: "cpld vs fpga, difference between cpld and fpga, what is a cpld, cpld applications, max 7000 eol, xc9500 replacement, machxo2, max 10"
tags: "CPLD, FPGA, Xilinx, AMD, Altera, Intel, Lattice, MAX 7000, XC9500, MachXO2, selection guide, sourcing"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 16
category: "FPGA & CPLD Sourcing"
relatedProducts: "EPM240T100C5N, EPM3064ATC44-10N, XC9536XL-10VQG44C, LCMXO2-1200HC-4TG100C, 10M08SAE144C8G, XC2C64A-7VQG44C"
---

# CPLD vs FPGA: The Differences That Decide Real Designs

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: CPLD architecture, instant-on configuration, deterministic timing, MAX 10, MachXO2, CPLD EOL status

---

**A CPLD is not a small FPGA, and the designs that treat it as one usually discover the difference at power-up.** The two device classes differ in architecture (product-term macrocells vs LUT fabric), in configuration (non-volatile and instant-on vs SRAM loaded from external flash), in timing character (fixed pin-to-pin delays vs place-and-route-dependent paths), and — increasingly relevant — in lifecycle, because the classic CPLD families that anchor thousands of legacy boards are now EOL or NRND while their replacements blur the CPLD/FPGA boundary entirely. This guide covers the real differences, where each device class wins, the gray zone occupied by MAX 10 and MachXO2, and what the discontinuation of MAX 3000/7000, XC9500 and CoolRunner-II means if those parts are on your bill of materials.

## Key takeaways

- **Architecture is the root difference**: a CPLD is a small number of macrocells fed by wide AND/OR product-term arrays through a predictable central interconnect; an FPGA is a large array of small LUTs and flip-flops in segmented routing.
- **Instant-on is the CPLD's defining behavior.** Configuration lives on-chip in non-volatile memory; the device is functional microseconds after power, with no external flash and no boot window.
- **CPLD timing is deterministic by construction** — a MAX 3000A-class part quotes a fixed ~4.5-10 ns pin-to-pin delay that barely moves with design changes. FPGA timing depends on place-and-route.
- **The classes barely overlap in size and price**: 32-512 macrocells at roughly $0.50-5 for CPLDs, versus thousands-to-millions of LUTs from ~$5 to four figures for FPGAs.
- **The gray zone is real**: MAX 10 and MachXO2/XO3 are LUT-based FPGAs with on-die configuration flash — instant-on FPGAs that have absorbed most new "CPLD" sockets.
- **Lifecycle is now a first-order input**: MAX 3000A/7000 and XC9500/XC9500XL are discontinued and CoolRunner-II is not recommended for new designs, so boards carrying them need a sourcing plan, not just a resistor-level [BOM](/bom) check.

---

## What a CPLD actually is

The CPLD architecture descends from the PAL/GAL devices of the 1980s. The building block is the **macrocell**: a flip-flop plus output logic fed by a wide AND-OR structure. Inputs enter a programmable AND array that forms **product terms** — each one an AND of many inputs or their complements — and a fixed OR gate sums a handful of product terms (typically 5, expandable by borrowing from neighbors) into the macrocell. A device like the EPM3064ATC44-10N is 64 of these macrocells grouped into logic array blocks, tied together by a central switch matrix that gives every signal a similar, predictable path to every macrocell.

Three properties fall out of this structure:

- **Wide, shallow logic is nearly free.** A 16-input address decoder is one product term — a single pass through the array. The same function in 4-input LUTs is a tree of several LUT levels and routing hops.
- **Timing is uniform.** Because every path crosses the same array-matrix-macrocell structure, the datasheet quotes one pin-to-pin number (tPD = 10 ns for that EPM3064A suffix; faster grades reach 4.5 ns) and it holds regardless of how the fitter arranges your logic.
- **Capacity is small and register-poor.** One flip-flop per macrocell means a 64-macrocell device holds at most 64 bits of state. Counters, decoders and state machines fit; datapaths and FIFOs do not — there is no block RAM at all.

## What an FPGA is, by contrast

An FPGA inverts every one of those choices. The building block is a small lookup table (4-6 inputs) paired with one or two flip-flops, replicated thousands to millions of times, plus dedicated block RAM and multiplier/DSP columns, all connected by segmented programmable routing. Logic depth costs LUT levels and routing delay, so timing depends on where the tools placed things — the static timing report, not the datasheet, tells you your speed. Registers are abundant (roughly one per LUT), which is why pipelined datapaths are natural in fabric and impossible in a CPLD.

And critically for system design: mainstream FPGAs hold their configuration in **SRAM**. The pattern evaporates at power-down and must be reloaded from an external flash at every power-up, taking milliseconds to hundreds of milliseconds, during which the I/O pins are not running your logic.

## Configuration and start-up: the decisive difference

For most sockets that genuinely call for a CPLD, this single row of the comparison decides it.

| | Classic CPLD (MAX 7000/3000, XC9500XL, CoolRunner-II) | SRAM FPGA (Spartan, Cyclone, Artix...) |
| --- | --- | --- |
| Configuration storage | On-chip EEPROM/flash | Off-chip flash, loaded at power-up |
| Time to functional | Microseconds ("instant-on") | Milliseconds to hundreds of ms |
| Pins during boot | Driving your logic almost immediately | High-Z or weak pull-ups until config completes |
| Extra BOM items | None | Config flash + its rail and layout |
| Config corruption/readback risk | Minimal attack/failure surface | Bitstream integrity is a real design topic |

Consider a power-sequencing controller. Its entire job exists *before and during* the power-up of everything else on the board: hold regulators disabled, release them in order, gate the processor's reset. An SRAM FPGA cannot take this job — it is not configured yet while the job is happening, and its floating pins during the boot window are precisely the hazard the sequencer exists to prevent. The CPLD is awake in microseconds, driving deterministic levels, with no dependency on any other rail or memory being up. No amount of FPGA capacity substitutes for being present at time zero.

## Deterministic timing, in numbers

A worked example makes the timing difference concrete. Suppose you need address decoding plus a chip-select qualifier between a legacy processor bus and three peripherals, with 12 ns from address-valid to chip-select.

- **On an EPM3064ATC44-10N**: the function is a few product terms; tPD is 10 ns, printed in the datasheet, for any function that fits in one pass. You can verify the budget on paper before writing a line of HDL, and it will not change when someone adds a fourth peripheral next year.
- **On a small FPGA**: the same function is easily fast *after* place-and-route confirms it — perhaps 6 ns, perhaps 14 ns if the fitter scattered the logic, and the number can shift on any recompile of the whole design. You constrain it and the tools obey, but the guarantee is per-build, not per-datasheet.

That per-datasheet quality is why CPLDs persist in bus translation, memory-decode retrofits and test equipment: the timing analysis is done once, by the vendor.

## Density and price bands

The two classes barely overlap commercially, which simplifies the decision more than architecture debates do.

| Device class | Logic capacity | Typical 1k-unit price band | Representative parts |
| --- | --- | --- | --- |
| Small CPLD | 32-72 macrocells | $0.50-2.50 | XC9536XL-10VQG44C, XC2C64A-7VQG44C, EPM3064ATC44-10N |
| Large CPLD / CPLD-class flash | 128-570 macrocell-equivalents | $2-6 | EPM240T100C5N (MAX II), CoolRunner-II 256 |
| Non-volatile small FPGA (the gray zone) | 1k-25k LUTs/LEs | $3-15 | LCMXO2-1200HC-4TG100C, 10M08SAE144C8G |
| Mainstream SRAM FPGA | 6k LEs to millions of cells | $5 to four figures | Cyclone IV, Spartan-6/7, Artix, and up |

(Legacy and EOL lines trade well above these bands on the open market — an obsolete XC9500XL variant can cost more than a MachXO2 with fifty times the capacity, purely on scarcity.)

The practical reading: below roughly 500 flip-flops of state and no RAM requirement, the CPLD class is cheaper, simpler to power, and instant-on. Above a few thousand LUTs, or with any block RAM or DSP need, only FPGAs exist. The gray zone in between has been taken over by the non-volatile FPGAs, covered below.

## Where CPLDs win

The recurring CPLD sockets, and why the architecture fits each:

- **Power sequencing and supervision.** Present at time zero, no external dependencies, deterministic outputs. Often the only programmable device that is *allowed* to hold this role, for the boot-window reasons above.
- **Reset and boot control.** Gating a processor's reset against multiple conditions (rails good, watchdog, front-panel) is a handful of product terms that must work before anything else boots.
- **Glue logic consolidation.** Replacing five or six 74-series packages — decode, gating, polarity fixes — with one 44-pin CPLD that can also absorb next month's ECO without a board respin.
- **Bus and level translation.** Wide decode in one product-term pass, fixed pin-to-pin delay, and (on 5V-tolerant families like XC9500XL and MAX 3000A) direct interfacing to legacy 5 V buses that modern FPGAs cannot touch without external translators.
- **Security-conscious simple logic.** No external bitstream to intercept or corrupt; the configuration never leaves the die.

## Where FPGAs win

Just as unambiguously:

- **Anything with a datapath**: filters, protocol framers, video, DSP — needs registers in the hundreds-to-thousands and multipliers a CPLD simply does not have.
- **Anything needing memory**: FIFOs, buffers, line stores — block RAM is an FPGA-only resource.
- **Fast serial interfaces and modern I/O standards**: DDR memory, LVDS at speed, transceivers.
- **Anything that will grow.** A CPLD at 80% macrocell utilization is a dead end; the next family member up is another 44-pin device with double the macrocells at best. FPGA families scale across an order of magnitude in the same footprint in many packages.
- **Soft processors and complex state.** Even a small control CPU is thousands of LUTs.

## The gray zone: MAX 10 and MachXO2 blur the line honestly

Here is the part vendors' marketing tends to fudge, so let's be precise. The **10M08SAE144C8G (Intel MAX 10)** and the **LCMXO2-1200HC-4TG100C (Lattice MachXO2)** carry CPLD-adjacent branding and occupy classic CPLD sockets, but architecturally they are **LUT-based FPGAs with configuration flash on the die**. The MAX 10 in that part number is 8,000 logic elements with block RAM, an ADC and a flash block; the MachXO2-1200 is 1,280 LUTs with embedded block RAM and hardened I2C/SPI/timer functions.

What they inherit from each side:

- **From the CPLD**: non-volatile on-die configuration, near-instant-on (MachXO2 is functional in about a millisecond; MAX 10 similar — microseconds-class it is not, but the external flash and boot window are gone), single-chip BOM.
- **From the FPGA**: LUT fabric (so timing is place-and-route-dependent, not datasheet-fixed), real capacity, block RAM, PLLs — and FPGA-style tooling.

What they give up relative to a true product-term CPLD: the fixed pin-to-pin timing guarantee, 5 V tolerance, and the sub-dollar price floor. A wide 5 V-bus decode with a hard 10 ns budget is still genuinely a macrocell-CPLD problem; almost everything else that used to be one is now better served by these parts. That is the honest summary: **the gray-zone devices have absorbed most new CPLD sockets, and the remaining true-CPLD sockets are mostly legacy-interface and time-zero roles.** It is also why these two families are among the healthiest lines in our [FPGA and CPLD sourcing catalog](/fpga-sourcing) — they are where the new designs went.

## Lifecycle: the classic CPLD families are leaving, and it changes the decision

If you are comparing CPLD vs FPGA for a *new* design, the discontinuation map below should be an input, not a footnote. If you *maintain* boards built on these families, it is the whole story.

| Family | Vendor | Status | Sourcing implication |
| --- | --- | --- | --- |
| MAX 3000A / MAX 7000 (EPM3064A, EPM7128...) | [Altera](/manufacturer/altera) / Intel | **EOL — discontinued**, last-time-buy windows closed | Open-market and aftermarket stock only; counterfeit screening essential on the 5 V parts |
| MAX II (EPM240, EPM570) | Altera / Intel | Mature, still active | The default drop-in class for many MAX 7000 migrations |
| XC9500 (5 V) | [Xilinx](/manufacturer/xilinx) / AMD | **EOL** for years | Pure aftermarket; high counterfeit exposure |
| XC9500XL (3.3 V, e.g. XC9536XL) | Xilinx / AMD | **EOL — discontinued** | Stock exists but is finite and drawn down; plan the exit now |
| CoolRunner-II (XC2C64A...) | Xilinx / AMD | **NRND** — not recommended for new designs | Still orderable; do not design it in, do plan migrations |
| MachXO2/XO3 | Lattice | Active | Primary migration target for Xilinx CPLD sockets |
| MAX 10 | Intel / Altera | Active | Primary migration target for larger Altera CPLD sockets |

The consequences we see weekly on the sourcing desk:

1. **The EOL families sit on boards that were designed precisely *because* CPLDs live forever** — industrial, transport, medical, defense. Those products are still in production; their sequencer chip is not. That mismatch is the single most common CPLD RFQ we receive.
2. **Migration is rarely a drop-in.** MAX 7000 to MAX II changes voltage (5 V/3.3 V to a core-plus-I/O scheme), package options and fitting behavior; XC9500XL to MachXO2 changes vendor, tools and pinout. Budget a small requalification, not a line-item swap.
3. **5 V-tolerance dies with these families.** No active programmable-logic family replaces the direct-5 V interfacing of XC9500 and MAX 3000A. Migrations off 5 V buses need level translators added to the board — which is sometimes the moment teams choose a last-time-buy of the original CPLD instead.
4. **Counterfeit pressure concentrates exactly here.** Cheap, EOL, in steady demand and easy to remark: legacy CPLDs check every box. Provenance, date-code coherence and inspection matter more per dollar on a $3 EPM3064A than on a $300 Virtex.

## The decision rule

Feature tables do not ship boards, so here is the rule we actually apply:

**Choose a classic CPLD** (MAX II, or aftermarket MAX 7000/XC9500XL for legacy sustainment) **when** the logic must be alive at time zero — power sequencing, reset gating, boot control — or must meet a fixed pin-to-pin timing number verifiable from a datasheet, or must touch 5 V legacy buses directly, and the whole function fits in a few hundred macrocells with no RAM.

**Choose a non-volatile FPGA** (MachXO2/XO3, MAX 10) **when** you like the CPLD's single-chip, no-boot-flash story but need real capacity — more than a few hundred flip-flops, any block RAM, a PLL, hardened I2C/SPI — and can tolerate about a millisecond of wake-up instead of microseconds. This is the correct default for *new* "CPLD-shaped" designs.

**Choose an SRAM FPGA when** the design has a datapath, memory, DSP or growth ahead of it, and something else on the board (or the FPGA's own config flash arrangement) can cover the boot window. Capacity, I/O speed and scaling are unmatched; time-zero behavior is the one thing it can never do.

**And if the part is already on your board and EOL**: decide between a last-time-buy sized to remaining production and a migration to MachXO2/MAX 10 — explicitly, with dates, rather than discovering the choice when stock runs out.

## FAQ

### What is a CPLD used for today?

Power sequencing, reset supervision, boot control, glue-logic consolidation and legacy bus/level translation — roles where instant-on behavior, deterministic timing or 5 V tolerance matter more than capacity. New designs increasingly use non-volatile FPGAs (MachXO2, MAX 10) for the same sockets; true macrocell CPLDs persist mostly in sustainment of existing boards.

### What is the main difference between a CPLD and an FPGA?

Architecture and configuration. A CPLD is a small array of macrocells fed by wide product-term logic, with configuration stored on-chip — it is functional microseconds after power-up and its pin-to-pin timing is fixed by the datasheet. An FPGA is a large array of LUTs and flip-flops whose SRAM configuration loads from external flash at power-up, giving it far more capacity but a boot window and place-and-route-dependent timing.

### Are CPLDs obsolete?

The classic families largely are: Intel's MAX 3000A/7000 and Xilinx's XC9500/XC9500XL are discontinued, and CoolRunner-II is NRND. But the *device class* is not — MAX II remains active, and the non-volatile FPGAs (MachXO2/XO3, MAX 10) carry the instant-on role forward with more capacity. Boards built on the EOL families need a last-time-buy or migration plan.

### Can a MAX 10 or MachXO2 replace my old CPLD?

Functionally, almost always — they are larger and instant-on in the practical sense (about a millisecond to functional). The gotchas are 5 V tolerance (gone; add translators), pinout and package (different; board change), fixed pin-to-pin timing (replaced by per-build timing closure), and toolchain (Quartus/Diamond instead of the legacy fitters). Treat it as a small redesign with requalification, not a cross-reference swap.

### Why do CPLDs handle power sequencing instead of FPGAs?

Because an SRAM FPGA does not exist as a logic device until its configuration loads — milliseconds after power, from an external flash, with I/O undefined in between. A sequencer must be driving known levels before and during that window. A CPLD's on-chip non-volatile configuration makes it functional in microseconds with no external dependencies, which is exactly the requirement.

## Sourcing help

We hold and source the full spread discussed here: active MachXO2 and MAX 10 lines, mature MAX II and CoolRunner-II, and the EOL MAX 3000A/7000 and XC9500/XL families through authorized aftermarket and vetted independent channels with date codes and provenance documentation. Send the exact orderable part number — device, speed grade, package, temperature grade — and quantities, including last-time-buy volumes you want priced.

[**Submit an RFQ**](/rfq) | [**FPGA & CPLD sourcing hub**](/fpga-sourcing)
