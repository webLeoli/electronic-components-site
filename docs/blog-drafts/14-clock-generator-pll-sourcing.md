---
title: "Clock Generators and PLLs: Jitter, Output Format and Drop-In Risk"
slug: "clock-generator-pll-sourcing"
status: "draft"
seoTitle: "Clock Generator & PLL Replacement: Jitter and Format Guide"
seoDesc: "Replacing a clock generator or PLL: LVDS vs LVPECL vs HCSL termination, period versus RMS phase jitter, the ADC SNR jitter formula, buffer additive jitter and configuration hazards."
seoKeywords: "clock generator replacement, PLL second source, LVPECL vs LVDS, HCSL termination, clock jitter ADC SNR, phase jitter integration band, obsolete clock generator"
tags: "clock generator, PLL, jitter, LVDS, LVPECL, HCSL, second source, analog sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "SI5351A-B-GTR, 5P49V5901B000NLGI8, NB3W1200LMNTXG, NB2308AI2DTR2G, CDCDLP223PWR, ASM3P2669AF-06OR"
---

# Clock Generators and PLLs: Jitter, Output Format and Drop-In Risk

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: clock generator, PLL, jitter, LVDS, LVPECL, HCSL, second source

---

**A clock device is specified by its output format and its jitter, not by its frequency.** Two synthesisers that both produce 156.25 MHz can be entirely non-interchangeable: one drives LVPECL and the other LVDS, one has 200 fs of RMS phase jitter and the other 2 ps, and the difference decides whether a SerDes link closes or a data converter meets its noise floor. This guide covers what has to match when replacing a discontinued clock generator, PLL or buffer.


<img src="/uploads/blog/clock-generator-pll-sourcing.webp" alt="Precision clock generator and PLL circuit with synchronized signal paths" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Output format is a hard incompatibility.** LVDS, LVPECL, HCSL and CMOS differ in common-mode voltage, swing and termination. Substituting one for another without changing termination will not work.
- **Jitter has two units and they answer different questions.** Period jitter governs setup/hold timing; RMS phase jitter over a stated integration band governs SerDes and data-converter performance.
- LVPECL needs a **DC bias path to work at all**, usually a Thevenin network or emitter pull-downs. Dropping LVPECL into an LVDS footprint leaves the outputs unbiased.
- Additive jitter of a **buffer** matters as much as the source when the chain is long.
- Programmable synthesisers often need a **configuration image**; the replacement's register map is rarely identical, and some parts ship factory-programmed to an ordering-code-specific default.
- Around 32,300 clock and PLL part numbers are in the catalogue, a large fraction of them obsolete.

---

## Why clock substitutions fail differently

A clock is an interface, not just a signal. When a regulator substitution fails you get instability or heat. When a clock substitution fails you get a link that does not train, a converter whose SNR is 6 dB worse than the datasheet, or a bus that works at room temperature and fails at 70 °C. All three look like problems somewhere else in the system, which is why clock substitutions consume so much debugging time.

Clock generators, PLLs and synthesisers account for roughly 32,300 part numbers in our catalogue, and this family carries an unusually high proportion of obsolete lines — several of the highest-stock devices we hold are already discontinued. It is a family where second-sourcing comes up often.

## 1. Output format: a hard incompatibility

Differential clock standards are not variations on a theme. They differ in common-mode voltage, differential swing and required termination, and each expects a specific network at the receiver.

| Format | Typical common mode | Typical swing (differential) | Termination | Bias requirement |
| --- | --- | --- | --- | --- |
| LVDS | ~1.2 V | ~350 mV | 100 Ω across the pair | Self-biased |
| LVPECL | ~Vcc − 1.3 V | ~800 mV | 50 Ω to Vcc − 2 V, or Thevenin | **Requires DC path to ground** |
| HCSL | ~0.35 V | ~700 mV | 50 Ω to ground + series R | Source-terminated |
| CMOS | Vcc/2 | Rail to rail | Series R at source | None |

Three specific traps:

LVPECL without a bias path does not oscillate — it does nothing. LVPECL outputs are emitter followers and need a DC current path to ground, typically 150 Ω to ground per leg or a Thevenin network equivalent to 50 Ω into Vcc − 2 V. An LVDS footprint provides a 100 Ω differential resistor and no path to ground. Fit an LVPECL part there and the outputs sit at an undefined level.

HCSL is source-terminated and expects a particular receiver network. It is the standard for PCIe reference clocks specifically, and the 50 Ω-to-ground plus series resistor arrangement is not what an LVDS receiver expects.

CMOS is single-ended and does not scale. A CMOS clock above roughly 100-200 MHz becomes difficult to route cleanly, and its rail-to-rail swing injects far more noise into the ground plane than a differential format. Substituting CMOS for a differential output because "the frequency matches" changes the EMI profile of the whole board.

**Check:** the exact output standard of both parts, the termination network present on the board, and whether the replacement can be configured to the original's format — some multi-format parts can, most cannot.

## 2. Jitter — two numbers answering different questions

"Low jitter" on a datasheet front page is not a specification. There are two distinct measurements and they matter to different parts of a system.

### Period and cycle-to-cycle jitter

Measured in picoseconds peak-to-peak, this is the variation in the length of individual clock cycles. It governs **timing margin** in synchronous logic: setup and hold on a parallel bus, a memory interface, or an FPGA's internal paths. If a design is close to timing closure, a replacement with worse period jitter erodes the margin directly.

### RMS phase jitter over an integration band

Measured in femtoseconds or picoseconds RMS, integrated over a stated frequency band — commonly 12 kHz to 20 MHz. This is the number that governs:

- **SerDes bit error rate.** A transceiver's jitter tolerance budget assumes a reference clock cleaner than some threshold.
- **Data converter SNR.** For an ADC sampling at frequency `f_in`, clock jitter sets an SNR ceiling:

```
SNR_jitter (dB) = −20 × log10(2π × f_in × t_jitter_RMS)
```

Worked example — sampling a 70 MHz IF with 1 ps RMS clock jitter:

```
SNR = −20 × log10(2π × 70e6 × 1e-12)
    = −20 × log10(4.40e-4)
    ≈ 67 dB
```

A 14-bit ADC with an 74 dB theoretical SNR is now limited to 67 dB by its clock. Improve the clock to 200 fs and the jitter-limited ceiling rises to about 81 dB, and the converter is no longer clock-limited.

The integration band matters as much as the number. A part quoting 200 fs over 12 kHz-20 MHz is not comparable to one quoting 200 fs over 10 kHz-1 MHz. Always compare over the same band, and use the band your receiver actually specifies.

**Check:** which jitter specification your application is sensitive to; the figure for both parts over an identical integration band.

## 3. Additive jitter in buffers and fanout

A clock buffer or fanout device adds jitter of its own. In a chain (synthesiser, buffer, second buffer, endpoint) the contributions add in quadrature:

```
t_total = √(t_source² + t_buf1² + t_buf2² + ...)
```

With a 200 fs source and two buffers at 100 fs each:

```
t_total = √(200² + 100² + 100²) = √(40000 + 10000 + 10000) ≈ 245 fs
```

Acceptable. Replace one buffer with a 500 fs part:

```
t_total = √(40000 + 250000 + 10000) ≈ 548 fs
```

The chain is now dominated by a single cheap buffer. Substituting the *buffer* has undone the reason the expensive synthesiser was chosen.

**Check:** additive jitter of any buffer in the path, over the same integration band as the source.

## 4. PLL loop bandwidth and jitter transfer

A PLL does not merely multiply frequency; it filters the reference. Loop bandwidth determines which reference noise passes through and which is attenuated, and where the PLL's own VCO noise dominates instead.

- **Narrow loop bandwidth** attenuates reference jitter well but lets VCO noise through close to the carrier, and locks more slowly.
- **Wide loop bandwidth** tracks the reference closely (including its noise) but suppresses VCO noise.

A replacement with a different loop bandwidth will have a different output phase-noise profile even with an identical reference and identical output frequency. For a jitter-cleaner application specifically, the whole point of the part is a narrow loop bandwidth, and a wide-bandwidth replacement simply does not perform the function.

