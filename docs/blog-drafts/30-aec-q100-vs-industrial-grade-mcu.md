---
title: "AEC-Q100 vs Industrial Grade: What the Temperature Suffix Actually Buys"
slug: "aec-q100-vs-industrial-grade-mcu"
status: "draft"
seoTitle: "AEC-Q100 vs Industrial Grade MCU: Qualification Explained"
seoDesc: "AEC-Q100 is a qualification regime, not a temperature range. Grade 0-3 explained, why an industrial part is not an automotive part, PPAP and change control, and what the premium actually pays for."
seoKeywords: "AEC-Q100, automotive grade MCU, industrial vs automotive temperature, AEC-Q100 grade 1, PPAP, automotive qualification, extended temperature MCU, Q suffix part number"
tags: "AEC-Q100, automotive, qualification, temperature grade, MCU, procurement, compliance"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "MCU Sourcing & Alternatives"
relatedProducts: "STM32F103RBT6TR, PIC18F25Q43-I/SO, ATMEGA329-16MU, MSP430F1491IPM"
---

# AEC-Q100 vs Industrial Grade: What the Temperature Suffix Actually Buys

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: AEC-Q100, automotive qualification, temperature grades, PPAP, sourcing

---

**AEC-Q100 is a qualification and change-control regime that happens to include a temperature range, not a temperature range with a certificate attached.** This is the distinction that causes trouble. An industrial-grade part rated −40 to +85 °C and an AEC-Q100 Grade 3 part rated −40 to +85 °C cover the same temperatures and are not interchangeable in an automotive build. The difference is what the manufacturer has committed to about stress testing, defect rates, traceability and how they will behave when they want to change something. This guide covers what each grade means, when the premium is justified, and what it means for sourcing.

## Key takeaways

- **AEC-Q100 is a qualification standard, not a temperature spec.** Matching the temperature range does not make a part equivalent.
- **The grades run 0 to 3, and Grade 0 is the hottest** (−40 to +150 °C ambient): the numbering is counter-intuitive.
- **Change control is the part buyers underestimate.** An AEC-Q100 supplier commits to notification and requalification obligations that a commercial supplier does not.
- **PPAP is a separate obligation** from AEC-Q100 and often the thing your customer actually requires.
- **You cannot upgrade a part by testing it.** Screening a commercial part does not produce an automotive part.
- **Automotive variants are separate orderable part numbers** with separate supply, typically longer lead times and much longer production lifetimes.

---

## The three grade systems that get confused

Three different things are all called "grade", and conflating them is the root of most confusion.

| System | What it describes | Example |
| --- | --- | --- |
| **Temperature grade** | Operating temperature range only | Commercial 0 to +70 °C; industrial −40 to +85 °C |
| **AEC-Q100 grade** | Qualification level, which includes a temperature range | Grade 1 = −40 to +125 °C ambient |
| **Functional safety (ISO 26262) ASIL** | Systematic and random fault capability | ASIL B, ASIL D |

They are independent. A part can be industrial temperature with no AEC-Q100 qualification. It can be AEC-Q100 Grade 1 with no ISO 26262 support. It can carry a safety manual and ASIL capability, which is a different exercise again.

### Temperature grades

| Grade | Typical range | Common suffix |
| --- | --- | --- |
| Commercial | 0 to +70 °C | C |
| Industrial | −40 to +85 °C | I |
| Extended / enhanced industrial | −40 to +105 °C or +125 °C | E, or vendor-specific |
| Automotive | Per AEC-Q100 grade | Q, A, or vendor-specific |
| Military | −55 to +125 °C | M |

### AEC-Q100 grades — note the direction

| AEC grade | Ambient operating range | Typical location in a vehicle |
| --- | --- | --- |
| **Grade 0** | −40 to **+150 °C** | On or near the engine, transmission |
| **Grade 1** | −40 to +125 °C | Under-bonnet, powertrain periphery |
| **Grade 2** | −40 to +105 °C | Passenger compartment extremes, some under-bonnet |
| **Grade 3** | −40 to **+85 °C** | Cabin electronics, infotainment |

Grade 0 is the most severe and Grade 3 the least: the opposite of what most people assume on first encounter. A part described as "AEC-Q100 qualified" without a grade is under-specified.

## What AEC-Q100 actually requires

It is a stress-test qualification standard published by the Automotive Electronics Council. A part qualified to it has been through a defined battery of tests on defined sample sizes, with defined acceptance criteria.

The test groups cover, in outline:

