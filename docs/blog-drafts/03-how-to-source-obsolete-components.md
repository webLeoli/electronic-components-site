# How to Source Obsolete Electronic Components: 5 Proven Paths

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~12 minutes
> **Topics**: obsolete sourcing, procurement strategy, supply chain risk

---

## The cost of obsolescence in modern BOMs

A 2018 SAE survey of aerospace and defense electronics buyers reported that the average bill of materials carried 8-15% of part numbers in some stage of lifecycle decline — NRND, end-of-life, or fully obsolete. Industrial control and medical electronics carry similar exposure: any product designed to ship for more than 5 years inevitably reaches a point where a meaningful share of its BOM is no longer in authorized distribution.

The cost of obsolescence is not just the procurement premium. It shows up in three predictable buckets:

- **Sourcing premium**: obsolete parts sourced through specialty channels typically cost 1.5-5× the original authorized-distribution price, sometimes 10× or more for high-demand military and aerospace items.
- **Project delay**: the cycle from "we can't get this part" to "we have a verified replacement source" averages 4-12 weeks under normal conditions, longer if redesign is required.
- **Inspection and verification overhead**: every specialty-sourced part should go through some level of counterfeit avoidance inspection, adding cost and lead time beyond raw procurement.

The "just buy more" reflex — stockpiling parts whenever possible — is a partial answer but not a strategy. The right approach treats obsolescence as an inevitable lifecycle stage that can be planned for, not a crisis to be solved part by part.

This guide walks through the five sourcing paths available when a part falls out of authorized distribution, with cost and risk tradeoffs for each.

## The five sourcing paths

| Path | Typical lead time | Cost vs original | Counterfeit risk | Best suited for |
|---|---|---|---|---|
| Authorized distributor residual stock | 1-7 days | 1.0× | Very low | Recently EOL'd parts |
| Manufacturer last-time-buy | 0-30 days | 1.0-1.2× | Very low | Parts with formal LTB announced |
| Specialty distributor (NOS) | 1-4 weeks | 1.5-5× | Medium (mitigated by inspection) | Parts EOL'd > 2 years |
| Authorized aftermarket | 4-12 weeks | 2-5× | Very low | Mil-aero, parts with wafer-banked programs |
| Pin-compatible redesign | 3-12 months | Varies | N/A | High volume, long remaining product life |

Each path has a place in a well-built procurement strategy. The right choice depends on volume, criticality, remaining product life, and verifiable supplier quality. Below, each path with its operational details.

## Path 1: Authorized distributors first

When a part is newly EOL'd, the first stop is always authorized distribution — Mouser, Digi-Key, Arrow, Avnet, Future Electronics, and the franchise distributors local to your region. These are the lowest-risk and lowest-cost sources. Counterfeit risk is essentially zero because franchise distributors source directly from the manufacturer under contract.

Two practical points:

**Authorized stock can persist longer than you'd expect.** A part that the manufacturer EOL'd two years ago may still have residual franchise stock for another 1-3 years. Check authorized distribution before assuming the part has left the channel.

**Some manufacturers retain an LTB window even past their official EOL date.** Texas Instruments, Microchip, NXP, and several others have informal processes for last-time-buy requests on parts that haven't fully closed out their wafer inventory. It's worth a direct request to the manufacturer's sales team if your volume justifies it.

The pitfall to avoid: waiting until authorized stock is empty before starting the conversation. By the time franchise distributors return "0 available," the easier sourcing paths have closed.

## Path 2: Catching the last-time-buy window

When a manufacturer issues a formal Product Discontinuance Notice (PDN), it typically gives 6-12 months between announcement and the last-order date. This window is the highest-leverage moment in the entire lifecycle: parts purchased in the LTB window cost manufacturer pricing, with full traceability, and lock in supply for years of production.

The procurement question during LTB is always the same: **how much to buy?** A defensible answer requires four inputs:

1. **Remaining product lifetime** in years
2. **Forecast annual usage** for that part
3. **Safety factor** to handle forecast error (10-30% is common)
4. **Storage cost** weighed against future procurement premium

A simple formula: `LTB quantity = annual usage × remaining years × (1 + safety factor) × scrap allowance`. Most teams find that LTB stockpiles for 3-7 years of demand are financially defensible; longer than that, redesign or alternate sourcing becomes more cost-effective.

