---
title: "Last-Time Buy: How Much to Order and How to Store It"
slug: "last-time-buy-quantity-and-storage"
status: "draft"
seoTitle: "Last-Time Buy Guide: Quantity Calculation and Storage"
seoDesc: "How to size a last-time buy without over- or under-ordering: demand, spares, yield and attrition. Plus JEDEC J-STD-033 dry storage, floor life, bake procedures and what actually degrades in storage."
seoKeywords: "last time buy, LTB quantity calculation, EOL last time buy, J-STD-033 storage, moisture sensitivity level, dry pack storage, component shelf life, bridge buy"
tags: "last-time buy, LTB, EOL, obsolescence, inventory, J-STD-033, moisture sensitivity, storage"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "XC6SLX9-2CPG196I, EP4CE6E22C8N, DS1232SN+"
---

# Last-Time Buy: How Much to Order and How to Store It

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: last-time buy, quantity calculation, J-STD-033, dry storage, moisture sensitivity

---

**A last-time buy is a one-shot decision with no second chance, and it fails in two directions.** Order too few and the product dies early or you face an emergency redesign under the worst possible conditions. Order too many and you have written off capital in parts that will be scrapped. Then, having got the number right, you can still lose the whole buy to bad storage — moisture-sensitive devices stored in an ordinary stockroom for five years are not usable without intervention. This guide covers the quantity calculation and the storage regime, both of which are more tractable than they look.

## Key takeaways

- **Build the quantity from five components**: production demand, spares and repair, manufacturing yield loss, engineering and test units, and attrition in storage.
- **Spares obligations are the most commonly forgotten input**, and for long-life products they can exceed remaining production volume.
- **Under-ordering is far more expensive than over-ordering** for critical parts — asymmetric risk justifies deliberate margin.
- **Moisture sensitivity level (MSL) determines storage requirements**, and most modern plastic packages are MSL 3 or worse.
- **Dry-pack storage with desiccant and humidity indicator cards**, per J-STD-033, is what makes a multi-year hold viable.
- **Not everything stores well.** Tin-finish leadframes grow whiskers, some parts have limited shelf life, and packaging integrity fails over time.

---

## When a last-time buy is the right answer

A last-time buy is a bet that inventory is cheaper than engineering. That bet is favourable more often than teams expect, particularly for simple parts in stable designs.

It is usually the right answer when:

- The product is stable and the design is not otherwise changing.
- Remaining production life is predictable — typically under five to seven years.
- The part is a commodity or jellybean device that stores well.
- The product is certified, and any substitution triggers requalification.
- The alternative substitution would force a board change anyway.

It is usually the wrong answer when:

- Remaining production life is long or open-ended.
- Volumes are high enough that the inventory value becomes material.
- The part is moisture-sensitive, expensive, or has known storage limitations.
- A straightforward drop-in exists and the product is not certified.
- The design needs changes anyway, so the board is being revised regardless.

The competing option (qualifying a substitute) is covered in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide) and [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide). Before either, check whether an [authorised aftermarket source](/blog/authorized-aftermarket-vs-independent-distributor) exists, because that removes the decision entirely.

## Sizing the buy

Five components, added together, then adjusted for uncertainty.

```
LTB quantity =  Remaining production demand
              + Spares and repair demand
              + Manufacturing yield loss
              + Engineering, test and qualification units
              + Storage and handling attrition
              ─────────────────────────────────────────
              × Uncertainty factor
```

### 1. Remaining production demand

Annual build volume multiplied by remaining years of production, times the number of that part per assembly. The trap is optimism about the end date: products routinely outlive their planned discontinuation, and a product still selling well will not be discontinued on schedule.

Use the **contractual or committed** end date if one exists. If not, ask the product manager for their realistic estimate and then ask what happens if the product sells better than expected.

### 2. Spares and repair demand

This is the input most often forgotten, and for long-life products it can exceed remaining production.

Sources of spares demand:

- Contractual spares obligations — common in industrial, medical, rail and defence, and frequently extending 7-15 years past end of production.
- Repair depot consumption, driven by field failure rate.
- Warranty replacement.

A rough model:

```
Spares = (Fleet size) × (Annual failure rate) × (Support years after production ends)
```

For a product with 10,000 units in the field, a 1% annual failure rate on the assembly containing this part, and a ten-year support obligation:

```
Spares = 10,000 × 0.01 × 10 = 1,000 assemblies
```

That may be larger than one more year of production. If the failure rate is unknown, field returns data is the best proxy; if there is none, industry practice is to assume something rather than zero.

### 3. Manufacturing yield loss

Parts consumed but not shipped: placement failures, board scrap, rework, test failures, and parts destroyed during troubleshooting. Typical values are a few percent, but a fine-pitch BGA in a difficult assembly can lose considerably more.

Use your actual historical yield for this part or a comparable one. If the assembly has 97% first-pass yield and the part is not recoverable from scrapped boards, add roughly 3%.

### 4. Engineering, test and qualification units