- **Accelerated environmental stress** — temperature cycling, high-temperature operating life, humidity, thermal shock, power cycling.
- **Package integrity** — moisture sensitivity, mechanical shock, vibration, solderability, board-level reliability.
- **Die-level reliability** — electromigration, hot carrier injection, time-dependent dielectric breakdown, negative bias temperature instability.
- **Electrical verification** — parametric characterisation across the full grade temperature range, ESD (HBM and CDM), latch-up.
- **Defect screening** — burn-in and outlier detection methodologies such as Part Average Testing and Statistical Yield Analysis.

That last group is the one commercial parts most conspicuously lack. **Outlier screening removes parts that pass the datasheet limits but sit statistically far from the population**: the units disproportionately likely to fail early in the field. A commercial part has no equivalent, which is a real reliability difference independent of temperature.

## The part buyers underestimate: change control

Qualification is a one-time event. Change control is a continuing obligation, and for a long-life programme it matters more.

An automotive-qualified supply relationship typically commits the manufacturer to:

- **Notify before making changes** (fab transfers, die revisions, assembly site moves, material changes) rather than after.
- **Requalify** the affected configuration to AEC-Q100 following certain change classes.
- **Maintain traceability** to lot and, in some cases, wafer level.
- **Support a defined production lifetime**, often 10-15 years, considerably longer than a commercial part.
- **Participate in problem resolution** with defined response expectations when a field issue arises.

