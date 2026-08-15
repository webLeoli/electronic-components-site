---
title: "Comparator Selection: The Output Stage and the Hysteresis Are the Whole Job"
slug: "comparator-selection-guide"
status: "draft"
seoTitle: "Comparator Selection and Sourcing: Open-Collector vs Push-Pull, Hysteresis"
seoDesc: "Why an op-amp is not a comparator, how to size hysteresis, why pull-up resistors dominate edge speed, propagation delay dispersion, and what the LM193/293/393 suffixes actually mean."
seoKeywords: "comparator selection, open collector vs push pull comparator, comparator hysteresis calculation, LM393 vs LM339, LM311, propagation delay dispersion, op-amp as comparator, LT1016, TLV3501"
tags: "comparator, hysteresis, open collector, push-pull, propagation delay, oscillation, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Data Converters & Signal Chain"
relatedProducts: "LM393AD, LM339AN, LM311M/NOPB, LM2903N, TLV3501AIDBVRG4, LT1016CN8, ADCMP581BCPZ-RL7, LM397MF/NOPB"
---

# Comparator Selection: The Output Stage and the Hysteresis Are the Whole Job

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: output structures, hysteresis, propagation delay dispersion, oscillation, temperature grades, sourcing

---

**Two comparators with identical propagation delay, offset and supply range can behave completely differently on the same board, because one has an open-collector output and the other pushes and pulls.** The open-collector part needs a pull-up resistor, can be wired-OR with others, and can drive a rail higher than its own supply. The push-pull part does none of those things and will fight any other output tied to the same node. Our [analog comparator category](/category/analog-comparators) holds 4,403 part numbers with 1,273 no longer active (29%) and the vast majority of failed substitutions in it come down to the output stage, the absence of hysteresis, or a suffix letter that was assumed to mean quality and actually means temperature range.


<img src="/uploads/blog/comparator-selection-guide.webp" alt="Comparator IC beside a tiny hysteresis surface-mount resistor network" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **An op-amp is not a comparator.** It may work, slowly and unpredictably, and some op-amps are damaged by large differential inputs.
- **Open-collector and push-pull outputs are not interchangeable.** Wired-OR, level translation and the need for a pull-up all follow from this choice.
- **With an open-collector output, the pull-up resistor sets the rising edge**, not the comparator: 10 kΩ into 20 pF gives a 440 ns rise time regardless of a 4 ns propagation delay.
- **Hysteresis is external on most cheap comparators** and its absence causes multiple transitions and oscillation on slow inputs.
- **Propagation delay is specified at a stated overdrive.** At 5 mV of overdrive instead of 100 mV, real delay can be several times the datasheet number; this is dispersion.
- **`LM193`, `LM293` and `LM393` are the same circuit at three temperature ranges.** The letter is not a quality grade.
- **Single, dual and quad versions are different footprints.** `LM393` is dual; `LM339` is quad.

---

## An op-amp is not a comparator

They look substitutable on a schematic and are not. The differences are structural:

| | Comparator | Op-amp used as one |
| --- | --- | --- |
| Output | Designed to saturate; defined logic level | Saturates unpredictably, may not reach a valid logic level |
| Speed out of saturation | Nanoseconds to tens of nanoseconds | Microseconds; recovery from saturation is slow |
| Large differential input | Expected; rated for it | Some parts have **input clamp diodes** that conduct and can be damaged |
| Internal compensation | None — designed for open-loop switching | Compensated for closed-loop stability, which slows switching |
| Phase inversion | Not applicable | Some input stages invert on common-mode violation |

The failure mode that catches people is the input clamp. A number of op-amps include back-to-back diodes across the differential inputs to protect the input stage during closed-loop operation, where the differential voltage is nearly zero. Drive several volts across those inputs (normal for a comparator) and they conduct, loading the source and potentially exceeding the input current rating.

