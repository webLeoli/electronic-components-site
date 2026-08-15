---
title: "Clock Buffers and Fanout: 55% Discontinued, and a Zero-Delay Buffer Is Not a Fanout Buffer"
slug: "clock-buffer-fanout-sourcing-guide"
status: "draft"
seoTitle: "Clock Buffer Sourcing: Fanout vs Zero-Delay, LVPECL, LVDS, HCSL Formats"
seoDesc: "2,394 of 4,335 clock buffer parts are inactive. Output format and termination, skew, additive jitter measured against ADC SNR, zero-delay PLL buffers and the Renesas wind-down."
seoKeywords: "clock buffer sourcing, fanout buffer vs zero delay buffer, CY7B991 replacement, HCSL termination PCIe, LVPECL clock buffer, additive jitter, clock skew, PI6C48 last time buy, MC100 obsolete"
tags: "clock buffers, fanout, zero-delay, LVPECL, HCSL, skew, jitter, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Timing & Clock Distribution"
relatedProducts: "CDCV304PWRG4, MC100LVEP111MNRG, NB6L11D, SY100EP11UKG, 853S111AYILF, CY7B991-7JXC, MPC941AER2, PI6C48543LEX"
---

# Clock Buffers and Fanout: 55% Discontinued, and a Zero-Delay Buffer Is Not a Fanout Buffer

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: output formats, termination, skew, additive jitter, zero-delay PLL buffers, obsolescence

---

**Clock distribution is the worst-affected timing category we hold: 2,394 of 4,335 part numbers (55%) are no longer active.** The reason is that clock buffers are tied to the architectures they served. When a processor bus, a memory generation or a backplane standard goes away, so does the fanout buffer that distributed its clock, and there is rarely a cross-vendor equivalent. Two distinctions decide whether a replacement will work: the **output format**, which determines the termination network on the board, and whether the part contains a **PLL**, which determines whether it aligns phase or merely copies edges. Both are invisible in a search filtered by frequency and output count.

## Key takeaways

- **55% of the category is inactive**: the highest rate of any timing category, and concentrated in architecture-specific families.
- **A zero-delay buffer contains a PLL and aligns its outputs to the input phase.** A fanout buffer just copies edges with a propagation delay.
- **Output format is a board property.** LVCMOS, LVDS, LVPECL, HCSL and CML need different terminations, and LVPECL needs a DC path to ground.
- **Additive jitter is quantifiable against system performance**: 1 ps RMS caps a 100 MHz-input converter near 64 dB SNR.
- **Output-to-output skew and part-to-part skew are different specifications**, and only the second matters when the clock tree spans packages.
- **`ICS5xx` is 100% inactive in our catalogue** (31 of 31) and `5V41xx` likewise (6 of 6); `MC100`-family ECL runs 116 of 186.
- **The current last-time-buy wave is Renesas and Diodes/Pericom**: `PI6C48543LEX`, `PI6C48533-01LEX`, `854S015CKI-01LFT`, `5T9304PGG`.

---

## Fanout buffer versus zero-delay buffer

Both take one clock in and give several out. Only one of them controls phase.

| | Fanout buffer | Zero-delay buffer (PLL) |
| --- | --- | --- |
| Internal PLL | No | **Yes** |
| Input-to-output phase | A propagation delay, typically 1-5 ns | Aligned — nominally zero |
| Lock time at power-up | None | Milliseconds |
| Jitter behaviour | Adds a little | **Filters input jitter above the loop bandwidth, adds its own below** |
| Behaviour with no input | Outputs stop | May free-run or hold, part-dependent |
| Frequency multiplication | No | Some parts offer divide/multiply |
| Examples in catalogue | `CDCV304PWRG4`, `MC100LVEP111MNRG`, `NB6L11D` | `CY7B991-7JXC` (obsolete), `MPC941AER2` (obsolete), `ICS9179BF-03LFT` (obsolete) |

Three substitution failures follow:

Replacing a zero-delay buffer with a fanout buffer loses phase alignment. Designs that used a ZDB did so because a downstream device's clock had to arrive in a defined phase relationship with the source — synchronous SRAM, a memory controller, a multi-board backplane. The fanout buffer's 1-5 ns of propagation delay is not a constant that can be compensated by layout, because it varies with temperature, voltage and part.

Replacing a fanout buffer with a zero-delay buffer adds a PLL: a lock time at start-up, a new jitter profile, and a failure mode if the input is intermittent. On a board where reset is released as soon as supplies are good, the clock may not be valid yet, the sequencing question in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).

