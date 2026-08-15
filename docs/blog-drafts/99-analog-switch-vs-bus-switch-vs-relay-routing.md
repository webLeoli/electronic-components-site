---
title: "Routing a Signal: Analog Switch vs Bus Switch vs Relay, and the Four Things a Switch Adds"
slug: "analog-switch-vs-bus-switch-vs-relay-routing"
status: "draft"
seoTitle: "Analog Switch vs Bus Switch vs Relay: Charge Injection, Ron and Leakage"
seoDesc: "Charge injection is ΔV = Q/C, so 20 pC into a 100 pF hold capacitor is 200 mV — over 2,600 LSB at 16 bits. The four errors a switch adds, and why the ±15 V parts are the ones going obsolete."
seoKeywords: "analog switch vs relay, charge injection calculation sample and hold, bus switch vs analog switch, Ron error multiplexer, analog switch 15V obsolete, ISL43 obsolete, TMUX availability, analog mux selection"
tags: "comparison, analogue design, analog switch, multiplexer, bus switch, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Data Converters & Signal Chain"
relatedProducts: "TMUX1308PWR, TS5A3160DBVT, ADG417BRZ-REEL, DG468DV-T1-E3, ISL43141IRZ, MAX4516CUK, SN74CBTD3861DWR, CD4051BE"
---

# Routing a Signal: Analog Switch vs Bus Switch vs Relay, and the Four Things a Switch Adds

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: charge injection arithmetic, Ron as a gain error, leakage and droop, the ±15 V process problem, availability by family

---

**A switch is never just a switch. It adds resistance, it injects charge, it leaks, and it limits the voltage range you may pass, and the one that matters is whichever your circuit cannot absorb.** Selecting on "on-resistance" alone is how a data-acquisition front end ends up with a 200 mV step every time the multiplexer changes channel.

Analog switches are also the worst-affected category we track: `analog-switches-mux` holds 9,895 part numbers at **44% inactive** and `analog-switches-special` 2,081 at **45%**, measured 2026-08-11. The reason is the same process shift that makes substitution dangerous, so the design question and the sourcing question have one answer, which is unusual and worth understanding.

Our [analog switch and multiplexer sourcing guide](/blog/analog-switch-mux-sourcing-guide) covers buying them. This article is about choosing the routing method in the first place.

## Key takeaways

- Charge injection follows `ΔV = Q / C`. Twenty picocoulombs into a 100 pF hold capacitor is 200 mV, which at 16 bits on a 5 V reference is over 2,600 LSB.
- The hold capacitor is often sized by charge injection rather than by droop, and the two requirements pull in opposite directions against settling time.
- On-resistance is a gain error in series with your load. For 12-bit accuracy the load must be roughly 4,000 times `R_ON`, or the output has to be buffered.
- Ron flatness matters separately from Ron: variation with signal level is distortion, not offset.
- The parts that pass ±15 V are the ones going obsolete, because the survivors are on low-voltage processes. A pin-compatible replacement can be destroyed by the rails the original expected.
- A bus switch is a different device for a different job: digital only, very low Ron, near-zero added propagation delay.
- Availability splits by vendor and generation, not by function: `ISL43xx` measures **87% inactive**, `TMUXxxxx` **0%**.
- A relay is the only option that gives true isolation and zero leakage. It is an electromechanical part rather than an IC.

---

## The four things a switch adds

| | CMOS analog switch | Bus switch (FET switch) | Mechanical relay |
| --- | --- | --- | --- |
| Signal type | Analogue or digital, bidirectional | Digital, bidirectional | Anything |
| On-resistance | 1-100 Ω, signal-dependent | Sub-ohm to a few ohms | Milliohms |
| Charge injection | **Yes, pC-scale** | Yes, less critical for logic | None |
| Off leakage | pA to nA | nA | Effectively none |
| Added propagation delay | Small | **Near zero** | Milliseconds to switch |
| Signal range | **Bounded by its supply rails** | Logic levels | Unbounded |
| Isolation | None | None | **Galvanic** |
| Switching time | ns to µs | ns | ms, with bounce |
| Wear-out | None | None | **Contacts, and coil cycling** |
| Control power | µA | µA | mW, continuous while on |
| Availability in our catalogue | 44-45% inactive by category | `SN74CBT` 27% | Not an IC; we do not stock relays |

The four error terms are worth taking one at a time, because each has a different mitigation and they conflict.

## Charge injection: the number that surprises people