Going the other way is also a mistake: **a comparator is not an op-amp**, because it has no internal compensation and will oscillate in a closed feedback loop. If a substitution list mixes both, the parts are not alternates. What has to match when the amplifier really is an amplifier is covered in [op-amp equivalents](/blog/op-amp-equivalent-selection).

## Output structures

Establish which of four output types the socket expects.

| Output type | Needs pull-up? | Wired-OR | Can drive above own supply | Example in catalogue |
| --- | --- | --- | --- | --- |
| **Open collector / open drain** | Yes | **Yes** | Yes, up to the pull-up rail's limits | `LM393AD`, `LM339AN`, `LM311M/NOPB` |
| **Push-pull (CMOS/TTL)** | No | **No** | No | `TLV3501AIDBVRG4`, `MAX987ESA+` |
| **Complementary (Q and /Q)** | No | No | No | `LT1016CN8` |
| **ECL / PECL / LVDS** | Termination, not pull-up | No | No | `ADCMP581BCPZ-RL7`, `MAX9601EUP+`, `LMH7220MK` |

Three consequences worth knowing before ordering:

Replacing open-collector with push-pull breaks wired-OR. If two or more comparator outputs share a node (a common way to build a window comparator or an alarm bus) a push-pull part will drive against its neighbours. Best case the logic is wrong; worst case both output stages sink each other's short-circuit current continuously.

Replacing open-collector with push-pull breaks level translation. An open-collector output with its pull-up to 5 V converts a 3.3 V-supplied comparator's decision into a 5 V logic level for free. A push-pull output produces its own supply rail and nothing higher, so the level shift disappears and downstream logic may sit below its input threshold. If translation is genuinely needed, it becomes a separate part — see [level shifter selection](/blog/level-shifter-selection-guide).

Replacing push-pull with open-collector leaves the output floating unless a pull-up is added, which the board does not have. It usually still "works" during test because of stray leakage and the next stage's input structure, and then fails intermittently.

`LM311M/NOPB` deserves a specific note: its output stage has both collector and emitter brought out, so it can drive to a rail above or below its own supply and can be configured either way. **No modern push-pull part reproduces this**, which is why the `LM311` survives in level-shifting sockets that look trivially replaceable.

## The pull-up resistor sets your edge, not the comparator

With an open-collector output, the rising edge is an RC exponential. The device pulls down actively and releases; the pull-up charges the load capacitance.

```
τ = R_PULLUP × C_LOAD
rise time (10-90%) ≈ 2.2 × τ
```

With a 10 kΩ pull-up and 20 pF of load:

```
τ = 10 kΩ × 20 pF = 200 ns
rise ≈ 440 ns
```

A comparator with 4 ns of propagation delay in that circuit produces a 440 ns rising edge. Buying a faster open-collector comparator changes nothing. Options are a smaller pull-up (more current, more power), a push-pull output part, or an active pull-up.

The arithmetic runs the other way too: **1 kΩ into 20 pF gives 44 ns**, at the cost of 3.3 mA from a 3.3 V rail whenever the output is low. On a battery product that is often the reason the pull-up is large and the edge is slow by design.

## Hysteresis, and why it is not optional

Without hysteresis, a comparator switches multiple times whenever the input crosses the threshold slowly, because noise and the comparator's own output-to-input coupling take it back and forth. On a slowly changing signal (a temperature sensor, a battery voltage, a light level) the result is a burst of transitions per crossing, which downstream logic counts as many events.

Positive feedback from the output to the non-inverting input creates the hysteresis band. For an open-collector or push-pull output swinging V_SWING, with R1 from output to the non-inverting input and R2 from the reference to the same node:

```
V_HYST ≈ V_SWING × R1 / (R1 + R2)
```

With a 3.3 V swing, R1 = 1 kΩ and R2 = 100 kΩ:

```
V_HYST = 3.3 V × 1 / 101 = 32.7 mV
```

Size the band against the noise, not against a rule of thumb. If the input carries 5 mV RMS of noise, a 33 mV band is roughly ±3σ around the threshold and will produce clean single transitions. A 5 mV band will not.

