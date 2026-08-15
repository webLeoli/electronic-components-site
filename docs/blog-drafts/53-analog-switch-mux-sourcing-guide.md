---
title: "Analog Switch and Multiplexer Selection: Signal Range Kills More Boards Than On-Resistance"
slug: "analog-switch-mux-sourcing-guide"
status: "draft"
seoTitle: "Analog Switch and Multiplexer Sourcing: Ron, Charge Injection, Latch-Up"
seoDesc: "The most discontinued category in the signal chain. Signal and supply range, on-resistance flatness, charge injection, leakage, latch-up immunity, break-before-make and fault protection."
seoKeywords: "analog switch sourcing, multiplexer replacement, CD4051 replacement, ADG5412, DG408, MAX368 fault protected mux, charge injection, Ron flatness, latch-up immune switch, break before make"
tags: "analog switch, multiplexer, Ron, charge injection, latch-up, fault protection, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Data Converters & Signal Chain"
relatedProducts: "CD4051BM96, MAX4051EEE+, DG408DQ-T1-E3, ADG508FBNZ, ADG5412BRUZ-REEL7, ADG5419BRMZ-RL7, MAX368CPN+, TS5A3160DBVT"
---

# Analog Switch and Multiplexer Selection: Signal Range Kills More Boards Than On-Resistance

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: signal range, on-resistance, charge injection, leakage, latch-up, fault protection, switching order

---

**Analog switches are the most discontinued category in the signal chain — 44% of the 9,895 parts in our [analog switches and multiplexers category](/category/analog-switches-mux) are no longer active, and the reason is also the reason substitutions fail: the survivors are built on low-voltage processes.** A CD4051 running on ±7.5 V rails in a 1990s instrument has no modern equivalent in a 5.5 V-maximum part, no matter how well the pinout matches. Fit one and the first signal excursion beyond the rails either clamps, injects current into the substrate, or triggers a latch-up that only ends when the power is cycled. This is a survivable problem, but only if it is checked before the order, not after the smoke.


<img src="/uploads/blog/analog-switch-mux-sourcing-guide.webp" alt="Analog switch multiplexer IC surrounded by parallel signal routing traces" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Signal and supply range is the first check, not on-resistance.** Legacy parts ran on ±15 V; most modern parts do not.
- **44-45% of this category is inactive** (the worst of any signal-chain category we hold) because switches are the least differentiated function in the chain.
- **Charge injection sets the error in sample-and-hold and integrator circuits**: 10 pC into a 1 nF hold capacitor is 10 mV, or 131 LSB on a 16-bit 5 V system.
- **On-resistance flatness, not absolute on-resistance, determines distortion** in audio and precision paths.
- **Latch-up immunity is an architectural property.** Trench-isolated parts such as `ADG5412BRUZ-REEL7` are immune by construction; older junction-isolated CMOS is not.
- **Break-before-make versus make-before-break is a functional specification.** Getting it backwards shorts two sources together.
- **Fault-protected multiplexers are a distinct product class** (`ADG508FBNZ`, `MAX368CPN+`) and a plain mux is not a substitute.

---

## Signal range: the specification that ends the search

Check three limits, in this order: supply rails, signal range relative to those rails, and absolute maximum ratings.

| Generation | Typical supply | Typical signal range | Example |
| --- | --- | --- | --- |
| 1970s-80s CMOS (4000 series) | Up to ±10 V or 20 V single | Rail to rail | `CD4051BM96`, `CD4052BNS` |
| 1990s precision (DG, ADG, MAX) | ±15 V dual | Rail to rail | `DG408DQ-T1-E3`, `ADG508FBNZ` |
| 2000s low-voltage CMOS | 1.8-5.5 V | Rail to rail | `TS5A3160DBVT`, `TMUX1308PWR` |
| Modern high-voltage trench | ±22 V or so | Rail to rail, latch-up immune | `ADG5412BRUZ-REEL7`, `ADG5419BRMZ-RL7` |

The trap runs in one direction only. Replacing a low-voltage switch with a high-voltage one usually works. Replacing a ±15 V part with a 5.5 V part destroys it, and the parts most likely to appear in a modern parametric search are the low-voltage ones, because that is where new development happened.

Concretely: an instrument multiplexing ±10 V analog inputs through a `DG408` needs a modern part specified for at least ±12 V of signal. `TS5A3160DBVT` is an excellent switch and completely wrong for that socket.

Absolute maximum ratings usually read "V+ + 0.3 V" and "V− − 0.3 V". Those 300 mV are not headroom for a fault; they are the diode drop before current flows into the substrate. A sensor cable that can be shorted to a 24 V field supply exceeds this by two orders of magnitude.

