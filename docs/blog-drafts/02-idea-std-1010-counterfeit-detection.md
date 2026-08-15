---
title: "IDEA-STD-1010: The Industry Standard for Counterfeit IC Inspection"
slug: "idea-std-1010-counterfeit-detection-guide"
status: "draft"
seoTitle: "IDEA-STD-1010: Counterfeit IC Inspection Explained"
seoDesc: "IDEA-STD-1010-B is the industry inspection standard for counterfeit IC detection. What it covers, who needs it, and how to verify supplier compliance."
seoKeywords: "IDEA-STD-1010, IDEA-1010, counterfeit IC detection, counterfeit component inspection, AS6081, AS6171, electronic counterfeit"
tags: "IDEA-1010, counterfeit detection, quality, compliance, supply chain, AS6081, IC inspection"
author: "FPGACenter Sourcing Team"
readingTime: 10
category: "Quality & Compliance"
relatedProducts: "AD574AJE, AD7703AR, PCM1704U, ADG508FBN, EPM7064SLC44-10N, XC2VP7-6FF672I, AD7541AJP, REF102AP"
---

# IDEA-STD-1010: The Industry Standard for Counterfeit IC Inspection

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~10 minutes
> **Topics**: counterfeit detection, IDEA-1010, supply chain quality, compliance

---


<img src="/uploads/blog/idea-std-1010-counterfeit-detection-guide.webp" alt="Semiconductor inspection laboratory examining an IC for counterfeit indicators" width="1200" height="630" fetchpriority="high" />

## Why counterfeit ICs are still a serious supply chain problem

In the 2010s, the Senate Armed Services Committee documented counterfeit electronic parts in over 1,800 individual cases across U.S. military supply chains, with affected parts traced through more than 100 suppliers. The Electronic Resellers Association International (ERAI) and the Semiconductor Industry Association (SIA) have continued to publish annual reports showing that counterfeit incidents remain a persistent, multi-billion-dollar industry problem more than a decade later.

The reason is structural: when an IC is end-of-life, demand often continues for years afterward in industrial, medical, military, and aerospace systems. That demand creates a price differential that motivates counterfeiters to remark older or salvaged dies, repackage rejected wafers, or even sell entirely non-functional parts that look correct externally.

For procurement teams sourcing obsolete or hard-to-find parts, this is the operational reality: **the sourcing channel matters as much as the part itself**. A genuine part bought through an unverified channel may still be counterfeit by the time it reaches your production line.

**IDEA-STD-1010** is the inspection protocol most specialty distributors and procurement teams use to catch counterfeit components before they ship. This guide explains what it is, what it covers, who needs it, and how to evaluate whether a supplier's claim of "IDEA-1010 inspected" actually means what it should.

## What is IDEA, and what is IDEA-STD-1010-B?

**IDEA** stands for *Independent Distributors of Electronics Association*. It is an industry body that publishes inspection standards specifically designed for the independent and aftermarket distribution channel: the part of the supply chain that operates outside franchise/authorized distribution.

IDEA-STD-1010 is IDEA's specification for visual and electrical inspection of electronic components. The current published version is **IDEA-STD-1010-B (2017)**, which expanded the protocol from earlier revisions to incorporate detection techniques developed in response to evolving counterfeit methods. It covers more than 100 distinct inspection checks across eight broad categories.

It is important to note what IDEA-1010 is **not**: it is not the same thing as AS6081 (the SAE counterfeit avoidance standard for distributors) or AS6171 (the SAE test methods for counterfeit electronic parts). Those standards are part of a wider ecosystem published by SAE International. IDEA-1010 focuses specifically on the *receiving-side inspection protocol*. In practice, distributors that comply with AS6081 often also follow IDEA-1010 procedures as part of their inspection workflow.

## The eight inspection categories under IDEA-1010

A full IDEA-1010 inspection moves a part through several layers of verification, each designed to catch a different counterfeit indicator.

