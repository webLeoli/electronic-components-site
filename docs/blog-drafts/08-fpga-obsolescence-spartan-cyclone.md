# FPGA Obsolescence: Planning for the End-of-Life of Classic Families

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~10 minutes
> **Topics**: FPGA, obsolescence, legacy design, sustaining engineering, Spartan, Cyclone

---

## The FPGA obsolescence wave is here

The FPGA industry consolidated dramatically over the last decade. AMD's 2022 acquisition of Xilinx, Intel's earlier 2015 acquisition of Altera (with a 2024 partial spinout as a standalone Altera entity), and the rolling consolidation of Lattice, Microsemi (now Microchip), and QuickLogic all reset roadmap decisions for hundreds of legacy FPGA families.

The effect for engineers and procurement teams sustaining FPGA-based products is concrete: families that anchored designs from 2005-2015 are now in various stages of end-of-life. **Xilinx Spartan-3**, **Spartan-3E**, and **Virtex-II/Virtex-II Pro** have been formally discontinued for years. **Altera Cyclone II** has reached End-of-Life status. Other classic families — **Spartan-6**, **Cyclone IV**, **Lattice MachXO** — have moved through Mature or NRND status and are heading toward formal EOL on different timelines.

For engineers maintaining legacy designs, this guide covers what FPGA obsolescence actually involves, what sourcing options remain, and how to plan migration when sourcing is no longer viable.

> **Note**: specific lifecycle status changes over time. Verify current status on the manufacturer's product page (Xilinx/AMD, Altera/Intel, Lattice, Microchip) or through a lifecycle aggregator before making procurement decisions. Status referenced in this article reflects publicly known data as of mid-2026.

## What "FPGA obsolescence" actually means

Unlike most ICs, FPGA obsolescence has three layers, and a sustaining engineer needs to think about all three.

**Layer 1: Silicon production stopped.** The wafer fab that produced the FPGA has been decommissioned or moved to other products. No new parts are being made. Authorized distribution inventory is the last batch from genuine manufacturer supply.

**Layer 2: Tools no longer updated.** FPGA bitstream generation requires vendor-specific tools (Xilinx ISE for Spartan-3 through Virtex-6 era, Quartus II for older Altera, modern Vivado for 7-series and later Xilinx, Quartus Prime for newer Altera/Intel). Once a tool version is end-of-life, it doesn't get security patches, doesn't support new operating systems, and may stop working under modern OS updates.

For example: Xilinx ISE Design Suite version 14.7 is the final version supporting Spartan-3, Virtex-II/Pro, and Spartan-6. The last update was in 2013. Running it on a current Windows 11 installation requires careful environment setup (sometimes a virtualized older Windows or Linux distribution). Programming hardware (Xilinx Parallel Cable IV, Platform Cable USB) similarly has driver limitations on modern systems.

**Layer 3: Documentation archived.** As a family moves from Mature to NRND to EOL, the manufacturer's website progressively removes the part from active navigation. Datasheets and user guides eventually move to archive sections, then sometimes disappear entirely from the main site. For engineers debugging a legacy design 15-20 years after release, this is more of a problem than the silicon supply.

Planning for FPGA obsolescence means planning for all three layers, not just procurement.

## Currently end-of-life or transitioning FPGA families (as of mid-2026)

Below are the family-level statuses most commonly encountered in sustaining engineering. Status terminology can vary by source (Mature, NRND, EOL, Obsolete); the manufacturer's product page is the authoritative reference. Verify before making decisions.

**Xilinx (AMD)**

- *Spartan-3 family* — Formally discontinued years ago. Authorized stock minimal; specialty distribution holds NOS inventory.
- *Spartan-3A / 3AN / 3E* — Discontinued. Similar sourcing landscape to Spartan-3.
- *Virtex-II / Virtex-II Pro* — Discontinued. Some military / aerospace variants have authorized aftermarket support.
- *Spartan-6* — Mature, with NRND status on many SKUs. Still in authorized distribution but procurement teams should be tracking it.
- *Virtex-4 / Virtex-5* — Mature / NRND, in residual authorized stock.
- *7-series* (Spartan-7, Artix-7, Kintex-7, Virtex-7) — Currently Active across most SKUs; expected to remain so for several more years.

**Altera (Intel/Altera Corp)**

- *Cyclone II* — End-of-life. Authorized stock thin; specialty distribution is primary channel.
- *Cyclone III* — Mature, with portions discontinued.
- *Cyclone IV* — Mature / NRND on several SKUs.
- *MAX 3000 / MAX 7000* (CPLD families) — Discontinued years ago.
- *MAX II* — Mature, in residual authorized stock.
- *Stratix II / III* — Discontinued.
- *Cyclone V / Stratix V* — Currently Active; long-term roadmap uncertain after the 2024 spinout.

**Lattice and others**

- *Lattice ispMACH 4000* — Mature / phasing out.
- *Lattice MachXO* (original) — Discontinued; MachXO2/XO3 active.
- *Microsemi / Microchip ProASIC3* — Mature; some variants discontinued.

