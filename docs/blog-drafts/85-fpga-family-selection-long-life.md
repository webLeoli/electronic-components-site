---
title: "FPGA Family Selection for a 15-Year Product Life: A Scored Evaluation of Seven Families"
slug: "fpga-family-selection-long-life"
status: "draft"
seoTitle: "FPGA Selection for Long Product Life: Seven Families Scored on Availability"
seoDesc: "Arria V and Cyclone V launched the same year; one is 56% obsolete, the other 0%. Seven FPGA families scored on measured availability, toolchain horizon and migration headroom."
seoKeywords: "FPGA selection long product life, FPGA obsolescence comparison, Artix-7 vs Cyclone V, MachXO3 vs ECP5, SmartFusion2 availability, FPGA family evaluation, industrial FPGA choice, FPGA toolchain support horizon"
tags: "FPGA selection, evaluation, design for availability, lifecycle risk, industrial design"
author: "FPGACenter Engineering Team"
readingTime: 18
category: "FPGA Design & Integration"
relatedProducts: "XC7A75T-1FGG484C, 5CEFA2F23C8N, LCMXO3LF-4300C-5BG256I, LFE5U-45F-6BG256I, M2S060-FCSG325I, 10M02SCU169A7G, 5AGXMA7G4F31I3N, EPM7064SLC44-10N"
---

# FPGA Family Selection for a 15-Year Product Life: A Scored Evaluation of Seven Families

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~18 minutes
> **Topics**: weighted scoring model, measured availability by family, the mid-range versus high-end finding, toolchain horizon, migration headroom

---

**Market position predicts an FPGA family's availability far better than its age does.** Arria V and Cyclone V were introduced in the same year on the same process generation. Measured across our catalogue on 2026-08-11, Arria V (`5AG`) ordering codes are **56% inactive**; Cyclone V E and GX (`5CE`, `5CG`) are **0%**. Meanwhile Spartan-7 (`XC7S`, 2015) sits at 1% and the original Spartan (`XCS`, 1998) at 99%, which looks like an age effect until you notice that Cyclone IV (`EP4C`, 2009) is at 1% and Stratix II (`EP2S`, 2004) is at 84%.

The mechanism is demand, not silicon. **High-end FPGAs die with their process node because their customers (communications infrastructure, prototyping, datacentre) move to the next node on a three-year cycle. Mid-range FPGAs live in industrial equipment whose owners re-order the same part for fifteen years, so somebody keeps making it.**

This article turns that into a scoring model and applies it to seven families you could reasonably start a new long-life design on today. It is a companion to [how to choose the right FPGA](/blog/how-to-choose-right-fpga), which covers the functional selection; this one assumes you have a shortlist that meets your logic, I/O and performance requirements, and asks which of them you will still be able to buy in 2041.

## Key takeaways

- **Mid-range beats high-end for longevity, decisively.** Cyclone V 0% inactive against Arria V 56%, same year, same vendor.
- **The four strongest choices on measured availability are Cyclone V E/GX (0%), ECP5 (0%), Spartan-7 (1%) and Cyclone IV (1%)**, with MachXO3 (5%), Artix-7 (6%) and SmartFusion2/IGLOO2 (8%) close behind.
- **Do not start a design on Arria V (56%), first-generation MachXO (53%), LatticeXP2 (60%), MAX 7000 (85%) or anything in the Virtex-II/Cyclone I generation (100%).**
- **The CPLD as a product category is in worse shape than the FPGA.** `cplds` is 66% inactive against `fpgas` at 46%. If you need small glue logic with a fifteen-year horizon, a small FPGA or a MAX 10 is the safer form factor.
- **Toolchain horizon is a real scored criterion, not a footnote.** Spartan-6 is the worked example: it is supported by ISE, which is no longer developed. It is not supported by Vivado at all.
- **Availability headroom inside the family matters as much as the family's rate.** A family with a pin-compatible density ladder gives you a migration path without a respin.
- **The boot device is a separate lifecycle risk with worse numbers than the FPGA** — see the [configuration flash analysis](/blog/fpga-boot-flash-design-longevity).

