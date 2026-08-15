---
title: "BOM Scrubbing: Catching Lifecycle Risks Before They Become Production Crises"
slug: "bom-scrubbing-lifecycle-risk-analysis"
status: "draft"
seoTitle: "BOM Scrubbing: How to Find Lifecycle Risks in Your BOM"
seoDesc: "BOM scrubbing identifies EOL, NRND, and single-source parts before production crises. Six risk dimensions, six-step process, free checklist."
seoKeywords: "BOM scrubbing, BOM lifecycle analysis, BOM risk analysis, lifecycle status check, EOL monitoring"
tags: "BOM, scrubbing, procurement, supply chain risk, EOL, NRND, lifecycle monitoring"
author: "FPGACenter Sourcing Team"
readingTime: 10
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "CD4024BHSR, MAX368CPN+, X9313UST1, SSTVF16857AGT, AD7541AJP, EPM7064SLC44-10N, XC2V1500-4FFG896C, MC10EL32DTG"
---

# BOM Scrubbing: Catching Lifecycle Risks Before They Become Production Crises

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~10 minutes
> **Topics**: BOM scrubbing, lifecycle risk, procurement, supply chain

---


<img src="/uploads/blog/bom-scrubbing-lifecycle-risk-analysis.webp" alt="Electronic component BOM review with lifecycle risk indicators and parts reels" width="1200" height="630" fetchpriority="high" />

## What BOM scrubbing actually is

"BOM scrubbing" is the systematic, repeatable review of every part in a bill of materials to identify lifecycle risk, sourcing risk, and compliance exposure — before any of those risks become production-line problems. It's the procurement equivalent of preventive maintenance: cheap to do regularly, expensive to skip until something fails.

The difference between scrubbing and a one-off audit is repeatability. An audit answers *"is this BOM healthy today?"*. Scrubbing answers *"how is this BOM trending across our entire active portfolio?"*. Teams that run continuous scrubbing typically catch obsolescence risk 6-18 months ahead of teams that audit reactively.

The cost of skipping is well documented in industry data. A single mid-criticality component going from Active to End-of-Life without warning can trigger a procurement scramble that costs 3-10× the original part price plus weeks of project delay. Multiply that across a portfolio of products and the case for scrubbing pays for itself many times over.

This guide covers what to check, how to check it, and how to build a sustainable scrubbing process.

## The six risk dimensions to check

A useful BOM scrub goes beyond just "is this part EOL." Six independent dimensions matter:

**1. Lifecycle status**. Active, NRND, Last-Time-Buy, End-of-Life, or Obsolete. (See [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained) for definitions and decision frameworks.)

2. Source diversity. A part with only one manufacturer carries higher risk than the same part available from multiple sources. Single-source critical components are the single biggest avoidable supply chain risk in most BOMs.

3. Manufacturer corporate health. Mergers and acquisitions routinely reshape lifecycle decisions. AMD's 2022 acquisition of Xilinx, Intel's 2015 acquisition (and 2024 partial spinout) of Altera, Renesas absorbing IDT and Intersil, and Microchip's serial acquisitions of Atmel and Microsemi all changed product roadmap decisions for hundreds of legacy parts. Manufacturer financial signals (quarterly results, debt restructuring news, fab consolidation announcements) are leading indicators of lifecycle action.

4. Geographic / geopolitical risk. Where the part is fabbed, packaged, and tested matters. Concentration in a single geopolitical region creates exposure to export controls, tariffs, and disruption events. The 2020-2022 semiconductor supply crunch made this concrete for many teams that hadn't tracked geographic concentration previously.

5. Specification change risk. A part with frequent PCN history (minor process changes, package variant updates, test condition tweaks) is more likely to drift outside its original specification over time. PCN-heavy parts deserve more frequent verification testing in production.

6. Inventory depth vs demand rate. The ratio of available distributor stock to your annual usage tells you how much runway you have. A part with 8 weeks of stock at your current draw rate is fundamentally different from one with 5 years of stock, even if both show Active status.

A good BOM scrub assigns each part a risk score on each dimension, then rolls up into an overall risk classification.

## Step-by-step BOM scrubbing process

The scrub itself can be a structured six-step process that scales from a single PCB BOM to a portfolio-wide review.

