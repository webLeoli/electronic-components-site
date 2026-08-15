---
title: "Programmable Oscillators: 22,784 Part Numbers, Far Fewer Actual Devices"
slug: "programmable-oscillator-sourcing-guide"
status: "draft"
seoTitle: "Programmable Oscillator Sourcing: Factory-Programmed Frequency Codes, XO vs VCXO"
seoDesc: "Why a programmable oscillator part number is a configuration, not a device: frequency codes, pin-1 function differences between XO and VCXO, stability budgets and silicon alternatives."
seoKeywords: "programmable oscillator sourcing, 8N0Q IDT oscillator, factory programmed frequency, XO VCXO TCXO difference, oscillator pin 1 OE VC, LTC6905 silicon oscillator, oscillator stability ppm budget"
tags: "oscillators, XO, VCXO, TCXO, programmable, frequency codes, jitter, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Timing & Clock Distribution"
relatedProducts: "8N0QV01EH-0009CDI8, 8N0Q001KH-0127CDI8, 8N0QV01KH-0098CDI, CY25701FLXIT, LTC6905CS5-96#TRMPBF, LTC6908IDCB-2#TRPBF, LTC6930CDCB-7.37#TRPBF, ICM7555IBAZ"
---

# Programmable Oscillators: 22,784 Part Numbers, Far Fewer Actual Devices

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: factory-programmed frequency codes, XO/VCXO/TCXO, pin functions, stability budgets, silicon oscillators

---

**Our timers and oscillators category holds 22,784 part numbers and only 3% of them are inactive: a figure that means almost nothing until you know that 21,332 of them come from one vendor.** They are factory-programmed oscillator configurations: a handful of base devices, each ordered as hundreds of part numbers that differ only in the frequency and options burned in at the factory. `8N0Q001KH-0127CDI8` is not a different device from `8N0Q001KH-0208CDI8`; it is the same device programmed differently. That changes the sourcing problem completely. Stock of a specific configuration is effectively bespoke inventory, a "compatible" part number is only compatible if every field matches, and a discontinued configuration cannot be substituted from a datasheet — it has to be re-programmed or re-specified.

## Key takeaways

- **The part number encodes the programmed frequency and options.** Two numbers differing in one field are not alternates; they are different products from the same die.
- **21,332 of 22,784 parts in this category are one vendor's configurations** (Renesas, IDT lineage), which is why the category-level obsolescence rate of 3% is misleading.
- **Pin 1 is not the same function on every 4-pad oscillator.** It may be output enable, no connect, or the control voltage input on a VCXO: the same footprint, three behaviours.
- **Stability is a budget, not a number**: initial tolerance plus temperature plus ageing plus load pull plus supply pull. Ethernet's ±100 ppm can be blown by a 50 ppm part over ten years.
- **XO, VCXO, TCXO and OCXO are not grades of one part.** Each adds a function the others do not have.
- **Silicon oscillators trade accuracy for availability** — 0.5-2% against 20-50 ppm, and are the right answer for non-communications clocks.
- **The last-time-buy notices in this category are configuration-specific**: `8N0Q001KH-0127CDI8`, `8N0QV01KH-0098CDI`, `CY25701FLXIT`.

---

## Why the part number is a configuration

A programmable oscillator contains a crystal or MEMS resonator, a PLL and an output stage, and the PLL's divider values are set in one-time-programmable memory at the factory. The ordering code carries:

| Field | What it encodes |
| --- | --- |
| Base family | The die — output format, supply, jitter class |
| **Frequency code** | The programmed output frequency, often as a numeric index |
| Stability / grade | Total stability in ppm |
| Temperature range | Commercial, industrial, extended |
| Package and packing | Size, tape and reel |

In `8N0Q001KH-0127CDI8`, the `-0127` field is a frequency configuration index, not a frequency in megahertz. **You cannot read the frequency off the part number without the vendor's configuration list**, and two adjacent indices may be wildly different frequencies.

Three consequences for sourcing:

A "same base part" offer is not a substitution. If a BOM calls for one configuration and a supplier offers another from the same family, the output frequency is different. This sounds obvious and is the single most common error in this category, because the part numbers look like package variants.

Stock is per-configuration. A vendor may hold thousands of one index and none of another. Lead times for a new configuration are programming plus test, which is usually weeks, and there is frequently a minimum order quantity, because programming is a setup operation.

Discontinuation can be per-configuration too. In our catalogue `8N0Q001KH-0127CDI8`, `8N0Q001KH-0208CDI8` and `8N0QV01KH-0098CDI` are last-time buy while `8N0QV01EH-0009CDI8` remains active. The family is not dead; those configurations are.

