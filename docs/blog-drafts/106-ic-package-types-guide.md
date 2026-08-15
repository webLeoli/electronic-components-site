---
title: "IC Package Types Explained: BGA, QFP, QFN, SOIC and When Each Is the Right Buy"
slug: "ic-package-types-explained"
status: "draft"
seoTitle: "IC Package Types: BGA, QFP, QFN, SOIC Buyer's Guide"
seoDesc: "BGA, QFP, QFN, SOIC and more: what each package family does well, how the package drives availability, MSL and MOQ, and package-level counterfeit checks."
seoKeywords: "ic package types, bga vs qfp, qfn vs qfp, soic vs tssop, ic package identification, ic package guide, bga csp wlcsp, msl moisture sensitivity"
tags: "IC packages, BGA, QFP, QFN, SOIC, TSSOP, sourcing, obsolescence, MSL, counterfeit detection"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 14
category: "Obsolescence & Lifecycle Sourcing"
relatedProducts: "XC7A35T-1CPG236C, XC6SLX9-2TQG144C, STM32F103C8T6, EPM240T100C5N, ATMEGA328P-PU, SN74LVC245APWR"
---

# IC Package Types Explained: BGA, QFP, QFN, SOIC and When Each Is the Right Buy

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~14 minutes
> **Topics**: IC packages, BGA, QFP, QFN, SOIC, MSL, packaging media, sourcing

---

**The package is half the part number, and it is frequently the half that decides whether you can buy the part at all.** The same die routinely ships in three or four packages with different suffixes, different stock levels, different prices and different lifecycle status. Engineers tend to treat the package as a mechanical afterthought; buyers who treat it the same way miss the single most useful degree of freedom in a difficult sourcing situation. This guide covers the main package families, what actually drives the choice between them, and the procurement moves — sibling packages, package migration, MSL handling, packaging media — that follow from understanding them.

## Key takeaways

- **The same die in a different package is a different orderable part** with independent stock, price and lifecycle. Checking sibling packages is a legitimate sourcing move, not a compromise.
- **Pin count ceilings sort the families.** Leaded packages top out around 200–240 pins at practical pitches; beyond that you are in BGA territory whether you like it or not.
- **Rework and inspection capability should influence the buy.** BGA requires X-ray to verify assembly; QFN requires a thermal-pad process; SOIC can be repaired with a soldering iron.
- **MSL is a purchasing parameter.** A part at MSL 3 or above has a limited floor life once the bag is opened, and how a lot was stored is a fair question to ask any supplier.
- **Packaging media set the MOQ.** Tape-and-reel, tray and tube carry different minimums and different handling risks, and cut tape from an unknown reel is a traceability question in itself.
- **Package condition is a counterfeit signal.** Reballed BGAs and sanded-and-remarked QFPs are the two most common package-level red flags in the independent channel.

---

## The families, organized by how they mount

Every IC package answers the same three questions: how does it attach to the board, how does heat get out, and how many connections fit around or under the die. Sorting by mounting method keeps the zoo manageable.

| Family | Examples | Mounting | Typical pitch | Practical pin range |
| --- | --- | --- | --- | --- |
| Through-hole | DIP, PDIP | Leads through drilled holes | 2.54 mm | 4–64 |
| Socketable | PLCC | J-leads, usually in a socket | 1.27 mm | 20–84 |
| SMT, gull-wing leads | SOIC, TSSOP, SSOP | Leads soldered to surface pads | 1.27 / 0.65 / 0.5 mm | 8–56 |
| SMT, quad leaded | QFP (TQFP, LQFP, PQFP) | Gull-wing leads on four sides | 0.8 / 0.65 / 0.5 / 0.4 mm | 32–240 |
| SMT, leadless | QFN, DFN, LGA | Pads under the package edge or bottom | 0.4–0.65 mm | 6–100+ |
| Area array | BGA, FBGA, PBGA, CSP, WLCSP | Solder balls across the underside | 0.35–1.27 mm | 40–2,000+ |

