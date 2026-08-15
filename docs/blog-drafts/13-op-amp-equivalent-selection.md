---
title: "Op-Amp Equivalents: The Specs That Bite"
slug: "op-amp-equivalent-selection"
status: "draft"
seoTitle: "Op-Amp Equivalent Selection: Choosing a Real Replacement"
seoDesc: "Op-amp substitutions fail on minimum stable gain, input common-mode range, bias current and capacitive load — not on the headline specs. Worked examples and a ten-point checklist."
seoKeywords: "op-amp equivalent, operational amplifier replacement, op-amp cross reference, decompensated op-amp, rail to rail input output, input bias current error, op-amp second source"
tags: "op-amp, operational amplifier, instrumentation amplifier, second source, stability, analog sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "TLV2372IDGKR, OPA684IDBVT, OPA2834IDGKR, LMV831MGX/NOPB, BA15218N, AD8605ACB-REEL7"
---

# Op-Amp Equivalents: The Specs That Bite

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: op-amp, operational amplifier, second source, stability, cross-reference

---

**An op-amp cross-reference matches supply range, bandwidth and package. None of those is why a substitution fails.** Amplifier substitutions fail on stability at the gain you actually use, on input common-mode range at the rails, and on input bias current interacting with your source impedance. This guide covers the parameters that decide the outcome, with the arithmetic to check each.


<img src="/uploads/blog/op-amp-equivalent-selection.webp" alt="Operational amplifier under precision waveform and stability testing" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **A decompensated amplifier will oscillate in a unity-gain follower.** "Gain-bandwidth product 50 MHz" tells you nothing about whether the part is stable at your gain.
- **Rail-to-rail output does not imply rail-to-rail input**, and the reverse also holds. The two are independent specifications and the marketing name usually refers to only one.
- **Capacitive load** is the second most common cause of oscillation. Many otherwise excellent amplifiers become unstable driving more than 50-100 pF.
- **Input bias current × source impedance = an offset voltage** you may not have budgeted. A bipolar input in a 1 MΩ circuit can produce tens of millivolts of error.
- Bandwidth is not free: for a given part, **closed-loop bandwidth = GBW / gain**. Doubling gain halves bandwidth.
- Around 28,300 op-amp and instrumentation amplifier part numbers are available; matching the circuit, not the headline specs, is the work.

---

## Why op-amp substitutions surprise people

An operational amplifier is not defined by what it does (every op-amp amplifies a difference) but by the conditions under which it continues to do so correctly. Two amplifiers with the same supply range, the same gain-bandwidth product and the same package can behave completely differently in the same socket.

The reason is that most of an op-amp's real specification describes boundaries: how close to the rails the inputs may go, how much capacitance the output can drive, how much current flows into the inputs, at what gain the internal compensation keeps the loop stable. Cross-reference tools index the headline figures and almost none of the boundaries.

Op-amps and instrumentation amplifiers account for roughly 28,300 part numbers in our catalogue, so candidates are abundant. The following are the parameters that eliminate most of them.

## 1. Stability at your gain: the decompensated trap

Some high-speed amplifiers are deliberately "decompensated": they are stable only above a minimum closed-loop gain. Drop one into a unity-gain buffer and it will oscillate immediately.

This is not a defect. Removing internal compensation buys bandwidth and slew rate, and a part intended for gain-of-5 or gain-of-10 applications is legitimately faster than a unity-gain-stable equivalent. But the datasheet expresses this in a line such as "stable for gain ≥ 5", which no cross-reference tool indexes.

| Amplifier type | Minimum stable gain | Typical trade |
| --- | --- | --- |
| Unity-gain stable | 1 | Lower bandwidth for the same power |
| Decompensated | 2, 5, or 10 | Higher bandwidth and slew rate |

**Check:** the minimum stable gain of both parts, and the actual noise gain of your circuit. Note that *noise gain*, not signal gain, governs stability: an inverting amplifier configured for a signal gain of −1 has a noise gain of 2, and a difference amplifier's noise gain depends on all four resistors.

### Phase margin and the "stable but ringing" case

Even at a legal gain, replacing an amplifier changes the loop's phase margin. Symptoms short of outright oscillation include overshoot on a step, a peak in the frequency response near crossover, and increased settling time. If the circuit drives an ADC, longer settling directly costs you throughput or accuracy.

**Check:** step response overshoot on the bench, not just "does it oscillate".

## 2. Input common-mode range: the rail-to-rail confusion

"Rail-to-rail" is ambiguous and the ambiguity causes real failures. A part may be rail-to-rail on the output, on the input, or both, and datasheet front pages frequently say only "rail-to-rail".

| Claim | What it means | What it does not mean |
| --- | --- | --- |
| Rail-to-rail output (RRO) | Output can swing to within millivolts of each rail | Inputs can go to the rails |
| Rail-to-rail input (RRI) | Inputs operate across the full supply range | Output can reach the rails |
| Rail-to-rail input/output | Both | Performance is uniform across the range |