To catch LTB windows reliably, subscribe to PCN feeds for every part in your BOM. Major aggregator tools — SiliconExpert, Z2Data, Eaton TraceParts (formerly IHS Markit) — provide automated alerts. For smaller BOMs, manufacturer email subscription works.

(See our companion piece on [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) for how to build a continuous monitoring process.)

## Path 3: Specialty distributors and new-old-stock

Once a part has left authorized distribution and there's no LTB opportunity to fall back on, specialty distributors are the primary source. This is the channel that operates outside franchise relationships — independent distributors holding inventory from various sources: original manufacturer overrun, end-of-program inventory from former customers, decommissioned production lines, and franchise distributor close-outs.

**New-old-stock (NOS)** refers to parts that were manufactured during the part's production life but never installed in a product. NOS parts can be 5, 10, or 20+ years old in storage. When stored under proper conditions (controlled humidity, ESD protection, original packaging) most modern IC technologies remain functional for decades. The main concerns with NOS parts are:

- **Date code consistency** with what's claimed
- **Storage history** documentation
- **Package material aging** (lead oxidation, moisture absorption)
- **Counterfeit substitution** mixed in with genuine NOS lots

How to evaluate specialty distributors:

- **ERAI membership**: a published list of independent distributors that have agreed to industry quality standards and counterfeit reporting protocols.
- **Quality certification**: ISO 9001 at minimum; AS9120 for aerospace-grade.
- **Inspection protocol**: ideally IDEA-STD-1010-B or AS6081-compliant. (See [What is IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).)
- **Traceability documentation**: a certificate of conformance for each shipment with lot/date codes and supply chain provenance.
- **Years in business**: longer-tenured distributors have more reputational stake in not selling counterfeit parts.

FPGACenter operates in this channel, focused on FPGA, CPLD, and obsolete IC sourcing. Our approach is described later in this guide.

## Path 4: Authorized aftermarket

A small number of manufacturers have formal aftermarket programs that continue producing parts after the original wafer fab is closed. **Rochester Electronics** is the largest example — they hold authorized aftermarket licenses for parts from Analog Devices, Texas Instruments, NXP, Renesas, and many others. They use wafer-banked inventory and licensed remanufacturing to keep parts available for decades after the original manufacturer has moved on.

The advantage of authorized aftermarket: parts are functionally and electrically equivalent to the original (often manufactured on the same equipment with the same masks), with full traceability and authorized-distribution-level counterfeit risk (essentially zero).

The constraint: aftermarket coverage is selective. Only a subset of EOL parts have aftermarket programs, typically those with strong continuing demand from aerospace, defense, and medical sectors. Coverage for general-purpose consumer or industrial parts is much thinner.

Lead times for aftermarket parts are typically 4-12 weeks because of the made-to-order nature of authorized remanufacturing. Pricing runs 2-5× original.

## Path 5: Pin-compatible replacement or redesign

When sourcing premium exceeds redesign cost over the remaining product life, replacement becomes the rational choice. Two flavors:

**Drop-in pin-compatible replacement**: many parts have functionally equivalent successors from the same vendor (e.g., Xilinx Spartan-3 → Spartan-6 → Spartan-7 have overlapping pin-compatible footprints in certain packages). Cross-reference tools from major distributors and chip-finder databases identify candidates. Always test thoroughly — pin compatibility doesn't guarantee electrical or timing equivalence.

**Cross-vendor replacement**: Lattice CPLDs can sometimes substitute for Xilinx CoolRunner, Microchip MCUs can sometimes substitute for legacy Atmel parts, and so on. These require careful comparison of electrical characteristics, package thermal behavior, and timing margins.

**Functional replacement with redesign**: when no pin-compatible part exists, redesign of the affected subassembly is the path. This is usually 3-12 months of engineering effort with associated qualification, test, and documentation overhead.

The decision math: if your remaining product life × annual demand × sourcing premium exceeds the engineering and qualification cost of replacement, replacement wins. For high-volume products with 5+ years remaining, this is often the case. For low-volume legacy products, sourcing through specialty channels is usually more economical.

## Building a sourcing playbook for your team

A repeatable process is more valuable than one-off heroics. A workable team playbook has four stages:

**Stage 1: Identify** — quarterly BOM scrub flags parts approaching or in lifecycle decline. (See [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).)

**Stage 2: Search** — for each flagged part, check authorized distribution → LTB window → aftermarket coverage → specialty distribution, in that order. Document each path checked even if no inventory found.

