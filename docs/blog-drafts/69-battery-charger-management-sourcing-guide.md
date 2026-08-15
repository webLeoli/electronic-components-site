---
title: "Battery Chargers and Fuel Gauges: The Float Voltage Is in the Part Number, and Getting It Wrong Is a Safety Event"
slug: "battery-charger-management-sourcing-guide"
status: "draft"
seoTitle: "Battery Charger and Fuel Gauge Sourcing: Float Voltage, Chemistry, Gauge Profiles"
seoDesc: "8,651 charger and battery-management parts. Why a 4.35 V charger cannot replace a 4.2 V one, thermal foldback arithmetic for linear chargers, gauge learning profiles, and protection redundancy."
seoKeywords: "battery charger sourcing, MCP73831 float voltage, 4.2V vs 4.35V charger, LM3420-4.2, fuel gauge learning profile, BQ27 gauge replacement, battery protection IC redundancy, ISL88731 last time buy"
tags: "battery chargers, fuel gauges, protection ICs, float voltage, chemistry, safety, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "BQ24091DGQR, BQ25101YFPT, MCP73871T-2CCI/ML, LM3420AM5X-4.2, BQ296113DSGR, MAX17048X003+T10, ISL88731CHRTZ, LTC2941CDCB-1#TRPBF"
---

# Battery Chargers and Fuel Gauges: The Float Voltage Is in the Part Number, and Getting It Wrong Is a Safety Event

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: float voltage, chemistry, thermal foldback, gauge profiles, protection redundancy, obsolescence

---

**In most single-cell charger families the regulated float voltage is fixed inside the part and identified only by a suffix.** `LM3420AM5X-4.2` charges to 4.2 V; the same family exists at 4.1 V, 8.2 V and 8.4 V. `MCP73831-2` and its siblings differ the same way. Fit a 4.35 V part where a 4.2 V one belonged and the cell is overcharged by 150 mV on every cycle, which accelerates ageing, causes lithium plating, and in the failure case ends in a vented or burning cell. This is the one category in the catalogue where a substitution error is a safety event rather than a performance problem, and where "same current rating, same package" is nowhere near sufficient. Our [battery management](/category/battery-management) and [battery charger](/category/battery-chargers) categories hold 8,651 part numbers between them, 2,271 no longer active.

## Key takeaways

- **Float voltage is encoded in the suffix and must match the cell chemistry exactly.** 4.2 V, 4.35 V and 3.65 V LiFePO₄ are different products.
- **A linear charger's real current limit is thermal.** A 500 mA part in a small package folds back long before 500 mA — worked below.
- **Fuel gauges hold a battery-specific profile.** A replacement gauge without the learned or programmed data reports nonsense.
- **Protection ICs are often required in duplicate** by safety standards; removing the secondary because it "does the same thing" breaks compliance.
- **Cell count is fixed per part.** A 2S protector cannot manage a 3S pack.
- **Charge termination method matters**: current-taper termination, timer termination, or both. A replacement using only a timer overcharges a degraded cell.
- **The Intersil notebook-charger line is in last-time buy** — `ISL88731`, `ISL88733`, `ISL9520`, `ISL9230`, `ISL6251` in our catalogue.
- **`DS276x` gauges are 85% inactive** (45 of 53); the Linear `LTC294x` coulomb counters are obsolete.

---

## Float voltage and chemistry: the non-negotiable match

A lithium-ion charger regulates a constant current until the cell reaches its float voltage, then holds that voltage while the current tapers. The float voltage is the cell manufacturer's specification, and the charger must match it within tens of millivolts.

| Chemistry | Typical float per cell | Consequence of +150 mV |
| --- | --- | --- |
| Li-ion / LiPo standard | 4.20 V | Accelerated capacity fade, lithium plating risk |
| High-voltage LiPo | 4.35 V | (this is its correct value) |
| LiFePO₄ | 3.60-3.65 V | **Severe overcharge** |
| Li-titanate | 2.70-2.85 V | Severe overcharge |