---

## The measurement

Ordering-code counts and status by family, measured 2026-08-11. These are orderable part numbers, not devices, so a family sold in many packages and speed grades contributes more rows. Rates are comparable between families because the same counting rule applies to all.

| Family | Prefix | Part numbers | Not active | Position |
| --- | --- | ---: | ---: | --- |
| Kintex/Virtex UltraScale | `XCKU`/`XCVU` | 492 | **0%** | current high-end |
| ECP5 | `LFE5U`/`LFE5UM` | 236 | **0%** | current mid-range |
| Cyclone V E / GX | `5CE`/`5CG` | 296 | **0%** | mid-range |
| Zynq UltraScale+ | `XCZU` | 521 | 1% | current SoC |
| Spartan-7 | `XC7S` | 127 | 1% | current low-cost |
| Cyclone IV / III | `EP4C`/`EP3C` | 688 | 1% | long-lived mid-range |
| MAX 10 | `10M…` | 194 | 3-20% | varies by density |
| MachXO3 | `LCMXO3L`/`LCMXO3D` | 285 | 5% | current small |
| Artix-7 / Kintex-7 / Virtex-7 | `XC7A`/`XC7K`/`XC7V` | 533 | 6% | mainstream |
| Zynq-7000 | `XC7Z` | 127 | 8% | mainstream SoC |
| SmartFusion2 / IGLOO2 | `M2S`/`M2GL` | 1,307 | 8% | flash-based |
| MachXO2 | `LCMXO2-` | 493 | 8% | small |
| Spartan-6 | `XC6S` | 398 | 16% | **mid-life** |
| Virtex-5 | `XC5V` | 333 | 17% | legacy high-end |
| ProASIC3 | `A3P` | 771 | 30% | legacy flash |
| IGLOO nano | `AGLN` | 120 | 42% | legacy |
| MachXO, 1st generation | `LCMXO256`…`LCMXO2280` | 386 | **53%** | replace |
| **Arria V** | `5AG` | 607 | **56%** | **high-end, 2011** |
| LatticeXP2 | `LFXP2` | 190 | 60% | replace |
| Stratix I / II | `EP1S`/`EP2S` | 488 | 77-84% | gone |
| MAX 7000 | `EPM7` | 656 | 85% | gone |
| Spartan (classic) | `XCS` | 106 | **99%** | gone |
| Virtex-II / Pro | `XC2V` | 400 | **100%** | gone |
| Cyclone I | `EP1C` | 116 | **100%** | gone |

A measurement caveat worth repeating, because getting it wrong invents a finding. The prefix `LCMXO2` matches both MachXO2 (`LCMXO2-1200ZE…`) and first-generation MachXO (`LCMXO2280C…`). Measured together they read 18% inactive, which describes neither family. Split properly, MachXO2 is 8% and first-generation MachXO is 53%. Always confirm that a prefix identifies one family before quoting its rate: the same artefact class that made one timing category read 3% inactive in the [obsolescence data study](/blog/ic-obsolescence-data-study).

## The scoring model

Six criteria, weighted for a design that must stay in production for fifteen years and be repairable for longer. Weights are the arguable part; the scores under them are derived from measurement wherever possible.

| Criterion | Weight | 5 points | 1 point |
| --- | ---: | --- | --- |
| **Measured availability** | 30% | 0-2% inactive | >40% inactive |
| **Density/package migration path** | 20% | Pin-compatible ladder across ≥3 densities in one package | No alternative in the same package |
| **Toolchain horizon** | 20% | Supported by the vendor's current, actively developed tool | Supported only by a discontinued tool |
| **Configuration ecosystem** | 10% | Boots from generic serial NOR with multiple active suppliers | Requires a dedicated, obsolete configuration device |
| **Aftermarket depth** | 10% | Established aftermarket supply for the family | None |
| **Retained special capability** | 10% | Keeps a capability with no modern replacement (instant-on, flash-based, 5 V tolerance) | Not applicable |

