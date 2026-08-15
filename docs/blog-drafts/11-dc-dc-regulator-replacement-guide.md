---
title: "Replacing a Discontinued DC-DC Regulator"
slug: "dc-dc-regulator-replacement-guide"
status: "draft"
seoTitle: "How to Replace a Discontinued DC-DC Switching Regulator"
seoDesc: "A switcher swap moves the whole power stage: topology, frequency, inductor, light-load mode, compensation and EMI. Worked ripple and saturation maths, plus a step-by-step selection sequence."
seoKeywords: "DC-DC replacement, buck converter substitute, switching regulator cross reference, obsolete DC-DC, buck inductor ripple calculation, DC-DC second source, pre-bias startup"
tags: "DC-DC, buck converter, switching regulator, second source, compensation, EMI, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Analog & Power Sourcing"
relatedProducts: "TPS62231DRYR, TPS62111RSAR, LT8330ES6#TRMPBF, MAX16904SAUE33/V+, AOZ1281DI"
---

# Replacing a Discontinued DC-DC Regulator

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: DC-DC, buck converter, switching regulator, second source, compensation, EMI

---

<img src="/uploads/dc-dc-regulator-replacement-guide-hero.jpg" alt="A modern replacement DC-DC converter chip ready for placement on a circuit board to replace a discontinued component." width="1200" height="630" fetchpriority="high" />

**Replacing a discontinued DC-DC switching regulator is a power-stage change, not a component swap.** The controller sets the rules, but the inductor determines ripple current, the output capacitor determines transient response, and the compensation network determines whether the loop is stable at all. Change the controller and every one of those relationships moves. This guide walks the decisions in the order they constrain each other, with the arithmetic for each.

## Key takeaways

- Establish the original's **topology, switch integration, synchronous/non-synchronous nature and compensation location** before looking at any candidate. These four attributes eliminate most of the list.
- **Switching frequency sets the inductor.** Double the frequency and you need roughly half the inductance for the same ripple current.
- Check inductor **saturation against peak current at temperature**, not average current at 25 °C.
- **Light-load mode** decides the standby budget. Moving from PFM to forced-PWM can multiply standby current.
- **Ceramic DC bias derating** applies to the output capacitor here exactly as it does to a linear regulator, and it can push the loop outside its stable range.
- A frequency change **moves your EMI profile**. A design that passed EMC before is not guaranteed to pass again.
- If the analysis forces an inductor change plus a compensation change plus a capacitor change, it is a redesign, and a **last-time-buy is usually cheaper**.

---

## A switcher swap is never just a chip swap

When a linear regulator goes obsolete you replace one component. When a switching regulator goes obsolete you replace a system: the controller, the inductor, the input and output capacitors, the compensation network, and sometimes a piece of the layout.

That is because a switching converter's behaviour is distributed across those passives. Our catalogue holds roughly 36,200 DC-DC switching regulator part numbers, so candidates are rarely scarce. The work lies in establishing which candidate does not require redesigning the power stage around it.

## Step 1: Establish what the original actually is

<img src="/uploads/discontinued-eol-electronic-component-warning.jpg" alt="An older obsolete electronic chip bathed in red warning light symbolizing EOL (End-of-Life)." width="800" height="450" loading="lazy" />

Four attributes narrow the field faster than anything else. Characterise the incumbent properly before looking at replacements.

| Attribute | Options | Why it is decisive |
| --- | --- | --- |
| Switch integration | Integrated FET ("regulator") vs external FET ("controller") | Different pin function entirely; not interchangeable without layout change |
| Rectification | Synchronous (low-side FET) vs non-synchronous (external diode) | Replacing synchronous with non-synchronous leaves **no freewheel path** |
| Control topology | Voltage-mode, peak current-mode, constant-on-time, hysteretic | Determines compensation strategy and transient shape |
| Compensation | Internal (fixed) vs external (designed) | Swapping between the two categories is a redesign |

The synchronous/non-synchronous distinction deserves emphasis. A non-synchronous buck needs an external catch diode. Replacing a non-synchronous part with a synchronous one leaves an unnecessary diode on the board, usually harmless. The reverse leaves no freewheel path at all, which destroys the part on first switching cycle.

