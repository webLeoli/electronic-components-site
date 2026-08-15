---
title: "Date Codes and Lot Traceability: Reading What Is Printed on the Part"
slug: "date-code-lot-traceability-explained"
status: "draft"
seoTitle: "Date Codes & Lot Traceability Explained for Electronics Buyers"
seoDesc: "How to read a four-digit date code, what a lot code actually identifies, why date-code consistency exposes counterfeits, and how much traceability to demand by risk class."
seoKeywords: "date code, lot code, component traceability, YYWW date code, semiconductor date code format, counterfeit date code, certificate of conformance, chain of custody"
tags: "date code, lot traceability, counterfeit detection, quality, documentation, procurement"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Quality & Compliance"
relatedProducts: "XC6SLX9-2CPG196I, PIC18F25Q43-I/SO, GRM188R71C104KA01D"
---

# Date Codes and Lot Traceability: Reading What Is Printed on the Part

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: date codes, lot codes, traceability, counterfeit detection, documentation

---

**The markings on a component are the only physical evidence of where it came from, and most buyers cannot read them.** A four-digit date code, a lot code, a country of origin and a manufacturer logo are what stand between you and an unverifiable part. Read together with the paperwork, they let you detect a large fraction of counterfeit and misrepresented material before it reaches a board. Read carelessly (or not at all) they let it through. This guide covers what each marking means, how the consistency checks work, and how much traceability to demand for each class of purchase.

## Key takeaways

- **Date code is usually YYWW** (two digits of year, two of work week) but conventions vary and some manufacturers use their own scheme entirely.
- **A lot code identifies a manufacturing batch**. It is what actually enables traceability. The date code alone does not.
- **Inconsistency is the signal.** Mixed date codes in a sealed reel, a date code newer than the part's discontinuation, or codes inconsistent with the packaging are all red flags.
- **Date codes are trivially remarked**; they are the easiest field to fake, which is why they are checked *against other evidence* rather than trusted alone.
- **A Certificate of Conformance is not traceability.** It is a supplier's assertion; traceability is a documented chain.
- **Demand traceability proportionate to risk class**, and record what you received; it is the first thing a failure investigation needs.

---

## What is actually printed on a part

Typical markings on an IC, though placement and content vary by manufacturer and package size:

| Marking | What it identifies |
| --- | --- |
| Manufacturer logo | The maker (or the maker's brand at time of manufacture) |
| Part number | Often abbreviated on small packages — the full orderable number may not fit |
| Date code | When it was manufactured or, sometimes, when it was assembled/tested |
| Lot / trace code | The specific manufacturing batch |
| Country of origin | Where assembly or final test occurred |
| Optional codes | Wafer lot, assembly site, revision, ESD or MSL indicators |

On very small packages (SOT-23, 0402 passives, small QFNs) there is no room for most of this, and manufacturers use short marking codes that must be looked up. **A two- or three-character marking code is not a part number**, and confusing the two is a common source of wrong-part incidents.

## Reading a date code

The most common format is YYWW, four digits:

```
2317  →  year 2023, work week 17  (late April 2023)
0642  →  year 2006, work week 42  (mid-October 2006)
```

Work weeks run 01 to 52 or 53. A value above 53 in the last two digits means it is not a YYWW date code, and you are looking at something else.

Variants you will encounter:

| Format | Example | Meaning |
| --- | --- | --- |
| YYWW | `2317` | Year and work week — most common |
| YWW | `317` | Single-digit year — ambiguous decade |
| WWYY | `1723` | Reversed; less common but exists |
| YYMM | `2304` | Year and month |
| Alphanumeric | `M23` | Manufacturer-specific letter coding |
| Julian | `23145` | Year plus day-of-year |

The single-digit-year formats are genuinely ambiguous. A `317` could be 2013 week 17 or 2023 week 17. Resolve it against the part's introduction date and the manufacturer's convention, not by assumption.

Some manufacturers publish their marking schemes; others do not. When a code does not parse, **ask the supplier what convention applies** rather than guessing, and treat an inability to answer as informative.

## Lot codes are what enable traceability

A date code tells you roughly when. A lot code tells you which batch, and that is what traceability actually rests on.

A lot code lets the manufacturer identify the specific production run: the wafer lot, the assembly line, the test program revision. That is what makes the following possible:

- **Failure analysis.** If a failure correlates with one lot, the manufacturer can investigate the run.
- **Containment.** If a manufacturer issues a quality alert against a lot, you can determine whether you have any.
- **Genuine traceability claims.** For regulated products, lot-level traceability from component to finished assembly is frequently a requirement, not an option.

Record the lot code, not just the date code, on receipt. Many goods-received processes capture date code alone, which makes the record insufficient for its main purpose.

## Using markings to detect counterfeits

Individual markings are easy to fake. Consistency between markings, packaging and paperwork is much harder. This is why inspection looks at relationships rather than fields.

### The consistency checks that matter

Date code versus lifecycle. A date code postdating the part's discontinuation is conclusive. If a device went end-of-life in 2018 and the parts are marked `2340`, something is wrong. This check requires knowing the lifecycle history: the kind of information covered in [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained).

Date code versus branding. A part marked with a brand that ceased to exist before the date code was printed. The Actel → Microsemi → Microchip transitions described in [Actel ProASIC sourcing](/blog/actel-proasic-sourcing-guide) create exactly this kind of check.

Uniformity within a sealed reel or tube. Factory-sealed packaging from a single lot should contain uniform markings. Mixed date codes inside intact original packaging indicate the packaging was opened and refilled.

Marking versus packaging labels. The label on the reel or bag should match what is on the parts. Mismatches are either an administrative error or a repack.

Marking method versus era. Laser marking versus ink marking, and the specific font and layout, are characteristic of a manufacturer and period. A part whose marking method is inconsistent with its claimed date is suspect.

Marking permanency. A solvent test removes ink that should not come off. Blacktopped and remarked parts frequently fail this simple, cheap check.

Surface condition under magnification. Resurfacing to remove original markings leaves texture differences, especially around package edges and pin 1 indicators.

These sit inside the broader visual and mechanical inspection regime defined by IDEA-STD-1010 and described in [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide).

### What markings cannot tell you

A perfectly consistent set of markings does not prove authenticity. A competent counterfeiter produces internally consistent markings. That is why marking inspection is a screen, not a verdict, and why higher-risk purchases add X-ray, electrical test, JTAG IDCODE verification and decapsulation: the tiered approach in [writing a counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy).

## The paperwork, and what each document is worth

These documents are not equivalent, and the differences matter.

| Document | What it is | What it proves |
| --- | --- | --- |
| **Certificate of Conformance (CoC)** | Supplier's statement that goods conform to the order | Only that the supplier says so |
| **Manufacturer's CoC** | The same, from the original manufacturer | Considerably more, if genuine |
| **Chain of custody / traceability record** | Documented ownership history back toward the manufacturer | The actual traceability claim |
| **Inspection report** | Results of specific checks with evidence | What was examined and found |
| **Test report** | Electrical or physical test results | Measured behaviour |

A CoC from an independent distributor is an assertion, not evidence. It is worth having, but it does not establish where the parts came from. The chain-of-custody record is what does that, and its value depends on how far back it goes and how well documented each hop is.

For higher-value or higher-risk purchases, ask specifically for:

- The **complete chain**, not a summary. "Sourced from a trusted supplier" is not a chain.
- **Photographs of the actual lot** (reels, labels, and parts) before shipment.
- **The inspection report before payment**, not after.

## How much traceability to require

Scale the requirement to risk, and write it into the purchase order rather than hoping for it.

| Risk class | Traceability requirement |
| --- | --- |
| Standard commercial parts, franchised | Date code and lot code recorded on receipt |
| Commercial, independent source | Above + supplier CoC + photographs + inspection report |
| Significant — field failure or line stoppage exposure | Above + documented chain of custody + electrical verification |
| Critical — safety, regulatory, certified product | Manufacturer CoC or authorised aftermarket provenance; full chain; lot-level record retained for product life |

Two practical notes:

Put it in the purchase order. Traceability documentation requested after delivery is frequently unavailable. Requested in the PO, it is a condition of acceptance.

Retain records for the product's life plus its support obligation. A fifteen-year industrial product needs its component traceability records to survive fifteen years plus spares support, which means surviving at least one ERP migration. Plan for that explicitly.

## What to record on receipt

A minimum goods-received record for traceability purposes:

| Field | Why |
| --- | --- |
| Supplier and channel class | The first question in any later investigation |
| Manufacturer | Brand as marked, which may differ from current owner |
| Full part number as ordered and as marked | Catches partial or abbreviated markings |
| **Date code(s) present** | Plural — record all of them if the lot is mixed |
| **Lot / trace code(s)** | The field that actually enables traceability |
| Quantity and packaging condition | Sealed, opened, repacked |
| Inspection tier applied and report reference | What was checked |
| Photographs for non-franchised receipts | Cheap, and invaluable later |

Recording all date codes present, rather than one representative code, is the detail most often skipped, and a mixed-code lot is precisely the case where the record matters.

## FAQ

### How do I read a semiconductor date code?

The most common format is YYWW: two digits for the year followed by two for the work week, so 2317 means work week 17 of 2023. Other formats exist, including YWW with a single-digit year, WWYY reversed, YYMM for year and month, Julian formats with day-of-year, and manufacturer-specific alphanumeric schemes. If the last two digits exceed 53 it is not a work-week code. Single-digit-year formats are genuinely ambiguous about the decade and should be resolved against the part's introduction date.

### What is the difference between a date code and a lot code?

A date code indicates roughly when a part was manufactured, while a lot code identifies the specific production batch: the wafer lot, assembly line and test program used. Traceability rests on the lot code, because it is what allows a manufacturer to investigate a failure, what a quality alert is issued against, and what regulated products require recorded from component through to finished assembly. Many goods-received processes capture only the date code, which makes the record insufficient for its purpose.

### Can date codes be faked?

Easily; they are the simplest marking to alter, which is exactly why they are never trusted alone. Inspection instead checks consistency: whether the date code postdates the part's discontinuation, whether it is consistent with the brand shown, whether all parts in factory-sealed packaging carry uniform codes, whether the marking matches the reel or bag label, and whether the marking method suits the claimed era. A solvent permanency test also catches remarking cheaply.

### What does mixed date codes in one reel mean?

In factory-sealed original packaging it means the packaging was opened and refilled, since a sealed reel from a single production lot should carry uniform markings. That is a strong indicator of repackaged, recycled or mixed material. It is not automatically counterfeit (legitimate repacking happens in distribution) but it invalidates any claim that the packaging is original and factory-sealed, and it warrants escalated inspection.

### Is a Certificate of Conformance proof of authenticity?

No. A Certificate of Conformance from a distributor is that supplier's assertion that the goods conform to your order. It is worth having but proves nothing about where the parts originated. A manufacturer's own CoC carries considerably more weight if genuine. What actually supports a traceability claim is a documented chain of custody showing ownership history back toward the manufacturer, with each step recorded rather than summarised as "a trusted source".

### How long should I keep component traceability records?

For the product's production life plus its support and spares obligation, which for industrial, medical, rail and defence products commonly means fifteen years or more. That horizon usually exceeds the life of the system the records are stored in, so plan explicitly for the records to survive an ERP or PLM migration. Records that cannot be retrieved when a field failure pattern emerges provide no traceability regardless of how carefully they were captured.

### What should I record when parts arrive?

Supplier and channel class, manufacturer as marked, the full part number both as ordered and as marked, every date code present rather than one representative sample, the lot or trace codes, quantity and packaging condition, the inspection tier applied with a report reference, and photographs for any non-franchised receipt. Recording all date codes present is the step most often skipped, and a mixed-code lot is precisely the situation where that record matters most.

### Do small components have date codes?

Frequently not. Packages such as SOT-23, small QFNs and 0402 passives have no room for full markings and instead carry short marking codes that must be looked up against a manufacturer table, or no marking at all in the case of most passives. For these parts, traceability depends entirely on the packaging label and the accompanying documentation, which makes keeping parts in their original labelled packaging until use considerably more important.

## Related reading

For what a full inspection examines beyond markings, see [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide). For building the policy that decides how much of this to require, [writing a counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy). For choosing a channel where provenance is documented rather than reconstructed, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Our documentation and inspection practice is described under [quality](/quality). Send us a part number with your traceability requirements and we will tell you what documentation accompanies the available stock.

[**Submit an RFQ**](/rfq) | [**Quality process**](/quality) | [**Browse the catalogue**](/category)
