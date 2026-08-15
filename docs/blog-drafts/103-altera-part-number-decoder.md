---
title: "Altera and Intel FPGA Part Numbers Decoded: EP4CE22F17C6N Explained"
slug: "altera-intel-part-number-decoder"
status: "draft"
seoTitle: "Altera Part Number Decoder: EP4CE22F17C6N Explained"
seoDesc: "Altera speed grades run backwards from Xilinx: lower is faster. Full decode of EP4CE22F17C6N, MAX 10 and MAX II examples, temp grades and EOL traps."
seoKeywords: "altera part number decoder, ep4ce22f17c6n, intel fpga part numbering, altera speed grade, max 10 part number, cyclone iv part number, altera temperature grade"
tags: "Altera, Intel, FPGA, CPLD, part numbers, Cyclone IV, MAX 10, MAX II, sourcing"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 14
category: "FPGA & CPLD Sourcing"
relatedProducts: "EP4CE22F17C6N, EP4CE6E22C8N, EPM240T100C5N, 10M08SAE144C8G, EP2C5T144C8N, 5CSEBA6U23I7"
---

# Altera and Intel FPGA Part Numbers Decoded: EP4CE22F17C6N Explained

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~14 minutes
> **Topics**: Altera part numbering, Intel FPGA, speed grades, package codes, temperature grades, EOL sourcing

---

**The single most expensive misunderstanding in Altera part numbers is the speed grade: the numbers run backwards from Xilinx, and a buyer who does not know that will "upgrade" an order into a slower part.** On an Altera device, a lower speed number is a faster part — EP4CE22F17C**6**N is the fast bin, and the same device with a trailing 8 is the slow one. That inversion sits inside a numbering scheme that is otherwise one of the most readable in the industry, and one that survived the Intel acquisition completely intact for legacy families. This guide decodes EP4CE22F17C6N segment by segment, works through a MAX 10 and a MAX II example, maps the generation prefixes from EP1 to 5C, and finishes with the sourcing traps — engineering samples, the speed inversion, and what the end of life of Cyclone II/III and MAX 3000/7000 means if those parts are on your BOM.

## Key takeaways

- **Altera speed grades are inverted relative to Xilinx: lower is faster.** A grade-6 Cyclone IV is the fast bin; grade 8 is the slow one. Cross-references that carry speed numbers across vendors without re-deriving timing are wrong by construction.
- **The digits after the family code are capacity in logic elements** — EP4CE22 is roughly 22K LEs, and on MAX II the number is the LE count directly (EPM240 = 240 LEs).
- **Altera package codes encode package type and body size, not ball count.** F17 means a FineLine BGA with a 17 mm body; the ball count (256, for EP4CE22F17) comes from the ordering guide, not the code.
- **The trailing N (or G on MAX 10) means lead-free.** Leaded and lead-free versions of legacy parts both exist in the market and are separate orderable items.
- **The Intel acquisition changed nothing in legacy part numbers.** EP-, EPM-, 5M- and 5C-prefixed parts kept their numbering; only new Intel-era families adopted new schemes.
- **Cyclone II, Cyclone III, MAX 3000 and MAX 7000 are end-of-life.** Last-time-buy windows have closed, and remaining supply is finite stock in the channel — which changes how you should buy.

---

## The worked example: EP4CE22F17C6N, segment by segment

```
EP4CE 22 F17 C 6 N
│     │  │   │ │ └── N = lead-free (RoHS)
│     │  │   │ └──── Speed grade: 6 = fastest of 6/7/8 (lower = faster)
│     │  │   └────── Temperature grade: C = commercial
│     │  └────────── Package: F = FineLine BGA, 17 = 17 mm × 17 mm body
│     └───────────── Capacity: ~22K logic elements
└─────────────────── Family: EP4CE = Cyclone IV E
```

### EP4CE — the family code

**EP** is the classic [Altera](/manufacturer/altera) product prefix, **4** is the generation, **C** is Cyclone, and **E** is the sub-family. Cyclone IV came in two sub-families that the code distinguishes: **EP4CE** (Cyclone IV E, the general-purpose line) and **EP4CGX** (Cyclone IV GX, which adds serial transceivers). As with Xilinx's T suffix, the transceiver question is answered in the part number itself, and the two sub-families are not interchangeable regardless of logic capacity.

### 22 — capacity in logic elements

The digits after the family code state the logic capacity in thousands of logic elements: EP4CE22 is roughly 22K LEs, EP4CE6 roughly 6K. As with any vendor, treat the number as a catalog designator and pull exact resource counts from the data sheet — and remember that Altera logic elements and Xilinx logic cells are counted differently, so the numbers do not compare across vendors.

### F17 — package type and body size