The pattern across families: **older 90nm / 65nm / 45nm process node FPGAs are progressively EOL'd as the underlying fab process is decommissioned**, while newer 28nm and below process families (Xilinx 7-series and UltraScale, Altera Stratix V and Cyclone V) remain in active production for now.

## Sourcing strategies for classic FPGAs

When a sustaining engineering team needs more parts of a discontinued family, the practical paths in order of preference:

**Path 1: Authorized distributor residual stock.** Mouser, Digi-Key, Arrow, Avnet, Future. Even years after formal EOL, residual franchise stock can persist. This is the lowest-risk path and should always be checked first.

**Path 2: Specialty distribution with verified inspection.** For parts that have left authorized distribution, specialty distributors hold new-old-stock from various sources: franchise close-outs, original-equipment overrun, decommissioned production lines. Verifiable quality systems and IDEA-STD-1010-style inspection are essential — discontinued FPGAs are high-value targets for counterfeit remarking. (See [What is IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).)

**Path 3: Authorized aftermarket where it exists.** Rochester Electronics holds authorized aftermarket licenses for some Xilinx and Altera parts, particularly for military and aerospace applications. Coverage is selective — not every discontinued FPGA has aftermarket support.

**Path 4: Drop-in pin-compatible upgrade within the same vendor family.** In some cases, a newer family member shares pinout and footprint with the older part (with caveats around supply voltage and electrical timing). Xilinx Spartan-3 → Spartan-6 has partial footprint compatibility on some packages; Cyclone II → Cyclone IV similarly. Always verify with the datasheet — pin compatibility doesn't guarantee electrical equivalence, and tool migration is usually required.

**Path 5: Cross-vendor migration**. If neither sourcing nor in-family upgrade works, migration to a different vendor's equivalent (Xilinx → Lattice, Altera → Microchip ProASIC) is possible but requires RTL re-synthesis, timing closure, and full re-qualification. This is engineering work measured in months, not days.

Counterfeit risk on discontinued FPGAs is non-trivial. Some publicly documented incidents have involved remarked or salvaged Xilinx and Altera parts. The single most important risk mitigation is sourcing through channels with verifiable inspection and traceability — not the lowest price.

## Tool chain and programming challenges

Sourcing the silicon is only half the problem. The tool chain matters at least as much.

**Bitstream generation**. The original synthesis tool version is usually the safest path. For Spartan-3 era parts, ISE 14.7 (last release 2013). For Cyclone II era, Quartus II 13.0sp1 or earlier. Building these tools to run on a modern OS often requires a virtualized environment running Windows 7 or an older Linux distribution.

**Programming cables and JTAG hardware**. Xilinx Parallel Cable IV (parallel-port-based) is essentially unusable on modern PCs without a USB-to-parallel adapter and significant compatibility work. The Platform Cable USB II works under ISE 14.7 but driver compatibility on Windows 11 requires manual installation steps. Altera ByteBlaster and USB-Blaster equivalents have similar issues.

**Bitstream archival**. The most important sustaining engineering practice for legacy FPGA designs: archive the bitstream (compiled .bit / .sof / .pof files) along with the source code and the exact tool version used to build it. A bitstream is essentially permanent — it doesn't drift, and it doesn't depend on tool availability to deploy. As long as the bitstream is stored safely, the part can be programmed with whatever programming infrastructure is available.

For active sustaining engineering teams: build and archive a clean bitstream before the tool environment becomes harder to reproduce. This decision pays back many times over the product lifetime.

## Migration paths when sourcing is no longer viable

When neither authorized distribution nor specialty channels can provide adequate supply, migration becomes the alternative.

**In-family migration**. Where the manufacturer has provided a successor family with pin-compatible packages, this is usually the lowest-effort migration. Xilinx Spartan-3 to Spartan-6 in 144-TQFP packages, for example, is partially pin-compatible — but supply voltages and some I/O standards differ enough that careful electrical review is required. The bitstream needs to be regenerated for the new family; RTL typically migrates with minor adjustments.

**Cross-vendor migration**. When in-family migration isn't an option, cross-vendor migration is the next step. Lattice has positioned MachXO2/XO3 as a migration target for several legacy CPLD families. Microchip ProASIC and IGLOO families have served as migration targets for some legacy designs. The migration effort scales with design complexity: a small CPLD with simple combinational logic might migrate in days; a Virtex-II-Pro design with embedded PowerPC cores might be effectively a redesign.

**Hard processor migration**. Designs that used FPGA-embedded soft cores (MicroBlaze, Nios II) generally migrate to newer FPGAs with similar soft-core support more easily than designs using hard cores (PowerPC in Virtex-II Pro), where the hard core's exact behavior is part of the system architecture.

The decision math for migration vs continued sourcing: if the remaining product lifetime × annual usage × per-unit sourcing premium exceeds the migration engineering cost, migration wins. For high-volume products with 3+ years remaining, this is often the case. For low-volume legacy products, continued sourcing through specialty channels is usually more economical.

