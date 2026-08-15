---
title: "BGA Reballing: When It Is Acceptable, and How to Tell It Happened"
slug: "bga-reballing-risk-guide"
status: "draft"
seoTitle: "BGA Reballing: Acceptable Uses, Reflow Budget, Detection and Purchase Terms"
seoDesc: "74,393 BGA part numbers in our catalogue, 42% inactive — the population where reballing gets offered. Reflow-cycle arithmetic, alloy mixing, detection methods and the purchase-order language to use."
seoKeywords: "BGA reballing risk, is reballing acceptable, reballed BGA detection, SAC305 vs SnPb ball alloy, reflow cycle limit J-STD-020, recovered BGA counterfeit, IDEA-STD-1010 reball inspection, dye and pry"
tags: "BGA, reballing, counterfeit detection, reflow, MSL, alloy, procurement policy, quality"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Quality & Compliance"
relatedProducts: "MC8640HX1250HE, MPC8377CVRALGA, 89HPES24T3G2ZBALG8, ADSP-BF561SBBCZ-6A, XC7Z020-1CLG484C, 10AS066K3F35I2SGES, TMS320DM648ZUT9, TNETV2685ZUT9"
---

# BGA Reballing: When It Is Acceptable, and How to Tell It Happened

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: legitimate versus illegitimate reballing, reflow-cycle budget, alloy mixing, detection, purchase terms

---

**Reballing is neither automatically fraud nor automatically fine.** It is a real process with a narrow legitimate use — converting ball alloy for a defined assembly requirement, on documented new material, under a qualified process with traceability, and a much wider illegitimate use: making parts recovered from scrapped boards look like new stock. The two arrive with the same appearance and very different reliability. Our catalogue holds **74,393 part numbers in BGA packages, 10.3% of everything we list, of which 31,258 are no longer active (42%)**, and that inactive population is exactly where reballing offers get made, because it is where demand outlives supply. This article is the decision framework: when to accept it, what it costs the part, how to detect it, and what to put in the purchase order.

## Key takeaways

- **Reballing consumes the part's reflow budget.** A recovered-and-reballed part can arrive with zero cycles left of the three it was qualified for — arithmetic below.
- **The one solid legitimate case is alloy conversion** for a defined requirement, on new material, with a documented process and traceability.
- **Mixed alloys are a real reliability failure**, not a paperwork issue: SnPb melts near 183 °C and SAC305 near 217-220 °C, so a lead-free ball in a tin-lead reflow profile may never collapse.
- **Moisture handling is mandatory after reballing**: the thermal excursions reset the part's floor life, and a missing bake produces popcorning at your reflow.
- **Coplanarity and ball volume consistency are the failure modes that appear later**, as intermittent opens after thermal cycling in the field.
- **Detection is mostly optical and dimensional**, backed by X-ray and destructive sampling; the marking is a separate check.
- **The strongest control is contractual**: require disclosure, prohibit undisclosed reballing, and specify what documentation accompanies an accepted reball.

---

## Why reballing happens at all

Four distinct motivations, only some of them legitimate.

| Motivation | Legitimacy |
| --- | --- |
| **Alloy conversion for a defined assembly requirement** — for example a high-reliability or military programme that requires tin-lead balls on a device sold only lead-free | **Legitimate** with documentation and a qualified process |
| **Restoring oxidised or damaged balls on genuine long-stored stock** | Defensible, with evidence the stock is genuine and its storage history known |
| **Making parts recovered from scrapped assemblies saleable as new** | **Not legitimate**; this is the counterfeit pathway |
| **Obscuring original marking, date codes or lot identity** | **Not legitimate**; reballing is often paired with re-marking |

The reason this matters commercially: as a device family goes obsolete, the price gap between "genuine new stock" and "recovered material" widens, and reballing is what closes the visual gap. Our data shows where the pressure sits — FCBGA packages, which is where large processors, FPGAs and switches live, run **6,631 of 14,958 part numbers inactive (44%)**, and those are high-value parts with long field lives.

## The reflow budget, worked

A moisture-sensitive plastic BGA is qualified for a limited number of reflow cycles at its rated peak temperature — commonly three, under the J-STD-020 classification the manufacturer used. Every thermal excursion counts.

