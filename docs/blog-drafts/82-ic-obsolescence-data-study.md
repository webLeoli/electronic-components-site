---
title: "What 719,342 Part Numbers Say About IC Obsolescence"
slug: "ic-obsolescence-data-study"
status: "draft"
seoTitle: "IC Obsolescence Data: 719,342 Part Numbers Measured by Category and Vendor"
seoDesc: "34.4% of our catalogue is no longer active. Obsolescence measured by product category, manufacturer, package and family — including which two vendors account for 42% of all last-time-buy notices."
seoKeywords: "IC obsolescence statistics, semiconductor end of life data, obsolescence by manufacturer, last time buy concentration, most obsolete IC categories, BOM lifecycle risk data, EOL rate by package"
tags: "obsolescence data, lifecycle risk, BOM scrubbing, last-time buy, first-party data, procurement"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "XC18V04PCG44C, 89HPES24T3G2ZBALG8, DS21Q354C1, CD4024BHSR, REF102AP, ISL88731CHRTZ, XRT83SL30IV-F, TW2851-BB2-GR"
---

# What 719,342 Part Numbers Say About IC Obsolescence

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: catalogue-wide obsolescence rates, by category, by manufacturer, by package, by family, and how to use them

---

**34.4% of the part numbers we list are no longer in active production.** That is 247,755 of 719,342 — 242,575 obsolete, 5,178 in last-time buy, and a handful marked not-recommended-for-new-design. This article publishes the measurement in full: which product categories carry the most lifecycle risk, which manufacturers' ranges are being pruned hardest, how packaging correlates with obsolescence, and which individual device families have reached 100%. It also publishes the method and its limitations, because a number without a method is not evidence.

The single most useful finding is a concentration: **two manufacturers account for 42% of every active last-time-buy notice in the catalogue.** If you scrub a bill of materials by vendor lineage first, you will find more risk in less time than any other approach.

## Key takeaways

- **34.4% of 719,342 part numbers are not active** (242,575 obsolete + 5,178 last-time buy).
- **Renesas holds 1,460 of the 5,178 last-time-buy part numbers (28%) and ROHM 727 (14%)** — 42% between them. Scrub those two first.
- **Obsolescence tracks acquisition history more closely than technology age.** The highest rates belong to acquired portfolios; the lowest to independent vendors still investing in catalogue parts.
- **Memory is the most obsolete branch at 49%**, Clock & Timing the least at 22%.
- **Package rates read as a timeline**: DIP 48%, LQFP 46%, SOIC 43%, BGA 42%, CSP 30%, QFN/DFN 23%.
- **Some categories are 90%+ gone**: dedicated FPGA configuration PROMs 91%, IDT PCIe switch part numbers 94%.
- **A category-level rate can be an artefact.** One category reads 3% because 94% of its part numbers are one vendor's factory-programmed configurations. The method section explains how to spot this.

---

## Method, and what these numbers are not

The population. Every part number listed in our catalogue as at 2026-08-04: 719,342 rows, of which 547,131 are indexable product pages. Each row is an *orderable part number*, not a device.

The status field takes one of four values, sourced from manufacturer lifecycle data and distributor status at the time of ingest:

| Status | Count | Meaning |
| --- | ---: | --- |
| `active` | 471,587 | In production |
| `obsolete` | 242,575 | No longer produced by the original manufacturer |
| `lastbuy` | 5,178 | End-of-life notice issued; final orders being accepted |
| `nrnd` | 2 | Not recommended for new designs |

Throughout this article **"not active" means obsolete + last-time buy + NRND**, and rates are computed against the part-number count in the same scope.

Four limitations that matter:

1. Part numbers are not devices. A single device sold in four packages, three temperature grades and two packing options is eight part numbers. Worse, factory-programmed devices (oscillators, PMICs, some clock generators) generate hundreds of part numbers per die. **This inflates the denominator for some categories and is the main source of misleading rates.** The clearest example: our Programmable Timers & Oscillators category reads 3% not-active across 22,784 part numbers, but 21,332 of those belong to one vendor's configuration space. The rate is arithmetically true and practically meaningless, because the question a buyer asks is about one configuration.

