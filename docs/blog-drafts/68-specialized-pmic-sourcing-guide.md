---
title: "Specialised PMICs: A Companion Chip Dies With Its Processor"
slug: "specialized-pmic-sourcing-guide"
status: "draft"
seoTitle: "PMIC Sourcing Guide: OTP Configurations, Rail Sequencing, USB-C PD and Qi"
seoDesc: "7,428 specialised power-management parts at 40% inactive. Why a PMIC has no second source, how OTP-programmed defaults make the part number a configuration, and what a discrete replacement costs."
seoKeywords: "PMIC sourcing, TPS65911 obsolete, PMIC no second source, OTP programmed PMIC, rail sequencing discrete replacement, USB-C PD controller obsolete, Qi wireless power NXQ1TXL5, display bias IC"
tags: "PMIC, power management, sequencing, OTP configuration, USB-C PD, wireless power, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Analog & Power Sourcing"
relatedProducts: "TPS6591104A2ZRCR, TPS6591102A2ZRCR, TPS650003RTER, TPS65983BAZQZR, TPS65168RSBR, BQ51222YFPR, NXQ1TXL5/101J, ISL6548ACRZA"
---

# Specialised PMICs: A Companion Chip Dies With Its Processor

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: companion-chip lifecycles, OTP configurations, sequencing, protocol-defined parts, discrete replacement

---

**A power-management IC is not a power part with extra features; it is a companion chip designed around one processor's rails, sequence and register map, and it has no second source at any price.** The rail count, the default voltages, the order and delay of the start-up sequence, and the I²C register layout are all specific to the processor family it was built for. When that processor goes end of life, the PMIC follows, and unlike a regulator, nothing else in the world implements the same combination. Our [specialised power management category](/category/specialized-power-management) holds **7,428 part numbers with 2,984 no longer active (40%)**, and the pattern in the data is unmistakable: the parts that go are the ones whose host silicon went first.

## Key takeaways

- **A PMIC has no drop-in equivalent, ever.** The replacement is a set of discrete regulators plus a sequencer, or a redesign to a current processor and its PMIC.
- **The part number encodes an OTP configuration.** `TPS6591102`, `TPS6591104` and `TPS6591106` differ in factory-programmed defaults, not in silicon.
- **Sequencing is a safety-of-silicon requirement**, not a preference: violating core-before-I/O order forward-biases ESD structures between domains.
- **Protocol PMICs expire with the specification revision** — USB-C Power Delivery and Qi are moving targets, and an obsolete controller may not be certifiable.
- **Display-bias and camera PMICs are tied to a panel or sensor**, so they inherit that component's lifecycle too.
- **The Intersil `ISL6xxx` and Semtech `TS8xxxx` parts here are in last-time buy**, alongside NXP's wireless-power transmitters.
- **Budget the discrete replacement early.** It is typically 4-8 parts, a sequencer and a board revision — knowable in advance, unlike a broker search.

---

## Why a PMIC cannot be second-sourced

Every axis of a PMIC's specification is host-specific.

| Axis | Why it locks the part in |
| --- | --- |
| **Rail count and type** | e.g. three bucks, four LDOs, one boost — matched to the processor's power map |
| **Default output voltages** | Programmed in OTP so the processor boots before firmware runs |
| **Sequencing order and delays** | Defined by the processor's power-up requirements |
| **Current capability per rail** | Sized to the processor's core, I/O, memory and analogue draw |
| **I²C address and register map** | Host firmware and often the boot ROM depend on it |
| **Interrupt, reset and enable handshakes** | Wired into the processor's reset architecture |
| **Extras** | RTC, backup switchover, ADC, GPIO, watchdog, charger — each an additional dependency |

Match six of those seven and the part still will not work. This is why the category behaves unlike any other in the catalogue: obsolescence is not a supply problem to be solved by finding stock, it is a design problem, and the sooner it is recognised the cheaper it is.

In our catalogue the pattern is visible in the part numbers. `TPS6591104A2ZRCR`, `TPS6591102A2ZRCR` and `TPS6591106A2ZRCR` are all obsolete: a family of processor-companion PMICs whose host generation has passed. `TPS650003RTER` is obsolete. `MWPR2… `-class Freescale parts (`MWPR1516CFM`) are obsolete. Meanwhile `TPS65168RSBR` (display bias) and `ADP2450ACPZ-1-R7` remain active because their applications are still shipping.

