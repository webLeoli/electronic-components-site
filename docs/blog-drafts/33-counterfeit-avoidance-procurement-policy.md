---
title: "Writing a Counterfeit-Avoidance Procurement Policy That People Follow"
slug: "counterfeit-avoidance-procurement-policy"
status: "draft"
seoTitle: "Counterfeit Avoidance Procurement Policy: A Practical Guide"
seoDesc: "AS5553, AS6081, AS6496 and AS6171 explained and mapped to a workable policy: risk classes, approved sources, inspection tiers, escalation and what to do when you find one."
seoKeywords: "counterfeit avoidance policy, AS5553, AS6081, AS6496, AS6171, counterfeit electronic parts, approved supplier list, GIDEP reporting, procurement policy"
tags: "counterfeit avoidance, AS5553, AS6081, quality, procurement policy, compliance, risk management"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Quality & Compliance"
relatedProducts: "XC2VP30-5FF1152C, A3P250-2QNG132, EPM7128BTC144-10N"
---

# Writing a Counterfeit-Avoidance Procurement Policy That People Follow

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: counterfeit avoidance, AS5553, approved sources, inspection tiers, escalation

---

**Most counterfeit-avoidance policies fail in the same way: they are written for the easy case and abandoned in the hard one.** A policy that says "buy only from franchised distribution" is unimplementable the moment a part goes obsolete, so it gets bypassed — informally, under schedule pressure, by whoever is holding the shortage. A policy that works acknowledges from the outset that non-franchised purchasing will happen, defines the conditions under which it is acceptable, and makes the safe path the easy path. This guide maps the relevant standards onto a policy you can actually run.

## Key takeaways

- **A policy that forbids the necessary will be bypassed.** Define controlled non-franchised purchasing rather than pretending it will not happen.
- **AS5553 is the standard aimed at you**, the buying organisation. AS6081, AS6496 and AS6171 apply to distributors and test houses.
- **Risk-class the parts, not the suppliers.** Inspection effort should scale with what a failure costs, not with a flat rule.
- **The approval gate is the mechanism that actually works**: a named person signs off before a non-franchised purchase, not after.
- **Define what happens when you find one.** Quarantine, no return to the supplier, and reporting. A policy without this is incomplete.
- **Record the sourcing channel in the goods-received record.** Three years later it is the first useful fact in a failure investigation.

---

## The standards, and which one is yours

Four SAE standards cover this space and they are aimed at different parties. Knowing which is which stops you writing requirements you cannot impose.

| Standard | Who it is for | What it covers |
| --- | --- | --- |
| **AS5553** | **The buying organisation** — you | Counterfeit avoidance, detection, mitigation and disposition in your own purchasing |
| **AS6081** | Independent distributors | Their inspection, traceability and quality processes |
| **AS6496** | Franchised / authorised distributors | Counterfeit avoidance within authorised distribution |
| **AS6171** | Test laboratories | Test methods for suspect parts, with method-specific slash sheets |

AS5553 is the one to build your policy around. The others are what you require *of others*: an independent distributor claiming AS6081 certification is making a meaningful statement; one claiming AS5553 is describing their own purchasing, which is not what you are buying from them.

Alongside these, **IDEA-STD-1010** defines visual and mechanical inspection criteria: the practical detail of what an inspector looks at, covered in [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide).

## Why the strict policy fails

"Franchised sources only" is correct until a part goes end-of-life, and then it is an obstacle.

What happens next is predictable. A production line is down or a shipment is at risk. Someone finds stock at an independent distributor. The policy says no. The purchase happens anyway — as an exception nobody documented, an emergency approved verbally, or a part quietly bought on a company card.

The parts that most need control are precisely the parts the strict policy cannot cover. Obsolete, high-value, high-demand devices — the legacy FPGAs in [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing), the discontinued CPLDs in [MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths) — are exactly where counterfeits concentrate and exactly where franchised supply no longer exists.

A workable policy therefore starts from a different premise: **non-franchised purchasing is a legitimate, controlled activity with defined conditions.**

## Structure of a policy that works

Six sections. Keep it short enough that people read it.

### 1. Risk classification

Classify parts by what a failure costs, and let everything else follow from that.

| Class | Definition | Typical examples |
| --- | --- | --- |
| **A — Critical** | Failure causes safety, regulatory or mission consequence | Safety-relevant control, medical, avionics, rail |
| **B — Significant** | Failure causes field return, warranty exposure or line stoppage | Main processor, power path, high-value FPGA |
| **C — Standard** | Failure is inconvenient and cheap to remedy | Passives, jellybean logic, indicators |