2. The catalogue is a sample, not the market. It over-represents what a sourcing business stocks and is asked for (obsolete and hard-to-find parts) so absolute rates are higher than a semiconductor vendor's own catalogue would show. **The comparisons between categories, vendors and packages are what to rely on**, because that sampling bias applies roughly evenly.

3. Status is a snapshot. Lifecycle status changes continuously and last-time-buy windows close. Every figure here is dated 2026-08-04.

4. Package data is incomplete. 89,851 rows have no recorded package type, so package rates are computed over the rows that do.

What the numbers are good for: ranking risk, deciding where to look first in a BOM scrub, and calibrating expectations about a family or vendor. **What they are not good for:** predicting whether one specific ordering code is available — that requires checking that code.

## Obsolescence by product branch

The eight top-level branches of the catalogue, ranked by rate:

| Branch | Part numbers | Not active | Rate |
| --- | ---: | ---: | ---: |
| **Memory** | 67,120 | 32,889 | **49%** |
| Audio, Video & Telecom | 28,883 | 12,629 | 44% |
| Interface & Communication | 34,645 | 13,858 | 40% |
| Embedded & Programmable | 155,261 | 60,552 | 39% |
| Analog & Mixed Signal | 88,936 | 31,128 | 35% |
| Logic | 55,805 | 18,974 | 34% |
| Power Management | 226,194 | 63,334 | 28% |
| **Clock & Timing** | 62,421 | 13,733 | **22%** |

Memory at 49% is the most obsolete branch, and the mechanism is well understood: memory devices are tied to density generations and interface standards that turn over completely, and there is no market for last generation's density at last generation's price. Within it, FIFO memory reaches 70%; the detail is in [FIFO memory sourcing](/blog/fifo-memory-sourcing) and [DRAM and SDRAM legacy sourcing](/blog/dram-sdram-legacy-sourcing).

Power Management at 28% is the most stable large branch, because a linear regulator or a supervisor solves a problem that does not change. Its 226,194 part numbers are also inflated by voltage-option variants, which pushes the rate down: the caveat from the method section, working in the other direction.

Clock & Timing at 22% is the lowest, and this is where the configuration-variant artefact is strongest. Read it with the specific-category numbers below rather than at branch level.

## The categories at the extremes

Highest rates we have measured, by category or coherent family group:

| Segment | Part numbers | Not active | Where it is documented |
| --- | ---: | ---: | --- |
| IDT `89H…` PCIe switches | 848 | **94%** | [PCIe switches and bridges](/blog/pcie-switch-bridge-sourcing-guide) |
| Dedicated FPGA configuration PROMs | 536 | **91%** | [FPGA configuration memory](/blog/fpga-configuration-flash-pairing) |
| FIFO memory | 4,136 | 70% | [FIFO memory sourcing](/blog/fifo-memory-sourcing) |
| Microprocessors (MPU) | 5,169 | 64% | [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide) |
| Specialty logic (DDR registers, ECL) | 1,593 | 60% | [specialty logic](/blog/specialty-logic-ddr-ecl-sourcing-guide) |
| Video amplifiers | 1,509 | 59% | [video and display drivers](/blog/video-display-interface-sourcing-guide) |
| Telecom ICs | 4,124 | 58% | [telecom line interfaces](/blog/telecom-line-interface-sourcing-guide) |
| Video processing | 2,467 | 58% | [video and display drivers](/blog/video-display-interface-sourcing-guide) |
| Digital potentiometers | 5,787 | 58% | [digital potentiometers](/blog/digital-potentiometer-sourcing-guide) |
| Real-time clocks | 2,073 | 55% | [RTC sourcing](/blog/rtc-sourcing-guide) |
| Clock buffers & drivers | 4,335 | 55% | [clock buffers and fanout](/blog/clock-buffer-fanout-sourcing-guide) |
| Display drivers | 1,251 | 54% | [video and display drivers](/blog/video-display-interface-sourcing-guide) |

Lowest rates, for contrast:

| Segment | Part numbers | Not active |
| --- | ---: | ---: |
| System On Chip (SoC) | 4,779 | 13% |
| Battery chargers | 3,176 | 23% |
| Hot-swap controllers (`TPS24…`) | 62 | **0%** |
| DC-DC switching controllers | 11,167 | 30% |