When a CMOS switch opens or closes, charge stored in its internal gate capacitances is dumped into the signal path. Analog Devices states the resulting error directly:

```
ΔV = Q_inj (pC) / C (pF)
```

Worked, for a sample-and-hold or a multiplexed ADC input with a 100 pF hold capacitor:

```
General-purpose switch, Q_inj ≈ 20 pC
  ΔV = 20 / 100 = 0.2 V

16-bit conversion on a 5 V reference:
  1 LSB = 5 / 65,536 = 76.3 µV
  0.2 V / 76.3 µV = 2,621 LSB of error
```

Two hundred millivolts, from a component chosen because its on-resistance looked good.

Now the ultra-low-charge-injection parts, which specify around 1 pC over the full signal range:

```
Q_inj = 1 pC, C = 100 pF
  ΔV = 1 / 100 = 0.01 V = 10 mV = 131 LSB
```

Better by a factor of twenty and **still 131 LSB.** That is the point: at 16 bits, even the best switch needs help from the capacitor, so the hold capacitor is sized by charge injection and not only by droop.

The conflict this creates:

- Larger `C` reduces the charge-injection step, because `ΔV = Q/C`.
- Larger `C` lengthens the acquisition time, because the source and `R_ON` have to charge it.
- Smaller `C` droops faster under leakage.

So there is an optimum, and it has to be computed rather than guessed. If the timing budget will not allow a capacitor large enough, the remaining options are a lower-`Q_inj` switch, settling time after the channel change before the conversion starts, or a topology that does not switch into a hold node at all.

## On-resistance is a gain error

`R_ON` sits in series between source and load, forming a divider:

```
Error = R_ON / (R_ON + R_LOAD)

R_ON = 100 Ω into a 10 kΩ load  →  0.99%  ≈ 1%
```

One percent is about six and a half bits. To hold 12-bit accuracy the error must stay under `1/4096` = 0.024%, which requires:

```
R_LOAD > R_ON × (1/0.00024 − 1) ≈ R_ON × 4,100
100 Ω switch  →  R_LOAD > 410 kΩ
```

Few real loads are that high, which is why a multiplexer feeding an ADC is normally followed by a buffer amplifier: the buffer's input impedance makes the divider error negligible and the switch's `R_ON` stops mattering for gain.

Ron flatness is a separate specification and a separate problem. `R_ON` varies with the signal voltage passing through the switch, and that variation turns a constant gain error into a signal-dependent one, which is distortion. For audio, precision measurement or anything where linearity is specified, flatness is the number to compare, and good parts quote channel-to-channel matching of a couple of ohms alongside it.

## Leakage and droop

Off-state leakage flows into whatever the switch is connected to. Two ways it shows up:

```
Into a high-impedance node:
  1 nA into 10 MΩ = 10 mV of offset

Into a hold capacitor, as droop:
  ΔV = I × t / C
  1 nA for 1 ms into 100 pF = 10 mV
```

Good parts specify tens of picoamps at 25 °C, and leakage rises steeply with temperature, often by an order of magnitude for every 20 °C or so, which means the datasheet's 25 °C figure is not the one your enclosure will deliver. For a multiplexer, remember that every *off* channel's leakage arrives at the common node, so the total is the per-channel figure times the channel count.

## The ±15 V problem, which is also the sourcing problem

Older analog switches were built on processes that tolerated ±15 V or ±18 V supplies, because that is what instrumentation rails were. The modern equivalents are built on low-voltage processes: 5 V, ±5 V, or 3.3 V and below.

That creates the most dangerous substitution in this part class. A replacement can share the pinout, the function and the package, and be destroyed the moment power is applied, because the design's rails exceed its absolute maximum. There is no partial failure and no warning, and a parametric search on function and pin count will not flag it.

It is also why the category measures so badly. The high-voltage parts serve instrumentation and legacy industrial designs whose volumes do not justify a new process node, so they are pruned: `analog-switches-special` sits at 45% inactive. The survivors are the low-voltage parts, which cannot take the old rails.

Practical consequence: on any analog-switch substitution, check the supply rails before anything else, and if the design genuinely needs ±15 V, treat the part as a long-lead sourcing item rather than a catalogue commodity. The [analog switch sourcing guide](/blog/analog-switch-mux-sourcing-guide) covers what remains available.

## Bus switches are not analog switches