## On-resistance, and why flatness matters more

On-resistance produces a gain error through the load, and its variation with signal level produces distortion.

The gain error is a divider:

```
error = R_ON / (R_ON + R_LOAD)
```

With a 100 Ω switch into a 10 kΩ load:

```
100 / 10,100 = 0.99%
```

Approximately 1% of gain error, which on a 16-bit converter is about 649 LSB — vastly larger than any converter specification in the system. Into a 1 MΩ buffer input, the same switch contributes 0.01%. **The switch's on-resistance only matters in proportion to what follows it**, which is why the specification cannot be judged in isolation.

**Flatness** — the variation of on-resistance across the signal range, sometimes listed as R_FLAT(ON) — is the distortion term. As the signal swings, the FET's gate-to-source voltage changes, on-resistance changes with it, and the divider ratio moves with the signal. That is non-linearity:

- In an **audio** path it appears as THD, which is why audio switches quote flatness prominently.
- In a **precision DC** path it appears as INL that no calibration constant can remove, because it depends on the signal.
- In a **multiplexed** system it appears as channel-dependent gain error if the channels see different source impedances.

A replacement with lower absolute on-resistance but worse flatness can degrade a precision measurement. Compare both numbers.

There is a physical trade-off behind this: lower on-resistance means larger FETs, and larger FETs mean more gate charge, which is the next specification.

## Charge injection: the sample-and-hold killer

Every time the switch changes state, charge from the gate drive couples into the signal path. In a sample-and-hold, that charge lands on the hold capacitor and becomes a voltage step:

```
ΔV = Q_INJ / C_HOLD
```

With 10 pC of injected charge into a 1 nF hold capacitor:

```
ΔV = 10 pC / 1 nF = 10 mV
```

On a 16-bit, 5 V system where 1 LSB is 76.3 µV, **that is 131 LSB of pedestal error**. It is repeatable, so it can be calibrated out — until the switch is substituted for one with different injection, at which point every calibration constant in the product is wrong.

Where it matters:

| Circuit | Consequence of charge injection |
| --- | --- |
| Sample-and-hold | Pedestal offset, calibrated per design |
| Integrator reset | Residual charge, integration offset |
| Auto-zero amplifier | Offset error each cycle |
| Multiplexed ADC front end | Settling transient at each channel change |
| Capacitive DAC | Code-dependent error |

Charge injection and on-resistance pull in opposite directions. A part with half the on-resistance typically has roughly double the injected charge. Precision switch families offer both variants deliberately: the choice depends on whether your circuit is impedance-limited or charge-limited.

## Leakage and off-isolation

Off-state leakage matters when the source impedance is high, which in a multiplexed sensor front end it usually is:

```
1 nA into 100 kΩ = 100 µV of offset
```

That is 1.3 LSB at 16 bits on a 5 V range — tolerable. At 125 °C, leakage on the same part may be 100 times higher, which makes it 10 mV, or 131 LSB. **Leakage is specified at 25 °C and at maximum temperature, and only the second number describes a hot enclosure.**

Two more high-frequency specifications:

- **Off-isolation** (dB) — how much signal gets through a channel that is switched off. Falls with frequency.
- **Crosstalk** between channels of the same package, also frequency-dependent.

For DC measurement both are irrelevant. For video or RF multiplexing they are the specification, which is why the [special-purpose analog switch category](/category/analog-switches-special) (2,081 parts, 45% inactive) exists separately: video crosspoints, USB and display switches, where bandwidth and return loss dominate.

## Latch-up, fault protection and what "protected" means

Junction-isolated CMOS switches contain a parasitic SCR. If an input is driven beyond the supply rails, current flows into the substrate and can trigger it. Once triggered, the device conducts between supplies until the power is removed, and often does not survive.

Three distinct answers exist, and they are different products:

| Class | Mechanism | Behaviour on overvoltage | Example |
| --- | --- | --- | --- |
| Plain CMOS switch | Junction isolation | Latch-up risk; damage | `CD4051BM96`, `MAX4051EEE+` |
| **Trench-isolated** | Dielectric isolation removes the SCR | **Cannot latch up**; still damaged past absolute max | `ADG5412BRUZ-REEL7`, `ADG5419BRMZ-RL7` |
| **Fault-protected** | Series protection FETs clamp and open | Channel opens, signal clamps near the rail; survives | `ADG508FBNZ`, `MAX368CPN+`, `MAX368EPN+` |