Replacing a ZDB with a different ZDB requires matching loop bandwidth as well as the obvious parameters, because that is what determines how much input jitter is filtered and how much is passed. Two zero-delay buffers with identical pinouts can behave differently in a system whose input clock is noisy.

The commercially significant point: the classic zero-delay buffers are gone. `CY7B991-7JXC` (the Cypress `RoboClock`, the reference part for this function for two decades) is obsolete in our catalogue, as are `MPC941AER2` and `ICS9179BF-03LFT`. Replacing one usually means moving to a modern clock generator with a PLL, which is a different part class covered in [clock generators and PLLs](/blog/clock-generator-pll-sourcing).

## Output format decides the termination

The output format is not a preference; it is a network of resistors on the board.

| Format | Typical termination | Fails how if mismatched |
| --- | --- | --- |
| **LVCMOS / LVTTL** | None, or a series resistor | Overshoot and reflections on long traces |
| **LVDS** | 100 Ω across the differential pair | Signal present but low amplitude |
| **LVPECL** | 50 Ω to V_CC−2 V, or Thevenin equivalent — **needs a DC path to ground** | **No usable output at all** |
| **HCSL** | ~49.9 Ω to ground per leg plus a series resistor | Amplitude and common mode wrong; PCIe fails compliance |
| **CML** | 50 Ω to V_CC, often on-die | Depends on whether termination is internal |

The LVPECL row is the one that produces a dead board. LVPECL outputs are emitter followers: they need a resistive path to ground to establish an operating point. Fitted into an LVDS footprint (100 Ω across the pair, no ground path) the outputs sit at an undefined level. This is the same mechanism described in [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide). It is worth repeating here because clock buffers are where mixed-format families are most common: `SY100EP11UKG` and `MC100LVEP111MNRG` are LVPECL-class parts, `NB6L11D` is another differential family, and they are not interchangeable with an LVDS clock buffer despite similar pinouts.

HCSL deserves specific attention because it is the PCIe reference-clock format and its termination is unusual: a resistor to ground near the driver plus a series resistor, sizing the current-mode output into a defined swing. A part that expects that network will not produce a compliant clock without it, and a compliance failure is not a functional failure; the link works until it does not.

Also check **per-bank supply voltages** on parts with multiple output banks, and **individual output enables**, whose default state on a replacement may differ.

## Skew: two specifications, one of which usually matters

Output-to-output skew is the difference in propagation delay between outputs of the same device — typically tens of picoseconds. It matters when several loads must be clocked simultaneously from one buffer, such as the address and data halves of a synchronous memory bank.

Part-to-part skew is the variation between devices, which is much larger (hundreds of picoseconds) and matters whenever the clock tree spans more than one package. On a multi-board system, part-to-part skew plus cable delay is the timing budget.

```
Example: two DDR banks clocked from separate buffers
part-to-part skew         ±350 ps
trace length mismatch     ±100 ps
------------------------------------
total clock uncertainty    900 ps p-p
```

A replacement with worse part-to-part skew can break a design that a bench test on one board will not reveal, because a single board sees only its own devices. If the original design used two identical buffers from the same lot, the substitution should preserve that practice —. It is a legitimate reason to require single-lot delivery, which the traceability practice in [date codes and lot traceability](/blog/date-code-lot-traceability-explained) supports.

## Additive jitter, measured against something real

A clock buffer adds jitter, and the number matters most where the clock feeds a converter or a serial link.

For a data converter, jitter caps SNR regardless of resolution:

```
SNR_jitter = −20 × log₁₀(2π × f_in × t_jitter)

  100 fs RMS at 100 MHz input  → ~84 dB   (≈13.6 effective bits)
    1 ps RMS at 100 MHz input  → ~64 dB   (≈10.4 effective bits)
   10 ps RMS at 100 MHz input  → ~44 dB   (≈7 effective bits)
```

So substituting a buffer with 1 ps of additive jitter for one with 100 fs costs three effective bits on a converter sampling at 100 MHz: the arithmetic developed in [ADC sourcing](/blog/adc-sourcing-guide). For a SerDes reference, the specification is an integrated RMS figure over a defined offset band, and a part that publishes only cycle-to-cycle jitter has not been characterised for that use.

Two related points:

- **Additive jitter depends on the input slew rate.** A buffer specified with a fast differential input and fed a slow LVCMOS edge will not meet its published figure.
- **Supply noise translates directly into jitter.** A buffer with better internal supply rejection is worth more than its jitter number suggests on a noisy board, and this is where a "compatible" part on a cheaper process shows up.

