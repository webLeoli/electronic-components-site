---
title: "Data Converter Sourcing: The Reference and the Drive Circuit Decide the Substitution"
slug: "data-converter-sourcing-guide"
status: "draft"
seoTitle: "Data Converter Sourcing Guide: ADC and DAC Substitution"
seoDesc: "Why ADCs and DACs are not drop-in parts: resolution vs accuracy, reference error budgets, architecture and latency, drive requirements, and power-on defaults. With worked arithmetic."
seoKeywords: "data converter sourcing, ADC substitution, DAC replacement, ENOB, INL DNL, voltage reference error budget, ADS1115 vs ADS1015, obsolete ADC, signal chain sourcing"
tags: "data converters, ADC, DAC, signal chain, voltage reference, error budget, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Data Converters & Signal Chain"
relatedProducts: "ADS1115IRUGT, ADS1015IRUGR, AD7703AR, DAC108S085CIMT/NOPB, AD7545AES, ADR4525BRZ, REF102AP, ADG5412BRUZ-REEL7"
---

# Data Converter Sourcing: The Reference and the Drive Circuit Decide the Substitution

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: ADC, DAC, error budget, ENOB, references, switches, comparators, obsolescence

---

**A data converter is the one part on the board whose replacement can meet every line of the datasheet and still lose you accuracy you cannot get back.** Logic either works or it does not. A converter degrades: a substitute with the same resolution, package and interface can shift a measurement by tens of counts because the reference drifts differently, because the input needs a driving amplifier the old part did not, or because the digital filter has a different group delay. Our catalogue holds **53,736 part numbers** across the seven converter and signal-chain categories, and roughly a third of them are no longer active, so this substitution question arrives constantly. It is never answered by a pinout comparison alone.


<img src="/uploads/blog/data-converter-sourcing-guide.webp" alt="Data converter IC evaluated on a test bench with power and precision routing context" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Resolution is a package label; accuracy is a system property.** A 16-bit converter fed by a 10 ppm/°C reference over a 60 °C span is a 12-bit-accurate instrument.
- **The reference usually dominates the error budget**, not the converter. Substituting the converter and keeping the reference often changes nothing measurable; the reverse is rarely true.
- **Pin-compatible parts with different resolutions exist inside the same family** — `ADS1115IRUGT` and `ADS1015IRUGR` share pinout and register map at 16 and 12 bits. The firmware scales silently wrong.
- **Architecture sets latency and anti-aliasing**, and neither appears on a parametric search. Replacing a delta-sigma with a SAR removes the digital filter that was doing your anti-aliasing.
- **Modern converters often need a driving amplifier** that the legacy part did not, because switched-capacitor inputs demand charge on every acquisition.
- **DAC power-on default state is a safety specification** in anything driving an actuator: zero-scale and mid-scale reset are both common.
- **Grade suffixes mix three unrelated things** (temperature range, initial accuracy and speed) and the convention differs per family.

---

## What we hold, and how much of it is legacy

The signal-chain categories are simultaneously large and heavily discontinued, which is the profile that produces sourcing work rather than catalogue browsing. Measured 2026-08-04:

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| [ADC — Analog to Digital](/category/adc) | 14,838 | 4,946 | 33% |
| [DAC — Digital to Analog](/category/dac) | 11,852 | 3,342 | 28% |
| [Analog Switches & Multiplexers](/category/analog-switches-mux) | 9,895 | 4,380 | **44%** |
| [Voltage References](/category/voltage-references) | 8,143 | 2,469 | 30% |
| [Analog Comparators](/category/analog-comparators) | 4,403 | 1,273 | 29% |
| [ADC/DAC — Special Purpose](/category/adc-dac-special) | 2,524 | 933 | 37% |
| [Analog Switches — Special Purpose](/category/analog-switches-special) | 2,081 | 933 | 45% |

Analog switches are the worst-affected at 44-45%, which makes sense: they are the least differentiated function in the chain, so vendors prune them first, and the survivors are built on newer low-voltage processes that cannot take the ±15 V rails the originals worked on. That specific trap is covered in [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide).