Two concrete failure modes:

Input range violation. A single-supply circuit with the non-inverting input at ground works only if the amplifier's input common-mode range includes the negative rail. Many classic amplifiers require the inputs to stay 1-2 V away from each rail. Substituting one into a ground-sensing circuit produces an output stuck at a rail, or worse, phase inversion.

The crossover distortion of RRI parts. Many rail-to-rail input stages are built from two input pairs (one PMOS, one NMOS) with a handover somewhere in the middle of the range. At the handover point, input offset voltage can shift abruptly. For a precision DC circuit whose common-mode voltage crosses that point, this produces a discontinuity in the transfer function that looks like nonlinearity and is very hard to diagnose.

**Check:** the input common-mode range of both parts against the actual common-mode voltage in your circuit, including its extremes; and whether an RRI part has a handover discontinuity within your operating range.

## 3. Input bias current against your source impedance

Input bias current flowing through source impedance creates an offset voltage. This is where bipolar-to-CMOS and CMOS-to-bipolar substitutions cause trouble in both directions.

```
V_error = I_bias × R_source
```

Worked example with a 1 MΩ source impedance:

| Input stage | Typical I_bias | Error across 1 MΩ |
| --- | ---: | ---: |
| CMOS / JFET | 1 pA | 1 µV — negligible |
| Precision bipolar | 1 nA | 1 mV |
| General bipolar | 100 nA | **100 mV** |

A 100 mV offset in a circuit expecting microvolt precision is not a degradation, it is a different circuit. Conversely, substituting a CMOS part into a design that deliberately used bias-current cancellation and matched source impedances loses nothing but gains no benefit either: a harmless swap in that direction.

Also watch **input offset voltage drift** over temperature, specified in µV/°C. A part with excellent room-temperature offset and poor drift may be worse than one with mediocre offset and good drift, depending on the operating range.

**Check:** source impedance seen by each input; bias current and offset voltage of both parts; drift over the operating temperature range.

## 4. Capacitive load tolerance

Most op-amps become unstable driving capacitance beyond some limit, commonly in the range 50-500 pF. Capacitance at the output adds a pole inside the feedback loop, eroding phase margin.

Sources of capacitance people forget:

- A long trace or cable to a remote sensor
- An ADC input with a sampling capacitor and anti-alias filter
- A deliberate output filter capacitor placed inside the feedback loop
- Scope probe capacitance, which means the circuit can oscillate *only while you are measuring it*, or stop oscillating when you probe it

Standard mitigations are an isolation resistor of tens of ohms between the output and the load capacitance (placed inside the feedback loop where possible), or a snubber. If the original amplifier tolerated the load and the replacement does not, adding an isolation resistor changes the DC accuracy into the load, which may or may not be acceptable.

**Check:** the replacement's stated capacitive load tolerance, and the real capacitance at the output including cabling and ADC input.

## 5. Bandwidth, slew rate and what they cost

Closed-loop bandwidth follows directly from gain-bandwidth product:

```
f_closed-loop ≈ GBW / noise gain
```

A 10 MHz GBW amplifier at a gain of 100 gives 100 kHz of bandwidth. If the original had 50 MHz GBW and the replacement has 10 MHz, the circuit's bandwidth drops fivefold, which may be irrelevant for a DC measurement and fatal for a signal chain.

**Slew rate** is a separate limit and governs large-signal response:

```
Maximum undistorted sine frequency ≈ Slew rate / (2π × V_peak)
```

For a 1 V/µs amplifier producing a 5 V peak output:

```
f_max ≈ 1e6 / (2π × 5) ≈ 32 kHz
```

An amplifier with adequate small-signal bandwidth can still be slew-limited on large signals, producing triangular waveforms where sines were intended.

**Check:** required closed-loop bandwidth at your gain; required slew rate at your output amplitude and frequency.

## 6. Supply, quiescent current and output drive

- **Supply range.** A part specified from ±5 V may not operate from a single 3.3 V supply, and a part specified for 1.8 V single-supply may not tolerate ±15 V. Substituting across supply architectures is a redesign.
- **Quiescent current per amplifier.** Matters in battery designs and, in multi-channel packages, multiplies.
- **Output current.** Short-circuit current and the guaranteed linear output current differ. Driving a low-impedance load, a heavy filter network, or a cable termination needs the linear figure.
- **Channel count and pinout.** Single, dual and quad packages have standardised pinouts, but single-amplifier packages in SOT-23-5 vary, and some singles include a shutdown pin where another has a no-connect.

**Check:** supply range against your rails; quiescent current × channel count; guaranteed output current into the real load; pinout drawing rather than package name.