## What is actually disappearing

The inactive parts cluster by architecture, which tells you where the risk is.

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `ICS5…` | 31 | 31 | **100%** |
| `5V41…` | 6 | 6 | **100%** |
| `MC100…` | 186 | 116 | 62% |
| `MC10E…` | 33 | 21 | 64% |
| `SY5…` | 75 | 24 | 32% |
| `PI6C…` | 208 | 69 | 33% |
| `NB3…` | 70 | 12 | 17% |
| `CDCLVC…` | 14 | 0 | **0%** |
| `LMK…` | 67 | 0 | **0%** |

Reading this table:

The ECL and PECL clock families are winding down — `MC100` at 62% and `MC10E` at 64%. These sat in telecom and instrumentation clock trees where their low jitter had no CMOS equivalent, and the replacements are modern LVPECL or LVDS parts from a different vendor with different termination details. `MC100E210FNR2` and `NB100LVEP221MNG` are obsolete here; `MC100EP11MNR4G` remains available through **Flip Electronics**, a licensed continuity manufacturer.

The `ICS` and `5V41` prefixes are completely gone. These are Integrated Device Technology and QuickLogic-era clock parts, now Renesas, and their PC-chipset and legacy-bus applications no longer exist. There is no equivalent because the architecture is not made any more.

The Texas Instruments `CDCLVC` and `LMK` families show zero inactive parts across 81 part numbers between them, which makes them the natural migration target for a new design — with the caveat that they are not footprint-compatible with what they replace.

The current last-time-buy wave in our catalogue: `PI6C48543LEX`, `PI6C48533-01LEX`, `PI6C485311WEX` and `PI6C485311WE` (Diodes, ex-Pericom PCIe clock buffers), plus `854S015CKI-01LFT`, `5T9304PGG`, `5T9304PGG8` and `49FCT3805ASOGI8` (Renesas). `NB3N200SDG` is also last-time buy. **If a design uses Pericom-branded PCIe clock buffers, that is this year's decision** — see [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) and [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

Vendor concentration overall: Renesas 1,353 part numbers, Microchip 668, Rochester Electronics 407, Diodes 377, Texas Instruments 294, onsemi 270.

## Sourcing and inspection

Clock buffers are hard to verify with a multimeter and easy to verify with a scope, so incoming inspection should be electrical:

- **Confirm the output format** by measuring amplitude and common-mode voltage into the correct termination, not into a scope's 50 Ω input, which is itself a termination and will mislead.
- **Measure output-to-output skew** on the same device.
- **Check that all outputs are alive** and respond correctly to enables. A remarked part with fewer outputs, or with a different enable polarity, shows up immediately.
- **Verify PLL lock behaviour** on a zero-delay part: apply the input, observe lock time, then interrupt the input and observe what the outputs do.

Jitter cannot be verified without a phase-noise capable instrument, so for a clock whose jitter is a system specification, buy through a channel that can supply manufacturer test data. The channel distinction is in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), and package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | PLL present — zero-delay vs fanout | Phase alignment lost, or lock time added |
| 2 | PLL loop bandwidth on a ZDB replacement | Input jitter passed instead of filtered |
| 3 | Output format and its termination network | No usable output (LVPECL), or failed compliance (HCSL) |
| 4 | DC path to ground for LVPECL outputs | Outputs sit undefined |
| 5 | Output count and per-output enables | Missing clocks, wrong default state |
| 6 | Per-bank supply voltages | Wrong levels on one bank |
| 7 | Output-to-output skew | Simultaneous loads no longer simultaneous |
| 8 | Part-to-part skew across the clock tree | Multi-board timing budget blown |
| 9 | Additive phase jitter over the specified band | Converter SNR or link margin lost |
| 10 | Required input slew rate | Published jitter not achieved |
| 11 | Supply noise rejection | Jitter on a noisy rail |
| 12 | Behaviour with no input clock | Undefined outputs, or free-running |
| 13 | Start-up and lock time vs reset release | System runs before the clock is valid |

## FAQ

### What is the difference between a fanout buffer and a zero-delay buffer?

A fanout buffer copies its input to several outputs with a propagation delay of a few nanoseconds. A zero-delay buffer contains a PLL that aligns the outputs to the input phase, so the input-to-output delay is nominally zero and does not drift with temperature or voltage. Designs use a zero-delay buffer when a downstream device's clock must hold a defined phase relationship to the source, as in synchronous memory or multi-board systems. Substituting a fanout buffer introduces a delay that layout cannot compensate, because it varies with conditions and between parts.

