---
title: "Obsolescence Watch, August 2026: Inside the 5,178 Part Numbers You Can Still Buy — But Not for Long"
slug: "obsolescence-watch-2026-08"
status: "draft"
seoTitle: "Obsolescence Watch August 2026: 5,178 Parts in Last-Time Buy, Measured"
seoDesc: "Two manufacturers hold 42% of every active last-time-buy notice in our 719,342-part catalogue — but the two concentrations mean opposite things. Measured 2026-08-11."
seoKeywords: "last time buy list 2026, EOL notices semiconductor 2026, obsolescence watch, Renesas last time buy, ROHM ML610Q EOL, Torex XC6224 last time buy, W25Q last time buy, BOM lifecycle risk report"
tags: "industry data, last-time buy, obsolescence, BOM scrubbing, first-party data, EOL"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Industry Data & Obsolescence Watch"
relatedProducts: "W25Q64FVSSBQ, ML610Q102-NNNMBZ0ATL, XC6224A271NR-G, 8T49N244A-999ASGI, 71V424S10YGI8, 74FCT163245APFG8, ISL32704EIAZ, S25FL256LAGBHN033"
---

# Obsolescence Watch, August 2026: Inside the 5,178 Part Numbers You Can Still Buy — But Not for Long

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: the last-time-buy window measured by vendor, category and family; two opposite kinds of concentration; what to scrub first

---

**Last-time buy is the only lifecycle state in which a purchasing decision still changes the outcome.** An obsolete part is already gone; an active part needs no decision. Between them sits a window in which a manufacturer has announced end-of-life and is still accepting final orders, and across the 719,342 part numbers we list, **5,178 are in that window as at 2026-08-11, with 5,177 of them showing stock, totalling 40,928,194 units.**

This is the first in a dated series that measures that window rather than the obsolete population. The [IC obsolescence data study](/blog/ic-obsolescence-data-study) is the static census of what has already gone — 34.4% of the catalogue. This report is about the part you can still act on, and it will be re-measured, because a last-time-buy window closes.

The headline finding repeats a concentration first noticed in the census: **two manufacturers account for 42% of every active last-time-buy notice.** The new finding is that the two concentrations mean opposite things, and a bill of materials scrub that treats them the same will misjudge both.

## Key takeaways

- **5,178 part numbers are in an active last-time-buy window**, 5,177 with recorded stock, 40,928,194 units.
- **Renesas holds 1,460 and ROHM 727 — 42% between them.** Adding Intersil, which Renesas owns, takes the Renesas lineage to **1,861, or 36% of the entire window on its own**.
- **ROHM's 727 are 725 parts from two MCU families** (`ML610Q`, `ML620Q`). One product line exiting: deep impact on few bills of materials.
- **Renesas' 1,861 span more than ten categories** — SRAM, MCUs, clock generation, FIFOs, DC-DC controllers, op-amps, logic. Portfolio-wide pruning: shallow impact on almost every bill of materials.
- **95% of all SRAM in the window is Renesas lineage** (365 of 384), and 98% of all FIFO memory (101 of 103).
- **Torex (the healthiest vendor in the census at 8% inactive) now has 318 part numbers in the window**, 270 of them `XC6224` LDOs.
- **Winbond's 251 are serial NOR flash** (`W25Q16/32/64/80/128`), the boot device covered in [the configuration flash analysis](/blog/fpga-boot-flash-design-longevity).
- **By rate rather than count, AC-DC converters lead at 2.8%** of the category in the window.

---

## Method, and what these numbers are not

The population. Every part number in our catalogue as at 2026-08-11: 719,342 rows. The lifecycle status field takes one of four values, sourced from manufacturer lifecycle data and distributor status at ingest:

| Status | Count | Meaning |
| --- | ---: | --- |
| `active` | 471,587 | In production |
| `obsolete` | 242,575 | No longer produced by the original manufacturer |
| **`lastbuy`** | **5,178** | **End-of-life announced, final orders being accepted** |
| `nrnd` | 2 | Not recommended for new designs |

This report concerns the `lastbuy` row only. Reproduce any figure below with `scripts/measure-catalogue.mjs`.

Five limitations that matter:

1. **Part numbers are not devices.** One device in four packages, three temperature grades and two packing options is eight rows. This inflates counts for vendors who sell many variants, which is the main reason to read the vendor table as a ranking rather than as a market share.
2. **The catalogue is a sample, not the market.** It over-represents what a sourcing business is asked for. Comparisons between vendors and categories are what to trust, because the bias applies roughly evenly.
3. **We do not publish end-of-life dates.** The status field records that a notice exists, not when the window closes. **Never treat "in last-time buy" as "there is still time" without confirming the actual date with the manufacturer or distributor** — some of these windows have days left. Reading the notice itself is covered in [PCN and PDN guide](/blog/pcn-pdn-discontinuation-notice-guide).
4. **Stock figures are a snapshot** and include material held across the supply chain, not a single warehouse.
5. **Absence from this list is not safety.** A manufacturer can issue a notice tomorrow, and 242,575 part numbers have already passed through this window and out the other side.

What the numbers are good for: deciding the order in which to scrub a bill of materials, and calibrating which vendor lineages carry concentrated risk. **What they are not good for:** concluding that a specific ordering code is or is not still orderable. That requires checking that code.

## Where the window is concentrated

By manufacturer, top of the list, measured 2026-08-11:

| Manufacturer | Part numbers in window | Share of 5,178 |
| --- | ---: | ---: |
| **Renesas** | 1,460 | 28.2% |
| **ROHM Semiconductor** | 727 | 14.0% |
| **Intersil** (Renesas-owned) | 401 | 7.7% |
| Torex Semiconductor | 318 | 6.1% |
| onsemi | 270 | 5.2% |
| Winbond Electronics | 251 | 4.8% |
| Texas Instruments | 227 | 4.4% |
| Maxim Integrated | 202 | 3.9% |
| Rochester Electronics | 186 | 3.6% |
| Micron Technology | 128 | 2.5% |
| Analog Devices | 109 | 2.1% |
| NXP Semiconductors | 105 | 2.0% |

Renesas plus Intersil is 1,861 part numbers — 36% of the entire window under one corporate roof. The census already showed that obsolescence tracks acquisition history: acquired portfolios (Intersil 66% inactive, Micron 71%, Spansion 70%, Cypress 64%) obsolete far faster than independents still investing in catalogue lines (Torex 8%, ABLIC 8%, Linear 10%). This report shows the mechanism still running.

## The two concentrations mean opposite things

This is the analytical core of the report, and it changes what you do about each vendor.

### ROHM: one product line leaving

ROHM's 727 part numbers break down as:

| Family | Part numbers | What it is |
| --- | ---: | --- |
| `ML610Q` | 404 | LAPIS 8/16-bit MCU |
| `ML620Q` | 321 | LAPIS 16-bit MCU |
| everything else | 2 | — |

725 of 727 — 99.7% — are two families of the same MCU line. This is not a company pruning its catalogue; it is a business exiting a product area. The consequence for a bill of materials is binary: either you use a LAPIS MCU, in which case you have a migration project with no in-family target, or you do not, in which case ROHM's 14% share of this window is irrelevant to you.

An MCU exit is also the most expensive kind of obsolescence to absorb, because the replacement is never a drop-in: different core, different peripherals, different toolchain, requalification of firmware. `ML610Q102-NNNMBZ0ATL` has 14,607 units showing against it, which sounds comfortable until you divide it by an annual build.

### Renesas: a catalogue being pruned everywhere at once

The same 1,861 part numbers of Renesas lineage distribute across categories like this:

| Category | Part numbers in window | Share of that category's window |
| --- | ---: | ---: |
| SRAM | 365 | **95%** of all 384 |
| Microcontrollers | 279 | 24% of 1,178 |
| Clock generators & PLLs | 272 | 74% of 366 |
| Clock/timing (filed under application-specific processors) | 140 | 97% of 145 |
| FIFO memory | 101 | **98%** of 103 |
| DC-DC switching controllers | 80 | 58% of 138 |
| Special-purpose ICs | 78 | 86% of 91 |
| Op-amps | 76 | 48% of 157 |
| Drivers, receivers & transceivers | 39 | 15% of 267 |
| Clock buffers & drivers | 38 | 79% of 48 |

This is the IDT and Intersil acquisitions being rationalised: IDT contributed the SRAM (`71V424`, `71V124`), the FIFOs, the clock generation (`8T49N2`) and the FCT logic (`74FCT1`); Intersil contributed the analogue (`ISL327x` interface, `ISL284x`).