Three notes:

- **Some comparators have internal hysteresis**, often a few millivolts, sometimes pin-programmable. Substituting a part with internal hysteresis into a circuit that also has external positive feedback adds the two together and moves both thresholds.
- **Substituting a part *without* internal hysteresis for one that had it** removes the band entirely, and the symptom appears only on slow input transitions, which bench testing with a signal generator usually misses.
- **Hysteresis shifts the effective threshold** by half the band in each direction. In a precision trip point, that offset has to be accounted for.

## Propagation delay, overdrive and dispersion

Propagation delay is quoted at a specific input overdrive, and it degrades sharply as overdrive falls.

| Overdrive above threshold | Typical delay behaviour |
| --- | --- |
| 100 mV | The datasheet number |
| 20 mV | Noticeably longer |
| 5 mV | Can be several times the datasheet number |

This variation is **dispersion**, and it matters in any application where the timing of the decision is the measurement: zero-crossing detection, time-of-flight, current-limit trip timing, or a phase detector. **Two comparators with the same "10 ns propagation delay" headline can differ by tens of nanoseconds at 5 mV overdrive.**

For sourcing purposes: if the original part's datasheet has a delay-versus-overdrive curve and the candidate's does not, the candidate is uncharacterised for a timing-critical socket. Where timing precision is the point, the fast complementary and ECL-output parts exist for the purpose (`LT1016CN8`, `ADCMP581BCPZ-RL7`, `MAX9601EUP+`) and they bring termination requirements with them, as described in [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide).

## Input specifications that end substitutions

Common-mode range is the one to check first.

- **Does the range include the negative rail?** Many single-supply comparators specify a common-mode range from ground to V+ − 1.5 V. A design that compares a signal near ground works; one that compares near the top rail does not.
- **Rail-to-rail input parts exist** and are not the default. Substituting a non-rail-to-rail part into a socket that used the full range produces a comparator that simply stops responding near one end.
- **Input offset voltage** sets the accuracy of the trip point, and offset drift sets how much it moves over temperature. A 5 mV offset on a 100 mV trip point is a 5% error.
- **Input bias current** into a high-impedance divider adds offset: 100 nA into a 100 kΩ divider is 10 mV.
- **Differential input voltage rating**, which for a comparator should be at least the supply span; check it if the inputs can be driven far apart during a fault.
- **Latch or enable pins**, present on some fast comparators, which need defined levels. An unconnected latch input floats and the output freezes unpredictably.

## Package and channel-count traps

The family names encode channel count and the footprints differ.

| Part | Channels | Package family |
| --- | --- | --- |
| `LM397MF/NOPB` | Single | SOT-23-5 class |
| `LM393AD`, `LM2903N` | Dual | 8-pin |
| `LM339AN`, `LMV339M` | Quad | 14-pin |
| `LM319M` | Dual, faster | 14-pin |

And the suffix letters are temperature ranges, not grades. `LM193`, `LM293` and `LM393` are the same comparator specified over military, industrial and commercial ranges respectively; `LM2903` is the automotive-oriented variant of the same dual. We hold 27 `LM193` part numbers, 142 `LM2903` and 85 `LM393`. **A BOM line reading "LM393 or equivalent" is under-specified for anything that has to work at −40 °C**, which is exactly the kind of finding [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) is for.

The additional letter before the package code (`LM339` versus `LM339A`) typically tightens offset voltage. That is a real specification difference within the same footprint and temperature range.

## Layout: why the replacement oscillates

A comparator that oscillates is usually a layout problem, and a substitution can expose one that was always marginal.

The mechanisms:

- **Supply impedance.** The output stage's switching current flows through the supply pins. Without local decoupling, the supply moves, and that movement couples into the input stage. A faster replacement makes it worse in direct proportion to its edge rate.
- **Output-to-input coupling.** A fast edge on a track running beside the input causes retriggering. This is why hysteresis and layout are the same discussion.
- **Shared ground return** between the output load current and the reference divider.
- **Unterminated or long input runs** picking up the output edge.