Now count what a recovered, reballed part has already used:

```
1. original assembly reflow (when it was soldered to the board it came from)   1 cycle
2. removal from that board (hot air or rework station, at or above reflow peak) 1 cycle
3. ball removal and re-attach (reballing itself; often two thermal steps)       1-2 cycles
                                                                    -----------------
                                                                    already used: 3-4
your assembly reflow                                                          +1
```

So a recovered-and-reballed part typically arrives with its entire qualified reflow budget spent before it reaches your line, and possibly exceeded. What that consumes is not abstract: each excursion stresses the die attach, the bond wires, the mould-compound-to-die interface and the substrate laminate, and the failure mode is delamination or a cracked die-attach that shows up as an intermittent fault weeks or months later.

By contrast a genuinely new part reballed once for alloy conversion has used one cycle and has margin left, which is precisely why the distinction between "new material, reballed deliberately" and "recovered material, reballed to hide it" is the question.

And the moisture clock resets. After any bake-and-reflow sequence the part must be re-baked and re-dry-packed, because the floor life it accumulated before those excursions is meaningless afterwards. For an MSL 3 part that floor life is 168 hours out of the bag; a reballer who does not document bake and re-packaging is handing you a part that will popcorn at your reflow. The storage side of this is covered in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

## Alloy mixing: the failure that passes X-ray

Ball alloy is not a detail. The two common alloys melt more than thirty degrees apart.

| Alloy | Approximate melting behaviour | Typical reflow peak |
| --- | --- | --- |
| **Sn63Pb37 eutectic** | ~183 °C | 210-225 °C |
| **SAC305 (Sn96.5Ag3.0Cu0.5)** | ~217-220 °C | 235-250 °C |

Two mismatch cases, with opposite symptoms:

Lead-free balls run through a tin-lead profile — "backward compatibility". A SAC ball at a 210-215 °C peak may not fully melt. The paste melts, the ball does not collapse, and the result is a joint with a partially mixed interface and a stand-off height that was never designed for. **It can look acceptable on X-ray** because there is metal in the right place —. It is mechanically brittle and fails under thermal cycling.

Tin-lead balls run through a lead-free profile. The ball melts early and completely, the package sits lower than intended, and lead contamination enters a process that may be required to be lead-free, which is a compliance problem as well as a process one.

Practical consequences for a buyer:

- **Ask which alloy the balls are, and state which alloy you require.** "RoHS compliant" is not an answer to this question; it describes composition rules, not the ball alloy on the part in front of you.
- **If the alloy is being converted, that is the legitimate reball case**, and it should come with a statement of the source alloy, the replacement alloy, the process used and the reflow profile the part has seen.
- **Never mix alloys within one assembly** without a deliberate process decision, and note that some assemblies legitimately require tin-lead for reliability reasons, which is why alloy conversion exists in the first place.

## What the process can damage

Beyond thermal history, the mechanical steps have their own failure modes.

| Step | What can go wrong |
| --- | --- |
| **Ball removal** | Scrubbing damages the substrate pad metallisation, removes the nickel/gold or OSP finish, lifts pads, or tears solder mask between pads |
| **Cleaning** | Flux residue trapped in the grid; aggressive solvents attack the mould compound or marking |
| **Ball attach** | Wrong ball diameter or volume, missing or double balls, misalignment to pad centre |
| **Reflow of new balls** | Excess intermetallic growth at the pad, voids, oxidised joints |
| **Handling** | Package cracking on large bodies; corner-ball damage |

The two dimensional specifications that decide whether the part will assemble reliably are ball diameter consistency and coplanarity. A reballed device with 30 µm of extra coplanarity variation, or a scatter of ball volumes, will place and reflow, and produce a small number of open or weak joints that survive electrical test and fail after temperature cycling. **That is the reason reballed parts get blamed for "board problems" rather than being identified as the cause.**

Ask for a dimensional report: ball diameter distribution, coplanarity across the array, and the specification they were measured against. If the supplier cannot produce one, they did not measure it.

## How to detect it

Reballing leaves evidence. Work through these in order of cost.

Optical inspection, at magnification, comparing against a known-good unit:

- **Ball uniformity** — diameter, height and shape scatter. Factory balls are extremely consistent; reballed arrays usually are not.
- **Ball-to-pad centring.** Systematic offset in one direction indicates a stencil or fixture misalignment.
- **Surface texture and lustre.** Reballed spheres are often noticeably shinier or duller than factory balls, and unusually spherical.
- **Residue between balls** — flux, solder splash, or remnants of the original balls.
- **Solder mask condition** between pads: scratches, thinning or lifted edges.
- **Witness marks or wetting halos** on the substrate where the original ball footprint differed.
- **Package body**: cleaning marks, altered surface finish, evidence of blacktopping, and marking that does not match the vendor's current laser or ink style.

Marking and paperwork checks:

- **Date-code consistency across the lot.** A "single lot" with several date codes is a red flag: the traceability practice is in [date codes and lot traceability](/blog/date-code-lot-traceability-explained).
- **Country of origin and assembly-site codes** consistent with the date code.
- **A solvent test for blacktopping**, per the methods in the standards below.

**X-ray:**

- **Ball volume variation** across the array, and voids.
- **Remnants of the original ball** or of the removal process.
- **Internal features** compared against a golden sample — X-ray also detects the wrong die inside the right package, which is a separate fraud.

Destructive sampling on a lot where the value justifies it:

- **Dye-and-pry** to reveal cracked or partially wetted joints after a test reflow.
- **Cross-section** through the ball and pad to show intermetallic condition, pad metallisation damage and any evidence of mixed alloy.
- **X-ray fluorescence** or similar to confirm ball alloy composition.

The standards to cite in a procedure: [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) for the visual inspection criteria and the sequence, AS6171 for the test-method framework used when a part is suspect, AS5553 and AS6081 for the procurement-control obligations, IPC-7095 for BGA process and inspection criteria, IPC-7711/7721 for the rework procedures that reballing borrows from, and J-STD-020 with J-STD-033 for the reflow classification and moisture handling that the thermal excursions consume.

## The decision framework

Acceptable, with documentation:

1. **The material is documented new stock** with traceability to the original manufacturer's lot.
2. **There is a stated reason** — alloy conversion for a defined assembly or programme requirement, or restoration of oxidised balls on genuine long-stored stock.
3. **The process is qualified and documented**: ball alloy in and out, thermal profile applied, number of excursions, cleaning method.
4. **A dimensional report accompanies the lot**: ball diameter distribution and coplanarity against a stated specification.
5. **Moisture handling is documented**: bake profile, re-packaging in a moisture-barrier bag with desiccant and a humidity indicator card, and the MSL and floor life restated.
6. **Destructive sampling has been performed** on a defined sample size, with results.
7. **The buyer has approved it in advance**, in writing, and the approval is recorded against the part and lot.

Not acceptable:

- **Undisclosed reballing.** Any reball not declared before shipment.
- **Material recovered from assembled boards**, whatever its condition.
- **No traceability** to the original manufacturer's lot.
- **No moisture-handling record.**
- **No dimensional data.**
- **Reballing combined with re-marking**, which removes the ability to verify anything else.
- **Reballing offered as a solution to a date-code requirement**; that is a request to falsify provenance.

The honest summary for most buyers: if you need an obsolete BGA and the only material available has been reballed, the decision depends entirely on whether the base material was new. **A reballed new part with a documented process is usually a manageable engineering risk. A reballed recovered part is a field-failure programme with a delivery date.**

## What to put in the purchase order

Contract language is the strongest control available, because it moves the burden to the point where it can be discharged. Practical clauses:

- **Disclosure**: "Any modification to the component after original manufacture, including but not limited to reballing, re-tinning, re-marking or re-packaging, shall be disclosed in writing prior to shipment."
- **Prohibition by default**: "Reballed or otherwise reworked components are not acceptable unless approved in writing by the buyer for the specific lot."
- **Traceability**: "Supplier shall provide traceability to the original component manufacturer, including original lot and date code."
- **Process documentation**, where a reball is approved: source and replacement alloy, thermal profile, number of reflow excursions, cleaning process, dimensional report.
- **Moisture handling**: "Components shall be supplied in unopened moisture-barrier packaging with desiccant and humidity indicator card, with MSL and bake history stated."
- **Right of rejection and destructive test**: "Buyer may perform destructive analysis on a sample; cost of analysis and of the lot shall be borne by supplier if undisclosed rework is found."