Step 1: Normalize part numbers. BOMs accumulate naming inconsistencies over time — manufacturer prefixes vary, package suffixes get truncated, internal customer part numbers get mixed with manufacturer part numbers. Before any lookup, normalize to manufacturer part numbers. This step alone catches 5-10% of historical errors in most BOMs that haven't been cleaned recently.

Step 2: Pull lifecycle data. For each manufacturer part number, query authoritative sources:
- Manufacturer product page (ground truth, slowest to query)
- Lifecycle aggregator (SiliconExpert, Z2Data, Eaton TraceParts) — fastest, may lag by hours to days
- Distributor product pages (good for stock levels, lag is similar)

For a 200-line BOM, automated tool query is the only practical approach. Manual review only makes sense for small or critical BOMs.

Step 3: Cross-check distributor stock. Pull current authorized-distributor stock from Mouser, Digi-Key, Arrow, and your regional franchise distributors. Calculate distributor coverage as months of usage at current rate.

Step 4: Flag risks by severity. A useful four-tier classification:
- **Critical**: Obsolete or EOL with no authorized stock + critical to product function
- **High**: NRND or single-sourced with limited distributor coverage
- **Medium**: Active but recent PCN activity or manufacturer M&A exposure
- **Low**: Active, multi-sourced, deep stock, stable manufacturer

Step 5: Build mitigation plan per flagged part. For each Critical/High part:
- Source options (authorized → LTB → specialty distribution → replacement)
- Estimated mitigation cost
- Timeline
- Owner

Step 6: Set up monitoring. Subscribe to PCN feeds for the Critical and High parts at minimum. Re-run the full scrub quarterly.

## Tools comparison

| Tier | Tools | Annual cost (rough) | Best for |
|---|---|---|---|
| Free / manual | Manufacturer websites, Octopart aggregation | $0 | Single small BOMs, occasional review |
| Mid-tier | Z2Data, SiliconExpert (entry) | Low-to-mid five figures | Engineering teams with 1-10 active BOMs |
| Enterprise | Eaton TraceParts (formerly IHS Markit), SiliconExpert full | Mid-to-high five figures | Portfolio teams with 50+ active BOMs and compliance reporting requirements |
| Specialized | ERAI alerts, manufacturer PCN email subscriptions | Free to low | Counterfeit and PCN-specific monitoring |

The right tier depends on portfolio size and how much manual labor you're willing to absorb. Many teams successfully run BOM scrubbing on Octopart + manufacturer alerts for the first few years, graduating to a paid aggregator when portfolio complexity justifies the cost.

## Common findings in real BOMs (and what to do)

Patterns repeat across most well-aged BOMs. The following are commonly surfaced findings and standard mitigations.

Finding: NRND part on a high-volume long-life product
Action: Identify the manufacturer's recommended successor. Schedule a pin-and-package compatibility evaluation. If the successor isn't drop-in, build the redesign cost into next year's planning rather than reacting under pressure later.

Finding: Single-source critical IC with one franchise distributor holding stock
Action: Diversify. Either qualify a second source through engineering test, or build a strategic stockpile to bridge a single-supplier disruption.

Finding: Manufacturer recently acquired
Action: Watch quarterly PCNs from the acquirer. Acquisitions are often followed within 12-18 months by lifecycle rationalization where overlapping or low-margin parts are EOL'd.

Finding: Part with multiple PCNs in past 12 months
Action: Increase incoming inspection scrutiny. The part is changing, and the changes may eventually drift outside your qualification envelope.

Finding: Distributor stock at 4-8 weeks of usage
Action: Place a forward order to extend coverage to at least 6 months. This is cheap insurance against supply chain disruption.

Finding: An obsolete part with active alternative supply through specialty channels
Action: Qualify a specialty distributor. Verify they hold inventory (not just willing to source on demand). Establish minimum-stock-on-hand expectations.

Finding: A part marked Active by the manufacturer but with 0 distributor stock globally
Action: This is one of the highest-risk findings. The part may be in a transition that hasn't formally been announced. Contact the manufacturer directly to confirm Active status and ask about LTB availability.

## A free BOM scrubbing checklist

This checklist is designed for a single PCB BOM, run quarterly. Print or copy into your team's procurement workflow.

