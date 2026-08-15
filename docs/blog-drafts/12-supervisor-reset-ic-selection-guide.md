---
title: "Supervisor and Reset IC Selection: The Timing Nobody Checks"
slug: "supervisor-reset-ic-selection-guide"
status: "draft"
seoTitle: "Supervisor & Reset IC Selection and Replacement Guide"
seoDesc: "Reset timeout, threshold tolerance, output type and watchdog behaviour decide whether a supervisor substitution is safe. Worked threshold-window maths and a verification procedure."
seoKeywords: "supervisor IC, reset IC, voltage supervisor replacement, reset timeout, brown-out detector, watchdog supervisor, power on reset"
tags: "supervisor IC, reset IC, brown-out, watchdog, second source, analog sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Analog & Power Sourcing"
relatedProducts: "DS1232SN+, TL7705ACDR, DS1813-15+, MIC826RYMT-TR, NCV308SN180T1G, BD49K33G-TL"
---

# Supervisor and Reset IC Selection: The Timing Nobody Checks

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: supervisor IC, reset IC, voltage monitor, brown-out, second source

---

<img src="/uploads/supervisor-reset-ic-selection-guide-hero.jpg" alt="Macro photography of a small 3-pin supervisor reset IC on a PCB located right next to a large processor chip." width="1200" height="630" fetchpriority="high" />

**A supervisor IC holds a processor in reset until its supply rail is valid, and releases it once the rail is stable.** It is a three-pin part that costs a few cents and, when substituted carelessly, produces the worst class of field failure: a board that starts correctly 199 times out of 200. This guide covers the four parameters that decide whether a supervisor substitution is safe, why threshold tolerance matters more than threshold value, and how to verify the result.

## Key takeaways

<img src="/uploads/supervisor-timing-diagram.jpg" alt="Stylized oscilloscope screen showing a voltage rail rising smoothly and a logic reset signal releasing after a clear time delay." width="800" height="450" loading="lazy" />

- **Reset timeout, not threshold voltage, is the parameter most often wrong** in a supervisor substitution. Options span microseconds to seconds across otherwise similar parts.
- Threshold **tolerance** stacks against your rail tolerance. A ±2.5% supervisor on a ±5% rail can leave no usable window at all.
- **Open-drain and push-pull outputs are not interchangeable.** Swapping one for the other either floats the reset line or fights another driver on it.
<img src="/uploads/watchdog-timer-concept-reset.jpg" alt="Conceptual graphic of a hardware watchdog timer IC resetting a microcontroller." width="800" height="450" loading="lazy" />

- Watchdog behaviour is a functional difference, not a feature difference: a supervisor with a watchdog dropped into a socket that never services it will **reset the board continuously**.
- Failures are **intermittent and temperature-dependent**, so bench testing at room temperature on one unit proves nothing. Test cold start across a batch.
- Around 45,800 supervisor and reset part numbers are available; the constraint is timing compatibility, not supply.

---

## What a supervisor actually guarantees

A processor executing instructions from a supply below its minimum operating voltage does not fail cleanly. It fetches corrupted instructions, writes corrupted data, and can leave non-volatile memory in an inconsistent state. The supervisor exists to make that impossible: it asserts reset while the rail is below threshold, and holds reset for a defined period *after* the rail becomes valid, giving oscillators time to start and internal logic time to settle.

Three distinct jobs, often conflated:

| Function | What it does | Typical part naming |
| --- | --- | --- |
| Power-on reset | Holds reset during ramp-up, releases after a timeout | "Reset IC", "POR" |
| Brown-out detection | Re-asserts reset if the rail sags mid-operation | "Voltage supervisor", "brown-out detector" |
| Watchdog | Resets if the processor stops servicing a timer | "Watchdog supervisor" |

Many devices combine two or three. That combination is exactly where substitutions go wrong, because a part offering a superset of functions is not automatically a safe replacement: an unserviced watchdog is a reset generator.

## 1. Reset timeout: the parameter most often wrong

Reset timeout is how long the supervisor keeps reset asserted after the supply crosses the threshold going up. It is the parameter most frequently mismatched in a substitution, because cross-reference tools index threshold voltage and rarely index timeout.

| Timeout range | Typical use |
| --- | --- |
| 1-20 µs | Simple logic, no oscillator to start |
| 1-20 ms | Most microcontrollers with internal oscillator |
| 100-200 ms | Crystal oscillator start-up, external memory |
| 1-2 s | Systems waiting on a slow peripheral rail or PLL lock |

The failure modes are asymmetric:

**Too short**: the processor is released before its crystal has stabilised or before a downstream rail is valid. This produces the classic intermittent cold-start hang: the crystal takes longer to start at low temperature, so a board that boots reliably on the bench fails at −20 °C, and only on units whose crystal happens to be slow.

**Too long**, usually benign, unless something else in the system times out waiting for the processor, or a sequencing requirement is violated.