Availability carries the largest single weight because it is the criterion that cannot be engineered around after the fact. A toolchain can be archived, a configuration device can be substituted, a density can be migrated, but a part that nobody manufactures cannot be bought at any price.

Worked arithmetic for one row, so the table below can be checked. Cyclone V E/GX:

```
Availability        0% inactive          -> 5 x 0.30 = 1.50
Migration path      5CE ladder across
                    484-ball BGA          -> 4 x 0.20 = 0.80
Toolchain           Quartus Standard,
                    still released         -> 4 x 0.20 = 0.80
Configuration       generic serial NOR
                    (EPCS/EPCQ dead)       -> 4 x 0.10 = 0.40
Aftermarket         thin, not needed yet   -> 3 x 0.10 = 0.30
Special capability  none claimed           -> 3 x 0.10 = 0.30
                                              ----------
                    Total                              4.10 / 5
```

## The results

| Family | Avail. | Migration | Toolchain | Config | Aftermkt | Special | **Score** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Artix-7 / Spartan-7** | 5 | 5 | 5 | 4 | 3 | 3 | **4.50** |
| **ECP5** | 5 | 4 | 4 | 4 | 2 | 4 | **4.20** |
| **Cyclone V E/GX** | 5 | 4 | 4 | 4 | 3 | 3 | **4.10** |
| **MachXO3** | 5 | 4 | 4 | 5 | 2 | 5 | **4.30** |
| **SmartFusion2 / IGLOO2** | 4 | 4 | 4 | 5 | 2 | 5 | **4.00** |
| **MAX 10** | 4 | 3 | 4 | 5 | 2 | 5 | **3.90** |
| Cyclone IV | 5 | 4 | 2 | 4 | 3 | 3 | **3.70** |
| Spartan-6 (reference) | 3 | 4 | **1** | 4 | 4 | 3 | **2.90** |
| Arria V (reference) | **1** | 2 | 4 | 4 | 1 | 3 | **2.20** |

The last two rows are included as calibration, not as recommendations.

### Artix-7 and Spartan-7 — 4.50

The strongest overall score. It is the migration path that earns it rather than the availability number. `XC7A` is 6% inactive and `XC7S` 1%, both healthy, but the distinguishing feature is a wide density ladder inside common packages: a design that outgrows or under-uses its device usually has a pin-compatible neighbour, so a mid-life change is a bitstream rebuild rather than a layout change.

Toolchain scores 5 because Vivado is the vendor's current, actively developed tool and 7-series is a first-class target in it. That is the opposite of the Spartan-6 position and worth understanding as a pair, which the next section does.

The weakness is aftermarket depth, which is genuinely thin, but that is a symptom of the family still being in production, not a warning.

### MachXO3 — 4.30

Wins on the two criteria that matter for glue logic and board management: configuration ecosystem and retained capability. MachXO3 is instant-on and internally configured, so it has no external boot-device dependency at all — which, given that `EPCS` is 100% inactive and `W25Q` has 204 ordering codes in last-time buy, is worth more than it looks.

It scores 5 on retained capability because instant-on non-volatile small-density programmable logic is a capability with few modern substitutes. It is exactly what a CPLD used to provide. Given `cplds` as a category is **66% inactive**, MachXO3 is the most defensible answer to "my CPLD went obsolete": a point developed in [Lattice MachXO and ECP sourcing](/blog/lattice-machxo-ecp-sourcing) and [Altera MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths).

### ECP5 — 4.20

0% inactive across 236 ordering codes, and the only family here with a credible open-source toolchain path, which is a longevity argument of a different kind: a tool that can be archived and rebuilt from source does not have a vendor support horizon. That is why toolchain scores 4 despite the vendor tool being less widely deployed than Vivado.

Migration scores 4 rather than 5 because the density ladder is shorter. Aftermarket is 2, again because the family is current.

### Cyclone V E/GX — 4.10

The family that proves this article's thesis, at 0% inactive across 296 ordering codes while its high-end sibling from the same year sits at 56%. If you need a mid-range Altera-lineage part with a long horizon, this is it, and the SoC variants (`5CS`, 3% inactive) extend the same argument to hard-processor designs.

