---
title: "Real-Time Clocks: The Battery Is Inside the Part, and It Has Been Ageing Since the Date Code"
slug: "rtc-sourcing-guide"
status: "draft"
seoTitle: "RTC Sourcing Guide: Embedded-Battery Modules, I2C Addresses, Crystal Load"
seoDesc: "55% of 2,073 RTC parts are inactive. Why DS1743-class modules with internal lithium cells cannot be stockpiled, fixed I2C addresses, crystal load capacitance and backup switchover."
seoKeywords: "RTC sourcing, DS1743 replacement, DS1307 vs DS3231, embedded battery RTC obsolete, NVRAM RTC module, RTC I2C address conflict, 32.768 kHz crystal load capacitance, ISL1208 last time buy"
tags: "real-time clocks, RTC, embedded battery, NVRAM modules, crystal load, backup power, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Timing & Clock Distribution"
relatedProducts: "DS1338Z-18+, DS1339U-33+T&R, DS1672U-33+T&R, DS12R885S-33+T&R, DS1685S-3+T&R, DS1743P-85+, DS1251YP-70+, ISL1208IU8Z-TK"
---

# Real-Time Clocks: The Battery Is Inside the Part, and It Has Been Ageing Since the Date Code

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: embedded-battery modules, date codes, I²C addressing, crystal load, backup switchover, timekeeping current

---

**A whole class of real-time clocks contains a lithium cell moulded into the package, and that cell started ageing the day the part was made, not the day you installed it.** `DS1743`, `DS1251`, `DS12885` and their relatives combine an RTC, SRAM and a battery into one module, which was an elegant solution in 1995 and is a sourcing trap in 2026: the shelf life is the battery's life, "new old stock" is worth less than its date code suggests, and the refurbishment trade (modules opened and re-batteried) is active. Add that **55% of the 2,073 parts in our [real-time clocks category](/category/real-time-clocks) are no longer active**, and this becomes one of the least forgiving categories to substitute in.

## Key takeaways

- **Embedded-battery modules cannot be stockpiled.** The internal cell ages from manufacture, so a last-time buy has a hard expiry the part number does not mention.
- **Date code matters more here than almost anywhere else**, and re-batteried modules are a known counterfeit category.
- **I²C addresses are fixed per family.** `DS1307` and `DS3231` share address 0x68, so one cannot join a bus that already has the other.
- **Crystal load capacitance must match the RTC's specification**, or the clock gains or loses minutes per month.
- **`DS3231` includes its crystal and a TCXO**; `DS1307` needs an external 32.768 kHz crystal. That is a board change in both directions.
- **Backup switchover behaviour differs**: battery versus supercapacitor, trickle charger present or absent, switchover threshold.
- **Timekeeping current sets coin-cell life**, and at hundreds of nanoamps the cell's self-discharge dominates, not the RTC.
- **The Intersil `ISL12xx` line is the acute risk**: 102 of 146 part numbers inactive, with `ISL1208IRT8Z-TK`, `ISL1218IUZ-T` and `ISL1221IUZ` in last-time buy.

---

## The embedded-battery module problem

Modules such as `DS1743P-85+`, `DS1251YP-70+`, `DS12R885S-33+T&R` and `DS1685S-3+T&R` integrate a crystal, an RTC, non-volatile SRAM and a lithium cell in a single package. They were designed so a board could keep time and configuration with no external battery, no holder and no crystal.

The consequences for procurement are unlike any other part:

| Property | Consequence |
| --- | --- |
| Internal cell, not replaceable | End of cell life is end of part life |
| Cell ages from manufacture | **Shelf time counts against service life** |
| No external battery contacts | Cannot be refreshed in the field |
| Typical cell capacity is small | Service life is quoted as "10 years at 25 °C" from manufacture |
| High reflow temperature damages cells | Many are supplied in through-hole or socketed modules |

So the standard obsolescence response (a last-time buy) partially fails here. Buying ten years of stock for a part whose internal battery has a ten-year life from manufacture means the last units installed have no backup capability left. In [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) the usual constraints are moisture, oxidation and solderability; for these modules, **the binding constraint is the cell**, and the arithmetic changes:

```
usable stock horizon = cell service life − age at purchase − expected time on the shelf
```

