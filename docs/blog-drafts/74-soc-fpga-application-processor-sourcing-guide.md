---
title: "SoCs and SoC FPGAs: The Healthiest Processor Category, and the One Where ES Silicon Circulates"
slug: "soc-fpga-application-processor-sourcing-guide"
status: "draft"
seoTitle: "SoC and SoC FPGA Sourcing: Zynq, Cyclone V SoC, SmartFusion2, PSoC, Modules"
seoDesc: "4,779 SoC parts at only 13% inactive — but the category is FPGA-SoC heavy and engineering-sample silicon circulates. Speed grades, ES suffixes, SoM modules and boot-image dependencies."
seoKeywords: "SoC FPGA sourcing, Zynq XC7Z availability, Cyclone V SoC 5CS, SmartFusion2 M2S obsolete, engineering sample ES suffix, Trenz SoM obsolete, PSoC CY8C sourcing, speed grade FPGA SoC"
tags: "SoC, SoC FPGA, Zynq, Cyclone V, SmartFusion2, PSoC, engineering samples, modules, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Processors, DSP & SoC"
relatedProducts: "XC7Z020-1CLG484C, 10AS066K3F35I2SGES, M2S005-1TQ144, TE0720-03-61Q33MA, CY8C24123A4-24PXI, R8A774C0HA01BG#G0, R9A07G044C22GBG#AC0, P5021NSE7VNC"
---

# SoCs and SoC FPGAs: The Healthiest Processor Category, and the One Where ES Silicon Circulates

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: what is really in this category, engineering samples, speed grades, modules, boot images, obsolescence

---

**Our [SoC category](/category/soc) holds 4,779 part numbers with only 645 inactive — 13%, by far the healthiest processor category we have.** But the reason is worth understanding before you rely on it: this category is dominated by **programmable-logic SoCs**, not application processors. Altera accounts for 2,014 part numbers, Xilinx 1,086 and Microsemi 903 — together 84% of the category. These are Zynq, Cyclone V SoC, Arria 10 SoC and SmartFusion2 devices, whose lifecycles follow FPGA product lines rather than consumer processor roadmaps, and FPGA vendors support parts for a very long time. The corollary is a specific hazard that barely exists elsewhere in the catalogue: **engineering-sample silicon circulates in this market**, and an `ES` suffix is easy to overlook in a long ordering code.

## Key takeaways

- **13% inactive is real but comes from FPGA-vendor lifecycle policy**, not from application-processor stability.
- **`ES` means engineering sample.** `10AS066K3F35I2SGES` is obsolete in our catalogue and is not production-qualified silicon.
- **Speed grade is a functional specification on an FPGA-SoC**, because a compiled bitstream is timing-closed against it.
- **A bitstream is device-specific.** Same family, different density or package means recompilation and re-verification.
- **System-on-Module products carry two lifecycles** (the module's and the silicon's) and the module usually ends first: `TE0720-03-61Q33MA` is obsolete here.
- **Microsemi/Microchip SmartFusion2 has inactive ordering codes** (`M2S005-1TQ144`) despite the family being current — check the exact code.
- **Renesas RZ/G and R-Car parts are the live application-processor line** in our data, with `R8A204xx` variants in last-time buy.

---

## What this category actually contains

Before using an obsolescence rate, know what it is measuring. The vendor split:

| Vendor | Part numbers | What they are |
| --- | ---: | --- |
| Altera | 2,014 | Cyclone V SoC (`5CS…`), Arria 10 SoC (`10AS…`) |
| Xilinx | 1,086 | Zynq-7000 (`XC7Z…`), automotive Zynq (`XA7Z…`) |
| Microsemi | 903 | SmartFusion2 (`M2S…`), IGLOO2-based SoC |
| Trenz Electronic | 213 | **System-on-Module boards**, not chips |
| Broadcom | 150 | Application-specific SoCs |
| NXP | 100 | QorIQ / Layerscape (`LS10…`, `P5021…`) |
| Rochester Electronics | 91 | Aftermarket, including Cypress PSoC |
| Texas Instruments | 61 | Application processors |

Sub-family availability, measured 2026-08-04:

| Prefix | Family | Parts | Not active |
| --- | --- | ---: | ---: |
| `XC7Z…` | Zynq-7000 | 127 | 10 |
| `XA7Z…` | Zynq automotive | 8 | 2 |
| `5CS…` | Cyclone V SoC | 139 | 5 |
| `LS10…` | NXP Layerscape | 25 | **0** |

So the headline 13% is genuine for the FPGA-SoC families (Zynq at 8%, Cyclone V SoC at 4%) and these are among the most sourceable programmable devices in the catalogue. The inactive parts cluster in two places instead: Cypress PSoC ordering codes (`CY8C20236A-24LKXAT`, `CY8C20646A-24LTXIT`, `CY8CTMG201A-48LTXI`, `CY8CTST200A-24LQXI` are all obsolete here), and the module and engineering-sample material discussed below.