**F** identifies the FineLine BGA family, and **17** is the body size: a 17 mm × 17 mm package. This is the structural difference from Xilinx numbering worth internalizing: **Altera package codes tell you the body size, not the pin count.** For the EP4CE22, the F17 package carries 256 balls, but you learn that from the ordering guide, not from the code. Other letters follow the same pattern — **E** for a plastic enhanced QFP (EP4CE6E22C8N is the EQFP 144-pin variant, where the 22 after the E is a package-size code, not a pin count), **T** for TQFP, **U** for UBGA, **M** for MBGA. Two numbers that look similar in an Altera part number can mean entirely different things depending on the letter in front of them; when in doubt, decode against the family's ordering information page rather than by analogy.

### C — temperature grade

**C** = commercial. Industrial (**I**) and automotive (**A**) grades exist and are covered in their own section below. Note the position: in the classic Altera scheme the temperature letter comes *before* the speed digit, the reverse of Xilinx's ordering, which puts temperature last. Buyers who handle both vendors' parts misfile these two fields regularly.

### 6 — speed grade, and the inversion

The digit after the temperature letter is the speed grade, and this is the field to be most careful with. **Lower numbers are faster parts.** Cyclone IV offers grades 6, 7 and 8: grade 6 is the fastest bin, grade 8 the slowest and cheapest. This is the exact opposite of the Xilinx convention, where -3 outruns -1. The trap is worst in cross-referencing: a buyer replacing a Xilinx part who has learned "higher number = better" will read an Altera grade 8 as the premium variant and order the slowest part in the family. Timing closure decides substitutions, not the digit — a grade-8 part cannot stand in for a design that closed timing on grade 6, while grade 6 can substitute downward for grade 8 at a price premium, as an approved deviation.

### N — lead-free

The trailing **N** marks the part as lead-free (RoHS-compliant). Legacy leaded versions without the N exist and still circulate — an EP4CE22F17C6 (no N) is a real, genuine, different orderable part. On old-stock offers, confirm which one is actually being quoted; most listings do not volunteer the distinction.

## Second worked example: MAX 10, 10M08SAE144C8G

MAX 10 arrived in 2014 with a new-style number that is still fully decodable:

```
10M 08 SA E144 C 8 G
│   │  │  │    │ │ └── G = lead-free (RoHS)
│   │  │  │    │ └──── Speed grade: 8 (slowest of 6/7/8 — lower = faster)
│   │  │  │    └────── Temperature grade: C = commercial
│   │  │  └─────────── Package: E144 = EQFP, 144 pins
│   │  └────────────── Power/feature options: S = single supply, A = analog-featured
│   └───────────────── Capacity: ~8K logic elements
└───────────────────── Family: 10M = MAX 10
```

Points of difference from the classic scheme. The family field is now **10M** rather than an EP-prefix. Between the capacity and the package sit two option letters: the first is the power option (**S** = single supply, **D** = dual supply), the second the feature option (**A** here denotes the analog-featured variant with the integrated ADC; other feature letters exist across the lineup). These option letters change the device's capabilities and pinout behavior, so verify them against Intel's ordering guide when cross-referencing rather than pattern-matching — two MAX 10 parts differing only in those two letters are different products. The package field **E144** helpfully includes the actual pin count, unlike the classic BGA codes. Temperature and speed then follow the familiar convention — **C8** = commercial, grade 8, and MAX 10's grades run 6/7/8 with the same lower-is-faster rule. The lead-free marker on MAX 10 is a **G** rather than an N.

MAX 10 matters to sourcing conversations because it is the standing recommendation for designs migrating off the EOL'd MAX 3000/7000 CPLDs: instant-on, non-volatile, and in current production.

## Third worked example: MAX II, EPM240T100C5N

```
EPM 240 T100 C 5 N
│   │   │    │ │ └── N = lead-free (RoHS)
│   │   │    │ └──── Speed grade: 5 (slowest of 3/4/5 — lower = faster)
│   │   │    └────── Temperature grade: C = commercial
│   │   └─────────── Package: T100 = TQFP, 100 pins
│   └─────────────── Capacity: 240 logic elements (the actual count)
└─────────────────── Family prefix: EPM = MAX CPLD lines
```

Two details distinguish the CPLD numbering. First, the capacity digits are the actual logic-element count, not thousands: EPM240 has 240 LEs, EPM570 has 570. Second, the **EPM** prefix spans multiple generations — the EOL'd MAX 3000A and MAX 7000 lines also use it (EPM3064A, EPM7128S), so the prefix alone does not tell you whether the part is in production. MAX II speed grades run 3/4/5 with grade 5 the slowest; the EPM240T100C5N shown here is the highest-volume variant of the family, the one that shows up in power-sequencing and glue-logic sockets across two decades of industrial hardware. As with the QFP-packaged Xilinx parts, the TQFP package keeps this device reworkable without BGA equipment, which sustains demand for it in the repair and legacy-manufacturing market.

