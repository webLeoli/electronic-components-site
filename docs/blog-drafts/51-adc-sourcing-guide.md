---
title: "ADC Sourcing: Architecture First, Then Everything Else"
slug: "adc-sourcing-guide"
status: "draft"
seoTitle: "ADC Sourcing Guide: SAR vs Delta-Sigma vs Pipeline Substitution"
seoDesc: "How to replace an obsolete ADC: architecture, throughput vs data rate, aperture jitter, input drive and settling arithmetic, interface migration and legacy parallel converters."
seoKeywords: "ADC sourcing, obsolete ADC replacement, SAR vs delta-sigma, aperture jitter, ADC settling time, ADC0804 replacement, AD574, AD7703, ADS1256, parallel ADC to SPI"
tags: "ADC, SAR, delta-sigma, pipeline, aperture jitter, settling, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Data Converters & Signal Chain"
relatedProducts: "ADS8881IDRCR, ADS1256IDBT, AD7768-1BCPZ-RL7, AD7703AR, AD574AJE, ADC0804LCWM-NS, AD9280ARSZ, ADS7818PB"
---

# ADC Sourcing: Architecture First, Then Everything Else

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: SAR, delta-sigma, pipeline, throughput, aperture jitter, input drive, interface migration

---

**An ADC substitution starts and ends with the architecture, because everything a buyer can see on a parametric search (resolution, sample rate, channel count, package) is compatible across architectures that behave nothing like each other.** Two 16-bit, 100 kSPS converters can differ by thirty samples of latency, by whether they anti-alias for you, and by whether the existing sensor circuit can drive them at all. Our [ADC category](/category/adc) holds 14,838 part numbers with 4,946 no longer active (33%) so the question is routine, and the wrong answer is a board that works on the bench and drifts in the field.


<img src="/uploads/blog/adc-sourcing-guide.webp" alt="Analog-to-Digital Converter chip on a green PCB with test probes" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Identify the architecture of the part being replaced before searching for candidates.** It constrains latency, filtering and input drive simultaneously.
- **Output data rate is not sample rate** on a delta-sigma. The modulator runs at megahertz; the decimation filter hands you kilohertz.
- **Settling to 16 bits takes about 11 RC time constants** — worked below. That arithmetic decides whether your existing source impedance is acceptable.
- **Aperture jitter caps SNR at high input frequencies** regardless of resolution: 1 ps of jitter limits a 100 MHz input to roughly 64 dB.
- **Legacy parallel converters are the hardest migrations**, because the replacement is serial and that is a firmware and timing change, not a footprint change.
- **Integrated PGAs, muxes and references make modern parts cheaper and less substitutable** — you inherit their limits too.
- **Rochester Electronics carries much of the legacy converter supply**, which often makes the authorised aftermarket the shortest path.

---

## Identify the architecture you are replacing

If you know only the part number, look up which of four families it belongs to before anything else.

| Architecture | Signature in the datasheet | Typical role |
| --- | --- | --- |
| **SAR** | Acquisition time, conversion time, one result per convert command | Multiplexed instrumentation, control loops |
| **Delta-sigma** | Modulator clock, oversampling ratio, digital filter, data rate settings | Precision DC measurement, bridges, weighing |
| **Pipeline** | Pipeline delay in clock cycles, SFDR, full-power bandwidth | IF sampling, video, radar, high-speed capture |
| **Integrating / dual-slope** | Conversion time in tens of milliseconds, line-frequency rejection | Panel meters, legacy DVM front ends |

Examples in our catalogue: `ADS8881IDRCR` (SAR), `ADS1256IDBT` and `AD7768-1BCPZ-RL7` (delta-sigma), `AD9280ARSZ` (pipeline), and `AD7703AR`, a 20-bit delta-sigma, now obsolete, that shows up in older instrumentation.

A cross-architecture substitution is a redesign, not a replacement. It may still be the right answer when nothing else is available, but it needs schematic and firmware work, and it should be costed as such. The framework for that decision is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

## Throughput, data rate and the numbers that get confused

On a delta-sigma converter the number in the "sample rate" column of a search tool is usually the output data rate, and the modulator is running hundreds of times faster.

This matters in three ways:

1. **Settling after a channel change.** A delta-sigma's filter has to refill. Switching the input multiplexer and reading immediately gives a result contaminated by the previous channel — typically for the filter's settling length, which can be tens of output samples. Parts that support single-cycle settling say so explicitly.
2. **Group delay.** The filter delays the signal. In a loop, that is phase lag.
3. **Notch placement.** Many precision delta-sigmas let you pick a data rate that places filter notches at 50 Hz and 60 Hz. **Changing the data rate to gain throughput moves the notches and you lose mains rejection.** A substitution with different available data rates can silently remove line-frequency rejection that the original design depended on.