When a configuration goes end of life, the replacement path is to re-specify — order a live configuration at the same frequency from the same or another vendor, and verify the other parameters. That is an engineering task with a test requirement, not a purchasing substitution.

## XO, VCXO, TCXO, OCXO: four different products

These are not accuracy grades of one device. Each has a function the others lack.

| Type | What it is | Adds | Typical stability |
| --- | --- | --- | --- |
| **XO** | Fixed-frequency oscillator | — | ±20 to ±100 ppm |
| **VCXO** | Voltage-controlled oscillator | **A control voltage input that pulls the frequency** | ±20 to ±50 ppm, with pull range in ppm |
| **TCXO** | Temperature-compensated | Internal compensation network | ±0.5 to ±5 ppm |
| **OCXO** | Oven-controlled | A heater and thermal control loop | ±0.01 to ±0.1 ppm, at watts of power |

The VCXO is where footprint compatibility becomes dangerous. In the common 4-pad ceramic package:

| Pin | XO | VCXO |
| --- | --- | --- |
| 1 | Output enable, or no connect | **Control voltage input (V_C)** |
| 2 | Ground | Ground |
| 3 | Output | Output |
| 4 | Supply | Supply |

Fit an XO where a VCXO was and the control loop that was pulling the frequency (a clock recovery loop, a jitter attenuator, a synchronisation servo) now has its output connected to an enable pin. Depending on the part, the oscillator either runs at its nominal frequency ignoring the loop, or is disabled entirely when the loop output goes low. **The board powers up and the loop never locks.**

Fit a VCXO where an XO was and pin 1 is a high-impedance analogue input, probably floating or tied to a logic level, so the frequency sits at an arbitrary point in the pull range.

Always check the pin-1 function against the schematic, not the package drawing.

## Stability is a budget

"±50 ppm" on a datasheet is usually one term of several. The total frequency error over the product's life is:

```
total = initial tolerance
      + temperature stability over the operating range
      + ageing over the service life
      + load pull (change with output loading)
      + supply pull (change with V_DD)
```

Worked, for a 25 MHz oscillator specified at ±25 ppm initial, ±25 ppm over temperature, ±3 ppm/year ageing, in a product with a ten-year life:

```
initial          ±25 ppm
temperature      ±25 ppm
ageing 10 years  ±30 ppm   (3 ppm/yr, first-year drift dominates but budget linearly)
load + supply    ±5  ppm
------------------------------
worst case       ±85 ppm  → ±2,125 Hz at 25 MHz
```

Now check that against the interface it clocks:

| Interface | Requirement | ±85 ppm acceptable? |
| --- | --- | --- |
| Ethernet (100BASE-TX) | ±100 ppm | Marginal — 85% of budget consumed |
| USB 2.0 full speed | ±2,500 ppm | Yes, comfortably |
| USB 2.0 high speed | ±500 ppm | Yes |
| CAN | ±0.5% typical, tighter at high rate | Yes |
| Asynchronous UART | ~±2% total across both ends | Yes |
| Precision measurement timebase | Application-specific | Usually no |

The Ethernet row is the one that bites. A part sold as "±50 ppm" that means ±50 ppm *inclusive of everything* is fine; one that means ±50 ppm initial with temperature and ageing on top is not, and the two are written almost identically. **When substituting, compare total stability including ageing, and confirm whether the quoted figure is inclusive.**

## Jitter, and which number to compare

Two jitter specifications exist and they answer different questions.

- **Period jitter / cycle-to-cycle jitter** (ps peak-to-peak) matters for digital setup and hold margins.
- **Phase jitter / integrated RMS jitter** (fs or ps RMS over a stated offset band, e.g. 12 kHz to 20 MHz) matters for serial links and for anything clocking a converter.

For a data converter, jitter caps the achievable SNR regardless of resolution:

```
SNR_jitter = −20 × log₁₀(2π × f_in × t_jitter)

1 ps RMS at 100 MHz input  → ~64 dB  (about 10.4 effective bits)
100 fs RMS at 100 MHz      → ~84 dB
```

So a "compatible" oscillator with ten times the phase jitter costs three bits of ADC performance: the arithmetic is worked through in [ADC sourcing](/blog/adc-sourcing-guide). For a PCIe or SerDes reference clock, the specification is normally an integrated RMS figure over a defined band, and substituting a part that only publishes period jitter leaves the requirement unverified.

## Output format and load

The output stage is a substitution constraint in its own right.