The arithmetic that makes this a safety issue: cell ageing accelerates roughly exponentially with float voltage above the rated value, and overcharge drives metallic lithium deposition on the anode, which is both a capacity loss and an internal-short mechanism. A pack that has been over-floated for months can fail mechanically long after the substitution.

Three ways this happens in practice:

1. **Suffix mismatch within a family.** `LM3420AM5X-4.2` versus the 4.1 V or 8.4 V variants of the same part.
2. **Adjustable-versus-fixed confusion.** A fixed-voltage part fitted where an adjustable one was leaves the programming resistors floating; an adjustable part fitted where a fixed one was regulates to whatever the unpopulated divider dictates.
3. **Chemistry change without a charger change.** If the pack was second-sourced to LiFePO₄ and the charger was not touched, the charger is now wrong, and this is a pack-sourcing decision that never reached the power engineer.

Rule: for any charger substitution, confirm the float voltage from the datasheet's ordering table and confirm the cell's rated charge voltage from the cell datasheet. Both, every time.

## Linear chargers: the current rating is thermal

A linear charger dissipates the difference between input and battery voltage times the charge current, and that determines how much current it can actually deliver.

Worked, for a 5 V USB input charging a Li-ion cell at 3.6 V, in a SOT-23-5 with a junction-to-ambient resistance of 200 °C/W:

```
P = (V_IN − V_BAT) × I_CHG = (5.0 − 3.6) × 0.5 A = 0.70 W
ΔT = P × R_θJA = 0.70 × 200 = 140 °C rise
```

At 25 °C ambient that is a 165 °C junction, well past the thermal regulation threshold. The part does not fail — it folds back, reducing charge current until it reaches thermal equilibrium, typically delivering 150-250 mA instead of 500 mA. The battery charges, slowly, and nobody notices until a "same 500 mA" replacement in a different package behaves differently:

```
same conditions, DFN with thermal pad, R_θJA = 50 °C/W
ΔT = 0.70 × 50 = 35 °C rise → no foldback, full 500 mA
```

So the two parts have the same nameplate current and different real behaviour, in both directions: replacing the DFN part with the SOT-23 part halves the charge rate; replacing the SOT-23 part with the DFN part doubles the current the cell actually sees, which may exceed the cell's rated charge rate.

Check three things: the package's thermal resistance, whether the board provides the thermal pad connection the datasheet assumes, and the thermal-regulation setpoint. And for switching chargers (`BQ24xxx`, `BQ25xxx`) this problem largely disappears, which is often the right migration.

## Charge termination and pre-conditioning

How the charger decides to stop is a specification, and the methods are not equivalent.

| Method | How it works | Risk if substituted |
| --- | --- | --- |
| **Current taper (C/10)** | Terminates when current falls to a fraction of the set value | Safe; the standard method |
| **Timer only** | Terminates after a fixed time | **Overcharges a degraded cell** whose current never tapers as expected |
| **Taper + safety timer** | Taper primary, timer as backstop | Safest |
| **Top-off timer after taper** | Adds a fixed period at float | Extra charge; must match the cell's tolerance |

Pre-conditioning (trickle) behaviour matters equally. A deeply discharged cell must be charged at a reduced current (typically C/10) until it rises above a threshold around 2.8-3.0 V, because charging a deeply discharged cell at full current is a fire risk. A replacement that omits pre-conditioning, or uses a different threshold, removes a protection the original provided.

Also check:

- **Recharge threshold** (the voltage at which charging restarts after termination) — too high and the cell cycles constantly, too low and it sits partly discharged.
- **Safety timer duration and whether it can be disabled.**
- **NTC thermistor input and the JEITA temperature windows.** Charging a cold or hot cell is one of the most common causes of lithium plating, and if the original part enforced temperature-qualified charging, the replacement must too. **The thermistor beta value is part of that specification**: a 10 kΩ NTC with a different beta reports a different temperature.