The practical difference from the ROHM case is that almost every mixed-signal bill of materials contains something from this list, and the exposure is one or two line items rather than a whole design. That makes it cheap to fix and easy to miss.

Two findings from this table are worth acting on directly:

- **If your design has asynchronous or synchronous SRAM, 95% of the SRAM last-time-buy risk in our catalogue is one vendor lineage.** Check the IDT-heritage part numbers first; that is the highest-yield scrub in this report. Background in [SRAM sourcing](/blog/sram-sourcing-guide).
- **FIFO memory is 98% concentrated.** FIFOs were already the most obsolete memory category at 73% inactive; the remaining active supply is being pruned by essentially one company. If a FIFO is in a design you must keep building, this is the moment to plan, not later. See [FIFO memory sourcing](/blog/fifo-memory-sourcing).

## The new signal: Torex

Torex Semiconductor was one of the healthiest vendors in the census at 8% inactive, and it now has 318 part numbers in the last-time-buy window — 6% of the whole window.

| Family | Part numbers | What it is |
| --- | ---: | --- |
| `XC6224` | 270 | LDO regulator |
| `XC92xx` (several) | ~30 | DC-DC converters |
| others | ~18 | — |

Every `XC6224` ordering code we list is in the window — 270 of 270. Not a
subset being pruned: the whole family, at once. `XC6224A271NR-G` and its siblings
are small, cheap, high-accuracy LDOs of the kind that appears three or four times
on a modern board, and a vendor with a reputation for supporting catalogue parts
retiring an entire LDO family is worth noting for two reasons.

First, **a low overall obsolescence rate does not predict the absence of a current notice.** The census measures history; this report measures announcements in force. They answer different questions, and a BOM scrub needs both.

Second, **LDO obsolescence is usually easy to absorb and easy to get wrong.** The pin-out and package are typically common, so the substitution looks trivial, but output voltage option, dropout, quiescent current, enable polarity and output capacitor stability requirements are all encoded in the ordering code. That is the subject of [LDO cross-reference](/blog/ldo-cross-reference-guide). It is the reason a "trivial" LDO swap sometimes produces an unstable rail.

## Serial NOR flash: the boot device again

Winbond's 251 part numbers in the window are `W25Q16`, `W25Q32`, `W25Q64`, `W25Q80` and `W25Q128` — precisely the densities used to boot FPGAs and load MCU firmware. Adding Cypress/Infineon's `S25FL` contribution (21) and Microchip's `SST25` (4), the serial NOR total is 276.

This is the same finding as our [configuration flash analysis](/blog/fpga-boot-flash-design-longevity), from the opposite direction. That article measured the obsolete population and found the boot device obsoleting several times faster than the FPGA it serves (`N25Q` 93% inactive, `M25P` 98%, `EPCS` 100%) against Artix-7 at 6%. This report shows the pruning continuing in the family that replaced them.

The engineering response is the one that article argues for: make the flash substitutable rather than trying to secure a specific part. A loader that reads SFDP and adapts turns each of these 276 notices into a purchasing decision instead of a firmware release.

## The window by category

By count, the largest blocks:

| Category | In window | Category size | Rate |
| --- | ---: | ---: | ---: |
| Microcontrollers | 1,178 | 101,457 | 1.2% |
| SRAM | 384 | 17,613 | 2.2% |
| Clock generators & PLLs | 366 | 32,305 | 1.1% |
| Linear regulators (LDO) | 357 | 67,881 | 0.5% |
| Flash memory | 330 | 15,689 | 2.1% |
| Drivers, receivers & transceivers | 267 | 19,068 | 1.4% |
| DC-DC switching regulators | 185 | 36,234 | 0.5% |
| Op-amps | 157 | 28,323 | 0.6% |
| DC-DC switching controllers | 138 | 11,167 | 1.2% |
| AC-DC converters | 122 | 4,291 | **2.8%** |
| FIFO memory | 103 | 4,136 | 2.5% |

Read this table twice, once by count and once by rate. By count, microcontrollers dominate, which is unsurprising in a 101,457-part category. By rate, **AC-DC converters lead at 2.8%**: a small category with a high proportion under notice, driven by onsemi's `NCP101x` integrated offline switchers among others. That combination, high rate in a small category, is where a scrub finds problems fastest.