The practical implication for sourcing: a faster comparator is not a safe upgrade. Replacing a 1 µs part with a 10 ns part on an unmodified 1990s board frequently produces oscillation that was never possible before, and the part gets blamed. Fit the speed to the requirement, add hysteresis, and decouple locally.

## Sourcing notes

29% of the category is no longer active, and the pattern is familiar: the ubiquitous industry-standard parts remain available from several sources, while the specialised fast and precision parts are the ones that disappear.

| Family prefix | Parts held | Not active |
| --- | ---: | ---: |
| `MAX9…` | 1,091 | 578 |
| `TLC3…` | 174 | 9 |
| `TLV3…` | 169 | 3 |
| `LT1…` | 131 | 13 |
| `LM211` | 25 | 4 |
| `LM111` | 24 | 1 |

The Maxim `MAX9xxx` line stands out at 578 of 1,091 inactive: the specialised comparators, window comparators and precision parts. Currently in last-time-buy status here: `LT1016CN8`, `LT1116CN8`, `LT319AN`, `LM393DGKRG4`, `LM293ADGKRG4` and `ISL21440IRTZ`. Obsolete but supplied through the authorised aftermarket: `LM2901DG`, `LM239DG`, `KA339DTF`, `MAX932EPA+`, `MAX9034AUD`, `MAX9040BEUK+` and `LMH7220MK`.

Two channel observations:

- **The jellybean duals and quads are the easy case.** `LM393`, `LM339` and `LM2903` are made by several manufacturers, and our catalogue holds them from Texas Instruments, onsemi, STMicroelectronics and Rochester Electronics among others. Multi-sourcing here is genuinely straightforward: the rare good news in this cluster.
- **`SCV2903DR2G` is supplied by Flip Electronics**, one of the licensed continuity manufacturers. For a discontinued jellybean, that channel and the authorised aftermarket are both preferable to open-market purchase, for the reasons set out in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

For incoming inspection, measure the trip point in both directions to confirm offset and any internal hysteresis, verify the output structure by checking whether the output can be pulled above the supply, and measure propagation delay at the overdrive your application actually provides rather than at 100 mV. Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Output structure: open-collector, push-pull, complementary, ECL | Contention, floating output, lost level shift |
| 2 | Wired-OR connections on the output node | Outputs fight each other |
| 3 | Pull-up present and sized for the required edge | Slow or missing rising edge |
| 4 | Internal hysteresis present or absent | Multiple transitions on slow inputs |
| 5 | External hysteresis network still correct | Shifted trip points |
| 6 | Input common-mode range, including rails | No response near one rail |
| 7 | Input offset voltage and drift | Trip point error |
| 8 | Input bias current into the divider | Threshold offset |
| 9 | Differential input voltage rating | Damage during a fault |
| 10 | Propagation delay at the real overdrive | Timing error, dispersion |
| 11 | Latch/enable pin levels defined | Output freezes |
| 12 | Channel count and package | Wrong footprint |
| 13 | Temperature suffix (`LM193`/`293`/`393`) | Out of specification at temperature |
| 14 | Local decoupling adequate for a faster part | Oscillation |

## FAQ

### Can I use an op-amp as a comparator?

Only where speed and output level are uncritical, and only after checking the input structure. Op-amps are internally compensated for closed-loop stability, so they switch slowly and recover from saturation slowly, and their saturated output may not reach a valid logic level. More seriously, many op-amps include back-to-back clamp diodes across the differential inputs; a comparator application drives several volts across those inputs, which makes them conduct, loads the source and can exceed the input current rating. The reverse substitution is worse: a comparator has no internal compensation and will oscillate in a feedback loop.

### What is the difference between open-collector and push-pull comparator outputs?