### Through-hole: DIP and the socket case

The dual in-line package is the oldest family still in volume production, and it survives for two reasons: it can be socketed, and it can be hand-assembled by anyone. Legacy industrial equipment, education and prototyping keep parts like the ATMEGA328P-PU (the DIP-28 variant of a very common microcontroller) in continuous demand. When a design uses a socket, the package is also a field-service strategy — a failed part can be swapped without a soldering iron.

PLCC sits between eras: a surface-mount body with J-leads that is most often used in a through-hole socket. It shows up constantly in legacy telecom and industrial boards, typically holding configuration memory or a CPLD, and it shares the DIP's field-replaceable virtue.

### Surface-mount leaded: SOIC, TSSOP, SSOP and the QFP variants

The small-outline family is the workhorse of glue logic, analog and small memory. SOIC at 1.27 mm pitch is the most forgiving surface-mount package there is: easy to inspect visually, easy to rework with basic tools, and tolerant of less-than-perfect paste printing. TSSOP shrinks the same idea to 0.65 mm pitch and a much thinner body — the SN74LVC245APWR is a typical example, a bus transceiver in TSSOP-20 that would be roughly twice the footprint in SOIC. SSOP sits between them in width. The trade is simple: TSSOP and SSOP save board area and cost more to rework and inspect, though both remain within hand-solder range for a skilled technician.

The quad flat pack extends leads to all four sides and is the leaded family's answer to higher pin counts. TQFP and LQFP (thin and low-profile variants — the distinction is body thickness) at 0.5 mm pitch carry 32 to 176 pins routinely, and up to around 240 at the practical limit. The XC6SLX9-2TQG144C — a Spartan-6 FPGA in TQFP-144 — exists precisely because plenty of industrial designs want an FPGA they can inspect optically and rework without a BGA station. QFP leads are fragile in handling, which matters for how the parts are packed and shipped; bent leads on trayed QFPs are the most common incoming inspection finding that is *not* a counterfeit issue.

### Leadless: QFN, DFN, LGA

QFN removes the gull-wing leads and terminates the package in plated pads on the underside edge, usually with a large exposed thermal pad in the center. The result is a smaller footprint, better thermal performance and better high-frequency behavior than a QFP of the same pin count — and a package that cannot be fully inspected optically, because the solder joints are underneath. The center thermal pad must be soldered to the board with controlled voiding for the thermal rating to mean anything, which makes QFN assembly a process question, not just a footprint question. DFN is the two-sided version for small pin counts; LGA replaces balls with flat lands and appears mostly in modules and sensors.

For rework, QFN sits in an awkward middle: hot-air rework is feasible with practice, but repairing a single joint the way you would on a SOIC is not.

### Area array: BGA and its sub-families

Once a design needs more connections than a package perimeter can hold, the underside is the only place left. BGA puts a grid of solder balls across the bottom of the package, which is how a part like the XC7A35T-1CPG236C gets 236 connections into a 10 mm body. Within the BGA world the sub-families matter mostly for pitch and construction:

- **PBGA / FBGA** — plastic-bodied BGAs at 0.8 to 1.27 mm pitch, the mainstream for FPGAs, processors and memory.
- **CSP (chip-scale package)** — defined as a package no larger than about 1.2 times the die; typically 0.4–0.5 mm pitch.
- **WLCSP (wafer-level CSP)** — the die itself, bumped and singulated, with no package body at all. Pitches down to 0.35 mm. Common in high-volume consumer parts and increasingly the *only* package for some new devices, which is a genuine problem for industrial designs that need to rework or probe.

BGA assembly cannot be verified visually. X-ray inspection is the standard for confirming ball collapse, bridging and voiding, and any assembly house running BGAs without X-ray access is guessing. This has a direct sourcing corollary covered below: the ball condition of a BGA is also where counterfeit evidence concentrates.

## What actually drives the choice

