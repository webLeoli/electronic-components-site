---
title: "Understanding MLCC Capacitors: Types, Specs, and Applications"
slug: "understanding-mlcc-capacitors-guide"
status: "draft"
seoTitle: "MLCC Capacitor Guide: Dielectrics, DC Bias and Derating"
seoDesc: "MLCC selection explained: C0G vs X7R vs Y5V, why DC bias can halve capacitance, temperature and ageing effects, case-size trade-offs, cracking risk and how to read a Murata or Samsung part number."
seoKeywords: "MLCC capacitor, X7R vs C0G, MLCC DC bias derating, ceramic capacitor voltage derating, MLCC ageing, GRM188R71C104KA01D, MLCC part number, capacitor dielectric codes"
tags: "MLCC, ceramic capacitor, decoupling, DC bias, derating, passive components, EMC"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Passives & Discretes"
relatedProducts: "GRM188R71C104KA01D, CL10B104KB8NNNC, GRM21BR71C105KA01L, GRM31CR71E106KA12L, GRM32ER71H106KA12L"
---

# Understanding MLCC Capacitors: Types, Specs, and Applications

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: MLCC, dielectrics, DC bias, derating, decoupling, sourcing

---

**A multilayer ceramic capacitor rarely delivers the capacitance printed on it.** Apply DC bias and a Class II MLCC can lose more than half its value; move to a temperature extreme and it loses more; leave it on a shelf and it slowly loses a little more still. None of this is a defect (it is how the dielectric works) but designs fail every day because the BOM says 10 µF and the circuit sees 4 µF. This guide covers the dielectric classes, the three derating mechanisms, mechanical failure modes, and how to read a part number so you order what you meant to.


<img src="/uploads/blog/understanding-mlcc-capacitors-guide.webp" alt="MLCC ceramic capacitors in multiple case sizes arranged on a circuit board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Class I (C0G/NP0) is stable; Class II (X7R, X5R, Y5V) is not.** They are different components that happen to share a package.
- **DC bias is the largest error source.** A 10 µF X5R in an 0603 case can fall below 5 µF at its rated voltage, and this is not on the front page of any datasheet.
- **Case size matters more than voltage rating** for bias performance: a larger case with the same nominal value derates far less.
- **Class II parts age**, losing capacitance logarithmically with time since the last thermal excursion. Typical figures are a few percent per decade-hour.
- **Ceramic is brittle.** Board flex cracking is a real field-failure mechanism and is addressed by layout and case size, not by specification.
- MLCCs are the highest-volume component in electronics; **derating rules should be written into your design standards**, not rediscovered per project.

---

## What an MLCC actually is

An MLCC is a stack of ceramic dielectric layers interleaved with metal electrodes, fired into a monolithic block and terminated at each end. Capacitance comes from the number of layers, their area and the dielectric constant of the ceramic.

That construction explains most of the behaviour that surprises people:

- **More layers and thinner dielectric mean more capacitance in the same case**, and lower voltage withstand, plus greater sensitivity to bias.
- **The high-capacitance ceramics are ferroelectric**, and their permittivity changes with applied field and temperature. This is the root cause of DC bias and temperature derating.
- **The block is brittle** and rigidly soldered at both ends, so board flexure translates directly into mechanical stress in the ceramic.

A modern smartphone contains on the order of a thousand MLCCs. They are the most numerous component type in electronics by a wide margin, which is why shortages in this market are disruptive far out of proportion to the unit price.

## Dielectric classes: two different components

The single most important distinction is Class I versus Class II. They behave so differently that treating them as variants of one part is a design error.

| | Class I (C0G / NP0) | Class II (X7R, X5R, Y5V) |
| --- | --- | --- |
| Capacitance stability | Very high | Poor to moderate |
| DC bias effect | Essentially none | **Large** |
| Temperature coefficient | ±30 ppm/°C | ±15% (X7R) to +22/−82% (Y5V) |
| Ageing | None | Yes, logarithmic |
| Capacitance per volume | Low | High |
| Piezoelectric noise | No | Yes |
| Typical use | Filters, timing, oscillators, PLL loops | Decoupling, bulk energy storage |

**Use Class I when the value must be a value**: a filter corner frequency, an oscillator load capacitance, a PLL loop filter, a timing element, a precision integrator. The price is that you cannot get much capacitance in a small package.

**Use Class II when you need charge, not precision**: supply decoupling, bulk storage, snubbing. Then apply the derating rules below.