The SoC figure deserves explanation because it is counter-intuitive. SoCs are the newest, most complex devices in the catalogue and the least obsolete, at 13%. The reason is that 84% of that category is programmable-logic SoCs from Altera, Xilinx and Microsemi, and FPGA vendors support families for a decade or more because their customers are industrial and infrastructure. It is a statement about vendor policy, not about silicon longevity — see [SoC and SoC FPGA sourcing](/blog/soc-fpga-application-processor-sourcing-guide).

## Obsolescence by manufacturer

This is the table that changes how a BOM scrub is prioritised. Top 25 manufacturers by part-number count:

| Manufacturer | Part numbers | Not active | Last-time buy |
| --- | ---: | ---: | ---: |
| Rochester Electronics | 106,452 | 29% | 186 |
| Texas Instruments | 76,459 | 25% | 227 |
| **Renesas** | 64,488 | 36% | **1,460** |
| Microchip | 52,846 | 27% | 13 |
| Torex Semiconductor | 44,635 | **8%** | 318 |
| Maxim Integrated | 42,668 | 53% | 202 |
| Linear Technology | 25,302 | **10%** | 0 |
| Skyworks Solutions | 22,910 | **10%** | 4 |
| **onsemi** | 21,029 | **64%** | 270 |
| Analog Devices | 18,099 | 32% | 109 |
| ABLIC | 16,655 | **8%** | 0 |
| NXP Semiconductors | 16,013 | 53% | 105 |
| STMicroelectronics | 15,436 | 39% | 14 |
| Altera | 13,323 | 49% | 0 |
| **Spansion** | 13,314 | **70%** | 24 |
| Cypress Semiconductor | 13,219 | 64% | 27 |
| **Intersil** | 11,210 | **66%** | 401 |
| Diodes Incorporated | 11,094 | 48% | 46 |
| Atmel | 10,478 | 49% | 1 |
| **Micron Technology** | 9,958 | **71%** | 128 |
| Nisshinbo Micro Devices | 8,349 | **10%** | 0 |
| Silicon Labs | 6,943 | 28% | 67 |
| Infineon Technologies | 6,925 | 47% | 83 |
| **ROHM Semiconductor** | 6,681 | 23% | **727** |
| Xilinx | 6,503 | 36% | 14 |

Three patterns, in order of usefulness.

### 1. Last-time buy is extraordinarily concentrated

Renesas holds 1,460 of the catalogue's 5,178 last-time-buy part numbers (28%) and ROHM 727, or 14%. Together, 42% of every active end-of-life notice.

This is the most actionable number in the study, and it explains something we noticed repeatedly while documenting individual categories: the Renesas-owned Intersil and IDT portfolios turned up in the last-time-buy list of *every single cluster* — Intersil VR controllers and notebook chargers in [DC-DC controllers](/blog/dc-dc-controller-sourcing-guide) and [battery chargers](/blog/battery-charger-management-sourcing-guide), IDT clock parts in [clock buffers](/blog/clock-buffer-fanout-sourcing-guide), IDT PCIe switches in [PCIe switches](/blog/pcie-switch-bridge-sourcing-guide), Renesas 74-series and 4000-series logic in [decoding a 74-series part number](/blog/74-series-logic-decode-guide), Intersil digipots in [digital potentiometers](/blog/digital-potentiometer-sourcing-guide), Intersil RTCs in [RTC sourcing](/blog/rtc-sourcing-guide), Techwell video decoders in [video and display drivers](/blog/video-display-interface-sourcing-guide).

Practical instruction: filter your BOM for Renesas, Intersil, IDT, Techwell and ROHM part numbers and check those first. The hit rate will be several times higher than a part-by-part sweep. The method for the sweep itself is in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

### 2. Obsolescence follows acquisitions, not technology age

Rank the vendors by rate and the pattern is corporate, not technical:

- **Highest**: Micron 71%, Spansion 70%, Intersil 66%, onsemi 64%, Cypress 64%, Maxim 53%, NXP 53%, Altera 49%, Atmel 49%.
- **Lowest**: Torex 8%, ABLIC 8%, Linear Technology 10%, Skyworks 10%, Nisshinbo 10%.

Spansion, Cypress, Intersil, Atmel, Altera and Maxim are all portfolios that changed owners. **When a range is acquired, the acquirer rationalises it (keeping what fits the strategy and discontinuing the overlap) and that shows up as a step change in obsolescence rate that has nothing to do with how good or how old the silicon is.**

