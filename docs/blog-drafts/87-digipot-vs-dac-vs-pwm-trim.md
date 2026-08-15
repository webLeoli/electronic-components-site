---
title: "Digital Potentiometer vs DAC vs PWM-and-Filter: Choosing an Adjustable Voltage"
slug: "digipot-vs-dac-vs-pwm-trim"
status: "draft"
seoTitle: "Digipot vs DAC vs PWM Filter: The Crossover Points, With Arithmetic"
seoDesc: "Three ways to set a voltage under software control, and where each wins. A digipot sets a ratio; a DAC sets a value — that distinction decides most designs. Digipots are 58% obsolete."
seoKeywords: "digital potentiometer vs DAC, PWM DAC settling time, ratiometric trim, digipot tempco, digital potentiometer obsolete, adjustable voltage reference design, PWM filter resolution"
tags: "comparison, analogue design, DAC, digital potentiometer, PWM, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Data Converters & Signal Chain"
relatedProducts: "AD5259BRMZ50, AD5259BCPZ10-R7, AD5220BRMZ50, X9315UMZ, AD5693RBRMZ-RL7, AD5665BCPZ-REEL7, AD9763ASTZRL, AD7524JP"
---

# Digital Potentiometer vs DAC vs PWM-and-Filter: Choosing an Adjustable Voltage

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: ratio versus value, tempco that beats its own datasheet, PWM settling arithmetic, power-up state as a hazard, availability as a tie-breaker

---

**A digital potentiometer sets a ratio; a DAC sets a value; a PWM and filter sets a time average. Almost every wrong choice among the three comes from not noticing which of those three things the circuit actually needs.** All three appear in our catalogue in quantity, all three are documented individually, and the comparison that decides between them is not written anywhere — including in our own [digital potentiometer](/blog/digital-potentiometer-sourcing-guide) and [DAC](/blog/dac-sourcing-guide) sourcing guides, which each answer only half of the question.

There is also an availability answer. It is unusually decisive. Measured 2026-08-11, **digital potentiometers are 58% inactive across 5,787 part numbers (the highest obsolescence rate of any category on this site**) against DACs at 28% across 11,852. That does not make the digipot the wrong answer, but it means choosing one now is a decision that needs to survive fifteen years of sourcing, and this article ends with when it does.

## Key takeaways

- **If the adjustment sits in a feedback divider, you want a ratio, and a digipot's ratio tempco is far better than its absolute tempco suggests**: the two halves track each other.
- **If the adjustment must produce a defined absolute voltage, you want a DAC.** No amount of digipot resolution fixes an absolute-accuracy requirement.
- **PWM plus a filter is free in silicon and expensive in time.** A 10-bit PWM at 10 kHz needs roughly 230 ms to settle to its final value; that is the trade.
- **Wiper resistance sets the useful bottom of a digipot's range**. That is why a 256-tap device does not give you 256 usable settings at the low end.
- **Power-up state is a safety question, not a convenience one.** A volatile digipot wakes at mid-scale or zero, which in a regulator feedback path can be an over-voltage event before firmware runs.
- **Digital potentiometers are 58% inactive, the worst rate in our catalogue.** DACs at 28% are the safer long-term choice where either would work.
- **The crossover is resolution × accuracy × settling time, and it can be computed**: the tables below do it.

---

## What the three things actually are

The distinction that decides most designs is ratio versus value. It is architectural rather than a matter of specification.

| | Digital potentiometer | DAC | PWM + filter |
| --- | --- | --- | --- |
| What it produces | A resistance ratio between three terminals | A voltage or current referred to a reference | A time-averaged voltage |
| Needs a reference | No — it is ratiometric | **Yes**, and its accuracy is your accuracy | Yes, the supply or a buffered rail |
| Typical resolution | 5-8 bits (32-256 taps) | 8-16+ bits | Set by timer bits, limited by ripple |
| Settling | Microseconds | Microseconds | **Milliseconds to hundreds of milliseconds** |
| Output impedance | The resistance itself | Low (buffered) or current-mode | The filter's series resistance |
| Extra silicon | None | None | None — reuses an existing timer |
| Catalogue availability | **58% inactive** | 28% inactive | Not applicable |