Two practical rules. First, prefer the freshest date code available and record it: the traceability practice in [date codes and lot traceability](/blog/date-code-lot-traceability-explained) is not optional for these parts. Second, if the design will outlive the available stock, the correct answer is usually a redesign to a modern RTC plus an external coin cell, which restores field serviceability. The decision framework is [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

These modules are also a known counterfeit and refurbishment target. The failure mode of an exhausted module is benign (it simply loses time on power-down) so a re-batteried or relabelled part passes any functional test that does not include a power-cycle-and-wait. Incoming inspection has to include exactly that test, and it takes hours, not seconds.

## I²C addresses are part of the design

Most modern RTCs are I²C parts with a fixed address, and the address is a property of the family, not a strapping option.

| Family | Typical address |
| --- | --- |
| `DS1307`, `DS1338`, `DS3231`, `DS1339` | 0x68 |
| `PCF8563` | 0x51 |
| `M41T`-series | 0x68 (family-dependent) |
| `MCP7940x` | 0x6F |
| `ISL12xx` | varies by part |

Two substitution consequences:

A replacement with a different address requires a firmware change. On a product with locked or certified firmware, that alone can rule out an otherwise perfect part.

**A replacement with the *same* address can collide.** If the bus already carries another device at 0x68 (a temperature sensor, an EEPROM, another RTC) the new part cannot join it. This is the practical reason `DS3231` and `DS1307` cannot coexist.

Also check **bus voltage**: `DS1307` is a 5 V part; `DS1338`, `DS1339` and `DS3231` operate down to around 2.3 V. Putting a 5 V-only RTC on a 3.3 V bus gives marginal high levels; putting a 3.3 V part on a 5 V bus may exceed its ratings. That is the level-translation question covered in [level shifter selection](/blog/level-shifter-selection-guide).

## Crystal load capacitance: minutes per month

An RTC that drives an external 32.768 kHz crystal specifies the load capacitance it is designed for, typically 6 pF or 12.5 pF. Using a crystal specified for a different load pulls the frequency, and at 32.768 kHz small errors are large in wall-clock terms.

```
frequency error of 20 ppm  = 20 × 10⁻⁶ × 86,400 s/day
                           = 1.73 s/day  ≈ 52 s/month

frequency error of 100 ppm = 8.6 s/day   ≈ 4.4 min/month
```

A crystal mismatch of the wrong load capacitance easily produces tens of ppm, which is minutes per month: the classic "the clock drifts" complaint. Since the crystal and the RTC are usually purchased separately, a substitution on either side can break the pairing:

- **Replacing the RTC** with one specified for a different load capacitance, while keeping the crystal.
- **Replacing the crystal** with a mechanically identical part specified for a different load.

`ABM8-16.000MHZ` appears in this category in our catalogue as an example of the crystal side of the pairing; the RTC side must state its designed load in the datasheet.

`DS3231` sidesteps the problem entirely by integrating the crystal and a temperature-compensated oscillator, reaching ±2 ppm. That makes it an attractive upgrade, but it is a board change: the external crystal and its load capacitors must be removed, and the part is physically larger.

Where the external crystal remains, note also:

- **Series resistance (ESR) limits** in the RTC's oscillator specification.
- **Layout**: the oscillator node is high-impedance, so guard traces and short routing matter. This is one of the few RTC problems that is genuinely a layout issue rather than a part issue.
- **Some RTCs offer digital trim registers**, which can calibrate out a known offset — worth checking before rejecting an otherwise good replacement.

## Backup power: switchover, trickle charge, and supercapacitors

Three behaviours differ across RTC families and all three are board-level.

Switchover threshold and hysteresis. The RTC switches from the main supply to the backup source at an internal threshold. If a replacement's threshold is higher, it may switch to battery during normal supply dips, draining the cell; if lower, timekeeping may fail during a slow supply ramp.

Trickle charger. Some parts (`DS1339` is the well-known example, `DS1339U-33+T&R` is active in our catalogue) include a switchable charging path intended for a rechargeable cell or a supercapacitor. Substituting a part *without* the charger into such a design means the supercapacitor never recharges and timekeeping fails after the first long outage. Substituting a part *with* the charger enabled by default into a design with a **primary lithium cell** attempts to charge a non-rechargeable battery, which is a safety issue, not just a reliability one.

Backup input current and leakage, which determine whether the source lasts.

Worked, for a coin cell backing up an RTC:

```
CR2032 usable capacity      ≈ 200 mAh
RTC timekeeping current     = 425 nA
theoretical life = 200 mAh / 0.000425 mA = 470,000 h ≈ 53 years
```

At that current the battery's own self-discharge dominates, so the practical limit is the cell's shelf life (roughly ten years) not the RTC. But:

```
RTC timekeeping current     = 1.5 µA
life = 200 mAh / 0.0015 mA  = 133,000 h ≈ 15 years
```

```
RTC timekeeping current     = 5 µA   (older parts, or one with the oscillator always driving an output)
life = 200 mAh / 0.005 mA   = 40,000 h ≈ 4.6 years
```

A substitution that raises timekeeping current from 425 nA to 5 µA turns a battery that outlives the product into one that needs replacing every four years. Check the timekeeping-current row specifically; it is separate from operating current, and features such as an enabled square-wave output or an active alarm can raise it.

## Registers, formats and the details firmware depends on

RTC register maps are not standardised, and a "compatible" part may differ in ways that firmware notices:

- **BCD versus binary** register formats.
- **Century bit** presence and semantics.
- **12/24-hour mode** and where the AM/PM flag lives.
- **Oscillator-stop flag**, which tells firmware the time is invalid after a backup failure. A replacement without it removes the only way to detect a dead battery.
- **Alarm capability** — number of alarms, granularity, and whether alarms work while on backup power.
- **Square-wave or 32 kHz output** presence and default state, which affects both current and any circuit relying on it.
- **NVRAM size**, on parts that include general-purpose RAM. Legacy designs often store configuration there, and a replacement with less RAM, or none, breaks it silently.

The `DS1307` to `DS3231` upgrade is the common real-world case: same address, similar register layout, much better accuracy, but `DS3231` has different alarm registers, an integrated temperature register, and no user NVRAM, so firmware written for a `DS1307` needs review rather than a recompile.

## Sourcing notes

55% of the category is inactive, and the vendor split explains the concentration of risk: Maxim Integrated 706 part numbers, EPSON 266, Rochester Electronics 218, Renesas 210, Intersil 134, Microchip 119.

| Family prefix | Parts held | Not active |
| --- | ---: | ---: |
| `ISL12…` | 146 | **102** |
| `DS12…` | 102 | 65 |
| `M41T…` | 58 | 34 |
| `MCP794…` | 59 | **0** |
| `RV…` | 62 | 28 |
| `BQ32…` | 27 | 20 |
| `DS1302` | 23 | 14 |
| `DS3231` | 12 | 2 |

Three things worth acting on:

The Intersil `ISL12xx` line is the highest-risk family, at 102 of 146 inactive, with `ISL1208IRT8Z-TK`, `ISL1218IUZ-T` and `ISL1221IUZ` in last-time buy. `ISL1208IU8Z-TK` remains active. As elsewhere in the Renesas-owned Intersil portfolio, this is a managed wind-down rather than a supply shock, but it needs a decision per part number.

Microchip `MCP794x` is the healthiest family at zero inactive across 59 part numbers, which makes it a reasonable migration target where the address and register differences can be absorbed.

Renesas is second-sourcing some Dallas-compatible parts — our catalogue shows `1338-18DCGI8`, `1339AC-2SRGI8` and `1337BCSRGI8` in last-time-buy status, which are Renesas equivalents of `DS1338`, `DS1339` and `DS1337`. Worth knowing that these second sources exist, and worth noting that they are being wound down too. `ISL1218IUZ` also appears from **Flip Electronics**, one of the licensed continuity manufacturers: the channel distinction is in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Incoming inspection for RTCs must include a power-cycle test with a wait. Set the time, remove main power for at least an hour, restore it and read the time back. That single test catches an exhausted or missing backup cell, a dead oscillator, and a re-batteried module — none of which a static functional check reveals. For embedded-battery modules, record the date code for every unit received. Package-level inspection follows [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Embedded battery — age from date code | Backup exhausted before installation |
| 2 | I²C address, and what else is on the bus | No communication, or address collision |
| 3 | Bus and supply voltage range | Marginal levels or overstress |
| 4 | Crystal load capacitance match | Minutes per month of drift |
| 5 | Integrated versus external crystal | Board change required |
| 6 | Backup switchover threshold | Battery drained on supply dips |
| 7 | Trickle charger present and its default state | Supercap never charges, or a primary cell is charged |
| 8 | Timekeeping current | Coin-cell life falls from decades to years |
| 9 | Register format: BCD vs binary, century bit | Wrong date, Y2K-class bugs |
| 10 | Oscillator-stop flag present | No way to detect a dead battery |
| 11 | Alarm count, granularity, backup-mode operation | Wake-up function lost |
| 12 | NVRAM size on module parts | Stored configuration lost |
| 13 | Square-wave/32 kHz output default | Extra current, or a missing signal |

## FAQ

### Why can't I stockpile DS1743-class RTC modules?

Because the lithium cell is inside the package and ages from the date of manufacture, not from installation. These modules (`DS1743`, `DS1251`, `DS12885`, `DS1685` and relatives) integrate the crystal, RTC, SRAM and battery so the board needs no external cell, and the quoted service life of around ten years at room temperature starts at the factory. A ten-year last-time buy therefore leaves the final units with no usable backup. Buy the freshest date codes you can, record them, and if the product outlives the stock, plan a redesign to a modern RTC with an external coin cell.

### How do I detect an exhausted or re-batteried RTC module?

Power-cycle with a wait. Set the time, remove main power for at least an hour, restore it and read the time back. An exhausted internal cell fails exactly here and nowhere else, which is why a static functional test passes a dead module. This also catches re-batteried and relabelled parts, an active refurbishment trade for these modules precisely because the failure is invisible on the bench. Record date codes for every unit received and treat inconsistent codes within a lot as a rejection.

### Can DS1307 and DS3231 share an I²C bus?

No — both use address 0x68, so only one can be present. That also makes them a straightforward swap from an addressing point of view, but the differences elsewhere are real: `DS3231` integrates its crystal and a temperature-compensated oscillator reaching about ±2 ppm, operates from roughly 2.3 V rather than 5 V, has different alarm registers, adds a temperature register and provides no user NVRAM. Firmware written for a `DS1307` needs review rather than a straight recompile.

### Why does my RTC drift by minutes per month?

Almost always a crystal load-capacitance mismatch. An RTC that drives an external 32.768 kHz crystal is designed for a specific load, commonly 6 pF or 12.5 pF; a crystal specified for a different load pulls the frequency by tens of ppm. Since 20 ppm is 1.73 seconds per day (about 52 seconds a month) and 100 ppm is over four minutes a month, small mismatches are very visible. Check the RTC's specified load against the crystal's, and whether the part offers a digital trim register to correct a known offset.

### What is a trickle charger on an RTC and why does it matter?

A switchable charging path from the main supply to the backup input, intended for a rechargeable cell or a supercapacitor. It matters in both substitution directions. Replacing a part that has one (such as the `DS1339`) with a part that does not means a supercapacitor backup never recharges and timekeeping fails after the first long power outage. Replacing a part without one with a part whose charger is enabled by default, in a design using a primary lithium cell, attempts to charge a non-rechargeable battery, which is a safety problem rather than merely a reliability one.

### How long should a coin cell last backing up an RTC?

Longer than the cell's own shelf life, if the RTC is modern. At 425 nA of timekeeping current a 200 mAh CR2032 would theoretically last over fifty years, so the practical limit is the cell's self-discharge — roughly ten years. But the figure is very sensitive to the part: 1.5 µA gives about fifteen years and 5 µA about four and a half. Check the timekeeping-current specification specifically, and note that an enabled square-wave output or an active alarm can raise it substantially.

### Which RTC families should I avoid designing in?

The Intersil `ISL12xx` range is the highest risk in our catalogue at 102 of 146 part numbers inactive, with several more in last-time buy. `BQ32xx` runs 20 of 27 inactive, `DS12xx` 65 of 102 and `M41T` 34 of 58. The healthiest family we hold is Microchip's `MCP794x` at zero inactive across 59 part numbers, followed by `DS3231` at 2 of 12. For a new design, prefer a part with an integrated crystal if accuracy matters, and an external coin cell rather than an embedded one if service life does.

### Do I need to worry about the oscillator-stop flag?

Yes, if anything downstream trusts the time. The flag tells firmware that the oscillator stopped at some point (usually because the backup supply failed) which means the time held in the registers is meaningless rather than merely wrong. Firmware that checks it can flag the condition, request a resync and avoid writing bad timestamps into a log. A replacement RTC without an equivalent flag removes the only reliable way to detect a dead battery, and the symptom becomes plausible-looking but false timestamps.

## Related reading

The rest of this cluster: [555 timers and delay ICs](/blog/555-timer-delay-ic-sourcing-guide), [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide), [clock buffer and fanout sourcing](/blog/clock-buffer-fanout-sourcing-guide), and [clock generators and PLLs](/blog/clock-generator-pll-sourcing).

Because RTC modules include SRAM, the memory side matters too: [memory IC sourcing](/blog/memory-ic-sourcing-guide) and [SRAM sourcing](/blog/sram-sourcing-guide). For the procurement mechanics: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [date codes and lot traceability](/blog/date-code-lot-traceability-explained), [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

Send us the part number and tell us whether the battery is inside the package — if it is, we will quote with date codes, because on these parts the date code is part of the specification.

[**Submit an RFQ**](/rfq) | [**Browse real-time clocks**](/category/real-time-clocks) | [**Upload a BOM**](/bom)
