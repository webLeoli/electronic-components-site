---
title: "Digital Potentiometers: 58% Discontinued, and Volatile Is Not the Same Part as Non-Volatile"
slug: "digital-potentiometer-sourcing-guide"
status: "draft"
seoTitle: "Digital Potentiometer Sourcing: Volatile vs Non-Volatile, X9C and MCP41 Replacement"
seoDesc: "The highest obsolescence rate in our catalogue at 58% of 5,787 parts. Wiper memory, end-to-end tolerance, wiper resistance, terminal voltage limits and why a digipot is not a trimmer."
seoKeywords: "digital potentiometer sourcing, X9C103 replacement, MCP41010, AD5220 obsolete, non-volatile digipot, wiper resistance, end-to-end resistance tolerance, ISL90461 last time buy, digipot vs DAC"
tags: "digital potentiometers, digipot, X9C, MCP41, wiper memory, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Data Converters & Signal Chain"
relatedProducts: "MCP40D18T-502AE/LT, AD5259BRMZ50, MAX5418LETA+T, AD5220BRMZ50, X9313UST1, X9315UMZ, ISL90461WIE627Z-TK, DS1856E-050+T&R"
---

# Digital Potentiometers: 58% Discontinued, and Volatile Is Not the Same Part as Non-Volatile

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: wiper memory, interfaces, end-to-end tolerance, wiper resistance, terminal limits, obsolescence

---

**At 58% of 5,787 part numbers no longer active, digital potentiometers have the highest obsolescence rate of any category in our catalogue.** The reason is structural: they were the standard way to make a circuit adjustable before microcontrollers had spare DAC channels and before designers were willing to put a serial bus on an analogue trim function. Two-thirds of the category is Intersil and Xicor lineage (2,089 Intersil parts alone) and Renesas, which now owns that portfolio, is winding it down. Meanwhile the single most important distinction between candidate replacements does not appear in the resistance value or the pin count: **whether the wiper position survives a power cycle**.

## Key takeaways

- **58% of the category is inactive** — 3,301 obsolete plus 41 last-time buy out of 5,787.
- **Volatile and non-volatile digipots are not substitutes.** A volatile part wakes at mid-scale or zero-scale; a non-volatile one wakes where you left it.
- **End-to-end resistance tolerance is ±20% to ±30%.** Only the ratio is accurate, so a rheostat-mode circuit inherits the full error and a divider-mode circuit does not.
- **Wiper resistance is 50-200 Ω** and matters enormously at low resistance codes and in rheostat mode.
- **Terminal voltages are limited to the supply rails.** No digipot replaces a trimmer carrying ±15 V audio or mains-referenced signals.
- **Three incompatible interface generations exist**: `INC`/`U-D` up-down, SPI, and I²C, and I²C parts have fixed address options that constrain multi-device designs.
- **The `X9C` family and the `ISL904xx` line are the acute cases**: `X9313UST1` and `AD5220BRMZ50` obsolete, `X9315UMZ` and `ISL90461` variants last-time buy.

---

## Volatile versus non-volatile: the first question

A digital potentiometer either remembers its wiper position through a power cycle or it does not, and the two behaviours suit completely different designs.

| | Volatile | Non-volatile (EEPROM) |
| --- | --- | --- |
| Position after power-up | Fixed default — usually mid-scale, sometimes zero-scale | Last stored value |
| Write endurance | Unlimited | Typically 10⁵-10⁶ cycles |
| Write time | Immediate | Milliseconds, with a busy period |
| Typical use | Continuously controlled by firmware — volume, gain, bias trim | **One-time calibration**, set at manufacture |
| Examples in catalogue | `MCP41…`, `AD52…`, `MAX5418LETA+T` | `X9C…`, `X93…`, `DS18…`, `ISL904…` |

The failure mode when you get this wrong is specific and expensive. A production calibration procedure sets a non-volatile digipot once at final test, and the value is never written again — no firmware exists to restore it. Fit a volatile part and every unit powers up at mid-scale: the LED bias is wrong, the sensor gain is wrong, the laser current is wrong, and the calibration certificate on the test record no longer describes the hardware.

Going the other way is subtler. **A non-volatile part in a continuously adjusted socket burns its write endurance.** A volume control written on every user action, or a control loop that adjusts the wiper each cycle, will exhaust 100,000 writes quickly, and the write time itself, milliseconds with a busy flag, may break the timing the firmware assumes.

We hold 384 `DS18…` parts (258 inactive) and 82 `X9C…` (66 inactive) (the classic non-volatile families) against 273 `MCP41…` and 201 `MCP42…` parts with **zero** inactive. **The volatile Microchip parts are the healthiest thing in the category, and they cannot replace a non-volatile part without a firmware change.**