### Why does my LVPECL clock buffer produce no output?

Because its outputs are emitter followers that require a DC path to ground to establish an operating point, and the board probably provides an LVDS-style termination instead — 100 Ω across the pair with no path to ground. The usual LVPECL terminations are 50 Ω to a supply two volts below V_CC, or a Thevenin equivalent of two resistors per leg. Without one the outputs sit at an undefined level. This is not a marginal-amplitude problem; there is no signal.

### How is HCSL different from LVDS or LVPECL?

HCSL is a current-mode format used for PCIe reference clocks, and its termination is a resistor to ground near the driver — typically 49.9 Ω per leg — plus a series resistor, which converts the driver current into the specified swing. It is not compatible with LVDS's 100 Ω differential termination or LVPECL's bias network. A part designed for HCSL fitted without that network will produce a signal of the wrong amplitude and common mode, which typically still functions well enough to pass a smoke test and fails PCIe compliance.

### Which skew specification should I care about?

Part-to-part skew, if your clock tree spans more than one package, because it is much larger — hundreds of picoseconds against tens for output-to-output skew within one device. A two-board or two-bank design clocked from separate buffers accumulates part-to-part skew plus trace mismatch, and that total is the timing uncertainty the design has to absorb. Output-to-output skew matters when one buffer clocks several loads that must switch together. A bench test on a single board reveals neither reliably.

### How much does clock buffer jitter matter?

Quantifiably, wherever the clock feeds a converter or a serial link. For a converter, SNR is capped at −20·log₁₀(2π·f_in·t_jitter): at a 100 MHz input, 100 fs RMS allows about 84 dB, 1 ps about 64 dB and 10 ps about 44 dB. So a substitution from 100 fs to 1 ps costs roughly three effective bits. Note also that additive jitter figures assume a specified input slew rate — feed a fast differential buffer a slow LVCMOS edge and it will not meet its datasheet number.

### What replaces a CY7B991 or other classic zero-delay buffer?

Usually a modern clock generator rather than another zero-delay buffer, because the classic parts are gone: `CY7B991-7JXC`, `MPC941AER2` and `ICS9179BF-03LFT` are all obsolete in our catalogue. A clock generator with an integrated PLL can provide the same phase alignment plus division or multiplication, but it is a different part class with its own configuration, output formats and loop characteristics. Treat it as a redesign of the clock tree with a timing review, not a footprint substitution.

### Which clock buffer families are most affected by obsolescence?

The architecture-specific ones. In our catalogue all 31 `ICS5xx` parts and all 6 `5V41xx` parts are inactive (those served PC chipsets and legacy buses that no longer exist) while the ECL families run 62% (`MC100`) and 64% (`MC10E`). The healthiest are Texas Instruments' `CDCLVC` and `LMK` families at zero inactive across 81 part numbers, though they are not footprint-compatible with what they replace. Overall the category is 55% inactive, the worst of any timing category we hold.

### What is currently going last-time buy?

The Diodes/Pericom PCIe clock buffers (`PI6C48543LEX`, `PI6C48533-01LEX`, `PI6C485311WEX` and `PI6C485311WE`) and a group of Renesas parts including `854S015CKI-01LFT`, `5T9304PGG`, `49FCT3805ASOGI8` and `NB3N200SDG`. Both vendors inherited overlapping clock portfolios through acquisition (Pericom into Diodes, IDT and Intersil into Renesas) and are rationalising them. If your BOM carries Pericom-branded clock distribution, that is the scrub to run first.

## Related reading

The rest of this cluster: [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for synthesis and jitter attenuation, [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide) for the source itself, [real-time clock sourcing](/blog/rtc-sourcing-guide), and [555 timers and delay ICs](/blog/555-timer-delay-ic-sourcing-guide).

Where the clock's quality becomes another subsystem's specification: [ADC sourcing](/blog/adc-sourcing-guide) for the jitter-to-SNR arithmetic, [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide) for differential termination, [decoding a 74-series part number](/blog/74-series-logic-decode-guide) where the "buffer" is really logic.

Send us the part number with the output format and the termination already on your board, and we will filter out the parts that cannot drive it.

[**Submit an RFQ**](/rfq) | [**Browse clock buffers**](/category/clock-buffers-drivers) | [**Upload a BOM**](/bom)