This is the same policy structure described in [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy). It is where the reballing question actually gets settled — long before an inspector looks at a package.

## Where the exposure is, in numbers

Measured across our catalogue, 2026-08-04:

| Package family | Part numbers | Share of catalogue | Not active |
| --- | ---: | ---: | ---: |
| **BGA (all types)** | 74,393 | 10.3% | 31,258 (42%) |
| FCBGA | 14,958 | 2.1% | 6,631 (44%) |
| LFBGA | 8,575 | 1.2% | 2,893 (34%) |
| TFBGA | 8,193 | 1.1% | 3,445 (42%) |
| CSP / WLCSP | 10,605 | 1.5% | 3,185 (30%) |
| QFN / DFN | 70,667 | 9.8% | 16,578 (23%) |
| LQFP | 48,157 | 6.7% | 21,949 (46%) |
| DIP | 31,597 | 4.4% | 15,297 (48%) |

Two things follow.

The exposure is concentrated in high-value silicon. FCBGA at 44% inactive is where processors, FPGAs, SoCs and PCIe switches live — parts worth tens to hundreds of dollars each, which is what makes recovery economically attractive. The specific families are documented in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), [SoC and SoC FPGA sourcing](/blog/soc-fpga-application-processor-sourcing-guide) and [PCIe switches and bridges](/blog/pcie-switch-bridge-sourcing-guide) — that last one is worth noting because a reballed PCIe switch typically trains links at low speed and fails at rate, which is the hardest kind of fault to attribute.

Leaded packages are not exempt. DIP at 48% and LQFP at 46% inactive attract re-tinning and lead-straightening rather than reballing, with their own evidence (witness marks on leads, inconsistent plating lustre, non-coplanar lead tips) and the same disclosure logic applies.

## Substitution and acceptance checklist

| # | Item | Consequence if unresolved |
| --- | --- | --- |
| 1 | Was the base material new or recovered? | Recovered material has no reflow budget left |
| 2 | Reflow excursions already applied, counted | Exceeds J-STD-020 classification |
| 3 | Ball alloy in and out, stated | Mixed-alloy joint; may not collapse in your profile |
| 4 | Your reflow profile matched to the ball alloy | Non-wetting or over-collapse |
| 5 | Bake and re-dry-pack documented | Popcorning at assembly |
| 6 | MSL and floor life restated | Uncontrolled moisture exposure |
| 7 | Ball diameter distribution report | Open or weak joints after thermal cycling |
| 8 | Coplanarity report against a specification | Intermittent opens in the field |
| 9 | Pad metallisation and solder-mask condition | Pad lift, unreliable joints |
| 10 | Traceability to original manufacturer lot | Provenance unverifiable |
| 11 | Date-code consistency across the lot | Mixed-source material |
| 12 | Marking authenticity (blacktopping test) | Re-marked part |
| 13 | X-ray comparison against a golden sample | Wrong die, voids, ball remnants |
| 14 | Destructive sample results (dye-and-pry, cross-section) | Latent joint defects undetected |
| 15 | Written buyer approval recorded | No basis for rejection later |

## FAQ

### Is buying reballed BGAs ever acceptable?

Yes, in a narrow case: when the base material is documented new stock, the reball exists for a defined reason such as converting ball alloy for a high-reliability or military assembly requirement, the process is qualified and documented, dimensional and moisture-handling data accompany the lot, and the buyer has approved it in writing beforehand. What is not acceptable is undisclosed reballing, or reballing of material recovered from assembled boards. The distinction is not the process; it is what was reballed and whether you were told.

### How many reflow cycles does reballing use up?

Enough to matter. A plastic BGA is typically qualified for three reflow cycles at its rated peak under J-STD-020. A part recovered from a board has already had one cycle from that board's assembly and another from its removal, and the reballing itself adds one or two thermal steps, so three or four are gone before it reaches you, and your own assembly needs one more. That is why recovered-and-reballed material is a reliability problem rather than a cosmetic one: the excursions stress die attach, bond wires and the mould-compound interfaces, and the resulting delamination shows up weeks or months later.