A ratiometric adjustment cancels the reference. Put a digipot in a regulator's feedback divider and the output depends on the internal reference and the *ratio* of the two resistance halves. Absolute resistance drifts with temperature, but both halves drift together, so the ratio is far more stable than either half. This is why a device whose end-to-end tempco is specified in the hundreds of parts per million per degree can hold a divider ratio to single-digit parts per million per degree: a distinction the datasheet's headline number actively obscures, and the single most useful thing to know about digipots.

A DAC cannot cancel anything. Its output is the reference times a code, so reference initial accuracy, drift and noise land directly in the answer. If you need 12 bits of absolute accuracy you need a reference good enough to support 12 bits, which is the error-budget-in-LSBs arithmetic set out in the [voltage reference guide](/blog/voltage-reference-selection-guide). That is a real cost and a real BOM line.

A PWM output is a DAC whose reference is the supply rail and whose reconstruction filter you have to design. It is genuinely free if a timer channel and two passives are spare, and its limitations are entirely in the filter.

## The PWM arithmetic, because it is the part people get wrong

Ripple and settling time trade directly against each other, and resolution sets how bad the trade is.

To use N bits of PWM resolution, the residual ripple must be smaller than one least-significant bit. For a single-pole RC filter the required attenuation at the PWM frequency is approximately 2^N, so the corner frequency must sit roughly 2^N below the PWM frequency:

```
Target: 10-bit resolution, PWM at 10 kHz
Required attenuation at 10 kHz  ≈ 2^10 = 1024   (use 2048 for 0.5 LSB)
Corner frequency  f_c  ≈ 10 kHz / 2048 ≈ 4.9 Hz
Time constant     τ    = 1 / (2π × 4.9 Hz) ≈ 32.5 ms
Settling to 0.1%       ≈ 7τ ≈ 230 ms
```

Two hundred and thirty milliseconds. For a calibration value written once at power-up, that is irrelevant. For a control loop, a servo trim or anything a user turns a knob on, it disqualifies the approach.

The escape routes and their costs:

| Change | Effect | Cost |
| --- | --- | --- |
| Raise PWM frequency to 100 kHz | τ falls to 3.3 ms, settling ~23 ms | Timer resolution at a given clock falls; more switching noise |
| Drop to 8-bit resolution | Required attenuation falls 4× | You gave up two bits |
| Two-pole filter | Much steeper roll-off for the same settling | Two more passives, and the sag under load is worse |
| Buffer the output | Removes load sensitivity | An op-amp — at which point compare cost against a small DAC |

When you have added a buffer amplifier and a two-pole filter, PWM has stopped being free, and a 12-bit I²C DAC such as `AD5693RBRMZ-RL7` is usually cheaper in total, smaller, and does not consume a timer.

## The digipot arithmetic: why 256 taps are not 256 useful settings

Wiper resistance puts a floor under the low end of the range, and it does not scale with the tap setting.

A digipot's wiper contributes a fixed series resistance (typically tens to low hundreds of ohms) between the tap point and the wiper terminal. At high tap settings it is a rounding error. At low tap settings it is the dominant term.

Worked, for a 10 kΩ device with 256 taps and 100 Ω of wiper resistance:

```
Step size                    = 10,000 Ω / 256 ≈ 39 Ω
Resistance at tap 1          = 39 Ω + 100 Ω  = 139 Ω   (3.6× the intended value)
Resistance at tap 5          = 195 Ω + 100 Ω = 295 Ω   (1.5×)
Resistance at tap 26 (~10%)  = 1,014 + 100    = 1,114 Ω (1.10×)
Resistance at tap 128 (50%)  = 5,000 + 100    = 5,100 Ω (1.02×)
```