## Interfaces: three incompatible generations

The interface determines the board, and there are three families of them.

| Interface | Pins | Characteristic |
| --- | --- | --- |
| **Up/down (`INC`, `U/D`, `CS`)** | 3 control pins | No addressing, no read-back. Pulse to step the wiper. Classic Xicor `X9Cxxx` |
| **SPI** | `CS`, `SCK`, `SDI`, sometimes `SDO` | Fast, daisy-chainable, no address limit. `MCP41xxx`, `AD52xx` |
| **I²C** | `SDA`, `SCL` | Two wires, but **a fixed set of addresses per part number** |

Three substitution consequences:

Up/down parts have no absolute position command. The firmware knows the wiper position only by counting pulses from a known state, which is why these parts are almost always non-volatile: the stored position *is* the state. Replacing an `X9C` part with an SPI part requires new firmware and new board traces, not just a footprint change.

I²C address options are part of the part number. `AD5259BRMZ50` and `AD5259BCPZ10-R7` are both active in our catalogue; families like this typically offer two or three address variants, and a design with four digipots on one bus depends on having enough distinct addresses. A replacement family offering fewer address options cannot host the same design.

SPI daisy-chaining depends on the part having a data output. Some parts do, some do not, and a chain built on daisy-chaining cannot use a part without `SDO`.

## End-to-end tolerance, and why ratio accuracy is what you have

The absolute resistance of a digital potentiometer is specified to ±20% or ±30%. The ratio between the two halves is specified far more tightly.

This is the single most useful thing to know about these parts, and it decides whether a substitution works:

- **In divider (potentiometer) mode** (signal across both ends, output from the wiper) the output is a *ratio*, and the absolute resistance error cancels. Accuracy is set by the ratiometric specification, typically ±1% or better.
- **In rheostat mode** (two terminals only, used as a variable resistor) the output depends on the *absolute* resistance, so the full ±20-30% error appears in the circuit.

Worked, for a nominal 10 kΩ part at ±20% used to set an oscillator frequency in rheostat mode:

```
nominal    R = 10.0 kΩ  → f = 1.00 kHz (say)
worst case R = 8.0 kΩ   → f = 1.25 kHz
worst case R = 12.0 kΩ  → f = 0.83 kHz
```

That is a ±20% frequency spread from a part within specification. A design doing this either trims elsewhere, tolerates the spread, or was relying on a particular vendor's typical value, and the last case is where a substitution to another vendor breaks a product that had worked for years.

When replacing a rheostat-mode digipot, compare the tolerance figure, not just the nominal value. Some precision families offer ±8% or better and cost accordingly.

## Wiper resistance and the low-code problem

The wiper itself has resistance (typically 50 Ω to 200 Ω) and it does not scale with the code.

At the bottom of the range this dominates:

```
256-tap 10 kΩ part, wiper resistance 100 Ω
code 0   : ideal 0 Ω      actual ≈ 100 Ω      → error is infinite in relative terms
code 1   : ideal 39 Ω     actual ≈ 139 Ω      → 250% high
code 128 : ideal 5,000 Ω  actual ≈ 5,100 Ω    → 2% high
code 255 : ideal 9,961 Ω  actual ≈ 10,061 Ω   → 1% high
```

A circuit that relies on the wiper reaching a genuinely low resistance cannot be built with a digipot, and a substitution to a part with higher wiper resistance shifts the whole bottom of the adjustment range. Check the specification at both zero-scale and full-scale, and note that wiper resistance also varies with supply voltage and temperature.

Two related specifications:

- **Wiper current rating**, usually a few milliamps. A digipot is not a power rheostat, and driving a load through the wiper is a common way to destroy one.
- **Ratiometric temperature coefficient versus absolute temperature coefficient.** The ratio drifts far less than the absolute value (often 5 ppm/°C ratiometric against 300 ppm/°C absolute) which is another reason divider mode is the safer topology.

## Terminal voltage limits: the trimmer illusion

A mechanical trimmer passes whatever voltage its insulation allows. A digital potentiometer is a CMOS switch array and its terminals must stay within the supply rails.

This rules out whole classes of substitution:

- **±15 V audio and instrumentation paths.** A digipot on a 5 V supply cannot pass a ±10 V signal; the signal will forward-bias the internal protection and, at best, clip.
- **Mains-referenced or high-voltage feedback dividers.**
- **Anything where the signal is present before the digipot's supply comes up.** During power sequencing, signal on a terminal with the supply at zero conducts into the rail through the protection diodes: the same problem described for [analog switches and multiplexers](/blog/analog-switch-mux-sourcing-guide).

