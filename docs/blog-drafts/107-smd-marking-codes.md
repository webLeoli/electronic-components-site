---
title: "SMD Marking Codes: Identifying a Chip From Its Top Marking Alone"
slug: "smd-marking-codes-identification"
status: "draft"
seoTitle: "SMD Marking Codes: How to Identify a Chip From Its Top Marking"
seoDesc: "SMD packages carry short codes, not part numbers, and codes repeat across vendors. How to identify a chip from its top marking honestly — and spot remarking."
seoKeywords: "smd marking code, smd code identification, ic top marking, identify smd component, chip marking lookup, date code YYWW, remarked ic, blacktopping"
tags: "SMD marking, top marking, date codes, counterfeit detection, IDEA-STD-1010, component identification, quality, traceability"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 14
category: "Quality & Compliance"
relatedProducts: "SN74LVC1G08DBVR, BAS16, MMBT3904, STM32F103C8T6, XC7A35T-1CPG236C, NE555P"
---

# SMD Marking Codes: Identifying a Chip From Its Top Marking Alone

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~14 minutes
> **Topics**: SMD marking codes, top marking structure, date codes, remarking, counterfeit inspection, traceability

---

**A top marking is a claim, not an identity.** On small packages it is an abbreviated claim — a two-to-four character code standing in for a twelve-character part number — and it is a claim that can be sanded off and reprinted for a few cents per unit. Marking-based identification is still a genuinely useful skill: it resolves most "what is this part on this legacy board" questions and it is the first screen in any incoming inspection. But it has to be done in the right order, with an honest sense of its limits, and with the understanding that for anything critical the marking is the beginning of identification, not the end. This guide covers how top markings are structured, how to work one backwards to a part number without fooling yourself, and how the same marking surface becomes the primary evidence in counterfeit detection.

## Key takeaways

- **Small packages carry codes because there is no room for part numbers.** A SOT-23 top surface is under 3 mm wide; "SN74LVC1G08DBVR" does not fit, so Texas Instruments marks it with a short device code instead.
- **Marking codes are not unique across manufacturers.** The same two or three characters map to entirely different devices from different vendors. The logo, package and pin-1 style are part of the identification, not decoration.
- **Work backwards in order:** package family first, then the code, then the manufacturer logo, then confirm against the vendor's published marking specification — and confirm electrically for anything that matters.
- **Date codes are mostly YYWW, but not always.** Single-digit years, letter-coded months and vendor-specific schemes exist; over-reading a date code is a common self-inflicted error.
- **Remarking is the dominant counterfeit technique**, and the marking surface is where the evidence lives: sanding texture, blacktopping, solvent-soluble ink, and font drift within a single reel.
- **Marking-based ID is never sufficient for safety-critical use.** Airworthiness and functional-safety applications require unbroken supply-chain traceability; no amount of top-marking analysis substitutes for it.

---

## Why small packages carry short codes

Marking is a real manufacturing constraint. A SOT-23 measures roughly 2.9 × 1.3 mm on top; a SOT-323 is smaller still, and a 0402-sized DFN barely has a top surface at all. Laser marking at readable size fits perhaps three to six characters on these packages. So manufacturers assign short **marking codes** (also called top codes or type codes): the SN74LVC1G08DBVR single AND gate is marked "A08•" plus a lot indicator; the BAS16 switching diode is marked "A6" by several of its makers; the MMBT3904 transistor is marked "1AM" in its most common form. The full part number exists only on the reel label and in the marking specification table of the datasheet.

Larger packages have room for more. A SOIC-8 like half of the classic timer family carries a nearly full part number — an NE555 in DIP or SOIC is marked "NE555P" or similar plus date and lot — and a TQFP or BGA like an STM32F103C8T6 or XC7A35T carries the complete orderable number, a date code, a lot code and country of origin across several lines. The identification difficulty is therefore inversely proportional to package size: the big parts tell you what they claim to be, the small parts give you a riddle.

This is worth stating plainly because it defines the problem: for small SMD parts, **the code is a lookup key into a manufacturer-specific table**, not an abbreviation you can expand by inspection.

## The anatomy of a top marking

Most top markings, regardless of size, are built from the same ingredients. Not every package has room for all of them.