Four constraints do most of the deciding, and they pull in different directions.

| Constraint | Favors | Penalizes |
| --- | --- | --- |
| Pin count above ~240 | BGA (only real option) | All leaded families |
| Thermal dissipation | QFN (exposed pad), BGA (thermal balls) | SOIC, TSSOP |
| Hand rework / field repair | SOIC, TSSOP, QFP, DIP | QFN (partial), BGA, WLCSP |
| Optical inspection | All leaded packages | QFN, BGA (need X-ray) |

Two of these deserve expansion.

**Pin count is a hard ceiling per family.** SOIC effectively stops in the 20s, TSSOP in the 50s, QFP around 240 pins at 0.4 mm pitch — and 0.4 mm QFP leads are fragile enough that many assemblers would rather have a 0.8 mm BGA. Above that, the area array is not a preference but the only geometry that works. This is why "can we avoid BGA?" is a question with a numeric answer: count the signals.

**Rework capability should feed back into the buy.** A product that will be field-serviced for fifteen years is easier to support in TQFP than in WLCSP, regardless of what the datasheet recommends. When a die is offered in both, the leaded variant is often the right buy for low-volume industrial work even at a higher unit price, because the first board-level repair pays the difference back.

## The procurement angle: same die, different suffix

Here is the part of this topic that most package guides skip, and the reason this article exists on a sourcing site.

A silicon vendor rarely designs a die for one package. The STM32F103C8T6 is the LQFP-48 variant of a die that also ships as STM32F103C8U6 (QFN-48) and, in its sibling densities, in LQFP-64, LQFP-100 and BGA variants. The EPM240T100C5N is a MAX II CPLD in TQFP-100; the same device exists as EPM240M100 (MicroBGA) and EPM240F100 (FBGA). Each of these is a separate orderable part number with **independent stock, independent pricing and independent lifecycle status**. It is entirely normal for one package variant to be on 52-week allocation while another sits on shelves, because demand concentrates wherever the biggest customers designed in.

That gives a buyer three concrete moves:

1. **Check sibling packages before declaring a shortage.** If the LQFP is gone, price the QFN and the BGA variants of the same die. If the design can absorb a footprint change at the next board revision — or if the volume justifies an adapter for bridging stock — a sibling package turns a shortage into a layout task. When you [submit an RFQ](/rfq), listing acceptable sibling packages alongside the primary part number widens the search meaningfully.
2. **Treat package migration as the middle option on EOL parts.** When a part goes end-of-life, the choices are usually framed as "last-time-buy or redesign." There is a middle path: vendors frequently discontinue packages one at a time, ending the QFP years before the BGA, or vice versa. Migrating to the surviving package of the *same die* is a board respin without a firmware change, a requalification of silicon, or new errata — dramatically cheaper than a true redesign. A [BOM-level lifecycle check](/bom) should flag not just the part's status but its siblings' status, because the sibling is the exit route.
3. **Read the package code in the suffix before comparing offers.** Two quotes for "STM32F103C8" that do not state the full suffix are not comparable quotes. The package letter is where the ambiguity — and occasionally the bait-and-switch — lives.

## MSL: what moisture sensitivity means for buying and storing

Plastic-bodied surface-mount packages absorb moisture from the air. During reflow, absorbed moisture turns to steam and can crack the package or delaminate the die attach — the "popcorn" failure. The industry grades this as Moisture Sensitivity Level per IPC/JEDEC J-STD-020, and the level is printed on the moisture barrier bag label.

| MSL | Floor life after opening the bag | Practical meaning for a buyer |
| --- | --- | --- |
| 1 | Unlimited | No handling constraint |
| 2 / 2a | 1 year / 4 weeks | Mild constraint, rarely an issue |
| 3 | 168 hours | The common level for QFP, QFN, many BGAs |
| 4 | 72 hours | Tight; production scheduling matters |
| 5 / 5a | 48 / 24 hours | Assembly must be planned around the bake |
| 6 | Bake before use, mandatory | Handle as expired on arrival |