## Fuel gauges: the profile is the product

A modern fuel gauge does not measure charge; it models a specific battery. Coulomb counting alone drifts, so gauges combine it with voltage, temperature and an impedance model of the pack.

That model comes from somewhere:

| Gauge type | Where the model lives | Substitution consequence |
| --- | --- | --- |
| **Coulomb counter** (`LTC294x`, `DS276x`) | Nowhere — host software integrates | Host firmware must be recalibrated for the new sense resistor and LSB |
| **Voltage-based / ModelGauge** (`MAX1704x`) | Internal model, sometimes configurable | Different model constants for a different cell |
| **Impedance-tracking** (`BQ27xxx`) | **Data-flash profile, learned or programmed at production** | A blank gauge reports meaningless state of charge until it learns |

The practical problem: a replacement gauge arrives blank. On an impedance-tracking part the production process included programming a chemistry profile and often a learning cycle, a full charge and controlled discharge that populates the data flash. Fit a new gauge without that step and the device reports a state of charge that can be wildly wrong, typically optimistic, which means a product that shuts down at "40% battery".

That production step is easy to lose when the gauge is substituted years later by a purchasing decision. If a gauge is on the BOM, the golden-image or learning procedure belongs in the same document as the part number.

Also: **the sense resistor value and the gauge's LSB are coupled.** Changing gauge without changing the sense resistor rescales every current and charge reading.

In our catalogue `MAX17048X003+T10` is last-time buy, `MAX17042G+T` is obsolete, the `LTC2941CDCB-1#TRPBF`, `LTC2942IDCB-1#TRPBF` and `LTC2943CDD-1#TRPBF` coulomb counters are obsolete, and `DS276x` runs 45 of 53 part numbers inactive — **85%**, the highest rate in either category. The `BQ27xxx` line is healthy at 8 of 113 inactive, which makes it the migration target, at the cost of the profile work.

## Protection ICs and why the redundancy is deliberate

A lithium pack's protection is layered, and the layers are required rather than optional.

- **Primary protection**: the pack's own protection IC and FETs, handling overvoltage, undervoltage, overcurrent and short circuit during normal operation.
- **Secondary protection**: an independent overvoltage protector with a separate fuse or permanent-disable path, present because the primary can fail.
- **Fuse or PTC**: a non-resettable last resort.

Safety standards for portable packs expect this layering, and a design that has been certified with two independent protection stages cannot silently drop to one because a single modern part "does both". If a replacement integrates the secondary function, the independence argument has to be re-made; that is a certification conversation, not a purchasing one.

Specification details that must match:

- **Overvoltage, undervoltage and overcurrent thresholds**, which are fixed per part number in most protector families. `BQ296113DSGR` and `BQ294707DSGR` are examples where the trailing digits select thresholds.
- **Delay times** for each threshold, which prevent nuisance trips on load transients.
- **Cell count** (1S, 2S, 3S, 4S) which is architectural.
- **Whether the part latches permanently** (blowing a fuse or setting a one-time bit) or recovers.

A protector that recovers where the original latched turns a permanent-disable safety response into a repeating fault, which is the same class of error described for [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), but with a lithium cell on the other side of it.

## Sourcing notes

Vendor concentration is unusual here. In battery management: ABLIC 1,585 part numbers, Maxim Integrated 1,322, Texas Instruments 919, Rochester Electronics 372, Linear Technology 368, Diodes 309. In chargers: Texas Instruments 821, Linear Technology 495, Maxim 425, Torex 328, Rochester 243, Microchip 235.

ABLIC's presence is worth knowing about. It is the former Seiko Instruments semiconductor business, and it holds the largest share of battery-protection parts in our catalogue: a vendor many Western BOMs never see, and a genuine source for 1S and 2S protectors.

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `BQ24xx` (chargers) | 497 | 73 | 15% |
| `BQ25xx` | 151 | 1 | 1% |
| `LTC40xx` | 217 | 5 | 2% |
| `MCP738x` | 167 | 26 | 16% |
| `BQ27xx` (gauges) | 113 | 8 | 7% |
| `BQ29xx` (protectors) | 257 | 32 | 12% |
| `BQ76xx` | 61 | 0 | 0% |
| `MAX17xx` (management) | 191 | 54 | 28% |
| **`DS276x`** | 53 | **45** | **85%** |