### Reading the three-character dielectric code

For Class II, the EIA code encodes the temperature range and tolerance over it:

```
X 7 R
│ │ └── Maximum capacitance change over the range
│ │     R = ±15%,  S = ±22%,  V = +22/−82%
│ └──── Upper temperature limit: 5 = +85 °C, 7 = +125 °C
└────── Lower temperature limit: X = −55 °C, Y = −30 °C, Z = +10 °C
```

So **X7R** is −55 to +125 °C at ±15%, **X5R** is −55 to +85 °C at ±15%, and **Y5V** is −30 to +85 °C at +22/−82%.

That Y5V figure is not a typo. A Y5V part can lose 82% of its capacitance within its own rated temperature range, before DC bias is applied at all. Y5V has legitimate uses where any capacitance will do, but it should never appear where a minimum value matters.

## The three derating mechanisms

Capacitance loss is cumulative across three independent effects, and datasheets present them separately, if at all.

### 1. DC bias: the big one

Applying a DC voltage across a Class II dielectric reduces its permittivity. The effect scales with the field strength, which means it depends on the **voltage relative to the dielectric thickness**, not on the voltage rating alone.

Approximate behaviour for a nominal 10 µF X5R at 3.3 V bias:

| Case size | Approximate effective capacitance | Loss |
| --- | ---: | ---: |
| 0603 | ~4–5 µF | ~50–60% |
| 0805 | ~6–7 µF | ~30–40% |
| 1206 | ~8–9 µF | ~10–20% |

Exact values depend on the specific part: the point is the magnitude and the direction. **A physically larger case with the same nominal value derates far less**, because the dielectric layers are thicker and the field is lower.

Two consequences that cause real failures:

- **A regulator's minimum output capacitance requirement can be violated silently.** If a datasheet requires 4.7 µF and your nominal 10 µF 0603 delivers 4 µF at 3.3 V, the control loop is outside its stable range while the BOM appears to have 2× margin. This is the mechanism behind a large share of the LDO and DC-DC instability described in [the LDO cross-reference guide](/blog/ldo-cross-reference-guide) and [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide).
- **Increasing the voltage rating does not fix it.** A 25 V part in the same case size as a 10 V part often has *worse* bias characteristics at low voltage, because achieving the higher rating in the same volume requires trade-offs. Check the actual bias curve rather than assuming.

What to do: obtain the manufacturer's capacitance-versus-DC-bias curve for the exact part and read the value at your operating voltage. Murata, Samsung, TDK and Kemet all publish these, and simulation tools that model bias are available. Design against the derated value, not the printed one.

### 2. Temperature

The dielectric code gives the worst-case envelope over the rated range. X7R's ±15% is a bound, not a typical figure, and the curve is not flat — capacitance typically peaks somewhere in the middle of the range and falls at both ends.

For a design that must work at −40 °C, an X5R part rated only to −55 °C at ±15% is within specification, but combined with DC bias the total loss at cold can be substantial. **Bias and temperature stack.**

### 3. Ageing

Class II ceramics lose capacitance over time, logarithmically with the time elapsed since the last excursion above the Curie point. Typical ageing rates are a few percent per decade-hour — that is, a similar loss between 1 and 10 hours as between 1,000 and 10,000 hours.

Two practical implications:

- **Datasheet capacitance is quoted at a reference time after firing.** A part measured in incoming inspection years after manufacture will read lower, and that is normal rather than a defect.
- **Reflow soldering de-ages the part**, resetting the clock. Capacitance measured immediately after assembly is higher than it will be in service.

Class I parts do not age.

## Mechanical failure: flex cracking

Ceramic is brittle, and an MLCC is rigidly bonded to the board at both ends. Any board flexure — depanelling, connector insertion, screw torque, drop shock, thermal cycling of a large board — puts the ceramic in tension.

The characteristic failure is a crack running diagonally from a termination into the body. Its dangerous property is that **it often does not fail open**: the crack can create a resistive or intermittent path across the dielectric, so the symptom is elevated leakage or an intermittent short on a supply rail, not a missing capacitor.

Mitigations, in rough order of effectiveness:

- **Orient parts perpendicular to the direction of expected flex**, particularly near board edges and depanel routes.
- **Keep large case sizes away from high-flex zones.** A 1210 is much more vulnerable than an 0402 because it spans more board deflection.
- **Use soft-termination parts** where flex is unavoidable. These have a conductive polymer layer in the termination that absorbs strain, and are specifically intended for automotive and high-vibration use.
- **Avoid placing MLCCs beneath mounting holes and connector footprints.**

