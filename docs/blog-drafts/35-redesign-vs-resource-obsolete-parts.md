---
title: "Redesign or Re-source? Deciding What to Do About an Obsolete Part"
slug: "redesign-vs-resource-obsolete-parts"
status: "draft"
seoTitle: "Redesign vs Re-source: Deciding on an Obsolete Component"
seoDesc: "A structured way to choose between authorised aftermarket, last-time buy, substitution and redesign — with the cost model, the decision table, and the factors that override economics."
seoKeywords: "obsolete part decision, redesign vs last time buy, component obsolescence strategy, EOL decision matrix, obsolescence management, when to redesign"
tags: "obsolescence, decision making, redesign, last-time buy, procurement strategy, lifecycle management"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "XC6SLX9-2CPG196I, EPM7128BTC144-10N, NCP1117DT33RKG, MC9S08PT8VWJ"
---

# Redesign or Re-source? Deciding What to Do About an Obsolete Part

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: obsolescence strategy, decision framework, cost model, redesign, last-time buy

---

**The decision about an obsolete part is made badly more often than it is made wrongly.** Teams reach for whichever option is most visible (usually "find a replacement") without comparing it against the alternatives on a common basis. The four options have very different cost structures, very different risk profiles, and a clear ordering that holds in most cases. This guide gives a decision framework, a cost model that includes the parts people forget, and the factors that override the economics entirely.

## Key takeaways

- **Four options, and they should be evaluated in order**: authorised aftermarket, last-time buy, substitution, redesign. Most teams start at three.
- **The first question is free to ask and often ends the exercise.** Checking whether the line is continued in authorised production takes minutes.
- **Compare on total cost, not part cost.** Engineering time, requalification and schedule risk dominate for anything above a jellybean part.
- **Remaining product life is the single most decisive input.** Under five years favours inventory; over ten favours engineering.
- **Certification overrides economics.** If substitution triggers requalification, the calculation usually stops there.
- **Do not migrate onto a mature part.** The commonest expensive mistake is solving this problem twice in a decade.

---

## The four options, in the order to consider them

Evaluate them in this sequence, because each one you can rule in makes the later ones unnecessary.

| # | Option | What it costs | What it risks |
| --- | --- | --- | --- |
| 1 | **Authorised aftermarket** | Part price, sometimes a premium | Almost nothing — same die, traceable |
| 2 | **Last-time buy** | Part price × quantity + storage + capital | Getting the quantity wrong; storage failure |
| 3 | **Substitution** | Engineering days to weeks + pilot build | Undiscovered behavioural differences |
| 4 | **Redesign** | Weeks to months + board + requalification | Schedule, and everything in option 3 |

Most obsolescence discussions start at option 3, because "find an equivalent" is the instinctive engineering response. **Options 1 and 2 are cheaper and are frequently available.**

### Option 1 costs one search

Check whether an authorised aftermarket manufacturer continues the line. If so, the part is newly manufactured under licence with full traceability, requires no requalification, and the exercise is over.

This is checked far less often than it should be. In our catalogue, Rochester Electronics alone accounts for 106,452 part numbers — including 9,264 microcontrollers and a substantial number of legacy FPGAs and CPLDs, and more than 75,000 of those are active supply rather than archived stock. The channel is described in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Ask this before anything else, every time.

## The cost model

The comparison people make is part price versus part price. The comparison that matters includes everything below.

### Last-time buy total cost

```
  Part price × quantity           (see quantity sizing below)
+ Capital cost of inventory       (quantity × price × rate × average years held)
+ Storage cost                    (dry-pack, controlled environment, space)
+ Obsolescence write-off risk     (probability product ends early × residual value)
+ Solderability / requalification (testing before late builds)
```

Quantity sizing (production, spares, yield, engineering units, attrition, uncertainty factor) is covered in detail in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

### Substitution total cost

```
  Engineering time                (paper comparison + bench + pilot)
+ Firmware or compensation rework (if applicable)
+ Documentation updates           (BOM, AVL, drawings, work instructions)
+ Pilot build and soak testing
+ Requalification                 (if certified — often the dominant term)
+ Residual risk                   (probability of a field escape × its cost)
+ Customer notification           (your own PCN obligation, if any)
```