## Resolution is not accuracy

Resolution tells you the size of a code step; accuracy tells you how far the code is from the truth. They are separate specifications and they fail separately.

The theoretical best signal-to-noise ratio of an ideal N-bit converter is:

```
SNR = 6.02 × N + 1.76 dB
```

For a 16-bit part that is 98.1 dB. Real parts publish an **ENOB** (effective number of bits) that folds in their own noise and distortion. It is normally 1.5 to 3 bits below the nameplate. A 16-bit converter with 13.5 ENOB is doing 13.5 bits of work; buying a 16-bit replacement with 12 ENOB is a downgrade that the resolution field on a parametric search will not show you.

Three more specifications matter and none of them is resolution:

- **INL** (integral non-linearity) — deviation of the transfer curve from a straight line, in LSB. This is the one that shows up as a calibration that will not close.
- **DNL** (differential non-linearity) — variation in step size. If DNL is worse than −1 LSB, codes are missing.
- **No missing codes**, guaranteed to a stated resolution. An 18-bit converter may only guarantee no missing codes at 16 bits. In a control loop, missing codes are a discontinuity in the feedback path.

Ask for the ENOB and INL of the replacement, not just the bit count. If the vendor only publishes resolution, that is itself information.

## The error budget, worked

Build the budget in LSBs of the actual system, because that is the unit the argument will be settled in.

Take a 16-bit converter on a 5.000 V full-scale range:

```
1 LSB = 5.000 V / 65,536 = 76.3 µV
```

Now a reference specified at 10 ppm/°C, over a 60 °C operating span, referred to its 25 °C calibration point:

```
drift = 10 ppm/°C × 60 °C = 600 ppm
      = 600 × 10⁻⁶ × 5.000 V = 3.00 mV
      = 3.00 mV / 76.3 µV = 39 LSB
```

Thirty-nine counts of error from the reference alone, on a converter whose own INL might be ±2 LSB. Add the reference's initial accuracy — 0.1% is 5 mV, another 65 LSB unless it is calibrated out, and the picture is unambiguous:

| Contributor | Typical figure | Error at 5 V FS | In LSB (16-bit) |
| --- | --- | ---: | ---: |
| Reference initial accuracy (0.1%) | ±0.1% | ±5.0 mV | ±65 |
| Reference tempco (10 ppm/°C, 60 °C) | 600 ppm | ±3.0 mV | ±39 |
| Converter INL | ±2 LSB | ±153 µV | ±2 |
| Converter offset (uncalibrated) | ±1 mV | ±1.0 mV | ±13 |
| Amplifier offset drift (2 µV/°C, 60 °C) | 120 µV | ±120 µV | ±1.6 |
| Switch/mux leakage into 100 kΩ (1 nA) | — | ±100 µV | ±1.3 |

The two largest rows are both the reference. This is why [voltage reference selection](/blog/voltage-reference-selection-guide) is the highest-leverage part of a converter substitution, and why swapping the ADC while keeping the reference frequently produces no measurable change at all.

Initial accuracy is calibratable; tempco and thermal hysteresis are not, at least not without characterising every unit over temperature. **Treat calibratable and non-calibratable error as different currencies.**

## Pin-compatible is not interchangeable

The most expensive substitutions are the ones that fit.

`ADS1115IRUGT` and `ADS1015IRUGR` are both in our catalogue, both active, both Texas Instruments, same 10-pin footprint, same I²C addressing, same register map. One is 16-bit and one is 12-bit. Fit the 12-bit part where the 16-bit part was and:

- the board powers up,
- the bus enumerates,
- the registers read back plausibly,
- and every measurement is wrong by a factor of 16 in the low bits, because the conversion result is left-aligned differently than the firmware assumes.

Nothing in the test rack flags this unless the test compares against a known reference at more than one level. The same hazard runs through the `MCP342x` family and through most vendors' pin-compatible resolution ladders.

Rule: when the replacement is in the same family, check resolution and data alignment before checking anything else. The closer the part number, the more likely the trap.

