---
title: "Comparator vs Op-Amp vs ADC Threshold: Choosing How to Detect a Level"
slug: "comparator-vs-opamp-vs-adc-threshold"
status: "draft"
seoTitle: "Comparator vs Op-Amp vs ADC for Threshold Detection: The Real Limits"
seoDesc: "An op-amp used as a comparator has no hysteresis, no specified propagation delay, and input protection that may clamp the differential. Three ways to detect a level, with the arithmetic."
seoKeywords: "op-amp as comparator, comparator hysteresis calculation, propagation delay overdrive, ADC threshold detection latency, window comparator design, LM393 vs LM358, comparator selection"
tags: "comparison, analogue design, comparators, op-amps, ADC, threshold detection"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Data Converters & Signal Chain"
relatedProducts: "LM339AN, LM339N, LM339AM, LM393AD, LM393DMR2G, ADCMP600BRJZ-REEL7, ADCMP581BCPZ-RL7, ADCMP602BRMZ-REEL7"
---

# Comparator vs Op-Amp vs ADC Threshold: Choosing How to Detect a Level

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: why an op-amp is not a comparator, propagation delay against overdrive, hysteresis arithmetic, ADC latency budget, availability by part class

---

**A comparator answers "is A above B" and nothing else; an op-amp answers "what is the amplified difference between A and B" and is not specified for the question the comparator answers.** Substituting one for the other works often enough to be a habit and fails in ways that are hard to attribute — chatter on a slow ramp, a propagation delay ten thousand times worse than the datasheet suggests, or an input protection diode quietly loading the signal you are measuring.

We have separate guides for [comparator selection](/blog/comparator-selection-guide), [op-amp equivalents](/blog/op-amp-equivalent-selection) and [ADC sourcing](/blog/adc-sourcing-guide). None of them answers the question that comes first: given a threshold to detect, which of the three device classes should be doing it? That question has a computable answer, and this article works the arithmetic.

There is also an availability pattern worth knowing before you specify anything. The jellybean parts are healthier than the precision ones: `LM2903` measures 13% inactive and `LM339` 14%, while the fast and precise families run far worse — `ADCMP` 36%, `MAX999` 38%, `MAX944` **64%**. **Specialty analogue prunes harder than commodity analogue**, which is the opposite of the intuition that old parts are the risky ones.

## Key takeaways

- **An op-amp has no specified propagation delay, no hysteresis, and a slow recovery from saturation.** Its data sheet does not characterise the operation you are asking it to perform.
- **Some op-amps have back-to-back protection diodes across the inputs.** A large differential (exactly what threshold detection applies) is clamped, loading the source and distorting the measurement.
- **Comparator propagation delay is specified at a stated overdrive**, and at low overdrive it degrades by orders of magnitude. On a slow ramp the specification is irrelevant and the ramp rate governs.
- **Hysteresis is not optional on any real-world signal.** The resistor arithmetic is three lines and the failure without it is output chatter.
- **A comparator cannot be used as an op-amp either.** It has no internal frequency compensation, so it will oscillate in a linear feedback loop.
- **An ADC threshold's latency is the sample interval plus conversion plus software** (typically milliseconds) and its accuracy is limited by its reference.
- **Choose on latency and threshold flexibility first.** If neither binds, the comparator is cheaper, simpler and more available than the alternatives.

---

## Why an op-amp is not a comparator

Four specific reasons, each of which produces a different field symptom.

### The input stage is not designed for a large differential

An op-amp is intended to operate with its inputs nearly equal, because feedback holds them there. Threshold detection deliberately drives a large differential across them, which is outside the region the device is characterised in. Two consequences follow:

- **Input protection.** Many op-amps include back-to-back diodes across the input pins to protect the differential pair. Under a large differential those diodes conduct, drawing current from whatever drives the input. If the source is a high-impedance divider (which a threshold reference usually is) **the measurement shifts as a function of how far above the threshold the signal is.** This is a real, repeatable error that looks like a mysterious offset.
- **Phase reversal.** Some older bipolar input stages invert their apparent polarity when driven far enough past their common-mode limit. The output goes the wrong way. It is uncommon on modern parts and catastrophic when it happens.