| Format | Termination | Notes |
| --- | --- | --- |
| **LVCMOS / HCMOS** | None; series resistor optional | Single-ended, most common |
| **LVDS** | 100 Ω across the pair | Differential, see [LVDS sourcing](/blog/lvds-sourcing-guide) |
| **LVPECL** | DC path to ground required | Differential, will not work in an LVDS footprint |
| **HCSL** | ~50 Ω to ground plus series resistor | PCIe reference clocks |
| **CML** | 50 Ω to supply, often on-die | SerDes |

An LVCMOS oscillator specifies a maximum load capacitance, typically 15 pF. Driving a long trace plus three inputs exceeds it, which degrades edges and increases jitter: the point at which a fanout buffer becomes necessary, covered in [clock buffer and fanout sourcing](/blog/clock-buffer-fanout-sourcing-guide).

Also check:

- **Output enable polarity and behaviour when disabled** (high-Z or held low).
- **Start-up time**, which for a TCXO can be milliseconds — long enough to matter if a supervisor releases reset before the clock is valid, as discussed in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).
- **Duty cycle specification**, which matters for double-data-rate or divided clocks.
- **Supply voltage and noise rejection.** Oscillators are sensitive to rail noise, and a part with less internal regulation will show it as jitter.

## Silicon oscillators: the availability trade

Where accuracy requirements are modest, a silicon oscillator removes the crystal, the load capacitors, the layout constraint and the obsolescence exposure in one step.

Our catalogue holds 304 `LTC69xx` parts with only 23 inactive (8%): a much healthier picture than the configured-oscillator families. Active examples: `LTC6905CS5-96#TRMPBF`, `LTC6908IDCB-2#TRPBF`, `LTC6930CDCB-7.37#TRPBF`, `LTC6992CS6-1#TRPBF`.

| | Crystal oscillator (XO) | Silicon oscillator |
| --- | --- | --- |
| Accuracy | ±20 to ±100 ppm | ±0.5% to ±2% |
| Start-up | Milliseconds | Microseconds |
| Frequency set by | Factory programming | **Resistor, or fixed by part number** |
| Vibration sensitivity | Real | Negligible |
| Availability risk | Configuration-specific | Standard catalogue part |

The decision rule is simple: if the clock leaves the board or clocks a converter, it needs a crystal-based source. If it is an internal timebase, a switching clock, a scan clock or a housekeeping oscillator, a silicon oscillator is usually better sourcing. And because the frequency is set by an external resistor on several of these families, one part number covers a range of frequencies, the opposite of the configuration problem described above.

## Sourcing notes

Vendor concentration is the defining fact of this category. Renesas accounts for 21,332 of 22,784 part numbers, then Linear Technology (305), Texas Instruments (297), Rochester Electronics (217) and Maxim Integrated (176).

What that means in practice:

- **The 3% inactive figure is not comfort.** It is diluted by tens of thousands of configuration variants, most of which no one has ever ordered. The parts your BOM actually names may be in the inactive 662 or in a last-time-buy list.
- **Check by exact part number, never by family.** This is the one category where a family-level availability check is actively misleading.
- **Cypress-lineage programmable oscillators are also winding down** — `CY25701FLXIT` is last-time buy in our catalogue, and Cypress timing went to Infineon with subsequent rationalisation.
- **The `NBXS`/`NBXH` VCXO modules from onsemi are largely obsolete** here (`NBXSBA017LN1TAG`, `NBXSBA010LN1TAG`, `NBXHBA017LN1TAG`) which matters because these are the parts that sit in clock-recovery loops with no drop-in equivalent.

For **incoming inspection**, measure the frequency, the duty cycle and the start-up time, and verify the output format under the correct termination. A remarked oscillator is trivially detected by frequency, which makes this one of the easier categories to verify, but note that stability cannot be verified without temperature cycling, so **for a critical clock, buy from a channel that can supply the manufacturer's test data**. Channel guidance is in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Exact configuration code, not just the base family | Wrong output frequency |
| 2 | Pin 1 function (OE, NC or V_C) | Control loop never locks, or output disabled |
| 3 | Type: XO, VCXO, TCXO, OCXO | Missing control or compensation function |
| 4 | Pull range and polarity on a VCXO | Loop cannot reach lock |
| 5 | Total stability including ageing | Interface out of specification over life |
| 6 | Whether the ppm figure is inclusive | Budget silently exceeded |
| 7 | Phase jitter over the specified band | Converter SNR or SerDes margin lost |
| 8 | Output format and termination | No usable output |
| 9 | Maximum load capacitance | Degraded edges, added jitter |
| 10 | Output enable polarity and disabled state | Clock absent or bus contention |
| 11 | Start-up time vs reset release | System runs before the clock is valid |
| 12 | Supply voltage and rail noise sensitivity | Jitter |

