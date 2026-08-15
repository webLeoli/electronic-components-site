---
title: "Supervisor IC vs Internal Brown-Out Detect vs RC Reset: Getting Reset Right"
slug: "supervisor-vs-internal-bor-vs-rc-reset"
status: "draft"
seoTitle: "Supervisor IC vs Internal BOR vs RC Reset: The Threshold Arithmetic"
seoDesc: "An RC network does not monitor voltage — it only delays, so it gives no protection on a slow ramp or a brownout. The threshold-accuracy budget that decides whether internal BOR is sufficient."
seoKeywords: "supervisor IC vs brown-out reset, external voltage supervisor necessary, BOR threshold accuracy, RC reset circuit problem, reset timeout oscillator startup, MAX809 obsolete, TPS3839 supervisor"
tags: "comparison, reset circuits, supervisors, power sequencing, hardware design, functional safety"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Hardware Design & Integration"
relatedProducts: "MAX809RTR, MAX6376UR22-T, ADM708TAR, TPS3808G09DBVR, TPS3839G12DBZT, TPS3839G33DBZT, TL7705ACDR, NCP302LSN18T1G"
---

# Supervisor IC vs Internal Brown-Out Detect vs RC Reset: Getting Reset Right

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: why an RC network is not a reset circuit, the threshold-accuracy budget, the BOR chatter region, multi-rail monitoring, availability by generation

---

**An RC network on a reset pin does not monitor the supply. It delays, and a delay is not protection.** That single distinction accounts for most of the reset circuits that pass on the bench and produce field returns, because the two failure modes that matter (a slow supply ramp and a brownout dip) are exactly the ones a capacitor cannot see.

The real question in a new design is narrower and computable: **is the microcontroller's internal brown-out detector accurate enough, and does it monitor the right rails?** Sometimes yes. This article gives the arithmetic that decides, and it matters because getting it wrong produces the class of fault diagnosed in [the board does not boot](/blog/board-does-not-boot-diagnosis), a healthy board held in reset, or an unhealthy one released from it.

There is an availability dimension too, and it follows the pattern we keep measuring: the classic supervisor is going, the modern one is not. Measured 2026-08-11, `MAX6376` is **68% inactive**, `ADM708` 63%, `DS1813` 55%, `MAX809` 50%, while `TPS3808`, `TPS3839`, `TPS3890`, `MCP100` and `MCP130` all measure **0%**.

## Key takeaways

- **An RC reset provides no protection against a slow ramp or a brownout**, because the capacitor holds its charge. It only stretches a rising edge.
- **The deciding calculation is a threshold-accuracy budget**: the reset threshold must sit above the device's minimum operating voltage and below the rail's minimum in-tolerance value, across the whole tolerance band.
- **Internal BOR has a chatter region.** Microchip documents that with `VDD` between `VBOR − 25 mV` and `VBOR`, a brown-out reset may occur repeatedly.
- **Internal BOR monitors one rail — its own.** On any multi-rail FPGA, SoC or mixed-voltage design, that is not the rail most likely to fail.
- **The reset timeout must exceed oscillator start-up**, not just supply settling. A timeout that is too short releases the core before the clock is stable.
- **Threshold voltage is encoded in the ordering code**, which makes a "functionally identical" supervisor substitution a silent board-level change.
- **Where functional safety applies, an external supervisor is usually the only defensible answer**, because its threshold is guaranteed rather than typical.

---

## The three options, and what each actually does

| | RC network | Internal BOR | External supervisor |
| --- | --- | --- | --- |
| Monitors supply voltage | **No** | Yes | Yes |
| Threshold accuracy | None | Typically loose, often "typical" only | **Guaranteed, ±1-2.5%** |
| Detects a brownout dip | **No** | Yes | Yes |
| Works on a slow ramp | **No** | Partly | Yes |
| Monitors other rails | No | **No** | Yes (multi-channel parts) |
| Independent of firmware/fuses | Yes | **No — set by a config fuse** | **Yes** |
| Defined reset timeout | Approximate | Device-defined | **Specified** |
| Watchdog available | No | Sometimes | Yes |
| Extra BOM | Two passives | **None** | One IC |
| Functional-safety evidence | None | Limited | **Available, up to SIL 3** |

### Why the RC network fails

