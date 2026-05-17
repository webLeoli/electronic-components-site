# EOL vs NRND vs Obsolete: A Procurement Guide to IC Lifecycle Status

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~8 minutes
> **Topics**: lifecycle status, EOL, NRND, obsolete, procurement
>
> **For DB import** — see metadata block at the very end of this file.

---

## Why IC lifecycle terminology matters

A purchasing manager opens an MRP alert: one of the ICs on a 12-year-old industrial controller is now marked **NRND**. Does that mean the part is gone tomorrow? Stockpile for ten years? Start a redesign?

The answer depends on which status the manufacturer assigned, what window they gave, and which inventory tier still holds the part. These five terms — **Active**, **NRND**, **Last-Time-Buy**, **EOL**, and **Obsolete** — are not interchangeable. Getting them wrong costs money in three predictable ways:

1. Acting too late on a Last-Time-Buy window forces emergency broker purchases at 3-10× the original unit price.
2. Reacting too aggressively to NRND triggers a redesign that wasn't needed for another five years.
3. Treating a single-status alert as the whole picture misses that the same part may still ship from authorized stock for years after the EOL flag.

This guide explains each lifecycle status precisely, where it comes from, what window it implies, and what procurement should actually do when it appears.

## The five lifecycle statuses, explained

Across the IC industry, lifecycle communication follows a loose convention — there is no single global standard, but JEDEC publication **JESD48-D** ("Product Discontinuance, Termination, and Major Changes") and the more general **IPC-1601** notification practice are the closest references most manufacturers align with. The five statuses below are how the major silicon vendors (Texas Instruments, Microchip, Renesas, NXP, ST, ADI, Infineon) describe their parts in datasheets, PCNs, and distributor feeds.

### 1. Active / In Production

**What it means**: The part is in current production. Wafer fab is running, packaging is current, and the manufacturer commits to ongoing supply.

**Typical signal**: No special flag on datasheet header. Distributor pages show stock from the manufacturer plus authorized distributors.

**Window**: Indefinite, but in practice most analog and discrete parts stay Active for 15-30 years and digital/MCU parts for 8-15 years.

**Procurement action**: Standard sourcing, normal lead times, normal forecasting.

### 2. NRND — Not Recommended for New Designs

**What it means**: The part is still being manufactured, but the vendor is signalling that new projects should pick a different part instead. The vendor has not committed to stopping production — they're discouraging long-term dependency.

**Typical signal**: Yellow or amber banner on the datasheet or product page. Phrases like *"Not Recommended for New Designs"* or *"Mature"* appear in the lifecycle status field.

**Window**: NRND can last anywhere from one to many years. Some parts stay NRND for a decade before being moved to EOL.

**Procurement action**:
- For existing designs: continue buying normally, but start tracking. Set a calendar reminder to check status every 6 months.
- For new designs: pick the vendor's recommended successor. The cost of designing in a fresh NRND part is rarely worth saving a few cents.

### 3. Last-Time-Buy (LTB)

**What it means**: The vendor has issued a formal Product Discontinuance Notice (PDN) with a specific date after which they will no longer accept orders. After the LTB deadline, the part is treated as End-of-Life.

**Typical signal**: A PDN issued under the JESD48 framework, usually 6-12 months ahead of the cutoff date. The notice specifies the LTB date, often the last ship date, and any minimum order requirements.

**Window**: The notice itself gives the window — typically 6-12 months between announcement and last-order date, plus a few months for last shipments.

**Procurement action**: This is the highest-leverage moment in the lifecycle.
- Calculate lifetime supply: remaining product lifetime × expected usage rate × safety factor.
- Buy through authorized channels before the deadline. Once past LTB, every replacement part comes from inventory holders charging a premium.
- Document the buy decision so finance and engineering understand the strategic stock.

### 4. End-of-Life (EOL)

**What it means**: The manufacturer has stopped producing the part. Whatever inventory remains at authorized distributors and franchise distributors is the last batch through normal channels.

**Typical signal**: Datasheet status changes to **End of Life** or **Discontinued**. The manufacturer's product page may stay live with a clear EOL marker for several years, then sometimes disappear entirely.

**Window**: Authorized distributor inventory typically depletes within 12-36 months after EOL. Specialty distributors and aftermarket sources can sometimes supply the part for 10-20+ years afterward, but supply becomes intermittent and price becomes volatile.

