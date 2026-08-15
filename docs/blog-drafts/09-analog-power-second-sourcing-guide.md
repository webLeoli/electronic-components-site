---
title: "Analog and Power Second-Sourcing: A Procurement Guide"
slug: "analog-power-second-sourcing-guide"
status: "draft"
seoTitle: "Analog & Power Second-Sourcing Guide for Procurement"
seoDesc: "How to second-source LDOs, DC-DC regulators, supervisors and op-amps: the three tiers of equivalence, what must match, worked thermal examples, and a qualification workflow."
seoKeywords: "analog second source, power supply cross reference, LDO replacement, DC-DC substitution, analog obsolescence, component qualification, pin compatible replacement"
tags: "analog sourcing, second source, LDO, DC-DC, supervisors, op-amps, procurement, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Analog & Power Sourcing"
relatedProducts: "NCP1117DT33RKG, TPS73250DBVR, TPS62231DRYR, DS1232SN+, TL7705ACDR"
---

# Analog and Power Second-Sourcing: A Procurement Guide

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: analog sourcing, second source, LDO, DC-DC, cross-reference, procurement

---

<img src="/uploads/analog-power-second-sourcing-guide-hero.jpg" alt="Procurement guide for analog and power second-sourcing showing an electronic circuit board with power management ICs." width="1200" height="630" fetchpriority="high" />

**Analog second-sourcing is the process of qualifying a replacement for a discontinued analog or power management IC.** Unlike digital parts, analog devices are defined by *how well* they perform across temperature, load and supply variation, so two parts with identical headline specifications frequently behave differently in the same circuit. This guide covers what must match, what may differ, and how to qualify a substitute without a six-week programme.

## Key takeaways

- A cross-reference tool matches roughly four parameters. At least a dozen determine whether a substitution works.
- The three most common causes of failure, in order: **output capacitor stability**, **quiescent current**, and **thermal derating in the actual package**.
- Analog obsolescence follows **acquisitions**, not published roadmaps. Tracking who owns a product line predicts discontinuation better than any lifecycle notice.
- Substitutions divide into three tiers. Treating a Tier 2 swap as if it were Tier 1 is the single most expensive mistake in this process.
- For jellybean analog parts, a **last-time-buy is often cheaper than qualification**. A regulator in sealed dry packaging stores for years; engineering time does not come back.
- Desk analysis eliminates roughly 90% of candidates in an afternoon. Do it before any bench work.

---

## Why analog is the hard part of a BOM

Analog parts are harder to second-source than digital parts because their specification is statistical and environmental rather than functional. A digital device is defined by what it does: an instruction set, a register map, a protocol. Two parts implementing the same function behave the same way, and when they do not, firmware fails loudly and immediately. An analog device is defined by how well it does something across temperature, load, input voltage and time. Two regulators both marked "3.3 V, 500 mA" can behave completely differently in the same circuit, and the difference may not appear on the bench at 25 °C with a clean supply. It appears in the field, at temperature extremes, on one board in two hundred.

This matters commercially because analog is where the volume sits. In our catalogue, linear regulators, switching regulators, supervisors, op-amps and clock devices together account for roughly 210,000 part numbers: a larger population than microcontrollers.

| Analog family | Part numbers in catalogue | Typical second-source difficulty |
| --- | ---: | --- |
| Linear regulators (LDO) | ~67,900 | Medium — stability dominated |
| Supervisors & reset ICs | ~45,800 | Medium — timing dominated |
| DC-DC switching regulators | ~36,200 | High — whole power stage moves |
| Clock generators & PLLs | ~32,300 | High — output format and jitter |
| Op-amps & instrumentation | ~28,300 | Medium — stability at your gain |

When one of these goes end-of-life there is rarely a drop-in replacement waiting, and the "equivalent" returned by a cross-reference tool is a starting point, not an answer.

## The three tiers of "equivalent"

<img src="/uploads/analog-power-ics-comparison-second-source.jpg" alt="Conceptual comparison of two identical power ICs side by side, illustrating second-sourcing alternatives." width="800" height="450" loading="lazy" />

Substitutions fall into three tiers, and qualification effort differs by an order of magnitude between them. Cross-reference tools flatten this spectrum into a single word, which is where most of the trouble starts.

| Tier | What it is | Qualification effort | Typical risk |
| --- | --- | --- | --- |
| **1 — Same die** | Same fab and process, different brand or acquired line | Paperwork: lineage, package, date code, incoming inspection | Counterfeit risk, not technical risk |
| **2 — Pin-compatible** | Different design, same footprint, same headline spec | Desk comparison + bench verification | **Highest** — headline spec is not the binding spec |
| **3 — Functionally equivalent** | Different footprint, compensation or behaviour | Redesign of the surrounding network, possibly layout | Schedule, not surprise |