A resistor and capacitor on an active-low reset pin hold the pin low while the capacitor charges, then release it. The circuit has no knowledge of the supply.

Two consequences, both of which appear in the field and not on the bench:

On a slow ramp, the capacitor charges from the same rail it is supposed to be qualifying. Reset releases when the *RC* has elapsed, not when the rail is valid:

```
Supply ramp (real enclosure, soft-start supply)  = 50 ms to valid
RC network: R = 100 kΩ, C = 100 nF → τ = 10 ms
Reset releases at roughly 1τ-2τ                  ≈ 10-20 ms

At 20 ms the rail is at ~40% of final value.
The device is released from reset well below its minimum operating voltage.
```

On a brownout, the capacitor is already charged and stays charged through the dip. The rail sags, the device misbehaves or corrupts memory, and reset is never asserted. Adding a discharge diode helps only if the dip is deep and long enough to discharge the capacitor through it, which is not the dangerous case. The dangerous case is a shallow, brief dip that takes the core below its operating point without discharging anything.

An RC network is legitimate for one job only: stretching a reset that is already correctly generated, for a device that needs a longer minimum reset pulse than the source provides.

## The calculation that decides internal versus external

The reset threshold must sit inside a window bounded above by the rail's minimum in-tolerance voltage and below by the device's minimum operating voltage. If the detector's accuracy band does not fit inside that window, it is the wrong detector.

Worked for a common case: a 3.3 V ±5% rail feeding a microcontroller specified down to 2.7 V:

```
Rail nominal                       = 3.30 V
Rail minimum in tolerance (−5%)    = 3.135 V
Device minimum operating           = 2.70 V

Valid threshold window             = 2.70 V … 3.135 V
```

The threshold must be **above 2.70 V** (or the device runs out of specification before resetting) and **below 3.135 V** (or a healthy rail at the bottom of its tolerance trips reset continuously).

Now test two detectors against that window:

```
External supervisor, 2.93 V nominal, ±2.5%
  Range = 2.857 V … 3.003 V
  Inside the window at both ends.                      PASS

Internal BOR, 2.70 V nominal, ±5%
  Range = 2.565 V … 2.835 V
  Lower bound 2.565 V is BELOW the 2.70 V minimum.     FAIL
```

The internal detector fails not because it is broken but because its accuracy band extends below the device's own minimum operating voltage. A part at the unlucky end of the distribution keeps running down to 2.565 V (135 mV out of specification) where behaviour is undefined and flash writes are unreliable. The failure is population-dependent, so it appears on some units and not others, which is the worst possible signature.

Two things to check on the datasheet before trusting an internal detector:

1. **Is the threshold specified with min/max limits, or only typically?** A typical-only figure cannot be budgeted. Some devices give a guaranteed range and those are usable.
2. **Is there more than one selectable BOR level?** Selecting a higher level often narrows the effective problem, at the cost of losing operating margin at the bottom of the rail's tolerance.

## The chatter region, and why it matters

Microchip's own documentation states that when `VDD` sits between `VBOR − 25 mV` and `VBOR`, a brown-out reset may occur repeatedly. That is a documented hysteresis gap, and it produces exactly the repeated-reset loop described in stage 6 of the boot diagnosis: the device resets, the load drops, the rail recovers slightly, the device starts, the load returns, the rail sags, and it resets again.

The same source's recommendation is the one this article is built on: use an external voltage monitor to avoid the behaviour. External supervisors specify their hysteresis, so the recovery point is a known distance above the trip point and the loop cannot form at a stable supply level.

This is why a supervisor's hysteresis specification deserves as much attention as its threshold. A supervisor with too little hysteresis on a supply with high output impedance reproduces the internal detector's problem.

## The rail that internal BOR cannot see

An internal brown-out detector monitors the rail that powers the detector. On a multi-rail device it does not monitor the others, and on a board it does not monitor anything else at all.

For an FPGA or SoC design with a core rail, one or more I/O bank rails and an auxiliary rail, that gap is the problem: the [boot diagnosis](/blog/board-does-not-boot-diagnosis) puts sequencing and rail validity first among causes precisely because nothing on the device is watching them. A multi-channel supervisor, or one supervisor per critical rail with the outputs wired-OR, closes it.

Three related points:

- **Sequencing and monitoring are different functions.** A sequencer brings rails up in order; a supervisor asserts reset when one leaves tolerance. Some parts do both; assuming one implies the other is a common design error.
- **Monitor the rail that will actually fail**, which is usually the one with the least margin or the most load-step, not the core rail.
- **An external supervisor keeps working when firmware does not.** Internal BOR is configured by a fuse or option byte, so a corrupted configuration word disables the protection. The [same-EOL-notice article](/blog/same-eol-notice-five-desks) makes the general version of this point: protection that depends on a configurable device state is weaker than protection that does not.

## Reset timeout: measure against the clock, not the rail

The reset timeout must be long enough for both the supply to settle and the oscillator to start. The second is usually longer and is the one that gets forgotten.

```
Supply settling after valid            ≈ 1-5 ms
Crystal oscillator start-up            ≈ 1-10 ms (crystal-dependent, worse cold)
Configuration/boot load (if external)  ≈ 100-500 ms

Reset timeout must exceed supply settling + oscillator start-up.
```

Supervisors offer fixed timeouts across a wide range and, on some parts, a capacitor-set timeout. **Choose from the oscillator's worst-case cold start-up, not from its typical figure** — marginal oscillator start-up is strongly temperature-dependent, which is why a board that boots on the bench fails cold.

## What the catalogue says

Measured 2026-08-11. The `supervisors-reset` category holds 45,819 part numbers at 32% inactive, and the split by generation is stark.

| Family | Generation | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `TPS3808` | Modern TI, adjustable | 68 | **0%** |
| `TPS3839` | Modern TI, nanopower | 31 | **0%** |
| `TPS3890` | Modern TI | 26 | **0%** |
| `MCP100` / `MCP130` | Microchip | 61 | **0%** |
| `STM6719` | ST | 9 | **0%** |
| `MCP112` | Microchip | 31 | 3% |
| `TL7705` | Classic TI | 38 | 21% |
| `MAX810` | Classic Maxim | 72 | 39% |
| `NCP302` | onsemi | 79 | 48% (3 in last-time buy) |
| **`MAX809`** | **Classic Maxim** | 133 | **50%** |
| `DS1813` | Dallas heritage | 20 | 55% |
| `ADM708` | ADI classic | 27 | 63% |
| **`MAX6376`** | **Maxim** | 44 | **68%** |

The design consequence is specific: threshold voltage is encoded in the ordering code, so replacing an obsolete `MAX809RTR` or `MAX6376UR22-T` means matching threshold, output type (push-pull or open-drain), polarity, timeout and hysteresis. Get the threshold suffix wrong and the board is held in reset on a healthy rail, or released on an unhealthy one, the exact fault described in stage 2 of the boot diagnosis, and the reason our [supervisor and reset IC selection guide](/blog/supervisor-reset-ic-selection-guide) leads on the timing nobody checks.

Current status by part number is on the [supervisors and reset ICs](/category/supervisors-reset) pages, and an [RFQ](/rfq) confirms availability against a specific ordering code including aftermarket lineage.

## The decision table

| If your situation is | Choose | Why |
| --- | --- | --- |
| Single rail, BOR threshold guaranteed inside the window | **Internal BOR** | Free, and sufficient when the arithmetic passes |
| BOR specified typically only, or band falls below `V_min` | **External supervisor** | The budget cannot be closed otherwise |
| More than one rail matters | **External supervisor** (multi-channel) | Internal BOR sees one rail |
| Functional safety requirement | **External supervisor** | Guaranteed threshold and available safety documentation |
| Repeated resets near the threshold | **External supervisor** with specified hysteresis | Closes the documented BOR chatter region |
| Watchdog also required | **Supervisor with watchdog** | One part, one failure mode |
| Reset pulse needs stretching only | **RC network** | Its one legitimate use |
| Slow supply ramp (soft-start, large bulk capacitance) | **External supervisor** | RC releases on time, not on voltage |
| Cost-critical, single rail, non-safety | **Internal BOR, arithmetic checked** | Do the calculation, record the result |

## Frequently asked questions

### Is an RC reset circuit ever acceptable?

Only for stretching a reset that is already generated correctly by something that monitors voltage. An RC network cannot detect a brownout, because the capacitor stays charged through the dip, and it cannot qualify a slow ramp, because it releases after its time constant rather than at a voltage. If it is the only thing driving the reset pin, the design has no supply supervision.

