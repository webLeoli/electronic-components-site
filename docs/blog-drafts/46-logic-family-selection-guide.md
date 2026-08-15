---
title: "Logic Family Selection: LVC, AVC, LVT, HC and the Rest"
slug: "logic-family-selection-guide"
status: "draft"
seoTitle: "Logic Family Selection: LVC vs AVC vs LVT vs HC Explained"
seoDesc: "The 74-series suffix decides thresholds, drive, speed and 5V tolerance. A comparison table of the common families, what breaks when you substitute across them, and sourcing notes."
seoKeywords: "74LVC vs 74HC, logic family comparison, AVC logic, LVT logic, 5V tolerant logic, 74 series suffix, SN74LVC2G17, logic level thresholds, bus buffer sourcing"
tags: "logic, 74-series, LVC, AVC, LVT, HC, buffers, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "SN74LVC2G17DRYR, SN74LVT16245ADGGR, SN74AVC4T245PWRE4, NL17SZ07XV5T2G, 74LVX245M"
---

# Logic Family Selection: LVC, AVC, LVT, HC and the Rest

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: 74-series logic families, thresholds, drive strength, 5 V tolerance, sourcing

---

**The two or three letters in the middle of a 74-series part number matter more than the function at the end.** A 74HC245 and a 74LVC245 and a 74AVC245 all implement an octal bus transceiver, and they have different supply ranges, different input thresholds, different drive strengths, different propagation delays and different tolerance to voltages above their own supply. Substituting across families is the most common way a "same function" logic swap produces a board that half works. Buffers, drivers and transceivers account for 15,272 part numbers in our catalogue with a third discontinued, so this substitution comes up constantly.

## Key takeaways

- **The family suffix, not the function number, determines electrical behaviour.** 245 is an octal transceiver in every family; everything else differs.
- **Input threshold type is the first thing to check** — TTL-compatible or CMOS-level, because a 3.3 V signal into a 5 V CMOS-threshold input does not register as high.
- **5 V tolerance is a property of specific families**, not of all low-voltage logic. LVC and LVT tolerate 5 V inputs; AVC generally does not.
- **Drive strength varies by an order of magnitude** across families, and both too little and too much cause problems.
- **AVC is fast and fragile** — excellent for 2.5 V and below, poor tolerance for abuse.
- **Schmitt-trigger variants exist for a reason.** Substituting a plain buffer for a Schmitt input on a slow edge produces oscillation.

---

## The families that matter

| Family | Supply range | Input threshold | 5 V tolerant inputs | Typical drive | Speed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **HC** | 2–6 V | CMOS | No | ±4 mA | Slow | The classic CMOS family |
| **HCT** | 4.5–5.5 V | TTL | No | ±4 mA | Slow | HC with TTL thresholds |
| **LVC** | 1.65–3.6 V | TTL-ish | **Yes** | ±24 mA | Fast | The workhorse for 3.3 V designs |
| **LVT** | 2.7–3.6 V | TTL | **Yes** | ±64 mA | Fast | High drive, bus-hold, backplanes |
| **ALVC** | 1.65–3.6 V | CMOS | Some | ±24 mA | Very fast | Higher performance than LVC |
| **AVC** | 1.4–3.6 V | CMOS | **Generally no** | ±12 mA | Fastest | Sub-2.5 V, dynamic drive |
| **AHC** | 2–5.5 V | CMOS | No | ±8 mA | Moderate | Faster HC |
| **LVX / LCX** | 2–3.6 V | — | Varies | ±24 mA | Fast | Older low-voltage families |

Figures are indicative — check the specific datasheet, since drive strength in particular varies with supply voltage.

The three columns that cause failures are threshold, 5 V tolerance and drive.

## 1. Input threshold: TTL versus CMOS

A CMOS-threshold input switches at roughly half the supply. A TTL-threshold input switches at about 1.5 V regardless of supply.

That distinction decides whether a 3.3 V signal can drive a 5 V part:

```
5 V CMOS threshold (e.g. HC):   VIH ≈ 3.5 V   →  3.3 V input is NOT reliably high
5 V TTL threshold (e.g. HCT):   VIH = 2.0 V   →  3.3 V input is fine
```

This is why HCT exists. A design driving 5 V logic from a 3.3 V microcontroller must use TTL-threshold parts, and substituting an HC part for an HCT part produces a circuit that works at room temperature on a good day and fails over temperature and process variation.

The symptom is characteristic: **marginal, unit-dependent, temperature-dependent logic failures**, not a clean non-function.

## 2. 5 V tolerance

"Low voltage" does not imply "5 V tolerant".