### Recovery from saturation is slow and unspecified

Driving an op-amp's output to a rail saturates internal stages. Coming out of saturation takes time that is not on the datasheet because the device is not intended to go there. A comparator's output stage is designed to slam between states and its recovery is part of the propagation-delay specification.

### There is no propagation delay specification at all

An op-amp is specified with slew rate and gain-bandwidth product, which describe linear behaviour. Neither tells you how long the device takes to decide a threshold crossing at 10 mV of overdrive. You can estimate it from slew rate, and the estimate will be optimistic because it ignores saturation recovery.

### No hysteresis, and no output structure to build it with

Comparators frequently offer internal hysteresis or an open-collector output that makes external hysteresis straightforward. An op-amp offers neither, so hysteresis must be added around an output stage whose behaviour near the rails is not well characterised.

When an op-amp as a comparator is genuinely acceptable: a slow signal, a small differential, no requirement on timing, an output that does not need to reach the rails, and a low-impedance source that does not care if input diodes conduct. That combination exists (a sluggish over-temperature flag, for instance) and in that case the part count argument (an unused section of a quad already on the board) is a legitimate engineering decision rather than a mistake.

And the reverse substitution is always wrong. A comparator has no internal frequency compensation because it is never meant to run closed-loop. Put one in a linear feedback circuit and it oscillates.

## Propagation delay against overdrive: the specification that misleads

A comparator's propagation delay is quoted at a specific overdrive (commonly 5 mV, 10 mV or 100 mV) and it degrades sharply as overdrive falls. A part specified at 40 ns with 100 mV of overdrive may take several hundred nanoseconds at 5 mV.

That matters much less than the second-order effect, which is what actually breaks designs:

```
Signal ramping at 1 V/s (a thermal or charging ramp)
Comparator specified at 10 mV overdrive

Time for the input to move from threshold to 10 mV past it:
  10 mV / 1 V/s = 10 ms
```

Ten milliseconds, against a propagation delay of 40 nanoseconds. The device's speed is irrelevant by five orders of magnitude; the ramp rate governs entirely. During those 10 ms the input sits within a few millivolts of the threshold, which is where noise decides the output. **This is why a slow signal into a fast comparator produces output chatter, and why the fix is hysteresis rather than a faster part.**

The general rule: **compare the signal's transit time through the input-offset-plus-noise band against the propagation delay, and design for whichever is larger.** For nearly every physical signal (temperature, pressure, battery voltage, light level) the transit time wins and the comparator's speed specification is decorative.

## The hysteresis arithmetic

Positive feedback from output to the non-inverting input shifts the threshold by an amount you choose. Three lines of arithmetic.

For a comparator with a rail-to-rail output swing `V_swing`, feedback resistor `R2` from output to the non-inverting input, and `R1` from that input to the reference:

```
V_hysteresis ≈ V_swing × R1 / (R1 + R2)

Target: 100 mV of hysteresis on a 3.3 V rail-to-rail output
  100 mV / 3.3 V = 0.0303
  R1 / (R1 + R2) = 0.0303  →  R2 ≈ 32 × R1

  R1 = 10 kΩ  →  R2 = 320 kΩ (use 330 kΩ)
```

How much hysteresis to choose: enough that the signal's noise cannot cross both thresholds. Measure the peak-to-peak noise at the comparator input and set hysteresis to two or three times it. For the 1 V/s ramp above, 100 mV of hysteresis means the output cannot chatter unless the noise exceeds 100 mV peak-to-peak, and the threshold now has a defined 100 mV band, which must be acceptable to the application.

Two mistakes that make the calculation wrong:

- **Assuming a rail-to-rail swing on an open-collector output.** The swing is set by the pull-up and the load, not by the comparator, so `V_swing` is not the supply rail. Compute it.
- **Forgetting that the feedback network loads the reference.** `R1` sits between the input and the reference source, so a high-impedance reference is pulled by the feedback current. Buffer the reference or make `R1` large relative to the reference's output impedance.

Parts with internal hysteresis remove this network entirely and remove the mistakes with it. That is worth paying for on a signal you cannot characterise.

## The ADC option: flexible, and slower than you think

An ADC turns a threshold into software, which buys unlimited flexibility and costs latency and reference accuracy.

The latency budget:

```
Sample interval          (1 kSps)          = 1,000 µs worst case
Conversion time          (SAR, 12-bit)     ≈ 5 µs
Software response        (ISR + logic)     ≈ 10-100 µs
                                            -----------
Detection latency                          ≈ 1 ms typical, worst case
```

Against a comparator's tens of nanoseconds, that is four to five orders of magnitude. For a battery-voltage warning it is irrelevant. For an over-current trip it is a fire.

The accuracy budget is the other half. It is the error-budget-in-LSBs arithmetic from the [voltage reference guide](/blog/voltage-reference-selection-guide): the threshold's absolute accuracy cannot be better than the reference's, so a 12-bit conversion against a 1% reference gives a threshold accurate to 1%, not to one part in 4,096.

Where the ADC wins decisively:

- **The threshold must change at run time** — adaptive limits, user-set trip points, calibration.
- **Several thresholds on one signal** (warning, alarm, trip) where a comparator per threshold is three parts.
- **You need the value as well as the decision**, for logging or display.
- **The signal is already being sampled** for another reason, making the threshold free.

Where it loses: anything that must respond faster than the sample interval, anything that must work before firmware is running, and anything where a stuck processor must not disable the protection. **That last one is a safety argument, not a performance one:** a hardware comparator trips whether or not the processor is alive.

## The decision surface

Take the first row that binds.

| If the requirement is | Choose | Why |
| --- | --- | --- |
| Response faster than ~1 µs | **Comparator** | The only option in that range |
| Protection that must work with firmware halted | **Comparator** | Independent of the processor |
| Protection active before boot completes | **Comparator** | Available as soon as rails are up |
| A threshold that changes at run time | **ADC** | Software-defined thresholds |
| Three or more thresholds on one signal | **ADC** | One converter replaces several comparators |
| The measured value is needed too | **ADC** | Decision and value from one conversion |
| Slow flag, spare op-amp section, low-impedance source | Op-amp *acceptable* | Part-count argument is legitimate here |
| A window (between two levels) | **Two comparators or a window comparator** | Or an ADC if latency allows |
| Sub-millivolt threshold accuracy | **Comparator with a good reference, or ADC** | Both are reference-limited |
| Nothing binds | **Comparator** | Cheapest, simplest, best availability |

## What the catalogue says

Measured 2026-08-11. The pattern is that commodity parts have outlived specialty parts.

| Family | Class | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `TLV700` | Modern low-power comparator | 63 | **0%** |
| `LMV339` | Low-voltage quad | 18 | **0%** |
| `LT1720` | Fast precision | 16 | **0%** |
| `TLV340` | Modern general-purpose | 39 | 3% |
| `TL331` | Single, commodity | 18 | 6% |
| `LM2903` | Dual, automotive-heritage | 142 | 13% (1 in last-time buy) |
| `LM339` | Quad, jellybean | 72 | 14% |
| `LM393` | Dual, jellybean | 85 | 20% (2 in last-time buy) |
| `LM311` | Single, classic | 33 | 21% |
| `ADCMP` | ADI precision/fast | 122 | **36%** |
| `MAX999` | Fast | 8 | 38% |
| `MAX944` | Quad fast | 14 | **64%** |

For comparison, the op-amps most often pressed into comparator service: `LM358` 17% inactive with 5 ordering codes in last-time buy, `LM324` 19%, `MCP60x` **0%**.

