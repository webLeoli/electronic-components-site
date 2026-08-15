---
title: "Glue Logic in 2026: CPLD vs Small FPGA vs 74-Series vs GAL, Measured"
slug: "glue-logic-cpld-vs-small-fpga-vs-74-series"
status: "draft"
seoTitle: "Glue Logic Selection: CPLD 66% Obsolete — What Replaces It, and Why"
seoDesc: "Exactly one CPLD family is still healthy at 12% inactive, and its toolchain is discontinued. Why the CPLD's replacement is a small flash FPGA, and when three single-gate packages beat all of them."
seoKeywords: "CPLD obsolete replacement, GAL22V10 replacement, ATF22V10C available, CoolRunner-II ISE support, MachXO3 vs CPLD, MAX 7000 obsolete, single gate logic glue, 5V tolerant CPLD alternative"
tags: "comparison, glue logic, CPLD, FPGA, 74-series logic, GAL, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 17
category: "FPGA Design & Integration"
relatedProducts: "XC2C32A-6VQG44C, XC2C64A-7VQG44C, ATF22V10C-15PU, ATF22V10C-10JU, ATF22V10CQZ-20JU, GAL22V10D-15LJI, XC9572-15TQG100C, SN74LVC1GU04DBVT"
---

# Glue Logic in 2026: CPLD vs Small FPGA vs 74-Series vs GAL, Measured

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~17 minutes
> **Topics**: the one healthy CPLD family and why it is still the wrong answer, the 22V10 footprint's survivor, 5 V tolerance as the real migration blocker, when three gates beat a programmable part

---

**The CPLD is the most obsolete form factor in programmable logic (4,639 part numbers at 66% inactive, worse than FPGAs at 46%) and the family-level breakdown says something more useful than the headline.** Measured 2026-08-11: Altera MAX 3000 (`EPM3`) is **98% inactive**, MAX 7000 (`EPM7`) 85%, Lattice ispMACH 4000 (`LC4`) 69%, Xilinx XC9500 (`XC95`) 52%, and Xilinx CoolRunner-II (`XC2C`) is **12%**.

So one CPLD family is still healthy. **And it is still usually the wrong choice for a new design, for a reason that has nothing to do with silicon: CoolRunner-II is supported by ISE, which is no longer developed, and Vivado does not target CPLDs at all.** That is the exact inversion described in our [FPGA family evaluation](/blog/fpga-family-selection-long-life); the parts are available and the build environment is not.

This article compares the four things you can actually put in a glue-logic slot, with the measurement behind each, and identifies the option most teams forget.

## Key takeaways

- **`cplds` is 66% inactive**, the worst programmable-logic form factor. Within it, `EPM3` 98%, `EPM7` 85%, `LC4` 69%, `XC95` 52%, `XC2C` **12%**.
- **The one healthy CPLD family has a discontinued toolchain.** No CPLD is both available and supported by a current tool.
- **The CPLD's real replacement is a small flash-based FPGA** (MachXO3 (`LCMXO3L`) at 5% inactive, MAX 10 (`10M02`) at 7%) because both keep instant-on non-volatile behaviour *and* have a current toolchain.
- **5 V tolerance is the migration blocker**, not logic capacity. Old CPLDs tolerated 5 V I/O; modern small FPGAs do not.
- **The 22V10 footprint has a survivor.** Lattice `GAL22V10` is **92% inactive**, but Microchip's Atmel-heritage `ATF22V10C` ordering codes are active, which is the opposite direction to the usual acquired-line pattern.
- **Single-gate logic is the forgotten option and the healthiest of all.** `SN74AUP1G` is **6% inactive**, `SN74LVC1G` 18%. If the glue is six gates, three SOT-23 packages beat every programmable part on cost, power, area and availability.
- **Count the macrocells you actually use before choosing.** Most GAL designs use fewer than ten registers.

---

## What the catalogue says

Measured 2026-08-11, by family rather than by category, because the category average hides the whole story.

| Family | Class | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `SN74AUP1G` | Single-gate logic, AUP | 236 | **6%** |
| `LCMXO3L` | Small flash FPGA (MachXO3) | 241 | **5%** |
| `10M02` | Small flash FPGA (MAX 10) | 14 | 7% |
| `XC2C` | CPLD (CoolRunner-II) | 109 | **12%** |
| `SN74LVC1G` | Single-gate logic, LVC | 638 | 18% |
| `GAL20V8` | PLD | 64 | 53% |
| `XC95` | CPLD (XC9500) | 354 | 52% |
| `LC4` | CPLD (ispMACH 4000) | 825 | 69% |
| `ATF22V10` | PLD (Atmel heritage) | 79 | 72% |
| `GAL16V8` | PLD | 68 | 75% |
| `ATF16V8` | PLD (Atmel heritage) | 60 | 77% |
| `EPM7` | CPLD (MAX 7000) | 656 | 85% |
| **`GAL22V10`** | **PLD** | 52 | **92%** |
| **`EPM3`** | **CPLD (MAX 3000)** | 94 | **98%** |

