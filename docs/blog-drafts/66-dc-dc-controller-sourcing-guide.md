---
title: "DC-DC Controllers: The Feedback Reference Voltage Decides Whether Your Divider Still Works"
slug: "dc-dc-controller-sourcing-guide"
status: "draft"
seoTitle: "DC-DC Switching Controller Sourcing: UC3842 Family, Reference Voltage, VR Controllers"
seoDesc: "11,167 controller part numbers, 30% inactive. Why UC3842 and UC3844 are not alternates, how a 0.6 V vs 0.8 V reference breaks your feedback divider, and why CPU VR controllers die with the socket."
seoKeywords: "DC-DC controller sourcing, UC3842 vs UC3844 UVLO, feedback reference voltage divider, ISL6565 obsolete, multiphase VR controller replacement, current mode vs voltage mode, UCC3813 last time buy"
tags: "DC-DC controllers, UC3842, feedback reference, current mode, VR controllers, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "UC3843AD8, UC2843ADW, SG3524DRE4, UCC3813N-0G4, UCC2800NG4, ISL6420AIAZ, ISL6565BCB-T, TPS53667RTAR"
---

# DC-DC Controllers: The Feedback Reference Voltage Decides Whether Your Divider Still Works

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: reference voltage, UVLO and duty limits, control modes, compensation, VR controllers, obsolescence

---

**A switching controller's internal reference voltage sets the output voltage through your feedback divider, and the value is not standardised.** Controllers exist with 0.6 V, 0.8 V, 1.0 V, 1.25 V, 2.5 V and 5.0 V references. Fit a 0.6 V-reference part where a 0.8 V one was, keep the divider, and the output drops from 3.3 V to 2.48 V: the supply comes up, the rails are wrong, and the processor either browns out or runs out of specification. That is one of five substitution traps in a category holding **11,167 part numbers with 3,350 no longer active (30%)**, where the classic PWM controllers are still made, the CPU voltage-regulator controllers are 78% gone, and a familiar family name hides incompatible duty-cycle limits.

## Key takeaways

- **The internal reference sets V_OUT through your divider.** A different reference means a different divider, always.
- **`UC3842` and `UC3844` share a pinout and have different maximum duty cycles** — one is limited to roughly 50%, which will not start a supply designed for the other.
- **The first digit of a `UC1842`/`UC2842`/`UC3842` number is the temperature range**, not a revision.
- **Control mode is not substitutable.** Voltage mode and peak-current mode need different compensation, and current mode needs a sense element the board may not have.
- **The compensation network belongs to the controller**, not the converter: transconductance, ramp slope and slope compensation are all internal.
- **CPU and memory VR controllers die with their socket generation** — `ISL65xx` runs 286 of 365 part numbers inactive (78%).
- **Gate drive current must match the FET's gate charge**, or the switching losses land in the FET.

---

## The reference voltage trap, worked

The controller regulates its feedback pin to an internal reference. Your divider scales the output down to that reference.

```
V_OUT = V_REF × (1 + R1/R2)
```

For a 3.3 V output from an 0.8 V reference:

```
R1/R2 = (3.3 / 0.8) − 1 = 3.125     e.g. R1 = 31.25 kΩ, R2 = 10 kΩ
```

Now fit a controller with a 0.6 V reference and leave the divider alone:

```
V_OUT = 0.6 × (1 + 3.125) = 2.48 V
```

A 25% error, with no fault indication. The supply starts, regulates perfectly, and delivers the wrong voltage. Worse, the failure is silent on a bench test that only checks "does the rail come up".

The same arithmetic runs the other way: a 1.0 V reference in the same divider gives 4.13 V, which on a 3.3 V logic rail is destructive.

Two related checks:

- **Feedback pin polarity and topology.** Some controllers regulate an inverting error amplifier input against an internal reference; others take a resistor-programmed current. They are not wired the same way.
- **Reference tolerance**, which becomes output tolerance directly. A ±2% reference on a 1.2 V core rail is ±24 mV before load regulation, and processor core rails often specify ±3% total.

## UC3842 and its family: same pinout, different behaviour

The `UC384x` series is the most-used PWM controller lineage ever made, and the family members are not alternates.

| Part | UVLO on / off (typical) | Maximum duty cycle |
| --- | --- | --- |
| `UC3842` | ~16 V / 10 V | ~100% (toggle-free) |
| `UC3843` | ~8.4 V / 7.6 V | ~100% |
| `UC3844` | ~16 V / 10 V | **~50%** |
| `UC3845` | ~8.4 V / 7.6 V | **~50%** |