On a SAR, throughput is straightforward (acquisition plus conversion, repeated) but it is bounded by the front end. **A SAR rated at 1 MSPS delivers 1 MSPS only if the source can settle within the acquisition window.**

## The settling arithmetic that decides your front end

Settling to N bits takes about ln(2^N) time constants. For 16 bits:

```
ln(2¹⁶) = 16 × ln 2 = 11.09 time constants
```

With a 1 kΩ source impedance and a 20 pF sampling capacitor:

```
τ = R × C = 1 kΩ × 20 pF = 20 ns
t_settle = 11.09 × 20 ns = 222 ns
```

So a 1 kΩ source needs roughly 222 ns of acquisition time for 16-bit settling — comfortable at 100 kSPS, marginal at 1 MSPS where the whole conversion cycle is 1 µs and acquisition may be specified at 200 ns.

Now the same sum with a 10 kΩ sensor divider left over from a legacy design:

```
τ = 10 kΩ × 20 pF = 200 ns
t_settle = 11.09 × 200 ns = 2.22 µs
```

That front end cannot feed a 1 MSPS SAR at 16 bits, and no amount of firmware tuning fixes it. It needs a driving amplifier — see [op-amp equivalents](/blog/op-amp-equivalent-selection) for what has to match if that amplifier is also being sourced.

The practical rule: **compute the required source impedance from the acquisition time, then check what the board actually presents.** If the old converter had a buffered input and the new one does not, this calculation is the substitution.

## Aperture jitter caps SNR independently of resolution

Sampling clock jitter sets a ceiling on SNR that gets lower as input frequency rises:

```
SNR_jitter = −20 × log₁₀(2π × f_in × t_jitter)
```

| Input frequency | 1 ps RMS jitter | 10 ps RMS jitter |
| --- | ---: | ---: |
| 1 MHz | 104 dB | 84 dB |
| 10 MHz | 84 dB | 64 dB |
| 100 MHz | 64 dB | 44 dB |

At 100 MHz input with 1 ps of clock jitter, SNR is capped near 64 dB — about 10.4 effective bits. **Buying a 14-bit pipeline ADC and clocking it from a general-purpose oscillator throws away three bits before the signal arrives.**

Two consequences for sourcing:

- **A pipeline ADC substitution is also a clock question.** If the replacement has a wider full-power bandwidth, it is also more exposed to the jitter already present. The specifications that matter are in [clock generators and PLLs](/blog/clock-generator-pll-sourcing).
- **For DC and low-frequency measurement, jitter is irrelevant.** Do not let a high-speed specification drive a precision decision.

## What has to match on the analog input

Input configuration is where "same resolution, same rate" substitutions fail.