Two honest caveats. First, a vendor's rate partly reflects *which* of its parts a sourcing catalogue holds: we list what customers ask for, which skews toward legacy. Second, the brand name in the data is the name on the part, not the current owner — `Intersil`, `Altera`, `Atmel`, `Spansion` and `Cypress` are historical labels whose products now sit inside Renesas, Intel/Altera, Microchip and Infineon. **The lesson survives both caveats: a part's supply risk is better predicted by who owns its portfolio now than by its datasheet date.**

Note also what the low-rate vendors have in common. Torex, ABLIC and Nisshinbo are Japanese analogue specialists selling large catalogues of small standard parts, and Linear Technology's part numbers persist inside Analog Devices at a 10% rate. **Deep catalogue lines maintained by their originator are the most stable thing in the data.**

### 3. The aftermarket is the largest single supplier

Rochester Electronics is the biggest "manufacturer" in the catalogue at 106,452 part numbers — 14.8% of everything we list — at a 29% not-active rate.

That is not a curiosity, it is the structural answer to much of the rest of this study. When an original manufacturer discontinues a line, authorised aftermarket production of the original die is the only source of genuine, traceable parts, and it exists specifically for the categories with the worst rates: it supplies 1,145 of the microprocessor part numbers, 1,474 of the DSPs, 6,532 in the specialised-IC category, 779 in telecom. The channel distinction is set out in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Obsolescence by package

Package rates read as a timeline of assembly technology:

| Package | Part numbers | Share of catalogue | Not active |
| --- | ---: | ---: | ---: |
| DIP | 31,597 | 4.4% | **48%** |
| LQFP | 48,157 | 6.7% | 46% |
| SOIC | 90,623 | 12.6% | 43% |
| BGA (all types) | 74,393 | 10.3% | 42% |
| — FCBGA | 14,958 | 2.1% | 44% |
| — TFBGA | 8,193 | 1.1% | 42% |
| — LFBGA | 8,575 | 1.2% | 34% |
| CSP / WLCSP | 10,605 | 1.5% | 30% |
| QFN / DFN | 70,667 | 9.8% | **23%** |

The ranking is essentially chronological. Through-hole DIP is the oldest volume package and the most obsolete; QFN and DFN are the current mainstream and the least. That is what you would expect. It is useful for two reasons:

A DIP requirement is itself a lifecycle risk. If a design needs through-hole parts (for repairability, for sockets, for a conformal-coated assembly) it is fishing in the pool with the highest obsolescence rate, and that should be reflected in stocking policy.

BGA obsolescence has a specific commercial consequence. 31,258 inactive BGA part numbers, concentrated in FCBGA at 44%, is exactly the population where recovered and reballed material gets offered, because the parts are valuable enough to make recovery worthwhile. The detection and acceptance framework is in [BGA reballing](/blog/bga-reballing-risk-guide).

## Families that have reached 100%

Nothing communicates lifecycle risk better than a family with no survivors. Measured in our catalogue:

| Family | Part numbers | What it was |
| --- | ---: | --- |
| `IDT79…` | 119 | IDT MIPS processors |
| `EL5…` | 41 | Elantec/Intersil video buffers |
| `TDA98…` | 40 | NXP video IF and HDMI transmitters |
| `TS68…` | 30 | Thomson 68000-family processors |
| `ICS5…` | 31 | IDT/ICS clock parts |
| `XC18V…` | 28 | Xilinx configuration PROMs |
| `TNY3…` | 19 | Power Integrations offline switchers |
| `EPC16…` | 15 | Altera configuration devices |
| `UDN…` | 9 | Allegro/Sprague motor drivers |
| `EPCS…` | 8 | Altera serial configuration devices |
| `EPC8…` | 5 | Altera configuration devices |
| `5V41…` | 6 | IDT clock parts |

And just below them: `KMPC…` 99% (524 parts, Freescale automotive PowerPC), `M25P…` 98% serial flash, `SSTU…` 98% and `SSTV…` 97% DDR module registers, `XC17…` 97%, `EPC1…` 97%, `89HPES…` 95%.

