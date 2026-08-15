---
title: "Reading a PCN or PDN: What a Discontinuation Notice Actually Commits To"
slug: "pcn-pdn-discontinuation-notice-guide"
status: "draft"
seoTitle: "PCN and PDN Notices Explained: How to Read a Change Notice"
seoDesc: "PCN, PDN and EOL notices carry hard dates and hidden obligations. What each field means, which changes need requalification, the 30/60/90-day response clock, and how to build a notice workflow."
seoKeywords: "PCN notice, PDN product discontinuation notice, EOL notice, product change notification, JESD46, last time buy date, die shrink notification, fab transfer PCN"
tags: "PCN, PDN, EOL notice, change management, JESD46, obsolescence, procurement, requalification"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "XC6SLX9-2CPG196I, EP4CE6E22C8N, NCP1117DT33RKG"
---

# Reading a PCN or PDN: What a Discontinuation Notice Actually Commits To

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: PCN, PDN, EOL notices, JESD46, change management, requalification

---

**A product change notification is a legal clock starting, and most of them are read too late by someone who is not authorised to act on them.** Manufacturers issue PCNs and PDNs to a distribution list, distributors forward them in bulk, and they arrive in an inbox that nobody owns. By the time a design engineer sees one, the last-time-buy date may be weeks away. This guide covers what each notice type commits the manufacturer to, which fields carry hard deadlines, which changes require requalification even when nothing is being discontinued, and how to build a workflow that catches them.

## Key takeaways

- **PCN and PDN are different.** A PCN changes something about a part that continues; a PDN ends it. Both can hurt you, and the PCN is the one people ignore.
- **The last-time-buy date is a hard deadline**, typically 6-12 months from notice, and the last-ship date is usually 6-12 months after that.
- **A "minor" PCN can invalidate a qualification.** A fab transfer or die shrink changes the device even when the datasheet does not change.
- **JESD46 is the industry standard** governing notification content and timing, and it defines a customer response window.
- **Silence is consent.** Most notices treat no response within the stated window as acceptance of the change.
- The notice **arrives at whoever is on the distribution list**, which is often a purchasing mailbox, not the person who can assess the technical impact.

---

## The notice types

Terminology varies by manufacturer, but the categories are consistent.

| Notice | Full name | What it means | Typical urgency |
| --- | --- | --- | --- |
| **PCN** | Product Change Notification | Something about the part is changing; the part continues | Medium — but can require requalification |
| **PDN** | Product Discontinuation Notice | The part is being discontinued | High — clock is running |
| **EOL notice** | End of Life | Same as PDN in most usage | High |
| **PTN** | Product Termination Notice | Same as PDN, some manufacturers' terminology | High |
| **PCN (label/packaging)** | — | Marking, packing or documentation change only | Low, but check |

The standard governing all of this is **JESD46**, published by JEDEC, which defines what a notification must contain, how much warning must be given, and how customers respond. Manufacturers who follow it produce notices with predictable fields; some do not follow it closely, which is its own signal.

## Reading a PDN: the fields that matter

Four dates and one part list determine everything you need to do.

| Field | What it means | What to do with it |
| --- | --- | --- |
| **Notification date** | When the clock started | Check against today — how much has already elapsed? |
| **Last-time-buy (LTB) date** | Final date orders will be accepted | **Hard deadline.** Work backwards from here |
| **Last-ship date** | Final date product will be delivered | Affects cash flow and storage timing |
| **Affected part numbers** | The specific orderable parts | Check every suffix — partial family discontinuations are common |
| **Recommended replacement** | The manufacturer's suggestion | Treat as a starting point, not an answer |

Typical intervals are **6-12 months from notice to last-time buy**, and a further **6-12 months to last ship**. That sounds generous. In practice a notice issued in month zero may not reach the person who can act until month four, leaving a fraction of the nominal window.

Two traps in the part list:

Partial family discontinuation. A PDN frequently covers specific package, speed or temperature variants while the family continues. Scanning for the base device and concluding "not us" misses this. Match on the **full orderable part number**.

The recommended replacement is a marketing suggestion. It is chosen for functional similarity, not for compatibility with your circuit. Everything in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide) and [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide) applies to it. Sometimes it is genuinely a drop-in; frequently it is not.

## Reading a PCN: the one people ignore

A PCN says the part continues, which reads as "no action required". That is often wrong.

Change classes, roughly in order of how much trouble they cause:

| Change type | Requalification risk | Why |
| --- | --- | --- |
| **Fab transfer** | **High** | Different process line; parametric distributions shift |
| **Die shrink / die revision** | **High** | Different silicon; timing, power and errata change |
| **Assembly site transfer** | Medium-high | Different bond wires, mould compound, process |
| **Package material change** | Medium | Thermal and moisture behaviour differ |
| **Lead finish change** | Medium | Solderability, whisker risk, profile compatibility |
| **Test program change** | Medium | Distribution of shipped parts can shift within spec |
| **Datasheet clarification** | Low | But read it — sometimes a spec is being *narrowed* |
| **Marking / packaging** | Low | Check automated optical inspection and traceability |

Fab transfer and die shrink are the ones to watch. The part number does not change, the datasheet may not change, and the device is genuinely different. Parameters that were comfortably inside spec on the old line can sit near a limit on the new one, and your design may have been relying on typical behaviour rather than the guaranteed limit.

This is a specific and under-appreciated risk: **a design can be qualified against typical performance and fail against worst-case performance that was always permitted.** A PCN that shifts the distribution exposes it.

For a certified product, a fab transfer or die revision may require requalification regardless of measured performance, because the approval was granted against a specific manufacturing configuration.

### The lead-finish PCN

Worth calling out separately because it catches legacy programmes. A change from tin-lead to pure tin, or between lead-free alloys, affects:

- **Reflow profile compatibility** — different melting point.
- **Tin-whisker risk**, which some high-reliability and defence programmes explicitly exclude. This is the same issue described in [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing) around `FF` versus `FFG` package codes.
- **Existing qualification**, which may have been performed on the old finish.

## The response clock

JESD46 defines a customer response window, and silence is acceptance.

Typical structure:

- **Notice issued.**
- **Response window**, commonly 30-90 days, during which a customer may object, request samples, or request extended last-time-buy terms.
- **After the window closes**, the change is deemed accepted.

What you can actually ask for during the window, and often get:

- **Samples of the changed material** for qualification.
- **Extended last-time-buy dates**, particularly with volume commitment.
- **A larger last-time-buy quantity** than initially offered.
- **Qualification data** for the new configuration.
- **Continued supply of the old configuration** for a defined period, sometimes at a premium.

None of these is available after the window closes. **The response window is the leverage**, and it expires quietly.

## Why notices get missed

The structural problem is that the notice arrives at the wrong person.

The distribution path is usually: manufacturer → franchised distributor → the email address on the account, which is typically purchasing. Purchasing cannot assess whether a die shrink affects a timing margin, and engineering is not on the list.

Common failure modes:

- Notices arrive in a shared mailbox nobody owns.
- Distributors forward them in weekly digests of dozens of notices.
- The affected part is identified by a full orderable part number that does not textually match how it appears in your BOM.
- The person who received it left the company and the subscription went with them.
- Contract manufacturers receive notices for parts they buy on your behalf and do not forward them.

That last one is worth checking explicitly: **if your CM does the purchasing, they get the notices.** Whether they forward them is a contractual question, and frequently the contract is silent.

## Building a workflow that catches them

A workable process has five parts.

1. Own the inbox. A named role, not a shared mailbox. Notices arrive weekly and need triage, not archival.

2. Match against the BOM automatically. Extract affected part numbers from the notice and match against your active BOMs. Matching must be on full orderable part numbers and tolerant of formatting differences — spaces, hyphens and packaging suffixes vary between systems.

3. Triage by class within days, not weeks.

| Class | Action | Owner |
| --- | --- | --- |
| PDN on an active part | Start LTB calculation immediately | Procurement + engineering |
| PCN, fab transfer or die revision | Engineering assessment required | Engineering |
| PCN, assembly or material change | Engineering review, likely low impact | Engineering |
| PCN, marking or packaging | Check AOI and traceability impact | Manufacturing |
| Not in any BOM | Log and close | Automated |

4. Respond inside the window. Even a holding response requesting samples and qualification data preserves options. This is the step that is most often skipped and most often regretted.

5. Feed it back into lifecycle monitoring. A notice is a data point about a supplier and a product line, not just an event. Repeated PCNs on one line often precede a PDN. This is the same monitoring discipline described in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

## Getting on the distribution list in the first place

Many organisations never receive notices because nobody subscribed.

- **Register with each franchised distributor** for PCN/PDN notifications against your account, and check that the address is a role, not an individual.
- **Register directly with major manufacturers** where they offer it — this bypasses the distributor forwarding delay.
- **Require notice forwarding in your CM contract**, with a defined timeframe.
- **Use a commercial lifecycle data service** if the BOM is large. They aggregate notices across manufacturers and match them against a supplied BOM, which solves the matching problem in step 2.
- **Ask your independent and specialty suppliers too.** They see discontinuations early because they watch the market for a living.

## What to do in the first week after a PDN