| Element | What it is | Example forms |
| --- | --- | --- |
| Device code | The part identity — full number on large packages, short code on small ones | "A08", "1AM", "NE555P", full FPGA part number |
| Date code | When the part was assembled | "241" (YYWW), "441" (YWW), letter-month schemes |
| Lot / trace code | Manufacturing lot within the date | Alphanumeric string, vendor-specific |
| Fab / assembly site | Where the die was made and/or packaged | Single letters or symbols, vendor-specific |
| Manufacturer logo | Vendor identity | TI's map-of-Texas, ST's wing, onsemi's mark, Nexperia's X |
| Pin-1 marker | Orientation | Dot, dimple, chamfer, bar — style varies by vendor |
| Compliance marks | Lead-free / green indicators | "e3", "G", geometric symbols |

On a three-character SOT-23 marking, elements get merged or dropped: a common pattern is two or three characters of device code plus one character or symbol encoding date or lot. On a big package the elements spread across two to four printed lines. The vendor's **marking specification** — usually a table or drawing in the datasheet or packaging documentation — is the authority for what goes where, and checking a suspect part against that drawing is one of the most underused inspection steps available, because counterfeiters frequently get the layout subtly wrong even when the characters are right.

## The uniqueness problem: same code, different devices

Here is the trap in every "SMD code lookup" exercise. Marking codes are assigned per manufacturer, with no industry-wide registry. Two or three alphanumeric characters give a few thousand combinations; there are hundreds of thousands of small-package devices. Collisions are not occasional — they are the norm.

"A6" on a SOT-23 is a BAS16 diode from some vendors and entirely different devices from others. Codes beginning "1A" cover the MMBT3904 lineage from one maker and unrelated transistors and ICs elsewhere. Any code lookup database will return multiple candidates for most queries, and a database that returns exactly one answer should increase suspicion, not confidence.

Disambiguation comes from everything *around* the code:

- **The package family narrows the field enormously.** "A6 on SOT-23" and "A6 on SC-70" are different search spaces.
- **The manufacturer logo, when present, usually settles it.** Learning the dozen most common vendor marks (TI, ST, onsemi, Nexperia, Diodes Inc., Infineon, Microchip, Vishay, Rohm, Toshiba) resolves the majority of real-world cases.
- **Pin-1 marking style and marking method are secondary fingerprints.** Vendors are consistent about whether they use a molded dimple, a printed dot or a chamfered corner, and whether they laser or ink their marks. A part whose code says one vendor but whose pin-1 style says another is telling you something.
- **The board context is evidence too.** The footprint, the circuit position (pull-up? pass transistor? reset supervisor?) and the other components constrain what the part could plausibly be.

## Working a marking backwards, honestly

The method that keeps you from fooling yourself, in order:

1. **Identify the package family first.** Measure the body and pitch, count the pins, note the lead style. Everything downstream is conditional on this.
2. **Transcribe the complete marking exactly**, including symbols, dots and their positions. "A08" and "A08•" can differ in meaning; line breaks matter on multi-line marks.
3. **Identify the manufacturer** from the logo if present. No logo? Note the marking method (laser vs. ink) and pin-1 style as weak evidence and keep multiple vendor hypotheses alive.
4. **Look up the code within that vendor's marking tables** — the datasheet's marking section, the vendor's packaging site, or a code database used as an index rather than an oracle.
5. **Confirm against the datasheet's marking drawing.** Does the real part's layout — line count, character positions, logo placement, date code position — match the published specification? This step catches both misidentification and remarking.
6. **Confirm electrically for anything that matters.** Diode junction drops, transistor gain and polarity, logic function on a curve tracer or test jig, or a full functional test for ICs. A five-minute bench check outranks any amount of visual pattern-matching.

The honest failure mode to accept: sometimes the answer is "one of these three devices, most likely X." For a hobby repair that may be enough. For a production decision it means buying the identification a different way — through the reel label, the purchase records, or replacement with a part of known identity.

## Date code formats: YYWW dominates, but read carefully

The four-digit **YYWW** format — two-digit year, two-digit work week — is the closest thing to a standard: "2438" reads as week 38 of 2024. On large packages it is usually printed as its own field or embedded at a documented position in a longer trace code. But treat these as conventions with exceptions, not universal law:

| Format | Reads as | Where you see it |
| --- | --- | --- |
| YYWW | Year + week ("2438") | Most ICs, most vendors — the default assumption |
| YWW | Single-digit year + week ("438") | Small packages short on space; decade-ambiguous |
| WWYY | Week + year | A minority of vendors; ambiguous against YYWW when both fields are valid |
| Letter codes | Letter-coded year and/or month | Some diode/transistor makers on the smallest packages |
| Embedded in lot code | Date recoverable only via vendor decoder | Common on military/hi-rel and some memory vendors |

