---
title: "DAC Sourcing: Output Structure Decides Whether It Is a Drop-In"
slug: "dac-sourcing-guide"
status: "draft"
seoTitle: "DAC Sourcing Guide: Voltage, Current and Multiplying DAC Replacement"
seoDesc: "Replacing an obsolete DAC: voltage vs current vs multiplying outputs, R-2R vs string architecture, monotonicity, glitch impulse, settling time and the power-on default state."
seoKeywords: "DAC sourcing, obsolete DAC replacement, multiplying DAC, AD7541, AD7545, AD7524, R-2R DAC, glitch impulse, DAC monotonicity, DAC power-on reset, 4-20mA output DAC"
tags: "DAC, multiplying DAC, R-2R, monotonicity, glitch impulse, settling time, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Data Converters & Signal Chain"
relatedProducts: "DAC108S085CIMT/NOPB, AD5693RBRMZ-RL7, AD7545AES, AD7541AJP, AD7524JP, PM7524FP, LTC1650AIN#PBF, AD5422BREZ-REEL"
---

# DAC Sourcing: Output Structure Decides Whether It Is a Drop-In

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: voltage output, current output, multiplying DACs, monotonicity, glitch impulse, settling, power-on state

---

**The first question about a DAC replacement is not resolution; it is what comes out of the output pin.** A voltage-output DAC drives a load directly. A current-output DAC needs an external amplifier to become a voltage. A multiplying DAC is an attenuator whose reference input is a signal, and it has no meaningful output at all without the surrounding circuit. All three appear in searches as "12-bit DAC", and swapping between them is a schematic change. Our [DAC category](/category/dac) holds 11,852 part numbers with 3,342 no longer active (28%) and the legacy end is dominated by exactly the current-output and multiplying parts that are hardest to substitute.


<img src="/uploads/blog/dac-sourcing-guide.webp" alt="Digital-to-Analog Converter output structure on a precision evaluation board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Three output structures (voltage, current and multiplying) are not interchangeable**, and the part number rarely says which.
- **A multiplying DAC such as `AD7541AJP` or `AD7545AES` produces a current** and expects an external op-amp with a specific feedback path; a voltage-output part in its place leaves the amplifier stage doing nothing sensible.
- **Monotonicity is a safety property in a control loop**. It is guaranteed by architecture: string DACs are inherently monotonic, R-2R DACs are guaranteed only to a stated resolution.
- **Glitch impulse at the major carry is a real disturbance** in servo and audio paths, measured in nV·s, and it varies by an order of magnitude between architectures.
- **Settling time must be compared against the update rate**, and the two are quoted to different error bands by different vendors.
- **The power-on default is zero-scale on some parts and mid-scale on others.** On an actuator output, this is a hazard analysis item.
- **Internal reference gain options (×1 or ×2) silently double the output range** across an otherwise identical footprint.

---

## Three output structures

Establish which of these the existing design uses before looking for candidates.

| Structure | What the pin does | What the board needs | Example in catalogue |
| --- | --- | --- | --- |
| **Voltage output, buffered** | Drives a voltage, typically 0 to V_REF or 0 to 2×V_REF | Nothing; maybe a load capacitor limit | `DAC108S085CIMT/NOPB`, `AD5693RBRMZ-RL7` |
| **Voltage output, unbuffered** | Presents a voltage behind a resistance | A high-impedance buffer, or accept the loading error | `LTC1650AIN#PBF` (buffered — check per part) |
| **Current output** | Sinks or sources a current proportional to code | An I-to-V amplifier, and a compliance-voltage check | `DAC0808LCM/NOPB` |
| **Multiplying (MDAC)** | Attenuates an AC or DC signal applied to V_REF | External op-amp plus the internal feedback resistor | `AD7545AES`, `AD7541AJP`, `AD7524JP` |

The multiplying DAC is the one that catches people. It is a programmable attenuator: the reference input takes a signal, the ladder scales it by code, and the output is a current into a virtual ground. The internal feedback resistor (`R_FB`) is trimmed to match the ladder, which is why the external amplifier's feedback path must use it rather than a discrete resistor.

Worked example. An `AD7545` class 12-bit MDAC with a 10 V reference and the internal feedback resistor:

```
full-scale output = −V_REF × (4095/4096) = −9.9976 V
step size         = 10 V / 4096 = 2.44 mV
```

Replace that with a modern buffered voltage-output DAC and the external amplifier now sees a voltage source where it expected a current into a summing node. **Output is wrong in sign, scale and impedance simultaneously.**