### When is the microcontroller's internal brown-out detector good enough?

When its guaranteed threshold band fits entirely between the device's minimum operating voltage and the rail's minimum in-tolerance value, and only one rail matters. Do the arithmetic: a 2.70 V nominal detector at ±5% spans 2.565-2.835 V, and its lower bound is below a 2.70 V minimum operating voltage, so it fails. A detector specified with guaranteed limits inside the window passes and needs nothing added.

### Why does my board reset repeatedly at a particular supply voltage?

You are probably sitting in the brown-out detector's hysteresis gap. Microchip documents repeated resets with `VDD` between `VBOR − 25 mV` and `VBOR`. The loop is self-sustaining: reset drops the load, the rail recovers slightly, the device starts, the load returns, the rail sags. An external supervisor with a specified hysteresis window breaks it, and increasing the rail's headroom or reducing its output impedance also helps.

### How long should the reset timeout be?

Longer than supply settling plus worst-case cold oscillator start-up. Crystal start-up is typically 1-10 ms and degrades at low temperature, so a timeout chosen from the typical figure can release the core before the clock is stable, which presents as a board that boots warm and fails cold. If configuration also loads from external memory, that time is additional and is usually handled by the device's own status handshake rather than by the supervisor.

### Can one supervisor monitor several rails?

Yes — multi-channel supervisors exist, and the alternative is one per rail with open-drain outputs wired together. This matters on FPGA and SoC boards because an internal detector only ever watches its own rail, while the rail most likely to leave tolerance is usually the one with the largest load step. Note that monitoring is not sequencing: bringing rails up in order is a separate function, and assuming one part does both is a common error.

### What do I have to match when replacing an obsolete supervisor?

Threshold voltage, output type, output polarity, timeout period and hysteresis, and the threshold is encoded in the ordering code. `MAX809` is 50% inactive and `MAX6376` 68%, so this substitution comes up often. A part that is functionally identical but carries a different threshold suffix will either hold a healthy board in reset or release an unhealthy one, with nothing measurably wrong on the board.

### Does functional safety require an external supervisor?

In practice, usually yes, because a safety argument needs a guaranteed threshold rather than a typical one. Supervisor products are available with functional-safety documentation supporting integrity levels up to SIL 3, and their thresholds and hysteresis are specified with limits. An internal detector configured by a fuse also has a failure mode a safety case must address: a corrupted configuration word can disable it.

### Which modern supervisor families are safest to design in?

On measured availability, the current TI and Microchip families: `TPS3808`, `TPS3839`, `TPS3890`, `MCP100` and `MCP130` all measure 0% inactive. Choose within them on threshold accuracy, quiescent current and whether you need an adjustable threshold or a watchdog. Avoid starting a new design on `MAX809`, `MAX6376`, `ADM708` or `DS1813`, which measure 50-68% inactive, the same generational split we measure in transceivers and comparators.

## Sources

Availability figures are our own measurement across 719,342 catalogue part
numbers, dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`.
Threshold, hysteresis and timeout behaviour vary between devices — **confirm
against the datasheet for the ordering code you are fitting**, because the
threshold is part of that code.

- Microchip, *Brown-out Reset (BOR)* device documentation — states that with `VDD`
  between `VBOR − 25 mV` and `VBOR` a brown-out reset may occur repeatedly, and
  recommends an external voltage monitor to avoid it.
  [onlinedocs.microchip.com](https://onlinedocs.microchip.com/oxy/GUID-7214785A-24A5-4B46-B5AA-D37AB8974593-en-US-2/GUID-A34FBFE3-425B-48CD-89D4-F484AA258516.html)
- Texas Instruments, *Supervisor and reset IC* product documentation — rail
  monitoring for industrial designs and functional-safety support up to SIL 3.
  [ti.com](https://ti.com/power-management/supervisor-reset-ic/overview.html)
- *How to Design Reliable Reset Circuits for Embedded Microcontrollers* — a
  practical treatment of why external supervision is used where internal BOR
  accuracy or response time is insufficient.
  [embeddedrelated.com](https://www.embeddedrelated.com/showarticle/1741.php)
- **IEC 61508** for the functional-safety framework referenced above, and your
  device's datasheet for the guaranteed BOR threshold limits that the arithmetic
  in this article requires.