Where a legacy design used a mechanical trimmer and someone proposes a digipot as the "modern" replacement, the terminal voltage check is the first thing to do, and it fails more often than not in analogue equipment. High-voltage digipots exist but are a small, specialised group.

## Digipot or DAC?

A digital potentiometer and a voltage-output DAC solve overlapping problems, and for new designs the DAC is usually the more sustainable choice.

| | Digital potentiometer | Voltage-output DAC |
| --- | --- | --- |
| Output | A resistance, referenced to your own circuit | A voltage, referenced to a reference |
| Absolute accuracy | ±20-30% (absolute), ~±1% (ratio) | Set by the reference — can be 0.05% |
| Signal range | Within supply rails | Within supply rails |
| Works as a passive element in an existing network | **Yes** | No |
| Catalogue health | **58% inactive** | 28% inactive |

The case for the digipot is that it is passive: it drops into an existing resistor network, needs no reference, and adjusts something whose absolute value was never critical. The case for the DAC is everything else — better accuracy, a much healthier supply base, and the error-budget framework in [data converter sourcing](/blog/data-converter-sourcing-guide) and [DAC sourcing](/blog/dac-sourcing-guide).

For a **redesign** forced by obsolescence, converting a digipot function to a DAC plus an amplifier is frequently the right answer, and it removes the part from the risk register permanently. The decision framework is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

## Sourcing notes

The vendor concentration explains the obsolescence rate. Intersil accounts for 2,089 of the 5,787 parts, then Rochester Electronics (984), Microchip (982), Maxim Integrated (661), Analog Devices (550) and onsemi (413). Intersil and Xicor both ended up inside Renesas, and the combined digipot range has been pruned hard.

By family:

| Family prefix | Parts held | Not active |
| --- | ---: | ---: |
| `AD52…` | 509 | 255 |
| `DS18…` | 384 | 258 |
| `MCP41…` | 273 | **0** |
| `MCP42…` | 201 | **0** |
| `X9C…` | 82 | 66 |
| `AD84…` | 81 | 41 |

Currently obsolete here: `AD5220BRMZ50`, `X9015US8IZT1`, `X9313UST1`, `X9429WV14I`, `X9252TV24IZ-2.7`, `CAT5118SDI-00GT3`, `CAT5121SDI-50GT3`. Last-time buy: `X9315UMZ`, `X9315UMIZT1`, `X9314WMIZ-3T1`, and the `ISL90461` group in several temperature grades.

Still active and worth knowing: `MCP40D18T-502AE/LT`, `AD5259BRMZ50`, `AD5259BCPZ10-R7`, `MAX5418LETA+T`, and the Maxim optical-module trim parts `DS1856E-050+T&R`, `DS1848B-050+T&R`, `DS1859B-020+T&R` and `DS3906U+T&R`, which are digipots with additional monitoring functions, and are effectively single-source.

Three practical points:

- **Scrub Intersil- and Xicor-branded digipots first.** Two-thirds of the risk in this category sits under those two names. The method is in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).
- **A last-time buy is unusually attractive here**, because a digipot's calibration lives in the part or in firmware, not in the surrounding circuit, so stock genuinely solves the problem for the product's life. Quantity method: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).
- **For incoming inspection, sweep the whole code range** and record resistance at zero-scale, mid-scale and full-scale. That catches remarked parts with the wrong tap count or the wrong nominal value, and it measures wiper resistance directly. Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Volatile vs non-volatile wiper memory | Units power up uncalibrated, or endurance exhausted |
| 2 | Power-up default position (mid-scale vs zero-scale) | Wrong bias, gain or current at power-up |
| 3 | Interface generation (up/down, SPI, I²C) | New firmware and board traces required |
| 4 | I²C address options available | Bus address clash in multi-device designs |
| 5 | SPI data output for daisy-chaining | Chain cannot be built |
| 6 | Tap count (32, 64, 128, 256, 1024) | Resolution and firmware scaling change |
| 7 | Nominal resistance **and its tolerance** | ±20-30% error in rheostat mode |
| 8 | Divider vs rheostat topology | Absolute error where ratio error was assumed |
| 9 | Wiper resistance at zero-scale | Bottom of adjustment range shifts |
| 10 | Wiper current rating | Device destroyed by load current |
| 11 | Terminal voltages within supply rails | Clipping, conduction into the rail |
| 12 | Ratiometric vs absolute tempco | Drift over temperature |
| 13 | Write time and busy behaviour (non-volatile) | Firmware timing violated |

## FAQ

### What is the difference between a volatile and non-volatile digital potentiometer?