Two independent axes hide in four part numbers: **UVLO thresholds** (high for bootstrap-from-auxiliary-winding designs, low for designs with a housekeeping supply) and **maximum duty cycle** (the `44`/`45` parts include a toggle flip-flop that halves it, for forward converters where duty must not exceed 50%).

Fit a `UC3844` where a `UC3842` was and a flyback that needs 60% duty at low line simply will not start under load. Fit a `UC3843` where a `UC3842` was and the supply may start before the bootstrap winding can sustain it, producing hiccup at power-up.

And the first digit is the temperature grade: `UC1842` is the military range, `UC2842` industrial, `UC3842` commercial. In our catalogue `UC2843ADW` and `UC3843AD8` are both active, the same die, different qualification. A BOM line reading "UC3843 or equivalent" is under-specified for an industrial product, which is exactly the kind of finding [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) exists for.

The lineage remains healthy overall (268 `UC38xx` part numbers with 110 inactive) but the **`UCC38xx` low-power successors are where the last-time-buy notices are**: `UCC3813N-0G4`, `UCC2800NG4` and `UCC3808N-2G4` are all last-time buy in our catalogue, and `UCC28230PWR` is obsolete.

## Control mode: voltage, peak current, or something newer

Control mode determines what the board needs and how the loop is compensated. It is not a preference.

| Mode | Needs a current sense? | Compensation | Characteristic |
| --- | --- | --- | --- |
| **Voltage mode** | No | Type III (three poles) usually required | Simple power stage, complex compensator |
| **Peak current mode** | **Yes** — resistor or transformer | Type II usually sufficient | Inherent cycle-by-cycle current limit; needs slope compensation above 50% duty |
| **Valley / average current mode** | Yes | Type II | Better at high duty |
| **Constant on-time / hysteretic** | Sometimes | Minimal | Fast transient, variable frequency |
| **Digital / PMBus multiphase** | Yes, integrated | Configured in registers | Telemetry, but a firmware dependency |

Three substitution consequences:

Peak current mode replacing voltage mode requires a sense element (a resistor in the source or a current transformer) that a voltage-mode design does not have. Without it the controller sees no current ramp and either runs at minimum duty or trips.

Voltage mode replacing peak current mode loses the inherent current limit that the original design may have relied on for short-circuit protection, and needs a redesigned compensator.

Sub-harmonic oscillation appears above 50% duty in peak current mode unless slope compensation is added, and the amount of internal slope compensation differs between controllers. **A "compatible" current-mode controller with less internal slope compensation can oscillate in a design that ran stable for years** — visible as alternate-cycle pulse widths on the switch node.

## The compensation network belongs to the controller

The external compensation components were chosen for the original controller's error amplifier, and that amplifier's type and gain are internal.

| Property | Why it changes the network |
| --- | --- |
| **Voltage-error amplifier vs transconductance (g_m) amplifier** | A g_m stage drives compensation to ground; a voltage amplifier uses feedback around it. **The topology of the network is different.** |
| g_m value (µS) | Sets the compensator's gain |
| Internal ramp amplitude | Sets the modulator gain |
| Slope compensation | Affects phase margin above 50% duty |
| Switching frequency | Moves every pole and zero relative to the crossover |

This is why "pin-compatible" is a weak claim for a controller. The pins can match and the loop can be unstable, and instability may only appear at a particular load step, temperature or input voltage: the least likely thing to be found in incoming test.

The practical protocol for a controller substitution is: check reference, check mode, check gate drive, then **measure the loop**. A load-step test with a scope on the output, at minimum and maximum input voltage and at full load, catches most of it. If the design is safety-related or high volume, a Bode measurement is not optional.

## Gate drive: matching the driver to the FET

A controller with integrated drivers specifies peak source and sink current, and that determines switching loss in your FET.

```
switching time ≈ Q_G / I_DRIVE

Q_G = 30 nC, I_DRIVE = 1 A   → 30 ns
Q_G = 30 nC, I_DRIVE = 0.2 A → 150 ns
```

At 300 kHz, five times the switching time means five times the switching loss in the FET, which lands as heat in a package chosen for the original figure. A controller with weaker drivers is not a like-for-like replacement unless the FET is re-evaluated, and the specifications that matter on the driver side are set out in [gate driver selection](/blog/gate-driver-selection-guide).

Also check:

- **Bootstrap arrangement** for high-side drive, and whether the controller provides the diode internally.
- **Dead time**, fixed or adaptive. Removing dead time from a synchronous design causes shoot-through.
- **Enable, soft-start and pre-bias behaviour.** A replacement that cannot start into a pre-biased output will fight another supply during sequencing: the ordering problem in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).