A commercial part carries none of this. The manufacturer may transfer the fab and tell you afterwards, or not at all: the situation described in [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

For a fifteen-year automotive programme, the change-control commitment is frequently worth more than the temperature range.

## PPAP is a different thing

Production Part Approval Process is a customer-facing documentation regime, not a component qualification. It comes from the automotive quality standards (IATF 16949 lineage) and is what a tier-one supplier requires from you, or you from your suppliers.

A PPAP submission typically includes design records, process flow, FMEA, control plan, measurement system analysis, initial process studies, qualification test results and a part submission warrant. AEC-Q100 qualification data is one input to it.

The practical distinction:

- **AEC-Q100**: the semiconductor manufacturer qualified the device.
- **PPAP** — you demonstrated to your customer that your process reliably produces conforming assemblies.

You can be asked for PPAP on an assembly containing non-automotive parts, and you can use AEC-Q100 parts in a product with no PPAP requirement. They are orthogonal.

## Can you use an industrial part in an automotive application?

Sometimes, and the question is who accepts the risk.

The honest position:

- **If the customer's specification requires AEC-Q100**, the answer is no, regardless of measured performance. This is a contractual matter.
- **If the application is automotive aftermarket, off-highway, or a non-safety accessory**, an industrial part is frequently acceptable and widely used.
- **If the ambient environment genuinely stays within industrial limits** and there is no contractual requirement, the remaining difference is the reliability screening and change-control commitment — real, but assessable.

What you **cannot** do is manufacture equivalence:

- **Screening a commercial part does not create an automotive part.** You can test to −40 °C and confirm function, but you have not performed a qualification, you have no outlier screening on future lots, and you have no change-control commitment.
- **Up-screening changes nothing about the next lot.** Qualification is about the process, not the units you happened to test.
- **A dual-source arrangement where one source is automotive and one is not** is not an automotive supply.

## Sourcing consequences

Automotive variants behave differently in the market.

| Aspect | Commercial / industrial | AEC-Q100 |
| --- | --- | --- |
| Part number | Separate | **Separate — different orderable part** |
| Lead time | Typically shorter | Typically longer |
| Production lifetime | 5-10 years typical | 10-15 years typical |
| Availability during allocation | Prioritised by contract | Often prioritised for automotive customers |
| Price premium | — | Meaningful, varies widely |
| Substitution flexibility | High | Low — customer spec usually freezes it |

Two practical points:

The suffix is the part. An automotive variant differs from its commercial sibling by a suffix, and they have entirely independent stock and lifecycle. This is the same pattern described in [how to choose the right FPGA](/blog/how-to-choose-right-fpga) and [Xilinx 7 Series sourcing](/blog/xilinx-7-series-zynq-sourcing): the suffix carries the availability.

Longer production life cuts both ways. Automotive parts stay in production longer, which is good; but when they do go end-of-life, substitution is harder because the replacement must also be qualified and the customer specification may name the original. The [last-time-buy calculation](/blog/last-time-buy-quantity-and-storage) for an automotive part should use a longer support horizon and a larger uncertainty factor accordingly.

## Deciding what you need

| Situation | What to specify |
| --- | --- |
| Customer specification names AEC-Q100 and a grade | That grade, no substitution |
| Safety-relevant function under ISO 26262 | AEC-Q100 **plus** a safety manual and ASIL capability — separate requirement |
| Under-bonnet, high ambient | Grade 1 or 0 by thermal analysis, not by assumption |
| Cabin electronics, automotive OEM customer | Grade 2 or 3 |
| Automotive aftermarket, non-safety | Industrial often acceptable; document the decision |
| Industrial equipment marketed for harsh environments | Industrial or extended temperature; AEC-Q100 usually unnecessary |

The row worth pausing on is the second. **AEC-Q100 does not deliver functional safety.** ISO 26262 compliance requires a safety manual, documented fault metrics, diagnostic coverage and often dedicated hardware features. A part can be Grade 0 qualified and provide nothing toward an ASIL target.

## FAQ

### What is AEC-Q100?

AEC-Q100 is a stress-test qualification standard published by the Automotive Electronics Council for integrated circuits. A qualified part has passed a defined battery of environmental, package, die-level reliability and electrical tests on specified sample sizes with specified acceptance criteria, and has been subject to defect-screening methodologies such as outlier detection. It is a qualification regime rather than simply a temperature rating, and it usually comes with change-control and production-lifetime commitments from the manufacturer.

### What is the difference between AEC-Q100 Grade 0 and Grade 1?

The grades describe ambient operating temperature ranges, and the numbering runs opposite to intuition — lower numbers are more severe. Grade 0 covers −40 to +150 °C and suits locations on or near the engine and transmission. Grade 1 covers −40 to +125 °C and suits under-bonnet and powertrain-periphery locations. Grade 2 covers −40 to +105 °C and Grade 3 covers −40 to +85 °C, the latter typically for cabin electronics.

### Is an industrial-grade part the same as an automotive part if the temperature range matches?

No. An industrial part rated −40 to +85 °C and an AEC-Q100 Grade 3 part rated −40 to +85 °C cover the same temperatures but differ in qualification testing, defect screening and supplier obligations. The automotive part has been through a defined stress-test regime, is subject to outlier screening that removes statistically atypical units, and comes with change notification, requalification and production-lifetime commitments the commercial part does not carry.

### Can I use an industrial MCU in an automotive design?

It depends on the contractual requirement rather than the electrical performance. If the customer specification requires AEC-Q100, an industrial part is not acceptable regardless of how it measures. For automotive aftermarket, off-highway or non-safety accessory products, industrial parts are frequently used and acceptable. Where there is no contractual requirement and the ambient genuinely stays within industrial limits, the remaining difference is reliability screening and change control — real considerations, but ones you can assess and document.

### Can I screen or up-screen a commercial part to automotive grade?

No. Testing units at temperature confirms that those units functioned, but qualification is about the manufacturing process rather than the sample. You gain no outlier screening on future lots, no commitment that the next lot comes from the same fab or die revision, and no change-notification obligation. A dual-source arrangement in which only one source is automotive-qualified is likewise not an automotive supply.

### What is PPAP and how does it relate to AEC-Q100?

PPAP, the Production Part Approval Process, is a customer-facing documentation regime from the automotive quality standards that demonstrates your process reliably produces conforming parts. It typically includes design records, process flow, FMEA, control plan, measurement system analysis, initial process studies and a part submission warrant. AEC-Q100 qualification data is one input to a PPAP package, but the two are separate: AEC-Q100 is what the semiconductor manufacturer did, PPAP is what you demonstrate to your customer.

### Does AEC-Q100 mean a part is ISO 26262 compliant?

No. AEC-Q100 addresses reliability and stress qualification; ISO 26262 addresses functional safety, which requires a safety manual, documented fault metrics, diagnostic coverage and often dedicated hardware safety features. A device can be AEC-Q100 Grade 0 qualified and contribute nothing toward an ASIL target. Where a function is safety-relevant, the automotive qualification and the functional safety package are two separate requirements.

### Why do automotive part variants have longer lead times?

Because they are lower volume, subject to additional test and screening steps, and often produced on dedicated flows with tighter process control. They also typically carry longer committed production lifetimes, which means the manufacturer plans capacity differently. During allocation periods, automotive supply is frequently prioritised toward customers with contractual volume commitments, which can make spot purchases difficult even when the part is nominally in production.

## Related reading

For the general framework on microcontroller substitution and what has to match, see [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide). Automotive parts have longer lifetimes but harder substitution, which makes [last-time-buy sizing](/blog/last-time-buy-quantity-and-storage) more important, and [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide) covers the change-notification obligations that distinguish an automotive supply relationship.

Send us the part number and the grade your specification requires, and we will come back with availability on the exact qualified variant rather than its commercial sibling.

[**Submit an RFQ**](/rfq) | [**Browse microcontrollers**](/category/microcontrollers) | [**Quality process**](/quality)