A bus switch (the `SN74CBT` family and its relatives) is a FET switch optimised for digital buses. It has very low on-resistance, adds almost no propagation delay because there is no active buffer in the path, and is bidirectional without direction control.

What it is for: isolating a bus segment, sharing a memory bus, connecting a debug header without loading the bus, or multiplexing digital signals where a conventional buffer's delay would break timing.

What it does not do: level translation. The switch passes whatever voltage appears, so a bus switch between a 5 V and a 3.3 V domain connects them together rather than translating. Some family members add a series diode drop to clamp a 5 V input down toward 3.3 V levels, which is a specific trick with specific limitations, not general translation. For real translation see [level shifter selection](/blog/level-shifter-selection-guide).

For analogue signals a bus switch is usually wrong: its charge injection and `R_ON` flatness are not specified for the purpose, and its signal range is a logic range.

## When a relay is the right answer

A relay gives what no semiconductor switch gives: galvanic isolation, effectively zero on-resistance, effectively zero off leakage, and a signal range limited only by the contact rating. For high-voltage measurement, for automatic test equipment, for anything where the off state must be a genuine open circuit, it is the correct choice and no analog switch substitutes for it.

The costs are real: milliseconds to switch, contact bounce, a coil that consumes power continuously while energised, physical size, and a wear-out mechanism in the contacts and the mechanism. Reed relays reduce several of these and still have a finite cycle life.

One point here is a sourcing fact rather than an engineering one: **relays are electromechanical parts and we do not stock them.** This is an IC catalogue. If your routing problem needs a relay, that is a distribution purchase. What we can help with is the semiconductor side of the decision and the legacy high-voltage analog switches that a relay is sometimes brought in to replace.

## What the catalogue says

Measured 2026-08-11, by family, with samples checked to confirm each prefix contains what its name suggests.

| Family | Vendor | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `TMUXxxxx` | TI, current | 134 | **0%** |
| `TS5Axxx` | TI | 136 | **10%** |
| `74HC405x` | Various | 85 | 24% |
| `SN74CBTxx` | TI, bus switch | 584 | 27% |
| `CD405x` | Various, 4000-series | 160 | 35% |
| `DG4xx` | Vishay | 808 | 42% |
| `MAX45xx` | Maxim | 1,084 | 47% |
| `ADG4xx` | Analog Devices | 213 | 49% |
| `DG2xx` | Vishay | 305 | 54% |
| `ADG7xx` | Analog Devices | 408 | 56% |
| **`ISL43xx`** | **Intersil** | 223 | **87%** |

The spread runs from 0% to 87% inside one functional category. `TMUX` is TI's current range. It is untouched; `ISL43xx` is Intersil, now inside Renesas. It is nearly gone: the same lineage effect measured in [hot-swap controllers](/blog/hot-swap-vs-efuse-vs-discrete-soft-start), where Linear's range sits at 10% and Intersil's at 85%, and the same concentration reported in the [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08).

Two prefix cautions from this measurement, both caught by printing sample part numbers rather than trusting counts. **`MAX349` matches `MAX3490`, an RS-485 transceiver**, as well as the `MAX349` multiplexer. **`MAX4066` matches `MAX40662`, an amplifier.** Rates quoted on either prefix describe a mixture. This is the same class of error as MachXO2 versus MachXO and Cypress synchronous versus dual-port SRAM.

Per-part status is on the [analog switches and multiplexers](/category/analog-switches-mux) and [signal switches, MUX and decoders](/category/signal-switches-mux-decoders) pages, and an [RFQ](/rfq) will confirm a specific ordering code including aftermarket supply.

## Choosing

| If the binding constraint is | Use | Reason |
| --- | --- | --- |
| 16-bit or better acquisition | **Ultra-low charge-injection analog switch**, plus a sized hold capacitor | `ΔV = Q/C` dominates the error budget |
| Multiplexing into an ADC | **Analog mux plus a buffer amplifier** | Buffer removes the `R_ON` gain error |
| Audio or precision linearity | **Analog switch selected on Ron flatness** | Flatness is distortion, not offset |
| Digital bus isolation with tight timing | **Bus switch** (`SN74CBT`) | Near-zero added propagation delay |
| Crossing voltage domains | **Level shifter, not a bus switch** | A bus switch connects rather than translates |
| ±15 V signal range | **High-voltage analog switch**, treated as a sourcing item | Modern low-voltage parts are destroyed by those rails |
| True open circuit, or galvanic isolation | **Relay** | No semiconductor switch provides it; not stocked here |
| Very high voltage or current | **Relay** | Contact rating, not a process limit |
| Fifteen-year availability, either would work | **Current-generation family** | `TMUX` 0% against `ISL43xx` 87% |