## Generation prefixes: from EP1 to 5C

The prefix maps cleanly onto Altera's generations:

| Prefix | Family | Status note |
| --- | --- | --- |
| EP1C | Cyclone (2002) | End of life |
| EP2C | Cyclone II | End of life |
| EP3C | Cyclone III | End of life |
| EP4CE / EP4CGX | Cyclone IV E / GX | Long-lived mature family |
| EP1S / EP2S / EP3S / EP4S | Stratix I–IV | High-end lines, same convention |
| EPM | MAX 3000A / MAX 7000 / MAX II | 3000/7000 EOL; MAX II mature |
| 5M | MAX V | CPLD line, new-style prefix |
| 5C | Cyclone V | Different scheme — see below |
| 10M | MAX 10 | Current production |

With the fifth generation the EP prefix was dropped: MAX V parts read 5M (5M240Z...), Cyclone V parts read 5C. Cyclone V also complicated the scheme beyond the digit-for-digit decode that works on older families. Take 5CSEBA6U23I7: it opens with **5C** (Cyclone V), and the tail decodes conventionally — **U23** is a UBGA package with a 23 mm body, **I** is industrial temperature, **7** is the speed grade. But the middle block (**SEBA6**) is a sub-family, variant and member code identifying an SE-series SoC device of roughly 110K LEs, and it does not follow the old capacity-in-thousands convention. The honest guidance: decode Cyclone V middle segments against Intel's ordering documentation for the family rather than by analogy with Cyclone IV, because the letter positions carry different meanings. The same applies to Arria and Stratix V-and-later numbers.

## Temperature grades: C, I, A

Altera temperature grades, like Xilinx's, specify junction temperature ranges:

| Grade | Name | Junction temperature range |
| --- | --- | --- |
| C | Commercial | 0 °C to +85 °C |
| I | Industrial | −40 °C to +100 °C |
| A | Automotive | −40 °C to +125 °C |

The same asymmetric substitution logic applies as everywhere else: I exceeds the C envelope and can substitute downward as an approved deviation; C can never stand in for I. And the same sourcing reality applies too — industrial variants of mature families are thinner in the channel than commercial ones, and they are the first to become genuinely hard to find once a family stops shipping from the factory. If your legacy BOM specifies I-grade Cyclone parts, check real availability early through our [FPGA sourcing hub](/fpga-sourcing) rather than assuming the commercial part's easy availability extends to your variant.

Note again the field order: temperature before speed (C6, I7), the reverse of Xilinx. A part number ending in "I7" is an industrial-grade, speed-7 device — not a strange package code.

## The Intel rebrand: what actually changed

Intel acquired Altera in 2015, and for part numbering the answer to "what changed" is: **for legacy families, nothing.** EP-, EPM-, 5M-, 5C- and 10M-prefixed parts kept their part numbers, their ordering codes and their marking conventions. Parts manufactured after the acquisition may carry Intel branding on the package while answering to the same Altera-era part number, so mixed-date-code stock of the same part can look different on top — a marking difference, not a product difference, though it is worth documenting in incoming inspection so it does not trigger false counterfeit alarms.