## Architecture decides latency, filtering and drive

Three architectures dominate, and they are not substitutable even at identical resolution and sample rate.

| | SAR | Delta-sigma | Pipeline |
| --- | --- | --- | --- |
| Typical resolution | 8-18 bit | 16-32 bit | 8-16 bit |
| Typical rate | kSPS to few MSPS | SPS to hundreds of kSPS | MSPS to GSPS |
| Latency | One conversion | **Tens of samples** (filter group delay) | Fixed pipeline of several clocks |
| Anti-alias filter | External, mandatory | **Largely internal** (oversampling + decimation) | External, mandatory |
| Input | Switched-cap, needs charge | Continuously sampled, often easier | Switched-cap, wideband driver |
| Example in catalogue | `ADS8881IDRCR` | `ADS1256IDBT`, `AD7768-1BCPZ-RL7` | `AD9280ARSZ` |

Two failure modes come out of this table:

Replacing a delta-sigma with a SAR loses your anti-aliasing. The delta-sigma's oversampling and decimation filter was suppressing out-of-band noise for you. A SAR at the same output data rate samples the input directly, and everything above half that rate folds back into the band. The board does not fail: the noise floor just rises and nobody can explain why.

Replacing a SAR with a delta-sigma adds latency to a control loop. A digital filter with a group delay of, say, 30 output samples inserts 30 sample periods of phase lag. A current loop tuned around a single-conversion SAR can become unstable. This is the same class of problem as changing the group delay in a clock path, described in [clock generators and PLLs](/blog/clock-generator-pll-sourcing).

## Drive requirements: what the legacy part did not need

A modern switched-capacitor input demands a charge kick on every acquisition, and the source has to supply it. The sampling capacitor is discharged onto the input at the start of each acquisition window; the driving impedance and the acquisition time together determine whether it settles.

An older converter with a resistive or buffered input tolerated being driven straight from a sensor divider. Its modern replacement frequently does not, and the symptom is gain error that scales with sample rate — small at 1 kSPS, unacceptable at 500 kSPS. **If the replacement's datasheet has a section titled "driving the analog input", the old circuit is probably not adequate.**

What to check:

- **Maximum recommended source impedance** at the intended sample rate.
- **Acquisition time**, and whether the mux settling in front of it fits inside that window — see [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide).
- **Whether a driving amplifier is required**, and whether it must be a specific class (rail-to-rail input, unity-gain stable, capable of driving the sampling load). [Op-amp equivalents](/blog/op-amp-equivalent-selection) covers what has to match if that amplifier is also being second-sourced.
- **Input common-mode range** on differential parts, which is not the same as the supply range.
- **Reference input current**, which on some SAR parts is dynamic and needs its own reservoir capacitor.

## Internal reference, external reference, and the default nobody reads

Whether the reference is internal or external changes the board, not just the part. Three combinations cause trouble:

1. **Internal-reference part replaced by external-reference part.** The reference pin is now an input with nothing driving it. Readings are noise or zero.
2. **External-reference part replaced by internal-reference part.** Usually works, but accuracy is now set by a reference you did not specify and cannot calibrate independently. On instruments this invalidates the calibration certificate.
3. **Same part, different internal reference gain.** Some DAC families offer a ×1 or ×2 internal reference gain option in the suffix. The output range doubles or halves with no other visible change.

On the DAC side, add the power-on default state. DACs reset to zero-scale or mid-scale depending on the part, and sometimes depending on the suffix. On a valve driver, a servo amplifier, or anything with a 4-20 mA output like `AD5422BREZ-REEL`, mid-scale on power-up is a moving actuator. This is a safety specification, and it deserves the same scrutiny as [supervisor and reset timing](/blog/supervisor-reset-ic-selection-guide) in the power sequence. Details are in [DAC sourcing](/blog/dac-sourcing-guide).

## Grade suffixes mean three different things

The letter in the middle of the part number is not a quality ranking. Depending on the family it encodes temperature range, initial accuracy or speed, and the convention does not transfer between vendors.