Also check **lock time** if the system has a start-up sequence that assumes the clock is available within some window, and **holdover behaviour** if the reference can disappear.

**Check:** loop bandwidth, whether it is programmable, lock time, and behaviour on reference loss.

## 5. Configuration and programmability

Many modern synthesisers are programmable, and this is a substitution hazard rather than a convenience.

Three distinct cases:

| Configuration method | Substitution implication |
| --- | --- |
| Hardware pin-strapped | Straps must mean the same thing on the replacement — verify each |
| Factory-programmed (OPN-specific) | The ordering part number *is* the configuration; a "same family" part is a different device |
| Field-programmable over I²C/SPI | Register map differs between families; firmware must be rewritten |

The factory-programmed case catches people most often. A part number such as a `-B-GTR` suffix variant may denote a specific default configuration burned at manufacture. Ordering the "same" device with a different suffix gives you different output frequencies out of reset.

For field-programmable parts, budget firmware work. Register maps are rarely compatible even within one vendor's portfolio, and the configuration file produced by a vendor's clock-tree tool is device-specific.

**Check:** how the original is configured; whether the replacement uses the same method; whether a configuration image must be regenerated and firmware updated.

## 6. Supply, spread spectrum and the small print

- **Supply voltage and pin count.** 3.3 V and 2.5 V variants of the same family often share a footprint but not a part number. Some also require separate analogue and digital supplies with a specified sequencing order.
- **Spread-spectrum clocking.** If the original applied SSC to pass EMC and the replacement does not (or applies a different modulation depth or profile) expect measured emissions to move. Some standards forbid SSC on certain links, so the reverse is also a hazard.
- **Output enable and stop behaviour.** Whether outputs stop glitch-free, and whether stopping is per-output or global.
- **Skew between outputs**, for fanout devices feeding a synchronous system.

## A substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Output format identical, or termination reworked | No output, or unusable levels |
| 2 | LVPECL bias path present | Outputs sit undefined |
| 3 | Period jitter within timing budget | Marginal setup/hold, temperature-dependent failures |
| 4 | RMS phase jitter over the *same* band | SerDes errors; ADC SNR shortfall |
| 5 | Buffer additive jitter accounted for | Chain dominated by cheapest part |
| 6 | Loop bandwidth suits the role | Jitter cleaning lost, or lock too slow |
| 7 | Configuration method and image | Wrong frequencies out of reset |
| 8 | Supply rails and sequencing | Does not start, or starts unreliably |
| 9 | SSC presence and profile matches | EMC re-test failure |
| 10 | Output-to-output skew | Synchronous system loses margin |

## How to verify

1. **Scope the output into the real termination**, not a 50 Ω instrument input, and confirm common mode and swing match the receiver's requirement.
2. **Measure phase noise** and integrate over the band your receiver specifies. A spectrum analyser with a phase-noise personality, or a dedicated analyser, is required: an oscilloscope's jitter measurement is not equivalent.
3. **Run the link, not the clock.** For a SerDes, check the receiver's own eye-margin or bit-error-rate reporting. For an ADC, measure SNR with a full-scale sine at the highest input frequency of interest, which is where jitter dominates.
4. **Temperature.** Phase noise and lock behaviour both drift; test at the extremes.
5. **Start-up.** Confirm lock time and that downstream logic tolerates the clock being absent or unstable during it.

## Where these parts sit in the catalogue

Clock generators, PLLs and synthesisers cover roughly 32,300 part numbers. Devices such as `SI5351A-B-GTR`, `5P49V5901B000NLGI8` and `NB3W1200LMNTXG` remain active, while a substantial number — `NB2308AI2DTR2G`, `ASM3P2669AF-06OR`, `ASM3P2872AF-06OR`, `CDCDLP223PWR`, `NB2308AI1HDR2G` among them — are already obsolete and reachable through authorised aftermarket channels.

That obsolescence rate is the reason this family shows up disproportionately in sourcing requests. Confirm the current datasheet for whichever part you shortlist. Browse [clock generators and PLLs](/category/clock-generators-plls).