Category level: `cplds` 4,639 parts at 66% inactive, `fpgas` 24,901 at 46%, `gates-inverters` 15,167 at 27%.

One caution on reading this table. `PALCE` measures 2% inactive across 41 part numbers, which looks like a healthy PLD family and is too small a population to conclude anything from. The families above with hundreds of ordering codes are the ones whose rates mean something: the same population-size discipline set out in the [obsolescence data study](/blog/ic-obsolescence-data-study).

## Why people reach for a CPLD, and whether each reason survives

Three reasons account for nearly every CPLD in a design. Only one of them still has a CPLD-shaped answer.

### Reason 1 — instant-on, non-volatile behaviour

A CPLD configures from internal non-volatile storage and is functional within microseconds of its rail coming up. That is why CPLDs ended up doing power sequencing, reset supervision, board-level state machines and bus arbitration: those jobs must work before anything else on the board is alive.

This reason survives completely. It is answered by small flash-based FPGAs. MachXO3 and MAX 10 both hold their configuration in on-chip flash and are instant-on, so they inherit the role directly. They also remove an external boot device, which matters given that `EPCS` is 100% inactive and 204 `W25Q` ordering codes are in last-time buy — see the [configuration flash analysis](/blog/fpga-boot-flash-design-longevity).

An SRAM-based FPGA cannot take this role without a boot device and a configuration delay, which is the point of the distinction.

### Reason 2 — 5 V tolerance

This is the reason the older parts persist. It is the migration blocker. GAL devices, 5 V XC9500 variants and MAX 7000S parts interface directly with 5 V logic. MachXO3, MAX 10 and CoolRunner-II do not — their I/O is 3.3 V at most.

So a GAL16V8 sitting between two 5 V devices cannot be replaced by a small FPGA without adding level translation on every signal that touches 5 V, and that translation has its own cost, its own availability question and its own direction-control problem. The [level shifter selection guide](/blog/level-shifter-selection-guide) covers the choice; `translators-level-shifters` measures 2,476 part numbers at 43% inactive, so it is not a free move.

Practical consequence: for a 5 V design you cannot re-architect, the answer is often to keep the PLD footprint and find an active part for it, which brings us to the 22V10 finding below.

### Reason 3 — pin count and I/O flexibility

This reason mostly does not survive contact with the actual design. A GAL22V10 offers ten macrocells; a GAL16V8 offers eight. Most designs built on them use fewer registers than that, because the parts were chosen for availability and familiarity rather than sized to a requirement.

Count the macrocells your design actually uses before choosing a replacement class. If the answer is six gates and one flip-flop, the correct replacement is discrete logic, and the rest of this article's comparison is unnecessary.

## The 22V10 footprint has a survivor

Lattice `GAL22V10` is 92% inactive and every high-stock ordering code we list is obsolete — `GAL22V10D-15LJI`, `GAL22V10D-5LJN`, `GAL22V10D-7LJ`. Microchip's Atmel-heritage `ATF22V10C` codes are active: `ATF22V10C-15PU`, `ATF22V10C-10JU`, `ATF22V10CQZ-20JU`.

For anyone maintaining a board with a 22V10 in it, that is the single most useful sentence in this article. The footprint, the JEDEC fuse-map programming model and the 5 V interfacing all carry over.

It is also worth noting because it runs opposite to the pattern we found in EEPROM. There, Microchip kept its own `24LC` line at 2% inactive and pruned the acquired Atmel `AT24C` line to 68%. Here the acquired Atmel PLD line is the one that survived while the originator's died. **The rule is therefore not "acquired lines die"; it is "measure the family, because the direction is not predictable from the corporate history".** The `ATF22V10` family as a whole still measures 72% inactive, so this is a case where specific ordering codes are active inside a heavily-pruned family, and the code is what you must check.

Two caveats before relying on it:

- **The toolchain is legacy.** Programming these devices uses long-standing Atmel PLD tooling and JEDEC fuse maps. Fine for reproducing an existing design; a poor foundation for a new one.
- **Availability is at ordering-code level.** Confirm the specific speed grade and package before committing — [send it through as an RFQ](/rfq) and we will check current stock, including aftermarket lineage.

## The option most teams forget: single-gate logic

`SN74AUP1G` is 6% inactive across 236 ordering codes: the healthiest family in this entire comparison, better than any programmable part. `SN74LVC1G` is 18% across 638.

Single-gate packages put one gate, inverter, buffer or flip-flop in a SOT-23, SC-70 or smaller outline. Where the glue logic is genuinely a handful of gates, they win on every axis simultaneously:

| | Single-gate logic | Small flash FPGA | Legacy CPLD/PLD |
| --- | --- | --- | --- |
| Availability | **6-18% inactive** | 5-7% | 52-98% |
| Static current | **Microamps (AUP)** | Microamps to milliamps | **Milliamps to tens of milliamps** |
| Toolchain | **None** | Current vendor tool | Discontinued or legacy |
| Board area for 6 gates | 3 small packages | One BGA/QFN | One PLCC/TQFP |
| Unit cost | **Cents** | Dollars | Dollars |
| Changeable after layout | No | **Yes** | Yes |
| 5 V tolerance | Available in some families | No | Often yes |

The static-current row is worth dwelling on. Older CPLD architectures use sense amplifiers on product terms that draw current continuously, so a legacy CPLD can consume milliamps to tens of milliamps doing nothing: a serious cost in a battery or always-on design, and a common surprise when an old design is power-budgeted for the first time. AUP logic and flash-based FPGAs are microamp-class at rest.

What you give up is post-layout flexibility, and that is the real reason to accept a programmable part: if the glue logic will change during bring-up or across product variants, a programmable device saves a respin. For fixed, understood logic, discrete gates are the better engineering answer and the [74-series decode guide](/blog/74-series-logic-decode-guide) plus [gates and inverters sourcing](/blog/gates-inverters-sourcing-guide) cover the selection.

## The decision table

| If your situation is | Choose | Why |
| --- | --- | --- |
| Six gates or fewer, logic is fixed | **Single-gate logic (`74AUP1G`)** | 6% inactive, microamp static, cents, no toolchain |
| Instant-on board management, new design | **MachXO3 or MAX 10** | Instant-on preserved, current toolchain, 5-7% inactive |
| Logic will change during bring-up | **Small flash FPGA** | Post-layout flexibility is the reason to pay |
| 5 V interfacing, existing board, cannot redesign | **`ATF22V10C` or `ATF16V8` active codes** | The footprint survives; check the ordering code |
| 5 V interfacing, new design | **Small FPGA plus level translation** | Budget the translators; 43% inactive as a category |
| Replacing an obsolete MAX 7000 or MAX 3000 | **MAX 10** | Same vendor lineage, current tool; `EPM3` is 98% gone |
| Replacing an obsolete XC9500 | **MachXO3 or MAX 10** | CoolRunner-II is available but ISE-only |
| Existing CoolRunner-II design, still building | **Keep it, archive ISE** | 12% inactive is fine; the toolchain is the risk |
| More than ~100 macrocells | **Small or mid-range FPGA** | Beyond the CPLD envelope anyway |
| Radiation or security requirement | **SmartFusion2 / IGLOO2** | Flash-based, 8% inactive |

## Migrating an existing CPLD design

Four steps, in this order.

1. **Count what the design actually uses** — macrocells, registers, product terms, I/O, and whether any signal is 5 V. This determines the class of replacement, and it frequently reveals that the part was oversized.
2. **Check whether the exact ordering code is still active** before assuming migration. `XC2C` at 12% and active `ATF22V10C` codes mean some designs need no change at all. `XC9572-15TQG100C` is an example of one that does — obsolete, with stock, which is a last-time-buy conversation rather than a redesign.
3. **Decide on the 5 V question next**, because it governs everything after it. If 5 V I/O is required and the design cannot change, the PLD footprint with an active part is usually cheaper than a small FPGA plus translators.
4. **Then pick the target**, using the table above, and archive the toolchain deliberately — including its licensing and a host OS it installs on. For a CPLD migration this is not optional: every legacy CPLD tool is discontinued or legacy, and the [FPGA family evaluation](/blog/fpga-family-selection-long-life) shows why that criterion moves a family's score more than anything else.

For the sourcing side (what remains available, aftermarket lineage and inspection of legacy PLDs) see [Altera MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths) and [Lattice MachXO and ECP sourcing](/blog/lattice-machxo-ecp-sourcing). Current status by part number is on the [CPLD](/category/cplds) and [FPGA](/category/fpgas) category pages.