An open-collector or open-drain output can only pull down; an external pull-up provides the high level, which means the output can be tied to a rail higher than the comparator's own supply and several outputs can be wired together for a logical OR. A push-pull output actively drives both levels, gives fast edges without a pull-up, and must not share a node with another output. Substituting one for the other removes either the level-shifting and wired-OR capability, or the pull-up the board never had.

### Why is my comparator's output edge so much slower than its propagation delay?

Because with an open-collector output the pull-up resistor and load capacitance form an RC that sets the rising edge. The time constant is the pull-up resistance times the load capacitance, and the 10-90% rise time is roughly 2.2 time constants, so 10 kΩ into 20 pF gives about 440 ns no matter how fast the comparator is. Reduce the pull-up, accept the extra current, or use a push-pull output part. Falling edges are fast because the device drives them actively.

### How much hysteresis does a comparator need?

Enough to exceed the input noise around the threshold, typically several times the RMS noise. Using positive feedback from output to non-inverting input, the band is approximately the output swing times R1/(R1+R2), so with a 3.3 V swing, 1 kΩ and 100 kΩ you get about 33 mV, which comfortably covers 5 mV of input noise. Remember that hysteresis moves the effective thresholds by half the band in each direction, which matters if the trip point itself is a specification.

### What is propagation delay dispersion?

The variation of propagation delay with input overdrive. Datasheets quote delay at a stated overdrive, often 100 mV; at 5 mV of overdrive the same part can take several times longer to decide. In applications where the timing of the decision is the measurement (zero-crossing detection, time-of-flight, current-limit response) dispersion rather than the headline delay determines accuracy. If a candidate part has no delay-versus-overdrive curve, treat it as uncharacterised for that use.

### Do LM193, LM293 and LM393 differ in quality?

No, they differ in specified temperature range: military, industrial and commercial respectively, with `LM2903` being the automotive-oriented variant of the same dual comparator. The circuit is the same. An additional letter such as the `A` in `LM339A` usually indicates tighter input offset voltage within the same footprint and temperature range. A BOM line that says only "LM393" is therefore under-specified for equipment that must operate at −40 °C.

### Why did my board start oscillating after I fitted a faster comparator?

Because the faster edges expose a layout that was always marginal. The output stage's switching current flows through the supply pins, so with inadequate local decoupling the supply moves and couples into the input stage; fast output edges also couple capacitively into nearby input tracks. A 1990s board designed around a microsecond-class comparator often has neither the decoupling nor the input/output separation for a 10 ns part. Match the speed to the requirement, add hysteresis, and decouple at the pins.

### Which comparators in your catalogue are hardest to source?

The specialised fast and precision parts rather than the jellybeans. Of parts beginning `MAX9`, 578 of 1,091 are no longer active. `LT1016CN8`, `LT1116CN8`, `LT319AN`, `LM393DGKRG4`, `LM293ADGKRG4` and `ISL21440IRTZ` are in last-time-buy status, and `LMH7220MK`, `MAX9034AUD`, `MAX932EPA+`, `LM2901DG` and `LM239DG` are obsolete. By contrast the standard duals and quads (`LM393`, `LM339`, `LM2903`) remain available from multiple manufacturers, which makes them genuinely easy to multi-source.

## Related reading

Cluster pillar: [data converter sourcing](/blog/data-converter-sourcing-guide). Where a threshold is not enough and you need a number, [ADC sourcing](/blog/adc-sourcing-guide); where the signal has to be routed first, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide); where the threshold itself must be accurate, [voltage reference selection](/blog/voltage-reference-selection-guide).

Adjacent: [op-amp equivalents](/blog/op-amp-equivalent-selection) for the amplifier that is genuinely an amplifier, [level shifter selection](/blog/level-shifter-selection-guide) when the output level has to change domains, and [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for the case where the comparator you were about to design already exists as a product.

Send us the part number with the output type, trip point and overdrive you are working with, and we will come back with candidates that behave the same way on your board.

[**Submit an RFQ**](/rfq) | [**Browse comparators**](/category/analog-comparators) | [**Upload a BOM**](/bom)