Why this belongs in a sourcing guide: **floor life is consumed by whoever opened the bag, whenever they opened it.** Parts bought through the independent channel may have been unbagged, counted, photographed and rebagged — sometimes several times. Exceeded floor life is recoverable by baking (typically 24–48 hours at 125 °C for larger packages), but baking accelerates intermetallic growth on the terminations and cannot be repeated indefinitely, and tape-and-reel generally cannot be baked at full temperature without deforming the carrier tape. Reasonable questions to ask a supplier of moisture-sensitive parts: are the parts in original sealed bags with intact humidity indicator cards, has the lot been rebagged, and was it rebagged with fresh desiccant under dry nitrogen or just heat-sealed in air. Our own [quality process](/quality) treats bag condition and HIC state as inspection evidence, not packaging trivia.

Fine-pitch BGAs and large QFNs are the packages where MSL discipline matters most; a cracked SOIC is rare, a delaminated MSL-4 BGA that was left on a bench for a month is not.

## Tape-and-reel, tray, tube: media and MOQ

The physical media a package ships in sets the practical minimum order and carries its own risks.

| Media | Typical packages | Typical full quantity | Notes |
| --- | --- | --- | --- |
| Tape-and-reel | SOIC, TSSOP, QFN, small BGA | 250 – 3,000+ per reel | Full reels are the traceability gold standard |
| Cut tape | Same as above | Any | Convenient, but provenance depends on the parent reel |
| Tray (matrix tray) | QFP, larger BGA | 40 – 490 per tray | Bakeable; protects leads; partial trays are normal |
| Tube (rail) | DIP, PLCC, SOIC | 10 – 100 per tube | Legacy and through-hole parts |

The MOQ implications are straightforward but often surprise buyers coming from the design side. A distributor holding factory-sealed reels may be unwilling to break one, so the effective MOQ for a TSSOP logic part can be 2,000 pieces even when you need 200. Trays make small quantities of QFPs and BGAs easy to supply but also easy to mix — a partial tray with two date codes in it is common and should be declared, not discovered. Cut tape is fine for prototypes; for production, a strip of cut tape with no reel label attached has lost the manufacturer lot marking that ties it to a date code, which weakens traceability precisely where you want it strongest.

For hard-to-find parts, be suspicious of *too-perfect* media: factory-sealed reels of a part that has been obsolete for a decade exist, but they are also exactly what a counterfeiter would fake first. Label fonts, reel labels that do not match the manufacturer's known format, and vacuum bags without the correct MSL caution markings are all checkable.

## Package-level counterfeit signals

Two package families carry most of the counterfeit risk, for structural reasons.

**Reballed BGAs.** Recovered BGAs — pulled from scrapped boards — have their remaining solder removed and fresh balls attached, then are sold as new. Reballing is also a legitimate rework operation in some contexts, which is exactly why it is a provenance problem: the operation itself is not visible in casual inspection. Signals worth looking for: ball alloy inconsistent with the date code (leaded balls on a part marked as RoHS-era, or the reverse), non-uniform ball size or slumped ball shape, flux residue in the ball field, witness marks or scratches on the package underside, and — under X-ray — voiding patterns inconsistent with virgin balls. A reballed part may even function, but its solder-joint reliability and its prior thermal history are unknown, which is disqualifying for anything with a reliability requirement.

**Sanded and remarked QFPs.** The flat top of a QFP invites the classic remarking process: sand off the original marking, apply a coating ("blacktopping"), and laser or print a new, more valuable part number. Signals: a surface texture different from the molded original (molds leave a characteristic pin-mark pattern; sanding leaves directional scratches under magnification), marking that dissolves or smears under an acetone or dedicated solvent test, ghost text visible under angled light, and inconsistent fonts or logo styles within a single tray or reel. Bent-and-restraightened leads are a secondary tell that parts were previously mounted.