## The OTP configuration problem

Two PMICs with adjacent part numbers are frequently the same die with different factory-programmed memory.

The OTP contents typically set:

- default voltage of each rail,
- the sequencing order and inter-rail delays,
- which rails are enabled at power-up versus under software control,
- default switching frequency and mode (PWM/PFM),
- I²C address, on some families.

So the part number is a configuration, exactly as it is for the factory-programmed oscillators described in [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide). The consequences are the same and worth stating plainly:

- **A different suffix is a different product**, even where the datasheet is shared.
- **Stock is per-configuration**, and a configuration with no remaining demand simply ends.
- **A new configuration means an NRE conversation and a minimum order quantity**, if the vendor still supports programming for that family at all.

The practical check: when a supplier offers "the same PMIC, different suffix", ask for the OTP configuration table and compare it row by row against the original. If the vendor cannot supply it, the offer cannot be evaluated.

## Sequencing: why order is a hardware requirement

Modern processors specify the order in which their supplies must rise, and violating it can damage the die.

The mechanism: between two supply domains on the same silicon there are ESD protection structures and parasitic diodes. If the I/O rail rises while the core rail is still at zero, current flows from I/O through those structures into the core domain. At best it latches up; at worst it degrades the junctions over many power cycles, producing a part that fails after months in the field.

A typical requirement looks like:

```
t = 0 ms     1.2 V core rail begins to rise
t = 2 ms     core stable → 1.8 V memory rail enabled
t = 4 ms     memory stable → 3.3 V I/O rail enabled
t = 8 ms     all rails good → reset released
```

A PMIC implements that timing internally, from OTP. A discrete replacement must reproduce it with enable-chaining, a sequencer IC, or supervisors gating each stage, and the reset release at the end is exactly the function described in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).

Two further points that catch people:

Power-down order matters too, and is often the reverse of power-up. A discrete design that simply removes the input supply may collapse rails in the wrong order, which is the same forward-biasing problem in reverse.

Pre-bias start-up. If a rail is already partly charged when the supply starts (common in a partially powered system) a regulator that cannot start into a pre-biased output will fight it. PMICs handle this; not every discrete regulator does.

## Protocol PMICs: the specification is the lifecycle

Some parts in this category implement a negotiating protocol, and protocols revise.

USB-C Power Delivery. `TPS65983BAZQZR` is obsolete in our catalogue. A PD controller implements a specific revision of the USB PD specification in firmware or hard logic, and it interacts with certification: a product recertifying against a newer revision may not be able to use an older controller at all. **So a PD controller's obsolescence can force a redesign even when the part is still obtainable**, which inverts the usual sourcing logic.

Wireless power (Qi). `NXQ1TXL5/101118` is active in our catalogue while `NXQ1TXL5/101J` is last-time buy — two configurations of NXP's Qi transmitter controller. `BQ51222YFPR` (receiver side) is active; the Freescale `MWPR1516CFM` transmitter is obsolete. Qi has revised repeatedly, and interoperability testing is against a specification version.

Display bias. `TPS65168RSBR` is active and generates the AVDD, VGH, VGL and gamma rails an LCD panel needs. Those voltages are **panel-specific**, so the part inherits the panel's lifecycle: when the panel is discontinued, the bias configuration has no other use. This is a common trap in industrial HMI equipment, where the panel and its bias IC go together and the replacement panel needs different rails entirely.

## Costing the discrete replacement

The advantage of recognising a PMIC as unreplaceable is that the alternative is a knowable engineering job, not an open-ended search.

A four-rail PMIC typically decomposes to:

| Function | Discrete equivalent |
| --- | --- |
| Core buck, 1.2 V at 2 A | One synchronous buck regulator |
| Memory buck, 1.8 V at 1 A | One synchronous buck regulator |
| I/O LDO, 3.3 V at 300 mA | One LDO — see [LDO cross-reference](/blog/ldo-cross-reference-guide) |
| Analogue LDO, 2.8 V at 100 mA | One low-noise LDO |
| Sequencing and reset | A sequencer or cascaded enables plus a supervisor |
| Power-good aggregation | Discrete logic or the supervisor's outputs |
| I²C control and telemetry | **Usually dropped** — needs firmware change if the host expects it |