Classification should be done **at the BOM level, once**, and reviewed when the design changes. Doing it per purchase is how it stops happening.

### 2. Approved source hierarchy, by class

| Class | Permitted sources, in order |
| --- | --- |
| **A** | Franchised → authorised aftermarket → **nothing else without documented approval and full test** |
| **B** | Franchised → authorised aftermarket → AS6081-certified independent with inspection |
| **C** | Franchised → authorised aftermarket → independent with basic inspection |

Two points that make this work in practice:

Authorised aftermarket sits second in every row. It is frequently overlooked. It is the channel that resolves most obsolete-part situations without any risk conversation at all — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

"Documented approval" must name a role. Not "management approval": a specific role who is reachable, understands the risk, and whose sign-off is recorded.

### 3. Supplier qualification

Independent suppliers used for Class A or B should be qualified before the emergency, not during it. A short questionnaire covering:

- Quality certifications held (AS6081, AS9120, ISO 9001) with certificate numbers and expiry.
- Inspection capability: in-house or subcontracted, to which standard, what equipment.
- Whether inspection reports are supplied **before** shipment.
- Traceability practice and what documentation accompanies a lot.
- Written policy on counterfeit findings, including whether suspect parts are returned or quarantined.
- Insurance and financial standing, for high-value purchases.

Maintain a short approved list. Qualifying two or three good independents in advance is what makes the controlled path fast enough to use under pressure.

### 4. Inspection tiers

Inspection effort should scale with risk class and lot value, not be a single rule.

| Tier | Applied to | Typical content |
| --- | --- | --- |
| **0** | Class C, franchised | Documentation check, quantity, packaging condition |
| **1** | Class C independent, Class B franchised | Visual inspection to IDEA-STD-1010, marking permanency, packaging and date-code consistency |
| **2** | Class B independent | Tier 1 + X-ray, dimensional check, **JTAG IDCODE or basic electrical verification** |
| **3** | Class A independent, high-value lots | Tier 2 + decapsulation sampling, full electrical test at temperature, XRF where finish matters |

The device-specific check is worth naming explicitly in the policy. For programmable logic and microcontrollers, **a JTAG IDCODE read takes minutes and directly detects density remarking**, the most lucrative counterfeit type. It should be mandatory on every non-franchised receipt of such parts.

Tier 3 methods map onto AS6171's slash sheets, which is the reference to cite when a customer asks what your test regime is based on.

### 5. The approval gate

This is the mechanism that makes the policy real.

A non-franchised purchase of a Class A or B part requires, before the order is placed:

1. A statement of why franchised and authorised aftermarket sources are unavailable.
2. The supplier's qualification status.
3. The inspection tier to be applied and who will perform it.
4. Named approver sign-off.

Keep it to one form and one signature. **A gate that takes a day will be bypassed in an emergency; a gate that takes twenty minutes will be used.** The point is not to slow the purchase; it is to ensure someone who understands the risk knows it is happening.

### 6. Disposition: what to do when you find one

A policy without this section is incomplete, and this is the section most often missing.

When a part is suspected counterfeit:

- **Quarantine immediately.** Physically segregate, mark, and record.
- **Do not return the parts to the supplier.** Returning suspect material puts it back into circulation, and most counterfeit-avoidance standards (and many customer contracts) prohibit it. Pursue a refund without return.
- **Notify the customer** if any affected material shipped, per your contractual obligations.
- **Investigate the lot**: what else came from that supplier, what else used that lot, has any of it shipped.
- **Report it.** In the US, GIDEP is the formal channel for government-related work; ERAI is the industry equivalent. Reporting is a contractual requirement in some sectors and is how the wider market learns.
- **Suspend the supplier** pending investigation, and record the outcome in the approved-source list.

The "do not return" rule surprises people and is worth stating explicitly in the policy, because the instinctive commercial response is to send them back.

## The record that matters later

Record the sourcing channel and lot traceability in the goods-received record.

Three years later, when a field failure pattern emerges, the first useful question is "where did these parts come from?" If the answer is recoverable in minutes, the investigation is bounded. If it is not, the investigation is a fishing expedition across every lot ever received.