## Frequently asked questions

### Is the CPLD dead as a product category?

As a choice for new designs, effectively yes, not because of availability but because of toolchains. The one family with healthy silicon, CoolRunner-II at 12% inactive, is supported by ISE, which is no longer developed, and Vivado does not target CPLDs. Everything else is 52-98% inactive. The role CPLDs filled is now filled better by small flash-based FPGAs, which keep instant-on behaviour and have current tools.

### What replaces a MAX 7000 or MAX 3000?

MAX 10 is the direct answer, keeping the same vendor lineage, instant-on flash configuration and a current Quartus toolchain. `EPM3` measures 98% inactive and `EPM7` 85%, so this is a migration rather than a sourcing exercise for most designs. The blocker to check first is 5 V interfacing: MAX 7000S parts tolerate 5 V I/O and MAX 10 does not.

### My board has a GAL22V10. Is there anything still available?

Yes — Microchip's Atmel-heritage `ATF22V10C` ordering codes are active while Lattice's `GAL22V10` is 92% inactive. The footprint, the 5 V interfacing and the JEDEC fuse-map programming model carry over. Confirm the specific speed grade and package, because the wider `ATF22V10` family still measures 72% inactive — active codes exist inside a pruned family, so the code matters more than the family name.

### Should I use a small FPGA or discrete gates for glue logic?

Count the gates first. Six gates or fewer, with logic that will not change, favours single-gate packages: `SN74AUP1G` is 6% inactive, draws microamps at rest, costs cents and needs no toolchain. Choose a small FPGA when the logic will change during bring-up, when there are variants to support from one board, or when the function is genuinely a state machine rather than combinational glue.

### Why do old CPLDs consume so much static current?

Because their product-term arrays use sense amplifiers that draw current continuously, independent of switching activity. That makes a legacy CPLD a poor fit for battery or always-on designs. It is a common surprise when an old design is power-budgeted for the first time. Flash-based small FPGAs and AUP-family logic are microamp-class at rest, which is often a bigger practical difference than logic capacity.

### Can I keep using CoolRunner-II if it is only 12% inactive?

For an existing design, yes, and archive ISE deliberately, including its licensing mechanism and a host operating system it will still install on. For a new design the silicon availability is real but you would be starting on a discontinued toolchain with no migration path, when MachXO3 at 5% inactive and MAX 10 at 7% offer the same instant-on behaviour on current tools.

### How do I handle 5 V logic if I move to a modern part?

Add level translation and budget it properly, or keep the PLD footprint. Modern small FPGAs are 3.3 V maximum on I/O, so every 5 V signal needs a translator with the right direction-control behaviour, and `translators-level-shifters` measures 2,476 part numbers at 43% inactive, so it is not a free substitution. For an existing 5 V board that cannot be re-architected, an active `ATF22V10C` or `ATF16V8` code is frequently the cheaper answer.

### Does a small FPGA cost more than a CPLD?

Per unit, usually yes; per design, frequently no. A MachXO3 or MAX 10 removes the external boot device an SRAM FPGA would need, has a current toolchain that does not need archiving, draws far less static current, and gives post-layout flexibility that can save a respin. Against a legacy CPLD that needs a discontinued tool and may need a last-time buy, the unit price is not the decisive number.

## Sources

Availability figures are our own measurement across 719,342 catalogue part
numbers, dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`.
Status is a snapshot and is checked at ordering-code level, which is the level at
which purchasing operates.

- **Toolchain support horizon.** Vivado targets 7-series FPGAs and newer and does
  not target CPLDs at all; ISE 14.7 is the last release and the only supported
  tool for CoolRunner-II (`XC2C`) and XC9500 (`XC95`), and for Spartan-6.
  ISE is no longer developed. [amd.com](https://www.amd.com/en/products/software/adaptive-socs-and-fpgas/ise-design-suite.html)
- Vendor documentation for the current small-FPGA families — Lattice Diamond and
  Radiant for MachXO2/MachXO3, Intel Quartus Prime for MAX 10 — for the
  instant-on configuration behaviour and I/O voltage limits that decide the
  5 V question.
- Device datasheets for static supply current. Legacy CPLD architectures draw
  continuous current in their product-term sense amplifiers, which is why their
  quiescent consumption is orders of magnitude above flash-based small FPGAs and
  AUP-family logic; compare the specific devices rather than the categories.