## FAQ

### Why does a programmable oscillator have so many part numbers?

Because each part number is a factory-programmed configuration of the same die, not a different device. The ordering code carries the base family plus a frequency code, a stability grade, a temperature range and packaging, and the frequency is burned into one-time-programmable memory during manufacture. One base device can therefore appear as hundreds or thousands of part numbers — in our catalogue a single vendor accounts for 21,332 of the 22,784 parts in this category, almost all of them configurations.

### Can I substitute a different frequency code from the same oscillator family?

No. The frequency code is the output frequency. Two part numbers that differ only in that field look like package or grade variants and are different products, and because the codes are often numeric indices rather than frequencies in megahertz, you cannot tell how far apart they are without the vendor's configuration list. If your configuration is unavailable, the correct path is to specify a live configuration at the same frequency and verify the remaining parameters, which is an engineering change with a test requirement.

### What is pin 1 on a four-pad oscillator?

It depends on the type, which is why this is a common failure. On a fixed oscillator (XO) pin 1 is usually output enable or no connect. On a voltage-controlled oscillator (VCXO) in the same footprint, pin 1 is the control voltage input. Fitting an XO where a VCXO belongs connects the control loop's output to an enable pin, so the loop never locks and the oscillator either runs free or is held disabled. Check the pin function against the schematic rather than the package outline.

### How do I compare oscillator stability specifications?

Add up the terms, and check whether the headline number already includes them. Total frequency error is initial tolerance plus temperature stability plus ageing over the service life plus load pull plus supply pull. A 25 MHz part quoted at ±25 ppm initial with ±25 ppm over temperature and 3 ppm/year ageing reaches roughly ±85 ppm over ten years, which consumes 85% of Ethernet's ±100 ppm budget. Some vendors quote a single inclusive figure, others quote initial tolerance only, and the two are written almost identically.

### Which jitter number matters for my application?

Period or cycle-to-cycle jitter, in picoseconds peak-to-peak, governs digital setup and hold margins. Integrated phase jitter, in femtoseconds or picoseconds RMS over a stated offset band, governs serial links and any clock feeding a data converter. For converters the relationship is quantitative: SNR is capped at −20·log₁₀(2π·f_in·t_jitter), so 1 ps RMS limits a 100 MHz input to about 64 dB (roughly ten effective bits) while 100 fs gives about 84 dB.

### When should I use a silicon oscillator instead of a crystal one?

When the clock stays on the board and does not clock a converter. Silicon oscillators are accurate to roughly 0.5% to 2% rather than tens of ppm, but they start in microseconds, are insensitive to vibration, need no crystal or load capacitors, and are standard catalogue parts rather than factory configurations — in our data the `LTC69xx` families run 8% inactive against configuration-specific end-of-life notices elsewhere. Internal timebases, switching clocks and housekeeping oscillators are good candidates; Ethernet, USB and converter clocks are not.

### What replaces an obsolete VCXO module?

Rarely a like-for-like part, which is why these are worth attention. In our catalogue the onsemi `NBXSBA017LN1TAG`, `NBXSBA010LN1TAG` and `NBXHBA017LN1TAG` VCXO modules are obsolete, and they sit in clock-recovery and synchronisation loops where the pull range, control-voltage slope and phase noise all have to match. The options are a current VCXO from another vendor with the same pull range and polarity, verified in the loop, or a clock-generator IC with an integrated loop — see the PLL guide for that path.

### How should I inspect incoming oscillators?

Measure frequency, duty cycle and start-up time, and check the output amplitude under the correct termination for its format. Frequency alone catches most remarked parts, which makes this an easy category to screen. What bench testing cannot verify is stability over temperature or ageing, since that requires thermal cycling, so for a clock whose stability is a system specification, buy through a channel that can supply the manufacturer's test data rather than relying on incoming inspection.

## Related reading

The rest of this cluster: [555 timers and delay ICs](/blog/555-timer-delay-ic-sourcing-guide), [real-time clock sourcing](/blog/rtc-sourcing-guide), [clock buffer and fanout sourcing](/blog/clock-buffer-fanout-sourcing-guide), and [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for synthesis and jitter attenuation.

Where the clock's quality becomes someone else's specification: [ADC sourcing](/blog/adc-sourcing-guide) for the jitter-to-SNR arithmetic, [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide) for differential output termination, [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for start-up sequencing.

Send us the full configuration code (including the frequency field) and we will tell you whether that exact configuration is available or whether it needs re-specifying.

[**Submit an RFQ**](/rfq) | [**Browse timers and oscillators**](/category/programmable-timers-oscillators) | [**Upload a BOM**](/bom)