Where a supply rail shows unexplained leakage after assembly, flex cracking should be an early hypothesis.

## Case size, voltage rating and the other trade-offs

| Case | Metric | Typical use | Flex vulnerability |
| --- | --- | --- | --- |
| 0201 | 0603 | High-density decoupling | Low |
| 0402 | 1005 | General decoupling | Low |
| 0603 | 1608 | General purpose, bulk | Moderate |
| 0805 | 2012 | Bulk, better bias behaviour | Moderate |
| 1206 / 1210 | 3216 / 3225 | Bulk, high voltage | **High** |

Voltage rating guidance:

- **A common design rule is to operate Class II parts at no more than 50% of rated voltage**, both for reliability and to limit bias derating. Some standards are stricter.
- **For high-reliability and automotive work, 80% derating (operate at 20% of rating) is common.**
- Rating alone does not predict bias performance — always check the curve.

## Piezoelectric noise and the singing capacitor

**Class II ceramics are piezoelectric**: an applied AC voltage mechanically deforms the part, and that deformation couples into the board as sound. On a rail carrying ripple in the audio band, a bank of MLCCs can produce an audible whine.

This is a real product problem, not a curiosity; it is a common complaint on switching supplies that drop into pulse-skipping mode at light load, since the skip frequency lands in the audible range. The interaction with light-load converter modes is covered in [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide).

Mitigations: use Class I where practical, split one large capacitor into several smaller ones, use soft-termination or specially designed low-acoustic parts, orient parts to reduce coupling, or keep the converter out of the audible skip range.

## Reading an MLCC part number

Manufacturer schemes differ, but they encode the same fields. Murata:

```
GRM 188 R71C 104 K A01D
│   │   │    │   │ └──── Packaging / internal code
│   │   │    │   └────── Tolerance: K = ±10%, J = ±5%, M = ±20%
│   │   │    └────────── Capacitance: 104 = 10 × 10⁴ pF = 100 nF
│   │   └─────────────── Dielectric R7 = X7R; voltage 1C = 16 V
│   └─────────────────── Case size 188 = 0603 (1.6 × 0.8 mm)
└─────────────────────── Series
```

Samsung:

```
CL10 B 104 K B8 NNNC
│    │ │   │  │  └──── Packaging and internal codes
│    │ │   │  └─────── Voltage: B8 = 25 V
│    │ │   └────────── Tolerance K = ±10%
│    │ └────────────── Capacitance 104 = 100 nF
│    └──────────────── Dielectric B = X7R
└───────────────────── Case size 10 = 0603
```

The three-digit capacitance code is the same convention as resistors: **the first two digits are significant, the third is the number of zeros, and the result is in picofarads.** So 104 = 100,000 pF = 100 nF = 0.1 µF, and 106 = 10,000,000 pF = 10 µF.

Every field is orderable information. `GRM188R71C104KA01D` and a 0805 X7R 100 nF part are different line items with different bias behaviour, different flex vulnerability and independent availability.

## Sourcing notes

MLCCs are commodity parts until they are not. Three situations turn them into a sourcing problem:

- **Allocation.** MLCC capacity has historically gone into shortage periodically, and when it does, small case sizes and high capacitance values go first.
- **Automotive-qualified parts.** AEC-Q200 variants are separate part numbers with separate supply, and cannot be substituted with the commercial equivalent in a qualified build.
- **Discontinued case sizes and values.** Larger case sizes in particular get rationalised out of manufacturers' ranges as density improves.

Where a specific MLCC is unobtainable, substitution is usually more tractable than for an active device, but it is not free. Verify dielectric class, the bias curve at your operating voltage, case size against your flex environment, and whether the design depends on a tolerance the replacement does not hold. The general framework in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) applies to passives just as it does to semiconductors.

Parts we commonly quote in this family include `GRM188R71C104KA01D`, `CL10B104KB8NNNC`, `GRM21BR71C105KA01L`, `GRM31CR71E106KA12L` and `GRM32ER71H106KA12L`. As always, confirm the current datasheet and bias curve for the exact part.

## FAQ

### What is the difference between X7R and C0G capacitors?