**Check:** does the original have an SW/LX pin carrying inductor current, or gate-drive pins? Is there a catch diode in the schematic? Is there a COMP pin with an R-C network on it?

## Step 2: Switching frequency drives the passives

Switching frequency sets inductor ripple current for a given inductance:

```
ΔI_L = (Vin − Vout) × D / (L × f_sw)      where D = Vout / Vin
```

Worked example. A 12 V to 3.3 V buck at 2 A, with a 10 µH inductor:

```
D  = 3.3 / 12 = 0.275
At f_sw = 500 kHz:
ΔI_L = (12 − 3.3) × 0.275 / (10e-6 × 500e3) = 2.39 / 5.0 = 0.48 A   (24% of 2 A — healthy)

At f_sw = 2 MHz with the SAME 10 µH inductor:
ΔI_L = 2.39 / (10e-6 × 2e6) = 2.39 / 20 = 0.12 A   (6% of 2 A — sluggish)
```

Ripple of 6% is not dangerous, but it makes the converter slow to respond to load steps and may push the loop outside the range the internal compensation assumes. For a 2 MHz part targeting the usual 20-40% ripple you want roughly 2.2-3.3 µH, not 10 µH.

Run it the other way (a lower-frequency replacement keeping the original small inductor) and ripple current rises proportionally, which risks saturation.

### Saturation is a peak-current question at temperature

```
I_peak = I_load + ΔI_L / 2
```

For the 500 kHz case above: `I_peak = 2 + 0.24 = 2.24 A`. The inductor's saturation rating must exceed that with margin, and saturation current typically *falls* as the core heats, often by 20-30% at elevated temperature. An inductor rated 2.5 A at 25 °C may saturate near 1.9 A hot.

**Check:** switching frequency; recommended inductance range; recomputed ripple; peak current versus saturation rating at your maximum core temperature.

## Step 3: Light-load behaviour and the standby budget

This is the parameter most often missed, and the one that quietly destroys a battery specification.

| Light-load mode | Efficiency at light load | Output ripple | Standby current | Switching noise |
| --- | --- | --- | --- | --- |
| Forced continuous (FPWM) | Poor | Low, fixed frequency | High | Predictable, single tone |
| Pulse-skipping / PFM | Good | Higher, variable frequency | Low | Spread, unpredictable |
| Burst | Best | Highest, bursty | Lowest | Low-frequency envelope |

A substitution moving from PFM to forced-PWM improves ripple and ruins standby current. The reverse saves power and can introduce low-frequency ripple that lands inside an audio band, an ADC's bandwidth, or a receiver's IF: the classic symptom being an audible whine from ceramic capacitors at light load.

Some parts make the mode pin-selectable. If the original had that pin strapped one way, confirm the replacement's default matches, and confirm the strap still means the same thing.

**Check:** light-load mode; whether it is selectable; quiescent current in the relevant mode; the load current at which the mode transition occurs.

## Step 4: Loop stability with capacitors you can actually buy

<img src="/uploads/engineer-placing-smd-replacement-component.jpg" alt="Engineer using precision tweezers to place a new SMD replacement component onto a green PCB." width="800" height="450" loading="lazy" />

Two independent issues.

The compensation itself. For an internally compensated part the datasheet specifies an output capacitance range for which the loop is stable, and that range assumes a capacitor technology. Moving from tantalum or polymer to ceramic removes the ESR zero some designs rely on.

For externally compensated parts the network must be recalculated for the new device's transconductance, current-sense gain and internal reference. Reusing the original R-C values because "the topology is the same" is a common and expensive mistake: the crossover frequency and phase margin both move.

Ceramic DC bias derating, again. Exactly as with linear regulators. A converter requiring a minimum of 20 µF at the output, presented with two nominal 22 µF 0805 parts derated to about 9 µF each, is running at the edge of its stable range while the BOM claims 2× margin.

| BOM says | Case | Effective at 3.3 V | Effective at 5 V |
| --- | --- | ---: | ---: |
| 2 × 22 µF X5R | 0805 | ~18-26 µF | ~14-20 µF |
| 2 × 22 µF X5R | 0603 | ~10-16 µF | ~8-12 µF |

Figures vary by specific capacitor; the magnitude is the point.

**Check:** required output capacitance and technology; effective capacitance after bias and temperature derating; whether the compensation network needs recalculating for the new device.

