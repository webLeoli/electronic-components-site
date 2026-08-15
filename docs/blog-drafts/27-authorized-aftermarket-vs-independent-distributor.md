---
title: "Authorised Aftermarket vs Independent Distribution: Know Which One You Are Buying From"
slug: "authorized-aftermarket-vs-independent-distributor"
status: "draft"
seoTitle: "Authorised Aftermarket vs Independent Distributor Explained"
seoDesc: "Authorised aftermarket, franchised distribution, independent distribution and brokers are four different things with four risk profiles. How to tell them apart and when each is right."
seoKeywords: "authorized aftermarket, independent distributor, franchised distributor, broker, Rochester Electronics, EOL semiconductor supply, obsolete component sourcing channels, counterfeit risk by channel"
tags: "sourcing channels, authorized aftermarket, independent distribution, broker, obsolescence, procurement, traceability"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "AD8605ACB-REEL7, LFE3-70E-7FN1156I, XC3S1400AN-4FGG484C"
---

# Authorised Aftermarket vs Independent Distribution: Know Which One You Are Buying From

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: sourcing channels, authorised aftermarket, independent distribution, traceability

---

**"We got it from a distributor" describes four completely different transactions with four completely different risk profiles.** Franchised distribution, authorised aftermarket, independent distribution and brokerage are distinct channels, and the difference between them is not price or service level; it is whether an unbroken chain back to the original manufacturer exists. For an obsolete part, choosing the channel *is* the quality decision. This guide explains what each channel actually is, how to tell which one you are dealing with, and when each is the right answer.


<img src="/uploads/blog/authorized-aftermarket-vs-independent-distributor.webp" alt="Traceable authorised aftermarket components compared with independently sourced ICs" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Four channels, not two.** Franchised, authorised aftermarket, independent and broker differ in whether provenance is documented, inferred or absent.
- **Authorised aftermarket is not "used parts".** It is continued manufacture of a discontinued line, under licence, frequently on the original tooling and wafers.
- **The single question that classifies a supplier**: can they show an unbroken documented chain from the original manufacturer to you?
- **Independent distribution is legitimate and often necessary**, but the risk sits with the buyer, so inspection is the price of admission.
- Authorised aftermarket should be **checked first for any obsolete part**. In our catalogue Rochester Electronics alone accounts for **106,452 part numbers**, of which 75,360 are still active supply.
- Channel choice should be **written into your procurement policy per risk class**, not decided ad hoc under schedule pressure.

---

## The four channels

They differ in one dimension that matters more than all the others: the integrity of the chain of custody back to the manufacturer.

| Channel | Relationship to manufacturer | Provenance | Typical use |
| --- | --- | --- | --- |
| **Franchised / authorised distributor** | Contracted to distribute current products | Complete, from the factory | Active parts, normal procurement |
| **Authorised aftermarket** | Licensed to *continue manufacturing* discontinued lines | Complete, manufacturer-backed | Obsolete parts, first choice |
| **Independent distributor** | None | Documented where possible; inspection-led | Shortages, obsolete parts, allocation |
| **Broker** | None | Usually minimal | Last resort |

The first two are structurally different from the second two. In the first two, the part's history is *known*. In the second two, it is *reconstructed* — with varying degrees of rigour.

## Franchised distribution: the default, until it is not

A franchised distributor holds a contract with the manufacturer to sell current product. Parts come directly from the factory, provenance is complete by construction, and the manufacturer's warranty applies.

This is normal procurement, and there is nothing to think about — until the part goes end-of-life. At that point:

- Franchised stock is finite and depletes over roughly one to three years after end-of-life.
- Once it is gone, the channel is closed permanently. There is no restocking.
- Many franchised distributors will not quote a part they can no longer obtain, so the part simply disappears from your usual sources.

That transition is the moment a sourcing problem is created, and [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained) covers the lifecycle signals that precede it.

## Authorised aftermarket: the channel people forget

An authorised aftermarket manufacturer is licensed by the original manufacturer to continue producing a discontinued part. This is the most misunderstood channel. It is routinely skipped because the name sounds like it means second-hand.

What it actually involves:

- **A licence agreement** with the original component manufacturer covering a discontinued product line.
- **Transfer of intellectual property, test programs and often physical assets** — masks, tooling, and in many cases the remaining wafer inventory.
- **Continued manufacture** using the original design, frequently on original wafers finished and tested to the original specification.
- **Full traceability and manufacturer-backed quality**, because the output is authorised production rather than recovered material.