C0G, also written NP0, is a Class I dielectric with very high stability: essentially no capacitance change with DC bias, a temperature coefficient of around ±30 ppm/°C, and no ageing. X7R is a Class II dielectric that offers far more capacitance in the same package but changes substantially with applied voltage, varies up to ±15% over its −55 to +125 °C range, and ages over time. Use C0G where the value must be accurate, such as filters and oscillators, and X7R where you need charge, such as supply decoupling.

### Why does my 10 µF capacitor only measure 4 µF?

Almost certainly DC bias derating. Class II ceramic dielectrics lose permittivity as the applied electric field increases, so a nominal 10 µF X5R in an 0603 case can fall below 5 µF at 3.3 V. The effect depends on case size as much as on voltage rating, because a physically larger part has thicker dielectric layers and a lower field for the same voltage. Measure with the operating bias applied, and design against the manufacturer's capacitance-versus-bias curve rather than the printed value.

### Does a higher voltage rating reduce DC bias derating?

Not reliably. A higher-rated part in the same case size often has comparable or even worse bias behaviour at low voltage, because achieving the higher rating within the same volume requires design trade-offs in the dielectric stack. What consistently helps is a larger case size at the same nominal capacitance, since that gives thicker dielectric layers. The only dependable approach is to read the specific part's bias curve at your operating voltage.

### What does the X7R code mean?

It is an EIA three-character code describing temperature performance. The first character gives the lower temperature limit, where X is −55 °C, Y is −30 °C and Z is +10 °C. The middle digit gives the upper limit, where 5 is +85 °C and 7 is +125 °C. The final letter gives the maximum capacitance change over that range: R is ±15%, S is ±22% and V is +22/−82%. X7R therefore means −55 to +125 °C with up to ±15% variation.

### Do ceramic capacitors lose capacitance over time?

Class II parts do. Their capacitance falls logarithmically with time elapsed since the dielectric last went above its Curie temperature, typically by a few percent per decade-hour — meaning the loss between 1,000 and 10,000 hours is similar to that between 1 and 10 hours. Reflow soldering resets this ageing clock, so a part measures higher immediately after assembly than it will in service. Class I dielectrics such as C0G do not age.

### Why do capacitors on my board make an audible noise?

Class II ceramic dielectrics are piezoelectric, so AC voltage across them causes mechanical deformation that couples into the board and radiates as sound. It is most often heard on switching supplies whose light-load pulse-skipping frequency falls in the audible range. Remedies include using Class I parts where practical, splitting one large capacitor into several smaller ones, choosing parts designed for low acoustic noise, changing part orientation, or keeping the converter's skip frequency out of the audible band.

### What causes MLCC cracking and how do I prevent it?

Ceramic is brittle and the capacitor is rigidly soldered at both ends, so board flexure puts the body in tension. Depanelling, connector insertion, screw torque, drop shock and thermal cycling all produce flex. The resulting crack frequently does not fail open — it creates a resistive or intermittent path, so the symptom is unexplained leakage or an intermittent short on a rail. Prevention is mainly layout: orient parts perpendicular to expected flex, keep large case sizes away from board edges and depanel routes, avoid placement under mounting holes and connectors, and use soft-termination parts where flex is unavoidable.

### How do I read an MLCC part number?

Schemes differ by manufacturer but encode the same fields. For Murata's GRM188R71C104KA01D: GRM is the series, 188 indicates an 0603 case, R7 is the X7R dielectric, 1C is a 16 V rating, 104 is the capacitance code, and K is ±10% tolerance. The capacitance code follows the same convention as resistors (first two digits significant, third the number of zeros, result in picofarads) so 104 is 100,000 pF, or 100 nF.

### How much should I derate an MLCC's voltage rating?

A widely used general rule is to operate Class II parts at no more than 50% of their rated voltage, which improves reliability and limits bias derating. High-reliability and automotive designs commonly go further, to 80% derating — operating at 20% of the rating. Note that voltage derating and capacitance derating are separate concerns: staying well below the rating helps bias performance but does not eliminate it, so the bias curve still has to be checked.

## Related reading

Ceramic derating is the mechanism behind a large share of power-supply instability, covered in [the LDO cross-reference guide](/blog/ldo-cross-reference-guide) and [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide). For lifecycle monitoring across passives as well as semiconductors, see [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us the part number with your operating voltage and case-size constraints and we will come back with real availability, including equivalents whose bias behaviour actually matches what your circuit needs.

[**Submit an RFQ**](/rfq) | [**Browse the catalogue**](/category) | [**Upload a BOM**](/bom)