That is five to seven parts, a board revision, and a firmware change if the host talks to the PMIC over I²C. It is more expensive in bill-of-materials terms and much cheaper in risk terms, because every part in the list is a commodity with multiple sources.

The decision framework is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), and for a PMIC the answer leans toward redesign earlier than for almost any other part class, because a last-time buy only defers a redesign that will still be required, and meanwhile the OTP configuration cannot be re-ordered.

## Sourcing notes

Vendor spread: Texas Instruments 1,035 part numbers, Rochester Electronics 1,007, Maxim Integrated 939, Renesas 823, Diodes Incorporated 656, NXP Semiconductors 582.

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `LTC3xxx` | 176 | 16 | 9% |
| `LP87xx` | 20 | 2 | 10% |
| `DA90xx` | 19 | 0 | 0% |
| `TPS6xxxx` | 402 | 141 | 35% |
| `MAX8xxx` | 155 | 85 | **55%** |
| `ADP5xxx` | 9 | 5 | 56% |

Three observations worth acting on:

Maxim's `MAX8xxx` PMIC range is the most affected at 55%, reflecting both the age of those designs and the Maxim-into-Analog-Devices consolidation.

Renesas holds 823 part numbers here and is pruning — `ISL6548ACRZA`, `ISL6548ACRZA-T`, `ISL6218CVZ` and `ISL6218CVZ-T` are all last-time buy in our catalogue. The Semtech `TS8xxxx` and `TS5xxxx` group (`TS81000-QFNR`, `TS80000-916203QFNR`, `TS51231-QFNR`, `TS51224-M000WCSR`) is in the same state.

Rochester Electronics carries 1,007 part numbers in this category, which is unexpectedly good news: for a discontinued PMIC, authorised aftermarket production of the original die is the only true drop-in that will ever exist. `MAX6306UK44D3+`, `NXQ1TXL5/101118`, `MAX4915AEUK+` and `TPS650003RTER` all appear from that channel here. **If a PMIC is the blocker on a legacy product, check the aftermarket first and the redesign second** — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

For incoming inspection, a PMIC is one of the harder parts to verify, because most of its behaviour is in its configuration. Practical tests:

- **Power it up unloaded and record every rail's voltage and the sequence timing** with a multi-channel scope. That single capture verifies the OTP configuration, which is the thing most likely to be wrong.
- Read the device ID and revision registers over I²C and compare with the original.
- Verify the I²C address matches, since some configurations change it.
- Check power-good and interrupt behaviour on a deliberate fault.

Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | OTP configuration table, row by row | Wrong default voltages at boot |
| 2 | Rail count, type and current capability | Rail sags or is missing |
| 3 | Sequencing order and inter-rail delays | ESD structures forward-biased; latch-up or degradation |
| 4 | Power-down order | Same damage mechanism in reverse |
| 5 | I²C address and register map | Host firmware and boot ROM fail |
| 6 | Reset, interrupt and enable handshakes | Processor never comes out of reset |
| 7 | Protocol revision (USB PD, Qi) | Interoperability or certification failure |
| 8 | Panel or sensor compatibility (display/camera bias) | Wrong bias voltages |
| 9 | Pre-bias start-up capability | Supplies fight during partial power-up |
| 10 | Integrated extras relied upon (RTC, ADC, watchdog) | Silent loss of a system function |
| 11 | Thermal capability in the actual enclosure | Thermal shutdown under load |
| 12 | Discrete replacement costed and scheduled | Deferred redesign becomes an emergency |

## FAQ

### Why can't a PMIC be second-sourced like a regulator?

Because it is a companion chip, not a power part. Its rail count and currents match one processor's power map, its default voltages are burned into OTP so the processor can boot before firmware runs, its sequencing order and delays implement that processor's power-up requirement, and its I²C register map is what the host firmware and often the boot ROM expect. No other vendor implements the same combination, because there was never a reason to. Matching most of those axes is not enough: the part either is that PMIC or it is a redesign.