## Frequently asked questions

### What is charge injection and why does it matter so much?

It is the charge dumped into the signal path when a CMOS switch changes state, and it produces a voltage step of `ΔV = Q/C` on whatever capacitance the path sees. Twenty picocoulombs into a 100 pF hold capacitor is 200 mV, which is more than 2,600 LSB at 16 bits on a 5 V reference. Even a 1 pC ultra-low part gives 10 mV, or 131 LSB, so the hold capacitor has to be sized for it.

### How do I size the hold capacitor?

Against three constraints at once. Larger capacitance reduces the charge-injection step and slows droop from leakage, and it lengthens acquisition time because the source resistance plus `R_ON` must charge it. Compute the charge-injection step for your candidate switch, the droop over your hold time, and the settling time through `R_ON`, then find the value that satisfies all three. If none does, change the switch or the timing rather than compromising quietly.

### Does on-resistance matter if I buffer the output?

Much less, which is exactly why buffering is standard practice. Unbuffered, `R_ON` forms a divider with the load: 100 Ω into 10 kΩ is a 1% gain error, and 12-bit accuracy needs a load above about 410 kΩ. A buffer amplifier's input impedance makes the divider error negligible. What buffering does not fix is `R_ON` flatness, which varies with signal level and appears as distortion.

### Why are so many analog switches obsolete?

Because the parts that tolerate ±15 V rails are built on older high-voltage processes serving instrumentation and legacy industrial designs, and those volumes no longer justify the process. Our measurement is 44% inactive across 9,895 part numbers in the main category and 45% across the special-purpose one. The survivors are low-voltage parts, which is what makes the substitution dangerous.

### Can I replace a ±15 V analog switch with a modern equivalent?

Only if the modern part is also rated for those rails, and most are not. This is the most dangerous substitution in the part class: the replacement can match pinout, function and package and be destroyed on power-up because your supplies exceed its absolute maximum. Check the supply rating before any other parameter, and if the design needs ±15 V, plan the part as a sourcing item with lead time rather than a commodity.

### What is the difference between a bus switch and an analog switch?

A bus switch is optimised for digital buses: very low on-resistance, near-zero added propagation delay, bidirectional with no direction control. An analog switch is characterised for analogue signals, with specifications for charge injection, `R_ON` flatness and leakage that a bus switch does not publish for that purpose. Use a bus switch to isolate a bus segment; use an analog switch to route a measurement.

### Will a bus switch translate between 5 V and 3.3 V?

No. It connects the two sides, so whatever voltage is present passes through. Some family members include a series diode drop that clamps a 5 V input toward 3.3 V levels, which solves one specific direction under specific conditions and is not general translation. If you need real bidirectional translation with defined thresholds, use a level shifter.

### Do you stock relays?

No. This is an IC catalogue, and relays are electromechanical parts, so a routing problem that genuinely needs galvanic isolation and a true open circuit is a distribution purchase. Where we can help is the semiconductor side of the decision, and the legacy high-voltage analog switches that are often the part a relay was brought in to replace — including obsolete ones where aftermarket supply exists.

## Sources

Availability figures are our own measurement across 719,342 catalogue part numbers,
dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`. Charge
injection, `R_ON`, flatness and leakage are device-specific and leakage rises steeply
with temperature: **take all four from the datasheet at your operating temperature,
not at 25 °C.**

- Analog Devices, *Ask The Applications Engineer—26: Switches and Multiplexers* — the
  error mechanisms and the `ΔV = Q/C` relationship for charge injection.
  [analog.com](https://www.analog.com/en/resources/analog-dialogue/articles/ask-the-applications-engineer-26.html)
- Analog Devices `ADG612` and `ADG636` datasheets — ultra-low charge injection at
  1 pC over the full signal range with 100 pA leakage, used as the low-`Q_inj`
  anchor above. [analog.com](https://www.analog.com/en/products/adg612.html)
- Analog Devices, *AN-874: Operating the ADG12xx Series with ±5 V Supplies and the
  Impact on Performance* — how supply choice changes switch behaviour.
  [analog.com](https://www.analog.com/en/resources/app-notes/an-874.html)
- Datasheets for the specific bus-switch family under consideration, for the
  clamping behaviour of any diode-drop variant.