None of these checks require exotic equipment except the X-ray, which is one reason parts in our stock go through a documented [inspection process](/quality) that includes marking permanence and package-surface examination before they ship.

## Choosing between two package variants of the same part

The buyer's decision, condensed. Suppose the die you need is available as both a TQFP-144 and a CSG-225 BGA — say, the Spartan-6 LX9 as XC6SLX9-2TQG144C versus XC6SLX9-2CSG225C — and both are quotable. Work through these in order:

1. **Does the board already exist?** If yes, the footprint decides and the other variant is only relevant as a future-revision hedge. If the board is being respun anyway, both are live options.
2. **Compare real availability, not just today's price.** Which variant has more independent sources, more recent date codes, and stock in original packaging? A slightly more expensive variant with three credible sources beats a cheaper one with one source.
3. **Match the package to your assembly and repair reality.** No X-ray at your CM? The QFP variant just became worth a price premium. Field repair commitment? Same answer.
4. **Check I/O and thermal deltas.** Sibling packages of the same die frequently bond out different I/O counts (the BGA almost always exposes more) and have different thermal resistance. Confirm the smaller package actually supports the design's pinout.
5. **Check MSL and media.** An MSL-3 QFP in trays and an MSL-4 BGA in a sealed reel are different handling commitments for your stores.
6. **Prefer the variant with the longer expected life.** If one package is already marked NRND in the vendor's ordering guide, buying the other one defers the next shortage.

If both variants fail these tests, you are in last-time-buy or migration territory, and the sooner that is priced, the more options remain.

## FAQ

### What is the difference between QFN and QFP?

QFP has gull-wing leads extending from all four sides; QFN has no leads, terminating instead in plated pads on the package underside plus a central exposed thermal pad. QFN is smaller for the same pin count, thermally and electrically better, and cheaper in volume. QFP is far easier to inspect optically, hand-rework and probe. For long-life industrial products with field service commitments, that inspection and rework advantage is frequently worth QFP's larger footprint.

### Why does the same chip cost differently in different packages?

Because each package variant is a separate manufactured product with its own assembly cost, test cost, demand curve and stock position. WLCSP is usually cheapest to make but concentrated in consumer volume; QFP costs more to assemble but may be abundant secondhand. On the aftermarket, price follows scarcity of the specific suffix, not the die — which is why quoting sibling packages is always worth the extra line on the RFQ.

### Can I replace a BGA part with the QFP version of the same die?

Electrically, usually yes, with caveats: the QFP variant often bonds out fewer I/O, may have different thermal limits, and always has a different footprint, so a board revision is required. Firmware and timing are normally unaffected because the die is identical. This package migration is the standard middle path when one package of an EOL part disappears before the others.

### What does MSL 3 actually require me to do?

Once the moisture barrier bag is opened, MSL 3 parts must be reflowed within 168 hours of cumulative exposure at ≤30 °C/60 % RH, or stored in dry conditions, or baked to reset the clock before assembly. For purchasing, it means asking whether a lot is factory-sealed, checking the humidity indicator card on receipt, and treating rebagged stock as needing a bake unless the rebagging conditions are documented.

### How do I identify an IC package visually?

Count the sides with connections and check where they are: leads through the board is DIP; leads on two sides on top is SOIC/TSSOP (width and pitch separate them); leads on four sides is QFP; metal pads visible only at the edges of the underside is QFN; a grid of balls underneath is BGA. Pitch, body size and lead count then narrow it to the exact variant — which matters, because the footprint drawing in the datasheet is keyed to the package code in the part number suffix.

## Sourcing help

Package availability is where most difficult sourcing cases are actually won: the die you need is often still buyable, just not in the suffix on your BOM. Send the full part number and, if you can flex, the sibling packages you could accept — we will quote real stock, date codes and packaging condition across all of them.

[**Submit an RFQ**](/rfq) | [**BOM lifecycle check**](/bom) | [**Browse the catalogue**](/category)
