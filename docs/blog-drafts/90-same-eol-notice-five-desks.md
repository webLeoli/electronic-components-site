---
title: "The Same EOL Notice From Five Desks: Why Your Colleagues Disagree, and Who Should Win"
slug: "same-eol-notice-five-desks"
status: "draft"
seoTitle: "One EOL Notice, Five Engineering Views — and How to Adjudicate Them"
seoDesc: "A serial flash goes last-time buy. Design, firmware, manufacturing, quality and field service each reach a different correct answer. Rank the conflict by irreversibility, not by seniority."
seoKeywords: "EOL notice response, obsolescence decision making, cross functional part substitution, last time buy decision, requalification cost, engineering change control, who decides substitution"
tags: "obsolescence, decision making, cross-functional, last-time buy, engineering change, perspective"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "W25Q64FVSSBQ, W25Q16JWZPIQ, IS25LP128-JKLE-TR, S25FL256LAGBHN033, N25Q128A23BSF40G, SST25VF020B-80-4I-SAE-TRI, M25P40-VMN6, MT25QL512ABB1EW9-0SIT TR"
---

# The Same EOL Notice From Five Desks: Why Your Colleagues Disagree, and Who Should Win

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: five legitimate answers to one notice, why they conflict, ranking by irreversibility, the handoffs that prevent the argument

---

**When five competent engineers read the same end-of-life notice and reach five different conclusions, none of them is wrong. They are optimising five different objectives, all of which the company actually holds.** The argument that follows is usually settled by whoever is most senior or most insistent, which is the one method guaranteed not to weigh the objectives against each other.

This article works one concrete notice through five desks, states what each desk correctly concludes, and then proposes an adjudication rule that does not depend on hierarchy: **rank the constraints by how hard they are to reverse.** A firmware change can be undone next month. A split field population cannot be undone at all.

The notice is real in kind. `W25Q64FVSSBQ` (a 64 Mbit serial NOR flash) is in a last-time-buy window in our catalogue as at 2026-08-11. It is one of **204 `W25Q` ordering codes** in that state, alongside 21 `S25FL` and 4 `SST25`. This is not a hypothetical.

## Key takeaways

- **Five desks, five correct answers, and they are mutually exclusive.** The disagreement is data about the decision, not noise to be suppressed.
- **Design sees a pin-compatible substitution.** It is right about the schematic and wrong about the cost.
- **Firmware sees a release.** Serial NOR devices differ at register level, so "pin-compatible" is a hardware statement with software consequences.
- **Manufacturing sees a programming step**, a fixture requalification, and protection-bit defaults that fail on the line rather than in the lab.
- **Quality sees traceability** and prefers buying the original through a channel that can evidence it.
- **Field service sees a permanently split population** and asks the question nobody else asks: which unit in the field has which part?
- **Adjudicate by irreversibility.** Certification and field-population effects outrank firmware and fixtures, because they cannot be undone.
- **Most of the argument is avoidable** by exchanging four artefacts up front — listed at the end.

---

## The notice

A serial NOR flash used as the configuration memory on a shipping product enters a last-time-buy window. The essentials, which everybody agrees on:

| Fact | Value |
| --- | --- |
| Part | 64 Mbit serial NOR, 8-SOIC, 3.3 V |
| Status | Last-time buy; final orders being accepted |
| Annual build | 4,000 units |
| Remaining production life | 6 years |
| Service obligation | 10 years after last shipment |
| Units already in the field | ~18,000 |
| Function | Holds the FPGA bitstream and a small configuration region |

Everything below follows from those seven rows. Nobody disputes them. The five desks still reach five different conclusions.

## Desk 1: The design engineer

Conclusion: substitute a pin-compatible device from an active family. This is a one-line BOM change.

The reasoning is sound. The package, pinout and basic command set are common across serial NOR vendors. An active alternative exists at the same density, voltage and package — `IS25LP128-JKLE-TR` measures 7% inactive as a family against the outgoing part's 54%, so the substitution improves the design's lifecycle position rather than merely preserving it.

What this desk is right about: the schematic does not change, the layout does not change, and the replacement is better positioned for the product's remaining life than the original. Refusing the substitution to preserve a part that is leaving the market is not conservatism, it is deferral.

What this desk systematically underweights: everything downstream of the schematic. "Pin-compatible" is a statement about a footprint. It is not a statement about behaviour, and this device class is the textbook case — as the [configuration flash design article](/blog/fpga-boot-flash-design-longevity) sets out at register level.

## Desk 2: The firmware engineer

Conclusion: that substitution is a firmware release with a six-week test cycle, not a BOM change.

The reasoning is also sound, and more specific. Serial NOR devices that share a pinout differ in ways that firmware sees:

| Difference | Consequence |
| --- | --- |
| Quad-enable bit lives in a different register at a different offset | The enable sequence must change, or the part boots four times slower |
| Dummy-cycle counts differ per read opcode | A hard-coded read sequence returns misaligned data |
| Power-up address mode may differ above 128 Mbit | A 3-byte read lands at the wrong offset |
| Erase granularity may differ | A configuration region that assumes 4 KB sectors may not have them |
| Pin 7 defaults to `HOLD#` or `RESET#` depending on a register | A board that ties pin 7 low may hold the new device in permanent reset |
| Protection-bit defaults differ | Programming fails, or the region is unexpectedly writable |