## Engineering samples: the hazard specific to this category

`ES` at the end of an ordering code means engineering sample. In our catalogue `10AS066K3F35I2SGES` (an Arria 10 SoC engineering sample) is obsolete, and that is exactly the kind of part number that reaches a purchasing system as "the same device, cheaper".

What engineering-sample silicon actually is:

- **Pre-production material**, released before full characterisation.
- **Subject to its own errata list**, often substantially longer than the production part's.
- **Not guaranteed to meet the final datasheet** for timing, power or temperature range.
- **Not qualified**, so reliability data does not apply to it.
- **Frequently at a lower speed grade in practice**, even where the code says otherwise.

A bitstream timing-closed on production silicon may not meet timing on ES silicon, and ES parts sometimes lack features enabled only in production steppings. For a product in the field, ES material is a warranty and traceability problem as well as a technical one.

How to avoid it: treat `ES`, `PRELIM`, and vendor-specific prototype markers as disqualifying unless the design is explicitly a prototype, and verify against the vendor's ordering-code documentation rather than pattern-matching. The same discipline applies to Freescale's `XPC` prefix described in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), and to the general provenance question in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Speed grade is not a performance preference

On an FPGA-SoC, the speed grade participates in the design's correctness.

The programmable-logic fabric's timing is closed by the vendor's tools against a specific speed grade's delay models. A slower-grade device fitted in place of a faster one means:

- **The bitstream's timing constraints are no longer met.** The design may work at room temperature and fail at temperature extremes, or fail on a subset of units: the worst failure distribution to debug.
- **The tools will not warn you.** The bitstream loads and the device runs; timing violations are silent.
- **The processor side may also be affected**, since maximum core frequency and DDR interface rates are grade-dependent.

In `XC7Z020-1CLG484C` (active in our catalogue) the `-1` is the speed grade. **A `-1` and a `-2` device are not interchangeable in a design closed against `-2`.** Fitting a faster grade than specified is safe from a timing standpoint but costs money and can change power dissipation.

Related and equally silent: the temperature grade. The letter near the end (`C` for commercial, `I` for industrial in many schemes) changes the guaranteed temperature range, and the tools close timing against the range you tell them, not the part you fit.

## A bitstream is device-specific

Programmable-logic SoCs add a dependency no application processor has: the compiled configuration.

| Change | Consequence |
| --- | --- |
| Different density in the same family (`XC7Z010` → `XC7Z020`) | **Recompile required**; pinout and resources differ |
| Different package, same die | Recompile — pin assignments change |
| Different speed grade | Recompile and re-verify timing |
| Different family (Zynq-7000 → Zynq UltraScale+) | Full redesign; different architecture and tools |
| Same part, newer tool version | Re-verification; results are not bit-identical |

And the toolchain has the same archival problem as DSP toolchains, described in [DSP sourcing](/blog/dsp-sourcing-guide): a bitstream built with a specific vendor tool version, on a licence that may be perpetual or subscription, sometimes requiring a licence server and a supported host OS. **If the source project cannot be rebuilt, the device density and package are frozen for the life of the product**, which turns a healthy supply position into a single-ordering-code dependency.

Practical measure: archive the tool version, the licence arrangement, the project and a known-good bitstream together, and record which exact ordering code the bitstream was closed against. That record is what makes a future substitution assessable.

## System-on-Module: two lifecycles, and the module ends first

Trenz Electronic accounts for 213 part numbers in this category, and those are modules — small boards carrying an SoC, memory, power and a connector.

Modules are attractive because they remove the hard part of the design: a Zynq or Cyclone V SoC with DDR routing, power sequencing and configuration flash already solved. The sourcing consequence is usually missed:

- **The module has its own lifecycle**, generally shorter than the silicon's, because module vendors are small and revise frequently.
- **A module revision can change the memory part, the power sequencing or the connector pinout**, none of which appear in a "same module" part number without careful reading.
- **The carrier board's design is captive to the module's connector standard.**
- **When the module ends, you inherit the design you avoided** (DDR layout, power sequencing, configuration) at the worst possible moment.

`TE0720-03-61Q33MA` is obsolete in our catalogue: a module part number whose fields encode the silicon variant, the memory fit and the revision. **When sourcing a module, record which silicon and memory the revision carried**, so that a later "equivalent" can be assessed rather than assumed.

The honest trade-off: modules are the right choice for low volume and fast development, and the wrong choice for a fifteen-year industrial product unless the vendor commits to longevity in writing.

## Application processors and PSoC: the parts that do behave like processors