### Why does ball alloy matter so much?

Because the two common alloys melt more than thirty degrees apart: eutectic tin-lead at about 183 °C and SAC305 at about 217-220 °C. Run a lead-free ball through a tin-lead profile peaking at 210-215 °C and it may never fully melt; the paste melts, the ball does not collapse, and you get a brittle, partially mixed joint that can look acceptable on X-ray and fail under thermal cycling. In the other direction, tin-lead balls in a lead-free profile melt early, the package sits low, and lead enters a process that may be required to be lead-free.

### How can I tell whether a BGA has been reballed?

Start with magnified optical comparison against a known-good unit: look at ball diameter, height and shape uniformity, centring on the pads, surface lustre, residue or solder splash between balls, and the condition of the solder mask. Check marking style and date-code consistency across the lot, and run a solvent test if blacktopping is suspected. Then X-ray for ball volume variation, voids and remnants of the original balls. On lots where the value justifies it, dye-and-pry and cross-sectioning show joint quality, pad metallisation damage and mixed alloy directly.

### What documentation should accompany an approved reball?

Traceability to the original component manufacturer's lot and date code; a statement of the source and replacement ball alloy; the thermal profile applied and the number of reflow excursions the part has now seen; the cleaning process; a dimensional report giving ball diameter distribution and coplanarity against a stated specification; the bake profile and re-packaging details with MSL and remaining floor life restated; and the results of destructive sampling on a defined sample size. A supplier who can produce all of that is running a controlled process; one who cannot is not.

### Does reballing affect the moisture-sensitivity classification?

It resets the clock entirely. Any bake-and-reflow sequence invalidates whatever floor life the part had accumulated, so after reballing the device must be baked to the appropriate J-STD-033 profile and re-packaged in a moisture-barrier bag with desiccant and a humidity indicator card, with its MSL and floor life restated. For an MSL 3 part that floor life is 168 hours out of the bag. A reballed part supplied loose, or in a bag without desiccant and an indicator card, has no usable moisture history and will popcorn if it absorbed moisture before your reflow.

### Are non-BGA packages affected by similar practices?

Yes. Leaded packages attract re-tinning and lead straightening rather than reballing, and our catalogue shows DIP at 48% inactive and LQFP at 46% (higher rates than BGA's 42%) so the pressure is at least as strong. The evidence differs: witness marks and tool impressions on leads, inconsistent plating lustre, non-coplanar or bent lead tips, and solder wicking up the lead. The disclosure and approval logic in a purchase order should therefore cover any post-manufacture modification, not just reballing.

### What is the single most effective control?

Purchase-order language, because it acts before inspection does. Require written disclosure of any post-manufacture modification prior to shipment, prohibit reworked components unless approved in writing for the specific lot, require traceability to the original manufacturer, and state that the supplier bears the cost of destructive analysis and of the lot if undisclosed rework is found. Inspection catches some reballing; a contract that makes non-disclosure expensive changes what gets offered to you in the first place.

## Related reading

Inspection and provenance: [IDEA-STD-1010 counterfeit detection](/blog/idea-std-1010-counterfeit-detection-guide) for the visual criteria and sequence, [date codes and lot traceability](/blog/date-code-lot-traceability-explained), [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy) for the clauses above, and [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) for why channel choice determines how often this question arises.

Where the exposure is: [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), [SoC and SoC FPGA sourcing](/blog/soc-fpga-application-processor-sourcing-guide), [PCIe switches and bridges](/blog/pcie-switch-bridge-sourcing-guide), [DSP sourcing](/blog/dsp-sourcing-guide) — all BGA-dominated categories with high obsolescence.

Storage and quantity: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) for dry-pack and bake handling over a long stock horizon, and [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts) when the reball question is the sign that a redesign is overdue.

Send us the part number and tell us whether reballed material is acceptable for your programme. We will say plainly whether what we can supply is original-die, unmodified stock, and if a lot has been reworked, you will hear it from us before you order, not after.

[**Submit an RFQ**](/rfq) | [**Our inspection process**](/quality) | [**Upload a BOM**](/bom)