The healthiest families, for balance: `MCP41…`/`MCP42…` digital potentiometers and `MCP2…` interface controllers at 0%, `CDCLVC…` and `LMK…` clock buffers at 0%, `TPS24…` hot-swap at 0%, `DRV8…` motor drivers at 1%, `BQ25…` chargers at 1%, `IS25LP…` flash at 7%, `MX25L…` at 8%, `74AUP…` logic at 9%.

Read those two lists together and a rule emerges: a family is safe roughly in proportion to whether its owner is still adding part numbers to it. Every 100% family above belongs to a product line that stopped being developed, usually because the platform it served ended or because an acquirer chose a different range.

## How to use this in a BOM scrub

A priority order that follows from the data:

1. **Filter by vendor lineage first.** Renesas, Intersil, IDT, Techwell, ROHM, Spansion, Cypress, Atmel, Altera, Maxim, onsemi. This is where the last-time-buy notices and the highest rates are.
2. **Then by family**, using the tables above and the per-cluster articles. A family at 90%+ needs a decision now regardless of what a stock search says today.
3. **Then by ordering code**, because that is the only level at which availability is a fact rather than a probability. Remember that aftermarket suppliers append their own codes, so search prefixes rather than exact strings: the technique is in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide).
4. **Weight by replacement cost, not unit price.** A two-dollar telecom line interface can carry a five-figure re-homologation cost ([telecom line interfaces](/blog/telecom-line-interface-sourcing-guide)); a PMIC has no second source at any price ([specialised PMICs](/blog/specialized-pmic-sourcing-guide)); a DSP may be purchasable while its toolchain is not ([DSP sourcing](/blog/dsp-sourcing-guide)).
5. **Convert findings into either a sized last-time buy or a scheduled redesign** — [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) and [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

And watch the two statistical traps this study exposes. A low category rate may be a configuration-variant artefact, and a high one may be dominated by ordering-code proliferation rather than by real device attrition. Both are resolved the same way: check the exact part number.

## FAQ

### What proportion of ICs are obsolete?

In our catalogue, 34.4% of 719,342 part numbers are not in active production — 242,575 obsolete and 5,178 in last-time buy. That figure is higher than a semiconductor manufacturer's own catalogue would show, because a sourcing business lists what customers ask for, which skews toward legacy and hard-to-find parts. The comparisons within the data (between categories, vendors and packages) are more useful than the absolute rate, since the sampling bias applies fairly evenly across them.

### Which product categories have the worst obsolescence?

By branch, Memory at 49%, then Audio/Video/Telecom at 44%, Interface at 40% and Embedded at 39%; Clock & Timing is lowest at 22% and Power Management at 28%. By specific segment the extremes are much sharper: IDT `89H` PCIe switch part numbers at 94%, dedicated FPGA configuration PROMs at 91%, FIFO memory at 70%, microprocessors at 64%, specialty logic at 60%, and video, telecom and digital potentiometers all around 58%.

### Which manufacturers' parts carry the most lifecycle risk?

By rate: Micron 71% in our mix, Spansion 70%, Intersil 66%, onsemi 64%, Cypress 64%, Maxim 53% and NXP 53%. By volume of active end-of-life notices the answer is different and more actionable: Renesas holds 1,460 of the catalogue's 5,178 last-time-buy part numbers and ROHM 727 — 42% between two vendors. Note that the brand in the data is the name on the part, not the current owner: Intersil, IDT and Techwell parts now sit inside Renesas, which is why that name dominates the notices.

### Why does obsolescence track acquisitions?

Because rationalisation follows ownership. When a portfolio changes hands the acquirer keeps what fits its strategy and discontinues the overlap, which produces a step change in a line's obsolescence rate that has nothing to do with the quality or age of the silicon. Spansion, Cypress, Intersil, Atmel, Altera and Maxim are all acquired portfolios and all sit at 49% or above in our data, while independent specialists with deep catalogue lines (Torex, ABLIC, Nisshinbo) sit at 8-10%. For risk assessment, who owns the range now predicts better than the datasheet date.

### Does package type predict obsolescence?

It correlates, roughly chronologically. DIP is 48% not active, LQFP 46%, SOIC 43%, BGA 42%, CSP 30% and QFN/DFN 23%, which is the order in which those packages became mainstream. The practical implications are that a through-hole requirement is itself a lifecycle risk worth reflecting in stocking policy, and that the 31,258 inactive BGA part numbers are precisely the population where recovered and reballed material gets offered, because those parts are valuable enough to make recovery profitable.

### Why is the SoC category the least obsolete?

Because it is dominated by programmable-logic SoCs rather than application processors: 84% of that category's part numbers come from Altera, Xilinx and Microsemi, and FPGA vendors support families for a decade or more because their customers are industrial, aerospace and infrastructure. Zynq-7000 runs 8% inactive and Cyclone V SoC 4%. So the 13% figure describes vendor lifecycle policy, not the longevity of complex silicon — application processors elsewhere in the catalogue behave very differently, with the MPU category at 64%.

### How can a category be 3% obsolete and still be risky?

Through ordering-code proliferation. Our Programmable Timers & Oscillators category reads 3% not active across 22,784 part numbers, but 21,332 of those are one vendor's factory-programmed configurations — hundreds of ordering codes per die, most of which nobody has ever bought. The rate is arithmetically correct and answers the wrong question, because a buyer needs one specific configuration and that configuration may be discontinued. Any category dominated by configured or programmed variants should be assessed at ordering-code level, never at category level.

### How should I use this data on my own bill of materials?

In four passes, cheapest first. Filter by vendor lineage — Renesas, Intersil, IDT, Techwell, ROHM, Spansion, Cypress, Atmel, Altera, Maxim, onsemi — since that is where the notices concentrate. Then check family-level rates for the parts that survive, treating anything above about 90% as needing a decision regardless of today's stock. Then verify the exact ordering codes, searching prefixes rather than exact strings so that aftermarket part numbers appear. Finally, weight what you found by replacement cost rather than unit price, because the cheapest parts frequently carry the most expensive substitutions.

## Related reading

Start here for method: [BOM scrubbing and lifecycle risk analysis](/blog/bom-scrubbing-lifecycle-risk-analysis), [EOL, NRND and obsolete explained](/blog/eol-nrnd-obsolete-ic-lifecycle-explained), [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

Then the decisions: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [how to source obsolete electronic components](/blog/how-to-source-obsolete-electronic-components), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Then verification: [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide), [date codes and lot traceability](/blog/date-code-lot-traceability-explained), [BGA reballing](/blog/bga-reballing-risk-guide), [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy).

The per-segment detail behind every number above: [memory IC sourcing](/blog/memory-ic-sourcing-guide) · [FIFO memory](/blog/fifo-memory-sourcing) · [legacy microprocessors](/blog/legacy-microprocessor-sourcing-guide) · [DSP](/blog/dsp-sourcing-guide) · [SoC and SoC FPGA](/blog/soc-fpga-application-processor-sourcing-guide) · [specialty logic](/blog/specialty-logic-ddr-ecl-sourcing-guide) · [74-series logic](/blog/74-series-logic-decode-guide) · [data converters](/blog/data-converter-sourcing-guide) · [digital potentiometers](/blog/digital-potentiometer-sourcing-guide) · [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) · [DC-DC controllers](/blog/dc-dc-controller-sourcing-guide) · [PMICs](/blog/specialized-pmic-sourcing-guide) · [battery chargers](/blog/battery-charger-management-sourcing-guide) · [offline switchers](/blog/ac-dc-offline-switcher-sourcing-guide) · [RTCs](/blog/rtc-sourcing-guide) · [clock buffers](/blog/clock-buffer-fanout-sourcing-guide) · [programmable oscillators](/blog/programmable-oscillator-sourcing-guide) · [interface controllers](/blog/interface-controller-sourcing-guide) · [PCIe switches](/blog/pcie-switch-bridge-sourcing-guide) · [telecom line interfaces](/blog/telecom-line-interface-sourcing-guide) · [video and display drivers](/blog/video-display-interface-sourcing-guide) · [FPGA configuration memory](/blog/fpga-configuration-flash-pairing) · [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life)

Using the figures. These measurements are ours and we publish them so that they can be checked and cited; if you quote them, please note the date, since lifecycle status moves continuously. Send us a bill of materials and we will run it against the current data rather than against this snapshot.

[**Upload a BOM**](/bom) | [**Submit an RFQ**](/rfq) | [**Browse the catalogue**](/category)