Per-BOM aggregate checks
- [ ] Every line item normalized to manufacturer part number
- [ ] Every line item has lifecycle status pulled within the last 30 days
- [ ] No line items showing EOL or Obsolete without a mitigation plan
- [ ] No line items showing NRND on products with > 3 years remaining production life without a recommended-successor plan
- [ ] No single-source parts on Critical-class assemblies
- [ ] All counterfeit-sensitive parts (military, aerospace, medical lines) sourced through verified channels with inspection
- [ ] Distributor coverage > 6 months at current usage rate for all parts

Per-line-item checks
- [ ] Lifecycle status (Active / NRND / LTB / EOL / Obsolete)
- [ ] Last PCN date and nature
- [ ] Number of authorized distributors holding stock
- [ ] Months of stock at current usage rate
- [ ] Manufacturer corporate signal in last 12 months (acquisition, restructuring)
- [ ] Alternate sources qualified
- [ ] Last incoming inspection date

Documentation hygiene
- [ ] Risk classifications documented in the scrubbing log
- [ ] All Critical/High items have an owner assigned
- [ ] Quarterly review date set for next iteration

## Building a BOM health dashboard

For teams managing more than a handful of active BOMs, individual line-item review becomes impractical. A simple dashboard with portfolio-level KPIs surfaces trends.

Useful KPIs:

- **% parts EOL or Obsolete** (portfolio-wide and per-product)
- **% parts NRND or with formal LTB**
- **Single-source parts count** (any source diversity = 1)
- **Manufacturer concentration risk** (top 3 manufacturers as % of BOM dollar volume)
- **Distributor coverage distribution** (median, 25th percentile months of stock)
- **PCN activity rate** (PCNs per 1000 BOM line items per quarter)
- **Open critical/high mitigation actions** (count and average age)

A monthly view of these metrics catches drift before any single part becomes a crisis. A quarterly review of the underlying details ensures the metrics are based on current data.

## When to bring in specialty help

Internal BOM scrubbing covers the routine. Specialty help adds value when:

- A specific part has no clear sourcing path and your team has exhausted standard channels
- A portfolio-wide review surfaces 10%+ of parts in lifecycle decline and you need triage help
- Compliance reporting (DFARS, IATF 16949, ISO 13485 supplier qualification) requires verifiable third-party sourcing documentation
- A specific part requires inspection rigor (IDEA-STD-1010, AS6081) that your internal receiving doesn't have

FPGACenter offers BOM lifecycle analysis for teams running quarterly procurement risk reviews: we can take a BOM, run the lifecycle status, source-diversity, and distributor-coverage analysis described above, and return a risk-prioritized report.

## FAQ

### How often should we run BOM scrubbing?

For active production BOMs, quarterly is the most common cadence. For BOMs in active design, run at major design freeze points. For BOMs of legacy products near end-of-life, monthly may be warranted.

### Can we automate BOM scrubbing entirely?

Lifecycle data lookup and stock level checking can be automated through paid aggregators. The risk classification and mitigation planning steps still benefit from human review — especially for parts where the right action depends on remaining product life, qualification cost, or strategic considerations that aren't in the data.

### What's the difference between BOM scrubbing and incoming inspection?

BOM scrubbing is forward-looking, checking for lifecycle and sourcing risk on parts before they're ordered. Incoming inspection is verification of what's been received. Both are necessary; neither substitutes for the other.

### Is BOM scrubbing only for high-reliability industries?

No. Consumer electronics teams benefit from scrubbing too: the lower stakes per unit are offset by higher volume, so a single missed obsolescence can still cost meaningful money. The frequency and rigor scale with criticality.

### How do specialty distributors fit into a scrubbing program?

Specialty distributors are typically engaged after scrubbing identifies obsolete or hard-to-find parts that have left authorized distribution. Pre-qualifying one or more specialty distributors before you need them shortens response time when a sourcing crisis appears.

---

Need a BOM scrubbed by someone outside the team?

FPGACenter offers BOM lifecycle analysis as part of our sourcing service: send us a bill of materials and we'll return a risk-prioritized report identifying NRND, EOL, and obsolete exposure, along with sourcing or replacement options for flagged parts.

[**Submit a BOM**](/bom) | [**Submit an RFQ for sourcing**](/rfq) | [**Contact the team**](/contact)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17