| Day | Action |
| --- | --- |
| 1 | Confirm the exact affected part numbers against your BOMs |
| 1 | Note the LTB and last-ship dates; calculate remaining time |
| 2-3 | Check whether an [authorised aftermarket source](/blog/authorized-aftermarket-vs-independent-distributor) will continue the line — this can end the exercise |
| 2-3 | Get remaining franchised stock quoted and, if needed, put a hold on it |
| 3-5 | Start the [last-time-buy quantity calculation](/blog/last-time-buy-quantity-and-storage), including spares |
| 3-5 | Begin evaluating the recommended replacement, if a substitution route is plausible |
| 5-7 | Respond to the notice within the window: request samples, extended dates, qualification data |

Step two is the one that most often saves the whole exercise. A line continued in authorised production requires no last-time buy and no qualification.

## FAQ

### What is the difference between a PCN and a PDN?

A PCN, or product change notification, informs customers that something about a part is changing while the part remains available: a fab transfer, die revision, assembly site move, material change, lead finish change or documentation update. A PDN, or product discontinuation notice, informs customers the part is being ended and states the last-time-buy and last-ship dates. PDNs get attention because the clock is obvious; PCNs are more often ignored, even though a fab transfer or die shrink can invalidate a qualification.

### How much notice does a manufacturer have to give before discontinuing a part?

Under JESD46, the JEDEC standard governing these notifications, manufacturers following the standard typically give six to twelve months from notice to the last-time-buy date, and a further six to twelve months to the last-ship date. There is also a customer response window, commonly thirty to ninety days, during which objections and requests can be raised. Not all manufacturers follow the standard closely, and the practical window is shorter than the nominal one because notices take time to reach the person who can act.

### Do I need to requalify after a PCN?

It depends on the change class. Fab transfers and die revisions carry high requalification risk because the silicon or process is genuinely different — parametric distributions shift even when the datasheet does not change. Assembly site transfers, package material changes and lead finish changes carry moderate risk. Marking and packaging changes rarely require electrical requalification but may affect automated optical inspection and traceability. For certified products, a fab transfer or die revision may require requalification regardless of measured performance, because the approval was granted against a specific manufacturing configuration.

### What happens if I do not respond to a PCN?

The change is deemed accepted. Most notifications state that no response within the specified window constitutes acceptance, so the response window is also the only period in which you have leverage. During it you can request samples of the changed material, qualification data for the new configuration, extended last-time-buy dates, a larger last-time-buy quantity, or continued supply of the old configuration for a defined period. None of these is available once the window closes.

### Why do PCN and PDN notices get missed?

Because they arrive at purchasing rather than engineering. The usual path is manufacturer to franchised distributor to the email address on the account, which is typically a purchasing mailbox that nobody owns individually. Notices then arrive in bulk digests, affected parts are identified by full orderable part numbers that may not textually match how they appear in a BOM, and subscriptions are often tied to individuals who have left. If a contract manufacturer does the purchasing, the notices go to them, and forwarding is frequently not covered in the contract.

### Should I use the manufacturer's recommended replacement?

Treat it as a starting point. The recommended replacement is selected for broad functional similarity, not for compatibility with your specific circuit, board or firmware. For analog parts, loop stability, quiescent current and thermal behaviour still need checking; for microcontrollers, peripheral corner cases, instruction timing and errata still differ. Sometimes it genuinely is a drop-in, but that has to be established rather than assumed.

### What should I do in the first week after receiving a PDN?

Confirm the exact affected part numbers against your bills of material and note the last-time-buy and last-ship dates. Then check whether an authorised aftermarket manufacturer will continue the line, since that can end the exercise entirely. In parallel, get remaining franchised stock quoted and consider placing a hold, start the last-time-buy quantity calculation including spares and repair demand, and begin evaluating the recommended replacement if substitution is plausible. Respond within the notice window to preserve your options.

### How do I make sure I receive discontinuation notices?

Register for PCN and PDN notifications with each franchised distributor against your account, using a role-based address rather than an individual's. Register directly with major manufacturers where they offer it, which avoids distributor forwarding delay. Require notice forwarding in your contract manufacturer agreement with a defined timeframe. For large bills of material, a commercial lifecycle data service will aggregate notices across manufacturers and match them against your BOM automatically, which solves the part-number matching problem.

## Related reading

Once a notice arrives, the two paths are inventory or substitution: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) covers the first, and [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide) plus [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide) cover the second. Before either, check [authorised aftermarket versus independent distribution](/blog/authorized-aftermarket-vs-independent-distributor). For the lifecycle vocabulary these notices use, see [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained), and for the monitoring process that should be receiving them, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us a notice you have received along with the affected part numbers and we will tell you what is still available (franchised stock, authorised aftermarket continuation, or specialty channels) and what a realistic last-time-buy quantity looks like.

[**Submit an RFQ**](/rfq) | [**Upload a BOM for lifecycle review**](/bom) | [**Browse the catalogue**](/category)