What this desk is right about: each of these is a real behavioural difference, and at least three of them can prevent the board from booting at all. The production programming file is device-specific once protection bits and configuration registers are involved. A release and a regression cycle are the honest cost.

What this desk systematically underweights: that its own cost is the most reversible on the table. A firmware release is expensive in weeks and cheap in permanence — if it is wrong, it is fixed in the next release. That distinction matters when the desks are ranked.

The structural fix this desk should be arguing for, rather than against the substitution: make the loader read SFDP and adapt, so the *next* notice, and there will be one, since 276 serial NOR ordering codes are in a last-time-buy window right now — costs nothing.

## Desk 3: The manufacturing and test engineer

Conclusion: this is a production-line change with a fixture requalification, and it will fail on the line before it fails in the lab.

The reasoning is specific to the factory and invisible from an engineering desk:

- **The programming algorithm changes.** In-system or off-line programming carries device-specific algorithms and timings; a new device means a new recipe, requalified.
- **Protection-bit defaults are a line failure, not a design failure.** A device that arrives with block protection asserted reads correctly and refuses to program. It presents as a yield problem at one station.
- **Programming time changes cycle time.** A different erase granularity or page size changes throughput, which changes takt on a line balanced around the old number.
- **Two part numbers coexist during transition**, which means two reels, two programming recipes, two labels and an opportunity to fit the wrong one.
- **Moisture sensitivity and reflow profile may differ** between vendors in the same package.

What this desk is right about: the failure modes it names appear at volume and not in a five-unit engineering build. Its requalification is not bureaucracy; it is the only stage that tests the change under the conditions that will actually apply.

What this desk systematically underweights: it prices the transition and not the alternative. Doing nothing has a cost too, and it lands on this desk eventually — as a line stop when the last reel runs out.

## Desk 4: The quality engineer

Conclusion: buy the original part through a channel that can evidence what it supplied, and avoid the substitution entirely.

The reasoning is about assurance rather than function:

- **A last-time buy from an authorised channel is fully traceable.** Date codes, lot codes and a documented chain, which is what the [date code and lot traceability](/blog/date-code-lot-traceability-explained) discipline exists to preserve.
- **A substitution introduces a new qualification**, and the evidence file that supports the product's current claims does not cover the new part.
- **Scarcity raises counterfeit exposure.** Once a part is obsolete rather than in last-time buy, the market that serves it is harder to police: the reason for the [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy) and the inspection regime on our [quality page](/quality).
- **Buying now, from the manufacturer, is the cheapest assurance available** and the window for it is closing.

What this desk is right about: the window is genuinely closing, traceability is genuinely cheapest inside it, and a substitution genuinely creates qualification work. If the product carries a safety or regulatory claim, this desk's constraint may be the binding one.

What this desk systematically underweights: storage. A last-time buy has to survive on a shelf. Moisture-sensitive devices need controlled storage and re-baking, and the [last-time-buy quantity and storage](/blog/last-time-buy-quantity-and-storage) arithmetic (build plus service plus yield loss over sixteen years) usually produces a quantity larger than anybody expected, held at a cost nobody budgeted.

## Desk 5: The field service engineer

Conclusion: whatever you decide, the real cost is that the field population splits, and nobody has told me how to tell the two apart.

This desk asks the question the other four do not:

- **18,000 units already exist with the original part.** A substitution means two hardware variants in service for the next sixteen years.
- **A repair needs the right variant.** If a replacement board or a firmware update is variant-specific, the service process needs to determine which variant a unit is — from a serial number, a label, or a readable device ID.
- **Firmware distribution becomes conditional.** A single image that supports both devices is far cheaper than two images and a matching rule, and that is a design decision made now, not later.
- **Spares must be held for both**, or the older variant must be upgradable.

What this desk is right about. It is the most important point in this article: a split field population is the one consequence here that **cannot be reversed**. Firmware can be re-released. A fixture can be requalified. Stock can be sold. A population of 18,000 units in service with a different part is a permanent property of the product, and it accrues cost for sixteen years.

What this desk systematically underweights: nothing much, in this case, which is precisely why it is usually not in the room.

## They cannot all win

| Desk | Wants | Direct conflict with |
| --- | --- | --- |
| Design | Substitute now, improve lifecycle position | Quality (new qualification), Firmware (release) |
| Firmware | Delay until a release cycle allows | Quality (window closes), Manufacturing (line continuity) |
| Manufacturing | One change, fully requalified, not two | Design (wants it now), Field service (wants dual support) |
| Quality | Buy the original, keep the evidence file intact | Design (defers the real problem), Programme (ties up cash) |
| Field service | Avoid a split population, or make it manageable | Everyone, since any change splits it |

The usual resolution (the loudest or most senior desk wins) optimises nothing. What is needed is a rule that ranks the constraints on a property other than who holds them.

## The adjudication rule: rank by irreversibility

