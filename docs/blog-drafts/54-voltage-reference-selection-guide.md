---
title: "Voltage References: Initial Accuracy Is the Spec You Can Fix, and the Rest You Cannot"
slug: "voltage-reference-selection-guide"
status: "draft"
seoTitle: "Voltage Reference Selection and Sourcing: Drift, Hysteresis, Shunt vs Series"
seoDesc: "Why a reference substitution invalidates calibration: tempco specification methods, long-term drift, thermal hysteresis, noise, shunt vs series topology and the TL431 question."
seoKeywords: "voltage reference selection, shunt vs series reference, TL431 accuracy, LM4040 grades, REF102 obsolete, thermal hysteresis, long-term drift ppm, ADR4525, LM399, reference tempco box method"
tags: "voltage reference, tempco, drift, thermal hysteresis, shunt reference, series reference, calibration, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Data Converters & Signal Chain"
relatedProducts: "ADR4525BRZ, REF5025AIDR, LM4040A10IDBZRG4, LM4040DIZ-5.0/NOPB, TL431IDRG4, REF102AP, LM399H, MAX6350EPA+"
---

# Voltage References: Initial Accuracy Is the Spec You Can Fix, and the Rest You Cannot

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: initial accuracy, tempco specification methods, long-term drift, thermal hysteresis, noise, shunt vs series

---

**A voltage reference substitution is a calibration event, not a purchasing event.** Initial accuracy (the number vendors print largest) is the one error you can remove with a calibration constant. Temperature coefficient, thermal hysteresis and long-term drift cannot be calibrated out, because they change after you have calibrated. This is why the reference dominates the error budget of nearly every measurement system, why replacing one invalidates an instrument's calibration certificate, and why the 30% of our 8,143-part [voltage reference category](/category/voltage-references) that is no longer active generates disproportionate sourcing work.


<img src="/uploads/blog/voltage-reference-selection-guide.webp" alt="Precision voltage reference IC undergoing thermal testing on a lab bench" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Initial accuracy is calibratable; tempco, hysteresis and long-term drift are not.** Treat them as different currencies.
- **Tempco is specified by two different methods** (box and slope (or "average")) and the same silicon can be quoted at very different numbers depending on which is used.
- **Thermal hysteresis is a permanent shift after a temperature excursion.** It is the specification most often absent from a datasheet, and it defeats field recalibration.
- **Shunt and series references are not interchangeable.** A shunt reference is a two-terminal device needing a ballast resistor; a series reference is a three-terminal regulator.
- **The `TL431` is a shunt regulator, not a precision reference.** It is the right part in a power supply feedback loop and the wrong part in a 16-bit measurement.
- **Grade letters encode initial accuracy** in reference families — `LM4040A` and `LM4040D` are the same function at very different specifications.
- **A last-time-buy reference forces a recalibration decision per unit**, which usually makes buying stock the cheaper answer.

---

## The four error terms, in the order they hurt

Rank them by whether you can remove them.

| Term | Typical figure | Removable by calibration? | Notes |
| --- | --- | --- | --- |
| Initial accuracy | ±0.05% to ±2% | **Yes**, one constant | The number on the front page |
| Temperature coefficient | 2 to 100 ppm/°C | No | Dominates over a wide range |
| Thermal hysteresis | 20 to 150 ppm per cycle | No | Permanent after excursion |
| Long-term drift | 10 to 100 ppm / 1000 h | Only by recalibration | Ages fastest when new |
| Noise | 1 to 30 µV RMS (0.1-10 Hz) | No | Matters above ~18 bits |

Worked, on a 5 V, 16-bit system where 1 LSB = 76.3 µV:

```
initial accuracy ±0.1%        = ±5.00 mV   = ±65 LSB   (calibrate out)
tempco 10 ppm/°C over 60 °C   = ±3.00 mV   = ±39 LSB   (cannot)
thermal hysteresis 75 ppm     = ±375 µV    = ±4.9 LSB  (cannot)
long-term drift, see below
```

The calibratable term is the biggest and the least interesting. Every specification argument about references is really about the second and third rows.