**Procurement action**:
- First check: authorized distributors (Mouser, Digi-Key, Arrow, Avnet, etc.).
- If no authorized stock: pivot to specialty distributors with verifiable quality systems.
- Verify each shipment is genuine — counterfeit risk climbs sharply after authorized stock dries up.

### 5. Obsolete

**What it means**: The part is no longer available through any authorized channel, and the manufacturer has typically removed it from active documentation. New-old-stock (NOS) inventory, aftermarket production, or careful sourcing through specialty distributors are the only paths.

**Typical signal**: Vendor product pages return 404 or redirect to a successor family. Datasheets are still findable through archive sites and IC databases.

**Window**: Permanent. The part will not return through the original vendor.

**Procurement action**:
- Source through specialty distributors who can provide traceability and inspection. Counterfeit risk is highest here.
- For mission-critical applications, consider parallel paths: source a small quantity to bridge while a redesign or pin-compatible replacement is evaluated.

### Quick-reference comparison

| Status | Production? | Typical signal | Window | Counterfeit risk |
|---|---|---|---|---|
| Active | Yes | No flag | Indefinite | Very low |
| NRND | Yes | Yellow banner / "not recommended" | Months to years | Low |
| Last-Time-Buy | Yes (deadline) | Formal PDN per JESD48 | 6-12 months typically | Low |
| End-of-Life | No | EOL marker on product page | 12-36 months authorized stock | Medium |
| Obsolete | No | Page removed / archived only | Permanent | High |

## How manufacturers communicate these statuses

Three main channels carry lifecycle information:

**Product Change Notices (PCNs) and Product Discontinuance Notices (PDNs)**. These are formal notifications, usually under the JESD48-D / IPC-1601 framework. They appear on the manufacturer's website and are pushed to authorized distributors. Major aggregators — SiliconExpert, Z2Data, IHS Markit (now Eaton TraceParts) — index them and flag affected designs.

**Datasheet headers**. Most major vendors update the lifecycle status banner on the datasheet itself. Microchip uses *Active / Mature / Last-Time-Buy / Obsolete*. Texas Instruments uses *Active / NRND / Last-Time-Buy / Obsolete*. ST uses *Active / NRND / EOL / Obsolete*. The exact words vary; the concepts overlap.

**Distributor product pages**. Mouser and Digi-Key surface manufacturer lifecycle data on each part page. The label is usually accurate but lags behind the manufacturer source by days to weeks.

**One real-world quirk**: a meaningful number of parts skip stages. A manufacturer may move a part from Active straight to EOL with no NRND warning, especially if a fab process is shutting down. This is one reason continuous BOM monitoring beats annual review.

## Decision tree: what to do when each status appears

Use this as a starting framework. Specifics depend on your industry, redesign budget, and how many parts in your BOM are exposed.

**You see NRND**
1. Is the part on a product expected to ship for more than 5 more years? → Identify the vendor's recommended successor and plan a future redesign.
2. Will the product reach end-of-life within 5 years? → Treat the part as Active and continue normal procurement.
3. Either way: subscribe to PCN feeds for that part.

**You see Last-Time-Buy**
1. Calculate lifetime requirement: years remaining × annual usage × buffer (10-30%).
2. Compare cost: LTB stockpile cost vs estimated redesign cost vs estimated future sourcing premium.
3. If stockpile wins, place the LTB order through your authorized distributor before the deadline.
4. Coordinate with engineering: any parameter drift from a redesign needs evaluation now, not later.

**You see End-of-Life**
1. Check authorized distributor stock first — often there's a year or more of supply available.
2. If authorized stock is thin: shortlist 2-3 specialty distributors with verifiable quality systems (ERAI membership, ISO 9001, IDEA-1010 inspection).
3. Lock in a verified-source contract with allocations rather than spot purchases.

**You see Obsolete**
1. Three paths:
   - **Specialty sourcing**: contact specialty distributors with new-old-stock or aftermarket inventory. Expect 2-10× original pricing.
   - **Pin-compatible replacement**: check whether the vendor or a third party makes a drop-in replacement. Test thoroughly.
   - **Redesign**: when neither sourcing nor replacement is viable, redesign the affected subassembly.
2. For any sourcing path, **require traceability documentation**: certificate of conformance, original date/lot codes, inspection reports.

## Common pitfalls procurement teams encounter

**Mistake #1: Misreading NRND as Obsolete.** Triggering a redesign on a part that still has 5+ years of production life burns engineering budget that wasn't needed.