We hold 89 `DAC08…` parts (39 not active), 46 `AD7545…` (some obsolete, `AD7545AES` active) and 23 `AD7541…` (obsolete). `AD7524JP` is obsolete and `PM7524FP` (the Precision Monolithics second source to the same device) is also obsolete, which is a good illustration of why a historical second source is not a lifecycle strategy. The vocabulary for these states is in [EOL, NRND and obsolete explained](/blog/eol-nrnd-obsolete-ic-lifecycle-explained).

## Architecture: R-2R, string and sigma-delta

Architecture determines monotonicity, glitch and matching. It is not usually in the search filters.

| | R-2R ladder | String / Kelvin divider | Sigma-delta |
| --- | --- | --- | --- |
| Monotonic by construction | **No** | **Yes** | Yes |
| Glitch at major carry | Largest — many switches change at once | Small — one tap moves | None in the analog sense |
| Settling | Fast | Fast | Limited by output filter |
| Resolution ceiling | Limited by resistor matching | Limited by tap count and area | Very high |
| Typical use | Legacy industrial, multiplying | Modern general purpose | Audio, precision DC |

Monotonicity is the specification with a safety consequence. In a closed loop (position servo, temperature control, laser bias) a non-monotonic DAC means an increase in code can produce a decrease in output. The loop responds by increasing the code further, and the system can latch at the discontinuity or oscillate around it.

R-2R DACs at 16 bits are commonly guaranteed monotonic only to 14 or 15 bits. **"Monotonic to 15 bits" on a 16-bit part is not a rounding detail; it is a statement that two adjacent codes may reverse.** If the original part guaranteed monotonicity at full resolution and the replacement does not, that is a functional downgrade in any loop.

## Glitch impulse, and why servo people care

Glitch impulse is the area of the transient when the code changes, quoted in nV·s (or pV·s). It is worst at the major carry: the transition where the top bit changes and every lower switch flips, for example 0111 1111 1111 → 1000 0000 0000.

A 4 nV·s glitch might appear as a 20 mV spike lasting 200 ns:

```
20 mV × 200 ns = 4 nV·s
```

On a 16-bit 5 V DAC, 1 LSB is 76.3 µV, so that spike is **262 LSB tall** while it lasts. Whether it matters depends entirely on what follows:

- **Into a mechanical actuator**, the mass filters it and nobody notices.
- **Into a fast current loop or a laser driver**, it is a real disturbance.
- **Into an audio path**, it is audible as distortion at zero crossings, which is why deglitchers and string architectures dominate audio DACs.
- **Into a sample-and-hold or a comparator**, it can cause a false trigger — see [comparator selection](/blog/comparator-selection-guide).

Substituting an R-2R part where a string DAC was used typically increases glitch by an order of magnitude. If the original design had no output filter, it probably relied on the low-glitch architecture.

## Settling time versus update rate

Compare settling time against the interval between updates, and check the error band each is quoted to.

A DAC quoted at "10 µs settling" may mean settling to ±0.5 LSB, to ±1 LSB, or to 0.01% of full scale, which at 16 bits is 6.5 LSB. Those are different specifications:

```
update rate 100 kSPS → 10 µs per update
settling to ±0.5 LSB in 10 µs → just adequate, no margin
settling to ±0.5 LSB in 14 µs → the output never arrives before the next code
```

The second case does not fail cleanly. The output tracks a smoothed, lagging version of the intended waveform, which in a control loop appears as extra phase lag and in a waveform generator as amplitude error that grows with frequency.

Also check:

- **Slew rate of the output amplifier**, which limits large-step performance separately from small-signal settling.
- **Capacitive load tolerance.** Buffered outputs can be conditionally stable; a cable or a filter capacitor added for EMC reasons can cause ringing or oscillation.
- **Output short-circuit current and the load resistance** the specification assumes.

## Reference and range: the silent doubling

Two things about the reference change the output range without changing anything visible.

Internal reference gain. Many modern DACs offer a ×1 or ×2 internal gain, sometimes as a suffix option, sometimes as a register bit whose reset default varies. A part configured for ×2 gain produces twice the output for the same code. On a 0-10 V industrial output this is the difference between correct and clipped.

Internal versus external reference. If the original part used an external reference and the replacement has an internal one enabled by default, the accuracy now depends on a device you did not select and cannot calibrate separately. In the other direction, an external-reference part with an unconnected reference pin produces nothing. The error contributions are worked out in [data converter sourcing](/blog/data-converter-sourcing-guide), and the reference's own specifications in [voltage reference selection](/blog/voltage-reference-selection-guide).

## The power-on default state

Ask what the output does between the supply rising and the processor writing the first code. The answer is one of:

| Default | Consequence on an actuator output |
| --- | --- |
| Zero-scale | Output at minimum — usually safe |
| Mid-scale | **Half-travel command applied** until firmware intervenes |
| Tri-state / high impedance | Depends on the external pull; may float |
| Last value (in parts with non-volatile memory) | Whatever the machine was doing when it lost power |

Mid-scale reset is common on bipolar-output parts because mid-scale corresponds to zero volts on a ±10 V range, which is the safe state there, and the dangerous one on a unipolar 0-20 mA current output.

For a 4-20 mA industrial output part such as `AD5422BREZ-REEL`, this interacts with the whole power sequence: the loop current during supply ramp is defined by the DAC's reset behaviour and by whether the supervisor holds the system in reset long enough. The timing side of that is in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).

Verify it by test, not by datasheet reading alone: power-cycle the assembled board with the load connected and capture the output. Any substitution changes the answer.

## Audio and other special-purpose converters

Audio DACs are a separate world with their own compatibility rules, and they live partly in our [ADC/DAC special purpose category](/category/adc-dac-special) — 2,524 parts, 37% not active.

What differs:

- **Interface is I²S, left-justified, right-justified or TDM**, with a master/slave distinction and a clocking scheme (MCLK ratio) that must match the existing clock generator.
- **Resolution is nominal**; THD+N and dynamic range are the real specifications.
- **De-emphasis, digital filters and volume control** are part-specific features that firmware may depend on.
- **Multi-bit R-2R audio DACs are effectively gone.** `PCM1704U` is obsolete in our catalogue, as are `PCM1604PTR` and `PCM1602APTR`; `AD1955ARSRL` is obsolete while `AD1955ARSZ` remains active. High-end audio equipment repair is one of the few places where the obsolete part is genuinely irreplaceable, because the sound of the architecture is the product.
- **Codec parts combine ADC and DAC**, so a substitution has to satisfy both halves. `TLV320DAC23GQER` is obsolete here; `WM8740SEDS/V` and `WM8716SEDS/V` are last-time buy.

For resolver and position interfaces (`AD2S1205YSTZ` is active in our catalogue) the "DAC" is part of a closed-loop tracking converter and the part is not substitutable at all outside its family.

## Sourcing notes

The distribution of inactive parts by family prefix:

| Family prefix | Parts held | Not active |
| --- | ---: | ---: |
| `MAX5…` | 2,063 | 909 |
| `LTC2…` | 2,026 | 187 |
| `AD5…` | 1,581 | 530 |
| `AD7…` | 1,018 | 480 |
| `DAC8…` | 554 | 117 |
| `TLV5…` | 266 | 49 |
| `MCP4…` | 664 | 4 |
| `DAC08…` | 89 | 39 |

The Maxim `MAX5xxx` line carries the heaviest legacy load at 909 of 2,063, and its last-time-buy list is unusually long: `MAX515CPA+`, `MAX538BEPA+`, `MAX504EPD+`, `MAX5156BCPE+` and `MAX547BEQH+D` are all in that state here, most of them in DIP and LCC packages that identify them as designs from the 1990s.

Three practical points:

- **DIP-packaged DACs are a tell.** If the BOM specifies a DIP DAC, the design is old enough that the surrounding circuit assumptions (external amplifier, ±15 V rails, parallel interface) probably all apply, so plan the substitution as a small redesign. [Redesign or re-source](/blog/redesign-vs-resource-obsolete-parts) has the decision framework.
- **Last-time buy on a DAC is easier than on a reference**, because a DAC does not usually carry the calibration. Quantity method in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).
- **Incoming inspection should sweep codes, not spot-check.** Walk the full range and check monotonicity and endpoint errors; a counterfeit or remarked lower-resolution die shows up immediately as repeated codes or a staircase with the wrong step count. See [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Output structure: voltage / current / multiplying | Output wrong in sign, scale and impedance |
| 2 | Internal feedback resistor used by the external amplifier | Gain error and drift mismatch |
| 3 | Buffered or unbuffered output | Loading error |
| 4 | Monotonicity guarantee at full resolution | Loop latch-up or oscillation |
| 5 | Glitch impulse against the following stage | Disturbance, audible distortion, false triggers |
| 6 | Settling time, and the error band it is quoted to | Output never reaches the code |
| 7 | Capacitive load tolerance | Ringing or oscillation |
| 8 | Internal reference gain (×1 / ×2) | Output range doubled or halved |
| 9 | Internal vs external reference | Dead output, or uncalibratable accuracy |
| 10 | Power-on default state | Actuator moves before firmware runs |
| 11 | Interface: SPI mode, I²S format, parallel width | No communication |
| 12 | Bipolar range and offset arrangement | Wrong zero point |
| 13 | Supply rails, including ±15 V legacy analog | Damage or clipping |

## FAQ

### How do I tell whether a DAC is voltage-output, current-output or multiplying?

From the output section of the datasheet, not the part number. A voltage-output part specifies an output voltage range and a load resistance or capacitance limit. A current-output part specifies full-scale current and a compliance voltage range. A multiplying DAC specifies a reference input voltage range that includes AC signals, quotes feedthrough and gain error, and includes an internal feedback resistor pin intended for an external amplifier. If the schematic shows an op-amp with its inverting input tied to the DAC output, you almost certainly have a current-output or multiplying part.

### Can I replace a multiplying DAC with a modern voltage-output DAC?

Not without redesigning the output stage. The multiplying DAC delivers a code-scaled current into a virtual ground and relies on its internal, ratio-matched feedback resistor to set the transimpedance. A buffered voltage-output DAC drives a voltage into that same summing node, so the amplifier's gain, sign and impedance assumptions all break. If the reference input was carrying a signal rather than a DC reference, the function itself (programmable attenuation) has no equivalent in a plain voltage-output part.

### What does "monotonic to 15 bits" mean on a 16-bit DAC?

That adjacent codes may reverse at the 16-bit level: increasing the code by one can decrease the output. It is a normal consequence of resistor matching in R-2R ladders and is usually harmless in open-loop waveform generation. In a closed loop it is not: the controller sees the output move the wrong way, pushes further in the same direction, and the system can latch at the discontinuity or hunt around it. String-architecture DACs are monotonic by construction and are the safer choice for loops.

### Why does glitch impulse matter if the spike only lasts nanoseconds?

Because its amplitude is enormous relative to an LSB and because what follows the DAC may not filter it. A 4 nV·s glitch can be a 20 mV spike for 200 ns, which on a 16-bit 5 V output is roughly 262 LSB. A mechanical actuator ignores it, but a fast current loop, a laser driver, a comparator or an audio output stage does not. If the original design had no output filter, it was probably relying on a low-glitch architecture, and an R-2R replacement will change the behaviour.

### How do I compare settling time between two DACs?

Normalise the error band first. One vendor may quote settling to ±0.5 LSB, another to ±1 LSB, another to 0.01% of full scale, which at 16 bits is 6.5 LSB, a much looser target. Then compare against your update interval: at 100 kSPS you have 10 µs, and a part that reaches ±0.5 LSB in 14 µs will produce a lagging, smoothed version of your intended waveform rather than a clean one. Check large-signal slew rate separately, since it limits full-scale steps.

### What is the safest power-on default for a DAC driving an actuator?

Whichever code corresponds to the mechanically safe state, which depends on the output range rather than the DAC. On a bipolar ±10 V output, mid-scale is 0 V and is usually safe. On a unipolar 0-20 mA loop, mid-scale is 10 mA: a half-travel command. Determine the default from the reset section of the datasheet, confirm it by power-cycling the assembled board with the load connected, and where the default is unsafe, gate the output externally until the processor has written a known code.

### Are audio DACs interchangeable if the resolution and interface match?

Rarely. The serial format must match in detail — I²S versus left- or right-justified, master versus slave, and the master-clock-to-sample-rate ratio, and firmware may depend on part-specific features such as de-emphasis, digital filter selection or internal volume control. The specifications that determine sound quality are THD+N and dynamic range rather than nominal resolution. Multi-bit R-2R audio parts such as `PCM1704U` are obsolete and have no modern equivalent, because the architecture itself is what the equipment was designed around.

### Which DAC families are most affected by obsolescence in your catalogue?

The Maxim `MAX5xxx` line, with 909 of 2,063 part numbers not active, and the older Analog Devices `AD7xxx` line at 480 of 1,018. Several `MAX5xxx` devices are in last-time-buy status, including `MAX515CPA+`, `MAX538BEPA+` and `MAX504EPD+`, mostly in DIP and LCC packages. By contrast the Microchip `MCP4xxx` family shows only 4 inactive out of 664. Overall the DAC category is 3,342 inactive of 11,852 — 28%.

## Related reading

The cluster pillar is [data converter sourcing](/blog/data-converter-sourcing-guide). For the input side of the same signal chain, [ADC sourcing](/blog/adc-sourcing-guide). For the front-end multiplexer, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide). For the term that dominates absolute accuracy, [voltage reference selection](/blog/voltage-reference-selection-guide).

Surrounding decisions: [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for the power-up sequence that determines what your output does before firmware runs.

Send us the part number with the output structure, range and update rate, and we will come back with candidates that fit the circuit as well as the footprint.

[**Submit an RFQ**](/rfq) | [**Browse DACs**](/category/dac) | [**Upload a BOM**](/bom)