Tier 1 arises constantly with authorised aftermarket suppliers who continue an original line after the OEM exits. In our catalogue the largest single source is Rochester Electronics at roughly 106,000 part numbers, which is precisely this model — original tooling, original process, continued production.

Tier 2 is what most cross-reference tables return. It is where the risk concentrates. The part fits, the board powers up, and the substitution is signed off with three or four parameters never checked because they were never in the comparison table.

Tier 3 is slower but honest. For an older part with no modern analogue it is frequently the only real answer.

## What actually has to match

Work through these in order. The first three account for the large majority of failures.

### 1. Stability: the loop, not the voltage

Every linear and switching regulator is a compensated feedback loop, and the output capacitor is inside that loop. Change the regulator and the loop changes with it.

An older LDO built around a PNP pass element may expect several hundred milliohms of ESR from a tantalum output capacitor to place a stabilising zero, and can oscillate with a modern low-ESR ceramic. A newer ceramic-stable LDO can misbehave with too *much* ESR. Neither datasheet describes this as an incompatibility. Both simply state a recommended output capacitor range, and those ranges may not overlap.

There is a second trap that catches experienced teams: **ceramic DC bias derating**. A 10 µF X5R in an 0603 case can lose more than half its nominal capacitance at rated DC bias. If the datasheet requires a minimum of 4.7 µF and your nominal 10 µF part is delivering 4 µF at 3.3 V, you are outside the stable range while the BOM says you have 2× margin. Temperature makes it worse: X5R falls off at both ends of its range.

For switching regulators the same logic extends to the compensation network, the inductor, and the control topology. A constant-on-time converter and a peak-current-mode converter with identical headline specifications respond to a load step quite differently.

**Check:** recommended output capacitance and ESR range in both datasheets; effective capacitance after DC bias and temperature derating; inductor range; internal versus external compensation; control topology.

### 2. Quiescent current and light-load behaviour

If the design is battery-powered or has a standby mode, quiescent current is probably why the original part was chosen, and it spans four orders of magnitude across otherwise similar devices.

Separate three numbers that datasheets often blur:

- **Ground current at load.** Some architectures draw ground current roughly proportional to load; others are nearly flat. For a design that idles most of its life, the light-load figure is the one that matters.
- **Shutdown current.** Usually specified at 25 °C only. Leakage rises substantially at high ambient.
- **Light-load mode**, for switchers specifically:

| Mode | Efficiency at light load | Output ripple | Standby current |
| --- | --- | --- | --- |
| Forced continuous (FPWM) | Poor | Low, fixed frequency | High |
| Pulse-skipping / PFM | Good | Higher, variable frequency | Low |
| Burst | Best | Highest, bursty | Lowest |

A substitution that moves from PFM to forced-PWM improves ripple and destroys the standby budget. The reverse saves power and can introduce low-frequency ripple inside an audio band, an ADC's bandwidth, or a receiver's IF.

**Check:** quiescent current at *your* load; shutdown current at *your* maximum ambient; light-load mode, whether it is pin-selectable, and the default.

### 3. Thermal reality, not thermal rating

A current rating assumes a thermal environment. The same die in a smaller package, or on a board with less copper, will current-limit or thermally shut down earlier.

For a linear regulator the arithmetic is unavoidable — every volt dropped becomes heat:

```
P = (Vin − Vout) × Iload
```

A worked example. Converting 5 V to 3.3 V at 500 mA:

```
P = (5.0 − 3.3) × 0.5 = 0.85 W
```

In a SOT-23 with a junction-to-ambient thermal resistance around 200 °C/W, that is a 170 °C rise — impossible. In a SOT-223 at roughly 60 °C/W on decent copper, it is a 51 °C rise, giving a junction temperature near 76 °C at 25 °C ambient, which is workable. Both packages may carry the same "500 mA" headline rating.

Now change the input to 12 V:

```
P = (12 − 3.3) × 0.5 = 4.35 W
```

No small linear package survives that. At this point the honest answer is a switching regulator, not a different LDO.

**Check:** dissipation at worst case; thermal resistance for the specific package on a board like yours; junction temperature margin; and whether current limit is constant-current, foldback or hiccup.

### 4. Sequencing and control pins

Rarely in a comparison table, frequently the reason a board does not start:

- **Enable polarity and threshold.** Active-high versus active-low, and whether the threshold is logic-level or a fraction of the input. A substitute with a higher threshold may not turn on from a 1.8 V GPIO.
- **Enable absolute maximum.** Some parts tolerate enable above the input rail; others do not. This matters during sequencing and at power-down.
- **Soft-start duration.** Longer soft-start can push a rail outside a sequencing window that a supervisor elsewhere is watching. Shorter increases inrush into bulk capacitance.
- **Output discharge on disable.** Present on some parts, absent on others. Matters if a rail must stay up briefly, or must collapse quickly.
- **Power-good.** Threshold, polarity, open-drain versus push-pull, and deglitch time.
- **Pre-bias start-up.** If another source can hold the output up at start-up, a converter that sinks current during soft-start will fight it.

**Check:** every pin on the original, and the substitute's behaviour on each, not merely that a pin exists in the same position.

### 5. Noise and rejection, where the rail feeds something sensitive

If the rail supplies an ADC reference, an RF section, a PLL or a precision front end, noise and PSRR are functional requirements.

PSRR is strongly frequency-dependent, and the number on a datasheet's front page is typically the best case at 100 Hz or 1 kHz. At the switching frequency of the converter feeding it — commonly 500 kHz to 2.2 MHz — rejection may be 30 dB or less. Two LDOs quoting the same headline PSRR can differ by 20 dB where it counts.

Output noise, usually given in µVRMS over 10 Hz–100 kHz, is a separate axis, and it trades against quiescent current: parts optimised for nanopower operation are generally noisier.

**Check:** PSRR *curves* at the upstream switching frequency, not headline figures; noise over the bandwidth the load cares about.

## A qualification workflow that fits a schedule

The temptation with a forced substitution is to over-test or to test nothing. This sequence works for most Tier 2 changes and keeps bench time bounded.

| Step | Activity | Typical effort | Eliminates |
| --- | --- | --- | --- |
| 1 | Paper comparison across the five categories above | 1-2 hours | ~90% of candidates |
| 2 | Stability: load step at min/max load and min/max Vin, with the real output capacitor | Half a day | Compensation mismatches |
| 3 | Thermal at worst case on the real board, not an EVM | Half a day | Package/derating errors |
| 4 | Start-up: cold start into full load, pre-bias, brown-out recovery | Half a day | Sequencing faults |
| 5 | Pilot build tested across temperature | One build cycle | Lot and package variation |

For a Tier 3 substitution involving a switcher, add EMI pre-compliance: a different switching frequency or edge rate moves the emissions profile, and a design that passed before is not guaranteed to pass again.

Step 1 is the highest-leverage hour in the whole process. Anything that cannot be answered from the two datasheets becomes a bench item; everything else is settled before a soldering iron is switched on.

## Where lifecycle risk actually sits in analog

<img src="/uploads/electronic-components-tape-and-reel-supply.jpg" alt="Macro view of electronic components packaged in industrial tape and reel ready for mass production." width="800" height="450" loading="lazy" />

Analog product lines age differently from digital ones. A microcontroller family is superseded on a predictable cadence and the successor is marketed loudly. An analog part can stay in production for twenty years and then disappear with little warning when a fab node is retired or a line is divested.

Two consequences for procurement:

Acquisitions predict obsolescence better than roadmaps. A large share of analog discontinuation follows consolidation. When a line changes hands, some of it continues, some transfers to an authorised aftermarket supplier, and some is dropped. Knowing who currently owns a line is more useful than any published roadmap.

Last-time-buy is frequently the cheaper answer. Unlike a complex digital device, a jellybean regulator in a sealed, dry-packed reel is low-risk inventory. If a part is on a genuine last-time-buy and no redesign is scheduled, buying through the window often costs less than the engineering time a substitution consumes. A rough comparison for a mid-volume product:

| Path | Typical cost driver | When it wins |
| --- | --- | --- |
| Last-time-buy | Part cost × remaining life volume + storage | Stable design, predictable volume, part stores well |
| Tier 2 substitution | 2-5 engineer-days + pilot build | Long remaining life, high volume, good candidate exists |
| Tier 3 / redesign | Board spin + requalification | Multiple parameters diverge, or the rail should change topology |

For catching these situations early rather than reacting, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) covers monitoring a portfolio, and [EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained) covers what each lifecycle status commits a manufacturer to. Storage practice for parts bought through a window is covered under our [quality process](/quality).

## Family-by-family notes

Linear regulators (LDO). The largest analog family in the catalogue at roughly 67,900 part numbers. Stability with the chosen output capacitor and quiescent current invalidate more otherwise-sensible swaps than everything else combined. Full treatment in [the LDO cross-reference guide](/blog/ldo-cross-reference-guide). Browse [linear regulators](/category/linear-regulators-ldo).

DC-DC switching regulators. Roughly 36,200 part numbers. Control topology, switching frequency and the surrounding passives dominate; a substitution is rarely just a device change. Full treatment in [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide). Browse [DC-DC regulators](/category/dc-dc-switching-regulators).