The bottom tenth of the range carries more than 10% error from wiper resistance alone, before tempco, before the ±20-30% absolute tolerance most of these devices carry on end-to-end resistance. If your design needs fine adjustment near zero, a digipot is the wrong topology regardless of how many taps it has.

The corollary is a design rule: **use the middle of a digipot's range and choose the total resistance so that your adjustment lands there.** That is nearly free at schematic time and impossible to retrofit.

## Power-up state, and why it is a safety question

A volatile digipot powers up at a defined-but-arbitrary position (commonly mid-scale) and if it sits in a regulator's feedback divider, that position sets the output voltage until firmware writes a new one.

Consider a digipot trimming an adjustable regulator's feedback. Mid-scale on power-up might correspond to an output 40% above nominal. Between supply valid and the first successful register write there is a window (supply ramp, reset release, clock start, firmware init, bus enumeration) in which the load sees that voltage. On a 3.3 V rail feeding 3.6 V-absolute-maximum parts, that window is a latent field failure that testing at a bench with a slow supply ramp may never reproduce.

Three ways out, in order of robustness:

1. **Non-volatile digipot.** The tap position is stored in on-chip EEPROM and restored at power-up. This is the correct answer for feedback-path trim. That is why non-volatile variants exist.
2. **Constrain the range so every position is safe.** Choose the fixed resistors so that the extremes of the digipot's travel still produce an output inside the load's rating. Frequently possible, always worth checking, and it makes the failure mode benign rather than merely unlikely.
3. **Keep the adjustment out of the feedback path** — trim a reference or a set-point downstream instead, so a wrong tap is a wrong measurement rather than an over-voltage.

A DAC has the same class of problem (it powers up at zero or mid-scale depending on the part) and the same remedies apply. **PWM is the worst of the three here**, because its output before the timer is configured is whatever the GPIO's reset state produces, and the filter then holds that value for a settling time.

## The decision surface

Pick by the requirement that is hardest to meet, not by cost.

| If the requirement is | Choose | Why |
| --- | --- | --- |
| Adjust a feedback divider ratio | **Digipot** (non-volatile) | Ratiometric; tempco of the ratio beats absolute tempco; no reference needed |
| A defined absolute output voltage | **DAC** | The only option whose output is referred to a reference |
| More than 8 bits of adjustment | **DAC** | Digipots are 5-8 bits in practice |
| Fine adjustment near zero | **DAC** | Wiper resistance dominates a digipot's low end |
| Settling faster than a millisecond | **Digipot or DAC** | PWM's filter forbids it |
| A one-time calibration written at boot | **PWM** | Settling time is irrelevant; cost is zero |
| No spare I²C/SPI bus, but a spare timer | **PWM** | It is the only one that needs no bus |
| Replace a mechanical trimmer, same circuit | **Digipot** | It is the same topology — a three-terminal ratio |
| A current output | **DAC** | Digipots and PWM are voltage/resistance devices |
| Fifteen-year availability, either would work | **DAC** | 28% inactive against 58% |

## Availability: the tie-breaker, and when it is not one

Digital potentiometers are the most obsolete category in our catalogue at 58% inactive across 5,787 part numbers. DACs are 28% across 11,852. When two options both meet the requirement, that difference should decide.

The mechanism is worth understanding rather than just noting. A digipot is a small mixed-signal part with a large ordering-code space (resistance value, taps, volatility, interface, package) and each combination is a separate part number with modest volume. When a vendor rationalises, that structure prunes heavily. It is the same arithmetic that makes factory-programmed oscillators look artificially healthy, working in the opposite direction.

The consequence for sourcing is concrete. `AD5220BRMZ50` is obsolete. `X9315UMZ` is in a last-time-buy window: an Intersil part, consistent with the finding in the [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08) that Renesas lineage holds 36% of all active last-time-buy notices. Meanwhile `AD5259BCPZ10-R7` is active from Analog Devices, and `AD5259BRMZ50` is active under Rochester Electronics: the aftermarket lineage pattern again, where the base number survives under a different brand.