The clear conclusion: the Texas Instruments `BQ` families are the healthy ones, and the Maxim, Dallas and Intersil lineages are where the risk sits.

The Intersil notebook-charger group is in last-time buy — `ISL88731CHRTZ`, `ISL88733HRTZ`, `ISL88733HRTZ-T`, `ISL9520HRTZ`, `ISL9520HRTZ-T`, `ISL9230IRZ`, `ISL9230IRZ-T`, `ISL6251HRZ-T` — with `ISL6252AHAZ` and `ISL9201IRZ-T` already obsolete. These are SMBus battery chargers from the notebook ecosystem, and their register maps are host-software dependencies, so replacing one includes firmware work. `MAX16405GKM+` is also last-time buy; `MAX17015AETP+`, `MAX17087GTL+TG38`, `MAX1758EAI`, `BQ24730RGFR`, `LP3918TLX/NOPB` and `NCP1800DM42R2` are obsolete.

Incoming inspection for chargers and gauges should be functional and cell-safe:

- **Measure the float voltage** into a resistive load or an electronic load emulating a cell at 4.1 V. This verifies the suffix, which is the highest-consequence property.
- Measure charge current in the constant-current phase, and watch for thermal foldback over several minutes.
- Verify termination by holding the emulated cell at float and confirming the charger stops at the expected taper current.
- Check the NTC input by presenting resistances corresponding to hot and cold limits and confirming charging is inhibited.
- On gauges, read the device ID and the chemistry-profile registers, and confirm the profile is what production expects.

Never verify a charger by charging a real cell in an uncontrolled setup. Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Float voltage suffix vs the cell's rated charge voltage | Overcharge — safety event |
| 2 | Fixed vs adjustable output programming | Regulates to the wrong voltage |
| 3 | Chemistry (Li-ion, LiPo HV, LiFePO₄) | Severe overcharge |
| 4 | Package thermal resistance and pad connection | Thermal foldback, or too much current into the cell |
| 5 | Termination method (taper vs timer) | Overcharge of a degraded cell |
| 6 | Pre-conditioning current and threshold | Fire risk charging a deeply discharged cell |
| 7 | NTC input, JEITA windows, thermistor beta | Charging outside the safe temperature window |
| 8 | Recharge threshold | Constant cycling or partial charge |
| 9 | Gauge profile / data-flash programming step | Meaningless state of charge |
| 10 | Sense resistor value vs gauge LSB | All current and charge readings rescaled |
| 11 | Protection thresholds, delays and cell count | Nuisance trips or no protection |
| 12 | Primary/secondary protection independence | Certification invalid |
| 13 | Latch vs recover on protection trip | Permanent-disable response lost |
| 14 | SMBus/I²C register map | Host software breaks |

## FAQ

### Why is the charger's float voltage in the part number?

Because most single-cell charger families regulate to a fixed voltage set internally, and offering 4.1 V, 4.2 V, 4.35 V and multi-cell variants is done with different trim rather than different silicon. So the suffix — as in `LM3420AM5X-4.2` — is the specification. It also means a supplier offering "the same charger" with a different suffix is offering a part that will charge your cell to the wrong voltage. Confirm the float voltage from the ordering table and the cell's rated charge voltage from the cell datasheet, on every substitution.

### What happens if a charger floats 150 mV too high?

The cell ages far faster and, at the extreme, plates metallic lithium on the anode, which both loses capacity and creates an internal short-circuit mechanism. Cell life falls sharply with float voltage above the rated value, so the effect is cumulative rather than immediate: a pack over-floated for months can fail mechanically long after the substitution that caused it. This is why charger substitution is treated as a safety change rather than a performance one, and why 4.2 V and 4.35 V parts are not interchangeable in either direction.