- **LVC and LVT inputs tolerate 5 V** even when running from a 3.3 V supply, because their input structures omit the clamp diode to VCC. This makes them the standard choice for mixed-voltage boards.
- **AVC generally does not tolerate inputs above its supply**, because it is optimised for sub-2.5 V operation. Substituting an AVC part where an LVC part interfaced to 5 V logic will forward-bias the input protection and can damage both devices.
- **Outputs are a separate question.** A 3.3 V part's output cannot drive a 5 V CMOS input reliably regardless of tolerance — that requires a [level shifter](/blog/level-shifter-selection-guide).

**Check:** the absolute maximum input voltage rating relative to VCC, not just the family reputation.

## 3. Drive strength

Both too little and too much cause problems.

Too little drive:
- Slow edges into capacitive loads, eroding setup and hold margin.
- Failure to meet the receiver's input threshold within the required time.

Too much drive:
- **Ground bounce.** Many outputs switching simultaneously with high drive into a poor ground produces internal ground shift, which can corrupt other inputs on the same device.
- **Reflections and overshoot** on transmission lines, which can exceed input absolute maximums and increase emissions.
- **Higher emissions**, which matters if the design has passed EMC.

Substituting an LVT part (±64 mA) into a socket designed for an HC part (±4 mA) is a sixteenfold increase in drive. The circuit will function and the emissions profile will change.

**Check:** the drive strength of both parts against the actual load and against the EMC status of the design.

## 4. Schmitt-trigger inputs

Parts with Schmitt-trigger inputs (the 14, 17 and 132 function numbers among others) exist to clean up slow or noisy edges.

`SN74LVC2G17DRYR` is a dual Schmitt-trigger buffer; `NL17SZ07XV5T2G` is a plain buffer. They are not interchangeable in either direction if the input edge is slow:

- **Replacing a Schmitt with a plain buffer** on a slow edge produces oscillation as the input passes through the threshold region, since a plain input has no hysteresis.
- **Replacing a plain buffer with a Schmitt** is usually safe but adds hysteresis that shifts switching points, which can matter in timing-critical paths.

Slow edges arise from RC filters, long cables, mechanical switches and open-drain pull-ups — all common.

## 5. Bus hold and other input features

Some families, notably LVT, include **bus-hold** circuitry: a weak latch that keeps a floating input at its last state, preventing the excessive supply current that a floating CMOS input causes.

Substitution hazards run both ways:

- **Replacing a bus-hold part with a plain one** leaves previously floating inputs genuinely floating, causing oscillation and elevated supply current.
- **Replacing a plain part with a bus-hold one** means anything driving that input must overcome the hold current: a weak driver or a high-value pull-up may not.

## 6. Package, pinout and channel count

The 74-series function number implies a pinout, but:

- **Widebus (16-bit) parts** such as `SN74LVT16245ADGGR` have their own pinout conventions and multiple enable groupings.
- **Small-outline single-gate parts** (SN74LVC1G, NL17SZ) come in several package variants with different pinouts for the same function.
- **Level-translating transceivers** such as `SN74AVC4T245PWRE4` have two supplies and are a different class from a single-supply transceiver of the same function number.

That last point catches people: **a 4T245 is not a 245.** The "4T" indicates a four-bit dual-supply translating transceiver, which is a level shifter, not a plain buffer.

## Choosing a family

| Situation | Family |
| --- | --- |
| 3.3 V design, general purpose, may see 5 V inputs | **LVC** |
| 3.3 V backplane or heavy capacitive load | **LVT** (high drive, bus hold) |
| 2.5 V or below, high speed, controlled environment | **AVC** |
| 5 V design driven from 3.3 V logic | **HCT** |
| 5 V design, all 5 V logic, speed not critical | **HC** |
| Slow or noisy input edge | Any family, **Schmitt-trigger variant** |
| Translating between two supplies | Dual-supply translating part or a [level shifter](/blog/level-shifter-selection-guide) |

## Sourcing notes

Buffers, drivers, receivers and transceivers account for **15,272 part numbers with 33% discontinued**. The pattern within that is worth knowing:

- **Current mainstream families** (LVC, AVC, and single-gate variants) are well supplied. `SN74LVC2G17DRYR`, `SN74AVC4T245PWRE4` and `NL17SZ07XV5T2G` are ordinary procurement.
- **Older low-voltage families** such as LVX and LCX are thinning. `74LVX245M` is an example of a part already discontinued.
- **Widebus parts** in less common packages go earlier than their 8-bit equivalents.