Three cases where the digipot is still right despite the availability gap:

1. **Replacing a mechanical trimmer in an existing circuit.** The topology is a three-terminal ratio; a DAC is not a drop-in for it without redesigning the surrounding network.
2. **The ratiometric tempco is doing real work.** If the adjustment must track a reference you do not control, ratio is the only mechanism that cancels it.
3. **A high-side or floating adjustment** where a DAC would need level shifting or isolation.

In those cases, choose a non-volatile part with an active status and a second source, place it in the middle of its range, and record the decision: the same discipline the [DAC sourcing guide](/blog/dac-sourcing-guide) and [digital potentiometer guide](/blog/digital-potentiometer-sourcing-guide) apply to the individual choices. Current per-part status is on the [DAC](/category/dac) and [digital potentiometer](/category/digital-potentiometers) category pages, and an [RFQ](/rfq) will confirm what is actually available against a specific ordering code.

## Frequently asked questions

### Is a digital potentiometer just a DAC with a resistive output?

No, and treating it as one is the most common conceptual error here. A DAC produces an output referred to a reference: an absolute value. A digipot produces a ratio between three terminals and needs no reference at all. In a feedback divider the ratio is what the circuit consumes, which is why a digipot can be more stable there than its absolute tempco specification implies, and why a DAC in the same slot inherits its reference's error.

### Why is my digipot's low end so inaccurate?

Wiper resistance, which is a fixed series term that does not scale with tap position. On a 10 kΩ, 256-tap device with 100 Ω of wiper resistance, tap 1 reads about 139 Ω instead of 39 Ω: a 3.6× error, while tap 128 is within 2%. Design the surrounding resistors so your adjustment range lands in the middle of the device's travel.

### How slow is a PWM DAC really?

A 10-bit output at 10 kHz needs roughly 230 ms to settle to 0.1%. The filter corner must sit about 2^N below the PWM frequency to keep ripple under one LSB, which puts it near 5 Hz, giving a 32 ms time constant and about seven time constants to settle. Raising the PWM frequency or dropping resolution improves it proportionally; both have costs.

### Can I use PWM for a control loop?

Only if the loop is slower than the filter, which is rarely true. The filter's time constant appears directly inside your control loop as a lag, and a 32 ms lag will destabilise most loops that were designed without it. Use a DAC where the output is part of a loop, and reserve PWM for set-points written at boot or changed slowly.

### Which powers up in a safe state?

A non-volatile digipot, because it restores its stored tap position. A volatile digipot wakes at a fixed arbitrary position (often mid-scale) and a DAC at zero or mid-scale depending on the part. PWM is worst, because its pre-configuration output is the GPIO reset state held by the filter. If the adjustment is in a regulator feedback path, either use a non-volatile part or choose the fixed resistors so every possible position is safe for the load.

### Should I still design in a digital potentiometer given the obsolescence rate?

Only when the ratiometric behaviour or a three-terminal topology is genuinely required. At 58% inactive across 5,787 part numbers it is the most obsolete category we track, so where a DAC would also work (anywhere the requirement is an absolute output) the DAC at 28% is the better fifteen-year bet. When you do choose a digipot, pick a non-volatile part with an active status and a documented second source.

### Does more resolution fix an accuracy problem?

No. Resolution and accuracy are independent, and confusing them is why 256-tap devices disappoint. A digipot with 256 taps still carries ±20-30% absolute tolerance on its end-to-end resistance, and a 16-bit DAC driven from a 1% reference is accurate to about 1%. Decide which of the two you actually need, then check the specification that governs it.

### What replaces an obsolete digipot when the circuit cannot change?

Look for the same base ordering code under an aftermarket brand first. `AD5259BRMZ50` is active under Rochester Electronics, which is the pattern to search for: the base number with an altered or appended suffix, under a different manufacturer name. If nothing exists, the substitution has to match resistance value, taps, wiper resistance, volatility and interface, and the volatility is the one most often overlooked, because it changes power-up behaviour rather than steady-state performance.