Three practical cautions. First, **decade ambiguity is real**: a "438" could be 2014 or 2024, and on genuinely old stock the honest range may span twenty years — package style and compliance marks (a part marked lead-free cannot pre-date the RoHS era) help bound it. Second, **do not over-claim precision** from a scheme you have not confirmed against that vendor's documentation; a confidently misread date code has derailed more than one inspection report. Third, remember what a date code is for commercially: age drives solderability, moisture-exposure history and — for date-code-sensitive customers — acceptability of the lot. It is also a consistency check: **every part in a factory reel shares one date code**, so two date codes in one unbroken reel means the reel is not what its label claims.

## Remarking: where marking meets counterfeiting

Remarking is the highest-volume counterfeit technique for one economic reason: it converts a cheap real part (a slower speed grade, a commercial temperature grade, a different device entirely, or an emptied package) into an expensive claimed part with nothing but surface work. The marking surface is therefore where inspection effort concentrates, and IDEA-STD-1010 — the independent-distribution industry's inspection standard — devotes substantial attention to it.

The signals, roughly in the order an inspector meets them:

- **Surface texture.** Molded packages leave a characteristic uniform texture with ejector-pin marks in known positions. Sanding to remove an old mark leaves directional micro-scratches visible under 10–30× magnification; **blacktopping** (a resurfacing coat applied after sanding) leaves an unnaturally uniform, sometimes slightly glossy surface that may not extend evenly to the package edges, and can fill or soften the molded pin-1 dimple.
- **Marking permanence.** Per IDEA-STD-1010, marking is tested with solvents — typically acetone, then stronger mixtures for resistant coatings. Genuine laser marking is engraved into the package and survives; genuine cured ink marking survives acetone. Fresh remarking ink smears; blacktop coatings soften or dissolve, sometimes revealing **ghost marking** from the original print underneath. This is a destructive-ish test performed on sample units, not the whole lot.
- **Laser versus ink, in context.** Neither method is inherently suspect — vendors use both — but the method must match what that vendor uses for that package in that era. An ink-marked part from a vendor that laser-marks that family is a flag.
- **Font and layout drift within a lot.** A factory marks thousands of units with identical tooling. Within one reel or tray, character fonts, sizes, spacing, logo rendering and line positions should be effectively identical. Mixed fonts, wandering baselines, or two logo styles in one reel indicate mixed or remarked stock.
- **Corroborating package evidence.** Sanded QFP tops paired with restraightened leads; BGA remarking paired with reballing; marking claiming a recent date code on a package style the vendor retired years earlier.

No single signal is proof, and a few have innocent explanations (vendors do change marking sites and methods). The standard's approach — and ours — is cumulative evidence documented against the vendor's own marking specification. Every lot we ship passes through this kind of documented external visual and marking-permanence inspection; the process is described on our [quality page](/quality).

## What to photograph when you ask for identification help

Whether you are sending a mystery part to a forum, a distributor or to us, the same evidence package answers most questions in one round trip:

1. **Top marking, straight-on, in focus, filling the frame** — through a loupe or macro lens if the package is small. Angled raking light in a second shot often reveals engraved marks and ghost text that flat light hides.
2. **The whole package showing all pins**, so the family and pin count are unambiguous.
3. **A scale reference** — a ruler in frame beats guessing between SOT-23 and SOT-89 from proportions.
4. **The underside**, which carries thermal pads, additional marking, and (on BGAs) the ball field.
5. **The board context**: the footprint designator (a "Q" or "D" or "U" reference tells you the class of part), the surrounding circuit, and the board's approximate age and origin.
6. **The reel or tube label, if any exists** — it carries the full part number and lot data and is worth more than every other photo combined.
7. **Anything you already measured**: junction drops, resistance between pins, rail voltages in circuit.

What makes identification slow: a single blurry top-down photo of a soldered part with no scale, no context and a marking half-obscured by flux. What makes it fast: items 1, 2 and 5.

If the part turns out to be identifiable and you need stock of it, that same photo set is a perfectly good starting point for an [RFQ](/rfq) — we would rather receive a marking photo and a board context than a guessed part number that is wrong.

## When marking-based ID is not acceptable

There is a hard boundary, and it is worth stating without hedging: **for safety-critical applications, identification by marking is not identification.**