## FAQ

### Can I replace an LVPECL clock with an LVDS one?

Not without reworking the termination. LVPECL and LVDS differ in common-mode voltage, differential swing and termination requirements. LVPECL outputs are emitter followers that need a DC path to ground — typically 150 ohms per leg to ground, or a Thevenin network equivalent to 50 ohms into Vcc minus 2 V — whereas an LVDS network provides a 100 ohm differential resistor and no ground path. Fitting an LVPECL device into an LVDS footprint leaves its outputs unbiased and produces no usable clock.

### What is the difference between period jitter and phase jitter?

Period jitter, quoted in picoseconds peak-to-peak, measures variation in the length of individual clock cycles and governs setup and hold timing in synchronous logic. RMS phase jitter, quoted in femtoseconds or picoseconds over a stated integration band such as 12 kHz to 20 MHz, is the integral of phase noise and governs serial link bit error rate and data converter signal-to-noise ratio. They are different measurements and a part can be good at one and mediocre at the other.

### How does clock jitter limit ADC performance?

Clock jitter sets a ceiling on achievable signal-to-noise ratio that worsens with input frequency, following SNR in dB equal to minus 20 times the base-10 logarithm of two pi times the input frequency times the RMS jitter. Sampling a 70 MHz input with 1 picosecond of RMS clock jitter limits SNR to roughly 67 dB, which would waste most of a 14-bit converter. Reducing jitter to 200 femtoseconds raises the ceiling to about 81 dB.

### Does a clock buffer add jitter?

Yes. Every buffer contributes additive jitter, and contributions along a chain combine in quadrature: the square root of the sum of the squares. A 200 femtosecond source followed by two 100 femtosecond buffers gives about 245 femtoseconds total, but replacing one buffer with a 500 femtosecond part raises the total to about 548 femtoseconds, at which point the cheap buffer dominates the chain and the expensive synthesiser is wasted.

### Why do two clock generators with the same frequency behave differently?

Because frequency is one of the least distinguishing specifications for a clock device. Output format, jitter performance over the relevant band, PLL loop bandwidth, configuration method, supply requirements and spread-spectrum behaviour all vary independently of frequency. Two parts that both produce 156.25 MHz can require different terminations, differ by an order of magnitude in phase jitter, and need entirely different firmware to configure.

### What is PLL loop bandwidth and why does it matter for a replacement?

Loop bandwidth determines how a PLL divides responsibility between the reference and its own oscillator. A narrow loop bandwidth attenuates reference noise and is what makes a jitter-cleaner work, but lets more VCO noise through close to the carrier and locks slowly. A wide loop bandwidth tracks the reference closely, including its noise. A replacement with different loop bandwidth produces a different output phase-noise profile from the same reference, so a wide-bandwidth part cannot perform a jitter-cleaning role.

### Are programmable clock generators harder to second-source?

Generally yes. Field-programmable synthesisers use vendor-specific and often family-specific register maps, so a substitution usually requires regenerating a configuration image with the new vendor's clock-tree tool and rewriting the firmware that loads it. Factory-programmed devices are harder still: the ordering part number encodes the configuration, so an apparently similar part number with a different suffix is effectively a different device with different output frequencies out of reset.

## Related reading

The general framework for analog substitutions — tiers of equivalence, the qualification workflow, and when a last-time-buy is cheaper than requalification — is in [the analog and power second-sourcing guide](/blog/analog-power-second-sourcing-guide). Clock devices are frequently powered from a dedicated low-noise rail; if that rail is changing too, [the LDO cross-reference guide](/blog/ldo-cross-reference-guide) covers the PSRR implications, and [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide) covers what happens when the switcher upstream moves frequency.

Send us the discontinued part number with your output format, the jitter figure you need and the integration band it is specified over, and we will return candidates that meet them — including authorised aftermarket stock on obsolete lines, which this family has more of than most.

[**Submit an RFQ**](/rfq) | [**Browse clock generators & PLLs**](/category/clock-generators-plls) | [**Upload a BOM**](/bom)

---

**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-08-02