## Step 5: EMI and layout sensitivity

A switching converter's emissions profile is set by its switching frequency, its edge rates, and the area of the high-di/dt loop on the board. A replacement on a newer process typically has faster edges, producing more high-frequency content from the same layout.

Three specifics:

- **Frequency placement.** A part switching at 2.2 MHz places its fundamental above the AM broadcast band, which is deliberate in automotive designs. A replacement at 1.8 MHz does not, and its harmonics land differently across the CISPR bands.
- **Spread-spectrum modulation.** If the original used it and the replacement does not, measured peaks can rise by several dB with no other change. This alone has failed re-certifications.
- **Input loop area.** The high-di/dt loop is input capacitor → high-side switch → low-side switch/diode → back. If the replacement's pinout puts the input pin further from ground, the existing layout gives you a larger loop and worse radiated emissions.

**Check:** switching frequency against any band you must avoid; edge rate; spread-spectrum availability and whether it is enabled by default; whether the pinout keeps the input capacitor loop tight on the existing footprint.

## Step 6: The pins around the edge

| Pin / behaviour | What varies | Consequence if it differs |
| --- | --- | --- |
| Enable threshold & hysteresis | Often used as programmable UVLO via a divider | Turn-on voltage shifts; possible restart oscillation |
| Soft-start | Fixed or capacitor-programmed | Inrush too high, or sequencing window missed |
| Pre-bias start-up | Graceful vs sinks current | Fights another source holding the rail up |
| Power-good | Threshold, delay, polarity, output type | Downstream supervisor or sequencer misfires |
| Current limit | Cycle-by-cycle, hiccup, or latch-off | A latching part will not start into a legitimate high-inrush load |

Pre-bias behaviour is worth singling out. If the output can be held up by another source at start-up (a parallel supply, a back-feeding load, a large bulk capacitor still charged) a converter that sinks current during soft-start will pull that rail down and may damage whatever is holding it.

**Check:** every pin, and specifically pre-bias behaviour and current-limit style.

## A practical sequence

| Step | Activity | Effort | What it removes |
| --- | --- | --- | --- |
| 1 | Characterise the original (topology, integration, compensation) | ~1 hour | Wrong device class |
| 2 | Filter candidates on those four attributes | ~1 hour | Most of the list |
| 3 | Check frequency, recompute inductor and ripple | ~1 hour | Anything forcing an inductor you cannot fit |
| 4 | Check light-load mode against the standby budget | ~30 min | Battery-spec breakers |
| 5 | Check output capacitance after derating | ~30 min | Marginal-stability candidates |
| 6 | Bench: load step at min/max Vin and load; thermal; start-up incl. pre-bias | 1-2 days | Real surprises |
| 7 | EMI pre-compliance if frequency or edge rate changed | 1 day | Certification risk |
| 8 | Pilot build across temperature | One build cycle | Lot and package variation |

Steps 1-5 are desk work and typically remove around 90% of candidates in an afternoon. Doing them first is what keeps the bench phase bounded.

## Candidates are plentiful; suitability is not

The catalogue spans the full range — small integrated synchronous bucks such as `TPS62231DRYR` or `TPS62111RSAR`, boost and multi-topology parts such as `LT8330ES6#TRMPBF`, automotive-oriented devices such as `MAX16904SAUE33/V+`, and general-purpose parts such as `AOZ1281DI`. Obsolete lines such as `ADP2503ACPZ-3.5-R7` still surface through authorised aftermarket channels.

Listing them together is exactly the trap this guide is about. They differ in topology, integration, frequency and compensation, and none is interchangeable with another on the strength of a matching output voltage. Treat any list as the input to Steps 1-5, and confirm the current datasheet for whichever part you shortlist.

## When to buy through the window instead

If the analysis in Steps 2-5 produces an inductor change, a compensation change and a capacitor change, the "substitution" is a power-stage redesign with a board spin behind it. Against that, a last-time-buy of the original is often dramatically cheaper: switching regulators store well in sealed dry packaging, and the quantity needed to cover a product's remaining life is usually modest.

A rough decision rule:

| Signal | Points to |
| --- | --- |
| Same topology, same compensation class, inductor fits | Substitute |
| Frequency change only, passives can be re-specified | Substitute, plan EMI re-test |
| Compensation class differs, or layout must change | Last-time-buy, or schedule a redesign |
| Product has < 3 years remaining life | Last-time-buy |
| Certified product (medical, automotive, rail) | Last-time-buy unless requalification is already budgeted |

[EOL vs NRND vs Obsolete](/blog/eol-nrnd-obsolete-ic-lifecycle-explained) covers what each lifecycle status implies about how long that window stays open.

## FAQ

### Can I replace a DC-DC converter with a pin-compatible part?

Pin compatibility only guarantees the device fits the footprint. A switching regulator's behaviour depends on switching frequency, control topology, compensation, and the inductor and capacitors around it. A pin-compatible replacement running at a different frequency will need a different inductor for the same ripple current, and one using a different control topology may need a different compensation network entirely. Verify topology, frequency and compensation class before treating any part as a drop-in.

### What happens if I use the wrong inductor value in a buck converter?

Too much inductance for the switching frequency gives low ripple current but a sluggish transient response, and can push the loop outside the range the internal compensation assumes. Too little inductance raises ripple current, which increases peak current, capacitor RMS current and core loss, and risks saturating the inductor. Aim for ripple current around 20-40% of maximum load current, and check that peak current stays below the inductor's saturation rating at operating temperature.

### Why does my replacement converter have higher standby current?

Almost always because the light-load mode changed. Converters operating in forced continuous conduction keep switching at full frequency regardless of load, which holds ripple low but consumes substantially more current at light load than pulse-skipping or burst mode. Check whether the original used PFM or burst mode, whether the replacement offers the same, and whether the mode is pin-selectable with the correct default.

### Will replacing a switching regulator affect EMC compliance?

Very likely. Emissions depend on switching frequency, edge rate, and the layout's high-di/dt loop area. A replacement at a different frequency moves the fundamental and all harmonics into different measurement bands, and a newer process with faster edges produces more high-frequency content from the same board. Losing spread-spectrum modulation that the original had can raise measured peaks by several dB on its own. Budget EMI pre-compliance testing whenever frequency or edge rate changes.

### What is pre-bias start-up and why does it matter?

Pre-bias start-up describes a converter powering up into an output that is already held at some voltage by another source: a parallel supply, a back-feeding load, or residual charge. A converter that handles pre-bias gracefully will not sink current until its internal reference exceeds the existing output voltage. One that does not will pull the rail down during soft-start, which can disturb or damage whatever was holding it up. Check this explicitly if multiple supplies can energise the same rail.

### How do I know whether a converter uses internal or external compensation?

Look for a COMP pin with a resistor-capacitor network attached in the original schematic. If present, the part is externally compensated and the network was designed for that specific device's transconductance and current-sense gain — it must be recalculated for any replacement. If absent, compensation is internal and the datasheet will instead specify a permitted range of inductance and output capacitance, which the replacement's range must overlap.

### Is a last-time-buy cheaper than qualifying a replacement DC-DC?

Frequently, yes. Qualifying a switching regulator substitution typically costs several engineer-days plus a pilot build, and adds EMI re-testing if the frequency changes. Switching regulators store well in sealed dry packaging, so if the design is stable and the remaining production volume is predictable, buying through the last-time-buy window often costs less than the engineering effort. The calculation shifts toward substitution when remaining product life is long or annual volume is high.

### How many DC-DC regulator part numbers are available?

Our catalogue covers roughly 36,200 DC-DC switching regulator part numbers across active, obsolete and authorised aftermarket lines. As with linear regulators, availability is rarely the limiting factor; matching topology, frequency and compensation to the existing power stage is.

## Related reading

The overall framework for analog substitutions (the tiers of equivalence and the qualification workflow) is in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide). If the rail is linear rather than switching, see [the LDO cross-reference guide](/blog/ldo-cross-reference-guide). To catch these before they are urgent, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Send us the discontinued part number along with your inductor, output capacitor and standby constraints, and we will return candidates that survive them — plus availability on the original where authorised aftermarket stock exists.

[**Submit an RFQ**](/rfq) | [**Browse DC-DC regulators**](/category/dc-dc-switching-regulators) | [**Upload a BOM**](/bom)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-08-02