In our catalogue this is a large presence: Rochester Electronics accounts for **106,452 part numbers**, and (the number that surprises people) **75,360 of those are active supply**, not archived stock. Only 30,906 are marked obsolete.

You can see the effect across the legacy families covered elsewhere on this site. `AD8605ACB-REEL7`, an obsolete Analog Devices op-amp, is available this way. So is `LFE3-70E-7FN1156I`, a discontinued Lattice ECP3, and `XC3S1400AN-4FGG484C`, a Spartan-3AN. In each case the alternative would have been a risky open-market purchase or a redesign.

Why this matters practically: an authorised aftermarket purchase requires no requalification, carries no counterfeit question, and needs only ordinary incoming procedures. For a qualified or certified product it is frequently the *only* channel that preserves the approval, as discussed in [Actel ProASIC and IGLOO sourcing](/blog/actel-proasic-sourcing-guide).

Check this channel first for every obsolete part. It costs one search and it eliminates the entire risk conversation when it succeeds. Browse [Rochester Electronics parts](/manufacturer/rochester-electronics).

## Independent distribution: legitimate, and where the work is

An independent distributor buys and sells on the open market with no manufacturer contract. Sources include excess inventory from contract manufacturers, cancelled orders, surplus from other distributors, and (this is the crux) recovered or recycled material of varying quality.

Independent distribution is a necessary and legitimate part of the supply chain. When a part is obsolete and no authorised aftermarket source exists, this is the channel. But the risk transfers to the buyer, so what distinguishes a good independent distributor from a bad one is **process**, not stock:

| Signal | Good sign | Warning sign |
| --- | --- | --- |
| Quality system | AS6081, AS9120, ISO 9001 certified | "We test everything" with no named standard |
| Inspection | In-house lab, documented procedure, per-lot reports | Inspection "available on request" at extra cost |
| Traceability | Documented chain of custody, named source | "Trusted supplier network" |
| Reporting | Photographs, X-ray, test results before shipment | Report supplied only after payment |
| Returns | Written policy covering counterfeit findings | Vague or absent |
| Sourcing transparency | Will state where the material came from | Will not |

The inspection question is the one worth pressing. [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) defines what a real inspection covers; a supplier who cannot describe their procedure against a named standard is not performing one.

## Brokers: what the word actually means

A broker locates material and arranges a transaction without holding stock, inspecting it, or taking responsibility for it. The distinction from an independent distributor is that a broker is an intermediary rather than a stocking entity — they do not see the parts.

That is not automatically disqualifying; brokers can find genuinely scarce material. But it means:

- No inspection unless separately arranged and paid for.
- Provenance is whatever the upstream source claims, unverified.
- Recourse is usually limited to the transaction, not the parts.

If a broker is the only route, treat inspection as a mandatory separate line item and budget accordingly.

## How to tell which channel you are actually dealing with

Terminology in this industry is deliberately blurred. Many suppliers describe themselves in language that implies authorisation they do not have. Four questions settle it:

1. **"Are you franchised or authorised for this manufacturer, and can you name the agreement?"** A franchised or authorised aftermarket supplier answers immediately and specifically. Anything vague means no.

2. **"Where did this specific lot come from?"** Authorised channels answer from records. Good independents answer honestly, sometimes with "excess inventory from a CM, and here is what we did to verify it." A refusal to answer is the answer.

3. **"What inspection will you perform, to what standard, and will I get the report before shipment?"** This separates process from marketing.

4. **"What happens if incoming inspection finds a problem?"** A written policy exists or it does not.

A supplier's website language is not evidence. "Authorised" appears on a great many sites that hold no authorisation.

## Choosing the channel by risk class

Channel choice should follow from the part's role, and should be written down in advance, not decided by whoever is under the most schedule pressure.

| Part role | Preferred channel order |
| --- | --- |
| Active production part | Franchised only |
| Obsolete, non-critical, commercial product | Authorised aftermarket → independent with inspection |
| Obsolete, safety- or mission-critical | Authorised aftermarket → last-time-buy → redesign. Independent only with full inspection and documented approval |
| Certified / qualified product (medical, avionics, rail) | Authorised aftermarket or original stock with full traceability. Independent usually prohibited by the approval |
| Repair and spares, low volume | Authorised aftermarket → independent with inspection |
| Prototype / development | Any, with sanity checks |

Two policy points worth adopting:

- **Require a documented approval step before using an independent source on a critical part.** This prevents a schedule crisis from silently changing your risk posture.
- **Record the channel in the goods-received record.** If a field failure occurs three years later, knowing which channel the lot came from is the first useful fact in the investigation.

## The cost comparison people get wrong

An independent quote is frequently cheaper than an authorised aftermarket quote on the same part number. That comparison is incomplete unless it includes:

- Incoming inspection cost, scaled to lot value and part criticality
- The probability-weighted cost of a counterfeit escape reaching production
- Rework and field-failure exposure if one does
- For a qualified product, the cost of an invalidated build

For a jellybean part in a commercial product, the independent quote usually still wins. For a high-value legacy FPGA in a certified system, it usually does not, which is the same conclusion reached from the technical side in [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing).

## FAQ

### What is the difference between an authorised distributor and an authorised aftermarket manufacturer?

An authorised, or franchised, distributor has a contract to sell a manufacturer's current products and ships parts that came directly from the factory. An authorised aftermarket manufacturer holds a licence to *continue manufacturing* a product line the original manufacturer has discontinued, typically having received the intellectual property, test programs, tooling and often remaining wafer inventory. The first supplies current parts; the second supplies discontinued parts as new authorised production.

### Is authorised aftermarket the same as buying used or recycled parts?

No, and the confusion costs buyers money. Authorised aftermarket parts are newly manufactured under licence from the original component manufacturer, using the original design and frequently the original wafers and test programs, with full traceability and manufacturer-backed quality. Recycled or recovered parts are devices removed from existing equipment and resold, which is an entirely different proposition with entirely different risk.

### Are independent distributors safe to buy from?

They can be, and for obsolete parts with no authorised aftermarket source they are often the only option. What matters is process rather than stock: look for a named quality standard such as AS6081, an in-house inspection capability with a documented procedure, per-lot reporting supplied before shipment rather than after payment, willingness to state where material came from, and a written policy covering what happens if incoming inspection finds a problem. A supplier who cannot describe their inspection against a named standard is not performing one.

### What is the difference between an independent distributor and a broker?

An independent distributor buys, holds and sells stock, and typically has inspection capability. A broker is an intermediary who locates material and arranges a transaction without holding or inspecting the parts. Brokers can find genuinely scarce material, but provenance is whatever the upstream source claims, no inspection occurs unless separately arranged and paid for, and recourse is generally limited to the transaction rather than the parts.

### How do I verify a supplier is really authorised?

Ask directly whether they are franchised or authorised for that specific manufacturer and whether they can name the agreement. Genuine authorised suppliers answer immediately and specifically; vague responses mean no. Manufacturers also publish lists of their authorised distributors and aftermarket partners, which can be checked independently. Website language is not evidence: the word "authorised" appears on many sites that hold no authorisation.

### Should I always check authorised aftermarket first for an obsolete part?

Yes. It costs a single search and, when it succeeds, eliminates the entire counterfeit and requalification conversation: the parts are newly manufactured authorised production with full traceability. The channel is larger than most buyers assume: in our catalogue Rochester Electronics alone accounts for 106,452 part numbers, of which more than 75,000 are active supply rather than archived stock.

### Why is an independent quote cheaper than an authorised aftermarket quote?

Because the price excludes the risk transfer. An authorised aftermarket price includes manufacturer-backed quality, full traceability and no counterfeit exposure. An independent price does not, so the true comparison must add incoming inspection scaled to lot value, the probability-weighted cost of a counterfeit reaching production, rework and field-failure exposure, and (for a qualified product) the cost of an invalidated build. For low-value commercial parts the independent quote usually still wins; for high-value parts in certified systems it usually does not.

### Should channel choice be part of procurement policy?

Yes, and it should be defined per risk class before it is needed. Deciding under schedule pressure is how critical parts end up sourced through channels nobody would have approved deliberately. Two practices help: require a documented approval step before using an independent source on a critical part, and record the sourcing channel in the goods-received record so that a field failure years later can be traced back to it.

## Related reading

For the lifecycle signals that precede a channel change, see [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained). For the five sourcing paths in order of preference, [how to source obsolete electronic components](/blog/how-to-source-obsolete-electronic-components). For what a real inspection covers, [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide). For catching obsolescence early enough to have a choice of channel, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us the part number and we will tell you which channels it is actually available through — including authorised aftermarket, which is checked first on every obsolete request.

[**Submit an RFQ**](/rfq) | [**Rochester Electronics parts**](/manufacturer/rochester-electronics) | [**Upload a BOM**](/bom)