These are not grades of the same thing. Trench isolation prevents a specific failure mechanism; fault protection tolerates a specific abuse. A design multiplexing field wiring (thermocouples in a plant, sensors on a vehicle harness) was probably specified with a fault-protected part precisely because the wiring can be shorted to a supply. Replacing it with a plain mux removes a protection function that will not be missed until a field fault occurs.

It matters commercially too: `MAX368CPN+` and `MAX368EPN+` are both last-time buy in our catalogue, and `ADG508FBN` is obsolete while `ADG508FBNZ` (the lead-free version) is active. **When a protected part goes last-time buy, the options are a quantity decision or an external protection network** — series resistors plus clamp diodes to the rails, which adds leakage and on-resistance of its own. Both paths belong in the analysis described in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

## Switching order and timing

Break-before-make and make-before-break are functional opposites, and both are correct in the right place.

- **Break-before-make** disconnects the old channel before connecting the new one. Correct for multiplexing independent voltage sources — connecting two sources together, even briefly, means one drives the other.
- **Make-before-break** connects the new channel before releasing the old. Correct where the load must never be open: a current loop, or a capacitive node that must not float.

Substituting one for the other in a multiplexer that switches voltage sources creates a momentary short between channels. If those channels come from separate sensors or amplifiers, the transient shows up as crosstalk at every channel change; if they come from different supplies, it can be destructive.

Also check:

- **Transition time and settling** after a channel change, against the ADC's acquisition window: the arithmetic is in [ADC sourcing](/blog/adc-sourcing-guide).
- **Digital control levels.** A 3.3 V processor driving the select lines of a ±15 V switch needs the switch's logic inputs to be specified for that — many older parts expect CMOS levels referenced to their own supply. This is the level-shifting problem described in [level shifter selection](/blog/level-shifter-selection-guide).
- **Power-off state.** Whether channels are open with the supply removed, and whether signal present on an unpowered switch can forward-bias its way into the rest of the board.
- **Enable pin polarity and default**, which differs even across pin-compatible parts.

## Legacy families and what happened to them

The 4051/4052/4053 series is still alive and is the exception, not the rule.

| Legacy part | Status in catalogue | Note |
| --- | --- | --- |
| `CD4051BE` | obsolete | The through-hole original |
| `CD4051BM96` | active | Same function, SOIC |
| `CD4052BCSJX` | obsolete | — |
| `M74HC4052RM13TR` | obsolete | ST's HC version |
| `HEF4053BTT-Q100J` | active | Nexperia, automotive-qualified |
| `MAX4051CPE+` | obsolete | `MAX4051EEE+` active |
| `DG408MY/PR` | obsolete | `DG408DQ-T1-E3` (Vishay) active |
| `ADG713BRU`, `ADG751ARM` | obsolete | Rochester supply |
| `ADG1517BCPZ-REEL7` | obsolete | Recent part, already inactive |
| `ISL43141IRZ`, `ISL84467IVZ-T` | last-time buy | Intersil lineage |
| `QS4A210QG` | active | Supplied by Flip Electronics |

Two observations worth acting on.

First, package migration is the most common resolution. In several families the DIP or ceramic version is obsolete while a surface-mount sibling is active. If the board can take a small adapter or a rework, this is the cheapest path, and it keeps the original die, which means the electrical characterisation still holds.

Second, watch the continuity manufacturers. Rochester Electronics accounts for 2,152 parts in this category, and Flip Electronics appears as the source on others such as `QS4A210QG`. Both are authorised continuity channels rather than brokers, which is a materially different risk profile — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Supply rails and signal range | Clamping, substrate current, destruction |
| 2 | Absolute maximum input relative to rails | Latch-up or damage on a field fault |
| 3 | Latch-up immunity (trench isolation) required? | Board hangs until power-cycled |
| 4 | Fault protection required? | Protection function silently removed |
| 5 | On-resistance against the load impedance | Gain error |
| 6 | On-resistance flatness | Distortion and signal-dependent INL |
| 7 | Charge injection against the hold capacitor | Pedestal error, calibration invalid |
| 8 | Leakage at maximum temperature, not 25 °C | Offset in a hot enclosure |
| 9 | Off-isolation and crosstalk at signal frequency | Channel bleed-through |
| 10 | Break-before-make vs make-before-break | Momentary short between sources |
| 11 | Transition and settling time vs ADC acquisition | Contaminated first sample |
| 12 | Digital input levels vs the controlling logic | Channel select unreliable |
| 13 | Enable polarity and power-off channel state | Wrong channel at power-up |

## FAQ

### Why can't I replace a CD4051 with a modern low-voltage multiplexer?