Minimum fields: supplier, channel class (franchised / authorised aftermarket / independent / broker), manufacturer lot code, date code, inspection tier applied, inspection report reference. This connects to the traceability practices in [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Making the policy stick

Four things determine whether a policy is followed:

Pre-qualify suppliers before you need them. The single biggest cause of bypass is that the compliant path is slower than the non-compliant one at the moment of crisis.

Make the gate fast. One form, one approver, twenty minutes.

Give purchasing a decision tree, not a document. A one-page flow (what class is this part, what sources are permitted, what do I do next) gets used. A twelve-page policy gets filed.

Review exceptions quarterly. Every emergency exception is data about where the policy does not fit reality. If the same exception recurs, the policy is wrong, not the people.

## FAQ

### What is AS5553?

AS5553 is the SAE standard covering counterfeit electronic part avoidance, detection, mitigation and disposition for the organisation that buys parts. It is the standard your own procurement policy should be built around. It differs from AS6081, which applies to independent distributors, AS6496, which applies to franchised distributors, and AS6171, which defines test methods for laboratories examining suspect parts.

### What is the difference between AS5553 and AS6081?

AS5553 applies to the buying organisation and covers how you control your own purchasing, inspection and disposition. AS6081 applies to independent distributors and covers their inspection, traceability and quality processes. The distinction matters when evaluating suppliers: an independent distributor claiming AS6081 certification is making a relevant statement about how they handle parts, whereas one citing AS5553 is describing their own purchasing rather than what they are selling you.

### Should my policy ban buying from independent distributors?

No, because that ban will be broken. When a part is obsolete and no franchised or authorised aftermarket source exists, independent distribution is the only channel, and a policy that forbids it simply pushes the purchase outside the process — undocumented, uninspected and unapproved. A better approach defines non-franchised purchasing as a controlled activity with a risk classification, an approved supplier list, defined inspection tiers and a fast approval gate.

### How should inspection effort be decided?

Scale it to risk class and lot value rather than applying one rule. A documentation and packaging check suffices for low-risk parts from franchised sources. Visual inspection to IDEA-STD-1010 with marking-permanency testing suits moderate risk. Higher risk adds X-ray, dimensional checks and electrical verification, and the highest tier adds decapsulation sampling and full electrical testing at temperature. For programmable logic and microcontrollers, a JTAG IDCODE read should be mandatory on every non-franchised receipt because it detects density remarking in minutes.

### What should I do if I receive counterfeit parts?

Quarantine them immediately, segregated and marked. Do not return them to the supplier — returning suspect material puts it back into circulation, and most counterfeit-avoidance standards and many customer contracts prohibit it, so pursue a refund without return. Notify affected customers per your contractual obligations, investigate what else came from that supplier and where it went, report through GIDEP or ERAI as applicable, and suspend the supplier pending investigation.

### Why should I not return counterfeit parts to the supplier?

Because returned material re-enters the supply chain and will be sold to someone else. Counterfeit-avoidance standards and many customer contracts explicitly prohibit returning suspect parts for this reason. The correct disposition is quarantine followed by either controlled destruction or retention as evidence, while pursuing a commercial refund separately. This is counter-intuitive against normal returns practice, which is why it needs stating explicitly in the policy.

### What records should be kept for each receipt?

At minimum: supplier, the channel class (franchised, authorised aftermarket, independent or broker), manufacturer lot code, date code, the inspection tier applied and a reference to the inspection report. This matters years later — when a field failure pattern emerges, the first useful question is where those parts came from, and a record that answers it in minutes turns an open-ended investigation into a bounded one.

### How do I stop the policy being bypassed under schedule pressure?

Make the compliant path faster than the non-compliant one. Pre-qualify two or three independent suppliers before you need them, so the approved route is available in an emergency. Keep the approval gate to one form and one named approver, achievable in twenty minutes. Give purchasing a one-page decision tree rather than a long document. Then review exceptions quarterly: a recurring exception means the policy does not fit reality and should be changed.

## Related reading

For what an inspection actually examines, see [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide). For choosing the right channel in the first place, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor). For the record-keeping that supports all of this, [date codes and lot traceability](/blog/date-code-lot-traceability-explained). For where counterfeit risk concentrates, [legacy Virtex sourcing](/blog/xilinx-virtex-legacy-sourcing).

Our own process — supplier qualification, incoming inspection, risk-based authentication, electrical testing and documentation — is described under [quality](/quality). Send us a part number with your inspection requirements and we will tell you what documentation and test evidence comes with it.

[**Submit an RFQ**](/rfq) | [**Quality process**](/quality) | [**Upload a BOM**](/bom)