## VR controllers: bound to a socket generation

The multiphase controllers that power CPUs, GPUs and memory are the most obsolescence-exposed parts in this category, because they implement a specification that expires.

In our catalogue the Intersil `ISL65xx` prefix holds 365 part numbers with **286 inactive — 78%**. `ISL6565BCB-T` and `ISL6420AIAZ` are obsolete; `ISL6327ACRZ`, `ISL6545CRZ` and `ISL6545ACRZ-T` are last-time buy. Similar patterns run through `IR3640MTRPBF` (obsolete), `NCP81118MNTXG` (obsolete) and `CHL8103-10CRT` (obsolete).

Why they disappear faster than general-purpose controllers:

- **They implement a voltage-identification protocol** (VID, SVID, PMBus, AVSBus) defined by a processor generation. When the socket is discontinued, the protocol has no other customer.
- **Phase count, current balancing and telemetry scaling** are designed around a specific power stage and driver pairing.
- **The default output voltage and slew rates are often OTP-programmed**, so the part number encodes a configuration, in the same way described in [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide).

There is no cross-vendor equivalent for a VID-compliant controller. For a legacy industrial board built around a PC chipset, the realistic options are a last-time buy — see [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), or a redesign to a fixed-output multiphase or single-phase supply if the processor's VID can be strapped to a constant. `TPS53667RTAR` and `TPS53667RTAT` are active examples of the modern PMBus generation, but they are not drop-in for anything.

## Sourcing notes

Vendor concentration tells you where to look: Linear Technology 2,061 part numbers, Rochester Electronics 1,924, Texas Instruments 1,681, ABLIC 1,160, Maxim Integrated 1,005, Intersil 714.

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `LTC38xx` | 906 | 109 | 12% |
| `UCC28xx` | 261 | 31 | 12% |
| `TPS40xx` | 209 | 14 | 7% |
| `UC38xx` | 268 | 110 | 41% |
| `LM50xx` | 160 | 50 | 31% |
| `MAX17xx` | 159 | 68 | 43% |
| **`ISL65xx`** | 365 | **286** | **78%** |

Three practical points:

Rochester Electronics carries a large share of the legacy PWM controllers, which means original-die supply for `UC3843AD8`-class parts rather than equivalents — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Watch for Fujitsu, Spansion and Intersil brands on old power designs. `MB3775PFV-G-BND-EFE1` is obsolete in our catalogue and is the kind of part (a Fujitsu-lineage dual PWM controller) with no equivalent at all. Where a controller like that is gone, the replacement is a redesign around a current part, and the cost of that redesign is what the last-time-buy decision is weighed against.

`NCV3012DTBR2G` appears from Flip Electronics, one of the licensed continuity manufacturers, alongside the Rochester supply. Both are authorised channels and materially different from open-market purchase.

For **incoming inspection**, controllers are function-testable on a bench jig: verify the reference voltage at the feedback pin under closed-loop conditions, check UVLO thresholds by ramping the supply, confirm maximum duty cycle by shorting the feedback pin to ground, and observe gate drive rise time into a known capacitance. **That duty-cycle test is the one that distinguishes a `UC3842` from a `UC3844`**, which no visual inspection can do. Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Internal reference voltage vs the feedback divider | Wrong output voltage, silently |
| 2 | Reference tolerance against the rail's specification | Rail out of tolerance |
| 3 | Maximum duty cycle (`42`/`43` vs `44`/`45`) | Supply will not start under load |
| 4 | UVLO thresholds vs the bootstrap arrangement | Hiccup at power-up |
| 5 | Temperature grade (first digit of `UC1/2/3`) | Out of specification at extremes |
| 6 | Control mode, and the sense element it requires | No regulation, or lost current limit |
| 7 | Slope compensation above 50% duty | Sub-harmonic oscillation |
| 8 | Error amplifier type (voltage vs transconductance) | Compensation network topology wrong |
| 9 | Switching frequency vs the magnetics | Saturation, or excessive ripple |
| 10 | Gate drive current vs FET gate charge | Switching losses land in the FET |
| 11 | Dead time, fixed or adaptive | Shoot-through in a synchronous stage |
| 12 | Soft-start and pre-bias start-up behaviour | Fighting another supply during sequencing |
| 13 | VID/PMBus protocol version | No communication with the processor |

## FAQ

### Why did my output voltage change after replacing the DC-DC controller?