## Tempco: two specification methods, one part

The box method and the slope method give different numbers for identical silicon, and vendors choose.

- **Box method** (also "min/max box"): the total output deviation observed anywhere across the temperature range, divided by the range. It bounds the worst case.

```
box tempco = (V_max − V_min) / (V_nominal × ΔT)
```

- **Slope or average method**: a straight-line fit, typically between two endpoints. A reference whose output curves (and bandgaps all curve) can look two to three times better under this method, because curvature away from the endpoints is not counted.

Consequence for sourcing: a 10 ppm/°C box-method part may genuinely outperform a 5 ppm/°C slope-method part. When comparing candidates, find the method in the datasheet notes. If it is not stated, assume slope and derate.

Worked, on a part quoted at 3 ppm/°C box over −40 °C to +85 °C, a 125 °C span:

```
total deviation = 3 ppm/°C × 125 °C = 375 ppm
on 2.500 V       = 938 µV
```

That is the guaranteed envelope. The slope-method equivalent tells you nothing about the middle of the range.

## Thermal hysteresis: the term that defeats recalibration

Thermal hysteresis is the output shift that remains after the part has been taken away from a temperature and brought back. Mechanical stress in the package relaxes differently, and the output settles at a slightly new value — typically 20 to 150 ppm, and it does not come back.

Why it matters commercially:

- **It breaks the "just recalibrate in the field" plan.** You can recalibrate at 25 °C, but the next thermal cycle shifts it again, by an amount that is bounded but not predictable in sign.
- **It is package-dependent.** The same die in a plastic SOIC and a ceramic or metal-can package hysteresis differently, which is one reason precision references were historically sold in TO-99 metal cans — `AD584LH` in our catalogue is that generation, now obsolete.
- **It is frequently unspecified.** Absence from the datasheet is not absence from the part.

If the original design used a metal-can or ceramic reference and the replacement is plastic, hysteresis is the specification most likely to have quietly got worse, even where tempco looks similar.

## Long-term drift, and the square-root rule

Long-term drift is normally specified per 1000 hours and is commonly modelled as proportional to the square root of elapsed time, since ageing slows as the die stabilises. For a part quoted at 25 ppm/1000 h:

```
5 years  = 43,800 h = 43.8 × 1000 h
√43.8    ≈ 6.6
drift    ≈ 25 ppm × 6.6 = 165 ppm
on 5 V   = 825 µV = 10.8 LSB at 16 bits
```

Treat this as an estimate, not a guarantee (the square-root model is an industry convention, not a specification) but it is the right order of magnitude for planning recalibration intervals.

Two practical notes: drift is fastest in the first weeks, which is why metrology-grade references are burned in before characterisation;. It is one of the few specifications where a part that has been sitting in a drawer for ten years is *better* than a new one, provided storage was dry and it has not been reflowed.

## Shunt versus series: a topology change, not a substitution

A shunt reference is a two-terminal device that behaves like a precision zener. A series reference is a three-terminal device that behaves like a low-current regulator. They cannot be exchanged without changing the circuit.

| | Shunt (two-terminal) | Series (three-terminal) |
| --- | --- | --- |
| Connection | Cathode/anode across the load, **ballast resistor required** | V_IN, GND, V_OUT |
| Current from supply | Constant, set by the resistor | Only what the load draws |
| Quiescent current | Wasted by design | Low, often < 100 µA |
| Behaviour at low supply | Falls out of regulation as resistor drop grows | Dropout specification |
| Example in catalogue | `LM4040A10IDBZRG4`, `TL431IDRG4`, `LT1004CLPE3-1-2` | `REF5025AIDR`, `ADR4525BRZ`, `MAX6350EPA+` |

Sizing the ballast resistor is where a shunt reference goes wrong. It must pass enough current for the load plus the reference's minimum operating current at the *lowest* supply, and not exceed the reference's maximum current at the *highest* supply with no load. For a 2.5 V shunt reference, 1 mA of load, 60 µA minimum bias, and a 5 V ±5% supply:

```
R ≤ (V_IN(min) − V_REF) / (I_LOAD + I_BIAS(min))
  = (4.75 − 2.5) / 1.06 mA = 2.12 kΩ

at V_IN(max) with no load:
I = (5.25 − 2.5) / 2.12 kΩ = 1.30 mA   → must be within the device's rating
```

Replacing that shunt reference with a pin-compatible-looking series part means the ballast resistor is now in series with a regulator input, and the output collapses under load. Replacing a series part with a shunt one means there is no ballast resistor at all, and the reference either does not conduct or is destroyed.

Add a footprint hazard: both types appear in SOT-23. **A three-lead SOT-23 shunt reference and a three-lead SOT-23 series reference have different pin functions.** Check the pinout drawing every time.

## The TL431 question

The `TL431` is an adjustable shunt regulator designed for power-supply feedback. It is not a precision reference. It is one of the highest-volume analog parts ever made (we hold 391 `TL431` variants, 129 beginning `TL431A` and 120 beginning `TL431B`) and it appears in measurement circuits constantly because it is cheap and familiar.

Where it belongs: the secondary-side feedback element of an isolated converter, driving an optocoupler. Where it does not: setting the full-scale range of a converter that resolves better than about 10 bits.

The reasons are structural rather than a matter of grade:

- **Initial accuracy is coarse** compared with purpose-built references, and the grade letter changes it substantially.
- **Temperature behaviour is specified as a deviation over a range** rather than as a low ppm/°C figure, and it depends on the cathode current and the divider network around it.
- **It needs a minimum cathode current to regulate**, often around 1 mA, far more than a modern micropower series reference.
- **Noise and long-term drift are not the specifications the part was optimised for.**