### Why does my 500 mA linear charger only deliver 200 mA?

Thermal regulation. A linear charger dissipates (V_IN − V_BAT) × I_CHG, so charging a 3.6 V cell from 5 V at 500 mA is 0.7 W. In a SOT-23-5 with 200 °C/W junction-to-ambient resistance that is a 140 °C rise, well past the thermal regulation threshold, so the part reduces current until it reaches equilibrium — typically 150 to 250 mA. The same die in a thermally padded DFN at 50 °C/W runs the full 500 mA. Package and board thermal design, not the nameplate, set the real charge rate.

### Can I replace a coulomb-counting fuel gauge with an impedance-tracking one?

Only with production-process work. An impedance-tracking gauge such as the `BQ27xxx` family holds a chemistry profile in data flash, programmed at manufacture and refined by a learning cycle: a controlled full charge and discharge. A replacement gauge arrives blank, and until it has that profile it reports a state of charge that is typically optimistic and can be badly wrong, so a product may shut down while claiming 40% remaining. If a gauge is on the BOM, the profile-programming procedure belongs alongside the part number in the same document.

### Why do lithium packs need two protection ICs?

Because the primary protection can fail, and the consequences of an unprotected lithium cell are severe. The primary IC and its FETs handle overvoltage, undervoltage, overcurrent and short circuit in normal operation; an independent secondary overvoltage protector with its own fuse or permanent-disable path exists to catch a primary failure. Safety standards for portable packs expect that independence, so consolidating both functions into one modern part is a certification question rather than a bill-of-materials optimisation.

### What is different about a protector that latches versus one that recovers?

The system-level safety response. A latching protector blows a fuse or sets a one-time bit, permanently disabling the pack: the correct response to a fault that indicates the cell or the electronics is damaged. A recovering protector clears the fault when conditions return to normal, which suits transient overcurrent from an inrush. Substituting a recovering part where a latching one was turns a permanent-disable response into a repeating fault, with a lithium cell on the other side of it.

### Which charger and battery-management families are healthiest?

The Texas Instruments `BQ` lines. In our catalogue `BQ25xx` chargers run 1 of 151 inactive, `BQ76xx` monitors 0 of 61, `BQ27xx` gauges 8 of 113, `BQ29xx` protectors 32 of 257 and `BQ24xx` chargers 73 of 497. The risk sits in the Dallas and Intersil lineages: `DS276x` gauges are 45 of 53 inactive (85%) and the Intersil notebook chargers `ISL88731`, `ISL88733`, `ISL9520`, `ISL9230` and `ISL6251` are all in last-time buy, along with several Linear `LTC294x` coulomb counters now obsolete.

### How should incoming chargers be tested?

With an electronic load emulating a cell, never with a real cell in an uncontrolled setup. Set the emulated cell to about 4.1 V and measure the regulated float voltage — that verifies the suffix, which is the highest-consequence property. Then measure constant-current phase current and watch for thermal foldback over several minutes, confirm termination occurs at the expected taper current, and present NTC resistances corresponding to the hot and cold limits to confirm charging is inhibited outside the temperature window.

## Related reading

The rest of the power cluster: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide), [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide), [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide) (many PMICs include a charger) and [LDO cross-reference](/blog/ldo-cross-reference-guide).

Adjacent: [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for the thresholds that decide when a battery-powered system may run, [ADC sourcing](/blog/adc-sourcing-guide) for the measurement side of a gauge, and [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu) if the pack is automotive.

Send us the part number plus the cell's rated charge voltage and chemistry. We check the float voltage before we quote, because in this category that is the difference between a substitution and an incident.

[**Submit an RFQ**](/rfq) | [**Browse battery management**](/category/battery-management) | [**Browse battery chargers**](/category/battery-chargers) | [**Upload a BOM**](/bom)