Whether the wiper position survives loss of power. A volatile part always powers up at a fixed default, usually mid-scale, so firmware must write the desired value on every boot. A non-volatile part stores the position in EEPROM and returns to it, which is what makes one-time factory calibration possible. The two are not substitutes: a volatile part in a calibrated socket leaves every unit at mid-scale with no firmware to fix it, and a non-volatile part in a continuously adjusted socket exhausts its write endurance and adds milliseconds of write time.

### Why is the resistance tolerance of a digital potentiometer so poor?

Because on-chip resistors cannot be trimmed economically to a tight absolute value, and for most applications they do not need to be. What is well controlled is the *ratio* between the segments above and below the wiper, typically to ±1% or better with a ratiometric temperature coefficient far lower than the absolute one. So in divider mode, where you take the wiper output from a signal applied across both ends, the ±20-30% absolute error cancels. In rheostat mode, where only the absolute resistance matters, you inherit all of it.

### Can a digital potentiometer replace a mechanical trimmer?

Only where the signal stays within the supply rails and the current is small. A digipot is a CMOS switch array: its terminals must remain between its supply and ground, its wiper carries a few milliamps at most, and it has 50 to 200 Ω of wiper resistance that does not scale with the setting. A trimmer in a ±15 V analogue path, in a mains-referenced divider, or carrying load current cannot be replaced by a standard digipot. High-voltage digipots exist but form a small, specialised group.

### What happens at the bottom of the adjustment range?

Wiper resistance dominates. On a 256-tap 10 kΩ part with 100 Ω of wiper resistance, code 0 gives about 100 Ω rather than zero, and code 1 gives roughly 139 Ω where the ideal is 39 Ω. At mid-scale the same 100 Ω is only a 2% error. Any circuit that needs the wiper to reach a genuinely low resistance (a gain-setting network with a high maximum gain, for instance) cannot be built with a digipot, and a replacement with higher wiper resistance shifts the entire lower end of the range.

### Are X9C-series digipots still available?

Mostly not. In our catalogue 66 of 82 `X9C`-prefixed part numbers are no longer active, with `X9313UST1`, `X9015US8IZT1` and `X9429WV14I` obsolete and `X9315UMZ`, `X9315UMIZT1` and `X9314WMIZ-3T1` in last-time buy. The `X9C` line is Xicor lineage, now inside Renesas, and it uses the three-pin up/down interface with non-volatile storage: a combination no modern family reproduces exactly. Replacing one means either buying stock now or moving to an SPI or I²C part with new firmware.

### Should I use a digipot or a DAC in a new design?

A DAC, in most cases. A voltage-output DAC gives absolute accuracy set by a reference you choose, has a far healthier supply base (28% of our DAC category is inactive against 58% of digipots) and its error budget is tractable. The digipot's remaining advantage is that it is a passive element: it drops into an existing resistor network, needs no reference and no output buffer, and adjusts something whose absolute value was never critical. For a forced redesign, converting the function to a DAC plus an amplifier removes the part from the obsolescence register for good.

### Which digital potentiometer families are healthiest?

The Microchip lines. In our catalogue all 273 `MCP41…` and all 201 `MCP42…` part numbers are active, and `MCP40D18T-502AE/LT` is current. The Analog Devices `AD5259` parts are also active. The families to avoid designing in are the Intersil and Xicor lineages (`X9C`, `X93`, `ISL904x`) where Renesas is pruning, and the older `AD52xx` range at 255 of 509 inactive. Note that the Maxim optical-module trim parts such as `DS1856E-050+T&R` are active but effectively single-source.

### How should I inspect incoming digipots?

Sweep the entire code range and record resistance at zero-scale, mid-scale and full-scale, in both the wiper-to-A and wiper-to-B directions. That single test reveals the tap count, the nominal value, the wiper resistance and any missing or repeated taps, which is how a remarked part with the wrong resolution or the wrong value announces itself. For non-volatile parts, write a value, power-cycle and confirm it returns, since a volatile die in a non-volatile part's marking is a realistic substitution fraud.

## Related reading

Cluster pillar: [data converter sourcing](/blog/data-converter-sourcing-guide), and the closest functional alternative is covered in [DAC sourcing](/blog/dac-sourcing-guide). The switch-array behaviour and terminal-voltage limits are the same physics as [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide), and where the digipot sets a threshold rather than a gain, see [comparator selection](/blog/comparator-selection-guide) and [voltage reference selection](/blog/voltage-reference-selection-guide).

Lifecycle: [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

Send us the part number with the topology (divider or rheostat) and whether the wiper position must survive a power cycle. Those two answers eliminate most of the candidate list before we quote.

[**Submit an RFQ**](/rfq) | [**Browse digital potentiometers**](/category/digital-potentiometers) | [**Upload a BOM**](/bom)