1. External Visual Inspection. The part is examined under low-power magnification (10×-40×) for surface anomalies: marking inconsistencies, residual paint or chemical wash marks, scratch patterns indicating remarking, package surface texture irregularities, and lead/pad oxidation patterns that don't match the claimed date code.

2. Marking Permanency Test. The part marking is subjected to controlled solvent exposure (typically a mineral spirit / acetone protocol) to determine whether the marking is original laser engraving or applied paint that can be removed and replaced. Markings that wipe off or smear are a strong counterfeit indicator.

3. Material and Surface Analysis (XRF). X-ray fluorescence is used to verify the package material composition matches what the manufacturer specifies (e.g. RoHS-compliant solder finish vs. tin-lead, copper lead frame vs. alloy 42).

4. Hermeticity Testing. For hermetically sealed packages (CDIP, certain BGAs, mil-spec parts), the seal is tested using helium leak detection or fluorocarbon bubble tests to verify the package was not opened and reclosed.

5. Decapsulation and Die Inspection. A sample of the lot is decapsulated chemically to expose the die. The die is examined for: correct manufacturer logo and part number markings on the silicon, correct die size relative to package, evidence of die salvage (parts pulled from scrapped boards), and process node consistency with the claimed date code.

6. Electrical Testing. Basic continuity, functional, and parametric tests verify the part responds correctly to the manufacturer's specified operating conditions. For complex parts (FPGAs, MCUs, ASICs), a representative subset of functions is tested rather than the full feature set.

7. Tape and Reel / Packaging Verification. The shipping packaging itself is inspected: tape pocket pitch matches manufacturer specification, reel labeling matches part markings, moisture barrier bags are sealed and unopened, and humidity indicator cards are within tolerance.

8. Documentation Review. Certificates of Conformance, traceability records, lot/date code consistency across boxes, and supplier audit history are reviewed. A part that physically passes inspection but has inconsistent paperwork is treated as suspect until resolved.

## Who actually needs IDEA-1010 compliance

The level of inspection rigor required depends on industry and risk tolerance.

Aerospace and defense procurement frequently mandates AS6081 / AS5553 compliance under DFARS clause 252.246-7008 (Counterfeit Electronic Parts Avoidance). IDEA-1010 procedures align with these requirements and are often used as the inspection backbone for compliant distribution.

Medical device manufacturing under FDA Quality System Regulation (21 CFR Part 820) requires supplier qualification and component verification. While the FDA does not specifically name IDEA-1010, manufacturers regulated under design control requirements typically demand IDEA-1010-style inspection on parts not sourced through franchise distribution.

Automotive under IATF 16949 requires traceable supply chains and process controls. Tier-1 automotive electronics suppliers commonly require IDEA-1010 inspection on any specialty-sourced component.

Industrial and safety-critical systems (railway signaling, energy infrastructure, factory automation safety controllers) typically require IDEA-1010 inspection on sustaining-engineering parts, especially when authorized distribution stock is depleted.

Consumer electronics generally does not require this level of inspection because the cost-benefit ratio is unfavorable: counterfeit risk exists, but the financial impact of a single failed unit is bounded.

## What a real IDEA-1010 inspection looks like

In practice, a single shipment of an obsolete IC passing through IDEA-1010 inspection follows a sample-based protocol. A representative sample size is determined based on lot size (typically following ANSI/ASQ Z1.4 sampling tables). Each sample part progresses through the inspection categories above. Findings are documented in an inspection report that becomes part of the shipment's permanent record.

A typical inspection report includes:

- Date of inspection and inspector identification (or technician ID number)
- Lot identification with date code and quantity
- Sample size and acceptance criteria applied
- Photographs of representative parts at the inspection magnification
- XRF spectrum or summary, if applied
- Marking permanency result
- Electrical test summary, if applied
- Disposition: Pass / Conditional / Fail
- Cross-reference to the certificate of conformance issued to the buyer

Inspection time per shipment ranges from a few hours (small lots, visual-only) to several days (large lots requiring decapsulation and electrical sampling). Costs are typically absorbed into the unit price of the part rather than billed separately, which is why specialty-sourced obsolete parts carry a premium over authorized-channel pricing.