Memory as a whole contributes 817 part numbers across SRAM, flash and FIFO, consistent with memory being the most obsolete branch of the catalogue at 49%.

## What to do with this

A scrub ordered by yield rather than by BOM line number. Roughly an hour for a typical board.

1. **Filter your bill of materials by vendor lineage first.** Renesas, IDT, Intersil, ROHM LAPIS, Torex, Winbond, onsemi offline switchers. That single pass covers 36% of the window on the Renesas lineage alone. This is the highest-yield step. It is a spreadsheet operation, not an engineering one.
2. **Then filter by category rate.** AC-DC converters, FIFO memory, SRAM, flash memory — highest proportion under notice.
3. **For every hit, get the actual notice.** The status field says a notice exists; the notice says when the window closes and what the replacement is, if any. [Reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide) covers what those documents do and do not commit to.
4. **Decide per part: last-time buy, substitute, or redesign.** The quantity arithmetic — annual build, remaining production life, service and spares, yield loss, storage conditions — is in [last-time-buy quantity and storage](/blog/last-time-buy-quantity-and-storage). The redesign trade-off is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).
5. **Record the date against every decision.** Every figure in this report is dated 2026-08-11 and will be wrong at some point after that, which is why this is a series rather than a page.

A [BOM scrub](/bom) will run steps 1 and 2 against our catalogue automatically, and an [RFQ](/rfq) will tell you what is actually available against a specific ordering code — which, as the limitations section says, is the only way to answer that question.

## Frequently asked questions

### What is the difference between last-time buy and obsolete?

Last-time buy means the manufacturer has announced end-of-life and is still accepting final orders; obsolete means production has stopped. The distinction is the point of this report: a last-time-buy part can still be bought from the manufacturer, so a purchasing decision changes the outcome. For an obsolete part the only routes left are aftermarket production, remaining distributor stock, or a redesign. In our catalogue the two populations are 5,178 and 242,575.

### Two vendors hold 42% of the notices. Does that mean they are less reliable suppliers?

No, and reading it that way would be a mistake. It reflects portfolio size and acquisition history, not manufacturing quality or commitment. Renesas absorbed IDT and Intersil, and rationalising overlapping catalogues after an acquisition necessarily produces a large number of notices. The actionable content is that **scrubbing by vendor lineage is the fastest way to find risk**, not that a vendor should be avoided.

### Why do ROHM's and Renesas' concentrations need different responses?

Because one is a product line exiting and the other is a catalogue being pruned. 725 of ROHM's 727 are two LAPIS MCU families, so the risk is binary and deep: either you have a migration project with no in-family target, or you are unaffected. Renesas' 1,861 spread across more than ten categories, so almost every mixed-signal design holds one or two of them — shallow, cheap to fix, and easy to overlook.

### My part is in last-time buy and shows stock. How urgent is this?

Urgent, because the status field does not tell you when the window closes. We record that a notice exists, not its dates, and some windows have days remaining. Get the manufacturer's notice for the exact last-order date and last-ship date, then do the quantity arithmetic against your remaining production life plus service obligations before the date rather than after it.

### Is a part that is not on this list safe?

No. Absence means no notice has reached our data, not that none will. 242,575 part numbers have already passed through this window. Treat this report as a ranking of where to look first, not as a clearance certificate, and re-run the check periodically, which is what the dated series is for.

### Why is 95% of the SRAM risk one vendor?

Because the IDT SRAM portfolio came to Renesas by acquisition and is being rationalised. 365 of the 384 SRAM part numbers in the window are Renesas lineage, largely `71V4xx` and `71V1xx` asynchronous and synchronous parts. SRAM was already 54% inactive as a category, so the remaining active supply is thin and concentrated, which makes it the highest-yield single check in this report.

### How often will this be re-measured?

Monthly, with each report dated and the previous figures kept for comparison. The interesting content over time is movement: which part numbers leave the window into obsolete status, which categories accumulate new notices, and whether the vendor concentration holds. A one-off measurement ranks risk; a series shows direction.

### Can I get the underlying list for my own bill of materials?

Yes; that is what a [BOM scrub](/bom) does. Upload the bill of materials. It is checked line by line against catalogue status, which is more useful than any aggregate table here because it tells you about your parts. For individual ordering codes, an [RFQ](/rfq) returns current availability including aftermarket sources, which matter because the base number is often active under a different brand.