Two groups in this category follow processor economics rather than FPGA economics.

Renesas RZ and R-Car. Active in our catalogue: `R8A774C0HA01BG#G0`, `R8A774A0HA01BG#G2` (RZ/G2 class), `R9A07G044C22GBG#AC0` (RZ/G2L class), `R9A06G032VGBA#AC1`. In last-time buy: `R8A20420ABG-G#G0`, `R8A20400BG-GU#G0`, `R8A20330BG-G#G0`, `R8A20450BA-G#G0`, `R8A20421ABG-G#U0` and `R9A06G030GBA#BC0`. **Note the `#G0` / `#U0` suffix pattern** — Renesas uses it to distinguish packing and variant, and the same base device appears with several, each with its own status. As with the configured parts in [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide), the full code is the product.

NXP QorIQ/Layerscape. `P5021NSE7VNC` is obsolete here while the `LS10…` Layerscape prefix shows zero inactive across 25 part numbers: the same generational split described for PowerQUICC in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide).

Cypress PSoC. `CY8C24123A4-24PXI` and `CY8C24123A5-24PXI` are active through Rochester Electronics; `CY8C20236A-24LKXAT`, `CY8C20536A-24PVXIT`, `CY8C20646A-24LTXIT`, `CY8CTMG201A-32LQXI`, `CY8CTMG201A-48LTXI` and `CY8CTST200A-24LQXI` are obsolete. PSoC's configurable analogue and digital blocks are set by a project file, so **PSoC carries the same "the configuration is part of the product" problem as an FPGA**, with the additional issue that PSoC 1, 3, 4 and 5 are different architectures with different tools.

## What to check before ordering

The ordering code carries more of the specification here than in almost any other category. For an FPGA-SoC:

| Field | Example in `XC7Z020-1CLG484C` | Why it matters |
| --- | --- | --- |
| Family and density | `XC7Z020` | Fabric resources; bitstream is density-specific |
| Speed grade | `-1` | **Timing closure** |
| Package | `CLG484` | Pinout, ball count, height |
| Temperature grade | `C` | Guaranteed range |
| Qualification | (`XA` prefix for automotive) | AEC-Q qualification |
| Sample marker | (`ES` suffix) | **Not production silicon** |

For a Renesas or NXP application processor, add the packing/variant suffix (`#G0`, `#U0`, `NSE7VNC`-style blocks) and the silicon revision, which as in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide) is not in the orderable code.

## Sourcing notes

This is the one processor category where the answer is often simply "yes, in stock, buy it" — Zynq-7000 at 8% inactive and Cyclone V SoC at 4% are healthy by any standard. The work is in specifying correctly rather than in hunting.

Where problems concentrate:

- **Cypress PSoC ordering codes**, following the Cypress-to-Infineon transition. Rochester Electronics supplies some as aftermarket.
- **Modules**, per the discussion above.
- **Engineering samples**, which are a provenance problem rather than a supply problem.
- **Older application processors** — `P5021NSE7VNC` obsolete, the Renesas `R8A204xx` group in last-time buy.

Incoming inspection for SoCs:

- **Read the device DNA / IDCODE** and confirm family, density and revision.
- **Check the ordering code on the package against the purchase order character by character**, specifically the speed grade, temperature grade and any sample marker. This is the single highest-yield check in this category.
- **Load the production bitstream or boot image and run the product's own self-test** at the temperature extremes the design claims, because a speed-grade substitution passes at room temperature.
- **X-ray the BGA** and check date-code consistency, per [date codes and lot traceability](/blog/date-code-lot-traceability-explained) and [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | `ES` or other sample marker absent | Unqualified silicon in production |
| 2 | Speed grade matches the closed bitstream | Silent timing violations, temperature-dependent failures |
| 3 | Temperature grade | Out of specification at extremes |
| 4 | Density and package identical, or bitstream rebuilt | Configuration will not load or fit |
| 5 | Toolchain and licence available to rebuild | Ordering code frozen for the product's life |
| 6 | Silicon revision vs validated boot image | Errata mismatch |
| 7 | Packing/variant suffix (`#G0`, `#U0`) | Wrong variant status or packing |
| 8 | Module revision: silicon, memory, connector | Carrier board incompatibility |
| 9 | DDR memory part still available | Module or board redesign |
| 10 | Boot source and configuration flash | Does not configure or boot |
| 11 | Power rails and sequencing | Damage or no start |
| 12 | Automotive qualification (`XA` prefix) | Requalification required |

## FAQ

### Why is the SoC category so much healthier than microprocessors?

Because it is mostly programmable-logic SoCs, whose lifecycles follow FPGA product lines. Altera, Xilinx and Microsemi account for 84% of the 4,779 part numbers we hold, and FPGA vendors support families for very long periods because their customers are industrial, aerospace and infrastructure. Zynq-7000 runs 10 of 127 ordering codes inactive and Cyclone V SoC 5 of 139, against 64% inactive across the MPU category. The rate is real, but it is a statement about FPGA lifecycle policy rather than about application processors in general.

### What does an ES suffix mean and why does it matter?

Engineering sample: pre-production silicon released before full characterisation, with its own errata list, no qualification data, and no guarantee of meeting the final datasheet for timing, power or temperature. In our catalogue `10AS066K3F35I2SGES` is an obsolete Arria 10 SoC engineering sample. A bitstream timing-closed on production silicon may not meet timing on ES material, and some features are enabled only in production steppings. Treat `ES` as disqualifying for production, and verify ordering codes against vendor documentation rather than by pattern.

### Can I fit a different speed grade of the same FPGA-SoC?

Only a faster one, and only if power and cost allow. The vendor's tools close your design's timing against a specific speed grade's delay models, so a slower device silently violates those constraints: the bitstream loads, the board runs, and failures appear at temperature extremes or on a subset of units. That is the hardest failure distribution to diagnose. A faster grade is safe for timing but costs more and can change power dissipation, which may matter thermally.

### Do I need to recompile the bitstream for a different package or density?

Yes for both. Pin assignments are package-specific, so a different package requires re-implementation even on the same die, and a different density has different resources and a different device model. A newer tool version also produces a different result, so a rebuild is a re-verification event rather than a formality. This is why archiving the tool version, licence, project and a known-good bitstream matters: without them, the exact ordering code is frozen for the product's life, regardless of how healthy the family looks.

### Are System-on-Module products a good sourcing choice?

For low volume and fast development, yes. For a long-life industrial product, only with a written longevity commitment, because the module has its own lifecycle, generally shorter than the silicon's, and module vendors are small and revise often. A revision can change the memory part, the power sequencing or the connector pinout without an obvious part-number change. When the module ends, you inherit the design work you avoided (DDR routing, power sequencing, configuration) at the worst moment. `TE0720-03-61Q33MA` is obsolete in our catalogue.

### What is the risk with PSoC parts specifically?

Two things. First, ordering-code attrition: `CY8C20236A-24LKXAT`, `CY8C20646A-24LTXIT`, `CY8CTMG201A-48LTXI` and `CY8CTST200A-24LQXI` are all obsolete in our catalogue, while `CY8C24123A4-24PXI` remains available through Rochester Electronics as aftermarket. Second, the configuration: PSoC's analogue and digital blocks are defined by a project file, so the design is captive to a tool version much like an FPGA bitstream, and PSoC 1, 3, 4 and 5 are different architectures with different tools, so there is no straightforward migration between them.

### How do I read a Renesas application-processor part number?

Treat the whole string, including the suffix after the `#`, as the product. In our catalogue `R8A774C0HA01BG#G0` is active while several `R8A204xx` codes with `#G0` and `#U0` suffixes are last-time buy: the suffix distinguishes packing and variant, and status differs per code. As with factory-configured oscillators and PMICs, a supplier offering "the same base part, different suffix" is offering something else, so compare the full ordering code and ask what the suffix changes.

### What should incoming inspection check on an FPGA-SoC?

The ordering code on the package, character by character, against the purchase order — specifically the speed grade, the temperature grade and any sample marker, since those are the fields a substitution changes and the ones that fail silently. Then read the device IDCODE to confirm family, density and revision, load the production bitstream and boot image, and run the product's own self-test at the temperature extremes the design claims. Room-temperature testing does not detect a speed-grade downgrade, which is the most likely problem.

## Related reading

The rest of this cluster: [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), [DSP sourcing](/blog/dsp-sourcing-guide), [specialty logic: DDR registers and ECL](/blog/specialty-logic-ddr-ecl-sourcing-guide).

Because the fabric side is an FPGA: [how to choose the right FPGA](/blog/how-to-choose-right-fpga), [FPGA obsolescence and end-of-life planning](/blog/fpga-obsolescence-spartan-cyclone-end-of-life), and [sourcing Xilinx 7 Series and Zynq-7000](/blog/xilinx-7-series-zynq-sourcing) for the device-level detail on the family that dominates this category.

The system around it: [DRAM and SDRAM legacy sourcing](/blog/dram-sdram-legacy-sourcing), [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide) for configuration and boot devices, [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide) for rails and sequencing.

Send us the full ordering code — including speed grade, temperature grade and any suffix after a `#` or at the end. In this category the code is the specification, and we check it before quoting.

[**Submit an RFQ**](/rfq) | [**Browse SoCs**](/category/soc) | [**Upload a BOM**](/bom)