`TL431IDRG4` is active in our catalogue, as are `TLV431BCDCKR` and `TLV431ASNT1G`, while `KA431D`, `TLVH431CDCKR` and `LMV431IZ/NOPB` are obsolete. **If a BOM uses a 431-class part as the reference for an ADC, that is a design finding, not just a sourcing one** —. It is worth raising during [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

## Grade letters and voltage suffixes

In reference families the letter is the accuracy grade and the number after the dash is the output voltage. Both are part of the part number and a BOM that omits either is under-specified.

| Part number | What it says |
| --- | --- |
| `LM4040A10IDBZRG4` | `A` grade (tightest initial accuracy), 10 V option |
| `LM4040DIZ-5.0/NOPB` | `D` grade (loosest), 5.0 V |
| `LM4040QEEM3-2.5/NOPB` | Automotive-qualified, 2.5 V |
| `LM4041C12IDBZT` | Adjustable shunt, `C` grade, 1.2 V minimum |
| `TL431AIZ` vs `TL431BIDRE4` | Different accuracy classes of the same regulator |

We hold 120 part numbers beginning `LM4040A` and 197 beginning `LM4040D`. **They are not substitutes for each other in a calibrated product**, even though a parametric search treats them as the same device at the same voltage.

## Noise, and when it matters

Reference noise matters above roughly 18 bits, and is usually irrelevant below 16.

Compare a 3 µV RMS (0.1-10 Hz) reference on a 2.5 V output:

```
3 µV / 2.5 V = 1.2 ppm
```

At 16 bits, 1 LSB is 15.3 ppm of full scale: the noise is a tenth of an LSB and invisible. At 24 bits, 1 LSB is 0.06 ppm, and the reference noise is 20 LSB of noise floor. **This is why precision delta-sigma designs specify low-noise references and why substituting on tempco alone can wreck a 24-bit measurement** that was never limited by tempco in the first place. The converter side of that argument is in [ADC sourcing](/blog/adc-sourcing-guide).

Also check:

- **Output current, sourcing and sinking.** Series references often source milliamps but sink microamps; a load that pulls the output up will not be regulated.
- **Capacitive load stability.** Some references are unstable into large capacitors and specify a maximum, or require a series resistor. A board designed around a part that liked 10 µF may oscillate with one that does not.
- **Dynamic current demand from a SAR converter's reference pin**, which may require a buffer — see [data converter sourcing](/blog/data-converter-sourcing-guide).
- **Turn-on time**, which sets how long after power-up the first valid measurement can be taken.

## Technologies, and the metrology end

Four technologies cover the range, and they are not graded versions of one another.

| Technology | Typical tempco | Noise | Characteristic |
| --- | --- | --- | --- |
| Bandgap | 10-100 ppm/°C | Moderate | Cheap, low voltage, ubiquitous |
| Buried zener | 1-5 ppm/°C | Low | Needs higher supply, excellent drift |
| XFET / FGA | 3-10 ppm/°C | Low | Low power with good drift |
| Ovenised / heated zener | < 1 ppm/°C | Very low | Metrology; watts of heater power |

At the metrology end our catalogue holds `LM399H` and `LM399AH` (ovenised zener, active) and `LTZ1000CH#PBF` (active) with `LTZ1000ACH` obsolete. **These parts are not board-level substitutions for anything** — they come with their own heater, current-source and layout requirements, and they exist in voltage standards and calibrators.

The precision middle is well populated and mostly active: `ADR4525BRZ`, `ADR441ARZ-REEL7`, `MAX6325ESA+`, `LT1027ECS8-5#PBF`, `REF5025AIDR`, `AD586KNZ` and `AD588JQ` are all live here, which is good news for a redesign.

## What obsolescence looks like, and the recalibration problem

The classic 10 V references are the acute case.

| Part | Status | Why it matters |
| --- | --- | --- |
| `REF102AP`, `REF102BP`, `REF102CP` | last-time buy | 10.000 V, the instrument standard |
| `MAX6241BCPA+`, `MAX6225BEPA+`, `MAX6350EPA+` | last-time buy | Precision DIP references |
| `AD584LH` | obsolete | Multi-tap TO-99 reference |
| `REF191GS-REEL`, `ADR293GR`, `MAX6198CESA` | obsolete | Rochester supply |
| `REF02CS` | obsolete (`REF02HZ` active) | 5 V classic |
| `ISL21080CIH350Z-TK` | last-time buy | Micropower shunt |

Here is the decision that catches people out. Replacing a reference in a calibrated instrument means:

1. the new part has its own initial error, so every unit needs recalibration;
2. its tempco and hysteresis differ, so the published accuracy specification may no longer be supportable;
3. if the product carries a calibration certificate or is used in a regulated measurement, the change may require requalification of the specification, not just a new constant.

That cost is per unit and per specification, which is why a last-time buy on a reference is frequently the cheapest option even at an unattractive price. The quantity and storage method is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage); the trigger for noticing early is a PCN, covered in [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Shunt or series topology | Output collapses or device destroyed |
| 2 | Pinout, even in the same package outline | Reversed connection |
| 3 | Output voltage option in the suffix | Wrong full scale |
| 4 | Initial accuracy grade letter | Calibration range exceeded |
| 5 | Tempco **and the method it was measured by** | Worse than the number suggests |
| 6 | Thermal hysteresis specified at all | Field recalibration ineffective |
| 7 | Long-term drift and recalibration interval | Specification drifts out of limit |
| 8 | Noise in the 0.1-10 Hz band (18+ bit systems) | Raised noise floor |
| 9 | Source and sink current capability | Unregulated under real load |
| 10 | Capacitive load stability, series resistor need | Oscillation |
| 11 | Minimum operating/bias current (shunt) | Falls out of regulation |
| 12 | Turn-on and settling time | Invalid early measurements |
| 13 | Recalibration plan and certificate impact | Non-compliant instrument |

## FAQ

### Why does replacing a voltage reference invalidate an instrument's calibration?

Because the calibration constants describe the old reference. A replacement has its own initial error (which shifts every reading by a fixed amount) and its own temperature coefficient, thermal hysteresis and drift, which change how the reading moves with conditions. The offset can be corrected by recalibrating each unit, but the accuracy specification of the product depends on the non-calibratable terms, so if they are worse than the original the published specification may no longer be supportable at all.

### What is the difference between box-method and slope-method tempco?

They are two ways of reducing a curved output-versus-temperature characteristic to one number. The box method takes the total spread between the highest and lowest output anywhere in the range and divides by the range, bounding the worst case. The slope or average method fits a line, usually between endpoints, and ignores curvature in the middle, which can make the same part look two to three times better. When comparing candidates, find the method in the datasheet notes; a 10 ppm/°C box-method part can outperform a 5 ppm/°C slope-method part.

### What is thermal hysteresis and why is it not on every datasheet?

It is the permanent output shift that remains after the part has been taken to a different temperature and returned, caused by mechanical stress relaxation in the package — typically 20 to 150 ppm. It is often omitted because it is expensive to characterise and unflattering to publish. Its absence from a datasheet does not mean the part does not have it. It matters most for products that are calibrated once and then thermally cycled in service, because it is the term that makes field recalibration a repeating cost rather than a one-off.

### Can I use a TL431 as the reference for an ADC?

For a coarse measurement, yes; for anything resolving better than about 10 bits, no. The `TL431` is an adjustable shunt regulator designed for power-supply feedback loops. Its initial accuracy is coarse and grade-dependent, its temperature behaviour is specified as a deviation over a range rather than a low ppm/°C figure and depends on the cathode current and surrounding divider, and it requires a minimum cathode current (often around 1 mA) to regulate at all. Purpose-built shunt references such as the `LM4040` family, or series references such as the `REF50xx` and `ADR44x` families, exist for this job.

### Are shunt and series references interchangeable?

No. A shunt reference is a two-terminal device that requires an external ballast resistor sized so that it passes the load current plus the reference's minimum bias current at minimum supply, without exceeding its maximum current at maximum supply. A series reference is a three-terminal regulator with input, ground and output. Fitting a series part into a shunt circuit puts the ballast resistor in series with its input and the output sags under load; fitting a shunt part into a series circuit leaves it with no current-limiting element. Both types are available in SOT-23, with different pin functions.

### How do I know whether reference noise matters in my design?

Compare it to one LSB in parts per million. On a 2.5 V reference, 3 µV RMS in the 0.1-10 Hz band is about 1.2 ppm. One LSB is 15.3 ppm at 16 bits, so the noise is negligible; at 24 bits one LSB is 0.06 ppm, so the same reference contributes roughly 20 LSB of noise floor. In practice, plan for noise above about 18 bits, and below that prioritise tempco, hysteresis and drift.

### How much does a reference drift over the life of a product?

Long-term drift is specified per 1000 hours and is commonly modelled as growing with the square root of time, since ageing slows as the die stabilises. A part quoted at 25 ppm/1000 h therefore works out at roughly 165 ppm over five years — about 825 µV on a 5 V output, or 10.8 LSB at 16 bits. Treat that as a planning estimate rather than a guarantee, and note that drift is fastest in the first weeks, which is why metrology parts are burned in before characterisation.

### Which references in your catalogue are at end of life?

The classic precision DIP and 10 V parts. `REF102AP`, `REF102BP` and `REF102CP` are last-time buy, as are `MAX6241BCPA+`, `MAX6225BEPA+`, `MAX6350EPA+` and `ISL21080CIH350Z-TK`. `AD584LH`, `REF191GS-REEL`, `ADR293GR`, `MAX6198CESA` and `REF02CS` are obsolete, several supplied through Rochester Electronics. Overall 2,469 of 8,143 reference part numbers (30%) are no longer active. The modern precision middle, including `ADR4525BRZ`, `REF5025AIDR` and `MAX6325ESA+`, remains well stocked.

## Related reading

Cluster pillar: [data converter sourcing](/blog/data-converter-sourcing-guide), where the reference's share of the error budget is worked out in LSBs. Then [ADC sourcing](/blog/adc-sourcing-guide) for the dynamic reference-current question, [DAC sourcing](/blog/dac-sourcing-guide) for reference gain options that change the output range, and [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the front end the reference ultimately calibrates.

Lifecycle mechanics: [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us the part number with your resolution, temperature range and calibration constraints, and we will identify which candidates preserve your accuracy specification and which only preserve the footprint.

[**Submit an RFQ**](/rfq) | [**Browse voltage references**](/category/voltage-references) | [**Upload a BOM**](/bom)