## Real-world sustaining: a typical pattern

A common sustaining engineering pattern looks like this: a product released in 2009 used a Spartan-3E for glue logic and a Cyclone II for a higher-bandwidth data path. By 2024, both are end-of-life. The sustaining team has 5 years of remaining product lifetime and an annual usage of 500 units across both parts.

Option A: source through specialty distribution. Premium of 2-4× original pricing on each part, total sourcing cost over remaining lifetime is in the high six figures, with associated inspection overhead.

Option B: migrate to newer FPGAs. Pin-compatible migration on the Spartan-3E to a Spartan-6 variant requires tool migration and a board respin (no perfect pin match across packages). Cyclone II to Cyclone IV similarly. Engineering and qualification cost might also be in the six figures, but produces a board that's sustainable for the next decade.

The trade-off is rarely obvious. The cost calculations need to account for engineering risk (migration can take longer than planned), continued supply chain risk on the migrated parts (Spartan-6 itself is now Mature), and the operational cost of running an aging-tool environment versus a current one.

This is exactly the type of decision where FPGA sustaining engineering becomes a strategic procurement function as much as a technical one.

## How FPGACenter supports legacy FPGA needs

We carry deep inventory specifically in legacy FPGA and CPLD families: classic Spartan series, Cyclone I-IV, Virtex-II-Pro through Virtex-5, MAX 3000/7000 CPLDs, ispMACH and similar. Most of this inventory is new-old-stock from various qualified specialty channels.

Each lot undergoes inspection aligned with IDEA-STD-1010-B protocol — external visual examination, marking permanency, lot documentation review — before it ships. For high-value or military-spec applications, electrical sampling and extended verification can be added.

We don't manufacture parts or hold authorized aftermarket licenses. We operate as a specialty distributor focused on the FPGA / CPLD / obsolete IC segment, with quality processes designed for sourcing parts that have left authorized distribution.

## FAQ

**Are Spartan-3 still being manufactured?**
No. The Spartan-3 family was formally discontinued and is no longer in active production. Supply comes from authorized residual stock (thin) and specialty distribution (new-old-stock).

**Can I get IDEA-1010 inspected Cyclone IV parts?**
Yes, through specialty distributors that follow IDEA-STD-1010 inspection protocols. Verify the inspection report before purchase. (See [How to evaluate a specialty distributor](/blog/how-to-source-obsolete-electronic-components).)

**How do I program an obsolete FPGA without the old tools?**
The simplest path is to archive a compiled bitstream during the tool environment's last reliable period and program directly from that bitstream. Modern programming hardware (newer Platform Cable variants, USB-Blaster II) can program many older FPGAs even when the original tool chain is no longer easily runnable.

**What's the typical lead time for Virtex-II?**
Specialty distribution lead times for Virtex-II family parts typically range from 1-6 weeks depending on the specific SKU and lot size required. Larger or rarer SKUs can take longer.

**Is a Spartan-6 still safe for a new design?**
The Spartan-6 family is currently Mature with NRND status on many SKUs. For new designs, the Xilinx 7-series (Spartan-7, Artix-7) is the recommended successor. Spartan-6 remains procurable for sustaining of existing designs.

**When should I migrate vs continue sourcing?**
The break-even is when remaining product lifetime × annual usage × per-unit sourcing premium exceeds migration engineering cost. For high-volume products with 3+ years remaining, migration usually wins; for low-volume legacy products, continued sourcing is usually more economical.

---

**Need legacy FPGAs or CPLDs sourced verifiably?**

FPGACenter holds deep inventory in legacy FPGA and CPLD families — Spartan-3 through 6, Cyclone I-IV, Virtex-II through V, MAX 3000/7000 CPLDs, ispMACH, and many others. Each lot is inspected against IDEA-STD-1010 protocol with full traceability documentation, no minimum order quantity.

[**Browse FPGAs**](/category/fpgas) | [**Browse CPLDs**](/category/cplds) | [**Submit an RFQ**](/rfq)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17

---

## DB import metadata

```yaml
title: "FPGA Obsolescence: Planning for the End-of-Life of Classic Families"
slug: "fpga-obsolescence-spartan-cyclone-end-of-life"
status: "draft"
seoTitle: "FPGA Obsolescence: Planning for Spartan & Cyclone EOL"
seoDesc: "Classic FPGAs like Spartan-3 and Cyclone IV are entering end-of-life. Sourcing strategies, tool chain challenges, and migration paths for legacy designs."
seoKeywords: "FPGA obsolescence, Spartan EOL, Cyclone EOL, legacy FPGA sourcing, FPGA end of life, Spartan-3 obsolete, Virtex-II Pro EOL"
tags: "FPGA, Xilinx, Altera, Spartan, Cyclone, EOL, obsolescence, legacy design, sustaining engineering"
author: "FPGACenter Sourcing Team"
readingTime: 10
category: "FPGA & Programmable Logic"
```