Almost certainly because the new controller has a different internal reference voltage. The output is set by V_REF × (1 + R1/R2), so a divider designed for a 0.8 V reference produces 3.3 V with that part and 2.48 V with a 0.6 V-reference part: a 25% error with no fault indication, since the loop is regulating correctly to the wrong target. References of 0.6 V, 0.8 V, 1.0 V, 1.25 V and 2.5 V are all common. Recalculate the divider for every controller substitution.

### Are UC3842 and UC3844 interchangeable?

No, despite sharing a pinout. The `44` and `45` variants include a toggle flip-flop that limits maximum duty cycle to roughly 50%, intended for forward converters, while the `42` and `43` allow close to 100%. A flyback needing 60% duty at low line will not start under load with a `UC3844` fitted. The `42`/`44` pair also has high UVLO thresholds around 16 V for bootstrap designs, while `43`/`45` are around 8.4 V, so swapping across that axis causes start-up hiccup instead.

### What does the first digit in UC1842, UC2842 and UC3842 mean?

Temperature range, not revision or feature level. `UC1xxx` is the military range, `UC2xxx` industrial and `UC3xxx` commercial, with the same die inside. It matters for qualification rather than function, but a BOM line specifying only "UC3842" for equipment that must operate at −40 °C is under-specified. Our catalogue holds both `UC2843ADW` and `UC3843AD8` as active parts, so the choice is available.

### Can I replace a voltage-mode controller with a current-mode one?

Only with a circuit change. Peak current mode needs a current sense element (a resistor in the switch source, or a current transformer) which a voltage-mode design does not have, so without it the controller sees no ramp and cannot modulate. It also needs slope compensation above 50% duty to avoid sub-harmonic oscillation, and the amount provided internally varies by part. In the other direction, moving from current mode to voltage mode loses the inherent cycle-by-cycle current limit that may have been the design's short-circuit protection.

### Why is my supply unstable with a pin-compatible controller?

Because the compensation network was designed for the original controller's error amplifier. A transconductance amplifier drives its compensation network to ground; a conventional voltage-error amplifier uses feedback around it — different topologies entirely. Even between two transconductance parts, the g_m value, internal ramp amplitude, slope compensation and switching frequency all move the loop's poles, zeroes and crossover. After any controller substitution, do a load-step test at minimum and maximum input voltage and full load, and measure the loop properly if the design is safety-related or high volume.

### What replaces an obsolete CPU voltage-regulator controller?

Usually nothing directly. Multiphase VR controllers implement a voltage-identification protocol defined by a processor generation (VID, SVID, PMBus or AVSBus) with phase counts, current balancing and telemetry scaling designed around specific power stages, and often an OTP-programmed configuration. When the socket generation ends, so does the part, and no cross-vendor equivalent exists. In our catalogue the `ISL65xx` prefix runs 78% inactive. The realistic options are a last-time buy sized to the product's remaining life, or a redesign to a fixed-output supply if the processor's VID pins can be strapped.

### How do I know whether a controller's gate drive is strong enough?

Divide the FET's total gate charge by the driver's peak current to get an approximate switching time: 30 nC with 1 A of drive is about 30 ns, while the same FET with 200 mA takes about 150 ns. Switching loss scales with that time, so a five-fold increase puts five times the switching loss into a FET and package chosen for the original figure. If the replacement controller has weaker drivers, either accept the thermal penalty after calculating it, or change the FET to one with lower gate charge.

### How can incoming inspection distinguish a UC3842 from a UC3844?

Short the feedback pin to ground so the controller demands maximum duty, and measure the duty cycle at the output pin. A `UC3842` or `UC3843` will approach 100%; a `UC3844` or `UC3845` will sit near 50%. Ramping the supply voltage while watching for output activity separates the high-UVLO parts from the low-UVLO ones. Both tests take minutes on a simple jig and catch a class of substitution error that no visual or X-ray inspection can detect.

## Related reading

This cluster's other power articles: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide) for integrated-FET parts, [power distribution and hot-swap switch sourcing](/blog/power-switch-hot-swap-sourcing-guide), [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide), [AC-DC offline switcher sourcing](/blog/ac-dc-offline-switcher-sourcing-guide), and [LDO cross-reference](/blog/ldo-cross-reference-guide).

Adjacent: [gate driver selection](/blog/gate-driver-selection-guide) for the drive side, [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for sequencing, [voltage reference selection](/blog/voltage-reference-selection-guide) where the reference is external.

Send us the part number with your feedback divider values and the output voltage you need, and we will check the reference before quoting; it is the fastest way to eliminate wrong answers.

[**Submit an RFQ**](/rfq) | [**Browse DC-DC controllers**](/category/dc-dc-switching-controllers) | [**Upload a BOM**](/bom)