Weigh each desk's constraint by how expensive it is to undo, not by how expensive it is to satisfy.

| Constraint | Reversible? | Cost to undo | Rank |
| --- | --- | --- | --- |
| A split field population | **No** | Permanent, accrues for the service life | **1** |
| An invalidated certification | Barely | A full recertification cycle | **2** |
| A last-time-buy purchase | Partly | Cash tied up; storage; possible write-off | 3 |
| A production fixture requalification | Yes | Repeat the qualification | 4 |
| A firmware release | Yes | Next release | 5 |

Applying it to this notice:

1. **Field service's constraint ranks first**, so the decision must include a mechanism for the split: a single firmware image that supports both devices, and a readable device ID that identifies which is fitted. Both are cheap now and impossible retrospectively.
2. **Quality's constraint ranks second if a certification is genuinely at risk**, and third if it is not. This must be answered factually rather than assumed, because it moves the whole decision.
3. **The last-time buy is then sized to bridge**, not to cover the whole life — enough material to reach the release that supports both devices, plus service margin. This is the step that most often goes wrong in both directions: buying sixteen years of a part you will stop using in one, or buying nothing and stopping the line.
4. **Manufacturing requalifies once**, for the dual-source recipe, rather than twice.
5. **Firmware delivers the SFDP-adaptive loader**, which is the change that makes the *next* notice free. Given 276 serial NOR codes currently in last-time-buy windows, treating this as a one-off is the expensive reading.

The outcome is not any single desk's answer. It is a bridging buy, a dual-capable firmware image, one requalification and a variant-identification mechanism, and every desk gets the part of its constraint that could not have been recovered later.

## The four artefacts that prevent the argument

Most of this conflict comes from each desk holding information the others need and not knowing it is needed. Exchange these four when a notice arrives, before anybody proposes an answer:

1. **From procurement: the actual last-order date and the quantity available.** Not "it's going EOL", the date. Every desk's answer changes depending on whether there are three weeks or nine months.
2. **From firmware: the list of register-level differences between candidate devices**, and whether a single image can support both. This converts Design's "pin-compatible" into a real cost or a real non-cost.
3. **From quality: a factual statement of whether a substitution touches a certification or a documented qualification.** Assumed answers here distort everything downstream.
4. **From field service: the installed-base count, the service obligation, and how a variant would be identified.** Almost never volunteered. It is the constraint that ranks first.

A [BOM scrub](/bom) supplies the first artefact across every line at once, which is more useful than handling notices individually, and per the [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08), scrubbing by vendor lineage finds more risk per hour than working down the BOM in order. For a specific ordering code, an [RFQ](/rfq) returns current availability including aftermarket sources.

## Frequently asked questions

### Who should own the decision when an EOL notice arrives?

Someone who holds none of the five constraints, using a documented rule. If the decision sits with any one desk it will reflect that desk's objective, all five of which are legitimate and none of which is the company's whole objective. The rule proposed here (rank constraints by how hard they are to reverse) is deliberately independent of hierarchy, so the outcome does not depend on who attends the meeting.

### Is "pin-compatible" ever a sufficient basis for a substitution?

Only for passive or single-function parts with no configuration state. For anything with registers, ordering-code options or a power-up state, pin compatibility describes the footprint and nothing else. Serial NOR flash is the clearest example: identical pinouts, and the quad-enable bit, dummy cycles, address mode, erase granularity and pin 7 default all differ by vendor.

### How large should a last-time buy be?

Large enough to bridge to the solution, not to cover the whole product life — unless there is no solution. If a dual-capable firmware image is coming in two releases, buy to that plus service margin. Buying sixteen years of a part you will stop fitting in one ties up cash and creates a storage liability; the full arithmetic, including moisture sensitivity and shelf life, is in [last-time-buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

### Why does field service rank above firmware?

Because a split field population cannot be undone and a firmware release can. Once 18,000 units are in service with one part and new units ship with another, that division is a permanent property of the product for its entire service life. A firmware decision made wrongly is corrected in the next release. Ranking by irreversibility puts the permanent consequence first, which is usually the opposite of how loudly each desk argues.

### What if the substitution genuinely invalidates a certification?

Then quality's constraint becomes binding and the decision changes shape: buy the original to cover the certified life, and schedule the substitution for a planned design refresh that carries its own recertification. The mistake to avoid is *assuming* the certification is affected. That question has a factual answer and it moves the entire decision, so answer it first.

### How do we stop this recurring for every notice?

Design for substitutability once, rather than negotiating each notice. For serial flash that means a loader that reads SFDP and adapts, so any compliant device works; more generally it means discovering device parameters at run time instead of hard-coding them, and specifying that capability when the part is chosen. Given that 5,178 part numbers across our catalogue are in an active last-time-buy window, the recurrence is certain.

### Our field service team is not consulted on part changes. Is that unusual?

It is common. That is why the most irreversible constraint is the one most often discovered late. The installed-base count, the service obligation and the variant-identification mechanism are cheap to state at the start and impossible to retrofit once units have shipped. Adding one line to the change process ("how will a service engineer tell which variant this unit has?") catches most of it.