The terms teams routinely omit are documentation updates, customer notification and residual risk. The first two are administrative but real; the third is the one that makes a cheap substitution expensive when it goes wrong.

### Redesign total cost

Everything in substitution, plus board layout, prototype iterations, tooling and test-fixture changes, and a longer schedule.

## The decision table

Most cases resolve on three inputs: remaining life, annual volume and certification status.

| Remaining production life | Volume | Certified? | Usual answer |
| --- | --- | --- | --- |
| < 3 years | Any | Any | **Last-time buy** |
| 3–7 years | Low | Yes | **Last-time buy** |
| 3–7 years | Low | No | Last-time buy, or substitution if a clean candidate exists |
| 3–7 years | High | No | **Substitution** — inventory value gets large |
| 3–7 years | High | Yes | Last-time buy unless requalification is already budgeted |
| > 7 years | Any | No | **Substitution or redesign** |
| > 7 years | Any | Yes | Redesign, planned and budgeted properly |
| Any | Any | Any | **Authorised aftermarket if available — overrides all of the above** |

Two thresholds worth internalising:

Under three years remaining, buy the parts. Almost nothing justifies engineering effort on a product that close to end of production.

Over seven years, buy engineering. Inventory held that long accumulates capital cost, storage risk and solderability degradation, and you will likely face a second obsolescence event on another part anyway. Better to move to a current device once.

## What overrides the economics

Four factors that decide the answer regardless of the cost comparison.

### 1. Certification and qualification

If the product is certified (medical, avionics, rail, functional safety) and substitution triggers requalification, the requalification cost usually exceeds any plausible inventory cost. **Last-time buy or authorised aftermarket, almost always.**

This is the situation described for programme parts in [Actel ProASIC and IGLOO sourcing](/blog/actel-proasic-sourcing-guide), where the part number is frozen by the approval rather than by engineering preference.

### 2. Tooling availability

Sometimes you cannot re-source even when parts exist, because you can no longer build the firmware or program the device. A frozen toolchain running on an end-of-life operating system, a programmer with no current driver, a licence tied to a machine that no longer exists.

When this is the constraint, migration becomes necessary even though parts are available: the situation described in [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide) and [legacy 8-bit MCU sourcing](/blog/legacy-8-bit-mcu-sourcing). Conversely, if the toolchain is intact and archived, last-time buy becomes far more attractive.

### 3. Whether the part is one of several