- **Single-ended, pseudo-differential or fully differential.** A pseudo-differential part accepts a small negative excursion on the low side only; a fully differential part expects a signal on both. They are not wiring-compatible.
- **Input range and how it is set.** ±10 V, 0-5 V, ±V_REF, ±V_REF/2, and on many parts the range is programmable, meaning the default after reset may not be the range the old part used.
- **Absolute maximum ratings versus the legacy board.** This is the ±15 V problem again: an instrument built around a converter with ±10 V inputs cannot host a modern part whose absolute maximum is supply +0.3 V without adding clamps and attenuation.
- **Input impedance and bias current.** A part with 1 nA of input bias into a 100 kΩ source contributes 100 µV of offset — 1.3 LSB at 16 bits on a 5 V range.
- **Integrated PGA gain steps.** Convenient, and a lock-in: a replacement without the same gain set changes the firmware's scaling table.
- **Integrated multiplexer channel count and settling** — see [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the specifications that govern the front end when the mux is external.

## Reference input: dynamic, not static

On many SAR converters the reference pin draws charge on every conversion, not a steady current. The datasheet gives a recommended decoupling capacitor (often 1 µF to 10 µF of low-ESR ceramic directly at the pin) because the reference has to supply the charge transferred into the capacitor array each cycle.

Two substitution errors follow:

1. **Reusing the old board's reference decoupling** when the replacement's charge demand is higher. Symptom: gain error and INL degradation that worsen with sample rate.
2. **Driving the reference pin directly from a reference IC that cannot supply the dynamic current.** Some references need a buffer for this duty; see [voltage reference selection](/blog/voltage-reference-selection-guide) for output current and capacitive-load stability.

## Interface migration: the parallel-to-serial cliff

The hardest legacy ADC migrations are not analog at all. The classic converters were parallel: 8 or 12 data lines, a chip select, a read strobe, sometimes a busy output tied to an interrupt. Their modern replacements are serial.

| Legacy interface | Modern replacement | What the migration costs |
| --- | --- | --- |
| 8-bit parallel + `/RD`, `/WR`, `INTR` | SPI, 3-4 wires | Firmware driver, timing change, spare GPIO freed |
| 12-bit parallel, two-byte read | SPI 16-bit frame | Byte-order and alignment work |
| Parallel with external clock | Serial with SCLK up to tens of MHz | Signal integrity on a fast clock the board never had |
| Parallel bus shared with memory | Dedicated SPI or LVDS pairs | Board rework; frees the bus |

`ADC0804LCWM` is obsolete in our catalogue while `ADC0804LCWM-NS` remains active; that is the good case, where the family still has a live variant. When it does not, an FPGA or CPLD is frequently the cheapest bridge: it can present the legacy parallel timing to the processor and speak SPI to the new converter, with no processor firmware change at all. That pattern, and the parts that suit it, are in [how to choose the right FPGA](/blog/how-to-choose-right-fpga) and [Altera MAX CPLD replacement paths](/blog/altera-max-cpld-replacement-paths).

High-speed pipeline parts add a third case: their outputs may be LVDS or JESD204-class serial links, which is a different board technology entirely. [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide) covers the termination requirements those bring.

## Reading the specification sheet like a buyer

Beyond resolution and rate, five fields decide whether a candidate is real:

| Specification | Why it decides | Typical trap |
| --- | --- | --- |
| **ENOB / SINAD** | The honest resolution | 16-bit part with 12.5 ENOB |
| **INL, no missing codes** | Calibration closure | Guaranteed only at reduced resolution |
| **Offset and gain drift** | Uncalibratable error over temperature | Specified at 25 °C only |
| **Latency / pipeline delay** | Loop stability | Absent from search tools entirely |
| **Power-supply rejection** | Noise coupling from a switching rail | Measured at DC, not at the switcher frequency |

If a datasheet gives typical values without maximums for the specifications you depend on, treat the part as uncharacterised for your application. On legacy parts this is common. It is a reason to prefer the authorised-aftermarket original over a similar-looking alternative.

## Sourcing notes

33% of the ADC category is not active, and the distribution across families tells you where to look:

| Family prefix | Parts held | Not active |
| --- | ---: | ---: |
| `MAX1…` | 2,680 | 1,219 |
| `AD7…` | 2,411 | 1,093 |
| `ADS…` | 2,183 | 546 |
| `LTC2…` | 2,107 | 421 |
| `AD9…` | 804 | 234 |
| `ADS8…` | 611 | 155 |
| `MCP3…` | 434 | 0 |

The Maxim and older Analog Devices families are where the obsolescence sits; the Microchip `MCP3xxx` line shows zero inactive parts, which is what a recent, still-invested family looks like.

Practical channel guidance:

- **Check the authorised aftermarket first for anything pre-2005.** `AD574AJE`, `AD7703AR`, `AD7823YRM-REEL7` and similar are supplied through Rochester Electronics in our catalogue. This is original-die material with traceability, not an equivalent — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).
- **Watch for last-time-buy status**, which changes the decision from "find stock" to "decide a quantity". `ADS7818PB`, `MAX194BEPE+` and `AD977ABRSZRL` are in that state here; the quantity method is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).
- **Converters are attractive counterfeit targets** because the package is generic and the function needs equipment to verify. Incoming inspection should measure, not just inspect: check offset, gain, and INL at a handful of codes against a known reference, and confirm no missing codes near mid-scale. The inspection framework is [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide), and date-code consistency across a reel matters as described in [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Architecture identified and matched | Lost anti-aliasing or added latency |
| 2 | Resolution and output data alignment | Silent firmware scaling error |
| 3 | ENOB / SINAD, INL, missing codes | Calibration will not close |
| 4 | Output data rate vs modulator rate | Wrong throughput assumption |
| 5 | Filter notch frequencies (50/60 Hz) | Mains rejection lost |
| 6 | Acquisition time vs source impedance (11τ rule) | Gain error rising with rate |
| 7 | Input configuration: single-ended / pseudo-diff / diff | Miswired input |
| 8 | Input range default after reset | Full-scale mismatch |
| 9 | Absolute maximum input vs legacy rails | Device damage |
| 10 | Reference: internal/external, dynamic current, decoupling | INL degradation with rate |
| 11 | Clock jitter budget vs input frequency | SNR ceiling below resolution |
| 12 | Interface: parallel vs serial, SPI mode, frame size | No communication |
| 13 | Latency in the control loop | Instability |

## FAQ

### How do I know which ADC architecture a legacy part number uses?

Read the conversion-timing section of the datasheet rather than the marketing header. A SAR specifies acquisition time and conversion time and returns one result per convert command. A delta-sigma specifies a modulator clock, an oversampling ratio and selectable output data rates with a digital filter response. A pipeline part specifies pipeline delay in clock cycles along with SFDR and full-power bandwidth. An integrating converter has conversion times in the tens of milliseconds and quotes line-frequency rejection.

### Why is my delta-sigma ADC's sample rate so much lower than its clock?

Because the modulator oversamples and a decimation filter reduces the result to the output data rate. The modulator may run at several megahertz while you read hundreds or thousands of samples per second. The ratio is what buys the resolution. It also means the filter has settling length and group delay, so after switching input channels you must discard results until the filter has refilled, unless the part explicitly supports single-cycle settling.

### How much source impedance can an ADC input tolerate?

Work it from the acquisition time. Settling to N bits needs about ln(2^N) time constants — 11.09 for 16 bits, where the time constant is the source resistance times the sampling capacitance. With 20 pF of sampling capacitance, a 1 kΩ source needs roughly 222 ns and a 10 kΩ source needs 2.2 µs. Compare that against the acquisition window at your intended sample rate; if it does not fit, you need a driving amplifier rather than a different converter.

### Does clock jitter matter for a precision DC measurement?

No. Aperture jitter converts timing uncertainty into amplitude error in proportion to the input signal's slew rate, so at DC and low frequencies the contribution is negligible. It becomes dominant for IF sampling: the SNR ceiling is −20·log₁₀(2π·f_in·t_jitter), which for 1 ps of RMS jitter is about 104 dB at 1 MHz but only 64 dB at 100 MHz. Match the specification to the application rather than buying the best of both.

### Can I replace an obsolete parallel-output ADC with a serial one?

Electrically yes, but it is a firmware and timing change rather than a drop-in, and on a shared bus it may free board resources. Where the processor firmware cannot be touched (a certified product, or source code that no longer exists) a small CPLD or FPGA can present the original parallel read timing to the processor while running SPI to the new converter. That bridge is often cheaper than either a firmware requalification or a hunt for the original part.

### Is an ADC with an integrated PGA and mux a safer choice?

It is a cheaper and smaller choice, and a less substitutable one. You inherit the PGA's gain steps, noise and offset drift, and the mux's channel count, on-resistance and leakage. A future replacement then has to match all of it, not just the converter core. For long-life industrial products, discrete front ends with separately sourceable amplifiers, references and multiplexers are frequently easier to sustain over twenty years.

### What should incoming inspection measure on a converter?

Function and accuracy, not just marking and package. Apply a known reference at several points across the range and check offset, gain and linearity, and look for missing codes around mid-scale where DNL is usually worst. Verify the interface at the intended clock rate and, on delta-sigma parts, confirm the data rate and filter behaviour by measuring rejection at 50 or 60 Hz. Visual and X-ray inspection per IDEA-STD-1010 addresses the package; only measurement addresses the die.

### Which ADC families in your catalogue are most affected by obsolescence?

The older Maxim and Analog Devices lines. Of parts beginning `MAX1`, 1,219 of 2,680 are not active, and of `AD7` parts, 1,093 of 2,411. By contrast the Microchip `MCP3xxx` family shows none inactive across 434 part numbers. Overall the ADC category runs 4,946 inactive out of 14,838 (33%) with much of the legacy supply flowing through Rochester Electronics as authorised aftermarket.

## Related reading

Start with the cluster pillar, [data converter sourcing](/blog/data-converter-sourcing-guide), for the error-budget framework. Then [DAC sourcing](/blog/dac-sourcing-guide) for the output side, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the front end, [voltage reference selection](/blog/voltage-reference-selection-guide) for the dominant error term, and [comparator selection](/blog/comparator-selection-guide) where a threshold is all you need.

For the surrounding decisions: [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and [IDEA-STD-1010 inspection](/blog/idea-std-1010-counterfeit-detection-guide).

Send us the part number with your source impedance, sample rate and reference, and we will tell you which candidates survive the arithmetic.

[**Submit an RFQ**](/rfq) | [**Browse ADCs**](/category/adc) | [**Upload a BOM**](/bom)