Two conclusions for a long-life design. First, **the modern low-power comparator families are the safest specification** — `TLV700` and `LMV339` at 0% beat every classic part. Second, **if the design genuinely needs a fast or precise comparator, treat availability as a design risk from the start**: at 36-64% inactive, those families are being pruned hard, and the replacement will not be pin-compatible because fast comparators differ in output structure and supply arrangement.

At category level, analogue comparators are 4,403 part numbers at 29% inactive, op-amps 28,323 at 29%, and ADCs 14,838 at 33%. Current per-part status is on the [comparator](/category/analog-comparators), [op-amp](/category/op-amps) and [ADC](/category/adc) category pages, and an [RFQ](/rfq) confirms a specific ordering code.

## Frequently asked questions

### Can I use a spare op-amp section as a comparator?

Sometimes, and you need to check four things first: whether the op-amp has protection diodes across its inputs that will load your source under a large differential, whether the signal is slow enough that unspecified propagation delay does not matter, whether the output needs to reach the rails, and whether you can add hysteresis around an output stage whose near-rail behaviour is not characterised. For a sluggish flag from a low-impedance source, it is a reasonable part-count decision. For anything timed or protective, it is not.

### Why does my comparator output chatter on a slow signal?

Because the input spends a long time inside the offset-plus-noise band, and nothing tells the output which side to pick. On a 1 V/s ramp, reaching 10 mV of overdrive takes 10 ms — during which noise decides. Add hysteresis sized at two to three times the measured peak-to-peak input noise. A faster comparator makes this worse, not better.

### How much hysteresis should I use?

Two to three times the peak-to-peak noise at the comparator input, provided the resulting threshold band is acceptable to the application. Compute the resistors from `V_hysteresis ≈ V_swing × R1/(R1+R2)`; for 100 mV on a 3.3 V swing, `R2 ≈ 32 × R1`. Use the actual output swing, which on an open-collector output is set by the pull-up and load rather than by the supply.

### Is an ADC threshold ever better than a comparator?

Yes, whenever the threshold must change at run time, several thresholds share one signal, or the measured value is wanted as well as the decision. The costs are latency (roughly a millisecond once sample interval, conversion and software are counted) and accuracy limited by the reference. It is also dependent on firmware running, which disqualifies it for protection that must survive a halted processor.

### Why are precision comparators more obsolete than jellybean ones?

Because their ordering-code populations are small and specialised, so a vendor rationalisation prunes them heavily. Our measurement is `MAX944` at 64% inactive and `ADCMP` at 36%, against `LM339` at 14% and `LM2903` at 13%. The jellybean parts are consumed by thousands of designs across every market, which keeps them economic to produce. If your design needs the precision part, plan the second source at design time.

### What replaces an obsolete fast comparator?

Rarely a pin-compatible part, because fast comparators differ in output structure, supply arrangement and hysteresis behaviour. Check output type first (open-collector, push-pull, complementary, LVDS), then supply configuration (single, dual, split), then propagation delay at *your* overdrive rather than at the datasheet's. Confirm the replacement's input common-mode range covers your threshold, which is the specification most often missed on split-supply substitutions.

### Does a comparator need an external reference?

It needs a reference of some kind, and the threshold's absolute accuracy is the reference's accuracy. A resistor divider from the supply gives a ratiometric threshold, which is correct if the signal is also supply-referred and wrong otherwise. Where the threshold must be absolute, budget the reference as a separate error term: the same arithmetic as an ADC threshold, which is why the two options are closer on accuracy than they appear.

### Can I put hysteresis on an ADC threshold instead?

Yes, in software. It is free, which is one of the ADC option's real advantages. Implement it as two thresholds with the state machine choosing which one applies. That removes the resistor network, the reference loading and the output-swing calculation, and lets the hysteresis band be changed without a board change. It does not remove the latency, which is usually the reason the comparator was being considered.