If three parts on the BOM are going obsolete within two years, evaluate them together. A redesign that addresses all three at once is a fraction of the cost of three sequential substitutions, and this is exactly what portfolio-level monitoring surfaces — see [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

The reverse also applies: a single obsolete jellybean part on an otherwise healthy BOM rarely justifies opening the board.

### 4. Whether the product needs changes anyway

If a board revision is already planned for another reason, the marginal cost of handling the obsolete part in that revision is small. **Timing a substitution to coincide with a planned revision is the cheapest way to do one.** Knowing this depends on talking to the product team, which is why obsolescence management works better as a scheduled review than as a reactive process.

## A worked comparison

A discontinued linear regulator, `NCP1117DT33RKG`-class, in an industrial product:

Situation: 4,000 units/year, 5 years remaining production, 10-year spares obligation, not certified, one per assembly, part cost ~$0.40.

Last-time buy:

```
Production        4,000 × 5                = 20,000
Spares            fleet 30,000 × 0.6% × 10 =  1,800
Yield + eng + attrition ~5%                =  1,100
Subtotal                                     22,900
Uncertainty ×1.2                             27,500
Part cost         27,500 × $0.40           = $11,000
Storage + capital over ~3 yr average       ≈  $1,500
                                            ────────
Total                                        ~$12,500
```

Substitution: the LDO checks in [the LDO cross-reference guide](/blog/ldo-cross-reference-guide) (output capacitor stability, quiescent current, dropout at minimum input, thermal) plus bench verification and a pilot build. Realistically 3–5 engineer-days plus a pilot, so **$8,000–15,000** at typical loaded rates, with residual risk if a stability issue escapes to the field.

Conclusion: the two are close, so the tiebreakers decide. If the board is being revised anyway, substitute. If not, buy the parts; the last-time buy has no residual technical risk. And before either, check whether the line is continued in authorised production.

The point of the exercise is not the number. It is that these two options were within a factor of two of each other, which is not obvious until you write it down, and that the instinctive answer ("just find a replacement") was not clearly cheaper.

## Doing the decision well

Four practices that improve outcomes more than any individual analysis:

Decide early. A decision made 18 months before last-time-buy expiry has all four options available. One made two weeks before has one.

Write the comparison down. Even roughly. The act of listing the substitution's hidden costs next to the inventory cost changes conclusions surprisingly often.

Record the decision and its reasoning. Whoever faces the next obsolescence event on that product will want to know why this one was handled the way it was.

When substituting, do not migrate onto a mature part. Check the replacement family's introduction date, not just its current lifecycle status. Solving the problem twice in a decade is the commonest expensive mistake in this area.

## FAQ

### What are the options when a component goes obsolete?

Four: buy from an authorised aftermarket manufacturer that continues the line, place a last-time buy covering remaining demand, substitute an alternative part, or redesign the circuit. They should be evaluated in that order, because each one you can rule in makes the later ones unnecessary. Most teams start at substitution, which skips the two cheaper options.

### When should I do a last-time buy instead of redesigning?

Generally when remaining production life is under about five years, volumes are moderate, the part stores well, and the design is stable. It becomes almost automatic under three years remaining, or when the product is certified such that substitution would trigger requalification. Redesign becomes the better answer when remaining life exceeds roughly seven years, volumes make the inventory value material, or several parts on the same board are going obsolete together.

### How do I compare the cost of a last-time buy against a substitution?

Include more than part price on both sides. For the last-time buy: quantity times price, plus capital cost of holding inventory, storage, write-off risk if the product ends early, and solderability testing before late builds. For substitution: engineering time for comparison and bench work, any firmware or compensation rework, documentation and approved-vendor-list updates, a pilot build, requalification where applicable, your own customer notification obligation, and residual risk of a field escape.

### What factors override the cost comparison?

Four. Certification, where requalification cost usually exceeds any inventory cost, making last-time buy the answer regardless. Tooling availability, where an unbuildable firmware environment can force migration even though parts remain available. Whether several parts on the same board are going obsolete together, which favours addressing them in one redesign. And whether the product needs a board revision anyway, since the marginal cost of handling the obsolete part in a planned revision is small.

### Should I always look for a drop-in replacement first?

No — check authorised aftermarket first, because it takes minutes and frequently ends the exercise. A line continued in authorised production means newly manufactured parts under licence with full traceability and no requalification. This channel is larger than most buyers assume: in our catalogue Rochester Electronics alone covers 106,452 part numbers, more than 75,000 of them active supply.

### How long before a last-time-buy deadline should I start deciding?

As early as the discontinuation notice arrives, and ideally before — portfolio monitoring should surface at-risk parts 6 to 18 months ahead. A decision made 18 months before the last-time-buy date has all four options genuinely available, including negotiating extended terms with the manufacturer. A decision made two weeks before has one option and no negotiating position.

### What is the most common mistake in obsolescence decisions?

Migrating onto a part that is itself mature. Teams under time pressure select a replacement on functional fit and availability without checking where the candidate sits in its own lifecycle, and face the same problem again within a few years — having paid the full substitution cost twice. Check the replacement family's introduction date rather than just its current status, and prefer a part with a long remaining life even at slightly higher unit cost.

### Should obsolete parts on the same board be handled together?

Yes, where the timing allows. A redesign addressing three obsolete parts at once costs a fraction of three sequential substitutions, each with its own bench work, pilot build and documentation cycle. This only becomes visible with portfolio-level lifecycle monitoring rather than reacting to individual discontinuation notices, which is one of the main arguments for a regular BOM scrubbing process.

## Related reading

Start with [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) — it may end the decision. Then [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) for option two, and the substitution guides for option three: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) and [MCU second-sourcing](/blog/mcu-second-source-cross-reference-guide). For catching these early enough to have a choice, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis), and for reading the notice that starts the clock, [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

Send us the part number and your remaining production plan, and we will tell you which of the four options are actually open — starting with whether the line is still in authorised production.

[**Submit an RFQ**](/rfq) | [**Upload a BOM for lifecycle review**](/bom) | [**Browse the catalogue**](/category)