**Mistake #2: Missing the LTB window.** A formal PDN typically gives 6-12 months notice. Teams without a PCN monitoring process discover the part is gone three months after the deadline — at that point, the only options are specialty distributors at premium pricing.

**Mistake #3: Trusting unverified "new old stock" claims.** Counterfeit and remarked components target high-value obsolete parts. Buying obsolete ICs from a generic broker without inspection invites field failures months or years later. (See our companion guide on [IDEA-STD-1010 counterfeit inspection](/blog/idea-std-1010-counterfeit-detection-guide).)

**Mistake #4: Assuming distributor flags are real-time.** Distributor lifecycle labels lag the manufacturer source. For high-risk parts, check the manufacturer's product page directly — it's the ground truth.

**Mistake #5: One-and-done BOM review.** Lifecycle status changes continuously. A part that was Active during last year's audit may be NRND today. Building a quarterly BOM review process catches drift before it becomes a crisis. (See [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).)

## How FPGACenter approaches obsolete sourcing

For parts that have left authorized distribution, our sourcing process is built around three principles:

**Verified channels first**. Every supplier in our network is qualified through documentation review, sample inspection history, and ongoing performance monitoring. We give preference to suppliers carrying franchise relationships and ISO-certified quality systems.

**Inspection before shipment**. Parts received from any non-authorized source are inspected against IDEA-STD-1010-B protocol — external visual examination, marking permanency testing, and where relevant, electrical sampling and X-ray analysis. (See [What is IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).)

**Full traceability documentation**. Each shipment carries a certificate of conformance with lot codes, date codes, supply chain provenance, and inspection results. This documentation lives in our records for the lifetime of the customer relationship.

This is not a guarantee against all risk — no specialty sourcing operation can promise that. But it puts inspection, documentation, and verifiable supplier qualification between every obsolete part and the customer's production line.

## FAQ

**How long do most ICs stay in production?**
Mainstream digital ICs and MCUs typically have 8-15 year production lifetimes. Analog parts, voltage regulators, and discretes often stay in production for 20-30+ years. Industry-specific parts (automotive, military) tend toward the longer end.

**Is buying obsolete ICs always risky?**
Risk is a function of source, not status. Obsolete parts sourced from a specialty distributor with full traceability, IDEA-1010-style inspection, and an ISO-certified quality system carry significantly less risk than parts bought from generic brokers without documentation.

**Can I still get authentic parts after EOL?**
Yes, for years afterward. Authorized distributors hold residual stock for 1-3 years post-EOL. Specialty distributors and aftermarket sources can supply many parts for 10-20 years afterward, though pricing rises and availability becomes intermittent.

**What's the practical difference between EOL and Obsolete?**
EOL means the manufacturer has stopped producing the part, but authorized distribution still holds stock. Obsolete means authorized channels are depleted and the part is now sourced through specialty distribution, aftermarket production, or new-old-stock inventory.

**Does NRND mean I should panic?**
No. NRND is a long-term signal, often years ahead of any actual production stop. The right response is to start tracking the part more closely and plan future projects around the vendor's recommended successor — not to redesign your current product line.

---

**Need help sourcing obsolete or NRND parts?**

FPGACenter specializes in obsolete IC, FPGA, and CPLD sourcing across 380+ manufacturers, with IDEA-1010-aligned inspection, full traceability documentation, and no minimum order quantity. We can support BOM lifecycle analysis to identify lifecycle risk in your bill of materials before it becomes a production issue.

[**Submit an RFQ**](/rfq) | [**Browse our catalog**](/category) | [**Contact our sourcing team**](/contact)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17

---

## DB import metadata

```yaml
title: "EOL vs NRND vs Obsolete: A Procurement Guide to IC Lifecycle Status"
slug: "eol-nrnd-obsolete-ic-lifecycle-explained"
status: "draft"  # change to "published" when ready
seoTitle: "EOL vs NRND vs Obsolete: IC Lifecycle Status Explained"
seoDesc: "Understand the difference between EOL, NRND, last-time-buy, and obsolete status in IC procurement. Decision framework and supplier red flags."
seoKeywords: "EOL NRND obsolete difference, IC lifecycle status, last-time-buy, end of life IC, JESD48, obsolete component procurement"
tags: "EOL, NRND, obsolete, IC lifecycle, procurement, supply chain, last-time-buy, JESD48"
author: "FPGACenter Sourcing Team"
readingTime: 8
category: "Procurement & Supply Chain"
relatedProducts: ""  # populate with notable obsolete part numbers if desired
```