Because the original probably runs on rails the modern part cannot survive. The 4000-series CMOS switches operate up to roughly ±10 V dual or 20 V single supply and pass signals rail to rail, while most 2000s-era switches are specified for 1.8 to 5.5 V with absolute maximum ratings only 300 mV beyond their rails. A ±10 V signal into a 5.5 V part forward-biases the input protection, injects current into the substrate and can trigger latch-up. If you need a modern part on legacy rails, look at high-voltage trench-isolated families rather than general-purpose low-voltage switches.

### What is the difference between latch-up immune and fault protected?

They address different problems. Latch-up immunity is achieved architecturally — trench or dielectric isolation removes the parasitic SCR, so the device cannot enter a self-sustaining conduction state, although it can still be damaged beyond its absolute maximum ratings. Fault protection adds series protection devices that open the channel and clamp the signal when an input exceeds the rails, so the part survives a sustained overvoltage such as a sensor line shorted to a field supply. A design multiplexing external wiring usually needs the second, not just the first.

### How much does multiplexer on-resistance affect accuracy?

In proportion to the load. On-resistance forms a divider with whatever follows, so a 100 Ω switch into a 10 kΩ load costs about 0.99% of gain (roughly 649 LSB on a 16-bit converter) while the same switch into a 1 MΩ buffer costs 0.01%. Absolute on-resistance is therefore only meaningful alongside the input impedance of the next stage. The variation of on-resistance with signal level, sometimes called flatness, is usually more important because it produces distortion that calibration cannot remove.

### What is charge injection and when does it matter?

It is the charge coupled from the switch's gate drive into the signal path each time the switch changes state, specified in picocoulombs. It matters wherever the signal node is capacitive and high-impedance: dividing the injected charge by the hold capacitance gives a voltage step, so 10 pC into 1 nF produces 10 mV — about 131 LSB on a 16-bit 5 V system. Sample-and-hold circuits, integrator resets and auto-zero amplifiers are all affected. Note that lower on-resistance parts generally inject more charge, so the two specifications trade against each other.

### Does break-before-make versus make-before-break really matter?

Yes. It is a functional specification rather than a preference. Multiplexing independent voltage sources requires break-before-make, because overlapping connections briefly tie two sources together and one drives the other — visible as crosstalk at every channel change and potentially destructive if the sources come from different supplies. Circuits where the load must never open, such as a current loop or a node that must not float, require make-before-break. Confirm which the original part implemented before substituting.

### Why is this category so heavily discontinued?

Because it is the least differentiated function in the signal chain. A switch has few parameters to compete on, margins are thin, and vendors consolidate ranges aggressively, so 44% of the 9,895 parts in our main switch category and 45% of the 2,081 special-purpose parts are no longer active. The parts that survive are on newer, lower-voltage processes, which is why the replacement search so often produces candidates that are electrically wrong for a legacy analog board.

### Can I use a digital logic switch such as a 74HC4066 in an analog path?

Within its limits, yes: the 4066 and its variants are genuine analog switches and are widely used that way. The limits are what matter: relatively high and signal-dependent on-resistance, modest charge injection specifications, limited supply range on the HC and LV versions, and specifications written for logic-level signals rather than precision analog. For a multiplexed 16-bit measurement they will usually not hold the error budget. For switching a logic-level signal or a non-critical analog line they are fine and inexpensive.

### What should I check on incoming inspection for analog switches?

Measure on-resistance at several points across the signal range, since a single mid-scale measurement hides flatness problems and remarked parts frequently differ there. Check off-state leakage on all channels, verify channel-select decoding against the truth table, and confirm the switching order by observing two channels during a transition. For fault-protected parts, confirm the clamp behaviour with an input driven past the rail through a current-limiting resistor. Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Related reading

Cluster pillar: [data converter sourcing](/blog/data-converter-sourcing-guide). The stages either side of the switch: [ADC sourcing](/blog/adc-sourcing-guide) for acquisition timing, [op-amp equivalents](/blog/op-amp-equivalent-selection) for the buffer that usually follows a mux, and [voltage reference selection](/blog/voltage-reference-selection-guide) for the accuracy budget the whole front end serves.

Control-side and channel questions: [level shifter selection](/blog/level-shifter-selection-guide) for driving select lines across supply domains, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) for continuity supply, and [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis) — this category is where a scrub earns its keep, given the 44% inactive rate.

Send us the part number with your supply rails, signal range and load impedance, and we will filter out the parts that cannot survive your board.

[**Submit an RFQ**](/rfq) | [**Browse analog switches**](/category/analog-switches-mux) | [**Upload a BOM**](/bom)