Because logic is generic and multi-sourced, substitution is usually easier here than in most categories — **provided the family is matched**. Where a specific legacy part is needed, check authorised aftermarket first, per [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Input threshold type (TTL vs CMOS) | Marginal, temperature-dependent logic errors |
| 2 | 5 V tolerance on inputs | Damage via input protection |
| 3 | Drive strength vs load and EMC status | Slow edges, or ground bounce and emissions |
| 4 | Schmitt-trigger vs plain input | Oscillation on slow edges |
| 5 | Bus-hold presence | Floating inputs, or drivers unable to overcome hold |
| 6 | Supply range covers your rail | Out of spec |
| 7 | Propagation delay | Timing margin |
| 8 | Single-supply vs dual-supply translating variant | Completely different part class |
| 9 | Package and pinout verified for single-gate parts | Does not fit |

## FAQ

### What is the difference between 74HC and 74LVC?

HC operates from 2 to 6 V with CMOS input thresholds that switch at roughly half the supply, offers around ±4 mA drive, and is comparatively slow. LVC operates from 1.65 to 3.6 V with lower, TTL-like thresholds, offers around ±24 mA drive, is considerably faster, and (importantly) tolerates 5 V on its inputs even when powered from 3.3 V. LVC is the general-purpose choice for 3.3 V designs, while HC remains common in 5 V circuits.

### Why doesn't my 3.3 V signal reliably drive a 5 V logic input?

Because the part probably has CMOS input thresholds. A 5 V CMOS input requires roughly 3.5 V to register as a logic high, and a 3.3 V signal does not reliably exceed that across temperature and process variation. The result is marginal, unit-dependent behaviour rather than a clean failure. Use a TTL-threshold family such as HCT, whose input high threshold is around 2 V regardless of supply.

### Which logic families are 5 V tolerant?

LVC and LVT tolerate 5 V on their inputs while running from a 3.3 V supply, because their input structures omit the clamp diode to VCC. AVC generally does not, being optimised for sub-2.5 V operation, and substituting an AVC part where an LVC part interfaced with 5 V logic can damage it. Note that tolerance applies to inputs only: a 3.3 V output still cannot reliably drive a 5 V CMOS input without translation.

### Can I substitute a higher-drive logic part?

It will function, but consider the consequences. Moving from a ±4 mA HC part to a ±64 mA LVT part is a sixteenfold drive increase, which produces faster edges, more ground bounce when several outputs switch together, greater overshoot and reflection on transmission lines, and higher emissions. If the design has passed EMC testing, that result is no longer guaranteed. Match drive to the actual load rather than maximising it.

### What is a Schmitt-trigger logic input and when do I need one?

A Schmitt-trigger input has hysteresis: it switches high at one threshold and low at a lower one, so a slowly changing or noisy input produces a single clean transition rather than multiple. It is needed wherever edges are slow — RC-filtered signals, long cables, mechanical switch inputs and open-drain lines with weak pull-ups. Substituting a plain buffer for a Schmitt-trigger part on a slow edge causes oscillation as the input crosses the threshold region.

### What is bus hold and why does it matter?

Bus hold is a weak latch on an input that maintains its last logic state when nothing is driving it, preventing the oscillation and elevated supply current that a floating CMOS input causes. It is common in the LVT family. Replacing a bus-hold part with a plain one leaves previously floating inputs genuinely floating; replacing a plain part with a bus-hold one means whatever drives that input must overcome the hold current, which a weak driver or high-value pull-up may not manage.

### Is a 74AVC4T245 the same as a 74AVC245?

No. The 4T designation indicates a four-bit dual-supply translating transceiver (effectively a level shifter with separate VCCA and VCCB supplies) while a plain 245 is an eight-bit single-supply transceiver. They differ in channel count, supply arrangement, pinout and purpose. The insertion of a letter and digit into the function number signals a different device class, not a variant.

### Which logic parts are hardest to source?

Older low-voltage families such as LVX and LCX are thinning, and widebus 16-bit parts in less common packages tend to go before their 8-bit equivalents. Overall, 33% of the buffer, driver, receiver and transceiver part numbers we cover are discontinued. Current mainstream families (LVC, AVC and the single-gate variants) remain ordinary procurement, so most substitutions have plenty of candidates once the family requirements are established.

## Related reading

The cross-cutting framework for interface parts is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide). Where two supply domains meet, [level shifter selection](/blog/level-shifter-selection-guide) covers the architecture question that logic families alone cannot solve. For bus transceivers specifically, [RS-485 transceiver sourcing](/blog/rs485-transceiver-sourcing-guide) and [CAN transceiver sourcing](/blog/can-transceiver-sourcing-guide).

Send us the part number with your supply voltages, load and EMC status and we will come back with candidates in the right family.

[**Submit an RFQ**](/rfq) | [**Browse logic buffers & drivers**](/category/logic-buffers-drivers) | [**Upload a BOM**](/bom)