Prototype builds, failure analysis, test fixtures, destructive inspection of incoming lots, and units held for future troubleshooting. Small in absolute terms, and routinely omitted entirely — then borrowed from production stock, quietly shortening the runway.

### 5. Storage and handling attrition

Damage in storage, ESD events, lost or miscounted reels, partial reels that cannot be used, and packaging failures. A few percent is realistic for a multi-year hold.

### The uncertainty factor

Then multiply by a margin, because the risks are asymmetric.

| Situation | Suggested factor |
| --- | --- |
| Stable product, well-known volumes, cheap part | 1.05 – 1.10 |
| Normal case | 1.10 – 1.25 |
| Uncertain end date, or critical part | 1.25 – 1.50 |
| Certified product where substitution is prohibited | 1.50+ |

The asymmetry is the point. If a part costs $2 and you over-order by 2,000 units, you have wasted $4,000. If you under-order by 200 units on a certified product, you face an emergency sourcing exercise on the open market at whatever price is asked, or a requalification programme costing six figures. **Round up.**

### A worked example

A discontinued supervisor IC, one per assembly, in an industrial product:

```
Annual production            2,500 units
Remaining production         4 years        →  10,000
Fleet in field               18,000 units
Annual failure rate          0.8%
Support obligation           10 years       →   1,440
Yield loss                   3% of 10,000   →     300
Engineering / test                          →     200
Storage attrition            2%                    240
                                            ─────────
Subtotal                                       12,180
Uncertainty ×1.25                              15,225
                                            ─────────
Order                                          15,500  (round to reel quantity)
```

Note that spares are 12% of the total here, not negligible, and entirely invisible if nobody asks the service organisation.

## Storing the buy so it is still usable

Getting the quantity right and then storing badly is a common and expensive failure. A five-year hold has real requirements.

### Moisture sensitivity is the main constraint

Plastic-encapsulated packages absorb atmospheric moisture. During reflow, absorbed moisture flashes to steam and can delaminate or crack the package: the "popcorn" failure. JEDEC J-STD-020 defines moisture sensitivity levels, and J-STD-033 defines handling and storage.

| MSL | Floor life at ≤30 °C / 60% RH |
| --- | --- |
| 1 | Unlimited |
| 2 | 1 year |
| 2a | 4 weeks |
| 3 | 168 hours (1 week) |
| 4 | 72 hours |
| 5 | 48 hours |
| 5a | 24 hours |
| 6 | Must be baked before use |

Most modern fine-pitch and BGA packages are MSL 3 or worse. Floor life is cumulative exposure outside the dry pack, not a countdown that resets.

### What a proper dry-pack hold looks like

- **Original moisture barrier bag, unopened**, with desiccant and a humidity indicator card inside.
- If a bag has been opened, **reseal with fresh desiccant and a new indicator card**, and record the exposure time consumed.
- **Store at stable, moderate temperature and low humidity.** A controlled stockroom is fine; an unheated warehouse with large temperature swings is not, because condensation cycles are worse than steady humidity.
- **Nitrogen dry cabinets** are the better option for long holds and for parts that will be opened more than once. They remove the resealing problem entirely.
- **Check indicator cards periodically.** A bag with a compromised seal is discovered by looking, not by assuming.

### Baking

If the floor-life budget is exceeded or the indicator card shows moisture ingress, the parts need baking before reflow. J-STD-033 gives times and temperatures by package thickness and MSL — typically many hours at 125 °C, or much longer at lower temperatures for parts on tape-and-reel carriers that cannot survive 125 °C.

Two practical constraints:

- **Tape-and-reel carriers usually cannot be baked at high temperature.** Low-temperature baking takes days, or the parts must be transferred to trays.
- **Baking is not unlimited.** Repeated high-temperature bakes accelerate intermetallic growth on the terminations and can degrade solderability.

### What else degrades in storage

Moisture is the main issue but not the only one.

- **Solderability.** Terminations oxidise over time. Parts stored more than a few years should be solderability-tested to J-STD-002 before a production build, not discovered to be unsolderable on the line.
- **Tin whiskers.** Pure-tin finishes grow conductive whiskers over years, which is a genuine reliability concern for high-reliability and long-storage applications. This is one reason some defence programmes still specify tin-lead finishes.
- **Packaging integrity.** Tape-and-reel carrier tape and cover tape degrade; adhesive can fail; reels warp under stack pressure. Store reels vertically and avoid stacking.
- **ESD-protective packaging** loses effectiveness as the dissipative coating degrades.
- **Documentation.** The lot's traceability paperwork must survive as long as the parts. Store it with the material or in a system that will still exist.

### Storage checklist

| # | Item |
| --- | --- |
| 1 | Record MSL and original pack date on receipt |
| 2 | Keep in original sealed moisture barrier bag; do not open to count |
| 3 | Humidity indicator card inside every bag, checked periodically |
| 4 | Controlled temperature and humidity; avoid cycling |
| 5 | Nitrogen dry cabinet for long holds or repeated access |
| 6 | Track cumulative floor-life exposure per bag |
| 7 | Reels stored vertically, not stacked |
| 8 | Solderability test before the first build after a long hold |
| 9 | Traceability documentation stored with the material |
| 10 | Inventory record flagged so the stock is not "optimised away" |