**Stage 3: Verify** — for any source outside authorized distribution, require traceability documentation and ideally IDEA-1010-style inspection on receipt. Conditional acceptance until inspection passes.

**Stage 4: Document** — record every sourcing decision with rationale, cost, and supplier in a sourcing log. This becomes the institutional memory for the next time the same part comes up.

A useful supplier onboarding checklist for specialty distribution:

- [ ] Business registration verified
- [ ] ERAI membership (or equivalent listing)
- [ ] ISO 9001 / AS9120 certification on file
- [ ] Inspection protocol documented (IDEA-1010, AS6081, or equivalent)
- [ ] Sample inspection report reviewed
- [ ] Reference customers contacted
- [ ] NDA and supply agreement signed
- [ ] First-article inspection of a low-risk part before high-value orders

## How FPGACenter approaches obsolete sourcing

For parts that have left authorized distribution, our process is built around three principles:

**Supplier qualification first.** Every supplier in our network is qualified through documentation review, sample inspection history, and ongoing performance tracking. We prioritize suppliers with verifiable quality certification and franchise relationships where they exist.

**Inspection before shipment.** Parts received from non-authorized sources are inspected against IDEA-STD-1010-B protocol — external visual, marking permanency, package material analysis, and lot documentation review. Electrical sampling and decapsulation are applied where appropriate to lot size and criticality.

**Traceability documentation.** Each shipment carries a certificate of conformance with lot codes, date codes, supply chain provenance, and inspection findings. Documentation is retained for the lifetime of the customer relationship.

We focus on FPGA, CPLD, and IC sourcing — particularly for parts that have left authorized distribution and require specialty channel access combined with verification. We do not operate as an authorized aftermarket distributor in the Rochester Electronics sense; we are a specialty distributor with a quality-controlled sourcing process.

## FAQ

**How fast can obsolete parts be sourced?**
Lead times depend heavily on how rare the part is. Common obsolete parts can ship in 1-4 weeks from specialty distribution stock. Rare or high-demand parts can take 6-12 weeks to source verifiably.

**How much premium should I expect on obsolete parts?**
A reasonable range is 1.5-5× the original authorized-distribution price. Premiums above 10× usually indicate either very low remaining global supply or a counterfeit market premium — treat these with extra scrutiny.

**Is it always better to redesign than source obsolete parts?**
No. For low-volume legacy products with limited remaining production life, specialty sourcing is almost always more economical than redesign. The break-even depends on volume, premium, and remaining years.

**How do I evaluate a specialty distributor I haven't worked with before?**
Use the seven-point qualification checklist above. The single most valuable signal is whether they can produce a real inspection report (not a generic certificate) on a sample lot.

**What's the difference between specialty distribution and brokerage?**
Specialty distributors hold inventory under controlled conditions with documented quality systems. Brokers typically operate as intermediaries without holding stock or applying their own quality processes. Specialty distribution carries lower risk; brokerage carries higher risk and should require additional verification.

---

**Need help sourcing obsolete or hard-to-find parts?**

FPGACenter specializes in obsolete IC, FPGA, and CPLD sourcing across 380+ manufacturers. Every part received from non-authorized channels passes through IDEA-STD-1010-aligned inspection with full traceability documentation, no minimum order quantity, and global express shipping.

We also support BOM lifecycle analysis for teams running quarterly procurement risk reviews — identifying NRND, EOL, and obsolete exposure before it reaches production.

[**Submit an RFQ**](/rfq) | [**Browse our catalog**](/category) | [**Run a BOM through us**](/bom)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17

---

## DB import metadata

```yaml
title: "How to Source Obsolete Electronic Components: 5 Proven Paths"
slug: "how-to-source-obsolete-electronic-components"
status: "draft"
seoTitle: "How to Source Obsolete Electronic Components: A Buyer's Guide"
seoDesc: "Five proven paths to sourcing obsolete ICs: authorized distributors, last-time-buy, specialty distributors, aftermarket, and redesign. Cost and risk tradeoffs."
seoKeywords: "obsolete electronic component sourcing, obsolete IC sourcing, hard-to-find component sourcing, NOS, new old stock, specialty distributor"
tags: "obsolete sourcing, procurement, supply chain, EOL, NOS, last-time-buy, IDEA-1010"
author: "FPGACenter Sourcing Team"
readingTime: 12
category: "Procurement & Supply Chain"
```