| Family | What the letter changes | Example |
| --- | --- | --- |
| `LM4040` shunt reference | **Initial accuracy grade** — A is tightest, D loosest | `LM4040A10IDBZRG4` vs `LM4040DIZ-5.0/NOPB` |
| `TL431` shunt regulator | **Accuracy/variant class** | `TL431AIZ` vs `TL431BIDRE4` |
| `LM193 / LM293 / LM393` comparator | **Temperature range only** — the die is the same | `LM193DRG4` vs `LM2903N` |
| Converters generally | Often **speed and INL grade** together | `AD586KNZ` vs `AD586JNZ` |

We hold 120 `LM4040A` and 197 `LM4040D` part numbers. They are not the same reference, and a BOM that lists only "LM4040-2.5" is under-specified: a point that belongs in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

## What obsolescence looks like in this cluster

Converters are where authorised aftermarket matters most, because the classics were designed in the 1980s and 1990s into instruments still in production.

The pattern in our data is consistent: the original industrial-temperature ceramic or DIP version is `obsolete`, a plastic or lead-free variant is `active`, and the supply of the obsolete one runs through Rochester Electronics.

| Legacy part | Status in catalogue | What it was |
| --- | --- | --- |
| `AD574AJE` | obsolete | 12-bit hybrid successive-approximation ADC |
| `AD7703AR` | obsolete | 20-bit delta-sigma ADC |
| `ADC0804LCWM` | obsolete (`ADC0804LCWM-NS` active) | The 8-bit parallel workhorse |
| `AD7476ABRM-REEL` | obsolete | SOT-23 12-bit SAR |
| `AD7541AJP` | obsolete | 12-bit multiplying DAC, current output |
| `PM7524FP` | obsolete | Second source to the `AD7524` |
| `REF102AP` | last-time buy | 10.000 V precision reference |
| `LTZ1000ACH` | obsolete (`LTZ1000CH#PBF` active) | Buried-zener metrology reference |
| `MAX368CPN+` | last-time buy | Fault-protected multiplexer |

A last-time-buy reference is a different problem from a last-time-buy ADC. Replacing `REF102AP` in a calibrated instrument means the calibration has to be redone, per unit, because the new reference has its own initial error and drift. That cost belongs in the sourcing decision. It is usually larger than the price delta on the part. The decision framework is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and the channel question in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Resolution **and** output data alignment | Silent scaling error in firmware |
| 2 | ENOB and INL, not just bit count | Calibration will not close |
| 3 | No-missing-codes guarantee | Discontinuity in a control loop |
| 4 | Architecture (SAR / delta-sigma / pipeline) | Lost anti-aliasing, or added loop latency |
| 5 | Reference: internal, external, and gain option | Dead reading, or doubled range |
| 6 | Reference tempco and initial accuracy | Tens of LSB of uncalibratable error |
| 7 | Maximum source impedance and acquisition time | Gain error that scales with sample rate |
| 8 | Input common-mode and absolute maximum ratings | Damage on a legacy ±15 V board |
| 9 | Interface: SPI mode, I²C address range, parallel width | No communication, or address clash |
| 10 | DAC output type: voltage, current, multiplying | Requires an external I-to-V stage |
| 11 | DAC power-on default and monotonicity | Actuator moves on power-up |
| 12 | Temperature grade and package thermal path | Drift outside specification in the enclosure |
| 13 | Latency and group delay | Unstable loop |

## FAQ

### Is a 16-bit ADC always more accurate than a 12-bit ADC?

No. Resolution sets the step size; accuracy is set by the reference, the converter's INL and offset, and the analog front end. A 16-bit converter running from a 1% initial-accuracy reference with 50 ppm/°C drift is less accurate in absolute terms than a 12-bit converter with a calibrated 2 ppm/°C reference, even though it reports four more bits. Ask for ENOB and INL alongside resolution, and build an error budget in LSBs of the actual full-scale range before deciding.

### Can I replace an ADC with a pin-compatible part from the same family?