Item 10 is not a joke. Last-time-buy inventory has been scrapped by well-meaning stock-reduction programmes that saw slow-moving material and did not know why it was there. **Flag it, document why it exists, and make sure the flag survives an ERP migration.**

## Placing the order

A few points specific to last-time-buy purchasing:

- **Buy the exact orderable part number**, including speed grade, package, temperature grade and RoHS status. A last-time buy of the wrong suffix is a total loss.
- **Ask for a single lot and date code if possible.** Uniform material simplifies qualification and traceability.
- **Confirm packaging format** — full reels, partial reels, trays or tubes. A part supplied in tubes when your line expects tape-and-reel needs handling equipment you may not have.
- **Get the certificate of conformance and traceability documentation at the time of purchase**, not later. Suppliers change.
- **Split delivery is worth negotiating** if storage capacity is limited, but the whole quantity should be committed and reserved.

## FAQ

### What is a last-time buy?

A last-time buy, sometimes called a last-time order or bridge buy, is a final purchase of a component before its manufacturer stops production, sized to cover all remaining demand for the product's life. It is a one-shot decision with no opportunity to reorder, so the quantity must include production, spares, yield loss, engineering units and storage attrition, plus a margin for uncertainty.

### How do I calculate last-time buy quantity?

Add five components: remaining production demand (annual volume times remaining years times parts per assembly), spares and repair demand over the support obligation, manufacturing yield loss, engineering and test units, and storage attrition. Then multiply by an uncertainty factor, typically 1.1 to 1.25 in normal cases and 1.5 or more for critical parts in certified products. The risks are asymmetric — over-ordering wastes the part cost, while under-ordering can force an emergency open-market purchase or a requalification programme.

### What is usually forgotten in a last-time buy calculation?

Spares and repair demand. For long-life industrial, medical, rail and defence products, support obligations frequently extend seven to fifteen years past end of production, and the resulting spares volume can exceed one more year of production. It is invisible unless someone asks the service organisation for fleet size, failure rate and support duration. Engineering and test units are also commonly omitted and then quietly borrowed from production stock.

### How should last-time buy stock be stored?

In its original sealed moisture barrier bag with desiccant and a humidity indicator card, at stable moderate temperature and low humidity, per JEDEC J-STD-033. For long holds or stock that will be accessed repeatedly, a nitrogen dry cabinet is better because it removes the resealing problem. Track cumulative floor-life exposure for each bag, store reels vertically rather than stacked, and keep traceability documentation with the material.

### What is moisture sensitivity level and why does it matter for storage?

Moisture sensitivity level, defined in JEDEC J-STD-020, classifies how long a plastic-encapsulated package can be exposed to ambient conditions before reflow without risk of moisture-induced cracking. Absorbed moisture flashes to steam during reflow and can delaminate or crack the package. Most modern fine-pitch and BGA packages are MSL 3, allowing only 168 hours of cumulative floor life, so multi-year storage requires sealed dry packaging rather than an ordinary stockroom shelf.

### Can components be baked if they have absorbed moisture?

Yes, and J-STD-033 specifies times and temperatures by package thickness and moisture sensitivity level — commonly many hours at 125 °C. Two constraints apply: tape-and-reel carrier tape usually cannot withstand high-temperature baking, so either a much longer low-temperature bake or transfer to trays is required; and repeated high-temperature baking accelerates intermetallic growth on terminations and can degrade solderability, so it is not an unlimited remedy.

### What else degrades in long-term component storage?

Solderability declines as terminations oxidise, so parts held for several years should be solderability-tested to J-STD-002 before a production build rather than discovered to be unsolderable on the line. Pure-tin finishes can grow conductive whiskers over years, which is a reliability concern for high-reliability applications. Packaging also degrades (carrier and cover tape, adhesives and reels) and ESD-protective packaging loses effectiveness over time.

### Is a last-time buy cheaper than qualifying a replacement?

Frequently, for simple parts in stable designs. Qualifying a substitute typically costs several engineer-days to several weeks depending on the part class, plus a pilot build and possibly requalification, while a last-time buy costs part price times quantity plus storage. The balance shifts toward qualification when remaining production life is long, volumes make the inventory value material, or the part is expensive and moisture-sensitive. Always check whether an authorised aftermarket source exists first, since that avoids both paths.

## Related reading

Before committing to a last-time buy, check whether an [authorised aftermarket source](/blog/authorized-aftermarket-vs-independent-distributor) continues the part — that removes the decision. For the lifecycle signals that tell you a last-time buy window is opening, see [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained), and for catching them early, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis). The competing option is covered in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide) and [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide).

Send us the part number, your remaining production plan and your support obligation, and we will come back with availability and a quantity recommendation — including whether the part is still in authorised production, which would make the whole exercise unnecessary.

[**Submit an RFQ**](/rfq) | [**Upload a BOM for lifecycle review**](/bom) | [**Quality process**](/quality)