Airworthiness regulations, functional-safety standards (IEC 61508, ISO 26262 contexts), medical device quality systems and defense procurement all require that a part's identity and provenance be established by **documented, unbroken supply-chain traceability** — certificates of conformance tracing to the original component manufacturer or an authorized distributor, lot and date code records, and controlled storage history. A part whose identity rests on reading its top marking, however expertly, is a part of unknown provenance. It may be exactly what it claims; the point is that the claim cannot bear the weight those applications put on it, because remarking exists precisely to exploit marking-based trust.

In those contexts the marking analysis described in this article is still performed — but as a *verification layer on top of* documented traceability, never as a substitute for it. When traceability is broken and the part is irreplaceable, the recognized path is full authentication testing (external inspection, marking permanence, X-ray, decapsulation and die inspection, electrical test against the datasheet) by a qualified lab — an expensive process that exists because marking alone was never enough. For BOM positions where this matters, flag them early: a [BOM review](/bom) that identifies which line items require full traceability, before purchasing starts, is far cheaper than discovering it at incoming inspection.

## The practical checklist

For identifying an unknown SMD part from its marking:

- [ ] Measure the package: body dimensions, pitch, pin count, lead style. Name the family before touching the code.
- [ ] Transcribe the full marking exactly, including dots, symbols and line breaks.
- [ ] Identify the manufacturer logo, or note its absence.
- [ ] Search the code **within** the identified vendor and package family; treat multi-vendor hits as unresolved.
- [ ] Pull the datasheet's marking specification and match the layout, not just the characters.
- [ ] Read the date code with the vendor's documented format; state ambiguity rather than guessing decades.
- [ ] Confirm electrically before the identification drives any purchase or production decision.

For screening a purchased lot's markings:

- [ ] Compare marking layout against the vendor's published marking drawing.
- [ ] Check surface texture under magnification for sanding or blacktopping; check the pin-1 feature is molded, not printed over.
- [ ] Verify one date code per reel/tube and consistent fonts across sampled units.
- [ ] Perform a marking-permanence solvent test on sample units per IDEA-STD-1010.
- [ ] Confirm the marking method (laser/ink) and date code are plausible for the vendor, package and claimed era.
- [ ] Reconcile the reel or tray label against the part marking and the paperwork.
- [ ] Escalate anything critical to electrical test or third-party authentication — and require documented traceability where the application demands it.

## FAQ

### How do I look up an SMD marking code?

Start from the package family and manufacturer, not the code. Measure the package, transcribe the marking exactly, identify the vendor logo, and then search that vendor's marking tables or a code database filtered to that package. Expect multiple candidates and use the circuit context and an electrical check to pick between them. A code searched in isolation returns collisions from unrelated vendors and is the most common way people misidentify small parts.

### Why do different chips have the same top marking code?

Because marking codes are assigned independently by each manufacturer with no shared registry, and two or three characters cannot uniquely cover the industry's device count. The code is only meaningful in combination with the manufacturer and package. This is also why the logo, pin-1 style and marking method carry real identification weight.

### What does a date code like 2438 mean?

In the dominant YYWW convention it means week 38 of 2024. But three-digit forms, week-first forms and letter-coded schemes exist, so confirm the format against the specific vendor's documentation before drawing conclusions — especially on old stock where a three-digit code is ambiguous across decades. Within one factory reel, all parts share a single date code; variation inside a reel is a stock-integrity red flag.

### Can a remarked chip still work?

Often, yes — which is what makes remarking dangerous. Many remarked parts are real silicon of a lower grade: a slower speed grade sold as fast, commercial temperature sold as industrial, or a used part sold as new. They pass casual functional checks and fail at temperature, at speed or over time. Function is not identity; that is the entire reason marking-permanence and surface inspection exist.

### Is it safe to buy parts identified only by their marking?

For non-critical repair and prototyping, with electrical confirmation, it is a reasonable engineering judgment. For production, the identification should be corroborated by lot documentation and incoming inspection. For safety-critical, aerospace or medical applications, no — those require documented supply-chain traceability regardless of how convincing the marking is, and marking analysis serves only as an additional verification layer.

## Sourcing help

If you are holding a board with an unreadable or ambiguous part on it, or a lot whose markings do not sit right, send us the photo set described above. We inspect every lot we ship against the manufacturer's marking specification — external visual, marking permanence and documentation review — before it leaves.

[**Submit an RFQ**](/rfq) | [**Our quality process**](/quality) | [**Browse the catalogue**](/category)