Only after checking resolution and data alignment. Families deliberately offer pin-compatible resolution ladders — `ADS1115` at 16 bits and `ADS1015` at 12 bits share footprint, I²C interface and register map, so the wrong choice fits, powers up and communicates while returning results the firmware scales incorrectly. Also confirm the reference arrangement, the maximum sample rate and the input range, since those often differ across the same footprint.

### Why does my new converter need a driving amplifier when the old one did not?

Because most modern converters have switched-capacitor inputs. At the start of each acquisition the sampling capacitor is connected to the input and must be charged to the signal voltage within the acquisition window, which requires the source to supply a current spike. A legacy part with a buffered or resistive input tolerated a high-impedance source; the replacement does not. The symptom is a gain error that grows with sample rate. Check the maximum recommended source impedance at your intended throughput.

### What does the reference contribute to overall error?

Usually the largest single share. For a 16-bit converter on a 5 V range, one LSB is 76.3 µV, so a reference with 10 ppm/°C drift over a 60 °C span contributes 600 ppm, or 3 mV, which is 39 LSB. Initial accuracy of 0.1% adds another 5 mV, or 65 LSB, unless it is calibrated out. Both figures dwarf a typical ±2 LSB converter INL, which is why the reference is the first thing to examine in a converter substitution.

### Are SAR and delta-sigma ADCs interchangeable at the same resolution?

No, for two reasons. A delta-sigma oversamples and applies an internal decimation filter, which provides most of the anti-aliasing; a SAR samples the input directly and requires an external anti-alias filter, so substituting a SAR raises the noise floor by folding out-of-band content into the band. In the other direction, the delta-sigma's digital filter has a group delay of tens of samples, which inserts phase lag that can destabilise a control loop tuned around a single-conversion SAR.

### What is the risk with a DAC's power-on default state?

That it moves an actuator before the processor has written anything. DACs reset to either zero-scale or mid-scale, and the choice varies by part and sometimes by suffix. In a 4-20 mA industrial output or a servo drive, a mid-scale default is a half-travel command applied at power-up. Confirm the default from the datasheet's reset section rather than assuming zero, and verify the behaviour of the load during a power-cycle test after any substitution.

### Which signal-chain categories are worst affected by obsolescence?

Analog switches and multiplexers, at 44% not active across 9,895 part numbers, and the special-purpose switch category at 45% of 2,081. They are the least differentiated function in the chain so vendors prune them first, and the modern survivors are built on low-voltage processes that cannot handle the ±15 V rails the originals ran on. Voltage references sit at 30% of 8,143, ADCs at 33% of 14,838, and DACs at 28% of 11,852.

### Does replacing a voltage reference invalidate an instrument's calibration?

In general yes, for any instrument whose accuracy specification depends on that reference. The replacement has its own initial error, tempco and thermal hysteresis, so the stored calibration constants no longer describe the hardware. Budget for recalibration per unit, not per design. This is the main reason a last-time-buy on a reference such as `REF102AP` is often the cheaper decision even at a poor unit price.

## Related reading

The four spokes of this cluster: [ADC sourcing](/blog/adc-sourcing-guide) for architecture and input drive, [DAC sourcing](/blog/dac-sourcing-guide) for output structure and defaults, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the front-end, [voltage reference selection](/blog/voltage-reference-selection-guide) for the term that dominates the budget, and [comparator selection](/blog/comparator-selection-guide) for the threshold-detection edge of the same signal chain.

Adjacent clusters: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) for the supply side, [op-amp equivalents](/blog/op-amp-equivalent-selection) for the driving amplifier, [EOL, NRND and obsolete explained](/blog/eol-nrnd-obsolete-ic-lifecycle-explained) for the status vocabulary, and [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) for finding these parts before they find you.

Send us the part number with your reference, full-scale range and sample rate, and we will come back with candidates that fit the error budget rather than just the footprint.

[**Submit an RFQ**](/rfq) | [**Browse ADCs**](/category/adc) | [**Browse DACs**](/category/dac) | [**Upload a BOM**](/bom)