## How to verify your supplier actually complies with IDEA-1010

Supplier claims of "IDEA-1010 inspected" are not all equivalent. The following checklist helps separate genuine compliance from marketing language.

1. Is the supplier ERAI-listed? ERAI maintains a public database of independent distributors that have agreed to follow industry quality standards and report suspect or counterfeit parts. Membership doesn't guarantee quality, but absence from ERAI is a meaningful signal.

2. Does the supplier hold ISO 9001 certification (or AS9120 for aerospace)? Ask for the certificate copy and verify the certifying body on the issuing organization's registry.

3. Can the supplier provide a sample inspection report? A real inspection report contains photographs, measurement data, and inspector identification. A "certificate of inspection" that is one paragraph of generic text is not the same thing.

4. Does the supplier list their inspection equipment? XRF spectrometers, high-magnification microscopes, and electrical testers are physical equipment that a real inspection lab has on-site. Ask. Reputable suppliers will share their equipment list or invite an audit.

5. Are inspection technicians trained and traceable? Inspector training records and technician identification tied to each report are standard practice.

6. Is the certificate of conformance issued for each shipment? Not generic, not annual — issued for the specific lot, with specific date and lot codes, signed.

7. What happens when a defect is found? Suppliers with mature inspection programs have a formal nonconforming material process and will share the protocol. Suppliers who can't describe their nonconformance handling typically don't have one.

## What IDEA-1010 does *not* cover

It's important to understand the limits of any inspection protocol.

IDEA-1010 is not design qualification. It verifies that the part received is what was ordered and is functional within manufacturer specifications. It does not verify that the part is appropriate for your application's environmental or reliability requirements.

IDEA-1010 is not reliability testing. Long-term life testing, accelerated aging, HALT/HASS, and burn-in are separate disciplines covered under JEDEC standards (JESD22 family, JESD47).

IDEA-1010 is not RoHS or REACH compliance verification. XRF analysis under IDEA-1010 verifies package composition but does not verify regulatory compliance for the full bill of materials.

IDEA-1010 is not a substitute for authorized distribution where authorized stock is available. When authorized franchise stock exists, that is always the lower-risk source. IDEA-1010 inspection exists for the channel beyond authorized distribution.

## FAQ

### Is IDEA-1010 the same as AS6081?
No. AS6081 (SAE International) is a distributor counterfeit avoidance standard covering the full distributor quality system: supplier qualification, inspection, traceability, and nonconformance handling. IDEA-STD-1010-B is the inspection protocol itself. AS6081-compliant distributors typically use IDEA-1010 as the inspection procedure within their wider quality system.

### How much does IDEA-1010 inspection add to part cost?
Costs vary by part complexity and lot size. For typical small-volume obsolete IC shipments, inspection cost is often 5-15% of the part value, absorbed into the unit price rather than billed separately.

### Can I trust any "IDEA-1010 inspected" claim?
Trust depends on verification. Use the seven-point checklist above to qualify the supplier's inspection program before relying on the claim.

### What if my distributor doesn't follow IDEA-1010?
For obsolete or hard-to-find parts in safety- or mission-critical applications, work with a distributor that does. For non-critical applications, the cost-benefit calculation may favor a less rigorous inspection process, but make the decision explicitly rather than by default.

### Is XRF analysis really necessary?
For parts where lead finish has changed across versions (RoHS transitions, Pb-free reflow requirements), yes. For pre-RoHS legacy parts, XRF is one of the most reliable ways to confirm package material consistency with the claimed date code.

---

Sourcing obsolete or hard-to-find parts and need verified inspection?

FPGACenter's procurement process aligns parts received from specialty channels with IDEA-STD-1010-B inspection protocol, including external visual examination, marking permanency testing, and lot-level documentation review. We do not sell standalone inspection as a service; inspection is built into the parts we supply.

[**Submit an RFQ**](/rfq) | [**Browse our catalog**](/category) | [**See our quality approach**](/quality)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17