Toolchain scores 4 rather than 5 because Quartus support for older families migrates between tool editions over time; archive the exact version you qualify against, and confirm the current edition still targets your device before committing.

### SmartFusion2 and IGLOO2 — 4.00

8% inactive across 1,307 ordering codes (a large, healthy family) and it retains a capability nothing else on this list offers: flash-based configuration with no external boot device and no configuration-time exposure. For designs with a security or single-event-upset requirement, that is decisive rather than merely convenient.

The 8% figure is worth reading carefully: it reflects pruning of packages and grades within a live family, not the family winding down, and it stands in clear contrast to its own predecessor `A3P` at 30% and `AGLN` at 42%.

### MAX 10 — 3.90

Scores well on configuration and capability for the same reason as MachXO3 (internal flash configuration, instant-on, no external boot device) but its availability rate varies by density in a way the others do not: `10M02` and the mid densities measure well, while `10M08` reads 20% inactive. Check the specific density and package you intend to use rather than trusting a family-level number. Migration scores 3 because the density ladder is narrow.

### Cyclone IV — 3.70

An availability score of 5 dragged down by a toolchain score of 2. `EP4C` is 1% inactive across 394 ordering codes, which is remarkable for a 2009 family and reflects exactly the industrial re-order demand this article is about. But newer tool editions progressively drop older families, so a new design started on Cyclone IV today is a design that must archive its toolchain from the outset.

For an existing Cyclone IV product this is good news: the silicon is available. For a new design, prefer Cyclone V for the same architecture with a longer tool horizon.

## The two calibration rows

### Spartan-6, and what a toolchain cliff costs

Spartan-6 is 16% inactive (mid-life, not dead) and it still scores 2.90, because it is supported by ISE and not by Vivado. ISE is no longer developed. A new design on Spartan-6 must therefore archive a discontinued toolchain, including its licensing mechanism and a host operating system it will still install on, for the entire life of the product.

That is achievable; it is the standard answer for products already in the field, and [sourcing Spartan-6](/blog/sourcing-xilinx-spartan-6-guide) covers the silicon side, but it is a cost with no offsetting benefit for a new design, because 7-series parts are available, cheaper per logic cell and supported by a current tool. **The toolchain criterion exists in this model because it is the one that most often surprises teams: the silicon is fine and the build environment is the problem.** The same inversion appeared in our DSP analysis, where the toolchain expires before the parts do.

### Arria V, and the high-end trap

56% inactive, eleven years after introduction, from a vendor whose mid-range family from the same year is at 0%. Arria V's customers were building communications and video infrastructure, and those customers moved to newer nodes. The ordering codes were pruned accordingly. `5AGXMA7G4F31I3N` is one of the obsolete ones. It is a large, expensive device that somebody designed into a product that now needs it.

The generalisation matters more than the example. When you shortlist a high-end FPGA for a long-life industrial product because it meets the performance requirement with margin, you are accepting a lifecycle risk that the datasheet does not mention and that the vendor's longevity programme only partly covers. If the performance requirement genuinely needs high-end silicon, plan for a mid-life redesign explicitly and budget it, rather than discovering it.

## Choosing by design type

A short mapping, given the scores above.

| If you are building | Start with | Because |
| --- | --- | --- |
| General-purpose industrial control or interfacing | **Artix-7 or Spartan-7** | Best migration ladder, current toolchain, healthy availability |
| Replacement for an obsolete CPLD | **MachXO3 or MAX 10** | Instant-on, internally configured, no boot device; `cplds` is 66% inactive |
| Mid-range Altera-lineage continuation | **Cyclone V E/GX** | 0% inactive; same architecture family as an existing Cyclone design |
| Security or radiation-tolerance requirement | **SmartFusion2 / IGLOO2** | Flash-based configuration, no configuration-time exposure |
| Design where the toolchain must be archivable | **ECP5** | Open toolchain path removes the vendor support horizon |
| Hard-processor SoC on a long horizon | **Cyclone V SoC (`5CS`) or Zynq-7000** | 3% and 8% inactive respectively; both mainstream |
| Anything at all | **Not** Arria V, first-gen MachXO, LatticeXP2, MAX 7000, Virtex-II, Cyclone I | 53-100% inactive |