New families introduced in the Intel era adopted new schemes (Intel's Agilex lines use AG-style part numbers that share nothing with the EP convention), and in 2024 Intel began operating the FPGA business under the Altera name again — which changed branding, not numbering. For a buyer of legacy parts, the entire acquisition story reduces to one instruction: quote and order against the original part number, and expect either Altera or Intel markings depending on date code.

## Sourcing traps

**The speed-grade inversion.** Worth restating as a trap because it produces real, expensive errors: Altera grade 6 is fast and grade 8 is slow; Xilinx -3 is fast and -1 is slow. Any cross-reference between the vendors that maps speed numbers directly is broken. When qualifying an alternate, take the timing requirement from the design, not from the digit in the part being replaced.

**ES suffixes.** Engineering-sample devices carry an ES marker and are pre-production silicon — possibly with different errata, timing and behavior than production parts, and not warranted for production use. They surface in open-market stock, particularly for long-EOL'd families where any stock looks tempting. Inspect the physical marking; do not accept ES silicon against a production part number.

**Leaded versus lead-free.** The N (classic families) or G (MAX 10) suffix is the entire difference between a RoHS-compliant part and a leaded one, and legacy stock exists in both forms. Confirm the suffix in writing before committing, especially on Cyclone II-era material where leaded stock is genuinely common.

**Package codes that hide the ball count.** Because F17 names a body size rather than a pin count, two different devices in "F17" packages are not automatically footprint-compatible, and a listing that says "256-ball" needs to be checked against the ordering guide for that exact device. Never infer mechanical compatibility from the package code alone.

## End of life: Cyclone II/III and MAX 3000/7000

Cyclone II (EP2C), Cyclone III (EP3C), MAX 3000A and MAX 7000 have all been discontinued, and their last-time-buy windows are closed. Every part that will ever exist has been manufactured; what remains is stock — in franchised-channel remainders, in authorized aftermarket programs, in excess inventory, and in the independent market. That changes the buying calculus in three ways.

First, **price and availability decouple from the data sheet.** A grade-8 commercial EP2C5T144C8N and its industrial sibling may have had similar volumes in production; today one may be plentiful and the other effectively gone, for reasons of historical stocking rather than anything technical. Availability must be checked per orderable part number, not per family.

Second, **provenance becomes the dominant risk.** EOL'd, still-demanded parts are exactly the profile that attracts counterfeiting and remarking. Date-code documentation, traceability and inspection matter more for an EP2C or EPM7128 buy than for anything still shipping from the factory.

Third, **every purchase should be sized against remaining product life.** If the board that uses an EPM3064A will be manufactured for five more years, the rational move is often a single negotiated buy covering that demand, rather than returning to a shrinking market annually. For designs with longer horizons, the migration path — MAX II/MAX V or MAX 10 for the old CPLDs, Cyclone IV or 10 LP for the old Cyclones — should be priced against the stockpile before the stock decides for you.

Cyclone IV and MAX II remain in production as of this writing, but both are mature families; lifecycle status should be re-verified per orderable part number, not assumed, whenever a new order or design commitment depends on it. You can check our current holdings on any of these families through the [part search](/search).

## Quick-reference table

| Segment | Classic scheme (EP4CE22F17C6N) | Meaning |
| --- | --- | --- |
| Family | EP4CE | EP prefix + generation 4 + Cyclone + E sub-family (GX = with transceivers) |
| Capacity | 22 | ~22K logic elements (MAX CPLDs: actual LE count, e.g. EPM240 = 240) |
| Package | F17 | Letter = type (F FineLine BGA, E EQFP, T TQFP, U UBGA, M MBGA); digits = body size, not pin count |
| Temp grade | C | C = 0–85 °C, I = −40–100 °C, A = −40–125 °C (junction) |
| Speed grade | 6 | Lower = faster (6 fastest / 8 slowest on Cyclone IV; 3/4/5 on MAX II) |
| RoHS | N | N = lead-free (G on MAX 10); absence = leaded |
| New-style prefixes | 5M / 5C / 10M | MAX V, Cyclone V (different mid-segment scheme), MAX 10 |
| ES | ES marking | Engineering sample — not production silicon |

## FAQ

### What does EP4CE22F17C6N mean?

It is a Cyclone IV E FPGA (EP4CE) with roughly 22,000 logic elements (22), in a 17 mm × 17 mm FineLine BGA package with 256 balls (F17), commercial temperature grade (C), the fastest speed grade of the family (6), in lead-free assembly (N). Every one of those fields is an independent orderable variant.

### Is a speed grade 6 Altera part faster or slower than a grade 8?

Faster. Altera speed numbers are inverted relative to Xilinx: lower means faster, so grade 6 is the premium timing bin and grade 8 the slowest. A grade-6 part can substitute for a grade-8 requirement as an approved deviation; a grade-8 part cannot substitute for a design that needed grade 6.

### What is the difference between EP4CE and EP4CGX?

Sub-family. EP4CE is Cyclone IV E, the general-purpose line; EP4CGX is Cyclone IV GX, which adds serial transceivers. They are different silicon with different capabilities and are not interchangeable at any logic capacity.

### Did Intel change Altera part numbers after the acquisition?

No. Legacy families kept their part numbers and ordering codes entirely; the visible change is that parts made after the acquisition may carry Intel branding on the package while answering to the same part number. New Intel-era families use new numbering schemes, and the business now operates under the Altera name again — a branding change, not a numbering one.

### Can I still buy Cyclone II or MAX 7000 parts?

From the factory, no — those families are discontinued and last-time-buy windows have closed. From the market, yes: authorized aftermarket channels, franchised remainders and vetted independent stock still hold material, in finite and shrinking quantity. Buy against the exact orderable part number, insist on traceability, and size the purchase against your product's remaining life rather than buying hand-to-mouth.

## Sourcing help

We cover the full Altera and Intel programmable-logic range — from EOL'd MAX 3000/7000 and Cyclone II/III stock through mature Cyclone IV and MAX II to current MAX 10 and Cyclone V — with obsolete material sourced through authorized aftermarket and specialty channels under documented traceability. Send the complete orderable part number, including package, temperature grade, speed grade and the RoHS suffix, and we will quote real availability and date codes against that exact string.

[**Submit an RFQ**](/rfq) | [**FPGA sourcing hub**](/fpga-sourcing) | [**Altera catalog**](/manufacturer/altera)