Because "too short" fails intermittently and temperature-dependently, it survives casual bench testing and reaches the field.

**Check:** the original's timeout, the replacement's timeout, and (critically) the replacement's *minimum* timeout, since the specification is a range and the fast end is what will bite.

## 2. Threshold voltage and, more importantly, tolerance

A supervisor threshold has to sit in the window between the processor's minimum operating voltage and the rail's minimum normal voltage. That window is narrower than it looks once tolerances stack.

Worked example for a 3.3 V rail and a processor specified down to 3.0 V:

```
Processor minimum        = 3.00 V
Rail nominal             = 3.30 V
Rail tolerance ±5%       → normal minimum = 3.135 V

Usable threshold window  = 3.00 V ... 3.135 V     (135 mV wide)
```

Now apply supervisor tolerance. A part with a nominal 3.08 V threshold and ±2.5% accuracy:

```
Threshold range = 3.003 V ... 3.157 V
```

The top of that range, 3.157 V, is **above** the rail's normal minimum of 3.135 V. A unit at the high end of the threshold distribution will assert reset during normal operation whenever the rail sits at the low end of its tolerance. The design nuisance-resets on a small fraction of units.

The same nominal threshold with ±1% accuracy gives 3.049 V to 3.111 V — entirely inside the window, and safe.

This is why threshold tolerance matters more than threshold value. A substitution that keeps the nominal threshold but loosens the tolerance from ±1% to ±2.5% can convert a sound design into an intermittent one without changing a single headline number.

**Check:** compute the usable window from processor minimum and rail tolerance, then confirm the replacement's *full threshold range* fits inside it. Include the threshold's temperature drift.

## 3. Output type — open-drain versus push-pull

These are not interchangeable, and the failure is immediate rather than intermittent.

| Output type | Needs pull-up | Can share the reset net | Substituting the other way |
| --- | --- | --- | --- |
| Open-drain | Yes, external | Yes — wired-OR with other sources | Push-pull → open-drain: **reset line floats**, no pull-up on board |
| Push-pull | No | No — will fight another driver | Open-drain → push-pull: **contention** with debug pod or other supervisor |

Two specific hazards:

- Replacing an **open-drain** part with a **push-pull** one on a board where a debug probe, another supervisor, or a manual reset button also drives the reset net creates a hard short whenever the two disagree.
- Replacing a **push-pull** part with an **open-drain** one on a board that never had a pull-up resistor leaves reset floating. It may work (capacitive coupling and processor internal pull-ups can mask it) right up until it does not.

Also check **active polarity**. Active-low (`RESET`) is conventional, but active-high (`RESET`) parts exist and share package and pinout with their active-low siblings. The suffix in the part number is sometimes the only distinguishing mark.

**Check:** output structure, polarity, and whether the board provides a pull-up.

## 4. Watchdog behaviour

A watchdog supervisor that is never serviced will reset the board on every timeout, forever. If the original had no watchdog and the replacement does, the firmware has no code to kick it.

Some parts allow the watchdog to be disabled by tying its input to a rail; many do not. Where a watchdog exists, three parameters matter:

- **Timeout period** — must be longer than the worst-case interval between kicks, including interrupt-heavy paths and flash-write pauses.
- **Windowed versus simple**: a windowed watchdog requires the kick to arrive inside a time window, and rejects kicks that are *too early*. Firmware written for a simple watchdog will fail a windowed one.
- **Start-up delay** — some watchdogs are inhibited for a period after reset, giving firmware time to boot before the first kick is required. Substituting a part without that grace period can produce a reset loop that never lets the system boot.

**Check:** presence, disable method, timeout, windowed behaviour, start-up grace period.

## 5. Manual reset input and other extras

Where the original has a manual reset (`MR`) pin:

- Is it internally pulled up on the replacement, or does the board rely on an external resistor?
- Is it debounced internally, and over what period?
- Does the replacement even have the pin, or is that pin something else: a watchdog input, a threshold-select, or a no-connect that becomes a live input on the new part?

That last case is the dangerous one. A pin that was a no-connect on the original and is an active input on the replacement will float, and a floating CMOS input is a random number generator.

**Check:** every pin, including ones that were unused.

## A substitution checklist

| # | Item | Fails how |
| --- | --- | --- |
| 1 | Reset timeout ≥ original, minimum-end included | Intermittent cold-start hang |
| 2 | Full threshold range inside the usable window | Nuisance resets on some units |
| 3 | Threshold drift over temperature | Same, at temperature extremes |
| 4 | Output type matches board (pull-up present?) | Floating reset or driver contention |
| 5 | Polarity matches | Permanently held in or out of reset |
| 6 | Watchdog absent, or disabled, or serviced | Continuous reset loop |
| 7 | Manual reset pin behaviour | Spurious resets |
| 8 | Previously unused pins are still safe to leave unconnected | Floating input, random behaviour |

## How to verify it properly

Bench testing a supervisor at room temperature on one unit proves almost nothing, because the failures are distribution-dependent and temperature-dependent. A verification that actually catches problems:

1. **Slow ramp.** Bring the rail up over hundreds of milliseconds with a bench supply and confirm reset releases only after the threshold plus timeout. A slow ramp exposes supervisors that chatter near the threshold.
2. **Fast ramp.** Hot-plug the supply. Confirm the timeout still elapses fully.
3. **Brown-out.** Dip the rail below threshold for progressively shorter intervals (10 ms, 1 ms, 100 µs) and confirm reset asserts. Some supervisors miss short dips.
4. **Cold start across a batch.** At the minimum operating temperature, on at least ten units, power-cycle repeatedly. This is where a too-short timeout shows up.
5. **Rail at tolerance extremes.** Hold the rail at its minimum normal value and confirm no nuisance reset over an extended soak.

Steps 4 and 5 are the ones that catch the failures that otherwise reach the field.

## Where these parts sit in the catalogue

Supervisors and reset ICs account for roughly 45,800 part numbers in our catalogue: the third-largest analog family after linear regulators and DC-DC converters. Long-running devices such as `DS1232SN+`, `TL7705ACDR`, `DS1813-15+`, `MIC826RYMT-TR`, `NCV308SN180T1G` and `BD49K33G-TL` illustrate the spread: different threshold options, different timeout options, different output structures, different watchdog provision.

They are not a family in any interchangeable sense. As always, confirm the current datasheet for whichever part you shortlist. Browse [supervisors and reset ICs](/category/supervisors-reset).

## FAQ

### What does a supervisor IC do?

A supervisor IC monitors a supply rail and holds a processor or system in reset while that rail is outside its valid range. It asserts reset during power-up until the rail crosses a threshold, keeps reset asserted for a defined timeout afterwards so oscillators and internal logic can stabilise, and re-asserts reset if the rail later sags below the threshold. Many supervisors also provide a watchdog timer and a manual reset input.

### What is the difference between a reset IC and a voltage supervisor?

The terms overlap and are often used interchangeably. In practice "reset IC" tends to describe a simple power-on reset generator with a fixed timeout, while "voltage supervisor" usually implies continuous monitoring including brown-out detection during operation. Many parts do both. What matters for a substitution is the specific functions the original provided, not the marketing name.

### Why does my board hang intermittently at cold start?

A reset timeout that is too short is a common cause. Crystal oscillators take longer to start at low temperature, so if the supervisor releases reset before the oscillator is stable, the processor begins executing without a valid clock. Because start-up time varies between individual crystals and with temperature, the fault appears on a fraction of units and mostly in the cold, which is why it survives bench testing. Compare the replacement's minimum reset timeout against the original's, and test cold start across a batch.

### How accurate does a supervisor threshold need to be?

Accurately enough that its full threshold range fits between the processor's minimum operating voltage and the supply rail's minimum normal voltage. For a 3.3 V rail with ±5% tolerance and a processor rated to 3.0 V, the usable window is roughly 135 mV wide. A supervisor with ±2.5% accuracy around a 3.08 V nominal threshold can exceed that window at the high end and cause nuisance resets, while a ±1% part fits comfortably. Tolerance frequently matters more than nominal value.

### Can I replace an open-drain reset output with a push-pull one?

Not safely, if anything else drives the reset net. Open-drain outputs are designed to be wired together with other reset sources such as a debug probe, a manual button, or a second supervisor. A push-pull output actively drives both high and low, so it will fight any other driver on the net and can create a damaging short. Conversely, replacing push-pull with open-drain requires a pull-up resistor that the board may not have.

### What happens if a replacement supervisor has a watchdog and the original did not?

The watchdog will time out and reset the board repeatedly, because the firmware contains no code to service it. Some parts allow the watchdog input to be tied to a rail to disable it; many do not. Confirm both whether a watchdog is present and how it can be disabled before treating such a part as a replacement.

### How should I test a supervisor substitution?

Test slow supply ramps, fast ramps, and brown-out dips of decreasing duration to confirm reset asserts reliably. Then perform repeated cold-start power cycles at the minimum operating temperature across at least ten units, and soak the rail at its minimum normal voltage to confirm no nuisance resets. Single-unit testing at room temperature will not reveal the distribution-dependent and temperature-dependent failures that supervisors typically produce.

## Related reading

The general framework for analog substitutions — tiers of equivalence, qualification workflow, and when to buy through a last-time-buy window instead — is in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide). The rail the supervisor is watching is usually produced by an [LDO](/blog/ldo-cross-reference-guide) or a [DC-DC converter](/blog/dc-dc-regulator-replacement-guide), and a change to either can move the sequencing that the supervisor assumes.

Send us the discontinued part number with the threshold, timeout and output type you need, and we will return candidates that fit the window rather than just the voltage.

[**Submit an RFQ**](/rfq) | [**Browse supervisors & reset ICs**](/category/supervisors-reset) | [**Upload a BOM**](/bom)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-08-02