### What does the suffix on a PMIC part number mean?

Usually a factory-programmed OTP configuration: default rail voltages, sequencing order and delays, which rails come up automatically, switching mode, and sometimes the I²C address. `TPS6591102`, `TPS6591104` and `TPS6591106` are the same silicon with different programming. That makes each suffix a distinct product with its own stock and its own end-of-life date, and it means a supplier offering "the same PMIC, different suffix" is offering a different product. Ask for the configuration table and compare it line by line.

### Why does rail sequencing matter so much?

Because ESD protection structures and parasitic diodes exist between supply domains on the processor die. If the I/O rail rises while the core rail is still at zero, current flows through those structures into the unpowered domain — causing latch-up in the worst case, and cumulative junction degradation in the more common one, which produces field failures months later. Power-down order matters equally and is usually the reverse. A discrete replacement must reproduce the timing with a sequencer or chained enables, not just provide the right voltages.

### What does it cost to replace a PMIC with discrete parts?

Typically five to seven parts plus a board revision: one synchronous buck per switching rail, one LDO per linear rail, a sequencer or cascaded enable network, and a supervisor to aggregate power-good and release reset. If the host talks to the PMIC over I²C for telemetry or dynamic voltage scaling, add a firmware change. The bill of materials rises and the risk falls sharply, because every part in that list is a commodity with multiple sources, which is why for PMICs the redesign decision usually comes earlier than for other part classes.

### Can I just do a last-time buy on an obsolete PMIC?

It defers the problem rather than solving it, and for PMICs the deferral is often not worth it. The redesign will still be required when the stock runs out, the OTP configuration cannot be re-ordered once the family's programming support ends, and the parts themselves are frequently in fine-pitch BGA or WLCSP packages with limited shelf tolerance. A last-time buy makes sense when it covers the product's entire remaining life; otherwise the money is better spent on the discrete redesign, which also removes the part from the risk register permanently.

### Why would an obsolete USB-C PD controller force a redesign even if I can buy it?

Because a PD controller implements a specific revision of the USB Power Delivery specification, and certification is against a revision. If the product must be recertified (after a change, or to claim compatibility with newer chargers) an older controller may not be able to meet the current specification regardless of how many units are in stock. This inverts the usual sourcing logic: availability stops being the binding constraint, and the specification version becomes it. `TPS65983BAZQZR` is obsolete in our catalogue for exactly this generation of parts.

### Are display-bias PMICs tied to the panel?

Yes, closely. A display-bias IC generates AVDD, VGH, VGL and gamma reference voltages whose values are specified by the panel, so the configuration has no meaning for a different panel. In practice the panel and its bias IC reach end of life together, and a replacement panel usually needs different rails, which makes the bias IC a redesign rather than a substitution. This is a frequent trap in industrial HMI equipment, where a panel change that looks mechanical turns out to include the power design.

### How do I verify an incoming PMIC?

Power it up unloaded with a multi-channel scope on every rail and capture the start-up sequence. That single measurement verifies the OTP configuration (default voltages, order and delays) which is the property most likely to be wrong and the one no marking inspection reveals. Then read the device ID and revision registers over I²C, confirm the bus address matches, and check power-good and interrupt behaviour by forcing a fault on one rail. Anything that fails those tests is the wrong configuration, whatever the marking says.

## Related reading

The rest of the power cluster: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide), [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide), [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), [LDO cross-reference](/blog/ldo-cross-reference-guide), and [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide), which is the part you will need if you go discrete.

Because a PMIC's fate follows its host: [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller) and [MCU second-source cross-reference](/blog/mcu-second-source-cross-reference-guide). For the configuration-encoded-in-part-number pattern, [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide). For the decision itself, [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

Send us the PMIC part number and the processor it feeds. We will check the authorised aftermarket first, and if that is empty we will tell you what the discrete equivalent looks like rather than offering you a suffix that is not the same part.

[**Submit an RFQ**](/rfq) | [**Browse power management ICs**](/category/specialized-power-management) | [**Upload a BOM**](/bom)