Two decisions sit outside the FPGA choice itself and carry comparable lifecycle risk. **The configuration device** is measurably worse than the FPGA (`EPCS` 100% inactive, `N25Q` 93%, `W25Q` with 204 codes in last-time buy) and is covered in the [boot flash design article](/blog/fpga-boot-flash-design-longevity). **External memory** is the other, where the vendor that survives is often not the one you designed with; that is the subject of the [DDR3 interface guide](/blog/ddr3-interface-design-longevity).

For the lifecycle picture on families already in your products rather than families you are choosing between, [FPGA obsolescence planning](/blog/fpga-obsolescence-spartan-cyclone-end-of-life) is the companion piece, and current per-part status is on the [FPGA](/category/fpgas) and [CPLD](/category/cplds) category pages. If you have a shortlist and want its availability checked against our catalogue before you commit, [send it through as an RFQ](/rfq).

## Frequently asked questions

### Why is Arria V so much more obsolete than Cyclone V when they launched together?

Because their customers behave differently. Arria V went into communications and video infrastructure, where designs move to a newer process node every few years, so demand for the old ordering codes stops and the vendor prunes them. Cyclone V went into industrial equipment that re-orders the same part for a decade or more. Our measurement is 56% inactive against 0%. **Market position predicts availability better than introduction date.**

### Is a CPLD still a reasonable choice for new glue logic?

Not for a fifteen-year horizon. The `cplds` category in our catalogue is 66% inactive, worse than `fpgas` at 46%, and MAX 7000 specifically is 85% gone. The capability CPLDs provided (small, instant-on, non-volatile programmable logic) is now best served by MachXO3 (5% inactive) or MAX 10 (3-20% depending on density), both of which are internally configured and need no external boot device.

### Should I choose an FPGA family based on availability rather than performance?

No — meet the requirement first, then use availability to choose among the candidates that qualify. This model assumes a functional shortlist already exists. Its purpose is to stop the shortlist being decided by price per logic cell alone, which is how a design ends up on a high-end family whose ordering codes are pruned within a decade.

### How much does toolchain support horizon really matter?

Enough to move a family from a 3.7 to a 2.9 score in this model. The concrete case is Spartan-6: the silicon is only 16% inactive, but it is supported by ISE, which is no longer developed, and is not supported by Vivado at all. A new design on it must archive a discontinued tool, its licensing and a host OS for the product's life. Verify the last tool version that supports your family and archive it deliberately; this is the failure mode that inverts the usual assumption, because the parts remain available and the build environment does not.

### Does the FPGA vendor's longevity or long-term-supply programme solve this?

Partly, and not for the case that hurts. Those programmes commit to a supply horizon for selected devices, which is real value, but the pruning measured here happens at the level of individual ordering codes (packages, speed grades and temperature grades) and a programme covering "the device" does not guarantee your package and grade. Check availability at the ordering-code level, which is the level at which purchasing actually operates.

### What is the safest small FPGA for a long-life design?

MachXO3 on this model, at 5% inactive with internal configuration and instant-on behaviour. MAX 10 is close behind and stronger if you need on-chip analogue-to-digital conversion, but check the specific density: `10M08` measures 20% inactive while others measure far lower. Family-level rates hide density-level differences in both families.

### My design is already on an obsolete family. Does this evaluation help?

Only indirectly: the migration target choice is the same decision as a new-design choice. The immediate question is whether to re-source or redesign, which is covered in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts). If you redesign, use the scores here to pick the target; if you re-source, search the base ordering code as a prefix rather than an exact string, because aftermarket manufacturers append and alter suffix codes.

### How often do these numbers change?

Enough that they should be re-measured rather than cited from memory. Status is a snapshot: 5,178 part numbers across the catalogue are in an active last-time-buy window, which means they are available now and will not be. We publish a dated re-measurement in the [obsolescence watch](/blog/obsolescence-watch-2026-08) series for exactly this reason.