## A substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Minimum stable gain ≤ your noise gain | Immediate oscillation |
| 2 | Input common-mode range covers your CM voltage | Output stuck at a rail; phase inversion |
| 3 | RRI handover discontinuity outside your range | DC nonlinearity, hard to diagnose |
| 4 | I_bias × R_source within error budget | Offset error, possibly large |
| 5 | Offset drift over temperature | Accuracy loss at extremes |
| 6 | Capacitive load tolerance ≥ actual load | Oscillation, sometimes only when unprobed |
| 7 | GBW / gain ≥ required bandwidth | Signal chain too slow |
| 8 | Slew rate adequate at output amplitude | Large-signal distortion |
| 9 | Supply range and rails compatible | Does not operate |
| 10 | Pinout verified, including any shutdown pin | Floating input or wrong function |

## Instrumentation amplifiers add two more

For an in-amp specifically:

- **Gain-setting method.** External resistor, pin-strapped, or digitally programmable. The gain equation differs between parts even when both use a single external resistor — one may be `G = 1 + 49.4k/RG` and another `G = 5 + 80k/RG`. Reusing the original resistor produces the wrong gain.
- **CMRR at your gain and frequency.** In-amp CMRR is specified per gain setting and falls with frequency. A part with excellent CMRR at G=100 may be mediocre at G=1.

## Where these parts sit in the catalogue

Op-amps and instrumentation amplifiers cover roughly 28,300 part numbers. Devices such as `TLV2372IDGKR`, `OPA684IDBVT`, `OPA2834IDGKR`, `LMV831MGX/NOPB` and `BA15218N` span the range from precision CMOS to high-speed decompensated parts, and obsolete lines such as `AD8605ACB-REEL7` and `TY30533R2G` remain reachable through authorised aftermarket channels.

They are emphatically not interchangeable with one another. Confirm the current datasheet for whichever part you shortlist. Browse [op-amps and instrumentation amplifiers](/category/op-amps).

## FAQ

### Why does my replacement op-amp oscillate in a unity-gain buffer?

The most likely cause is that the replacement is decompensated — stable only above a minimum closed-loop gain such as 2, 5 or 10. Decompensated amplifiers trade unity-gain stability for higher bandwidth and slew rate, and the restriction appears in the datasheet as a minimum stable gain rather than in any indexed specification. The second most likely cause is capacitive loading at the output beyond what the replacement tolerates.

### What is the difference between rail-to-rail input and rail-to-rail output?

They are independent specifications. Rail-to-rail output means the output stage can swing to within millivolts of each supply rail. Rail-to-rail input means the input common-mode range extends across the full supply. A part can have either, both, or neither, and a datasheet that says only "rail-to-rail" usually means output. Substituting a part without rail-to-rail input into a ground-sensing single-supply circuit will not work.

### How much input bias current is acceptable?

It depends entirely on your source impedance, because the resulting error is bias current multiplied by source resistance. With a 1 MΩ source, a bipolar input drawing 100 nA produces 100 mV of error, while a CMOS input drawing 1 pA produces 1 µV. Compute the product against your error budget rather than judging the bias current figure on its own.

### Can an op-amp drive a capacitive load?

Only up to the limit stated in its datasheet, commonly somewhere between 50 pF and a few hundred picofarads for general-purpose parts. Capacitance at the output adds a pole inside the feedback loop and erodes phase margin. Long cables, ADC sampling networks and filter capacitors placed inside the loop all count. Where the load exceeds the limit, a small isolation resistor between the output and the capacitance is the usual remedy.

### How do I calculate the bandwidth I will actually get?

Divide the gain-bandwidth product by the circuit's noise gain. A 10 MHz gain-bandwidth amplifier configured for a gain of 100 yields roughly 100 kHz of closed-loop bandwidth. Check slew rate separately, since a circuit can have adequate small-signal bandwidth and still be slew-limited on large output swings: the maximum undistorted sine frequency is approximately the slew rate divided by 2π times the peak output voltage.

### Does noise gain differ from signal gain?

Yes, and stability depends on noise gain. An inverting amplifier configured for a signal gain of −1 has a noise gain of 2, because noise gain is set by the feedback network as seen from the amplifier's own inputs. This matters when checking a decompensated part's minimum stable gain: an inverting stage at −1 satisfies a "stable for gain ≥ 2" requirement, while a non-inverting unity-gain follower does not.

### Can I reuse the gain resistor when replacing an instrumentation amplifier?

Usually not. Instrumentation amplifiers use different internal resistor values, so the gain equation differs between parts even when both set gain with a single external resistor. Recalculate the resistor from the replacement's own gain equation, and check common-mode rejection at the new gain setting and at the frequencies present in your signal.

## Related reading

The general framework for analog substitutions — the tiers of equivalence, the qualification workflow, and when a last-time-buy beats requalification — is in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide). Precision analogue circuits are usually fed by a low-noise rail; if that rail is also changing, see [the LDO cross-reference guide](/blog/ldo-cross-reference-guide) for the PSRR and noise implications.

Send us the discontinued part number along with your gain, source impedance, load capacitance and supply rails, and we will return candidates that survive those constraints.

[**Submit an RFQ**](/rfq) | [**Browse op-amps**](/category/op-amps) | [**Upload a BOM**](/bom)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-08-02