Supervisors and reset ICs. Around 45,800 part numbers, and deceptively risky. Threshold accuracy, reset pulse width, open-drain versus push-pull output and manual-reset behaviour all vary. A supervisor whose reset releases 50 ms earlier than the original can let a processor begin executing before a rail is valid: a fault that reproduces on a small fraction of units at cold start. Browse [supervisors and reset ICs](/category/supervisors-reset).

Op-amps and instrumentation amplifiers. Around 28,300 part numbers. Input offset, bias current, rail-to-rail behaviour at input *and* output, and stability at the gain you actually use. A decompensated amplifier stable only above a minimum gain will oscillate in a unity-gain follower: a substitution that looks clean on paper and fails immediately. Browse [op-amps](/category/op-amps).

Clock generators and PLLs. Around 32,300 part numbers. Jitter specification and output format matter more than frequency. LVDS, LVPECL, HCSL and CMOS are not interchangeable without translation, and phase-noise requirements are usually set by a downstream converter or SerDes rather than by the clock itself. Browse [clock generators and PLLs](/category/clock-generators-plls).

## When to stop looking for a substitute

There is a point where second-sourcing costs more than the alternatives. Stop and consider a last-time-buy, authorised aftermarket purchase, or scheduled redesign when:

- the paper comparison shows divergence in **three or more** of the five categories;
- the rail feeds a precision, safety-relevant or certified function;
- the substitution forces a layout change anyway;
- the remaining production life is short enough that inventory covers it;
- the part is available through an authorised aftermarket source at a sane price.

That decision is easier with real availability and pricing in front of you rather than as an abstraction.

## FAQ

### What is analog second-sourcing?

Analog second-sourcing is the process of identifying and qualifying an alternative supplier or alternative part for an analog or power-management IC, usually triggered by discontinuation, allocation or a single-source risk finding. It differs from digital second-sourcing because analog behaviour depends on load, temperature, supply variation and the surrounding passive network, so parts with matching headline specifications are not necessarily interchangeable.

### Why do cross-reference tools return replacements that do not work?

Cross-reference tools match on a small set of indexed fields — typically output voltage, output current, package and sometimes dropout. The parameters that determine whether a substitution succeeds are usually not indexed: output capacitor stability range, equivalent series resistance requirements, quiescent current at light load, PSRR at the relevant frequency, thermal resistance in the specific package, and enable or sequencing behaviour. A cross-reference result is a candidate list, not a conclusion.

### What is the most common reason an LDO substitution fails?

Output capacitor stability. Older linear regulators using a PNP pass element often require a minimum equivalent series resistance to keep the control loop stable, while modern ceramic-stable designs require low ESR. Substituting between the two generations without changing the output capacitor can cause oscillation that appears only at certain temperatures or on a fraction of units.

### How does ceramic capacitor DC bias derating affect a regulator substitution?

A multilayer ceramic capacitor loses effective capacitance as DC bias increases: a 10 µF X5R in a small case size can fall below 5 µF at its rated voltage. If a regulator datasheet specifies a minimum output capacitance and the actual derated value falls below it, the control loop can be unstable even though the bill of materials appears to have margin. Always check the capacitor's bias curve at the operating voltage rather than its printed value.

### When is a last-time-buy better than qualifying a replacement?

A last-time-buy is usually preferable when the design is stable, the remaining production volume is predictable, the part stores well in sealed dry packaging, and the qualification effort would exceed the inventory cost. Simple analog parts such as linear regulators and supervisors fit this profile well. Complex or moisture-sensitive devices with long remaining lifetimes favour qualification instead.

### Does a pin-compatible part mean it is a drop-in replacement?

No. Pin compatibility guarantees only that the device fits the footprint. It says nothing about loop stability, quiescent current, thermal derating, soft-start timing, enable thresholds or noise performance. Pin-compatible substitutions (Tier 2 in the framework above) carry the highest risk precisely because they look effortless.

### How long should qualifying an analog substitute take?

For a straightforward pin-compatible swap, roughly one to two hours of datasheet comparison followed by one to two days of bench work, then a pilot build. The desk analysis typically eliminates around 90% of candidates, so doing it first is what keeps the bench phase short. Substitutions that require compensation or layout changes should be scheduled as redesigns rather than substitutions.

## Getting a real answer

If you have a line that has gone end-of-life, send the part number together with the constraints that actually bind: the output capacitor you cannot change, the quiescent current budget, the minimum input voltage, the sequencing window. We will come back with what is genuinely available, including authorised aftermarket stock, rather than whatever a cross-reference table happens to return.

[**Submit an RFQ**](/rfq) | [**Upload a BOM for lifecycle review**](/bom) | [**Browse the catalogue**](/category)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-08-02

